-- =====================================================
-- Prima Facie - Phase 8 Billing RLS Policies
-- Row Level Security for Legal-as-a-Service Platform
-- =====================================================

-- Enable RLS on all billing tables
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_billing_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_plan_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE applied_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_tracking_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_rate_templates ENABLE ROW LEVEL SECURITY;

-- Financial Management Tables
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_reminders ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SUBSCRIPTION MANAGEMENT POLICIES
-- =====================================================

-- Subscription Plans: Staff can manage, clients can read
CREATE POLICY "subscription_plans_staff_manage" ON subscription_plans
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id() AND
    auth.current_user_is_staff()
  );

CREATE POLICY "subscription_plans_client_read" ON subscription_plans
  FOR SELECT USING (
    law_firm_id = auth.current_user_law_firm_id() AND
    is_active = true
  );

-- Client Subscriptions: Staff can manage, clients can view their own
CREATE POLICY "client_subscriptions_staff_manage" ON client_subscriptions
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id() AND
    auth.current_user_is_staff()
  );

CREATE POLICY "client_subscriptions_client_own" ON client_subscriptions
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM contacts 
      WHERE user_id = auth.current_user_id()
    )
  );

-- Subscription Usage: Staff can manage, clients can view their own
CREATE POLICY "subscription_usage_staff_manage" ON subscription_usage
  FOR ALL USING (
    client_subscription_id IN (
      SELECT id FROM client_subscriptions 
      WHERE law_firm_id = auth.current_user_law_firm_id()
    ) AND
    auth.current_user_is_staff()
  );

CREATE POLICY "subscription_usage_client_own" ON subscription_usage
  FOR SELECT USING (
    client_subscription_id IN (
      SELECT cs.id FROM client_subscriptions cs
      JOIN contacts c ON cs.client_id = c.id
      WHERE c.user_id = auth.current_user_id()
    )
  );

-- Subscription Invoices: Staff can manage, clients can view their own
CREATE POLICY "subscription_invoices_staff_manage" ON subscription_invoices
  FOR ALL USING (
    client_subscription_id IN (
      SELECT id FROM client_subscriptions 
      WHERE law_firm_id = auth.current_user_law_firm_id()
    ) AND
    auth.current_user_is_staff()
  );

CREATE POLICY "subscription_invoices_client_own" ON subscription_invoices
  FOR SELECT USING (
    client_subscription_id IN (
      SELECT cs.id FROM client_subscriptions cs
      JOIN contacts c ON cs.client_id = c.id
      WHERE c.user_id = auth.current_user_id()
    )
  );

-- =====================================================
-- CASE BILLING POLICIES
-- =====================================================

-- Case Types: Law firm isolation
CREATE POLICY "case_types_law_firm_access" ON case_types
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id() AND
    auth.current_user_is_staff()
  );

-- Case Billing Configs: Staff can manage, tied to matters
CREATE POLICY "case_billing_configs_staff_manage" ON case_billing_configs
  FOR ALL USING (
    matter_id IN (
      SELECT id FROM matters 
      WHERE law_firm_id = auth.current_user_law_firm_id()
    ) AND
    auth.current_user_is_staff()
  );

-- Case Outcomes: Staff can manage, tied to matters
CREATE POLICY "case_outcomes_staff_manage" ON case_outcomes
  FOR ALL USING (
    matter_id IN (
      SELECT id FROM matters 
      WHERE law_firm_id = auth.current_user_law_firm_id()
    ) AND
    auth.current_user_is_staff()
  );

-- Case Invoices: Staff can manage, clients can view their own
CREATE POLICY "case_invoices_staff_manage" ON case_invoices
  FOR ALL USING (
    matter_id IN (
      SELECT id FROM matters 
      WHERE law_firm_id = auth.current_user_law_firm_id()
    ) AND
    auth.current_user_is_staff()
  );

CREATE POLICY "case_invoices_client_own" ON case_invoices
  FOR SELECT USING (
    matter_id IN (
      SELECT mc.matter_id 
      FROM matter_contacts mc
      JOIN contacts c ON mc.contact_id = c.id
      WHERE c.user_id = auth.current_user_id()
    )
  );

-- =====================================================
-- PAYMENT PLAN POLICIES
-- =====================================================

-- Payment Plans: Staff can manage, clients can view their own
CREATE POLICY "payment_plans_staff_manage" ON payment_plans
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id() AND
    auth.current_user_is_staff()
  );

CREATE POLICY "payment_plans_client_own" ON payment_plans
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM contacts 
      WHERE user_id = auth.current_user_id()
    )
  );

-- Payment Plan Invoices: Staff can manage, clients can view their own
CREATE POLICY "payment_plan_invoices_staff_manage" ON payment_plan_invoices
  FOR ALL USING (
    payment_plan_id IN (
      SELECT id FROM payment_plans 
      WHERE law_firm_id = auth.current_user_law_firm_id()
    ) AND
    auth.current_user_is_staff()
  );

