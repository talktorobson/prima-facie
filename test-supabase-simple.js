#!/usr/bin/env node

/**
 * Prima Facie - Simple Supabase Test
 * Test Supabase connection and database setup
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🏛️ Prima Facie - Supabase Database Test');
console.log('=======================================');
console.log('');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDatabaseSetup() {
  try {
    console.log('🔍 Testing database setup...');
    
    // Test 1: Check if law_firms table exists and has data
    console.log('📊 Checking law_firms table...');
    const { data: lawFirms, error: lawFirmsError } = await supabase
      .from('law_firms')
      .select('id, name, plan_type')
      .limit(1);

    if (lawFirmsError) {
      if (lawFirmsError.message.includes('relation "law_firms" does not exist')) {
        console.log('❌ law_firms table not found');
        console.log('');
        console.log('📝 To fix this:');
        console.log('1. Open Supabase Dashboard → SQL Editor');
        console.log('2. Copy the script from the test dashboard');
        console.log('3. Run the setup-database-simple.sql script');
        return false;
      } else {
        console.error('❌ Error accessing law_firms:', lawFirmsError.message);
        return false;
      }
    }

    if (lawFirms && lawFirms.length > 0) {
      console.log(`✅ law_firms table found with ${lawFirms.length} record(s)`);
      console.log(`   Default firm: ${lawFirms[0].name}`);
    } else {
      console.log('⚠️ law_firms table exists but no data found');
    }

    // Test 2: Check if users table exists
    console.log('👥 Checking users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, user_type')
      .limit(5);

    if (usersError) {
      if (usersError.message.includes('relation "users" does not exist')) {
        console.log('❌ users table not found');
        return false;
      } else {
        console.error('❌ Error accessing users:', usersError.message);
        return false;
      }
    }

    console.log(`✅ users table found with ${users?.length || 0} record(s)`);
    if (users && users.length > 0) {
      users.forEach(user => {
        console.log(`   User: ${user.email} (${user.user_type})`);
      });
    }

    // Test 3: Test authentication service
    console.log('🔐 Testing auth service...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError && authError.message !== 'Auth session missing!') {
      console.error('❌ Auth service error:', authError.message);
      return false;
    }
    
    console.log('✅ Auth service accessible');

    return true;

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    return false;
  }
}

async function main() {
  console.log(`🔗 Supabase URL: ${supabaseUrl}`);
  console.log(`🔑 Using anon key: ${supabaseAnonKey.substring(0, 20)}...`);
  console.log('');

  const success = await testDatabaseSetup();
  
  console.log('');
  if (success) {
    console.log('🎉 Database setup is working correctly!');
    console.log('');
    console.log('✅ Ready to test Prima Facie:');
    console.log('1. Start dev server: npm run dev');
    console.log('2. Register admin user at /register');
    console.log('3. Test admin panel at /admin');
  } else {
    console.log('🔧 Database setup required');
    console.log('');
    console.log('📋 Setup instructions:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Open SQL Editor');
    console.log('3. Run the setup-database-simple.sql script');
    console.log('4. Run this test again');
  }
}

main();