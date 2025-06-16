// =====================================================
// PHASE 8.6: TIME TRACKING INTEGRATION TYPES
// =====================================================

import { ServiceType } from './subscription-types'

// ===== TIME ENTRY DEFINITIONS =====

export type TimeEntryType = 'case_work' | 'subscription_work' | 'administrative' | 'business_development' | 'non_billable'
export type TimeEntryStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'billed'
export type BillingRateSource = 'user_default' | 'matter_specific' | 'subscription_rate' | 'custom'

export interface TimeEntry {
  id: string
  law_firm_id: string
  user_id: string
  
  // Entry classification
  entry_type: TimeEntryType
  entry_status: TimeEntryStatus
  
  // Time tracking details
  start_time: string
  end_time?: string
  duration_minutes?: number
  break_minutes: number
  effective_minutes: number
  
  // Work classification
  matter_id?: string
  client_subscription_id?: string
  task_category?: string
  activity_description: string
  
  // Billing information
  is_billable: boolean
  billable_rate?: number
  billing_rate_source?: BillingRateSource
  billable_amount: number
  
  // Subscription allocation
  counts_toward_subscription: boolean
  subscription_service_type?: ServiceType
  
  // Location and context
  location?: string
  is_remote_work: boolean
  
  // Approval workflow
  approved_by?: string
  approved_at?: string
  approval_notes?: string
  rejected_reason?: string
  
  // Billing integration
  invoice_id?: string
  billed_at?: string
  billing_notes?: string
  
  // Timer functionality
  timer_started_at?: string
  is_timer_running: boolean
  
  // Metadata
  entry_date: string
  created_at: string
  updated_at: string
  created_by?: string
  
  // Joined data
  matter?: {
    id: string
    title: string
    client_name?: string
  }
  client_subscription?: {
    id: string
    plan_name: string
    client_name?: string
  }
  user?: {
    id: string
    full_name: string
    email: string
  }
}

export interface TimeEntryFormData {
  entry_type: TimeEntryType
  matter_id?: string
  client_subscription_id?: string
  task_category?: string
  activity_description: string
  
  // Time options
  start_time?: string
  end_time?: string
  duration_minutes?: number
  break_minutes?: number
  
  // Billing options
  is_billable: boolean
  billable_rate?: number
  billing_rate_source?: BillingRateSource
  counts_toward_subscription?: boolean
  subscription_service_type?: ServiceType
  
  // Context
  location?: string
  is_remote_work?: boolean
  
  // Timer mode
  use_timer?: boolean
}

// ===== TIME ENTRY TEMPLATES =====

export interface TimeEntryTemplate {
  id: string
  law_firm_id: string
  user_id: string
  
  // Template details
  template_name: string
  template_description?: string
  template_category?: string
  
  // Default values
  default_entry_type: TimeEntryType
  default_task_category?: string
  default_activity_description?: string
  default_duration_minutes?: number
  default_billable_rate?: number
  default_is_billable: boolean
  default_location?: string
  
  // Usage tracking
  usage_count: number
  last_used_at?: string
  
  // Metadata
  is_active: boolean
  is_shared: boolean
  created_at: string
  updated_at: string
}

export interface TimeEntryTemplateFormData {
  template_name: string
  template_description?: string
  template_category?: string
  default_entry_type: TimeEntryType
  default_task_category?: string
  default_activity_description?: string
  default_duration_minutes?: number
  default_billable_rate?: number
  default_is_billable: boolean
  default_location?: string
  is_shared: boolean
}

// ===== LAWYER BILLING RATES =====

export type BillingRateType = 'standard' | 'subscription' | 'matter_specific' | 'client_specific' | 'case_type_specific'
export type RoundingMethod = 'up' | 'down' | 'nearest'

export interface LawyerBillingRate {
  id: string
  law_firm_id: string
  user_id: string
  
  // Rate classification
  rate_type: BillingRateType
  rate_category?: string
  
  // Rate structure
  hourly_rate: number
  currency_code: string
  
