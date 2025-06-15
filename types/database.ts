// =====================================================
// Prima Facie - Database Types
// TypeScript definitions for all database entities
// =====================================================

export type Database = {
  public: {
    Tables: {
      law_firms: {
        Row: LawFirm
        Insert: LawFirmInsert
        Update: LawFirmUpdate
      }
      users: {
        Row: User
        Insert: UserInsert
        Update: UserUpdate
      }
      matter_types: {
        Row: MatterType
        Insert: MatterTypeInsert
        Update: MatterTypeUpdate
      }
      contacts: {
        Row: Contact
        Insert: ContactInsert
        Update: ContactUpdate
      }
      matters: {
        Row: Matter
        Insert: MatterInsert
        Update: MatterUpdate
      }
      matter_contacts: {
        Row: MatterContact
        Insert: MatterContactInsert
        Update: MatterContactUpdate
      }
      tasks: {
        Row: Task
        Insert: TaskInsert
        Update: TaskUpdate
      }
      time_entries: {
        Row: TimeEntry
        Insert: TimeEntryInsert
        Update: TimeEntryUpdate
      }
      documents: {
        Row: Document
        Insert: DocumentInsert
        Update: DocumentUpdate
      }
      invoices: {
        Row: Invoice
        Insert: InvoiceInsert
        Update: InvoiceUpdate
      }
      invoice_line_items: {
        Row: InvoiceLineItem
        Insert: InvoiceLineItemInsert
        Update: InvoiceLineItemUpdate
      }
      messages: {
        Row: Message
        Insert: MessageInsert
        Update: MessageUpdate
      }
      pipeline_stages: {
        Row: PipelineStage
        Insert: PipelineStageInsert
        Update: PipelineStageUpdate
      }
      pipeline_cards: {
        Row: PipelineCard
        Insert: PipelineCardInsert
        Update: PipelineCardUpdate
      }
      activity_logs: {
        Row: ActivityLog
        Insert: ActivityLogInsert
        Update: ActivityLogUpdate
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_type: 'admin' | 'lawyer' | 'staff' | 'client'
      user_status: 'active' | 'inactive' | 'suspended' | 'pending'
      contact_type: 'individual' | 'company'
      client_status: 'prospect' | 'active' | 'inactive' | 'former'
      preferred_communication: 'email' | 'phone' | 'whatsapp' | 'mail'
      matter_status: 'active' | 'closed' | 'on_hold' | 'settled' | 'dismissed'
      matter_priority: 'low' | 'medium' | 'high' | 'urgent'
      billing_method: 'hourly' | 'flat_fee' | 'contingency' | 'pro_bono'
      task_type: 'general' | 'deadline' | 'court_date' | 'client_meeting' | 'document_review'
      task_priority: 'low' | 'medium' | 'high' | 'urgent'
      task_status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
      relationship_type: 'client' | 'opposing_party' | 'witness' | 'expert' | 'other'
      document_access_level: 'public' | 'internal' | 'restricted' | 'confidential'
      invoice_status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled'
      line_item_type: 'time' | 'expense' | 'fee' | 'other'
      message_type: 'text' | 'file' | 'system' | 'whatsapp'
      sender_type: 'user' | 'contact' | 'system'
      message_status: 'sent' | 'delivered' | 'read' | 'failed'
      pipeline_stage_type: 'intake' | 'onboarding' | 'not_hired'
      plan_type: 'trial' | 'basic' | 'professional' | 'enterprise'
    }
  }
}

// =====================================================
// BASE INTERFACES
// =====================================================

interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
}

interface LawFirmEntity extends BaseEntity {
  law_firm_id: string
}

// =====================================================
// LAW FIRMS
// =====================================================

export interface LawFirm extends BaseEntity {
  name: string
  legal_name?: string
  cnpj?: string
  oab_number?: string
  email: string
  phone?: string
  website?: string
  
  // Address
  address_street?: string
  address_number?: string
  address_complement?: string
  address_neighborhood?: string
  address_city?: string
  address_state?: string
  address_zipcode?: string
  address_country?: string
  
  // Branding
  logo_url?: string
  primary_color?: string
  secondary_color?: string
  custom_domain?: string
  
  // Subscription
  plan_type?: Database['public']['Enums']['plan_type']
  features?: Record<string, any>
  subscription_active?: boolean
  trial_ends_at?: string
}

