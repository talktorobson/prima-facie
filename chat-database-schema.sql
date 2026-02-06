-- Prima Facie - Chat & Communication Database Schema
-- Phase 7: Real-time Chat & WhatsApp Integration
-- Generated: 2025-01-15

-- ================================
-- CHAT & COMMUNICATION SCHEMA
-- ================================

-- 1. CONVERSATION TOPICS
CREATE TABLE conversation_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#0066CC', -- Hex color for UI
    icon VARCHAR(50) DEFAULT 'ChatBubbleLeftRightIcon',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. CONVERSATIONS
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES conversation_topics(id) ON DELETE SET NULL,
    matter_id UUID REFERENCES matters(id) ON DELETE SET NULL, -- Link to specific legal matter
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE, -- Primary client for conversation
    title VARCHAR(200),
    description TEXT,
    conversation_type VARCHAR(20) DEFAULT 'general' CHECK (conversation_type IN ('general', 'matter_specific', 'consultation', 'urgent', 'whatsapp')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'closed')),
    priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    is_whatsapp_enabled BOOLEAN DEFAULT false,
    whatsapp_phone VARCHAR(20), -- Client's WhatsApp number
    last_message_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. CONVERSATION PARTICIPANTS
CREATE TABLE conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- For staff members
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE, -- For clients
    participant_type VARCHAR(10) NOT NULL CHECK (participant_type IN ('lawyer', 'staff', 'client', 'admin')),
    role VARCHAR(20) DEFAULT 'participant' CHECK (role IN ('owner', 'moderator', 'participant')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    
    -- Ensure participant is either user or client, not both
    CONSTRAINT participant_check CHECK (
        (user_id IS NOT NULL AND client_id IS NULL) OR 
        (user_id IS NULL AND client_id IS NOT NULL)
    )
);

-- 4. MESSAGES
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- For staff messages
    sender_client_id UUID REFERENCES clients(id) ON DELETE SET NULL, -- For client messages
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'document', 'system', 'whatsapp')),
    content TEXT NOT NULL,
    file_url TEXT, -- For file attachments
    file_name VARCHAR(255),
    file_size INTEGER,
    file_type VARCHAR(100),
    
    -- WhatsApp specific fields
    whatsapp_message_id VARCHAR(100), -- WhatsApp message ID for sync
    whatsapp_status VARCHAR(20), -- sent, delivered, read, failed
    whatsapp_timestamp TIMESTAMP WITH TIME ZONE,
    
    -- Message status
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Threading support
    reply_to_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure sender is either user or client, not both
    CONSTRAINT sender_check CHECK (
        (sender_user_id IS NOT NULL AND sender_client_id IS NULL) OR 
        (sender_user_id IS NULL AND sender_client_id IS NOT NULL)
    )
);

-- 5. MESSAGE STATUS TRACKING
CREATE TABLE message_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure reader is either user or client, not both
    CONSTRAINT reader_check CHECK (
        (user_id IS NOT NULL AND client_id IS NULL) OR 
        (user_id IS NULL AND client_id IS NOT NULL)
    ),
    
    -- Unique status per message per participant
    UNIQUE(message_id, user_id, client_id)
);

-- 6. WHATSAPP INTEGRATION CONFIG
CREATE TABLE whatsapp_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    business_account_id VARCHAR(100) NOT NULL,
    phone_number_id VARCHAR(100) NOT NULL,
    access_token TEXT NOT NULL,
    webhook_verify_token VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    webhook_url TEXT,
    
    -- Message templates
    welcome_template TEXT,
    consultation_template TEXT,
    appointment_template TEXT,
    document_template TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(law_firm_id) -- One WhatsApp config per law firm
);

