-- =====================================================
-- Prima Facie - Consolidated Database Schema
-- Single init file for fresh Supabase deploys
-- All helper functions in PUBLIC schema (Supabase-safe)
-- All FK references use contacts (not clients)
-- All RLS uses public.current_user_* functions
-- =====================================================

-- =====================================================
-- SECTION 1: Extensions
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- SECTION 2: Helper Functions (public schema)
-- Supabase does NOT allow creating functions in auth schema
-- =====================================================

CREATE OR REPLACE FUNCTION public.current_user_law_firm_id()
RETURNS UUID
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT law_firm_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT user_type = 'admin' FROM users WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_staff()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT user_type IN ('admin', 'lawyer', 'staff') FROM users WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND user_type = 'super_admin'
  );
$$;

-- Timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- SECTION 3: Core Tables (15 tables)
-- =====================================================

-- 3.1 LAW FIRMS
CREATE TABLE IF NOT EXISTS law_firms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    cnpj VARCHAR(18) UNIQUE,
    oab_number VARCHAR(50),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    website VARCHAR(255),
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_complement VARCHAR(100),
    address_neighborhood VARCHAR(100),
    address_city VARCHAR(100),
    address_state VARCHAR(2),
    address_zipcode VARCHAR(9),
    address_country VARCHAR(2) DEFAULT 'BR',
    logo_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#0066CC',
    secondary_color VARCHAR(7) DEFAULT '#64748B',
    custom_domain VARCHAR(255),
    plan_type VARCHAR(50) DEFAULT 'trial',
    features JSONB DEFAULT '{}',
    subscription_active BOOLEAN DEFAULT true,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID,
    updated_by UUID
);

-- 3.2 USERS (super_admin has law_firm_id = NULL)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID REFERENCES law_firms(id) ON DELETE CASCADE,
    auth_user_id UUID UNIQUE,
    email VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT false,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(255) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    oab_number VARCHAR(50),
    position VARCHAR(100),
    department VARCHAR(100),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('admin', 'lawyer', 'staff', 'client', 'super_admin')),
    role VARCHAR(50),
    permissions JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
    last_login_at TIMESTAMP WITH TIME ZONE,
    avatar_url TEXT,
    bio TEXT,
    timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
    language VARCHAR(5) DEFAULT 'pt-BR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID,
    updated_by UUID
);

-- Partial unique indexes for users (handles NULL law_firm_id for super_admin)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_unique_email_per_firm
  ON users (law_firm_id, email) WHERE law_firm_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_unique_email_platform
  ON users (email) WHERE law_firm_id IS NULL;

-- 3.3 MATTER TYPES
CREATE TABLE IF NOT EXISTS matter_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#64748B',
    icon VARCHAR(50),
    default_hourly_rate DECIMAL(10,2),
    default_flat_fee DECIMAL(10,2),
    required_documents JSONB DEFAULT '[]',
    default_tasks JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    UNIQUE(law_firm_id, name)
);

-- 3.4 CONTACTS
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    contact_type VARCHAR(20) NOT NULL CHECK (contact_type IN ('individual', 'company')),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    full_name VARCHAR(255),
    cpf VARCHAR(14),
    rg VARCHAR(20),
    birth_date DATE,
    marital_status VARCHAR(20),
    profession VARCHAR(100),
    company_name VARCHAR(255),
    cnpj VARCHAR(18),
    company_type VARCHAR(50),
    email VARCHAR(255),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_complement VARCHAR(100),
    address_neighborhood VARCHAR(100),
    address_city VARCHAR(100),
    address_state VARCHAR(2),
    address_zipcode VARCHAR(9),
    address_country VARCHAR(2) DEFAULT 'BR',
    client_status VARCHAR(20) DEFAULT 'prospect' CHECK (client_status IN ('prospect', 'active', 'inactive', 'former')),
    source VARCHAR(50),
    credit_limit DECIMAL(10,2),
    total_billed DECIMAL(10,2) DEFAULT 0,
    total_paid DECIMAL(10,2) DEFAULT 0,
    outstanding_balance DECIMAL(10,2) DEFAULT 0,
    preferred_communication VARCHAR(20) DEFAULT 'email' CHECK (preferred_communication IN ('email', 'phone', 'whatsapp', 'mail')),
    communication_frequency VARCHAR(20) DEFAULT 'normal' CHECK (communication_frequency IN ('minimal', 'normal', 'frequent')),
    notes TEXT,
    tags JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- 3.5 MATTERS
CREATE TABLE IF NOT EXISTS matters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    matter_type_id UUID REFERENCES matter_types(id),
    matter_number VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    court_name VARCHAR(255),
    court_city VARCHAR(100),
    court_state VARCHAR(2),
    process_number VARCHAR(50),
    opposing_party VARCHAR(255),
    status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'on_hold', 'settled', 'dismissed')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    opened_date DATE NOT NULL DEFAULT CURRENT_DATE,
    closed_date DATE,
    statute_of_limitations DATE,
    next_court_date TIMESTAMP WITH TIME ZONE,
    billing_method VARCHAR(20) DEFAULT 'hourly' CHECK (billing_method IN ('hourly', 'flat_fee', 'contingency', 'pro_bono')),
    hourly_rate DECIMAL(10,2),
    flat_fee DECIMAL(10,2),
    contingency_percentage DECIMAL(5,2),
    total_time_logged DECIMAL(10,2) DEFAULT 0,
    total_billed DECIMAL(10,2) DEFAULT 0,
    total_paid DECIMAL(10,2) DEFAULT 0,
    outstanding_balance DECIMAL(10,2) DEFAULT 0,
    responsible_lawyer_id UUID REFERENCES users(id),
    assigned_staff JSONB DEFAULT '[]',
    notes TEXT,
    tags JSONB DEFAULT '[]',
    custom_fields JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    UNIQUE(law_firm_id, matter_number)
);

-- 3.6 MATTER_CONTACTS (with law_firm_id for direct RLS)
CREATE TABLE IF NOT EXISTS matter_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id),
    matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    relationship_type VARCHAR(30) NOT NULL CHECK (relationship_type IN ('client', 'opposing_party', 'witness', 'expert', 'other')),
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES users(id),
    UNIQUE(matter_id, contact_id, relationship_type)
);

-- 3.7 TASKS
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    matter_id UUID REFERENCES matters(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    task_type VARCHAR(30) DEFAULT 'general' CHECK (task_type IN ('general', 'deadline', 'court_date', 'client_meeting', 'document_review')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    due_date TIMESTAMP WITH TIME ZONE,
    completed_date TIMESTAMP WITH TIME ZONE,
    reminder_date TIMESTAMP WITH TIME ZONE,
    assigned_to UUID REFERENCES users(id),
    is_billable BOOLEAN DEFAULT false,
    estimated_hours DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- 3.8 DOCUMENTS
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    matter_id UUID REFERENCES matters(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    file_type VARCHAR(10),
    file_size BIGINT,
    storage_provider VARCHAR(20) DEFAULT 'google_drive',
    storage_path TEXT,
    external_id VARCHAR(255),
    document_type VARCHAR(50),
    category VARCHAR(50),
    is_confidential BOOLEAN DEFAULT false,
    access_level VARCHAR(20) DEFAULT 'internal' CHECK (access_level IN ('public', 'internal', 'restricted', 'confidential')),
    version VARCHAR(10) DEFAULT '1.0',
    parent_document_id UUID REFERENCES documents(id),
    tags JSONB DEFAULT '[]',
    custom_fields JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- 3.9 MESSAGES
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    matter_id UUID REFERENCES matters(id),
    contact_id UUID REFERENCES contacts(id),
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system', 'whatsapp')),
    sender_id UUID REFERENCES users(id),
    sender_type VARCHAR(20) CHECK (sender_type IN ('user', 'contact', 'system')),
    receiver_id UUID REFERENCES users(id),
    receiver_type VARCHAR(20) CHECK (receiver_type IN ('user', 'contact')),
    external_message_id VARCHAR(255),
    external_platform VARCHAR(20),
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
    read_at TIMESTAMP WITH TIME ZONE,
    attachments JSONB DEFAULT '[]',
    parent_message_id UUID REFERENCES messages(id),
    thread_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3.10 PIPELINE_STAGES
CREATE TABLE IF NOT EXISTS pipeline_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#64748B',
    stage_type VARCHAR(20) DEFAULT 'intake' CHECK (stage_type IN ('intake', 'onboarding', 'not_hired')),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_final_stage BOOLEAN DEFAULT false,
    auto_actions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    UNIQUE(law_firm_id, name, stage_type)
);

-- 3.11 PIPELINE_CARDS
CREATE TABLE IF NOT EXISTS pipeline_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    pipeline_stage_id UUID NOT NULL REFERENCES pipeline_stages(id),
    contact_id UUID REFERENCES contacts(id),
    matter_type_id UUID REFERENCES matter_types(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    estimated_value DECIMAL(10,2),
    probability DECIMAL(5,2) CHECK (probability >= 0 AND probability <= 100),
    expected_close_date DATE,
    last_contact_date DATE,
    next_follow_up_date DATE,
    assigned_to UUID REFERENCES users(id),
    source VARCHAR(50),
    notes TEXT,
    tags JSONB DEFAULT '[]',
    stage_history JSONB DEFAULT '[]',
    outcome_reason VARCHAR(100),
    outcome_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- 3.12 ACTIVITY_LOGS
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    user_id UUID REFERENCES users(id),
    description TEXT,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- SECTION 4: Billing Tables (9 tables from 005)
-- =====================================================

-- 4.1 DISCOUNT RULES
CREATE TABLE IF NOT EXISTS discount_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(50) NOT NULL DEFAULT 'subscription_based',
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 5,
    conditions JSONB DEFAULT '[]'::jsonb,
    discount_config JSONB DEFAULT '{}'::jsonb,
    valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE,
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4.2 CASE TYPES
CREATE TABLE IF NOT EXISTS case_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    category VARCHAR(100),
    minimum_fee_hourly DECIMAL(15,2) DEFAULT 0,
    minimum_fee_percentage DECIMAL(15,2) DEFAULT 0,
    minimum_fee_fixed DECIMAL(15,2) DEFAULT 0,
    default_billing_method VARCHAR(50) DEFAULT 'hourly',
    default_hourly_rate DECIMAL(15,2) DEFAULT 0,
    default_percentage_rate DECIMAL(5,2) DEFAULT 0,
    default_success_fee_rate DECIMAL(5,2) DEFAULT 0,
    complexity_multiplier DECIMAL(5,2) DEFAULT 1.0,
    estimated_hours_range VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4.3 BUSINESS PARAMETERS
CREATE TABLE IF NOT EXISTS business_parameters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    parameter_category VARCHAR(100) NOT NULL,
    parameter_name VARCHAR(255) NOT NULL,
    parameter_key VARCHAR(255) NOT NULL,
    parameter_value TEXT NOT NULL,
    parameter_type VARCHAR(50) DEFAULT 'string',
    description TEXT,
    unit VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    requires_approval BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(law_firm_id, parameter_key)
);

-- 4.4 CASE BILLING METHODS
CREATE TABLE IF NOT EXISTS case_billing_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    case_type_id UUID REFERENCES case_types(id) ON DELETE SET NULL,
    billing_type VARCHAR(50) NOT NULL DEFAULT 'hourly',
    hourly_rate DECIMAL(15,2),
    percentage_rate DECIMAL(5,2),
    fixed_amount DECIMAL(15,2),
    success_fee_percentage DECIMAL(5,2) DEFAULT 0,
    success_fee_applies_to VARCHAR(50) DEFAULT 'recovered',
    minimum_fee DECIMAL(15,2) DEFAULT 0,
    minimum_fee_source VARCHAR(50) DEFAULT 'custom',
    has_subscription_discount BOOLEAN DEFAULT false,
    original_amount DECIMAL(15,2),
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    final_amount DECIMAL(15,2),
    status VARCHAR(50) DEFAULT 'draft',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4.5 CASE OUTCOMES
CREATE TABLE IF NOT EXISTS case_outcomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    outcome_type VARCHAR(50) NOT NULL,
    outcome_subtype VARCHAR(100),
    total_value_claimed DECIMAL(15,2),
    effective_value_redeemed DECIMAL(15,2),
    settlement_amount DECIMAL(15,2),
    court_award_amount DECIMAL(15,2),
    success_achieved BOOLEAN DEFAULT false,
    success_percentage DECIMAL(5,2),
    success_fee_percentage DECIMAL(5,2),
    success_fee_amount DECIMAL(15,2),
    success_fee_calculation_method VARCHAR(50) DEFAULT 'percentage',
    outcome_date DATE NOT NULL,
    final_payment_received_date DATE,
    court_decision_reference TEXT,
    settlement_agreement_reference TEXT,
    notes TEXT,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4.6 SUBSCRIPTION PLANS
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    plan_name VARCHAR(255) NOT NULL,
    plan_type VARCHAR(50) DEFAULT 'general',
    description TEXT,
    monthly_fee DECIMAL(15,2) NOT NULL DEFAULT 0,
    yearly_fee DECIMAL(15,2) NOT NULL DEFAULT 0,
    setup_fee DECIMAL(15,2) DEFAULT 0,
    services_included JSONB DEFAULT '[]'::jsonb,
    max_monthly_hours INTEGER DEFAULT 0,
    max_document_reviews INTEGER DEFAULT 0,
    support_level VARCHAR(50) DEFAULT 'email',
    billing_interval VARCHAR(50) DEFAULT 'monthly',
    trial_period_days INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4.7 CLIENT SUBSCRIPTIONS (law_firm_id added for direct RLS)
CREATE TABLE IF NOT EXISTS client_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    subscription_plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'trial',
    billing_cycle VARCHAR(50) DEFAULT 'monthly',
    auto_renew BOOLEAN DEFAULT true,
    start_date DATE NOT NULL,
    end_date DATE,
    trial_end_date DATE,
    current_period_start DATE NOT NULL,
    current_period_end DATE NOT NULL,
    next_billing_date DATE,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    monthly_fee DECIMAL(15,2) DEFAULT 0,
    yearly_fee DECIMAL(15,2) DEFAULT 0,
    current_fee DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4.8 APPLIED DISCOUNTS
CREATE TABLE IF NOT EXISTS applied_discounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    client_id UUID REFERENCES contacts(id),
    discount_rule_id UUID REFERENCES discount_rules(id),
    discount_amount DECIMAL(15,2),
    discount_percentage DECIMAL(5,2),
    applied_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- SECTION 5: DataJud Tables (5 tables + function)
-- =====================================================

-- 5.1 DATAJUD CASE DETAILS
CREATE TABLE IF NOT EXISTS datajud_case_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    datajud_case_id TEXT NOT NULL,
    numero_processo_cnj TEXT NOT NULL,
    tribunal_alias TEXT NOT NULL,
    court_instance INTEGER,
    court_code INTEGER,
    court_name TEXT,
    court_municipality_ibge INTEGER,
    court_municipality TEXT,
    court_state TEXT,
    court_competence TEXT,
    process_class_code INTEGER,
    process_class_name TEXT,
    process_format_code INTEGER,
    process_format_name TEXT,
    court_system_code INTEGER,
    court_system_name TEXT,
    filing_date TIMESTAMP WITH TIME ZONE,
    last_update_date TIMESTAMP WITH TIME ZONE,
    case_value DECIMAL(15,2),
    is_confidential BOOLEAN DEFAULT false,
    enrichment_confidence DECIMAL(3,2) DEFAULT 0.85,
    last_enrichment_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    enrichment_status TEXT DEFAULT 'pending',
    data_conflicts JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    UNIQUE(law_firm_id, datajud_case_id),
    UNIQUE(law_firm_id, numero_processo_cnj)
);

-- 5.2 DATAJUD LEGAL SUBJECTS
CREATE TABLE IF NOT EXISTS datajud_legal_subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    datajud_case_detail_id UUID NOT NULL REFERENCES datajud_case_details(id) ON DELETE CASCADE,
    subject_code INTEGER NOT NULL,
    subject_name TEXT NOT NULL,
    is_primary_subject BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(datajud_case_detail_id, subject_code)
);

