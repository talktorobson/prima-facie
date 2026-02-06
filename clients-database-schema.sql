-- =====================================================
-- Prima Facie - Client Management Database Schema
-- Phase 6: Client records and portal access system
-- =====================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. CLIENT TYPES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS client_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    
    -- Type Information
    name VARCHAR(100) NOT NULL,
    description TEXT,
    code VARCHAR(20), -- Internal code like "PF", "PJ", "GOV"
    
    -- Client Category
    category VARCHAR(50) NOT NULL, -- "pessoa_fisica", "pessoa_juridica", "governo", "ong"
    
    -- Billing & Rates
    default_hourly_rate DECIMAL(10,2),
    default_billing_method VARCHAR(50) DEFAULT 'hourly',
    
    -- Portal Access
    portal_access BOOLEAN DEFAULT true,
    auto_matter_visibility BOOLEAN DEFAULT true,
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_category CHECK (category IN (
        'pessoa_fisica', 'pessoa_juridica', 'governo', 'ong'
    )),
    CONSTRAINT valid_billing_method CHECK (default_billing_method IN (
        'hourly', 'fixed', 'contingency', 'retainer'
    )),
    CONSTRAINT unique_type_per_firm UNIQUE(law_firm_id, code)
);

-- =====================================================
-- 2. CLIENTS TABLE (Main table)
-- =====================================================
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    client_type_id UUID REFERENCES client_types(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Link to user account if they have portal access
    
    -- Basic Information
    client_number VARCHAR(50) NOT NULL, -- Internal number like "CLI-2024-001"
    status VARCHAR(20) DEFAULT 'ativo',
    
    -- Personal/Business Information
    type VARCHAR(20) NOT NULL, -- "pessoa_fisica" or "pessoa_juridica"
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255), -- Razão social for companies
    trade_name VARCHAR(255), -- Nome fantasia for companies
    
    -- Brazilian Documentation
    cpf VARCHAR(14), -- For pessoa_fisica: 000.000.000-00
    cnpj VARCHAR(18), -- For pessoa_juridica: 00.000.000/0000-00
    rg VARCHAR(20), -- RG for pessoa_fisica
    ie VARCHAR(20), -- Inscrição Estadual for companies
    im VARCHAR(20), -- Inscrição Municipal for companies
    
    -- Contact Information
    email VARCHAR(255),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    whatsapp VARCHAR(20),
    website VARCHAR(255),
    
    -- Address Information
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_complement VARCHAR(100),
    address_neighborhood VARCHAR(100),
    address_city VARCHAR(100),
    address_state VARCHAR(2),
    address_zipcode VARCHAR(9),
    address_country VARCHAR(2) DEFAULT 'BR',
    
    -- Professional Information (for companies)
    industry VARCHAR(100),
    company_size VARCHAR(50),
    annual_revenue DECIMAL(15,2),
    
    -- Personal Information (for individuals)
    birth_date DATE,
    marital_status VARCHAR(20),
    profession VARCHAR(100),
    nationality VARCHAR(50) DEFAULT 'Brasileira',
    
    -- Emergency Contact
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(50),
    
    -- Portal Access
    portal_enabled BOOLEAN DEFAULT false,
    portal_last_access TIMESTAMP WITH TIME ZONE,
    portal_preferences JSONB DEFAULT '{}',
    
    -- Communication Preferences
    communication_preferences JSONB DEFAULT '{
        "email": true, 
        "sms": false, 
        "whatsapp": true, 
        "portal_notifications": true
    }',
    
    -- Client Relationship
    source VARCHAR(100), -- How they found us
    referred_by VARCHAR(255),
    relationship_manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Financial Information
    credit_limit DECIMAL(10,2),
    payment_terms INTEGER DEFAULT 30, -- Days
    preferred_payment_method VARCHAR(50),
    billing_address_same_as_main BOOLEAN DEFAULT true,
    
    -- Billing Address (if different)
    billing_street VARCHAR(255),
    billing_number VARCHAR(20),
    billing_complement VARCHAR(100),
    billing_neighborhood VARCHAR(100),
    billing_city VARCHAR(100),
    billing_state VARCHAR(2),
    billing_zipcode VARCHAR(9),
    billing_country VARCHAR(2) DEFAULT 'BR',
    
    -- Important Dates
    client_since DATE NOT NULL DEFAULT CURRENT_DATE,
    last_contact_date DATE,
    next_contact_date DATE,
    
    -- Notes and Observations
    notes TEXT,
    internal_notes TEXT, -- Not visible to client
    tags TEXT[], -- For categorization
    
    -- Metadata
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_type CHECK (type IN ('pessoa_fisica', 'pessoa_juridica')),
    CONSTRAINT valid_status CHECK (status IN (
        'ativo', 'inativo', 'suspenso', 'potencial', 'ex_cliente'
    )),
    CONSTRAINT valid_state CHECK (address_state ~ '^[A-Z]{2}$'),
    CONSTRAINT valid_country CHECK (address_country ~ '^[A-Z]{2}$'),
    CONSTRAINT valid_marital_status CHECK (marital_status IN (
        'solteiro', 'casado', 'divorciado', 'viuvo', 'uniao_estavel'
    )),
    CONSTRAINT cpf_for_pessoa_fisica CHECK (
        (type = 'pessoa_fisica' AND cpf IS NOT NULL) OR type = 'pessoa_juridica'
    ),
    CONSTRAINT cnpj_for_pessoa_juridica CHECK (
        (type = 'pessoa_juridica' AND cnpj IS NOT NULL) OR type = 'pessoa_fisica'
    ),
    CONSTRAINT unique_client_number UNIQUE(law_firm_id, client_number),
    CONSTRAINT unique_cpf_per_firm UNIQUE(law_firm_id, cpf),
    CONSTRAINT unique_cnpj_per_firm UNIQUE(law_firm_id, cnpj)
);

