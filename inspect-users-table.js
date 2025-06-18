// Inspect users table schema
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function inspectUsersTable() {
  console.log('🔍 Inspecting users table schema...\n')

  try {
    // Try to get any existing users
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .limit(3)

    if (error) {
      console.error('❌ Error accessing users table:', error.message)
      
      // Check if table exists by trying to create a test record
      console.log('\n🧪 Testing table structure...')
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: 'test-id',
          email: 'test@test.com'
        })
        .select()

      if (insertError) {
        console.log('Table structure error:', insertError.message)
      }
    } else {
      console.log(`✅ Users table accessible, found ${users.length} records`)
      if (users.length > 0) {
        console.log('Sample user columns:', Object.keys(users[0]))
        console.log('Sample user:', users[0])
      }
    }

    // Check auth users
    console.log('\n🔐 Checking auth users...')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error accessing auth users:', authError.message)
    } else {
      console.log(`✅ Found ${authUsers.users.length} auth users`)
      authUsers.users.forEach(user => {
        console.log(`- ${user.email} (${user.id})`)
      })
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

inspectUsersTable()