// Phase 8.7.3: Case Invoice Generation Service
// Comprehensive service for generating case invoices with hourly, fixed, percentage, and hybrid billing

import { createClient } from '@/lib/supabase/client'
import { timeBasedBillingService } from './time-based-billing-service'
import { caseBillingService } from './case-billing-service'
import { discountEngine } from './discount-engine'
import type {
  Invoice,
  InvoiceLineItem,
  CaseInvoice,
  CaseInvoiceGenerationRequest,
  InvoiceGenerationResult,
  BatchInvoiceGenerationResult
} from './invoice-types'
import type { TimeEntry } from './time-tracking-types'

export class CaseInvoiceService {
  private supabase = createClient()

  /**
   * Generate a single case invoice
   */
  async generateCaseInvoice(
    request: CaseInvoiceGenerationRequest
  ): Promise<InvoiceGenerationResult> {
    try {
      const { law_firm_id, matter_id } = request

      // Get matter details with case billing configuration
      const matter = await this.getMatterDetails(matter_id)
      if (!matter) {
        return { success: false, error: 'Caso não encontrado' }
      }

      // Get case billing configuration
      const caseBilling = await this.getCaseBillingConfig(matter_id)
      if (!caseBilling) {
        return { success: false, error: 'Configuração de cobrança não encontrada' }
      }

      // Collect billing data based on request
      const billingData = await this.collectBillingData(request, matter, caseBilling)

      // Calculate invoice amounts
      const calculations = await this.calculateCaseInvoiceAmounts(
        matter,
        caseBilling,
        billingData
      )

      // Apply discounts if applicable
      const discountedCalculations = await this.applyDiscounts(
        matter.client_id,
        calculations,
        matter_id
      )

      // Create the invoice
      const invoice = await this.createCaseInvoice(
        matter,
        caseBilling,
        billingData,
        discountedCalculations
      )

      // Auto-send if requested
      if (request.auto_send) {
        await this.sendInvoice(invoice.id)
      }

      return { success: true, invoice }
    } catch (error) {
      console.error('Error generating case invoice:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno do servidor'
      }
    }
  }

  /**
   * Generate case invoices for multiple matters (batch)
   */
  async generateBatchCaseInvoices(
    law_firm_id: string,
    matter_ids: string[],
    options: {
      include_time_entries?: boolean
      include_expenses?: boolean
      billing_period_start?: string
      billing_period_end?: string
      auto_send?: boolean
    } = {}
  ): Promise<BatchInvoiceGenerationResult> {
    const batch_id = crypto.randomUUID()
    
    try {
      const results: Invoice[] = []
      const errors: Array<{ client_id: string; error: string }> = []

      // Process each matter
      for (const matter_id of matter_ids) {
        try {
          const result = await this.generateCaseInvoice({
            law_firm_id,
            matter_id,
            include_time_entries: options.include_time_entries,
            include_expenses: options.include_expenses,
            billing_period_start: options.billing_period_start,
            billing_period_end: options.billing_period_end,
            auto_send: options.auto_send
          })

          if (result.success && result.invoice) {
            results.push(result.invoice)
          } else {
            // Get matter for client_id
            const { data: matter } = await this.supabase
              .from('matters')
              .select('client_id')
              .eq('id', matter_id)
              .single()

            errors.push({
              client_id: matter?.client_id || matter_id,
              error: result.error || 'Erro desconhecido'
            })
          }
        } catch (error) {
          errors.push({
            client_id: matter_id,
            error: error instanceof Error ? error.message : 'Erro interno'
          })
        }
      }

      // Log batch generation
      await this.logBatchGeneration(
        law_firm_id,
        batch_id,
        'case_billing',
        matter_ids.length,
        results.length,
        errors.length
      )

      return {
        success: true,
        total_requested: matter_ids.length,
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
        total_requested: matter_ids.length,
        successful_generations: 0,
        failed_generations: 1,
        invoices: [],
        errors: [{ client_id: 'system', error: 'Erro no processamento em lote' }],
        batch_id
      }
    }
  }

