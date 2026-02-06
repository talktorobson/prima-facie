# Database Test Suite - Prima Facie Phase 8.7

This directory contains comprehensive database tests for the Prima Facie legal management system. The test suite covers all aspects of the database schema, functionality, and performance.

## Test Categories

### 1. Schema Validation Tests
- **File**: `schema-validation.test.js`
- **Purpose**: Validate table structures, constraints, indexes for all 28 tables
- **Coverage**: Data types, constraints, foreign keys, unique keys, indexes

### 2. Data Integrity Tests
- **File**: `data-integrity.test.js`
- **Purpose**: Test foreign key relationships, check constraints, unique constraints
- **Coverage**: Referential integrity, constraint violations, cascade operations

### 3. Function Tests
- **File**: `functions.test.js`
- **Purpose**: Test all PostgreSQL functions
- **Coverage**: 
  - `generate_invoice_number()`
  - `calculate_billable_amount()`
  - `update_invoice_total()`
  - `update_bill_total()`
  - `update_daily_time_summary()`
  - `check_budget_alert()`

### 4. Trigger Tests
- **File**: `triggers.test.js`
- **Purpose**: Test all database triggers
- **Coverage**: 
  - Invoice number generation
  - Automatic total calculations
  - Time summary updates
  - Budget alerts

### 5. Row Level Security (RLS) Tests
- **File**: `rls-policies.test.js`
- **Purpose**: Test RLS policies for multi-tenant security
- **Coverage**: Insert, select, update, delete policies per law firm

### 6. Data Seeding Tests
- **File**: `data-seeding.test.js`
- **Purpose**: Test default data insertion and seed scripts
- **Coverage**: Expense categories, templates, vendors, default settings

### 7. Performance Tests
- **File**: `performance.test.js`
- **Purpose**: Test query performance and index usage
- **Coverage**: Query execution plans, index effectiveness, slow query detection

### 8. Transaction Tests
- **File**: `transactions.test.js`
- **Purpose**: Test ACID compliance and rollback scenarios
- **Coverage**: Concurrent transactions, rollback testing, deadlock handling

### 9. Data Validation Tests
- **File**: `data-validation.test.js`
- **Purpose**: Test Brazilian business rules and data formats
- **Coverage**: CNPJ/CPF validation, currency formats, Brazilian tax rules

### 10. Views and Reporting Tests
- **File**: `views-reporting.test.js`
- **Purpose**: Test database views and reporting functionality
- **Coverage**: All views, complex aggregations, performance

### 11. Migration Tests
- **File**: `migrations.test.js`
- **Purpose**: Test database migration scripts and rollbacks
- **Coverage**: Forward migrations, rollback procedures, data preservation

### 12. Concurrent Access Tests
- **File**: `concurrent-access.test.js`
- **Purpose**: Test concurrent database operations
- **Coverage**: Race conditions, locking, deadlock prevention

### 13. Backup and Restore Tests
- **File**: `backup-restore.test.js`
- **Purpose**: Test backup and restore procedures
- **Coverage**: Data consistency, backup integrity, restore validation

## Test Configuration

### Environment Setup
- **Database**: PostgreSQL 15+ with required extensions
- **Test Runner**: Jest with custom PostgreSQL helpers
- **Connection**: Dedicated test database with isolated schemas

### Running Tests

```bash
# Run all database tests
npm run test:database

# Run specific test category
npm run test -- tests/database/schema-validation.test.js

# Run with coverage
npm run test:coverage -- tests/database/
```

### Test Data Management
- Each test suite creates its own isolated test data
- Automatic cleanup after test completion
- Snapshots for complex data validation
- Performance benchmarks for regression testing

## Database Schema Coverage

### Core Tables (28 total)
1. **Time Tracking** (7 tables)
   - `time_entries`
   - `time_entry_templates`
   - `lawyer_billing_rates`
   - `subscription_time_allocations`
   - `time_entry_allocations`
   - `daily_time_summaries`
   - `active_time_sessions`

2. **Invoice Management** (9 tables)
   - `invoices`
   - `invoice_line_items`
   - `subscription_invoices`
   - `case_invoices`
   - `payment_plan_invoices`
   - `time_based_invoices`
   - `invoice_payments`
   - `invoice_templates`
   - `invoice_generation_logs`

3. **Financial Management** (8 tables)
   - `vendors`
   - `expense_categories`
   - `bills`
   - `bill_payments`
   - `payment_collections`
   - `payment_reminders`
   - `financial_documents`
   - `financial_alerts`

4. **Supporting Tables** (4 tables)
   - Various lookup and configuration tables

### Key Features Tested
- Multi-tenant architecture (Row Level Security)
- Brazilian business compliance (CNPJ/CPF)
- Complex financial calculations
- Time tracking with multiple billing models
- Automated invoice generation
- Payment processing workflows
- Budget management and alerts
- Comprehensive audit trails

## Maintenance

### Regular Tasks
- Update test data for new features
- Performance regression testing
- Schema migration validation
- Security policy updates

### Test Data Generation
- Use `database/SEED_DEFAULT_DATA.sql` for base data
- Generate realistic test scenarios
- Maintain referential integrity
- Include edge cases and boundary conditions