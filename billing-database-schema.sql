-- =====================================================
-- PHASE 8.1: HYBRID LEGAL BILLING & SUBSCRIPTION SYSTEM
-- Legal-as-a-Service (LaaS) Platform Database Schema
-- =====================================================

-- Enable UUID extension for PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- SUBSCRIPTION SYSTEM TABLES
-- =====================================================

-- Subscription Plans (Product Catalog)
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    plan_name VARCHAR(100) NOT NULL,
    plan_type VARCHAR(50) NOT NULL, -- 'labor', 'corporate', 'criminal', 'family', 'general'
    description TEXT,
    monthly_fee DECIMAL(10,2),
    yearly_fee DECIMAL(10,2),
    setup_fee DECIMAL(10,2) DEFAULT 0,
    
    -- Service Inclusions (JSON structure for flexibility)
    services_included JSONB DEFAULT '[]'::jsonb, 
    -- Example: ['compliance_review', 'email_support', 'document_review', 'phone_consultation']
    
    max_monthly_hours INTEGER DEFAULT 0, -- included consultation hours
    max_document_reviews INTEGER DEFAULT 0, -- included document reviews
    support_level VARCHAR(50) DEFAULT 'email', -- 'email', 'phone', 'priority', '24_7'
    
    -- Billing configuration
    billing_interval VARCHAR(20) DEFAULT 'monthly', -- 'monthly', 'yearly'
    trial_period_days INTEGER DEFAULT 0,
    
    -- Status and metadata
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_billing_interval CHECK (billing_interval IN ('monthly', 'yearly')),
    CONSTRAINT valid_support_level CHECK (support_level IN ('email', 'phone', 'priority', '24_7'))
);

-- Client Subscriptions (Active Subscriptions)
CREATE TABLE client_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    subscription_plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
    
    -- Subscription lifecycle
    status VARCHAR(20) NOT NULL DEFAULT 'trial', 
    -- 'trial', 'active', 'past_due', 'cancelled', 'unpaid', 'paused'
    
    -- Billing cycle management
    billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly', -- 'monthly', 'yearly'
    auto_renew BOOLEAN DEFAULT true,
    
    -- Date management
    start_date DATE NOT NULL,
    end_date DATE, -- NULL for active subscriptions
    trial_end_date DATE,
    current_period_start DATE,
    current_period_end DATE,
    next_billing_date DATE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    
    -- Payment integration
    stripe_subscription_id VARCHAR(100) UNIQUE,
    stripe_customer_id VARCHAR(100),
    
    -- Pricing (captured at subscription time for historical accuracy)
    monthly_fee DECIMAL(10,2),
    yearly_fee DECIMAL(10,2),
    current_fee DECIMAL(10,2), -- actual fee being charged
    
    -- Metadata
    notes TEXT,
    cancellation_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_subscription_status CHECK (status IN (
        'trial', 'active', 'past_due', 'cancelled', 'unpaid', 'paused'
    )),
    CONSTRAINT valid_billing_cycle CHECK (billing_cycle IN ('monthly', 'yearly'))
);

-- Subscription Service Usage Tracking
CREATE TABLE subscription_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_subscription_id UUID NOT NULL REFERENCES client_subscriptions(id) ON DELETE CASCADE,
    
    -- Service tracking
    service_type VARCHAR(50) NOT NULL, 
    -- 'consultation_hours', 'document_reviews', 'support_tickets', 'phone_calls'
    
    usage_date DATE NOT NULL,
    quantity_used DECIMAL(10,2) NOT NULL,
    unit_type VARCHAR(20) DEFAULT 'hours', -- 'hours', 'documents', 'calls', 'tickets'
    
    -- Billing implications
    included_in_plan BOOLEAN DEFAULT true,
    overage_amount DECIMAL(10,2) DEFAULT 0, -- if exceeds plan limits
    overage_rate DECIMAL(10,2), -- rate per unit for overages
    
    -- Context
    description TEXT,
    matter_id UUID REFERENCES matters(id), -- if related to specific case
    staff_user_id UUID REFERENCES users(id), -- who provided the service
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_service_type CHECK (service_type IN (
        'consultation_hours', 'document_reviews', 'support_tickets', 'phone_calls'
    ))
);

