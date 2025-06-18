// Automated User Testing Script for Prima Facie
// This script helps test user authentication and profile setup

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// Test users data
const testUsers = [
  {
    email: 'admin@saas.com',
    password: '123456789',
    expected_role: 'saas_admin',
    expected_access: ['all_firms', 'system_settings', 'admin_panel'],
    description: 'SaaS Administrator with system-wide access'
  },
  {
    email: 'admin@firm-a.com',
    password: '123456789',
    expected_role: 'admin',
    firm_id: '123e4567-e89b-12d3-a456-426614174000',
    expected_access: ['firm_management', 'user_management', 'billing', 'reports'],
    description: 'Firm A Admin - Roberto Dávila Reis'
  },
  {
    email: 'lawyer@firm-a.com',
    password: '123456789',
    expected_role: 'lawyer',
    firm_id: '123e4567-e89b-12d3-a456-426614174000',
    expected_access: ['case_management', 'time_tracking', 'client_communication'],
    description: 'Firm A Lawyer - Ana Carolina Santos'
  },
  {
    email: 'staff@firm-a.com',
    password: '123456789',
    expected_role: 'staff',
    firm_id: '123e4567-e89b-12d3-a456-426614174000',
    expected_access: ['case_assistance', 'document_management'],
    description: 'Firm A Staff - Marcus Silva'
  },
  {
    email: 'client@firm-a.com',
    password: '123456789',
    expected_role: 'client',
    firm_id: '123e4567-e89b-12d3-a456-426614174000',
    expected_access: ['client_portal', 'own_cases', 'payments'],
    description: 'Firm A Client - Carlos Eduardo Silva'
  },
  {
    email: 'admin@firm-b.com',
    password: '123456789',
    expected_role: 'admin',
    firm_id: '234e4567-e89b-12d3-a456-426614174001',
    expected_access: ['firm_management', 'user_management', 'billing', 'reports'],
    description: 'Firm B Admin - Dr. Fernando Silva'
  },
  {
    email: 'lawyer@firm-b.com',
    password: '123456789',
    expected_role: 'lawyer',
    firm_id: '234e4567-e89b-12d3-a456-426614174001',
    expected_access: ['case_management', 'time_tracking', 'client_communication'],
    description: 'Firm B Lawyer - Patricia Oliveira'
  },
  {
    email: 'staff@firm-b.com',
    password: '123456789',
    expected_role: 'staff',
    firm_id: '234e4567-e89b-12d3-a456-426614174001',
    expected_access: ['case_assistance', 'document_management'],
    description: 'Firm B Staff - João Santos'
  },
  {
    email: 'client@firm-b.com',
    password: '123456789',
    expected_role: 'client',
    firm_id: '234e4567-e89b-12d3-a456-426614174001',
    expected_access: ['client_portal', 'own_cases', 'payments'],
    description: 'Firm B Client - Mariana Santos Oliveira'
  }
]

async function testUserAuthentication(userData) {
  console.log(`\n🔐 Testing: ${userData.email}`)
  console.log(`Expected Role: ${userData.expected_role}`)
  console.log(`Description: ${userData.description}`)
  
  try {
    // Test login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: userData.email,
      password: userData.password
    })

    if (authError) {
      console.log(`❌ Authentication failed: ${authError.message}`)
      return {
        success: false,
        email: userData.email,
        error: authError.message,
        stage: 'authentication'
      }
    }

    console.log(`✅ Authentication successful`)
    console.log(`   Auth User ID: ${authData.user.id}`)

    // Check if user has profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .maybeSingle()

    if (profileError) {
      console.log(`⚠️ Profile check error: ${profileError.message}`)
    } else if (!profile) {
      console.log(`⚠️ No profile found - needs to be created through UI`)
    } else {
      console.log(`✅ Profile found`)
      console.log(`   Name: ${profile.full_name || profile.first_name + ' ' + profile.last_name}`)
      console.log(`   Role: ${profile.user_type}`)
      console.log(`   Firm: ${profile.law_firm_id || 'N/A'}`)
      console.log(`   Status: ${profile.status}`)
    }

    // Sign out after test
    await supabase.auth.signOut()

    return {
      success: true,
      email: userData.email,
      auth_user_id: authData.user.id,
      profile_exists: !!profile,
      profile_data: profile,
      expected_role: userData.expected_role,
      expected_firm: userData.firm_id
    }

  } catch (error) {
    console.log(`❌ Unexpected error: ${error.message}`)
    return {
      success: false,
      email: userData.email,
      error: error.message,
      stage: 'unexpected'
    }
  }
}