  // Applicability rules
  matter_id?: string
  client_id?: string
  case_type_id?: string
  subscription_plan_id?: string
  
  // Effective period
  effective_from: string
  effective_until?: string
  
  // Special conditions
  minimum_increment_minutes: number
  rounding_method: RoundingMethod
  
  // Approval and tracking
  approved_by?: string
  approved_at?: string
  
  // Metadata
  is_active: boolean
  notes?: string
  created_at: string
  updated_at: string
}

export interface LawyerBillingRateFormData {
  rate_type: BillingRateType
  rate_category?: string
  hourly_rate: number
  currency_code: string
  matter_id?: string
  client_id?: string
  case_type_id?: string
  subscription_plan_id?: string
  effective_from: string
  effective_until?: string
  minimum_increment_minutes: number
  rounding_method: RoundingMethod
  notes?: string
}

// ===== SUBSCRIPTION TIME ALLOCATION =====

export type AllocationStatus = 'active' | 'exhausted' | 'rolled_over' | 'expired'

export interface SubscriptionTimeAllocation {
  id: string
  client_subscription_id: string
  law_firm_id: string
  
  // Allocation period
  allocation_month: string
  
  // Time tracking
  total_minutes_allocated: number
  total_minutes_used: number
  total_minutes_remaining: number
  
  // Service breakdown
  consultation_minutes_used: number
  document_review_minutes_used: number
  phone_support_minutes_used: number
  email_support_minutes_used: number
  other_minutes_used: number
  
  // Overage tracking
  overage_minutes: number
  overage_rate?: number
  overage_amount: number
  
  // Status tracking
  allocation_status: AllocationStatus
  rollover_minutes: number
  
  // Billing integration
  invoiced_at?: string
  invoice_id?: string
  
  // Metadata
  created_at: string
  updated_at: string
  
  // Joined data
  client_subscription?: {
    id: string
    plan_name: string
    client_name?: string
  }
}

export type AllocationType = 'included' | 'overage' | 'complimentary'

export interface TimeEntryAllocation {
  id: string
  time_entry_id: string
  subscription_time_allocation_id?: string
  
  // Allocation details
  allocated_minutes: number
  allocation_type: AllocationType
  service_type?: ServiceType
  
  // Billing tracking
  is_billed: boolean
  billing_rate?: number
  billing_amount?: number
  
  // Metadata
  created_at: string
}

// ===== TIME TRACKING ANALYTICS =====

export interface DailyTimeSummary {
  id: string
  law_firm_id: string
  user_id: string
  summary_date: string
  
  // Time breakdown by type
  case_work_minutes: number
  subscription_work_minutes: number
  administrative_minutes: number
  non_billable_minutes: number
  total_minutes: number
  
  // Billable summary
  billable_minutes: number
  billable_amount: number
  non_billable_minutes_count: number
  
  // Entry counts
  total_entries: number
  approved_entries: number
  pending_entries: number
  
  // Utilization metrics
  utilization_percentage: number
  
  // Metadata
  created_at: string
  updated_at: string
  
  // Joined data
  user?: {
    id: string
    full_name: string
    email: string
  }
}

export interface WeeklyTimeSummary {
  week_start: string
  week_end: string
  user_id: string
  user_name: string
  
  // Daily breakdowns
  daily_summaries: DailyTimeSummary[]
  
  // Weekly totals
  total_minutes: number
  billable_minutes: number
  billable_amount: number
  utilization_percentage: number
  
  // Breakdown by type
  case_work_minutes: number
  subscription_work_minutes: number
  administrative_minutes: number
  non_billable_minutes: number
  
  // Entry statistics
  total_entries: number
  approved_entries: number
  pending_entries: number
}

export interface MonthlyTimeSummary {
  month: string
  law_firm_id: string
  
  // User summaries
  user_summaries: Array<{
    user_id: string
    user_name: string
    total_minutes: number
    billable_minutes: number
    billable_amount: number
    utilization_percentage: number
  }>
  