-- 5.3 DATAJUD CASE PARTICIPANTS
CREATE TABLE IF NOT EXISTS datajud_case_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    datajud_case_detail_id UUID NOT NULL REFERENCES datajud_case_details(id) ON DELETE CASCADE,
    participant_name TEXT NOT NULL,
    participant_cpf_cnpj TEXT,
    participant_type TEXT CHECK (participant_type IN ('F', 'J')),
    case_role TEXT CHECK (case_role IN ('ativo', 'passivo')),
    participation_type TEXT,
    matched_contact_id UUID REFERENCES contacts(id),
    match_confidence DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5.4 DATAJUD TIMELINE EVENTS
CREATE TABLE IF NOT EXISTS datajud_timeline_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    datajud_case_detail_id UUID NOT NULL REFERENCES datajud_case_details(id) ON DELETE CASCADE,
    movement_id TEXT NOT NULL,
    movement_code INTEGER NOT NULL,
    movement_name TEXT NOT NULL,
    movement_complement TEXT,
    event_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    responsible_type_code INTEGER,
    responsible_type_name TEXT,
    responsible_code INTEGER,
    responsible_name TEXT,
    event_category TEXT,
    priority_level TEXT DEFAULT 'normal' CHECK (priority_level IN ('low', 'normal', 'high', 'critical')),
    is_relevant BOOLEAN DEFAULT true,
    is_visible_client BOOLEAN DEFAULT true,
    is_visible_timeline BOOLEAN DEFAULT true,
    custom_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(datajud_case_detail_id, movement_id)
);

-- 5.5 DATAJUD SYNC LOG
CREATE TABLE IF NOT EXISTS datajud_sync_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    sync_type TEXT NOT NULL CHECK (sync_type IN ('full', 'incremental', 'manual', 'case_specific')),
    sync_status TEXT NOT NULL CHECK (sync_status IN ('started', 'completed', 'failed', 'partial')),
    matter_id UUID REFERENCES matters(id),
    total_cases_processed INTEGER DEFAULT 0,
    successful_cases INTEGER DEFAULT 0,
    failed_cases INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    summary JSONB,
    errors JSONB,
    api_calls_made INTEGER DEFAULT 0,
    rate_limit_hits INTEGER DEFAULT 0,
    initiated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- DataJud enrichment confidence function
CREATE OR REPLACE FUNCTION calculate_enrichment_confidence(p_datajud_case_detail_id UUID)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    v_confidence DECIMAL(3,2) := 0.5;
BEGIN
    SELECT v_confidence + 0.1 INTO v_confidence
    FROM datajud_case_details
    WHERE id = p_datajud_case_detail_id AND court_name IS NOT NULL AND court_code IS NOT NULL;

    SELECT v_confidence + 0.1 INTO v_confidence
    FROM datajud_case_details
    WHERE id = p_datajud_case_detail_id AND process_class_name IS NOT NULL;

    IF EXISTS (SELECT 1 FROM datajud_legal_subjects WHERE datajud_case_detail_id = p_datajud_case_detail_id) THEN
        v_confidence := v_confidence + 0.1;
    END IF;
    IF EXISTS (SELECT 1 FROM datajud_case_participants WHERE datajud_case_detail_id = p_datajud_case_detail_id) THEN
        v_confidence := v_confidence + 0.1;
    END IF;
    IF EXISTS (SELECT 1 FROM datajud_timeline_events WHERE datajud_case_detail_id = p_datajud_case_detail_id) THEN
        v_confidence := v_confidence + 0.1;
    END IF;

    v_confidence := GREATEST(0.0, LEAST(1.0, v_confidence));

    UPDATE datajud_case_details
    SET enrichment_confidence = v_confidence, last_enrichment_at = CURRENT_TIMESTAMP
    WHERE id = p_datajud_case_detail_id;

    RETURN v_confidence;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SECTION 6: Time Tracking Tables (7 tables + 2 functions)
-- Winner: phase 8.6.1 (replaces simple 001 time_entries)
-- FIX: clients(id) FK → contacts(id)
-- =====================================================

-- 6.1 TIME ENTRIES (full version from 8.6.1)
CREATE TABLE IF NOT EXISTS time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    entry_type VARCHAR(50) NOT NULL CHECK (entry_type IN ('case_work', 'subscription_work', 'administrative', 'business_development', 'non_billable')),
    entry_status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (entry_status IN ('draft', 'submitted', 'approved', 'rejected', 'billed')),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    break_minutes INTEGER DEFAULT 0,
    effective_minutes INTEGER GENERATED ALWAYS AS (duration_minutes - break_minutes) STORED,
    matter_id UUID REFERENCES matters(id),
    client_subscription_id UUID REFERENCES client_subscriptions(id),
    task_category VARCHAR(100),
    activity_description TEXT NOT NULL,
    is_billable BOOLEAN NOT NULL DEFAULT true,
    billable_rate DECIMAL(10,2),
    billing_rate_source VARCHAR(50) CHECK (billing_rate_source IN ('user_default', 'matter_specific', 'subscription_rate', 'custom')),
    billable_amount DECIMAL(12,2) GENERATED ALWAYS AS (
        CASE WHEN is_billable THEN (effective_minutes::DECIMAL / 60.0) * COALESCE(billable_rate, 0) ELSE 0 END
    ) STORED,
    counts_toward_subscription BOOLEAN DEFAULT FALSE,
    subscription_service_type VARCHAR(50),
    location VARCHAR(255),
    is_remote_work BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    approval_notes TEXT,
    rejected_reason TEXT,
    invoice_id UUID, -- FK added after invoices table
    billed_at TIMESTAMP WITH TIME ZONE,
    billing_notes TEXT,
    timer_started_at TIMESTAMP WITH TIME ZONE,
    is_timer_running BOOLEAN DEFAULT FALSE,
    entry_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- 6.2 TIME ENTRY TEMPLATES
CREATE TABLE IF NOT EXISTS time_entry_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    template_name VARCHAR(255) NOT NULL,
    template_description TEXT,
    template_category VARCHAR(100),
    default_entry_type VARCHAR(50) NOT NULL,
    default_task_category VARCHAR(100),
    default_activity_description TEXT,
    default_duration_minutes INTEGER,
    default_billable_rate DECIMAL(10,2),
    default_is_billable BOOLEAN DEFAULT true,
    default_location VARCHAR(255),
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    is_shared BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6.3 LAWYER BILLING RATES (FIX: contacts not clients)
CREATE TABLE IF NOT EXISTS lawyer_billing_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    rate_type VARCHAR(50) NOT NULL CHECK (rate_type IN ('standard', 'subscription', 'matter_specific', 'client_specific', 'case_type_specific')),
    rate_category VARCHAR(100),
    hourly_rate DECIMAL(10,2) NOT NULL,
    currency_code VARCHAR(3) DEFAULT 'BRL',
    matter_id UUID REFERENCES matters(id),
    client_id UUID REFERENCES contacts(id),
    case_type_id UUID REFERENCES case_types(id),
    subscription_plan_id UUID REFERENCES subscription_plans(id),
    effective_from DATE NOT NULL,
    effective_until DATE,
    minimum_increment_minutes INTEGER DEFAULT 15,
    rounding_method VARCHAR(20) DEFAULT 'up' CHECK (rounding_method IN ('up', 'down', 'nearest')),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6.4 SUBSCRIPTION TIME ALLOCATIONS
CREATE TABLE IF NOT EXISTS subscription_time_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_subscription_id UUID NOT NULL REFERENCES client_subscriptions(id),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    allocation_month DATE NOT NULL,
    total_minutes_allocated INTEGER NOT NULL,
    total_minutes_used INTEGER DEFAULT 0,
    total_minutes_remaining INTEGER GENERATED ALWAYS AS (total_minutes_allocated - total_minutes_used) STORED,
    consultation_minutes_used INTEGER DEFAULT 0,
    document_review_minutes_used INTEGER DEFAULT 0,
    phone_support_minutes_used INTEGER DEFAULT 0,
    email_support_minutes_used INTEGER DEFAULT 0,
    other_minutes_used INTEGER DEFAULT 0,
    overage_minutes INTEGER DEFAULT 0,
    overage_rate DECIMAL(10,2),
    overage_amount DECIMAL(12,2) GENERATED ALWAYS AS (
        CASE WHEN overage_minutes > 0 THEN (overage_minutes::DECIMAL / 60.0) * COALESCE(overage_rate, 0) ELSE 0 END
    ) STORED,
    allocation_status VARCHAR(20) DEFAULT 'active' CHECK (allocation_status IN ('active', 'exhausted', 'rolled_over', 'expired')),
    rollover_minutes INTEGER DEFAULT 0,
    invoiced_at TIMESTAMP WITH TIME ZONE,
    invoice_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_subscription_month UNIQUE (client_subscription_id, allocation_month)
);

-- 6.5 TIME ENTRY ALLOCATIONS
CREATE TABLE IF NOT EXISTS time_entry_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    time_entry_id UUID NOT NULL REFERENCES time_entries(id) ON DELETE CASCADE,
    subscription_time_allocation_id UUID REFERENCES subscription_time_allocations(id),
    allocated_minutes INTEGER NOT NULL,
    allocation_type VARCHAR(50) NOT NULL CHECK (allocation_type IN ('included', 'overage', 'complimentary')),
    service_type VARCHAR(50),
    is_billed BOOLEAN DEFAULT FALSE,
    billing_rate DECIMAL(10,2),
    billing_amount DECIMAL(12,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6.6 DAILY TIME SUMMARIES
CREATE TABLE IF NOT EXISTS daily_time_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    summary_date DATE NOT NULL,
    case_work_minutes INTEGER DEFAULT 0,
    subscription_work_minutes INTEGER DEFAULT 0,
    administrative_minutes INTEGER DEFAULT 0,
    non_billable_minutes INTEGER DEFAULT 0,
    total_minutes INTEGER DEFAULT 0,
    billable_minutes INTEGER DEFAULT 0,
    billable_amount DECIMAL(12,2) DEFAULT 0,
    non_billable_minutes_count INTEGER DEFAULT 0,
    total_entries INTEGER DEFAULT 0,
    approved_entries INTEGER DEFAULT 0,
    pending_entries INTEGER DEFAULT 0,
    utilization_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN total_minutes > 0 THEN (billable_minutes::DECIMAL / total_minutes::DECIMAL) * 100 ELSE 0 END
    ) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_date_summary UNIQUE (user_id, summary_date)
);

-- 6.7 ACTIVE TIME SESSIONS
CREATE TABLE IF NOT EXISTS active_time_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    session_name VARCHAR(255),
    entry_type VARCHAR(50) NOT NULL,
    matter_id UUID REFERENCES matters(id),
    client_subscription_id UUID REFERENCES client_subscriptions(id),
    task_category VARCHAR(100),
    activity_description TEXT,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_heartbeat TIMESTAMP WITH TIME ZONE,
    pause_duration_minutes INTEGER DEFAULT 0,
    is_paused BOOLEAN DEFAULT FALSE,
    paused_at TIMESTAMP WITH TIME ZONE,
    device_info VARCHAR(255),
    ip_address INET,
    last_auto_save TIMESTAMP WITH TIME ZONE,
    auto_save_interval_minutes INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Time tracking functions
