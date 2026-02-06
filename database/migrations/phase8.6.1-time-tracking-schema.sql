-- Phase 8.6.1: Time Tracking Integration Database Schema
-- Time Entry System for Lawyer Billing & Subscription Management
-- Built with love and confidence ❤️

-- ====================================
-- TIME TRACKING CORE TABLES
-- ====================================

-- Time Entries table - Core time tracking functionality
CREATE TABLE time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id), -- The lawyer/staff member
    
    -- Entry classification
    entry_type VARCHAR(50) NOT NULL CHECK (entry_type IN ('case_work', 'subscription_work', 'administrative', 'business_development', 'non_billable')),
    entry_status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (entry_status IN ('draft', 'submitted', 'approved', 'rejected', 'billed')),
    
    -- Time tracking details
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER, -- Calculated or manually entered
    break_minutes INTEGER DEFAULT 0,
    effective_minutes INTEGER GENERATED ALWAYS AS (duration_minutes - break_minutes) STORED,
    
    -- Work classification
    matter_id UUID REFERENCES matters(id), -- For case work
    client_subscription_id UUID REFERENCES client_subscriptions(id), -- For subscription work
    task_category VARCHAR(100), -- E.g., "Research", "Client Meeting", "Court Appearance"
    activity_description TEXT NOT NULL,
    
    -- Billing information
    is_billable BOOLEAN NOT NULL DEFAULT true,
    billable_rate DECIMAL(10,2), -- Rate at time of entry
    billing_rate_source VARCHAR(50) CHECK (billing_rate_source IN ('user_default', 'matter_specific', 'subscription_rate', 'custom')),
    billable_amount DECIMAL(12,2) GENERATED ALWAYS AS (
        CASE 
            WHEN is_billable THEN (effective_minutes::DECIMAL / 60.0) * COALESCE(billable_rate, 0)
            ELSE 0
        END
    ) STORED,
    
    -- Subscription allocation
    counts_toward_subscription BOOLEAN DEFAULT FALSE,
    subscription_service_type VARCHAR(50), -- From ServiceType enum
    
    -- Location and context
    location VARCHAR(255), -- "Office", "Client Site", "Court", "Remote"
    is_remote_work BOOLEAN DEFAULT FALSE,
    
    -- Approval workflow
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    approval_notes TEXT,
    rejected_reason TEXT,
    
    -- Billing integration
    invoice_id UUID REFERENCES invoices(id), -- Once billed
    billed_at TIMESTAMP WITH TIME ZONE,
    billing_notes TEXT,
    
    -- Timer functionality
    timer_started_at TIMESTAMP WITH TIME ZONE,
    is_timer_running BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    entry_date DATE NOT NULL, -- Extracted from start_time for indexing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Time Entry Templates - For recurring activities
CREATE TABLE time_entry_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id), -- Owner of template
    
    -- Template details
    template_name VARCHAR(255) NOT NULL,
    template_description TEXT,
    template_category VARCHAR(100),
    
    -- Default values
    default_entry_type VARCHAR(50) NOT NULL,
    default_task_category VARCHAR(100),
    default_activity_description TEXT,
    default_duration_minutes INTEGER,
    default_billable_rate DECIMAL(10,2),
    default_is_billable BOOLEAN DEFAULT true,
    default_location VARCHAR(255),
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    is_shared BOOLEAN DEFAULT FALSE, -- Can other users see this template
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Lawyer Billing Rates - Hierarchical rate structure
CREATE TABLE lawyer_billing_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- Rate classification
    rate_type VARCHAR(50) NOT NULL CHECK (rate_type IN ('standard', 'subscription', 'matter_specific', 'client_specific', 'case_type_specific')),
    rate_category VARCHAR(100), -- "Junior", "Senior", "Partner", "Specialist"
    
    -- Rate structure
    hourly_rate DECIMAL(10,2) NOT NULL,
    currency_code VARCHAR(3) DEFAULT 'BRL',
    
    -- Applicability rules
    matter_id UUID REFERENCES matters(id), -- For matter-specific rates
    client_id UUID REFERENCES clients(id), -- For client-specific rates
    case_type_id UUID REFERENCES case_types(id), -- For case type rates
    subscription_plan_id UUID REFERENCES subscription_plans(id), -- For subscription work
    
    -- Effective period
    effective_from DATE NOT NULL,
    effective_until DATE,
    
    -- Special conditions
    minimum_increment_minutes INTEGER DEFAULT 15, -- Minimum billing increment
    rounding_method VARCHAR(20) DEFAULT 'up' CHECK (rounding_method IN ('up', 'down', 'nearest')),
    
    -- Approval and tracking
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- SUBSCRIPTION TIME ALLOCATION
-- ====================================

