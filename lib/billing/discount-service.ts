// =====================================================
// DISCOUNT ENGINE SERVICE LAYER
// =====================================================

import {
  DiscountRule,
  DiscountCondition,
  DiscountConfig,
  DiscountEligibility,
  AppliedDiscountRule,
  CrossSellingOpportunity,
  DiscountRuleFormData,
  DiscountCalculationInput,
  DiscountAnalytics,
  DiscountRuleType,
  DiscountType,
  ConditionType,
  ConditionOperator,
  AppliesTo,
  PRESET_DISCOUNT_RULES
} from './discount-types'

export class DiscountService {
  
  // ===== DISCOUNT RULE MANAGEMENT =====
  
  async getDiscountRules(lawFirmId: string): Promise<DiscountRule[]> {
    // Mock implementation - replace with Supabase in production
    return this.mockDiscountRules.filter(rule => rule.law_firm_id === lawFirmId)
      .sort((a, b) => b.priority - a.priority)
  }

  async getDiscountRule(ruleId: string): Promise<DiscountRule | null> {
    return this.mockDiscountRules.find(rule => rule.id === ruleId) || null
  }

  async createDiscountRule(
    lawFirmId: string,
    formData: DiscountRuleFormData
  ): Promise<DiscountRule> {
    try {
      // Validate rule data
      this.validateDiscountRuleData(formData)
      
      // Create new rule
      const newRule: DiscountRule = {
        id: `rule-${Date.now()}`,
        law_firm_id: lawFirmId,
        rule_name: formData.rule_name,
        rule_type: formData.rule_type,
        is_active: formData.is_active,
        priority: formData.priority,
        conditions: formData.conditions.map((condition, index) => ({
          id: `cond-${Date.now()}-${index}`,
          ...condition
        })),
        discount_config: formData.discount_config,
        valid_from: formData.valid_from,
        valid_until: formData.valid_until,
        max_uses: formData.max_uses,
        current_uses: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      console.log('Creating discount rule:', newRule)
      this.mockDiscountRules.push(newRule)
      
      return newRule
    } catch (error) {
      console.error('Error creating discount rule:', error)
      throw error
    }
  }

  async updateDiscountRule(
    ruleId: string,
    updates: Partial<DiscountRuleFormData>
  ): Promise<DiscountRule> {
    const ruleIndex = this.mockDiscountRules.findIndex(rule => rule.id === ruleId)
    if (ruleIndex === -1) {
      throw new Error('Discount rule not found')
    }

    const updatedRule = {
      ...this.mockDiscountRules[ruleIndex],
      ...updates,
      updated_at: new Date().toISOString()
    }

    console.log('Updating discount rule:', updatedRule)
    this.mockDiscountRules[ruleIndex] = updatedRule
    
    return updatedRule
  }

  async toggleDiscountRule(ruleId: string): Promise<DiscountRule> {
    const rule = await this.getDiscountRule(ruleId)
    if (!rule) {
      throw new Error('Discount rule not found')
    }

    return this.updateDiscountRule(ruleId, { is_active: !rule.is_active })
  }

  async deleteDiscountRule(ruleId: string): Promise<void> {
    const ruleIndex = this.mockDiscountRules.findIndex(rule => rule.id === ruleId)
    if (ruleIndex === -1) {
      throw new Error('Discount rule not found')
    }

    this.mockDiscountRules.splice(ruleIndex, 1)
    console.log('Deleted discount rule:', ruleId)
  }

  // ===== DISCOUNT CALCULATION ENGINE =====

  async calculateDiscount(
    lawFirmId: string,
    input: DiscountCalculationInput
  ): Promise<DiscountEligibility> {
    try {
      // Get all active rules for the law firm
      const rules = await this.getDiscountRules(lawFirmId)
      const activeRules = rules.filter(rule => 
        rule.is_active && 
        this.isRuleValid(rule) &&
        this.hasUsesRemaining(rule)
      )

      // Get client context for rule evaluation
      const clientContext = await this.getClientContext(input.client_id)
      
      // Evaluate each rule against the input
      const applicableRules: AppliedDiscountRule[] = []
      
      for (const rule of activeRules) {
        if (await this.evaluateRule(rule, input, clientContext)) {
          const discountAmount = this.calculateRuleDiscount(rule, input)
          
          if (discountAmount > 0) {
            applicableRules.push({
              rule_id: rule.id,
              rule_name: rule.rule_name,
              discount_type: rule.discount_config.discount_type,
              discount_value: rule.discount_config.value,
              discount_amount: discountAmount,
              priority: rule.priority
            })
          }
        }
      }

      // Sort by priority and apply compound rules
      applicableRules.sort((a, b) => b.priority - a.priority)
      
      // Calculate total discount
      const result = this.calculateTotalDiscount(input, applicableRules)
      
      console.log('Discount calculation result:', {
        clientId: input.client_id,
        caseValue: input.case_value,
        applicableRules: applicableRules.length,
        totalDiscount: result.total_discount_amount
      })

      return result
    } catch (error) {
      console.error('Error calculating discount:', error)
      return this.getNoDiscountResult(input)
    }
  }

  async checkCrossSellingOpportunity(
    clientId: string,
    estimatedCaseValue: number,
    caseType: string
  ): Promise<CrossSellingOpportunity> {
    const clientContext = await this.getClientContext(clientId)
    
    // If client already has subscription, calculate current discount
    if (clientContext.subscription_status === 'active') {
      const input: DiscountCalculationInput = {
        client_id: clientId,
        case_type: caseType,
        case_value: estimatedCaseValue,
        billing_type: 'percentage',
        percentage_rate: 20
      }
      
      const eligibility = await this.calculateDiscount(clientContext.law_firm_id, input)
      
      return {
        client_id: clientId,
        subscription_plan: clientContext.subscription_plan,
        potential_discount_percentage: eligibility.discount_percentage,
        estimated_case_value: estimatedCaseValue,
        projected_savings: eligibility.total_discount_amount,
        subscription_recommendation: 'Current plan provides optimal discounts',
        confidence_score: 0.95
      }
    }

    // For non-subscribers, calculate potential savings with subscription plans
    const recommendedPlan = this.getRecommendedSubscriptionPlan(estimatedCaseValue, caseType)
    const projectedDiscount = this.calculateProjectedDiscount(estimatedCaseValue, recommendedPlan)
    
    return {
      client_id: clientId,
      potential_discount_percentage: projectedDiscount.percentage,
      estimated_case_value: estimatedCaseValue,
      projected_savings: projectedDiscount.amount,
      subscription_recommendation: `Subscribe to ${recommendedPlan.name} plan`,
      confidence_score: projectedDiscount.confidence
    }
  }

  // ===== PRESET RULES =====

  async createPresetRules(lawFirmId: string): Promise<DiscountRule[]> {
    const createdRules: DiscountRule[] = []
    
    for (const preset of PRESET_DISCOUNT_RULES) {
      try {
        const ruleData: DiscountRuleFormData = {
          rule_name: preset.rule_name,
          rule_type: preset.rule_type as DiscountRuleType,
          priority: 5,
          conditions: preset.conditions.map(cond => ({
            condition_type: cond.condition_type as ConditionType,
            field_name: cond.condition_type,
            operator: cond.operator as ConditionOperator,
            value: cond.value,
            is_required: true
          })),
          discount_config: preset.discount_config as DiscountConfig,
          valid_from: new Date().toISOString().split('T')[0],
          is_active: true
        }
        
        const rule = await this.createDiscountRule(lawFirmId, ruleData)
        createdRules.push(rule)
      } catch (error) {
        console.error('Error creating preset rule:', preset.rule_name, error)
      }
    }
    
    console.log(`Created ${createdRules.length} preset discount rules`)
    return createdRules
  }

  // ===== ANALYTICS =====

  async getDiscountAnalytics(
    lawFirmId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<DiscountAnalytics> {
    // Mock analytics implementation
    const rules = await this.getDiscountRules(lawFirmId)
    const totalRules = rules.length
    const activeRules = rules.filter(r => r.is_active).length
    
    return {
      law_firm_id: lawFirmId,
      period_start: periodStart,
      period_end: periodEnd,
      total_discounts_applied: 45,
      total_discount_amount: 87500.00,
      average_discount_percentage: 12.5,
      most_used_rule: 'Desconto Assinante Premium - Trabalhista',
      cross_selling_conversions: 8,
      revenue_impact: {
        gross_revenue: 750000.00,
        discount_amount: 87500.00,
        net_revenue: 662500.00,
        estimated_revenue_without_discounts: 580000.00 // Lower without cross-selling
      },
      rule_performance: rules.map(rule => ({
        rule_id: rule.id,
        rule_name: rule.rule_name,
        uses: rule.current_uses,
        total_discount: rule.current_uses * 1500,
        avg_discount: 1500,
        conversion_rate: rule.current_uses > 0 ? 0.85 : 0
      }))
    }
  }

  // ===== UTILITY FUNCTIONS =====

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`
  }

  // ===== PRIVATE METHODS =====

  private validateDiscountRuleData(data: DiscountRuleFormData): void {
    if (!data.rule_name || data.rule_name.length < 3) {
      throw new Error('Rule name must be at least 3 characters long')
    }
    if (data.priority < 1 || data.priority > 10) {
      throw new Error('Priority must be between 1 and 10')
    }
    if (data.conditions.length === 0) {
      throw new Error('At least one condition is required')
    }
    if (data.discount_config.value <= 0) {
      throw new Error('Discount value must be greater than zero')
    }
    if (data.discount_config.discount_type === 'percentage' && data.discount_config.value > 100) {
      throw new Error('Percentage discount cannot exceed 100%')
    }
  }

  private isRuleValid(rule: DiscountRule): boolean {
    const now = new Date()
    const validFrom = new Date(rule.valid_from)
    const validUntil = rule.valid_until ? new Date(rule.valid_until) : null
    
    return now >= validFrom && (!validUntil || now <= validUntil)
  }

  private hasUsesRemaining(rule: DiscountRule): boolean {
    return !rule.max_uses || rule.current_uses < rule.max_uses
  }

  private async getClientContext(clientId: string): Promise<any> {
    // Mock client context - replace with actual client data in production
    const baseContext = {
      law_firm_id: 'firm-1',
      client_tenure_months: 18,
      payment_history: 'excellent',
      total_cases: 5,
      total_paid: 125000.00
    }

    // Different contexts based on client ID for testing
    if (clientId.includes('non-subscriber') || clientId.includes('potential-subscriber')) {
      return {
        ...baseContext,
        subscription_status: 'inactive',
        subscription_plan: null,
        client_tenure_months: 6,
        total_cases: 1
      }
    } else if (clientId.includes('ineligible')) {
      return {
        ...baseContext,
        subscription_status: 'inactive',
        subscription_plan: null,
        client_tenure_months: 2,
        payment_history: 'poor',
        total_cases: 1,
        total_paid: 5000.00
      }
    } else {
      // Default to active subscriber for test clients
      return {
        ...baseContext,
        subscription_status: 'active',
        subscription_plan: 'premium'
      }
    }
  }

  private async evaluateRule(
    rule: DiscountRule,
    input: DiscountCalculationInput,
    clientContext: any
  ): Promise<boolean> {
    // Evaluate all conditions
    for (const condition of rule.conditions) {
      if (!this.evaluateCondition(condition, input, clientContext)) {
        return false // All conditions must be true
      }
    }
    
    // Check if discount applies to this billing type
    const appliesTo = rule.discount_config.applies_to
    const billingTypeMapping = {
      'hourly': 'hourly_fees',
      'percentage': 'percentage_fees',
      'fixed': 'fixed_fees'
    }
    
    const targetAppliesTo = billingTypeMapping[input.billing_type]
    if (!appliesTo.includes(targetAppliesTo as AppliesTo) && !appliesTo.includes('total_case_value')) {
      return false
    }
    
    return true
  }

  private evaluateCondition(
    condition: DiscountCondition,
    input: DiscountCalculationInput,
    clientContext: any
  ): boolean {
    let fieldValue: any
    
    // Get the field value based on condition type
    switch (condition.condition_type) {
      case 'subscription_status':
        fieldValue = clientContext.subscription_status
        break
      case 'subscription_plan':
        fieldValue = clientContext.subscription_plan
        break
      case 'client_tenure':
        fieldValue = clientContext.client_tenure_months
        break
      case 'case_value':
        fieldValue = input.case_value
        break
      case 'case_type':
        fieldValue = input.case_type
        break
      case 'payment_history':
        fieldValue = clientContext.payment_history
        break
      case 'volume_threshold':
        fieldValue = clientContext.total_cases
        break
      default:
        return false
    }
    
    // Evaluate the condition
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value
      case 'not_equals':
        return fieldValue !== condition.value
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value)
      case 'less_than':
        return Number(fieldValue) < Number(condition.value)
      case 'greater_equal':
        return Number(fieldValue) >= Number(condition.value)
      case 'less_equal':
        return Number(fieldValue) <= Number(condition.value)
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase())
      case 'in_list':
        const list = String(condition.value).split(',').map(v => v.trim())
        return list.includes(String(fieldValue))
      default:
        return false
    }
  }

  private calculateRuleDiscount(rule: DiscountRule, input: DiscountCalculationInput): number {
    const config = rule.discount_config
    let baseAmount = 0
    
    // Calculate base amount to apply discount to
    switch (input.billing_type) {
      case 'hourly':
        baseAmount = (input.hourly_rate || 0) * (input.estimated_hours || 0)
        break
      case 'percentage':
        baseAmount = input.case_value * ((input.percentage_rate || 0) / 100)
        break
      case 'fixed':
        baseAmount = input.fixed_amount || 0
        break
    }
    
    // Check minimum case value requirement
    if (config.min_case_value && input.case_value < config.min_case_value) {
      return 0
    }
    
    let discountAmount = 0
    
    // Calculate discount based on type
    switch (config.discount_type) {
      case 'percentage':
        discountAmount = baseAmount * (config.value / 100)
        break
      case 'fixed_amount':
        discountAmount = config.value
        break
      case 'tiered':
        // Simplified tiered calculation
        const tier = Math.floor(input.case_value / 50000)
        const tierMultiplier = Math.min(tier * 0.05, 0.25) // Max 25%
        discountAmount = baseAmount * (config.value / 100) * (1 + tierMultiplier)
        break
    }
    
    // Apply maximum discount limit
    if (config.max_discount_amount && discountAmount > config.max_discount_amount) {
      discountAmount = config.max_discount_amount
    }
    
    return Math.round(discountAmount * 100) / 100
  }

  private calculateTotalDiscount(
    input: DiscountCalculationInput,
    applicableRules: AppliedDiscountRule[]
  ): DiscountEligibility {
    if (applicableRules.length === 0) {
      return this.getNoDiscountResult(input)
    }
    
    let totalDiscountAmount = 0
    let originalAmount = 0
    
    // Calculate original amount
    switch (input.billing_type) {
      case 'hourly':
        originalAmount = (input.hourly_rate || 0) * (input.estimated_hours || 0)
        break
      case 'percentage':
        originalAmount = input.case_value * ((input.percentage_rate || 0) / 100)
        break
      case 'fixed':
        originalAmount = input.fixed_amount || 0
        break
    }
    
    // Apply discounts (compound or highest)
    const primaryRule = applicableRules[0]
    totalDiscountAmount = primaryRule.discount_amount
    
    // For compound discounts, add additional rules with diminishing returns
    for (let i = 1; i < applicableRules.length; i++) {
      const rule = applicableRules[i]
      // Apply 50% efficiency to subsequent rules to prevent over-discounting
      totalDiscountAmount += rule.discount_amount * 0.5
    }
    
    // Ensure we don't discount more than the original amount
    totalDiscountAmount = Math.min(totalDiscountAmount, originalAmount)
    
    const discountPercentage = originalAmount > 0 ? (totalDiscountAmount / originalAmount) * 100 : 0
    
    return {
      eligible: true,
      discount_percentage: discountPercentage,
      max_discount: totalDiscountAmount,
      applied_rules: applicableRules,
      total_discount_amount: totalDiscountAmount,
      original_amount: originalAmount,
      discounted_amount: originalAmount - totalDiscountAmount,
      eligibility_reasons: applicableRules.map(rule => 
        `${rule.rule_name}: ${this.formatCurrency(rule.discount_amount)}`
      ),
      warnings: []
    }
  }

  private getNoDiscountResult(input: DiscountCalculationInput): DiscountEligibility {
    let originalAmount = 0
    
    switch (input.billing_type) {
      case 'hourly':
        originalAmount = (input.hourly_rate || 0) * (input.estimated_hours || 0)
        break
      case 'percentage':
        originalAmount = input.case_value * ((input.percentage_rate || 0) / 100)
        break
      case 'fixed':
        originalAmount = input.fixed_amount || 0
        break
    }
    
    return {
      eligible: false,
      discount_percentage: 0,
      max_discount: 0,
      applied_rules: [],
      total_discount_amount: 0,
      original_amount: originalAmount,
      discounted_amount: originalAmount,
      eligibility_reasons: [],
      warnings: ['No applicable discount rules found']
    }
  }

  private getRecommendedSubscriptionPlan(caseValue: number, caseType: string): any {
    if (caseValue > 50000) {
      return { name: 'Premium', monthly_fee: 599, projected_discount: 15 }
    } else if (caseValue > 20000) {
      return { name: 'Standard', monthly_fee: 399, projected_discount: 10 }
    } else {
      return { name: 'Basic', monthly_fee: 299, projected_discount: 5 }
    }
  }

  private calculateProjectedDiscount(caseValue: number, plan: any): any {
    const discountAmount = caseValue * (plan.projected_discount / 100)
    return {
      percentage: plan.projected_discount,
      amount: discountAmount,
      confidence: 0.88
    }
  }

  // ===== MOCK DATA =====

  private mockDiscountRules: DiscountRule[] = [
    {
      id: '1',
      law_firm_id: 'firm-1',
      rule_name: 'Desconto Assinante Premium',
      rule_type: 'subscription_based',
      is_active: true,
      priority: 9,
      conditions: [
        {
          id: 'cond-1',
          condition_type: 'subscription_status',
          field_name: 'subscription_status',
          operator: 'equals',
          value: 'active',
          is_required: true
        },
        {
          id: 'cond-2',
          condition_type: 'subscription_plan',
          field_name: 'subscription_plan',
          operator: 'in_list',
          value: 'premium,enterprise',
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
      valid_from: '2024-01-01',
      max_uses: undefined,
      current_uses: 23,
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z'
    },
    {
      id: '2',
      law_firm_id: 'firm-1',
      rule_name: 'Desconto Fidelidade Cliente',
      rule_type: 'loyalty_based',
      is_active: true,
      priority: 7,
      conditions: [
        {
          id: 'cond-3',
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
        max_discount_amount: 3000,
        applies_to: ['hourly_fees', 'percentage_fees'],
        compound_with_other_discounts: false
      },
      valid_from: '2024-01-01',
      max_uses: undefined,
      current_uses: 15,
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z'
    }
  ]
}

// Export singleton instance
export const discountService = new DiscountService()