-- Subscription Invoices (Recurring Billing)
CREATE TABLE subscription_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_subscription_id UUID NOT NULL REFERENCES client_subscriptions(id) ON DELETE CASCADE,
    
    -- Invoice details
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Amounts
    subtotal DECIMAL(10,2) NOT NULL,
    overage_charges DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Status and dates
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    -- 'draft', 'sent', 'paid', 'overdue', 'void', 'failed'
    
    due_date DATE NOT NULL,
    sent_date DATE,
    paid_date DATE,
    
    -- Payment tracking
    stripe_invoice_id VARCHAR(100) UNIQUE,
    payment_method VARCHAR(50), -- 'card', 'bank_transfer', 'pix', 'boleto'
    
    -- Metadata
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_invoice_status CHECK (status IN (
        'draft', 'sent', 'paid', 'overdue', 'void', 'failed'
    ))
);

-- =====================================================
-- CASE BILLING SYSTEM TABLES
-- =====================================================

-- Case Types with Business Rules
CREATE TABLE case_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    
    -- Type definition
    name VARCHAR(100) NOT NULL, -- 'Labor Litigation', 'Corporate Dispute', etc.
    code VARCHAR(20) NOT NULL, -- 'LAB_LIT', 'CORP_DISP'
    category VARCHAR(50), -- 'labor', 'corporate', 'criminal', 'family'
    
    -- Minimum fee structure
    minimum_fee_hourly DECIMAL(10,2) DEFAULT 0,
    minimum_fee_percentage DECIMAL(10,2) DEFAULT 0,
    minimum_fee_fixed DECIMAL(10,2) DEFAULT 0,
    
    -- Default billing configuration
    default_billing_method VARCHAR(20) DEFAULT 'hourly', -- 'hourly', 'percentage', 'fixed'
    default_hourly_rate DECIMAL(10,2),
    default_percentage_rate DECIMAL(5,2),
    default_success_fee_rate DECIMAL(5,2),
    
    -- Complexity factors
    complexity_multiplier DECIMAL(3,2) DEFAULT 1.0, -- affects base rates
    estimated_hours_range VARCHAR(50), -- '20-40 hours', '100-200 hours'
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(law_firm_id, code),
    CONSTRAINT valid_billing_method CHECK (default_billing_method IN ('hourly', 'percentage', 'fixed'))
);

-- Case Billing Methods (Per Matter Configuration)
CREATE TABLE case_billing_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    case_type_id UUID REFERENCES case_types(id),
    
    -- Primary billing method
    billing_type VARCHAR(20) NOT NULL, -- 'hourly', 'percentage', 'fixed'
    
    -- Rate configuration
    hourly_rate DECIMAL(10,2), -- for hourly billing
    percentage_rate DECIMAL(5,2), -- percentage of case total value
    fixed_amount DECIMAL(10,2), -- for fixed fee billing
    
    -- Success fee configuration
    success_fee_percentage DECIMAL(5,2) DEFAULT 0,
    success_fee_applies_to VARCHAR(20) DEFAULT 'recovered', -- 'recovered', 'total'
    
    -- Minimum fee enforcement
    minimum_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
    minimum_fee_source VARCHAR(20) DEFAULT 'case_type', -- 'case_type', 'custom'
    
    -- Subscription discount tracking
    has_subscription_discount BOOLEAN DEFAULT false,
    original_amount DECIMAL(10,2), -- before discount
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    final_amount DECIMAL(10,2), -- after discount and minimum fee
    
    -- Approval workflow
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'approved', 'active'
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_billing_type CHECK (billing_type IN ('hourly', 'percentage', 'fixed')),
    CONSTRAINT valid_success_fee_applies_to CHECK (success_fee_applies_to IN ('recovered', 'total'))
);

-- =====================================================
-- PAYMENT PLAN SYSTEM TABLES
-- =====================================================

