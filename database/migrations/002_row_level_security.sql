-- =====================================================
-- Prima Facie - Row Level Security (RLS) Policies
-- Multi-tenant security implementation
-- =====================================================

-- Enable RLS on all tables
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
-- HELPER FUNCTIONS FOR RLS
-- =====================================================

-- Get current user's law firm ID
CREATE OR REPLACE FUNCTION auth.current_user_law_firm_id()
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

-- Check if current user is admin
CREATE OR REPLACE FUNCTION auth.current_user_is_admin()
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

-- Check if current user is staff (admin, lawyer, or staff)
CREATE OR REPLACE FUNCTION auth.current_user_is_staff()
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

-- Get current user ID
CREATE OR REPLACE FUNCTION auth.current_user_id()
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

-- =====================================================
-- LAW FIRMS POLICIES
-- =====================================================

-- Law firms can only see their own data
CREATE POLICY "law_firms_isolation" ON law_firms
  FOR ALL USING (
    id = auth.current_user_law_firm_id()
  );

-- Only admins can modify law firm settings
CREATE POLICY "law_firms_admin_modify" ON law_firms
  FOR UPDATE USING (
    id = auth.current_user_law_firm_id() AND
    auth.current_user_is_admin()
  );

-- =====================================================
-- USERS POLICIES
-- =====================================================

-- Users can see other users in their law firm
CREATE POLICY "users_law_firm_access" ON users
  FOR SELECT USING (
    law_firm_id = auth.current_user_law_firm_id()
  );

-- Users can update their own profile
CREATE POLICY "users_self_update" ON users
  FOR UPDATE USING (
    auth_user_id = auth.uid()
  );

-- Admins can manage all users in their law firm
CREATE POLICY "users_admin_manage" ON users
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id() AND
    auth.current_user_is_admin()
  );

-- Staff can create new users (for client registration)
CREATE POLICY "users_staff_create" ON users
  FOR INSERT WITH CHECK (
    law_firm_id = auth.current_user_law_firm_id() AND
    auth.current_user_is_staff()
  );

-- =====================================================
-- MATTER TYPES POLICIES
-- =====================================================

-- Law firm isolation for matter types
CREATE POLICY "matter_types_law_firm_access" ON matter_types
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id()
  );

-- =====================================================
-- CONTACTS POLICIES
-- =====================================================

-- Staff can access all contacts in their law firm
CREATE POLICY "contacts_staff_access" ON contacts
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id() AND
    auth.current_user_is_staff()
  );

-- Clients can only see their own contact record
CREATE POLICY "contacts_client_self_access" ON contacts
  FOR SELECT USING (
    user_id = auth.current_user_id()
  );

-- Clients can update their own contact information
CREATE POLICY "contacts_client_self_update" ON contacts
  FOR UPDATE USING (
    user_id = auth.current_user_id()
  );

-- =====================================================
-- MATTERS POLICIES
-- =====================================================

-- Staff can access all matters in their law firm
CREATE POLICY "matters_staff_access" ON matters
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id() AND
    auth.current_user_is_staff()
  );

-- Clients can only see matters they are involved in
CREATE POLICY "matters_client_access" ON matters
  FOR SELECT USING (
    id IN (
      SELECT mc.matter_id 
      FROM matter_contacts mc
      JOIN contacts c ON mc.contact_id = c.id
      WHERE c.user_id = auth.current_user_id()
    )
  );

-- =====================================================
-- MATTER_CONTACTS POLICIES
-- =====================================================

-- Staff can manage matter-contact relationships
CREATE POLICY "matter_contacts_staff_access" ON matter_contacts
  FOR ALL USING (
    matter_id IN (
      SELECT id FROM matters 
      WHERE law_firm_id = auth.current_user_law_firm_id()
    ) AND
    auth.current_user_is_staff()
  );

-- Clients can see their own matter relationships
CREATE POLICY "matter_contacts_client_access" ON matter_contacts
  FOR SELECT USING (
    contact_id IN (
      SELECT id FROM contacts 
      WHERE user_id = auth.current_user_id()
    )
  );

-- =====================================================
-- TASKS POLICIES
-- =====================================================

-- Staff can access all tasks in their law firm
CREATE POLICY "tasks_staff_access" ON tasks
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id() AND
    auth.current_user_is_staff()
  );

-- Users can see tasks assigned to them
CREATE POLICY "tasks_assigned_access" ON tasks
  FOR SELECT USING (
    assigned_to = auth.current_user_id()
  );

-- =====================================================
-- TIME ENTRIES POLICIES
-- =====================================================

-- Staff can access time entries for their law firm
CREATE POLICY "time_entries_staff_access" ON time_entries
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id() AND
    auth.current_user_is_staff()
  );

