// Schema inspection test
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function inspectSchema() {
  console.log('🔍 Inspecting Prima Facie Database Schema...\n')

  try {
    // Test contacts table structure
    console.log('1️⃣ Testing contacts table...')
    const { data: contacts, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .limit(3)
    
    if (contactError) {
      console.log('❌ Contacts error:', contactError.message)
    } else {
      console.log(`✅ Found ${contacts.length} contacts`)
      if (contacts.length > 0) {
        console.log('   Sample columns:', Object.keys(contacts[0]).slice(0, 8).join(', '))
        console.log('   Sample record:', contacts[0].full_name || contacts[0].name || 'N/A')
      }
    }

    // Test subscription_plans
    console.log('\n2️⃣ Testing subscription_plans table...')
    const { data: plans, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .limit(3)
    
    if (planError) {
      console.log('❌ Subscription plans error:', planError.message)
    } else {
      console.log(`✅ Found ${plans.length} subscription plans`)
      if (plans.length > 0) {
        console.log('   Sample columns:', Object.keys(plans[0]).slice(0, 8).join(', '))
      }
    }

    // Test matters
    console.log('\n3️⃣ Testing matters table...')
    const { data: matters, error: matterError } = await supabase
      .from('matters')
      .select('*')
      .limit(3)
    
    if (matterError) {
      console.log('❌ Matters error:', matterError.message)
    } else {
      console.log(`✅ Found ${matters.length} matters`)
      if (matters.length > 0) {
        console.log('   Sample columns:', Object.keys(matters[0]).slice(0, 8).join(', '))
      }
    }

    // Test invoices
    console.log('\n4️⃣ Testing invoices table...')
    const { data: invoices, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .limit(3)
    
    if (invoiceError) {
      console.log('❌ Invoices error:', invoiceError.message)
    } else {
      console.log(`✅ Found ${invoices.length} invoices`)
      if (invoices.length > 0) {
        console.log('   Sample columns:', Object.keys(invoices[0]).slice(0, 8).join(', '))
      }
    }

    // Test time_entries
    console.log('\n5️⃣ Testing time_entries table...')
    const { data: timeEntries, error: timeError } = await supabase
      .from('time_entries')
      .select('*')
      .limit(3)
    
    if (timeError) {
      console.log('❌ Time entries error:', timeError.message)
    } else {
      console.log(`✅ Found ${timeEntries.length} time entries`)
      if (timeEntries.length > 0) {
        console.log('   Sample columns:', Object.keys(timeEntries[0]).slice(0, 8).join(', '))
      }
    }

    // Test case_types
    console.log('\n6️⃣ Testing case_types table...')
    const { data: caseTypes, error: caseError } = await supabase
      .from('case_types')
      .select('*')
      .limit(3)
    
    if (caseError) {
      console.log('❌ Case types error:', caseError.message)
    } else {
      console.log(`✅ Found ${caseTypes.length} case types`)
      if (caseTypes.length > 0) {
        console.log('   Sample columns:', Object.keys(caseTypes[0]).slice(0, 8).join(', '))
      }
    }

    console.log('\n📊 Schema inspection completed!')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

inspectSchema()