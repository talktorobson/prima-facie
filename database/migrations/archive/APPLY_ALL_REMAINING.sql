-- =====================================================
-- COMBINED MIGRATION: Apply all missing functions, policies, and tables
-- All helper functions in PUBLIC schema (Supabase blocks auth schema writes)
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- =====================================================

-- =====================================================
-- STEP 1: Enable RLS on all tables (idempotent)
-- =====================================================
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

-- =====================================================
-- STEP 2: Helper functions in PUBLIC schema
-- (Supabase does not allow creating functions in auth schema)
-- =====================================================

CREATE OR REPLACE FUNCTION public.current_user_law_firm_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT law_firm_id
  FROM users
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_type = 'admin'
  FROM users
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_is_staff()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_type IN ('admin', 'lawyer', 'staff')
  FROM users
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM users
  WHERE auth_user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE auth_user_id = auth.uid()
    AND user_type = 'super_admin'
  );
$$;

-- =====================================================
-- STEP 3: RLS Policies for core tables
-- All use public.current_user_* functions
-- =====================================================

-- LAW FIRMS
DROP POLICY IF EXISTS "law_firms_isolation" ON law_firms;
CREATE POLICY "law_firms_isolation" ON law_firms
  FOR ALL USING (id = public.current_user_law_firm_id());

DROP POLICY IF EXISTS "law_firms_admin_modify" ON law_firms;
CREATE POLICY "law_firms_admin_modify" ON law_firms
  FOR UPDATE USING (
    id = public.current_user_law_firm_id() AND public.current_user_is_admin()
  );

-- USERS
DROP POLICY IF EXISTS "users_law_firm_access" ON users;
CREATE POLICY "users_law_firm_access" ON users
  FOR SELECT USING (law_firm_id = public.current_user_law_firm_id());

DROP POLICY IF EXISTS "users_self_update" ON users;
CREATE POLICY "users_self_update" ON users
  FOR UPDATE USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "users_admin_manage" ON users;
CREATE POLICY "users_admin_manage" ON users
  FOR ALL USING (
    law_firm_id = public.current_user_law_firm_id() AND public.current_user_is_admin()
  );

DROP POLICY IF EXISTS "users_staff_create" ON users;
CREATE POLICY "users_staff_create" ON users
  FOR INSERT WITH CHECK (
    law_firm_id = public.current_user_law_firm_id() AND public.current_user_is_staff()
  );

-- MATTER TYPES
DROP POLICY IF EXISTS "matter_types_law_firm_access" ON matter_types;
CREATE POLICY "matter_types_law_firm_access" ON matter_types
  FOR ALL USING (law_firm_id = public.current_user_law_firm_id());

-- CONTACTS
DROP POLICY IF EXISTS "contacts_staff_access" ON contacts;
CREATE POLICY "contacts_staff_access" ON contacts
  FOR ALL USING (
    law_firm_id = public.current_user_law_firm_id() AND public.current_user_is_staff()
  );

DROP POLICY IF EXISTS "contacts_client_self_access" ON contacts;
CREATE POLICY "contacts_client_self_access" ON contacts
  FOR SELECT USING (user_id = public.current_user_id());

DROP POLICY IF EXISTS "contacts_client_self_update" ON contacts;
CREATE POLICY "contacts_client_self_update" ON contacts
  FOR UPDATE USING (user_id = public.current_user_id());

-- MATTERS
DROP POLICY IF EXISTS "matters_staff_access" ON matters;
CREATE POLICY "matters_staff_access" ON matters
  FOR ALL USING (
    law_firm_id = public.current_user_law_firm_id() AND public.current_user_is_staff()
  );

DROP POLICY IF EXISTS "matters_client_access" ON matters;
CREATE POLICY "matters_client_access" ON matters
  FOR SELECT USING (
    id IN (
      SELECT mc.matter_id FROM matter_contacts mc
      JOIN contacts c ON mc.contact_id = c.id
      WHERE c.user_id = public.current_user_id()
    )
  );

-- MATTER CONTACTS
DROP POLICY IF EXISTS "matter_contacts_staff_access" ON matter_contacts;
CREATE POLICY "matter_contacts_staff_access" ON matter_contacts
  FOR ALL USING (
    matter_id IN (
      SELECT id FROM matters WHERE law_firm_id = public.current_user_law_firm_id()
    ) AND public.current_user_is_staff()
  );

