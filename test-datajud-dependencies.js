// DataJud dependencies check
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDataJudDependencies() {
  console.log('🔍 Checking DataJud Seed Data Dependencies...\n')

  try {
    // Check if Dávila Reis law firm exists
    console.log('1️⃣ Checking law firm dependency...')
    const { data: lawFirm, error: firmError } = await supabase
      .from('law_firms')
      .select('*')
      .eq('id', '123e4567-e89b-12d3-a456-426614174000')
      .single()
    
    if (firmError) {
      console.log('❌ Law firm not found:', firmError.message)
      return false
    } else {
      console.log(`✅ Law firm found: ${lawFirm.name}`)
    }

    // Check required matters exist
    console.log('\n2️⃣ Checking matter dependencies...')
    const matterIds = [
      '55555555-5555-5555-5555-555555555001',
      '55555555-5555-5555-5555-555555555002', 
      '55555555-5555-5555-5555-555555555003',
      '55555555-5555-5555-5555-555555555004',
      '55555555-5555-5555-5555-555555555005'
    ]

    let foundMatters = 0
    for (const matterId of matterIds) {
      const { data: matter, error: matterError } = await supabase
        .from('matters')
        .select('id, title, matter_number')
        .eq('id', matterId)
        .single()
      
      if (matterError) {
        console.log(`❌ Matter ${matterId} not found`)
      } else {
        foundMatters++
        console.log(`✅ Matter found: ${matter.title}`)
      }
    }

    console.log(`\n📊 Dependencies Summary:`)
    console.log(`   🏢 Law firm: ✅ Found`)
    console.log(`   📋 Matters: ${foundMatters}/${matterIds.length} found`)

    if (foundMatters === matterIds.length) {
      console.log('\n🎉 All dependencies satisfied - seed data can be deployed!')
      return true
    } else {
      console.log('\n❌ Missing dependencies - seed data deployment may fail')
      return false
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
    return false
  }
}

checkDataJudDependencies().then(canDeploy => {
  console.log(`\n🚀 Deployment Status: ${canDeploy ? 'READY' : 'BLOCKED'}`)
})