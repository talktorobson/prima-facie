// Phase 8.7.2: Subscription Invoice Generation Service
// Comprehensive service for generating subscription invoices with usage tracking and proration

import { createClient } from '@/lib/supabase/client'
import type {
  Invoice,
  InvoiceLineItem,
  SubscriptionInvoice,
  SubscriptionInvoiceGenerationRequest,
  InvoiceGenerationResult,
  BatchInvoiceGenerationResult,
  ServiceUsage,
  InvoiceTemplate
} from './invoice-types'

export class SubscriptionInvoiceService {
  private supabase = createClient()

  /**
   * Generate a single subscription invoice for a client
   */
  async generateSubscriptionInvoice(
    request: SubscriptionInvoiceGenerationRequest
  ): Promise<InvoiceGenerationResult> {
    try {
      const { law_firm_id, client_subscription_id, billing_period_start, billing_period_end } = request

      // Get subscription details
      const subscription = await this.getSubscriptionDetails(client_subscription_id!)
      if (!subscription) {
        return { success: false, error: 'Assinatura não encontrada' }
      }

      // Check if invoice already exists for this period
      if (!request.force_regenerate) {
        const existingInvoice = await this.findExistingSubscriptionInvoice(
          client_subscription_id!,
          billing_period_start,
          billing_period_end
        )
        if (existingInvoice) {
          return { success: false, error: 'Fatura já existe para este período' }
        }
      }

      // Calculate usage and charges
      const usageData = await this.calculateSubscriptionUsage(
        client_subscription_id!,
        billing_period_start,
        billing_period_end
      )

      // Check for proration
      const prorationData = await this.calculateProration(
        subscription,
        billing_period_start,
        billing_period_end
      )

      // Generate invoice
      const invoice = await this.createSubscriptionInvoice(
        subscription,
        usageData,
        prorationData,
        billing_period_start,
        billing_period_end
      )

      // Auto-send if requested
      if (request.auto_send) {
        await this.sendInvoice(invoice.id)
      }

      return { success: true, invoice }
    } catch (error) {
      console.error('Error generating subscription invoice:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno do servidor'
      }
    }
  }

