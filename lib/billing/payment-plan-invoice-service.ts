// Phase 8.7.4: Payment Plan Invoice Automation Service
// Comprehensive service for generating payment plan installment invoices with automated scheduling

import { createClient } from '@/lib/supabase/client'
import type {
  Invoice,
  InvoiceLineItem,
  PaymentPlanInvoice,
  PaymentPlanInvoiceGenerationRequest,
  InvoiceGenerationResult,
  BatchInvoiceGenerationResult
} from './invoice-types'

export class PaymentPlanInvoiceService {
  private supabase = createClient()

  /**
   * Generate a single payment plan installment invoice
   */
  async generatePaymentPlanInvoice(
    request: PaymentPlanInvoiceGenerationRequest
  ): Promise<InvoiceGenerationResult> {
    try {
      const { law_firm_id, payment_plan_id } = request

      // Get payment plan details
      const paymentPlan = await this.getPaymentPlanDetails(payment_plan_id)
      if (!paymentPlan) {
        return { success: false, error: 'Plano de pagamento não encontrado' }
      }

      // Determine which installment to generate
      const installmentNumber = request.installment_number || 
        await this.getNextInstallmentNumber(payment_plan_id)

      if (installmentNumber > paymentPlan.installments) {
        return { success: false, error: 'Número de parcela excede o total do plano' }
      }

      // Check if this installment already exists
      const existingInvoice = await this.findExistingInstallmentInvoice(
        payment_plan_id,
        installmentNumber
      )

      if (existingInvoice) {
        return { success: false, error: 'Fatura para esta parcela já existe' }
      }

      // Calculate installment details
      const installmentData = await this.calculateInstallmentData(
        paymentPlan,
        installmentNumber,
        request.scheduled_date
      )

      // Create the invoice
      const invoice = await this.createPaymentPlanInvoice(
        paymentPlan,
        installmentData
      )

      // Auto-send if requested
      if (request.auto_send) {
        await this.sendInvoice(invoice.id)
      }

      // Schedule next installment if configured
      if (installmentData.auto_generate_next && !installmentData.is_final_installment) {
        await this.scheduleNextInstallment(payment_plan_id, installmentNumber + 1)
      }

      return { success: true, invoice }
    } catch (error) {
      console.error('Error generating payment plan invoice:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno do servidor'
      }
    }
  }

  /**
   * Generate all remaining installments for a payment plan
   */
  async generateAllRemainingInstallments(
    law_firm_id: string,
    payment_plan_id: string,
    options: {
      auto_send?: boolean
      start_from_installment?: number
    } = {}
  ): Promise<BatchInvoiceGenerationResult> {
    const batch_id = crypto.randomUUID()
    
    try {
      const paymentPlan = await this.getPaymentPlanDetails(payment_plan_id)
      if (!paymentPlan) {
        return {
          success: false,
          total_requested: 0,
          successful_generations: 0,
          failed_generations: 1,
          invoices: [],
          errors: [{ client_id: 'system', error: 'Plano de pagamento não encontrado' }],
          batch_id
        }
      }

      const startInstallment = options.start_from_installment || 
        await this.getNextInstallmentNumber(payment_plan_id)
      
      const results: Invoice[] = []
      const errors: Array<{ client_id: string; error: string }> = []
      const totalToGenerate = paymentPlan.installments - startInstallment + 1

      // Generate each remaining installment
      for (let i = startInstallment; i <= paymentPlan.installments; i++) {
        try {
          const result = await this.generatePaymentPlanInvoice({
            law_firm_id,
            payment_plan_id,
            installment_number: i,
            auto_send: options.auto_send
          })

          if (result.success && result.invoice) {
            results.push(result.invoice)
          } else {
            errors.push({
              client_id: paymentPlan.client_id,
              error: `Parcela ${i}: ${result.error || 'Erro desconhecido'}`
            })
          }
        } catch (error) {
          errors.push({
            client_id: paymentPlan.client_id,
            error: `Parcela ${i}: ${error instanceof Error ? error.message : 'Erro interno'}`
          })
        }
      }

      // Log batch generation
      await this.logBatchGeneration(
        law_firm_id,
        batch_id,
        'payment_plan',
        totalToGenerate,
        results.length,
        errors.length
      )

      return {
        success: true,
        total_requested: totalToGenerate,
        successful_generations: results.length,
        failed_generations: errors.length,
        invoices: results,
        errors,
        batch_id
      }
    } catch (error) {
      console.error('Error in batch generation:', error)
      return {
        success: false,
        total_requested: 0,
        successful_generations: 0,
        failed_generations: 1,
        invoices: [],
        errors: [{ client_id: 'system', error: 'Erro no processamento em lote' }],
        batch_id
      }
    }
  }