-- =====================================================
-- 3. CLIENT CONTACTS TABLE (Additional contacts)
-- =====================================================
CREATE TABLE IF NOT EXISTS client_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Contact Information
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100), -- "Sócio", "Contador", "Gerente", "Assistente"
    department VARCHAR(100),
    
    -- Contact Details
    email VARCHAR(255),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    whatsapp VARCHAR(20),
    
    -- Additional Info
    is_primary BOOLEAN DEFAULT false,
    is_billing_contact BOOLEAN DEFAULT false,
    is_legal_contact BOOLEAN DEFAULT false,
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- 4. CLIENT DOCUMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS client_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Document Information
    title VARCHAR(255) NOT NULL,
    description TEXT,
    document_type VARCHAR(50) NOT NULL,
    document_category VARCHAR(50) NOT NULL,
    
    -- File Information
    file_name VARCHAR(255),
    file_size INTEGER,
    file_url TEXT,
    mime_type VARCHAR(100),
    
    -- Document Metadata
    is_confidential BOOLEAN DEFAULT false,
    is_required BOOLEAN DEFAULT false,
    version INTEGER DEFAULT 1,
    
    -- Expiration and Validation
    issue_date DATE,
    expiration_date DATE,
    is_valid BOOLEAN DEFAULT true,
    validation_notes TEXT,
    
    -- Access Control
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    visible_to_client BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_document_type CHECK (document_type IN (
        'cpf', 'rg', 'cnpj', 'contrato_social', 'procuracao',
        'comprovante_residencia', 'comprovante_renda', 'certidao_nascimento',
        'certidao_casamento', 'declaracao_ir', 'balanco_patrimonial', 'outro'
    )),
    CONSTRAINT valid_document_category CHECK (document_category IN (
        'identificacao', 'endereco', 'financeiro', 'juridico', 'pessoal', 'empresarial'
    ))
);

