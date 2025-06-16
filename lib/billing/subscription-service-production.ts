// =====================================================
// PRODUCTION SUBSCRIPTION SERVICE LAYER
// Real Supabase Integration for Legal-as-a-Service Platform
// =====================================================

import { createClient } from '@/lib/supabase/client'
import { stripeService } from '@/lib/stripe/server'
import { 
  SubscriptionPlan, 
  ClientSubscription, 
  SubscriptionUsage, 
  SubscriptionInvoice,
  PlanFormData,
  SubscriptionFormData,
  SubscriptionMetrics,
  ClientSubscriptionSummary,
  MRRAnalytics,
  SubscriptionError,
  PlanType,
  ServiceType,
  SubscriptionStatus
} from './subscription-types'

export class ProductionSubscriptionService {
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
      
      // Start transaction - first create in Supabase
      const { data: newPlan, error: dbError } = await this.supabase
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
      
      if (dbError || !newPlan) {
        console.error('Error creating subscription plan:', dbError)
        throw new Error('Failed to create subscription plan in database')
      }
      
      // Create Stripe product and prices
      try {
        const stripeData = await stripeService.createSubscriptionPlan({
          name: planData.plan_name,
          description: planData.description,
          monthly_amount: planData.monthly_fee,
          yearly_amount: planData.yearly_fee || undefined,
          law_firm_id: lawFirmId,
          plan_id: newPlan.id
        })
        
        // Update plan with Stripe IDs
        const { error: updateError } = await this.supabase
          .from('subscription_plans')
          .update({
            stripe_product_id: stripeData.product.id,
            stripe_monthly_price_id: stripeData.monthly_price.id,
            stripe_yearly_price_id: stripeData.yearly_price?.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', newPlan.id)
        
        if (updateError) {
          console.error('Error updating plan with Stripe IDs:', updateError)
        }
        
      } catch (stripeError) {
        console.error('Error creating Stripe product:', stripeError)
        // Plan created in DB but Stripe failed - should be handled gracefully
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
   * Delete a subscription plan
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
   * Get all client subscriptions
   */
  async getClientSubscriptions(lawFirmId: string): Promise<ClientSubscription[]> {
    try {
      const { data, error } = await this.supabase
        .from('client_subscriptions')
        .select(`
          *,
          clients (
            id,
            name,
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
      // Get subscription details
      const { data: subscription } = await this.supabase
        .from('client_subscriptions')
        .select('stripe_subscription_id')
        .eq('id', subscriptionId)
        .single()
      
      // Cancel in Stripe if exists
      if (subscription?.stripe_subscription_id) {
        try {
          await stripeService.cancelSubscription(subscription.stripe_subscription_id)
        } catch (stripeError) {
          console.error('Error cancelling Stripe subscription:', stripeError)
        }
      }
      
      // Update in database
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
   */
  async trackServiceUsage(
    subscriptionId: string, 
    serviceType: ServiceType, 
    quantity: number,
    description?: string,
    matterId?: string,
    staffUserId?: string
  ): Promise<SubscriptionUsage> {
    try {
      const { data: usage, error } = await this.supabase
        .from('subscription_usage')
        .insert({
          client_subscription_id: subscriptionId,
          service_type: serviceType,
          usage_date: new Date().toISOString().split('T')[0],
          quantity_used: quantity,
          unit_type: this.getUnitTypeForService(serviceType),
          included_in_plan: true, // Will be calculated by trigger
          overage_amount: 0, // Will be calculated by trigger
          description,
          matter_id: matterId,
          staff_user_id: staffUserId,
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error || !usage) {
        console.error('Error tracking service usage:', error)
        throw new Error('Failed to track service usage')
      }
      
      return usage
    } catch (error) {
      console.error('Error tracking service usage:', error)
      throw error
    }
  }
  
  /**
   * Get usage summary for a subscription
   */
  async getUsageSummary(subscriptionId: string, month?: string): Promise<any> {
    try {
      const targetMonth = month || new Date().toISOString().slice(0, 7)
      
      const { data, error } = await this.supabase
        .from('subscription_usage_summary')
        .select('*')
        .eq('subscription_id', subscriptionId)
        .eq('month', targetMonth)
        .single()
      
      if (error && error.code !== 'PGRST116') { // Not found is OK
        console.error('Error getting usage summary:', error)
        throw new Error('Failed to get usage summary')
      }
      
      return data || {
        subscription_id: subscriptionId,
        month: targetMonth,
        hours_used: 0,
        hours_remaining: 0,
        documents_reviewed: 0,
        documents_remaining: 0,
        support_tickets: 0,
        overage_charges: 0
      }
    } catch (error) {
      console.error('Error getting usage summary:', error)
      throw error
    }
  }
  
  // =====================================================
  // ANALYTICS AND METRICS
  // =====================================================
  
  /**
   * Get subscription metrics for a law firm
   */
  async getSubscriptionMetrics(lawFirmId: string): Promise<SubscriptionMetrics> {
    try {
      const { data, error } = await this.supabase
        .from('subscription_metrics_view')
        .select('*')
        .eq('law_firm_id', lawFirmId)
        .single()
      
      if (error) {
        console.error('Error getting subscription metrics:', error)
        throw new Error('Failed to get subscription metrics')
      }
      
      return data
    } catch (error) {
      console.error('Error getting subscription metrics:', error)
      throw error
    }
  }
  
  /**
   * Get Monthly Recurring Revenue analytics
   */
  async getMRRAnalytics(lawFirmId: string, months: number = 12): Promise<MRRAnalytics[]> {
    try {
      const { data, error } = await this.supabase
        .from('mrr_analytics')
        .select('*')
        .eq('law_firm_id', lawFirmId)
        .order('month', { ascending: false })
        .limit(months)
      
      if (error) {
        console.error('Error getting MRR analytics:', error)
        throw new Error('Failed to get MRR analytics')
      }
      
      return data || []
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
      const { data, error } = await this.supabase
        .from('client_subscription_summary_view')
        .select('*')
        .eq('client_id', clientId)
        .single()
      
      if (error && error.code !== 'PGRST116') { // Not found is OK
        console.error('Error getting client subscription summary:', error)
        throw new Error('Failed to get client subscription summary')
      }
      
      return data || null
    } catch (error) {
      console.error('Error getting client subscription summary:', error)
      throw error
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
  
  /**
   * Check if a subscription is eligible for a specific discount
   */
  async checkDiscountEligibility(
    subscriptionId: string, 
    caseType: string, 
    caseValue: number
  ): Promise<{ eligible: boolean; discount_percentage: number; max_discount: number }> {
    try {
      const { data, error } = await this.supabase
        .from('discount_eligibility_view')
        .select('*')
        .eq('subscription_id', subscriptionId)
        .eq('case_type', caseType)
        .single()
      
      if (error || !data) {
        return { eligible: false, discount_percentage: 0, max_discount: 0 }
      }
      
      return {
        eligible: data.eligible,
        discount_percentage: data.discount_percentage,
        max_discount: Math.min(data.max_discount_amount, caseValue * (data.discount_percentage / 100))
      }
    } catch (error) {
      console.error('Error checking discount eligibility:', error)
      return { eligible: false, discount_percentage: 0, max_discount: 0 }
    }
  }
}

// Export singleton instance
export const productionSubscriptionService = new ProductionSubscriptionService()