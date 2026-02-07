// =====================================================
// SUBSCRIPTION SERVICE LAYER
// Real Supabase Integration for Legal-as-a-Service Platform
// =====================================================

import { createClient } from '@/lib/supabase/client'
import { discountService } from './discount-service'
import {
  SubscriptionPlan,
  ClientSubscription,
  SubscriptionUsage,
  PlanFormData,
  SubscriptionFormData,
  SubscriptionMetrics,
  ClientSubscriptionSummary,
  MRRAnalytics,
  ServiceType,
} from './subscription-types'

export class SubscriptionService {
  private supabase = createClient()

  // =====================================================
  // SUBSCRIPTION PLAN MANAGEMENT
  // =====================================================

  /**
   * Get all subscription plans for a law firm
   */
  async getSubscriptionPlans(lawFirmId: string): Promise<SubscriptionPlan[]> {
    try {
      const { data, error } = await this.supabase
        .from('subscription_plans')
        .select('*')
        .eq('law_firm_id', lawFirmId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) {
        console.error('Error fetching subscription plans:', error)
        throw new Error('Failed to fetch subscription plans')
      }

      return data || []
    } catch (error) {
      console.error('Error fetching subscription plans:', error)
      throw error
    }
  }

  /**
   * Create a new subscription plan
   */
  async createSubscriptionPlan(lawFirmId: string, planData: PlanFormData): Promise<SubscriptionPlan> {
    try {
      // Validate plan data
      this.validatePlanData(planData)

      const { data: newPlan, error } = await this.supabase
        .from('subscription_plans')
        .insert({
          law_firm_id: lawFirmId,
          ...planData,
          sort_order: 999,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error || !newPlan) {
        console.error('Error creating subscription plan:', error)
        throw new Error('Failed to create subscription plan in database')
      }

      return newPlan
    } catch (error) {
      console.error('Error creating subscription plan:', error)
      throw error
    }
  }

  /**
   * Update an existing subscription plan
   */
  async updateSubscriptionPlan(planId: string, planData: Partial<PlanFormData>): Promise<SubscriptionPlan> {
    try {
      const { data: updatedPlan, error } = await this.supabase
        .from('subscription_plans')
        .update({
          ...planData,
          updated_at: new Date().toISOString()
        })
        .eq('id', planId)
        .select()
        .single()

      if (error || !updatedPlan) {
        console.error('Error updating subscription plan:', error)
        throw new Error('Failed to update subscription plan')
      }

      return updatedPlan
    } catch (error) {
      console.error('Error updating subscription plan:', error)
      throw error
    }
  }

  /**
   * Delete a subscription plan (soft-delete)
   */
  async deleteSubscriptionPlan(planId: string): Promise<void> {
    try {
      // Check if plan has active subscriptions
      const { data: activeSubscriptions } = await this.supabase
        .from('client_subscriptions')
        .select('id')
        .eq('subscription_plan_id', planId)
        .in('status', ['active', 'trial'])

      if (activeSubscriptions && activeSubscriptions.length > 0) {
        throw new Error('Cannot delete plan with active subscriptions')
      }

      // Soft delete
      const { error } = await this.supabase
        .from('subscription_plans')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', planId)

      if (error) {
        console.error('Error deleting subscription plan:', error)
        throw new Error('Failed to delete subscription plan')
      }
    } catch (error) {
      console.error('Error deleting subscription plan:', error)
      throw error
    }
  }

  // =====================================================
  // CLIENT SUBSCRIPTION MANAGEMENT
  // =====================================================

  /**
   * Get all client subscriptions for a law firm
   */
  async getClientSubscriptions(lawFirmId: string): Promise<ClientSubscription[]> {
    try {
      const { data, error } = await this.supabase
        .from('client_subscriptions')
        .select(`
          *,
          contacts (
            id,
            full_name,
            email,
            cpf_cnpj
          ),
          subscription_plans (
            id,
            plan_name,
            plan_type,
            monthly_fee,
            yearly_fee
          )
        `)
        .eq('law_firm_id', lawFirmId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching client subscriptions:', error)
        throw new Error('Failed to fetch client subscriptions')
      }

      return data || []
    } catch (error) {
      console.error('Error fetching client subscriptions:', error)
      throw error
    }
  }

  /**
   * Create a new client subscription
   */
  async createClientSubscription(subscriptionData: SubscriptionFormData): Promise<ClientSubscription> {
    try {
      const { data: newSubscription, error } = await this.supabase
        .from('client_subscriptions')
        .insert({
          ...subscriptionData,
          status: subscriptionData.trial_end_date ? 'trial' : 'active',
          current_period_start: subscriptionData.start_date,
          current_period_end: this.calculatePeriodEnd(subscriptionData.start_date, subscriptionData.billing_cycle),
          next_billing_date: this.calculateNextBillingDate(subscriptionData.start_date, subscriptionData.billing_cycle),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error || !newSubscription) {
        console.error('Error creating client subscription:', error)
        throw new Error('Failed to create client subscription')
      }

      return newSubscription
    } catch (error) {
      console.error('Error creating client subscription:', error)
      throw error
    }
  }

  /**
   * Cancel a client subscription
   */
  async cancelClientSubscription(subscriptionId: string, reason?: string): Promise<ClientSubscription> {
    try {
      const { data: cancelledSubscription, error } = await this.supabase
        .from('client_subscriptions')
        .update({
          status: 'cancelled',
          auto_renew: false,
          end_date: new Date().toISOString().split('T')[0],
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)
        .select()
        .single()

      if (error || !cancelledSubscription) {
        console.error('Error cancelling subscription:', error)
        throw new Error('Failed to cancel subscription')
      }

      return cancelledSubscription
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      throw error
    }
  }

  // =====================================================
  // SERVICE USAGE TRACKING
  // =====================================================

  /**
   * Track service usage for a subscription
   * NOTE: subscription_usage table does not exist yet
   */
  async trackServiceUsage(
    subscriptionId: string,
    serviceType: ServiceType,
    quantity: number,
    description?: string,
    matterId?: string,
    staffUserId?: string
  ): Promise<SubscriptionUsage> {
    // TODO: Implement when subscription_usage table is created
    return {
      id: `usage-placeholder-${Date.now()}`,
      client_subscription_id: subscriptionId,
      service_type: serviceType,
      usage_date: new Date().toISOString().split('T')[0],
      quantity_used: quantity,
      unit_type: this.getUnitTypeForService(serviceType),
      included_in_plan: true,
      overage_amount: 0,
      description,
      matter_id: matterId,
      staff_user_id: staffUserId,
      created_at: new Date().toISOString()
    }
  }

  /**
   * Get usage summary for a subscription
   * NOTE: subscription_usage table does not exist yet
   */
  async getUsageSummary(subscriptionId: string, month?: string): Promise<{
    subscription_id: string
    month: string
    hours_used: number
    hours_remaining: number
    documents_reviewed: number
    documents_remaining: number
    support_tickets: number
    overage_charges: number
  }> {
    // TODO: Implement when subscription_usage table is created
    const targetMonth = month || new Date().toISOString().slice(0, 7)
    return {
      subscription_id: subscriptionId,
      month: targetMonth,
      hours_used: 0,
      hours_remaining: 0,
      documents_reviewed: 0,
      documents_remaining: 0,
      support_tickets: 0,
      overage_charges: 0
    }
  }

  // =====================================================
  // ANALYTICS AND METRICS
  // =====================================================

  /**
   * Get subscription metrics for a law firm (computed inline, no view)
   */
  async getSubscriptionMetrics(lawFirmId: string): Promise<SubscriptionMetrics> {
    try {
      // Fetch plans
      const { data: plans, error: plansError } = await this.supabase
        .from('subscription_plans')
        .select('id, monthly_fee, is_active, is_featured')
        .eq('law_firm_id', lawFirmId)

      if (plansError) {
        console.error('Error fetching plans for metrics:', plansError)
        throw new Error('Failed to fetch subscription metrics')
      }

      // Fetch subscriptions
      const { data: subscriptions, error: subsError } = await this.supabase
        .from('client_subscriptions')
        .select('id, status, current_fee')
        .eq('law_firm_id', lawFirmId)

      if (subsError) {
        console.error('Error fetching subscriptions for metrics:', subsError)
        throw new Error('Failed to fetch subscription metrics')
      }

      const allPlans = plans || []
      const allSubs = subscriptions || []

      const activePlans = allPlans.filter(p => p.is_active)
      const featuredPlans = allPlans.filter(p => p.is_featured)
      const activeSubs = allSubs.filter(s => s.status === 'active')
      const trialSubs = allSubs.filter(s => s.status === 'trial')
      const cancelledSubs = allSubs.filter(s => s.status === 'cancelled')

      const totalMonthlyFees = activePlans.reduce((sum, p) => sum + (p.monthly_fee || 0), 0)
      const avgMonthlyPrice = activePlans.length > 0 ? totalMonthlyFees / activePlans.length : 0

      const mrr = activeSubs.reduce((sum, s) => sum + (s.current_fee || 0), 0)
      const arr = mrr * 12

      const totalEverSubscribed = allSubs.length
      const churnRate = totalEverSubscribed > 0
        ? Math.round((cancelledSubs.length / totalEverSubscribed) * 1000) / 10
        : 0

      return {
        total_plans: allPlans.length,
        active_plans: activePlans.length,
        featured_plans: featuredPlans.length,
        average_monthly_price: Math.round(avgMonthlyPrice * 100) / 100,
        total_subscribers: allSubs.length,
        active_subscribers: activeSubs.length,
        trial_subscribers: trialSubs.length,
        churned_subscribers: cancelledSubs.length,
        monthly_recurring_revenue: Math.round(mrr * 100) / 100,
        annual_recurring_revenue: Math.round(arr * 100) / 100,
        churn_rate: churnRate,
        growth_rate: 0 // Would need historical data to compute
      }
    } catch (error) {
      console.error('Error getting subscription metrics:', error)
      throw error
    }
  }

  /**
   * Get Monthly Recurring Revenue analytics (computed inline, no view)
   */
  async getMRRAnalytics(lawFirmId: string, _months: number = 12): Promise<MRRAnalytics[]> {
    try {
      const { data: subscriptions, error } = await this.supabase
        .from('client_subscriptions')
        .select('id, status, current_fee, created_at')
        .eq('law_firm_id', lawFirmId)
        .in('status', ['active', 'trial'])

      if (error) {
        console.error('Error fetching subscriptions for MRR:', error)
        throw new Error('Failed to get MRR analytics')
      }

      const allSubs = subscriptions || []

      // Build a single entry for the current month based on active subscriptions
      const now = new Date()
      const currentMonth = now.toISOString().slice(0, 7)

      const activeSubs = allSubs.filter(s => s.status === 'active')
      const trialSubs = allSubs.filter(s => s.status === 'trial')
      const mrr = activeSubs.reduce((sum, s) => sum + (s.current_fee || 0), 0)
      const arpu = activeSubs.length > 0 ? mrr / activeSubs.length : 0

      // Return one entry for the current month (real data only)
      const result: MRRAnalytics[] = [{
        law_firm_id: lawFirmId,
        month: currentMonth,
        active_subscriptions: activeSubs.length + trialSubs.length,
        monthly_recurring_revenue: Math.round(mrr * 100) / 100,
        average_revenue_per_user: Math.round(arpu * 100) / 100,
        trial_subscriptions: trialSubs.length,
        paid_subscriptions: activeSubs.length
      }]

      return result
    } catch (error) {
      console.error('Error getting MRR analytics:', error)
      throw error
    }
  }

  /**
   * Get client subscription summary
   */
  async getClientSubscriptionSummary(clientId: string): Promise<ClientSubscriptionSummary | null> {
    try {
      // Get the client's active subscription with plan details
      const { data: subscription, error: subError } = await this.supabase
        .from('client_subscriptions')
        .select(`
          *,
          subscription_plans (*),
          contacts (
            id,
            full_name,
            email
          )
        `)
        .eq('client_id', clientId)
        .in('status', ['active', 'trial'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (subError) {
        console.error('Error fetching client subscription summary:', subError)
        throw new Error('Failed to get client subscription summary')
      }

      if (!subscription) {
        return null
      }

      const plan: SubscriptionPlan = subscription.subscription_plans
      const contactName = subscription.contacts?.full_name || 'Cliente'

      const usageSummary = await this.getUsageSummary(subscription.id)

      return {
        client_id: clientId,
        client_name: contactName,
        subscription_plan: plan,
        subscription: {
          id: subscription.id,
          client_id: subscription.client_id,
          law_firm_id: subscription.law_firm_id,
          subscription_plan_id: subscription.subscription_plan_id,
          status: subscription.status,
          billing_cycle: subscription.billing_cycle,
          auto_renew: subscription.auto_renew,
          start_date: subscription.start_date,
          end_date: subscription.end_date,
          trial_end_date: subscription.trial_end_date,
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end,
          next_billing_date: subscription.next_billing_date,
          cancelled_at: subscription.cancelled_at,
          stripe_subscription_id: subscription.stripe_subscription_id,
          stripe_customer_id: subscription.stripe_customer_id,
          monthly_fee: subscription.monthly_fee,
          yearly_fee: subscription.yearly_fee,
          current_fee: subscription.current_fee,
          notes: subscription.notes,
          cancellation_reason: subscription.cancellation_reason,
          created_at: subscription.created_at,
          updated_at: subscription.updated_at
        },
        current_usage: [],
        usage_summary: {
          hours_used: usageSummary.hours_used,
          hours_remaining: usageSummary.hours_remaining,
          documents_reviewed: usageSummary.documents_reviewed,
          documents_remaining: usageSummary.documents_remaining,
          overage_charges: usageSummary.overage_charges
        },
        next_invoice: {
          amount: subscription.current_fee || 0,
          due_date: subscription.next_billing_date || ''
        }
      }
    } catch (error) {
      console.error('Error getting client subscription summary:', error)
      throw error
    }
  }

  /**
   * Check if a subscription is eligible for a specific discount
   * Delegates to the existing discountService
   */
  async checkDiscountEligibility(
    subscriptionId: string,
    _caseType: string,
    caseValue: number
  ): Promise<{ eligible: boolean; discount_percentage: number; max_discount: number }> {
    try {
      // Get the subscription to find the law_firm_id
      const { data: subscription, error } = await this.supabase
        .from('client_subscriptions')
        .select('law_firm_id')
        .eq('id', subscriptionId)
        .single()

      if (error || !subscription) {
        return { eligible: false, discount_percentage: 0, max_discount: 0 }
      }

      // Get discount rules for the law firm
      const rules = await discountService.getDiscountRules(subscription.law_firm_id)

      // Find first applicable active rule whose min_case_value threshold is met
      const applicableRule = rules.find(r =>
        r.is_active &&
        (r.discount_config.min_case_value ?? 0) <= caseValue &&
        r.discount_config.value > 0
      )

      if (!applicableRule) {
        return { eligible: false, discount_percentage: 0, max_discount: 0 }
      }

      const config = applicableRule.discount_config
      const discountPct = config.discount_type === 'percentage' ? config.value : 0
      const maxDiscount = config.max_discount_amount
        ? Math.min(config.max_discount_amount, caseValue * (discountPct / 100))
        : caseValue * (discountPct / 100)

      return {
        eligible: true,
        discount_percentage: discountPct,
        max_discount: Math.round(maxDiscount * 100) / 100
      }
    } catch (error) {
      console.error('Error checking discount eligibility:', error)
      return { eligible: false, discount_percentage: 0, max_discount: 0 }
    }
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  private validatePlanData(planData: PlanFormData): void {
    if (!planData.plan_name || planData.plan_name.length < 3) {
      throw new Error('Plan name must be at least 3 characters long')
    }

    if (planData.monthly_fee < 0) {
      throw new Error('Monthly fee cannot be negative')
    }

    if (planData.yearly_fee < 0) {
      throw new Error('Yearly fee cannot be negative')
    }

    if (planData.trial_period_days < 0 || planData.trial_period_days > 365) {
      throw new Error('Trial period must be between 0 and 365 days')
    }
  }

  private calculatePeriodEnd(startDate: string, billingCycle: 'monthly' | 'yearly'): string {
    const date = new Date(startDate)

    if (billingCycle === 'monthly') {
      date.setMonth(date.getMonth() + 1)
    } else {
      date.setFullYear(date.getFullYear() + 1)
    }

    return date.toISOString().split('T')[0]
  }

  private calculateNextBillingDate(startDate: string, billingCycle: 'monthly' | 'yearly'): string {
    return this.calculatePeriodEnd(startDate, billingCycle)
  }

  private getUnitTypeForService(serviceType: ServiceType): 'hours' | 'documents' | 'calls' | 'tickets' | 'each' {
    switch (serviceType) {
      case 'consultation_hours':
        return 'hours'
      case 'document_reviews':
      case 'document_review':
      case 'contract_review':
        return 'documents'
      case 'phone_calls':
      case 'phone_support':
        return 'calls'
      case 'support_tickets':
        return 'tickets'
      default:
        return 'each'
    }
  }

  /**
   * Format currency for Brazilian market
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  /**
   * Calculate yearly discount percentage
   */
  calculateYearlyDiscount(monthlyFee: number, yearlyFee: number): number {
    if (monthlyFee <= 0 || yearlyFee <= 0) return 0

    const annualMonthly = monthlyFee * 12
    return Math.round(((annualMonthly - yearlyFee) / annualMonthly) * 100)
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService()
