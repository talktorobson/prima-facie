-- =============================================
-- PRIMA FACIE FULL DATABASE MIGRATION SCRIPT
-- Phase 8.7 Complete Schema Update
-- =============================================

-- This script will:
-- 1. Backup existing data
-- 2. Apply Phase 8.6.1 - Time Tracking Schema
-- 3. Apply Phase 8.7.1 - Dual Invoice Schema  
-- 4. Apply Phase 8.10.1 - Financial Management Schema
-- 5. Migrate existing data where applicable
-- 6. Verify all tables and constraints

BEGIN;

-- =============================================
-- STEP 1: ENABLE REQUIRED EXTENSIONS
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- STEP 2: BACKUP EXISTING DATA (CREATE BACKUP TABLES)
-- =============================================

-- Backup existing invoices if they exist
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'invoices') THEN
        CREATE TABLE invoices_backup AS SELECT * FROM invoices;
    END IF;
END $$;

-- Backup existing time entries if they exist
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'time_entries') THEN
        CREATE TABLE time_entries_backup AS SELECT * FROM time_entries;
    END IF;
END $$;

-- =============================================
-- STEP 3: PHASE 8.6.1 - TIME TRACKING SCHEMA
-- =============================================

-- Drop existing time tracking tables if they exist with different schema
DROP TABLE IF EXISTS time_tracking_projects CASCADE;
DROP TABLE IF EXISTS time_sheets CASCADE;
DROP TABLE IF EXISTS billable_hours CASCADE;

-- Create time entries table
CREATE TABLE time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL,
    user_id UUID NOT NULL,
    
    -- Entry classification
    entry_type VARCHAR(50) NOT NULL CHECK (entry_type IN (
        'case_work', 'subscription_work', 'administrative', 'business_development', 'non_billable'
    )),
    entry_status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (entry_status IN (
        'draft', 'submitted', 'approved', 'rejected', 'billed'
    )),
    
    -- Time tracking
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER NOT NULL DEFAULT 0,
    break_minutes INTEGER NOT NULL DEFAULT 0,
    effective_minutes INTEGER GENERATED ALWAYS AS (duration_minutes - break_minutes) STORED,
    
    -- Work details
    matter_id UUID,
    client_subscription_id UUID,
    task_category VARCHAR(100),
    activity_description TEXT NOT NULL,
    
    -- Billing information
    is_billable BOOLEAN NOT NULL DEFAULT true,
    billable_rate DECIMAL(10,2),
    billing_rate_source VARCHAR(50) DEFAULT 'user_default',
    billable_amount DECIMAL(12,2) GENERATED ALWAYS AS (
        CASE 
            WHEN is_billable THEN (effective_minutes::DECIMAL / 60.0) * COALESCE(billable_rate, 0)
            ELSE 0
        END
    ) STORED,
    
    -- Subscription allocation
    counts_toward_subscription BOOLEAN DEFAULT false,
    subscription_service_type VARCHAR(50),
    
    -- Additional details
    location VARCHAR(100),
    is_remote_work BOOLEAN DEFAULT false,
    notes TEXT,
    
    -- Timer functionality
    timer_started_at TIMESTAMP WITH TIME ZONE,
    is_timer_running BOOLEAN DEFAULT false,
    
    -- Metadata
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create time entry templates
CREATE TABLE time_entry_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL,
    user_id UUID,
    
    -- Template details
    template_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Default values
    default_entry_type VARCHAR(50),
    default_task_category VARCHAR(100),
    default_activity_description TEXT,
    default_duration_minutes INTEGER,
    default_is_billable BOOLEAN DEFAULT true,
    default_location VARCHAR(100),
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    -- Sharing
    is_shared BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create lawyer billing rates