  // Overall totals
  total_minutes: number
  total_billable_minutes: number
  total_billable_amount: number
  average_utilization: number
  
  // Productivity metrics
  total_entries: number
  average_entry_duration: number
  most_productive_day: string
  least_productive_day: string
}

// ===== ACTIVE TIME SESSIONS =====

export interface ActiveTimeSession {
  id: string
  law_firm_id: string
  user_id: string
  
  // Session details
  session_name?: string
  entry_type: TimeEntryType
  matter_id?: string
  client_subscription_id?: string
  task_category?: string
  activity_description?: string
  
  // Timer details
  started_at: string
  last_heartbeat?: string
  pause_duration_minutes: number
  
  // Session state
  is_paused: boolean
  paused_at?: string
  device_info?: string
  ip_address?: string
  
  // Auto-save interval
  last_auto_save?: string
  auto_save_interval_minutes: number
  
  // Metadata
  created_at: string
}

// ===== TIME TRACKING DASHBOARD =====

export interface TimeTrackingDashboard {
  law_firm_id: string
  user_id: string
  date_range: {
    start_date: string
    end_date: string
  }
  
  // Current period summary
  current_period: {
    total_hours: number
    billable_hours: number
    utilization_rate: number
    total_revenue: number
  }
  
  // Active session
  active_session?: ActiveTimeSession
  
  // Recent entries
  recent_entries: TimeEntry[]
  
  // Daily breakdown (last 7 days)
  daily_breakdown: Array<{
    date: string
    total_minutes: number
    billable_minutes: number
    entries_count: number
  }>
  
  // Top activities
  top_activities: Array<{
    task_category: string
    total_minutes: number
    entry_count: number
  }>
  
  // Client/matter breakdown
  client_breakdown: Array<{
    client_id: string
    client_name: string
    total_minutes: number
    billable_amount: number
  }>
  
  // Subscription allocation summary
  subscription_summary?: {
    current_month_used: number
    current_month_allocated: number
    overage_minutes: number
    overage_amount: number
  }
}

// ===== BILLING INTEGRATION =====

export interface TimeBasedBillingCalculation {
  matter_id?: string
  client_subscription_id?: string
  time_entries: TimeEntry[]
  
  // Calculation results
  total_billable_hours: number
  total_billable_amount: number
  
  // Rate breakdown
  rate_breakdown: Array<{
    rate: number
    hours: number
    amount: number
    description: string
  }>
  
  // Subscription allocation
  subscription_allocation?: {
    included_hours: number
    included_amount: number
    overage_hours: number
    overage_amount: number
  }
  
  // Summary
  subtotal: number
  tax_amount?: number
  total_amount: number
}

export interface AutomatedBillingRule {
  id: string
  law_firm_id: string
  rule_name: string
  
  // Trigger conditions
  auto_approve_threshold_hours?: number
  require_approval_above_amount?: number
  auto_bill_subscription_time: boolean
  auto_bill_case_time: boolean
  
  // Billing schedule
  billing_frequency: 'daily' | 'weekly' | 'monthly'
  billing_day_of_week?: number
  billing_day_of_month?: number
  
  // Notification settings
  notify_before_billing: boolean
  notification_days_before: number
  
  // Status
  is_active: boolean
  last_run?: string
  next_run?: string
  
  created_at: string
  updated_at: string
}

// ===== FORM OPTIONS AND CONSTANTS =====

export const TIME_ENTRY_TYPE_OPTIONS = [
  { value: 'case_work', label: 'Trabalho de Caso', color: 'bg-blue-100 text-blue-800' },
  { value: 'subscription_work', label: 'Consultoria Assinante', color: 'bg-green-100 text-green-800' },
  { value: 'administrative', label: 'Administrativo', color: 'bg-gray-100 text-gray-800' },
  { value: 'business_development', label: 'Desenvolvimento de Negócios', color: 'bg-purple-100 text-purple-800' },
  { value: 'non_billable', label: 'Não Faturável', color: 'bg-red-100 text-red-800' }
] as const

