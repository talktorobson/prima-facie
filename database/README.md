# Prima Facie Database

**Status**: Production Ready (June 2025)

The Prima Facie database is fully deployed to Supabase with 50+ tables, Row Level Security, and realistic seed data.

## Schema Overview

### Core Legal Practice
```
contacts              # Clients with CPF/CNPJ validation
matter_types          # Legal case categories
matters               # Legal cases with court information
matter_contacts       # Client-matter relationships
tasks                 # Case task management
time_entries          # Billable time tracking
```

### Business Operations
```
documents             # Legal document storage
messages              # Client communication
pipeline_stages       # Sales pipeline stages
pipeline_cards        # Sales opportunities
activity_logs         # System audit trail
```

### Billing & Financial
```
subscription_plans    # Service tier definitions
case_types            # Case billing configurations
client_subscriptions  # Active subscription tracking
discount_rules        # Automated pricing incentives
invoices              # Multi-modal invoice system
invoice_line_items    # Detailed invoice breakdowns
vendors               # Supplier and court management
bills                 # Accounts payable
```

### DataJud CNJ Integration
```
datajud_*             # CNJ database integration tables
                      # Case enrichment, timeline, participants
```

For a detailed visual reference, see [Schema Overview](docs/schema_overview.md).

## Security

All tables are protected by Row Level Security (RLS) policies enforcing multi-tenant isolation by `law_firm_id`. See `database/migrations/` for policy definitions.

## Migration History

Migrations were applied manually via the Supabase SQL Editor. All scripts use `IF NOT EXISTS` and are idempotent.

### Schema Migrations (applied in order)

| Step | File | Tables |
|------|------|--------|
| 1 | `manual-migration-step1.sql` | Core legal practice: contacts, matter_types, matters, matter_contacts |
| 2 | `manual-migration-step2.sql` | Supporting: tasks, time_entries, documents, invoices, messages, pipelines, activity_logs |
| 3 | `manual-migration-step3-advanced.sql` | Billing & financial: subscription_plans, case_types, client_subscriptions, discount_rules, vendors, bills |
| 4 | `migrations/datajud-schema.sql` | DataJud CNJ integration tables |

### Row Level Security

| Migration | Scope |
|-----------|-------|
| `database/migrations/002_row_level_security.sql` | RLS for core tables |
| `database/migrations/003_billing_rls.sql` | RLS for billing tables |
| `database/migrations/004_super_admin.sql` | Super admin role policies |

### How to Apply a New Migration

1. Open [Supabase SQL Editor](https://supabase.com/dashboard)
2. Paste the SQL script contents
3. Click **RUN**
4. Verify with: `node verify-migration.js`

## Seed Data

Seed data was applied in 4 steps plus the DataJud dataset. All scripts are idempotent (safe to re-run).

### Application Order

| Step | File | Content |
|------|------|---------|
| 1 | `seed-data-step1-core-FIXED.sql` | 8 matter types, 8 clients (CPF/CNPJ), 8 matters, 6 tasks |
| 2 | `seed-data-step2-billing.sql` | 6 subscription plans (R$ 890-8,500/mo), 8 case types, 4 discount rules |
| 3 | `seed-data-step3-timetracking.sql` | 18 time entries, 7 invoices (paid/pending/overdue), 10+ line items |
| 4 | `seed-data-step4-financial.sql` | 7 vendors, 9 bills, 7 messages, 7 documents, pipeline stages + cards |
| 5 | `seed-data/datajud-seed-data-SAFE.sql` | 5 DataJud cases with CNJ movements and participants |

### Current Data Summary

- 2 Law Firms (Davila Reis Advocacia, Silva & Associados)
- 6 Users (linked to Supabase Auth)
- 8 Clients (individual CPF + corporate CNPJ)
- 8 Legal Matters across practice areas
- 5 DataJud-enriched cases with real court data
- 18 Time entries with market-rate billing
- 6 Subscription plans
- Complete financial data (vendors, bills, invoices, discounts)

### How to Apply Seed Data

1. Ensure all migrations have been applied first
2. Open [Supabase SQL Editor](https://supabase.com/dashboard)
3. Execute each seed script in order (Step 1 through 5)
4. Verify with: `node verify-seed-data.js`

### Resetting Seed Data

To clear seed data while keeping the schema:
```sql
DELETE FROM invoice_line_items;
DELETE FROM invoices;
DELETE FROM time_entries;
DELETE FROM matter_contacts;
DELETE FROM matters;
DELETE FROM contacts WHERE law_firm_id IN (
  '123e4567-e89b-12d3-a456-426614174000',
  '234e4567-e89b-12d3-a456-426614174001'
);
-- Continue for other tables as needed
```

## Verification Tools

```bash
# Verify schema
node verify-migration.js

# Verify seed data
node verify-seed-data.js
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Missing required tables" | Apply migration scripts first |
| "Table does not exist" | Optional billing tables — continue with core seeding |
| "Permission denied" | Ensure SUPABASE_SERVICE_ROLE_KEY is set in .env.local |
| "Duplicate key" | Seed data already applied, safe to ignore |
