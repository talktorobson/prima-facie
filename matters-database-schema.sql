-- =====================================================
-- Prima Facie - Matters Management Database Schema
-- Phase 5: Legal matters/cases management system
-- =====================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. MATTER TYPES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS matter_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    
    -- Type Information
    name VARCHAR(100) NOT NULL,
    description TEXT,
    code VARCHAR(20), -- Internal code like "CIV", "TRAB", "CRIM"
    
    -- Brazilian Legal Categories
    area_juridica VARCHAR(50) NOT NULL, -- "Civil", "Trabalhista", "Criminal", "Empresarial", etc.
    tribunal VARCHAR(100), -- Which court/tribunal typically handles this
    
    -- Billing & Time Tracking
    default_hourly_rate DECIMAL(10,2),
    estimated_hours INTEGER,
    
    -- Workflow
    default_status VARCHAR(50) DEFAULT 'novo',
    requires_contract BOOLEAN DEFAULT false,
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_area_juridica CHECK (area_juridica IN (
        'Civil', 'Criminal', 'Trabalhista', 'Empresarial', 'Tributário', 
        'Previdenciário', 'Família', 'Consumidor', 'Ambiental', 'Administrativo'
    )),
    CONSTRAINT unique_type_per_firm UNIQUE(law_firm_id, code)
);

-- =====================================================
-- 2. MATTERS TABLE (Main table)
-- =====================================================
CREATE TABLE IF NOT EXISTS matters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    matter_type_id UUID REFERENCES matter_types(id) ON DELETE SET NULL,
    
    -- Basic Information
    matter_number VARCHAR(50) NOT NULL, -- Internal number like "2024/001"
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Legal Information
    area_juridica VARCHAR(50) NOT NULL,
    processo_numero VARCHAR(50), -- Process number in Brazilian courts
    vara_tribunal VARCHAR(200), -- Court/tribunal handling the case
    comarca VARCHAR(100), -- Judicial district
    
    -- Client Information
    client_id UUID REFERENCES users(id) ON DELETE SET NULL,
    client_name VARCHAR(255), -- Fallback if not linked to user
    client_cpf_cnpj VARCHAR(18),
    
    -- Case Details
    opposing_party VARCHAR(255), -- Parte contrária
    opposing_party_lawyer VARCHAR(255),
    case_value DECIMAL(15,2), -- Valor da causa
    
    -- Dates
    opened_date DATE NOT NULL DEFAULT CURRENT_DATE,
    statute_limitations DATE, -- Prazo prescricional
    next_hearing_date TIMESTAMP WITH TIME ZONE,
    closed_date DATE,
    
    -- Status & Workflow
    status VARCHAR(50) NOT NULL DEFAULT 'novo',
    priority VARCHAR(20) DEFAULT 'media',
    probability_success INTEGER CHECK (probability_success >= 0 AND probability_success <= 100),
    
    -- Assignment
    responsible_lawyer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_team UUID[], -- Array of user IDs
    
    -- Financial
    hourly_rate DECIMAL(10,2),
    fixed_fee DECIMAL(10,2),
    retainer_amount DECIMAL(10,2),
    billing_method VARCHAR(50) DEFAULT 'hourly',
    
    -- Internal Notes
    internal_notes TEXT,
    next_action TEXT,
    
    -- Metadata
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_status CHECK (status IN (
        'novo', 'analise', 'ativo', 'suspenso', 'aguardando_cliente', 
        'aguardando_documentos', 'finalizado', 'arquivado', 'cancelado'
    )),
    CONSTRAINT valid_priority CHECK (priority IN ('baixa', 'media', 'alta', 'urgente')),
    CONSTRAINT valid_billing_method CHECK (billing_method IN ('hourly', 'fixed', 'contingency', 'retainer')),
    CONSTRAINT valid_area_juridica CHECK (area_juridica IN (
        'Civil', 'Criminal', 'Trabalhista', 'Empresarial', 'Tributário', 
        'Previdenciário', 'Família', 'Consumidor', 'Ambiental', 'Administrativo'
    )),
    CONSTRAINT unique_matter_number UNIQUE(law_firm_id, matter_number)
);

