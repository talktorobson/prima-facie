-- =====================================================
-- Prima Facie - Legal Practice Management System
-- Initial Database Schema Migration
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. LAW FIRMS (Multi-tenant base)
-- =====================================================
CREATE TABLE law_firms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    cnpj VARCHAR(18) UNIQUE,
    oab_number VARCHAR(50),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    website VARCHAR(255),
    
    -- Address
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_complement VARCHAR(100),
    address_neighborhood VARCHAR(100),
    address_city VARCHAR(100),
    address_state VARCHAR(2),
    address_zipcode VARCHAR(9),
    address_country VARCHAR(2) DEFAULT 'BR',
    
    -- Branding & Customization
    logo_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#0066CC',
    secondary_color VARCHAR(7) DEFAULT '#64748B',
    custom_domain VARCHAR(255),
    
    -- Subscription & Features
    plan_type VARCHAR(50) DEFAULT 'trial', -- trial, basic, professional, enterprise
    features JSONB DEFAULT '{}',
    subscription_active BOOLEAN DEFAULT true,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID,
    updated_by UUID
);

-- Indexes for law_firms
CREATE INDEX idx_law_firms_cnpj ON law_firms(cnpj);
CREATE INDEX idx_law_firms_email ON law_firms(email);
CREATE INDEX idx_law_firms_plan_type ON law_firms(plan_type);
CREATE INDEX idx_law_firms_active ON law_firms(subscription_active);

-- =====================================================
-- 2. USERS (Staff and Clients)
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    
    -- Authentication (linked to Supabase Auth)
    auth_user_id UUID UNIQUE, -- Links to auth.users
    email VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT false,
    
    -- Personal Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(255) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    
    -- Professional Information
    oab_number VARCHAR(50),
    position VARCHAR(100),
    department VARCHAR(100),
    
    -- Contact Information
    phone VARCHAR(20),
    mobile VARCHAR(20),
    
    -- User Type & Permissions
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('admin', 'lawyer', 'staff', 'client')),
    role VARCHAR(50),
    permissions JSONB DEFAULT '{}',
    
    -- User Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    -- Profile
    avatar_url TEXT,
    bio TEXT,
    timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
    language VARCHAR(5) DEFAULT 'pt-BR',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID,
    updated_by UUID,
    
    UNIQUE(law_firm_id, email)
);

-- Indexes for users
CREATE INDEX idx_users_law_firm_id ON users(law_firm_id);
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type ON users(user_type);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_full_name ON users(full_name);

-- =====================================================
-- 3. MATTER TYPES (Case Categories)
-- =====================================================
CREATE TABLE matter_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#64748B',
    icon VARCHAR(50),
    
    -- Default rates for this matter type
    default_hourly_rate DECIMAL(10,2),
    default_flat_fee DECIMAL(10,2),
    
    -- Template settings
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

-- Indexes for matter_types
CREATE INDEX idx_matter_types_law_firm_id ON matter_types(law_firm_id);
CREATE INDEX idx_matter_types_active ON matter_types(is_active);

-- =====================================================
-- 4. CONTACTS (Clients and Prospects)
-- =====================================================
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id), -- If contact becomes a user
    
    -- Contact Type
    contact_type VARCHAR(20) NOT NULL CHECK (contact_type IN ('individual', 'company')),
    
    -- Individual Information
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    full_name VARCHAR(255),
    cpf VARCHAR(14),
    rg VARCHAR(20),
    birth_date DATE,
    marital_status VARCHAR(20),
    profession VARCHAR(100),
    
    -- Company Information
    company_name VARCHAR(255),
    cnpj VARCHAR(18),
    company_type VARCHAR(50),
    
    -- Contact Information
    email VARCHAR(255),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    
    -- Address
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_complement VARCHAR(100),
    address_neighborhood VARCHAR(100),
    address_city VARCHAR(100),
    address_state VARCHAR(2),
    address_zipcode VARCHAR(9),
    address_country VARCHAR(2) DEFAULT 'BR',
    
    -- Client Status
    client_status VARCHAR(20) DEFAULT 'prospect' CHECK (client_status IN ('prospect', 'active', 'inactive', 'former')),
    source VARCHAR(50), -- How they found us
    
    -- Financial Information
    credit_limit DECIMAL(10,2),
    total_billed DECIMAL(10,2) DEFAULT 0,
    total_paid DECIMAL(10,2) DEFAULT 0,
    outstanding_balance DECIMAL(10,2) DEFAULT 0,
    
    -- Preferences
    preferred_communication VARCHAR(20) DEFAULT 'email' CHECK (preferred_communication IN ('email', 'phone', 'whatsapp', 'mail')),
    communication_frequency VARCHAR(20) DEFAULT 'normal' CHECK (communication_frequency IN ('minimal', 'normal', 'frequent')),
    
    -- Notes and Tags
    notes TEXT,
    tags JSONB DEFAULT '[]',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Indexes for contacts
