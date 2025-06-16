-- =============================================
-- DATABASE TEST HELPER FUNCTIONS
-- Functions to support database testing
-- =============================================

-- Function to execute arbitrary SQL (for testing purposes only)
CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT, parameters TEXT[] DEFAULT '{}')
RETURNS TEXT AS $$
DECLARE
    result TEXT;
BEGIN
    -- This is a security risk in production - only for testing!
    -- Should be restricted to test environments only
    EXECUTE sql_query;
    RETURN 'SQL executed successfully';
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Function to check if table exists
CREATE OR REPLACE FUNCTION check_table_exists(table_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get table schema information
CREATE OR REPLACE FUNCTION get_table_schema(table_name TEXT)
RETURNS TABLE (
    column_name TEXT,
    data_type TEXT,
    is_nullable TEXT,
    column_default TEXT,
    character_maximum_length INTEGER,
    numeric_precision INTEGER,
    numeric_scale INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.column_name::TEXT,
        c.data_type::TEXT,
        c.is_nullable::TEXT,
        c.column_default::TEXT,
        c.character_maximum_length,
        c.numeric_precision,
        c.numeric_scale
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
        AND c.table_name = $1
    ORDER BY c.ordinal_position;
END;
$$ LANGUAGE plpgsql;

-- Function to get table constraints
CREATE OR REPLACE FUNCTION get_table_constraints(table_name TEXT)
RETURNS TABLE (
    constraint_name TEXT,
    constraint_type TEXT,
    column_name TEXT,
    foreign_table_name TEXT,
    foreign_column_name TEXT,
    check_clause TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tc.constraint_name::TEXT,
        tc.constraint_type::TEXT,
        kcu.column_name::TEXT,
        ccu.table_name::TEXT as foreign_table_name,
        ccu.column_name::TEXT as foreign_column_name,
        cc.check_clause::TEXT
    FROM information_schema.table_constraints tc
    LEFT JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    LEFT JOIN information_schema.constraint_column_usage ccu 
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
    LEFT JOIN information_schema.check_constraints cc
        ON cc.constraint_name = tc.constraint_name
        AND cc.constraint_schema = tc.table_schema
    WHERE tc.table_schema = 'public'
        AND tc.table_name = $1
    ORDER BY tc.constraint_type, tc.constraint_name;
END;
$$ LANGUAGE plpgsql;

-- Function to get table indexes
CREATE OR REPLACE FUNCTION get_table_indexes(table_name TEXT)
RETURNS TABLE (
    index_name TEXT,
    column_name TEXT,
    is_unique BOOLEAN,
    is_primary BOOLEAN,
    index_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.relname::TEXT as index_name,
        a.attname::TEXT as column_name,
        idx.indisunique as is_unique,
        idx.indisprimary as is_primary,
        am.amname::TEXT as index_type
    FROM pg_class t
    JOIN pg_index idx ON t.oid = idx.indrelid
    JOIN pg_class i ON i.oid = idx.indexrelid
    JOIN pg_am am ON i.relam = am.oid
    JOIN pg_attribute a ON a.attrelid = t.oid
        AND a.attnum = ANY(idx.indkey)
    WHERE t.relname = $1
        AND t.relkind = 'r'
    ORDER BY i.relname, a.attnum;
END;
$$ LANGUAGE plpgsql;

-- Function to get table row count
CREATE OR REPLACE FUNCTION get_table_row_count(table_name TEXT)
RETURNS BIGINT AS $$
DECLARE
    row_count BIGINT;
BEGIN
    EXECUTE format('SELECT COUNT(*) FROM %I', table_name) INTO row_count;
    RETURN row_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get foreign key violations
CREATE OR REPLACE FUNCTION check_foreign_key_violations(table_name TEXT)
RETURNS TABLE (
    constraint_name TEXT,
    violation_count BIGINT,
    sample_violating_ids TEXT[]
) AS $$
DECLARE
    fk_record RECORD;
    violation_query TEXT;
    sample_ids TEXT[];
    violation_count BIGINT;
BEGIN
    -- Get all foreign key constraints for the table
    FOR fk_record IN
        SELECT 
            tc.constraint_name,
            kcu.column_name,
            ccu.table_name as foreign_table_name,
            ccu.column_name as foreign_column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu 
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.table_schema = 'public'
            AND tc.table_name = table_name
            AND tc.constraint_type = 'FOREIGN KEY'
    LOOP
        -- Build query to find violations
        violation_query := format(
            'SELECT COUNT(*), ARRAY_AGG(DISTINCT %I::TEXT) 
             FROM %I 
             WHERE %I IS NOT NULL 
             AND %I NOT IN (SELECT %I FROM %I WHERE %I IS NOT NULL)',
            fk_record.column_name,
            table_name,
            fk_record.column_name,
            fk_record.column_name,
            fk_record.foreign_column_name,
            fk_record.foreign_table_name,
            fk_record.foreign_column_name
        );
        
        EXECUTE violation_query INTO violation_count, sample_ids;
        
        IF violation_count > 0 THEN
            constraint_name := fk_record.constraint_name;
            RETURN NEXT;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to validate CNPJ format
CREATE OR REPLACE FUNCTION validate_cnpj(cnpj_value TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    cnpj TEXT;
    weights1 INTEGER[] := ARRAY[5,4,3,2,9,8,7,6,5,4,3,2];
    weights2 INTEGER[] := ARRAY[6,5,4,3,2,9,8,7,6,5,4,3,2];
    sum1 INTEGER := 0;
    sum2 INTEGER := 0;
    digit1 INTEGER;
    digit2 INTEGER;
    i INTEGER;
BEGIN
    -- Remove non-numeric characters
    cnpj := regexp_replace(cnpj_value, '[^0-9]', '', 'g');
    
    -- Check length
    IF length(cnpj) != 14 THEN
        RETURN FALSE;
    END IF;
    
    -- Check for known invalid patterns
    IF cnpj ~ '^(\d)\1{13}$' THEN
        RETURN FALSE;
    END IF;
    
    -- Calculate first check digit
    FOR i IN 1..12 LOOP
        sum1 := sum1 + (substring(cnpj, i, 1)::INTEGER * weights1[i]);
    END LOOP;
    
    digit1 := CASE WHEN sum1 % 11 < 2 THEN 0 ELSE 11 - (sum1 % 11) END;
    
    -- Check first digit
    IF digit1 != substring(cnpj, 13, 1)::INTEGER THEN
        RETURN FALSE;
    END IF;
    
    -- Calculate second check digit
    FOR i IN 1..13 LOOP
        sum2 := sum2 + (substring(cnpj, i, 1)::INTEGER * weights2[i]);
    END LOOP;
    
    digit2 := CASE WHEN sum2 % 11 < 2 THEN 0 ELSE 11 - (sum2 % 11) END;
    
    -- Check second digit
    RETURN digit2 = substring(cnpj, 14, 1)::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Function to validate CPF format
CREATE OR REPLACE FUNCTION validate_cpf(cpf_value TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    cpf TEXT;
    sum1 INTEGER := 0;
    sum2 INTEGER := 0;
    digit1 INTEGER;
    digit2 INTEGER;
    i INTEGER;
BEGIN
    -- Remove non-numeric characters
    cpf := regexp_replace(cpf_value, '[^0-9]', '', 'g');
    
    -- Check length
    IF length(cpf) != 11 THEN
        RETURN FALSE;
    END IF;
    
    -- Check for known invalid patterns
    IF cpf ~ '^(\d)\1{10}$' THEN
        RETURN FALSE;
    END IF;
    
    -- Calculate first check digit
    FOR i IN 1..9 LOOP
        sum1 := sum1 + (substring(cpf, i, 1)::INTEGER * (11 - i));
    END LOOP;
    
    digit1 := CASE WHEN sum1 % 11 < 2 THEN 0 ELSE 11 - (sum1 % 11) END;
    
    -- Check first digit
    IF digit1 != substring(cpf, 10, 1)::INTEGER THEN
        RETURN FALSE;
    END IF;
    
    -- Calculate second check digit
    FOR i IN 1..10 LOOP
        sum2 := sum2 + (substring(cpf, i, 1)::INTEGER * (12 - i));
    END LOOP;
    
    digit2 := CASE WHEN sum2 % 11 < 2 THEN 0 ELSE 11 - (sum2 % 11) END;
    
    -- Check second digit
    RETURN digit2 = substring(cpf, 11, 1)::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Function to get query execution plan
CREATE OR REPLACE FUNCTION get_query_plan(query_text TEXT)
RETURNS TABLE (query_plan TEXT) AS $$
BEGIN
    RETURN QUERY EXECUTE 'EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ' || query_text;
END;
$$ LANGUAGE plpgsql;

-- Function to analyze table statistics
CREATE OR REPLACE FUNCTION analyze_table_stats(table_name TEXT)
RETURNS TABLE (
    stat_name TEXT,
    stat_value TEXT
) AS $$
BEGIN
    -- Update table statistics
    EXECUTE format('ANALYZE %I', table_name);
    
    RETURN QUERY
    SELECT 
        'row_count'::TEXT,
        n_tup_ins::TEXT
    FROM pg_stat_user_tables 
    WHERE relname = table_name
    
    UNION ALL
    
    SELECT 
        'table_size'::TEXT,
        pg_size_pretty(pg_total_relation_size(table_name))::TEXT
    
    UNION ALL
    
    SELECT 
        'index_size'::TEXT,
        pg_size_pretty(pg_indexes_size(table_name))::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to check index usage
CREATE OR REPLACE FUNCTION check_index_usage(table_name TEXT)
RETURNS TABLE (
    index_name TEXT,
    scans BIGINT,
    tuples_read BIGINT,
    tuples_fetched BIGINT,
    usage_ratio NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        indexrelname::TEXT,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch,
        CASE 
            WHEN idx_tup_read > 0 
            THEN ROUND((idx_tup_fetch::NUMERIC / idx_tup_read::NUMERIC) * 100, 2)
            ELSE 0
        END as usage_ratio
    FROM pg_stat_user_indexes
    WHERE relname = table_name
    ORDER BY idx_scan DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to create test schema
CREATE OR REPLACE FUNCTION create_test_schema()
RETURNS TEXT AS $$
BEGIN
    -- Create test schema if it doesn't exist
    CREATE SCHEMA IF NOT EXISTS test_schema;
    
    -- Set search path to include test schema
    SET search_path TO test_schema, public;
    
    RETURN 'Test schema created successfully';
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup test data
CREATE OR REPLACE FUNCTION cleanup_test_data(law_firm_test_id UUID)
RETURNS TEXT AS $$
DECLARE
    cleanup_count INTEGER := 0;
BEGIN
    -- Delete in dependency order
    DELETE FROM invoice_payments WHERE law_firm_id = law_firm_test_id;
    GET DIAGNOSTICS cleanup_count = ROW_COUNT;
    
    DELETE FROM invoice_line_items WHERE law_firm_id = law_firm_test_id;
    GET DIAGNOSTICS cleanup_count = cleanup_count + ROW_COUNT;
    
    DELETE FROM subscription_invoices WHERE law_firm_id = law_firm_test_id;
    GET DIAGNOSTICS cleanup_count = cleanup_count + ROW_COUNT;
    
    DELETE FROM case_invoices WHERE law_firm_id = law_firm_test_id;
    GET DIAGNOSTICS cleanup_count = cleanup_count + ROW_COUNT;
    
    DELETE FROM payment_plan_invoices WHERE law_firm_id = law_firm_test_id;
    GET DIAGNOSTICS cleanup_count = cleanup_count + ROW_COUNT;
    
    DELETE FROM time_based_invoices WHERE law_firm_id = law_firm_test_id;
    GET DIAGNOSTICS cleanup_count = cleanup_count + ROW_COUNT;
    
    DELETE FROM invoices WHERE law_firm_id = law_firm_test_id;
    GET DIAGNOSTICS cleanup_count = cleanup_count + ROW_COUNT;
    
    DELETE FROM bill_payments WHERE law_firm_id = law_firm_test_id;
    GET DIAGNOSTICS cleanup_count = cleanup_count + ROW_COUNT;
    
    DELETE FROM bills WHERE law_firm_id = law_firm_test_id;
    GET DIAGNOSTICS cleanup_count = cleanup_count + ROW_COUNT;
    
    DELETE FROM payment_collections WHERE law_firm_id = law_firm_test_id;
    GET DIAGNOSTICS cleanup_count = cleanup_count + ROW_COUNT;
    
    DELETE FROM payment_reminders WHERE law_firm_id = law_firm_test_id;
    GET DIAGNOSTICS cleanup_count = cleanup_count + ROW_COUNT;
    
    DELETE FROM financial_documents WHERE law_firm_id = law_firm_test_id;
    GET DIAGNOSTICS cleanup_count = cleanup_count + ROW_COUNT;
    
    DELETE FROM financial_alerts WHERE law_firm_id = law_firm_test_id;
    GET DIAGNOSTICS cleanup_count = cleanup_count + ROW_COUNT;
    
    DELETE FROM time_entry_allocations te_alloc 
    USING time_entries te 
    WHERE te_alloc.time_entry_id = te.id AND te.law_firm_id = law_firm_test_id;
    GET DIAGNOSTICS cleanup_count = cleanup_count + ROW_COUNT;
    
    DELETE FROM time_entries WHERE law_firm_id = law_firm_test_id;
    GET DIAGNOSTICS cleanup_count = cleanup_count + ROW_COUNT;
    
    DELETE FROM time_entry_templates WHERE law_firm_id = law_firm_test_id;
    GET DIAGNOSTICS cleanup_count = cleanup_count + ROW_COUNT;
    
    DELETE FROM lawyer_billing_rates WHERE law_firm_id = law_firm_test_id;
    GET DIAGNOSTICS cleanup_count = cleanup_count + ROW_COUNT;
    
    DELETE FROM subscription_time_allocations WHERE law_firm_id = law_firm_test_id;
    GET DIAGNOSTICS cleanup_count = cleanup_count + ROW_COUNT;
    
    DELETE FROM daily_time_summaries WHERE law_firm_id = law_firm_test_id;
    GET DIAGNOSTICS cleanup_count = cleanup_count + ROW_COUNT;
    
    DELETE FROM expense_categories WHERE law_firm_id = law_firm_test_id;
    GET DIAGNOSTICS cleanup_count = cleanup_count + ROW_COUNT;
    
    DELETE FROM vendors WHERE law_firm_id = law_firm_test_id;
    GET DIAGNOSTICS cleanup_count = cleanup_count + ROW_COUNT;
    
    -- Note: Users and clients cleanup should be handled separately
    -- as they might have additional dependencies
    
    RETURN format('Cleaned up %s test records', cleanup_count);
END;
$$ LANGUAGE plpgsql;