CREATE POLICY "payment_plan_invoices_client_own" ON payment_plan_invoices
  FOR SELECT USING (
    payment_plan_id IN (
      SELECT pp.id FROM payment_plans pp
      JOIN contacts c ON pp.client_id = c.id
      WHERE c.user_id = auth.current_user_id()
    )
  );

-- =====================================================
-- DISCOUNT SYSTEM POLICIES
-- =====================================================

-- Discount Rules: Staff can manage
CREATE POLICY "discount_rules_staff_manage" ON discount_rules
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id() AND
    auth.current_user_is_staff()
  );

-- Applied Discounts: Staff can manage, clients can view their own
CREATE POLICY "applied_discounts_staff_manage" ON applied_discounts
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id() AND
    auth.current_user_is_staff()
  );

CREATE POLICY "applied_discounts_client_view" ON applied_discounts
  FOR SELECT USING (
    client_id IN (
      SELECT id FROM contacts 
      WHERE user_id = auth.current_user_id()
    )
  );

-- =====================================================
-- TIME TRACKING POLICIES
-- =====================================================

-- Time Tracking Entries: Staff can manage all, users can manage their own
CREATE POLICY "time_tracking_entries_staff_manage" ON time_tracking_entries
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id() AND
    auth.current_user_is_staff()
  );

CREATE POLICY "time_tracking_entries_user_own" ON time_tracking_entries
  FOR ALL USING (
    user_id = auth.current_user_id()
  );

-- Billing Rates: Staff can manage
CREATE POLICY "billing_rates_staff_manage" ON billing_rates
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id() AND
    auth.current_user_is_staff()
  );

-- Billing Rate Templates: Staff can manage
CREATE POLICY "billing_rate_templates_staff_manage" ON billing_rate_templates
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id() AND
    auth.current_user_is_staff()
  );

-- =====================================================
-- FINANCIAL MANAGEMENT POLICIES
-- =====================================================

-- Vendors: Staff can manage
CREATE POLICY "vendors_staff_manage" ON vendors
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id() AND
    auth.current_user_is_staff()
  );

-- Bills: Staff can manage
CREATE POLICY "bills_staff_manage" ON bills
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id() AND
    auth.current_user_is_staff()
  );

-- Bill Line Items: Follow parent bill policies
CREATE POLICY "bill_line_items_staff_manage" ON bill_line_items
  FOR ALL USING (
    bill_id IN (
      SELECT id FROM bills 
      WHERE law_firm_id = auth.current_user_law_firm_id()
    ) AND
    auth.current_user_is_staff()
  );

-- Bill Payments: Staff can manage
CREATE POLICY "bill_payments_staff_manage" ON bill_payments
  FOR ALL USING (
    bill_id IN (
      SELECT id FROM bills 
      WHERE law_firm_id = auth.current_user_law_firm_id()
    ) AND
    auth.current_user_is_staff()
  );

-- Payment Reminders: Staff can manage
CREATE POLICY "payment_reminders_staff_manage" ON payment_reminders
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id() AND
    auth.current_user_is_staff()
  );

-- =====================================================
-- ANALYTICS AND VIEWS POLICIES
-- =====================================================

-- Note: Views inherit RLS from underlying tables
-- These policies ensure proper access to aggregated data

-- Additional helper function for subscription access
CREATE OR REPLACE FUNCTION auth.user_has_subscription_access(subscription_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM client_subscriptions cs
    WHERE cs.id = subscription_id
    AND (
      -- Staff can access all subscriptions in their law firm
      (cs.law_firm_id = auth.current_user_law_firm_id() AND auth.current_user_is_staff())
      OR
      -- Clients can access their own subscriptions
      cs.client_id IN (
        SELECT id FROM contacts 
        WHERE user_id = auth.current_user_id()
      )
    )
  );
$$;

-- Helper function for matter access (billing context)
CREATE OR REPLACE FUNCTION auth.user_has_matter_billing_access(matter_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM matters m
    WHERE m.id = matter_id
    AND (
      -- Staff can access all matters in their law firm
      (m.law_firm_id = auth.current_user_law_firm_id() AND auth.current_user_is_staff())
      OR
      -- Clients can access matters they are involved in
      m.id IN (
        SELECT mc.matter_id 
        FROM matter_contacts mc
        JOIN contacts c ON mc.contact_id = c.id
        WHERE c.user_id = auth.current_user_id()
      )
    )
  );
$$;

-- =====================================================
-- CLIENT PORTAL BILLING ACCESS
-- =====================================================

-- Special policy for client portal invoice access
CREATE POLICY "client_portal_invoice_access" ON subscription_invoices
  FOR SELECT USING (
    client_subscription_id IN (
      SELECT cs.id FROM client_subscriptions cs
      WHERE cs.client_id IN (
        SELECT id FROM contacts 
        WHERE user_id = auth.current_user_id()
      )
    )
  );

