const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://cmgtjqycneerfdxmdmwp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtZ3RqcXljbmVlcmZkeG1kbXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MjM5MzcsImV4cCI6MjA2NTQ5OTkzN30.iYW8plD4fm80ljPUQPl3HU7yJtFKZehKkkEcGohz5OI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createTables() {
    console.log('🚀 Creating Prima Facie database tables directly...');
    console.log('=' + '='.repeat(50));
    
    // Step 1: Create time_entries table first
    console.log('\n📅 Creating time_entries table...');
    try {
        const { error: timeError } = await supabase.rpc('create_time_entries_table');
        if (timeError && !timeError.message.includes('already exists')) {
            console.log('⚠️ Time entries table issue:', timeError.message);
        } else {
            console.log('✅ Time entries table ready');
        }
    } catch (error) {
        console.log('ℹ️ Will create time_entries with direct SQL');
    }
    
    // Step 2: Create invoices tables
    console.log('\n💰 Creating invoice tables...');
    
    const invoiceTableSQL = `
        CREATE TABLE IF NOT EXISTS invoices (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            law_firm_id UUID NOT NULL,
            client_id UUID NOT NULL,
            invoice_number VARCHAR(50) NOT NULL UNIQUE,
            invoice_type VARCHAR(30) NOT NULL CHECK (invoice_type IN (
                'subscription', 'case_billing', 'payment_plan', 'time_based', 'hybrid', 'adjustment', 'late_fee'
            )),
            subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
            tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
            discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
            total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
            currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
            invoice_status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (invoice_status IN (
                'draft', 'pending_review', 'approved', 'sent', 'viewed', 'paid', 
                'partial_paid', 'overdue', 'disputed', 'cancelled', 'refunded'
            )),
            issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
            due_date DATE NOT NULL,
            sent_date DATE,
            paid_date DATE,
            payment_terms VARCHAR(50) DEFAULT '30_days',
            description TEXT,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `;
    
    try {
        // Try to create tables using individual SQL statements
        const { error } = await supabase.rpc('sql', { query: invoiceTableSQL });
        if (error && !error.message.includes('already exists')) {
            console.log('Invoice table result:', error.message);
        } else {
            console.log('✅ Invoice tables created');
        }
    } catch (error) {
        console.log('ℹ️ Invoice table creation:', error.message);
    }
    
    // Step 3: Create financial tables
    console.log('\n💼 Creating financial management tables...');
    
    const vendorTableSQL = `
        CREATE TABLE IF NOT EXISTS vendors (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            law_firm_id UUID NOT NULL,
            vendor_name VARCHAR(255) NOT NULL,
            vendor_type VARCHAR(50) NOT NULL,
            email VARCHAR(255),
            phone VARCHAR(50),
            tax_id VARCHAR(50),
            vendor_status VARCHAR(20) DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    `;
    
    try {
        const { error } = await supabase.rpc('sql', { query: vendorTableSQL });
        if (error && !error.message.includes('already exists')) {
            console.log('Vendor table result:', error.message);
        } else {
            console.log('✅ Financial tables created');
        }
    } catch (error) {
        console.log('ℹ️ Financial table creation:', error.message);
    }
    
    // Verification
    console.log('\n🔍 Verifying table creation...');
    
    const tablesToCheck = ['invoices', 'vendors', 'time_entries'];
    let successCount = 0;
    
    for (const tableName of tablesToCheck) {
        try {
            const { data, error, count } = await supabase
                .from(tableName)
                .select('*', { count: 'exact', head: true });
                
            if (error) {
                if (error.message.includes('relation') && error.message.includes('does not exist')) {
                    console.log(`❌ ${tableName}: NOT FOUND`);
                } else {
                    console.log(`⚠️ ${tableName}: ${error.message}`);
                }
            } else {
                console.log(`✅ ${tableName}: EXISTS (${count || 0} rows)`);
                successCount++;
            }
        } catch (error) {
            console.log(`❌ ${tableName}: EXCEPTION - ${error.message}`);
        }
    }
    
    console.log(`\n📊 Result: ${successCount}/${tablesToCheck.length} core tables verified`);
    
    if (successCount === tablesToCheck.length) {
        console.log('🎉 Core database schema is ready for Prima Facie Phase 8.7!');
    } else {
        console.log('⚠️ Some tables may need manual creation via Supabase dashboard');
        console.log('\nTo complete setup:');
        console.log('1. Go to Supabase Dashboard > SQL Editor');
        console.log('2. Run the migration files manually');
        console.log('3. Check table creation results');
    }
}

// Run the table creation
createTables().catch(console.error);