const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://cmgtjqycneerfdxmdmwp.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtZ3RqcXljbmVlcmZkeG1kbXdwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTkyMzkzNywiZXhwIjoyMDY1NDk5OTM3fQ.XYiMpO-3hf5GU8Cxr5X4wH9fPKJWcKtF7pNmLGq-3nA';

// Use service role for database operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function executeSQL(sqlContent, stepName) {
    console.log(`🔧 Executing ${stepName}...`);
    
    try {
        // Split SQL into individual statements
        const statements = sqlContent
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));
        
        for (const statement of statements) {
            if (statement.length > 0) {
                const { error } = await supabase.rpc('exec', { sql_query: statement + ';' });
                if (error) {
                    console.error(`❌ Error in ${stepName}:`, error.message);
                    // Continue with next statement for non-critical errors
                    if (!error.message.includes('already exists') && !error.message.includes('does not exist')) {
                        return false;
                    }
                }
            }
        }
        
        console.log(`✅ ${stepName} completed successfully`);
        return true;
    } catch (error) {
        console.error(`❌ Exception in ${stepName}:`, error.message);
        return false;
    }
}

async function runMigration() {
    console.log('🚀 Starting Prima Facie database migration...');
    console.log('=' + '='.repeat(50));
    
    const migrationSteps = [
        { file: './database/MIGRATION_STEP_1_BACKUP.sql', name: 'STEP 1: BACKUP & PREPARATION' },
        { file: './database/MIGRATION_STEP_2_TIME_TRACKING.sql', name: 'STEP 2: TIME TRACKING SCHEMA' },
        { file: './database/MIGRATION_STEP_3_INVOICES.sql', name: 'STEP 3: DUAL INVOICE SCHEMA' },
        { file: './database/MIGRATION_STEP_4_FINANCIAL.sql', name: 'STEP 4: FINANCIAL MANAGEMENT SCHEMA' }
    ];
    
    for (const step of migrationSteps) {
        console.log(`\n=== ${step.name} ===`);
        
        if (!fs.existsSync(step.file)) {
            console.error(`❌ Migration file not found: ${step.file}`);
            return;
        }
        
        const sqlContent = fs.readFileSync(step.file, 'utf8');
        const success = await executeSQL(sqlContent, step.name);
        
        if (!success) {
            console.error(`❌ Migration failed at ${step.name}`);
            return;
        }
        
        // Wait a moment between steps
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n🎉 ALL MIGRATION STEPS COMPLETED!');
    console.log('=' + '='.repeat(50));
    
    // Verify the migration
    console.log('\n🔍 Verifying migration results...');
    await verifyMigration();
}

async function verifyMigration() {
    const expectedTables = [
        // Time tracking tables
        'time_entries',
        'time_entry_templates', 
        'lawyer_billing_rates',
        'subscription_time_allocations',
        
        // Invoice tables
        'invoices',
        'invoice_line_items',
        'subscription_invoices',
        'case_invoices',
        'payment_plan_invoices',
        'time_based_invoices',
        'invoice_payments',
        'invoice_templates',
        'invoice_generation_logs',
        
        // Financial tables
        'vendors',
        'expense_categories',
        'bills',
        'bill_line_items',
        'payments',
        'payment_installments',
        'financial_alerts',
        'recurring_bill_templates',
        'budget_periods',
        'budget_allocations'
    ];
    
    let successCount = 0;
    let totalTables = expectedTables.length;
    
    for (const tableName of expectedTables) {
        try {
            const { data, error, count } = await supabase
                .from(tableName)
                .select('*', { count: 'exact', head: true });
                
            if (error) {
                console.log(`❌ ${tableName}: NOT FOUND`);
            } else {
                console.log(`✅ ${tableName}: EXISTS (${count || 0} rows)`);
                successCount++;
            }
        } catch (error) {
            console.log(`❌ ${tableName}: ERROR - ${error.message}`);
        }
    }
    
    const percentage = Math.round((successCount / totalTables) * 100);
    console.log(`\n📊 Migration Result: ${successCount}/${totalTables} tables created (${percentage}%)`);
    
    if (percentage === 100) {
        console.log('🎉 Perfect! All Phase 8.7 schemas are now deployed to Supabase!');
    } else if (percentage >= 80) {
        console.log('⚠️ Most tables created successfully, some issues may need attention');
    } else {
        console.log('❌ Significant issues detected, manual review required');
    }
}

// Run the migration
runMigration().catch(console.error);