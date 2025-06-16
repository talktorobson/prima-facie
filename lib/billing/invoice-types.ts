// Phase 8.7: Dual Invoice System Types
// Comprehensive TypeScript types for subscription, case, and payment plan invoices

export interface Invoice {
  id: string
  law_firm_id: string
  client_id: string
  
  // Invoice identification
  invoice_number: string
  invoice_type: InvoiceType
  
  // Financial details
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  currency: string
  
  // Status and workflow
  invoice_status: InvoiceStatus
  
  // Dates
  issue_date: string
  due_date: string
  sent_date?: string
  paid_date?: string
  
  // Payment terms
  payment_terms: PaymentTerms
  payment_methods: string[]
  
  // References to source records
  client_subscription_id?: string
  matter_id?: string
  payment_plan_id?: string
  
  // Grouping and consolidation
  parent_invoice_id?: string
  invoice_group?: string
  
  // Invoice content
  description?: string
  notes?: string
  internal_notes?: string
  
  // Metadata
  created_by?: string
  approved_by?: string
  approved_at?: string
  
  // Timestamps
  created_at: string
  updated_at: string
  
  // Related data (populated when needed)
  client?: {
    id: string
    name: string
    email: string
    cpf?: string
    cnpj?: string
  }
  line_items?: InvoiceLineItem[]
  payments?: InvoicePayment[]
  subscription_details?: SubscriptionInvoice
  case_details?: CaseInvoice
  payment_plan_details?: PaymentPlanInvoice
}

export type InvoiceType = 
  | 'subscription'     // Monthly/yearly subscription billing
  | 'case_billing'     // One-time case billing
  | 'payment_plan'     // Installment from payment plan
  | 'time_based'       // Time tracking based billing
  | 'hybrid'           // Combination of multiple types
  | 'adjustment'       // Credits, refunds, corrections
  | 'late_fee'         // Late payment penalties

export type InvoiceStatus = 
  | 'draft'           // Being prepared
  | 'pending_review'  // Awaiting approval
  | 'approved'        // Ready to send
  | 'sent'           // Sent to client
  | 'viewed'         // Client viewed invoice
  | 'paid'           // Fully paid
  | 'partial_paid'   // Partially paid
  | 'overdue'        // Past due date
  | 'disputed'       // Client disputed
  | 'cancelled'      // Cancelled
  | 'refunded'       // Refunded

export type PaymentTerms = 
  | 'immediate' 
  | '7_days' 
  | '15_days' 
  | '30_days' 
  | '45_days' 
  | '60_days' 
  | 'custom'

export interface InvoiceLineItem {
  id: string
  law_firm_id: string
  invoice_id: string
  
  // Line item details
  line_type: LineItemType
  description: string
  
  // Quantity and pricing
  quantity: number
  unit_price: number
  line_total: number
  
  // References to source data
  time_entry_id?: string
  service_inclusion_id?: string
  case_billing_id?: string
  case_outcome_id?: string
  discount_application_id?: string
  
  // Tax information
  tax_rate: number
  tax_amount: number
  
  // Metadata
  sort_order: number
  is_taxable: boolean
  
  // Timestamps
  created_at: string
  updated_at: string
}

export type LineItemType = 
  | 'subscription_fee'    // Monthly/yearly subscription
  | 'case_fee'           // Case billing (hourly/fixed/percentage)
  | 'success_fee'        // Success fee from case outcome
  | 'time_entry'         // Individual time entry
  | 'expense'            // Case expenses
  | 'discount'           // Applied discount
  | 'tax'               // Tax line item
  | 'adjustment'        // Manual adjustment
  | 'late_fee'          // Late payment fee
  | 'service_fee'       // Additional service fees

export interface SubscriptionInvoice {
  id: string
  law_firm_id: string
  invoice_id: string
  client_subscription_id: string
  
  // Billing period
  billing_period_start: string
  billing_period_end: string
  billing_cycle: 'monthly' | 'quarterly' | 'yearly'
  
  // Service usage tracking
  services_included: ServiceUsage
  services_used: ServiceUsage
  overage_charges: number
  
  // Proration handling
  is_prorated: boolean
  proration_reason?: string
  proration_factor: number
  
  // Auto-renewal
  auto_renew: boolean
  next_billing_date?: string
  
  // Timestamps
  created_at: string
  updated_at: string
  
  // Related data
  subscription?: {
    id: string
    plan_name: string
    monthly_fee: number
    billing_cycle: string
    services: ServiceUsage
  }
}

export interface ServiceUsage {
  [service_type: string]: {
    included: number
    used: number
    overage: number
    unit: string
  }
}

export interface CaseInvoice {
  id: string
  law_firm_id: string
  invoice_id: string
  matter_id: string
  case_billing_id?: string
  
  // Billing details
  billing_method: 'hourly' | 'fixed' | 'percentage' | 'hybrid'
  
  // Time-based billing
  total_hours?: number
  billable_hours?: number
  hourly_rate?: number
  time_charges: number
  
  // Fixed fee billing
  fixed_fee?: number
  