-- Subscription Time Allocation - Track hours against subscription plans
CREATE TABLE subscription_time_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_subscription_id UUID NOT NULL REFERENCES client_subscriptions(id),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    
    -- Allocation period
    allocation_month DATE NOT NULL, -- First day of month
    
    -- Time tracking
    total_minutes_allocated INTEGER NOT NULL, -- From subscription plan
    total_minutes_used INTEGER DEFAULT 0,
    total_minutes_remaining INTEGER GENERATED ALWAYS AS (total_minutes_allocated - total_minutes_used) STORED,
    
    -- Service breakdown
    consultation_minutes_used INTEGER DEFAULT 0,
    document_review_minutes_used INTEGER DEFAULT 0,
    phone_support_minutes_used INTEGER DEFAULT 0,
    email_support_minutes_used INTEGER DEFAULT 0,
    other_minutes_used INTEGER DEFAULT 0,
    
    -- Overage tracking
    overage_minutes INTEGER DEFAULT 0,
    overage_rate DECIMAL(10,2),
    overage_amount DECIMAL(12,2) GENERATED ALWAYS AS (
        CASE 
            WHEN overage_minutes > 0 THEN (overage_minutes::DECIMAL / 60.0) * COALESCE(overage_rate, 0)
            ELSE 0
        END
    ) STORED,
    
    -- Status tracking
    allocation_status VARCHAR(20) DEFAULT 'active' CHECK (allocation_status IN ('active', 'exhausted', 'rolled_over', 'expired')),
    rollover_minutes INTEGER DEFAULT 0, -- Minutes carried from previous month
    
    -- Billing integration
    invoiced_at TIMESTAMP WITH TIME ZONE,
    invoice_id UUID REFERENCES invoices(id),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_subscription_month UNIQUE (client_subscription_id, allocation_month)
);

-- Time Entry Allocations - Link time entries to subscription allocations
CREATE TABLE time_entry_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    time_entry_id UUID NOT NULL REFERENCES time_entries(id) ON DELETE CASCADE,
    subscription_time_allocation_id UUID REFERENCES subscription_time_allocations(id),
    
    -- Allocation details
    allocated_minutes INTEGER NOT NULL,
    allocation_type VARCHAR(50) NOT NULL CHECK (allocation_type IN ('included', 'overage', 'complimentary')),
    service_type VARCHAR(50), -- Matches subscription ServiceType
    
    -- Billing tracking
    is_billed BOOLEAN DEFAULT FALSE,
    billing_rate DECIMAL(10,2),
    billing_amount DECIMAL(12,2),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- TIME TRACKING ANALYTICS
-- ====================================

-- Daily Time Summaries - Aggregated daily data for performance
CREATE TABLE daily_time_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    summary_date DATE NOT NULL,
    
    -- Time breakdown by type
    case_work_minutes INTEGER DEFAULT 0,
    subscription_work_minutes INTEGER DEFAULT 0,
    administrative_minutes INTEGER DEFAULT 0,
    non_billable_minutes INTEGER DEFAULT 0,
    total_minutes INTEGER DEFAULT 0,
    
    -- Billable summary
    billable_minutes INTEGER DEFAULT 0,
    billable_amount DECIMAL(12,2) DEFAULT 0,
    non_billable_minutes_count INTEGER DEFAULT 0,
    
    -- Entry counts
    total_entries INTEGER DEFAULT 0,
    approved_entries INTEGER DEFAULT 0,
    pending_entries INTEGER DEFAULT 0,
    
    -- Utilization metrics
    utilization_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN total_minutes > 0 THEN (billable_minutes::DECIMAL / total_minutes::DECIMAL) * 100
            ELSE 0
        END
    ) STORED,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_user_date_summary UNIQUE (user_id, summary_date)
);

