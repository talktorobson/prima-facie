#!/usr/bin/env node

/**
 * Seed Auth Users for Prima Facie
 *
 * Creates Supabase Auth users and links them to the `users` table.
 * Safe to run multiple times (idempotent).
 *
 * Usage:
 *   node database/seed-data/seed-auth-users.mjs
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// 1. Load environment variables from .env.local
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '../..');
const envPath = resolve(projectRoot, '.env.local');

function loadEnv(filePath) {
  const env = {};
  try {
    const content = readFileSync(filePath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let value = trimmed.slice(eqIdx + 1).trim();
      // Strip surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
  } catch {
    console.error(`❌ Could not read ${filePath}`);
    process.exit(1);
  }
  return env;
}

const env = loadEnv(envPath);
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 2. Create admin Supabase client (service_role bypasses RLS)
// ---------------------------------------------------------------------------

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------------------
// 3. User matrix
// ---------------------------------------------------------------------------

const FIRM_A_ID = '123e4567-e89b-12d3-a456-426614174000';
const FIRM_B_ID = 'b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0';

const PASSWORD = 'Test@123';

const users = [
  // Firm A — Dávila Reis Advocacia
  {
    email: 'admin@davilareisadv.com.br',
    firstName: 'Robson',
    lastName: 'Dávila Reis',
    userType: 'admin',
    lawFirmId: FIRM_A_ID,
    oabNumber: 'OAB/SP 123456',
    position: 'Sócio Fundador',
  },
  {
    email: 'maria.silva@davilareisadv.com.br',
    firstName: 'Maria',
    lastName: 'Silva',
    userType: 'lawyer',
    lawFirmId: FIRM_A_ID,
    oabNumber: 'OAB/SP 234567',
    position: 'Advogada Sênior',
  },
  {
    email: 'ana.costa@davilareisadv.com.br',
    firstName: 'Ana',
    lastName: 'Costa',
    userType: 'staff',
    lawFirmId: FIRM_A_ID,
    position: 'Secretária Jurídica',
  },
  {
    email: 'cliente@davilareisadv.com.br',
    firstName: 'Pedro',
    lastName: 'Oliveira',
    userType: 'client',
    lawFirmId: FIRM_A_ID,
  },
  // Firm B — Silva & Santos Advogados
  {
    email: 'admin@silvasantos.adv.br',
    firstName: 'Mariana',
    lastName: 'Silva',
    userType: 'admin',
    lawFirmId: FIRM_B_ID,
  },
  {
    email: 'rafael@silvasantos.adv.br',
    firstName: 'Rafael',
    lastName: 'Santos',
    userType: 'lawyer',
    lawFirmId: FIRM_B_ID,
    oabNumber: 'OAB/RJ 98765',
  },
  {
    email: 'assistente@silvasantos.adv.br',
    firstName: 'Fernanda',
    lastName: 'Oliveira',
    userType: 'staff',
    lawFirmId: FIRM_B_ID,
  },
  {
    email: 'cliente@silvasantos.adv.br',
    firstName: 'Carlos',
    lastName: 'Mendes',
    userType: 'client',
    lawFirmId: FIRM_B_ID,
  },
  // Platform — Super Admin
  {
    email: 'superadmin@primafacie.com.br',
    firstName: 'Super',
    lastName: 'Admin',
    userType: 'super_admin',
    lawFirmId: null,
  },
];

// ---------------------------------------------------------------------------
// 4. Seed logic
// ---------------------------------------------------------------------------

async function getOrCreateAuthUser(email) {
  // Try to create the auth user first
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });

  if (created?.user) {
    return { id: created.user.id, status: 'created' };
  }

  // User already exists — fetch by email
  if (createErr?.message?.includes('already been registered') ||
      createErr?.message?.includes('already exists') ||
      createErr?.status === 422) {
    const { data: list, error: listErr } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (listErr) throw new Error(`Failed to list users: ${listErr.message}`);

    const existing = list.users.find((u) => u.email === email);
    if (existing) {
      return { id: existing.id, status: 'existing' };
    }
    throw new Error(`Auth user for ${email} supposedly exists but was not found`);
  }

  throw new Error(`Failed to create auth user for ${email}: ${createErr?.message}`);
}

async function upsertProfileRow(authUserId, user) {
  // Check if a profile row already exists for this email
  const { data: existing, error: selectErr } = await supabase
    .from('users')
    .select('id, auth_user_id')
    .eq('email', user.email)
    .maybeSingle();

  if (selectErr) throw new Error(`Select failed for ${user.email}: ${selectErr.message}`);

  if (existing) {
    // Update auth_user_id linkage on the existing row
    const { error: updateErr } = await supabase
      .from('users')
      .update({ auth_user_id: authUserId })
      .eq('id', existing.id);
    if (updateErr) throw new Error(`Update failed for ${user.email}: ${updateErr.message}`);
    return 'updated';
  }

  // Insert a new profile row
  const row = {
    law_firm_id: user.lawFirmId,
    auth_user_id: authUserId,
    email: user.email,
    first_name: user.firstName,
    last_name: user.lastName,
    user_type: user.userType,
    status: 'active',
    timezone: 'America/Sao_Paulo',
    language: 'pt-BR',
  };
  if (user.oabNumber) row.oab_number = user.oabNumber;
  if (user.position) row.position = user.position;

  const { error: insertErr } = await supabase.from('users').insert(row);
  if (insertErr) throw new Error(`Insert failed for ${user.email}: ${insertErr.message}`);
  return 'inserted';
}

// ---------------------------------------------------------------------------
// 5. Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('🔐 Prima Facie — Seed Auth Users\n');
  console.log(`   Supabase URL: ${supabaseUrl}`);
  console.log(`   Users to seed: ${users.length}\n`);

  const results = [];

  for (const user of users) {
    try {
      const auth = await getOrCreateAuthUser(user.email);
      const profileAction = await upsertProfileRow(auth.id, user);

      results.push({
        email: user.email,
        role: user.userType,
        firm: user.lawFirmId === FIRM_A_ID ? 'Firm A' :
              user.lawFirmId === FIRM_B_ID ? 'Firm B' : 'Platform',
        authStatus: auth.status,
        profileStatus: profileAction,
        authUserId: auth.id,
      });

      console.log(`   ✅ ${user.email} — auth:${auth.status}, profile:${profileAction}`);
    } catch (err) {
      results.push({
        email: user.email,
        role: user.userType,
        firm: user.lawFirmId === FIRM_A_ID ? 'Firm A' :
              user.lawFirmId === FIRM_B_ID ? 'Firm B' : 'Platform',
        authStatus: 'ERROR',
        profileStatus: 'ERROR',
        authUserId: '-',
      });
      console.error(`   ❌ ${user.email} — ${err.message}`);
    }
  }

  // Print summary table
  console.log('\n' + '='.repeat(90));
  console.log('LOGIN CREDENTIALS (password for all: Test@123)');
  console.log('='.repeat(90));
  console.log(
    'Email'.padEnd(38) +
    'Role'.padEnd(14) +
    'Firm'.padEnd(12) +
    'Auth'.padEnd(12) +
    'Profile'
  );
  console.log('-'.repeat(90));
  for (const r of results) {
    console.log(
      r.email.padEnd(38) +
      r.role.padEnd(14) +
      r.firm.padEnd(12) +
      r.authStatus.padEnd(12) +
      r.profileStatus
    );
  }
  console.log('='.repeat(90));
  console.log('\n🎯 Test logins:');
  console.log('   1. admin@davilareisadv.com.br     → /dashboard (Firm A)');
  console.log('   2. superadmin@primafacie.com.br    → /platform  (all firms)');
  console.log('   3. cliente@davilareisadv.com.br    → /portal/client');
  console.log('   4. admin@silvasantos.adv.br        → /dashboard (Firm B)');
}

main().catch((err) => {
  console.error('\n💥 Fatal error:', err.message);
  process.exit(1);
});