  // Percentage billing (contingency)
  recovery_amount?: number
  percentage_rate?: number
  percentage_fee: number
  
  // Success fees
  success_fee: number
  success_criteria_met: boolean
  
  // Expenses and costs
  case_expenses: number
  reimbursable_expenses: number
  
  // Minimum fee enforcement
  minimum_fee?: number
  minimum_fee_applied: boolean
  
  // Payment terms specific to case
  is_final_invoice: boolean
  allows_payment_plan: boolean
  
  // Timestamps
  created_at: string
  updated_at: string
  
  // Related data
  matter?: {
    id: string
    title: string
    case_type: string
    status: string
  }
}

export interface PaymentPlanInvoice {
  id: string
  law_firm_id: string
  invoice_id: string
  payment_plan_id: string
  
  // Installment details
  installment_number: number
  total_installments: number
  installment_amount: number
  
  // Schedule
  scheduled_date: string
  grace_period_days: number
  late_fee_rate: number
  late_fee_amount: number
  
  // Status
  is_final_installment: boolean
  auto_generate_next: boolean
  
  // Timestamps
  created_at: string
  updated_at: string
  
  // Related data
  payment_plan?: {
    id: string
    total_amount: number
    remaining_amount: number
    installments: number
    frequency: string
  }
}

export interface TimeBasedInvoice {
  id: string
  law_firm_id: string
  invoice_id: string
  
  // Time period
  billing_period_start: string
  billing_period_end: string
  
  // Time summary
  total_time_entries: number
  total_hours: number
  billable_hours: number
  non_billable_hours: number
  
  // Rate breakdown
  weighted_average_rate: number
  highest_rate: number
  lowest_rate: number
  
  // Distribution
  case_hours: number
  subscription_hours: number
  administrative_hours: number
  
  // Timestamps
  created_at: string
  updated_at: string
}

export interface InvoicePayment {
  id: string
  law_firm_id: string
  invoice_id: string
  
  // Payment details
  payment_amount: number
  payment_date: string
  payment_method: PaymentMethod
  
  // Transaction details
  transaction_id?: string
  reference_number?: string
  
  // Payment processor info
  processor?: string
  processor_fee: number
  net_amount: number
  
  // Status
  payment_status: PaymentStatus
  
  // Allocation (for partial payments)
  allocated_to_principal: number
  allocated_to_fees: number
  allocated_to_interest: number
  
  // Notes
  notes?: string
  
  // Metadata
  recorded_by?: string
  
  // Timestamps
  created_at: string
  updated_at: string
}

export type PaymentMethod = 
  | 'cash' 
  | 'check' 
  | 'bank_transfer' 
  | 'pix' 
  | 'credit_card' 
  | 'debit_card' 
  | 'other'

export type PaymentStatus = 
  | 'pending' 
  | 'completed' 
  | 'failed' 
  | 'refunded' 
  | 'disputed'

export interface InvoiceTemplate {
  id: string
  law_firm_id: string
  
  // Template details
  template_name: string
  template_type: InvoiceType
  
  // Template content
  subject_template?: string
  description_template?: string
  terms_and_conditions?: string
  
  // Default settings
  default_payment_terms: PaymentTerms
  default_due_days: number
  default_late_fee_rate: number
  
  // Automation rules
  auto_generate: boolean
  auto_send: boolean
  send_reminder_days: number[]
  
  // Email settings
  email_template?: string
  email_subject?: string
  
  // Active status
  is_active: boolean
  is_default: boolean
  
  // Timestamps
  created_at: string
  updated_at: string
}

export interface InvoiceGenerationLog {
  id: string
  law_firm_id: string
  
  // Generation details
  generation_type: 'manual' | 'scheduled' | 'triggered' | 'batch'
  
  // Batch information
  batch_id?: string
  total_invoices_generated: number
  successful_generations: number
  failed_generations: number
  
  // Time period
  period_start?: string
  period_end?: string
  
  // Filters applied
  client_filters?: any
  subscription_filters?: any
  matter_filters?: any
  
  // Results
  generated_invoice_ids: string[]
  error_messages: string[]
  
  // Metadata
  triggered_by?: string
  
  // Timestamps
  started_at: string
  completed_at?: string
  
  // Status
  status: 'running' | 'completed' | 'failed' | 'cancelled'
}

// Form data types for creating invoices
export interface InvoiceFormData {
  client_id: string
  invoice_type: InvoiceType
  description?: string
  due_date: string
  payment_terms: PaymentTerms
  payment_methods: string[]
  notes?: string
  
  // Optional references
  client_subscription_id?: string
  matter_id?: string
  payment_plan_id?: string
  
  // Line items
  line_items: InvoiceLineItemFormData[]
}

export interface InvoiceLineItemFormData {
  line_type: LineItemType
  description: string
  quantity: number
  unit_price: number
  is_taxable?: boolean
  
  // Optional references
  time_entry_id?: string
  service_inclusion_id?: string
  case_billing_id?: string
}

