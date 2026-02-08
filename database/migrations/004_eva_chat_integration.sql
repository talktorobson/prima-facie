-- Migration 004: EVA Chat Integration
-- Adds source tracking to ai_messages for cross-context memory

-- Track where AI messages originated (widget, chat ghost-write, client portal, proactive)
ALTER TABLE ai_messages ADD COLUMN IF NOT EXISTS source_type VARCHAR(20) DEFAULT 'widget'
  CHECK (source_type IN ('widget', 'chat_ghost', 'client_portal', 'proactive'));

-- Link AI messages to the conversation they were ghost-written into
ALTER TABLE ai_messages ADD COLUMN IF NOT EXISTS source_conversation_id UUID;

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_ai_messages_source_type ON ai_messages(source_type);
CREATE INDEX IF NOT EXISTS idx_ai_messages_source_conv ON ai_messages(source_conversation_id);