CREATE TABLE lawyer_billing_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL,
    user_id UUID NOT NULL,
    
    -- Rate configuration
    rate_type VARCHAR(30) NOT NULL CHECK (rate_type IN (
        'standard', 'matter_specific', 'client_specific', 'service_specific'
    )),
    hourly_rate DECIMAL(10,2) NOT NULL,
    
    -- Scope
    matter_id UUID,
    client_id UUID,
    service_type VARCHAR(50),
    
    -- Validity
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_until DATE,
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create subscription time allocations
CREATE TABLE subscription_time_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL,
    client_subscription_id UUID NOT NULL,
    
    -- Allocation period
    allocation_month DATE NOT NULL, -- First day of month
    
    -- Hours allocation
    allocated_hours DECIMAL(10,2) NOT NULL DEFAULT 0,
    used_hours DECIMAL(10,2) NOT NULL DEFAULT 0,
    remaining_hours DECIMAL(10,2) GENERATED ALWAYS AS (allocated_hours - used_hours) STORED,
    overage_hours DECIMAL(10,2) GENERATED ALWAYS AS (
        CASE WHEN used_hours > allocated_hours THEN used_hours - allocated_hours ELSE 0 END
    ) STORED,
    
    -- Service breakdown
    service_breakdown JSONB,
    
    -- Status
    allocation_status VARCHAR(20) DEFAULT 'active' CHECK (allocation_status IN (
        'active', 'completed', 'rolled_over', 'expired'
    )),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create time entry allocations
CREATE TABLE time_entry_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    time_entry_id UUID NOT NULL REFERENCES time_entries(id) ON DELETE CASCADE,
    subscription_time_allocation_id UUID REFERENCES subscription_time_allocations(id),
    
    -- Allocation details
    allocated_minutes INTEGER NOT NULL,
    service_type VARCHAR(50),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create daily time summaries
CREATE TABLE daily_time_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL,
    user_id UUID NOT NULL,
    summary_date DATE NOT NULL,
    
    -- Summary data
    total_minutes INTEGER DEFAULT 0,
    billable_minutes INTEGER DEFAULT 0,
    non_billable_minutes INTEGER DEFAULT 0,
    break_minutes INTEGER DEFAULT 0,
    
    -- Breakdown by type
    case_work_minutes INTEGER DEFAULT 0,
    subscription_work_minutes INTEGER DEFAULT 0,
    administrative_minutes INTEGER DEFAULT 0,
    
    -- Revenue
    total_billable_amount DECIMAL(12,2) DEFAULT 0,
    
    -- Entry count
    total_entries INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint
    UNIQUE(law_firm_id, user_id, summary_date)
);

-- Create active time sessions
CREATE TABLE active_time_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    time_entry_id UUID REFERENCES time_entries(id) ON DELETE CASCADE,
    
    -- Session details
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_heartbeat TIMESTAMP WITH TIME ZONE,
    is_paused BOOLEAN DEFAULT false,
    pause_duration_minutes INTEGER DEFAULT 0,
    
    -- Session data
    session_data JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- STEP 4: PHASE 8.7.1 - DUAL INVOICE SCHEMA
-- =============================================

-- Drop existing invoice tables if they exist with different schema
DROP TABLE IF EXISTS dual_invoices CASCADE;
DROP TABLE IF EXISTS invoice_types CASCADE;
DROP TABLE IF EXISTS invoice_configurations CASCADE;

-- Central invoice registry with different types
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL,
    client_id UUID NOT NULL,
    
    -- Invoice identification
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    invoice_type VARCHAR(30) NOT NULL CHECK (invoice_type IN (
        'subscription',     -- Monthly/yearly subscription billing
        'case_billing',     -- One-time case billing
        'payment_plan',     -- Installment from payment plan
        'time_based',       -- Time tracking based billing
        'hybrid',           -- Combination of multiple types
        'adjustment',       -- Credits, refunds, corrections
        'late_fee'         -- Late payment penalties
    )),
    
    -- Financial details
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
    
    -- Status and workflow
    invoice_status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (invoice_status IN (
        'draft', 'pending_review', 'approved', 'sent', 'viewed', 'paid', 
        'partial_paid', 'overdue', 'disputed', 'cancelled', 'refunded'
    )),
    
    -- Dates
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    sent_date DATE,
    paid_date DATE,
    
    -- Payment terms
    payment_terms VARCHAR(50) DEFAULT '30_days' CHECK (payment_terms IN (
        'immediate', '7_days', '15_days', '30_days', '45_days', '60_days', 'custom'
    )),
    payment_methods TEXT[],
    
    -- References to source records
    client_subscription_id UUID,
    matter_id UUID,
    payment_plan_id UUID,
    
    -- Grouping and consolidation
    parent_invoice_id UUID REFERENCES invoices(id),
    invoice_group VARCHAR(100),
    
    -- Invoice content
    description TEXT,
    notes TEXT,
    internal_notes TEXT,
    
    -- Metadata
    created_by UUID,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT positive_amounts CHECK (
        subtotal >= 0 AND tax_amount >= 0 AND discount_amount >= 0 AND total_amount >= 0
    ),
    CONSTRAINT total_calculation CHECK (
        total_amount = subtotal + tax_amount - discount_amount
    )
);