-- Payment Plans (Installment Management)
CREATE TABLE payment_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    case_billing_method_id UUID REFERENCES case_billing_methods(id),
    
    -- Plan structure
    total_amount DECIMAL(10,2) NOT NULL,
    installments_count INTEGER NOT NULL CHECK (installments_count > 0),
    installment_amount DECIMAL(10,2) NOT NULL,
    
    -- Schedule configuration
    first_payment_date DATE NOT NULL,
    payment_frequency VARCHAR(20) NOT NULL DEFAULT 'monthly', 
    -- 'weekly', 'bi_weekly', 'monthly', 'quarterly'
    
    -- Plan status
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    -- 'draft', 'active', 'completed', 'defaulted', 'cancelled'
    
    -- Financial tracking
    total_paid DECIMAL(10,2) DEFAULT 0,
    balance_remaining DECIMAL(10,2),
    late_fees_total DECIMAL(10,2) DEFAULT 0,
    
    -- Configuration
    late_fee_percentage DECIMAL(5,2) DEFAULT 0, -- per month late
    grace_period_days INTEGER DEFAULT 5,
    auto_charge_enabled BOOLEAN DEFAULT false,
    
    -- Metadata
    notes TEXT,
    created_by UUID REFERENCES users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_payment_frequency CHECK (payment_frequency IN (
        'weekly', 'bi_weekly', 'monthly', 'quarterly'
    )),
    CONSTRAINT valid_plan_status CHECK (status IN (
        'draft', 'active', 'completed', 'defaulted', 'cancelled'
    ))
);

-- Individual Payment Installments
CREATE TABLE payment_installments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_plan_id UUID NOT NULL REFERENCES payment_plans(id) ON DELETE CASCADE,
    
    -- Installment details
    installment_number INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    
    -- Payment status
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- 'pending', 'paid', 'partial', 'overdue', 'failed', 'skipped'
    
    -- Payment tracking
    paid_date DATE,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    balance_remaining DECIMAL(10,2),
    
    -- Late fees
    late_fee DECIMAL(10,2) DEFAULT 0,
    days_overdue INTEGER DEFAULT 0,
    
    -- Payment integration
    stripe_payment_intent_id VARCHAR(100),
    payment_method VARCHAR(50), -- 'card', 'bank_transfer', 'pix', 'cash'
    
    -- Communication tracking
    reminder_sent_count INTEGER DEFAULT 0,
    last_reminder_sent DATE,
    
    -- Metadata
    notes TEXT,
    processed_by UUID REFERENCES users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_installment_status CHECK (status IN (
        'pending', 'paid', 'partial', 'overdue', 'failed', 'skipped'
    )),
    UNIQUE(payment_plan_id, installment_number)
);

-- =====================================================
-- SUCCESS FEE & OUTCOME TRACKING TABLES
-- =====================================================

-- Case Outcomes for Success Fee Calculation
CREATE TABLE case_outcomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    
    -- Outcome classification
    outcome_type VARCHAR(50) NOT NULL,
    -- 'settlement', 'court_victory', 'partial_victory', 'loss', 'dismissed'
    
    outcome_subtype VARCHAR(50), -- 'monetary_settlement', 'injunctive_relief', etc.
    
    -- Financial tracking
    total_value_claimed DECIMAL(15,2), -- original lawsuit value
    effective_value_redeemed DECIMAL(15,2), -- actual amount recovered/saved
    settlement_amount DECIMAL(15,2), -- if settled
    court_award_amount DECIMAL(15,2), -- if court decision
    
    -- Success determination
    success_achieved BOOLEAN NOT NULL DEFAULT false,
    success_percentage DECIMAL(5,2), -- percentage of claim achieved
    
    -- Success fee calculation
    success_fee_percentage DECIMAL(5,2),
    success_fee_amount DECIMAL(15,2),
    success_fee_calculation_method VARCHAR(20) DEFAULT 'percentage',
    -- 'percentage', 'sliding_scale', 'fixed', 'custom'
    
    -- Timeline
    outcome_date DATE NOT NULL,
    final_payment_received_date DATE,
    
    -- Documentation
    court_decision_reference VARCHAR(200),
    settlement_agreement_reference VARCHAR(200),
    notes TEXT,
    
    -- Approval workflow
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_outcome_type CHECK (outcome_type IN (
        'settlement', 'court_victory', 'partial_victory', 'loss', 'dismissed'
    ))
);

