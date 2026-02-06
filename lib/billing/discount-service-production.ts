// =====================================================
// PRODUCTION DISCOUNT SERVICE LAYER
// Real Supabase Integration for Discount Management
// =====================================================

import { createClient } from '@/lib/supabase/client'
import {
  DiscountRule,
  DiscountRuleFormData,
  DiscountCalculationInput,
  DiscountCalculationResult,
  ClientDiscountEligibility,
  DiscountUsageTracking,
  DiscountType,
  DiscountRuleType,
  DiscountApplicationResult
} from './discount-types'

export class ProductionDiscountService {
  private supabase = createClient()

  // ===== DISCOUNT RULE MANAGEMENT =====

  async getDiscountRules(lawFirmId: string): Promise<DiscountRule[]> {
    try {
      const { data, error } = await this.supabase
        .from('discount_rules')
        .select('*')
        .eq('law_firm_id', lawFirmId)
        .eq('is_active', true)
        .order('priority', { ascending: false })

      if (error) {
        console.error('Error fetching discount rules:', error)
        throw new Error('Failed to fetch discount rules')
      }

      return data || []
    } catch (error) {
      console.error('Error fetching discount rules:', error)
      throw error
    }
  }

  async getDiscountRule(ruleId: string): Promise<DiscountRule | null> {
    try {
      const { data, error } = await this.supabase
        .from('discount_rules')
        .select('*')
        .eq('id', ruleId)
        .single()

      if (error && error.code !== 'PGRST116') { // Not found is OK
        console.error('Error fetching discount rule:', error)
        throw new Error('Failed to fetch discount rule')
      }

      return data || null
    } catch (error) {
      console.error('Error fetching discount rule:', error)
      throw error
    }
  }