  /**
   * Generate overdue installment invoices with late fees
   */
  async generateOverdueInstallments(
    law_firm_id: string,
    grace_period_days: number = 5
  ): Promise<BatchInvoiceGenerationResult> {
    const batch_id = crypto.randomUUID()
    
    try {
      // Find overdue payment plans
      const overduePaymentPlans = await this.getOverduePaymentPlans(
        law_firm_id,
        grace_period_days
      )

      const results: Invoice[] = []
      const errors: Array<{ client_id: string; error: string }> = []

      for (const plan of overduePaymentPlans) {
        try {
          const result = await this.generatePaymentPlanInvoice({
            law_firm_id,
            payment_plan_id: plan.id,
            auto_send: true
          })

          if (result.success && result.invoice) {
            results.push(result.invoice)
          } else {
            errors.push({
              client_id: plan.client_id,
              error: result.error || 'Erro desconhecido'
            })
          }
        } catch (error) {
          errors.push({
            client_id: plan.client_id,
            error: error instanceof Error ? error.message : 'Erro interno'
          })
        }
      }

      return {
        success: true,
        total_requested: overduePaymentPlans.length,
        successful_generations: results.length,
        failed_generations: errors.length,
        invoices: results,
        errors,
        batch_id
      }
    } catch (error) {
      console.error('Error generating overdue installments:', error)
      return {
        success: false,
        total_requested: 0,
        successful_generations: 0,
        failed_generations: 1,
        invoices: [],
        errors: [{ client_id: 'system', error: 'Erro no processamento de parcelas em atraso' }],
        batch_id
      }
    }
  }