-- =====================================================
-- 3. MATTER EVENTS TABLE (Timeline/History)
-- =====================================================
CREATE TABLE IF NOT EXISTS matter_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    
    -- Event Information
    event_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Date & Time
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    reminder_date TIMESTAMP WITH TIME ZONE,
    
    -- Legal Specific
    hearing_type VARCHAR(100), -- "Audiência de Conciliação", "Audiência de Instrução", etc.
    court_location VARCHAR(255),
    
    -- Status
    status VARCHAR(50) DEFAULT 'agendado',
    outcome TEXT, -- Result of the event
    
    -- Assignment
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Metadata
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_event_type CHECK (event_type IN (
        'audiencia', 'prazo', 'peticao', 'despacho', 'sentenca', 
        'recurso', 'reuniao', 'ligacao', 'email', 'documento', 'outro'
    )),
    CONSTRAINT valid_event_status CHECK (status IN (
        'agendado', 'em_andamento', 'concluido', 'cancelado', 'adiado'
    ))
);

-- =====================================================
-- 4. MATTER DOCUMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS matter_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    
    -- Document Information
    title VARCHAR(255) NOT NULL,
    description TEXT,
    document_type VARCHAR(50) NOT NULL,
    
    -- File Information
    file_name VARCHAR(255),
    file_size INTEGER,
    file_url TEXT,
    mime_type VARCHAR(100),
    
    -- Document Metadata
    is_confidential BOOLEAN DEFAULT false,
    version INTEGER DEFAULT 1,
    tags TEXT[],
    
    -- Legal Specific
    is_evidence BOOLEAN DEFAULT false,
    evidence_type VARCHAR(100),
    
    -- Access Control
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    visible_to_client BOOLEAN DEFAULT false,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_document_type CHECK (document_type IN (
        'peticao', 'contrato', 'procuracao', 'documento_pessoal', 
        'comprovante', 'laudo', 'parecer', 'jurisprudencia', 'outro'
    ))
);

