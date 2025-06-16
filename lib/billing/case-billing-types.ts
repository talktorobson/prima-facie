// =====================================================
// PHASE 8.5: CASE BILLING SYSTEM TYPES
// =====================================================

import { DiscountEligibility } from './discount-types'

// ===== CASE TYPE DEFINITIONS =====

export interface CaseType {
  id: string
  law_firm_id: string
  name: string
  code: string
  category: string
  
  // Minimum fee structure
  minimum_fee_hourly: number
  minimum_fee_percentage: number
  minimum_fee_fixed: number
  
  // Default billing configuration
  default_billing_method: BillingMethod
  default_hourly_rate?: number
  default_percentage_rate?: number
  default_success_fee_rate?: number
  
  // Complexity factors
  complexity_multiplier: number
  estimated_hours_range?: string
  
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CaseTypeFormData {
  name: string
  code: string
  category: string
  minimum_fee_hourly: number
  minimum_fee_percentage: number
  minimum_fee_fixed: number
  default_billing_method: BillingMethod
  default_hourly_rate?: number
  default_percentage_rate?: number
  default_success_fee_rate?: number
  complexity_multiplier: number
  estimated_hours_range?: string
  is_active: boolean
}

// ===== BILLING METHOD DEFINITIONS =====

export type BillingMethod = 'hourly' | 'percentage' | 'fixed'

export interface CaseBillingMethod {
  id: string
  matter_id: string
  case_type_id?: string
  
  // Primary billing method
  billing_type: BillingMethod
  
  // Rate configuration
  hourly_rate?: number
  percentage_rate?: number
  fixed_amount?: number
  
  // Success fee configuration
  success_fee_percentage: number
  success_fee_applies_to: 'recovered' | 'total'
  
  // Minimum fee enforcement
  minimum_fee: number
  minimum_fee_source: 'case_type' | 'custom'
  
  // Subscription discount tracking
  has_subscription_discount: boolean
  original_amount?: number
  discount_percentage: number
  discount_amount: number
  final_amount?: number
  
  // Approval workflow
  status: CaseBillingStatus
  approved_by?: string
  approved_at?: string
  
  created_at: string
  updated_at: string
}

export type CaseBillingStatus = 'draft' | 'approved' | 'active'

export interface CaseBillingMethodFormData {
  matter_id: string
  case_type_id?: string
  billing_type: BillingMethod
  hourly_rate?: number
  percentage_rate?: number
  fixed_amount?: number
  success_fee_percentage: number
  success_fee_applies_to: 'recovered' | 'total'
  minimum_fee?: number
  minimum_fee_source: 'case_type' | 'custom'
}

// ===== CASE OUTCOME DEFINITIONS =====

export type CaseOutcomeType = 'settlement' | 'court_victory' | 'partial_victory' | 'loss' | 'dismissed'

export interface CaseOutcome {
  id: string
  matter_id: string
  
  // Outcome classification
  outcome_type: CaseOutcomeType
  outcome_subtype?: string
  
  // Financial tracking
  total_value_claimed?: number
  effective_value_redeemed?: number
  settlement_amount?: number
  court_award_amount?: number
  
  // Success determination
  success_achieved: boolean
  success_percentage?: number
  
  // Success fee calculation
  success_fee_percentage?: number
  success_fee_amount?: number
  success_fee_calculation_method: 'percentage' | 'sliding_scale' | 'fixed' | 'custom'
  
  // Timeline
  outcome_date: string
  final_payment_received_date?: string
  
  // Documentation
  court_decision_reference?: string
  settlement_agreement_reference?: string
  notes?: string
  
  // Approval workflow
  verified_by?: string
  verified_at?: string
  
