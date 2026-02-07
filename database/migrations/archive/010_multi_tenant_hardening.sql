-- =====================================================
-- MIGRATION 010: Multi-Tenant Isolation Hardening
-- Fixes critical security gaps across RLS, schema, and access control
-- =====================================================

-- =====================================================
-- A1. REWRITE Phase 8.7.1 INVOICE POLICIES
-- Replace unsafe current_setting('app.current_law_firm_id') with
-- auth.current_user_law_firm_id() consistent with migrations 002-004
-- =====================================================

-- Drop all 9 unsafe policies
DROP POLICY IF EXISTS "invoices_tenant_isolation" ON invoices;
DROP POLICY IF EXISTS "invoice_line_items_tenant_isolation" ON invoice_line_items;
DROP POLICY IF EXISTS "subscription_invoices_tenant_isolation" ON subscription_invoices;
DROP POLICY IF EXISTS "case_invoices_tenant_isolation" ON case_invoices;
DROP POLICY IF EXISTS "payment_plan_invoices_tenant_isolation" ON payment_plan_invoices;
DROP POLICY IF EXISTS "time_based_invoices_tenant_isolation" ON time_based_invoices;
DROP POLICY IF EXISTS "invoice_payments_tenant_isolation" ON invoice_payments;
DROP POLICY IF EXISTS "invoice_templates_tenant_isolation" ON invoice_templates;
DROP POLICY IF EXISTS "invoice_generation_logs_tenant_isolation" ON invoice_generation_logs;

-- Recreate using auth.current_user_law_firm_id() (defined in migration 002)
-- Staff can manage all invoice data for their law firm
CREATE POLICY "invoices_staff_access" ON invoices
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id() AND auth.current_user_is_staff()
  );

CREATE POLICY "invoices_client_view" ON invoices
  FOR SELECT USING (
    client_id IN (SELECT id FROM contacts WHERE user_id = auth.current_user_id())
  );

CREATE POLICY "invoice_line_items_staff_access" ON invoice_line_items
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id() AND auth.current_user_is_staff()
  );

CREATE POLICY "invoice_line_items_client_view" ON invoice_line_items
  FOR SELECT USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE client_id IN (
        SELECT id FROM contacts WHERE user_id = auth.current_user_id()
      )
    )
  );

CREATE POLICY "subscription_invoices_staff_access" ON subscription_invoices
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id() AND auth.current_user_is_staff()
  );

CREATE POLICY "case_invoices_staff_access" ON case_invoices
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id() AND auth.current_user_is_staff()
  );

CREATE POLICY "payment_plan_invoices_staff_access" ON payment_plan_invoices
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id() AND auth.current_user_is_staff()
  );

CREATE POLICY "time_based_invoices_staff_access" ON time_based_invoices
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id() AND auth.current_user_is_staff()
  );

CREATE POLICY "invoice_payments_staff_access" ON invoice_payments
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id() AND auth.current_user_is_staff()
  );

CREATE POLICY "invoice_templates_staff_access" ON invoice_templates
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id() AND auth.current_user_is_staff()
  );

CREATE POLICY "invoice_generation_logs_staff_access" ON invoice_generation_logs
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id() AND auth.current_user_is_staff()
  );

-- =====================================================
-- A2. ADD law_firm_id TO JOIN/CHILD TABLES
-- Eliminates cascade dependency for tenant isolation
-- =====================================================