CREATE INDEX idx_contacts_law_firm_id ON contacts(law_firm_id);
CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_cpf ON contacts(cpf);
CREATE INDEX idx_contacts_cnpj ON contacts(cnpj);
CREATE INDEX idx_contacts_status ON contacts(client_status);
CREATE INDEX idx_contacts_full_name ON contacts(full_name);
CREATE INDEX idx_contacts_company_name ON contacts(company_name);

-- =====================================================
-- 5. MATTERS (Legal Cases/Processes)
-- =====================================================
CREATE TABLE matters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    matter_type_id UUID REFERENCES matter_types(id),
    
    -- Matter Identification
    matter_number VARCHAR(50) NOT NULL, -- Auto-generated or custom
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Court Information
    court_name VARCHAR(255),
    court_city VARCHAR(100),
    court_state VARCHAR(2),
    process_number VARCHAR(50),
    opposing_party VARCHAR(255),
    
    -- Matter Status
    status VARCHAR(30) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'on_hold', 'settled', 'dismissed')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Dates
    opened_date DATE NOT NULL DEFAULT CURRENT_DATE,
    closed_date DATE,
    statute_of_limitations DATE,
    next_court_date TIMESTAMP WITH TIME ZONE,
    
    -- Financial
    billing_method VARCHAR(20) DEFAULT 'hourly' CHECK (billing_method IN ('hourly', 'flat_fee', 'contingency', 'pro_bono')),
    hourly_rate DECIMAL(10,2),
    flat_fee DECIMAL(10,2),
    contingency_percentage DECIMAL(5,2),
    
    -- Totals (calculated fields)
    total_time_logged DECIMAL(10,2) DEFAULT 0, -- in hours
    total_billed DECIMAL(10,2) DEFAULT 0,
    total_paid DECIMAL(10,2) DEFAULT 0,
    outstanding_balance DECIMAL(10,2) DEFAULT 0,
    
    -- Assignments
    responsible_lawyer_id UUID REFERENCES users(id),
    assigned_staff JSONB DEFAULT '[]', -- Array of user IDs
    
    -- Metadata
    notes TEXT,
    tags JSONB DEFAULT '[]',
    custom_fields JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    
    UNIQUE(law_firm_id, matter_number)
);

-- Indexes for matters
CREATE INDEX idx_matters_law_firm_id ON matters(law_firm_id);
CREATE INDEX idx_matters_matter_type_id ON matters(matter_type_id);
CREATE INDEX idx_matters_number ON matters(matter_number);
CREATE INDEX idx_matters_status ON matters(status);
CREATE INDEX idx_matters_priority ON matters(priority);
CREATE INDEX idx_matters_responsible_lawyer ON matters(responsible_lawyer_id);
CREATE INDEX idx_matters_opened_date ON matters(opened_date);
CREATE INDEX idx_matters_next_court_date ON matters(next_court_date);

-- =====================================================
-- 6. MATTER_CONTACTS (Many-to-Many relationship)
-- =====================================================
CREATE TABLE matter_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    
    -- Relationship type
    relationship_type VARCHAR(30) NOT NULL CHECK (relationship_type IN ('client', 'opposing_party', 'witness', 'expert', 'other')),
    
    -- Is this the primary client?
    is_primary BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES users(id),
    
    UNIQUE(matter_id, contact_id, relationship_type)
);

