// =====================================================
// DISCOUNT ENGINE TYPES
// =====================================================

export interface DiscountRule {
  id: string
  law_firm_id: string
  rule_name: string
  rule_type: DiscountRuleType
  is_active: boolean
  priority: number
  conditions: DiscountCondition[]
  discount_config: DiscountConfig
  valid_from: string
  valid_until?: string
  max_uses?: number
  current_uses: number
  created_at: string
  updated_at: string
}

export interface DiscountCondition {
  id: string
  condition_type: ConditionType
  field_name: string
  operator: ConditionOperator
  value: string | number | boolean
  is_required: boolean
}

export interface DiscountConfig {
  discount_type: DiscountType
  value: number
  max_discount_amount?: number
  min_case_value?: number
  applies_to: AppliesTo[]
  compound_with_other_discounts: boolean
}

export interface DiscountEligibility {
  eligible: boolean
  discount_percentage: number
  max_discount: number
  applied_rules: AppliedDiscountRule[]
  total_discount_amount: number
  original_amount: number
  discounted_amount: number
  eligibility_reasons: string[]
  warnings: string[]
}

export interface AppliedDiscountRule {
  rule_id: string
  rule_name: string
  discount_type: DiscountType
  discount_value: number
  discount_amount: number
  priority: number
}

export interface CrossSellingOpportunity {
  client_id: string
  subscription_plan?: string
  potential_discount_percentage: number
  estimated_case_value: number
  projected_savings: number
  subscription_recommendation: string
  confidence_score: number
}

// Enums
export type DiscountRuleType = 'subscription_based' | 'volume_based' | 'loyalty_based' | 'promotional' | 'case_specific'
export type DiscountType = 'percentage' | 'fixed_amount' | 'tiered'
export type ConditionType = 'subscription_status' | 'subscription_plan' | 'client_tenure' | 'case_value' | 'case_type' | 'payment_history' | 'volume_threshold'
export type ConditionOperator = 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'greater_equal' | 'less_equal' | 'contains' | 'in_list'
export type AppliesTo = 'hourly_fees' | 'percentage_fees' | 'fixed_fees' | 'success_fees' | 'total_case_value'

// Configuration options
export const DISCOUNT_RULE_TYPE_OPTIONS = [
  { value: 'subscription_based', label: 'Baseado em Assinatura', description: 'Descontos para assinantes de planos' },
  { value: 'volume_based', label: 'Baseado em Volume', description: 'Descontos por volume de casos' },
  { value: 'loyalty_based', label: 'Baseado em Fidelidade', description: 'Descontos por tempo de relacionamento' },
  { value: 'promotional', label: 'Promocional', description: 'Campanhas promocionais temporárias' },
  { value: 'case_specific', label: 'Específico do Caso', description: 'Descontos baseados no tipo/valor do caso' }
] as const

export const DISCOUNT_TYPE_OPTIONS = [
  { value: 'percentage', label: 'Percentual', description: 'Desconto em porcentagem do valor' },
  { value: 'fixed_amount', label: 'Valor Fixo', description: 'Desconto em valor fixo' },
  { value: 'tiered', label: 'Escalonado', description: 'Desconto progressivo por faixas' }
] as const

export const CONDITION_TYPE_OPTIONS = [
  { value: 'subscription_status', label: 'Status da Assinatura', field_type: 'select' },
  { value: 'subscription_plan', label: 'Plano de Assinatura', field_type: 'select' },
  { value: 'client_tenure', label: 'Tempo de Cliente (meses)', field_type: 'number' },
  { value: 'case_value', label: 'Valor do Caso', field_type: 'number' },
  { value: 'case_type', label: 'Tipo do Caso', field_type: 'select' },
  { value: 'payment_history', label: 'Histórico de Pagamento', field_type: 'select' },
  { value: 'volume_threshold', label: 'Volume de Casos', field_type: 'number' }
] as const