-- 7. WHATSAPP MESSAGE TEMPLATES
CREATE TABLE whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    template_name VARCHAR(100) NOT NULL, -- WhatsApp template name
    category VARCHAR(50) NOT NULL, -- UTILITY, MARKETING, AUTHENTICATION
    language VARCHAR(10) DEFAULT 'pt_BR',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    header_text TEXT,
    body_text TEXT NOT NULL,
    footer_text TEXT,
    button_text TEXT,
    button_url TEXT,
    variables JSONB, -- Template variables
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. NOTIFICATION PREFERENCES
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Notification channels
    email_notifications BOOLEAN DEFAULT true,
    browser_notifications BOOLEAN DEFAULT true,
    whatsapp_notifications BOOLEAN DEFAULT false,
    sms_notifications BOOLEAN DEFAULT false,
    
    -- Notification types
    new_message BOOLEAN DEFAULT true,
    mention BOOLEAN DEFAULT true,
    file_shared BOOLEAN DEFAULT true,
    matter_update BOOLEAN DEFAULT true,
    urgent_message BOOLEAN DEFAULT true,
    
    -- Quiet hours
    quiet_hours_enabled BOOLEAN DEFAULT false,
    quiet_start_time TIME DEFAULT '22:00:00',
    quiet_end_time TIME DEFAULT '08:00:00',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure preference is for either user or client, not both
    CONSTRAINT preference_check CHECK (
        (user_id IS NOT NULL AND client_id IS NULL) OR 
        (user_id IS NULL AND client_id IS NOT NULL)
    )
);

-- ================================
-- INDEXES FOR PERFORMANCE
-- ================================

-- Conversation indexes
CREATE INDEX idx_conversations_law_firm ON conversations(law_firm_id);
CREATE INDEX idx_conversations_client ON conversations(client_id);
CREATE INDEX idx_conversations_matter ON conversations(matter_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);

-- Message indexes
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_sender_user ON messages(sender_user_id);
CREATE INDEX idx_messages_sender_client ON messages(sender_client_id);
CREATE INDEX idx_messages_whatsapp ON messages(whatsapp_message_id) WHERE whatsapp_message_id IS NOT NULL;

-- Participant indexes
CREATE INDEX idx_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX idx_participants_user ON conversation_participants(user_id);
CREATE INDEX idx_participants_client ON conversation_participants(client_id);

-- Message status indexes
CREATE INDEX idx_message_status_message ON message_status(message_id);
CREATE INDEX idx_message_status_user ON message_status(user_id);
CREATE INDEX idx_message_status_client ON message_status(client_id);

-- ================================
-- ROW LEVEL SECURITY (RLS)
-- ================================

