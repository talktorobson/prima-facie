-- Chat Notifications Database Schema
-- Additional tables for message notifications and status tracking

-- Notification Preferences Table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  whatsapp_notifications BOOLEAN DEFAULT false,
  urgent_only BOOLEAN DEFAULT false,
  business_hours_only BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure only one of user_id or client_id is set
  CONSTRAINT check_user_or_client CHECK (
    (user_id IS NOT NULL AND client_id IS NULL) OR 
    (user_id IS NULL AND client_id IS NOT NULL)
  ),
  
  -- Unique constraint per user/client
  CONSTRAINT unique_preferences_user UNIQUE (user_id),
  CONSTRAINT unique_preferences_client UNIQUE (client_id)
);

-- Chat Notifications Table
CREATE TABLE IF NOT EXISTS chat_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recipient_client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
    'new_message', 'mention', 'urgent', 'whatsapp', 'status_update'
  )),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  is_sent BOOLEAN DEFAULT false,
  sent_via TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Ensure only one of recipient_user_id or recipient_client_id is set
  CONSTRAINT check_recipient_user_or_client CHECK (
    (recipient_user_id IS NOT NULL AND recipient_client_id IS NULL) OR 
    (recipient_user_id IS NULL AND recipient_client_id IS NOT NULL)
  )
);

-- Update the existing message_status table to include more detailed tracking
ALTER TABLE message_status 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS whatsapp_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS failed_reason TEXT,
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- Update the constraint to allow client_id
ALTER TABLE message_status 
DROP CONSTRAINT IF EXISTS message_status_user_id_fkey;

