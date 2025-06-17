# Prima Facie Database Migration Instructions

## Overview
The Prima Facie application requires a complete database schema to function properly. Currently, only 2 basic tables exist, but the application needs 20+ tables for full functionality.

## Current Status
- ✅ **Existing**: `law_firms` (2 records), `users` (6 records)
- ❌ **Missing**: All core application tables

## Migration Steps

### Step 1: Apply Core Schema
**File**: `manual-migration-step1.sql`
**Tables**: contacts, matter_types, matters, matter_contacts

1. Open [Supabase Dashboard](https://supabase.com/dashboard/project/znupmkjfkrzddokfneaz)
2. Navigate to **SQL Editor**
3. Copy and paste the entire contents of `manual-migration-step1.sql`
4. Click **RUN** to execute
5. Verify no errors occur

### Step 2: Apply Supporting Tables
**File**: `manual-migration-step2.sql`  
**Tables**: tasks, time_entries, documents, invoices, messages, pipelines, activity_logs

1. In the same SQL Editor
2. Copy and paste the entire contents of `manual-migration-step2.sql`
3. Click **RUN** to execute
4. Verify no errors occur

### Step 3: Apply Billing System (Optional for Phase 8 completeness)
**File**: `database/FULL_DATABASE_MIGRATION.sql`
**Tables**: All billing, financial, and advanced features

1. Copy the remaining sections from the full migration script
2. Apply subscription plans, payment plans, financial tables
3. Apply time tracking enhancements
4. Apply Row Level Security policies

## Verification

After each step, run:
```bash
node verify-migration.js
```

This will show the progress and confirm which tables were created successfully.

## Expected Results

After complete migration:
- ✅ 20+ database tables created
- ✅ All relationships and constraints applied  
- ✅ Row Level Security enabled
- ✅ Indexes created for performance
- ✅ Application fully functional

## Troubleshooting

If errors occur:
1. Check for typos in table names
2. Ensure proper UUID extension is enabled
3. Verify foreign key references exist
4. Run statements individually if batch fails

## Support

The migration scripts are designed to be idempotent (safe to run multiple times) using `IF NOT EXISTS` clauses.