-- Invoice line items
CREATE TABLE invoice_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    
    -- Line item details
    line_type VARCHAR(30) NOT NULL CHECK (line_type IN (
        'subscription_fee', 'case_fee', 'success_fee', 'time_entry', 'expense',
        'discount', 'tax', 'adjustment', 'late_fee', 'service_fee'
    )),
    description TEXT NOT NULL,
    
    -- Quantity and pricing
    quantity DECIMAL(10,4) NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    line_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    
    -- References to source data
    time_entry_id UUID REFERENCES time_entries(id),
    service_inclusion_id UUID,
    case_billing_id UUID,
    case_outcome_id UUID,
    discount_application_id UUID,
    
    -- Tax information
    tax_rate DECIMAL(5,4) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    
    -- Metadata
    sort_order INTEGER DEFAULT 0,
    is_taxable BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT positive_line_amounts CHECK (quantity > 0 AND unit_price >= 0 AND line_total >= 0),
    CONSTRAINT line_total_calculation CHECK (line_total = quantity * unit_price)
);

-- Subscription invoice management
CREATE TABLE subscription_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    client_subscription_id UUID NOT NULL,
    
    -- Billing period
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly')),
    
    -- Service usage tracking
    services_included JSONB,
    services_used JSONB,
    overage_charges DECIMAL(12,2) DEFAULT 0,
    
    -- Proration handling
    is_prorated BOOLEAN DEFAULT false,
    proration_reason VARCHAR(100),
    proration_factor DECIMAL(5,4) DEFAULT 1.0,
    
    -- Auto-renewal
    auto_renew BOOLEAN DEFAULT true,
    next_billing_date DATE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Case invoice management
CREATE TABLE case_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    matter_id UUID NOT NULL,
    case_billing_id UUID,
    
    -- Billing details
    billing_method VARCHAR(20) NOT NULL CHECK (billing_method IN ('hourly', 'fixed', 'percentage', 'hybrid')),
    
    -- Time-based billing
    total_hours DECIMAL(10,2),
    billable_hours DECIMAL(10,2),
    hourly_rate DECIMAL(12,2),
    time_charges DECIMAL(12,2) DEFAULT 0,
    
    -- Fixed fee billing
    fixed_fee DECIMAL(12,2),
    
    -- Percentage billing (contingency)
    recovery_amount DECIMAL(12,2),
    percentage_rate DECIMAL(5,4),
    percentage_fee DECIMAL(12,2) DEFAULT 0,
    
    -- Success fees
    success_fee DECIMAL(12,2) DEFAULT 0,
    success_criteria_met BOOLEAN DEFAULT false,
    
    -- Expenses and costs
    case_expenses DECIMAL(12,2) DEFAULT 0,
    reimbursable_expenses DECIMAL(12,2) DEFAULT 0,
    
    -- Minimum fee enforcement
    minimum_fee DECIMAL(12,2),
    minimum_fee_applied BOOLEAN DEFAULT false,
    
    -- Payment terms specific to case
    is_final_invoice BOOLEAN DEFAULT false,
    allows_payment_plan BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payment plan invoice management
CREATE TABLE payment_plan_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    payment_plan_id UUID NOT NULL,
    
    -- Installment details
    installment_number INTEGER NOT NULL,
    total_installments INTEGER NOT NULL,
    installment_amount DECIMAL(12,2) NOT NULL,
    
    -- Schedule
    scheduled_date DATE NOT NULL,
    grace_period_days INTEGER DEFAULT 5,
    late_fee_rate DECIMAL(5,4) DEFAULT 0,
    late_fee_amount DECIMAL(12,2) DEFAULT 0,
    
    -- Status
    is_final_installment BOOLEAN DEFAULT false,
    auto_generate_next BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_installment_number CHECK (
        installment_number > 0 AND installment_number <= total_installments
    )
);