-- invoice_line_items (from migration 001) — already has law_firm_id in phase8.7.1
-- Only the 001 version lacks it. If the 001 version is applied, add it:
DO $$
BEGIN
  -- matter_contacts: add law_firm_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matter_contacts' AND column_name = 'law_firm_id'
  ) THEN
    ALTER TABLE matter_contacts ADD COLUMN law_firm_id UUID REFERENCES law_firms(id);
    -- Backfill from parent matters
    UPDATE matter_contacts mc
    SET law_firm_id = m.law_firm_id
    FROM matters m
    WHERE mc.matter_id = m.id AND mc.law_firm_id IS NULL;
    -- Make NOT NULL after backfill
    ALTER TABLE matter_contacts ALTER COLUMN law_firm_id SET NOT NULL;
    CREATE INDEX idx_matter_contacts_law_firm_id ON matter_contacts(law_firm_id);
  END IF;

  -- bill_payments: add law_firm_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bill_payments' AND column_name = 'law_firm_id'
  ) THEN
    ALTER TABLE bill_payments ADD COLUMN law_firm_id UUID REFERENCES law_firms(id);
    UPDATE bill_payments bp
    SET law_firm_id = b.law_firm_id
    FROM bills b
    WHERE bp.bill_id = b.id AND bp.law_firm_id IS NULL;
    ALTER TABLE bill_payments ALTER COLUMN law_firm_id SET NOT NULL;
    CREATE INDEX idx_bill_payments_law_firm_id ON bill_payments(law_firm_id);
  END IF;

  -- payment_reminders: add law_firm_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_reminders' AND column_name = 'law_firm_id'
  ) THEN
    ALTER TABLE payment_reminders ADD COLUMN law_firm_id UUID REFERENCES law_firms(id);
    UPDATE payment_reminders pr
    SET law_firm_id = i.law_firm_id
    FROM invoices i
    WHERE pr.invoice_id = i.id AND pr.law_firm_id IS NULL;
    ALTER TABLE payment_reminders ALTER COLUMN law_firm_id SET NOT NULL;
    CREATE INDEX idx_payment_reminders_law_firm_id ON payment_reminders(law_firm_id);
  END IF;

  -- payment_installments: add law_firm_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_installments' AND column_name = 'law_firm_id'
  ) THEN
    ALTER TABLE payment_installments ADD COLUMN law_firm_id UUID REFERENCES law_firms(id);
    UPDATE payment_installments pi
    SET law_firm_id = pp.law_firm_id
    FROM payment_plans pp
    WHERE pi.payment_plan_id = pp.id AND pi.law_firm_id IS NULL;
    ALTER TABLE payment_installments ALTER COLUMN law_firm_id SET NOT NULL;
    CREATE INDEX idx_payment_installments_law_firm_id ON payment_installments(law_firm_id);
  END IF;

  -- payment_collections: add law_firm_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_collections' AND column_name = 'law_firm_id'
  ) THEN
    ALTER TABLE payment_collections ADD COLUMN law_firm_id UUID REFERENCES law_firms(id);
    UPDATE payment_collections pc
    SET law_firm_id = i.law_firm_id
    FROM invoices i
    WHERE pc.invoice_id = i.id AND pc.law_firm_id IS NULL;
    ALTER TABLE payment_collections ALTER COLUMN law_firm_id SET NOT NULL;
    CREATE INDEX idx_payment_collections_law_firm_id ON payment_collections(law_firm_id);
  END IF;
END $$;

-- =====================================================
-- A3. REPLACE/ADD POLICIES ON TABLES WITH BUGGY OR MISSING POLICIES
-- Phase 8.6.1 policies use "id = auth.uid()" which is incorrect
-- (auth.uid() returns auth user id, not application user id)
-- Replace with auth.current_user_law_firm_id() pattern
-- =====================================================

-- time_entry_templates: drop incorrect policy, create correct one
DROP POLICY IF EXISTS "time_entry_templates_law_firm_isolation" ON time_entry_templates;
CREATE POLICY "time_entry_templates_staff_access" ON time_entry_templates
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id()
  );

-- lawyer_billing_rates: drop incorrect policy, create correct one
DROP POLICY IF EXISTS "lawyer_billing_rates_law_firm_isolation" ON lawyer_billing_rates;
CREATE POLICY "lawyer_billing_rates_staff_access" ON lawyer_billing_rates
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id()
  );

-- payment_installments: replace cascade-based policy with direct law_firm_id policy
DROP POLICY IF EXISTS "Staff can manage payment installments" ON payment_installments;
CREATE POLICY "payment_installments_staff_access" ON payment_installments
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id()
  );

-- business_parameters: replace with consistent pattern
DROP POLICY IF EXISTS "Staff can manage business parameters" ON business_parameters;
CREATE POLICY "business_parameters_staff_access" ON business_parameters
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id()
  );

-- Also fix other phase 8.6.1 tables that use incorrect "id = auth.uid()" pattern:
-- time_entries (phase 8.6.1 version — separate from 001 version)
DROP POLICY IF EXISTS "time_entries_law_firm_isolation" ON time_entries;
-- Note: migration 002 already created correct policies for time_entries;
-- this just cleans up the duplicate incorrect one from 8.6.1

