// DataJud schema inspection test
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDataJudSchema() {
  console.log('🔍 Checking DataJud CNJ Integration Schema Status...\n')

  const datajudTables = [
    'datajud_case_details',
    'datajud_legal_subjects', 
    'datajud_case_participants',
    'datajud_timeline_events',
    'datajud_sync_log'
  ]

  let deployedTables = 0
  let totalRecords = 0

  try {
    for (const tableName of datajudTables) {
      console.log(`📋 Checking table: ${tableName}`)
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(5)
      
      if (error) {
        console.log(`   ❌ Table ${tableName} NOT FOUND: ${error.message}`)
      } else {
        deployedTables++
        totalRecords += data.length
        console.log(`   ✅ Table ${tableName} EXISTS with ${data.length} records`)
        
        if (data.length > 0) {
          console.log(`      📝 Sample columns: ${Object.keys(data[0]).slice(0, 5).join(', ')}...`)
          
          // Show sample data for case details
          if (tableName === 'datajud_case_details' && data[0]) {
            console.log(`      📊 Sample case: ${data[0].numero_processo_cnj} (${data[0].tribunal_alias})`)
          }
        }
      }
    }

    console.log('\n📊 DataJud Schema Status Summary:')
    console.log(`   🗃️  Tables deployed: ${deployedTables}/${datajudTables.length}`)
    console.log(`   📄 Total records: ${totalRecords}`)
    
    if (deployedTables === datajudTables.length) {
      console.log('\n🎉 DataJud schema is FULLY DEPLOYED!')
      
      if (totalRecords > 0) {
        console.log('✅ Schema includes seed data - ready for testing!')
      } else {
        console.log('⚠️  Schema deployed but no seed data found')
      }
    } else {
      console.log('\n❌ DataJud schema is NOT deployed')
      console.log('🚀 Deployment required for DataJud CNJ integration')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

checkDataJudSchema()