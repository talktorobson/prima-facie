-- Phase 8.10.1: Financial Management Database Schema
-- Accounts Payable & Receivable System for Prima Facie
-- Created with love and confidence ❤️

-- ====================================
-- VENDOR MANAGEMENT (Accounts Payable)
-- ====================================

-- Vendors/Suppliers table
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    vendor_type VARCHAR(50) NOT NULL CHECK (vendor_type IN ('supplier', 'contractor', 'service_provider', 'utility', 'government', 'other')),
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    cnpj VARCHAR(20), -- Brazilian company registration
    cpf VARCHAR(14), -- Brazilian individual registration
    email VARCHAR(255),
    phone VARCHAR(20),
    website VARCHAR(255),
    
    -- Address information
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_complement VARCHAR(100),
    address_neighborhood VARCHAR(100),
    address_city VARCHAR(100),
    address_state VARCHAR(2),
    address_postal_code VARCHAR(10),
    
    -- Banking information for payments
    bank_name VARCHAR(100),
    bank_branch VARCHAR(20),
    bank_account VARCHAR(50),
    bank_account_type VARCHAR(20) CHECK (bank_account_type IN ('checking', 'savings')),
    pix_key VARCHAR(255), -- Brazilian instant payment system
    
    -- Business information
    payment_terms INTEGER DEFAULT 30, -- Days
    tax_rate DECIMAL(5,2) DEFAULT 0,
    is_recurring BOOLEAN DEFAULT FALSE,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    
    CONSTRAINT unique_vendor_per_firm UNIQUE (law_firm_id, cnpj),
    CONSTRAINT unique_vendor_cpf_per_firm UNIQUE (law_firm_id, cpf)
);

-- Expense Categories table
CREATE TABLE expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES expense_categories(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_type VARCHAR(50) NOT NULL CHECK (category_type IN ('operational', 'administrative', 'legal', 'marketing', 'technology', 'other')),
    is_billable_default BOOLEAN DEFAULT FALSE, -- Can be charged to clients
    tax_deductible BOOLEAN DEFAULT TRUE,
    budget_monthly DECIMAL(12,2),
    budget_yearly DECIMAL(12,2),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_category_code_per_firm UNIQUE (law_firm_id, code)
);

-- ====================================
-- ACCOUNTS PAYABLE
-- ====================================

-- Bills/Invoices Payable table
CREATE TABLE bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    expense_category_id UUID NOT NULL REFERENCES expense_categories(id),
    matter_id UUID REFERENCES matters(id), -- Optional link to specific case
    
    -- Bill information
    bill_number VARCHAR(100) NOT NULL,
    bill_date DATE NOT NULL,
    due_date DATE NOT NULL,
    payment_terms INTEGER,
    
    -- Financial details
    subtotal DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    currency_code VARCHAR(3) DEFAULT 'BRL',
    
    -- Payment tracking
    amount_paid DECIMAL(12,2) DEFAULT 0,
    balance_due DECIMAL(12,2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue', 'cancelled')),
    
    -- Bill type and recurrence
    bill_type VARCHAR(20) NOT NULL CHECK (bill_type IN ('one_time', 'recurring', 'installment')),
    recurrence_frequency VARCHAR(20) CHECK (recurrence_frequency IN ('monthly', 'quarterly', 'semi_annual', 'annual')),
    installment_number INTEGER,
    installment_total INTEGER,
    parent_bill_id UUID REFERENCES bills(id), -- For installments
    
    -- Approval workflow
    approval_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'under_review')),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    approval_notes TEXT,
    
    -- Document management
    document_url VARCHAR(500),
    document_storage_path VARCHAR(500),
    
    -- Additional fields
    description TEXT,
    notes TEXT,
    is_billable_to_client BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Bill Payments table
CREATE TABLE bill_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bill_id UUID NOT NULL REFERENCES bills(id),
    payment_date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('bank_transfer', 'pix', 'credit_card', 'debit_card', 'check', 'cash', 'other')),
    
    -- Payment details
    transaction_reference VARCHAR(255),
    bank_account_used VARCHAR(100),
    
    -- Payment proof
    proof_document_url VARCHAR(500),
    proof_uploaded BOOLEAN DEFAULT FALSE,
    
    -- Processing information
    processed_by UUID REFERENCES users(id),
    processing_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- ====================================
-- ACCOUNTS RECEIVABLE ENHANCEMENTS
-- ====================================