-- Indexes for matter_contacts
CREATE INDEX idx_matter_contacts_matter_id ON matter_contacts(matter_id);
CREATE INDEX idx_matter_contacts_contact_id ON matter_contacts(contact_id);
CREATE INDEX idx_matter_contacts_relationship ON matter_contacts(relationship_type);

-- =====================================================
-- 7. TASKS (Matter-related tasks and deadlines)
-- =====================================================
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    matter_id UUID REFERENCES matters(id) ON DELETE CASCADE,
    
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Task Details
    task_type VARCHAR(30) DEFAULT 'general' CHECK (task_type IN ('general', 'deadline', 'court_date', 'client_meeting', 'document_review')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    
    -- Dates
    due_date TIMESTAMP WITH TIME ZONE,
    completed_date TIMESTAMP WITH TIME ZONE,
    reminder_date TIMESTAMP WITH TIME ZONE,
    
    -- Assignment
    assigned_to UUID REFERENCES users(id),
    
    -- Billing
    is_billable BOOLEAN DEFAULT false,
    estimated_hours DECIMAL(5,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Indexes for tasks
CREATE INDEX idx_tasks_law_firm_id ON tasks(law_firm_id);
CREATE INDEX idx_tasks_matter_id ON tasks(matter_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_priority ON tasks(priority);

-- =====================================================
-- 8. TIME_ENTRIES (Time tracking for billing)
-- =====================================================
CREATE TABLE time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id),
    
    -- Time Details
    description TEXT NOT NULL,
    hours_worked DECIMAL(5,2) NOT NULL CHECK (hours_worked > 0),
    
    -- Dates
    work_date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_time TIME,
    end_time TIME,
    
    -- Billing
    hourly_rate DECIMAL(10,2),
    total_amount DECIMAL(10,2) GENERATED ALWAYS AS (hours_worked * COALESCE(hourly_rate, 0)) STORED,
    is_billable BOOLEAN DEFAULT true,
    is_billed BOOLEAN DEFAULT false,
    invoice_id UUID, -- Will be added when invoice table is created
    
    -- Timer tracking
    timer_started_at TIMESTAMP WITH TIME ZONE,
    timer_stopped_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Indexes for time_entries
CREATE INDEX idx_time_entries_law_firm_id ON time_entries(law_firm_id);
CREATE INDEX idx_time_entries_matter_id ON time_entries(matter_id);
CREATE INDEX idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX idx_time_entries_work_date ON time_entries(work_date);
CREATE INDEX idx_time_entries_billable ON time_entries(is_billable);
CREATE INDEX idx_time_entries_billed ON time_entries(is_billed);

-- =====================================================
-- 9. DOCUMENTS (File references and metadata)
-- =====================================================
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    matter_id UUID REFERENCES matters(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id),
    
    -- Document Information
    name VARCHAR(255) NOT NULL,
    description TEXT,
    file_type VARCHAR(10), -- pdf, doc, jpg, etc.
    file_size BIGINT, -- in bytes
    
    -- Storage Information
    storage_provider VARCHAR(20) DEFAULT 'google_drive', -- google_drive, supabase, s3
    storage_path TEXT, -- Path in storage provider
    external_id VARCHAR(255), -- ID in external system (Google Drive ID)
    
    -- Document Type
    document_type VARCHAR(50), -- contract, evidence, correspondence, etc.
    category VARCHAR(50),
    
    -- Access Control
    is_confidential BOOLEAN DEFAULT false,
    access_level VARCHAR(20) DEFAULT 'internal' CHECK (access_level IN ('public', 'internal', 'restricted', 'confidential')),
    
    -- Version Control
    version VARCHAR(10) DEFAULT '1.0',
    parent_document_id UUID REFERENCES documents(id),
    
    -- Metadata
    tags JSONB DEFAULT '[]',
    custom_fields JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Indexes for documents
CREATE INDEX idx_documents_law_firm_id ON documents(law_firm_id);
CREATE INDEX idx_documents_matter_id ON documents(matter_id);
CREATE INDEX idx_documents_contact_id ON documents(contact_id);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_access_level ON documents(access_level);

-- =====================================================
-- 10. INVOICES (Billing and payments)
-- =====================================================
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id),
    matter_id UUID REFERENCES matters(id),
    
    -- Invoice Information
    invoice_number VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    description TEXT,
    
    -- Dates
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    sent_date DATE,
    paid_date DATE,
    
    -- Amounts
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    outstanding_amount DECIMAL(10,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled')),
    
    -- Payment Information
    payment_method VARCHAR(30),
    payment_reference VARCHAR(100),
    
    -- Settings
    currency VARCHAR(3) DEFAULT 'BRL',
    payment_terms TEXT,
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    
    UNIQUE(law_firm_id, invoice_number)
);

-- Indexes for invoices
CREATE INDEX idx_invoices_law_firm_id ON invoices(law_firm_id);
CREATE INDEX idx_invoices_contact_id ON invoices(contact_id);
CREATE INDEX idx_invoices_matter_id ON invoices(matter_id);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);