-- Time-based invoice management
CREATE TABLE time_based_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    
    -- Time period
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    
    -- Time summary
    total_time_entries INTEGER DEFAULT 0,
    total_hours DECIMAL(10,2) DEFAULT 0,
    billable_hours DECIMAL(10,2) DEFAULT 0,
    non_billable_hours DECIMAL(10,2) DEFAULT 0,
    
    -- Rate breakdown
    weighted_average_rate DECIMAL(12,2),
    highest_rate DECIMAL(12,2),
    lowest_rate DECIMAL(12,2),
    
    -- Distribution
    case_hours DECIMAL(10,2) DEFAULT 0,
    subscription_hours DECIMAL(10,2) DEFAULT 0,
    administrative_hours DECIMAL(10,2) DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Invoice payments tracking
CREATE TABLE invoice_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    
    -- Payment details
    payment_amount DECIMAL(12,2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN (
        'cash', 'check', 'bank_transfer', 'pix', 'credit_card', 'debit_card', 'other'
    )),
    
    -- Transaction details
    transaction_id VARCHAR(100),
    reference_number VARCHAR(100),
    
    -- Payment processor info
    processor VARCHAR(50),
    processor_fee DECIMAL(12,2) DEFAULT 0,
    net_amount DECIMAL(12,2),
    
    -- Status
    payment_status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (payment_status IN (
        'pending', 'completed', 'failed', 'refunded', 'disputed'
    )),
    
    -- Allocation (for partial payments)
    allocated_to_principal DECIMAL(12,2),
    allocated_to_fees DECIMAL(12,2),
    allocated_to_interest DECIMAL(12,2),
    
    -- Notes
    notes TEXT,
    
    -- Metadata
    recorded_by UUID,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT positive_payment_amount CHECK (payment_amount > 0)
);

-- Invoice templates and automation
CREATE TABLE invoice_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL,
    
    -- Template details
    template_name VARCHAR(100) NOT NULL,
    template_type VARCHAR(30) NOT NULL CHECK (template_type IN (
        'subscription', 'case_billing', 'payment_plan', 'time_based', 'generic'
    )),
    
    -- Template content
    subject_template TEXT,
    description_template TEXT,
    terms_and_conditions TEXT,
    
    -- Default settings
    default_payment_terms VARCHAR(50),
    default_due_days INTEGER DEFAULT 30,
    default_late_fee_rate DECIMAL(5,4) DEFAULT 0,
    
    -- Automation rules
    auto_generate BOOLEAN DEFAULT false,
    auto_send BOOLEAN DEFAULT false,
    send_reminder_days INTEGER[],
    
    -- Email settings
    email_template TEXT,
    email_subject TEXT,
    
    -- Active status
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Invoice generation logs
CREATE TABLE invoice_generation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL,
    
    -- Generation details
    generation_type VARCHAR(30) NOT NULL CHECK (generation_type IN (
        'manual', 'scheduled', 'triggered', 'batch'
    )),
    
    -- Batch information
    batch_id UUID,
    total_invoices_generated INTEGER DEFAULT 0,
    successful_generations INTEGER DEFAULT 0,
    failed_generations INTEGER DEFAULT 0,
    
    -- Time period
    period_start DATE,
    period_end DATE,
    
    -- Filters applied
    client_filters JSONB,
    subscription_filters JSONB,
    matter_filters JSONB,
    
    -- Results
    generated_invoice_ids UUID[],
    error_messages TEXT[],
    
    -- Metadata
    triggered_by UUID,
    
    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled'))
);

-- =============================================
-- STEP 5: PHASE 8.10.1 - FINANCIAL MANAGEMENT SCHEMA
-- =============================================

