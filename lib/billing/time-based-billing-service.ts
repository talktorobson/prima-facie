// =====================================================
// PHASE 8.6: TIME-BASED BILLING SERVICE
// Automated Billing Calculation from Time Entries
// =====================================================

import { createClient } from '@/lib/supabase/client'
import { timeTrackingService } from './time-tracking-service'
import { discountService } from './discount-service'
import type {
  TimeEntry,
  TimeBasedBillingCalculation,
  AutomatedBillingRule,
  LawyerBillingRate,
  SubscriptionTimeAllocation
} from './time-tracking-types'
import type {
  CaseBillingCalculationResult,
  BillingCalculationBreakdown
} from './case-billing-types'
import type { DiscountEligibility } from './discount-types'

class TimeBasedBillingService {
  private supabase = createClient()

  // ===== AUTOMATED BILLING CALCULATION =====

  async calculateTimeBasedBilling(
    timeEntries: TimeEntry[],
    context: {
      matter_id?: string
      client_subscription_id?: string
      client_id?: string
      apply_discounts?: boolean
      billing_date?: string
    }
  ): Promise<TimeBasedBillingCalculation> {
    const billableEntries = timeEntries.filter(entry => entry.is_billable && entry.entry_status === 'approved')
    
    if (billableEntries.length === 0) {
      return this.createEmptyBillingCalculation(context)
    }

    // Group entries by billing rate for breakdown
    const rateGroups = this.groupEntriesByRate(billableEntries)
    
    // Calculate base amounts
    const totalBillableHours = billableEntries.reduce((sum, entry) => 
      sum + (entry.effective_minutes / 60), 0
    )
    
    let totalBillableAmount = billableEntries.reduce((sum, entry) => 
      sum + entry.billable_amount, 0
    )

    // Handle subscription allocation if applicable
    let subscriptionAllocation: TimeBasedBillingCalculation['subscription_allocation']
    if (context.client_subscription_id) {
      subscriptionAllocation = await this.calculateSubscriptionAllocation(
        billableEntries,
        context.client_subscription_id
      )
    }

    // Apply discounts if enabled
    let discountAmount = 0
    if (context.apply_discounts && context.client_id) {
      const discountEligibility = await this.checkTimeBasedDiscounts(
        context.client_id,
        totalBillableAmount,
        context.matter_id,
        context.client_subscription_id
      )
      
      if (discountEligibility.is_eligible) {
        discountAmount = discountEligibility.discount_amount
      }
    }

    const subtotal = Math.max(0, totalBillableAmount - discountAmount)
    
    return {
      matter_id: context.matter_id,
      client_subscription_id: context.client_subscription_id,
      time_entries: timeEntries,
      total_billable_hours: totalBillableHours,
      total_billable_amount: totalBillableAmount,
      rate_breakdown: rateGroups,
      subscription_allocation: subscriptionAllocation,
      subtotal,
      total_amount: subtotal
    }
  }

  async generateInvoiceFromTimeEntries(
    timeEntries: TimeEntry[],
    context: {
      matter_id?: string
      client_subscription_id?: string
      client_id: string
      invoice_type: 'case' | 'subscription' | 'mixed'
      billing_period_start?: string
      billing_period_end?: string
      auto_send?: boolean
    }
  ): Promise<string> {
    const billingCalculation = await this.calculateTimeBasedBilling(timeEntries, {
      ...context,
      apply_discounts: true
    })

    // Create invoice record
    const invoiceData = {
      client_id: context.client_id,
      matter_id: context.matter_id,
      client_subscription_id: context.client_subscription_id,
      invoice_type: context.invoice_type,
      subtotal: billingCalculation.subtotal,
      total_amount: billingCalculation.total_amount,
      status: 'draft' as const,
      billing_period_start: context.billing_period_start,
      billing_period_end: context.billing_period_end,
      line_items: this.generateLineItemsFromTimeEntries(billingCalculation),
      time_entry_ids: timeEntries.map(entry => entry.id)
    }

    const { data: invoice, error } = await this.supabase
      .from('invoices')
      .insert([invoiceData])
      .select('id')
      .single()

    if (error) throw error

    // Mark time entries as billed
    await this.markTimeEntriesAsBilled(timeEntries.map(e => e.id), invoice.id)

    // Auto-send if enabled
    if (context.auto_send) {
      await this.sendInvoice(invoice.id)
    }

    return invoice.id
  }