CREATE OR REPLACE FUNCTION update_subscription_time_allocation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.client_subscription_id IS NOT NULL AND NEW.counts_toward_subscription = TRUE THEN
        INSERT INTO subscription_time_allocations (
            client_subscription_id, law_firm_id, allocation_month,
            total_minutes_allocated, total_minutes_used
        ) VALUES (
            NEW.client_subscription_id, NEW.law_firm_id,
            DATE_TRUNC('month', NEW.entry_date),
            (SELECT max_monthly_hours * 60 FROM subscription_plans sp
             JOIN client_subscriptions cs ON cs.subscription_plan_id = sp.id
             WHERE cs.id = NEW.client_subscription_id),
            NEW.effective_minutes
        )
        ON CONFLICT (client_subscription_id, allocation_month)
        DO UPDATE SET
            total_minutes_used = subscription_time_allocations.total_minutes_used + NEW.effective_minutes,
            updated_at = CURRENT_TIMESTAMP;

        INSERT INTO time_entry_allocations (
            time_entry_id, subscription_time_allocation_id,
            allocated_minutes, allocation_type, service_type
        )
        SELECT NEW.id, sta.id, NEW.effective_minutes,
            CASE WHEN sta.total_minutes_used <= sta.total_minutes_allocated THEN 'included' ELSE 'overage' END,
            NEW.subscription_service_type
        FROM subscription_time_allocations sta
        WHERE sta.client_subscription_id = NEW.client_subscription_id
        AND sta.allocation_month = DATE_TRUNC('month', NEW.entry_date);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_daily_time_summary()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO daily_time_summaries (
        law_firm_id, user_id, summary_date,
        case_work_minutes, subscription_work_minutes, administrative_minutes,
        non_billable_minutes, total_minutes, billable_minutes, billable_amount,
        total_entries, approved_entries, pending_entries
    )
    SELECT NEW.law_firm_id, NEW.user_id, NEW.entry_date,
        SUM(CASE WHEN entry_type = 'case_work' THEN effective_minutes ELSE 0 END),
        SUM(CASE WHEN entry_type = 'subscription_work' THEN effective_minutes ELSE 0 END),
        SUM(CASE WHEN entry_type = 'administrative' THEN effective_minutes ELSE 0 END),
        SUM(CASE WHEN is_billable = FALSE THEN effective_minutes ELSE 0 END),
        SUM(effective_minutes),
        SUM(CASE WHEN is_billable = TRUE THEN effective_minutes ELSE 0 END),
        SUM(billable_amount), COUNT(*),
        SUM(CASE WHEN entry_status = 'approved' THEN 1 ELSE 0 END),
        SUM(CASE WHEN entry_status IN ('draft', 'submitted') THEN 1 ELSE 0 END)
    FROM time_entries
    WHERE law_firm_id = NEW.law_firm_id AND user_id = NEW.user_id AND entry_date = NEW.entry_date
    GROUP BY law_firm_id, user_id, entry_date
    ON CONFLICT (user_id, summary_date)
    DO UPDATE SET
        case_work_minutes = EXCLUDED.case_work_minutes,
        subscription_work_minutes = EXCLUDED.subscription_work_minutes,
        administrative_minutes = EXCLUDED.administrative_minutes,
        non_billable_minutes = EXCLUDED.non_billable_minutes,
        total_minutes = EXCLUDED.total_minutes,
        billable_minutes = EXCLUDED.billable_minutes,
        billable_amount = EXCLUDED.billable_amount,
        total_entries = EXCLUDED.total_entries,
        approved_entries = EXCLUDED.approved_entries,
        pending_entries = EXCLUDED.pending_entries,
        updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SECTION 7: Invoice System (9 tables + 4 functions)
-- Winner: phase 8.7.1 (replaces simple 001 invoices)
-- FIX: clients(id) → contacts(id), no service_inclusions/case_billing FKs
-- FIX: RLS uses public.current_user_law_firm_id() not current_setting()
-- =====================================================

-- 7.1 INVOICES (full version from 8.7.1)
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    invoice_type VARCHAR(30) NOT NULL CHECK (invoice_type IN (
        'subscription', 'case_billing', 'payment_plan', 'time_based', 'hybrid', 'adjustment', 'late_fee'
    )),
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
    invoice_status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (invoice_status IN (
        'draft', 'pending_review', 'approved', 'sent', 'viewed', 'paid', 'partial_paid', 'overdue', 'disputed', 'cancelled', 'refunded'
    )),
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    sent_date DATE,
    paid_date DATE,
    payment_terms VARCHAR(50) DEFAULT '30_days' CHECK (payment_terms IN (
        'immediate', '7_days', '15_days', '30_days', '45_days', '60_days', 'custom'
    )),
    payment_methods TEXT[],
    client_subscription_id UUID REFERENCES client_subscriptions(id),
    matter_id UUID REFERENCES matters(id),
    payment_plan_id UUID REFERENCES payment_plans(id),
    parent_invoice_id UUID REFERENCES invoices(id),
    invoice_group VARCHAR(100),
    description TEXT,
    notes TEXT,
    internal_notes TEXT,
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT positive_amounts CHECK (subtotal >= 0 AND tax_amount >= 0 AND discount_amount >= 0 AND total_amount >= 0),
    CONSTRAINT total_calculation CHECK (total_amount = subtotal + tax_amount - discount_amount)
);

-- 7.2 INVOICE LINE ITEMS (full version from 8.7.1)
-- FIX: removed service_inclusions(id) and case_billing(id) FKs (tables don't exist)
CREATE TABLE IF NOT EXISTS invoice_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    line_type VARCHAR(30) NOT NULL CHECK (line_type IN (
        'subscription_fee', 'case_fee', 'success_fee', 'time_entry', 'expense', 'discount', 'tax', 'adjustment', 'late_fee', 'service_fee'
    )),
    description TEXT NOT NULL,
    quantity DECIMAL(10,4) NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    line_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    time_entry_id UUID REFERENCES time_entries(id),
    case_outcome_id UUID REFERENCES case_outcomes(id),
    discount_application_id UUID,
    tax_rate DECIMAL(5,4) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    is_taxable BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT positive_line_amounts CHECK (quantity > 0 AND unit_price >= 0 AND line_total >= 0),
    CONSTRAINT line_total_calculation CHECK (line_total = quantity * unit_price)
);

-- 7.3 SUBSCRIPTION INVOICES
CREATE TABLE IF NOT EXISTS subscription_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    client_subscription_id UUID NOT NULL REFERENCES client_subscriptions(id) ON DELETE CASCADE,
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly')),
    services_included JSONB,
    services_used JSONB,
    overage_charges DECIMAL(12,2) DEFAULT 0,
    is_prorated BOOLEAN DEFAULT false,
    proration_reason VARCHAR(100),
    proration_factor DECIMAL(5,4) DEFAULT 1.0,
    auto_renew BOOLEAN DEFAULT true,
    next_billing_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7.4 CASE INVOICES
-- FIX: removed case_billing(id) FK (table doesn't exist, case_billing_methods is the actual table)
CREATE TABLE IF NOT EXISTS case_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    case_billing_method_id UUID REFERENCES case_billing_methods(id),
    billing_method VARCHAR(20) NOT NULL CHECK (billing_method IN ('hourly', 'fixed', 'percentage', 'hybrid')),
    total_hours DECIMAL(10,2),
    billable_hours DECIMAL(10,2),
    hourly_rate DECIMAL(12,2),
    time_charges DECIMAL(12,2) DEFAULT 0,
    fixed_fee DECIMAL(12,2),
    recovery_amount DECIMAL(12,2),
    percentage_rate DECIMAL(5,4),
    percentage_fee DECIMAL(12,2) DEFAULT 0,
    success_fee DECIMAL(12,2) DEFAULT 0,
    success_criteria_met BOOLEAN DEFAULT false,
    case_expenses DECIMAL(12,2) DEFAULT 0,
    reimbursable_expenses DECIMAL(12,2) DEFAULT 0,
    minimum_fee DECIMAL(12,2),
    minimum_fee_applied BOOLEAN DEFAULT false,
    is_final_invoice BOOLEAN DEFAULT false,
    allows_payment_plan BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7.5 PAYMENT PLAN INVOICES
CREATE TABLE IF NOT EXISTS payment_plan_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    payment_plan_id UUID NOT NULL REFERENCES payment_plans(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    total_installments INTEGER NOT NULL,
    installment_amount DECIMAL(12,2) NOT NULL,
    scheduled_date DATE NOT NULL,
    grace_period_days INTEGER DEFAULT 5,
    late_fee_rate DECIMAL(5,4) DEFAULT 0,
    late_fee_amount DECIMAL(12,2) DEFAULT 0,
    is_final_installment BOOLEAN DEFAULT false,
    auto_generate_next BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_installment_number CHECK (installment_number > 0 AND installment_number <= total_installments)
);

-- 7.6 TIME BASED INVOICES
CREATE TABLE IF NOT EXISTS time_based_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    total_time_entries INTEGER DEFAULT 0,
    total_hours DECIMAL(10,2) DEFAULT 0,
    billable_hours DECIMAL(10,2) DEFAULT 0,
    non_billable_hours DECIMAL(10,2) DEFAULT 0,
    weighted_average_rate DECIMAL(12,2),
    highest_rate DECIMAL(12,2),
    lowest_rate DECIMAL(12,2),
    case_hours DECIMAL(10,2) DEFAULT 0,
    subscription_hours DECIMAL(10,2) DEFAULT 0,
    administrative_hours DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7.7 INVOICE PAYMENTS
CREATE TABLE IF NOT EXISTS invoice_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    payment_amount DECIMAL(12,2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN (
        'cash', 'check', 'bank_transfer', 'pix', 'credit_card', 'debit_card', 'other'
    )),
    transaction_id VARCHAR(100),
    reference_number VARCHAR(100),
    processor VARCHAR(50),
    processor_fee DECIMAL(12,2) DEFAULT 0,
    net_amount DECIMAL(12,2),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (payment_status IN (
        'pending', 'completed', 'failed', 'refunded', 'disputed'
    )),
    allocated_to_principal DECIMAL(12,2),
    allocated_to_fees DECIMAL(12,2),
    allocated_to_interest DECIMAL(12,2),
    notes TEXT,
    recorded_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT positive_payment_amount CHECK (payment_amount > 0)
);

-- 7.8 INVOICE TEMPLATES
CREATE TABLE IF NOT EXISTS invoice_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    template_name VARCHAR(100) NOT NULL,
    template_type VARCHAR(30) NOT NULL CHECK (template_type IN (
        'subscription', 'case_billing', 'payment_plan', 'time_based', 'generic'
    )),
    subject_template TEXT,
    description_template TEXT,
    terms_and_conditions TEXT,
    default_payment_terms VARCHAR(50),
    default_due_days INTEGER DEFAULT 30,
    default_late_fee_rate DECIMAL(5,4) DEFAULT 0,
    auto_generate BOOLEAN DEFAULT false,
    auto_send BOOLEAN DEFAULT false,
    send_reminder_days INTEGER[],
    email_template TEXT,
    email_subject TEXT,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7.9 INVOICE GENERATION LOGS
CREATE TABLE IF NOT EXISTS invoice_generation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    generation_type VARCHAR(30) NOT NULL CHECK (generation_type IN ('manual', 'scheduled', 'triggered', 'batch')),
    batch_id UUID,
    total_invoices_generated INTEGER DEFAULT 0,
    successful_generations INTEGER DEFAULT 0,
    failed_generations INTEGER DEFAULT 0,
    period_start DATE,
    period_end DATE,
    client_filters JSONB,
    subscription_filters JSONB,
    matter_filters JSONB,
    generated_invoice_ids UUID[],
    error_messages TEXT[],
    triggered_by UUID REFERENCES users(id),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled'))
);

-- Invoice functions
CREATE OR REPLACE FUNCTION update_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE invoices SET
        subtotal = (SELECT COALESCE(SUM(line_total), 0) FROM invoice_line_items
            WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id) AND line_type NOT IN ('tax', 'discount')),
        tax_amount = (SELECT COALESCE(SUM(line_total), 0) FROM invoice_line_items
            WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id) AND line_type = 'tax'),
        discount_amount = (SELECT COALESCE(SUM(ABS(line_total)), 0) FROM invoice_line_items
            WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id) AND line_type = 'discount'),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);

    UPDATE invoices SET total_amount = subtotal + tax_amount - discount_amount, updated_at = CURRENT_TIMESTAMP
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_invoice_number(p_law_firm_id UUID, p_invoice_type VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    v_year VARCHAR(4); v_sequence INTEGER; v_prefix VARCHAR(10);
BEGIN
    v_year := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;
    CASE p_invoice_type
        WHEN 'subscription' THEN v_prefix := 'SUB';
        WHEN 'case_billing' THEN v_prefix := 'CASE';
        WHEN 'payment_plan' THEN v_prefix := 'PLAN';
        WHEN 'time_based' THEN v_prefix := 'TIME';
        ELSE v_prefix := 'INV';
    END CASE;
    SELECT COALESCE(MAX(CAST(REGEXP_REPLACE(invoice_number, '^[A-Z]+-' || v_year || '-(\d+)$', '\1') AS INTEGER)), 0) + 1
    INTO v_sequence FROM invoices
    WHERE law_firm_id = p_law_firm_id AND invoice_type = p_invoice_type
    AND invoice_number ~ ('^' || v_prefix || '-' || v_year || '-\d+$');
    RETURN v_prefix || '-' || v_year || '-' || LPAD(v_sequence::VARCHAR, 6, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
        NEW.invoice_number := generate_invoice_number(NEW.law_firm_id, NEW.invoice_type);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_invoice_payment_status()
RETURNS TRIGGER AS $$
DECLARE
    v_total_paid DECIMAL(12,2); v_invoice_total DECIMAL(12,2); v_new_status VARCHAR(20);
BEGIN
    SELECT COALESCE(SUM(payment_amount), 0) INTO v_total_paid FROM invoice_payments
    WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id) AND payment_status = 'completed';
    SELECT total_amount INTO v_invoice_total FROM invoices WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
    IF v_total_paid = 0 THEN v_new_status := 'sent';
    ELSIF v_total_paid >= v_invoice_total THEN v_new_status := 'paid';
    ELSE v_new_status := 'partial_paid';
    END IF;
    UPDATE invoices SET invoice_status = v_new_status,
        paid_date = CASE WHEN v_new_status = 'paid' THEN CURRENT_DATE ELSE NULL END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id) AND invoice_status != v_new_status;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SECTION 8: Financial Management (8 tables + 3 functions)
-- Winner: 011 versions (have law_firm_id, contacts FK)
-- =====================================================