DROP POLICY IF EXISTS "matter_contacts_client_access" ON matter_contacts;
CREATE POLICY "matter_contacts_client_access" ON matter_contacts
  FOR SELECT USING (
    contact_id IN (SELECT id FROM contacts WHERE user_id = public.current_user_id())
  );

-- TASKS
DROP POLICY IF EXISTS "tasks_staff_access" ON tasks;
CREATE POLICY "tasks_staff_access" ON tasks
  FOR ALL USING (
    law_firm_id = public.current_user_law_firm_id() AND public.current_user_is_staff()
  );

DROP POLICY IF EXISTS "tasks_assigned_access" ON tasks;
CREATE POLICY "tasks_assigned_access" ON tasks
  FOR SELECT USING (assigned_to = public.current_user_id());

-- TIME ENTRIES
DROP POLICY IF EXISTS "time_entries_staff_access" ON time_entries;
CREATE POLICY "time_entries_staff_access" ON time_entries
  FOR ALL USING (
    law_firm_id = public.current_user_law_firm_id() AND public.current_user_is_staff()
  );

DROP POLICY IF EXISTS "time_entries_user_own" ON time_entries;
CREATE POLICY "time_entries_user_own" ON time_entries
  FOR ALL USING (user_id = public.current_user_id());

-- DOCUMENTS
DROP POLICY IF EXISTS "documents_staff_access" ON documents;
CREATE POLICY "documents_staff_access" ON documents
  FOR ALL USING (
    law_firm_id = public.current_user_law_firm_id() AND public.current_user_is_staff()
  );

-- INVOICES
DROP POLICY IF EXISTS "invoices_staff_access" ON invoices;
CREATE POLICY "invoices_staff_access" ON invoices
  FOR ALL USING (
    law_firm_id = public.current_user_law_firm_id() AND public.current_user_is_staff()
  );

-- INVOICE LINE ITEMS
DROP POLICY IF EXISTS "invoice_line_items_staff_access" ON invoice_line_items;
CREATE POLICY "invoice_line_items_staff_access" ON invoice_line_items
  FOR ALL USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE law_firm_id = public.current_user_law_firm_id()
    ) AND public.current_user_is_staff()
  );

-- MESSAGES
DROP POLICY IF EXISTS "messages_staff_access" ON messages;
CREATE POLICY "messages_staff_access" ON messages
  FOR ALL USING (
    law_firm_id = public.current_user_law_firm_id() AND public.current_user_is_staff()
  );

-- PIPELINE
DROP POLICY IF EXISTS "pipeline_stages_staff_access" ON pipeline_stages;
CREATE POLICY "pipeline_stages_staff_access" ON pipeline_stages
  FOR ALL USING (
    law_firm_id = public.current_user_law_firm_id() AND public.current_user_is_staff()
  );

DROP POLICY IF EXISTS "pipeline_cards_staff_access" ON pipeline_cards;
CREATE POLICY "pipeline_cards_staff_access" ON pipeline_cards
  FOR ALL USING (
    law_firm_id = public.current_user_law_firm_id() AND public.current_user_is_staff()
  );

-- ACTIVITY LOGS
DROP POLICY IF EXISTS "activity_logs_staff_read" ON activity_logs;
CREATE POLICY "activity_logs_staff_read" ON activity_logs
  FOR SELECT USING (
    law_firm_id = public.current_user_law_firm_id() AND public.current_user_is_staff()
  );

DROP POLICY IF EXISTS "activity_logs_system_insert" ON activity_logs;
CREATE POLICY "activity_logs_system_insert" ON activity_logs
  FOR INSERT WITH CHECK (law_firm_id = public.current_user_law_firm_id());

-- =====================================================
-- STEP 4: Super admin bypass policies
-- =====================================================

DROP POLICY IF EXISTS "super_admin_all_law_firms" ON law_firms;
CREATE POLICY "super_admin_all_law_firms" ON law_firms
  FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "super_admin_all_users" ON users;
CREATE POLICY "super_admin_all_users" ON users
  FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "super_admin_all_matters" ON matters;
CREATE POLICY "super_admin_all_matters" ON matters
  FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "super_admin_all_contacts" ON contacts;