  created_at: string
  updated_at: string
}

export interface CaseOutcomeFormData {
  matter_id: string
  outcome_type: CaseOutcomeType
  outcome_subtype?: string
  total_value_claimed?: number
  effective_value_redeemed?: number
  settlement_amount?: number
  court_award_amount?: number
  success_achieved: boolean
  success_percentage?: number
  outcome_date: string
  final_payment_received_date?: string
  court_decision_reference?: string
  settlement_agreement_reference?: string
  notes?: string
}

// ===== BILLING CALCULATION DEFINITIONS =====

export interface CaseBillingCalculationInput {
  matter_id: string
  case_value: number
  billing_method: CaseBillingMethod
  case_type?: CaseType
  client_subscription_status?: 'active' | 'inactive'
  subscription_plan?: string
}

export interface CaseBillingCalculationResult {
  matter_id: string
  billing_method: BillingMethod
  
  // Base calculation
  base_amount: number
  minimum_fee_applied: boolean
  minimum_fee_amount: number
  
  // Success fee calculation
  success_fee_eligible: boolean
  success_fee_amount: number
  
  // Discount application
  discount_eligible: boolean
  discount_details?: DiscountEligibility
  original_total: number
  discount_amount: number
  
  // Final amounts
  subtotal: number
  total_amount: number
  
  // Breakdown for transparency
  calculation_breakdown: BillingCalculationBreakdown
  
  // Validation
  is_valid: boolean
  validation_errors: string[]
  warnings: string[]
}

export interface BillingCalculationBreakdown {
  base_calculation: {
    method: BillingMethod
    rate?: number
    hours?: number
    percentage?: number
    case_value?: number
    fixed_amount?: number
    calculated_amount: number
  }
  minimum_fee_check: {
    required_minimum: number
    calculated_amount: number
    minimum_applied: boolean
    final_base_amount: number
  }
  success_fee_calculation?: {
    percentage: number
    applies_to: 'recovered' | 'total'
    calculation_base: number
    success_fee_amount: number
  }
  discount_application?: {
    eligible: boolean
    discount_type: string
    discount_percentage: number
    discount_amount: number
    final_amount: number
  }
}

// ===== SUCCESS FEE DEFINITIONS =====

export interface SuccessFeeInvoice {
  id: string
  case_outcome_id: string
  matter_id: string
  
  // Invoice details
  invoice_number: string
  amount: number
  tax_amount: number
  total_amount: number
  
  // Status and dates
  status: SuccessFeeInvoiceStatus
  due_date: string
  sent_date?: string
  paid_date?: string
  
  // Payment tracking
  stripe_invoice_id?: string
  payment_method?: string
  
  // Documentation
  calculation_details?: any
  notes?: string
  
