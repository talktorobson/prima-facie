// =====================================================
// SUBSCRIPTION SERVICE LAYER
// Legal-as-a-Service Platform Business Logic
// =====================================================

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

export class SubscriptionService {
  
  // =====================================================
  // SUBSCRIPTION PLAN MANAGEMENT
  // =====================================================
  
  /**
   * Get all subscription plans for a law firm
   */
  async getSubscriptionPlans(lawFirmId: string): Promise<SubscriptionPlan[]> {
    try {
      // In production, this would query Supabase
      // For now, return mock data with realistic Brazilian legal services
      const mockPlans: SubscriptionPlan[] = [
        {
          id: '1',
          law_firm_id: lawFirmId,
          plan_name: 'Trabalhista Básico',
          plan_type: 'labor',
          description: 'Consultoria mensal básica em direito trabalhista para pequenas empresas',
          monthly_fee: 299.00,
          yearly_fee: 2990.00,
          setup_fee: 0,
          services_included: ['compliance_review', 'email_support', 'document_review'],
          max_monthly_hours: 2,
          max_document_reviews: 5,
          support_level: 'email',
          billing_interval: 'monthly',
          trial_period_days: 14,
          is_active: true,
          is_featured: false,
          sort_order: 1,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        },
        {
          id: '2',
          law_firm_id: lawFirmId,
          plan_name: 'Trabalhista Premium',
          plan_type: 'labor',
          description: 'Consultoria completa em direito trabalhista com suporte prioritário',
          monthly_fee: 599.00,
          yearly_fee: 5990.00,
          setup_fee: 100.00,
          services_included: ['compliance_review', 'phone_support', 'document_review', 'regulatory_alerts', 'priority_support'],
          max_monthly_hours: 8,
          max_document_reviews: 20,
          support_level: 'priority',
          billing_interval: 'monthly',
          trial_period_days: 30,
          is_active: true,
          is_featured: true,
          sort_order: 2,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        },
        {
          id: '3',
          law_firm_id: lawFirmId,
          plan_name: 'Empresarial Enterprise',
          plan_type: 'corporate',
          description: 'Consultoria jurídica completa para grandes empresas com advogado dedicado',
          monthly_fee: 1299.00,
          yearly_fee: 12990.00,
          setup_fee: 500.00,
          services_included: ['dedicated_lawyer', 'unlimited_hours', 'contract_review', '24_7_support', 'board_support'],
          max_monthly_hours: 0, // unlimited
          max_document_reviews: 0, // unlimited
          support_level: '24_7',
          billing_interval: 'monthly',
          trial_period_days: 30,
          is_active: true,
          is_featured: true,
          sort_order: 3,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        }
      ]
      
      return mockPlans
    } catch (error) {
      console.error('Error fetching subscription plans:', error)
      throw new Error('Failed to fetch subscription plans')
    }
  }
  
