// Test existing auth users
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// Test user credentials
const testUsers = [
  { email: 'admin@saas.com', password: '123456789' },
  { email: 'admin@firm-a.com', password: '123456789' },
  { email: 'lawyer@firm-a.com', password: '123456789' },
  { email: 'staff@firm-a.com', password: '123456789' },
  { email: 'client@firm-a.com', password: '123456789' },
  { email: 'admin@firm-b.com', password: '123456789' },
  { email: 'lawyer@firm-b.com', password: '123456789' },
  { email: 'staff@firm-b.com', password: '123456789' },
  { email: 'client@firm-b.com', password: '123456789' }
]

async function testLogin(email, password) {
  try {
    console.log(`Testing login: ${email}...`)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.log(`❌ Login failed: ${error.message}`)
      return false
    }

    console.log(`✅ Login successful! User ID: ${data.user.id}`)
    
    // Try to get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', data.user.id)
      .single()

    if (profileError) {
      console.log(`   ⚠️ No profile found: ${profileError.message}`)
    } else {
      console.log(`   ✅ Profile found: ${profile.full_name || profile.first_name + ' ' + profile.last_name}`)
      console.log(`   Role: ${profile.user_type}, Firm: ${profile.law_firm_id || 'N/A'}`)
    }

    // Sign out after test
    await supabase.auth.signOut()
    
    return true
  } catch (error) {
    console.log(`❌ Error: ${error.message}`)
    return false
  }
}

async function main() {
  console.log('🔐 Testing Existing Auth Users\n')
  
  let successCount = 0
  
  for (const user of testUsers) {
    const success = await testLogin(user.email, user.password)
    if (success) successCount++
    console.log('-------------------------------------')
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  console.log(`\n📊 Summary: ${successCount}/${testUsers.length} users can log in`)
  
  if (successCount > 0) {
    console.log('\n✅ Auth users exist and can log in!')
    console.log('You can now create profiles manually through the application UI.')
    console.log('\n🌐 Access the application at: http://localhost:3000')
    console.log('\n📋 Test Login Credentials:')
    console.log('==========================================')
    testUsers.forEach(user => {
      console.log(`${user.email} | ${user.password}`)
    })
  }
}

main().catch(console.error)