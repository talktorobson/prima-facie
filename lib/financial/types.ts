// Financial Management Types for Prima Facie
// Phase 8.10.1: Accounts Payable & Receivable System

// ====================================
// VENDOR TYPES
// ====================================

export type VendorType = 'supplier' | 'contractor' | 'service_provider' | 'utility' | 'government' | 'other';

export interface Vendor {
  id: string;
  law_firm_id: string;
  vendor_type: VendorType;
  name: string;
  legal_name?: string;
  cnpj?: string;
  cpf?: string;
  email?: string;
  phone?: string;
  website?: string;
  
  // Address
  address_street?: string;
  address_number?: string;
  address_complement?: string;
  address_neighborhood?: string;
  address_city?: string;
  address_state?: string;
  address_postal_code?: string;
  
  // Banking
  bank_name?: string;
  bank_branch?: string;
  bank_account?: string;
  bank_account_type?: 'checking' | 'savings';
  pix_key?: string;
  
  // Business
  payment_terms?: number;
  tax_rate?: number;
  is_recurring: boolean;
  notes?: string;
  is_active: boolean;
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

// ====================================
// EXPENSE CATEGORY TYPES
// ====================================

export type ExpenseCategoryType = 'operational' | 'administrative' | 'legal' | 'marketing' | 'technology' | 'other';

export interface ExpenseCategory {
  id: string;
  law_firm_id: string;
  parent_id?: string;
  code: string;
  name: string;
  description?: string;
  category_type: ExpenseCategoryType;
  is_billable_default: boolean;
  tax_deductible: boolean;
  budget_monthly?: number;
  budget_yearly?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Virtual fields
  children?: ExpenseCategory[];
  total_spent_month?: number;
  total_spent_year?: number;
  budget_remaining?: number;
}

// ====================================
// BILL TYPES
// ====================================

export type BillType = 'one_time' | 'recurring' | 'installment';
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'under_review';
export type RecurrenceFrequency = 'monthly' | 'quarterly' | 'semi_annual' | 'annual';

export interface Bill {
  id: string;
  law_firm_id: string;
  vendor_id: string;
  expense_category_id: string;
  matter_id?: string;
  
  // Bill info
  bill_number: string;
  bill_date: string;
  due_date: string;
  payment_terms?: number;
  
  // Financial
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  currency_code: string;
  
  // Payment tracking
  amount_paid: number;
  balance_due: number;
  payment_status: PaymentStatus;
  
  // Type and recurrence
  bill_type: BillType;
  recurrence_frequency?: RecurrenceFrequency;
  installment_number?: number;
  installment_total?: number;
  parent_bill_id?: string;
  
  // Approval
  approval_status: ApprovalStatus;
  approved_by?: string;
  approved_at?: string;
  approval_notes?: string;
  
  // Documents
  document_url?: string;
  document_storage_path?: string;
  
  // Additional
  description?: string;
  notes?: string;
  is_billable_to_client: boolean;
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  
  // Virtual fields
  vendor?: Vendor;
  expense_category?: ExpenseCategory;
  matter?: any; // Matter type from existing system
  payments?: BillPayment[];
}

// ====================================
// PAYMENT TYPES
// ====================================

export type PaymentMethod = 'bank_transfer' | 'pix' | 'credit_card' | 'debit_card' | 'check' | 'cash' | 'other';

export interface BillPayment {
  id: string;
  bill_id: string;
  payment_date: string;
  amount: number;
  payment_method: PaymentMethod;
  
  // Details
  transaction_reference?: string;
  bank_account_used?: string;
  
  // Proof
  proof_document_url?: string;
  proof_uploaded: boolean;
  
  // Processing
  processed_by?: string;
  processing_notes?: string;
  
  // Metadata
  created_at: string;
  created_by?: string;
  
  // Virtual
  bill?: Bill;
}

// ====================================
// COLLECTION TYPES
// ====================================

export type CollectionStatus = 'current' | 'overdue_30' | 'overdue_60' | 'overdue_90' | 'in_collection' | 'written_off' | 'disputed';

export interface PaymentCollection {
  id: string;
  invoice_id: string;
  client_id: string;
  
