-- Phase 8.7.1: Dual Invoice System Database Schema
-- Comprehensive invoice schema supporting subscription invoices, case invoices, and payment plan invoices
-- Integrates with existing billing infrastructure and financial management

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. INVOICE TYPES AND CONFIGURATIONS
-- =============================================

-- Central invoice registry with different types
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
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
        'draft',           -- Being prepared
        'pending_review',  -- Awaiting approval
        'approved',        -- Ready to send
        'sent',           -- Sent to client
        'viewed',         -- Client viewed invoice
        'paid',           -- Fully paid
        'partial_paid',   -- Partially paid
        'overdue',        -- Past due date
        'disputed',       -- Client disputed
        'cancelled',      -- Cancelled
        'refunded'        -- Refunded
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
    payment_methods TEXT[], -- Array of accepted payment methods
    
    -- References to source records
    client_subscription_id UUID REFERENCES client_subscriptions(id),
    matter_id UUID REFERENCES matters(id),
    payment_plan_id UUID REFERENCES payment_plans(id),
    
    -- Grouping and consolidation
    parent_invoice_id UUID REFERENCES invoices(id), -- For grouped/consolidated invoices
    invoice_group VARCHAR(100), -- For batch processing
    
    -- Invoice content
    description TEXT,
    notes TEXT,
    internal_notes TEXT,
    
    -- Metadata
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT positive_amounts CHECK (
        subtotal >= 0 AND 
        tax_amount >= 0 AND 
        discount_amount >= 0 AND 
        total_amount >= 0
    ),
    CONSTRAINT total_calculation CHECK (
        total_amount = subtotal + tax_amount - discount_amount
    )
);

-- =============================================
-- 2. INVOICE LINE ITEMS
-- =============================================

CREATE TABLE invoice_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    
    -- Line item details
    line_type VARCHAR(30) NOT NULL CHECK (line_type IN (
        'subscription_fee',    -- Monthly/yearly subscription
        'case_fee',           -- Case billing (hourly/fixed/percentage)
        'success_fee',        -- Success fee from case outcome
        'time_entry',         -- Individual time entry
        'expense',            -- Case expenses
        'discount',           -- Applied discount
        'tax',               -- Tax line item
        'adjustment',        -- Manual adjustment
        'late_fee',          -- Late payment fee
        'service_fee'        -- Additional service fees
    )),
    
    -- Description and details
    description TEXT NOT NULL,
    
    -- Quantity and pricing
    quantity DECIMAL(10,4) NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    line_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    
    -- References to source data
    time_entry_id UUID REFERENCES time_entries(id),
    service_inclusion_id UUID REFERENCES service_inclusions(id),
    case_billing_id UUID REFERENCES case_billing(id),
    case_outcome_id UUID REFERENCES case_outcomes(id),
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
    CONSTRAINT positive_line_amounts CHECK (
        quantity > 0 AND 
        unit_price >= 0 AND 
        line_total >= 0
    ),
    CONSTRAINT line_total_calculation CHECK (
        line_total = quantity * unit_price
    )
);

-- =============================================
-- 3. SUBSCRIPTION INVOICE MANAGEMENT
-- =============================================

CREATE TABLE subscription_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    client_subscription_id UUID NOT NULL REFERENCES client_subscriptions(id) ON DELETE CASCADE,
    
    -- Billing period
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly')),
    
    -- Service usage tracking
    services_included JSONB, -- Services included in this billing period
    services_used JSONB,     -- Services actually used
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

-- =============================================
-- 4. CASE INVOICE MANAGEMENT
-- =============================================

CREATE TABLE case_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    case_billing_id UUID REFERENCES case_billing(id),
    
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

-- =============================================
-- 5. PAYMENT PLAN INVOICE MANAGEMENT
-- =============================================

CREATE TABLE payment_plan_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    payment_plan_id UUID NOT NULL REFERENCES payment_plans(id) ON DELETE CASCADE,
    
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
        installment_number > 0 AND 
        installment_number <= total_installments
    )
);

-- =============================================
-- 6. TIME-BASED INVOICE MANAGEMENT
-- =============================================

CREATE TABLE time_based_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
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

-- =============================================
-- 7. INVOICE PAYMENTS TRACKING
-- =============================================