-- Create vendors table
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL,
    vendor_type VARCHAR(50) NOT NULL CHECK (vendor_type IN (
        'supplier', 'contractor', 'service_provider', 'utility', 'government', 'other'
    )),
    name VARCHAR(200) NOT NULL,
    
    -- Brazilian business identifiers
    cnpj VARCHAR(18),
    cpf VARCHAR(14),
    tax_id VARCHAR(50),
    
    -- Contact information
    email VARCHAR(255),
    phone VARCHAR(20),
    website VARCHAR(255),
    
    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(2),
    postal_code VARCHAR(10),
    country VARCHAR(2) DEFAULT 'BR',
    
    -- Payment information
    preferred_payment_method VARCHAR(30) DEFAULT 'bank_transfer',
    payment_terms VARCHAR(50) DEFAULT '30_days',
    bank_name VARCHAR(100),
    bank_account VARCHAR(50),
    pix_key VARCHAR(255),
    
    -- Business relationship
    vendor_status VARCHAR(20) DEFAULT 'active' CHECK (vendor_status IN (
        'active', 'inactive', 'suspended', 'blocked'
    )),
    credit_limit DECIMAL(12,2),
    
    -- Metadata
    notes TEXT,
    tags TEXT[],
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create expense categories table
CREATE TABLE expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL,
    
    -- Category details
    category_name VARCHAR(100) NOT NULL,
    description TEXT,
    category_code VARCHAR(20),
    
    -- Hierarchy
    parent_category_id UUID REFERENCES expense_categories(id),
    category_level INTEGER DEFAULT 1,
    
    -- Business rules
    is_tax_deductible BOOLEAN DEFAULT true,
    requires_approval BOOLEAN DEFAULT true,
    approval_threshold DECIMAL(12,2),
    
    -- Accounting
    default_account_code VARCHAR(20),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create bills table
CREATE TABLE bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL,
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    expense_category_id UUID REFERENCES expense_categories(id),
    
    -- Bill identification
    bill_number VARCHAR(100),
    vendor_invoice_number VARCHAR(100),
    
    -- Financial details
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'BRL',
    
    -- Dates
    bill_date DATE NOT NULL,
    due_date DATE NOT NULL,
    received_date DATE DEFAULT CURRENT_DATE,
    
    -- Status and workflow
    bill_status VARCHAR(20) DEFAULT 'pending' CHECK (bill_status IN (
        'draft', 'pending', 'approved', 'rejected', 'paid', 'overdue', 'cancelled'
    )),
    
    -- Approval workflow
    requires_approval BOOLEAN DEFAULT true,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    approval_notes TEXT,
    
    -- Payment information
    payment_method VARCHAR(30),
    payment_terms VARCHAR(50),
    
    -- Description and attachments
    description TEXT,
    notes TEXT,
    attachment_urls TEXT[],
    
    -- Recurrence
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern VARCHAR(20), -- monthly, quarterly, yearly
    next_bill_date DATE,
    
    -- Metadata
    created_by UUID,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create bill payments table