-- =====================================================
-- 11. INVOICE_LINE_ITEMS (Detailed billing items)
-- =====================================================
CREATE TABLE invoice_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    time_entry_id UUID REFERENCES time_entries(id),
    
    -- Line Item Details
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    rate DECIMAL(10,2) NOT NULL,
    amount DECIMAL(10,2) GENERATED ALWAYS AS (quantity * rate) STORED,
    
    -- Type
    item_type VARCHAR(20) DEFAULT 'time' CHECK (item_type IN ('time', 'expense', 'fee', 'other')),
    
    -- Date performed
    service_date DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for invoice_line_items
CREATE INDEX idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);
CREATE INDEX idx_invoice_line_items_time_entry_id ON invoice_line_items(time_entry_id);

-- =====================================================
-- 12. MESSAGES (Chat system)
-- =====================================================
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    matter_id UUID REFERENCES matters(id),
    contact_id UUID REFERENCES contacts(id),
    
    -- Message Details
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system', 'whatsapp')),
    
    -- Sender/Receiver
    sender_id UUID REFERENCES users(id),
    sender_type VARCHAR(20) CHECK (sender_type IN ('user', 'contact', 'system')),
    receiver_id UUID REFERENCES users(id),
    receiver_type VARCHAR(20) CHECK (receiver_type IN ('user', 'contact')),
    
    -- External Integration
    external_message_id VARCHAR(255), -- WhatsApp message ID
    external_platform VARCHAR(20), -- whatsapp, email, etc.
    
    -- Status
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Attachments
    attachments JSONB DEFAULT '[]',
    
    -- Threading
    parent_message_id UUID REFERENCES messages(id),
    thread_id UUID,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for messages