export const TIME_ENTRY_STATUS_OPTIONS = [
  { value: 'draft', label: 'Rascunho', color: 'bg-gray-100 text-gray-800' },
  { value: 'submitted', label: 'Enviado', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'approved', label: 'Aprovado', color: 'bg-green-100 text-green-800' },
  { value: 'rejected', label: 'Rejeitado', color: 'bg-red-100 text-red-800' },
  { value: 'billed', label: 'Faturado', color: 'bg-blue-100 text-blue-800' }
] as const

export const TASK_CATEGORY_OPTIONS = [
  { value: 'Client Meeting', label: 'Reunião com Cliente' },
  { value: 'Research', label: 'Pesquisa Jurídica' },
  { value: 'Document Drafting', label: 'Redação de Documentos' },
  { value: 'Court Appearance', label: 'Comparecimento em Audiência' },
  { value: 'Document Review', label: 'Revisão de Documentos' },
  { value: 'Phone Call', label: 'Ligação Telefônica' },
  { value: 'Email Support', label: 'Suporte por Email' },
  { value: 'Consultation', label: 'Consultoria' },
  { value: 'Administrative', label: 'Administrativo' },
  { value: 'Travel', label: 'Viagem' },
  { value: 'Other', label: 'Outros' }
] as const

export const BILLING_RATE_TYPE_OPTIONS = [
  { value: 'standard', label: 'Padrão', description: 'Taxa padrão do advogado' },
  { value: 'subscription', label: 'Assinante', description: 'Taxa para trabalho de consultoria' },
  { value: 'matter_specific', label: 'Específica do Caso', description: 'Taxa específica para um caso' },
  { value: 'client_specific', label: 'Específica do Cliente', description: 'Taxa específica para um cliente' },
  { value: 'case_type_specific', label: 'Específica do Tipo', description: 'Taxa específica para um tipo de caso' }
] as const

export const RATE_CATEGORY_OPTIONS = [
  { value: 'Estagiário', label: 'Estagiário', rate: 50 },
  { value: 'Advogado Júnior', label: 'Advogado Júnior', rate: 200 },
  { value: 'Advogado Pleno', label: 'Advogado Pleno', rate: 350 },
  { value: 'Advogado Sênior', label: 'Advogado Sênior', rate: 500 },
  { value: 'Sócio', label: 'Sócio', rate: 750 },
  { value: 'Consultor Especializado', label: 'Consultor Especializado', rate: 600 }
] as const

export const LOCATION_OPTIONS = [
  { value: 'Office', label: 'Escritório' },
  { value: 'Client Site', label: 'Local do Cliente' },
  { value: 'Court', label: 'Tribunal' },
  { value: 'Remote', label: 'Remoto' },
  { value: 'Home', label: 'Casa' },
  { value: 'Travel', label: 'Viagem' },
  { value: 'Other', label: 'Outros' }
] as const

export const ROUNDING_METHOD_OPTIONS = [
  { value: 'up', label: 'Para Cima (6 min = 15 min)' },
  { value: 'down', label: 'Para Baixo (14 min = 0 min)' },
  { value: 'nearest', label: 'Mais Próximo (8 min = 15 min, 7 min = 0 min)' }
] as const

// ===== DEFAULT VALUES =====

export const DEFAULT_TIME_TRACKING_SETTINGS = {
  minimum_increment_minutes: 15,
  rounding_method: 'up' as RoundingMethod,
  auto_save_interval_minutes: 5,
  default_billable: true,
  require_approval_above_hours: 8,
  auto_approve_below_hours: 4
}

export const DEFAULT_BILLING_RATES_BY_CATEGORY = {
  'Estagiário': 50,
  'Advogado Júnior': 200,
  'Advogado Pleno': 350,
  'Advogado Sênior': 500,
  'Sócio': 750,
  'Consultor Especializado': 600,
  'Consultoria Assinante': 150
}

// ===== PRESET TEMPLATES =====