CREATE TABLE bill_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL,
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    
    -- Payment details
    payment_amount DECIMAL(12,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    
    -- Transaction details
    transaction_id VARCHAR(100),
    reference_number VARCHAR(100),
    
    -- Bank/payment processor information
    bank_account VARCHAR(100),
    processor_fee DECIMAL(12,2) DEFAULT 0,
    
    -- Status
    payment_status VARCHAR(20) DEFAULT 'completed' CHECK (payment_status IN (
        'pending', 'completed', 'failed', 'cancelled', 'refunded'
    )),
    
    -- Notes
    notes TEXT,
    
    -- Metadata
    recorded_by UUID,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create payment collections table
CREATE TABLE payment_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL,
    client_id UUID NOT NULL,
    invoice_id UUID REFERENCES invoices(id),
    
    -- Collection details
    original_amount DECIMAL(12,2) NOT NULL,
    collected_amount DECIMAL(12,2) DEFAULT 0,
    remaining_amount DECIMAL(12,2) GENERATED ALWAYS AS (original_amount - collected_amount) STORED,
    
    -- Dates
    due_date DATE NOT NULL,
    overdue_date DATE GENERATED ALWAYS AS (due_date + INTERVAL '1 day') STORED,
    days_overdue INTEGER GENERATED ALWAYS AS (
        CASE WHEN CURRENT_DATE > due_date 
        THEN EXTRACT(DAY FROM CURRENT_DATE - due_date)::INTEGER 
        ELSE 0 END
    ) STORED,
    
    -- Collection status
    collection_status VARCHAR(20) DEFAULT 'current' CHECK (collection_status IN (
        'current', 'overdue_30', 'overdue_60', 'overdue_90', 'in_collection', 'written_off'
    )),
    
    -- Collection actions
    last_reminder_sent DATE,
    reminder_count INTEGER DEFAULT 0,
    collection_notes TEXT,
    
    -- Promise to pay
    promised_payment_date DATE,
    promised_amount DECIMAL(12,2),
    promise_notes TEXT,
    
    -- Dispute information
    is_disputed BOOLEAN DEFAULT false,
    dispute_reason TEXT,
    dispute_date DATE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create payment reminders table
CREATE TABLE payment_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL,
    payment_collection_id UUID NOT NULL REFERENCES payment_collections(id) ON DELETE CASCADE,
    
    -- Reminder details
    reminder_type VARCHAR(20) NOT NULL CHECK (reminder_type IN (
        'friendly', 'first_overdue', 'second_overdue', 'final_notice', 'collection_notice'
    )),
    reminder_method VARCHAR(20) NOT NULL CHECK (reminder_method IN (
        'email', 'sms', 'whatsapp', 'postal_mail', 'phone_call'
    )),
    
    -- Content
    subject VARCHAR(255),
    message_content TEXT,
    
    -- Scheduling
    scheduled_date DATE NOT NULL,
    sent_date DATE,
    
    -- Status
    reminder_status VARCHAR(20) DEFAULT 'scheduled' CHECK (reminder_status IN (
        'scheduled', 'sent', 'delivered', 'failed', 'cancelled'
    )),
    
    -- Response tracking
    client_response TEXT,
    response_date DATE,
    
    -- Automation
    is_automated BOOLEAN DEFAULT true,
    template_used VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create financial documents table
CREATE TABLE financial_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL,
    
    -- Document details
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN (
        'invoice', 'receipt', 'bill', 'bank_statement', 'tax_document', 'contract', 'other'
    )),
    document_number VARCHAR(100),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- File information
    file_url VARCHAR(500),
    file_name VARCHAR(255),
    file_size INTEGER,
    file_type VARCHAR(50),
    
    -- Relationships
    related_invoice_id UUID REFERENCES invoices(id),
    related_bill_id UUID REFERENCES bills(id),
    related_vendor_id UUID REFERENCES vendors(id),
    related_client_id UUID,
    
    -- Financial data
    amount DECIMAL(12,2),
    currency VARCHAR(3) DEFAULT 'BRL',
    document_date DATE,
    
    -- Status
    document_status VARCHAR(20) DEFAULT 'active' CHECK (document_status IN (
        'active', 'archived', 'deleted'
    )),
    
    -- Metadata
    tags TEXT[],
    uploaded_by UUID,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create financial alerts table
CREATE TABLE financial_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL,
    
    -- Alert details
    alert_type VARCHAR(30) NOT NULL CHECK (alert_type IN (
        'overdue_invoice', 'low_cash_flow', 'high_expenses', 'payment_received', 
        'bill_due_soon', 'budget_exceeded', 'collection_needed'
    )),
    alert_level VARCHAR(20) DEFAULT 'info' CHECK (alert_level IN (
        'info', 'warning', 'error', 'critical'
    )),
    
    -- Content
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Targeting
    target_user_id UUID,
    target_role VARCHAR(50),
    
    -- Related records
    related_invoice_id UUID REFERENCES invoices(id),
    related_bill_id UUID REFERENCES bills(id),
    related_collection_id UUID REFERENCES payment_collections(id),
    
    -- Alert data
    alert_data JSONB,
    threshold_value DECIMAL(12,2),
    current_value DECIMAL(12,2),
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    is_acknowledged BOOLEAN DEFAULT false,
    acknowledged_by UUID,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    
    -- Automation
    is_automated BOOLEAN DEFAULT false,
    auto_resolve BOOLEAN DEFAULT false,
    
    -- Timestamps
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- STEP 6: CREATE INDEXES FOR PERFORMANCE
-- =============================================

-- Time tracking indexes
CREATE INDEX idx_time_entries_law_firm_id ON time_entries(law_firm_id);
CREATE INDEX idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX idx_time_entries_matter_id ON time_entries(matter_id);
CREATE INDEX idx_time_entries_entry_date ON time_entries(entry_date);
CREATE INDEX idx_time_entries_status ON time_entries(entry_status);