  // Status
  collection_status: CollectionStatus;
  days_overdue: number;
  
  // Actions
  last_reminder_sent?: string;
  reminder_count: number;
  collection_agent_id?: string;
  collection_notes?: string;
  
  // Promise to pay
  promise_to_pay_date?: string;
  promise_to_pay_amount?: number;
  promise_to_pay_notes?: string;
  
  // Dispute
  is_disputed: boolean;
  dispute_reason?: string;
  dispute_date?: string;
  dispute_resolved_date?: string;
  
  // Write-off
  written_off_date?: string;
  written_off_amount?: number;
  written_off_reason?: string;
  written_off_by?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
  
  // Virtual
  invoice?: any; // Invoice type from existing system
  client?: any; // Client type from existing system
}

// ====================================
// REMINDER TYPES
// ====================================

export type ReminderType = 'friendly' | 'first_overdue' | 'second_overdue' | 'final_notice' | 'collection_notice';
export type SendMethod = 'email' | 'whatsapp' | 'sms' | 'letter' | 'phone';
export type ReminderStatus = 'scheduled' | 'sent' | 'failed' | 'cancelled';

export interface PaymentReminder {
  id: string;
  invoice_id: string;
  client_id: string;
  
  // Details
  reminder_type: ReminderType;
  scheduled_date: string;
  sent_date?: string;
  
  // Communication
  send_method: SendMethod;
  recipient_email?: string;
  recipient_phone?: string;
  
  // Content
  subject?: string;
  message_body?: string;
  
  // Status
  status: ReminderStatus;
  failure_reason?: string;
  
  // Response
  client_responded: boolean;
  response_date?: string;
  response_notes?: string;
  
  // Metadata
  created_at: string;
  created_by?: string;
  sent_by?: string;
}

// ====================================
// FINANCIAL DOCUMENT TYPES
// ====================================

export type DocumentType = 'bill' | 'invoice' | 'receipt' | 'payment_proof' | 'contract' | 'report';
export type RelatedEntityType = 'bill' | 'invoice' | 'payment' | 'vendor' | 'client';

export interface FinancialDocument {
  id: string;
  law_firm_id: string;
  
  // Polymorphic
  document_type: DocumentType;
  related_entity_type: RelatedEntityType;
  related_entity_id: string;
  
  // Document info
  file_name: string;
  file_size?: number;
  file_type?: string;
  storage_path?: string;
  external_url?: string;
  
  // Metadata
  document_date?: string;
  description?: string;
  tags?: string[];
  
  // Verification
  is_verified: boolean;
  verified_by?: string;
  verified_at?: string;
  
  // System
  created_at: string;
  uploaded_by?: string;
}

// ====================================
// ALERT TYPES
// ====================================

export type AlertType = 'payment_due' | 'payment_overdue' | 'low_cash_balance' | 'budget_exceeded' | 'collection_needed' | 'document_missing';
export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface FinancialAlert {
  id: string;
  law_firm_id: string;
  
  // Configuration
  alert_type: AlertType;
  entity_type?: RelatedEntityType;
  entity_id?: string;
  
  // Details
  title: string;
  message: string;
  severity: AlertSeverity;
  
  // Timing
  trigger_date: string;
  days_before_due?: number;
  
  // Status
  is_active: boolean;
  is_acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  
  // Actions
  action_required?: string;
  action_url?: string;
  
  // Metadata
  created_at: string;
}

// ====================================
// FORM DATA TYPES
// ====================================

export interface VendorFormData {
  vendor_type: VendorType;
  name: string;
  legal_name?: string;
  cnpj?: string;
  cpf?: string;
  email?: string;
  phone?: string;
  website?: string;
  address_street?: string;
  address_number?: string;
  address_complement?: string;
  address_neighborhood?: string;
  address_city?: string;
  address_state?: string;
  address_postal_code?: string;
  bank_name?: string;
  bank_branch?: string;
  bank_account?: string;
  bank_account_type?: 'checking' | 'savings';
  pix_key?: string;
  payment_terms?: number;
  tax_rate?: number;
  is_recurring: boolean;
  notes?: string;
}

export interface BillFormData {
  vendor_id: string;
  expense_category_id: string;
  matter_id?: string;
  bill_number: string;
  bill_date: string;
  due_date: string;
  payment_terms?: number;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  bill_type: BillType;
  recurrence_frequency?: RecurrenceFrequency;
  installment_number?: number;
  installment_total?: number;
  description?: string;
  notes?: string;
  is_billable_to_client: boolean;
  document_url?: string;
}

export interface BillPaymentFormData {
  bill_id: string;
  payment_date: string;
  amount: number;
  payment_method: PaymentMethod;
  transaction_reference?: string;
  bank_account_used?: string;
  proof_document_url?: string;
  processing_notes?: string;
}

// ====================================
// DASHBOARD & ANALYTICS TYPES
// ====================================

export interface CashFlowSummary {
  period: string;
  opening_balance: number;
  total_inflow: number;
  total_outflow: number;
  closing_balance: number;
  
