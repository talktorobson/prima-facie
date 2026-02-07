/**
 * Shared constants, date helpers, and upsert utilities for seed modules.
 */

// ---------------------------------------------------------------------------
// Firm IDs
// ---------------------------------------------------------------------------
export const FIRM_A_ID = '123e4567-e89b-12d3-a456-426614174000';
export const FIRM_B_ID = 'b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0';

// ---------------------------------------------------------------------------
// User IDs (Firm A — from seed-auth-users.mjs / 06_second_firm.sql)
// These are profile `users.id` values, NOT auth_user_id.
// They'll be looked up at runtime by the orchestrator.
// ---------------------------------------------------------------------------

// Firm B user IDs (from 06_second_firm.sql — fixed)
export const FIRM_B_USERS = {
  admin:  'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1',
  lawyer: 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2',
  staff:  'b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3',
};

// ---------------------------------------------------------------------------
// Date helpers — all relative to NOW
// ---------------------------------------------------------------------------
const NOW = new Date();

/** Returns ISO timestamp string offset by `n` days from now. */
export function daysFromNow(n) {
  const d = new Date(NOW);
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

/** Returns ISO timestamp string `n` days in the past, optionally offset by hours. */
export function daysAgo(n, hoursOffset = 0) {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  if (hoursOffset) d.setHours(d.getHours() + hoursOffset);
  return d.toISOString();
}

/** Returns YYYY-MM-DD string offset by `n` days from now. */
export function dateOnly(n) {
  const d = new Date(NOW);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

/** Returns ISO timestamp at a specific hour today offset by `daysOffset` days. */
export function timestampAt(daysOffset, hour = 9, minute = 0) {
  const d = new Date(NOW);
  d.setDate(d.getDate() + daysOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// Upsert helper
// ---------------------------------------------------------------------------

/**
 * Upsert rows into a table, returning { count, error }.
 * @param {object} supabase - Supabase client
 * @param {string} table - Table name
 * @param {object[]} rows - Array of row objects
 * @param {string} onConflict - Conflict column(s), default 'id'
 */
export async function upsertRows(supabase, table, rows, onConflict = 'id') {
  if (!rows.length) return { count: 0, error: null };
  const { data, error } = await supabase
    .from(table)
    .upsert(rows, { onConflict, ignoreDuplicates: false })
    .select('id');
  if (error) return { count: 0, error };
  return { count: data?.length ?? rows.length, error: null };
}

/**
 * Delete then insert rows (for tables where we want fresh data each run).
 * @param {object} supabase - Supabase client
 * @param {string} table - Table name
 * @param {string} filterCol - Column to filter deletes on
 * @param {string[]} filterValues - Values to match for deletion
 * @param {object[]} rows - Rows to insert
 */
export async function replaceRows(supabase, table, filterCol, filterValues, rows) {
  if (!rows.length) return { count: 0, error: null };
  // Delete existing
  const { error: delErr } = await supabase
    .from(table)
    .delete()
    .in(filterCol, filterValues);
  if (delErr) return { count: 0, error: delErr };
  // Insert fresh
  const { data, error } = await supabase
    .from(table)
    .insert(rows)
    .select('id');
  if (error) return { count: 0, error };
  return { count: data?.length ?? rows.length, error: null };
}

// ---------------------------------------------------------------------------
// UUID prefix helper — generate deterministic UUIDs
// ---------------------------------------------------------------------------

/**
 * Generates a deterministic UUID from a prefix and index.
 * Format: pppppppp-pppp-4ppp-8ppp-ppppppppNNNN
 * where p = prefix char repeated, N = zero-padded index
 *
 * IMPORTANT: prefix chars MUST be valid hex [0-9a-f] only.
 * PostgreSQL UUID columns reject characters outside this range.
 *
 * @param {string} prefix - 2-char hex prefix (e.g., 'cf', 'a0', 'a1')
 * @param {number} index - Numeric index (1-9999)
 */
export function makeId(prefix, index) {
  const p = prefix.padEnd(2, '0').slice(0, 2);
  const hex = p[0].repeat(4) + p[1].repeat(4);
  const idx = index.toString(16).padStart(4, '0');
  return `${hex}-${p[0].repeat(4)}-4${p[1].repeat(3)}-8${p[0].repeat(3)}-${hex}${idx}`;
}

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------
export function log(msg) {
  console.log(`   ${msg}`);
}