  async createDiscountRule(lawFirmId: string, formData: DiscountRuleFormData): Promise<DiscountRule> {
    try {
      this.validateDiscountRuleData(formData)

      const { data: newRule, error } = await this.supabase
        .from('discount_rules')
        .insert({
          law_firm_id: lawFirmId,
          ...formData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error || !newRule) {
        console.error('Error creating discount rule:', error)
        throw new Error('Failed to create discount rule')
      }

      return newRule
    } catch (error) {
      console.error('Error creating discount rule:', error)
      throw error
    }
  }

  async updateDiscountRule(ruleId: string, formData: Partial<DiscountRuleFormData>): Promise<DiscountRule> {
    try {
      const { data: updatedRule, error } = await this.supabase
        .from('discount_rules')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', ruleId)
        .select()
        .single()

      if (error || !updatedRule) {
        console.error('Error updating discount rule:', error)
        throw new Error('Failed to update discount rule')
      }

      return updatedRule
    } catch (error) {
      console.error('Error updating discount rule:', error)
      throw error
    }
  }

  async deleteDiscountRule(ruleId: string): Promise<void> {
    try {
      // Soft delete
      const { error } = await this.supabase
        .from('discount_rules')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', ruleId)

      if (error) {
        console.error('Error deleting discount rule:', error)
        throw new Error('Failed to delete discount rule')
      }
    } catch (error) {
      console.error('Error deleting discount rule:', error)
      throw error
    }
  }

  // ===== DISCOUNT CALCULATION =====

  async calculateDiscount(input: DiscountCalculationInput): Promise<DiscountCalculationResult> {
    try {
      // Get law firm ID from client subscription
      const { data: subscription, error: subError } = await this.supabase
        .from('client_subscriptions')
        .select('law_firm_id, contact_id, subscription_plan_id')
        .eq('id', input.client_subscription_id)
        .single()

      if (subError || !subscription) {
        throw new Error('Client subscription not found')
      }

      // Get applicable discount rules
      const rules = await this.getApplicableRules(
        subscription.law_firm_id,
        input,
        subscription.contact_id,
        subscription.subscription_plan_id
      )

      // Calculate best discount
      let bestDiscount = 0
      let appliedRule: DiscountRule | null = null
      let discountBreakdown: any[] = []

      for (const rule of rules) {
        const discount = await this.calculateRuleDiscount(rule, input)
        
        discountBreakdown.push({
          rule_id: rule.id,
          rule_name: rule.name,
          discount_amount: discount,
          discount_percentage: rule.discount_type === 'percentage' ? rule.discount_value : 0
        })

        if (discount > bestDiscount) {
          bestDiscount = discount
          appliedRule = rule
        }
      }

      // Apply maximum discount limit if specified
      if (appliedRule?.maximum_discount_amount && bestDiscount > appliedRule.maximum_discount_amount) {
        bestDiscount = appliedRule.maximum_discount_amount
      }

      const finalAmount = Math.max(0, input.base_amount - bestDiscount)

      return {
        original_amount: input.base_amount,
        discount_amount: bestDiscount,
        final_amount: finalAmount,
        applied_rule_id: appliedRule?.id || null,
        applied_rule_name: appliedRule?.name || null,
        discount_percentage: appliedRule ? this.calculateEffectivePercentage(input.base_amount, bestDiscount) : 0,
        eligible_discounts: discountBreakdown,
        calculation_date: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error calculating discount:', error)
      throw error
    }
  }

  // ===== DISCOUNT ELIGIBILITY =====

  async checkClientDiscountEligibility(
    clientId: string,
    serviceType: string,
    caseType?: string
  ): Promise<ClientDiscountEligibility> {
    try {
      // Get client subscription information
      const { data: subscription, error: subError } = await this.supabase
        .from('client_subscriptions')
        .select(`
          *,
          subscription_plans(*)
        `)
        .eq('contact_id', clientId)
        .eq('status', 'active')
        .single()

      if (subError || !subscription) {
        return {
          client_id: clientId,
          is_eligible: false,
          subscription_status: 'none',
          eligible_discounts: [],
          subscription_benefits: []
        }
      }

      // Get applicable discount rules
      const rules = await this.getDiscountRules(subscription.law_firm_id)
      const eligibleRules = rules.filter(rule => 
        this.isRuleApplicable(rule, serviceType, caseType)
      )

      return {
        client_id: clientId,
        is_eligible: eligibleRules.length > 0,
        subscription_status: subscription.status,
        subscription_plan_name: subscription.subscription_plans?.plan_name,
        eligible_discounts: eligibleRules.map(rule => ({
          rule_id: rule.id,
          rule_name: rule.name,
          discount_type: rule.discount_type,
          discount_value: rule.discount_value,
          maximum_discount: rule.maximum_discount_amount,
          description: rule.description
        })),
        subscription_benefits: this.getSubscriptionBenefits(subscription)
      }
    } catch (error) {
      console.error('Error checking discount eligibility:', error)
      throw error
    }
  }

  // ===== DISCOUNT USAGE TRACKING =====

  async trackDiscountUsage(
    ruleId: string,
    clientId: string,
    appliedAmount: number,
    serviceType: string,
    referenceId?: string
  ): Promise<DiscountUsageTracking> {
    try {
      const { data: usage, error } = await this.supabase
        .from('discount_usage_tracking')
        .insert({
          discount_rule_id: ruleId,
          client_id: clientId,
          applied_amount: appliedAmount,
          service_type: serviceType,
          reference_id: referenceId,
          used_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error || !usage) {
        console.error('Error tracking discount usage:', error)
        throw new Error('Failed to track discount usage')
      }

      return usage
    } catch (error) {
      console.error('Error tracking discount usage:', error)
      throw error
    }
  }

  async getDiscountUsageStats(ruleId: string, period?: { start: string; end: string }): Promise<any> {
    try {
      let query = this.supabase
        .from('discount_usage_tracking')
        .select('applied_amount, used_at, client_id')
        .eq('discount_rule_id', ruleId)

      if (period) {
        query = query
          .gte('used_at', period.start)
          .lte('used_at', period.end)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error getting discount usage stats:', error)
        throw new Error('Failed to get discount usage statistics')
      }

      const stats = {
        total_usage_count: data?.length || 0,
        total_discount_amount: data?.reduce((sum, usage) => sum + usage.applied_amount, 0) || 0,
        unique_clients: new Set(data?.map(usage => usage.client_id)).size,
        usage_by_month: this.groupUsageByMonth(data || [])
      }

      return stats
    } catch (error) {
      console.error('Error getting discount usage stats:', error)
      throw error
    }
  }

  // ===== PRIVATE HELPER METHODS =====

  private async getApplicableRules(
    lawFirmId: string,
    input: DiscountCalculationInput,
    clientId: string,
    subscriptionPlanId: string
  ): Promise<DiscountRule[]> {
    const rules = await this.getDiscountRules(lawFirmId)
    
    return rules.filter(rule => {
      // Check service type applicability
      if (rule.applies_to !== 'all' && rule.applies_to !== input.service_type) {
        return false
      }

      // Check case type restrictions
      if (rule.case_type_restrictions && rule.case_type_restrictions.length > 0) {
        if (!input.case_type || !rule.case_type_restrictions.includes(input.case_type)) {
          return false
        }
      }

      // Check subscription plan restrictions
      if (rule.subscription_plan_restrictions && rule.subscription_plan_restrictions.length > 0) {
        if (!rule.subscription_plan_restrictions.includes(subscriptionPlanId)) {
          return false
        }
      }

      // Check minimum amount requirements
      if (rule.minimum_case_value && input.case_value && input.case_value < rule.minimum_case_value) {
        return false
      }

      // Check date validity
      const now = new Date()
      if (rule.start_date && new Date(rule.start_date) > now) {
        return false
      }
      if (rule.end_date && new Date(rule.end_date) < now) {
        return false
      }

      return true
    })
  }

  private async calculateRuleDiscount(rule: DiscountRule, input: DiscountCalculationInput): Promise<number> {
    if (rule.discount_type === 'percentage') {
      return (input.base_amount * rule.discount_value) / 100
    } else {
      return rule.discount_value
    }
  }

  private isRuleApplicable(rule: DiscountRule, serviceType: string, caseType?: string): boolean {
    if (rule.applies_to !== 'all' && rule.applies_to !== serviceType) {
      return false
    }

    if (rule.case_type_restrictions && rule.case_type_restrictions.length > 0) {
      if (!caseType || !rule.case_type_restrictions.includes(caseType)) {
        return false
      }
    }

    return true
  }

  private calculateEffectivePercentage(originalAmount: number, discountAmount: number): number {
    if (originalAmount === 0) return 0
    return Math.round((discountAmount / originalAmount) * 100 * 100) / 100
  }

  private getSubscriptionBenefits(subscription: any): string[] {
    const benefits = ['Descontos em honorários de casos']
    
    if (subscription.subscription_plans?.services_included) {
      benefits.push(...subscription.subscription_plans.services_included.map((service: string) => 
        this.translateServiceBenefit(service)
      ))
    }

    return benefits
  }

  private translateServiceBenefit(service: string): string {
    const translations: { [key: string]: string } = {
      'compliance_review': 'Revisão de compliance',
      'email_support': 'Suporte por email',
      'phone_support': 'Suporte telefônico',
      'priority_support': 'Suporte prioritário',
      'document_review': 'Revisão de documentos',
      'contract_review': 'Revisão de contratos',
      'regulatory_alerts': 'Alertas regulamentários'
    }
    
    return translations[service] || service
  }

  private groupUsageByMonth(usageData: any[]): any[] {
    const grouped = usageData.reduce((acc, usage) => {
      const month = usage.used_at.substring(0, 7) // YYYY-MM
      if (!acc[month]) {
        acc[month] = { month, count: 0, total_amount: 0 }
      }
      acc[month].count++
      acc[month].total_amount += usage.applied_amount
      return acc
    }, {})

    return Object.values(grouped)
  }

  private validateDiscountRuleData(formData: DiscountRuleFormData): void {
    if (!formData.name || formData.name.length < 3) {
      throw new Error('Discount rule name must be at least 3 characters long')
    }

    if (formData.discount_value <= 0) {
      throw new Error('Discount value must be greater than 0')
    }

    if (formData.discount_type === 'percentage' && formData.discount_value > 100) {
      throw new Error('Percentage discount cannot exceed 100%')
    }

    if (formData.maximum_discount_amount && formData.maximum_discount_amount <= 0) {
      throw new Error('Maximum discount amount must be greater than 0')
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
}

// Export singleton instance
export const productionDiscountService = new ProductionDiscountService()