-- Enable RLS
ALTER TABLE conversation_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversation_topics
CREATE POLICY "Users can view topics from their law firm" ON conversation_topics
    FOR SELECT USING (law_firm_id = (SELECT law_firm_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can manage topics" ON conversation_topics
    FOR ALL USING (
        law_firm_id = (SELECT law_firm_id FROM users WHERE id = auth.uid()) AND
        (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'lawyer')
    );

-- RLS Policies for conversations
CREATE POLICY "Users can view conversations from their law firm" ON conversations
    FOR SELECT USING (law_firm_id = (SELECT law_firm_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can create conversations in their law firm" ON conversations
    FOR INSERT WITH CHECK (law_firm_id = (SELECT law_firm_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update conversations they participate in" ON conversations
    FOR UPDATE USING (
        law_firm_id = (SELECT law_firm_id FROM users WHERE id = auth.uid()) AND
        (
            id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()) OR
            (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'lawyer')
        )
    );

-- RLS Policies for messages
CREATE POLICY "Users can view messages from conversations they participate in" ON messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT conversation_id FROM conversation_participants 
            WHERE user_id = auth.uid() OR 
            client_id = (SELECT client_id FROM clients WHERE id = auth.uid())
        )
    );

CREATE POLICY "Users can send messages to conversations they participate in" ON messages
    FOR INSERT WITH CHECK (
        conversation_id IN (
            SELECT conversation_id FROM conversation_participants 
            WHERE user_id = auth.uid() OR 
            client_id = (SELECT client_id FROM clients WHERE id = auth.uid())
        )
    );

-- ================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ================================

-- Update conversation last_message_at when new message is sent
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations 
    SET 
        last_message_at = NEW.created_at,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_last_message
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_conversation_topics_updated_at BEFORE UPDATE ON conversation_topics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_whatsapp_config_updated_at BEFORE UPDATE ON whatsapp_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_whatsapp_templates_updated_at BEFORE UPDATE ON whatsapp_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================
-- SEED DATA FOR DEVELOPMENT
-- ================================

-- Default conversation topics for Dávila Reis Advocacia
INSERT INTO conversation_topics (law_firm_id, name, description, color, icon) VALUES
((SELECT id FROM law_firms WHERE name = 'Dávila Reis Advocacia' LIMIT 1), 'Geral', 'Conversas gerais com clientes', '#0066CC', 'ChatBubbleLeftRightIcon'),
((SELECT id FROM law_firms WHERE name = 'Dávila Reis Advocacia' LIMIT 1), 'Consulta Jurídica', 'Consultas e dúvidas jurídicas', '#10B981', 'DocumentTextIcon'),
((SELECT id FROM law_firms WHERE name = 'Dávila Reis Advocacia' LIMIT 1), 'Documentos', 'Envio e recebimento de documentos', '#F59E0B', 'PaperClipIcon'),
((SELECT id FROM law_firms WHERE name = 'Dávila Reis Advocacia' LIMIT 1), 'Audiências', 'Informações sobre audiências e prazos', '#EF4444', 'CalendarIcon'),
((SELECT id FROM law_firms WHERE name = 'Dávila Reis Advocacia' LIMIT 1), 'Urgente', 'Comunicações urgentes', '#DC2626', 'ExclamationTriangleIcon');

-- Sample conversations
INSERT INTO conversations (law_firm_id, topic_id, client_id, title, conversation_type, priority, is_whatsapp_enabled, whatsapp_phone) VALUES
((SELECT id FROM law_firms WHERE name = 'Dávila Reis Advocacia' LIMIT 1), 
 (SELECT id FROM conversation_topics WHERE name = 'Geral' LIMIT 1),
 (SELECT id FROM clients WHERE name = 'João Silva Santos' LIMIT 1),
 'Processo Trabalhista - Orientações',
 'matter_specific',
 'high',
 true,
 '+5511987654321'),
((SELECT id FROM law_firms WHERE name = 'Dávila Reis Advocacia' LIMIT 1),
 (SELECT id FROM conversation_topics WHERE name = 'Consulta Jurídica' LIMIT 1),
 (SELECT id FROM clients WHERE name = 'Ana Costa Pereira' LIMIT 1),
 'Revisão Contratual',
 'consultation',
 'normal',
 false,
 null);

-- Default notification preferences for existing users
INSERT INTO notification_preferences (user_id, email_notifications, browser_notifications, whatsapp_notifications) 
SELECT id, true, true, false FROM users WHERE role IN ('admin', 'lawyer', 'staff');

-- ================================
-- COMMENTS AND DOCUMENTATION
-- ================================

COMMENT ON TABLE conversations IS 'Central conversations between law firm staff and clients';
COMMENT ON TABLE messages IS 'Individual messages within conversations with WhatsApp integration';
COMMENT ON TABLE conversation_participants IS 'Participants in conversations (staff and clients)';
COMMENT ON TABLE whatsapp_config IS 'WhatsApp Business API configuration per law firm';
COMMENT ON TABLE message_status IS 'Message delivery and read status tracking';
COMMENT ON COLUMN messages.whatsapp_message_id IS 'WhatsApp message ID for bi-directional sync';
COMMENT ON COLUMN conversations.is_whatsapp_enabled IS 'Enable WhatsApp integration for this conversation';

-- Schema creation completed successfully
SELECT 'Chat & Communication schema created successfully!' as status;