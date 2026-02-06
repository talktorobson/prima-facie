#!/usr/bin/env node

// Verify seed data has been applied successfully
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function verifySeedData() {
  try {
    console.log('🔍 Verifying Prima Facie seed data application...');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('✅ Connected to Supabase\\n');
    
    // Define expected data counts
    const expectedData = [
      { table: 'law_firms', expected: 2, description: 'Law firms' },
      { table: 'users', expected: 6, description: 'System users' },
      { table: 'contacts', expected: 8, description: 'Clients (individuals & companies)' },
      { table: 'matter_types', expected: 8, description: 'Legal matter types' },
      { table: 'matters', expected: 8, description: 'Active legal cases' },
      { table: 'matter_contacts', expected: 8, description: 'Client-matter relationships' },
      { table: 'tasks', expected: 6, description: 'Tasks with due dates' },
      { table: 'time_entries', expected: 18, description: 'Billable time entries' },
      { table: 'invoices', expected: 7, description: 'Client invoices' },
      { table: 'invoice_line_items', expected: 10, description: 'Invoice line items' },
      { table: 'messages', expected: 7, description: 'Chat messages' },
      { table: 'pipeline_stages', expected: 7, description: 'Sales pipeline stages' },
      { table: 'pipeline_cards', expected: 4, description: 'Sales opportunities' },
      { table: 'activity_logs', expected: 7, description: 'System activity logs' }
    ];
    
    // Optional tables (may not exist if billing system not deployed)
    const optionalData = [
      { table: 'documents', expected: 7, description: 'Legal documents' },
      { table: 'vendors', expected: 7, description: 'Service providers' },
      { table: 'bills', expected: 9, description: 'Vendor bills' },
      { table: 'subscription_plans', expected: 6, description: 'Subscription plans' },
      { table: 'case_types', expected: 8, description: 'Case billing types' },
      { table: 'client_subscriptions', expected: 4, description: 'Active subscriptions' },
      { table: 'discount_rules', expected: 4, description: 'Discount rules' }
    ];
    
    console.log('📊 CORE DATA VERIFICATION');
    console.log('='.repeat(50));
    
    let totalVerified = 0;
    let totalExpected = 0;
    
    for (const item of expectedData) {
      totalExpected++;
      
      try {
        const { data, error, count } = await supabase
          .from(item.table)
          .select('*', { count: 'exact' });
          
        if (error) {
          console.log(`❌ ${item.table.padEnd(20)} - Error: ${error.message}`);
          continue;
        }
        
        const actualCount = count || data?.length || 0;
        const status = actualCount >= item.expected ? '✅' : '⚠️';
        const statusText = actualCount >= item.expected ? 'OK' : 'LOW';
        
        console.log(`${status} ${item.table.padEnd(20)} ${actualCount.toString().padStart(3)}/${item.expected.toString().padStart(3)} ${statusText.padEnd(5)} ${item.description}`);
        
        if (actualCount >= item.expected) {
          totalVerified++;
        }
        
      } catch (e) {
        console.log(`❌ ${item.table.padEnd(20)} - Table missing or inaccessible`);
      }
    }
    
    console.log('\\n📋 OPTIONAL DATA VERIFICATION');
    console.log('='.repeat(50));
    
    let optionalVerified = 0;
    let optionalTotal = 0;
    
    for (const item of optionalData) {
      optionalTotal++;
      
      try {
        const { data, error, count } = await supabase
          .from(item.table)
          .select('*', { count: 'exact' });
          
        if (error) {
          console.log(`⚪ ${item.table.padEnd(20)} - Table not available (${error.message.substring(0, 30)}...)`);
          continue;
        }
        
        const actualCount = count || data?.length || 0;
        const status = actualCount >= item.expected ? '✅' : '⚠️';
        const statusText = actualCount >= item.expected ? 'OK' : 'LOW';
        
        console.log(`${status} ${item.table.padEnd(20)} ${actualCount.toString().padStart(3)}/${item.expected.toString().padStart(3)} ${statusText.padEnd(5)} ${item.description}`);
        
        if (actualCount >= item.expected) {
          optionalVerified++;
        }
        
      } catch (e) {
        console.log(`⚪ ${item.table.padEnd(20)} - Table not created yet`);
      }
    }
    
    // Summary and sample data preview
    console.log('\\n📈 VERIFICATION SUMMARY');
    console.log('='.repeat(50));
    
    const corePercentage = Math.round((totalVerified / totalExpected) * 100);
    const optionalPercentage = optionalTotal > 0 ? Math.round((optionalVerified / optionalTotal) * 100) : 0;
    
    console.log(`📊 Core Data: ${totalVerified}/${totalExpected} tables (${corePercentage}%)`);
    console.log(`📋 Optional Data: ${optionalVerified}/${optionalTotal} tables (${optionalPercentage}%)`);
    
    if (corePercentage >= 80) {
      console.log('\\n🎉 SEED DATA SUCCESSFULLY APPLIED!');
      console.log('✅ Database is enriched with realistic test data');
      console.log('✅ Ready for comprehensive user experience testing');
      
      // Show sample data preview
      console.log('\\n👥 SAMPLE DATA PREVIEW:');
      
      try {
        const { data: sampleClients } = await supabase
          .from('contacts')
          .select('full_name, contact_type, client_status, total_billed')
          .limit(3);
          
        if (sampleClients?.length > 0) {
          console.log('\\n   Sample Clients:');
          sampleClients.forEach(client => {
            const billing = client.total_billed > 0 ? `R$ ${client.total_billed.toLocaleString()}` : 'R$ 0';
            console.log(`   • ${client.full_name} (${client.contact_type}) - ${client.client_status} - ${billing}`);
          });
        }
      } catch (e) {
        // Ignore preview errors
      }
      
      try {
        const { data: sampleMatters } = await supabase
          .from('matters')
          .select('title, status, total_billed')
          .limit(3);
          
        if (sampleMatters?.length > 0) {
          console.log('\\n   Sample Legal Matters:');
          sampleMatters.forEach(matter => {
            const billing = matter.total_billed > 0 ? `R$ ${matter.total_billed.toLocaleString()}` : 'R$ 0';
            console.log(`   • ${matter.title.substring(0, 50)}... - ${matter.status} - ${billing}`);
          });
        }
      } catch (e) {
        // Ignore preview errors
      }
      
      console.log('\\n🚀 NEXT STEPS:');
      console.log('   • Start the application: npm run dev');
      console.log('   • Test user login with existing users');
      console.log('   • Explore client management with realistic data');
      console.log('   • Test billing workflows with sample invoices');
      console.log('   • Review time tracking with actual entries');
      
    } else if (corePercentage >= 50) {
      console.log('\\n⚠️  PARTIAL SEED DATA APPLIED');
      console.log('Some core tables need additional seeding');
      console.log('Apply remaining seed scripts for full experience');
      
    } else {
      console.log('\\n❌ INSUFFICIENT SEED DATA');
      console.log('Most core tables are empty or missing');
      console.log('Please apply seed data scripts in order:');
      console.log('   1. seed-data-step1-core.sql');
      console.log('   2. seed-data-step2-billing.sql');
      console.log('   3. seed-data-step3-timetracking.sql');
      console.log('   4. seed-data-step4-financial.sql');
    }
    
  } catch (error) {
    console.error('💥 Verification Error:', error.message);
  }
}

verifySeedData();