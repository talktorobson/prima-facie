// Create test users for Prima Facie system
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Test user data structure
const testUsers = [
  // SaaS Admin
  {
    email: 'admin@saas.com',
    password: '123456789',
    role: 'saas_admin',
    firm: null,
    full_name: 'SaaS Administrator',
    description: 'System administrator with access to all firms'
  },
  
  // Firm A (Dávila Reis Advocacia) - firm_id: 123e4567-e89b-12d3-a456-426614174000
  {
    email: 'admin@firm-a.com',
    password: '123456789',
    role: 'admin',
    firm: 'firm-a',
    firm_id: '123e4567-e89b-12d3-a456-426614174000',
    full_name: 'Roberto Dávila Reis',
    description: 'Managing Partner - Dávila Reis Advocacia'
  },
  {
    email: 'lawyer@firm-a.com',
    password: '123456789',
    role: 'lawyer',
    firm: 'firm-a',
    firm_id: '123e4567-e89b-12d3-a456-426614174000',
    full_name: 'Ana Carolina Santos',
    description: 'Senior Lawyer - Labor Law Specialist'
  },
  {
    email: 'staff@firm-a.com',
    password: '123456789',
    role: 'staff',
    firm: 'firm-a',
    firm_id: '123e4567-e89b-12d3-a456-426614174000',
    full_name: 'Marcus Silva',
    description: 'Legal Assistant and Office Manager'
  },
  {
    email: 'client@firm-a.com',
    password: '123456789',
    role: 'client',
    firm: 'firm-a',
    firm_id: '123e4567-e89b-12d3-a456-426614174000',
    full_name: 'Carlos Eduardo Silva',
    description: 'Client - Labor Law Case'
  },
  
  // Firm B (Silva & Associados) - firm_id: 234e4567-e89b-12d3-a456-426614174001
  {
    email: 'admin@firm-b.com',
    password: '123456789',
    role: 'admin',
    firm: 'firm-b',
    firm_id: '234e4567-e89b-12d3-a456-426614174001',
    full_name: 'Dr. Fernando Silva',
    description: 'Managing Partner - Silva & Associados'
  },
  {
    email: 'lawyer@firm-b.com',
    password: '123456789',
    role: 'lawyer',
    firm: 'firm-b',
    firm_id: '234e4567-e89b-12d3-a456-426614174001',
    full_name: 'Patricia Oliveira',
    description: 'Senior Lawyer - Corporate Law Specialist'
  },
  {
    email: 'staff@firm-b.com',
    password: '123456789',
    role: 'staff',
    firm: 'firm-b',
    firm_id: '234e4567-e89b-12d3-a456-426614174001',
    full_name: 'João Santos',
    description: 'Legal Assistant and Document Manager'
  },
  {
    email: 'client@firm-b.com',
    password: '123456789',
    role: 'client',
    firm: 'firm-b',
    firm_id: '234e4567-e89b-12d3-a456-426614174001',
    full_name: 'Mariana Santos Oliveira',
    description: 'Client - Corporate Law Services'
  }
]

async function createTestUsers() {
  console.log('🧪 Creating Prima Facie Test Users...\n')

  const createdUsers = []
  const errors = []

  for (const userData of testUsers) {
    try {
      console.log(`Creating user: ${userData.email} (${userData.role})...`)
      
      // Create auth user
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true
      })

      if (authError) {
        console.error(`❌ Auth error for ${userData.email}:`, authError.message)
        errors.push({ email: userData.email, error: authError.message })
        continue
      }

      console.log(`✅ Auth user created for ${userData.email}`)

      // Create profile in users table
      const profileData = {
        auth_user_id: authUser.user.id,
        email: userData.email,
        full_name: userData.full_name,
        first_name: userData.full_name.split(' ')[0],
        last_name: userData.full_name.split(' ').slice(1).join(' ') || userData.full_name.split(' ')[0],
        user_type: userData.role,
        law_firm_id: userData.firm_id || null,
        position: userData.description,
        status: 'active',
        language: 'pt-BR',
        timezone: 'America/Sao_Paulo',
        notification_preferences: { email: true, push: true, sms: false },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .upsert(profileData)
        .select()

      if (profileError) {
        console.error(`❌ Profile error for ${userData.email}:`, profileError.message)
        errors.push({ email: userData.email, error: profileError.message })
        continue
      }

      console.log(`✅ Profile created for ${userData.email}`)

      createdUsers.push({
        ...userData,
        auth_id: authUser.user.id,
        created: true
      })

    } catch (error) {
      console.error(`❌ Unexpected error for ${userData.email}:`, error.message)
      errors.push({ email: userData.email, error: error.message })
    }
  }

  // Display results
  console.log('\n🎉 User Creation Summary\n')
  
  console.log('✅ Successfully Created Users:')
  console.log('=====================================')
  createdUsers.forEach(user => {
    console.log(`Email: ${user.email}`)
    console.log(`Password: ${user.password}`)
    console.log(`Role: ${user.role}`)
    console.log(`Firm: ${user.firm || 'N/A (SaaS Admin)'}`)
    console.log(`Name: ${user.full_name}`)
    console.log(`Description: ${user.description}`)
    console.log('-------------------------------------')
  })

  if (errors.length > 0) {
    console.log('\n❌ Errors:')
    console.log('=====================================')
    errors.forEach(error => {
      console.log(`${error.email}: ${error.error}`)
    })
  }

  console.log(`\n📊 Summary: ${createdUsers.length} users created, ${errors.length} errors`)
  
  return { createdUsers, errors }
}

// Function to test user login
async function testUserLogin(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return { success: false, error: error.message }
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', data.user.id)
      .single()

    return { 
      success: true, 
      user: {
        email: data.user.email,
        role: profile?.user_type,
        firm_id: profile?.law_firm_id,
        full_name: profile?.full_name
      }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Function to test all users
async function testAllUsers() {
  console.log('\n🔐 Testing User Logins...\n')
  
  for (const userData of testUsers) {
    console.log(`Testing login: ${userData.email}...`)
    
    const result = await testUserLogin(userData.email, userData.password)
    
    if (result.success) {
      console.log(`✅ Login successful for ${userData.email}`)
      console.log(`   Role: ${result.user.role}`)
      console.log(`   Firm: ${result.user.firm_id || 'N/A'}`)
      console.log(`   Name: ${result.user.full_name}`)
    } else {
      console.log(`❌ Login failed for ${userData.email}: ${result.error}`)
    }
    console.log('-------------------------------------')
  }
}

// Main execution
async function main() {
  console.log('🚀 Prima Facie Test User Setup\n')
  
  // Create users
  const { createdUsers, errors } = await createTestUsers()
  
  // Wait a moment for users to be fully created
  console.log('\n⏳ Waiting for user creation to complete...')
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  // Test logins
  await testAllUsers()
  
  console.log('\n📋 Quick Reference - Test Users:')
  console.log('===========================================')
  testUsers.forEach(user => {
    console.log(`${user.email} | ${user.password} | ${user.role} | ${user.firm || 'SaaS'}`)
  })
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { createTestUsers, testUserLogin, testAllUsers, testUsers }