-- 8.1 VENDORS
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    vendor_type VARCHAR(50) NOT NULL CHECK (vendor_type IN ('supplier', 'contractor', 'service_provider', 'utility', 'government', 'other')),
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    cnpj VARCHAR(20),
    cpf VARCHAR(14),
    email VARCHAR(255),
    phone VARCHAR(20),
    website VARCHAR(255),
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_complement VARCHAR(100),
    address_neighborhood VARCHAR(100),
    address_city VARCHAR(100),
    address_state VARCHAR(2),
    address_postal_code VARCHAR(10),
    bank_name VARCHAR(100),
    bank_branch VARCHAR(20),
    bank_account VARCHAR(50),
    bank_account_type VARCHAR(20) CHECK (bank_account_type IN ('checking', 'savings')),
    pix_key VARCHAR(255),
    payment_terms INTEGER DEFAULT 30,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    is_recurring BOOLEAN DEFAULT FALSE,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    CONSTRAINT unique_vendor_per_firm UNIQUE (law_firm_id, cnpj),
    CONSTRAINT unique_vendor_cpf_per_firm UNIQUE (law_firm_id, cpf)
);

-- 8.2 EXPENSE CATEGORIES
CREATE TABLE IF NOT EXISTS expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES expense_categories(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_type VARCHAR(50) NOT NULL CHECK (category_type IN ('operational', 'administrative', 'legal', 'marketing', 'technology', 'other')),
    is_billable_default BOOLEAN DEFAULT FALSE,
    tax_deductible BOOLEAN DEFAULT TRUE,
    budget_monthly DECIMAL(12,2),
    budget_yearly DECIMAL(12,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_category_code_per_firm UNIQUE (law_firm_id, code)
);

-- 8.3 BILLS
CREATE TABLE IF NOT EXISTS bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    expense_category_id UUID NOT NULL REFERENCES expense_categories(id),
    matter_id UUID REFERENCES matters(id),
    bill_number VARCHAR(100) NOT NULL,
    bill_date DATE NOT NULL,
    due_date DATE NOT NULL,
    payment_terms INTEGER,
    subtotal DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    currency_code VARCHAR(3) DEFAULT 'BRL',
    amount_paid DECIMAL(12,2) DEFAULT 0,
    balance_due DECIMAL(12,2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue', 'cancelled')),
    bill_type VARCHAR(20) NOT NULL CHECK (bill_type IN ('one_time', 'recurring', 'installment')),
    recurrence_frequency VARCHAR(20) CHECK (recurrence_frequency IN ('monthly', 'quarterly', 'semi_annual', 'annual')),
    installment_number INTEGER,
    installment_total INTEGER,
    parent_bill_id UUID REFERENCES bills(id),
    approval_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'under_review')),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    approval_notes TEXT,
    document_url VARCHAR(500),
    document_storage_path VARCHAR(500),
    description TEXT,
    notes TEXT,
    is_billable_to_client BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- 8.4 BILL PAYMENTS (with law_firm_id)
CREATE TABLE IF NOT EXISTS bill_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    bill_id UUID NOT NULL REFERENCES bills(id),
    payment_date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('bank_transfer', 'pix', 'credit_card', 'debit_card', 'check', 'cash', 'other')),
    transaction_reference VARCHAR(255),
    bank_account_used VARCHAR(100),
    proof_document_url VARCHAR(500),
    proof_uploaded BOOLEAN DEFAULT FALSE,
    processed_by UUID REFERENCES users(id),
    processing_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- 8.5 PAYMENT PLANS (winner: 011, has law_firm_id)
CREATE TABLE IF NOT EXISTS payment_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    matter_id UUID REFERENCES matters(id) ON DELETE SET NULL,
    client_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    plan_name VARCHAR(255) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    installment_count INTEGER NOT NULL,
    installment_amount DECIMAL(15,2) NOT NULL,
    down_payment DECIMAL(15,2) DEFAULT 0,
    payment_frequency VARCHAR(50) DEFAULT 'monthly',
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'draft',
    auto_charge BOOLEAN DEFAULT false,
    late_fee_percentage DECIMAL(5,2) DEFAULT 2.0,
    grace_period_days INTEGER DEFAULT 5,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8.6 PAYMENT INSTALLMENTS (winner: 011, has law_firm_id)
CREATE TABLE IF NOT EXISTS payment_installments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    payment_plan_id UUID NOT NULL REFERENCES payment_plans(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    due_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    paid_date TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'pending',
    late_fee_applied DECIMAL(15,2) DEFAULT 0,
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8.7 PAYMENT COLLECTIONS (FIX: contacts not clients, has law_firm_id)
CREATE TABLE IF NOT EXISTS payment_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    client_id UUID NOT NULL REFERENCES contacts(id),
    collection_status VARCHAR(50) NOT NULL DEFAULT 'current' CHECK (collection_status IN ('current', 'overdue_30', 'overdue_60', 'overdue_90', 'in_collection', 'written_off', 'disputed')),
    days_overdue INTEGER DEFAULT 0,
    last_reminder_sent DATE,
    reminder_count INTEGER DEFAULT 0,
    collection_agent_id UUID REFERENCES users(id),
    collection_notes TEXT,
    promise_to_pay_date DATE,
    promise_to_pay_amount DECIMAL(12,2),
    promise_to_pay_notes TEXT,
    is_disputed BOOLEAN DEFAULT FALSE,
    dispute_reason TEXT,
    dispute_date DATE,
    dispute_resolved_date DATE,
    written_off_date DATE,
    written_off_amount DECIMAL(12,2),
    written_off_reason TEXT,
    written_off_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8.8 PAYMENT REMINDERS (FIX: contacts not clients, has law_firm_id)
CREATE TABLE IF NOT EXISTS payment_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    client_id UUID NOT NULL REFERENCES contacts(id),
    reminder_type VARCHAR(50) NOT NULL CHECK (reminder_type IN ('friendly', 'first_overdue', 'second_overdue', 'final_notice', 'collection_notice')),
    scheduled_date DATE NOT NULL,
    sent_date TIMESTAMP WITH TIME ZONE,
    send_method VARCHAR(50) NOT NULL CHECK (send_method IN ('email', 'whatsapp', 'sms', 'letter', 'phone')),
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(50),
    subject VARCHAR(500),
    message_body TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'failed', 'cancelled')),
    failure_reason TEXT,
    client_responded BOOLEAN DEFAULT FALSE,
    response_date TIMESTAMP WITH TIME ZONE,
    response_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    sent_by UUID REFERENCES users(id)
);

-- 8.9 FINANCIAL DOCUMENTS
CREATE TABLE IF NOT EXISTS financial_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('bill', 'invoice', 'receipt', 'payment_proof', 'contract', 'report')),
    related_entity_type VARCHAR(50) NOT NULL CHECK (related_entity_type IN ('bill', 'invoice', 'payment', 'vendor', 'client')),
    related_entity_id UUID NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER,
    file_type VARCHAR(50),
    storage_path VARCHAR(500),
    external_url VARCHAR(500),
    document_date DATE,
    description TEXT,
    tags TEXT[],
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    uploaded_by UUID REFERENCES users(id)
);

-- 8.10 FINANCIAL ALERTS
CREATE TABLE IF NOT EXISTS financial_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('payment_due', 'payment_overdue', 'low_cash_balance', 'budget_exceeded', 'collection_needed', 'document_missing')),
    entity_type VARCHAR(50) CHECK (entity_type IN ('bill', 'invoice', 'expense_category', 'vendor', 'client')),
    entity_id UUID,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    trigger_date DATE NOT NULL,
    days_before_due INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    is_acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by UUID REFERENCES users(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    action_required VARCHAR(255),
    action_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Financial functions
CREATE OR REPLACE FUNCTION update_bill_payment_status()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE bills SET
        payment_status = CASE
            WHEN (SELECT SUM(amount) FROM bill_payments WHERE bill_id = NEW.bill_id) >= total_amount THEN 'paid'
            WHEN (SELECT SUM(amount) FROM bill_payments WHERE bill_id = NEW.bill_id) > 0 THEN 'partial'
            ELSE 'pending'
        END,
        amount_paid = (SELECT COALESCE(SUM(amount), 0) FROM bill_payments WHERE bill_id = NEW.bill_id)
    WHERE id = NEW.bill_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_overdue_bills()
RETURNS void AS $$
BEGIN
    UPDATE bills SET payment_status = 'overdue'
    WHERE payment_status IN ('pending', 'partial') AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_collection_days_overdue()
RETURNS void AS $$
BEGIN
    UPDATE payment_collections pc SET
        days_overdue = GREATEST(0, CURRENT_DATE - i.due_date),
        collection_status = CASE
            WHEN CURRENT_DATE - i.due_date <= 0 THEN 'current'
            WHEN CURRENT_DATE - i.due_date <= 30 THEN 'overdue_30'
            WHEN CURRENT_DATE - i.due_date <= 60 THEN 'overdue_60'
            WHEN CURRENT_DATE - i.due_date <= 90 THEN 'overdue_90'
            ELSE 'in_collection'
        END
    FROM invoices i WHERE pc.invoice_id = i.id AND i.invoice_status != 'paid';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SECTION 9: Content Hub (3 tables from 012)
-- =====================================================

-- 9.1 ARTICLES
CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    law_firm_id UUID REFERENCES law_firms(id),
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    excerpt TEXT,
    content TEXT,
    category TEXT NOT NULL CHECK (category IN ('alerta', 'guia', 'artigo')),
    topic TEXT CHECK (topic IN ('trabalhista', 'empresarial', 'cobranca')),
    published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    author_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(law_firm_id, slug)
);

-- 9.2 CONTACT SUBMISSIONS
CREATE TABLE IF NOT EXISTS contact_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject TEXT NOT NULL,
    urgency TEXT,
    city TEXT,
    role TEXT,
    company_name TEXT,
    cnpj TEXT,
    employee_count TEXT,
    segment TEXT,
    details JSONB,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    preferred_channel TEXT,
    preferred_time TEXT,
    marketing_consent BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9.3 NEWSLETTER SUBSCRIBERS
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    unsubscribed_at TIMESTAMPTZ
);

-- =====================================================
-- SECTION 10: RLS Policies
-- All use public.* helper functions (Supabase-safe)
-- FIX: auth_user_id = auth.uid() (not id = auth.uid())
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE law_firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE matter_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE matters ENABLE ROW LEVEL SECURITY;
ALTER TABLE matter_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_billing_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE applied_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE datajud_case_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE datajud_legal_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE datajud_case_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE datajud_timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE datajud_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entry_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_billing_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_time_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entry_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_time_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_time_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_plan_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_based_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_generation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- ----- STAFF POLICIES (law firm isolation) -----

-- Core tables
DROP POLICY IF EXISTS "law_firms_isolation" ON law_firms;
CREATE POLICY "law_firms_isolation" ON law_firms FOR ALL USING (id = public.current_user_law_firm_id());

DROP POLICY IF EXISTS "law_firms_admin_modify" ON law_firms;
CREATE POLICY "law_firms_admin_modify" ON law_firms FOR UPDATE USING (
  id = public.current_user_law_firm_id() AND public.current_user_is_admin()
);

DROP POLICY IF EXISTS "users_law_firm_access" ON users;
CREATE POLICY "users_law_firm_access" ON users FOR SELECT USING (law_firm_id = public.current_user_law_firm_id());

DROP POLICY IF EXISTS "users_self_update" ON users;
CREATE POLICY "users_self_update" ON users FOR UPDATE USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "users_admin_manage" ON users;
CREATE POLICY "users_admin_manage" ON users FOR ALL USING (
  law_firm_id = public.current_user_law_firm_id() AND public.current_user_is_admin()
);

DROP POLICY IF EXISTS "users_staff_create" ON users;
CREATE POLICY "users_staff_create" ON users FOR INSERT WITH CHECK (
  law_firm_id = public.current_user_law_firm_id() AND public.current_user_is_staff()
);

DROP POLICY IF EXISTS "matter_types_law_firm_access" ON matter_types;
CREATE POLICY "matter_types_law_firm_access" ON matter_types FOR ALL USING (law_firm_id = public.current_user_law_firm_id());

DROP POLICY IF EXISTS "contacts_staff_access" ON contacts;
CREATE POLICY "contacts_staff_access" ON contacts FOR ALL USING (
  law_firm_id = public.current_user_law_firm_id() AND public.current_user_is_staff()
);

DROP POLICY IF EXISTS "matters_staff_access" ON matters;
CREATE POLICY "matters_staff_access" ON matters FOR ALL USING (
  law_firm_id = public.current_user_law_firm_id() AND public.current_user_is_staff()
);

DROP POLICY IF EXISTS "matter_contacts_staff_access" ON matter_contacts;
CREATE POLICY "matter_contacts_staff_access" ON matter_contacts FOR ALL USING (
  law_firm_id = public.current_user_law_firm_id() AND public.current_user_is_staff()
);

DROP POLICY IF EXISTS "tasks_staff_access" ON tasks;
CREATE POLICY "tasks_staff_access" ON tasks FOR ALL USING (
  law_firm_id = public.current_user_law_firm_id() AND public.current_user_is_staff()
);

DROP POLICY IF EXISTS "time_entries_staff_access" ON time_entries;
CREATE POLICY "time_entries_staff_access" ON time_entries FOR ALL USING (
  law_firm_id = public.current_user_law_firm_id() AND public.current_user_is_staff()
);

DROP POLICY IF EXISTS "documents_staff_access" ON documents;
CREATE POLICY "documents_staff_access" ON documents FOR ALL USING (
  law_firm_id = public.current_user_law_firm_id() AND public.current_user_is_staff()
);

DROP POLICY IF EXISTS "invoices_staff_access" ON invoices;
CREATE POLICY "invoices_staff_access" ON invoices FOR ALL USING (
  law_firm_id = public.current_user_law_firm_id() AND public.current_user_is_staff()
);

DROP POLICY IF EXISTS "invoice_line_items_staff_access" ON invoice_line_items;
CREATE POLICY "invoice_line_items_staff_access" ON invoice_line_items FOR ALL USING (
  law_firm_id = public.current_user_law_firm_id() AND public.current_user_is_staff()
);

