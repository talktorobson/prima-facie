-- =====================================================
-- Prima Facie - AI Assistant Tables
-- 4 tables: conversations, messages, feedback, tool executions
-- Follows patterns from 000_init.sql
-- =====================================================

-- =====================================================
-- SECTION 1: New Enums
-- =====================================================

DO $$ BEGIN
  CREATE TYPE ai_conversation_status AS ENUM ('active', 'archived', 'deleted');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE ai_message_role AS ENUM ('user', 'assistant', 'system', 'tool');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE ai_feedback_rating AS ENUM ('positive', 'negative');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE ai_tool_status AS ENUM ('pending', 'approved', 'executed', 'rejected', 'error');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- SECTION 2: AI Conversations
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID REFERENCES law_firms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) DEFAULT 'Nova conversa',
    status ai_conversation_status DEFAULT 'active',
    context_type VARCHAR(50),
    context_entity_id UUID,
    provider VARCHAR(50) DEFAULT 'google',
    model VARCHAR(100) DEFAULT 'gemini-2.0-flash',
    total_tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID,
    updated_by UUID
);

-- =====================================================
-- SECTION 3: AI Messages
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    law_firm_id UUID REFERENCES law_firms(id) ON DELETE CASCADE,
    role ai_message_role NOT NULL,
    content TEXT,
    tool_calls JSONB,
    tool_results JSONB,
    tokens_input INTEGER DEFAULT 0,
    tokens_output INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- SECTION 4: AI Message Feedback
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_message_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES ai_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    law_firm_id UUID REFERENCES law_firms(id) ON DELETE CASCADE,
    rating ai_feedback_rating NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(message_id, user_id)
);

-- =====================================================
-- SECTION 5: AI Tool Executions
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_tool_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES ai_messages(id) ON DELETE CASCADE,
    law_firm_id UUID REFERENCES law_firms(id) ON DELETE CASCADE,
    tool_name VARCHAR(100) NOT NULL,
    tool_input JSONB,
    tool_output JSONB,
    status ai_tool_status DEFAULT 'pending',
    requires_confirmation BOOLEAN DEFAULT false,
    executed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- SECTION 6: RLS Policies
-- =====================================================

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_message_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tool_executions ENABLE ROW LEVEL SECURITY;

-- ai_conversations: users see their own conversations
CREATE POLICY ai_conversations_user_select ON ai_conversations
    FOR SELECT USING (user_id = public.current_user_id());

CREATE POLICY ai_conversations_user_insert ON ai_conversations
    FOR INSERT WITH CHECK (user_id = public.current_user_id());

CREATE POLICY ai_conversations_user_update ON ai_conversations
    FOR UPDATE USING (user_id = public.current_user_id());

CREATE POLICY ai_conversations_user_delete ON ai_conversations
    FOR DELETE USING (user_id = public.current_user_id());

-- ai_conversations: admins see all firm conversations
CREATE POLICY ai_conversations_admin_select ON ai_conversations
    FOR SELECT USING (
        public.current_user_is_admin()
        AND law_firm_id = public.current_user_law_firm_id()
    );

-- ai_conversations: super_admin bypass
CREATE POLICY ai_conversations_super_admin ON ai_conversations
    USING (public.is_super_admin());

-- ai_conversations: service_role bypass
CREATE POLICY ai_conversations_service_role ON ai_conversations
    USING (auth.role() = 'service_role');

-- ai_messages: users see messages in their conversations
CREATE POLICY ai_messages_user_select ON ai_messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM ai_conversations WHERE user_id = public.current_user_id()
        )
    );

CREATE POLICY ai_messages_user_insert ON ai_messages
    FOR INSERT WITH CHECK (
        conversation_id IN (
            SELECT id FROM ai_conversations WHERE user_id = public.current_user_id()
        )
    );

-- ai_messages: admin see all firm messages
CREATE POLICY ai_messages_admin_select ON ai_messages
    FOR SELECT USING (
        public.current_user_is_admin()
        AND law_firm_id = public.current_user_law_firm_id()
    );

-- ai_messages: super_admin bypass
CREATE POLICY ai_messages_super_admin ON ai_messages
    USING (public.is_super_admin());

-- ai_messages: service_role bypass
CREATE POLICY ai_messages_service_role ON ai_messages
    USING (auth.role() = 'service_role');

-- ai_message_feedback: users manage their own feedback
CREATE POLICY ai_message_feedback_user_all ON ai_message_feedback
    USING (user_id = public.current_user_id());

CREATE POLICY ai_message_feedback_user_insert ON ai_message_feedback
    FOR INSERT WITH CHECK (user_id = public.current_user_id());

-- ai_message_feedback: admin see all firm feedback
CREATE POLICY ai_message_feedback_admin_select ON ai_message_feedback
    FOR SELECT USING (
        public.current_user_is_admin()
        AND law_firm_id = public.current_user_law_firm_id()
    );

-- ai_message_feedback: super_admin bypass
CREATE POLICY ai_message_feedback_super_admin ON ai_message_feedback
    USING (public.is_super_admin());

-- ai_message_feedback: service_role bypass
CREATE POLICY ai_message_feedback_service_role ON ai_message_feedback
    USING (auth.role() = 'service_role');

-- ai_tool_executions: users see their own tool executions
CREATE POLICY ai_tool_executions_user_select ON ai_tool_executions
    FOR SELECT USING (
        message_id IN (
            SELECT m.id FROM ai_messages m
            JOIN ai_conversations c ON c.id = m.conversation_id
            WHERE c.user_id = public.current_user_id()
        )
    );

-- ai_tool_executions: admin see all firm executions
CREATE POLICY ai_tool_executions_admin_select ON ai_tool_executions
    FOR SELECT USING (
        public.current_user_is_admin()
        AND law_firm_id = public.current_user_law_firm_id()
    );

-- ai_tool_executions: super_admin bypass
CREATE POLICY ai_tool_executions_super_admin ON ai_tool_executions
    USING (public.is_super_admin());

-- ai_tool_executions: service_role bypass
CREATE POLICY ai_tool_executions_service_role ON ai_tool_executions
    USING (auth.role() = 'service_role');

-- =====================================================
-- SECTION 7: Indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_law_firm ON ai_conversations(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_status ON ai_conversations(status);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_status ON ai_conversations(user_id, status);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_law_firm ON ai_messages(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_created ON ai_messages(conversation_id, created_at);

CREATE INDEX IF NOT EXISTS idx_ai_message_feedback_message ON ai_message_feedback(message_id);
CREATE INDEX IF NOT EXISTS idx_ai_message_feedback_law_firm ON ai_message_feedback(law_firm_id);

CREATE INDEX IF NOT EXISTS idx_ai_tool_executions_message ON ai_tool_executions(message_id);
CREATE INDEX IF NOT EXISTS idx_ai_tool_executions_law_firm ON ai_tool_executions(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_ai_tool_executions_status ON ai_tool_executions(status);

-- =====================================================
-- SECTION 8: Triggers
-- =====================================================

CREATE TRIGGER update_ai_conversations_updated_at
    BEFORE UPDATE ON ai_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_messages_updated_at
    BEFORE UPDATE ON ai_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_tool_executions_updated_at
    BEFORE UPDATE ON ai_tool_executions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DONE: AI Assistant tables ready
-- =====================================================