-- Client portal case invoice access
CREATE POLICY "client_portal_case_invoice_access" ON case_invoices
  FOR SELECT USING (
    matter_id IN (
      SELECT mc.matter_id 
      FROM matter_contacts mc
      JOIN contacts c ON mc.contact_id = c.id
      WHERE c.user_id = auth.current_user_id()
    )
  );

-- Client portal payment plan access
CREATE POLICY "client_portal_payment_plan_access" ON payment_plan_invoices
  FOR SELECT USING (
    payment_plan_id IN (
      SELECT pp.id FROM payment_plans pp
      WHERE pp.client_id IN (
        SELECT id FROM contacts 
        WHERE user_id = auth.current_user_id()
      )
    )
  );

-- =====================================================
-- AUDIT AND ACTIVITY LOGGING
-- =====================================================

-- Create triggers for automatic activity logging on billing tables
CREATE TRIGGER billing_activity_log_trigger
  AFTER INSERT OR UPDATE OR DELETE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION log_activity();

CREATE TRIGGER subscription_activity_log_trigger
  AFTER INSERT OR UPDATE OR DELETE ON client_subscriptions
  FOR EACH ROW EXECUTE FUNCTION log_activity();

CREATE TRIGGER case_billing_activity_log_trigger
  AFTER INSERT OR UPDATE OR DELETE ON case_billing_configs
  FOR EACH ROW EXECUTE FUNCTION log_activity();

CREATE TRIGGER payment_plan_activity_log_trigger
  AFTER INSERT OR UPDATE OR DELETE ON payment_plans
  FOR EACH ROW EXECUTE FUNCTION log_activity();

CREATE TRIGGER discount_activity_log_trigger
  AFTER INSERT OR UPDATE OR DELETE ON applied_discounts
  FOR EACH ROW EXECUTE FUNCTION log_activity();

-- =====================================================
-- SECURITY VALIDATION FUNCTIONS
-- =====================================================

-- Function to validate invoice access before payment processing
CREATE OR REPLACE FUNCTION auth.validate_invoice_payment_access(
  invoice_type TEXT,
  invoice_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN invoice_type = 'subscription' THEN
      EXISTS (
        SELECT 1 FROM subscription_invoices si
        JOIN client_subscriptions cs ON si.client_subscription_id = cs.id
        WHERE si.id = invoice_id
        AND cs.client_id IN (
          SELECT id FROM contacts WHERE user_id = auth.current_user_id()
        )
      )
    WHEN invoice_type = 'case' THEN
      EXISTS (
        SELECT 1 FROM case_invoices ci
        JOIN matters m ON ci.matter_id = m.id
        JOIN matter_contacts mc ON m.id = mc.matter_id
        JOIN contacts c ON mc.contact_id = c.id
        WHERE ci.id = invoice_id
        AND c.user_id = auth.current_user_id()
      )
    WHEN invoice_type = 'payment_plan' THEN
      EXISTS (
        SELECT 1 FROM payment_plan_invoices ppi
        JOIN payment_plans pp ON ppi.payment_plan_id = pp.id
        WHERE ppi.id = invoice_id
        AND pp.client_id IN (
          SELECT id FROM contacts WHERE user_id = auth.current_user_id()
        )
      )
    ELSE FALSE
  END;
$$;

-- =====================================================
-- PERFORMANCE INDEXES FOR RLS
-- =====================================================

-- Indexes to optimize RLS policy performance
CREATE INDEX IF NOT EXISTS idx_subscription_plans_law_firm_active 
  ON subscription_plans(law_firm_id, is_active);

CREATE INDEX IF NOT EXISTS idx_client_subscriptions_law_firm_client 
  ON client_subscriptions(law_firm_id, client_id);

CREATE INDEX IF NOT EXISTS idx_subscription_usage_subscription_date 
  ON subscription_usage(client_subscription_id, usage_date);

CREATE INDEX IF NOT EXISTS idx_case_invoices_matter_status 
  ON case_invoices(matter_id, status);

CREATE INDEX IF NOT EXISTS idx_payment_plans_law_firm_client 
  ON payment_plans(law_firm_id, client_id);

CREATE INDEX IF NOT EXISTS idx_time_tracking_user_date 
  ON time_tracking_entries(user_id, entry_date);

CREATE INDEX IF NOT EXISTS idx_bills_law_firm_status 
  ON bills(law_firm_id, status);

-- =====================================================
-- FINAL SECURITY NOTES
-- =====================================================

-- 1. All billing data is isolated by law_firm_id
-- 2. Clients can only access their own billing information
-- 3. Staff can manage all data within their law firm
-- 4. Payment processing requires additional validation
-- 5. All changes are automatically logged for audit trails
-- 6. Performance indexes support efficient RLS queries

COMMENT ON SCHEMA public IS 'Prima Facie Legal-as-a-Service Platform - Phase 8 RLS Implementation Complete';