CREATE POLICY "super_admin_all_contacts" ON contacts
  FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "super_admin_all_tasks" ON tasks;
CREATE POLICY "super_admin_all_tasks" ON tasks
  FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "super_admin_all_time_entries" ON time_entries;
CREATE POLICY "super_admin_all_time_entries" ON time_entries
  FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "super_admin_all_documents" ON documents;
CREATE POLICY "super_admin_all_documents" ON documents
  FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "super_admin_all_invoices" ON invoices;
CREATE POLICY "super_admin_all_invoices" ON invoices
  FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "super_admin_all_invoice_line_items" ON invoice_line_items;
CREATE POLICY "super_admin_all_invoice_line_items" ON invoice_line_items
  FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "super_admin_all_messages" ON messages;
CREATE POLICY "super_admin_all_messages" ON messages
  FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "super_admin_all_pipeline_stages" ON pipeline_stages;
CREATE POLICY "super_admin_all_pipeline_stages" ON pipeline_stages
  FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "super_admin_all_pipeline_cards" ON pipeline_cards;
CREATE POLICY "super_admin_all_pipeline_cards" ON pipeline_cards
  FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "super_admin_all_activity_logs" ON activity_logs;
CREATE POLICY "super_admin_all_activity_logs" ON activity_logs
  FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "super_admin_all_matter_types" ON matter_types;
CREATE POLICY "super_admin_all_matter_types" ON matter_types
  FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "super_admin_all_matter_contacts" ON matter_contacts;
CREATE POLICY "super_admin_all_matter_contacts" ON matter_contacts
  FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "super_admin_all_subscription_plans" ON subscription_plans;
CREATE POLICY "super_admin_all_subscription_plans" ON subscription_plans
  FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "super_admin_all_case_types" ON case_types;
CREATE POLICY "super_admin_all_case_types" ON case_types
  FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "super_admin_all_client_subscriptions" ON client_subscriptions;
CREATE POLICY "super_admin_all_client_subscriptions" ON client_subscriptions
  FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "super_admin_all_discount_rules" ON discount_rules;
CREATE POLICY "super_admin_all_discount_rules" ON discount_rules
  FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "super_admin_all_vendors" ON vendors;
CREATE POLICY "super_admin_all_vendors" ON vendors
  FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "super_admin_all_bills" ON bills;
CREATE POLICY "super_admin_all_bills" ON bills
  FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "super_admin_all_expense_categories" ON expense_categories;
CREATE POLICY "super_admin_all_expense_categories" ON expense_categories
  FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "super_admin_all_financial_alerts" ON financial_alerts;
CREATE POLICY "super_admin_all_financial_alerts" ON financial_alerts
  FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "super_admin_all_bill_payments" ON bill_payments;
CREATE POLICY "super_admin_all_bill_payments" ON bill_payments
  FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "super_admin_all_payment_collections" ON payment_collections;
CREATE POLICY "super_admin_all_payment_collections" ON payment_collections
  FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "super_admin_all_payment_reminders" ON payment_reminders;
CREATE POLICY "super_admin_all_payment_reminders" ON payment_reminders
  FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "super_admin_all_payment_plans" ON payment_plans;
CREATE POLICY "super_admin_all_payment_plans" ON payment_plans
  FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "super_admin_all_payment_installments" ON payment_installments;
CREATE POLICY "super_admin_all_payment_installments" ON payment_installments
  FOR ALL USING (public.is_super_admin());

-- =====================================================
-- STEP 5: Billing table RLS policies
-- =====================================================

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscription_plans_staff_access" ON subscription_plans;
CREATE POLICY "subscription_plans_staff_access" ON subscription_plans
  FOR ALL USING (
    law_firm_id = public.current_user_law_firm_id() AND public.current_user_is_staff()
  );

DROP POLICY IF EXISTS "case_types_staff_access" ON case_types;
CREATE POLICY "case_types_staff_access" ON case_types
  FOR ALL USING (
    law_firm_id = public.current_user_law_firm_id() AND public.current_user_is_staff()
  );

DROP POLICY IF EXISTS "client_subscriptions_staff_access" ON client_subscriptions;
CREATE POLICY "client_subscriptions_staff_access" ON client_subscriptions
  FOR ALL USING (
    law_firm_id = public.current_user_law_firm_id() AND public.current_user_is_staff()
  );

