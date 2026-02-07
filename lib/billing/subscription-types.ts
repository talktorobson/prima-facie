// =====================================================
// SUBSCRIPTION SYSTEM TYPES
// Legal-as-a-Service Platform Types
// =====================================================

// Core subscription plan types
export interface SubscriptionPlan {
  id: string
  law_firm_id: string
  plan_name: string
  plan_type: PlanType
  description: string
  monthly_fee: number
  yearly_fee: number
  setup_fee: number
  services_included: ServiceType[]
  max_monthly_hours: number
  max_document_reviews: number
  support_level: SupportLevel
  billing_interval: BillingInterval
  trial_period_days: number
  is_active: boolean
  is_featured: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ClientSubscription {
  id: string
  client_id: string
  law_firm_id: string
  subscription_plan_id: string
  status: SubscriptionStatus
  billing_cycle: BillingInterval
  auto_renew: boolean
  start_date: string
  end_date?: string
  trial_end_date?: string
  current_period_start: string
  current_period_end: string
  next_billing_date: string
  cancelled_at?: string
  stripe_subscription_id?: string
  stripe_customer_id?: string
  monthly_fee: number
  yearly_fee: number
  current_fee: number
  notes?: string
  cancellation_reason?: string
  created_at: string
  updated_at: string
}

export interface SubscriptionUsage {
  id: string
  client_subscription_id: string
  service_type: ServiceType
  usage_date: string
  quantity_used: number
  unit_type: UnitType
  included_in_plan: boolean
  overage_amount: number
  overage_rate?: number
  description?: string
  matter_id?: string
  staff_user_id?: string
  created_at: string
}

export interface SubscriptionInvoice {
  id: string
  client_subscription_id: string
  invoice_number: string
  period_start: string
  period_end: string
  subtotal: number
  overage_charges: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  status: InvoiceStatus
  due_date: string
  sent_date?: string
  paid_date?: string
  stripe_invoice_id?: string
  payment_method?: PaymentMethod
  notes?: string
  created_at: string
  updated_at: string
}

// Enum-like types for better type safety
export type PlanType = 'labor' | 'corporate' | 'criminal' | 'family' | 'general'

export type ServiceType = 
  | 'compliance_review'
  | 'email_support'
  | 'phone_support'
  | 'priority_support'
  | '24_7_support'
  | 'document_review'
  | 'contract_review'
  | 'regulatory_alerts'
  | 'dedicated_lawyer'
  | 'unlimited_hours'
  | 'consultation'
  | 'case_review'
  | 'board_support'
  | 'consultation_hours'
  | 'document_reviews'
  | 'support_tickets'
  | 'phone_calls'

export type SupportLevel = 'email' | 'phone' | 'priority' | '24_7'

export type BillingInterval = 'monthly' | 'yearly'

export type SubscriptionStatus = 
  | 'trial' 
  | 'active' 
  | 'past_due' 
  | 'cancelled' 
  | 'unpaid' 
  | 'paused'

export type UnitType = 'hours' | 'documents' | 'calls' | 'tickets' | 'each'

export type InvoiceStatus = 
  | 'draft' 
  | 'sent' 
  | 'paid' 
  | 'overdue' 
  | 'void' 
  | 'failed'

export type PaymentMethod = 
  | 'card' 
  | 'bank_transfer' 
  | 'pix' 
  | 'boleto'

// Form data types for UI components
export interface PlanFormData {
  plan_name: string
  plan_type: PlanType
  description: string
  monthly_fee: number
  yearly_fee: number
  setup_fee: number
  services_included: ServiceType[]
  max_monthly_hours: number
  max_document_reviews: number
  support_level: SupportLevel
  billing_interval: BillingInterval
  trial_period_days: number
  is_active: boolean
  is_featured: boolean
}

export interface SubscriptionFormData {
  client_id: string
  subscription_plan_id: string
  billing_cycle: BillingInterval
  auto_renew: boolean
  start_date: string
  trial_end_date?: string
  notes?: string
}

// Configuration objects for UI
export interface PlanTypeOption {
  value: PlanType
  label: string
  color: string
}

export interface ServiceOption {
  value: ServiceType
  label: string
  icon: React.ComponentType<any>
}

export interface SupportLevelOption {
  value: SupportLevel
  label: string
  icon: React.ComponentType<any>
}

// Analytics and reporting types
export interface MRRAnalytics {
  law_firm_id: string
  month: string
  active_subscriptions: number
  monthly_recurring_revenue: number
  average_revenue_per_user: number
  trial_subscriptions: number
  paid_subscriptions: number
}

export interface SubscriptionMetrics {
  total_plans: number
  active_plans: number
  featured_plans: number
  average_monthly_price: number
  total_subscribers: number
  active_subscribers: number
  trial_subscribers: number
  churned_subscribers: number
  monthly_recurring_revenue: number
  annual_recurring_revenue: number
  churn_rate: number
  growth_rate: number
}

export interface ClientSubscriptionSummary {
  client_id: string
  client_name: string
  subscription_plan: SubscriptionPlan
  subscription: ClientSubscription
  current_usage: SubscriptionUsage[]
  usage_summary: {
    hours_used: number
    hours_remaining: number
    documents_reviewed: number
    documents_remaining: number
    overage_charges: number
  }
  next_invoice: {
    amount: number
    due_date: string
  }
}

// Discount and pricing types
export interface DiscountRule {
  id: string
  law_firm_id: string
  rule_name: string
  rule_type: DiscountRuleType
  subscription_plan_id?: string
  case_type_id?: string
  matter_category?: string
  litigation_type?: string
  discount_type: DiscountType
  discount_percentage?: number
  discount_amount?: number
  min_case_value: number
  max_discount_amount?: number
  min_subscription_months: number
  valid_from?: string
  valid_until?: string
  max_uses_per_client?: number
  max_total_uses?: number
  current_uses: number
  is_active: boolean
  is_stackable: boolean
  description?: string
  internal_notes?: string
  created_at: string
  updated_at: string
}

export type DiscountRuleType = 
  | 'subscription_discount' 
  | 'volume_discount' 
  | 'loyalty_discount' 
  | 'promotional'

export type DiscountType = 'percentage' | 'fixed_amount' | 'tiered'

export interface CaseDiscount {
  id: string
  matter_id: string
  case_billing_method_id?: string
  client_subscription_id?: string
  discount_rule_id: string
  original_amount: number
  discount_percentage?: number
  discount_amount: number
  final_amount: number
  application_reason?: string
  calculation_details?: any
  requires_approval: boolean
  approved_by?: string
  approved_at?: string
  applied_at: string
  created_at: string
}

// Utility types for business logic
export interface BillingCalculation {
  baseBilling: {
    method: 'hourly' | 'percentage' | 'fixed'
    originalAmount: number
    minimumFee: number
    subscriptionDiscount: number
    finalAmount: number
  }
  paymentPlan?: {
    installments: number
    installmentAmount: number
    schedule: PaymentSchedule[]
  }
  successFee: {
    applicable: boolean
    percentage: number
    effectiveValue: number
    amount: number
  }
  totalBilling: number
}

export interface PaymentSchedule {
  installmentNumber: number
  amount: number
  dueDate: string
  status: 'pending' | 'paid' | 'overdue' | 'failed'
}

// API response types
export interface SubscriptionPlanResponse {
  data: SubscriptionPlan[]
  total: number
  page: number
  per_page: number
}

export interface ClientSubscriptionResponse {
  data: ClientSubscription[]
  total: number
  page: number
  per_page: number
}

// Error types
export interface SubscriptionError {
  code: string
  message: string
  details?: any
}

// Configuration constants
export const PLAN_TYPE_OPTIONS: PlanTypeOption[] = [
  { value: 'labor', label: 'Direito Trabalhista', color: 'bg-blue-100 text-blue-800' },
  { value: 'corporate', label: 'Direito Empresarial', color: 'bg-green-100 text-green-800' },
  { value: 'criminal', label: 'Direito Criminal', color: 'bg-red-100 text-red-800' },
  { value: 'family', label: 'Direito de Família', color: 'bg-purple-100 text-purple-800' },
  { value: 'general', label: 'Geral', color: 'bg-gray-100 text-gray-800' }
]

export const SUPPORT_LEVEL_OPTIONS: SupportLevelOption[] = [
  { value: 'email', label: 'Email (48h)', icon: null as any },
  { value: 'phone', label: 'Telefone (24h)', icon: null as any },
  { value: 'priority', label: 'Prioritário (4h)', icon: null as any },
  { value: '24_7', label: '24/7 (Imediato)', icon: null as any }
]

export const SERVICE_OPTIONS: ServiceOption[] = [
  { value: 'compliance_review', label: 'Revisão de Compliance', icon: null as any },
  { value: 'email_support', label: 'Suporte por Email', icon: null as any },
  { value: 'phone_support', label: 'Suporte Telefônico', icon: null as any },
  { value: 'priority_support', label: 'Suporte Prioritário', icon: null as any },
  { value: '24_7_support', label: 'Suporte 24/7', icon: null as any },
  { value: 'document_review', label: 'Revisão de Documentos', icon: null as any },
  { value: 'contract_review', label: 'Revisão de Contratos', icon: null as any },
  { value: 'regulatory_alerts', label: 'Alertas Regulatórios', icon: null as any },
  { value: 'dedicated_lawyer', label: 'Advogado Dedicado', icon: null as any },
  { value: 'unlimited_hours', label: 'Horas Ilimitadas', icon: null as any },
  { value: 'consultation', label: 'Consultas Jurídicas', icon: null as any },
  { value: 'case_review', label: 'Revisão de Casos', icon: null as any },
  { value: 'board_support', label: 'Suporte Jurídico Board', icon: null as any }
]

// Validation schemas (for use with libraries like Yup or Zod)
export const SUBSCRIPTION_PLAN_VALIDATION = {
  plan_name: { required: true, minLength: 3, maxLength: 100 },
  plan_type: { required: true, enum: ['labor', 'corporate', 'criminal', 'family', 'general'] },
  description: { required: true, minLength: 10, maxLength: 500 },
  monthly_fee: { required: true, min: 0 },
  yearly_fee: { min: 0 },
  setup_fee: { min: 0 },
  max_monthly_hours: { min: 0 },
  max_document_reviews: { min: 0 },
  trial_period_days: { min: 0, max: 365 }
}