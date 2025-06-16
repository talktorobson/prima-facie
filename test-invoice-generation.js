const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://cmgtjqycneerfdxmdmwp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtZ3RqcXljbmVlcmZkeG1kbXdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MjM5MzcsImV4cCI6MjA2NTQ5OTkzN30.iYW8plD4fm80ljPUQPl3HU7yJtFKZehKkkEcGohz5OI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testInvoiceGeneration() {
    console.log('🧪 Testing Prima Facie Invoice Generation System');
    console.log('=' + '='.repeat(50));
    
    // Generate test UUIDs
    const testLawFirmId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'; // Sample UUID
    const testClientId = 'f47ac10b-58cc-4372-a567-0e02b2c3d480'; // Sample UUID
    
    console.log('\n📋 Test 1: Creating Sample Invoices');
    console.log('-'.repeat(40));
    
    const invoiceTypes = [
        { type: 'subscription', description: 'Monthly subscription invoice' },
        { type: 'case_billing', description: 'Case billing invoice' },
        { type: 'payment_plan', description: 'Payment plan installment' },
        { type: 'time_based', description: 'Time-based billing invoice' }
    ];
    
    const createdInvoices = [];
    
    for (const invoiceType of invoiceTypes) {
        console.log(`\n🔸 Creating ${invoiceType.type} invoice...`);
        
        try {
            const { data, error } = await supabase
                .from('invoices')
                .insert({
                    law_firm_id: testLawFirmId,
                    client_id: testClientId,
                    invoice_type: invoiceType.type,
                    subtotal: 1000.00,
                    tax_amount: 100.00,
                    total_amount: 1100.00,
                    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
                    description: invoiceType.description
                })
                .select('id, invoice_number, invoice_type, total_amount')
                .single();
            
            if (error) {
                console.log(`❌ Error creating ${invoiceType.type}: ${error.message}`);
            } else {
                console.log(`✅ Created: ${data.invoice_number} (${data.invoice_type}) - $${data.total_amount}`);
                createdInvoices.push(data);
            }
        } catch (error) {
            console.log(`❌ Exception creating ${invoiceType.type}: ${error.message}`);
        }
    }
    
    console.log('\n📋 Test 2: Verifying Invoice Number Patterns');
    console.log('-'.repeat(40));
    
    const currentYear = new Date().getFullYear();
    const expectedPatterns = {
        'subscription': `SUB-${currentYear}-`,
        'case_billing': `CASE-${currentYear}-`,
        'payment_plan': `PLAN-${currentYear}-`,
        'time_based': `TIME-${currentYear}-`
    };
    
    let patternTestsPassed = 0;
    let totalPatternTests = 0;
    
    for (const invoice of createdInvoices) {
        totalPatternTests++;
        const expectedPattern = expectedPatterns[invoice.invoice_type];
        
        if (invoice.invoice_number.startsWith(expectedPattern)) {
            console.log(`✅ Pattern match: ${invoice.invoice_number} (${invoice.invoice_type})`);
            patternTestsPassed++;
        } else {
            console.log(`❌ Pattern mismatch: ${invoice.invoice_number} (expected to start with ${expectedPattern})`);
        }
    }
    
    console.log('\n📋 Test 3: Testing Invoice Line Items');
    console.log('-'.repeat(40));
    
    if (createdInvoices.length > 0) {
        const testInvoice = createdInvoices[0];
        console.log(`\n🔸 Adding line items to invoice ${testInvoice.invoice_number}...`);
        
        const lineItems = [
            { description: 'Legal consultation', quantity: 2, unit_price: 300.00 },
            { description: 'Document review', quantity: 1, unit_price: 400.00 },
            { description: 'Court filing fee', quantity: 1, unit_price: 50.00 }
        ];
        
        let lineItemsCreated = 0;
        
        for (const item of lineItems) {
            try {
                const { data, error } = await supabase
                    .from('invoice_line_items')
                    .insert({
                        law_firm_id: testLawFirmId,
                        invoice_id: testInvoice.id,
                        line_type: 'service_fee',
                        description: item.description,
                        quantity: item.quantity,
                        unit_price: item.unit_price,
                        line_total: item.quantity * item.unit_price
                    })
                    .select('description, line_total')
                    .single();
                
                if (error) {
                    console.log(`❌ Error creating line item: ${error.message}`);
                } else {
                    console.log(`✅ Line item: ${data.description} - $${data.line_total}`);
                    lineItemsCreated++;
                }
            } catch (error) {
                console.log(`❌ Exception creating line item: ${error.message}`);
            }
        }
        
        console.log(`\n📊 Line items created: ${lineItemsCreated}/${lineItems.length}`);
    }
    
    console.log('\n📋 Test 4: Verifying Database Totals');
    console.log('-'.repeat(40));
    
    try {
        const { data: invoiceCount, error: countError } = await supabase
            .from('invoices')
            .select('id', { count: 'exact', head: true });
        
        if (countError) {
            console.log(`❌ Error counting invoices: ${countError.message}`);
        } else {
            console.log(`✅ Total invoices in database: ${invoiceCount.length || 0}`);
        }
        
        const { data: lineItemCount, error: lineError } = await supabase
            .from('invoice_line_items')
            .select('id', { count: 'exact', head: true });
        
        if (lineError) {
            console.log(`❌ Error counting line items: ${lineError.message}`);
        } else {
            console.log(`✅ Total line items in database: ${lineItemCount.length || 0}`);
        }
    } catch (error) {
        console.log(`❌ Exception in database totals: ${error.message}`);
    }
    
    console.log('\n🎯 TEST SUMMARY');
    console.log('=' + '='.repeat(30));
    console.log(`📊 Invoices created: ${createdInvoices.length}/${invoiceTypes.length}`);
    console.log(`📊 Pattern tests passed: ${patternTestsPassed}/${totalPatternTests}`);
    
    const overallSuccess = (createdInvoices.length === invoiceTypes.length) && (patternTestsPassed === totalPatternTests);
    
    if (overallSuccess) {
        console.log('🎉 All tests passed! Invoice generation system is working correctly.');
    } else {
        console.log('⚠️ Some tests failed. Manual verification may be needed.');
    }
    
    console.log('\n📋 Sample invoice numbers generated:');
    createdInvoices.forEach(invoice => {
        console.log(`   ${invoice.invoice_number} (${invoice.invoice_type})`);
    });
    
    return {
        success: overallSuccess,
        invoicesCreated: createdInvoices.length,
        patternTestsPassed: patternTestsPassed,
        createdInvoices: createdInvoices
    };
}

// Run the test
testInvoiceGeneration()
    .then(result => {
        console.log('\n✅ Invoice generation test completed');
        if (result.success) {
            console.log('🎉 Prima Facie Phase 8.7 invoice system is ready for production!');
        }
    })
    .catch(error => {
        console.error('❌ Test failed:', error.message);
    });