-- Success Fee Invoicing
CREATE TABLE success_fee_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_outcome_id UUID NOT NULL REFERENCES case_outcomes(id) ON DELETE CASCADE,
    matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    
    -- Invoice details
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    
    -- Status and dates
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    -- 'draft', 'sent', 'paid', 'overdue', 'disputed', 'void'
    
    due_date DATE NOT NULL,
    sent_date DATE,
    paid_date DATE,
    
    -- Payment tracking
    stripe_invoice_id VARCHAR(100) UNIQUE,
    payment_method VARCHAR(50),
    
    -- Documentation
    calculation_details JSONB, -- detailed breakdown of success fee calculation
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_success_invoice_status CHECK (status IN (
        'draft', 'sent', 'paid', 'overdue', 'disputed', 'void'
    ))
);

-- =====================================================
-- DISCOUNT ENGINE TABLES
-- =====================================================

-- Discount Rules (Cross-selling Configuration)
CREATE TABLE discount_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    
    -- Rule identification
    rule_name VARCHAR(100) NOT NULL,
    rule_type VARCHAR(30) NOT NULL DEFAULT 'subscription_discount',
    -- 'subscription_discount', 'volume_discount', 'loyalty_discount', 'promotional'
    
    -- Applicability
    subscription_plan_id UUID REFERENCES subscription_plans(id), -- NULL for general rules
    case_type_id UUID REFERENCES case_types(id), -- NULL for all case types
    matter_category VARCHAR(50), -- 'labor', 'corporate', etc.
    litigation_type VARCHAR(50), -- specific litigation subtypes
    
    -- Discount configuration
    discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage',
    -- 'percentage', 'fixed_amount', 'tiered'
    
    discount_percentage DECIMAL(5,2), -- for percentage discounts
    discount_amount DECIMAL(10,2), -- for fixed amount discounts
    
    -- Constraints
    min_case_value DECIMAL(10,2) DEFAULT 0, -- minimum case value to apply discount
    max_discount_amount DECIMAL(10,2), -- cap on discount amount
    min_subscription_months INTEGER DEFAULT 0, -- minimum subscription duration
    
    -- Validity
    valid_from DATE,
    valid_until DATE,
    max_uses_per_client INTEGER, -- limit uses per client
    max_total_uses INTEGER, -- limit total uses across all clients
    current_uses INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_stackable BOOLEAN DEFAULT false, -- can combine with other discounts
    
    -- Metadata
    description TEXT,
    internal_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_discount_type CHECK (discount_type IN ('percentage', 'fixed_amount', 'tiered')),
    CONSTRAINT valid_rule_type CHECK (rule_type IN (
        'subscription_discount', 'volume_discount', 'loyalty_discount', 'promotional'
    ))
);

-- Applied Discounts (Audit Trail)
CREATE TABLE case_discounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    case_billing_method_id UUID REFERENCES case_billing_methods(id),
    client_subscription_id UUID REFERENCES client_subscriptions(id),
    discount_rule_id UUID NOT NULL REFERENCES discount_rules(id),
    
    -- Discount application
    original_amount DECIMAL(10,2) NOT NULL,
    discount_percentage DECIMAL(5,2),
    discount_amount DECIMAL(10,2) NOT NULL,
    final_amount DECIMAL(10,2) NOT NULL,
    
    -- Context
    application_reason TEXT,
    calculation_details JSONB, -- detailed breakdown
    
    -- Approval (for manual discounts)
    requires_approval BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TIME TRACKING INTEGRATION TABLES
-- =====================================================