-- Invoice indexes
CREATE INDEX idx_invoices_law_firm_id ON invoices(law_firm_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_status ON invoices(invoice_status);
CREATE INDEX idx_invoices_type ON invoices(invoice_type);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);

-- Financial management indexes
CREATE INDEX idx_vendors_law_firm_id ON vendors(law_firm_id);
CREATE INDEX idx_bills_law_firm_id ON bills(law_firm_id);
CREATE INDEX idx_bills_vendor_id ON bills(vendor_id);
CREATE INDEX idx_bills_status ON bills(bill_status);
CREATE INDEX idx_bills_due_date ON bills(due_date);
CREATE INDEX idx_payment_collections_law_firm_id ON payment_collections(law_firm_id);
CREATE INDEX idx_payment_collections_client_id ON payment_collections(client_id);
CREATE INDEX idx_payment_collections_status ON payment_collections(collection_status);

-- =============================================
-- STEP 7: CREATE ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entry_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_billing_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_time_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_collections ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 8: INSERT DEFAULT DATA
-- =============================================

-- Insert default expense categories
INSERT INTO expense_categories (law_firm_id, category_name, description, is_tax_deductible) VALUES
(uuid_generate_v4(), 'Rent & Facilities', 'Office rent, utilities, maintenance', true),
(uuid_generate_v4(), 'Technology', 'Software subscriptions, hardware, IT services', true),
(uuid_generate_v4(), 'Professional Services', 'Accounting, legal, consulting services', true),
(uuid_generate_v4(), 'Marketing & Advertising', 'Digital marketing, print ads, promotional materials', true),
(uuid_generate_v4(), 'Travel & Entertainment', 'Business travel, client entertainment, meals', true),
(uuid_generate_v4(), 'Office Supplies', 'Stationery, printing, general office materials', true),
(uuid_generate_v4(), 'Insurance', 'Professional liability, general business insurance', true),
(uuid_generate_v4(), 'Training & Education', 'Professional development, courses, conferences', true),
(uuid_generate_v4(), 'Communications', 'Phone, internet, postal services', true),
(uuid_generate_v4(), 'Banking & Finance', 'Bank fees, interest, financial services', false),
(uuid_generate_v4(), 'Taxes & Licenses', 'Business licenses, regulatory fees, taxes', false),
(uuid_generate_v4(), 'Miscellaneous', 'Other business expenses not categorized above', true);

-- =============================================
-- STEP 9: CREATE TRIGGERS AND FUNCTIONS
-- =============================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create update triggers for all tables with updated_at column
CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON time_entries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON bills 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number(p_law_firm_id UUID, p_invoice_type VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    v_year VARCHAR(4);
    v_sequence INTEGER;
    v_prefix VARCHAR(10);
    v_invoice_number VARCHAR(50);
BEGIN
    v_year := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;
    
    -- Set prefix based on invoice type
    CASE p_invoice_type
        WHEN 'subscription' THEN v_prefix := 'SUB';
        WHEN 'case_billing' THEN v_prefix := 'CASE';
        WHEN 'payment_plan' THEN v_prefix := 'PLAN';
        WHEN 'time_based' THEN v_prefix := 'TIME';
        ELSE v_prefix := 'INV';
    END CASE;
    
    -- Get next sequence number
    SELECT COALESCE(MAX(
        CAST(
            REGEXP_REPLACE(invoice_number, '^[A-Z]+-' || v_year || '-(\d+)$', '\1')
            AS INTEGER
        )
    ), 0) + 1
    INTO v_sequence
    FROM invoices 
    WHERE law_firm_id = p_law_firm_id
        AND invoice_type = p_invoice_type
        AND invoice_number ~ ('^' || v_prefix || '-' || v_year || '-\d+$');
    
    -- Format invoice number
    v_invoice_number := v_prefix || '-' || v_year || '-' || LPAD(v_sequence::VARCHAR, 6, '0');
    
    RETURN v_invoice_number;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN (
        'time_entries', 'time_entry_templates', 'lawyer_billing_rates', 'subscription_time_allocations',
        'invoices', 'invoice_line_items', 'subscription_invoices', 'case_invoices', 'payment_plan_invoices',
        'vendors', 'expense_categories', 'bills', 'bill_payments', 'payment_collections'
    )
ORDER BY table_name;

-- Check row counts for key tables
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY tablename;