export type LawFirmInsert = Omit<LawFirm, 'id' | 'created_at' | 'updated_at'>
export type LawFirmUpdate = Partial<LawFirmInsert>

// =====================================================
// USERS
// =====================================================

export interface User extends LawFirmEntity {
  auth_user_id?: string
  email: string
  email_verified?: boolean
  
  // Personal Information
  first_name: string
  last_name: string
  full_name?: string
  
  // Professional Information
  oab_number?: string
  position?: string
  department?: string
  
  // Contact Information
  phone?: string
  mobile?: string
  
  // User Type & Permissions
  user_type: Database['public']['Enums']['user_type']
  role?: string
  permissions?: Record<string, any>
  
  // User Status
  status?: Database['public']['Enums']['user_status']
  last_login_at?: string
  
  // Profile
  avatar_url?: string
  bio?: string
  timezone?: string
  language?: string
}

export type UserInsert = Omit<User, 'id' | 'created_at' | 'updated_at' | 'full_name'>
export type UserUpdate = Partial<UserInsert>

// =====================================================
// MATTER TYPES
// =====================================================

export interface MatterType extends LawFirmEntity {
  name: string
  description?: string
  color?: string
  icon?: string
  
  // Default rates
  default_hourly_rate?: number
  default_flat_fee?: number
  
  // Template settings
  required_documents?: string[]
  default_tasks?: string[]
  
  is_active?: boolean
  sort_order?: number
}

export type MatterTypeInsert = Omit<MatterType, 'id' | 'created_at' | 'updated_at'>
export type MatterTypeUpdate = Partial<MatterTypeInsert>

// =====================================================
// CONTACTS
// =====================================================

export interface Contact extends LawFirmEntity {
  user_id?: string
  
  // Contact Type
  contact_type: Database['public']['Enums']['contact_type']
  
  // Individual Information
  first_name?: string
  last_name?: string
  full_name?: string
  cpf?: string
  rg?: string
  birth_date?: string
  marital_status?: string
  profession?: string
  
  // Company Information
  company_name?: string
  cnpj?: string
  company_type?: string
  
  // Contact Information
  email?: string
  phone?: string
  mobile?: string
  
  // Address
  address_street?: string
  address_number?: string
  address_complement?: string
  address_neighborhood?: string
  address_city?: string
  address_state?: string
  address_zipcode?: string
  address_country?: string
  
  // Client Status
  client_status?: Database['public']['Enums']['client_status']
  source?: string
  
  // Financial Information
  credit_limit?: number
  total_billed?: number
  total_paid?: number
  outstanding_balance?: number
  
  // Preferences
  preferred_communication?: Database['public']['Enums']['preferred_communication']
  communication_frequency?: 'minimal' | 'normal' | 'frequent'
  
  // Notes and Tags
  notes?: string
  tags?: string[]
}

export type ContactInsert = Omit<Contact, 'id' | 'created_at' | 'updated_at'>
export type ContactUpdate = Partial<ContactInsert>

// =====================================================
// MATTERS
// =====================================================

export interface Matter extends LawFirmEntity {
  matter_type_id?: string
  
  // Matter Identification
  matter_number: string
  title: string
  description?: string
  
  // Court Information
  court_name?: string
  court_city?: string
  court_state?: string
  process_number?: string
  opposing_party?: string
  
  // Matter Status
  status?: Database['public']['Enums']['matter_status']
  priority?: Database['public']['Enums']['matter_priority']
  
  // Dates
  opened_date?: string
  closed_date?: string
  statute_of_limitations?: string
  next_court_date?: string
  
  // Financial
  billing_method?: Database['public']['Enums']['billing_method']
  hourly_rate?: number
  flat_fee?: number
  contingency_percentage?: number
  
  // Totals (calculated fields)
  total_time_logged?: number
  total_billed?: number
  total_paid?: number
  outstanding_balance?: number
  
  // Assignments
  responsible_lawyer_id?: string
  assigned_staff?: string[]
  
  // Metadata
  notes?: string
  tags?: string[]
  custom_fields?: Record<string, any>
}

export type MatterInsert = Omit<Matter, 'id' | 'created_at' | 'updated_at'>
export type MatterUpdate = Partial<MatterInsert>

// =====================================================
// MATTER CONTACTS
// =====================================================

export interface MatterContact {
  id: string
  matter_id: string
  contact_id: string
  relationship_type: Database['public']['Enums']['relationship_type']
  is_primary?: boolean
  created_at: string
  created_by?: string
}

