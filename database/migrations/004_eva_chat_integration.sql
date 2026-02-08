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

-- Composite index for AI conversation lookups (user + status + updated_at ordering)
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_status_updated
  ON ai_conversations(user_id, status, updated_at DESC);

-- Composite index for conversations lookups in proactive notifications
CREATE INDEX IF NOT EXISTS idx_conversations_firm_contact_status_updated
  ON conversations(law_firm_id, contact_id, status, updated_at DESC);

-- Partial index for efficient proactive message deduplication
CREATE INDEX IF NOT EXISTS idx_ai_messages_proactive_lookup
  ON ai_messages(source_type, role, created_at DESC)
  WHERE source_type = 'proactive';