-- =====================================================
-- 5. CLIENT INTERACTIONS TABLE (Communication log)
-- =====================================================
CREATE TABLE IF NOT EXISTS client_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    
    -- Interaction Information
    interaction_type VARCHAR(50) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Communication Details
    method VARCHAR(50) NOT NULL, -- "email", "phone", "whatsapp", "meeting", "portal"
    direction VARCHAR(20) NOT NULL, -- "inbound", "outbound"
    
    -- Date & Time
    interaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    duration_minutes INTEGER,
    
    -- Status & Follow-up
    status VARCHAR(50) DEFAULT 'completed',
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    follow_up_notes TEXT,
    
    -- Related Information
    matter_id UUID REFERENCES matters(id) ON DELETE SET NULL,
    related_document_id UUID REFERENCES client_documents(id) ON DELETE SET NULL,
    
    -- Staff Information
    handled_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_interaction_type CHECK (interaction_type IN (
        'consulta', 'atualizacao_processo', 'cobranca', 'documentacao',
        'agendamento', 'suporte', 'feedback', 'renovacao', 'outro'
    )),
    CONSTRAINT valid_method CHECK (method IN (
        'email', 'phone', 'whatsapp', 'meeting', 'portal', 'sms', 'presencial'
    )),
    CONSTRAINT valid_direction CHECK (direction IN ('inbound', 'outbound')),
    CONSTRAINT valid_status CHECK (status IN (
        'scheduled', 'in_progress', 'completed', 'cancelled', 'no_response'
    ))
);