-- Enhanced Time Entries with Billing Integration
CREATE TABLE time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID REFERENCES matters(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_subscription_id UUID REFERENCES client_subscriptions(id), -- if subscription time
    
    -- Time tracking
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    hours DECIMAL(4,2) NOT NULL CHECK (hours > 0),
    
    -- Billing classification
    billable BOOLEAN DEFAULT true,
    billing_category VARCHAR(50) DEFAULT 'case_work',
    -- 'case_work', 'subscription_service', 'administrative', 'business_development'
    
    service_type VARCHAR(50), -- links to subscription services
    -- 'consultation', 'document_review', 'court_appearance', 'research'
    
    -- Rate and billing
    hourly_rate DECIMAL(10,2), -- rate at time of entry
    billable_amount DECIMAL(10,2), -- hours × rate
    
    -- Billing status
    billing_status VARCHAR(20) DEFAULT 'pending',
    -- 'pending', 'invoiced', 'paid', 'written_off', 'non_billable'
    
    invoice_id UUID, -- will reference invoices table when created
    billing_date DATE, -- when included in invoice
    
    -- Description and context
    description TEXT NOT NULL,
    activity_code VARCHAR(20), -- standardized activity codes
    task_category VARCHAR(50),
    
    -- Approval workflow
    requires_approval BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    tags JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_billing_category CHECK (billing_category IN (
        'case_work', 'subscription_service', 'administrative', 'business_development'
    )),
    CONSTRAINT valid_billing_status CHECK (billing_status IN (
        'pending', 'invoiced', 'paid', 'written_off', 'non_billable'
    ))
);

-- =====================================================
-- UNIFIED INVOICING SYSTEM TABLES
-- =====================================================

-- Unified Invoices (Case + Subscription + Success Fees)
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    matter_id UUID REFERENCES matters(id), -- NULL for subscription-only invoices
    
    -- Invoice classification
    invoice_type VARCHAR(30) NOT NULL,
    -- 'case_billing', 'subscription', 'success_fee', 'mixed', 'expense_reimbursement'
    
    -- Invoice identification
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    reference_number VARCHAR(100), -- client's reference
    
    -- Financial details
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    time_charges DECIMAL(15,2) DEFAULT 0,
    expense_charges DECIMAL(15,2) DEFAULT 0,
    success_fee_amount DECIMAL(15,2) DEFAULT 0,
    subscription_charges DECIMAL(15,2) DEFAULT 0,
    
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    
    -- Payment tracking
    amount_paid DECIMAL(15,2) DEFAULT 0,
    amount_due DECIMAL(15,2),
    
    -- Status and dates
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    -- 'draft', 'sent', 'viewed', 'paid', 'partial', 'overdue', 'void', 'disputed'
    
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    sent_date DATE,
    viewed_date DATE,
    paid_date DATE,
    
    -- Payment terms
    payment_terms VARCHAR(20) DEFAULT 'net_30', -- 'immediate', 'net_15', 'net_30', 'net_60'
    late_fee_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Integration
    stripe_invoice_id VARCHAR(100) UNIQUE,
    payment_plan_id UUID REFERENCES payment_plans(id),
    
    -- Documentation
    notes TEXT,
    internal_notes TEXT,
    
    -- Approval workflow
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_invoice_type CHECK (invoice_type IN (
        'case_billing', 'subscription', 'success_fee', 'mixed', 'expense_reimbursement'
    )),
    CONSTRAINT valid_invoice_status CHECK (status IN (
        'draft', 'sent', 'viewed', 'paid', 'partial', 'overdue', 'void', 'disputed'
    )),
    CONSTRAINT valid_payment_terms CHECK (payment_terms IN (
        'immediate', 'net_15', 'net_30', 'net_60'
    ))
);

-- Invoice Line Items (Detailed Breakdown)
CREATE TABLE invoice_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    
    -- Line item details
    line_type VARCHAR(30) NOT NULL,
    -- 'time_entry', 'subscription_fee', 'success_fee', 'expense', 'discount', 'tax'
    
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_type VARCHAR(20) DEFAULT 'each', -- 'hours', 'documents', 'each', 'months'
    unit_rate DECIMAL(10,2),
    amount DECIMAL(15,2) NOT NULL,
    
    -- References
    time_entry_id UUID REFERENCES time_entries(id),
    subscription_invoice_id UUID REFERENCES subscription_invoices(id),
    success_fee_invoice_id UUID REFERENCES success_fee_invoices(id),
    
    -- Metadata
    billing_period_start DATE,
    billing_period_end DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_line_type CHECK (line_type IN (
        'time_entry', 'subscription_fee', 'success_fee', 'expense', 'discount', 'tax'
    ))
);

-- =====================================================
-- BUSINESS PARAMETERS & CONFIGURATION
-- =====================================================

