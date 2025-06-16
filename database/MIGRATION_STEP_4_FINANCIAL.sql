-- =============================================
-- STEP 4: FINANCIAL MANAGEMENT SCHEMA MIGRATION
-- =============================================

-- Drop existing incompatible financial tables
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;

-- Create vendors table (renamed from suppliers for consistency)
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL,
    
    -- Vendor details
    vendor_name VARCHAR(255) NOT NULL,
    vendor_type VARCHAR(50) NOT NULL CHECK (vendor_type IN (
        'service_provider', 'supplier', 'contractor', 'consultant', 'utility', 'technology', 'other'
    )),
    
    -- Contact information
    contact_person VARCHAR(200),
    email VARCHAR(255),
    phone VARCHAR(50),
    
    -- Address
    address_line_1 VARCHAR(255),
    address_line_2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Brasil',
    
    -- Tax information
    tax_id VARCHAR(50), -- CNPJ/CPF
    tax_id_type VARCHAR(10) CHECK (tax_id_type IN ('CNPJ', 'CPF')),
    
    -- Payment terms
    default_payment_terms VARCHAR(50) DEFAULT '30_days',
    payment_methods TEXT[],
    
    -- Banking information
    bank_account_info JSONB,
    pix_key VARCHAR(255),
    
    -- Status
    vendor_status VARCHAR(20) DEFAULT 'active' CHECK (vendor_status IN ('active', 'inactive', 'suspended')),
    
    -- Metadata
    notes TEXT,
    internal_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create expense categories
CREATE TABLE IF NOT EXISTS expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL,
    
    -- Category details
    category_name VARCHAR(100) NOT NULL,
    category_code VARCHAR(20),
    description TEXT,
    
    -- Hierarchy
    parent_category_id UUID REFERENCES expense_categories(id),
    category_level INTEGER DEFAULT 1,
    category_path VARCHAR(500),
    
    -- Tax settings
    default_tax_treatment VARCHAR(50) DEFAULT 'deductible',
    requires_receipt BOOLEAN DEFAULT true,
    
    -- Budget tracking
    monthly_budget_limit DECIMAL(12,2),
    annual_budget_limit DECIMAL(12,2),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_billable_to_clients BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create bills table
CREATE TABLE IF NOT EXISTS bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL,
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    
    -- Bill identification
    bill_number VARCHAR(100),
    vendor_invoice_number VARCHAR(100),
    
    -- Financial details
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
    
    -- Status and workflow
    bill_status VARCHAR(20) NOT NULL DEFAULT 'received' CHECK (bill_status IN (
        'received', 'under_review', 'approved', 'rejected', 'paid', 'partially_paid', 'overdue', 'disputed'
    )),
    
    -- Dates
    bill_date DATE NOT NULL,
    due_date DATE NOT NULL,
    received_date DATE DEFAULT CURRENT_DATE,
    approved_date DATE,
    paid_date DATE,
    
    -- Payment terms
    payment_terms VARCHAR(50) DEFAULT '30_days',
    late_fee_rate DECIMAL(5,4) DEFAULT 0,
    
    -- Categorization
    expense_category_id UUID REFERENCES expense_categories(id),
    matter_id UUID, -- For case-specific expenses
    
    -- Billing to clients
    is_billable_to_client BOOLEAN DEFAULT false,
    client_id UUID,
    markup_percentage DECIMAL(5,4) DEFAULT 0,
    client_bill_amount DECIMAL(12,2),
    
    -- Approval workflow
    requires_approval BOOLEAN DEFAULT true,
    approved_by UUID,
    approval_notes TEXT,
    
    -- Document tracking
    has_receipt BOOLEAN DEFAULT false,
    receipt_document_ids UUID[],
    
    -- Recurring bills
    is_recurring BOOLEAN DEFAULT false,
    recurring_template_id UUID,
    
    -- Notes
    description TEXT,
    internal_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT positive_bill_amounts CHECK (
        subtotal >= 0 AND tax_amount >= 0 AND discount_amount >= 0 AND total_amount >= 0
    ),
    CONSTRAINT bill_total_calculation CHECK (
        total_amount = subtotal + tax_amount - discount_amount
    )
);

