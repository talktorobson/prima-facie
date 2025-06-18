// Create test users with minimal required fields
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// Test user data
const testUsers = [
  // SaaS Admin
  {
    email: 'admin@saas.com',
    password: '123456789',
    role: 'saas_admin',
    firm: null,
    firm_id: null,
    first_name: 'SaaS',
    last_name: 'Administrator',
    position: 'System Administrator'
  },
  
  // Firm A (Dávila Reis Advocacia)
  {
    email: 'admin@firm-a.com',
    password: '123456789',
    role: 'admin',
    firm: 'firm-a',
    firm_id: '123e4567-e89b-12d3-a456-426614174000',
    first_name: 'Roberto',
    last_name: 'Dávila Reis',
    position: 'Managing Partner'
  },
  {
    email: 'lawyer@firm-a.com',
    password: '123456789',
    role: 'lawyer',
    firm: 'firm-a',
    firm_id: '123e4567-e89b-12d3-a456-426614174000',
    first_name: 'Ana',
    last_name: 'Carolina Santos',
    position: 'Senior Lawyer'
  },
  {
    email: 'staff@firm-a.com',
    password: '123456789',
    role: 'staff',
    firm: 'firm-a',
    firm_id: '123e4567-e89b-12d3-a456-426614174000',
    first_name: 'Marcus',
    last_name: 'Silva',
    position: 'Legal Assistant'
  },
  {
    email: 'client@firm-a.com',
    password: '123456789',
    role: 'client',
    firm: 'firm-a',
    firm_id: '123e4567-e89b-12d3-a456-426614174000',
    first_name: 'Carlos',
    last_name: 'Eduardo Silva',
    position: 'Client'
  },
  
  // Firm B (Silva & Associados)
  {
    email: 'admin@firm-b.com',
    password: '123456789',
    role: 'admin',
    firm: 'firm-b',
    firm_id: '234e4567-e89b-12d3-a456-426614174001',
    first_name: 'Fernando',
    last_name: 'Silva',
    position: 'Managing Partner'
  },
  {
    email: 'lawyer@firm-b.com',
    password: '123456789',
    role: 'lawyer',
    firm: 'firm-b',
    firm_id: '234e4567-e89b-12d3-a456-426614174001',
    first_name: 'Patricia',
    last_name: 'Oliveira',
    position: 'Senior Lawyer'
  },
  {
    email: 'staff@firm-b.com',
    password: '123456789',
    role: 'staff',
    firm: 'firm-b',
    firm_id: '234e4567-e89b-12d3-a456-426614174001',
    first_name: 'João',
    last_name: 'Santos',
    position: 'Legal Assistant'
  },
  {
    email: 'client@firm-b.com',
    password: '123456789',
    role: 'client',
    firm: 'firm-b',
    firm_id: '234e4567-e89b-12d3-a456-426614174001',
    first_name: 'Mariana',
    last_name: 'Santos Oliveira',
    position: 'Client'
  }
]

async function createUserWithProfile(userData) {
  try {
    console.log(`Creating user: ${userData.email} (${userData.role})...`)
    
    // Create auth user
    const { data: authUser, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password
    })

    if (authError) {
      console.error(`❌ Auth error for ${userData.email}:`, authError.message)
      return { success: false, error: authError.message }
    }

    if (!authUser.user) {
      console.error(`❌ No user returned for ${userData.email}`)
      return { success: false, error: 'No user returned from auth' }
    }

    console.log(`✅ Auth user created for ${userData.email}`)

    // Create profile in users table with minimal fields
    const profileData = {
      auth_user_id: authUser.user.id,
      email: userData.email,
      first_name: userData.first_name,
      last_name: userData.last_name,
      user_type: userData.role,
      law_firm_id: userData.firm_id || null,
      position: userData.position,
      status: 'active',
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo'
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .insert(profileData)
      .select()

    if (profileError) {
      console.error(`❌ Profile error for ${userData.email}:`, profileError.message)
      return { success: false, error: profileError.message }
    }

    console.log(`✅ Profile created for ${userData.email}`)

    return {
      success: true,
      user: {
        ...userData,
        auth_id: authUser.user.id,
        profile_id: profile[0]?.id,
        full_name: `${userData.first_name} ${userData.last_name}`
      }
    }

  } catch (error) {
    console.error(`❌ Unexpected error for ${userData.email}:`, error.message)
    return { success: false, error: error.message }
  }
}

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
        full_name: profile?.full_name || `${profile?.first_name} ${profile?.last_name}`,
        position: profile?.position
      }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function main() {
  console.log('🚀 Prima Facie Test User Setup (Simple)\n')
  
  const createdUsers = []
  const errors = []

  // Create users
  for (const userData of testUsers) {
    const result = await createUserWithProfile(userData)
    
    if (result.success) {
      createdUsers.push(result.user)
    } else {
      errors.push({ email: userData.email, error: result.error })
    }
    
    // Wait a bit between creations
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  // Display results
  console.log('\n🎉 User Creation Summary\n')
  
  if (createdUsers.length > 0) {
    console.log('✅ Successfully Created Users:')
    console.log('=====================================')
    createdUsers.forEach(user => {
      console.log(`Email: ${user.email}`)
      console.log(`Password: ${user.password}`)
      console.log(`Role: ${user.role}`)
      console.log(`Firm: ${user.firm || 'N/A (SaaS Admin)'}`)
      console.log(`Name: ${user.full_name}`)
      console.log(`Position: ${user.position}`)
      console.log('-------------------------------------')
    })
  }

  if (errors.length > 0) {
    console.log('\n❌ Errors:')
    console.log('=====================================')
    errors.forEach(error => {
      console.log(`${error.email}: ${error.error}`)
    })
  }

  console.log(`\n📊 Summary: ${createdUsers.length} users created, ${errors.length} errors`)

  // Test logins if users were created
  if (createdUsers.length > 0) {
    console.log('\n⏳ Waiting before testing logins...')
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    console.log('\n🔐 Testing User Logins...\n')
    
    for (const userData of testUsers) {
      console.log(`Testing login: ${userData.email}...`)
      
      const result = await testUserLogin(userData.email, userData.password)
      
      if (result.success) {
        console.log(`✅ Login successful for ${userData.email}`)
        console.log(`   Role: ${result.user.role}`)
        console.log(`   Firm: ${result.user.firm_id || 'N/A'}`)
        console.log(`   Name: ${result.user.full_name}`)
        console.log(`   Position: ${result.user.position}`)
      } else {
        console.log(`❌ Login failed for ${userData.email}: ${result.error}`)
      }
      console.log('-------------------------------------')
    }
  }
  
  console.log('\n📋 FINAL USER LIST - Test Users:')
  console.log('===========================================')
  console.log('EMAIL                | PASSWORD  | ROLE        | FIRM   | NAME')
  console.log('==================================================================================')
  testUsers.forEach(user => {
    const email = user.email.padEnd(20)
    const password = user.password.padEnd(9)
    const role = user.role.padEnd(11)
    const firm = (user.firm || 'SaaS').padEnd(6)
    const name = `${user.first_name} ${user.last_name}`
    console.log(`${email} | ${password} | ${role} | ${firm} | ${name}`)
  })
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { testUsers, createUserWithProfile, testUserLogin }