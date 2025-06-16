-- =============================================
-- STEP 3: DUAL INVOICE SYSTEM MIGRATION
-- =============================================

-- Drop existing incompatible invoice tables
DROP TABLE IF EXISTS dual_invoices CASCADE;
DROP TABLE IF EXISTS invoice_types CASCADE;
DROP TABLE IF EXISTS invoice_configurations CASCADE;

-- If invoices exists with different schema, rename it
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'invoices') THEN
        -- Check if it has our expected schema
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'invoices' 
            AND column_name = 'invoice_type'
            AND data_type = 'character varying'
        ) THEN
            EXECUTE 'ALTER TABLE invoices RENAME TO invoices_old_' || to_char(now(), 'YYYYMMDD');
            RAISE NOTICE 'Renamed existing invoices table to preserve data';
        END IF;
    END IF;
END $$;

-- Central invoice registry with different types
CREATE TABLE IF NOT EXISTS invoices (
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
CREATE TABLE IF NOT EXISTS invoice_line_items (
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
CREATE TABLE IF NOT EXISTS subscription_invoices (
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
CREATE TABLE IF NOT EXISTS case_invoices (
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
CREATE TABLE IF NOT EXISTS payment_plan_invoices (
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
CREATE TABLE IF NOT EXISTS time_based_invoices (
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
CREATE TABLE IF NOT EXISTS invoice_payments (
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
CREATE TABLE IF NOT EXISTS invoice_templates (
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
CREATE TABLE IF NOT EXISTS invoice_generation_logs (
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_invoices_law_firm_id ON invoices(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(invoice_status);
CREATE INDEX IF NOT EXISTS idx_invoices_type ON invoices(invoice_type);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_plan_invoices ENABLE ROW LEVEL SECURITY;

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

-- Verification
SELECT 'Invoice system tables created successfully' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('invoices', 'invoice_line_items', 'subscription_invoices', 'case_invoices', 'payment_plan_invoices')
ORDER BY table_name;