-- Business Parameters (Law Firm Specific Configuration)
CREATE TABLE business_parameters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    
    -- Parameter identification
    parameter_category VARCHAR(50) NOT NULL,
    -- 'billing_rates', 'minimum_fees', 'success_fee_rates', 'payment_terms', 'tax_rates'
    
    parameter_name VARCHAR(100) NOT NULL,
    parameter_key VARCHAR(100) NOT NULL, -- for programmatic access
    
    -- Value storage (flexible types)
    parameter_value TEXT, -- can store JSON for complex values
    parameter_type VARCHAR(20) DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
    
    -- Constraints
    min_value DECIMAL(15,2),
    max_value DECIMAL(15,2),
    allowed_values TEXT[], -- array of allowed values
    
    -- Metadata
    description TEXT,
    unit VARCHAR(20), -- 'currency', 'percentage', 'hours', 'days'
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    requires_approval BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(law_firm_id, parameter_key)
);

-- =====================================================
-- FINANCIAL ANALYTICS & REPORTING VIEWS
-- =====================================================

-- Monthly Recurring Revenue (MRR) View
CREATE VIEW mrr_analytics AS
SELECT 
    law_firm_id,
    DATE_TRUNC('month', current_period_start) as month,
    COUNT(*) as active_subscriptions,
    SUM(current_fee) as monthly_recurring_revenue,
    AVG(current_fee) as average_revenue_per_user,
    COUNT(*) FILTER (WHERE status = 'trial') as trial_subscriptions,
    COUNT(*) FILTER (WHERE status = 'active') as paid_subscriptions
FROM client_subscriptions cs
JOIN subscription_plans sp ON cs.subscription_plan_id = sp.id
WHERE cs.status IN ('trial', 'active')
GROUP BY law_firm_id, DATE_TRUNC('month', current_period_start);

-- Case Profitability Analysis View
CREATE VIEW case_profitability AS
SELECT 
    m.id as matter_id,
    m.law_firm_id,
    m.title as case_title,
    cbm.billing_type,
    
    -- Revenue breakdown
    cbm.final_amount as base_billing,
    COALESCE(co.success_fee_amount, 0) as success_fee,
    (cbm.final_amount + COALESCE(co.success_fee_amount, 0)) as total_revenue,
    
    -- Cost calculation (time entries)
    COALESCE(SUM(te.billable_amount), 0) as total_time_cost,
    
    -- Profitability
    (cbm.final_amount + COALESCE(co.success_fee_amount, 0) - COALESCE(SUM(te.billable_amount), 0)) as profit,
    
    -- Metrics
    COUNT(te.id) as time_entries_count,
    SUM(te.hours) as total_hours_worked,
    
    -- Discount impact
    cbm.discount_amount,
    cbm.has_subscription_discount
    
FROM matters m
LEFT JOIN case_billing_methods cbm ON m.id = cbm.matter_id
LEFT JOIN case_outcomes co ON m.id = co.matter_id
LEFT JOIN time_entries te ON m.id = te.matter_id
GROUP BY m.id, m.law_firm_id, m.title, cbm.billing_type, cbm.final_amount, 
         co.success_fee_amount, cbm.discount_amount, cbm.has_subscription_discount;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Subscription system indexes
CREATE INDEX idx_client_subscriptions_status ON client_subscriptions(status);
CREATE INDEX idx_client_subscriptions_billing_date ON client_subscriptions(next_billing_date);
CREATE INDEX idx_subscription_usage_date ON subscription_usage(usage_date, client_subscription_id);

-- Billing system indexes
CREATE INDEX idx_case_billing_methods_matter ON case_billing_methods(matter_id);
CREATE INDEX idx_payment_installments_due_date ON payment_installments(due_date) WHERE status IN ('pending', 'overdue');
CREATE INDEX idx_payment_installments_status ON payment_installments(status);

-- Invoice system indexes
CREATE INDEX idx_invoices_status_due_date ON invoices(status, due_date);
CREATE INDEX idx_invoices_client_date ON invoices(client_id, issue_date);
CREATE INDEX idx_time_entries_billing_status ON time_entries(billing_status) WHERE billable = true;