export type MatterContactInsert = Omit<MatterContact, 'id' | 'created_at'>
export type MatterContactUpdate = Partial<MatterContactInsert>

// =====================================================
// TASKS
// =====================================================

export interface Task extends LawFirmEntity {
  matter_id?: string
  
  title: string
  description?: string
  
  // Task Details
  task_type?: Database['public']['Enums']['task_type']
  priority?: Database['public']['Enums']['task_priority']
  status?: Database['public']['Enums']['task_status']
  
  // Dates
  due_date?: string
  completed_date?: string
  reminder_date?: string
  
  // Assignment
  assigned_to?: string
  
  // Billing
  is_billable?: boolean
  estimated_hours?: number
}

export type TaskInsert = Omit<Task, 'id' | 'created_at' | 'updated_at'>
export type TaskUpdate = Partial<TaskInsert>

// =====================================================
// TIME ENTRIES
// =====================================================

export interface TimeEntry extends LawFirmEntity {
  matter_id: string
  user_id: string
  task_id?: string
  
  // Time Details
  description: string
  hours_worked: number
  
  // Dates
  work_date?: string
  start_time?: string
  end_time?: string
  
  // Billing
  hourly_rate?: number
  total_amount?: number
  is_billable?: boolean
  is_billed?: boolean
  invoice_id?: string
  
  // Timer tracking
  timer_started_at?: string
  timer_stopped_at?: string
}

export type TimeEntryInsert = Omit<TimeEntry, 'id' | 'created_at' | 'updated_at' | 'total_amount'>
export type TimeEntryUpdate = Partial<TimeEntryInsert>

// =====================================================
// DOCUMENTS
// =====================================================

export interface Document extends LawFirmEntity {
  matter_id?: string
  contact_id?: string
  
  // Document Information
  name: string
  description?: string
  file_type?: string
  file_size?: number
  
  // Storage Information
  storage_provider?: string
  storage_path?: string
  external_id?: string
  
  // Document Type
  document_type?: string
  category?: string
  
  // Access Control
  is_confidential?: boolean
  access_level?: Database['public']['Enums']['document_access_level']
  
  // Version Control
  version?: string
  parent_document_id?: string
  
  // Metadata
  tags?: string[]
  custom_fields?: Record<string, any>
}

export type DocumentInsert = Omit<Document, 'id' | 'created_at' | 'updated_at'>
export type DocumentUpdate = Partial<DocumentInsert>

// =====================================================
// INVOICES
// =====================================================

export interface Invoice extends LawFirmEntity {
  contact_id: string
  matter_id?: string
  
  // Invoice Information
  invoice_number: string
  title?: string
  description?: string
  
  // Dates
  issue_date?: string
  due_date: string
  sent_date?: string
  paid_date?: string
  
  // Amounts
  subtotal?: number
  tax_rate?: number
  tax_amount?: number
  total_amount: number
  paid_amount?: number
  outstanding_amount?: number
  
  // Status
  status?: Database['public']['Enums']['invoice_status']
  
  // Payment Information
  payment_method?: string
  payment_reference?: string
  
  // Settings
  currency?: string
  payment_terms?: string
  notes?: string
}

export type InvoiceInsert = Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'outstanding_amount'>
export type InvoiceUpdate = Partial<InvoiceInsert>

// =====================================================
// INVOICE LINE ITEMS
// =====================================================

export interface InvoiceLineItem {
  id: string
  invoice_id: string
  time_entry_id?: string
  
  // Line Item Details
  description: string
  quantity?: number
  rate: number
  amount?: number
  
  // Type
  item_type?: Database['public']['Enums']['line_item_type']
  
  // Date performed
  service_date?: string
  
  created_at: string
}

export type InvoiceLineItemInsert = Omit<InvoiceLineItem, 'id' | 'created_at' | 'amount'>
export type InvoiceLineItemUpdate = Partial<InvoiceLineItemInsert>

// =====================================================
// MESSAGES
// =====================================================

export interface Message extends LawFirmEntity {
  matter_id?: string
  contact_id?: string
  
  // Message Details
  content: string
  message_type?: Database['public']['Enums']['message_type']
  
  // Sender/Receiver
  sender_id?: string
  sender_type?: Database['public']['Enums']['sender_type']
  receiver_id?: string
  receiver_type?: Database['public']['Enums']['sender_type']
  
  // External Integration
  external_message_id?: string
  external_platform?: string
  