  // ===== SUBSCRIPTION TIME ALLOCATION =====

  private async calculateSubscriptionAllocation(
    timeEntries: TimeEntry[],
    subscriptionId: string
  ): Promise<TimeBasedBillingCalculation['subscription_allocation']> {
    const subscriptionEntries = timeEntries.filter(entry => 
      entry.client_subscription_id === subscriptionId && 
      entry.counts_toward_subscription
    )

    if (subscriptionEntries.length === 0) {
      return undefined
    }

    const currentMonth = new Date().toISOString().slice(0, 7) + '-01'
    const allocation = await timeTrackingService.getSubscriptionTimeAllocation(
      subscriptionId,
      currentMonth
    )

    if (!allocation) {
      return undefined
    }

    const totalMinutes = subscriptionEntries.reduce((sum, entry) => sum + entry.effective_minutes, 0)
    const includedMinutes = Math.min(totalMinutes, allocation.total_minutes_remaining)
    const overageMinutes = Math.max(0, totalMinutes - allocation.total_minutes_remaining)

    // Calculate overage amount based on subscription overage rate
    const overageRate = allocation.overage_rate || 0
    const overageAmount = (overageMinutes / 60) * overageRate

    return {
      included_hours: includedMinutes / 60,
      included_amount: 0, // Included in subscription
      overage_hours: overageMinutes / 60,
      overage_amount: overageAmount
    }
  }

  // ===== DISCOUNT APPLICATION =====

  private async checkTimeBasedDiscounts(
    clientId: string,
    billingAmount: number,
    matterId?: string,
    subscriptionId?: string
  ): Promise<DiscountEligibility> {
    // Check if client has active subscription for discounts
    if (subscriptionId) {
      return await discountService.checkSubscriptionDiscount(
        clientId,
        subscriptionId,
        billingAmount,
        matterId
      )
    }

    // Check for volume or loyalty discounts
    return await discountService.checkVolumeDiscount(
      clientId,
      billingAmount,
      matterId
    )
  }

  // ===== AUTOMATED BILLING RULES =====

  async createAutomatedBillingRule(
    lawFirmId: string,
    ruleData: Omit<AutomatedBillingRule, 'id' | 'law_firm_id' | 'created_at' | 'updated_at' | 'last_run' | 'next_run'>
  ): Promise<AutomatedBillingRule> {
    const { data, error } = await this.supabase
      .from('automated_billing_rules')
      .insert([{
        ...ruleData,
        law_firm_id: lawFirmId,
        next_run: this.calculateNextRun(ruleData.billing_frequency, ruleData.billing_day_of_week, ruleData.billing_day_of_month)
      }])
      .select()
      .single()

    if (error) throw error
    return data
  }

