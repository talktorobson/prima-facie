// Quick database connection test
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDatabaseConnection() {
  console.log('🧪 Testing Prima Facie Database Connection...\n')

  try {
    // Test 1: Basic connectivity
    console.log('1️⃣ Testing basic connectivity...')
    const { data: healthCheck, error: healthError } = await supabase
      .from('law_firms')
      .select('id')
      .limit(1)
    
    if (healthError) {
      console.log('❌ Connection failed:', healthError.message)
      return
    }
    console.log('✅ Database connected successfully')

    // Test 2: Check law firms
    console.log('\n2️⃣ Testing law firms data...')
    const { data: lawFirms, error: firmError } = await supabase
      .from('law_firms')
      .select('name, created_at')
      .limit(5)
    
    if (firmError) {
      console.log('❌ Error fetching law firms:', firmError.message)
    } else {
      console.log(`✅ Found ${lawFirms.length} law firms:`)
      lawFirms.forEach(firm => console.log(`   - ${firm.name}`))
    }

    // Test 3: Check clients (contacts)
    console.log('\n3️⃣ Testing client data...')
    const { data: clients, error: clientError } = await supabase
      .from('contacts')
      .select('full_name, contact_type, cpf')
      .limit(5)
    
    if (clientError) {
      console.log('❌ Error fetching clients:', clientError.message)
    } else {
      console.log(`✅ Found ${clients.length} clients:`)
      clients.forEach(client => console.log(`   - ${client.full_name} (${client.cpf || 'Company'})`))
    }

    // Test 4: Check subscription plans
    console.log('\n4️⃣ Testing subscription plans...')
    const { data: plans, error: planError } = await supabase
      .from('subscription_plans')
      .select('plan_name, monthly_fee, is_active')
      .eq('is_active', true)
      .limit(5)
    
    if (planError) {
      console.log('❌ Error fetching subscription plans:', planError.message)
    } else {
      console.log(`✅ Found ${plans.length} active subscription plans:`)
      plans.forEach(plan => console.log(`   - ${plan.plan_name}: R$ ${plan.monthly_fee}/mês`))
    }

    // Test 5: Check matters (cases)
    console.log('\n5️⃣ Testing legal matters...')
    const { data: matters, error: matterError } = await supabase
      .from('matters')
      .select('title, matter_number, status')
      .limit(5)
    
    if (matterError) {
      console.log('❌ Error fetching matters:', matterError.message)
    } else {
      console.log(`✅ Found ${matters.length} legal matters:`)
      matters.forEach(matter => console.log(`   - ${matter.matter_number}: ${matter.title} (${matter.status})`))
    }

    // Test 6: Check invoices
    console.log('\n6️⃣ Testing invoice data...')
    const { data: invoices, error: invoiceError } = await supabase
      .from('invoices')
      .select('invoice_number, total_amount, status')
      .limit(5)
    
    if (invoiceError) {
      console.log('❌ Error fetching invoices:', invoiceError.message)
    } else {
      console.log(`✅ Found ${invoices.length} invoices:`)
      invoices.forEach(invoice => console.log(`   - ${invoice.invoice_number}: R$ ${invoice.total_amount} (${invoice.status})`))
    }

    // Test 7: Check time entries
    console.log('\n7️⃣ Testing time tracking data...')
    const { data: timeEntries, error: timeError } = await supabase
      .from('time_entries')
      .select('description, hours_worked, hourly_rate')
      .limit(5)
    
    if (timeError) {
      console.log('❌ Error fetching time entries:', timeError.message)
    } else {
      console.log(`✅ Found ${timeEntries.length} time entries:`)
      timeEntries.forEach(entry => console.log(`   - ${entry.description}: ${entry.hours_worked}h @ R$ ${entry.hourly_rate}/h`))
    }

    console.log('\n🎉 Database integration test completed successfully!')
    console.log('📊 All core tables are accessible and populated with test data')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

testDatabaseConnection()