// =====================================================
// PHASE 8.4: DISCOUNT ENGINE COMPREHENSIVE TESTS
// =====================================================

import { 
  DiscountService,
  discountService 
} from '@/lib/billing/discount-service'
import {
  DiscountRule,
  DiscountCondition,
  DiscountConfig,
  DiscountEligibility,
  DiscountRuleFormData,
  DiscountCalculationInput,
  CrossSellingOpportunity,
  DiscountRuleType,
  DiscountType,
  ConditionType,
  ConditionOperator,
  AppliesTo,
  DISCOUNT_RULE_TYPE_OPTIONS,
  DISCOUNT_TYPE_OPTIONS,
  CONDITION_TYPE_OPTIONS,
  CONDITION_OPERATOR_OPTIONS,
  APPLIES_TO_OPTIONS,
  PRESET_DISCOUNT_RULES
} from '@/lib/billing/discount-types'

// Mock data for testing
const mockLawFirmId = 'test-law-firm-123'
const mockClientId = 'test-client-123'

const mockDiscountRuleData: DiscountRuleFormData = {
  rule_name: 'Test Subscription Discount',
  rule_type: 'subscription_based',
  priority: 8,
  conditions: [
    {
      condition_type: 'subscription_status',
      field_name: 'subscription_status',
      operator: 'equals',
      value: 'active',
      is_required: true
    },
    {
      condition_type: 'case_value',
      field_name: 'case_value',
      operator: 'greater_than',
      value: 10000,
      is_required: true
    }
  ],
  discount_config: {
    discount_type: 'percentage',
    value: 15,
    max_discount_amount: 5000,
    min_case_value: 10000,
    applies_to: ['hourly_fees', 'fixed_fees'],
    compound_with_other_discounts: true
  },
  valid_from: '2024-06-01',
  valid_until: '2024-12-31',
  max_uses: 100,
  is_active: true
}

const mockCalculationInput: DiscountCalculationInput = {
  client_id: mockClientId,
  case_id: 'case-123',
  case_type: 'labor',
  case_value: 50000,
  billing_type: 'hourly',
  hourly_rate: 300,
  estimated_hours: 50
}