  async processAutomatedBilling(ruleId: string): Promise<{
    invoices_created: number
    total_amount: number
    errors: string[]
  }> {
    const { data: rule, error: ruleError } = await this.supabase
      .from('automated_billing_rules')
      .select('*')
      .eq('id', ruleId)
      .eq('is_active', true)
      .single()

    if (ruleError || !rule) {
      throw new Error('Automated billing rule not found or inactive')
    }

    const result = {
      invoices_created: 0,
      total_amount: 0,
      errors: [] as string[]
    }

    try {
      // Get pending time entries that meet criteria
      const pendingEntries = await this.getPendingTimeEntriesForBilling(rule)
      
      // Group by client/matter for invoice generation
      const groupedEntries = this.groupTimeEntriesForBilling(pendingEntries)

      for (const group of groupedEntries) {
        try {
          const billingCalculation = await this.calculateTimeBasedBilling(group.entries, {
            matter_id: group.matter_id,
            client_subscription_id: group.client_subscription_id,
            client_id: group.client_id,
            apply_discounts: true
          })

          // Check if meets minimum billing threshold
          if (billingCalculation.total_amount < (rule.auto_approve_threshold_hours || 0) * 100) {
            continue
          }

          // Generate invoice
          const invoiceId = await this.generateInvoiceFromTimeEntries(group.entries, {
            client_id: group.client_id,
            matter_id: group.matter_id,
            client_subscription_id: group.client_subscription_id,
            invoice_type: group.client_subscription_id ? 'subscription' : 'case',
            auto_send: true
          })

          result.invoices_created++
          result.total_amount += billingCalculation.total_amount

        } catch (error) {
          result.errors.push(`Error processing group for client ${group.client_id}: ${error}`)
        }
      }

      // Update rule last run time
      await this.supabase
        .from('automated_billing_rules')
        .update({
          last_run: new Date().toISOString(),
          next_run: this.calculateNextRun(rule.billing_frequency, rule.billing_day_of_week, rule.billing_day_of_month)
        })
        .eq('id', ruleId)

    } catch (error) {
      result.errors.push(`Rule processing error: ${error}`)
    }

    return result
  }

  // ===== BILLING INTEGRATION =====

  async integrateWithCaseBilling(
    timeEntries: TimeEntry[],
    caseBillingMethodId: string
  ): Promise<CaseBillingCalculationResult> {
    // Get case billing method
    const { data: billingMethod, error } = await this.supabase
      .from('case_billing_methods')
      .select('*')
      .eq('id', caseBillingMethodId)
      .single()

    if (error) throw error

    const timeBasedCalculation = await this.calculateTimeBasedBilling(timeEntries, {
      matter_id: billingMethod.matter_id,
      apply_discounts: true
    })

    // Integrate time-based calculation with case billing
    const totalTimeHours = timeBasedCalculation.total_billable_hours
    const timeBasedAmount = timeBasedCalculation.total_billable_amount

    // Determine final billing method
    let finalAmount = timeBasedAmount
    let billingBreakdown: BillingCalculationBreakdown

    if (billingMethod.billing_type === 'hourly') {
      // Use time entries directly
      finalAmount = timeBasedAmount
      billingBreakdown = {
        base_calculation: {
          method: 'hourly',
          rate: billingMethod.hourly_rate,
          hours: totalTimeHours,
          calculated_amount: timeBasedAmount
        },
        minimum_fee_check: {
          required_minimum: billingMethod.minimum_fee,
          calculated_amount: timeBasedAmount,
          minimum_applied: timeBasedAmount < billingMethod.minimum_fee,
          final_base_amount: Math.max(timeBasedAmount, billingMethod.minimum_fee)
        }
      }
    } else {
      // For percentage/fixed billing, time entries are informational
      const baseAmount = billingMethod.billing_type === 'fixed' 
        ? billingMethod.fixed_amount || 0
        : 0 // Percentage would be calculated elsewhere

      billingBreakdown = {
        base_calculation: {
          method: billingMethod.billing_type,
          calculated_amount: baseAmount
        },
        minimum_fee_check: {
          required_minimum: billingMethod.minimum_fee,
          calculated_amount: baseAmount,
          minimum_applied: baseAmount < billingMethod.minimum_fee,
          final_base_amount: Math.max(baseAmount, billingMethod.minimum_fee)
        }
      }
      
      finalAmount = Math.max(baseAmount, billingMethod.minimum_fee)
    }

    return {
      matter_id: billingMethod.matter_id,
      billing_method: billingMethod.billing_type,
      base_amount: finalAmount,
      minimum_fee_applied: finalAmount === billingMethod.minimum_fee,
      minimum_fee_amount: billingMethod.minimum_fee,
      success_fee_eligible: false,
      success_fee_amount: 0,
      discount_eligible: false,
      original_total: finalAmount,
      discount_amount: 0,
      subtotal: finalAmount,
      total_amount: finalAmount,
      calculation_breakdown: billingBreakdown,
      is_valid: true,
      validation_errors: [],
      warnings: []
    }
  }

  // ===== UTILITY METHODS =====