  /**
   * Generate subscription invoices for multiple clients (batch)
   */
  async generateBatchSubscriptionInvoices(
    law_firm_id: string,
    billing_period_start: string,
    billing_period_end: string,
    options: {
      client_ids?: string[]
      subscription_ids?: string[]
      auto_send?: boolean
      template_id?: string
    } = {}
  ): Promise<BatchInvoiceGenerationResult> {
    const batch_id = crypto.randomUUID()
    
    try {
      // Get subscriptions to bill
      const subscriptions = await this.getSubscriptionsForBilling(
        law_firm_id,
        billing_period_start,
        billing_period_end,
        options
      )

      const results: Invoice[] = []
      const errors: Array<{ client_id: string; error: string }> = []

      // Process each subscription
      for (const subscription of subscriptions) {
        try {
          const result = await this.generateSubscriptionInvoice({
            law_firm_id,
            client_subscription_id: subscription.id,
            billing_period_start,
            billing_period_end,
            auto_send: options.auto_send
          })

          if (result.success && result.invoice) {
            results.push(result.invoice)
          } else {
            errors.push({
              client_id: subscription.client_id,
              error: result.error || 'Erro desconhecido'
            })
          }
        } catch (error) {
          errors.push({
            client_id: subscription.client_id,
            error: error instanceof Error ? error.message : 'Erro interno'
          })
        }
      }

      // Log batch generation
      await this.logBatchGeneration(
        law_firm_id,
        batch_id,
        'subscription',
        subscriptions.length,
        results.length,
        errors.length,
        billing_period_start,
        billing_period_end
      )

      return {
        success: true,
        total_requested: subscriptions.length,
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
   * Get subscription details with plan and services
   */
  private async getSubscriptionDetails(client_subscription_id: string) {
    const { data, error } = await this.supabase
      .from('client_subscriptions')
      .select(`
        *,
        subscription_plan:subscription_plans(
          *,
          service_inclusions(*)
        ),
        client:clients(id, name, email, cpf, cnpj)
      `)
      .eq('id', client_subscription_id)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Find existing subscription invoice for the period
   */
  private async findExistingSubscriptionInvoice(
    client_subscription_id: string,
    billing_period_start: string,
    billing_period_end: string
  ): Promise<Invoice | null> {
    const { data, error } = await this.supabase
      .from('subscription_invoices')
      .select(`
        invoice:invoices(*)
      `)
      .eq('client_subscription_id', client_subscription_id)
      .eq('billing_period_start', billing_period_start)
      .eq('billing_period_end', billing_period_end)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data?.invoice || null
  }

  /**
   * Calculate service usage for the billing period
   */
  private async calculateSubscriptionUsage(
    client_subscription_id: string,
    billing_period_start: string,
    billing_period_end: string
  ): Promise<{
    services_included: ServiceUsage
    services_used: ServiceUsage
    overage_charges: number
  }> {
    // Get subscription plan services
    const { data: subscription } = await this.supabase
      .from('client_subscriptions')
      .select(`
        subscription_plan:subscription_plans(
          service_inclusions(*)
        )
      `)
      .eq('id', client_subscription_id)
      .single()

    if (!subscription) throw new Error('Assinatura não encontrada')

    const services_included: ServiceUsage = {}
    const services_used: ServiceUsage = {}
    let overage_charges = 0

    // Process each service inclusion
    for (const service of subscription.subscription_plan.service_inclusions) {
      const serviceType = service.service_type
      
      services_included[serviceType] = {
        included: service.quantity_included,
        used: 0,
        overage: 0,
        unit: service.unit
      }

      // Calculate actual usage based on service type
      let actualUsage = 0
      
      switch (serviceType) {
        case 'legal_consultation':
          actualUsage = await this.calculateConsultationUsage(
            client_subscription_id,
            billing_period_start,
            billing_period_end
          )
          break
        case 'document_review':
          actualUsage = await this.calculateDocumentReviewUsage(
            client_subscription_id,
            billing_period_start,
            billing_period_end
          )
          break
        case 'contract_analysis':
          actualUsage = await this.calculateContractAnalysisUsage(
            client_subscription_id,
            billing_period_start,
            billing_period_end
          )
          break
        case 'legal_research':
          actualUsage = await this.calculateLegalResearchUsage(
            client_subscription_id,
            billing_period_start,
            billing_period_end
          )
          break
        default:
          // For other services, check time entries
          actualUsage = await this.calculateTimeBasedUsage(
            client_subscription_id,
            serviceType,
            billing_period_start,
            billing_period_end
          )
      }

      // Calculate overage
      const overage = Math.max(0, actualUsage - service.quantity_included)
      const overageAmount = overage * (service.overage_rate || 0)

      services_used[serviceType] = {
        included: service.quantity_included,
        used: actualUsage,
        overage,
        unit: service.unit
      }

      overage_charges += overageAmount
    }

    return {
      services_included,
      services_used,
      overage_charges
    }
  }

  /**
   * Calculate proration for partial billing periods
   */
  private async calculateProration(
    subscription: any,
    billing_period_start: string,
    billing_period_end: string
  ): Promise<{
    is_prorated: boolean
    proration_factor: number
    proration_reason?: string
  }> {
    const startDate = new Date(billing_period_start)
    const endDate = new Date(billing_period_end)
    const subscriptionStart = new Date(subscription.start_date)
    const subscriptionEnd = subscription.end_date ? new Date(subscription.end_date) : null

    let is_prorated = false
    let proration_factor = 1.0
    let proration_reason = undefined

    // Check if subscription started mid-period
    if (subscriptionStart > startDate) {
      is_prorated = true
      proration_reason = 'Assinatura iniciada no meio do período'
      
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      const billedDays = Math.ceil((endDate.getTime() - subscriptionStart.getTime()) / (1000 * 60 * 60 * 24))
      proration_factor = billedDays / totalDays
    }

    // Check if subscription ended mid-period
    if (subscriptionEnd && subscriptionEnd < endDate) {
      is_prorated = true
      proration_reason = 'Assinatura encerrada no meio do período'
      
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      const billedDays = Math.ceil((subscriptionEnd.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      proration_factor = billedDays / totalDays
    }

    return {
      is_prorated,
      proration_factor: Math.max(0, Math.min(1, proration_factor)),
      proration_reason
    }
  }

  /**
   * Create the subscription invoice with all details
   */
  private async createSubscriptionInvoice(
    subscription: any,
    usageData: any,
    prorationData: any,
    billing_period_start: string,
    billing_period_end: string
  ): Promise<Invoice> {
    const { data: invoice, error: invoiceError } = await this.supabase
      .from('invoices')
      .insert({
        law_firm_id: subscription.law_firm_id,
        client_id: subscription.client_id,
        invoice_type: 'subscription',
        invoice_status: 'draft',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: this.calculateDueDate(subscription.subscription_plan.billing_cycle),
        payment_terms: '30_days',
        payment_methods: ['pix', 'bank_transfer', 'credit_card'],
        client_subscription_id: subscription.id,
        description: `Fatura de assinatura - ${subscription.subscription_plan.plan_name}`,
        currency: 'BRL'
      })
      .select()
      .single()

    if (invoiceError) throw invoiceError

    // Create subscription invoice details
    const { error: subscriptionError } = await this.supabase
      .from('subscription_invoices')
      .insert({
        law_firm_id: subscription.law_firm_id,
        invoice_id: invoice.id,
        client_subscription_id: subscription.id,
        billing_period_start,
        billing_period_end,
        billing_cycle: subscription.subscription_plan.billing_cycle,
        services_included: usageData.services_included,
        services_used: usageData.services_used,
        overage_charges: usageData.overage_charges,
        is_prorated: prorationData.is_prorated,
        proration_reason: prorationData.proration_reason,
        proration_factor: prorationData.proration_factor,
        auto_renew: subscription.auto_renew,
        next_billing_date: this.calculateNextBillingDate(
          billing_period_end,
          subscription.subscription_plan.billing_cycle
        )
      })

    if (subscriptionError) throw subscriptionError

    // Create line items
    const lineItems = await this.createSubscriptionLineItems(
      invoice.id,
      subscription,
      usageData,
      prorationData
    )

    // Return complete invoice with line items
    return {
      ...invoice,
      line_items: lineItems
    }
  }

  /**
   * Create line items for subscription invoice
   */
  private async createSubscriptionLineItems(
    invoice_id: string,
    subscription: any,
    usageData: any,
    prorationData: any
  ): Promise<InvoiceLineItem[]> {
    const lineItems: Partial<InvoiceLineItem>[] = []

    // Base subscription fee
    const baseAmount = subscription.subscription_plan.monthly_fee * prorationData.proration_factor
    
    lineItems.push({
      invoice_id,
      law_firm_id: subscription.law_firm_id,
      line_type: 'subscription_fee',
      description: prorationData.is_prorated 
        ? `Taxa de assinatura - ${subscription.subscription_plan.plan_name} (Proporcional)`
        : `Taxa de assinatura - ${subscription.subscription_plan.plan_name}`,
      quantity: 1,
      unit_price: baseAmount,
      line_total: baseAmount,
      sort_order: 1
    })

    // Overage charges
    let sortOrder = 2
    for (const [serviceType, usage] of Object.entries(usageData.services_used) as Array<[string, any]>) {
      if (usage.overage > 0) {
        const overageRate = this.getOverageRate(subscription.subscription_plan.service_inclusions, serviceType)
        const overageAmount = usage.overage * overageRate
        
        lineItems.push({
          invoice_id,
          law_firm_id: subscription.law_firm_id,
          line_type: 'service_fee',
          description: `Excesso de uso - ${this.getServiceTypeName(serviceType)} (${usage.overage} ${usage.unit})`,
          quantity: usage.overage,
          unit_price: overageRate,
          line_total: overageAmount,
          sort_order: sortOrder++
        })
      }
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
   * Calculate usage for different service types
   */
  private async calculateConsultationUsage(
    client_subscription_id: string,
    billing_period_start: string,
    billing_period_end: string
  ): Promise<number> {
    // Count consultation sessions from time entries
    const { data, error } = await this.supabase
      .from('time_entries')
      .select('id')
      .eq('client_subscription_id', client_subscription_id)
      .eq('entry_type', 'subscription_work')
      .eq('task_category', 'Consultation')
      .gte('entry_date', billing_period_start)
      .lte('entry_date', billing_period_end)

    if (error) throw error
    return data.length
  }

  private async calculateDocumentReviewUsage(
    client_subscription_id: string,
    billing_period_start: string,
    billing_period_end: string
  ): Promise<number> {
    // Count document reviews from time entries or document records
    const { data, error } = await this.supabase
      .from('time_entries')
      .select('id')
      .eq('client_subscription_id', client_subscription_id)
      .eq('entry_type', 'subscription_work')
      .eq('task_category', 'Document Review')
      .gte('entry_date', billing_period_start)
      .lte('entry_date', billing_period_end)

    if (error) throw error
    return data.length
  }

  private async calculateContractAnalysisUsage(
    client_subscription_id: string,
    billing_period_start: string,
    billing_period_end: string
  ): Promise<number> {
    // Count contract analyses
    const { data, error } = await this.supabase
      .from('time_entries')
      .select('id')
      .eq('client_subscription_id', client_subscription_id)
      .eq('entry_type', 'subscription_work')
      .eq('task_category', 'Contract Analysis')
      .gte('entry_date', billing_period_start)
      .lte('entry_date', billing_period_end)

    if (error) throw error
    return data.length
  }

  private async calculateLegalResearchUsage(
    client_subscription_id: string,
    billing_period_start: string,
    billing_period_end: string
  ): Promise<number> {
    // Count hours of legal research
    const { data, error } = await this.supabase
      .from('time_entries')
      .select('effective_minutes')
      .eq('client_subscription_id', client_subscription_id)
      .eq('entry_type', 'subscription_work')
      .eq('task_category', 'Legal Research')
      .gte('entry_date', billing_period_start)
      .lte('entry_date', billing_period_end)

    if (error) throw error
    
    const totalMinutes = data.reduce((sum, entry) => sum + entry.effective_minutes, 0)
    return Math.ceil(totalMinutes / 60) // Convert to hours
  }

  private async calculateTimeBasedUsage(
    client_subscription_id: string,
    serviceType: string,
    billing_period_start: string,
    billing_period_end: string
  ): Promise<number> {
    // Generic time-based usage calculation
    const { data, error } = await this.supabase
      .from('time_entries')
      .select('effective_minutes')
      .eq('client_subscription_id', client_subscription_id)
      .eq('entry_type', 'subscription_work')
      .gte('entry_date', billing_period_start)
      .lte('entry_date', billing_period_end)

    if (error) throw error
    
    const totalMinutes = data.reduce((sum, entry) => sum + entry.effective_minutes, 0)
    return Math.ceil(totalMinutes / 60)
  }

  /**
   * Helper methods
   */
  private calculateDueDate(billing_cycle: string): string {
    const now = new Date()
    const dueDate = new Date(now)
    
    switch (billing_cycle) {
      case 'monthly':
        dueDate.setDate(dueDate.getDate() + 30)
        break
      case 'quarterly':
        dueDate.setDate(dueDate.getDate() + 15)
        break
      case 'yearly':
        dueDate.setDate(dueDate.getDate() + 45)
        break
      default:
        dueDate.setDate(dueDate.getDate() + 30)
    }
    
    return dueDate.toISOString().split('T')[0]
  }

  private calculateNextBillingDate(billing_period_end: string, billing_cycle: string): string {
    const endDate = new Date(billing_period_end)
    const nextDate = new Date(endDate)
    
    switch (billing_cycle) {
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1)
        break
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3)
        break
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1)
        break
    }
    
    return nextDate.toISOString().split('T')[0]
  }

  private getOverageRate(service_inclusions: any[], serviceType: string): number {
    const service = service_inclusions.find(s => s.service_type === serviceType)
    return service?.overage_rate || 0
  }

  private getServiceTypeName(serviceType: string): string {
    const names: Record<string, string> = {
      'legal_consultation': 'Consulta Jurídica',
      'document_review': 'Revisão de Documento',
      'contract_analysis': 'Análise de Contrato',
      'legal_research': 'Pesquisa Jurídica',
      'court_representation': 'Representação em Tribunal',
      'legal_writing': 'Redação Jurídica'
    }
    return names[serviceType] || serviceType
  }

  /**
   * Get subscriptions for batch billing
   */
  private async getSubscriptionsForBilling(
    law_firm_id: string,
    billing_period_start: string,
    billing_period_end: string,
    options: any
  ) {
    let query = this.supabase
      .from('client_subscriptions')
      .select(`
        *,
        client:clients(id, name, email),
        subscription_plan:subscription_plans(*)
      `)
      .eq('law_firm_id', law_firm_id)
      .eq('status', 'active')
      .lte('start_date', billing_period_end)

    if (options.client_ids?.length) {
      query = query.in('client_id', options.client_ids)
    }

    if (options.subscription_ids?.length) {
      query = query.in('id', options.subscription_ids)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  }

  /**
   * Send invoice to client
   */
  private async sendInvoice(invoice_id: string): Promise<void> {
    // Update invoice status to sent
    await this.supabase
      .from('invoices')
      .update({
        invoice_status: 'sent',
        sent_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', invoice_id)

    // TODO: Implement email sending logic
    // This would integrate with your email service to send the invoice to the client
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
    failed: number,
    period_start: string,
    period_end: string
  ): Promise<void> {
    await this.supabase
      .from('invoice_generation_logs')
      .insert({
        law_firm_id,
        batch_id,
        generation_type: 'batch',
        total_invoices_generated: total_requested,
        successful_generations: successful,
        failed_generations: failed,
        period_start,
        period_end,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
  }
}

export const subscriptionInvoiceService = new SubscriptionInvoiceService()