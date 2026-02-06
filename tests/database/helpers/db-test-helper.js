/**
 * Database Test Helper Utilities
 * Provides common database testing functionality for Prima Facie
 */

const { createClient } = require('@supabase/supabase-js');

class DatabaseTestHelper {
  constructor() {
    this.supabase = null;
    this.testLawFirmId = null;
    this.testUserId = null;
    this.testClientId = null;
    this.createdRecords = new Map(); // Track created records for cleanup
  }

  /**
   * Initialize test database connection
   */
  async initialize() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for testing
    );

    // Create test law firm
    const { data: lawFirm, error: lawFirmError } = await this.supabase
      .from('law_firms')
      .insert({
        name: 'Test Law Firm - ' + Date.now(),
        cnpj: this.generateTestCNPJ(),
        email: 'test@testfirm.com',
        phone: '11999999999'
      })
      .select()
      .single();

    if (lawFirmError) throw new Error(`Failed to create test law firm: ${lawFirmError.message}`);
    
    this.testLawFirmId = lawFirm.id;
    this.trackRecord('law_firms', lawFirm.id);

    // Create test user
    const { data: user, error: userError } = await this.supabase
      .from('users')
      .insert({
        law_firm_id: this.testLawFirmId,
        email: `testuser${Date.now()}@test.com`,
        full_name: 'Test User',
        role: 'lawyer'
      })
      .select()
      .single();

    if (userError) throw new Error(`Failed to create test user: ${userError.message}`);
    
    this.testUserId = user.id;
    this.trackRecord('users', user.id);

    // Create test client
    const { data: client, error: clientError } = await this.supabase
      .from('clients')
      .insert({
        law_firm_id: this.testLawFirmId,
        name: 'Test Client - ' + Date.now(),
        email: 'testclient@test.com',
        client_type: 'individual',
        cpf: this.generateTestCPF()
      })
      .select()
      .single();

    if (clientError) throw new Error(`Failed to create test client: ${clientError.message}`);
    
    this.testClientId = client.id;
    this.trackRecord('clients', client.id);
  }

  /**
   * Track created records for cleanup
   */
  trackRecord(table, id) {
    if (!this.createdRecords.has(table)) {
      this.createdRecords.set(table, []);
    }
    this.createdRecords.get(table).push(id);
  }

  /**
   * Clean up test data
   */
  async cleanup() {
    if (!this.supabase) return;

    // Delete in reverse dependency order
    const cleanupOrder = [
      'invoice_payments',
      'invoice_line_items',
      'subscription_invoices',
      'case_invoices',
      'payment_plan_invoices',
      'time_based_invoices',
      'invoices',
      'bill_payments',
      'bills',
      'payment_collections',
      'payment_reminders',
      'financial_documents',
      'financial_alerts',
      'time_entry_allocations',
      'time_entries',
      'time_entry_templates',
      'lawyer_billing_rates',
      'subscription_time_allocations',
      'daily_time_summaries',
      'active_time_sessions',
      'expense_categories',
      'vendors',
      'clients',
      'users',
      'law_firms'
    ];

    for (const table of cleanupOrder) {
      const records = this.createdRecords.get(table);
      if (records && records.length > 0) {
        await this.supabase
          .from(table)
          .delete()
          .in('id', records);
      }
    }

    this.createdRecords.clear();
  }

  /**
   * Execute raw SQL query
   */
  async executeSQL(sql, params = []) {
    const { data, error } = await this.supabase.rpc('execute_sql', {
      sql_query: sql,
      parameters: params
    });

    if (error) throw new Error(`SQL execution failed: ${error.message}`);
    return data;
  }

  /**
   * Check if table exists
   */
  async tableExists(tableName) {
    const { data, error } = await this.supabase.rpc('check_table_exists', {
      table_name: tableName
    });

    if (error) throw error;
    return data;
  }

  /**
   * Get table schema information
   */
  async getTableSchema(tableName) {
    const { data, error } = await this.supabase.rpc('get_table_schema', {
      table_name: tableName
    });

    if (error) throw error;
    return data;
  }

  /**
   * Get table constraints
   */
  async getTableConstraints(tableName) {
    const { data, error } = await this.supabase.rpc('get_table_constraints', {
      table_name: tableName
    });

    if (error) throw error;
    return data;
  }

  /**
   * Get table indexes
   */
  async getTableIndexes(tableName) {
    const { data, error } = await this.supabase.rpc('get_table_indexes', {
      table_name: tableName
    });

    if (error) throw error;
    return data;
  }

  /**
   * Create test time entry
   */
  async createTestTimeEntry(overrides = {}) {
    const timeEntry = {
      law_firm_id: this.testLawFirmId,
      user_id: this.testUserId,
      entry_type: 'case_work',
      entry_status: 'approved',
      duration_minutes: 120,
      break_minutes: 10,
      activity_description: 'Test legal work',
      is_billable: true,
      billable_rate: 200.00,
      entry_date: new Date().toISOString().split('T')[0],
      ...overrides
    };

    const { data, error } = await this.supabase
      .from('time_entries')
      .insert(timeEntry)
      .select()
      .single();

    if (error) throw new Error(`Failed to create test time entry: ${error.message}`);
    
    this.trackRecord('time_entries', data.id);
    return data;
  }

  /**
   * Create test invoice
   */
  async createTestInvoice(overrides = {}) {
    const invoice = {
      law_firm_id: this.testLawFirmId,
      client_id: this.testClientId,
      invoice_type: 'case_billing',
      invoice_status: 'draft',
      subtotal: 1000.00,
      tax_amount: 100.00,
      discount_amount: 0.00,
      total_amount: 1100.00,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      payment_terms: '30_days',
      description: 'Test invoice',
      ...overrides
    };

    const { data, error } = await this.supabase
      .from('invoices')
      .insert(invoice)
      .select()
      .single();

    if (error) throw new Error(`Failed to create test invoice: ${error.message}`);
    
    this.trackRecord('invoices', data.id);
    return data;
  }

  /**
   * Create test vendor
   */
  async createTestVendor(overrides = {}) {
    const vendor = {
      law_firm_id: this.testLawFirmId,
      vendor_type: 'supplier',
      name: 'Test Vendor - ' + Date.now(),
      cnpj: this.generateTestCNPJ(),
      email: 'vendor@test.com',
      phone: '11888888888',
      vendor_status: 'active',
      preferred_payment_method: 'bank_transfer',
      payment_terms: '30_days',
      ...overrides
    };

    const { data, error } = await this.supabase
      .from('vendors')
      .insert(vendor)
      .select()
      .single();

    if (error) throw new Error(`Failed to create test vendor: ${error.message}`);
    
    this.trackRecord('vendors', data.id);
    return data;
  }

  /**
   * Create test bill
   */
  async createTestBill(vendorId, overrides = {}) {
    const bill = {
      law_firm_id: this.testLawFirmId,
      vendor_id: vendorId,
      bill_number: 'TEST-BILL-' + Date.now(),
      vendor_invoice_number: 'VENDOR-' + Date.now(),
      subtotal: 500.00,
      tax_amount: 50.00,
      discount_amount: 0.00,
      total_amount: 550.00,
      bill_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      bill_status: 'pending',
      description: 'Test bill',
      ...overrides
    };

    const { data, error } = await this.supabase
      .from('bills')
      .insert(bill)
      .select()
      .single();

    if (error) throw new Error(`Failed to create test bill: ${error.message}`);
    
    this.trackRecord('bills', data.id);
    return data;
  }

  /**
   * Generate test CNPJ
   */
  generateTestCNPJ() {
    // Generate a valid CNPJ format for testing (not a real CNPJ)
    const base = '12345678000';
    const digits = this.calculateCNPJDigits(base);
    return base + digits;
  }

  /**
   * Generate test CPF
   */
  generateTestCPF() {
    // Generate a valid CPF format for testing (not a real CPF)
    const base = '123456789';
    const digits = this.calculateCPFDigits(base);
    return base + digits;
  }

  /**
   * Calculate CNPJ check digits
   */
  calculateCNPJDigits(base) {
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    
    let sum1 = 0;
    for (let i = 0; i < 12; i++) {
      sum1 += parseInt(base[i]) * weights1[i];
    }
    const digit1 = sum1 % 11 < 2 ? 0 : 11 - (sum1 % 11);
    
    const baseWithDigit1 = base + digit1;
    let sum2 = 0;
    for (let i = 0; i < 13; i++) {
      sum2 += parseInt(baseWithDigit1[i]) * weights2[i];
    }
    const digit2 = sum2 % 11 < 2 ? 0 : 11 - (sum2 % 11);
    
    return digit1.toString() + digit2.toString();
  }

  /**
   * Calculate CPF check digits
   */
  calculateCPFDigits(base) {
    let sum1 = 0;
    for (let i = 0; i < 9; i++) {
      sum1 += parseInt(base[i]) * (10 - i);
    }
    const digit1 = sum1 % 11 < 2 ? 0 : 11 - (sum1 % 11);
    
    const baseWithDigit1 = base + digit1;
    let sum2 = 0;
    for (let i = 0; i < 10; i++) {
      sum2 += parseInt(baseWithDigit1[i]) * (11 - i);
    }
    const digit2 = sum2 % 11 < 2 ? 0 : 11 - (sum2 % 11);
    
    return digit1.toString() + digit2.toString();
  }

  /**
   * Wait for async operations
   */
  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate random UUID for testing
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Get current test context
   */
  getTestContext() {
    return {
      lawFirmId: this.testLawFirmId,
      userId: this.testUserId,
      clientId: this.testClientId,
      supabase: this.supabase
    };
  }
}

module.exports = DatabaseTestHelper;