-- Payment Collections table (extends existing payments)
CREATE TABLE payment_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    client_id UUID NOT NULL REFERENCES clients(id),
    
    -- Collection status
    collection_status VARCHAR(50) NOT NULL DEFAULT 'current' CHECK (collection_status IN ('current', 'overdue_30', 'overdue_60', 'overdue_90', 'in_collection', 'written_off', 'disputed')),
    days_overdue INTEGER DEFAULT 0,
    
    -- Collection actions
    last_reminder_sent DATE,
    reminder_count INTEGER DEFAULT 0,
    collection_agent_id UUID REFERENCES users(id),
    collection_notes TEXT,
    
    -- Promise to pay
    promise_to_pay_date DATE,
    promise_to_pay_amount DECIMAL(12,2),
    promise_to_pay_notes TEXT,
    
    -- Dispute information
    is_disputed BOOLEAN DEFAULT FALSE,
    dispute_reason TEXT,
    dispute_date DATE,
    dispute_resolved_date DATE,
    
    -- Write-off information
    written_off_date DATE,
    written_off_amount DECIMAL(12,2),
    written_off_reason TEXT,
    written_off_by UUID REFERENCES users(id),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payment Reminders table
CREATE TABLE payment_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    client_id UUID NOT NULL REFERENCES clients(id),
    
    -- Reminder details
    reminder_type VARCHAR(50) NOT NULL CHECK (reminder_type IN ('friendly', 'first_overdue', 'second_overdue', 'final_notice', 'collection_notice')),
    scheduled_date DATE NOT NULL,
    sent_date TIMESTAMP WITH TIME ZONE,
    
    -- Communication details
    send_method VARCHAR(50) NOT NULL CHECK (send_method IN ('email', 'whatsapp', 'sms', 'letter', 'phone')),
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(50),
    
    -- Content
    subject VARCHAR(500),
    message_body TEXT,
    
    -- Status tracking
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'failed', 'cancelled')),
    failure_reason TEXT,
    
    -- Response tracking
    client_responded BOOLEAN DEFAULT FALSE,
    response_date TIMESTAMP WITH TIME ZONE,
    response_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    sent_by UUID REFERENCES users(id)
);

-- ====================================
-- FINANCIAL DOCUMENTS & ATTACHMENTS
-- ====================================

CREATE TABLE financial_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    
    -- Polymorphic association
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('bill', 'invoice', 'receipt', 'payment_proof', 'contract', 'report')),
    related_entity_type VARCHAR(50) NOT NULL CHECK (related_entity_type IN ('bill', 'invoice', 'payment', 'vendor', 'client')),
    related_entity_id UUID NOT NULL,
    
    -- Document information
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER,
    file_type VARCHAR(50),
    storage_path VARCHAR(500),
    external_url VARCHAR(500),
    
    -- Document metadata
    document_date DATE,
    description TEXT,
    tags TEXT[],
    
    -- Status
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    uploaded_by UUID REFERENCES users(id)
);

-- ====================================
-- FINANCIAL ALERTS & NOTIFICATIONS
-- ====================================