-- subscription_time_allocations
DROP POLICY IF EXISTS "subscription_time_allocations_law_firm_isolation" ON subscription_time_allocations;
CREATE POLICY "subscription_time_allocations_staff_access" ON subscription_time_allocations
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id()
  );

-- time_entry_allocations (cascade through time_entries)
DROP POLICY IF EXISTS "time_entry_allocations_law_firm_isolation" ON time_entry_allocations;
CREATE POLICY "time_entry_allocations_staff_access" ON time_entry_allocations
  FOR ALL USING (
    time_entry_id IN (
      SELECT id FROM time_entries
      WHERE law_firm_id = auth.current_user_law_firm_id()
    )
  );

-- daily_time_summaries
DROP POLICY IF EXISTS "daily_time_summaries_law_firm_isolation" ON daily_time_summaries;
CREATE POLICY "daily_time_summaries_staff_access" ON daily_time_summaries
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id()
  );

-- active_time_sessions
DROP POLICY IF EXISTS "active_time_sessions_law_firm_isolation" ON active_time_sessions;
CREATE POLICY "active_time_sessions_staff_access" ON active_time_sessions
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id()
  );

-- Also fix phase 8.10.1 tables that use incorrect "id = auth.uid()" pattern:
DROP POLICY IF EXISTS "vendors_law_firm_isolation" ON vendors;
CREATE POLICY "vendors_staff_access" ON vendors
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id()
  );

DROP POLICY IF EXISTS "expense_categories_law_firm_isolation" ON expense_categories;
CREATE POLICY "expense_categories_staff_access" ON expense_categories
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id()
  );

DROP POLICY IF EXISTS "bills_law_firm_isolation" ON bills;
CREATE POLICY "bills_staff_access" ON bills
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id()
  );

-- bill_payments: replace cascade with direct (now has law_firm_id)
DROP POLICY IF EXISTS "bill_payments_law_firm_isolation" ON bill_payments;
CREATE POLICY "bill_payments_staff_access" ON bill_payments
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id()
  );

-- payment_collections: replace cascade with direct (now has law_firm_id)
DROP POLICY IF EXISTS "payment_collections_law_firm_isolation" ON payment_collections;
CREATE POLICY "payment_collections_staff_access" ON payment_collections
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id()
  );

-- payment_reminders: replace cascade with direct (now has law_firm_id)
DROP POLICY IF EXISTS "payment_reminders_law_firm_isolation" ON payment_reminders;
CREATE POLICY "payment_reminders_staff_access" ON payment_reminders
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id()
  );

DROP POLICY IF EXISTS "financial_documents_law_firm_isolation" ON financial_documents;
CREATE POLICY "financial_documents_staff_access" ON financial_documents
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id()
  );

DROP POLICY IF EXISTS "financial_alerts_law_firm_isolation" ON financial_alerts;
CREATE POLICY "financial_alerts_staff_access" ON financial_alerts
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id()
  );

-- Also fix matter_contacts to use direct law_firm_id (now has the column)
DROP POLICY IF EXISTS "matter_contacts_staff_access" ON matter_contacts;
CREATE POLICY "matter_contacts_staff_access_v2" ON matter_contacts
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id() AND auth.current_user_is_staff()
  );

-- =====================================================
-- A4. ADD SUPER_ADMIN BYPASS POLICIES
-- Tables from phase 8.6.1, 8.7.1, and 8.10.1 missing super_admin access
-- =====================================================

-- Phase 8.6.1 tables
CREATE POLICY "super_admin_all_time_entry_templates" ON time_entry_templates
  FOR ALL USING (public.is_super_admin());
CREATE POLICY "super_admin_all_lawyer_billing_rates" ON lawyer_billing_rates
  FOR ALL USING (public.is_super_admin());
CREATE POLICY "super_admin_all_subscription_time_allocations" ON subscription_time_allocations
  FOR ALL USING (public.is_super_admin());
CREATE POLICY "super_admin_all_time_entry_allocations" ON time_entry_allocations
  FOR ALL USING (public.is_super_admin());
CREATE POLICY "super_admin_all_daily_time_summaries" ON daily_time_summaries
  FOR ALL USING (public.is_super_admin());
