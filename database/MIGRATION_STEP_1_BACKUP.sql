-- =============================================
-- STEP 1: DATABASE BACKUP AND PREPARATION
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create backup tables for existing data
DO $$
BEGIN
    -- Backup existing invoices table if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'invoices') THEN
        EXECUTE 'CREATE TABLE invoices_backup_' || to_char(now(), 'YYYYMMDD_HH24MI') || ' AS SELECT * FROM invoices';
        RAISE NOTICE 'Created backup of invoices table';
    END IF;
    
    -- Backup existing time_entries table if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'time_entries') THEN
        EXECUTE 'CREATE TABLE time_entries_backup_' || to_char(now(), 'YYYYMMDD_HH24MI') || ' AS SELECT * FROM time_entries';
        RAISE NOTICE 'Created backup of time_entries table';
    END IF;
    
    -- Backup existing financial tables
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'bills') THEN
        EXECUTE 'CREATE TABLE bills_backup_' || to_char(now(), 'YYYYMMDD_HH24MI') || ' AS SELECT * FROM bills';
        RAISE NOTICE 'Created backup of bills table';
    END IF;
    
    -- Backup existing vendors table if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'suppliers') THEN
        EXECUTE 'CREATE TABLE suppliers_backup_' || to_char(now(), 'YYYYMMDD_HH24MI') || ' AS SELECT * FROM suppliers';
        RAISE NOTICE 'Created backup of suppliers table';
    END IF;
END $$;

-- Check current table status
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name NOT LIKE '%backup%'
ORDER BY table_name;