  /**
   * Get matter details with client and case type information
   */
  private async getMatterDetails(matter_id: string) {
    const { data, error } = await this.supabase
      .from('matters')
      .select(`
        *,
        client:clients(id, name, email, cpf, cnpj),
        case_type:case_types(*)
      `)
      .eq('id', matter_id)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Get case billing configuration
   */
  private async getCaseBillingConfig(matter_id: string) {
    const { data, error } = await this.supabase
      .from('case_billing')
      .select('*')
      .eq('matter_id', matter_id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  /**
   * Collect all billing data for the invoice
   */
  private async collectBillingData(
    request: CaseInvoiceGenerationRequest,
    matter: any,
    caseBilling: any
  ) {
    const billingData: {
      timeEntries: TimeEntry[]
      expenses: any[]
      caseOutcome?: any
      totalHours: number
      billableHours: number
    } = {
      timeEntries: [],
      expenses: [],
      totalHours: 0,
      billableHours: 0
    }

    // Collect time entries if requested or if hourly billing
    if (request.include_time_entries || caseBilling.billing_method === 'hourly') {
      let timeQuery = this.supabase
        .from('time_entries')
        .select('*')
        .eq('matter_id', matter.id)
        .eq('entry_status', 'approved')

      // Apply date filters if provided
      if (request.billing_period_start) {
        timeQuery = timeQuery.gte('entry_date', request.billing_period_start)
      }
      if (request.billing_period_end) {
        timeQuery = timeQuery.lte('entry_date', request.billing_period_end)
      }

      // Apply specific time entry IDs if provided
      if (request.time_entry_ids?.length) {
        timeQuery = timeQuery.in('id', request.time_entry_ids)
      }

      const { data: timeEntries, error: timeError } = await timeQuery
      if (timeError) throw timeError

      billingData.timeEntries = timeEntries || []
      billingData.totalHours = billingData.timeEntries.reduce(
        (sum, entry) => sum + (entry.effective_minutes / 60), 0
      )
      billingData.billableHours = billingData.timeEntries
        .filter(entry => entry.is_billable)
        .reduce((sum, entry) => sum + (entry.effective_minutes / 60), 0)
    }

    // Collect expenses if requested
    if (request.include_expenses) {
      let expenseQuery = this.supabase
        .from('case_expenses')
        .select('*')
        .eq('matter_id', matter.id)
        .eq('status', 'approved')

      // Apply date filters
      if (request.billing_period_start) {
        expenseQuery = expenseQuery.gte('expense_date', request.billing_period_start)
      }
      if (request.billing_period_end) {
        expenseQuery = expenseQuery.lte('expense_date', request.billing_period_end)
      }

      // Apply specific expense IDs if provided
      if (request.expense_ids?.length) {
        expenseQuery = expenseQuery.in('id', request.expense_ids)
      }

      const { data: expenses, error: expenseError } = await expenseQuery
      if (expenseError) throw expenseError

      billingData.expenses = expenses || []
    }

    // Get case outcome for percentage billing
    if (caseBilling.billing_method === 'percentage' || caseBilling.billing_method === 'hybrid') {
      const { data: outcome, error: outcomeError } = await this.supabase
        .from('case_outcomes')
        .select('*')
        .eq('matter_id', matter.id)
        .single()

      if (!outcomeError) {
        billingData.caseOutcome = outcome
      }
    }

    return billingData
  }

  /**
   * Calculate invoice amounts based on billing method
   */
  private async calculateCaseInvoiceAmounts(
    matter: any,
    caseBilling: any,
    billingData: any
  ) {
    const calculations = {
      time_charges: 0,
      fixed_fee: 0,
      percentage_fee: 0,
      success_fee: 0,
      case_expenses: 0,
      reimbursable_expenses: 0,
      subtotal: 0,
      minimum_fee_applied: false
    }

    // Calculate based on billing method
    switch (caseBilling.billing_method) {
      case 'hourly':
        calculations.time_charges = await this.calculateHourlyCharges(
          billingData.timeEntries,
          caseBilling.hourly_rate
        )
        calculations.subtotal = calculations.time_charges
        break

      case 'fixed':
        calculations.fixed_fee = caseBilling.fixed_fee || 0
        calculations.subtotal = calculations.fixed_fee
        break

      case 'percentage':
        if (billingData.caseOutcome) {
          calculations.percentage_fee = await this.calculatePercentageFee(
            billingData.caseOutcome,
            caseBilling.percentage_rate
          )
          calculations.success_fee = billingData.caseOutcome.success_fee || 0
        }
        calculations.subtotal = calculations.percentage_fee + calculations.success_fee
        break

      case 'hybrid':
        // Combine hourly and percentage
        calculations.time_charges = await this.calculateHourlyCharges(
          billingData.timeEntries,
          caseBilling.hourly_rate
        )
        
        if (billingData.caseOutcome) {
          calculations.percentage_fee = await this.calculatePercentageFee(
            billingData.caseOutcome,
            caseBilling.percentage_rate
          )
          calculations.success_fee = billingData.caseOutcome.success_fee || 0
        }
        
        calculations.subtotal = calculations.time_charges + calculations.percentage_fee + calculations.success_fee
        break
    }

    // Add expenses
    calculations.case_expenses = billingData.expenses.reduce(
      (sum: number, expense: any) => sum + (expense.amount || 0), 0
    )
    calculations.reimbursable_expenses = billingData.expenses
      .filter((expense: any) => expense.is_reimbursable)
      .reduce((sum: number, expense: any) => sum + (expense.amount || 0), 0)

    calculations.subtotal += calculations.case_expenses + calculations.reimbursable_expenses

    // Apply minimum fee if configured
    if (caseBilling.minimum_fee && calculations.subtotal < caseBilling.minimum_fee) {
      calculations.subtotal = caseBilling.minimum_fee
      calculations.minimum_fee_applied = true
    }

    return calculations
  }

  /**
   * Calculate hourly charges from time entries
   */
  private async calculateHourlyCharges(timeEntries: TimeEntry[], defaultRate: number): Promise<number> {
    let totalCharges = 0

    for (const entry of timeEntries) {
      if (entry.is_billable) {
        const hours = entry.effective_minutes / 60
        const rate = entry.billable_rate || defaultRate
        totalCharges += hours * rate
      }
    }

    return totalCharges
  }

  /**
   * Calculate percentage fee from case outcome
   */
  private async calculatePercentageFee(caseOutcome: any, percentageRate: number): Promise<number> {
    if (!caseOutcome.amount_recovered || !percentageRate) return 0
    
    return (caseOutcome.amount_recovered * percentageRate) / 100
  }

  /**
   * Apply discounts to calculations
   */
  private async applyDiscounts(
    client_id: string,
    calculations: any,
    matter_id: string
  ) {
    try {
      // Check for applicable discounts
      const discountResult = await discountEngine.calculateCaseDiscount({
        client_id,
        matter_id,
        base_amount: calculations.subtotal
      })

      if (discountResult.applicable_discounts.length > 0) {
        return {
          ...calculations,
          discount_amount: discountResult.total_discount,
          discounted_subtotal: discountResult.final_amount,
          applied_discounts: discountResult.applicable_discounts
        }
      }

      return {
        ...calculations,
        discount_amount: 0,
        discounted_subtotal: calculations.subtotal,
        applied_discounts: []
      }
    } catch (error) {
      console.error('Error applying discounts:', error)
      return {
        ...calculations,
        discount_amount: 0,
        discounted_subtotal: calculations.subtotal,
        applied_discounts: []
      }
    }
  }

  /**
   * Create the case invoice with all details
   */
  private async createCaseInvoice(
    matter: any,
    caseBilling: any,
    billingData: any,
    calculations: any
  ): Promise<Invoice> {
    // Create main invoice record
    const { data: invoice, error: invoiceError } = await this.supabase
      .from('invoices')
      .insert({
        law_firm_id: matter.law_firm_id,
        client_id: matter.client_id,
        matter_id: matter.id,
        invoice_type: 'case_billing',
        invoice_status: 'draft',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: this.calculateDueDate(caseBilling.payment_terms || '30_days'),
        payment_terms: caseBilling.payment_terms || '30_days',
        payment_methods: ['pix', 'bank_transfer', 'credit_card'],
        description: `Fatura do caso - ${matter.title}`,
        subtotal: calculations.discounted_subtotal || calculations.subtotal,
        discount_amount: calculations.discount_amount || 0,
        total_amount: calculations.discounted_subtotal || calculations.subtotal,
        currency: 'BRL'
      })
      .select()
      .single()

    if (invoiceError) throw invoiceError

    // Create case invoice details
    const { error: caseInvoiceError } = await this.supabase
      .from('case_invoices')
      .insert({
        law_firm_id: matter.law_firm_id,
        invoice_id: invoice.id,
        matter_id: matter.id,
        case_billing_id: caseBilling.id,
        billing_method: caseBilling.billing_method,
        total_hours: billingData.totalHours,
        billable_hours: billingData.billableHours,
        hourly_rate: caseBilling.hourly_rate,
        time_charges: calculations.time_charges,
        fixed_fee: calculations.fixed_fee,
        recovery_amount: billingData.caseOutcome?.amount_recovered,
        percentage_rate: caseBilling.percentage_rate,
        percentage_fee: calculations.percentage_fee,
        success_fee: calculations.success_fee,
        case_expenses: calculations.case_expenses,
        reimbursable_expenses: calculations.reimbursable_expenses,
        minimum_fee: caseBilling.minimum_fee,
        minimum_fee_applied: calculations.minimum_fee_applied,
        is_final_invoice: true,
        allows_payment_plan: caseBilling.allows_payment_plan || true
      })

    if (caseInvoiceError) throw caseInvoiceError

    // Create line items
    const lineItems = await this.createCaseInvoiceLineItems(
      invoice.id,
      matter.law_firm_id,
      caseBilling,
      billingData,
      calculations
    )

    // Return complete invoice
    return {
      ...invoice,
      line_items: lineItems
    }
  }

  /**
   * Create line items for case invoice
   */
  private async createCaseInvoiceLineItems(
    invoice_id: string,
    law_firm_id: string,
    caseBilling: any,
    billingData: any,
    calculations: any
  ): Promise<InvoiceLineItem[]> {
    const lineItems: Partial<InvoiceLineItem>[] = []
    let sortOrder = 1

    // Add billing method specific line items
    switch (caseBilling.billing_method) {
      case 'hourly':
        if (calculations.time_charges > 0) {
          lineItems.push({
            invoice_id,
            law_firm_id,
            line_type: 'case_fee',
            description: `Honorários por horas trabalhadas (${billingData.billableHours.toFixed(1)}h à R$ ${caseBilling.hourly_rate})`,
            quantity: billingData.billableHours,
            unit_price: caseBilling.hourly_rate,
            line_total: calculations.time_charges,
            sort_order: sortOrder++
          })
        }
        break

      case 'fixed':
        if (calculations.fixed_fee > 0) {
          lineItems.push({
            invoice_id,
            law_firm_id,
            line_type: 'case_fee',
            description: 'Honorários de caso - Taxa fixa',
            quantity: 1,
            unit_price: calculations.fixed_fee,
            line_total: calculations.fixed_fee,
            sort_order: sortOrder++
          })
        }
        break

      case 'percentage':
        if (calculations.percentage_fee > 0) {
          lineItems.push({
            invoice_id,
            law_firm_id,
            line_type: 'case_fee',
            description: `Honorários de êxito (${caseBilling.percentage_rate}% de R$ ${billingData.caseOutcome?.amount_recovered || 0})`,
            quantity: 1,
            unit_price: calculations.percentage_fee,
            line_total: calculations.percentage_fee,
            sort_order: sortOrder++
          })
        }
        
        if (calculations.success_fee > 0) {
          lineItems.push({
            invoice_id,
            law_firm_id,
            line_type: 'success_fee',
            description: 'Taxa adicional de sucesso',
            quantity: 1,
            unit_price: calculations.success_fee,
            line_total: calculations.success_fee,
            sort_order: sortOrder++
          })
        }
        break

      case 'hybrid':
        if (calculations.time_charges > 0) {
          lineItems.push({
            invoice_id,
            law_firm_id,
            line_type: 'case_fee',
            description: `Honorários por horas (${billingData.billableHours.toFixed(1)}h)`,
            quantity: billingData.billableHours,
            unit_price: caseBilling.hourly_rate,
            line_total: calculations.time_charges,
            sort_order: sortOrder++
          })
        }
        
        if (calculations.percentage_fee > 0) {
          lineItems.push({
            invoice_id,
            law_firm_id,
            line_type: 'case_fee',
            description: `Honorários de êxito (${caseBilling.percentage_rate}%)`,
            quantity: 1,
            unit_price: calculations.percentage_fee,
            line_total: calculations.percentage_fee,
            sort_order: sortOrder++
          })
        }
        
        if (calculations.success_fee > 0) {
          lineItems.push({
            invoice_id,
            law_firm_id,
            line_type: 'success_fee',
            description: 'Taxa adicional de sucesso',
            quantity: 1,
            unit_price: calculations.success_fee,
            line_total: calculations.success_fee,
            sort_order: sortOrder++
          })
        }
        break
    }

    // Add individual time entries if detailed billing
    if (billingData.timeEntries.length > 0 && billingData.timeEntries.length <= 10) {
      for (const entry of billingData.timeEntries) {
        if (entry.is_billable) {
          lineItems.push({
            invoice_id,
            law_firm_id,
            line_type: 'time_entry',
            description: `${entry.activity_description} (${(entry.effective_minutes / 60).toFixed(1)}h)`,
            quantity: entry.effective_minutes / 60,
            unit_price: entry.billable_rate || caseBilling.hourly_rate,
            line_total: entry.billable_amount,
            time_entry_id: entry.id,
            sort_order: sortOrder++
          })
        }
      }
    }

    // Add expenses
    for (const expense of billingData.expenses) {
      lineItems.push({
        invoice_id,
        law_firm_id,
        line_type: 'expense',
        description: expense.description || 'Despesa do caso',
        quantity: 1,
        unit_price: expense.amount,
        line_total: expense.amount,
        sort_order: sortOrder++
      })
    }

    // Add discount line items
    if (calculations.applied_discounts?.length > 0) {
      for (const discount of calculations.applied_discounts) {
        lineItems.push({
          invoice_id,
          law_firm_id,
          line_type: 'discount',
          description: `Desconto - ${discount.description}`,
          quantity: 1,
          unit_price: -discount.discount_amount,
          line_total: -discount.discount_amount,
          sort_order: sortOrder++
        })
      }
    }

    // Minimum fee adjustment
    if (calculations.minimum_fee_applied) {
      const adjustment = caseBilling.minimum_fee - (calculations.subtotal - (calculations.discount_amount || 0))
      lineItems.push({
        invoice_id,
        law_firm_id,
        line_type: 'adjustment',
        description: 'Ajuste para taxa mínima',
        quantity: 1,
        unit_price: adjustment,
        line_total: adjustment,
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
   * Helper methods
   */
  private calculateDueDate(payment_terms: string): string {
    const now = new Date()
    const dueDate = new Date(now)
    
    const termsDays: Record<string, number> = {
      'immediate': 0,
      '7_days': 7,
      '15_days': 15,
      '30_days': 30,
      '45_days': 45,
      '60_days': 60
    }
    
    const days = termsDays[payment_terms] || 30
    dueDate.setDate(dueDate.getDate() + days)
    
    return dueDate.toISOString().split('T')[0]
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
}

export const caseInvoiceService = new CaseInvoiceService()