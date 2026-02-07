-- =====================================================
-- Prima Facie - Super Admin Migration
-- Platform-level super_admin role with multi-instance view
-- =====================================================

-- =====================================================
-- 1. SCHEMA CHANGES
-- =====================================================

-- Add 'super_admin' to user_type CHECK constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_type_check;
ALTER TABLE users ADD CONSTRAINT users_user_type_check
  CHECK (user_type IN ('admin', 'lawyer', 'staff', 'client', 'super_admin'));

-- Make law_firm_id nullable (super_admin has no firm)
ALTER TABLE users ALTER COLUMN law_firm_id DROP NOT NULL;

-- Replace the UNIQUE(law_firm_id, email) with partial indexes
-- to handle NULL law_firm_id correctly
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_law_firm_id_email_key;

-- Unique email per law firm (for firm-scoped users)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_unique_email_per_firm
  ON users (law_firm_id, email) WHERE law_firm_id IS NOT NULL;

-- Unique email for platform users (no firm)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_unique_email_platform
  ON users (email) WHERE law_firm_id IS NULL;

-- =====================================================
-- 2. SUPER ADMIN HELPER FUNCTION (public schema)
-- =====================================================
-- Note: auth schema is restricted on Supabase hosted,
-- so we create in public schema instead.

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT user_type = 'super_admin'
     FROM users
     WHERE auth_user_id = auth.uid()
     LIMIT 1),
    false
  );
$$;

-- =====================================================
-- 3. UPDATE EXISTING RLS POLICIES
-- =====================================================

-- ----- LAW FIRMS -----
-- Existing: law_firms_all_authenticated (ALL where auth.uid() IS NOT NULL)
-- Already allows all authenticated users. No change needed — super_admin passes.

-- ----- USERS -----
-- Existing: users_all_authenticated (ALL where auth.uid() IS NOT NULL)
-- Already allows all authenticated users. No change needed — super_admin passes.
-- Existing: users_self_update (UPDATE where auth_user_id = auth.uid()) — OK as-is.

-- ----- DATAJUD tables -----
-- Add super_admin bypass to all datajud policies

DROP POLICY IF EXISTS "Users can view their law firm's datajud case details" ON datajud_case_details;
CREATE POLICY "Users can view their law firm's datajud case details" ON datajud_case_details
  FOR SELECT USING (
    law_firm_id IN (SELECT u.law_firm_id FROM users u WHERE u.auth_user_id = auth.uid())
    OR public.is_super_admin()
  );

DROP POLICY IF EXISTS "Users can insert datajud case details for their law firm" ON datajud_case_details;
CREATE POLICY "Users can insert datajud case details for their law firm" ON datajud_case_details
  FOR INSERT WITH CHECK (
    law_firm_id IN (SELECT u.law_firm_id FROM users u WHERE u.auth_user_id = auth.uid())
    OR public.is_super_admin()
  );

DROP POLICY IF EXISTS "Users can update their law firm's datajud case details" ON datajud_case_details;
CREATE POLICY "Users can update their law firm's datajud case details" ON datajud_case_details
  FOR UPDATE USING (
    law_firm_id IN (SELECT u.law_firm_id FROM users u WHERE u.auth_user_id = auth.uid())
    OR public.is_super_admin()
  );

DROP POLICY IF EXISTS "Users can view their law firm's datajud participants" ON datajud_case_participants;
CREATE POLICY "Users can view their law firm's datajud participants" ON datajud_case_participants
  FOR SELECT USING (
    law_firm_id IN (SELECT u.law_firm_id FROM users u WHERE u.auth_user_id = auth.uid())
    OR public.is_super_admin()
  );

DROP POLICY IF EXISTS "Users can manage their law firm's datajud participants" ON datajud_case_participants;
CREATE POLICY "Users can manage their law firm's datajud participants" ON datajud_case_participants
  FOR ALL USING (
    law_firm_id IN (SELECT u.law_firm_id FROM users u WHERE u.auth_user_id = auth.uid())
    OR public.is_super_admin()
  );

DROP POLICY IF EXISTS "Users can view their law firm's datajud legal subjects" ON datajud_legal_subjects;
CREATE POLICY "Users can view their law firm's datajud legal subjects" ON datajud_legal_subjects
  FOR SELECT USING (
    law_firm_id IN (SELECT u.law_firm_id FROM users u WHERE u.auth_user_id = auth.uid())
    OR public.is_super_admin()
  );

DROP POLICY IF EXISTS "Users can manage their law firm's datajud legal subjects" ON datajud_legal_subjects;
CREATE POLICY "Users can manage their law firm's datajud legal subjects" ON datajud_legal_subjects
  FOR ALL USING (
    law_firm_id IN (SELECT u.law_firm_id FROM users u WHERE u.auth_user_id = auth.uid())
    OR public.is_super_admin()
  );

DROP POLICY IF EXISTS "Users can view their law firm's datajud sync logs" ON datajud_sync_log;
CREATE POLICY "Users can view their law firm's datajud sync logs" ON datajud_sync_log
  FOR SELECT USING (
    law_firm_id IN (SELECT u.law_firm_id FROM users u WHERE u.auth_user_id = auth.uid())
    OR public.is_super_admin()
  );