// Service request types
export interface InvoiceGenerationRequest {
  law_firm_id: string
  invoice_type: InvoiceType
  client_ids?: string[]
  subscription_ids?: string[]
  matter_ids?: string[]
  payment_plan_ids?: string[]
  billing_period_start: string
  billing_period_end: string
  auto_send?: boolean
  template_id?: string
}

export interface SubscriptionInvoiceGenerationRequest {
  law_firm_id: string
  client_subscription_id?: string
  billing_period_start: string
  billing_period_end: string
  force_regenerate?: boolean
  auto_send?: boolean
}

export interface CaseInvoiceGenerationRequest {
  law_firm_id: string
  matter_id: string
  include_time_entries?: boolean
  time_entry_ids?: string[]
  include_expenses?: boolean
  expense_ids?: string[]
  billing_period_start?: string
  billing_period_end?: string
  auto_send?: boolean
}

export interface PaymentPlanInvoiceGenerationRequest {
  law_firm_id: string
  payment_plan_id: string
  installment_number?: number
  scheduled_date?: string
  auto_send?: boolean
}

// Response types
export interface InvoiceGenerationResult {
  success: boolean
  invoice?: Invoice
  error?: string
  warnings?: string[]
}

export interface BatchInvoiceGenerationResult {
  success: boolean
  total_requested: number
  successful_generations: number
  failed_generations: number
  invoices: Invoice[]
  errors: Array<{ client_id: string; error: string }>
  batch_id: string
}

// Constants
export const INVOICE_STATUS_OPTIONS = [
  { value: 'draft', label: 'Rascunho', color: 'bg-gray-100 text-gray-800' },
  { value: 'pending_review', label: 'Aguardando Revisão', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'approved', label: 'Aprovada', color: 'bg-blue-100 text-blue-800' },
  { value: 'sent', label: 'Enviada', color: 'bg-green-100 text-green-800' },
  { value: 'viewed', label: 'Visualizada', color: 'bg-green-100 text-green-800' },
  { value: 'paid', label: 'Paga', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'partial_paid', label: 'Paga Parcialmente', color: 'bg-orange-100 text-orange-800' },
  { value: 'overdue', label: 'Vencida', color: 'bg-red-100 text-red-800' },
  { value: 'disputed', label: 'Contestada', color: 'bg-purple-100 text-purple-800' },
  { value: 'cancelled', label: 'Cancelada', color: 'bg-gray-100 text-gray-800' },
  { value: 'refunded', label: 'Reembolsada', color: 'bg-gray-100 text-gray-800' }
] as const

export const INVOICE_TYPE_OPTIONS = [
  { value: 'subscription', label: 'Assinatura', color: 'bg-blue-100 text-blue-800' },
  { value: 'case_billing', label: 'Cobrança de Caso', color: 'bg-green-100 text-green-800' },
  { value: 'payment_plan', label: 'Plano de Pagamento', color: 'bg-purple-100 text-purple-800' },
  { value: 'time_based', label: 'Baseada em Tempo', color: 'bg-orange-100 text-orange-800' },
  { value: 'hybrid', label: 'Híbrida', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'adjustment', label: 'Ajuste', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'late_fee', label: 'Taxa de Atraso', color: 'bg-red-100 text-red-800' }
] as const

export const PAYMENT_TERMS_OPTIONS = [
  { value: 'immediate', label: 'Imediato', days: 0 },
  { value: '7_days', label: '7 dias', days: 7 },
  { value: '15_days', label: '15 dias', days: 15 },
  { value: '30_days', label: '30 dias', days: 30 },
  { value: '45_days', label: '45 dias', days: 45 },
  { value: '60_days', label: '60 dias', days: 60 },
  { value: 'custom', label: 'Personalizado', days: null }
] as const

export const PAYMENT_METHOD_OPTIONS = [
  { value: 'cash', label: 'Dinheiro' },
  { value: 'check', label: 'Cheque' },
  { value: 'bank_transfer', label: 'Transferência Bancária' },
  { value: 'pix', label: 'PIX' },
  { value: 'credit_card', label: 'Cartão de Crédito' },
  { value: 'debit_card', label: 'Cartão de Débito' },
  { value: 'other', label: 'Outro' }
] as const

export const LINE_ITEM_TYPE_OPTIONS = [
  { value: 'subscription_fee', label: 'Taxa de Assinatura', color: 'bg-blue-100 text-blue-800' },
  { value: 'case_fee', label: 'Taxa de Caso', color: 'bg-green-100 text-green-800' },
  { value: 'success_fee', label: 'Taxa de Êxito', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'time_entry', label: 'Entrada de Tempo', color: 'bg-orange-100 text-orange-800' },
  { value: 'expense', label: 'Despesa', color: 'bg-purple-100 text-purple-800' },
  { value: 'discount', label: 'Desconto', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'tax', label: 'Imposto', color: 'bg-gray-100 text-gray-800' },
  { value: 'adjustment', label: 'Ajuste', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'late_fee', label: 'Taxa de Atraso', color: 'bg-red-100 text-red-800' },
  { value: 'service_fee', label: 'Taxa de Serviço', color: 'bg-pink-100 text-pink-800' }
] as const