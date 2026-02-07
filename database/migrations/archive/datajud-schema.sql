-- =====================================================
-- DataJud CNJ Integration Schema
-- Enhanced database tables for comprehensive case enrichment
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- DATAJUD CASE DETAILS
-- Stores comprehensive case information from DataJud API
-- =====================================================

CREATE TABLE datajud_case_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
  matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  
  -- DataJud Identifiers
  datajud_case_id TEXT NOT NULL,
  numero_processo_cnj TEXT NOT NULL,
  tribunal_alias TEXT NOT NULL,
  
  -- Court and Jurisdiction Information
  court_instance INTEGER, -- grau (1=first instance, 2=second, etc.)
  court_code INTEGER,
  court_name TEXT,
  court_municipality_ibge INTEGER,
  court_municipality TEXT,
  court_state TEXT,
  court_competence TEXT,
  
  -- Case Classification
  process_class_code INTEGER,
  process_class_name TEXT,
  process_format_code INTEGER, -- 1=Physical, 2=Electronic
  process_format_name TEXT,
  court_system_code INTEGER,
  court_system_name TEXT, -- PJe, SAJ, etc.
  
  -- Case Metadata
  filing_date TIMESTAMP WITH TIME ZONE,
  last_update_date TIMESTAMP WITH TIME ZONE,
  case_value DECIMAL(15,2),
  is_confidential BOOLEAN DEFAULT false,
  
  -- Data Quality and Confidence
  enrichment_confidence DECIMAL(3,2) DEFAULT 0.85, -- 0.0 to 1.0
  last_enrichment_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  enrichment_status TEXT DEFAULT 'pending', -- pending, completed, failed, partial
  data_conflicts JSONB, -- Store any data conflicts for manual review
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  
  -- Constraints
  UNIQUE(law_firm_id, datajud_case_id),
  UNIQUE(law_firm_id, numero_processo_cnj)
);

-- =====================================================
-- DATAJUD LEGAL SUBJECTS
-- Legal subjects (assuntos) associated with cases
-- =====================================================

CREATE TABLE datajud_legal_subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
  datajud_case_detail_id UUID NOT NULL REFERENCES datajud_case_details(id) ON DELETE CASCADE,
  
  -- Subject Information
  subject_code INTEGER NOT NULL,
  subject_name TEXT NOT NULL,
  is_primary_subject BOOLEAN DEFAULT false,
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  UNIQUE(datajud_case_detail_id, subject_code)
);

-- =====================================================
-- DATAJUD CASE PARTICIPANTS
-- Parties involved in the legal case
-- =====================================================

CREATE TABLE datajud_case_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
  datajud_case_detail_id UUID NOT NULL REFERENCES datajud_case_details(id) ON DELETE CASCADE,
  
  -- Participant Information
  participant_name TEXT NOT NULL,
  participant_cpf_cnpj TEXT,
  participant_type TEXT CHECK (participant_type IN ('F', 'J')), -- Física ou Jurídica
  
  -- Case Role
  case_role TEXT CHECK (case_role IN ('ativo', 'passivo')), -- plaintiff/defendant
  participation_type TEXT, -- specific role description
  
  -- Data Matching
  matched_contact_id UUID REFERENCES contacts(id), -- link to existing contact if matched
  match_confidence DECIMAL(3,2), -- confidence in the match (0.0 to 1.0)
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- DATAJUD TIMELINE EVENTS
-- Court movements and case timeline events
-- =====================================================