DROP POLICY IF EXISTS "Users can create sync logs for their law firm" ON datajud_sync_log;
CREATE POLICY "Users can create sync logs for their law firm" ON datajud_sync_log
  FOR INSERT WITH CHECK (
    law_firm_id IN (SELECT u.law_firm_id FROM users u WHERE u.auth_user_id = auth.uid())
    OR public.is_super_admin()
  );

DROP POLICY IF EXISTS "Users can view their law firm's datajud timeline events" ON datajud_timeline_events;
CREATE POLICY "Users can view their law firm's datajud timeline events" ON datajud_timeline_events
  FOR SELECT USING (
    law_firm_id IN (SELECT u.law_firm_id FROM users u WHERE u.auth_user_id = auth.uid())
    OR public.is_super_admin()
  );

DROP POLICY IF EXISTS "Users can manage their law firm's datajud timeline events" ON datajud_timeline_events;
CREATE POLICY "Users can manage their law firm's datajud timeline events" ON datajud_timeline_events
  FOR ALL USING (
    law_firm_id IN (SELECT u.law_firm_id FROM users u WHERE u.auth_user_id = auth.uid())
    OR public.is_super_admin()
  );

-- =====================================================
-- 4. ADD SUPER ADMIN BYPASS POLICIES
-- These grant full access to super_admin on all tables
-- that have RLS enabled but may lack policies for this role.
-- =====================================================

-- Core tables
CREATE POLICY "super_admin_all_matter_types" ON matter_types FOR ALL USING (public.is_super_admin());
CREATE POLICY "super_admin_all_contacts" ON contacts FOR ALL USING (public.is_super_admin());
CREATE POLICY "super_admin_all_matters" ON matters FOR ALL USING (public.is_super_admin());
CREATE POLICY "super_admin_all_matter_contacts" ON matter_contacts FOR ALL USING (public.is_super_admin());
CREATE POLICY "super_admin_all_tasks" ON tasks FOR ALL USING (public.is_super_admin());
CREATE POLICY "super_admin_all_time_entries" ON time_entries FOR ALL USING (public.is_super_admin());
CREATE POLICY "super_admin_all_documents" ON documents FOR ALL USING (public.is_super_admin());
CREATE POLICY "super_admin_all_invoices" ON invoices FOR ALL USING (public.is_super_admin());
CREATE POLICY "super_admin_all_invoice_line_items" ON invoice_line_items FOR ALL USING (public.is_super_admin());
CREATE POLICY "super_admin_all_messages" ON messages FOR ALL USING (public.is_super_admin());
CREATE POLICY "super_admin_all_pipeline_stages" ON pipeline_stages FOR ALL USING (public.is_super_admin());
CREATE POLICY "super_admin_all_pipeline_cards" ON pipeline_cards FOR ALL USING (public.is_super_admin());
CREATE POLICY "super_admin_all_activity_logs" ON activity_logs FOR ALL USING (public.is_super_admin());

-- Billing tables
CREATE POLICY "super_admin_all_subscription_plans" ON subscription_plans FOR ALL USING (public.is_super_admin());
CREATE POLICY "super_admin_all_client_subscriptions" ON client_subscriptions FOR ALL USING (public.is_super_admin());
CREATE POLICY "super_admin_all_case_types" ON case_types FOR ALL USING (public.is_super_admin());
CREATE POLICY "super_admin_all_discount_rules" ON discount_rules FOR ALL USING (public.is_super_admin());
CREATE POLICY "super_admin_all_vendors" ON vendors FOR ALL USING (public.is_super_admin());
CREATE POLICY "super_admin_all_bills" ON bills FOR ALL USING (public.is_super_admin());

-- =====================================================
-- 5. PLATFORM STATS VIEW
-- =====================================================

CREATE OR REPLACE VIEW platform_law_firm_stats AS
SELECT
  lf.id,
  lf.name,
  lf.legal_name,
  lf.email,
  lf.plan_type,
  lf.subscription_active,
  lf.created_at,
  COALESCE(u.user_count, 0) AS user_count,
  COALESCE(m.matter_count, 0) AS matter_count,
  COALESCE(m.active_matter_count, 0) AS active_matter_count,
  COALESCE(inv.total_revenue, 0) AS total_revenue
FROM law_firms lf
LEFT JOIN (
  SELECT law_firm_id, COUNT(*) AS user_count
  FROM users
  WHERE law_firm_id IS NOT NULL
  GROUP BY law_firm_id
) u ON u.law_firm_id = lf.id
LEFT JOIN (
  SELECT law_firm_id,
         COUNT(*) AS matter_count,
         COUNT(*) FILTER (WHERE status = 'active') AS active_matter_count
  FROM matters
  GROUP BY law_firm_id
) m ON m.law_firm_id = lf.id
LEFT JOIN (
  SELECT law_firm_id, COALESCE(SUM(total_amount), 0) AS total_revenue
  FROM invoices
  WHERE status = 'paid'
  GROUP BY law_firm_id
) inv ON inv.law_firm_id = lf.id;

-- Grant access to the view
GRANT SELECT ON platform_law_firm_stats TO authenticated;

COMMENT ON VIEW platform_law_firm_stats IS 'Platform-level stats per law firm for super_admin dashboard';
