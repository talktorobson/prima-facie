-- =====================================================
-- Prima Facie - Conversations & Participants Migration
-- Adds conversation threading to existing messages table
-- =====================================================

-- =====================================================
-- SECTION 1: New Tables
-- =====================================================

-- 1.1 CONVERSATIONS
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    matter_id UUID REFERENCES matters(id),
    contact_id UUID REFERENCES contacts(id),
    title VARCHAR(255),
    description TEXT,
    conversation_type VARCHAR(20) DEFAULT 'client'
      CHECK (conversation_type IN ('internal','client','whatsapp')),
    status VARCHAR(20) DEFAULT 'active'
      CHECK (status IN ('active','archived','closed')),
    priority VARCHAR(10) DEFAULT 'normal'
      CHECK (priority IN ('low','normal','high','urgent')),
    topic VARCHAR(50),
    last_message_at TIMESTAMPTZ,
    last_message_preview TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 1.2 CONVERSATION PARTICIPANTS
CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    contact_id UUID REFERENCES contacts(id),
    role VARCHAR(20) DEFAULT 'participant'
      CHECK (role IN ('owner','moderator','participant')),
    is_active BOOLEAN DEFAULT true,
    last_read_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(conversation_id, user_id),
    UNIQUE(conversation_id, contact_id),
    CHECK (user_id IS NOT NULL OR contact_id IS NOT NULL)
);

-- =====================================================
-- SECTION 2: Alter Messages Table
-- =====================================================

ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id);

-- =====================================================
-- SECTION 3: Indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_messages_conversation_time ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_law_firm ON conversations(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_msg ON conversations(law_firm_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conv ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_contact ON conversation_participants(contact_id);

-- =====================================================
-- SECTION 4: Trigger — auto-update last_message fields
-- =====================================================

CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET last_message_at = NEW.created_at,
        last_message_preview = LEFT(NEW.content, 100),
        updated_at = now()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_conversation_last_message ON messages;
CREATE TRIGGER trg_update_conversation_last_message
    AFTER INSERT ON messages
    FOR EACH ROW
    WHEN (NEW.conversation_id IS NOT NULL)
    EXECUTE FUNCTION update_conversation_last_message();

-- updated_at triggers
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SECTION 5: Row Level Security
-- =====================================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

-- Staff access (same law firm)
DROP POLICY IF EXISTS "conversations_staff_access" ON conversations;
CREATE POLICY "conversations_staff_access" ON conversations FOR ALL USING (
  law_firm_id = public.current_user_law_firm_id() AND public.current_user_is_staff()
);

DROP POLICY IF EXISTS "conv_participants_staff_access" ON conversation_participants;
CREATE POLICY "conv_participants_staff_access" ON conversation_participants FOR ALL USING (
  conversation_id IN (
    SELECT id FROM conversations WHERE law_firm_id = public.current_user_law_firm_id()
  ) AND public.current_user_is_staff()
);

-- Client access (own conversations only)
DROP POLICY IF EXISTS "conversations_client_access" ON conversations;
CREATE POLICY "conversations_client_access" ON conversations FOR SELECT USING (
  id IN (
    SELECT conversation_id FROM conversation_participants
    WHERE user_id = public.current_user_id() OR
          contact_id IN (SELECT c.id FROM contacts c WHERE c.user_id = public.current_user_id())
  )
);

DROP POLICY IF EXISTS "conv_participants_client_access" ON conversation_participants;
CREATE POLICY "conv_participants_client_access" ON conversation_participants FOR SELECT USING (
  user_id = public.current_user_id() OR
  contact_id IN (SELECT c.id FROM contacts c WHERE c.user_id = public.current_user_id())
);

DROP POLICY IF EXISTS "conv_participants_client_update" ON conversation_participants;
CREATE POLICY "conv_participants_client_update" ON conversation_participants FOR UPDATE USING (
  user_id = public.current_user_id() OR
  contact_id IN (SELECT c.id FROM contacts c WHERE c.user_id = public.current_user_id())
);

-- Super admin bypass
DROP POLICY IF EXISTS "super_admin_all_conversations" ON conversations;
CREATE POLICY "super_admin_all_conversations" ON conversations FOR ALL USING (public.is_super_admin());

DROP POLICY IF EXISTS "super_admin_all_conv_participants" ON conversation_participants;
CREATE POLICY "super_admin_all_conv_participants" ON conversation_participants FOR ALL USING (public.is_super_admin());

-- Service role bypass
CREATE POLICY "service_role_all_conversations" ON conversations FOR ALL TO service_role USING (true);
CREATE POLICY "service_role_all_conv_participants" ON conversation_participants FOR ALL TO service_role USING (true);