DROP POLICY IF EXISTS "discount_rules_staff_access" ON discount_rules;
CREATE POLICY "discount_rules_staff_access" ON discount_rules
  FOR ALL USING (
    law_firm_id = public.current_user_law_firm_id() AND public.current_user_is_staff()
  );

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vendors_staff_access" ON vendors;
CREATE POLICY "vendors_staff_access" ON vendors
  FOR ALL USING (law_firm_id = public.current_user_law_firm_id());

DROP POLICY IF EXISTS "bills_staff_access" ON bills;
CREATE POLICY "bills_staff_access" ON bills
  FOR ALL USING (law_firm_id = public.current_user_law_firm_id());

DROP POLICY IF EXISTS "bill_payments_staff_access" ON bill_payments;
CREATE POLICY "bill_payments_staff_access" ON bill_payments
  FOR ALL USING (law_firm_id = public.current_user_law_firm_id());

DROP POLICY IF EXISTS "expense_categories_staff_access" ON expense_categories;
CREATE POLICY "expense_categories_staff_access" ON expense_categories
  FOR ALL USING (law_firm_id = public.current_user_law_firm_id());

DROP POLICY IF EXISTS "financial_alerts_staff_access" ON financial_alerts;
CREATE POLICY "financial_alerts_staff_access" ON financial_alerts
  FOR ALL USING (law_firm_id = public.current_user_law_firm_id());

DROP POLICY IF EXISTS "payment_plans_staff_access" ON payment_plans;
CREATE POLICY "payment_plans_staff_access" ON payment_plans
  FOR ALL USING (law_firm_id = public.current_user_law_firm_id());

DROP POLICY IF EXISTS "payment_installments_staff_access" ON payment_installments;
CREATE POLICY "payment_installments_staff_access" ON payment_installments
  FOR ALL USING (law_firm_id = public.current_user_law_firm_id());

DROP POLICY IF EXISTS "payment_collections_staff_access" ON payment_collections;
CREATE POLICY "payment_collections_staff_access" ON payment_collections
  FOR ALL USING (law_firm_id = public.current_user_law_firm_id());

DROP POLICY IF EXISTS "payment_reminders_staff_access" ON payment_reminders;
CREATE POLICY "payment_reminders_staff_access" ON payment_reminders
  FOR ALL USING (law_firm_id = public.current_user_law_firm_id());

-- =====================================================
-- STEP 6: New tables - Articles, Contact Submissions, Newsletter
-- =====================================================

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

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ
);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "articles_public_read" ON articles;
CREATE POLICY "articles_public_read" ON articles
  FOR SELECT USING (published = true);

DROP POLICY IF EXISTS "articles_staff_manage" ON articles;
CREATE POLICY "articles_staff_manage" ON articles
  FOR ALL USING (
    law_firm_id = public.current_user_law_firm_id() AND public.current_user_is_staff()
  );

DROP POLICY IF EXISTS "contact_submissions_public_insert" ON contact_submissions;
CREATE POLICY "contact_submissions_public_insert" ON contact_submissions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "contact_submissions_staff_read" ON contact_submissions;
CREATE POLICY "contact_submissions_staff_read" ON contact_submissions
  FOR SELECT USING (public.current_user_is_staff());

DROP POLICY IF EXISTS "newsletter_public_insert" ON newsletter_subscribers;
CREATE POLICY "newsletter_public_insert" ON newsletter_subscribers
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "newsletter_staff_read" ON newsletter_subscribers;
CREATE POLICY "newsletter_staff_read" ON newsletter_subscribers
  FOR SELECT USING (public.current_user_is_staff());

DROP POLICY IF EXISTS "super_admin_all_articles" ON articles;
CREATE POLICY "super_admin_all_articles" ON articles
  FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "super_admin_all_contact_submissions" ON contact_submissions;
CREATE POLICY "super_admin_all_contact_submissions" ON contact_submissions
  FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "super_admin_all_newsletter" ON newsletter_subscribers;
CREATE POLICY "super_admin_all_newsletter" ON newsletter_subscribers
  FOR ALL USING (public.is_super_admin());

-- =====================================================
-- DONE! All functions use public.* schema, all policies applied.
-- =====================================================