  /**
   * Get payment plan details with related data
   */
  private async getPaymentPlanDetails(payment_plan_id: string) {
    const { data, error } = await this.supabase
      .from('payment_plans')
      .select(`
        *,
        client:clients(id, name, email, cpf, cnpj),
        matter:matters(id, title)
      `)
      .eq('id', payment_plan_id)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Get the next installment number to generate
   */
  private async getNextInstallmentNumber(payment_plan_id: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('payment_plan_invoices')
      .select('installment_number')
      .eq('payment_plan_id', payment_plan_id)
      .order('installment_number', { ascending: false })
      .limit(1)

    if (error) throw error
    
    if (!data || data.length === 0) {
      return 1 // First installment
    }
    
    return data[0].installment_number + 1
  }

  /**
   * Find existing installment invoice
   */
  private async findExistingInstallmentInvoice(
    payment_plan_id: string,
    installment_number: number
  ): Promise<Invoice | null> {
    const { data, error } = await this.supabase
      .from('payment_plan_invoices')
      .select(`
        invoice:invoices(*)
      `)
      .eq('payment_plan_id', payment_plan_id)
      .eq('installment_number', installment_number)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data?.invoice || null
  }

  /**
   * Calculate installment data and scheduling
   */
  private async calculateInstallmentData(
    paymentPlan: any,
    installmentNumber: number,
    scheduledDate?: string
  ) {
    const installmentAmount = paymentPlan.installment_amount
    const isFirstInstallment = installmentNumber === 1
    const isFinalInstallment = installmentNumber === paymentPlan.installments

    // Calculate scheduled date if not provided
    let calculatedScheduledDate = scheduledDate
    if (!calculatedScheduledDate) {
      calculatedScheduledDate = this.calculateInstallmentDate(
        paymentPlan,
        installmentNumber
      )
    }

    // Calculate late fees if applicable
    const lateFeeData = await this.calculateLateFees(
      paymentPlan,
      calculatedScheduledDate,
      installmentNumber
    )

    return {
      installment_number: installmentNumber,
      total_installments: paymentPlan.installments,
      installment_amount: installmentAmount,
      scheduled_date: calculatedScheduledDate,
      is_final_installment: isFinalInstallment,
      auto_generate_next: !isFinalInstallment && paymentPlan.auto_generate_invoices,
      grace_period_days: paymentPlan.grace_period_days || 5,
      late_fee_rate: paymentPlan.late_fee_rate || 0,
      late_fee_amount: lateFeeData.late_fee_amount,
      is_overdue: lateFeeData.is_overdue
    }
  }

  /**
   * Calculate installment due date based on frequency
   */
  private calculateInstallmentDate(
    paymentPlan: any,
    installmentNumber: number
  ): string {
    const startDate = new Date(paymentPlan.first_payment_date || paymentPlan.created_at)
    const installmentDate = new Date(startDate)

    // Calculate based on frequency
    switch (paymentPlan.frequency) {
      case 'weekly':
        installmentDate.setDate(startDate.getDate() + (installmentNumber - 1) * 7)
        break
      case 'biweekly':
        installmentDate.setDate(startDate.getDate() + (installmentNumber - 1) * 14)
        break
      case 'monthly':
        installmentDate.setMonth(startDate.getMonth() + (installmentNumber - 1))
        break
      case 'quarterly':
        installmentDate.setMonth(startDate.getMonth() + (installmentNumber - 1) * 3)
        break
      default:
        // Custom frequency - assume monthly
        installmentDate.setMonth(startDate.getMonth() + (installmentNumber - 1))
    }

    return installmentDate.toISOString().split('T')[0]
  }

  /**
   * Calculate late fees for overdue installments
   */
  private async calculateLateFees(
    paymentPlan: any,
    scheduledDate: string,
    installmentNumber: number
  ) {
    const today = new Date()
    const dueDate = new Date(scheduledDate)
    const gracePeriodDays = paymentPlan.grace_period_days || 5
    const lateFeeRate = paymentPlan.late_fee_rate || 0

    // Add grace period to due date
    const gracePeriodEnd = new Date(dueDate)
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + gracePeriodDays)

    const isOverdue = today > gracePeriodEnd
    let lateFeeAmount = 0

    if (isOverdue && lateFeeRate > 0) {
      // Check if this installment has already been paid
      const { data: existingPayments } = await this.supabase
        .from('payment_plan_invoices')
        .select(`
          invoice:invoices!inner(
            invoice_status,
            invoice_payments(payment_amount)
          )
        `)
        .eq('payment_plan_id', paymentPlan.id)
        .eq('installment_number', installmentNumber)

      const isPaid = existingPayments?.some((inv: any) => 
        inv.invoice.invoice_status === 'paid' ||
        inv.invoice.invoice_payments?.reduce((sum: number, p: any) => sum + p.payment_amount, 0) >= paymentPlan.installment_amount
      )

      if (!isPaid) {
        // Calculate days overdue (beyond grace period)
        const daysOverdue = Math.ceil((today.getTime() - gracePeriodEnd.getTime()) / (1000 * 60 * 60 * 24))
        
        // Calculate late fee (percentage of installment amount)
        lateFeeAmount = (paymentPlan.installment_amount * lateFeeRate / 100) * Math.ceil(daysOverdue / 30)
        lateFeeAmount = Math.min(lateFeeAmount, paymentPlan.installment_amount * 0.5) // Cap at 50% of installment
      }
    }

    return {
      is_overdue: isOverdue,
      late_fee_amount: lateFeeAmount
    }
  }