-- =====================================================
-- 5. MATTER CONTACTS TABLE (Additional parties)
-- =====================================================
CREATE TABLE IF NOT EXISTS matter_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    
    -- Contact Information
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL, -- "Testemunha", "Perito", "Advogado da parte contrária"
    email VARCHAR(255),
    phone VARCHAR(20),
    
    -- Address
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_neighborhood VARCHAR(100),
    address_city VARCHAR(100),
    address_state VARCHAR(2),
    address_zipcode VARCHAR(9),
    
    -- Additional Info
    cpf_cnpj VARCHAR(18),
    company VARCHAR(255),
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- 6. INSERT DEFAULT MATTER TYPES
-- =====================================================
INSERT INTO matter_types (
    id, law_firm_id, name, description, code, area_juridica, 
    default_hourly_rate, estimated_hours
) VALUES 
-- For default law firm (Dávila Reis Advocacia)
(
    '111a1111-1111-1111-1111-111111111111',
    '123e4567-e89b-12d3-a456-426614174000',
    'Ação Trabalhista',
    'Processos relacionados a direitos trabalhistas',
    'TRAB',
    'Trabalhista',
    300.00,
    40
),
(
    '222a2222-2222-2222-2222-222222222222',
    '123e4567-e89b-12d3-a456-426614174000',
    'Ação Civil',
    'Processos cíveis em geral',
    'CIV',
    'Civil',
    250.00,
    30
),
(
    '333a3333-3333-3333-3333-333333333333',
    '123e4567-e89b-12d3-a456-426614174000',
    'Consultoria Empresarial',
    'Consultoria jurídica para empresas',
    'EMP',
    'Empresarial',
    400.00,
    20
),
(
    '444a4444-4444-4444-4444-444444444444',
    '123e4567-e89b-12d3-a456-426614174000',
    'Direito de Família',
    'Divórcios, guarda, pensão alimentícia',
    'FAM',
    'Família',
    280.00,
    25
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 7. ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE matter_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE matters ENABLE ROW LEVEL SECURITY;
ALTER TABLE matter_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE matter_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE matter_contacts ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 8. CREATE RLS POLICIES
-- =====================================================

-- Matter Types - Users can only see their law firm's types
CREATE POLICY "matter_types_law_firm_policy" ON matter_types
  FOR ALL USING (
    law_firm_id IN (
      SELECT law_firm_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- Matters - Users can only see their law firm's matters
CREATE POLICY "matters_law_firm_policy" ON matters
  FOR ALL USING (
    law_firm_id IN (
      SELECT law_firm_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- Matter Events - Users can only see events for their law firm's matters
CREATE POLICY "matter_events_law_firm_policy" ON matter_events
  FOR ALL USING (
    matter_id IN (
      SELECT m.id FROM matters m
      JOIN users u ON u.law_firm_id = m.law_firm_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- Matter Documents - Users can only see documents for their law firm's matters
CREATE POLICY "matter_documents_law_firm_policy" ON matter_documents
  FOR ALL USING (
    matter_id IN (
      SELECT m.id FROM matters m
      JOIN users u ON u.law_firm_id = m.law_firm_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- Matter Contacts - Users can only see contacts for their law firm's matters
CREATE POLICY "matter_contacts_law_firm_policy" ON matter_contacts
  FOR ALL USING (
    matter_id IN (
      SELECT m.id FROM matters m
      JOIN users u ON u.law_firm_id = m.law_firm_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- =====================================================
-- 9. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Matter Types
CREATE INDEX IF NOT EXISTS idx_matter_types_law_firm_id ON matter_types(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_matter_types_area_juridica ON matter_types(area_juridica);

-- Matters
CREATE INDEX IF NOT EXISTS idx_matters_law_firm_id ON matters(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_matters_client_id ON matters(client_id);
CREATE INDEX IF NOT EXISTS idx_matters_responsible_lawyer_id ON matters(responsible_lawyer_id);
CREATE INDEX IF NOT EXISTS idx_matters_status ON matters(status);
CREATE INDEX IF NOT EXISTS idx_matters_area_juridica ON matters(area_juridica);
CREATE INDEX IF NOT EXISTS idx_matters_opened_date ON matters(opened_date);
CREATE INDEX IF NOT EXISTS idx_matters_matter_number ON matters(matter_number);

-- Matter Events
CREATE INDEX IF NOT EXISTS idx_matter_events_matter_id ON matter_events(matter_id);
CREATE INDEX IF NOT EXISTS idx_matter_events_event_date ON matter_events(event_date);
CREATE INDEX IF NOT EXISTS idx_matter_events_assigned_to ON matter_events(assigned_to);

-- Matter Documents
CREATE INDEX IF NOT EXISTS idx_matter_documents_matter_id ON matter_documents(matter_id);
CREATE INDEX IF NOT EXISTS idx_matter_documents_document_type ON matter_documents(document_type);

-- Matter Contacts
CREATE INDEX IF NOT EXISTS idx_matter_contacts_matter_id ON matter_contacts(matter_id);

-- =====================================================
-- 10. CREATE UPDATE TRIGGERS
-- =====================================================

-- Apply update triggers to all matter tables
DROP TRIGGER IF EXISTS update_matter_types_updated_at ON matter_types;
CREATE TRIGGER update_matter_types_updated_at 
    BEFORE UPDATE ON matter_types 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_matters_updated_at ON matters;
CREATE TRIGGER update_matters_updated_at 
    BEFORE UPDATE ON matters 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_matter_events_updated_at ON matter_events;
CREATE TRIGGER update_matter_events_updated_at 
    BEFORE UPDATE ON matter_events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_matter_documents_updated_at ON matter_documents;
CREATE TRIGGER update_matter_documents_updated_at 
    BEFORE UPDATE ON matter_documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_matter_contacts_updated_at ON matter_contacts;
CREATE TRIGGER update_matter_contacts_updated_at 
    BEFORE UPDATE ON matter_contacts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 11. CREATE FUNCTION FOR AUTO MATTER NUMBERS
-- =====================================================
CREATE OR REPLACE FUNCTION generate_matter_number(firm_id UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
    current_year INTEGER;
    next_number INTEGER;
    matter_number VARCHAR(50);
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- Get the next sequential number for this year and firm
    SELECT COALESCE(MAX(
        CAST(
            SPLIT_PART(
                SPLIT_PART(matter_number, '/', 2), 
                '-', 1
            ) AS INTEGER
        )
    ), 0) + 1
    INTO next_number
    FROM matters 
    WHERE law_firm_id = firm_id 
    AND matter_number LIKE current_year || '%';
    
    -- Format: YYYY/NNN (e.g., 2024/001)
    matter_number := current_year || '/' || LPAD(next_number::TEXT, 3, '0');
    
    RETURN matter_number;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 12. SUCCESS NOTIFICATION
-- =====================================================
SELECT 
    'Prima Facie matters management schema created successfully!' as message,
    'Tables: matter_types, matters, matter_events, matter_documents, matter_contacts' as tables,
    'RLS policies and indexes applied' as security,
    'Default matter types created for Dávila Reis Advocacia' as default_data;