-- Users can only manage their own time entries
CREATE POLICY "time_entries_user_own" ON time_entries
  FOR ALL USING (
    user_id = auth.current_user_id()
  );

-- =====================================================
-- DOCUMENTS POLICIES
-- =====================================================

-- Staff can access all documents in their law firm
CREATE POLICY "documents_staff_access" ON documents
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id() AND
    auth.current_user_is_staff()
  );

-- Clients can see documents related to their matters
CREATE POLICY "documents_client_matter_access" ON documents
  FOR SELECT USING (
    matter_id IN (
      SELECT mc.matter_id 
      FROM matter_contacts mc
      JOIN contacts c ON mc.contact_id = c.id
      WHERE c.user_id = auth.current_user_id()
    ) AND
    access_level IN ('public', 'internal')
  );

-- Clients can see their own documents
CREATE POLICY "documents_client_own_access" ON documents
  FOR SELECT USING (
    contact_id IN (
      SELECT id FROM contacts 
      WHERE user_id = auth.current_user_id()
    )
  );

-- =====================================================
-- INVOICES POLICIES
-- =====================================================

-- Staff can access all invoices in their law firm
CREATE POLICY "invoices_staff_access" ON invoices
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id() AND
    auth.current_user_is_staff()
  );

-- Clients can see their own invoices
CREATE POLICY "invoices_client_access" ON invoices
  FOR SELECT USING (
    contact_id IN (
      SELECT id FROM contacts 
      WHERE user_id = auth.current_user_id()
    )
  );

-- =====================================================
-- INVOICE LINE ITEMS POLICIES
-- =====================================================

-- Access follows parent invoice policies
CREATE POLICY "invoice_line_items_staff_access" ON invoice_line_items
  FOR ALL USING (
    invoice_id IN (
      SELECT id FROM invoices 
      WHERE law_firm_id = auth.current_user_law_firm_id()
    ) AND
    auth.current_user_is_staff()
  );

CREATE POLICY "invoice_line_items_client_access" ON invoice_line_items
  FOR SELECT USING (
    invoice_id IN (
      SELECT i.id FROM invoices i
      JOIN contacts c ON i.contact_id = c.id
      WHERE c.user_id = auth.current_user_id()
    )
  );

-- =====================================================
-- MESSAGES POLICIES
-- =====================================================

-- Staff can access all messages in their law firm
CREATE POLICY "messages_staff_access" ON messages
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id() AND
    auth.current_user_is_staff()
  );

-- Users can see messages they sent or received
CREATE POLICY "messages_participant_access" ON messages
  FOR SELECT USING (
    sender_id = auth.current_user_id() OR
    receiver_id = auth.current_user_id() OR
    contact_id IN (
      SELECT id FROM contacts 
      WHERE user_id = auth.current_user_id()
    )
  );

-- Users can send messages
CREATE POLICY "messages_user_send" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.current_user_id() OR
    (sender_type = 'contact' AND contact_id IN (
      SELECT id FROM contacts 
      WHERE user_id = auth.current_user_id()
    ))
  );

-- =====================================================
-- PIPELINE STAGES POLICIES
-- =====================================================

-- Staff can manage pipeline stages
CREATE POLICY "pipeline_stages_staff_access" ON pipeline_stages
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id() AND
    auth.current_user_is_staff()
  );

-- =====================================================
-- PIPELINE CARDS POLICIES
-- =====================================================

-- Staff can manage pipeline cards
CREATE POLICY "pipeline_cards_staff_access" ON pipeline_cards
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id() AND
    auth.current_user_is_staff()
  );

-- =====================================================
-- ACTIVITY LOGS POLICIES
-- =====================================================

-- Staff can read activity logs for their law firm
CREATE POLICY "activity_logs_staff_read" ON activity_logs
  FOR SELECT USING (
    law_firm_id = auth.current_user_law_firm_id() AND
    auth.current_user_is_staff()
  );

-- System can insert activity logs
CREATE POLICY "activity_logs_system_insert" ON activity_logs
  FOR INSERT WITH CHECK (
    law_firm_id = auth.current_user_law_firm_id()
  );

-- =====================================================
-- STORAGE POLICIES (for Supabase Storage)
-- =====================================================

-- Storage bucket policy for law firm isolation
-- Note: This would be configured in Supabase Storage settings
-- Bucket structure: law_firm_id/matter_id/document_id/filename

-- =====================================================
-- ADDITIONAL SECURITY FUNCTIONS
-- =====================================================

-- Function to log activities automatically
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_logs (
    law_firm_id,
    action,
    entity_type,
    entity_id,
    user_id,
    description,
    old_values,
    new_values
  ) VALUES (
    COALESCE(NEW.law_firm_id, OLD.law_firm_id),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    auth.current_user_id(),
    format('%s %s', TG_OP, TG_TABLE_NAME),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;