CREATE TABLE datajud_timeline_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
  datajud_case_detail_id UUID NOT NULL REFERENCES datajud_case_details(id) ON DELETE CASCADE,
  
  -- Event Identifiers
  movement_id TEXT NOT NULL, -- DataJud movement ID
  movement_code INTEGER NOT NULL,
  movement_name TEXT NOT NULL,
  movement_complement TEXT,
  
  -- Event Details
  event_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  responsible_type_code INTEGER,
  responsible_type_name TEXT,
  responsible_code INTEGER,
  responsible_name TEXT,
  
  -- Event Classification
  event_category TEXT, -- categorize events (decision, filing, hearing, etc.)
  priority_level TEXT DEFAULT 'normal' CHECK (priority_level IN ('low', 'normal', 'high', 'critical')),
  is_relevant BOOLEAN DEFAULT true, -- flag for filtering
  
  -- Display Configuration
  is_visible_client BOOLEAN DEFAULT true, -- show to clients
  is_visible_timeline BOOLEAN DEFAULT true, -- show in main timeline
  custom_description TEXT, -- custom description if needed
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  UNIQUE(datajud_case_detail_id, movement_id)
);

-- =====================================================
-- DATAJUD SYNC LOG
-- Track synchronization activities and errors
-- =====================================================

CREATE TABLE datajud_sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
  
  -- Sync Details
  sync_type TEXT NOT NULL CHECK (sync_type IN ('full', 'incremental', 'manual', 'case_specific')),
  sync_status TEXT NOT NULL CHECK (sync_status IN ('started', 'completed', 'failed', 'partial')),
  
  -- Scope
  matter_id UUID REFERENCES matters(id), -- specific case if case_specific sync
  total_cases_processed INTEGER DEFAULT 0,
  successful_cases INTEGER DEFAULT 0,
  failed_cases INTEGER DEFAULT 0,
  
  -- Timing
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  
  -- Results
  summary JSONB, -- detailed sync results
  errors JSONB, -- error details
  api_calls_made INTEGER DEFAULT 0,
  rate_limit_hits INTEGER DEFAULT 0,
  
  -- Audit
  initiated_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Primary lookup indexes
CREATE INDEX idx_datajud_case_details_matter_id ON datajud_case_details(matter_id);
CREATE INDEX idx_datajud_case_details_law_firm_id ON datajud_case_details(law_firm_id);
CREATE INDEX idx_datajud_case_details_processo_cnj ON datajud_case_details(numero_processo_cnj);
CREATE INDEX idx_datajud_case_details_tribunal ON datajud_case_details(tribunal_alias);

-- Timeline events indexes
CREATE INDEX idx_datajud_timeline_events_case_detail_id ON datajud_timeline_events(datajud_case_detail_id);
CREATE INDEX idx_datajud_timeline_events_datetime ON datajud_timeline_events(event_datetime DESC);
CREATE INDEX idx_datajud_timeline_events_visible ON datajud_timeline_events(is_visible_timeline, is_relevant);
CREATE INDEX idx_datajud_timeline_events_priority ON datajud_timeline_events(priority_level, event_datetime DESC);

-- Participants indexes
CREATE INDEX idx_datajud_participants_case_detail_id ON datajud_case_participants(datajud_case_detail_id);
CREATE INDEX idx_datajud_participants_contact_match ON datajud_case_participants(matched_contact_id) WHERE matched_contact_id IS NOT NULL;
CREATE INDEX idx_datajud_participants_cpf_cnpj ON datajud_case_participants(participant_cpf_cnpj) WHERE participant_cpf_cnpj IS NOT NULL;

-- Legal subjects indexes
CREATE INDEX idx_datajud_legal_subjects_case_detail_id ON datajud_legal_subjects(datajud_case_detail_id);
CREATE INDEX idx_datajud_legal_subjects_primary ON datajud_legal_subjects(subject_code) WHERE is_primary_subject = true;

-- Sync log indexes
CREATE INDEX idx_datajud_sync_log_law_firm_id ON datajud_sync_log(law_firm_id);
CREATE INDEX idx_datajud_sync_log_started_at ON datajud_sync_log(started_at DESC);
CREATE INDEX idx_datajud_sync_log_status ON datajud_sync_log(sync_status);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE datajud_case_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE datajud_legal_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE datajud_case_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE datajud_timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE datajud_sync_log ENABLE ROW LEVEL SECURITY;

