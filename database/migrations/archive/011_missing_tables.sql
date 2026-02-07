-- =====================================================
-- MIGRATION 011: Create missing tables + hardening
-- Combines missing tables from 005, 8.10.1, and 010
-- =====================================================

-- 1. Payment Plans (from 005_billing_services_schema)
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

-- 2. Payment Installments (from 005, with law_firm_id added directly)
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

-- 3. Expense Categories (from 8.10.1)
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

-- 4. Bill Payments (from 8.10.1, with law_firm_id added directly)
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

-- 5. Payment Collections (from 8.10.1, fixed: contacts not clients, law_firm_id added)
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

-- 6. Payment Reminders (from 8.10.1, fixed: contacts not clients, law_firm_id added)
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

-- 7. Financial Alerts (from 8.10.1)
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

-- =====================================================
-- 8. Add law_firm_id to matter_contacts (from 010)
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matter_contacts' AND column_name = 'law_firm_id'
  ) THEN
    ALTER TABLE matter_contacts ADD COLUMN law_firm_id UUID REFERENCES law_firms(id);
    UPDATE matter_contacts mc
    SET law_firm_id = m.law_firm_id
    FROM matters m
    WHERE mc.matter_id = m.id AND mc.law_firm_id IS NULL;
    ALTER TABLE matter_contacts ALTER COLUMN law_firm_id SET NOT NULL;
    CREATE INDEX idx_matter_contacts_law_firm_id ON matter_contacts(law_firm_id);
  END IF;
END $$;

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_payment_plans_law_firm ON payment_plans(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_client ON payment_plans(client_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_matter ON payment_plans(matter_id);
CREATE INDEX IF NOT EXISTS idx_payment_installments_law_firm ON payment_installments(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_payment_installments_plan ON payment_installments(payment_plan_id);
CREATE INDEX IF NOT EXISTS idx_payment_installments_due_date ON payment_installments(due_date);
CREATE INDEX IF NOT EXISTS idx_expense_categories_law_firm ON expense_categories(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_bill_payments_law_firm ON bill_payments(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_bill_payments_bill ON bill_payments(bill_id);
CREATE INDEX IF NOT EXISTS idx_payment_collections_law_firm ON payment_collections(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_payment_collections_invoice ON payment_collections(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_law_firm ON payment_reminders(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_invoice ON payment_reminders(invoice_id);
CREATE INDEX IF NOT EXISTS idx_financial_alerts_law_firm ON financial_alerts(law_firm_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_alerts ENABLE ROW LEVEL SECURITY;

-- Service role bypass (for seed scripts)
CREATE POLICY "service_role_all_payment_plans" ON payment_plans FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all_payment_installments" ON payment_installments FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all_expense_categories" ON expense_categories FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all_bill_payments" ON bill_payments FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all_payment_collections" ON payment_collections FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all_payment_reminders" ON payment_reminders FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all_financial_alerts" ON financial_alerts FOR ALL TO service_role USING (true);

-- Staff access policies
DO $$
BEGIN
  -- Only create auth-based policies if the function exists
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'current_user_law_firm_id') THEN
    EXECUTE 'CREATE POLICY "payment_plans_staff_access" ON payment_plans FOR ALL USING (law_firm_id = auth.current_user_law_firm_id())';
    EXECUTE 'CREATE POLICY "payment_installments_staff_access" ON payment_installments FOR ALL USING (law_firm_id = auth.current_user_law_firm_id())';
    EXECUTE 'CREATE POLICY "expense_categories_staff_access" ON expense_categories FOR ALL USING (law_firm_id = auth.current_user_law_firm_id())';
    EXECUTE 'CREATE POLICY "bill_payments_staff_access" ON bill_payments FOR ALL USING (law_firm_id = auth.current_user_law_firm_id())';
    EXECUTE 'CREATE POLICY "payment_collections_staff_access" ON payment_collections FOR ALL USING (law_firm_id = auth.current_user_law_firm_id())';
    EXECUTE 'CREATE POLICY "payment_reminders_staff_access" ON payment_reminders FOR ALL USING (law_firm_id = auth.current_user_law_firm_id())';
    EXECUTE 'CREATE POLICY "financial_alerts_staff_access" ON financial_alerts FOR ALL USING (law_firm_id = auth.current_user_law_firm_id())';
  END IF;
END $$;

-- Super admin bypass
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_super_admin') THEN
    EXECUTE 'CREATE POLICY "super_admin_payment_plans" ON payment_plans FOR ALL USING (public.is_super_admin())';
    EXECUTE 'CREATE POLICY "super_admin_payment_installments" ON payment_installments FOR ALL USING (public.is_super_admin())';
    EXECUTE 'CREATE POLICY "super_admin_expense_categories" ON expense_categories FOR ALL USING (public.is_super_admin())';
    EXECUTE 'CREATE POLICY "super_admin_bill_payments" ON bill_payments FOR ALL USING (public.is_super_admin())';
    EXECUTE 'CREATE POLICY "super_admin_payment_collections" ON payment_collections FOR ALL USING (public.is_super_admin())';
    EXECUTE 'CREATE POLICY "super_admin_payment_reminders" ON payment_reminders FOR ALL USING (public.is_super_admin())';
    EXECUTE 'CREATE POLICY "super_admin_financial_alerts" ON financial_alerts FOR ALL USING (public.is_super_admin())';
  END IF;
END $$;
