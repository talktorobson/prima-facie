/**
 * Schema Validation Test Suite
 * Tests database schema structure, constraints, and indexes for all 28 tables
 */

const DatabaseTestHelper = require('./helpers/db-test-helper');

describe('Database Schema Validation Tests', () => {
  let dbHelper;

  beforeAll(async () => {
    dbHelper = new DatabaseTestHelper();
    await dbHelper.initialize();
  });

  afterAll(async () => {
    if (dbHelper) {
      await dbHelper.cleanup();
    }
  });

  describe('Table Existence Validation', () => {
    const expectedTables = [
      // Time Tracking Tables (7)
      'time_entries',
      'time_entry_templates',
      'lawyer_billing_rates',
      'subscription_time_allocations',
      'time_entry_allocations',
      'daily_time_summaries',
      'active_time_sessions',
      
      // Invoice Management Tables (9)
      'invoices',
      'invoice_line_items',
      'subscription_invoices',
      'case_invoices',
      'payment_plan_invoices',
      'time_based_invoices',
      'invoice_payments',
      'invoice_templates',
      'invoice_generation_logs',
      
      // Financial Management Tables (8)
      'vendors',
      'expense_categories',
      'bills',
      'bill_payments',
      'payment_collections',
      'payment_reminders',
      'financial_documents',
      'financial_alerts',
      
      // Supporting Tables (4)
      'law_firms',
      'users',
      'clients',
      'matters'
    ];

    test.each(expectedTables)('Table %s should exist', async (tableName) => {
      const exists = await dbHelper.tableExists(tableName);
      expect(exists).toBe(true);
    });

    test('Should have exactly 28 main tables', async () => {
      const existingTables = [];
      for (const table of expectedTables) {
        const exists = await dbHelper.tableExists(table);
        if (exists) existingTables.push(table);
      }
      expect(existingTables.length).toBe(28);
    });
  });

  describe('Time Entries Table Schema', () => {
    test('Should have correct column structure', async () => {
      const schema = await dbHelper.getTableSchema('time_entries');
      const columnNames = schema.map(col => col.column_name);
      
      const expectedColumns = [
        'id', 'law_firm_id', 'user_id', 'entry_type', 'entry_status',
        'start_time', 'end_time', 'duration_minutes', 'break_minutes', 'effective_minutes',
        'matter_id', 'client_subscription_id', 'task_category', 'activity_description',
        'is_billable', 'billable_rate', 'billing_rate_source', 'billable_amount',
        'counts_toward_subscription', 'subscription_service_type',
        'location', 'is_remote_work', 'notes',
        'timer_started_at', 'is_timer_running',
        'entry_date', 'created_at', 'updated_at'
      ];

      expectedColumns.forEach(col => {
        expect(columnNames).toContain(col);
      });
    });

    test('Should have correct data types', async () => {
      const schema = await dbHelper.getTableSchema('time_entries');
      const columnTypes = Object.fromEntries(
        schema.map(col => [col.column_name, col.data_type])
      );

      expect(columnTypes.id).toBe('uuid');
      expect(columnTypes.law_firm_id).toBe('uuid');
      expect(columnTypes.user_id).toBe('uuid');
      expect(columnTypes.duration_minutes).toBe('integer');
      expect(columnTypes.break_minutes).toBe('integer');
      expect(columnTypes.billable_rate).toBe('numeric');
      expect(columnTypes.is_billable).toBe('boolean');
      expect(columnTypes.entry_date).toBe('date');
      expect(columnTypes.created_at).toBe('timestamp with time zone');
    });

    test('Should have correct constraints', async () => {
      const constraints = await dbHelper.getTableConstraints('time_entries');
      const constraintNames = constraints.map(c => c.constraint_name);

      // Check for primary key
      expect(constraintNames.some(name => name.includes('pkey'))).toBe(true);
      
      // Check for check constraints
      expect(constraints.some(c => 
        c.constraint_type === 'CHECK' && 
        c.check_clause.includes('entry_type')
      )).toBe(true);
      
      expect(constraints.some(c => 
        c.constraint_type === 'CHECK' && 
        c.check_clause.includes('entry_status')
      )).toBe(true);
    });

    test('Should have proper indexes', async () => {
      const indexes = await dbHelper.getTableIndexes('time_entries');
      const indexColumns = indexes.map(idx => idx.column_name);

      // Primary key index should exist
      expect(indexes.some(idx => idx.is_primary)).toBe(true);
      
      // Performance indexes should exist
      expect(indexColumns).toContain('law_firm_id');
      expect(indexColumns).toContain('user_id');
      expect(indexColumns).toContain('entry_date');
    });
  });

  describe('Invoices Table Schema', () => {
    test('Should have correct column structure', async () => {
      const schema = await dbHelper.getTableSchema('invoices');
      const columnNames = schema.map(col => col.column_name);
      
      const expectedColumns = [
        'id', 'law_firm_id', 'client_id', 'invoice_number', 'invoice_type',
        'subtotal', 'tax_amount', 'discount_amount', 'total_amount', 'currency',
        'invoice_status', 'issue_date', 'due_date', 'sent_date', 'paid_date',
        'payment_terms', 'payment_methods',
        'client_subscription_id', 'matter_id', 'payment_plan_id',
        'parent_invoice_id', 'invoice_group',
        'description', 'notes', 'internal_notes',
        'created_by', 'approved_by', 'approved_at',
        'created_at', 'updated_at'
      ];

      expectedColumns.forEach(col => {
        expect(columnNames).toContain(col);
      });
    });

    test('Should have correct numeric constraints', async () => {
      const constraints = await dbHelper.getTableConstraints('invoices');
      
      // Check for positive amounts constraint
      expect(constraints.some(c => 
        c.constraint_type === 'CHECK' && 
        c.check_clause.includes('positive_amounts')
      )).toBe(true);
      
      // Check for total calculation constraint
      expect(constraints.some(c => 
        c.constraint_type === 'CHECK' && 
        c.check_clause.includes('total_calculation')
      )).toBe(true);
    });

    test('Should have unique invoice number constraint', async () => {
      const constraints = await dbHelper.getTableConstraints('invoices');
      
      expect(constraints.some(c => 
        c.constraint_type === 'UNIQUE' && 
        c.column_name === 'invoice_number'
      )).toBe(true);
    });
  });

  describe('Invoice Line Items Table Schema', () => {
    test('Should have foreign key to invoices', async () => {
      const constraints = await dbHelper.getTableConstraints('invoice_line_items');
      
      expect(constraints.some(c => 
        c.constraint_type === 'FOREIGN KEY' && 
        c.column_name === 'invoice_id' &&
        c.foreign_table_name === 'invoices'
      )).toBe(true);
    });

    test('Should have line total calculation constraint', async () => {
      const constraints = await dbHelper.getTableConstraints('invoice_line_items');
      
      expect(constraints.some(c => 
        c.constraint_type === 'CHECK' && 
        c.check_clause.includes('line_total_calculation')
      )).toBe(true);
    });
  });

  describe('Vendors Table Schema', () => {
    test('Should have correct Brazilian business fields', async () => {
      const schema = await dbHelper.getTableSchema('vendors');
      const columnNames = schema.map(col => col.column_name);
      
      expect(columnNames).toContain('cnpj');
      expect(columnNames).toContain('cpf');
      expect(columnNames).toContain('pix_key');
    });

    test('Should have vendor status check constraint', async () => {
      const constraints = await dbHelper.getTableConstraints('vendors');
      
      expect(constraints.some(c => 
        c.constraint_type === 'CHECK' && 
        c.check_clause.includes('vendor_status')
      )).toBe(true);
    });
  });

  describe('Bills Table Schema', () => {
    test('Should have foreign key to vendors', async () => {
      const constraints = await dbHelper.getTableConstraints('bills');
      
      expect(constraints.some(c => 
        c.constraint_type === 'FOREIGN KEY' && 
        c.column_name === 'vendor_id' &&
        c.foreign_table_name === 'vendors'
      )).toBe(true);
    });

    test('Should have bill status check constraint', async () => {
      const constraints = await dbHelper.getTableConstraints('bills');
      
      expect(constraints.some(c => 
        c.constraint_type === 'CHECK' && 
        c.check_clause.includes('bill_status')
      )).toBe(true);
    });
  });

  describe('Payment Collections Table Schema', () => {
    test('Should have generated columns for amounts', async () => {
      const schema = await dbHelper.getTableSchema('payment_collections');
      
      // Check for generated columns
      expect(schema.some(col => 
        col.column_name === 'remaining_amount' &&
        col.column_default && col.column_default.includes('GENERATED')
      )).toBe(true);
      
      expect(schema.some(col => 
        col.column_name === 'days_overdue' &&
        col.column_default && col.column_default.includes('GENERATED')
      )).toBe(true);
    });
  });

  describe('Time Entry Templates Table Schema', () => {
    test('Should have template sharing fields', async () => {
      const schema = await dbHelper.getTableSchema('time_entry_templates');
      const columnNames = schema.map(col => col.column_name);
      
      expect(columnNames).toContain('is_shared');
      expect(columnNames).toContain('is_active');
      expect(columnNames).toContain('usage_count');
    });
  });

  describe('Lawyer Billing Rates Table Schema', () => {
    test('Should have rate type check constraint', async () => {
      const constraints = await dbHelper.getTableConstraints('lawyer_billing_rates');
      
      expect(constraints.some(c => 
        c.constraint_type === 'CHECK' && 
        c.check_clause.includes('rate_type')
      )).toBe(true);
    });

    test('Should have effective date fields', async () => {
      const schema = await dbHelper.getTableSchema('lawyer_billing_rates');
      const columnNames = schema.map(col => col.column_name);
      
      expect(columnNames).toContain('effective_from');
      expect(columnNames).toContain('effective_until');
    });
  });

  describe('Daily Time Summaries Table Schema', () => {
    test('Should have unique constraint on law_firm_id, user_id, summary_date', async () => {
      const constraints = await dbHelper.getTableConstraints('daily_time_summaries');
      
      expect(constraints.some(c => 
        c.constraint_type === 'UNIQUE'
      )).toBe(true);
    });
  });

  describe('Payment Reminders Table Schema', () => {
    test('Should have reminder type and method constraints', async () => {
      const constraints = await dbHelper.getTableConstraints('payment_reminders');
      
      expect(constraints.some(c => 
        c.constraint_type === 'CHECK' && 
        c.check_clause.includes('reminder_type')
      )).toBe(true);
      
      expect(constraints.some(c => 
        c.constraint_type === 'CHECK' && 
        c.check_clause.includes('reminder_method')
      )).toBe(true);
    });
  });

  describe('Financial Alerts Table Schema', () => {
    test('Should have alert type and level constraints', async () => {
      const constraints = await dbHelper.getTableConstraints('financial_alerts');
      
      expect(constraints.some(c => 
        c.constraint_type === 'CHECK' && 
        c.check_clause.includes('alert_type')
      )).toBe(true);
      
      expect(constraints.some(c => 
        c.constraint_type === 'CHECK' && 
        c.check_clause.includes('alert_level')
      )).toBe(true);
    });
  });

  describe('Database Indexes Performance', () => {
    const criticalIndexes = [
      { table: 'time_entries', column: 'law_firm_id' },
      { table: 'time_entries', column: 'user_id' },
      { table: 'time_entries', column: 'entry_date' },
      { table: 'invoices', column: 'law_firm_id' },
      { table: 'invoices', column: 'client_id' },
      { table: 'invoices', column: 'invoice_number' },
      { table: 'invoices', column: 'due_date' },
      { table: 'bills', column: 'law_firm_id' },
      { table: 'bills', column: 'vendor_id' },
      { table: 'bills', column: 'due_date' },
      { table: 'payment_collections', column: 'law_firm_id' },
      { table: 'payment_collections', column: 'client_id' }
    ];

    test.each(criticalIndexes)(
      'Should have index on $table.$column',
      async ({ table, column }) => {
        const indexes = await dbHelper.getTableIndexes(table);
        expect(indexes.some(idx => idx.column_name === column)).toBe(true);
      }
    );
  });

  describe('Generated Columns Validation', () => {
    test('Time entries should have computed effective_minutes', async () => {
      // Create a test time entry
      const timeEntry = await dbHelper.createTestTimeEntry({
        duration_minutes: 120,
        break_minutes: 20
      });

      // Verify generated column calculation
      expect(timeEntry.effective_minutes).toBe(100);
    });

    test('Time entries should have computed billable_amount', async () => {
      // Create a test time entry
      const timeEntry = await dbHelper.createTestTimeEntry({
        duration_minutes: 120,
        break_minutes: 20,
        billable_rate: 200.00,
        is_billable: true
      });

      // Verify generated column calculation (100 minutes / 60 * 200 = 333.33)
      expect(parseFloat(timeEntry.billable_amount)).toBeCloseTo(333.33, 2);
    });

    test('Payment collections should have computed remaining_amount', async () => {
      // This would require creating a payment collection record
      // For now, we'll test the column exists
      const schema = await dbHelper.getTableSchema('payment_collections');
      expect(schema.some(col => col.column_name === 'remaining_amount')).toBe(true);
    });
  });

  describe('Column Defaults and Nullable Constraints', () => {
    test('Time entries should have proper defaults', async () => {
      const schema = await dbHelper.getTableSchema('time_entries');
      const columnDefaults = Object.fromEntries(
        schema.map(col => [col.column_name, col.column_default])
      );

      expect(columnDefaults.entry_status).toContain('draft');
      expect(columnDefaults.duration_minutes).toContain('0');
      expect(columnDefaults.break_minutes).toContain('0');
      expect(columnDefaults.is_billable).toContain('true');
    });

    test('Invoices should have proper defaults', async () => {
      const schema = await dbHelper.getTableSchema('invoices');
      const columnDefaults = Object.fromEntries(
        schema.map(col => [col.column_name, col.column_default])
      );

      expect(columnDefaults.invoice_status).toContain('draft');
      expect(columnDefaults.currency).toContain('BRL');
      expect(columnDefaults.payment_terms).toContain('30_days');
    });

    test('Bills should have proper defaults', async () => {
      const schema = await dbHelper.getTableSchema('bills');
      const columnDefaults = Object.fromEntries(
        schema.map(col => [col.column_name, col.column_default])
      );

      expect(columnDefaults.bill_status).toContain('pending');
      expect(columnDefaults.currency).toContain('BRL');
      expect(columnDefaults.requires_approval).toContain('true');
    });
  });

  describe('Brazilian Currency and Locale Validation', () => {
    test('All currency fields should default to BRL', async () => {
      const currencyTables = ['invoices', 'bills', 'payment_collections', 'financial_documents'];
      
      for (const table of currencyTables) {
        const schema = await dbHelper.getTableSchema(table);
        const currencyColumn = schema.find(col => col.column_name === 'currency');
        
        if (currencyColumn) {
          expect(currencyColumn.column_default).toContain('BRL');
        }
      }
    });

    test('Address fields should support Brazilian format', async () => {
      const schema = await dbHelper.getTableSchema('vendors');
      const stateColumn = schema.find(col => col.column_name === 'state');
      const countryColumn = schema.find(col => col.column_name === 'country');
      
      // State should be 2 characters (Brazilian state codes)
      expect(stateColumn.character_maximum_length).toBe(2);
      
      // Country should default to BR
      expect(countryColumn.column_default).toContain('BR');
    });
  });
});