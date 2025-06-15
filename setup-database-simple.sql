-- =====================================================
-- Prima Facie - Simplified Database Setup (No Auth Schema Access)
-- Run this in Supabase SQL Editor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. LAW FIRMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS law_firms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    cnpj VARCHAR(18) UNIQUE,
    oab_number VARCHAR(50),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    website VARCHAR(255),
    
    -- Address
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_complement VARCHAR(100),
    address_neighborhood VARCHAR(100),
    address_city VARCHAR(100),
    address_state VARCHAR(2),
    address_zipcode VARCHAR(9),
    address_country VARCHAR(2) DEFAULT 'BR',
    
    -- Branding & Customization
    logo_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#0066CC',
    secondary_color VARCHAR(7) DEFAULT '#64748B',
    custom_domain VARCHAR(255),
    
    -- Subscription & Features
    plan_type VARCHAR(50) DEFAULT 'professional',
    features JSONB DEFAULT '{}',
    subscription_active BOOLEAN DEFAULT true,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_plan_type CHECK (plan_type IN ('trial', 'basic', 'professional', 'enterprise')),
    CONSTRAINT valid_state CHECK (address_state ~ '^[A-Z]{2}$'),
    CONSTRAINT valid_country CHECK (address_country ~ '^[A-Z]{2}$')
);

-- =====================================================
-- 2. USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE NOT NULL, -- References auth.users (managed by Supabase)
    law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
    
    -- Personal Information
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(255) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    
    -- Professional Information
    user_type VARCHAR(20) NOT NULL DEFAULT 'staff',
    position VARCHAR(100),
    oab_number VARCHAR(50),
    specializations TEXT[],
    
    -- Contact Information
    phone VARCHAR(20),
    mobile VARCHAR(20),
    avatar_url TEXT,
    
    -- Settings & Preferences
    language VARCHAR(5) DEFAULT 'pt-BR',
    timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
    notification_preferences JSONB DEFAULT '{"email": true, "push": true, "sms": false}',
    
    -- Status & Access
    status VARCHAR(20) DEFAULT 'active',
    last_login_at TIMESTAMP WITH TIME ZONE,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_user_type CHECK (user_type IN ('admin', 'lawyer', 'staff', 'client')),
    CONSTRAINT valid_status CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
    CONSTRAINT valid_language CHECK (language ~ '^[a-z]{2}-[A-Z]{2}$')
);

-- =====================================================
-- 3. INSERT DEFAULT LAW FIRM
-- =====================================================
INSERT INTO law_firms (
    id,
    name,
    legal_name,
    email,
    phone,
    plan_type,
    subscription_active,
    primary_color,
    secondary_color
) VALUES (
    '123e4567-e89b-12d3-a456-426614174000',
    'Dávila Reis Advocacia',
    'Dávila Reis Advocacia LTDA',
    'contato@davilareisadvocacia.com.br',
    '(11) 3456-7890',
    'professional',
    true,
    '#0066CC',
    '#64748B'
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    updated_at = now();

-- =====================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE law_firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. CREATE RLS POLICIES (Without Auth Schema Functions)
-- =====================================================

-- Law firms policies - Users can only access their own law firm
CREATE POLICY "law_firms_select_policy" ON law_firms
  FOR SELECT USING (
    id IN (
      SELECT law_firm_id 
      FROM users 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "law_firms_update_policy" ON law_firms
  FOR UPDATE USING (
    id IN (
      SELECT law_firm_id 
      FROM users 
      WHERE auth_user_id = auth.uid() 
      AND user_type = 'admin'
    )
  );

-- Users policies - Users can only access users in their law firm
CREATE POLICY "users_select_policy" ON users
  FOR SELECT USING (
    law_firm_id IN (
      SELECT law_firm_id 
      FROM users 
      WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "users_update_own_policy" ON users
  FOR UPDATE USING (auth_user_id = auth.uid());

CREATE POLICY "users_admin_all_policy" ON users
  FOR ALL USING (
    law_firm_id IN (
      SELECT law_firm_id 
      FROM users 
      WHERE auth_user_id = auth.uid() 
      AND user_type = 'admin'
    )
  );

-- Allow user registration (insert new users)
CREATE POLICY "users_insert_policy" ON users
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_law_firm_id ON users(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Law firms table indexes
CREATE INDEX IF NOT EXISTS idx_law_firms_email ON law_firms(email);
CREATE INDEX IF NOT EXISTS idx_law_firms_cnpj ON law_firms(cnpj);
CREATE INDEX IF NOT EXISTS idx_law_firms_plan_type ON law_firms(plan_type);

-- =====================================================
-- 7. CREATE UPDATE TRIGGERS
-- =====================================================

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_law_firms_updated_at ON law_firms;
CREATE TRIGGER update_law_firms_updated_at 
    BEFORE UPDATE ON law_firms 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. SUCCESS NOTIFICATION
-- =====================================================
SELECT 
    'Prima Facie database setup completed successfully!' as message,
    'Tables created: law_firms, users' as tables,
    'RLS policies applied' as security,
    'Default law firm: Dávila Reis Advocacia' as default_data;