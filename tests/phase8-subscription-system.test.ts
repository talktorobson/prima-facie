// =====================================================
// PHASE 8: SUBSCRIPTION SYSTEM COMPREHENSIVE TESTS
// =====================================================

import { 
  SubscriptionService,
  subscriptionService 
} from '@/lib/billing/subscription-service'
import {
  SubscriptionPlan,
  PlanFormData,
  SubscriptionFormData,
  PlanType,
  ServiceType,
  SupportLevel,
  PLAN_TYPE_OPTIONS,
  SERVICE_OPTIONS,
  SUPPORT_LEVEL_OPTIONS
} from '@/lib/billing/subscription-types'

// Mock data for testing
const mockLawFirmId = 'test-law-firm-123'

const mockPlanData: PlanFormData = {
  plan_name: 'Test Labor Plan',
  plan_type: 'labor',
  description: 'Test description for labor law plan',
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
  is_featured: true
}

const mockSubscriptionData: SubscriptionFormData = {
  client_id: 'test-client-123',
  subscription_plan_id: 'test-plan-123',
  billing_cycle: 'monthly',
  auto_renew: true,
  start_date: '2024-01-01',
  trial_end_date: '2024-01-31',
  notes: 'Test subscription'
}

describe('Phase 8.1: Database Schema Validation', () => {
  
  describe('Subscription Plan Types', () => {
    it('should validate SubscriptionPlan interface structure', () => {
      const plan: SubscriptionPlan = {
        id: 'plan-1',
        law_firm_id: mockLawFirmId,
        plan_name: 'Test Plan',
        plan_type: 'labor',
        description: 'Test description',
        monthly_fee: 299.00,
        yearly_fee: 2990.00,
        setup_fee: 0,
        services_included: ['compliance_review'],
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
      }
      
      expect(plan.id).toBeDefined()
      expect(plan.law_firm_id).toBe(mockLawFirmId)
      expect(plan.plan_type).toBe('labor')
      expect(plan.monthly_fee).toBe(299.00)
      expect(plan.services_included).toHaveLength(1)
      expect(plan.is_active).toBe(true)
    })
    
    it('should validate PlanType enum values', () => {
      const validTypes: PlanType[] = ['labor', 'corporate', 'criminal', 'family', 'general']
      
      validTypes.forEach(type => {
        expect(PLAN_TYPE_OPTIONS.some(option => option.value === type)).toBe(true)
      })
    })
    
    it('should validate ServiceType enum values', () => {
      const testServices: ServiceType[] = [
        'compliance_review',
        'email_support', 
        'phone_support',
        'document_review',
        'unlimited_hours'
      ]
      
      testServices.forEach(service => {
        expect(SERVICE_OPTIONS.some(option => option.value === service)).toBe(true)
      })
    })
    
    it('should validate SupportLevel enum values', () => {
      const supportLevels: SupportLevel[] = ['email', 'phone', 'priority', '24_7']
      
      supportLevels.forEach(level => {
        expect(SUPPORT_LEVEL_OPTIONS.some(option => option.value === level)).toBe(true)
      })
    })
  })
  
  describe('Form Data Validation', () => {
    it('should validate PlanFormData structure', () => {
      expect(mockPlanData.plan_name).toBeDefined()
      expect(mockPlanData.plan_type).toBe('labor')
      expect(mockPlanData.monthly_fee).toBeGreaterThan(0)
      expect(mockPlanData.services_included).toBeInstanceOf(Array)
      expect(mockPlanData.trial_period_days).toBeGreaterThanOrEqual(0)
    })
    
    it('should validate SubscriptionFormData structure', () => {
      expect(mockSubscriptionData.client_id).toBeDefined()
      expect(mockSubscriptionData.subscription_plan_id).toBeDefined()
      expect(mockSubscriptionData.billing_cycle).toBe('monthly')
      expect(mockSubscriptionData.auto_renew).toBe(true)
      expect(mockSubscriptionData.start_date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })
})

describe('Phase 8.2: Subscription Service Layer', () => {
  
  describe('SubscriptionService Class', () => {
    it('should create service instance', () => {
      expect(subscriptionService).toBeInstanceOf(SubscriptionService)
    })
    
    it('should have all required methods', () => {
      const requiredMethods = [
        'getSubscriptionPlans',
        'createSubscriptionPlan',
        'updateSubscriptionPlan',
        'deleteSubscriptionPlan',
        'getClientSubscriptions',
        'createClientSubscription',
        'cancelClientSubscription',
        'trackServiceUsage',
        'getUsageSummary',
        'getSubscriptionMetrics',
        'getMRRAnalytics',
        'getClientSubscriptionSummary',
        'formatCurrency',
        'calculateYearlyDiscount',
        'checkDiscountEligibility'
      ]
      
      requiredMethods.forEach(method => {
        expect(typeof (subscriptionService as any)[method]).toBe('function')
      })
    })
  })
  
  describe('Plan Management', () => {
    it('should get subscription plans for law firm', async () => {
      const plans = await subscriptionService.getSubscriptionPlans(mockLawFirmId)
      
      expect(Array.isArray(plans)).toBe(true)
      expect(plans.length).toBeGreaterThan(0)
      
      // Validate plan structure
      plans.forEach(plan => {
        expect(plan.id).toBeDefined()
        expect(plan.law_firm_id).toBeDefined()
        expect(plan.plan_name).toBeDefined()
        expect(plan.monthly_fee).toBeGreaterThanOrEqual(0)
        expect(Array.isArray(plan.services_included)).toBe(true)
      })
    })
    
    it('should create new subscription plan', async () => {
      const newPlan = await subscriptionService.createSubscriptionPlan(mockLawFirmId, mockPlanData)
      
      expect(newPlan.id).toBeDefined()
      expect(newPlan.law_firm_id).toBe(mockLawFirmId)
      expect(newPlan.plan_name).toBe(mockPlanData.plan_name)
      expect(newPlan.monthly_fee).toBe(mockPlanData.monthly_fee)
      expect(newPlan.services_included).toEqual(mockPlanData.services_included)
    })
    
    it('should update existing subscription plan', async () => {
      const updatedData = {
        plan_name: 'Updated Plan Name',
        monthly_fee: 799.00
      }
      
      const updatedPlan = await subscriptionService.updateSubscriptionPlan('test-plan-1', updatedData)
      
      expect(updatedPlan.id).toBe('test-plan-1')
      expect(updatedPlan.plan_name).toBe(updatedData.plan_name)
      expect(updatedPlan.monthly_fee).toBe(updatedData.monthly_fee)
    })
    
    it('should validate plan data before creation', async () => {
      const invalidPlanData = {
        ...mockPlanData,
        plan_name: 'AB', // Too short
        monthly_fee: -100 // Negative fee
      }
      
      await expect(
        subscriptionService.createSubscriptionPlan(mockLawFirmId, invalidPlanData)
      ).rejects.toThrow()
    })
  })
  
  describe('Client Subscription Management', () => {
    it('should get client subscriptions', async () => {
      const subscriptions = await subscriptionService.getClientSubscriptions(mockLawFirmId)
      
      expect(Array.isArray(subscriptions)).toBe(true)
      
      if (subscriptions.length > 0) {
        subscriptions.forEach(sub => {
          expect(sub.id).toBeDefined()
          expect(sub.client_id).toBeDefined()
          expect(sub.subscription_plan_id).toBeDefined()
          expect(['trial', 'active', 'past_due', 'cancelled', 'unpaid', 'paused']).toContain(sub.status)
        })
      }
    })
    
    it('should create new client subscription', async () => {
      const newSubscription = await subscriptionService.createClientSubscription(mockSubscriptionData)
      
      expect(newSubscription.id).toBeDefined()
      expect(newSubscription.client_id).toBe(mockSubscriptionData.client_id)
      expect(newSubscription.subscription_plan_id).toBe(mockSubscriptionData.subscription_plan_id)
      expect(newSubscription.billing_cycle).toBe(mockSubscriptionData.billing_cycle)
      expect(newSubscription.start_date).toBe(mockSubscriptionData.start_date)
    })
    
    it('should cancel client subscription', async () => {
      const cancelledSubscription = await subscriptionService.cancelClientSubscription(
        'test-subscription-1',
        'Customer requested cancellation'
      )
      
      expect(cancelledSubscription.status).toBe('cancelled')
      expect(cancelledSubscription.auto_renew).toBe(false)
      expect(cancelledSubscription.cancelled_at).toBeDefined()
      expect(cancelledSubscription.cancellation_reason).toBe('Customer requested cancellation')
    })
  })
  
  describe('Service Usage Tracking', () => {
    it('should track service usage', async () => {
      const usage = await subscriptionService.trackServiceUsage(
        'test-subscription-1',
        'consultation_hours',
        2.5,
        'Client consultation session',
        'matter-123',
        'staff-456'
      )
      
      expect(usage.id).toBeDefined()
      expect(usage.client_subscription_id).toBe('test-subscription-1')
      expect(usage.service_type).toBe('consultation_hours')
      expect(usage.quantity_used).toBe(2.5)
      expect(usage.unit_type).toBe('hours')
      expect(usage.description).toBe('Client consultation session')
    })
    
    it('should get usage summary', async () => {
      const summary = await subscriptionService.getUsageSummary('test-subscription-1')
      
      expect(summary.subscription_id).toBe('test-subscription-1')
      expect(summary.month).toBeDefined()
      expect(typeof summary.hours_used).toBe('number')
      expect(typeof summary.hours_remaining).toBe('number')
      expect(typeof summary.documents_reviewed).toBe('number')
      expect(typeof summary.overage_charges).toBe('number')
    })
  })
  
  describe('Analytics and Metrics', () => {
    it('should get subscription metrics', async () => {
      const metrics = await subscriptionService.getSubscriptionMetrics(mockLawFirmId)
      
      expect(typeof metrics.total_plans).toBe('number')
      expect(typeof metrics.active_plans).toBe('number')
      expect(typeof metrics.total_subscribers).toBe('number')
      expect(typeof metrics.monthly_recurring_revenue).toBe('number')
      expect(typeof metrics.churn_rate).toBe('number')
      expect(typeof metrics.growth_rate).toBe('number')
    })
    
    it('should get MRR analytics', async () => {
      const mrrData = await subscriptionService.getMRRAnalytics(mockLawFirmId, 6)
      
      expect(Array.isArray(mrrData)).toBe(true)
      expect(mrrData.length).toBe(6)
      
      mrrData.forEach(data => {
        expect(data.law_firm_id).toBe(mockLawFirmId)
        expect(data.month).toMatch(/^\d{4}-\d{2}$/)
        expect(typeof data.active_subscriptions).toBe('number')
        expect(typeof data.monthly_recurring_revenue).toBe('number')
        expect(typeof data.average_revenue_per_user).toBe('number')
      })
    })
    
    it('should get client subscription summary', async () => {
      const summary = await subscriptionService.getClientSubscriptionSummary('test-client-123')
      
      if (summary) {
        expect(summary.client_id).toBe('test-client-123')
        expect(summary.client_name).toBeDefined()
        expect(summary.subscription_plan).toBeDefined()
        expect(summary.subscription).toBeDefined()
        expect(summary.usage_summary).toBeDefined()
        expect(summary.next_invoice).toBeDefined()
      }
    })
  })
  
  describe('Utility Functions', () => {
    it('should format currency correctly', () => {
      const formatted = subscriptionService.formatCurrency(1299.99)
      expect(formatted).toMatch(/R\$\s*1\.299,99/)
    })
    
    it('should calculate yearly discount', () => {
      const discount = subscriptionService.calculateYearlyDiscount(599, 5990)
      expect(discount).toBe(17) // 17% discount
    })
    
    it('should calculate zero discount for invalid values', () => {
      expect(subscriptionService.calculateYearlyDiscount(0, 5990)).toBe(0)
      expect(subscriptionService.calculateYearlyDiscount(599, 0)).toBe(0)
      expect(subscriptionService.calculateYearlyDiscount(-599, 5990)).toBe(0)
    })
    
    it('should check discount eligibility', async () => {
      const eligibility = await subscriptionService.checkDiscountEligibility(
        'test-subscription-1',
        'labor_litigation',
        50000
      )
      
      expect(typeof eligibility.eligible).toBe('boolean')
      expect(typeof eligibility.discount_percentage).toBe('number')
      expect(typeof eligibility.max_discount).toBe('number')
      
      if (eligibility.eligible) {
        expect(eligibility.discount_percentage).toBeGreaterThan(0)
        expect(eligibility.max_discount).toBeGreaterThan(0)
      }
    })
  })
})

describe('Phase 8: Configuration and Constants', () => {
  
  describe('Plan Type Options', () => {
    it('should have all required plan types', () => {
      const expectedTypes = ['labor', 'corporate', 'criminal', 'family', 'general']
      
      expectedTypes.forEach(type => {
        const option = PLAN_TYPE_OPTIONS.find(opt => opt.value === type)
        expect(option).toBeDefined()
        expect(option?.label).toBeDefined()
        expect(option?.color).toBeDefined()
      })
    })
  })
  
  describe('Service Options', () => {
    it('should have comprehensive service list', () => {
      const expectedServices = [
        'compliance_review',
        'email_support',
        'phone_support',
        'document_review',
        'dedicated_lawyer'
      ]
      
      expectedServices.forEach(service => {
        const option = SERVICE_OPTIONS.find(opt => opt.value === service)
        expect(option).toBeDefined()
        expect(option?.label).toBeDefined()
      })
    })
  })
  
  describe('Support Level Options', () => {
    it('should have all support levels with proper ordering', () => {
      const expectedLevels = ['email', 'phone', 'priority', '24_7']
      
      expectedLevels.forEach(level => {
        const option = SUPPORT_LEVEL_OPTIONS.find(opt => opt.value === level)
        expect(option).toBeDefined()
        expect(option?.label).toBeDefined()
      })
    })
  })
})

describe('Phase 8: Business Logic Validation', () => {
  
  describe('Brazilian Legal Market Specifics', () => {
    it('should support Brazilian plan types', () => {
      const brazilianTypes = ['labor', 'corporate', 'criminal', 'family']
      
      brazilianTypes.forEach(type => {
        const option = PLAN_TYPE_OPTIONS.find(opt => opt.value === type)
        expect(option).toBeDefined()
        expect(option?.label).toMatch(/Direito/)
      })
    })
    
    it('should format currency in Brazilian Real', () => {
      const formatted = subscriptionService.formatCurrency(299.50)
      expect(formatted).toMatch(/R\$/)
      expect(formatted).toMatch(/299,50/)
    })
    
    it('should support Brazilian business hours in support levels', () => {
      const prioritySupport = SUPPORT_LEVEL_OPTIONS.find(opt => opt.value === 'priority')
      expect(prioritySupport?.label).toMatch(/4h/)
      
      const emailSupport = SUPPORT_LEVEL_OPTIONS.find(opt => opt.value === 'email')
      expect(emailSupport?.label).toMatch(/48h/)
    })
  })
  
  describe('Cross-Selling Business Logic', () => {
    it('should provide discount eligibility for subscribers', async () => {
      const eligibility = await subscriptionService.checkDiscountEligibility(
        'premium-subscriber',
        'labor_litigation',
        100000
      )
      
      // Premium subscribers should typically get discounts
      expect(eligibility.eligible).toBe(true)
      expect(eligibility.discount_percentage).toBeGreaterThan(0)
    })
    
    it('should calculate meaningful discount amounts', async () => {
      const caseValue = 50000
      const eligibility = await subscriptionService.checkDiscountEligibility(
        'premium-subscriber',
        'corporate_litigation',
        caseValue
      )
      
      if (eligibility.eligible) {
        const expectedDiscount = caseValue * (eligibility.discount_percentage / 100)
        expect(eligibility.max_discount).toBeCloseTo(expectedDiscount, 2)
      }
    })
  })
  
  describe('Revenue Model Validation', () => {
    it('should support triple revenue stream calculation', () => {
      const monthlyRevenue = 599 // Subscription
      const caseRevenue = 25000 // One-time case
      const successFee = 7500 // 15% of 50k recovered
      
      const totalRevenue = monthlyRevenue + caseRevenue + successFee
      expect(totalRevenue).toBe(33099)
      
      // Annual calculation
      const annualSubscription = monthlyRevenue * 12
      const totalWithAnnual = annualSubscription + caseRevenue + successFee
      expect(totalWithAnnual).toBe(39688)
    })
    
    it('should calculate client lifetime value', () => {
      const monthlyFee = 599
      const averageRetentionMonths = 24
      const averageCasesPerYear = 2
      const averageCaseValue = 25000
      const successFeeRate = 0.15
      
      const subscriptionValue = monthlyFee * averageRetentionMonths
      const caseValue = averageCasesPerYear * 2 * averageCaseValue // 2 years
      const successFeeValue = averageCasesPerYear * 2 * 50000 * successFeeRate
      
      const clientLifetimeValue = subscriptionValue + caseValue + successFeeValue
      expect(clientLifetimeValue).toBe(144376) // Significant LTV improvement
    })
  })
})

// Integration tests would go here
describe('Phase 8: Integration Tests', () => {
  
  describe('End-to-End Subscription Flow', () => {
    it('should complete full subscription lifecycle', async () => {
      // 1. Create plan
      const plan = await subscriptionService.createSubscriptionPlan(mockLawFirmId, mockPlanData)
      expect(plan.id).toBeDefined()
      
      // 2. Create subscription
      const subscriptionData = {
        ...mockSubscriptionData,
        subscription_plan_id: plan.id
      }
      const subscription = await subscriptionService.createClientSubscription(subscriptionData)
      expect(subscription.subscription_plan_id).toBe(plan.id)
      
      // 3. Track usage
      const usage = await subscriptionService.trackServiceUsage(
        subscription.id,
        'consultation_hours',
        2.0
      )
      expect(usage.client_subscription_id).toBe(subscription.id)
      
      // 4. Get usage summary
      const summary = await subscriptionService.getUsageSummary(subscription.id)
      expect(summary.subscription_id).toBe(subscription.id)
      
      // 5. Cancel subscription
      const cancelled = await subscriptionService.cancelClientSubscription(subscription.id)
      expect(cancelled.status).toBe('cancelled')
    })
  })
})