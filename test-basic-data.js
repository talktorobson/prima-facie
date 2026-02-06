// Check basic seed data status
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkBasicData() {
  console.log('🔍 Checking Basic Seed Data Status...\n')

  try {
    // Check law firms
    console.log('1️⃣ Checking law firms...')
    const { data: lawFirms, error: firmError } = await supabase
      .from('law_firms')
      .select('id, name')
    
    if (firmError) {
      console.log('❌ Law firms error:', firmError.message)
    } else {
      console.log(`✅ Found ${lawFirms.length} law firms`)
      lawFirms.forEach(firm => console.log(`   - ${firm.name} (${firm.id})`))
    }

    // Check contacts
    console.log('\n2️⃣ Checking contacts...')
    const { data: contacts, error: contactError } = await supabase
      .from('contacts')
      .select('id, full_name, law_firm_id')
      .eq('law_firm_id', '123e4567-e89b-12d3-a456-426614174000')
    
    if (contactError) {
      console.log('❌ Contacts error:', contactError.message)
    } else {
      console.log(`✅ Found ${contacts.length} contacts for Dávila Reis`)
      contacts.slice(0, 5).forEach(contact => console.log(`   - ${contact.full_name}`))
    }

    // Check matters
    console.log('\n3️⃣ Checking matters...')
    const { data: matters, error: matterError } = await supabase
      .from('matters')
      .select('id, title, law_firm_id')
      .eq('law_firm_id', '123e4567-e89b-12d3-a456-426614174000')
    
    if (matterError) {
      console.log('❌ Matters error:', matterError.message)
    } else {
      console.log(`✅ Found ${matters.length} matters for Dávila Reis`)
      matters.forEach(matter => console.log(`   - ${matter.title}`))
    }

    // Check users
    console.log('\n4️⃣ Checking users...')
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, email, role, law_firm_id')
      .eq('law_firm_id', '123e4567-e89b-12d3-a456-426614174000')
    
    if (userError) {
      console.log('❌ Users error:', userError.message)
    } else {
      console.log(`✅ Found ${users.length} users for Dávila Reis`)
      users.forEach(user => console.log(`   - ${user.email} (${user.role})`))
    }

    console.log('\n📊 Data Summary:')
    console.log(`   🏢 Law firms: ${lawFirms?.length || 0}`)
    console.log(`   👥 Contacts: ${contacts?.length || 0}`)
    console.log(`   📋 Matters: ${matters?.length || 0}`)
    console.log(`   👤 Users: ${users?.length || 0}`)
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

checkBasicData()