export const CONDITION_OPERATOR_OPTIONS = [
  { value: 'equals', label: 'Igual a', compatible_types: ['select', 'text', 'number'] },
  { value: 'not_equals', label: 'Diferente de', compatible_types: ['select', 'text', 'number'] },
  { value: 'greater_than', label: 'Maior que', compatible_types: ['number'] },
  { value: 'less_than', label: 'Menor que', compatible_types: ['number'] },
  { value: 'greater_equal', label: 'Maior ou igual', compatible_types: ['number'] },
  { value: 'less_equal', label: 'Menor ou igual', compatible_types: ['number'] },
  { value: 'contains', label: 'Contém', compatible_types: ['text'] },
  { value: 'in_list', label: 'Em lista', compatible_types: ['select'] }
] as const

export const APPLIES_TO_OPTIONS = [
  { value: 'hourly_fees', label: 'Honorários por Hora' },
  { value: 'percentage_fees', label: 'Honorários Percentuais' },
  { value: 'fixed_fees', label: 'Honorários Fixos' },
  { value: 'success_fees', label: 'Honorários de Êxito' },
  { value: 'total_case_value', label: 'Valor Total do Caso' }
] as const

// Pre-configured discount rules for Brazilian legal market
export const PRESET_DISCOUNT_RULES = [
  {
    rule_name: 'Desconto Assinante Premium - Trabalhista',
    rule_type: 'subscription_based',
    conditions: [
      { condition_type: 'subscription_status', operator: 'equals', value: 'active' },
      { condition_type: 'subscription_plan', operator: 'in_list', value: 'premium,enterprise' },
      { condition_type: 'case_type', operator: 'equals', value: 'labor' }
    ],
    discount_config: {
      discount_type: 'percentage',
      value: 15,
      max_discount_amount: 5000,
      min_case_value: 10000,
      applies_to: ['hourly_fees', 'fixed_fees']
    }
  },
  {
    rule_name: 'Desconto Cliente Fidelidade',
    rule_type: 'loyalty_based',
    conditions: [
      { condition_type: 'client_tenure', operator: 'greater_equal', value: 12 },
      { condition_type: 'payment_history', operator: 'equals', value: 'excellent' }
    ],
    discount_config: {
      discount_type: 'percentage',
      value: 10,
      max_discount_amount: 3000,
      applies_to: ['hourly_fees', 'percentage_fees', 'fixed_fees']
    }
  },
  {
    rule_name: 'Desconto Volume Alto Valor',
    rule_type: 'volume_based',
    conditions: [
      { condition_type: 'case_value', operator: 'greater_than', value: 100000 },
      { condition_type: 'volume_threshold', operator: 'greater_equal', value: 3 }
    ],
    discount_config: {
      discount_type: 'tiered',
      value: 20,
      max_discount_amount: 15000,
      applies_to: ['percentage_fees', 'success_fees']
    }
  }
] as const

// Utility types for form handling
export interface DiscountRuleFormData {
  rule_name: string
  rule_type: DiscountRuleType
  priority: number
  conditions: Omit<DiscountCondition, 'id'>[]
  discount_config: DiscountConfig
  valid_from: string
  valid_until?: string
  max_uses?: number
  is_active: boolean
}

export interface DiscountCalculationInput {
  client_id: string
  case_id?: string
  case_type: string
  case_value: number
  billing_type: 'hourly' | 'percentage' | 'fixed'
  hourly_rate?: number
  estimated_hours?: number
  percentage_rate?: number
  fixed_amount?: number
}

export interface DiscountAnalytics {
  law_firm_id: string
  period_start: string
  period_end: string
  total_discounts_applied: number
  total_discount_amount: number
  average_discount_percentage: number
  most_used_rule: string
  cross_selling_conversions: number
  revenue_impact: {
    gross_revenue: number
    discount_amount: number
    net_revenue: number
    estimated_revenue_without_discounts: number
  }
  rule_performance: Array<{
    rule_id: string
    rule_name: string
    uses: number
    total_discount: number
    avg_discount: number
    conversion_rate: number
  }>
}