DROP POLICY IF EXISTS "messages_staff_access" ON messages;
CREATE POLICY "messages_staff_access" ON messages FOR ALL USING (
  law_firm_id = public.current_user_law_firm_id() AND public.current_user_is_staff()
);

DROP POLICY IF EXISTS "pipeline_stages_staff_access" ON pipeline_stages;
CREATE POLICY "pipeline_stages_staff_access" ON pipeline_stages FOR ALL USING (
  law_firm_id = public.current_user_law_firm_id() AND public.current_user_is_staff()
);

DROP POLICY IF EXISTS "pipeline_cards_staff_access" ON pipeline_cards;
CREATE POLICY "pipeline_cards_staff_access" ON pipeline_cards FOR ALL USING (
  law_firm_id = public.current_user_law_firm_id() AND public.current_user_is_staff()
);

DROP POLICY IF EXISTS "activity_logs_staff_read" ON activity_logs;
CREATE POLICY "activity_logs_staff_read" ON activity_logs FOR SELECT USING (
  law_firm_id = public.current_user_law_firm_id() AND public.current_user_is_staff()
);

DROP POLICY IF EXISTS "activity_logs_system_insert" ON activity_logs;
CREATE POLICY "activity_logs_system_insert" ON activity_logs FOR INSERT WITH CHECK (
  law_firm_id = public.current_user_law_firm_id()
);

-- Billing tables
DROP POLICY IF EXISTS "discount_rules_staff_access" ON discount_rules;
CREATE POLICY "discount_rules_staff_access" ON discount_rules FOR ALL USING (law_firm_id = public.current_user_law_firm_id());

DROP POLICY IF EXISTS "case_types_staff_access" ON case_types;
CREATE POLICY "case_types_staff_access" ON case_types FOR ALL USING (law_firm_id = public.current_user_law_firm_id());

DROP POLICY IF EXISTS "business_parameters_staff_access" ON business_parameters;
CREATE POLICY "business_parameters_staff_access" ON business_parameters FOR ALL USING (law_firm_id = public.current_user_law_firm_id());

DROP POLICY IF EXISTS "case_billing_methods_staff_access" ON case_billing_methods;
CREATE POLICY "case_billing_methods_staff_access" ON case_billing_methods FOR ALL USING (
  matter_id IN (SELECT id FROM matters WHERE law_firm_id = public.current_user_law_firm_id())
);

DROP POLICY IF EXISTS "case_outcomes_staff_access" ON case_outcomes;
CREATE POLICY "case_outcomes_staff_access" ON case_outcomes FOR ALL USING (
  matter_id IN (SELECT id FROM matters WHERE law_firm_id = public.current_user_law_firm_id())
);

DROP POLICY IF EXISTS "subscription_plans_staff_access" ON subscription_plans;
CREATE POLICY "subscription_plans_staff_access" ON subscription_plans FOR ALL USING (
  law_firm_id = public.current_user_law_firm_id() AND public.current_user_is_staff()
);

DROP POLICY IF EXISTS "client_subscriptions_staff_access" ON client_subscriptions;
CREATE POLICY "client_subscriptions_staff_access" ON client_subscriptions FOR ALL USING (
  law_firm_id = public.current_user_law_firm_id() AND public.current_user_is_staff()
);

DROP POLICY IF EXISTS "applied_discounts_staff_access" ON applied_discounts;
CREATE POLICY "applied_discounts_staff_access" ON applied_discounts FOR ALL USING (law_firm_id = public.current_user_law_firm_id());

-- DataJud tables
DROP POLICY IF EXISTS "datajud_case_details_access" ON datajud_case_details;
CREATE POLICY "datajud_case_details_access" ON datajud_case_details FOR ALL USING (
  law_firm_id IN (SELECT law_firm_id FROM users WHERE auth_user_id = auth.uid()) OR public.is_super_admin()
);

DROP POLICY IF EXISTS "datajud_legal_subjects_access" ON datajud_legal_subjects;
CREATE POLICY "datajud_legal_subjects_access" ON datajud_legal_subjects FOR ALL USING (
  law_firm_id IN (SELECT law_firm_id FROM users WHERE auth_user_id = auth.uid()) OR public.is_super_admin()
);

DROP POLICY IF EXISTS "datajud_case_participants_access" ON datajud_case_participants;
CREATE POLICY "datajud_case_participants_access" ON datajud_case_participants FOR ALL USING (
  law_firm_id IN (SELECT law_firm_id FROM users WHERE auth_user_id = auth.uid()) OR public.is_super_admin()
);

DROP POLICY IF EXISTS "datajud_timeline_events_access" ON datajud_timeline_events;
CREATE POLICY "datajud_timeline_events_access" ON datajud_timeline_events FOR ALL USING (
  law_firm_id IN (SELECT law_firm_id FROM users WHERE auth_user_id = auth.uid()) OR public.is_super_admin()
);

DROP POLICY IF EXISTS "datajud_sync_log_access" ON datajud_sync_log;
CREATE POLICY "datajud_sync_log_access" ON datajud_sync_log FOR ALL USING (
  law_firm_id IN (SELECT law_firm_id FROM users WHERE auth_user_id = auth.uid()) OR public.is_super_admin()
);

-- Time tracking tables
DROP POLICY IF EXISTS "time_entry_templates_staff_access" ON time_entry_templates;
CREATE POLICY "time_entry_templates_staff_access" ON time_entry_templates FOR ALL USING (law_firm_id = public.current_user_law_firm_id());

DROP POLICY IF EXISTS "lawyer_billing_rates_staff_access" ON lawyer_billing_rates;
CREATE POLICY "lawyer_billing_rates_staff_access" ON lawyer_billing_rates FOR ALL USING (law_firm_id = public.current_user_law_firm_id());

DROP POLICY IF EXISTS "subscription_time_allocations_staff_access" ON subscription_time_allocations;
CREATE POLICY "subscription_time_allocations_staff_access" ON subscription_time_allocations FOR ALL USING (law_firm_id = public.current_user_law_firm_id());

DROP POLICY IF EXISTS "time_entry_allocations_staff_access" ON time_entry_allocations;
CREATE POLICY "time_entry_allocations_staff_access" ON time_entry_allocations FOR ALL USING (
  time_entry_id IN (SELECT id FROM time_entries WHERE law_firm_id = public.current_user_law_firm_id())
);

DROP POLICY IF EXISTS "daily_time_summaries_staff_access" ON daily_time_summaries;
CREATE POLICY "daily_time_summaries_staff_access" ON daily_time_summaries FOR ALL USING (law_firm_id = public.current_user_law_firm_id());

DROP POLICY IF EXISTS "active_time_sessions_staff_access" ON active_time_sessions;
CREATE POLICY "active_time_sessions_staff_access" ON active_time_sessions FOR ALL USING (law_firm_id = public.current_user_law_firm_id());

-- Invoice sub-tables
DROP POLICY IF EXISTS "subscription_invoices_staff_access" ON subscription_invoices;
CREATE POLICY "subscription_invoices_staff_access" ON subscription_invoices FOR ALL USING (law_firm_id = public.current_user_law_firm_id());

DROP POLICY IF EXISTS "case_invoices_staff_access" ON case_invoices;
CREATE POLICY "case_invoices_staff_access" ON case_invoices FOR ALL USING (law_firm_id = public.current_user_law_firm_id());

DROP POLICY IF EXISTS "payment_plan_invoices_staff_access" ON payment_plan_invoices;
CREATE POLICY "payment_plan_invoices_staff_access" ON payment_plan_invoices FOR ALL USING (law_firm_id = public.current_user_law_firm_id());

DROP POLICY IF EXISTS "time_based_invoices_staff_access" ON time_based_invoices;
CREATE POLICY "time_based_invoices_staff_access" ON time_based_invoices FOR ALL USING (law_firm_id = public.current_user_law_firm_id());

DROP POLICY IF EXISTS "invoice_payments_staff_access" ON invoice_payments;
CREATE POLICY "invoice_payments_staff_access" ON invoice_payments FOR ALL USING (law_firm_id = public.current_user_law_firm_id());

DROP POLICY IF EXISTS "invoice_templates_staff_access" ON invoice_templates;
CREATE POLICY "invoice_templates_staff_access" ON invoice_templates FOR ALL USING (law_firm_id = public.current_user_law_firm_id());

DROP POLICY IF EXISTS "invoice_generation_logs_staff_access" ON invoice_generation_logs;
CREATE POLICY "invoice_generation_logs_staff_access" ON invoice_generation_logs FOR ALL USING (law_firm_id = public.current_user_law_firm_id());

-- Financial tables
DROP POLICY IF EXISTS "vendors_staff_access" ON vendors;
CREATE POLICY "vendors_staff_access" ON vendors FOR ALL USING (law_firm_id = public.current_user_law_firm_id());

DROP POLICY IF EXISTS "expense_categories_staff_access" ON expense_categories;
CREATE POLICY "expense_categories_staff_access" ON expense_categories FOR ALL USING (law_firm_id = public.current_user_law_firm_id());

DROP POLICY IF EXISTS "bills_staff_access" ON bills;
CREATE POLICY "bills_staff_access" ON bills FOR ALL USING (law_firm_id = public.current_user_law_firm_id());

DROP POLICY IF EXISTS "bill_payments_staff_access" ON bill_payments;
CREATE POLICY "bill_payments_staff_access" ON bill_payments FOR ALL USING (law_firm_id = public.current_user_law_firm_id());

DROP POLICY IF EXISTS "payment_plans_staff_access" ON payment_plans;
CREATE POLICY "payment_plans_staff_access" ON payment_plans FOR ALL USING (law_firm_id = public.current_user_law_firm_id());

DROP POLICY IF EXISTS "payment_installments_staff_access" ON payment_installments;
CREATE POLICY "payment_installments_staff_access" ON payment_installments FOR ALL USING (law_firm_id = public.current_user_law_firm_id());

DROP POLICY IF EXISTS "payment_collections_staff_access" ON payment_collections;
CREATE POLICY "payment_collections_staff_access" ON payment_collections FOR ALL USING (law_firm_id = public.current_user_law_firm_id());

DROP POLICY IF EXISTS "payment_reminders_staff_access" ON payment_reminders;
CREATE POLICY "payment_reminders_staff_access" ON payment_reminders FOR ALL USING (law_firm_id = public.current_user_law_firm_id());

DROP POLICY IF EXISTS "financial_documents_staff_access" ON financial_documents;
CREATE POLICY "financial_documents_staff_access" ON financial_documents FOR ALL USING (law_firm_id = public.current_user_law_firm_id());

DROP POLICY IF EXISTS "financial_alerts_staff_access" ON financial_alerts;
CREATE POLICY "financial_alerts_staff_access" ON financial_alerts FOR ALL USING (law_firm_id = public.current_user_law_firm_id());

-- Content hub
DROP POLICY IF EXISTS "articles_public_read" ON articles;
CREATE POLICY "articles_public_read" ON articles FOR SELECT USING (published = true);

DROP POLICY IF EXISTS "articles_staff_manage" ON articles;
CREATE POLICY "articles_staff_manage" ON articles FOR ALL USING (
  law_firm_id = public.current_user_law_firm_id() AND public.current_user_is_staff()
);

DROP POLICY IF EXISTS "contact_submissions_public_insert" ON contact_submissions;
CREATE POLICY "contact_submissions_public_insert" ON contact_submissions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "contact_submissions_staff_read" ON contact_submissions;
CREATE POLICY "contact_submissions_staff_read" ON contact_submissions FOR SELECT USING (public.current_user_is_staff());

DROP POLICY IF EXISTS "newsletter_public_insert" ON newsletter_subscribers;
CREATE POLICY "newsletter_public_insert" ON newsletter_subscribers FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "newsletter_staff_read" ON newsletter_subscribers;
CREATE POLICY "newsletter_staff_read" ON newsletter_subscribers FOR SELECT USING (public.current_user_is_staff());

-- ----- CLIENT POLICIES -----

DROP POLICY IF EXISTS "contacts_client_self_access" ON contacts;
CREATE POLICY "contacts_client_self_access" ON contacts FOR SELECT USING (user_id = public.current_user_id());

DROP POLICY IF EXISTS "contacts_client_self_update" ON contacts;
CREATE POLICY "contacts_client_self_update" ON contacts FOR UPDATE USING (user_id = public.current_user_id());

DROP POLICY IF EXISTS "matters_client_access" ON matters;
CREATE POLICY "matters_client_access" ON matters FOR SELECT USING (
  id IN (SELECT mc.matter_id FROM matter_contacts mc JOIN contacts c ON mc.contact_id = c.id WHERE c.user_id = public.current_user_id())
);

DROP POLICY IF EXISTS "matter_contacts_client_access" ON matter_contacts;
CREATE POLICY "matter_contacts_client_access" ON matter_contacts FOR SELECT USING (
  contact_id IN (SELECT id FROM contacts WHERE user_id = public.current_user_id())
);

DROP POLICY IF EXISTS "tasks_assigned_access" ON tasks;
CREATE POLICY "tasks_assigned_access" ON tasks FOR SELECT USING (assigned_to = public.current_user_id());

DROP POLICY IF EXISTS "time_entries_user_own" ON time_entries;
CREATE POLICY "time_entries_user_own" ON time_entries FOR ALL USING (user_id = public.current_user_id());

DROP POLICY IF EXISTS "documents_client_matter_access" ON documents;
CREATE POLICY "documents_client_matter_access" ON documents FOR SELECT USING (
  matter_id IN (SELECT mc.matter_id FROM matter_contacts mc JOIN contacts c ON mc.contact_id = c.id WHERE c.user_id = public.current_user_id())
  AND access_level IN ('public', 'internal')
);

DROP POLICY IF EXISTS "documents_client_own_access" ON documents;
CREATE POLICY "documents_client_own_access" ON documents FOR SELECT USING (
  contact_id IN (SELECT id FROM contacts WHERE user_id = public.current_user_id())
);

