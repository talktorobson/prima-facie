#!/usr/bin/env node

// Verify database migration progress
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function verifyMigration() {
  try {
    console.log('🔍 Verifying database migration progress...');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check all expected tables
    const expectedTables = [
      // Core tables (Step 1)
      { name: 'contacts', step: 1 },
      { name: 'matter_types', step: 1 },
      { name: 'matters', step: 1 },
      { name: 'matter_contacts', step: 1 },
      
      // Supporting tables (Step 2)
      { name: 'tasks', step: 2 },
      { name: 'time_entries', step: 2 },
      { name: 'documents', step: 2 },
      { name: 'invoices', step: 2 },
      { name: 'invoice_line_items', step: 2 },
      { name: 'messages', step: 2 },
      { name: 'pipeline_stages', step: 2 },
      { name: 'pipeline_cards', step: 2 },
      { name: 'activity_logs', step: 2 }
    ];
    
    const step1Tables = expectedTables.filter(t => t.step === 1);
    const step2Tables = expectedTables.filter(t => t.step === 2);
    
    let step1Complete = 0;
    let step2Complete = 0;
    
    console.log('\\n📊 Step 1 Progress (Core tables):');
    for (const table of step1Tables) {
      try {
        const { error } = await supabase
          .from(table.name)
          .select('id')
          .limit(1);
          
        if (!error) {
          step1Complete++;
          console.log(`✅ ${table.name}`);
        } else {
          console.log(`❌ ${table.name} - Missing`);
        }
      } catch (e) {
        console.log(`❌ ${table.name} - Error: ${e.message}`);
      }
    }
    
    console.log(`\\n📊 Step 1 Status: ${step1Complete}/${step1Tables.length} tables created`);
    
    console.log('\\n📊 Step 2 Progress (Supporting tables):');
    for (const table of step2Tables) {
      try {
        const { error } = await supabase
          .from(table.name)
          .select('id')
          .limit(1);
          
        if (!error) {
          step2Complete++;
          console.log(`✅ ${table.name}`);
        } else {
          console.log(`❌ ${table.name} - Missing`);
        }
      } catch (e) {
        console.log(`❌ ${table.name} - Error: ${e.message}`);
      }
    }
    
    console.log(`\\n📊 Step 2 Status: ${step2Complete}/${step2Tables.length} tables created`);
    
    // Overall progress
    const totalComplete = step1Complete + step2Complete;
    const totalExpected = expectedTables.length;
    const progressPercent = Math.round((totalComplete / totalExpected) * 100);
    
    console.log(`\\n🎯 Overall Progress: ${totalComplete}/${totalExpected} tables (${progressPercent}%)`);
    
    if (progressPercent === 100) {
      console.log('\\n🎉 Database migration completed successfully!');
      console.log('✅ Ready for application use');
    } else if (step1Complete === step1Tables.length) {
      console.log('\\n⚡ Step 1 complete! Ready for Step 2');
      console.log('📝 Run manual-migration-step2.sql in Supabase SQL Editor');
    } else {
      console.log('\\n🚀 Migration needed');
      console.log('📝 Run manual-migration-step1.sql in Supabase SQL Editor first');
    }
    
    // Test basic functionality if core tables exist
    if (step1Complete >= 3) {
      console.log('\\n🧪 Testing basic functionality...');
      
      // Test law firms
      const { data: lawFirms, error: firmError } = await supabase
        .from('law_firms')
        .select('id, name')
        .limit(5);
        
      if (!firmError && lawFirms?.length > 0) {
        console.log(`✅ Law firms: ${lawFirms.length} found`);
        lawFirms.forEach(firm => console.log(`   - ${firm.name}`));
      }
      
      // Test contacts if available
      if (step1Complete >= 4) {
        const { data: contacts, error: contactError } = await supabase
          .from('contacts')
          .select('id, first_name, last_name, company_name')
          .limit(3);
          
        if (!contactError) {
          console.log(`✅ Contacts table accessible (${contacts?.length || 0} records)`);
        }
      }
    }
    
  } catch (error) {
    console.error('💥 Verification Error:', error.message);
  }
}

verifyMigration();