-- ====================================
-- AUTOMATED TIME TRACKING
-- ====================================

-- Active Time Sessions - For running timers
CREATE TABLE active_time_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- Session details
    session_name VARCHAR(255),
    entry_type VARCHAR(50) NOT NULL,
    matter_id UUID REFERENCES matters(id),
    client_subscription_id UUID REFERENCES client_subscriptions(id),
    task_category VARCHAR(100),
    activity_description TEXT,
    
    -- Timer details
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_heartbeat TIMESTAMP WITH TIME ZONE,
    pause_duration_minutes INTEGER DEFAULT 0,
    
    -- Session state
    is_paused BOOLEAN DEFAULT FALSE,
    paused_at TIMESTAMP WITH TIME ZONE,
    device_info VARCHAR(255),
    ip_address INET,
    
    -- Auto-save interval
    last_auto_save TIMESTAMP WITH TIME ZONE,
    auto_save_interval_minutes INTEGER DEFAULT 5,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- INDEXES FOR PERFORMANCE
-- ====================================

-- Time entries indexes
CREATE INDEX idx_time_entries_law_firm ON time_entries(law_firm_id);
CREATE INDEX idx_time_entries_user_date ON time_entries(user_id, entry_date);
CREATE INDEX idx_time_entries_matter ON time_entries(matter_id) WHERE matter_id IS NOT NULL;
CREATE INDEX idx_time_entries_subscription ON time_entries(client_subscription_id) WHERE client_subscription_id IS NOT NULL;
CREATE INDEX idx_time_entries_status ON time_entries(entry_status);
CREATE INDEX idx_time_entries_billable ON time_entries(is_billable, entry_status);
CREATE INDEX idx_time_entries_timer ON time_entries(is_timer_running) WHERE is_timer_running = TRUE;
CREATE INDEX idx_time_entries_billing ON time_entries(invoice_id) WHERE invoice_id IS NOT NULL;

-- Time entry templates indexes
CREATE INDEX idx_time_entry_templates_user ON time_entry_templates(user_id, is_active);
CREATE INDEX idx_time_entry_templates_shared ON time_entry_templates(law_firm_id, is_shared) WHERE is_shared = TRUE;

-- Billing rates indexes
CREATE INDEX idx_lawyer_billing_rates_user ON lawyer_billing_rates(user_id, is_active);
CREATE INDEX idx_lawyer_billing_rates_effective ON lawyer_billing_rates(effective_from, effective_until);
CREATE INDEX idx_lawyer_billing_rates_matter ON lawyer_billing_rates(matter_id) WHERE matter_id IS NOT NULL;
CREATE INDEX idx_lawyer_billing_rates_client ON lawyer_billing_rates(client_id) WHERE client_id IS NOT NULL;

-- Subscription allocation indexes
CREATE INDEX idx_subscription_allocations_subscription ON subscription_time_allocations(client_subscription_id);
CREATE INDEX idx_subscription_allocations_month ON subscription_time_allocations(allocation_month);
CREATE INDEX idx_subscription_allocations_status ON subscription_time_allocations(allocation_status);

-- Time allocation indexes
CREATE INDEX idx_time_entry_allocations_entry ON time_entry_allocations(time_entry_id);
CREATE INDEX idx_time_entry_allocations_subscription ON time_entry_allocations(subscription_time_allocation_id);

-- Daily summaries indexes
CREATE INDEX idx_daily_summaries_user_date ON daily_time_summaries(user_id, summary_date);
CREATE INDEX idx_daily_summaries_law_firm_date ON daily_time_summaries(law_firm_id, summary_date);

-- Active sessions indexes
CREATE INDEX idx_active_sessions_user ON active_time_sessions(user_id);
CREATE INDEX idx_active_sessions_heartbeat ON active_time_sessions(last_heartbeat);

-- ====================================
-- TRIGGERS FOR AUTOMATION
-- ====================================

