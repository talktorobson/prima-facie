#!/usr/bin/env node

/**
 * Prima Facie - Test Supabase Connection
 * Simple test to verify Supabase connectivity
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🏛️ Prima Facie - Supabase Connection Test');
console.log('==========================================');
console.log('');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
  process.exit(1);
}

console.log('🔗 Supabase URL:', supabaseUrl);
console.log('🔑 Anon Key:', supabaseAnonKey.substring(0, 20) + '...');
console.log('');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('🔍 Testing basic connection...');
    
    // Test auth service
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError && authError.message !== 'Auth session missing!') {
      console.error('❌ Auth service error:', authError);
      return false;
    }
    
    console.log('✅ Auth service accessible');
    
    // Test database connection by checking if tables exist
    console.log('🗄️ Testing database access...');
    
    const { data, error } = await supabase
      .from('law_firms')
      .select('id, name')
      .limit(1);

    if (error) {
      if (error.message.includes('relation "law_firms" does not exist')) {
        console.log('⚠️ Database tables not yet created');
        console.log('');
        console.log('📝 To set up the database:');
        console.log('1. Go to your Supabase project dashboard');
        console.log('2. Open the SQL Editor');
        console.log('3. Copy and paste the contents of setup-database.sql');
        console.log('4. Run the SQL script');
        console.log('');
        return false;
      } else {
        console.error('❌ Database error:', error);
        return false;
      }
    }

    console.log('✅ Database accessible');
    
    if (data && data.length > 0) {
      console.log('🏢 Found law firm:', data[0].name);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
}

async function main() {
  const success = await testConnection();
  
  console.log('');
  if (success) {
    console.log('🎉 Supabase is ready for Prima Facie!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Test registration at http://localhost:3000/register');
    console.log('3. Test login at http://localhost:3000/login');
  } else {
    console.log('🔧 Setup required before proceeding');
    console.log('');
    console.log('Troubleshooting:');
    console.log('- Ensure your Supabase project is active');
    console.log('- Check your environment variables');
    console.log('- Run the database setup script');
  }
}

main();