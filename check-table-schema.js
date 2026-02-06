const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://cmgtjqycneerfdxmdmwp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtZ3RqcXljbmVlcmZkeG1kbXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MjM5MzcsImV4cCI6MjA2NTQ5OTkzN30.iYW8plD4fm80ljPUQPl3HU7yJtFKZehKkkEcGohz5OI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkTableSchema() {
    console.log('🔍 Checking Actual Table Schemas in Supabase');
    console.log('=' + '='.repeat(50));
    
    const tablesToCheck = ['invoices', 'invoice_line_items', 'time_entries', 'bills', 'vendors'];
    
    for (const tableName of tablesToCheck) {
        console.log(`\n📋 Checking ${tableName} table...`);
        console.log('-'.repeat(30));
        
        try {
            // Try to get a sample record to see the schema
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .limit(1);
            
            if (error) {
                console.log(`❌ Error accessing ${tableName}: ${error.message}`);
            } else {
                if (data && data.length > 0) {
                    console.log(`✅ ${tableName} columns:`, Object.keys(data[0]).join(', '));
                } else {
                    // Table exists but is empty, try to insert a minimal record to see required fields
                    console.log(`✅ ${tableName} exists but is empty`);
                    
                    if (tableName === 'invoices') {
                        // Try to create a minimal invoice to see what fields are actually required
                        const { data: insertData, error: insertError } = await supabase
                            .from('invoices')
                            .insert({
                                invoice_number: 'TEST-001',
                                total_amount: 100.00
                            })
                            .select()
                            .single();
                        
                        if (insertError) {
                            console.log(`ℹ️ Required fields error: ${insertError.message}`);
                        } else {
                            console.log(`✅ Sample invoice created:`, Object.keys(insertData).join(', '));
                            // Clean up
                            await supabase.from('invoices').delete().eq('id', insertData.id);
                        }
                    }
                }
            }
        } catch (error) {
            console.log(`❌ Exception checking ${tableName}: ${error.message}`);
        }
    }
    
    console.log('\n🔍 Checking if our migration functions exist...');
    try {
        const testLawFirmId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
        
        // Test the invoice number generation function
        const { data, error } = await supabase.rpc('generate_invoice_number', {
            p_law_firm_id: testLawFirmId,
            p_invoice_type: 'subscription'
        });
        
        if (error) {
            console.log(`❌ generate_invoice_number function: ${error.message}`);
        } else {
            console.log(`✅ generate_invoice_number function works: ${data}`);
        }
    } catch (error) {
        console.log(`❌ Function test exception: ${error.message}`);
    }
}

checkTableSchema().catch(console.error);