-- Analytics indexes
CREATE INDEX idx_case_outcomes_success ON case_outcomes(success_achieved, outcome_date);
CREATE INDEX idx_discount_rules_active ON discount_rules(is_active, valid_from, valid_until);

-- =====================================================
-- TRIGGERS FOR AUTOMATION
-- =====================================================

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply timestamp triggers to relevant tables
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_subscriptions_updated_at BEFORE UPDATE ON client_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_case_billing_methods_updated_at BEFORE UPDATE ON case_billing_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_plans_updated_at BEFORE UPDATE ON payment_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INITIAL DATA SEEDING
-- =====================================================

-- Sample business parameters for Brazilian legal market
INSERT INTO business_parameters (law_firm_id, parameter_category, parameter_name, parameter_key, parameter_value, parameter_type, description, unit) VALUES
-- Using a placeholder UUID - in real implementation, use actual law firm IDs
('12345678-1234-1234-1234-123456789012', 'billing_rates', 'Junior Lawyer Hourly Rate', 'junior_lawyer_rate', '150.00', 'number', 'Hourly rate for junior lawyers', 'currency'),
('12345678-1234-1234-1234-123456789012', 'billing_rates', 'Senior Lawyer Hourly Rate', 'senior_lawyer_rate', '300.00', 'number', 'Hourly rate for senior lawyers', 'currency'),
('12345678-1234-1234-1234-123456789012', 'billing_rates', 'Partner Hourly Rate', 'partner_rate', '500.00', 'number', 'Hourly rate for partners', 'currency'),
('12345678-1234-1234-1234-123456789012', 'success_fee_rates', 'Labor Litigation Success Fee', 'labor_success_rate', '15.0', 'number', 'Success fee percentage for labor cases', 'percentage'),
('12345678-1234-1234-1234-123456789012', 'success_fee_rates', 'Corporate Litigation Success Fee', 'corporate_success_rate', '20.0', 'number', 'Success fee percentage for corporate cases', 'percentage'),
('12345678-1234-1234-1234-123456789012', 'payment_terms', 'Default Payment Terms', 'default_payment_terms', 'net_30', 'string', 'Default payment terms for invoices', 'days'),
('12345678-1234-1234-1234-123456789012', 'tax_rates', 'Service Tax Rate', 'service_tax_rate', '5.0', 'number', 'ISS tax rate for legal services', 'percentage');

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE subscription_plans IS 'Product catalog for recurring legal consulting services';
COMMENT ON TABLE client_subscriptions IS 'Active subscription relationships between clients and plans';
COMMENT ON TABLE case_billing_methods IS 'Billing configuration per legal matter (hourly/percentage/fixed + success fees)';
COMMENT ON TABLE payment_plans IS 'Installment payment arrangements for case billing';
COMMENT ON TABLE case_outcomes IS 'Case results and success fee calculations';
COMMENT ON TABLE discount_rules IS 'Cross-selling discount configuration for subscribers';
COMMENT ON TABLE time_entries IS 'Time tracking with subscription vs. case billing classification';
COMMENT ON TABLE invoices IS 'Unified invoicing system for all revenue streams';
COMMENT ON TABLE business_parameters IS 'Configurable business rules and rates per law firm';

-- =====================================================
-- SCHEMA VALIDATION QUERIES
-- =====================================================

-- Verify all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'subscription_plans', 'client_subscriptions', 'subscription_usage', 'subscription_invoices',
    'case_types', 'case_billing_methods', 'payment_plans', 'payment_installments',
    'case_outcomes', 'success_fee_invoices', 'discount_rules', 'case_discounts',
    'time_entries', 'invoices', 'invoice_line_items', 'business_parameters'
)
ORDER BY table_name;

-- Schema completion confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ PHASE 8.1 COMPLETE: Hybrid Legal Billing & Subscription Database Schema';
    RAISE NOTICE '📊 Tables created: 16 core tables + 2 analytics views';
    RAISE NOTICE '🔄 Features: Subscriptions + Case Billing + Payment Plans + Success Fees';
    RAISE NOTICE '💰 Revenue Streams: Triple revenue model fully supported';
    RAISE NOTICE '🚀 Ready for Phase 8.2: Subscription Plan System Implementation';
END $$;