-- =====================================================
-- 6. INSERT DEFAULT CLIENT TYPES
-- =====================================================
INSERT INTO client_types (
    id, law_firm_id, name, description, code, category, 
    default_hourly_rate, default_billing_method
) VALUES 
-- For default law firm (Dávila Reis Advocacia)
(
    '111c1111-1111-1111-1111-111111111111',
    '123e4567-e89b-12d3-a456-426614174000',
    'Pessoa Física',
    'Clientes pessoa física',
    'PF',
    'pessoa_fisica',
    250.00,
    'hourly'
),
(
    '222c2222-2222-2222-2222-222222222222',
    '123e4567-e89b-12d3-a456-426614174000',
    'Pessoa Jurídica',
    'Empresas e pessoas jurídicas',
    'PJ',
    'pessoa_juridica',
    400.00,
    'hourly'
),
(
    '333c3333-3333-3333-3333-333333333333',
    '123e4567-e89b-12d3-a456-426614174000',
    'Cliente VIP',
    'Clientes especiais com tarifas diferenciadas',
    'VIP',
    'pessoa_fisica',
    350.00,
    'retainer'
),
(
    '444c4444-4444-4444-4444-444444444444',
    '123e4567-e89b-12d3-a456-426614174000',
    'Corporativo',
    'Grandes empresas com contratos especiais',
    'CORP',
    'pessoa_juridica',
    500.00,
    'fixed'
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 7. ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE client_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_interactions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 8. CREATE RLS POLICIES
-- =====================================================

-- Client Types - Users can only see their law firm's types
CREATE POLICY "client_types_law_firm_policy" ON client_types
  FOR ALL USING (
    law_firm_id IN (
      SELECT law_firm_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- Clients - Users can only see their law firm's clients
CREATE POLICY "clients_law_firm_policy" ON clients
  FOR ALL USING (
    law_firm_id IN (
      SELECT law_firm_id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- Client Contacts - Users can only see contacts for their law firm's clients
CREATE POLICY "client_contacts_law_firm_policy" ON client_contacts
  FOR ALL USING (
    client_id IN (
      SELECT c.id FROM clients c
      JOIN users u ON u.law_firm_id = c.law_firm_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- Client Documents - Users can only see documents for their law firm's clients
CREATE POLICY "client_documents_law_firm_policy" ON client_documents
  FOR ALL USING (
    client_id IN (
      SELECT c.id FROM clients c
      JOIN users u ON u.law_firm_id = c.law_firm_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- Client Interactions - Users can only see interactions for their law firm's clients
CREATE POLICY "client_interactions_law_firm_policy" ON client_interactions
  FOR ALL USING (
    client_id IN (
      SELECT c.id FROM clients c
      JOIN users u ON u.law_firm_id = c.law_firm_id
      WHERE u.auth_user_id = auth.uid()
    )
  );

-- =====================================================
-- 9. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Client Types
CREATE INDEX IF NOT EXISTS idx_client_types_law_firm_id ON client_types(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_client_types_category ON client_types(category);

-- Clients
CREATE INDEX IF NOT EXISTS idx_clients_law_firm_id ON clients(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_clients_type ON clients(type);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_cpf ON clients(cpf);
CREATE INDEX IF NOT EXISTS idx_clients_cnpj ON clients(cnpj);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_client_number ON clients(client_number);
CREATE INDEX IF NOT EXISTS idx_clients_relationship_manager ON clients(relationship_manager_id);

-- Client Contacts
CREATE INDEX IF NOT EXISTS idx_client_contacts_client_id ON client_contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_client_contacts_primary ON client_contacts(is_primary);

-- Client Documents
CREATE INDEX IF NOT EXISTS idx_client_documents_client_id ON client_documents(client_id);
CREATE INDEX IF NOT EXISTS idx_client_documents_type ON client_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_client_documents_expiration ON client_documents(expiration_date);

-- Client Interactions
CREATE INDEX IF NOT EXISTS idx_client_interactions_client_id ON client_interactions(client_id);
CREATE INDEX IF NOT EXISTS idx_client_interactions_date ON client_interactions(interaction_date);
CREATE INDEX IF NOT EXISTS idx_client_interactions_handled_by ON client_interactions(handled_by);
CREATE INDEX IF NOT EXISTS idx_client_interactions_matter_id ON client_interactions(matter_id);

-- =====================================================
-- 10. CREATE UPDATE TRIGGERS
-- =====================================================

-- Apply update triggers to all client tables
DROP TRIGGER IF EXISTS update_client_types_updated_at ON client_types;
CREATE TRIGGER update_client_types_updated_at 
    BEFORE UPDATE ON client_types 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at 
    BEFORE UPDATE ON clients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_client_contacts_updated_at ON client_contacts;
CREATE TRIGGER update_client_contacts_updated_at 
    BEFORE UPDATE ON client_contacts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_client_documents_updated_at ON client_documents;
CREATE TRIGGER update_client_documents_updated_at 
    BEFORE UPDATE ON client_documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_client_interactions_updated_at ON client_interactions;
CREATE TRIGGER update_client_interactions_updated_at 
    BEFORE UPDATE ON client_interactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 11. CREATE FUNCTION FOR AUTO CLIENT NUMBERS
-- =====================================================
CREATE OR REPLACE FUNCTION generate_client_number(firm_id UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
    current_year INTEGER;
    next_number INTEGER;
    client_number VARCHAR(50);
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- Get the next sequential number for this year and firm
    SELECT COALESCE(MAX(
        CAST(
            SPLIT_PART(
                SPLIT_PART(client_number, '-', 3), 
                '', 1
            ) AS INTEGER
        )
    ), 0) + 1
    INTO next_number
    FROM clients 
    WHERE law_firm_id = firm_id 
    AND client_number LIKE 'CLI-' || current_year || '%';
    
    -- Format: CLI-YYYY-NNN (e.g., CLI-2024-001)
    client_number := 'CLI-' || current_year || '-' || LPAD(next_number::TEXT, 3, '0');
    
    RETURN client_number;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 12. UPDATE MATTERS TABLE TO LINK CLIENTS
-- =====================================================
-- Add foreign key to link matters to clients table
DO $$
BEGIN
    -- Check if the column doesn't exist and add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'matters' AND column_name = 'client_record_id'
    ) THEN
        ALTER TABLE matters ADD COLUMN client_record_id UUID REFERENCES clients(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_matters_client_record_id ON matters(client_record_id);
    END IF;
END
$$;

-- =====================================================
-- 13. SUCCESS NOTIFICATION
-- =====================================================
SELECT 
    'Prima Facie client management schema created successfully!' as message,
    'Tables: client_types, clients, client_contacts, client_documents, client_interactions' as tables,
    'RLS policies and indexes applied' as security,
    'Default client types created for Dávila Reis Advocacia' as default_data,
    'Matter-client relationship established' as integration;