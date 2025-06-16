// =====================================================
// PHASE 8.4: EXHAUSTIVE DISCOUNT ENGINE TESTS
// =====================================================

import { 
  DiscountService,
  discountService 
} from '@/lib/billing/discount-service'
import {
  DiscountRule,
  DiscountRuleFormData,
  DiscountCalculationInput,
  CrossSellingOpportunity,
  DiscountEligibility,
  PRESET_DISCOUNT_RULES
} from '@/lib/billing/discount-types'

describe('Phase 8.4: Exhaustive Discount Engine Tests', () => {
  
  // Test data setup
  const testLawFirmId = 'firm-1'
  let createdRuleIds: string[] = []

  // Cleanup after tests
  afterEach(async () => {
    for (const ruleId of createdRuleIds) {
      try {
        await discountService.deleteDiscountRule(ruleId)
      } catch (error) {
        // Rule might already be deleted
      }
    }
    createdRuleIds = []
  })

  describe('Real-World Business Scenarios', () => {
    
    describe('Scenario 1: New Client Considering Subscription', () => {
      it('should recommend subscription with projected savings', async () => {
        // Non-subscriber with potential high-value case
        const clientId = 'potential-subscriber-001'
        const caseValue = 150000 // High-value corporate case
        
        const opportunity = await discountService.checkCrossSellingOpportunity(
          clientId,
          caseValue,
          'corporate'
        )
        
        console.log('Cross-selling opportunity:', opportunity)
        
        expect(opportunity.client_id).toBe(clientId)
        expect(opportunity.potential_discount_percentage).toBeGreaterThan(0)
        expect(opportunity.projected_savings).toBeGreaterThan(0)
        expect(opportunity.subscription_recommendation).toContain('Subscribe')
        expect(opportunity.confidence_score).toBeGreaterThan(0.5)
        
        // Verify ROI calculation
        const monthlySubscriptionCost = 599 // Premium plan
        const annualSubscriptionCost = monthlySubscriptionCost * 12
        
        console.log(`Annual subscription cost: R$ ${annualSubscriptionCost}`)
        console.log(`Projected savings: R$ ${opportunity.projected_savings}`)
        console.log(`Net benefit: R$ ${opportunity.projected_savings - annualSubscriptionCost}`)
      })
    })

    describe('Scenario 2: Premium Subscriber Getting Discount', () => {
      it('should apply maximum eligible discounts for premium subscriber', async () => {
        // Create premium subscriber discount rule
        const premiumRule: DiscountRuleFormData = {
          rule_name: 'Premium Subscriber Special',
          rule_type: 'subscription_based',
          priority: 10,
          conditions: [
            {
              condition_type: 'subscription_status',
              field_name: 'subscription_status',
              operator: 'equals',
              value: 'active',
              is_required: true
            },
            {
              condition_type: 'subscription_plan',
              field_name: 'subscription_plan',
              operator: 'equals',
              value: 'premium',
              is_required: true
            }
          ],
          discount_config: {
            discount_type: 'percentage',
            value: 20,
            max_discount_amount: 10000,
            min_case_value: 20000,
            applies_to: ['hourly_fees', 'fixed_fees', 'percentage_fees'],
            compound_with_other_discounts: false
          },
          valid_from: new Date().toISOString().split('T')[0],
          is_active: true
        }
        
        const rule = await discountService.createDiscountRule(testLawFirmId, premiumRule)
        createdRuleIds.push(rule.id)
        
        // Test various billing scenarios
        const scenarios = [
          {
            name: 'Hourly Billing',
            input: {
              client_id: 'premium-client-001',
              case_type: 'corporate',
              case_value: 100000,
              billing_type: 'hourly' as const,
              hourly_rate: 500,
              estimated_hours: 100
            },
            expectedBaseAmount: 50000
          },
          {
            name: 'Percentage Billing',
            input: {
              client_id: 'premium-client-002',
              case_type: 'labor',
              case_value: 200000,
              billing_type: 'percentage' as const,
              percentage_rate: 25
            },
            expectedBaseAmount: 50000
          },
          {
            name: 'Fixed Billing',
            input: {
              client_id: 'premium-client-003',
              case_type: 'family',
              case_value: 50000,
              billing_type: 'fixed' as const,
              fixed_amount: 30000
            },
            expectedBaseAmount: 30000
          }
        ]
        
        for (const scenario of scenarios) {
          console.log(`\nTesting ${scenario.name}:`)
          
          const eligibility = await discountService.calculateDiscount(testLawFirmId, scenario.input)
          
          console.log(`Original amount: R$ ${eligibility.original_amount}`)
          console.log(`Discount: ${eligibility.discount_percentage}%`)
          console.log(`Discount amount: R$ ${eligibility.total_discount_amount}`)
          console.log(`Final amount: R$ ${eligibility.discounted_amount}`)
          
          expect(eligibility.eligible).toBe(true)
          expect(eligibility.original_amount).toBe(scenario.expectedBaseAmount)
          expect(eligibility.discount_percentage).toBeLessThanOrEqual(20)
          expect(eligibility.total_discount_amount).toBeLessThanOrEqual(10000) // Max cap
          expect(eligibility.discounted_amount).toBeLessThan(eligibility.original_amount)
        }
      })
    })

    describe('Scenario 3: Loyalty + Volume Compound Discounts', () => {
      it('should handle compound discounts with diminishing returns', async () => {
        // Create multiple applicable rules
        const loyaltyRule: DiscountRuleFormData = {
          rule_name: 'Loyalty Discount',
          rule_type: 'loyalty_based',
          priority: 8,
          conditions: [
            {
              condition_type: 'client_tenure',
              field_name: 'client_tenure',
              operator: 'greater_equal',
              value: 12,
              is_required: true
            }
          ],
          discount_config: {
            discount_type: 'percentage',
            value: 10,
            max_discount_amount: 5000,
            applies_to: ['hourly_fees', 'percentage_fees', 'fixed_fees'],
            compound_with_other_discounts: true
          },
          valid_from: new Date().toISOString().split('T')[0],
          is_active: true
        }
        
        const volumeRule: DiscountRuleFormData = {
          rule_name: 'High Volume Discount',
          rule_type: 'volume_based',
          priority: 7,
          conditions: [
            {
              condition_type: 'case_value',
              field_name: 'case_value',
              operator: 'greater_than',
              value: 100000,
              is_required: true
            }
          ],
          discount_config: {
            discount_type: 'percentage',
            value: 8,
            max_discount_amount: 4000,
            applies_to: ['hourly_fees', 'percentage_fees', 'fixed_fees'],
            compound_with_other_discounts: true
          },
          valid_from: new Date().toISOString().split('T')[0],
          is_active: true
        }
        
        const loyalty = await discountService.createDiscountRule(testLawFirmId, loyaltyRule)
        const volume = await discountService.createDiscountRule(testLawFirmId, volumeRule)
        createdRuleIds.push(loyalty.id, volume.id)
        
        // Test compound discount
        const input: DiscountCalculationInput = {
          client_id: 'loyal-high-volume-client',
          case_type: 'corporate',
          case_value: 150000,
          billing_type: 'fixed',
          fixed_amount: 40000
        }
        
        const eligibility = await discountService.calculateDiscount(testLawFirmId, input)
        
        console.log('\nCompound discount calculation:')
        console.log('Applied rules:', eligibility.applied_rules.map(r => ({
          name: r.rule_name,
          discount: r.discount_amount
        })))
        console.log(`Total discount: R$ ${eligibility.total_discount_amount}`)
        
        expect(eligibility.eligible).toBe(true)
        expect(eligibility.applied_rules.length).toBeGreaterThanOrEqual(2)
        
        // Verify compound logic (secondary rules get 50% efficiency)
        const primaryDiscount = eligibility.applied_rules[0].discount_amount
        const secondaryDiscount = eligibility.applied_rules[1].discount_amount
        const expectedTotal = primaryDiscount + (secondaryDiscount * 0.5)
        
        expect(Math.abs(eligibility.total_discount_amount - expectedTotal)).toBeLessThan(1)
      })
    })

    describe('Scenario 4: Time-Limited Promotional Campaign', () => {
      it('should apply promotional discounts within valid period', async () => {
        const today = new Date()
        const nextWeek = new Date(today)
        nextWeek.setDate(nextWeek.getDate() + 7)
        
        const promoRule: DiscountRuleFormData = {
          rule_name: 'Black Friday Legal Services',
          rule_type: 'promotional',
          priority: 9,
          conditions: [
            {
              condition_type: 'case_type',
              field_name: 'case_type',
              operator: 'in_list',
              value: 'labor,corporate',
              is_required: true
            }
          ],
          discount_config: {
            discount_type: 'percentage',
            value: 30,
            max_discount_amount: 15000,
            min_case_value: 10000,
            applies_to: ['total_case_value'],
            compound_with_other_discounts: false
          },
          valid_from: today.toISOString().split('T')[0],
          valid_until: nextWeek.toISOString().split('T')[0],
          max_uses: 50,
          is_active: true
        }
        
        const promo = await discountService.createDiscountRule(testLawFirmId, promoRule)
        createdRuleIds.push(promo.id)
        
        const input: DiscountCalculationInput = {
          client_id: 'promo-client-001',
          case_type: 'labor',
          case_value: 80000,
          billing_type: 'percentage',
          percentage_rate: 30
        }
        
        const eligibility = await discountService.calculateDiscount(testLawFirmId, input)
        
        console.log('\nPromotional discount:')
        console.log(`Campaign: ${promo.rule_name}`)
        console.log(`Discount: ${eligibility.discount_percentage}%`)
        console.log(`Savings: R$ ${eligibility.total_discount_amount}`)
        
        expect(eligibility.eligible).toBe(true)
        expect(eligibility.discount_percentage).toBeLessThanOrEqual(30)
      })
    })

    describe('Scenario 5: Case-Specific Minimum Fee Validation', () => {
      it('should enforce minimum case value requirements', async () => {
        const highValueRule: DiscountRuleFormData = {
          rule_name: 'High Value Case Discount',
          rule_type: 'case_specific',
          priority: 6,
          conditions: [
            {
              condition_type: 'case_value',
              field_name: 'case_value',
              operator: 'greater_than',
              value: 500000,
              is_required: true
            },
            {
              condition_type: 'case_type',
              field_name: 'case_type',
              operator: 'equals',
              value: 'corporate',
              is_required: true
            }
          ],
          discount_config: {
            discount_type: 'tiered',
            value: 25,
            max_discount_amount: 50000,
            min_case_value: 500000,
            applies_to: ['percentage_fees', 'success_fees'],
            compound_with_other_discounts: false
          },
          valid_from: new Date().toISOString().split('T')[0],
          is_active: true
        }
        
        const rule = await discountService.createDiscountRule(testLawFirmId, highValueRule)
        createdRuleIds.push(rule.id)
        
        // Test below minimum
        const belowMinInput: DiscountCalculationInput = {
          client_id: 'test-client-below-min',
          case_type: 'corporate',
          case_value: 300000, // Below 500k minimum
          billing_type: 'percentage',
          percentage_rate: 20
        }
        
        const belowMinResult = await discountService.calculateDiscount(testLawFirmId, belowMinInput)
        
        console.log('\nBelow minimum case value:')
        console.log(`Case value: R$ ${belowMinInput.case_value}`)
        console.log(`Eligible: ${belowMinResult.eligible}`)
        
        // Should not apply high-value discount
        const highValueRuleApplied = belowMinResult.applied_rules.some(
          r => r.rule_name === 'High Value Case Discount'
        )
        expect(highValueRuleApplied).toBe(false)
        
        // Test above minimum
        const aboveMinInput: DiscountCalculationInput = {
          client_id: 'test-client-above-min',
          case_type: 'corporate',
          case_value: 1000000, // Above 500k minimum
          billing_type: 'percentage',
          percentage_rate: 20
        }
        
        const aboveMinResult = await discountService.calculateDiscount(testLawFirmId, aboveMinInput)
        
        console.log('\nAbove minimum case value:')
        console.log(`Case value: R$ ${aboveMinInput.case_value}`)
        console.log(`Eligible: ${aboveMinResult.eligible}`)
        console.log(`Discount: ${aboveMinResult.discount_percentage}%`)
        
        expect(aboveMinResult.eligible).toBe(true)
        expect(aboveMinResult.applied_rules.some(r => r.rule_name === 'High Value Case Discount')).toBe(true)
      })
    })
  })

  describe('Edge Cases and Error Handling', () => {
    
    describe('Invalid Rule Configurations', () => {
      it('should reject invalid discount percentages', async () => {
        const invalidRules = [
          {
            name: 'Negative percentage',
            value: -10,
            shouldFail: true
          },
          {
            name: 'Over 100%',
            value: 150,
            shouldFail: true
          },
          {
            name: 'Zero percentage',
            value: 0,
            shouldFail: true
          },
          {
            name: 'Valid percentage',
            value: 25,
            shouldFail: false
          }
        ]
        
        for (const testCase of invalidRules) {
          const ruleData: DiscountRuleFormData = {
            rule_name: testCase.name,
            rule_type: 'promotional',
            priority: 5,
            conditions: [{
              condition_type: 'case_value',
              field_name: 'case_value',
              operator: 'greater_than',
              value: 1000,
              is_required: true
            }],
            discount_config: {
              discount_type: 'percentage',
              value: testCase.value,
              applies_to: ['total_case_value'],
              compound_with_other_discounts: false
            },
            valid_from: new Date().toISOString().split('T')[0],
            is_active: true
          }
          
          if (testCase.shouldFail) {
            await expect(
              discountService.createDiscountRule(testLawFirmId, ruleData)
            ).rejects.toThrow()
          } else {
            const rule = await discountService.createDiscountRule(testLawFirmId, ruleData)
            createdRuleIds.push(rule.id)
            expect(rule).toBeDefined()
          }
        }
      })
      
      it('should handle empty conditions gracefully', async () => {
        const ruleData: DiscountRuleFormData = {
          rule_name: 'No Conditions Rule',
          rule_type: 'promotional',
          priority: 5,
          conditions: [], // Empty conditions
          discount_config: {
            discount_type: 'percentage',
            value: 10,
            applies_to: ['total_case_value'],
            compound_with_other_discounts: false
          },
          valid_from: new Date().toISOString().split('T')[0],
          is_active: true
        }
        
        await expect(
          discountService.createDiscountRule(testLawFirmId, ruleData)
        ).rejects.toThrow('At least one condition is required')
      })
    })

    describe('Calculation Edge Cases', () => {
      it('should handle zero value cases', async () => {
        const inputs = [
          {
            name: 'Zero case value',
            input: {
              client_id: 'test-zero-value',
              case_type: 'labor',
              case_value: 0,
              billing_type: 'hourly' as const,
              hourly_rate: 300,
              estimated_hours: 0
            }
          },
          {
            name: 'Zero hourly rate',
            input: {
              client_id: 'test-zero-rate',
              case_type: 'labor',
              case_value: 50000,
              billing_type: 'hourly' as const,
              hourly_rate: 0,
              estimated_hours: 100
            }
          },
          {
            name: 'Zero percentage rate',
            input: {
              client_id: 'test-zero-percentage',
              case_type: 'labor',
              case_value: 50000,
              billing_type: 'percentage' as const,
              percentage_rate: 0
            }
          }
        ]
        
        for (const testCase of inputs) {
          console.log(`\nTesting ${testCase.name}:`)
          
          const result = await discountService.calculateDiscount(testLawFirmId, testCase.input)
          
          expect(result.original_amount).toBe(0)
          expect(result.total_discount_amount).toBe(0)
          expect(result.discounted_amount).toBe(0)
        }
      })
      
      it('should prevent discounts exceeding original amount', async () => {
        // Create an extreme discount rule
        const extremeRule: DiscountRuleFormData = {
          rule_name: 'Extreme Discount',
          rule_type: 'promotional',
          priority: 10,
          conditions: [{
            condition_type: 'case_type',
            field_name: 'case_type',
            operator: 'equals',
            value: 'test',
            is_required: true
          }],
          discount_config: {
            discount_type: 'fixed_amount',
            value: 1000000, // 1 million fixed discount
            applies_to: ['total_case_value'],
            compound_with_other_discounts: false
          },
          valid_from: new Date().toISOString().split('T')[0],
          is_active: true
        }
        
        const rule = await discountService.createDiscountRule(testLawFirmId, extremeRule)
        createdRuleIds.push(rule.id)
        
        const input: DiscountCalculationInput = {
          client_id: 'test-extreme',
          case_type: 'test',
          case_value: 10000, // Only 10k case
          billing_type: 'fixed',
          fixed_amount: 10000
        }
        
        const result = await discountService.calculateDiscount(testLawFirmId, input)
        
        console.log('\nExtreme discount prevention:')
        console.log(`Original: R$ ${result.original_amount}`)
        console.log(`Discount: R$ ${result.total_discount_amount}`)
        console.log(`Final: R$ ${result.discounted_amount}`)
        
        expect(result.discounted_amount).toBeGreaterThanOrEqual(0)
        expect(result.total_discount_amount).toBeLessThanOrEqual(result.original_amount)
      })
    })

    describe('Concurrent Rule Management', () => {
      it('should handle concurrent rule updates', async () => {
        // Create a rule
        const ruleData: DiscountRuleFormData = {
          rule_name: 'Concurrent Test Rule',
          rule_type: 'promotional',
          priority: 5,
          conditions: [{
            condition_type: 'case_value',
            field_name: 'case_value',
            operator: 'greater_than',
            value: 1000,
            is_required: true
          }],
          discount_config: {
            discount_type: 'percentage',
            value: 10,
            applies_to: ['total_case_value'],
            compound_with_other_discounts: false
          },
          valid_from: new Date().toISOString().split('T')[0],
          is_active: true
        }
        
        const rule = await discountService.createDiscountRule(testLawFirmId, ruleData)
        createdRuleIds.push(rule.id)
        
        // Simulate concurrent updates
        const updates = [
          discountService.updateDiscountRule(rule.id, { priority: 6 }),
          discountService.updateDiscountRule(rule.id, { priority: 7 }),
          discountService.updateDiscountRule(rule.id, { priority: 8 })
        ]
        
        await Promise.all(updates)
        
        const updatedRule = await discountService.getDiscountRule(rule.id)
        expect(updatedRule).toBeDefined()
        expect(updatedRule!.priority).toBeGreaterThanOrEqual(6)
        expect(updatedRule!.priority).toBeLessThanOrEqual(8)
      })
    })
  })

  describe('Performance and Scale Testing', () => {
    
    it('should handle multiple rules efficiently', async () => {
      // Create 20 rules with different priorities
      const rulePromises = []
      
      for (let i = 0; i < 20; i++) {
        const ruleData: DiscountRuleFormData = {
          rule_name: `Performance Test Rule ${i}`,
          rule_type: i % 2 === 0 ? 'subscription_based' : 'volume_based',
          priority: Math.floor(Math.random() * 10) + 1,
          conditions: [{
            condition_type: 'case_value',
            field_name: 'case_value',
            operator: 'greater_than',
            value: 10000 + (i * 1000),
            is_required: true
          }],
          discount_config: {
            discount_type: 'percentage',
            value: 5 + (i % 5),
            max_discount_amount: 1000 + (i * 100),
            applies_to: ['hourly_fees', 'fixed_fees'],
            compound_with_other_discounts: i % 3 === 0
          },
          valid_from: new Date().toISOString().split('T')[0],
          is_active: true
        }
        
        rulePromises.push(discountService.createDiscountRule(testLawFirmId, ruleData))
      }
      
      const rules = await Promise.all(rulePromises)
      createdRuleIds.push(...rules.map(r => r.id))
      
      // Test calculation performance
      const startTime = Date.now()
      
      const input: DiscountCalculationInput = {
        client_id: 'performance-test-client',
        case_type: 'corporate',
        case_value: 100000,
        billing_type: 'fixed',
        fixed_amount: 50000
      }
      
      const result = await discountService.calculateDiscount(testLawFirmId, input)
      
      const endTime = Date.now()
      const executionTime = endTime - startTime
      
      console.log(`\nPerformance test with ${rules.length} rules:`)
      console.log(`Execution time: ${executionTime}ms`)
      console.log(`Applied rules: ${result.applied_rules.length}`)
      
      expect(executionTime).toBeLessThan(1000) // Should complete within 1 second
      expect(result).toBeDefined()
    })
  })

  describe('Analytics and Reporting Validation', () => {
    
    it('should generate accurate analytics', async () => {
      // Create some test activity
      const rule = await discountService.createDiscountRule(testLawFirmId, {
        rule_name: 'Analytics Test Rule',
        rule_type: 'subscription_based',
        priority: 8,
        conditions: [{
          condition_type: 'subscription_status',
          field_name: 'subscription_status',
          operator: 'equals',
          value: 'active',
          is_required: true
        }],
        discount_config: {
          discount_type: 'percentage',
          value: 15,
          applies_to: ['hourly_fees'],
          compound_with_other_discounts: false
        },
        valid_from: new Date().toISOString().split('T')[0],
        is_active: true
      })
      createdRuleIds.push(rule.id)
      
      // Generate some discount activity
      const testInputs = [
        {
          client_id: 'analytics-client-1',
          case_type: 'labor',
          case_value: 50000,
          billing_type: 'hourly' as const,
          hourly_rate: 300,
          estimated_hours: 50
        },
        {
          client_id: 'analytics-client-2',
          case_type: 'corporate',
          case_value: 100000,
          billing_type: 'percentage' as const,
          percentage_rate: 20
        }
      ]
      
      for (const input of testInputs) {
        await discountService.calculateDiscount(testLawFirmId, input)
      }
      
      // Get analytics
      const today = new Date()
      const lastMonth = new Date(today)
      lastMonth.setMonth(lastMonth.getMonth() - 1)
      
      const analytics = await discountService.getDiscountAnalytics(
        testLawFirmId,
        lastMonth.toISOString().split('T')[0],
        today.toISOString().split('T')[0]
      )
      
      console.log('\nDiscount analytics:')
      console.log(`Total discounts applied: ${analytics.total_discounts_applied}`)
      console.log(`Total discount amount: R$ ${analytics.total_discount_amount}`)
      console.log(`Average discount: ${analytics.average_discount_percentage}%`)
      console.log(`Most used rule: ${analytics.most_used_rule}`)
      console.log(`Cross-selling conversions: ${analytics.cross_selling_conversions}`)
      
      expect(analytics.law_firm_id).toBe(testLawFirmId)
      expect(analytics.total_discounts_applied).toBeGreaterThanOrEqual(0)
      expect(analytics.revenue_impact).toBeDefined()
      expect(analytics.revenue_impact.net_revenue).toBeGreaterThan(0)
    })
  })

  describe('Brazilian Legal Market Validation', () => {
    
    it('should handle all Brazilian case types correctly', async () => {
      const brazilianCaseTypes = [
        { type: 'labor', name: 'Trabalhista' },
        { type: 'corporate', name: 'Empresarial' },
        { type: 'criminal', name: 'Criminal' },
        { type: 'family', name: 'Família' },
        { type: 'civil', name: 'Cível' },
        { type: 'tax', name: 'Tributário' },
        { type: 'consumer', name: 'Consumidor' }
      ]
      
      for (const caseType of brazilianCaseTypes) {
        const input: DiscountCalculationInput = {
          client_id: `brazilian-client-${caseType.type}`,
          case_type: caseType.type,
          case_value: 50000,
          billing_type: 'percentage',
          percentage_rate: 20
        }
        
        const result = await discountService.calculateDiscount(testLawFirmId, input)
        
        console.log(`\n${caseType.name} case:`)
        console.log(`Eligible: ${result.eligible}`)
        console.log(`Discount: ${result.discount_percentage}%`)
        
        expect(result).toBeDefined()
        expect(result.original_amount).toBeGreaterThan(0)
      }
    })
    
    it('should format all monetary values in Brazilian Real', async () => {
      const amounts = [0, 99.99, 1000, 12345.67, 999999.99, 1234567.89]
      
      for (const amount of amounts) {
        const formatted = discountService.formatCurrency(amount)
        
        expect(formatted).toMatch(/R\$/)
        expect(formatted).toMatch(/^\s*R\$\s*[\d.,]+$/)
        
        console.log(`${amount} -> ${formatted}`)
      }
    })
  })

  describe('Integration with Other Systems', () => {
    
    it('should provide data compatible with billing system', async () => {
      const billingScenarios = [
        {
          name: 'Simple hourly billing',
          input: {
            client_id: 'billing-test-1',
            case_type: 'labor',
            case_value: 50000,
            billing_type: 'hourly' as const,
            hourly_rate: 400,
            estimated_hours: 40
          }
        },
        {
          name: 'Percentage with success fee',
          input: {
            client_id: 'billing-test-2',
            case_type: 'corporate',
            case_value: 1000000,
            billing_type: 'percentage' as const,
            percentage_rate: 15
          }
        },
        {
          name: 'Fixed fee arrangement',
          input: {
            client_id: 'billing-test-3',
            case_type: 'family',
            case_value: 30000,
            billing_type: 'fixed' as const,
            fixed_amount: 15000
          }
        }
      ]
      
      for (const scenario of billingScenarios) {
        const result = await discountService.calculateDiscount(testLawFirmId, scenario.input)
        
        console.log(`\n${scenario.name}:`)
        console.log(`Original: R$ ${result.original_amount}`)
        console.log(`Discount: R$ ${result.total_discount_amount} (${result.discount_percentage}%)`)
        console.log(`Final: R$ ${result.discounted_amount}`)
        console.log(`Applied rules: ${result.applied_rules.map(r => r.rule_name).join(', ')}`)
        
        // Verify billing system requirements
        expect(result.original_amount).toBeDefined()
        expect(result.discounted_amount).toBeDefined()
        expect(result.total_discount_amount).toBeDefined()
        expect(result.applied_rules).toBeDefined()
        expect(result.eligibility_reasons).toBeDefined()
        
        // Ensure all amounts are non-negative
        expect(result.original_amount).toBeGreaterThanOrEqual(0)
        expect(result.discounted_amount).toBeGreaterThanOrEqual(0)
        expect(result.total_discount_amount).toBeGreaterThanOrEqual(0)
        
        // Ensure consistency
        expect(Math.abs(
          result.original_amount - result.discounted_amount - result.total_discount_amount
        )).toBeLessThan(0.01)
      }
    })
  })

  describe('Preset Rules Validation', () => {
    
    it('should create and apply all preset rules correctly', async () => {
      // Create preset rules
      const presetRules = await discountService.createPresetRules(testLawFirmId)
      createdRuleIds.push(...presetRules.map(r => r.id))
      
      console.log('\nCreated preset rules:')
      presetRules.forEach(rule => {
        console.log(`- ${rule.rule_name} (${rule.rule_type})`)
      })
      
      expect(presetRules.length).toBe(PRESET_DISCOUNT_RULES.length)
      
      // Test each preset rule scenario
      const testScenarios = [
        {
          name: 'Premium subscriber labor case',
          input: {
            client_id: 'preset-test-premium',
            case_type: 'labor',
            case_value: 50000,
            billing_type: 'fixed' as const,
            fixed_amount: 25000
          },
          expectedRule: 'Desconto Assinante Premium - Trabalhista'
        },
        {
          name: 'Loyal client case',
          input: {
            client_id: 'preset-test-loyal',
            case_type: 'corporate',
            case_value: 80000,
            billing_type: 'percentage' as const,
            percentage_rate: 20
          },
          expectedRule: 'Desconto Cliente Fidelidade'
        }
      ]
      
      for (const scenario of testScenarios) {
        const result = await discountService.calculateDiscount(testLawFirmId, scenario.input)
        
        console.log(`\n${scenario.name}:`)
        console.log(`Applied rules: ${result.applied_rules.map(r => r.rule_name).join(', ')}`)
        console.log(`Discount: ${result.discount_percentage}%`)
        
        if (result.eligible && scenario.expectedRule) {
          const expectedRuleApplied = result.applied_rules.some(
            r => r.rule_name.includes(scenario.expectedRule.substring(0, 20))
          )
          expect(expectedRuleApplied).toBe(true)
        }
      }
    })
  })
})