  // Breakdowns
  inflow_by_category: Record<string, number>;
  outflow_by_category: Record<string, number>;
  
  // Projections
  projected_inflow: number;
  projected_outflow: number;
  projected_balance: number;
}

export interface AgingReport {
  as_of_date: string;
  
  // Receivables
  receivables_current: number;
  receivables_overdue_30: number;
  receivables_overdue_60: number;
  receivables_overdue_90: number;
  receivables_over_90: number;
  receivables_total: number;
  
  // Payables
  payables_current: number;
  payables_overdue_30: number;
  payables_overdue_60: number;
  payables_overdue_90: number;
  payables_over_90: number;
  payables_total: number;
  
  // Details
  receivables_details: PaymentCollection[];
  payables_details: Bill[];
}

export interface ExpenseBudgetAnalysis {
  category_id: string;
  category_name: string;
  budget_monthly: number;
  budget_yearly: number;
  spent_month: number;
  spent_year: number;
  remaining_month: number;
  remaining_year: number;
  percentage_used_month: number;
  percentage_used_year: number;
  is_over_budget: boolean;
}

// ====================================
// CONSTANTS
// ====================================

export const VENDOR_TYPE_OPTIONS = [
  { value: 'supplier', label: 'Fornecedor' },
  { value: 'contractor', label: 'Prestador de Serviços' },
  { value: 'service_provider', label: 'Provedor de Serviços' },
  { value: 'utility', label: 'Concessionária' },
  { value: 'government', label: 'Órgão Público' },
  { value: 'other', label: 'Outro' }
] as const;

export const EXPENSE_CATEGORY_TYPE_OPTIONS = [
  { value: 'operational', label: 'Operacional' },
  { value: 'administrative', label: 'Administrativo' },
  { value: 'legal', label: 'Jurídico' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'technology', label: 'Tecnologia' },
  { value: 'other', label: 'Outro' }
] as const;

export const PAYMENT_METHOD_OPTIONS = [
  { value: 'bank_transfer', label: 'Transferência Bancária' },
  { value: 'pix', label: 'PIX' },
  { value: 'credit_card', label: 'Cartão de Crédito' },
  { value: 'debit_card', label: 'Cartão de Débito' },
  { value: 'check', label: 'Cheque' },
  { value: 'cash', label: 'Dinheiro' },
  { value: 'other', label: 'Outro' }
] as const;

export const COLLECTION_STATUS_OPTIONS = [
  { value: 'current', label: 'Em Dia' },
  { value: 'overdue_30', label: 'Atraso 30 Dias' },
  { value: 'overdue_60', label: 'Atraso 60 Dias' },
  { value: 'overdue_90', label: 'Atraso 90 Dias' },
  { value: 'in_collection', label: 'Em Cobrança' },
  { value: 'written_off', label: 'Baixado' },
  { value: 'disputed', label: 'Contestado' }
] as const;

export const BRAZILIAN_STATES = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' }
] as const;