  /**
   * Create a new subscription plan
   */
  async createSubscriptionPlan(lawFirmId: string, planData: PlanFormData): Promise<SubscriptionPlan> {
    try {
      // Validate plan data
      this.validatePlanData(planData)
      
      const newPlan: SubscriptionPlan = {
        id: `plan-${Date.now()}`,
        law_firm_id: lawFirmId,
        ...planData,
        sort_order: 999, // Will be updated based on existing plans
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // In production, save to Supabase
      console.log('Creating subscription plan:', newPlan)
      
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
      // In production, update in Supabase
      const updatedPlan: SubscriptionPlan = {
        id: planId,
        law_firm_id: 'firm-1', // This would come from the existing plan
        plan_name: planData.plan_name || '',
        plan_type: planData.plan_type || 'general',
        description: planData.description || '',
        monthly_fee: planData.monthly_fee || 0,
        yearly_fee: planData.yearly_fee || 0,
        setup_fee: planData.setup_fee || 0,
        services_included: planData.services_included || [],
        max_monthly_hours: planData.max_monthly_hours || 0,
        max_document_reviews: planData.max_document_reviews || 0,
        support_level: planData.support_level || 'email',
        billing_interval: planData.billing_interval || 'monthly',
        trial_period_days: planData.trial_period_days || 0,
        is_active: planData.is_active ?? true,
        is_featured: planData.is_featured ?? false,
        sort_order: 1,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: new Date().toISOString()
      }
      
      console.log('Updating subscription plan:', updatedPlan)
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
      const activeSubscriptions = await this.getActiveSubscriptionsForPlan(planId)
      
      if (activeSubscriptions.length > 0) {
        throw new Error('Cannot delete plan with active subscriptions')
      }
      
      // In production, soft delete in Supabase
      console.log('Deleting subscription plan:', planId)
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
      // Mock data for development
      const mockSubscriptions: ClientSubscription[] = [
        {
          id: 'sub-1',
          client_id: 'client-1',
          subscription_plan_id: '1',
          status: 'active',
          billing_cycle: 'monthly',
          auto_renew: true,
          start_date: '2024-01-01',
          current_period_start: '2024-01-01',
          current_period_end: '2024-01-31',
          next_billing_date: '2024-02-01',
          monthly_fee: 299.00,
          yearly_fee: 2990.00,
          current_fee: 299.00,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]
      
      return mockSubscriptions
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
      const newSubscription: ClientSubscription = {
        id: `sub-${Date.now()}`,
        ...subscriptionData,
        status: subscriptionData.trial_end_date ? 'trial' : 'active',
        current_period_start: subscriptionData.start_date,
        current_period_end: this.calculatePeriodEnd(subscriptionData.start_date, subscriptionData.billing_cycle),
        next_billing_date: this.calculateNextBillingDate(subscriptionData.start_date, subscriptionData.billing_cycle),
        monthly_fee: 0, // Will be set based on plan
        yearly_fee: 0, // Will be set based on plan
        current_fee: 0, // Will be calculated
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      console.log('Creating client subscription:', newSubscription)
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
      // In production, update in Supabase
      const cancelledSubscription: ClientSubscription = {
        id: subscriptionId,
        client_id: 'client-1',
        subscription_plan_id: '1',
        status: 'cancelled',
        billing_cycle: 'monthly',
        auto_renew: false,
        start_date: '2024-01-01',
        end_date: new Date().toISOString().split('T')[0],
        current_period_start: '2024-01-01',
        current_period_end: '2024-01-31',
        next_billing_date: '2024-02-01',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
        monthly_fee: 299.00,
        yearly_fee: 2990.00,
        current_fee: 299.00,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: new Date().toISOString()
      }
      
      console.log('Cancelling subscription:', cancelledSubscription)
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
      const usage: SubscriptionUsage = {
        id: `usage-${Date.now()}`,
        client_subscription_id: subscriptionId,
        service_type: serviceType,
        usage_date: new Date().toISOString().split('T')[0],
        quantity_used: quantity,
        unit_type: this.getUnitTypeForService(serviceType),
        included_in_plan: true, // Will be calculated based on plan limits
        overage_amount: 0, // Will be calculated if exceeds limits
        description,
        matter_id: matterId,
        staff_user_id: staffUserId,
        created_at: new Date().toISOString()
      }
      
      console.log('Tracking service usage:', usage)
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
      // In production, query usage data from Supabase
      const mockUsageSummary = {
        subscription_id: subscriptionId,
        month: month || new Date().toISOString().slice(0, 7),
        hours_used: 5.5,
        hours_remaining: 2.5,
        documents_reviewed: 12,
        documents_remaining: 8,
        support_tickets: 3,
        overage_charges: 50.00
      }
      
      return mockUsageSummary
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
      // In production, calculate from database
      const mockMetrics: SubscriptionMetrics = {
        total_plans: 4,
        active_plans: 3,
        featured_plans: 2,
        average_monthly_price: 732.33,
        total_subscribers: 25,
        active_subscribers: 22,
        trial_subscribers: 3,
        churned_subscribers: 2,
        monthly_recurring_revenue: 16110.00,
        annual_recurring_revenue: 193320.00,
        churn_rate: 8.3,
        growth_rate: 12.5
      }
      
      return mockMetrics
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
      // In production, query from the mrr_analytics view
      const mockMRR: MRRAnalytics[] = []
      
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        
        mockMRR.push({
          law_firm_id: lawFirmId,
          month: date.toISOString().slice(0, 7),
          active_subscriptions: 20 + Math.floor(Math.random() * 10),
          monthly_recurring_revenue: 15000 + Math.floor(Math.random() * 5000),
          average_revenue_per_user: 700 + Math.floor(Math.random() * 200),
          trial_subscriptions: Math.floor(Math.random() * 5),
          paid_subscriptions: 20 + Math.floor(Math.random() * 8)
        })
      }
      
      return mockMRR
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
      // In production, query comprehensive data from Supabase
      const mockSummary: ClientSubscriptionSummary = {
        client_id: clientId,
        client_name: 'Empresa ABC Ltda',
        subscription_plan: {
          id: '2',
          law_firm_id: 'firm-1',
          plan_name: 'Trabalhista Premium',
          plan_type: 'labor',
          description: 'Consultoria completa em direito trabalhista',
          monthly_fee: 599.00,
          yearly_fee: 5990.00,
          setup_fee: 100.00,
          services_included: ['compliance_review', 'phone_support', 'document_review'],
          max_monthly_hours: 8,
          max_document_reviews: 20,
          support_level: 'priority',
          billing_interval: 'monthly',
          trial_period_days: 30,
          is_active: true,
          is_featured: true,
          sort_order: 2,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        },
        subscription: {
          id: 'sub-1',
          client_id: clientId,
          subscription_plan_id: '2',
          status: 'active',
          billing_cycle: 'monthly',
          auto_renew: true,
          start_date: '2024-01-01',
          current_period_start: '2024-01-01',
          current_period_end: '2024-01-31',
          next_billing_date: '2024-02-01',
          monthly_fee: 599.00,
          yearly_fee: 5990.00,
          current_fee: 599.00,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        current_usage: [],
        usage_summary: {
          hours_used: 5.5,
          hours_remaining: 2.5,
          documents_reviewed: 12,
          documents_remaining: 8,
          overage_charges: 0
        },
        next_invoice: {
          amount: 599.00,
          due_date: '2024-02-01'
        }
      }
      
      return mockSummary
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
  
  private async getActiveSubscriptionsForPlan(planId: string): Promise<ClientSubscription[]> {
    // In production, query Supabase for active subscriptions
    return []
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
      // In production, query discount rules from database
      // Mock discount logic for development
      
      const mockDiscount = {
        eligible: true,
        discount_percentage: 25, // 25% discount for premium subscribers
        max_discount: caseValue * 0.25
      }
      
      return mockDiscount
    } catch (error) {
      console.error('Error checking discount eligibility:', error)
      return { eligible: false, discount_percentage: 0, max_discount: 0 }
    }
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService()