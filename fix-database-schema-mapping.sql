-- ============================================================================
-- PRIMA FACIE - CRITICAL DATABASE SCHEMA FIXES
-- ============================================================================
-- Purpose: Fix field mapping mismatches between frontend forms and database schema
-- Issue: Form submissions failing due to Portuguese frontend vs English database
-- Priority: CRITICAL - Must be executed before production deployment
-- Estimated Time: 15-30 minutes to execute
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SECTION 1: FIX CONTACTS TABLE (Client Management)
-- ============================================================================

-- Add missing columns that frontend forms expect
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS client_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS portal_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS legal_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS trade_name VARCHAR(255);

-- Create function to generate client numbers automatically
CREATE OR REPLACE FUNCTION generate_client_number(input_law_firm_id UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
    client_count INTEGER;
    new_number VARCHAR(50);
BEGIN
    -- Get current client count for this law firm
    SELECT COUNT(*) INTO client_count 
    FROM contacts c
    WHERE c.law_firm_id = input_law_firm_id AND c.contact_type IN ('individual', 'company');
    
    -- Generate new client number (format: CLI-YYYY-NNNN)
    new_number := 'CLI-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD((client_count + 1)::TEXT, 4, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Update existing contacts to have client numbers
UPDATE contacts 
SET client_number = generate_client_number(contacts.law_firm_id)
WHERE client_number IS NULL AND contact_type IN ('individual', 'company');

-- ============================================================================
-- SECTION 2: FIX MATTERS TABLE (Legal Cases)
-- ============================================================================

-- Add missing columns that frontend forms expect
ALTER TABLE matters 
ADD COLUMN IF NOT EXISTS area_juridica VARCHAR(100),
ADD COLUMN IF NOT EXISTS case_value DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS probability_success DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS next_action TEXT;

-- ============================================================================
-- SECTION 3: CREATE FIELD MAPPING FUNCTIONS
-- ============================================================================

-- Function to map Portuguese client status to English
CREATE OR REPLACE FUNCTION map_client_status(portuguese_status TEXT)
RETURNS TEXT AS $$
BEGIN
    CASE portuguese_status
        WHEN 'ativo' THEN RETURN 'active';
        WHEN 'inativo' THEN RETURN 'inactive';
        WHEN 'prospecto' THEN RETURN 'prospect';
        ELSE RETURN 'prospect'; -- Default fallback
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to map Portuguese contact type to English
CREATE OR REPLACE FUNCTION map_contact_type(portuguese_type TEXT)
RETURNS TEXT AS $$
BEGIN
    CASE portuguese_type
        WHEN 'pessoa_fisica' THEN RETURN 'individual';
        WHEN 'pessoa_juridica' THEN RETURN 'company';
        ELSE RETURN 'individual'; -- Default fallback
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to map Portuguese matter status to English
CREATE OR REPLACE FUNCTION map_matter_status(portuguese_status TEXT)
RETURNS TEXT AS $$
BEGIN
    CASE portuguese_status
        WHEN 'novo' THEN RETURN 'active';
        WHEN 'analise' THEN RETURN 'on_hold';
        WHEN 'ativo' THEN RETURN 'active';
        WHEN 'suspenso' THEN RETURN 'on_hold';
        WHEN 'aguardando_cliente' THEN RETURN 'on_hold';
        WHEN 'aguardando_documentos' THEN RETURN 'on_hold';
        WHEN 'finalizado' THEN RETURN 'closed';
        ELSE RETURN 'active'; -- Default fallback
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to map Portuguese matter priority to English
CREATE OR REPLACE FUNCTION map_matter_priority(portuguese_priority TEXT)
RETURNS TEXT AS $$
BEGIN
    CASE portuguese_priority
        WHEN 'baixa' THEN RETURN 'low';
        WHEN 'media' THEN RETURN 'medium';
        WHEN 'alta' THEN RETURN 'high';
        WHEN 'urgente' THEN RETURN 'urgent';
        ELSE RETURN 'medium'; -- Default fallback
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 4: UPDATE EXISTING DATA TO USE CORRECT MAPPINGS
-- ============================================================================

-- Update existing contacts with incorrect Portuguese values
UPDATE contacts 
SET 
    contact_type = map_contact_type(contact_type),
    client_status = map_client_status(client_status)
WHERE contact_type IN ('pessoa_fisica', 'pessoa_juridica') 
   OR client_status IN ('ativo', 'inativo', 'prospecto');

-- Update existing matters with incorrect Portuguese values  
UPDATE matters 
SET 
    status = map_matter_status(status),
    priority = map_matter_priority(priority)
WHERE status IN ('novo', 'analise', 'ativo', 'suspenso', 'aguardando_cliente', 'aguardando_documentos', 'finalizado')
   OR priority IN ('baixa', 'media', 'alta', 'urgente');

-- ============================================================================
-- SECTION 5: CREATE CONSTRAINTS AND VALIDATION
-- ============================================================================

-- Add constraints to ensure only valid enum values are used
ALTER TABLE contacts 
DROP CONSTRAINT IF EXISTS contacts_contact_type_check,
ADD CONSTRAINT contacts_contact_type_check 
CHECK (contact_type IN ('individual', 'company', 'lead', 'vendor', 'court'));

ALTER TABLE contacts 
DROP CONSTRAINT IF EXISTS contacts_client_status_check,
ADD CONSTRAINT contacts_client_status_check 
CHECK (client_status IN ('prospect', 'active', 'inactive', 'former'));

ALTER TABLE matters 
DROP CONSTRAINT IF EXISTS matters_status_check,
ADD CONSTRAINT matters_status_check 
CHECK (status IN ('active', 'closed', 'on_hold', 'settled', 'dismissed'));

ALTER TABLE matters 
DROP CONSTRAINT IF EXISTS matters_priority_check,
ADD CONSTRAINT matters_priority_check 
CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- ============================================================================
-- SECTION 6: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index on client_number for quick lookups
CREATE INDEX IF NOT EXISTS idx_contacts_client_number ON contacts(client_number);

-- Index on contact_type and client_status for filtering
CREATE INDEX IF NOT EXISTS idx_contacts_type_status ON contacts(contact_type, client_status);

-- Index on area_juridica for legal area filtering
CREATE INDEX IF NOT EXISTS idx_matters_area_juridica ON matters(area_juridica);

-- ============================================================================
-- SECTION 7: CREATE HELPER VIEWS FOR FRONTEND
-- ============================================================================

-- View that provides Portuguese labels for frontend display
CREATE OR REPLACE VIEW contacts_with_portuguese_labels AS
SELECT 
    c.*,
    CASE c.contact_type
        WHEN 'individual' THEN 'Pessoa Física'
        WHEN 'company' THEN 'Pessoa Jurídica'
        WHEN 'lead' THEN 'Lead'
        WHEN 'vendor' THEN 'Fornecedor'
        WHEN 'court' THEN 'Tribunal'
        ELSE c.contact_type
    END as tipo_portugues,
    CASE c.client_status
        WHEN 'prospect' THEN 'Prospecto'
        WHEN 'active' THEN 'Ativo'
        WHEN 'inactive' THEN 'Inativo'
        WHEN 'former' THEN 'Ex-cliente'
        ELSE c.client_status
    END as status_portugues
FROM contacts c;

-- View that provides Portuguese labels for matters
CREATE OR REPLACE VIEW matters_with_portuguese_labels AS
SELECT 
    m.*,
    CASE m.status
        WHEN 'active' THEN 'Ativo'
        WHEN 'closed' THEN 'Finalizado'
        WHEN 'on_hold' THEN 'Suspenso'
        WHEN 'settled' THEN 'Acordo'
        WHEN 'dismissed' THEN 'Arquivado'
        ELSE m.status
    END as status_portugues,
    CASE m.priority
        WHEN 'low' THEN 'Baixa'
        WHEN 'medium' THEN 'Média'
        WHEN 'high' THEN 'Alta'
        WHEN 'urgent' THEN 'Urgente'
        ELSE m.priority
    END as prioridade_portugues
FROM matters m;

-- ============================================================================
-- SECTION 8: VERIFICATION QUERIES
-- ============================================================================

-- Query to verify contacts table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'contacts' 
ORDER BY ordinal_position;

-- Query to verify matters table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'matters' 
ORDER BY ordinal_position;

-- Query to check existing data integrity
SELECT 
    'contacts' as table_name,
    contact_type,
    client_status,
    COUNT(*) as count
FROM contacts 
GROUP BY contact_type, client_status
UNION ALL
SELECT 
    'matters' as table_name,
    status as contact_type,
    priority as client_status,
    COUNT(*) as count
FROM matters 
GROUP BY status, priority
ORDER BY table_name, contact_type;

-- ============================================================================
-- SECTION 9: ROLLBACK SCRIPT (COMMENTED OUT - UNCOMMENT IF NEEDED)
-- ============================================================================

/*
-- ROLLBACK SCRIPT - UNCOMMENT AND RUN IF YOU NEED TO UNDO CHANGES

-- Remove added columns
ALTER TABLE contacts 
DROP COLUMN IF EXISTS client_number,
DROP COLUMN IF EXISTS portal_enabled,
DROP COLUMN IF EXISTS legal_name,
DROP COLUMN IF EXISTS trade_name;

ALTER TABLE matters 
DROP COLUMN IF EXISTS area_juridica,
DROP COLUMN IF EXISTS case_value,
DROP COLUMN IF EXISTS probability_success,
DROP COLUMN IF EXISTS next_action;

-- Drop functions
DROP FUNCTION IF EXISTS generate_client_number(UUID);
DROP FUNCTION IF EXISTS map_client_status(TEXT);
DROP FUNCTION IF EXISTS map_contact_type(TEXT);
DROP FUNCTION IF EXISTS map_matter_status(TEXT);
DROP FUNCTION IF EXISTS map_matter_priority(TEXT);

-- Drop views
DROP VIEW IF EXISTS contacts_with_portuguese_labels;
DROP VIEW IF EXISTS matters_with_portuguese_labels;

-- Drop indexes
DROP INDEX IF EXISTS idx_contacts_client_number;
DROP INDEX IF EXISTS idx_contacts_type_status;
DROP INDEX IF EXISTS idx_matters_area_juridica;
*/

-- ============================================================================
-- EXECUTION COMPLETE
-- ============================================================================

-- Print completion message
DO $$
BEGIN
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'PRIMA FACIE DATABASE SCHEMA FIXES COMPLETED SUCCESSFULLY';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'Changes Applied:';
    RAISE NOTICE '✅ Added missing columns to contacts and matters tables';
    RAISE NOTICE '✅ Created field mapping functions for Portuguese/English conversion';
    RAISE NOTICE '✅ Updated existing data to use correct enum values';
    RAISE NOTICE '✅ Added database constraints for data integrity';
    RAISE NOTICE '✅ Created performance indexes';
    RAISE NOTICE '✅ Created Portuguese label views for frontend';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Update client service to use correct field mappings';
    RAISE NOTICE '2. Update matter service to use correct field mappings';
    RAISE NOTICE '3. Test form submissions to verify fixes';
    RAISE NOTICE '============================================================================';
END $$;