  created_at: string
  updated_at: string
}

export type SuccessFeeInvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'disputed' | 'void'

// ===== BUSINESS PARAMETERS =====

export interface BusinessParameter {
  id: string
  law_firm_id: string
  parameter_category: string
  parameter_name: string
  parameter_key: string
  parameter_value: string
  parameter_type: 'string' | 'number' | 'boolean' | 'json'
  min_value?: number
  max_value?: number
  allowed_values?: string[]
  description?: string
  unit?: string
  is_active: boolean
  requires_approval: boolean
  created_at: string
  updated_at: string
}

// ===== FORM OPTIONS AND CONSTANTS =====

export const BILLING_METHOD_OPTIONS = [
  { value: 'hourly', label: 'Por Hora' },
  { value: 'percentage', label: 'Percentual' },
  { value: 'fixed', label: 'Valor Fixo' }
] as const

export const CASE_OUTCOME_TYPE_OPTIONS = [
  { value: 'settlement', label: 'Acordo' },
  { value: 'court_victory', label: 'Vitória Judicial' },
  { value: 'partial_victory', label: 'Vitória Parcial' },
  { value: 'loss', label: 'Derrota' },
  { value: 'dismissed', label: 'Arquivado' }
] as const

export const SUCCESS_FEE_CALCULATION_METHOD_OPTIONS = [
  { value: 'percentage', label: 'Percentual' },
  { value: 'sliding_scale', label: 'Escala Variável' },
  { value: 'fixed', label: 'Valor Fixo' },
  { value: 'custom', label: 'Personalizado' }
] as const

export const CASE_CATEGORY_OPTIONS = [
  { value: 'labor', label: 'Trabalhista' },
  { value: 'corporate', label: 'Empresarial' },
  { value: 'criminal', label: 'Criminal' },
  { value: 'family', label: 'Família' },
  { value: 'civil', label: 'Cível' },
  { value: 'tax', label: 'Tributário' },
  { value: 'consumer', label: 'Consumidor' }
] as const

// ===== DEFAULT VALUES =====

export const DEFAULT_BILLING_RATES = {
  junior_lawyer_rate: 150.00,
  senior_lawyer_rate: 300.00,
  partner_rate: 500.00
}

export const DEFAULT_SUCCESS_FEE_RATES = {
  labor: 15.0,
  corporate: 20.0,
  criminal: 12.0,
  family: 10.0,
  civil: 18.0,
  tax: 22.0,
  consumer: 15.0
}

export const DEFAULT_MINIMUM_FEES = {
  hourly_minimum: 1000.00,
  percentage_minimum: 2000.00,
  fixed_minimum: 1500.00
}

// ===== PRESET CASE TYPES =====

export const PRESET_CASE_TYPES: Omit<CaseTypeFormData, 'law_firm_id'>[] = [
  {
    name: 'Ação Trabalhista',
    code: 'LAB_ACT',
    category: 'labor',
    minimum_fee_hourly: 1500.00,
    minimum_fee_percentage: 2500.00,
    minimum_fee_fixed: 2000.00,
    default_billing_method: 'percentage',
    default_hourly_rate: 300.00,
    default_percentage_rate: 20.0,
    default_success_fee_rate: 15.0,
    complexity_multiplier: 1.2,
    estimated_hours_range: '40-80 horas',
    is_active: true
  },
  {
    name: 'Revisão de Contrato Empresarial',
    code: 'CORP_REV',
    category: 'corporate',
    minimum_fee_hourly: 1000.00,
    minimum_fee_percentage: 1500.00,
    minimum_fee_fixed: 1200.00,
    default_billing_method: 'hourly',
    default_hourly_rate: 400.00,
    default_percentage_rate: 15.0,
    default_success_fee_rate: 20.0,
    complexity_multiplier: 1.0,
    estimated_hours_range: '10-30 horas',
    is_active: true
  },
  {
    name: 'Defesa Criminal',
    code: 'CRIM_DEF',
    category: 'criminal',
    minimum_fee_hourly: 2000.00,
    minimum_fee_percentage: 3000.00,
    minimum_fee_fixed: 2500.00,
    default_billing_method: 'fixed',
    default_hourly_rate: 500.00,
    default_percentage_rate: 25.0,
    default_success_fee_rate: 12.0,
    complexity_multiplier: 1.5,
    estimated_hours_range: '60-120 horas',
    is_active: true
  },
  {
    name: 'Divórcio Consensual',
    code: 'FAM_DIV',
    category: 'family',
    minimum_fee_hourly: 800.00,
    minimum_fee_percentage: 1200.00,
    minimum_fee_fixed: 1000.00,
    default_billing_method: 'fixed',
    default_hourly_rate: 250.00,
    default_percentage_rate: 10.0,
    default_success_fee_rate: 10.0,
    complexity_multiplier: 0.8,
    estimated_hours_range: '15-25 horas',
    is_active: true
  },
  {
    name: 'Ação de Cobrança',
    code: 'CIV_COB',
    category: 'civil',
    minimum_fee_hourly: 1200.00,
    minimum_fee_percentage: 2000.00,
    minimum_fee_fixed: 1500.00,
    default_billing_method: 'percentage',
    default_hourly_rate: 350.00,
    default_percentage_rate: 18.0,
    default_success_fee_rate: 18.0,
    complexity_multiplier: 1.1,
    estimated_hours_range: '30-60 horas',
    is_active: true
  }
]