  /**
   * Create payment plan invoice with all details
   */
  private async createPaymentPlanInvoice(
    paymentPlan: any,
    installmentData: any
  ): Promise<Invoice> {
    const totalAmount = installmentData.installment_amount + installmentData.late_fee_amount

    // Create main invoice record
    const { data: invoice, error: invoiceError } = await this.supabase
      .from('invoices')
      .insert({
        law_firm_id: paymentPlan.law_firm_id,
        client_id: paymentPlan.client_id,
        payment_plan_id: paymentPlan.id,
        matter_id: paymentPlan.matter_id,
        invoice_type: 'payment_plan',
        invoice_status: installmentData.is_overdue ? 'overdue' : 'draft',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: installmentData.scheduled_date,
        payment_terms: '7_days', // Payment plans typically have shorter terms
        payment_methods: ['pix', 'bank_transfer', 'credit_card'],
        description: `Parcela ${installmentData.installment_number}/${installmentData.total_installments} - ${paymentPlan.matter?.title || 'Plano de Pagamento'}`,
        subtotal: totalAmount,
        total_amount: totalAmount,
        currency: 'BRL'
      })
      .select()
      .single()

    if (invoiceError) throw invoiceError

    // Create payment plan invoice details
    const { error: paymentPlanInvoiceError } = await this.supabase
      .from('payment_plan_invoices')
      .insert({
        law_firm_id: paymentPlan.law_firm_id,
        invoice_id: invoice.id,
        payment_plan_id: paymentPlan.id,
        installment_number: installmentData.installment_number,
        total_installments: installmentData.total_installments,
        installment_amount: installmentData.installment_amount,
        scheduled_date: installmentData.scheduled_date,
        grace_period_days: installmentData.grace_period_days,
        late_fee_rate: installmentData.late_fee_rate,
        late_fee_amount: installmentData.late_fee_amount,
        is_final_installment: installmentData.is_final_installment,
        auto_generate_next: installmentData.auto_generate_next
      })

    if (paymentPlanInvoiceError) throw paymentPlanInvoiceError

    // Create line items
    const lineItems = await this.createPaymentPlanLineItems(
      invoice.id,
      paymentPlan.law_firm_id,
      installmentData
    )

    // Update payment plan status if final installment
    if (installmentData.is_final_installment) {
      await this.supabase
        .from('payment_plans')
        .update({ status: 'completed' })
        .eq('id', paymentPlan.id)
    }

    return {
      ...invoice,
      line_items: lineItems
    }
  }

  /**
   * Create line items for payment plan invoice
   */
  private async createPaymentPlanLineItems(
    invoice_id: string,
    law_firm_id: string,
    installmentData: any
  ): Promise<InvoiceLineItem[]> {
    const lineItems: Partial<InvoiceLineItem>[] = []
    let sortOrder = 1

    // Main installment payment
    lineItems.push({
      invoice_id,
      law_firm_id,
      line_type: 'case_fee',
      description: `Parcela ${installmentData.installment_number}/${installmentData.total_installments}`,
      quantity: 1,
      unit_price: installmentData.installment_amount,
      line_total: installmentData.installment_amount,
      sort_order: sortOrder++
    })

    // Late fee if applicable
    if (installmentData.late_fee_amount > 0) {
      lineItems.push({
        invoice_id,
        law_firm_id,
        line_type: 'late_fee',
        description: `Taxa de atraso (${installmentData.late_fee_rate}%)`,
        quantity: 1,
        unit_price: installmentData.late_fee_amount,
        line_total: installmentData.late_fee_amount,
        sort_order: sortOrder++
      })
    }

    // Insert line items
    const { data, error } = await this.supabase
      .from('invoice_line_items')
      .insert(lineItems)
      .select()

    if (error) throw error
    return data
  }

  /**
   * Get overdue payment plans for automated processing
   */
  private async getOverduePaymentPlans(
    law_firm_id: string,
    grace_period_days: number
  ) {
    const gracePeriodDate = new Date()
    gracePeriodDate.setDate(gracePeriodDate.getDate() - grace_period_days)

    const { data, error } = await this.supabase
      .from('payment_plans')
      .select(`
        *,
        client:clients(id, name, email)
      `)
      .eq('law_firm_id', law_firm_id)
      .eq('status', 'active')
      .lt('next_payment_date', gracePeriodDate.toISOString().split('T')[0])

    if (error) throw error
    return data || []
  }