CREATE TABLE invoice_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
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
    processor VARCHAR(50), -- stripe, pagseguro, etc.
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
    recorded_by UUID REFERENCES users(id),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT positive_payment_amount CHECK (payment_amount > 0)
);

-- =============================================
-- 8. INVOICE TEMPLATES AND AUTOMATION
-- =============================================

CREATE TABLE invoice_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    
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

-- =============================================
-- 9. INVOICE GENERATION LOGS
-- =============================================

CREATE TABLE invoice_generation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    
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
    triggered_by UUID REFERENCES users(id),
    
    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled'))
);

-- =============================================
-- 10. INDEXES FOR PERFORMANCE
-- =============================================

-- Primary lookup indexes
CREATE INDEX idx_invoices_law_firm_id ON invoices(law_firm_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_status ON invoices(invoice_status);
CREATE INDEX idx_invoices_type ON invoices(invoice_type);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_issue_date ON invoices(issue_date);

-- Foreign key indexes
CREATE INDEX idx_invoices_subscription_id ON invoices(client_subscription_id);
CREATE INDEX idx_invoices_matter_id ON invoices(matter_id);
CREATE INDEX idx_invoices_payment_plan_id ON invoices(payment_plan_id);

-- Line items indexes
CREATE INDEX idx_line_items_invoice_id ON invoice_line_items(invoice_id);
CREATE INDEX idx_line_items_type ON invoice_line_items(line_type);
CREATE INDEX idx_line_items_time_entry ON invoice_line_items(time_entry_id);

-- Specialized table indexes
CREATE INDEX idx_subscription_invoices_billing_period ON subscription_invoices(billing_period_start, billing_period_end);
CREATE INDEX idx_case_invoices_matter_id ON case_invoices(matter_id);
CREATE INDEX idx_payment_plan_invoices_schedule ON payment_plan_invoices(scheduled_date);
CREATE INDEX idx_time_based_invoices_period ON time_based_invoices(billing_period_start, billing_period_end);

-- Payment tracking indexes
CREATE INDEX idx_invoice_payments_invoice_id ON invoice_payments(invoice_id);
CREATE INDEX idx_invoice_payments_date ON invoice_payments(payment_date);
CREATE INDEX idx_invoice_payments_status ON invoice_payments(payment_status);

-- Composite indexes for common queries
CREATE INDEX idx_invoices_client_status ON invoices(client_id, invoice_status);
CREATE INDEX idx_invoices_firm_type_status ON invoices(law_firm_id, invoice_type, invoice_status);
CREATE INDEX idx_overdue_invoices ON invoices(law_firm_id, due_date, invoice_status) 
  WHERE invoice_status IN ('sent', 'viewed', 'partial_paid', 'overdue');

-- =============================================
-- 11. ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_plan_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_based_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_generation_logs ENABLE ROW LEVEL SECURITY;

-- Policies for multi-tenant access
CREATE POLICY "invoices_tenant_isolation" ON invoices
  FOR ALL USING (law_firm_id = current_setting('app.current_law_firm_id')::UUID);

CREATE POLICY "invoice_line_items_tenant_isolation" ON invoice_line_items
  FOR ALL USING (law_firm_id = current_setting('app.current_law_firm_id')::UUID);

CREATE POLICY "subscription_invoices_tenant_isolation" ON subscription_invoices
  FOR ALL USING (law_firm_id = current_setting('app.current_law_firm_id')::UUID);

CREATE POLICY "case_invoices_tenant_isolation" ON case_invoices
  FOR ALL USING (law_firm_id = current_setting('app.current_law_firm_id')::UUID);

CREATE POLICY "payment_plan_invoices_tenant_isolation" ON payment_plan_invoices
  FOR ALL USING (law_firm_id = current_setting('app.current_law_firm_id')::UUID);

CREATE POLICY "time_based_invoices_tenant_isolation" ON time_based_invoices
  FOR ALL USING (law_firm_id = current_setting('app.current_law_firm_id')::UUID);

CREATE POLICY "invoice_payments_tenant_isolation" ON invoice_payments
  FOR ALL USING (law_firm_id = current_setting('app.current_law_firm_id')::UUID);

CREATE POLICY "invoice_templates_tenant_isolation" ON invoice_templates
  FOR ALL USING (law_firm_id = current_setting('app.current_law_firm_id')::UUID);

CREATE POLICY "invoice_generation_logs_tenant_isolation" ON invoice_generation_logs
  FOR ALL USING (law_firm_id = current_setting('app.current_law_firm_id')::UUID);

-- =============================================
-- 12. TRIGGERS AND FUNCTIONS
-- =============================================

-- Function to update invoice totals when line items change
CREATE OR REPLACE FUNCTION update_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate invoice totals based on line items
  UPDATE invoices 
  SET 
    subtotal = (
      SELECT COALESCE(SUM(line_total), 0) 
      FROM invoice_line_items 
      WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
        AND line_type NOT IN ('tax', 'discount')
    ),
    tax_amount = (
      SELECT COALESCE(SUM(line_total), 0) 
      FROM invoice_line_items 
      WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
        AND line_type = 'tax'
    ),
    discount_amount = (
      SELECT COALESCE(SUM(ABS(line_total)), 0) 
      FROM invoice_line_items 
      WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
        AND line_type = 'discount'
    ),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  -- Update total_amount based on subtotal + tax - discount
  UPDATE invoices 
  SET total_amount = subtotal + tax_amount - discount_amount,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update invoice totals
CREATE TRIGGER update_invoice_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON invoice_line_items
  FOR EACH ROW EXECUTE FUNCTION update_invoice_totals();

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
  
  -- Get next sequence number for this year and type
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

-- Function to auto-generate invoice number on insert
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := generate_invoice_number(NEW.law_firm_id, NEW.invoice_type);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set invoice number
CREATE TRIGGER set_invoice_number_trigger
  BEFORE INSERT ON invoices
  FOR EACH ROW EXECUTE FUNCTION set_invoice_number();

-- Function to update invoice status based on payments
CREATE OR REPLACE FUNCTION update_invoice_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  v_total_paid DECIMAL(12,2);
  v_invoice_total DECIMAL(12,2);
  v_new_status VARCHAR(20);
BEGIN
  -- Get total payments for the invoice
  SELECT COALESCE(SUM(payment_amount), 0)
  INTO v_total_paid
  FROM invoice_payments
  WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
    AND payment_status = 'completed';
  
  -- Get invoice total
  SELECT total_amount
  INTO v_invoice_total
  FROM invoices
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
  
  -- Determine new status
  IF v_total_paid = 0 THEN
    v_new_status := 'sent'; -- Keep existing status if no payments
  ELSIF v_total_paid >= v_invoice_total THEN
    v_new_status := 'paid';
  ELSE
    v_new_status := 'partial_paid';
  END IF;
  
  -- Update invoice status if it changed
  UPDATE invoices
  SET 
    invoice_status = v_new_status,
    paid_date = CASE WHEN v_new_status = 'paid' THEN CURRENT_DATE ELSE NULL END,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id)
    AND invoice_status != v_new_status;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update invoice status on payment changes
CREATE TRIGGER update_invoice_payment_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON invoice_payments
  FOR EACH ROW EXECUTE FUNCTION update_invoice_payment_status();

-- =============================================
-- 13. SAMPLE DATA FOR TESTING
-- =============================================

-- Note: Sample data will be inserted by the application service layer
-- This provides the foundation for comprehensive invoice management

COMMENT ON TABLE invoices IS 'Central invoice registry supporting subscription, case, and payment plan billing';
COMMENT ON TABLE invoice_line_items IS 'Detailed line items for each invoice with source tracking';
COMMENT ON TABLE subscription_invoices IS 'Subscription-specific invoice details and usage tracking';
COMMENT ON TABLE case_invoices IS 'Case billing invoice details with multiple billing methods';
COMMENT ON TABLE payment_plan_invoices IS 'Payment plan installment invoice management';
COMMENT ON TABLE time_based_invoices IS 'Time tracking based invoice aggregation';
COMMENT ON TABLE invoice_payments IS 'Payment tracking and allocation for invoices';
COMMENT ON TABLE invoice_templates IS 'Invoice templates and automation rules';
COMMENT ON TABLE invoice_generation_logs IS 'Audit log for invoice generation processes';