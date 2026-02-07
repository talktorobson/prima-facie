#!/usr/bin/env node

/**
 * seed-all-data.mjs — Orchestrator for comprehensive Prima Facie seed data.
 *
 * Runs all seed modules sequentially in dependency order, filling ~260 rows
 * across 30+ tables for both Firm A and Firm B with dynamic dates.
 *
 * Usage:
 *   node database/seed-data/seed-auth-users.mjs   # creates auth users first
 *   node database/seed-data/seed-all-data.mjs      # seeds all feature data
 *   node database/seed-data/seed-all-data.mjs --skip-auth  # skip auth step
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';

import { FIRM_A_ID, FIRM_B_ID } from './seed-modules/_shared.mjs';

// ---------------------------------------------------------------------------
// 1. Load environment
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
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
  } catch {
    console.error(`\u274C Could not read ${filePath}`);
    process.exit(1);
  }
  return env;
}

const env = loadEnv(envPath);
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('\u274C Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 2. Create Supabase client (service_role bypasses RLS)
// ---------------------------------------------------------------------------

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------------------
// 3. Helper: look up Firm A users by email
// ---------------------------------------------------------------------------

async function lookupFirmAUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, user_type')
    .eq('law_firm_id', FIRM_A_ID);
  if (error) throw new Error(`Failed to look up Firm A users: ${error.message}`);
  if (!data || data.length === 0) throw new Error('No Firm A users found. Run seed-auth-users.mjs first.');

  const byType = {};
  for (const u of data) {
    if (u.user_type === 'admin') byType.admin = u.id;
    if (u.user_type === 'lawyer' && !byType.lawyer) byType.lawyer = u.id;
    else if (u.user_type === 'lawyer' && byType.lawyer) byType.lawyer2 = u.id;
    if (u.user_type === 'staff') byType.staff = u.id;
  }

  if (!byType.admin || !byType.lawyer) {
    throw new Error(`Missing Firm A admin or lawyer. Found: ${JSON.stringify(byType)}`);
  }

  return byType;
}

async function lookupFirmBUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, user_type')
    .eq('law_firm_id', FIRM_B_ID);
  if (error) throw new Error(`Failed to look up Firm B users: ${error.message}`);
  if (!data || data.length === 0) throw new Error('No Firm B users found. Run seed-auth-users.mjs first.');

  const byType = {};
  for (const u of data) {
    if (u.user_type === 'admin') byType.admin = u.id;
    if (u.user_type === 'lawyer' && !byType.lawyer) byType.lawyer = u.id;
    else if (u.user_type === 'lawyer' && byType.lawyer) byType.lawyer2 = u.id;
    if (u.user_type === 'staff') byType.staff = u.id;
  }

  if (!byType.admin || !byType.lawyer) {
    throw new Error(`Missing Firm B admin or lawyer. Found: ${JSON.stringify(byType)}`);
  }

  return byType;
}

async function lookupClientUserId(email) {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .eq('user_type', 'client')
    .maybeSingle();
  if (error) {
    console.warn(`   \u26A0\uFE0F Could not look up client user ${email}: ${error.message}`);
    return null;
  }
  return data?.id ?? null;
}

// ---------------------------------------------------------------------------
// 4. Main
// ---------------------------------------------------------------------------

async function main() {
  const skipAuth = process.argv.includes('--skip-auth');

  console.log('\n\uD83C\uDFE2 Prima Facie \u2014 Comprehensive Seed Data\n');
  console.log(`   Supabase URL: ${supabaseUrl}`);
  console.log(`   Skip auth:    ${skipAuth}\n`);

  // Step 1: Optionally run seed-auth-users.mjs
  if (!skipAuth) {
    console.log('\uD83D\uDD10 Step 1: Running seed-auth-users.mjs...');
    try {
      const authScript = resolve(__dirname, 'seed-auth-users.mjs');
      execSync(`node "${authScript}"`, { stdio: 'inherit', cwd: projectRoot });
      console.log('');
    } catch (err) {
      console.error('\u274C seed-auth-users.mjs failed. Continuing with data seed anyway...\n');
    }
  } else {
    console.log('\u23E9 Skipping auth seed (--skip-auth)\n');
  }

  // Step 2: Look up user IDs
  console.log('\uD83D\uDD0D Looking up user IDs...');
  const firmAUsers = await lookupFirmAUsers();
  const firmBUsers = await lookupFirmBUsers();
  const firmAClientUserId = await lookupClientUserId('cliente@davilareisadv.com.br');
  const firmBClientUserId = await lookupClientUserId('cliente@silvasantos.adv.br');

  console.log(`   Firm A: admin=${firmAUsers.admin?.slice(0,8)}... lawyer=${firmAUsers.lawyer?.slice(0,8)}... staff=${firmAUsers.staff?.slice(0,8)}...`);
  console.log(`   Firm B: admin=${firmBUsers.admin?.slice(0,8)}... lawyer=${firmBUsers.lawyer?.slice(0,8)}... staff=${firmBUsers.staff?.slice(0,8)}...`);
  console.log(`   Firm A client user: ${firmAClientUserId ? firmAClientUserId.slice(0,8) + '...' : 'NOT FOUND'}`);
  console.log(`   Firm B client user: ${firmBClientUserId ? firmBClientUserId.slice(0,8) + '...' : 'NOT FOUND'}`);
  console.log('');

  // Context passed to all modules
  const ctx = {
    firmAUsers,
    firmBUsers,
    firmAClientUserId,
    firmBClientUserId,
  };

  // Step 3: Run modules in dependency order
  const modules = [
    { name: 'seed-core',          loader: () => import('./seed-modules/seed-core.mjs') },
    { name: 'seed-operations',    loader: () => import('./seed-modules/seed-operations.mjs') },
    { name: 'seed-billing',       loader: () => import('./seed-modules/seed-billing.mjs') },
    { name: 'seed-financial',     loader: () => import('./seed-modules/seed-financial.mjs') },
    { name: 'seed-datajud',       loader: () => import('./seed-modules/seed-datajud.mjs') },
    { name: 'seed-activity-logs', loader: () => import('./seed-modules/seed-activity-logs.mjs') },
  ];

  const results = [];

  for (const mod of modules) {
    console.log(`\uD83D\uDCE6 Running ${mod.name}...`);
    try {
      const { seed } = await mod.loader();
      const result = await seed(supabase, ctx);
      results.push(result);
      if (result.success) {
        console.log(`   \u2705 ${mod.name}: ${result.count} rows\n`);
      } else {
        console.error(`   \u274C ${mod.name}: ${result.error}\n`);
      }
    } catch (err) {
      const result = { module: mod.name, success: false, count: 0, error: err.message };
      results.push(result);
      console.error(`   \u274C ${mod.name}: ${err.message}\n`);
    }
  }

  // Step 4: Summary
  console.log('\n' + '='.repeat(70));
  console.log('SEED DATA SUMMARY');
  console.log('='.repeat(70));
  console.log(
    'Module'.padEnd(25) +
    'Status'.padEnd(10) +
    'Rows'.padEnd(8) +
    'Error'
  );
  console.log('-'.repeat(70));

  let totalRows = 0;
  let failures = 0;

  for (const r of results) {
    const status = r.success ? '\u2705 OK' : '\u274C FAIL';
    const error = r.error ? r.error.slice(0, 30) : '';
    console.log(
      r.module.padEnd(25) +
      status.padEnd(10) +
      String(r.count).padEnd(8) +
      error
    );
    totalRows += r.count;
    if (!r.success) failures++;
  }

  console.log('-'.repeat(70));
  console.log(`Total: ${totalRows} rows across ${results.length} modules`);
  if (failures > 0) {
    console.log(`\u26A0\uFE0F  ${failures} module(s) failed.`);
  }
  console.log('='.repeat(70));

  // Verification checklist
  console.log('\n\uD83D\uDD0D Verification checklist:');
  console.log('   1. Login as admin@davilareisadv.com.br  \u2192 /dashboard (matters, tasks, revenue)');
  console.log('   2. Login as cliente@davilareisadv.com.br \u2192 /portal/client (linked matters + invoices)');
  console.log('   3. /calendar \u2192 court dates, tasks, invoice due dates');
  console.log('   4. /messages \u2192 conversation threads (5+ per firm)');
  console.log('   5. /billing \u2192 invoices with draft/sent/paid/overdue');
  console.log('   6. /billing/financial-dashboard \u2192 vendors, bills, AP/AR');
  console.log('   7. Login as admin@silvasantos.adv.br \u2192 ONLY Firm B data (isolation)');
  console.log('   8. Login as superadmin@primafacie.com.br \u2192 /platform (both firms)');
  console.log('   9. /reports \u2192 charts with real data\n');

  process.exit(failures > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('\n\uD83D\uDCA5 Fatal error:', err.message);
  process.exit(1);
});