  /**
   * Schedule next installment generation
   */
  private async scheduleNextInstallment(
    payment_plan_id: string,
    next_installment_number: number
  ): Promise<void> {
    // Get payment plan details to calculate next payment date
    const paymentPlan = await this.getPaymentPlanDetails(payment_plan_id)
    if (!paymentPlan) return

    const nextPaymentDate = this.calculateInstallmentDate(
      paymentPlan,
      next_installment_number
    )

    // Update payment plan with next payment date
    await this.supabase
      .from('payment_plans')
      .update({
        next_payment_date: nextPaymentDate,
        updated_at: new Date().toISOString()
      })
      .eq('id', payment_plan_id)

    // TODO: Schedule automated job/reminder for invoice generation
    // This would integrate with your job queue or scheduler
  }

  /**
   * Send invoice to client
   */
  private async sendInvoice(invoice_id: string): Promise<void> {
    await this.supabase
      .from('invoices')
      .update({
        invoice_status: 'sent',
        sent_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', invoice_id)
  }

  /**
   * Log batch generation for audit
   */
  private async logBatchGeneration(
    law_firm_id: string,
    batch_id: string,
    generation_type: string,
    total_requested: number,
    successful: number,
    failed: number
  ): Promise<void> {
    await this.supabase
      .from('invoice_generation_logs')
      .insert({
        law_firm_id,
        batch_id,
        generation_type,
        total_invoices_generated: total_requested,
        successful_generations: successful,
        failed_generations: failed,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
  }

  /**
   * Utility methods for payment plan management
   */

  /**
   * Get payment plan summary with invoice status
   */
  async getPaymentPlanSummary(payment_plan_id: string) {
    const { data: paymentPlan, error: planError } = await this.supabase
      .from('payment_plans')
      .select(`
        *,
        client:clients(id, name, email),
        matter:matters(id, title)
      `)
      .eq('id', payment_plan_id)
      .single()

    if (planError) throw planError

    const { data: invoices, error: invoicesError } = await this.supabase
      .from('payment_plan_invoices')
      .select(`
        *,
        invoice:invoices(
          *,
          invoice_payments(payment_amount, payment_date, payment_status)
        )
      `)
      .eq('payment_plan_id', payment_plan_id)
      .order('installment_number')

    if (invoicesError) throw invoicesError

    // Calculate summary statistics
    const totalPaid = invoices?.reduce((sum, inv) => {
      const payments = inv.invoice.invoice_payments || []
      return sum + payments.reduce((pSum: number, p: any) => 
        p.payment_status === 'completed' ? pSum + p.payment_amount : pSum, 0
      )
    }, 0) || 0

    const totalGenerated = invoices?.length || 0
    const remainingInstallments = paymentPlan.installments - totalGenerated
    const remainingAmount = paymentPlan.total_amount - totalPaid

    return {
      payment_plan: paymentPlan,
      invoices: invoices || [],
      summary: {
        total_amount: paymentPlan.total_amount,
        total_paid: totalPaid,
        remaining_amount: remainingAmount,
        total_installments: paymentPlan.installments,
        installments_generated: totalGenerated,
        remaining_installments: remainingInstallments,
        completion_percentage: (totalPaid / paymentPlan.total_amount) * 100
      }
    }
  }

  /**
   * Update payment plan terms
   */
  async updatePaymentPlanTerms(
    payment_plan_id: string,
    updates: {
      installments?: number
      installment_amount?: number
      frequency?: string
      late_fee_rate?: number
      grace_period_days?: number
    }
  ) {
    const { data, error } = await this.supabase
      .from('payment_plans')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', payment_plan_id)
      .select()
      .single()

    if (error) throw error
    return data
  }
}

export const paymentPlanInvoiceService = new PaymentPlanInvoiceService()