CREATE TABLE financial_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    
    -- Alert configuration
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('payment_due', 'payment_overdue', 'low_cash_balance', 'budget_exceeded', 'collection_needed', 'document_missing')),
    entity_type VARCHAR(50) CHECK (entity_type IN ('bill', 'invoice', 'expense_category', 'vendor', 'client')),
    entity_id UUID,
    
    -- Alert details
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    
    -- Timing
    trigger_date DATE NOT NULL,
    days_before_due INTEGER, -- For advance warnings
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by UUID REFERENCES users(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    
    -- Actions
    action_required VARCHAR(255),
    action_url VARCHAR(500),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- INDEXES FOR PERFORMANCE
-- ====================================

-- Vendor indexes
CREATE INDEX idx_vendors_law_firm ON vendors(law_firm_id);
CREATE INDEX idx_vendors_active ON vendors(law_firm_id, is_active);
CREATE INDEX idx_vendors_type ON vendors(vendor_type);

-- Expense category indexes
CREATE INDEX idx_expense_categories_law_firm ON expense_categories(law_firm_id);
CREATE INDEX idx_expense_categories_parent ON expense_categories(parent_id);
CREATE INDEX idx_expense_categories_billable ON expense_categories(is_billable_default);

-- Bills indexes
CREATE INDEX idx_bills_law_firm ON bills(law_firm_id);
CREATE INDEX idx_bills_vendor ON bills(vendor_id);
CREATE INDEX idx_bills_due_date ON bills(due_date);
CREATE INDEX idx_bills_payment_status ON bills(payment_status);
CREATE INDEX idx_bills_approval_status ON bills(approval_status);
CREATE INDEX idx_bills_matter ON bills(matter_id) WHERE matter_id IS NOT NULL;

-- Bill payments indexes
CREATE INDEX idx_bill_payments_bill ON bill_payments(bill_id);
CREATE INDEX idx_bill_payments_date ON bill_payments(payment_date);

-- Collections indexes
CREATE INDEX idx_payment_collections_invoice ON payment_collections(invoice_id);
CREATE INDEX idx_payment_collections_client ON payment_collections(client_id);
CREATE INDEX idx_payment_collections_status ON payment_collections(collection_status);
CREATE INDEX idx_payment_collections_overdue ON payment_collections(days_overdue) WHERE days_overdue > 0;

-- Reminders indexes
CREATE INDEX idx_payment_reminders_invoice ON payment_reminders(invoice_id);
CREATE INDEX idx_payment_reminders_scheduled ON payment_reminders(scheduled_date) WHERE status = 'scheduled';
CREATE INDEX idx_payment_reminders_client ON payment_reminders(client_id);

-- Financial documents indexes
CREATE INDEX idx_financial_documents_entity ON financial_documents(related_entity_type, related_entity_id);
CREATE INDEX idx_financial_documents_law_firm ON financial_documents(law_firm_id);

-- Alerts indexes
CREATE INDEX idx_financial_alerts_law_firm ON financial_alerts(law_firm_id, is_active);
CREATE INDEX idx_financial_alerts_trigger ON financial_alerts(trigger_date) WHERE is_active = TRUE;
CREATE INDEX idx_financial_alerts_entity ON financial_alerts(entity_type, entity_id) WHERE entity_id IS NOT NULL;

-- ====================================
-- TRIGGERS FOR UPDATED_AT
-- ====================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expense_categories_updated_at BEFORE UPDATE ON expense_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON bills
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_collections_updated_at BEFORE UPDATE ON payment_collections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- SEED DATA: Essential Expense Categories
-- ====================================

-- Note: These will be inserted per law firm during setup
-- Example categories for Brazilian law firms:

/*
INSERT INTO expense_categories (law_firm_id, code, name, category_type, is_billable_default) VALUES
-- Operational expenses
('{law_firm_id}', 'OP001', 'Aluguel e Condomínio', 'operational', false),
('{law_firm_id}', 'OP002', 'Energia Elétrica', 'operational', false),
('{law_firm_id}', 'OP003', 'Água e Esgoto', 'operational', false),
('{law_firm_id}', 'OP004', 'Internet e Telefonia', 'operational', false),
('{law_firm_id}', 'OP005', 'Material de Escritório', 'operational', false),

-- Legal expenses
('{law_firm_id}', 'LG001', 'Custas Judiciais', 'legal', true),
('{law_firm_id}', 'LG002', 'Taxas e Emolumentos', 'legal', true),
('{law_firm_id}', 'LG003', 'Perícias e Laudos', 'legal', true),
('{law_firm_id}', 'LG004', 'Diligências e Deslocamentos', 'legal', true),
('{law_firm_id}', 'LG005', 'Cópias e Autenticações', 'legal', true),

-- Administrative expenses
('{law_firm_id}', 'AD001', 'Folha de Pagamento', 'administrative', false),
('{law_firm_id}', 'AD002', 'Benefícios e Encargos', 'administrative', false),
('{law_firm_id}', 'AD003', 'Contabilidade', 'administrative', false),
('{law_firm_id}', 'AD004', 'Seguros', 'administrative', false),
('{law_firm_id}', 'AD005', 'Treinamentos e Capacitação', 'administrative', false),

-- Technology expenses
('{law_firm_id}', 'TI001', 'Software e Licenças', 'technology', false),
('{law_firm_id}', 'TI002', 'Equipamentos de Informática', 'technology', false),
('{law_firm_id}', 'TI003', 'Manutenção de TI', 'technology', false),
('{law_firm_id}', 'TI004', 'Cloud e Armazenamento', 'technology', false),

-- Marketing expenses
('{law_firm_id}', 'MK001', 'Marketing Digital', 'marketing', false),
('{law_firm_id}', 'MK002', 'Eventos e Networking', 'marketing', false),
('{law_firm_id}', 'MK003', 'Material Promocional', 'marketing', false);
*/

-- ====================================
-- ROW LEVEL SECURITY (RLS)
-- ====================================

-- Enable RLS on all tables
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vendors
CREATE POLICY vendors_law_firm_isolation ON vendors
    FOR ALL USING (law_firm_id IN (
        SELECT law_firm_id FROM users WHERE id = auth.uid()
    ));

-- RLS Policies for expense_categories
CREATE POLICY expense_categories_law_firm_isolation ON expense_categories
    FOR ALL USING (law_firm_id IN (
        SELECT law_firm_id FROM users WHERE id = auth.uid()
    ));

-- RLS Policies for bills
CREATE POLICY bills_law_firm_isolation ON bills
    FOR ALL USING (law_firm_id IN (
        SELECT law_firm_id FROM users WHERE id = auth.uid()
    ));

-- RLS Policies for bill_payments
CREATE POLICY bill_payments_law_firm_isolation ON bill_payments
    FOR ALL USING (bill_id IN (
        SELECT id FROM bills WHERE law_firm_id IN (
            SELECT law_firm_id FROM users WHERE id = auth.uid()
        )
    ));

-- RLS Policies for payment_collections
CREATE POLICY payment_collections_law_firm_isolation ON payment_collections
    FOR ALL USING (client_id IN (
        SELECT id FROM clients WHERE law_firm_id IN (
            SELECT law_firm_id FROM users WHERE id = auth.uid()
        )
    ));

-- RLS Policies for payment_reminders
CREATE POLICY payment_reminders_law_firm_isolation ON payment_reminders
    FOR ALL USING (client_id IN (
        SELECT id FROM clients WHERE law_firm_id IN (
            SELECT law_firm_id FROM users WHERE id = auth.uid()
        )
    ));

-- RLS Policies for financial_documents
CREATE POLICY financial_documents_law_firm_isolation ON financial_documents
    FOR ALL USING (law_firm_id IN (
        SELECT law_firm_id FROM users WHERE id = auth.uid()
    ));

-- RLS Policies for financial_alerts
CREATE POLICY financial_alerts_law_firm_isolation ON financial_alerts
    FOR ALL USING (law_firm_id IN (
        SELECT law_firm_id FROM users WHERE id = auth.uid()
    ));

-- ====================================
-- FUNCTIONS FOR FINANCIAL CALCULATIONS
-- ====================================

-- Function to update bill payment status
CREATE OR REPLACE FUNCTION update_bill_payment_status()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE bills
    SET payment_status = CASE
        WHEN (SELECT SUM(amount) FROM bill_payments WHERE bill_id = NEW.bill_id) >= total_amount THEN 'paid'
        WHEN (SELECT SUM(amount) FROM bill_payments WHERE bill_id = NEW.bill_id) > 0 THEN 'partial'
        ELSE 'pending'
    END,
    amount_paid = (SELECT COALESCE(SUM(amount), 0) FROM bill_payments WHERE bill_id = NEW.bill_id)
    WHERE id = NEW.bill_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bill_status_after_payment
    AFTER INSERT OR UPDATE OR DELETE ON bill_payments
    FOR EACH ROW EXECUTE FUNCTION update_bill_payment_status();

-- Function to update overdue bills
CREATE OR REPLACE FUNCTION update_overdue_bills()
RETURNS void AS $$
BEGIN
    UPDATE bills
    SET payment_status = 'overdue'
    WHERE payment_status IN ('pending', 'partial')
    AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate days overdue for collections
CREATE OR REPLACE FUNCTION update_collection_days_overdue()
RETURNS void AS $$
BEGIN
    UPDATE payment_collections pc
    SET days_overdue = GREATEST(0, CURRENT_DATE - i.due_date),
        collection_status = CASE
            WHEN CURRENT_DATE - i.due_date <= 0 THEN 'current'
            WHEN CURRENT_DATE - i.due_date <= 30 THEN 'overdue_30'
            WHEN CURRENT_DATE - i.due_date <= 60 THEN 'overdue_60'
            WHEN CURRENT_DATE - i.due_date <= 90 THEN 'overdue_90'
            ELSE 'in_collection'
        END
    FROM invoices i
    WHERE pc.invoice_id = i.id
    AND i.status != 'paid';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run these functions daily (using pg_cron or similar)
-- SELECT cron.schedule('update-overdue-bills', '0 1 * * *', 'SELECT update_overdue_bills();');
-- SELECT cron.schedule('update-collection-days', '0 2 * * *', 'SELECT update_collection_days_overdue();');

COMMENT ON SCHEMA public IS 'Phase 8.10.1: Financial Management Schema - Complete AP/AR system with love ❤️';