CREATE POLICY "super_admin_all_active_time_sessions" ON active_time_sessions
  FOR ALL USING (public.is_super_admin());

-- Phase 8.7.1 invoice tables
CREATE POLICY "super_admin_all_invoices_v2" ON invoices
  FOR ALL USING (public.is_super_admin());
CREATE POLICY "super_admin_all_invoice_line_items_v2" ON invoice_line_items
  FOR ALL USING (public.is_super_admin());
CREATE POLICY "super_admin_all_subscription_invoices" ON subscription_invoices
  FOR ALL USING (public.is_super_admin());
CREATE POLICY "super_admin_all_case_invoices" ON case_invoices
  FOR ALL USING (public.is_super_admin());
CREATE POLICY "super_admin_all_payment_plan_invoices" ON payment_plan_invoices
  FOR ALL USING (public.is_super_admin());
CREATE POLICY "super_admin_all_time_based_invoices" ON time_based_invoices
  FOR ALL USING (public.is_super_admin());
CREATE POLICY "super_admin_all_invoice_payments" ON invoice_payments
  FOR ALL USING (public.is_super_admin());
CREATE POLICY "super_admin_all_invoice_templates" ON invoice_templates
  FOR ALL USING (public.is_super_admin());
CREATE POLICY "super_admin_all_invoice_generation_logs" ON invoice_generation_logs
  FOR ALL USING (public.is_super_admin());

-- Phase 8.10.1 financial tables
CREATE POLICY "super_admin_all_expense_categories" ON expense_categories
  FOR ALL USING (public.is_super_admin());
CREATE POLICY "super_admin_all_bill_payments" ON bill_payments
  FOR ALL USING (public.is_super_admin());
CREATE POLICY "super_admin_all_payment_collections" ON payment_collections
  FOR ALL USING (public.is_super_admin());
CREATE POLICY "super_admin_all_payment_reminders" ON payment_reminders
  FOR ALL USING (public.is_super_admin());
CREATE POLICY "super_admin_all_financial_documents" ON financial_documents
  FOR ALL USING (public.is_super_admin());
CREATE POLICY "super_admin_all_financial_alerts" ON financial_alerts
  FOR ALL USING (public.is_super_admin());

-- Phase 005 billing tables missing super_admin
CREATE POLICY "super_admin_all_payment_plans" ON payment_plans
  FOR ALL USING (public.is_super_admin());
CREATE POLICY "super_admin_all_payment_installments" ON payment_installments
  FOR ALL USING (public.is_super_admin());
CREATE POLICY "super_admin_all_business_parameters" ON business_parameters
  FOR ALL USING (public.is_super_admin());
CREATE POLICY "super_admin_all_case_billing_methods" ON case_billing_methods
  FOR ALL USING (public.is_super_admin());
CREATE POLICY "super_admin_all_case_outcomes" ON case_outcomes
  FOR ALL USING (public.is_super_admin());

-- =====================================================
-- A5. FIX FOREIGN KEY REFERENCES
-- payment_collections and payment_reminders reference non-existent clients table
-- Should reference contacts table instead
-- =====================================================

-- payment_collections: fix client_id FK
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'payment_collections_client_id_fkey'
    AND table_name = 'payment_collections'
  ) THEN
    ALTER TABLE payment_collections DROP CONSTRAINT payment_collections_client_id_fkey;
    ALTER TABLE payment_collections
      ADD CONSTRAINT payment_collections_contact_id_fkey
      FOREIGN KEY (client_id) REFERENCES contacts(id);
  END IF;
END $$;

-- payment_reminders: fix client_id FK
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'payment_reminders_client_id_fkey'
    AND table_name = 'payment_reminders'
  ) THEN
    ALTER TABLE payment_reminders DROP CONSTRAINT payment_reminders_client_id_fkey;
    ALTER TABLE payment_reminders
      ADD CONSTRAINT payment_reminders_contact_id_fkey
      FOREIGN KEY (client_id) REFERENCES contacts(id);
  END IF;
END $$;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON POLICY "invoices_staff_access" ON invoices IS
  'Replaces unsafe current_setting pattern with auth.current_user_law_firm_id()';

COMMENT ON POLICY "matter_contacts_staff_access_v2" ON matter_contacts IS
  'Direct law_firm_id isolation — no longer cascades through matters';
