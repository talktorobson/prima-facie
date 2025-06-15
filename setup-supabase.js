#!/usr/bin/env node

/**
 * Prima Facie - Supabase Setup Script
 * Sets up the database schema and initial data
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  try {
    console.log('🚀 Setting up Prima Facie database schema...');

    // Read SQL migration files
    const schemaPath = path.join(__dirname, 'database/migrations/001_initial_schema.sql');
    const rlsPath = path.join(__dirname, 'database/migrations/002_row_level_security.sql');

    if (!fs.existsSync(schemaPath)) {
      console.error('❌ Schema file not found:', schemaPath);
      return;
    }

    if (!fs.existsSync(rlsPath)) {
      console.error('❌ RLS file not found:', rlsPath);
      return;
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    const rlsSql = fs.readFileSync(rlsPath, 'utf8');

    console.log('📊 Creating database schema...');
    
    // Execute schema migration
    const { error: schemaError } = await supabase.rpc('exec_sql', {
      sql: schemaSql
    });

    if (schemaError && !schemaError.message.includes('already exists')) {
      console.error('❌ Schema creation error:', schemaError);
      return;
    }

    console.log('🔒 Setting up Row Level Security...');
    
    // Execute RLS migration
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: rlsSql
    });

    if (rlsError && !rlsError.message.includes('already exists')) {
      console.error('❌ RLS setup error:', rlsError);
      return;
    }

    console.log('🏢 Creating default law firm...');
    
    // Create default law firm
    const { data: lawFirm, error: firmError } = await supabase
      .from('law_firms')
      .upsert({
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Dávila Reis Advocacia',
        legal_name: 'Dávila Reis Advocacia LTDA',
        email: 'contato@davilareisadvocacia.com.br',
        phone: '(11) 3456-7890',
        plan_type: 'professional',
        subscription_active: true,
        primary_color: '#0066CC',
        secondary_color: '#64748B'
      }, {
        onConflict: 'id',
        returning: 'minimal'
      });

    if (firmError) {
      console.error('❌ Law firm creation error:', firmError);
      return;
    }

    console.log('✅ Database setup completed successfully!');
    console.log('');
    console.log('📝 Next steps:');
    console.log('1. Create user accounts through the registration form');
    console.log('2. Test authentication with real Supabase auth');
    console.log('3. Verify role-based access control');
    console.log('');
    console.log('🧪 Test credentials will be created through the app registration');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

async function checkConnection() {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    // Simple connection test - just try to access the API
    const { data, error } = await supabase.auth.getSession();

    if (error && error.message !== 'Auth session missing!') {
      console.error('❌ Connection test failed:', error);
      return false;
    }

    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Connection test error:', error);
    return false;
  }
}

async function main() {
  console.log('🏛️ Prima Facie - Supabase Setup');
  console.log('================================');
  console.log('');

  const isConnected = await checkConnection();
  if (!isConnected) {
    console.log('');
    console.log('💡 Troubleshooting:');
    console.log('- Check your Supabase URL and Service Role Key');
    console.log('- Ensure your Supabase project is active');
    console.log('- Verify network connectivity');
    return;
  }

  await setupDatabase();
}

if (require.main === module) {
  main();
}

module.exports = { setupDatabase, checkConnection };