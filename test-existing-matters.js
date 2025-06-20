// Check existing matters in database
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkExistingMatters() {
  console.log('🔍 Checking Existing Matters in Database...\n')

  try {
    // Get all matters for Dávila Reis law firm
    const { data: matters, error } = await supabase
      .from('matters')
      .select('id, title, matter_number, status, law_firm_id')
      .eq('law_firm_id', '123e4567-e89b-12d3-a456-426614174000')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.log('❌ Error fetching matters:', error.message)
      return
    }

    console.log(`📋 Found ${matters.length} matters for Dávila Reis Advocacia:\n`)

    matters.forEach((matter, index) => {
      console.log(`${index + 1}. ${matter.title}`)
      console.log(`   ID: ${matter.id}`)
      console.log(`   Number: ${matter.matter_number}`)
      console.log(`   Status: ${matter.status}`)
      console.log('')
    })

    if (matters.length >= 5) {
      console.log('🎉 Sufficient matters available for DataJud seed data!')
      console.log('💡 We can update the seed data to use existing matter IDs')
      
      // Show the first 5 for reference
      console.log('\n📝 First 5 matter IDs for seed data update:')
      matters.slice(0, 5).forEach((matter, index) => {
        console.log(`   Matter ${index + 1}: ${matter.id}`)
      })
    } else {
      console.log('⚠️  Only found ' + matters.length + ' matters - need at least 5 for complete seed data')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

checkExistingMatters()