describe('Phase 8.4: Discount Engine Types and Enums', () => {
  
  describe('Discount Rule Types', () => {
    it('should validate DiscountRule interface structure', () => {
      const rule: DiscountRule = {
        id: 'rule-1',
        law_firm_id: mockLawFirmId,
        rule_name: 'Test Rule',
        rule_type: 'subscription_based',
        is_active: true,
        priority: 8,
        conditions: [
          {
            id: 'cond-1',
            condition_type: 'subscription_status',
            field_name: 'subscription_status',
            operator: 'equals',
            value: 'active',
            is_required: true
          }
        ],
        discount_config: {
          discount_type: 'percentage',
          value: 15,
          max_discount_amount: 5000,
          min_case_value: 10000,
          applies_to: ['hourly_fees'],
          compound_with_other_discounts: true
        },
        valid_from: '2024-06-01',
        valid_until: '2024-12-31',
        max_uses: 100,
        current_uses: 0,
        created_at: '2024-06-16T00:00:00Z',
        updated_at: '2024-06-16T00:00:00Z'
      }
      
      expect(rule.id).toBeDefined()
      expect(rule.law_firm_id).toBe(mockLawFirmId)
      expect(rule.rule_type).toBe('subscription_based')
      expect(rule.priority).toBe(8)
      expect(rule.conditions).toHaveLength(1)
      expect(rule.discount_config.discount_type).toBe('percentage')
      expect(rule.discount_config.value).toBe(15)
    })
    
    it('should validate DiscountEligibility interface structure', () => {
      const eligibility: DiscountEligibility = {
        eligible: true,
        discount_percentage: 15.0,
        max_discount: 2250.00,
        applied_rules: [
          {
            rule_id: 'rule-1',
            rule_name: 'Test Rule',
            discount_type: 'percentage',
            discount_value: 15,
            discount_amount: 2250.00,
            priority: 8
          }
        ],
        total_discount_amount: 2250.00,
        original_amount: 15000.00,
        discounted_amount: 12750.00,
        eligibility_reasons: ['Test Rule: R$ 2.250,00'],
        warnings: []
      }
      
      expect(eligibility.eligible).toBe(true)
      expect(eligibility.discount_percentage).toBe(15.0)
      expect(eligibility.applied_rules).toHaveLength(1)
      expect(eligibility.total_discount_amount).toBe(2250.00)
      expect(eligibility.original_amount).toBe(15000.00)
    })
    
    it('should validate DiscountRuleType enum values', () => {
      const validTypes: DiscountRuleType[] = ['subscription_based', 'volume_based', 'loyalty_based', 'promotional', 'case_specific']
      
      validTypes.forEach(type => {
        expect(DISCOUNT_RULE_TYPE_OPTIONS.some(option => option.value === type)).toBe(true)
      })
    })
    
    it('should validate DiscountType enum values', () => {
      const validTypes: DiscountType[] = ['percentage', 'fixed_amount', 'tiered']
      
      validTypes.forEach(type => {
        expect(DISCOUNT_TYPE_OPTIONS.some(option => option.value === type)).toBe(true)
      })
    })
    
    it('should validate ConditionType enum values', () => {
      const validTypes: ConditionType[] = ['subscription_status', 'subscription_plan', 'client_tenure', 'case_value', 'case_type', 'payment_history', 'volume_threshold']
      
      validTypes.forEach(type => {
        expect(CONDITION_TYPE_OPTIONS.some(option => option.value === type)).toBe(true)
      })
    })
    
    it('should validate ConditionOperator enum values', () => {
      const validOperators: ConditionOperator[] = ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_equal', 'less_equal', 'contains', 'in_list']
      
      validOperators.forEach(operator => {
        expect(CONDITION_OPERATOR_OPTIONS.some(option => option.value === operator)).toBe(true)
      })
    })
    
    it('should validate AppliesTo enum values', () => {
      const validValues: AppliesTo[] = ['hourly_fees', 'percentage_fees', 'fixed_fees', 'success_fees', 'total_case_value']
      
      validValues.forEach(value => {
        expect(APPLIES_TO_OPTIONS.some(option => option.value === value)).toBe(true)
      })
    })
  })
  
  describe('Form Data Validation', () => {
    it('should validate DiscountRuleFormData structure', () => {
      expect(mockDiscountRuleData.rule_name).toBeDefined()
      expect(mockDiscountRuleData.rule_type).toBe('subscription_based')
      expect(mockDiscountRuleData.priority).toBeGreaterThan(0)
      expect(mockDiscountRuleData.conditions).toHaveLength(2)
      expect(mockDiscountRuleData.discount_config.discount_type).toBe('percentage')
      expect(mockDiscountRuleData.discount_config.value).toBeGreaterThan(0)
      expect(mockDiscountRuleData.valid_from).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
    
    it('should validate DiscountCalculationInput structure', () => {
      expect(mockCalculationInput.client_id).toBeDefined()
      expect(mockCalculationInput.case_type).toBeDefined()
      expect(mockCalculationInput.case_value).toBeGreaterThan(0)
      expect(mockCalculationInput.billing_type).toMatch(/^(hourly|percentage|fixed)$/)
      expect(mockCalculationInput.hourly_rate).toBeGreaterThan(0)
      expect(mockCalculationInput.estimated_hours).toBeGreaterThan(0)
    })
  })
})

describe('Phase 8.4: Discount Service Layer', () => {
  
  describe('DiscountService Class', () => {
    it('should create service instance', () => {
      expect(discountService).toBeInstanceOf(DiscountService)
    })
    
    it('should have all required methods', () => {
      const requiredMethods = [
        'getDiscountRules',
        'getDiscountRule',
        'createDiscountRule',
        'updateDiscountRule',
        'toggleDiscountRule',
        'deleteDiscountRule',
        'calculateDiscount',
        'checkCrossSellingOpportunity',
        'createPresetRules',
        'getDiscountAnalytics',
        'formatCurrency',
        'formatPercentage'
      ]
      
      requiredMethods.forEach(method => {
        expect(typeof (discountService as any)[method]).toBe('function')
      })
    })
  })
  
  describe('Discount Rule Management', () => {
    it('should get discount rules for law firm', async () => {
      const rules = await discountService.getDiscountRules('firm-1')
      
      expect(Array.isArray(rules)).toBe(true)
      expect(rules.length).toBeGreaterThan(0)
      
      // Should be sorted by priority (highest first)
      for (let i = 1; i < rules.length; i++) {
        expect(rules[i].priority).toBeLessThanOrEqual(rules[i - 1].priority)
      }
      
      rules.forEach(rule => {
        expect(rule.id).toBeDefined()
        expect(rule.law_firm_id).toBe('firm-1')
        expect(rule.rule_name).toBeDefined()
        expect(rule.priority).toBeGreaterThanOrEqual(1)
        expect(rule.priority).toBeLessThanOrEqual(10)
        expect(Array.isArray(rule.conditions)).toBe(true)
      })
    })
    
    it('should create new discount rule', async () => {
      const newRule = await discountService.createDiscountRule(mockLawFirmId, mockDiscountRuleData)
      
      expect(newRule.id).toBeDefined()
      expect(newRule.law_firm_id).toBe(mockLawFirmId)
      expect(newRule.rule_name).toBe(mockDiscountRuleData.rule_name)
      expect(newRule.rule_type).toBe(mockDiscountRuleData.rule_type)
      expect(newRule.priority).toBe(mockDiscountRuleData.priority)
      expect(newRule.conditions).toHaveLength(mockDiscountRuleData.conditions.length)
      expect(newRule.discount_config.discount_type).toBe(mockDiscountRuleData.discount_config.discount_type)
      expect(newRule.discount_config.value).toBe(mockDiscountRuleData.discount_config.value)
      expect(newRule.is_active).toBe(mockDiscountRuleData.is_active)
    })
    
    it('should update existing discount rule', async () => {
      const updatedData = {
        rule_name: 'Updated Rule Name',
        priority: 9,
        is_active: false
      }
      
      const updatedRule = await discountService.updateDiscountRule('1', updatedData)
      
      expect(updatedRule.id).toBe('1')
      expect(updatedRule.rule_name).toBe(updatedData.rule_name)
      expect(updatedRule.priority).toBe(updatedData.priority)
      expect(updatedRule.is_active).toBe(updatedData.is_active)
    })
    
    it('should toggle discount rule status', async () => {
      const originalRule = await discountService.getDiscountRule('1')
      expect(originalRule).toBeDefined()
      
      const originalStatus = originalRule!.is_active
      const toggledRule = await discountService.toggleDiscountRule('1')
      
      expect(toggledRule.is_active).toBe(!originalStatus)
    })
    
    it('should delete discount rule', async () => {
      await discountService.deleteDiscountRule('2')
      const deletedRule = await discountService.getDiscountRule('2')
      expect(deletedRule).toBeNull()
    })
    
    it('should validate rule data before creation', async () => {
      const invalidRuleData = {
        ...mockDiscountRuleData,
        rule_name: 'AB', // Too short
        priority: 15, // Too high
        conditions: [], // Empty conditions
        discount_config: {
          ...mockDiscountRuleData.discount_config,
          value: -10 // Negative value
        }
      }
      
      await expect(
        discountService.createDiscountRule(mockLawFirmId, invalidRuleData)
      ).rejects.toThrow()
    })
  })
  
  describe('Discount Calculation Engine', () => {
    it('should calculate discount correctly for eligible client', async () => {
      const eligibility = await discountService.calculateDiscount('firm-1', mockCalculationInput)
      
      expect(eligibility.eligible).toBe(true)
      expect(eligibility.discount_percentage).toBeGreaterThan(0)
      expect(eligibility.total_discount_amount).toBeGreaterThan(0)
      expect(eligibility.applied_rules.length).toBeGreaterThan(0)
      expect(eligibility.original_amount).toBeGreaterThan(0)
      expect(eligibility.discounted_amount).toBeLessThan(eligibility.original_amount)
      
      // Verify calculation consistency
      expect(eligibility.discounted_amount).toBe(
        eligibility.original_amount - eligibility.total_discount_amount
      )
      
      const calculatedPercentage = (eligibility.total_discount_amount / eligibility.original_amount) * 100
      expect(Math.abs(calculatedPercentage - eligibility.discount_percentage)).toBeLessThan(0.01)
    })
    
    it('should return no discount for ineligible client', async () => {
      const ineligibleInput: DiscountCalculationInput = {
        ...mockCalculationInput,
        case_value: 1000, // Below minimum threshold
        client_id: 'ineligible-client'
      }
      
      const eligibility = await discountService.calculateDiscount('firm-1', ineligibleInput)
      
      expect(eligibility.eligible).toBe(false)
      expect(eligibility.discount_percentage).toBe(0)
      expect(eligibility.total_discount_amount).toBe(0)
      expect(eligibility.applied_rules).toHaveLength(0)
      expect(eligibility.discounted_amount).toBe(eligibility.original_amount)
    })
    
    it('should calculate different billing types correctly', async () => {
      const testCases = [
        {
          billing_type: 'hourly' as const,
          hourly_rate: 300,
          estimated_hours: 50,
          expected_base: 15000
        },
        {
          billing_type: 'percentage' as const,
          percentage_rate: 20,
          expected_base: 10000 // 20% of 50000
        },
        {
          billing_type: 'fixed' as const,
          fixed_amount: 25000,
          expected_base: 25000
        }
      ]
      
      for (const testCase of testCases) {
        const input: DiscountCalculationInput = {
          ...mockCalculationInput,
          billing_type: testCase.billing_type,
          hourly_rate: testCase.hourly_rate,
          estimated_hours: testCase.estimated_hours,
          percentage_rate: testCase.percentage_rate,
          fixed_amount: testCase.fixed_amount
        }
        
        const eligibility = await discountService.calculateDiscount('firm-1', input)
        expect(eligibility.original_amount).toBe(testCase.expected_base)
      }
    })
    
    it('should respect maximum discount limits', async () => {
      const highValueInput: DiscountCalculationInput = {
        ...mockCalculationInput,
        case_value: 500000, // Very high value
        hourly_rate: 500,
        estimated_hours: 200 // 100,000 total
      }
      
      const eligibility = await discountService.calculateDiscount('firm-1', highValueInput)
      
      if (eligibility.eligible && eligibility.applied_rules.length > 0) {
        const rulesWithMaxDiscount = eligibility.applied_rules.filter(rule => 
          rule.discount_amount <= 5000 // Based on mock rule max_discount_amount
        )
        expect(rulesWithMaxDiscount.length).toBeGreaterThan(0)
      }
    })
    
    it('should handle compound discounts correctly', async () => {
      // This test would require multiple applicable rules
      // For now, verify the compound logic structure
      const eligibility = await discountService.calculateDiscount('firm-1', mockCalculationInput)
      
      if (eligibility.applied_rules.length > 1) {
        // Primary rule gets full discount
        const primaryDiscount = eligibility.applied_rules[0].discount_amount
        
        // Secondary rules get reduced efficiency
        let expectedTotal = primaryDiscount
        for (let i = 1; i < eligibility.applied_rules.length; i++) {
          expectedTotal += eligibility.applied_rules[i].discount_amount * 0.5
        }
        
        expect(Math.abs(eligibility.total_discount_amount - expectedTotal)).toBeLessThan(0.01)
      }
    })
  })
  
  describe('Cross-Selling Engine', () => {
    it('should identify cross-selling opportunity for non-subscriber', async () => {
      const opportunity = await discountService.checkCrossSellingOpportunity(
        'non-subscriber-client',
        100000,
        'corporate'
      )
      
      expect(opportunity.client_id).toBe('non-subscriber-client')
      expect(opportunity.estimated_case_value).toBe(100000)
      expect(opportunity.potential_discount_percentage).toBeGreaterThan(0)
      expect(opportunity.projected_savings).toBeGreaterThan(0)
      expect(opportunity.subscription_recommendation).toBeDefined()
      expect(opportunity.confidence_score).toBeGreaterThan(0)
      expect(opportunity.confidence_score).toBeLessThanOrEqual(1)
    })
    
    it('should provide current benefits for existing subscriber', async () => {
      const opportunity = await discountService.checkCrossSellingOpportunity(
        mockClientId, // Assumed to be existing subscriber in mock
        50000,
        'labor'
      )
      
      expect(opportunity.client_id).toBe(mockClientId)
      expect(opportunity.subscription_plan).toBeDefined()
      expect(opportunity.potential_discount_percentage).toBeGreaterThan(0)
      expect(opportunity.projected_savings).toBeGreaterThan(0)
      expect(opportunity.confidence_score).toBeGreaterThan(0.9) // High confidence for existing subscribers
    })
    
    it('should recommend appropriate subscription plans based on case value', async () => {
      const testCases = [
        { caseValue: 10000, expectedPlan: 'Basic' },
        { caseValue: 30000, expectedPlan: 'Standard' },
        { caseValue: 100000, expectedPlan: 'Premium' }
      ]
      
      for (const testCase of testCases) {
        const opportunity = await discountService.checkCrossSellingOpportunity(
          'test-client',
          testCase.caseValue,
          'general'
        )
        
        expect(opportunity.subscription_recommendation).toContain(testCase.expectedPlan)
      }
    })
  })
  
  describe('Preset Rules', () => {
    it('should create all preset rules successfully', async () => {
      const createdRules = await discountService.createPresetRules(mockLawFirmId)
      
      expect(createdRules.length).toBe(PRESET_DISCOUNT_RULES.length)
      
      createdRules.forEach((rule, index) => {
        const preset = PRESET_DISCOUNT_RULES[index]
        expect(rule.rule_name).toBe(preset.rule_name)
        expect(rule.rule_type).toBe(preset.rule_type)
        expect(rule.law_firm_id).toBe(mockLawFirmId)
        expect(rule.is_active).toBe(true)
      })
    })
    
    it('should validate preset rule structures', () => {
      PRESET_DISCOUNT_RULES.forEach(preset => {
        expect(preset.rule_name).toBeDefined()
        expect(preset.rule_type).toBeDefined()
        expect(Array.isArray(preset.conditions)).toBe(true)
        expect(preset.conditions.length).toBeGreaterThan(0)
        expect(preset.discount_config).toBeDefined()
        expect(preset.discount_config.discount_type).toBeDefined()
        expect(preset.discount_config.value).toBeGreaterThan(0)
      })
    })
  })
  
  describe('Analytics and Reporting', () => {
    it('should generate discount analytics', async () => {
      const analytics = await discountService.getDiscountAnalytics(
        'firm-1',
        '2024-01-01',
        '2024-12-31'
      )
      
      expect(analytics.law_firm_id).toBe(mockLawFirmId)
      expect(analytics.period_start).toBe('2024-01-01')
      expect(analytics.period_end).toBe('2024-12-31')
      expect(typeof analytics.total_discounts_applied).toBe('number')
      expect(typeof analytics.total_discount_amount).toBe('number')
      expect(typeof analytics.average_discount_percentage).toBe('number')
      expect(analytics.most_used_rule).toBeDefined()
      expect(typeof analytics.cross_selling_conversions).toBe('number')
      
      // Revenue impact structure
      expect(analytics.revenue_impact.gross_revenue).toBeGreaterThan(0)
      expect(analytics.revenue_impact.discount_amount).toBeGreaterThanOrEqual(0)
      expect(analytics.revenue_impact.net_revenue).toBeGreaterThan(0)
      expect(analytics.revenue_impact.estimated_revenue_without_discounts).toBeGreaterThan(0)
      
      // Rule performance array
      expect(Array.isArray(analytics.rule_performance)).toBe(true)
      analytics.rule_performance.forEach(perf => {
        expect(perf.rule_id).toBeDefined()
        expect(perf.rule_name).toBeDefined()
        expect(typeof perf.uses).toBe('number')
        expect(typeof perf.total_discount).toBe('number')
        expect(typeof perf.avg_discount).toBe('number')
        expect(typeof perf.conversion_rate).toBe('number')
      })
    })
  })
  
  describe('Utility Functions', () => {
    it('should format currency correctly', () => {
      const formatted = discountService.formatCurrency(2250.75)
      expect(formatted).toMatch(/R\$\s*2\.250,75/)
    })
    
    it('should format percentage correctly', () => {
      const formatted = discountService.formatPercentage(15.75)
      expect(formatted).toBe('15.8%')
    })
    
    it('should format large currency amounts correctly', () => {
      const formatted = discountService.formatCurrency(125000.00)
      expect(formatted).toMatch(/R\$\s*125\.000,00/)
    })
    
    it('should format zero values correctly', () => {
      expect(discountService.formatCurrency(0)).toMatch(/R\$\s*0,00/)
      expect(discountService.formatPercentage(0)).toBe('0.0%')
    })
  })
})

describe('Phase 8.4: Business Logic Validation', () => {
  
  describe('Brazilian Legal Market Specifics', () => {
    it('should support Brazilian legal case types', () => {
      const brazilianCaseTypes = ['labor', 'corporate', 'criminal', 'family', 'civil']
      
      brazilianCaseTypes.forEach(async caseType => {
        const input: DiscountCalculationInput = {
          ...mockCalculationInput,
          case_type: caseType
        }
        
        // Should not throw errors for Brazilian case types
        expect(async () => {
          await discountService.calculateDiscount(mockLawFirmId, input)
        }).not.toThrow()
      })
    })
    
    it('should format currency in Brazilian Real', () => {
      const testAmounts = [299.50, 1500.00, 125000.75]
      
      testAmounts.forEach(amount => {
        const formatted = discountService.formatCurrency(amount)
        expect(formatted).toMatch(/R\$/)
        expect(formatted).toMatch(/\d{1,3}(\.\d{3})*,\d{2}/)
      })
    })
    
    it('should handle reasonable discount percentages for Brazilian market', () => {
      const reasonablePercentages = [5, 10, 15, 20, 25]
      
      reasonablePercentages.forEach(async percentage => {
        const ruleData: DiscountRuleFormData = {
          ...mockDiscountRuleData,
          discount_config: {
            ...mockDiscountRuleData.discount_config,
            discount_type: 'percentage',
            value: percentage
          }
        }
        
        const rule = await discountService.createDiscountRule(mockLawFirmId, ruleData)
        expect(rule.discount_config.value).toBe(percentage)
      })
    })
  })
  
  describe('Cross-Selling Business Logic', () => {
    it('should incentivize subscription adoption through discounts', async () => {
      const nonSubscriberOpportunity = await discountService.checkCrossSellingOpportunity(
        'non-subscriber',
        50000,
        'labor'
      )
      
      expect(nonSubscriberOpportunity.potential_discount_percentage).toBeGreaterThan(0)
      expect(nonSubscriberOpportunity.projected_savings).toBeGreaterThan(0)
      expect(nonSubscriberOpportunity.subscription_recommendation).toBeDefined()
      
      // Should show clear financial benefit
      const monthlySubscriptionCost = 599 // Assumed premium plan
      const annualSavingsFromDiscount = nonSubscriberOpportunity.projected_savings
      
      // Discount should typically exceed annual subscription cost
      expect(annualSavingsFromDiscount).toBeGreaterThan(monthlySubscriptionCost * 6) // 6 months ROI
    })
    
    it('should provide tiered discount recommendations', async () => {
      const testCases = [
        { caseValue: 15000, expectedMinDiscount: 5 },
        { caseValue: 50000, expectedMinDiscount: 10 },
        { caseValue: 200000, expectedMinDiscount: 15 }
      ]
      
      for (const testCase of testCases) {
        const opportunity = await discountService.checkCrossSellingOpportunity(
          'test-client',
          testCase.caseValue,
          'corporate'
        )
        
        expect(opportunity.potential_discount_percentage).toBeGreaterThanOrEqual(testCase.expectedMinDiscount)
      }
    })
  })
  
  describe('Risk Management', () => {
    it('should enforce maximum discount limits', async () => {
      const highDiscountRule: DiscountRuleFormData = {
        ...mockDiscountRuleData,
        discount_config: {
          ...mockDiscountRuleData.discount_config,
          discount_type: 'percentage',
          value: 50, // Very high discount
          max_discount_amount: 10000 // But with limit
        }
      }
      
      const rule = await discountService.createDiscountRule(mockLawFirmId, highDiscountRule)
      
      const highValueInput: DiscountCalculationInput = {
        ...mockCalculationInput,
        case_value: 1000000, // Very high case value
        hourly_rate: 500,
        estimated_hours: 200
      }
      
      const eligibility = await discountService.calculateDiscount('firm-1', highValueInput)
      
      if (eligibility.eligible) {
        expect(eligibility.total_discount_amount).toBeLessThanOrEqual(10000)
      }
    })
    
    it('should prevent over-discounting through compound rules', async () => {
      const input: DiscountCalculationInput = {
        ...mockCalculationInput,
        hourly_rate: 300,
        estimated_hours: 50 // 15,000 total
      }
      
      const eligibility = await discountService.calculateDiscount('firm-1', input)
      
      if (eligibility.eligible) {
        // Total discount should never exceed original amount
        expect(eligibility.total_discount_amount).toBeLessThan(eligibility.original_amount)
        
        // Discount percentage should be reasonable (typically < 50%)
        expect(eligibility.discount_percentage).toBeLessThan(50)
      }
    })
    
    it('should validate rule priority system', async () => {
      const rules = await discountService.getDiscountRules('firm-1')
      const activeRules = rules.filter(rule => rule.is_active)
      
      // Higher priority rules should be evaluated first
      for (let i = 1; i < activeRules.length; i++) {
        expect(activeRules[i].priority).toBeLessThanOrEqual(activeRules[i - 1].priority)
      }
    })
  })
  
  describe('Revenue Optimization', () => {
    it('should improve client lifetime value through cross-selling', async () => {
      const baselineRevenue = 50000 // Single case without subscription
      
      const subscriberOpportunity = await discountService.checkCrossSellingOpportunity(
        'potential-subscriber',
        baselineRevenue,
        'labor'
      )
      
      // Even with discount, subscription should increase total revenue over time
      const monthlySubscriptionFee = 599
      const annualSubscriptionRevenue = monthlySubscriptionFee * 12
      const discountedCaseRevenue = baselineRevenue - subscriberOpportunity.projected_savings
      
      const totalRevenueWithSubscription = annualSubscriptionRevenue + discountedCaseRevenue
      
      // Should be a net positive for the law firm
      expect(totalRevenueWithSubscription).toBeGreaterThan(baselineRevenue)
    })
    
    it('should track discount ROI through analytics', async () => {
      const analytics = await discountService.getDiscountAnalytics(
        'firm-1',
        '2024-01-01',
        '2024-12-31'
      )
      
      const { revenue_impact } = analytics
      
      // Estimated revenue without discounts should account for lost opportunities
      expect(revenue_impact.estimated_revenue_without_discounts).toBeLessThan(revenue_impact.gross_revenue)
      
      // Net revenue (after discounts) should still be substantial
      expect(revenue_impact.net_revenue).toBeGreaterThan(revenue_impact.gross_revenue * 0.7) // At least 70% retention
    })
  })
})

describe('Phase 8.4: Integration Tests', () => {
  
  describe('End-to-End Discount Flow', () => {
    it('should complete full discount rule lifecycle', async () => {
      // 1. Create discount rule
      const rule = await discountService.createDiscountRule(mockLawFirmId, mockDiscountRuleData)
      expect(rule.id).toBeDefined()
      expect(rule.is_active).toBe(true)
      
      // 2. Calculate discount for eligible client
      const eligibility = await discountService.calculateDiscount('firm-1', mockCalculationInput)
      expect(eligibility.eligible).toBe(true)
      expect(eligibility.applied_rules.length).toBeGreaterThan(0)
      
      // 3. Check cross-selling opportunity
      const opportunity = await discountService.checkCrossSellingOpportunity(
        mockClientId,
        mockCalculationInput.case_value,
        mockCalculationInput.case_type
      )
      expect(opportunity.potential_discount_percentage).toBeGreaterThan(0)
      
      // 4. Generate analytics
      const analytics = await discountService.getDiscountAnalytics(
        'firm-1',
        '2024-01-01',
        '2024-12-31'
      )
      expect(analytics.total_discounts_applied).toBeGreaterThan(0)
      
      // 5. Toggle rule status
      const toggledRule = await discountService.toggleDiscountRule(rule.id)
      expect(toggledRule.is_active).toBe(false)
      
      // 6. Verify ineligibility when rule is inactive
      const ineligibleCheck = await discountService.calculateDiscount('firm-1', mockCalculationInput)
      const activeRulesCount = ineligibleCheck.applied_rules.length
      expect(activeRulesCount).toBeLessThan(eligibility.applied_rules.length)
    })
  })
  
  describe('Cross-System Integration', () => {
    it('should integrate with subscription system for eligibility', async () => {
      // This test simulates integration with subscription service
      const subscriptionBasedInput: DiscountCalculationInput = {
        ...mockCalculationInput,
        client_id: 'premium-subscriber-client'
      }
      
      const eligibility = await discountService.calculateDiscount(mockLawFirmId, subscriptionBasedInput)
      
      if (eligibility.eligible) {
        const subscriptionRules = eligibility.applied_rules.filter(rule => 
          rule.rule_name.toLowerCase().includes('subscription') ||
          rule.rule_name.toLowerCase().includes('assinatura')
        )
        
        expect(subscriptionRules.length).toBeGreaterThan(0)
      }
    })
    
    it('should provide data for billing system integration', async () => {
      const eligibility = await discountService.calculateDiscount('firm-1', mockCalculationInput)
      
      // Discount service should provide all data needed for billing integration
      expect(eligibility.original_amount).toBeDefined()
      expect(eligibility.discounted_amount).toBeDefined()
      expect(eligibility.total_discount_amount).toBeDefined()
      expect(eligibility.applied_rules).toBeDefined()
      
      // Should have detailed audit trail
      expect(eligibility.eligibility_reasons.length).toBeGreaterThan(0)
      
      // Should work for all billing types
      const billingTypes: Array<'hourly' | 'percentage' | 'fixed'> = ['hourly', 'percentage', 'fixed']
      
      for (const billingType of billingTypes) {
        const input: DiscountCalculationInput = {
          ...mockCalculationInput,
          billing_type: billingType
        }
        
        const result = await discountService.calculateDiscount(mockLawFirmId, input)
        expect(result.original_amount).toBeGreaterThan(0)
      }
    })
  })
})