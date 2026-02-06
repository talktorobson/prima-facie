// =====================================================
// PAYMENT PLAN SYSTEM TYPES
// =====================================================

export interface PaymentPlan {
  id: string
  matter_id: string
  client_id: string
  law_firm_id: string
  plan_name: string
  total_amount: number
  installment_count: number
  installment_amount: number
  down_payment: number
  payment_frequency: PaymentFrequency
  start_date: string
  end_date: string
  status: PaymentPlanStatus
  auto_charge: boolean
  late_fee_percentage: number
  grace_period_days: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface PaymentInstallment {
  id: string
  payment_plan_id: string
  installment_number: number
  due_date: string
  amount: number
  paid_amount: number
  paid_date?: string
  status: InstallmentStatus
  late_fee_applied: number
  payment_method?: string
  transaction_id?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface PaymentPlanFormData {
  matter_id: string
  plan_name: string
  total_amount: number
  installment_count: number
  down_payment: number
  payment_frequency: PaymentFrequency
  start_date: string
  auto_charge: boolean
  late_fee_percentage: number
  grace_period_days: number
  notes?: string
}

export interface PaymentPlanSummary {
  payment_plan: PaymentPlan
  installments: PaymentInstallment[]
  total_paid: number
  total_remaining: number
  next_due_date?: string
  overdue_count: number
  overdue_amount: number
}

// Enums
export type PaymentFrequency = 'weekly' | 'bi_weekly' | 'monthly' | 'quarterly'
export type PaymentPlanStatus = 'draft' | 'active' | 'completed' | 'cancelled' | 'defaulted'
export type InstallmentStatus = 'pending' | 'paid' | 'overdue' | 'waived' | 'cancelled'

// Configuration options
export const PAYMENT_FREQUENCY_OPTIONS = [
  { value: 'weekly', label: 'Semanal', days: 7 },
  { value: 'bi_week', label: 'Quinzenal', days: 14 },
  { value: 'monthly', label: 'Mensal', days: 30 },
  { value: 'quarterly', label: 'Trimestral', days: 90 }
] as const

export const PAYMENT_PLAN_STATUS_OPTIONS = [
  { value: 'draft', label: 'Rascunho', color: 'bg-gray-100 text-gray-800' },
  { value: 'active', label: 'Ativo', color: 'bg-blue-100 text-blue-800' },
  { value: 'completed', label: 'Concluído', color: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: 'Cancelado', color: 'bg-red-100 text-red-800' },
  { value: 'defaulted', label: 'Inadimplente', color: 'bg-yellow-100 text-yellow-800' }
] as const

export const INSTALLMENT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'paid', label: 'Pago', color: 'bg-green-100 text-green-800' },
  { value: 'overdue', label: 'Vencido', color: 'bg-red-100 text-red-800' },
  { value: 'waived', label: 'Dispensado', color: 'bg-gray-100 text-gray-800' },
  { value: 'cancelled', label: 'Cancelado', color: 'bg-gray-100 text-gray-800' }
] as const

// Utility types for forms and calculations
export interface InstallmentCalculation {
  installment_number: number
  due_date: string
  amount: number
  is_down_payment: boolean
}

export interface PaymentPlanCalculation {
  installments: InstallmentCalculation[]
  total_amount: number
  monthly_payment: number
  final_payment_date: string
  payment_schedule_summary: string
}

// Analytics types
export interface PaymentPlanMetrics {
  law_firm_id: string
  total_plans: number
  active_plans: number
  completed_plans: number
  defaulted_plans: number
  total_contracted_value: number
  total_collected: number
  collection_rate: number
  average_plan_value: number
  overdue_amount: number
  next_30_days_due: number
}

export interface CollectionAnalytics {
  month: string
  plans_created: number
  plans_completed: number
  amount_collected: number
  overdue_amount: number
  collection_rate: number
  average_days_to_complete: number
}