  private createEmptyBillingCalculation(context: any): TimeBasedBillingCalculation {
    return {
      matter_id: context.matter_id,
      client_subscription_id: context.client_subscription_id,
      time_entries: [],
      total_billable_hours: 0,
      total_billable_amount: 0,
      rate_breakdown: [],
      subtotal: 0,
      total_amount: 0
    }
  }

  private groupEntriesByRate(entries: TimeEntry[]): Array<{
    rate: number
    hours: number
    amount: number
    description: string
  }> {
    const groups = entries.reduce((acc, entry) => {
      const rate = entry.billable_rate || 0
      if (!acc[rate]) {
        acc[rate] = { rate, hours: 0, amount: 0, description: `Taxa R$ ${rate.toFixed(0)}/hora` }
      }
      acc[rate].hours += entry.effective_minutes / 60
      acc[rate].amount += entry.billable_amount
      return acc
    }, {} as Record<number, any>)

    return Object.values(groups)
  }

  private generateLineItemsFromTimeEntries(calculation: TimeBasedBillingCalculation): any[] {
    return calculation.rate_breakdown.map(breakdown => ({
      description: breakdown.description,
      quantity: breakdown.hours,
      unit_price: breakdown.rate,
      total_amount: breakdown.amount,
      item_type: 'time_entry'
    }))
  }

  private async markTimeEntriesAsBilled(timeEntryIds: string[], invoiceId: string): Promise<void> {
    await this.supabase
      .from('time_entries')
      .update({
        entry_status: 'billed',
        invoice_id: invoiceId,
        billed_at: new Date().toISOString()
      })
      .in('id', timeEntryIds)
  }

  private async sendInvoice(invoiceId: string): Promise<void> {
    await this.supabase
      .from('invoices')
      .update({
        status: 'sent',
        sent_date: new Date().toISOString()
      })
      .eq('id', invoiceId)
  }

  private calculateNextRun(
    frequency: 'daily' | 'weekly' | 'monthly',
    dayOfWeek?: number,
    dayOfMonth?: number
  ): string {
    const now = new Date()
    const nextRun = new Date(now)

    switch (frequency) {
      case 'daily':
        nextRun.setDate(now.getDate() + 1)
        break
      case 'weekly':
        const daysUntilNext = ((dayOfWeek || 1) - now.getDay() + 7) % 7
        nextRun.setDate(now.getDate() + (daysUntilNext || 7))
        break
      case 'monthly':
        nextRun.setMonth(now.getMonth() + 1)
        nextRun.setDate(dayOfMonth || 1)
        break
    }

    return nextRun.toISOString()
  }

  private async getPendingTimeEntriesForBilling(rule: AutomatedBillingRule): Promise<TimeEntry[]> {
    const filters = {
      entry_status: 'approved' as const,
      start_date: rule.last_run || undefined,
      end_date: new Date().toISOString().split('T')[0]
    }

    if (rule.auto_bill_case_time && !rule.auto_bill_subscription_time) {
      filters['entry_type'] = 'case_work'
    } else if (rule.auto_bill_subscription_time && !rule.auto_bill_case_time) {
      filters['entry_type'] = 'subscription_work'
    }

    return await timeTrackingService.getTimeEntries(filters)
  }

  private groupTimeEntriesForBilling(entries: TimeEntry[]): Array<{
    client_id: string
    matter_id?: string
    client_subscription_id?: string
    entries: TimeEntry[]
  }> {
    const groups = entries.reduce((acc, entry) => {
      const key = `${entry.client_id || 'unknown'}-${entry.matter_id || ''}-${entry.client_subscription_id || ''}`
      if (!acc[key]) {
        acc[key] = {
          client_id: entry.client_id || '',
          matter_id: entry.matter_id,
          client_subscription_id: entry.client_subscription_id,
          entries: []
        }
      }
      acc[key].entries.push(entry)
      return acc
    }, {} as Record<string, any>)

    return Object.values(groups)
  }
}

// Export singleton instance
export const timeBasedBillingService = new TimeBasedBillingService()
export default timeBasedBillingService