-- Update updated_at timestamp
CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON time_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_entry_templates_updated_at BEFORE UPDATE ON time_entry_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lawyer_billing_rates_updated_at BEFORE UPDATE ON lawyer_billing_rates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_time_allocations_updated_at BEFORE UPDATE ON subscription_time_allocations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_time_summaries_updated_at BEFORE UPDATE ON daily_time_summaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- FUNCTIONS FOR TIME TRACKING
-- ====================================

-- Function to update subscription time allocation when time entry is added
CREATE OR REPLACE FUNCTION update_subscription_time_allocation()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process if this is subscription work
    IF NEW.client_subscription_id IS NOT NULL AND NEW.counts_toward_subscription = TRUE THEN
        
        -- Update the subscription time allocation for this month
        INSERT INTO subscription_time_allocations (
            client_subscription_id,
            law_firm_id,
            allocation_month,
            total_minutes_allocated,
            total_minutes_used
        )
        VALUES (
            NEW.client_subscription_id,
            NEW.law_firm_id,
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
        
        -- Create time entry allocation record
        INSERT INTO time_entry_allocations (
            time_entry_id,
            subscription_time_allocation_id,
            allocated_minutes,
            allocation_type,
            service_type
        )
        SELECT 
            NEW.id,
            sta.id,
            NEW.effective_minutes,
            CASE 
                WHEN sta.total_minutes_used <= sta.total_minutes_allocated THEN 'included'
                ELSE 'overage'
            END,
            NEW.subscription_service_type
        FROM subscription_time_allocations sta
        WHERE sta.client_subscription_id = NEW.client_subscription_id
        AND sta.allocation_month = DATE_TRUNC('month', NEW.entry_date);
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscription_allocation_after_time_entry
    AFTER INSERT OR UPDATE ON time_entries
    FOR EACH ROW EXECUTE FUNCTION update_subscription_time_allocation();

-- Function to automatically create daily summaries
CREATE OR REPLACE FUNCTION update_daily_time_summary()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO daily_time_summaries (
        law_firm_id,
        user_id,
        summary_date,
        case_work_minutes,
        subscription_work_minutes,
        administrative_minutes,
        non_billable_minutes,
        total_minutes,
        billable_minutes,
        billable_amount,
        total_entries,
        approved_entries,
        pending_entries
    )
    SELECT 
        NEW.law_firm_id,
        NEW.user_id,
        NEW.entry_date,
        SUM(CASE WHEN entry_type = 'case_work' THEN effective_minutes ELSE 0 END),
        SUM(CASE WHEN entry_type = 'subscription_work' THEN effective_minutes ELSE 0 END),
        SUM(CASE WHEN entry_type = 'administrative' THEN effective_minutes ELSE 0 END),
        SUM(CASE WHEN is_billable = FALSE THEN effective_minutes ELSE 0 END),
        SUM(effective_minutes),
        SUM(CASE WHEN is_billable = TRUE THEN effective_minutes ELSE 0 END),
        SUM(billable_amount),
        COUNT(*),
        SUM(CASE WHEN entry_status = 'approved' THEN 1 ELSE 0 END),
        SUM(CASE WHEN entry_status IN ('draft', 'submitted') THEN 1 ELSE 0 END)
    FROM time_entries
    WHERE law_firm_id = NEW.law_firm_id 
    AND user_id = NEW.user_id 
    AND entry_date = NEW.entry_date
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

CREATE TRIGGER update_daily_summary_after_time_entry
    AFTER INSERT OR UPDATE OR DELETE ON time_entries
    FOR EACH ROW EXECUTE FUNCTION update_daily_time_summary();

-- ====================================
-- ROW LEVEL SECURITY (RLS)
-- ====================================

-- Enable RLS on all tables
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entry_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_billing_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_time_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entry_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_time_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_time_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for time_entries
CREATE POLICY time_entries_law_firm_isolation ON time_entries
    FOR ALL USING (law_firm_id IN (
        SELECT law_firm_id FROM users WHERE id = auth.uid()
    ));

-- RLS Policies for time_entry_templates
CREATE POLICY time_entry_templates_law_firm_isolation ON time_entry_templates
    FOR ALL USING (law_firm_id IN (
        SELECT law_firm_id FROM users WHERE id = auth.uid()
    ));

-- RLS Policies for lawyer_billing_rates
CREATE POLICY lawyer_billing_rates_law_firm_isolation ON lawyer_billing_rates
    FOR ALL USING (law_firm_id IN (
        SELECT law_firm_id FROM users WHERE id = auth.uid()
    ));

-- RLS Policies for subscription_time_allocations
CREATE POLICY subscription_time_allocations_law_firm_isolation ON subscription_time_allocations
    FOR ALL USING (law_firm_id IN (
        SELECT law_firm_id FROM users WHERE id = auth.uid()
    ));

-- RLS Policies for time_entry_allocations
CREATE POLICY time_entry_allocations_law_firm_isolation ON time_entry_allocations
    FOR ALL USING (time_entry_id IN (
        SELECT id FROM time_entries WHERE law_firm_id IN (
            SELECT law_firm_id FROM users WHERE id = auth.uid()
        )
    ));

-- RLS Policies for daily_time_summaries
CREATE POLICY daily_time_summaries_law_firm_isolation ON daily_time_summaries
    FOR ALL USING (law_firm_id IN (
        SELECT law_firm_id FROM users WHERE id = auth.uid()
    ));

-- RLS Policies for active_time_sessions
CREATE POLICY active_time_sessions_law_firm_isolation ON active_time_sessions
    FOR ALL USING (law_firm_id IN (
        SELECT law_firm_id FROM users WHERE id = auth.uid()
    ));

-- ====================================
-- SEED DATA: Default Templates & Rates
-- ====================================

-- Default Time Entry Templates (to be inserted per law firm)
/*
INSERT INTO time_entry_templates (law_firm_id, user_id, template_name, template_category, default_entry_type, default_task_category, default_activity_description, default_duration_minutes, default_is_billable) VALUES
('{law_firm_id}', '{user_id}', 'Reunião com Cliente', 'Atendimento', 'case_work', 'Client Meeting', 'Reunião de acompanhamento do processo', 60, true),
('{law_firm_id}', '{user_id}', 'Pesquisa Jurisprudencial', 'Pesquisa', 'case_work', 'Research', 'Pesquisa de jurisprudência e doutrina', 120, true),
('{law_firm_id}', '{user_id}', 'Redação de Petição', 'Redação', 'case_work', 'Document Drafting', 'Elaboração de petição inicial', 180, true),
('{law_firm_id}', '{user_id}', 'Audiência Judicial', 'Comparecimento', 'case_work', 'Court Appearance', 'Comparecimento em audiência', 240, true),
('{law_firm_id}', '{user_id}', 'Consulta Jurídica', 'Consultoria', 'subscription_work', 'Consultation', 'Consultoria jurídica para cliente assinante', 30, true),
('{law_firm_id}', '{user_id}', 'Revisão de Contrato', 'Revisão', 'subscription_work', 'Document Review', 'Análise e revisão de contrato', 90, true),
('{law_firm_id}', '{user_id}', 'Email Jurídico', 'Comunicação', 'subscription_work', 'Email Support', 'Resposta a dúvida jurídica por email', 15, true),
('{law_firm_id}', '{user_id}', 'Administração', 'Gestão', 'administrative', 'Administrative', 'Atividades administrativas gerais', 30, false);
*/

-- Default Billing Rate Categories
/*
INSERT INTO lawyer_billing_rates (law_firm_id, user_id, rate_type, rate_category, hourly_rate, effective_from) VALUES
('{law_firm_id}', '{user_id}', 'standard', 'Advogado Júnior', 200.00, CURRENT_DATE),
('{law_firm_id}', '{user_id}', 'standard', 'Advogado Pleno', 350.00, CURRENT_DATE),
('{law_firm_id}', '{user_id}', 'standard', 'Advogado Sênior', 500.00, CURRENT_DATE),
('{law_firm_id}', '{user_id}', 'standard', 'Sócio', 750.00, CURRENT_DATE),
('{law_firm_id}', '{user_id}', 'subscription', 'Consultoria Assinante', 150.00, CURRENT_DATE);
*/

COMMENT ON SCHEMA public IS 'Phase 8.6.1: Time Tracking Integration Schema - Complete lawyer time management with love ❤️';