DROP POLICY IF EXISTS "invoices_client_view" ON invoices;
CREATE POLICY "invoices_client_view" ON invoices FOR SELECT USING (
  client_id IN (SELECT id FROM contacts WHERE user_id = public.current_user_id())
);

DROP POLICY IF EXISTS "invoice_line_items_client_view" ON invoice_line_items;
CREATE POLICY "invoice_line_items_client_view" ON invoice_line_items FOR SELECT USING (
  invoice_id IN (SELECT id FROM invoices WHERE client_id IN (SELECT id FROM contacts WHERE user_id = public.current_user_id()))
);

DROP POLICY IF EXISTS "messages_participant_access" ON messages;
CREATE POLICY "messages_participant_access" ON messages FOR SELECT USING (
  sender_id = public.current_user_id() OR receiver_id = public.current_user_id()
  OR contact_id IN (SELECT id FROM contacts WHERE user_id = public.current_user_id())
);

DROP POLICY IF EXISTS "messages_user_send" ON messages;
CREATE POLICY "messages_user_send" ON messages FOR INSERT WITH CHECK (
  sender_id = public.current_user_id() OR
  (sender_type = 'contact' AND contact_id IN (SELECT id FROM contacts WHERE user_id = public.current_user_id()))
);

DROP POLICY IF EXISTS "client_subscriptions_client_own" ON client_subscriptions;
CREATE POLICY "client_subscriptions_client_own" ON client_subscriptions FOR SELECT USING (
  client_id IN (SELECT id FROM contacts WHERE user_id = public.current_user_id())
);

DROP POLICY IF EXISTS "applied_discounts_client_view" ON applied_discounts;
CREATE POLICY "applied_discounts_client_view" ON applied_discounts FOR SELECT USING (
  client_id IN (SELECT id FROM contacts WHERE user_id = public.current_user_id())
);

-- ----- SUPER ADMIN BYPASS POLICIES -----

DROP POLICY IF EXISTS "super_admin_all_law_firms" ON law_firms;
CREATE POLICY "super_admin_all_law_firms" ON law_firms FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "super_admin_all_users" ON users;
CREATE POLICY "super_admin_all_users" ON users FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "super_admin_all_matter_types" ON matter_types;
CREATE POLICY "super_admin_all_matter_types" ON matter_types FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "super_admin_all_contacts" ON contacts;
CREATE POLICY "super_admin_all_contacts" ON contacts FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "super_admin_all_matters" ON matters;
CREATE POLICY "super_admin_all_matters" ON matters FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "super_admin_all_matter_contacts" ON matter_contacts;
CREATE POLICY "super_admin_all_matter_contacts" ON matter_contacts FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "super_admin_all_tasks" ON tasks;
CREATE POLICY "super_admin_all_tasks" ON tasks FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "super_admin_all_time_entries" ON time_entries;
CREATE POLICY "super_admin_all_time_entries" ON time_entries FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "super_admin_all_documents" ON documents;
CREATE POLICY "super_admin_all_documents" ON documents FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "super_admin_all_invoices" ON invoices;
CREATE POLICY "super_admin_all_invoices" ON invoices FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "super_admin_all_invoice_line_items" ON invoice_line_items;
CREATE POLICY "super_admin_all_invoice_line_items" ON invoice_line_items FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "super_admin_all_messages" ON messages;
CREATE POLICY "super_admin_all_messages" ON messages FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "super_admin_all_pipeline_stages" ON pipeline_stages;
CREATE POLICY "super_admin_all_pipeline_stages" ON pipeline_stages FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "super_admin_all_pipeline_cards" ON pipeline_cards;
CREATE POLICY "super_admin_all_pipeline_cards" ON pipeline_cards FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "super_admin_all_activity_logs" ON activity_logs;
CREATE POLICY "super_admin_all_activity_logs" ON activity_logs FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "super_admin_all_discount_rules" ON discount_rules;
CREATE POLICY "super_admin_all_discount_rules" ON discount_rules FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "super_admin_all_case_types" ON case_types;
CREATE POLICY "super_admin_all_case_types" ON case_types FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "super_admin_all_business_parameters" ON business_parameters;
CREATE POLICY "super_admin_all_business_parameters" ON business_parameters FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "super_admin_all_case_billing_methods" ON case_billing_methods;
CREATE POLICY "super_admin_all_case_billing_methods" ON case_billing_methods FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "super_admin_all_case_outcomes" ON case_outcomes;
CREATE POLICY "super_admin_all_case_outcomes" ON case_outcomes FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "super_admin_all_subscription_plans" ON subscription_plans;
CREATE POLICY "super_admin_all_subscription_plans" ON subscription_plans FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "super_admin_all_client_subscriptions" ON client_subscriptions;
CREATE POLICY "super_admin_all_client_subscriptions" ON client_subscriptions FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "super_admin_all_time_entry_templates" ON time_entry_templates;
CREATE POLICY "super_admin_all_time_entry_templates" ON time_entry_templates FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "super_admin_all_lawyer_billing_rates" ON lawyer_billing_rates;
CREATE POLICY "super_admin_all_lawyer_billing_rates" ON lawyer_billing_rates FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "super_admin_all_subscription_time_allocations" ON subscription_time_allocations;
CREATE POLICY "super_admin_all_subscription_time_allocations" ON subscription_time_allocations FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "super_admin_all_time_entry_allocations" ON time_entry_allocations;
CREATE POLICY "super_admin_all_time_entry_allocations" ON time_entry_allocations FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "super_admin_all_daily_time_summaries" ON daily_time_summaries;
CREATE POLICY "super_admin_all_daily_time_summaries" ON daily_time_summaries FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "super_admin_all_active_time_sessions" ON active_time_sessions;
CREATE POLICY "super_admin_all_active_time_sessions" ON active_time_sessions FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "super_admin_all_subscription_invoices" ON subscription_invoices;
CREATE POLICY "super_admin_all_subscription_invoices" ON subscription_invoices FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "super_admin_all_case_invoices" ON case_invoices;
CREATE POLICY "super_admin_all_case_invoices" ON case_invoices FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "super_admin_all_payment_plan_invoices" ON payment_plan_invoices;
CREATE POLICY "super_admin_all_payment_plan_invoices" ON payment_plan_invoices FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "super_admin_all_time_based_invoices" ON time_based_invoices;
CREATE POLICY "super_admin_all_time_based_invoices" ON time_based_invoices FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "super_admin_all_invoice_payments" ON invoice_payments;
CREATE POLICY "super_admin_all_invoice_payments" ON invoice_payments FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "super_admin_all_invoice_templates" ON invoice_templates;
CREATE POLICY "super_admin_all_invoice_templates" ON invoice_templates FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "super_admin_all_invoice_generation_logs" ON invoice_generation_logs;
CREATE POLICY "super_admin_all_invoice_generation_logs" ON invoice_generation_logs FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "super_admin_all_vendors" ON vendors;
CREATE POLICY "super_admin_all_vendors" ON vendors FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "super_admin_all_expense_categories" ON expense_categories;
CREATE POLICY "super_admin_all_expense_categories" ON expense_categories FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "super_admin_all_bills" ON bills;
CREATE POLICY "super_admin_all_bills" ON bills FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "super_admin_all_bill_payments" ON bill_payments;
CREATE POLICY "super_admin_all_bill_payments" ON bill_payments FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "super_admin_all_payment_plans" ON payment_plans;
CREATE POLICY "super_admin_all_payment_plans" ON payment_plans FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "super_admin_all_payment_installments" ON payment_installments;
CREATE POLICY "super_admin_all_payment_installments" ON payment_installments FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "super_admin_all_payment_collections" ON payment_collections;
CREATE POLICY "super_admin_all_payment_collections" ON payment_collections FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "super_admin_all_payment_reminders" ON payment_reminders;
CREATE POLICY "super_admin_all_payment_reminders" ON payment_reminders FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "super_admin_all_financial_documents" ON financial_documents;
CREATE POLICY "super_admin_all_financial_documents" ON financial_documents FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "super_admin_all_financial_alerts" ON financial_alerts;
CREATE POLICY "super_admin_all_financial_alerts" ON financial_alerts FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "super_admin_all_articles" ON articles;
CREATE POLICY "super_admin_all_articles" ON articles FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "super_admin_all_contact_submissions" ON contact_submissions;
CREATE POLICY "super_admin_all_contact_submissions" ON contact_submissions FOR ALL USING (public.is_super_admin());
DROP POLICY IF EXISTS "super_admin_all_newsletter" ON newsletter_subscribers;
CREATE POLICY "super_admin_all_newsletter" ON newsletter_subscribers FOR ALL USING (public.is_super_admin());

-- ----- SERVICE ROLE BYPASS (for seed scripts) -----
CREATE POLICY "service_role_all_payment_plans" ON payment_plans FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all_payment_installments" ON payment_installments FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all_expense_categories" ON expense_categories FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all_bill_payments" ON bill_payments FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all_payment_collections" ON payment_collections FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all_payment_reminders" ON payment_reminders FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all_financial_alerts" ON financial_alerts FOR ALL TO service_role USING (true);

-- =====================================================
-- SECTION 11: Indexes, Triggers, Views
-- =====================================================

-- ----- INDEXES -----