  // Status
  status?: Database['public']['Enums']['message_status']
  read_at?: string
  
  // Attachments
  attachments?: Record<string, any>[]
  
  // Threading
  parent_message_id?: string
  thread_id?: string
}

export type MessageInsert = Omit<Message, 'id' | 'created_at' | 'updated_at'>
export type MessageUpdate = Partial<MessageInsert>

// =====================================================
// PIPELINE STAGES
// =====================================================

export interface PipelineStage extends LawFirmEntity {
  name: string
  description?: string
  color?: string
  
  // Stage Type
  stage_type?: Database['public']['Enums']['pipeline_stage_type']
  
  // Order and Status
  sort_order?: number
  is_active?: boolean
  is_final_stage?: boolean
  
  // Automation Rules
  auto_actions?: Record<string, any>
}

export type PipelineStageInsert = Omit<PipelineStage, 'id' | 'created_at' | 'updated_at'>
export type PipelineStageUpdate = Partial<PipelineStageInsert>

// =====================================================
// PIPELINE CARDS
// =====================================================

export interface PipelineCard extends LawFirmEntity {
  pipeline_stage_id: string
  contact_id?: string
  matter_type_id?: string
  
  // Card Information
  title: string
  description?: string
  
  // Financial Potential
  estimated_value?: number
  probability?: number
  
  // Important Dates
  expected_close_date?: string
  last_contact_date?: string
  next_follow_up_date?: string
  
  // Assignment
  assigned_to?: string
  
  // Source and Notes
  source?: string
  notes?: string
  tags?: string[]
  
  // Stage History (for analytics)
  stage_history?: Record<string, any>[]
  
  // Outcome (for not_hired pipeline)
  outcome_reason?: string
  outcome_notes?: string
}

export type PipelineCardInsert = Omit<PipelineCard, 'id' | 'created_at' | 'updated_at'>
export type PipelineCardUpdate = Partial<PipelineCardInsert>

// =====================================================
// ACTIVITY LOGS
// =====================================================

export interface ActivityLog extends LawFirmEntity {
  // What happened
  action: string
  entity_type: string
  entity_id: string
  
  // Who did it
  user_id?: string
  
  // Details
  description?: string
  old_values?: Record<string, any>
  new_values?: Record<string, any>
  
  // Context
  ip_address?: string
  user_agent?: string
}

export type ActivityLogInsert = Omit<ActivityLog, 'id' | 'created_at' | 'updated_at'>
export type ActivityLogUpdate = Partial<ActivityLogInsert>

// =====================================================
// RELATIONSHIP TYPES
// =====================================================

export interface MatterWithRelations extends Matter {
  matter_type?: MatterType
  responsible_lawyer?: User
  contacts?: (Contact & { relationship_type: Database['public']['Enums']['relationship_type'] })[]
  tasks?: Task[]
  time_entries?: TimeEntry[]
  documents?: Document[]
}

export interface ContactWithRelations extends Contact {
  user?: User
  matters?: Matter[]
  pipeline_cards?: PipelineCard[]
}

export interface UserWithRelations extends User {
  law_firm?: LawFirm
  assigned_matters?: Matter[]
  time_entries?: TimeEntry[]
  tasks?: Task[]
}

// =====================================================
// API RESPONSE TYPES
// =====================================================

export interface ApiResponse<T> {
  data: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  per_page: number
  total_pages: number
}

export interface DashboardStats {
  total_matters: number
  active_matters: number
  total_clients: number
  monthly_revenue: number
  pending_tasks: number
  overdue_invoices: number
}

// =====================================================
// FORM TYPES
// =====================================================

export interface ContactForm {
  contact_type: Database['public']['Enums']['contact_type']
  first_name?: string
  last_name?: string
  company_name?: string
  email?: string
  phone?: string
  mobile?: string
  cpf?: string
  cnpj?: string
  notes?: string
}

export interface MatterForm {
  matter_type_id?: string
  title: string
  description?: string
  client_id: string
  responsible_lawyer_id?: string
  billing_method?: Database['public']['Enums']['billing_method']
  hourly_rate?: number
  flat_fee?: number
}

export interface TimeEntryForm {
  matter_id: string
  description: string
  hours_worked: number
  work_date?: string
  is_billable?: boolean
  hourly_rate?: number
}

// =====================================================
// EXPORT ALL TYPES
// =====================================================

export type Tables = Database['public']['Tables']
export type Enums = Database['public']['Enums']