-- DataJud Case Details Policies
CREATE POLICY "Users can view their law firm's datajud case details" ON datajud_case_details FOR SELECT USING (
  law_firm_id IN (
    SELECT law_firm_id FROM users WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert datajud case details for their law firm" ON datajud_case_details FOR INSERT WITH CHECK (
  law_firm_id IN (
    SELECT law_firm_id FROM users WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their law firm's datajud case details" ON datajud_case_details FOR UPDATE USING (
  law_firm_id IN (
    SELECT law_firm_id FROM users WHERE auth_user_id = auth.uid()
  )
);

-- DataJud Legal Subjects Policies
CREATE POLICY "Users can view their law firm's datajud legal subjects" ON datajud_legal_subjects FOR SELECT USING (
  law_firm_id IN (
    SELECT law_firm_id FROM users WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their law firm's datajud legal subjects" ON datajud_legal_subjects FOR ALL USING (
  law_firm_id IN (
    SELECT law_firm_id FROM users WHERE auth_user_id = auth.uid()
  )
);

-- DataJud Case Participants Policies
CREATE POLICY "Users can view their law firm's datajud participants" ON datajud_case_participants FOR SELECT USING (
  law_firm_id IN (
    SELECT law_firm_id FROM users WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their law firm's datajud participants" ON datajud_case_participants FOR ALL USING (
  law_firm_id IN (
    SELECT law_firm_id FROM users WHERE auth_user_id = auth.uid()
  )
);

-- DataJud Timeline Events Policies
CREATE POLICY "Users can view their law firm's datajud timeline events" ON datajud_timeline_events FOR SELECT USING (
  law_firm_id IN (
    SELECT law_firm_id FROM users WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their law firm's datajud timeline events" ON datajud_timeline_events FOR ALL USING (
  law_firm_id IN (
    SELECT law_firm_id FROM users WHERE auth_user_id = auth.uid()
  )
);

-- DataJud Sync Log Policies
CREATE POLICY "Users can view their law firm's datajud sync logs" ON datajud_sync_log FOR SELECT USING (
  law_firm_id IN (
    SELECT law_firm_id FROM users WHERE auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can create sync logs for their law firm" ON datajud_sync_log FOR INSERT WITH CHECK (
  law_firm_id IN (
    SELECT law_firm_id FROM users WHERE auth_user_id = auth.uid()
  )
);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_datajud_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update timestamp triggers
CREATE TRIGGER update_datajud_case_details_updated_at
  BEFORE UPDATE ON datajud_case_details
  FOR EACH ROW EXECUTE FUNCTION update_datajud_updated_at();

CREATE TRIGGER update_datajud_case_participants_updated_at
  BEFORE UPDATE ON datajud_case_participants
  FOR EACH ROW EXECUTE FUNCTION update_datajud_updated_at();

CREATE TRIGGER update_datajud_timeline_events_updated_at
  BEFORE UPDATE ON datajud_timeline_events
  FOR EACH ROW EXECUTE FUNCTION update_datajud_updated_at();

-- =====================================================
-- FUNCTIONS FOR DATA ENRICHMENT
-- =====================================================

-- Function to calculate enrichment confidence based on data quality
CREATE OR REPLACE FUNCTION calculate_enrichment_confidence(
  p_datajud_case_detail_id UUID
) RETURNS DECIMAL(3,2) AS $$
DECLARE
  v_confidence DECIMAL(3,2) := 0.0;
  v_base_score DECIMAL(3,2) := 0.5;
  v_bonus DECIMAL(3,2) := 0.0;
BEGIN
  -- Start with base confidence
  v_confidence := v_base_score;
  
  -- Check for court information (+0.1)
  SELECT v_confidence + 0.1 INTO v_confidence
  FROM datajud_case_details 
  WHERE id = p_datajud_case_detail_id 
    AND court_name IS NOT NULL 
    AND court_code IS NOT NULL;
  
  -- Check for classification data (+0.1)
  SELECT v_confidence + 0.1 INTO v_confidence
  FROM datajud_case_details 
  WHERE id = p_datajud_case_detail_id 
    AND process_class_name IS NOT NULL;
  
  -- Check for legal subjects (+0.1)
  IF EXISTS (SELECT 1 FROM datajud_legal_subjects WHERE datajud_case_detail_id = p_datajud_case_detail_id) THEN
    v_confidence := v_confidence + 0.1;
  END IF;
  
  -- Check for participants (+0.1)
  IF EXISTS (SELECT 1 FROM datajud_case_participants WHERE datajud_case_detail_id = p_datajud_case_detail_id) THEN
    v_confidence := v_confidence + 0.1;
  END IF;
  
  -- Check for timeline events (+0.1)
  IF EXISTS (SELECT 1 FROM datajud_timeline_events WHERE datajud_case_detail_id = p_datajud_case_detail_id) THEN
    v_confidence := v_confidence + 0.1;
  END IF;
  
  -- Ensure confidence is between 0.0 and 1.0
  v_confidence := GREATEST(0.0, LEAST(1.0, v_confidence));
  
  -- Update the confidence in the record
  UPDATE datajud_case_details 
  SET enrichment_confidence = v_confidence,
      last_enrichment_at = CURRENT_TIMESTAMP
  WHERE id = p_datajud_case_detail_id;
  
  RETURN v_confidence;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE datajud_case_details IS 'Stores comprehensive case information enriched from DataJud CNJ API';
COMMENT ON TABLE datajud_legal_subjects IS 'Legal subjects (assuntos jurídicos) associated with cases from DataJud';
COMMENT ON TABLE datajud_case_participants IS 'Parties and participants in legal cases from DataJud';
COMMENT ON TABLE datajud_timeline_events IS 'Court movements and timeline events synchronized from DataJud';
COMMENT ON TABLE datajud_sync_log IS 'Audit log for DataJud synchronization activities';

COMMENT ON COLUMN datajud_case_details.enrichment_confidence IS 'Confidence score (0.0-1.0) in the enriched data quality';
COMMENT ON COLUMN datajud_case_details.data_conflicts IS 'JSON object storing any conflicts between existing and DataJud data';
COMMENT ON COLUMN datajud_timeline_events.is_relevant IS 'Flag to filter relevant events for display';
COMMENT ON COLUMN datajud_timeline_events.priority_level IS 'Event priority for sorting and highlighting';

-- =====================================================
-- SAMPLE QUERIES FOR COMMON OPERATIONS
-- =====================================================

/*
-- Get enriched case information
SELECT 
  m.title as matter_title,
  m.matter_number,
  dcd.*,
  array_agg(DISTINCT dls.subject_name) as legal_subjects,
  array_agg(DISTINCT dcp.participant_name) as participants
FROM datajud_case_details dcd
JOIN matters m ON m.id = dcd.matter_id
LEFT JOIN datajud_legal_subjects dls ON dls.datajud_case_detail_id = dcd.id
LEFT JOIN datajud_case_participants dcp ON dcp.datajud_case_detail_id = dcd.id
WHERE dcd.law_firm_id = 'YOUR_LAW_FIRM_ID'
GROUP BY m.id, dcd.id;

-- Get timeline events for a case
SELECT 
  dte.*,
  m.title as matter_title
FROM datajud_timeline_events dte
JOIN datajud_case_details dcd ON dcd.id = dte.datajud_case_detail_id
JOIN matters m ON m.id = dcd.matter_id
WHERE dcd.law_firm_id = 'YOUR_LAW_FIRM_ID'
  AND dte.is_visible_timeline = true
  AND dte.is_relevant = true
ORDER BY dte.event_datetime DESC;
*/