-- Create bill line items
CREATE TABLE IF NOT EXISTS bill_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL,
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    
    -- Line item details
    description TEXT NOT NULL,
    quantity DECIMAL(10,4) NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    line_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    
    -- Categorization
    expense_category_id UUID REFERENCES expense_categories(id),
    
    -- Tax information
    tax_rate DECIMAL(5,4) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    
    -- Client billing
    is_billable_to_client BOOLEAN DEFAULT false,
    client_markup_percentage DECIMAL(5,4) DEFAULT 0,
    
    -- Metadata
    sort_order INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT positive_line_amounts CHECK (quantity > 0 AND unit_price >= 0 AND line_total >= 0),
    CONSTRAINT line_total_calculation CHECK (line_total = quantity * unit_price)
);

-- Create payments table (for bill payments)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL,
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    
    -- Payment details
    payment_amount DECIMAL(12,2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN (
        'cash', 'check', 'bank_transfer', 'pix', 'credit_card', 'debit_card', 'other'
    )),
    
    -- Transaction details
    transaction_id VARCHAR(100),
    reference_number VARCHAR(100),
    
    -- Bank account used
    bank_account_id UUID,
    
    -- Status
    payment_status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (payment_status IN (
        'pending', 'completed', 'failed', 'cancelled'
    )),
    
    -- Notes
    notes TEXT,
    
    -- Metadata
    processed_by UUID,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT positive_payment_amount CHECK (payment_amount > 0)
);

-- Create payment installments for payment plans
CREATE TABLE IF NOT EXISTS payment_installments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL,
    bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    
    -- Installment details
    installment_number INTEGER NOT NULL,
    total_installments INTEGER NOT NULL,
    installment_amount DECIMAL(12,2) NOT NULL,
    
    -- Schedule
    due_date DATE NOT NULL,
    paid_date DATE,
    
    -- Status
    installment_status VARCHAR(20) DEFAULT 'pending' CHECK (installment_status IN (
        'pending', 'paid', 'overdue', 'skipped'
    )),
    
    -- Payment tracking
    payment_id UUID REFERENCES payments(id),
    
    -- Late fees
    late_fee_amount DECIMAL(12,2) DEFAULT 0,
    grace_period_days INTEGER DEFAULT 5,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_installment_number CHECK (
        installment_number > 0 AND installment_number <= total_installments
    )
);