async function generateTestingReport() {
  console.log('🧪 Prima Facie - Automated User Authentication Testing')
  console.log('=' .repeat(60))
  
  const results = []
  
  for (const userData of testUsers) {
    const result = await testUserAuthentication(userData)
    results.push(result)
    
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  // Generate summary report
  console.log('\n📊 TESTING SUMMARY')
  console.log('=' .repeat(60))
  
  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)
  const withProfiles = results.filter(r => r.success && r.profile_exists)
  const withoutProfiles = results.filter(r => r.success && !r.profile_exists)
  
  console.log(`Total Users Tested: ${results.length}`)
  console.log(`Authentication Success: ${successful.length}/${results.length}`)
  console.log(`Authentication Failed: ${failed.length}/${results.length}`)
  console.log(`Users with Profiles: ${withProfiles.length}/${successful.length}`)
  console.log(`Users needing Profile Setup: ${withoutProfiles.length}/${successful.length}`)
  
  if (failed.length > 0) {
    console.log('\n❌ Failed Authentications:')
    failed.forEach(user => {
      console.log(`   ${user.email}: ${user.error}`)
    })
  }
  
  if (withoutProfiles.length > 0) {
    console.log('\n⚠️ Users needing Profile Setup:')
    withoutProfiles.forEach(user => {
      console.log(`   ${user.email} (${user.expected_role})`)
    })
  }
  
  console.log('\n🎯 Next Steps:')
  console.log('1. Manual frontend testing for each user role')
  console.log('2. Profile creation through web interface')
  console.log('3. Role-based access verification')
  console.log('4. Multi-tenant security testing')
  console.log('5. CTA functionality validation')
  
  console.log('\n🌐 Testing URLs:')
  console.log('- Login: http://localhost:3001/login')
  console.log('- Dashboard: http://localhost:3001/dashboard')
  console.log('- Admin: http://localhost:3001/admin')
  console.log('- Client Portal: http://localhost:3001/portal/client')
  
  return results
}

// Enhanced testing with frontend navigation suggestions
async function generateFrontendTestingGuide() {
  console.log('\n🎯 FRONTEND TESTING GUIDE')
  console.log('=' .repeat(60))
  
  console.log('\n📋 Step-by-Step Testing Protocol:')
  
  for (let i = 0; i < testUsers.length; i++) {
    const user = testUsers[i]
    console.log(`\n${i + 1}. Test ${user.description}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Password: ${user.password}`)
    console.log(`   Expected Role: ${user.expected_role}`)
    console.log(`   Expected Access: ${user.expected_access.join(', ')}`)
    console.log(`   Testing Steps:`)
    console.log(`     a) Login at http://localhost:3001/login`)
    console.log(`     b) Complete profile setup if prompted`)
    console.log(`     c) Verify dashboard/portal access`)
    console.log(`     d) Test navigation menu items`)
    console.log(`     e) Test key CTAs for the role`)
    console.log(`     f) Verify data visibility (firm isolation)`)
    console.log(`     g) Log out and proceed to next user`)
  }
  
  console.log('\n🔍 Key Testing Points:')
  console.log('- SaaS Admin should see all firms')
  console.log('- Firm admins should only see their firm data')
  console.log('- Lawyers should have case management access')
  console.log('- Staff should have limited admin access')
  console.log('- Clients should only see client portal')
  console.log('- No cross-firm data visibility')
  
  console.log('\n📝 Document in: FRONTEND_USER_TESTING.md')
}

async function main() {
  const results = await generateTestingReport()
  await generateFrontendTestingGuide()
  
  console.log('\n✅ Automated testing complete!')
  console.log('📋 Ready for manual frontend testing')
  console.log('📄 Update FRONTEND_USER_TESTING.md with your findings')
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { testUsers, testUserAuthentication, generateTestingReport }