CREATE INDEX idx_messages_law_firm_id ON messages(law_firm_id);
CREATE INDEX idx_messages_matter_id ON messages(matter_id);
CREATE INDEX idx_messages_contact_id ON messages(contact_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_thread_id ON messages(thread_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- =====================================================
-- 13. PIPELINE_STAGES (Client intake Kanban)
-- =====================================================
CREATE TABLE pipeline_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#64748B',
    
    -- Stage Type
    stage_type VARCHAR(20) DEFAULT 'intake' CHECK (stage_type IN ('intake', 'onboarding', 'not_hired')),
    
    -- Order and Status
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_final_stage BOOLEAN DEFAULT false, -- Indicates completion
    
    -- Automation Rules
    auto_actions JSONB DEFAULT '{}', -- Automated actions when card enters this stage
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    
    UNIQUE(law_firm_id, name, stage_type)
);

-- Indexes for pipeline_stages
CREATE INDEX idx_pipeline_stages_law_firm_id ON pipeline_stages(law_firm_id);
CREATE INDEX idx_pipeline_stages_type ON pipeline_stages(stage_type);
CREATE INDEX idx_pipeline_stages_order ON pipeline_stages(sort_order);

-- =====================================================
-- 14. PIPELINE_CARDS (Prospects in pipeline)
-- =====================================================
CREATE TABLE pipeline_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    pipeline_stage_id UUID NOT NULL REFERENCES pipeline_stages(id),
    contact_id UUID REFERENCES contacts(id),
    matter_type_id UUID REFERENCES matter_types(id),
    
    -- Card Information
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Financial Potential
    estimated_value DECIMAL(10,2),
    probability DECIMAL(5,2) CHECK (probability >= 0 AND probability <= 100),
    
    -- Important Dates
    expected_close_date DATE,
    last_contact_date DATE,
    next_follow_up_date DATE,
    
    -- Assignment
    assigned_to UUID REFERENCES users(id),
    
    -- Source and Notes
    source VARCHAR(50), -- Where this lead came from
    notes TEXT,
    tags JSONB DEFAULT '[]',
    
    -- Stage History (for analytics)
    stage_history JSONB DEFAULT '[]',
    
    -- Outcome (for not_hired pipeline)
    outcome_reason VARCHAR(100), -- Why not hired
    outcome_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Indexes for pipeline_cards
CREATE INDEX idx_pipeline_cards_law_firm_id ON pipeline_cards(law_firm_id);
CREATE INDEX idx_pipeline_cards_stage_id ON pipeline_cards(pipeline_stage_id);
CREATE INDEX idx_pipeline_cards_contact_id ON pipeline_cards(contact_id);
CREATE INDEX idx_pipeline_cards_assigned_to ON pipeline_cards(assigned_to);
CREATE INDEX idx_pipeline_cards_expected_close ON pipeline_cards(expected_close_date);

-- =====================================================
-- 15. ACTIVITY_LOGS (Audit trail)
-- =====================================================
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    
    -- What happened
    action VARCHAR(50) NOT NULL, -- created, updated, deleted, etc.
    entity_type VARCHAR(50) NOT NULL, -- matter, contact, invoice, etc.
    entity_id UUID NOT NULL,
    
    -- Who did it
    user_id UUID REFERENCES users(id),
    
    -- Details
    description TEXT,
    old_values JSONB,
    new_values JSONB,
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for activity_logs
CREATE INDEX idx_activity_logs_law_firm_id ON activity_logs(law_firm_id);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =====================================================

-- Function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to all tables with updated_at column
CREATE TRIGGER update_law_firms_updated_at BEFORE UPDATE ON law_firms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_matter_types_updated_at BEFORE UPDATE ON matter_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_matters_updated_at BEFORE UPDATE ON matters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON time_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pipeline_stages_updated_at BEFORE UPDATE ON pipeline_stages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pipeline_cards_updated_at BEFORE UPDATE ON pipeline_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE law_firms IS 'Multi-tenant law firms - base entity for the entire system';
COMMENT ON TABLE users IS 'All system users including staff and clients';
COMMENT ON TABLE matter_types IS 'Categories of legal matters/cases';
COMMENT ON TABLE contacts IS 'Clients and prospects contact information';
COMMENT ON TABLE matters IS 'Legal cases/processes';
COMMENT ON TABLE matter_contacts IS 'Association between matters and contacts';
COMMENT ON TABLE tasks IS 'Tasks and deadlines associated with matters';
COMMENT ON TABLE time_entries IS 'Time tracking for billing purposes';
COMMENT ON TABLE documents IS 'Document metadata and file references';
COMMENT ON TABLE invoices IS 'Bills sent to clients';
COMMENT ON TABLE invoice_line_items IS 'Detailed items in each invoice';
COMMENT ON TABLE messages IS 'Chat messages and communications';
COMMENT ON TABLE pipeline_stages IS 'Kanban board stages for client intake';
COMMENT ON TABLE pipeline_cards IS 'Prospects and leads in the intake pipeline';
COMMENT ON TABLE activity_logs IS 'Audit trail for all system activities';