export const PRESET_TIME_ENTRY_TEMPLATES: Omit<TimeEntryTemplateFormData, 'law_firm_id' | 'user_id'>[] = [
  {
    template_name: 'Reunião com Cliente',
    template_category: 'Atendimento',
    default_entry_type: 'case_work',
    default_task_category: 'Client Meeting',
    default_activity_description: 'Reunião de acompanhamento do processo',
    default_duration_minutes: 60,
    default_is_billable: true,
    default_location: 'Office',
    is_shared: true
  },
  {
    template_name: 'Pesquisa Jurisprudencial',
    template_category: 'Pesquisa',
    default_entry_type: 'case_work',
    default_task_category: 'Research',
    default_activity_description: 'Pesquisa de jurisprudência e doutrina aplicável',
    default_duration_minutes: 120,
    default_is_billable: true,
    default_location: 'Office',
    is_shared: true
  },
  {
    template_name: 'Redação de Petição',
    template_category: 'Redação',
    default_entry_type: 'case_work',
    default_task_category: 'Document Drafting',
    default_activity_description: 'Elaboração de petição processual',
    default_duration_minutes: 180,
    default_is_billable: true,
    default_location: 'Office',
    is_shared: true
  },
  {
    template_name: 'Audiência Judicial',
    template_category: 'Comparecimento',
    default_entry_type: 'case_work',
    default_task_category: 'Court Appearance',
    default_activity_description: 'Comparecimento em audiência judicial',
    default_duration_minutes: 240,
    default_is_billable: true,
    default_location: 'Court',
    is_shared: true
  },
  {
    template_name: 'Consulta Jurídica',
    template_category: 'Consultoria',
    default_entry_type: 'subscription_work',
    default_task_category: 'Consultation',
    default_activity_description: 'Consultoria jurídica para cliente assinante',
    default_duration_minutes: 30,
    default_is_billable: true,
    default_location: 'Office',
    is_shared: true
  },
  {
    template_name: 'Revisão de Contrato',
    template_category: 'Revisão',
    default_entry_type: 'subscription_work',
    default_task_category: 'Document Review',
    default_activity_description: 'Análise e revisão de minuta contratual',
    default_duration_minutes: 90,
    default_is_billable: true,
    default_location: 'Office',
    is_shared: true
  },
  {
    template_name: 'Suporte por Email',
    template_category: 'Comunicação',
    default_entry_type: 'subscription_work',
    default_task_category: 'Email Support',
    default_activity_description: 'Resposta a dúvida jurídica por email',
    default_duration_minutes: 15,
    default_is_billable: true,
    default_location: 'Office',
    is_shared: true
  },
  {
    template_name: 'Atividades Administrativas',
    template_category: 'Gestão',
    default_entry_type: 'administrative',
    default_task_category: 'Administrative',
    default_activity_description: 'Atividades administrativas e gestão interna',
    default_duration_minutes: 30,
    default_is_billable: false,
    default_location: 'Office',
    is_shared: true
  }
]

// ===== UTILITY TYPES =====

export interface TimeTrackingFilters {
  user_id?: string
  entry_type?: TimeEntryType
  entry_status?: TimeEntryStatus
  matter_id?: string
  client_subscription_id?: string
  start_date?: string
  end_date?: string
  is_billable?: boolean
  min_duration?: number
  max_duration?: number
}

export interface TimeTrackingMetrics {
  total_entries: number
  total_hours: number
  billable_hours: number
  non_billable_hours: number
  total_amount: number
  average_hourly_rate: number
  utilization_rate: number
  productivity_score: number
}

export interface TimerControls {
  start: (entry_data: Partial<TimeEntryFormData>) => Promise<string>
  pause: (session_id: string) => Promise<void>
  resume: (session_id: string) => Promise<void>
  stop: (session_id: string, save_entry?: boolean) => Promise<TimeEntry | null>
  get_current_session: (user_id: string) => Promise<ActiveTimeSession | null>
  update_heartbeat: (session_id: string) => Promise<void>
}