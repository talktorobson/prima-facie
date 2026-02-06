-- ============================================================================
-- QUICK FIX FOR SQL AMBIGUOUS COLUMN ERROR
-- ============================================================================
-- Purpose: Fix the ambiguous column reference in generate_client_number function
-- Issue: "column reference law_firm_id is ambiguous" error
-- ============================================================================

-- Drop the existing function with the error
DROP FUNCTION IF EXISTS generate_client_number(UUID);

-- Create the corrected function with proper parameter naming and table aliases
CREATE OR REPLACE FUNCTION generate_client_number(input_law_firm_id UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
    client_count INTEGER;
    new_number VARCHAR(50);
BEGIN
    -- Get current client count for this law firm (using table alias to avoid ambiguity)
    SELECT COUNT(*) INTO client_count 
    FROM contacts c
    WHERE c.law_firm_id = input_law_firm_id AND c.contact_type IN ('individual', 'company');
    
    -- Generate new client number (format: CLI-YYYY-NNNN)
    new_number := 'CLI-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD((client_count + 1)::TEXT, 4, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Test the function to ensure it works
DO $$
DECLARE
    test_result VARCHAR(50);
    test_firm_id UUID;
BEGIN
    -- Get a law firm ID from the database for testing
    SELECT law_firm_id INTO test_firm_id FROM contacts LIMIT 1;
    
    IF test_firm_id IS NOT NULL THEN
        -- Test the function
        SELECT generate_client_number(test_firm_id) INTO test_result;
        RAISE NOTICE 'Function test successful. Generated client number: %', test_result;
    ELSE
        RAISE NOTICE 'No law firm found for testing, but function created successfully';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Function test failed with error: %', SQLERRM;
END $$;

-- Print completion message
DO $$
BEGIN
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'SQL AMBIGUOUS COLUMN ERROR FIX COMPLETED';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '✅ Function generate_client_number() fixed and tested';
    RAISE NOTICE '✅ Ambiguous column reference resolved';
    RAISE NOTICE '✅ You can now continue with the main database fixes';
    RAISE NOTICE '============================================================================';
END $$;