-- Create financial alerts
CREATE TABLE IF NOT EXISTS financial_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL,
    
    -- Alert details
    alert_type VARCHAR(30) NOT NULL CHECK (alert_type IN (
        'budget_exceeded', 'bill_due_soon', 'bill_overdue', 'payment_failed', 'cash_flow_low', 'unusual_expense'
    )),
    alert_severity VARCHAR(20) DEFAULT 'medium' CHECK (alert_severity IN ('low', 'medium', 'high', 'critical')),
    
    -- Alert content
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    
    -- Related records
    bill_id UUID REFERENCES bills(id),
    vendor_id UUID REFERENCES vendors(id),
    expense_category_id UUID REFERENCES expense_categories(id),
    
    -- Threshold information
    threshold_amount DECIMAL(12,2),
    actual_amount DECIMAL(12,2),
    
    -- Status
    alert_status VARCHAR(20) DEFAULT 'active' CHECK (alert_status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
    
    -- Actions taken
    acknowledged_by UUID,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    
    -- Notification settings
    notify_users UUID[],
    notification_sent BOOLEAN DEFAULT false,
    notification_sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create recurring bill templates
CREATE TABLE IF NOT EXISTS recurring_bill_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL,
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    
    -- Template details
    template_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Recurring schedule
    recurrence_pattern VARCHAR(20) NOT NULL CHECK (recurrence_pattern IN (
        'weekly', 'bi_weekly', 'monthly', 'quarterly', 'semi_annual', 'annual'
    )),
    recurrence_day INTEGER, -- Day of month for monthly, etc.
    
    -- Bill template data
    estimated_amount DECIMAL(12,2),
    expense_category_id UUID REFERENCES expense_categories(id),
    payment_terms VARCHAR(50) DEFAULT '30_days',
    
    -- Template settings
    auto_generate BOOLEAN DEFAULT false,
    auto_approve BOOLEAN DEFAULT false,
    
    -- Next generation
    next_generation_date DATE,
    last_generated_date DATE,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create budget tracking tables
CREATE TABLE IF NOT EXISTS budget_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL,
    
    -- Period details
    period_name VARCHAR(100) NOT NULL,
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('monthly', 'quarterly', 'annual')),
    
    -- Date range
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- Budget amounts
    total_budget DECIMAL(12,2) NOT NULL DEFAULT 0,
    
    -- Status
    period_status VARCHAR(20) DEFAULT 'active' CHECK (period_status IN ('planning', 'active', 'closed')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS budget_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL,
    budget_period_id UUID NOT NULL REFERENCES budget_periods(id) ON DELETE CASCADE,
    expense_category_id UUID NOT NULL REFERENCES expense_categories(id),
    
    -- Allocation details
    allocated_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    spent_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    committed_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    remaining_amount DECIMAL(12,2) GENERATED ALWAYS AS (allocated_amount - spent_amount - committed_amount) STORED,
    
    -- Variance tracking
    variance_amount DECIMAL(12,2) GENERATED ALWAYS AS (spent_amount - allocated_amount) STORED,
    variance_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN allocated_amount > 0 THEN ((spent_amount - allocated_amount) / allocated_amount) * 100
            ELSE 0
        END
    ) STORED,
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vendors_law_firm_id ON vendors(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_vendors_vendor_type ON vendors(vendor_type);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON vendors(vendor_status);

CREATE INDEX IF NOT EXISTS idx_bills_law_firm_id ON bills(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_bills_vendor_id ON bills(vendor_id);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(bill_status);
CREATE INDEX IF NOT EXISTS idx_bills_due_date ON bills(due_date);
CREATE INDEX IF NOT EXISTS idx_bills_matter_id ON bills(matter_id);

CREATE INDEX IF NOT EXISTS idx_expense_categories_law_firm_id ON expense_categories(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_expense_categories_parent ON expense_categories(parent_category_id);

-- Enable RLS
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_bill_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_allocations ENABLE ROW LEVEL SECURITY;

-- Insert default expense categories
INSERT INTO expense_categories (id, law_firm_id, category_name, category_code, description, is_active) VALUES
(uuid_generate_v4(), uuid_generate_v4()::uuid, 'Escritório e Administração', 'OFFICE', 'Despesas gerais de escritório e administração', true),
(uuid_generate_v4(), uuid_generate_v4()::uuid, 'Tecnologia', 'TECH', 'Software, hardware e serviços de TI', true),
(uuid_generate_v4(), uuid_generate_v4()::uuid, 'Marketing e Publicidade', 'MARKETING', 'Despesas com marketing e publicidade', true),
(uuid_generate_v4(), uuid_generate_v4()::uuid, 'Recursos Humanos', 'HR', 'Despesas com pessoal e recursos humanos', true),
(uuid_generate_v4(), uuid_generate_v4()::uuid, 'Capacitação e Treinamento', 'TRAINING', 'Cursos, treinamentos e educação continuada', true),
(uuid_generate_v4(), uuid_generate_v4()::uuid, 'Viagens e Hospedagem', 'TRAVEL', 'Despesas com viagens de trabalho', true),
(uuid_generate_v4(), uuid_generate_v4()::uuid, 'Consultoria Jurídica', 'LEGAL', 'Serviços de consultoria jurídica externa', true),
(uuid_generate_v4(), uuid_generate_v4()::uuid, 'Taxas e Impostos', 'TAXES', 'Taxas governamentais e impostos', true)
ON CONFLICT DO NOTHING;

-- Verification
SELECT 'Financial management tables created successfully' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('vendors', 'expense_categories', 'bills', 'payments', 'payment_installments', 'financial_alerts', 'recurring_bill_templates')
ORDER BY table_name;