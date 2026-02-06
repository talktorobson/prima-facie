-- =============================================
-- PRIMA FACIE CORE SCHEMA - STEP 1
-- Create essential tables for basic functionality
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  law_firm_id UUID NOT NULL,
  user_id UUID,
  contact_type VARCHAR(20) NOT NULL CHECK (contact_type IN ('individual', 'company')),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  full_name VARCHAR(200),
  cpf VARCHAR(14),
  rg VARCHAR(20),
  birth_date DATE,
  marital_status VARCHAR(50),
  profession VARCHAR(100),
  company_name VARCHAR(200),
  cnpj VARCHAR(18),
  company_type VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  mobile VARCHAR(20),
  address_street VARCHAR(255),
  address_number VARCHAR(20),
  address_complement VARCHAR(100),
  address_neighborhood VARCHAR(100),
  address_city VARCHAR(100),
  address_state VARCHAR(2),
  address_zipcode VARCHAR(10),
  address_country VARCHAR(2) DEFAULT 'BR',
  client_status VARCHAR(20) CHECK (client_status IN ('prospect', 'active', 'inactive', 'former')),
  source VARCHAR(100),
  credit_limit DECIMAL(12,2),
  total_billed DECIMAL(12,2) DEFAULT 0,
  total_paid DECIMAL(12,2) DEFAULT 0,
  outstanding_balance DECIMAL(12,2) DEFAULT 0,
  preferred_communication VARCHAR(20) CHECK (preferred_communication IN ('email', 'phone', 'whatsapp', 'mail')),
  communication_frequency VARCHAR(20) CHECK (communication_frequency IN ('minimal', 'normal', 'frequent')),
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  updated_by UUID
);

-- Create matter_types table
CREATE TABLE IF NOT EXISTS matter_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  law_firm_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7),
  icon VARCHAR(50),
  default_hourly_rate DECIMAL(10,2),
  default_flat_fee DECIMAL(10,2),
  required_documents TEXT[],
  default_tasks TEXT[],
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  updated_by UUID
);

-- Create matters table
CREATE TABLE IF NOT EXISTS matters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  law_firm_id UUID NOT NULL,
  matter_type_id UUID REFERENCES matter_types(id),
  matter_number VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  court_name VARCHAR(200),
  court_city VARCHAR(100),
  court_state VARCHAR(2),
  process_number VARCHAR(50),
  opposing_party VARCHAR(200),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'on_hold', 'settled', 'dismissed')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  opened_date DATE DEFAULT CURRENT_DATE,
  closed_date DATE,
  statute_of_limitations DATE,
  next_court_date DATE,
  billing_method VARCHAR(20) CHECK (billing_method IN ('hourly', 'flat_fee', 'contingency', 'pro_bono')),
  hourly_rate DECIMAL(10,2),
  flat_fee DECIMAL(10,2),
  contingency_percentage DECIMAL(5,2),
  total_time_logged DECIMAL(10,2) DEFAULT 0,
  total_billed DECIMAL(12,2) DEFAULT 0,
  total_paid DECIMAL(12,2) DEFAULT 0,
  outstanding_balance DECIMAL(12,2) DEFAULT 0,
  responsible_lawyer_id UUID,
  assigned_staff UUID[],
  notes TEXT,
  tags TEXT[],
  custom_fields JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  updated_by UUID
);

-- Create matter_contacts junction table
CREATE TABLE IF NOT EXISTS matter_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  relationship_type VARCHAR(20) NOT NULL CHECK (relationship_type IN ('client', 'opposing_party', 'witness', 'expert', 'other')),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  UNIQUE(matter_id, contact_id, relationship_type)
);

-- Create basic indexes
CREATE INDEX IF NOT EXISTS idx_contacts_law_firm_id ON contacts(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_matters_law_firm_id ON matters(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_matters_matter_type_id ON matters(matter_type_id);
CREATE INDEX IF NOT EXISTS idx_matter_contacts_matter_id ON matter_contacts(matter_id);
CREATE INDEX IF NOT EXISTS idx_matter_contacts_contact_id ON matter_contacts(contact_id);

-- Enable Row Level Security
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE matter_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE matters ENABLE ROW LEVEL SECURITY;
ALTER TABLE matter_contacts ENABLE ROW LEVEL SECURITY;