ALTER TABLE message_status 
ADD CONSTRAINT check_message_status_user_or_client CHECK (
  (user_id IS NOT NULL AND client_id IS NULL) OR 
  (user_id IS NULL AND client_id IS NOT NULL)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notification_preferences_client ON notification_preferences(client_id) WHERE client_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chat_notifications_recipient_user ON chat_notifications(recipient_user_id) WHERE recipient_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_notifications_recipient_client ON chat_notifications(recipient_client_id) WHERE recipient_client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_notifications_conversation ON chat_notifications(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_notifications_message ON chat_notifications(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_notifications_unread ON chat_notifications(is_read, created_at) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_chat_notifications_type ON chat_notifications(notification_type);

CREATE INDEX IF NOT EXISTS idx_message_status_message ON message_status(message_id);
CREATE INDEX IF NOT EXISTS idx_message_status_user ON message_status(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_message_status_client ON message_status(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_message_status_whatsapp ON message_status(whatsapp_status) WHERE whatsapp_status IS NOT NULL;

-- Row Level Security (RLS) Policies

-- Notification Preferences RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notification preferences" ON notification_preferences
  FOR SELECT USING (
    (auth.uid()::text = user_id::text) OR 
    (EXISTS (
      SELECT 1 FROM clients c 
      WHERE c.id = notification_preferences.client_id 
      AND c.law_firm_id IN (
        SELECT law_firm_id FROM users WHERE id = auth.uid()
      )
    ))
  );

CREATE POLICY "Users can update their own notification preferences" ON notification_preferences
  FOR ALL USING (
    (auth.uid()::text = user_id::text) OR 
    (EXISTS (
      SELECT 1 FROM clients c 
      WHERE c.id = notification_preferences.client_id 
      AND c.law_firm_id IN (
        SELECT law_firm_id FROM users WHERE id = auth.uid()
      )
    ))
  );

-- Chat Notifications RLS
ALTER TABLE chat_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON chat_notifications
  FOR SELECT USING (
    (auth.uid()::text = recipient_user_id::text) OR 
    (EXISTS (
      SELECT 1 FROM clients c 
      WHERE c.id = chat_notifications.recipient_client_id 
      AND c.law_firm_id IN (
        SELECT law_firm_id FROM users WHERE id = auth.uid()
      )
    ))
  );

CREATE POLICY "Users can update their own notifications" ON chat_notifications
  FOR UPDATE USING (
    (auth.uid()::text = recipient_user_id::text) OR 
    (EXISTS (
      SELECT 1 FROM clients c 
      WHERE c.id = chat_notifications.recipient_client_id 
      AND c.law_firm_id IN (
        SELECT law_firm_id FROM users WHERE id = auth.uid()
      )
    ))
  );

CREATE POLICY "System can insert notifications" ON chat_notifications
  FOR INSERT WITH CHECK (true);

-- Functions and Triggers

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for notification_preferences
CREATE TRIGGER update_notification_preferences_updated_at 
  BEFORE UPDATE ON notification_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create notification preferences for new users/clients
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'users' THEN
    INSERT INTO notification_preferences (
      user_id, 
      email_notifications, 
      push_notifications, 
      whatsapp_notifications, 
      urgent_only, 
      business_hours_only
    ) VALUES (
      NEW.id, 
      true, 
      true, 
      false, 
      false, 
      false
    );
  ELSIF TG_TABLE_NAME = 'clients' THEN
    INSERT INTO notification_preferences (
      client_id, 
      email_notifications, 
      push_notifications, 
      whatsapp_notifications, 
      urgent_only, 
      business_hours_only
    ) VALUES (
      NEW.id, 
      true, 
      false, 
      false, 
      false, 
      true
    );
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to create default notification preferences
CREATE TRIGGER create_user_notification_preferences
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION create_default_notification_preferences();

CREATE TRIGGER create_client_notification_preferences
  AFTER INSERT ON clients
  FOR EACH ROW EXECUTE FUNCTION create_default_notification_preferences();

-- Function to clean up old notifications (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM chat_notifications 
  WHERE created_at < NOW() - INTERVAL '30 days'
  AND is_read = true;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ language 'plpgsql';

-- View for notification statistics
CREATE OR REPLACE VIEW notification_stats AS
SELECT 
  'user' as recipient_type,
  recipient_user_id as recipient_id,
  COUNT(*) as total_notifications,
  COUNT(*) FILTER (WHERE is_read = false) as unread_count,
  COUNT(*) FILTER (WHERE notification_type = 'urgent') as urgent_count,
  COUNT(*) FILTER (WHERE notification_type = 'whatsapp') as whatsapp_count,
  MAX(created_at) as last_notification_at
FROM chat_notifications 
WHERE recipient_user_id IS NOT NULL
GROUP BY recipient_user_id

UNION ALL

SELECT 
  'client' as recipient_type,
  recipient_client_id as recipient_id,
  COUNT(*) as total_notifications,
  COUNT(*) FILTER (WHERE is_read = false) as unread_count,
  COUNT(*) FILTER (WHERE notification_type = 'urgent') as urgent_count,
  COUNT(*) FILTER (WHERE notification_type = 'whatsapp') as whatsapp_count,
  MAX(created_at) as last_notification_at
FROM chat_notifications 
WHERE recipient_client_id IS NOT NULL
GROUP BY recipient_client_id;

-- Sample notification preferences for existing users
INSERT INTO notification_preferences (
  user_id, 
  email_notifications, 
  push_notifications, 
  whatsapp_notifications, 
  urgent_only, 
  business_hours_only
)
SELECT 
  id,
  true,
  true,
  CASE WHEN role = 'admin' THEN true ELSE false END,
  false,
  false
FROM users 
WHERE id NOT IN (SELECT user_id FROM notification_preferences WHERE user_id IS NOT NULL)
ON CONFLICT DO NOTHING;

INSERT INTO notification_preferences (
  client_id, 
  email_notifications, 
  push_notifications, 
  whatsapp_notifications, 
  urgent_only, 
  business_hours_only
)
SELECT 
  id,
  true,
  false,
  false,
  false,
  true
FROM clients 
WHERE id NOT IN (SELECT client_id FROM notification_preferences WHERE client_id IS NOT NULL)
ON CONFLICT DO NOTHING;

COMMIT;