-- Core tables
CREATE INDEX IF NOT EXISTS idx_law_firms_cnpj ON law_firms(cnpj);
CREATE INDEX IF NOT EXISTS idx_law_firms_email ON law_firms(email);
CREATE INDEX IF NOT EXISTS idx_law_firms_plan_type ON law_firms(plan_type);
CREATE INDEX IF NOT EXISTS idx_law_firms_active ON law_firms(subscription_active);
CREATE INDEX IF NOT EXISTS idx_users_law_firm_id ON users(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_full_name ON users(full_name);
CREATE INDEX IF NOT EXISTS idx_matter_types_law_firm_id ON matter_types(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_contacts_law_firm_id ON contacts(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_cpf ON contacts(cpf);
CREATE INDEX IF NOT EXISTS idx_contacts_cnpj ON contacts(cnpj);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(client_status);
CREATE INDEX IF NOT EXISTS idx_contacts_full_name ON contacts(full_name);
CREATE INDEX IF NOT EXISTS idx_matters_law_firm_id ON matters(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_matters_matter_type_id ON matters(matter_type_id);
CREATE INDEX IF NOT EXISTS idx_matters_number ON matters(matter_number);
CREATE INDEX IF NOT EXISTS idx_matters_status ON matters(status);
CREATE INDEX IF NOT EXISTS idx_matters_priority ON matters(priority);
CREATE INDEX IF NOT EXISTS idx_matters_responsible_lawyer ON matters(responsible_lawyer_id);
CREATE INDEX IF NOT EXISTS idx_matters_opened_date ON matters(opened_date);
CREATE INDEX IF NOT EXISTS idx_matter_contacts_matter_id ON matter_contacts(matter_id);
CREATE INDEX IF NOT EXISTS idx_matter_contacts_contact_id ON matter_contacts(contact_id);
CREATE INDEX IF NOT EXISTS idx_matter_contacts_law_firm_id ON matter_contacts(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_tasks_law_firm_id ON tasks(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_tasks_matter_id ON tasks(matter_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_documents_law_firm_id ON documents(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_documents_matter_id ON documents(matter_id);
CREATE INDEX IF NOT EXISTS idx_documents_contact_id ON documents(contact_id);
CREATE INDEX IF NOT EXISTS idx_messages_law_firm_id ON messages(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_messages_matter_id ON messages(matter_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_law_firm_id ON pipeline_stages(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_cards_law_firm_id ON pipeline_cards(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_cards_stage_id ON pipeline_cards(pipeline_stage_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_cards_contact_id ON pipeline_cards(contact_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_law_firm_id ON activity_logs(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);

-- Billing tables
CREATE INDEX IF NOT EXISTS idx_discount_rules_law_firm ON discount_rules(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_case_types_law_firm ON case_types(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_business_parameters_law_firm ON business_parameters(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_case_billing_methods_matter ON case_billing_methods(matter_id);
CREATE INDEX IF NOT EXISTS idx_case_outcomes_matter ON case_outcomes(matter_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_law_firm ON subscription_plans(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_law_firm_active ON subscription_plans(law_firm_id, is_active);
CREATE INDEX IF NOT EXISTS idx_client_subscriptions_client ON client_subscriptions(client_id);
CREATE INDEX IF NOT EXISTS idx_client_subscriptions_plan ON client_subscriptions(subscription_plan_id);
CREATE INDEX IF NOT EXISTS idx_client_subscriptions_law_firm_client ON client_subscriptions(law_firm_id, client_id);

-- DataJud tables
CREATE INDEX IF NOT EXISTS idx_datajud_case_details_matter_id ON datajud_case_details(matter_id);
CREATE INDEX IF NOT EXISTS idx_datajud_case_details_law_firm_id ON datajud_case_details(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_datajud_case_details_processo_cnj ON datajud_case_details(numero_processo_cnj);
CREATE INDEX IF NOT EXISTS idx_datajud_timeline_events_case_detail_id ON datajud_timeline_events(datajud_case_detail_id);
CREATE INDEX IF NOT EXISTS idx_datajud_timeline_events_datetime ON datajud_timeline_events(event_datetime DESC);
CREATE INDEX IF NOT EXISTS idx_datajud_participants_case_detail_id ON datajud_case_participants(datajud_case_detail_id);
CREATE INDEX IF NOT EXISTS idx_datajud_legal_subjects_case_detail_id ON datajud_legal_subjects(datajud_case_detail_id);
CREATE INDEX IF NOT EXISTS idx_datajud_sync_log_law_firm_id ON datajud_sync_log(law_firm_id);

-- Time tracking tables
CREATE INDEX IF NOT EXISTS idx_time_entries_law_firm ON time_entries(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_date ON time_entries(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_time_entries_matter ON time_entries(matter_id) WHERE matter_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_time_entries_status ON time_entries(entry_status);
CREATE INDEX IF NOT EXISTS idx_time_entry_templates_user ON time_entry_templates(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_lawyer_billing_rates_user ON lawyer_billing_rates(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_subscription_allocations_subscription ON subscription_time_allocations(client_subscription_id);
CREATE INDEX IF NOT EXISTS idx_daily_summaries_user_date ON daily_time_summaries(user_id, summary_date);
CREATE INDEX IF NOT EXISTS idx_active_sessions_user ON active_time_sessions(user_id);

-- Invoice tables
CREATE INDEX IF NOT EXISTS idx_invoices_law_firm_id ON invoices(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(invoice_status);
CREATE INDEX IF NOT EXISTS idx_invoices_type ON invoices(invoice_type);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_client_status ON invoices(client_id, invoice_status);
CREATE INDEX IF NOT EXISTS idx_invoices_firm_type_status ON invoices(law_firm_id, invoice_type, invoice_status);
CREATE INDEX IF NOT EXISTS idx_overdue_invoices ON invoices(law_firm_id, due_date, invoice_status)
  WHERE invoice_status IN ('sent', 'viewed', 'partial_paid', 'overdue');
CREATE INDEX IF NOT EXISTS idx_line_items_invoice_id ON invoice_line_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_billing_period ON subscription_invoices(billing_period_start, billing_period_end);
CREATE INDEX IF NOT EXISTS idx_case_invoices_matter_id ON case_invoices(matter_id);
CREATE INDEX IF NOT EXISTS idx_payment_plan_invoices_schedule ON payment_plan_invoices(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice_id ON invoice_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_date ON invoice_payments(payment_date);

-- Financial tables
CREATE INDEX IF NOT EXISTS idx_vendors_law_firm ON vendors(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_vendors_active ON vendors(law_firm_id, is_active);
CREATE INDEX IF NOT EXISTS idx_expense_categories_law_firm ON expense_categories(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_bills_law_firm ON bills(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_bills_vendor ON bills(vendor_id);
CREATE INDEX IF NOT EXISTS idx_bills_due_date ON bills(due_date);
CREATE INDEX IF NOT EXISTS idx_bills_payment_status ON bills(payment_status);
CREATE INDEX IF NOT EXISTS idx_bill_payments_bill ON bill_payments(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_payments_law_firm ON bill_payments(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_law_firm ON payment_plans(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_client ON payment_plans(client_id);
CREATE INDEX IF NOT EXISTS idx_payment_installments_law_firm ON payment_installments(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_payment_installments_plan ON payment_installments(payment_plan_id);
CREATE INDEX IF NOT EXISTS idx_payment_collections_law_firm ON payment_collections(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_payment_collections_invoice ON payment_collections(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_law_firm ON payment_reminders(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_invoice ON payment_reminders(invoice_id);
CREATE INDEX IF NOT EXISTS idx_financial_documents_law_firm ON financial_documents(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_financial_alerts_law_firm ON financial_alerts(law_firm_id, is_active);

-- ----- TRIGGERS -----

-- Core tables
CREATE TRIGGER update_law_firms_updated_at BEFORE UPDATE ON law_firms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_matter_types_updated_at BEFORE UPDATE ON matter_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_matters_updated_at BEFORE UPDATE ON matters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pipeline_stages_updated_at BEFORE UPDATE ON pipeline_stages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pipeline_cards_updated_at BEFORE UPDATE ON pipeline_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Billing tables
CREATE TRIGGER update_discount_rules_updated_at BEFORE UPDATE ON discount_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_case_types_updated_at BEFORE UPDATE ON case_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_business_parameters_updated_at BEFORE UPDATE ON business_parameters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_case_billing_methods_updated_at BEFORE UPDATE ON case_billing_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_case_outcomes_updated_at BEFORE UPDATE ON case_outcomes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_subscriptions_updated_at BEFORE UPDATE ON client_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- DataJud triggers
CREATE TRIGGER update_datajud_case_details_updated_at BEFORE UPDATE ON datajud_case_details FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_datajud_case_participants_updated_at BEFORE UPDATE ON datajud_case_participants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_datajud_timeline_events_updated_at BEFORE UPDATE ON datajud_timeline_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Time tracking triggers
CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON time_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_time_entry_templates_updated_at BEFORE UPDATE ON time_entry_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lawyer_billing_rates_updated_at BEFORE UPDATE ON lawyer_billing_rates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_time_allocations_updated_at BEFORE UPDATE ON subscription_time_allocations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daily_time_summaries_updated_at BEFORE UPDATE ON daily_time_summaries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_allocation_after_time_entry AFTER INSERT OR UPDATE ON time_entries FOR EACH ROW EXECUTE FUNCTION update_subscription_time_allocation();
CREATE TRIGGER update_daily_summary_after_time_entry AFTER INSERT OR UPDATE OR DELETE ON time_entries FOR EACH ROW EXECUTE FUNCTION update_daily_time_summary();

-- Invoice triggers
CREATE TRIGGER update_invoice_totals_trigger AFTER INSERT OR UPDATE OR DELETE ON invoice_line_items FOR EACH ROW EXECUTE FUNCTION update_invoice_totals();
CREATE TRIGGER set_invoice_number_trigger BEFORE INSERT ON invoices FOR EACH ROW EXECUTE FUNCTION set_invoice_number();
CREATE TRIGGER update_invoice_payment_status_trigger AFTER INSERT OR UPDATE OR DELETE ON invoice_payments FOR EACH ROW EXECUTE FUNCTION update_invoice_payment_status();

-- Financial triggers
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expense_categories_updated_at BEFORE UPDATE ON expense_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON bills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_collections_updated_at BEFORE UPDATE ON payment_collections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_plans_updated_at BEFORE UPDATE ON payment_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_installments_updated_at BEFORE UPDATE ON payment_installments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bill_status_after_payment AFTER INSERT OR UPDATE OR DELETE ON bill_payments FOR EACH ROW EXECUTE FUNCTION update_bill_payment_status();

-- Activity logging function
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO activity_logs (law_firm_id, action, entity_type, entity_id, user_id, description, old_values, new_values)
    VALUES (
        COALESCE(NEW.law_firm_id, OLD.law_firm_id), TG_OP, TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id), public.current_user_id(),
        format('%s %s', TG_OP, TG_TABLE_NAME),
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----- PLATFORM STATS VIEW -----

CREATE OR REPLACE VIEW platform_law_firm_stats AS
SELECT
    lf.id, lf.name, lf.legal_name, lf.email, lf.plan_type,
    lf.subscription_active, lf.created_at,
    COALESCE(u.user_count, 0) AS user_count,
    COALESCE(m.matter_count, 0) AS matter_count,
    COALESCE(m.active_matter_count, 0) AS active_matter_count,
    COALESCE(inv.total_revenue, 0) AS total_revenue
FROM law_firms lf
LEFT JOIN (
    SELECT law_firm_id, COUNT(*) AS user_count FROM users WHERE law_firm_id IS NOT NULL GROUP BY law_firm_id
) u ON u.law_firm_id = lf.id
LEFT JOIN (
    SELECT law_firm_id, COUNT(*) AS matter_count,
           COUNT(*) FILTER (WHERE status = 'active') AS active_matter_count
    FROM matters GROUP BY law_firm_id
) m ON m.law_firm_id = lf.id
LEFT JOIN (
    SELECT law_firm_id, COALESCE(SUM(total_amount), 0) AS total_revenue
    FROM invoices WHERE invoice_status = 'paid' GROUP BY law_firm_id
) inv ON inv.law_firm_id = lf.id;

GRANT SELECT ON platform_law_firm_stats TO authenticated;

-- =====================================================
-- SECTION: CONVERSATIONS & PARTICIPANTS
-- Added: Conversation threading for messages
-- =====================================================

CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    matter_id UUID REFERENCES matters(id),
    contact_id UUID REFERENCES contacts(id),
    title VARCHAR(255),
    description TEXT,
    conversation_type VARCHAR(20) DEFAULT 'client'
      CHECK (conversation_type IN ('internal','client','whatsapp')),
    status VARCHAR(20) DEFAULT 'active'
      CHECK (status IN ('active','archived','closed')),
    priority VARCHAR(10) DEFAULT 'normal'
      CHECK (priority IN ('low','normal','high','urgent')),
    topic VARCHAR(50),
    last_message_at TIMESTAMPTZ,
    last_message_preview TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    contact_id UUID REFERENCES contacts(id),
    role VARCHAR(20) DEFAULT 'participant'
      CHECK (role IN ('owner','moderator','participant')),
    is_active BOOLEAN DEFAULT true,
    last_read_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(conversation_id, user_id),
    UNIQUE(conversation_id, contact_id),
    CHECK (user_id IS NOT NULL OR contact_id IS NOT NULL)
);

ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'messages_sender_id_fkey'
  ) THEN
    ALTER TABLE messages ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES users(id);
  END IF;
END $$;

-- Conversation indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_time ON messages(conversation_id, created_at DESC);

-- Trigram index for ILIKE message search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_messages_content_trgm ON messages USING GIN (content gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_conversations_law_firm ON conversations(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_msg ON conversations(law_firm_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conv ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_contact ON conversation_participants(contact_id);

-- Conversation last message trigger
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET last_message_at = NEW.created_at,
        last_message_preview = LEFT(NEW.content, 100),
        updated_at = now()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_conversation_last_message ON messages;
CREATE TRIGGER trg_update_conversation_last_message
    AFTER INSERT ON messages
    FOR EACH ROW
    WHEN (NEW.conversation_id IS NOT NULL)
    EXECUTE FUNCTION update_conversation_last_message();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Conversation RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_conversation_law_firm_id(conv_id UUID)
RETURNS UUID AS $$
  SELECT law_firm_id FROM conversations WHERE id = conv_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

DROP POLICY IF EXISTS "conversations_staff_access" ON conversations;
CREATE POLICY "conversations_staff_access" ON conversations FOR ALL USING (
  law_firm_id = public.current_user_law_firm_id() AND public.current_user_is_staff()
);

DROP POLICY IF EXISTS "conv_participants_staff_access" ON conversation_participants;
CREATE POLICY "conv_participants_staff_access" ON conversation_participants FOR ALL USING (
  public.get_conversation_law_firm_id(conversation_id) = public.current_user_law_firm_id()
  AND public.current_user_is_staff()
);

DROP POLICY IF EXISTS "conversations_client_access" ON conversations;
CREATE POLICY "conversations_client_access" ON conversations FOR SELECT USING (
  id IN (
    SELECT conversation_id FROM conversation_participants
    WHERE user_id = public.current_user_id() OR
          contact_id IN (SELECT c.id FROM contacts c WHERE c.user_id = public.current_user_id())
  )
);

DROP POLICY IF EXISTS "conv_participants_client_access" ON conversation_participants;
CREATE POLICY "conv_participants_client_access" ON conversation_participants FOR SELECT USING (
  user_id = public.current_user_id() OR
  contact_id IN (SELECT c.id FROM contacts c WHERE c.user_id = public.current_user_id())
);

DROP POLICY IF EXISTS "conv_participants_client_update" ON conversation_participants;
CREATE POLICY "conv_participants_client_update" ON conversation_participants FOR UPDATE USING (
  user_id = public.current_user_id() OR
  contact_id IN (SELECT c.id FROM contacts c WHERE c.user_id = public.current_user_id())
);

DROP POLICY IF EXISTS "super_admin_all_conversations" ON conversations;
CREATE POLICY "super_admin_all_conversations" ON conversations FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "super_admin_all_conv_participants" ON conversation_participants;
CREATE POLICY "super_admin_all_conv_participants" ON conversation_participants FOR ALL USING (public.is_super_admin());

CREATE POLICY "service_role_all_conversations" ON conversations FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all_conv_participants" ON conversation_participants FOR ALL TO service_role USING (true);

-- =====================================================
-- SECTION: WEBSITE CONTENT MANAGEMENT
-- Per-firm editable public websites
-- =====================================================

ALTER TABLE law_firms ADD COLUMN IF NOT EXISTS slug VARCHAR(100) UNIQUE;
ALTER TABLE law_firms ADD COLUMN IF NOT EXISTS website_published BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_law_firms_slug ON law_firms(slug) WHERE slug IS NOT NULL;

CREATE TABLE IF NOT EXISTS website_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  law_firm_id UUID NOT NULL UNIQUE REFERENCES law_firms(id) ON DELETE CASCADE,
  theme JSONB DEFAULT '{}',
  topbar JSONB DEFAULT '{}',
  header JSONB DEFAULT '{}',
  hero JSONB DEFAULT '{}',
  credentials JSONB DEFAULT '{}',
  practice_areas JSONB DEFAULT '{}',
  philosophy JSONB DEFAULT '{}',
  methodology JSONB DEFAULT '{}',
  content_preview JSONB DEFAULT '{}',
  coverage_region JSONB DEFAULT '{}',
  founders JSONB DEFAULT '{}',
  cta_final JSONB DEFAULT '{}',
  footer JSONB DEFAULT '{}',
  contact_info JSONB DEFAULT '{}',
  seo JSONB DEFAULT '{}',
  section_order JSONB DEFAULT '["topbar","header","hero","credentials","practice_areas","philosophy","methodology","content_preview","coverage_region","founders","cta_final","footer"]',
  hidden_sections JSONB DEFAULT '[]',
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_website_content_law_firm ON website_content(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_website_content_published ON website_content(is_published) WHERE is_published = true;

CREATE TRIGGER set_website_content_updated_at
  BEFORE UPDATE ON website_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE website_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "website_content_public_read"
  ON website_content FOR SELECT
  USING (is_published = true);

CREATE POLICY "website_content_staff_manage"
  ON website_content FOR ALL
  USING (law_firm_id = public.current_user_law_firm_id())
  WITH CHECK (law_firm_id = public.current_user_law_firm_id());

CREATE POLICY "website_content_super_admin"
  ON website_content FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "website_content_service_role"
  ON website_content FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =====================================================
-- SECTION: CONTACT FORM LAW FIRM SCOPING
-- =====================================================

ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS law_firm_id UUID REFERENCES law_firms(id);
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS custom_fields JSONB;
CREATE INDEX IF NOT EXISTS idx_contact_submissions_law_firm ON contact_submissions(law_firm_id);

DROP POLICY IF EXISTS "contact_submissions_staff_read" ON contact_submissions;
CREATE POLICY "contact_submissions_staff_read" ON contact_submissions FOR SELECT USING (
  (law_firm_id IS NULL AND public.current_user_is_staff()) OR
  (law_firm_id = public.current_user_law_firm_id() AND public.current_user_is_staff())
);

-- =====================================================
-- SECTION: AI ASSISTANT TABLES
-- 4 tables: conversations, messages, feedback, tool executions
-- =====================================================

-- AI Enums
DO $$ BEGIN
  CREATE TYPE ai_conversation_status AS ENUM ('active', 'archived', 'deleted');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE ai_message_role AS ENUM ('user', 'assistant', 'system', 'tool');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE ai_feedback_rating AS ENUM ('positive', 'negative');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE ai_tool_status AS ENUM ('pending', 'approved', 'executed', 'rejected', 'error');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AI Conversations
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID REFERENCES law_firms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) DEFAULT 'Nova conversa',
    status ai_conversation_status DEFAULT 'active',
    context_type VARCHAR(50),
    context_entity_id UUID,
    provider VARCHAR(50) DEFAULT 'google',
    model VARCHAR(100) DEFAULT 'gemini-2.0-flash',
    total_tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID,
    updated_by UUID
);

-- AI Messages
CREATE TABLE IF NOT EXISTS ai_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    law_firm_id UUID REFERENCES law_firms(id) ON DELETE CASCADE,
    role ai_message_role NOT NULL,
    content TEXT,
    tool_calls JSONB,
    tool_results JSONB,
    tokens_input INTEGER DEFAULT 0,
    tokens_output INTEGER DEFAULT 0,
    source_type VARCHAR(20) DEFAULT 'widget'
      CHECK (source_type IN ('widget', 'chat_ghost', 'client_portal', 'proactive')),
    source_conversation_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- AI Message Feedback
CREATE TABLE IF NOT EXISTS ai_message_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES ai_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    law_firm_id UUID REFERENCES law_firms(id) ON DELETE CASCADE,
    rating ai_feedback_rating NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(message_id, user_id)
);

-- AI Tool Executions
CREATE TABLE IF NOT EXISTS ai_tool_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES ai_messages(id) ON DELETE CASCADE,
    law_firm_id UUID REFERENCES law_firms(id) ON DELETE CASCADE,
    tool_name VARCHAR(100) NOT NULL,
    tool_input JSONB,
    tool_output JSONB,
    status ai_tool_status DEFAULT 'pending',
    requires_confirmation BOOLEAN DEFAULT false,
    executed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- AI RLS
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_message_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tool_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_conversations_user_select ON ai_conversations
    FOR SELECT USING (user_id = public.current_user_id());
CREATE POLICY ai_conversations_user_insert ON ai_conversations
    FOR INSERT WITH CHECK (user_id = public.current_user_id());
CREATE POLICY ai_conversations_user_update ON ai_conversations
    FOR UPDATE USING (user_id = public.current_user_id());
CREATE POLICY ai_conversations_user_delete ON ai_conversations
    FOR DELETE USING (user_id = public.current_user_id());
CREATE POLICY ai_conversations_admin_select ON ai_conversations
    FOR SELECT USING (
        public.current_user_is_admin()
        AND law_firm_id = public.current_user_law_firm_id()
    );
CREATE POLICY ai_conversations_super_admin ON ai_conversations
    USING (public.is_super_admin());
CREATE POLICY ai_conversations_service_role ON ai_conversations
    USING (auth.role() = 'service_role');

CREATE POLICY ai_messages_user_select ON ai_messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM ai_conversations WHERE user_id = public.current_user_id()
        )
    );
CREATE POLICY ai_messages_user_insert ON ai_messages
    FOR INSERT WITH CHECK (
        conversation_id IN (
            SELECT id FROM ai_conversations WHERE user_id = public.current_user_id()
        )
    );
CREATE POLICY ai_messages_admin_select ON ai_messages
    FOR SELECT USING (
        public.current_user_is_admin()
        AND law_firm_id = public.current_user_law_firm_id()
    );
CREATE POLICY ai_messages_super_admin ON ai_messages
    USING (public.is_super_admin());
CREATE POLICY ai_messages_service_role ON ai_messages
    USING (auth.role() = 'service_role');

CREATE POLICY ai_message_feedback_user_all ON ai_message_feedback
    USING (user_id = public.current_user_id());
CREATE POLICY ai_message_feedback_user_insert ON ai_message_feedback
    FOR INSERT WITH CHECK (user_id = public.current_user_id());
CREATE POLICY ai_message_feedback_admin_select ON ai_message_feedback
    FOR SELECT USING (
        public.current_user_is_admin()
        AND law_firm_id = public.current_user_law_firm_id()
    );
CREATE POLICY ai_message_feedback_super_admin ON ai_message_feedback
    USING (public.is_super_admin());
CREATE POLICY ai_message_feedback_service_role ON ai_message_feedback
    USING (auth.role() = 'service_role');

CREATE POLICY ai_tool_executions_user_select ON ai_tool_executions
    FOR SELECT USING (
        message_id IN (
            SELECT m.id FROM ai_messages m
            JOIN ai_conversations c ON c.id = m.conversation_id
            WHERE c.user_id = public.current_user_id()
        )
    );
CREATE POLICY ai_tool_executions_admin_select ON ai_tool_executions
    FOR SELECT USING (
        public.current_user_is_admin()
        AND law_firm_id = public.current_user_law_firm_id()
    );
CREATE POLICY ai_tool_executions_super_admin ON ai_tool_executions
    USING (public.is_super_admin());
CREATE POLICY ai_tool_executions_service_role ON ai_tool_executions
    USING (auth.role() = 'service_role');

-- AI Indexes
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_law_firm ON ai_conversations(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_status ON ai_conversations(status);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_status ON ai_conversations(user_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_law_firm ON ai_messages(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_created ON ai_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_message_feedback_message ON ai_message_feedback(message_id);
CREATE INDEX IF NOT EXISTS idx_ai_message_feedback_law_firm ON ai_message_feedback(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_ai_tool_executions_message ON ai_tool_executions(message_id);
CREATE INDEX IF NOT EXISTS idx_ai_tool_executions_law_firm ON ai_tool_executions(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_ai_tool_executions_status ON ai_tool_executions(status);

-- AI Triggers
CREATE TRIGGER update_ai_conversations_updated_at
    BEFORE UPDATE ON ai_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_messages_updated_at
    BEFORE UPDATE ON ai_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_tool_executions_updated_at
    BEFORE UPDATE ON ai_tool_executions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SECTION: EVA CHAT INTEGRATION
-- Source tracking for cross-context AI memory
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_ai_messages_source_type ON ai_messages(source_type);
CREATE INDEX IF NOT EXISTS idx_ai_messages_source_conv ON ai_messages(source_conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_status_updated
  ON ai_conversations(user_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_firm_contact_status_updated
  ON conversations(law_firm_id, contact_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_messages_proactive_lookup
  ON ai_messages(source_type, role, created_at DESC)
  WHERE source_type = 'proactive';

-- =====================================================
-- SECTION: PORTUGUESE HELPER FUNCTIONS
-- Map Portuguese labels to English enum values
-- =====================================================

CREATE OR REPLACE FUNCTION public.map_client_status(portuguese_status TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $function$
BEGIN
    CASE portuguese_status
        WHEN 'ativo' THEN RETURN 'active';
        WHEN 'inativo' THEN RETURN 'inactive';
        WHEN 'prospecto' THEN RETURN 'prospect';
        ELSE RETURN 'prospect';
    END CASE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.map_contact_type(portuguese_type TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $function$
BEGIN
    CASE portuguese_type
        WHEN 'pessoa_fisica' THEN RETURN 'individual';
        WHEN 'pessoa_juridica' THEN RETURN 'company';
        ELSE RETURN 'individual';
    END CASE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.map_matter_priority(portuguese_priority TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $function$
BEGIN
    CASE portuguese_priority
        WHEN 'baixa' THEN RETURN 'low';
        WHEN 'media' THEN RETURN 'medium';
        WHEN 'alta' THEN RETURN 'high';
        WHEN 'urgente' THEN RETURN 'urgent';
        ELSE RETURN 'medium';
    END CASE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.map_matter_status(portuguese_status TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $function$
BEGIN
    CASE portuguese_status
        WHEN 'novo' THEN RETURN 'active';
        WHEN 'analise' THEN RETURN 'on_hold';
        WHEN 'ativo' THEN RETURN 'active';
        WHEN 'suspenso' THEN RETURN 'on_hold';
        WHEN 'aguardando_cliente' THEN RETURN 'on_hold';
        WHEN 'aguardando_documentos' THEN RETURN 'on_hold';
        WHEN 'finalizado' THEN RETURN 'closed';
        ELSE RETURN 'active';
    END CASE;
END;
$function$;

-- =====================================================
-- SECTION: VIEWS
-- Aggregate and Portuguese-labeled views
-- =====================================================

CREATE OR REPLACE VIEW client_stats_view AS
SELECT law_firm_id,
    count(*) AS total_clients,
    count(*) FILTER (WHERE client_status = 'active') AS active_clients,
    count(*) FILTER (WHERE client_status = 'inactive') AS inactive_clients,
    count(*) FILTER (WHERE client_status = 'prospect') AS prospects,
    COALESCE(sum(total_billed), 0::numeric) AS total_matters,
    COALESCE((SELECT count(*) FROM matters m
        WHERE m.law_firm_id = c.law_firm_id AND m.status = 'active'), 0::bigint) AS active_matters
FROM contacts c
WHERE contact_type IN ('individual', 'company')
GROUP BY law_firm_id;

CREATE OR REPLACE VIEW contacts_with_portuguese_labels AS
SELECT id, law_firm_id, user_id, contact_type, first_name, last_name, full_name,
    cpf, rg, birth_date, marital_status, profession, company_name, cnpj, company_type,
    email, phone, mobile, address_street, address_number, address_complement,
    address_neighborhood, address_city, address_state, address_zipcode, address_country,
    client_status, source, credit_limit, total_billed, total_paid, outstanding_balance,
    preferred_communication, communication_frequency, notes, tags,
    created_at, updated_at, created_by, updated_by, client_number, portal_enabled,
    legal_name, trade_name,
    CASE contact_type
        WHEN 'individual' THEN 'Pessoa Física'
        WHEN 'company' THEN 'Pessoa Jurídica'
        WHEN 'lead' THEN 'Lead'
        WHEN 'vendor' THEN 'Fornecedor'
        WHEN 'court' THEN 'Tribunal'
        ELSE contact_type
    END AS tipo_portugues,
    CASE client_status
        WHEN 'prospect' THEN 'Prospecto'
        WHEN 'active' THEN 'Ativo'
        WHEN 'inactive' THEN 'Inativo'
        WHEN 'former' THEN 'Ex-cliente'
        ELSE client_status
    END AS status_portugues
FROM contacts c;

CREATE OR REPLACE VIEW matter_stats_view AS
SELECT law_firm_id,
    count(*) AS total_matters,
    count(*) FILTER (WHERE status = 'active') AS active_matters,
    count(*) FILTER (WHERE status = 'on_hold') AS on_hold_matters,
    count(*) FILTER (WHERE status = 'closed') AS closed_matters,
    count(*) FILTER (WHERE status = 'cancelled') AS cancelled_matters,
    COALESCE(sum(total_billed), 0::numeric) AS total_billed,
    COALESCE(sum(total_paid), 0::numeric) AS total_paid,
    COALESCE(sum(outstanding_balance), 0::numeric) AS outstanding_balance
FROM matters
GROUP BY law_firm_id;

CREATE OR REPLACE VIEW matters_with_portuguese_labels AS
SELECT id, law_firm_id, matter_type_id, matter_number, title, description,
    court_name, court_city, court_state, process_number, opposing_party,
    status, priority, opened_date, closed_date, statute_of_limitations, next_court_date,
    billing_method, hourly_rate, flat_fee, contingency_percentage,
    total_time_logged, total_billed, total_paid, outstanding_balance,
    responsible_lawyer_id, assigned_staff, notes, tags, custom_fields,
    created_at, updated_at, created_by, updated_by,
    area_juridica, case_value, probability_success, next_action,
    CASE status
        WHEN 'active' THEN 'Ativo'
        WHEN 'closed' THEN 'Finalizado'
        WHEN 'on_hold' THEN 'Suspenso'
        WHEN 'settled' THEN 'Acordo'
        WHEN 'dismissed' THEN 'Arquivado'
        ELSE status
    END AS status_portugues,
    CASE priority
        WHEN 'low' THEN 'Baixa'
        WHEN 'medium' THEN 'Média'
        WHEN 'high' THEN 'Alta'
        WHEN 'urgent' THEN 'Urgente'
        ELSE priority
    END AS prioridade_portugues
FROM matters m;

GRANT SELECT ON client_stats_view TO authenticated;
GRANT SELECT ON contacts_with_portuguese_labels TO authenticated;
GRANT SELECT ON matter_stats_view TO authenticated;
GRANT SELECT ON matters_with_portuguese_labels TO authenticated;

-- =====================================================
-- DONE! Consolidated init for fresh Supabase deploy.
-- Includes all tables from sprints 0-9 plus:
--   - Conversations & participants (chat threading)
--   - Website content management (per-firm CMS)
--   - Contact form law_firm scoping
--   - AI assistant tables (EVA conversations, messages, feedback, tools)
--   - EVA chat integration (source tracking, cross-context memory)
-- Bug fixes applied:
--   1. auth.* functions → public.* (Supabase schema restriction)
--   2. clients(id) FK → contacts(id) (correct table)
--   3. service_inclusions(id) FK removed (table never existed)
--   4. case_billing(id) FK removed (case_billing_methods is actual table)
--   5. current_setting('app.current_law_firm_id') → public.current_user_law_firm_id()
--   6. WHERE id = auth.uid() → WHERE auth_user_id = auth.uid()
--   7. Duplicate tables resolved (winners: 8.6.1, 8.7.1, 011)
-- =====================================================
