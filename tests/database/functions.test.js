/**
 * Database Functions Test Suite
 * Tests all PostgreSQL functions including invoice generation, calculations, and business logic
 */

const DatabaseTestHelper = require('./helpers/db-test-helper');

describe('Database Functions Tests', () => {
  let dbHelper;
  let testContext;

  beforeAll(async () => {
    dbHelper = new DatabaseTestHelper();
    await dbHelper.initialize();
    testContext = dbHelper.getTestContext();
  });

  afterAll(async () => {
    if (dbHelper) {
      await dbHelper.cleanup();
    }
  });

  describe('generate_invoice_number() Function', () => {
    test('Should generate unique invoice numbers for different types', async () => {
      const invoiceTypes = ['subscription', 'case_billing', 'payment_plan', 'time_based', 'hybrid', 'adjustment', 'late_fee'];
      const generatedNumbers = new Set();

      for (const type of invoiceTypes) {
        const { data, error } = await testContext.supabase.rpc('generate_invoice_number', {
          p_law_firm_id: testContext.lawFirmId,
          p_invoice_type: type
        });

        expect(error).toBeNull();
        expect(data).toBeTruthy();
        expect(typeof data).toBe('string');
        
        // Should not be duplicate
        expect(generatedNumbers.has(data)).toBe(false);
        generatedNumbers.add(data);

        // Should match expected format
        const currentYear = new Date().getFullYear();
        expect(data).toMatch(new RegExp(`^[A-Z]+-${currentYear}-\\d{6}$`));
      }
    });

    test('Should generate correct prefixes for invoice types', async () => {
      const typeToPrefix = {
        'subscription': 'SUB',
        'case_billing': 'CASE',
        'payment_plan': 'PLAN',
        'time_based': 'TIME',
        'hybrid': 'HYB',
        'adjustment': 'ADJ',
        'late_fee': 'LATE'
      };

      for (const [type, expectedPrefix] of Object.entries(typeToPrefix)) {
        const { data } = await testContext.supabase.rpc('generate_invoice_number', {
          p_law_firm_id: testContext.lawFirmId,
          p_invoice_type: type
        });

        expect(data.startsWith(expectedPrefix)).toBe(true);
      }
    });

    test('Should increment sequence numbers correctly', async () => {
      const invoiceType = 'case_billing';
      const numbers = [];

      // Generate 3 consecutive numbers
      for (let i = 0; i < 3; i++) {
        const { data } = await testContext.supabase.rpc('generate_invoice_number', {
          p_law_firm_id: testContext.lawFirmId,
          p_invoice_type: invoiceType
        });
        numbers.push(data);
      }

      // Extract sequence numbers
      const sequences = numbers.map(num => {
        const parts = num.split('-');
        return parseInt(parts[2]);
      });

      // Should be consecutive
      expect(sequences[1]).toBe(sequences[0] + 1);
      expect(sequences[2]).toBe(sequences[1] + 1);
    });

    test('Should handle different law firms separately', async () => {
      // Create second law firm
      const { data: secondLawFirm } = await testContext.supabase
        .from('law_firms')
        .insert({
          name: 'Second Test Law Firm',
          cnpj: dbHelper.generateTestCNPJ(),
          email: 'second@test.com'
        })
        .select()
        .single();

      dbHelper.trackRecord('law_firms', secondLawFirm.id);

      // Generate invoice numbers for both law firms
      const { data: number1 } = await testContext.supabase.rpc('generate_invoice_number', {
        p_law_firm_id: testContext.lawFirmId,
        p_invoice_type: 'case_billing'
      });

      const { data: number2 } = await testContext.supabase.rpc('generate_invoice_number', {
        p_law_firm_id: secondLawFirm.id,
        p_invoice_type: 'case_billing'
      });

      // Should be different
      expect(number1).not.toBe(number2);
      
      // Both should start with CASE and current year
      const currentYear = new Date().getFullYear();
      expect(number1).toMatch(new RegExp(`^CASE-${currentYear}-\\d{6}$`));
      expect(number2).toMatch(new RegExp(`^CASE-${currentYear}-\\d{6}$`));
    });

    test('Should use default prefix for unknown types', async () => {
      const { data } = await testContext.supabase.rpc('generate_invoice_number', {
        p_law_firm_id: testContext.lawFirmId,
        p_invoice_type: 'unknown_type'
      });

      expect(data.startsWith('INV')).toBe(true);
    });
  });

  describe('calculate_billable_amount() Function', () => {
    test('Should calculate correct billable amount for time entry', async () => {
      // Create time entry with specific rate and duration
      const timeEntry = await dbHelper.createTestTimeEntry({
        duration_minutes: 90,
        break_minutes: 15,
        billable_rate: 300.00,
        is_billable: true
      });

      const { data: amount, error } = await testContext.supabase.rpc('calculate_billable_amount', {
        p_time_entry_id: timeEntry.id
      });

      expect(error).toBeNull();
      
      // 75 effective minutes (90 - 15) / 60 * 300 = 375.00
      expect(parseFloat(amount)).toBeCloseTo(375.00, 2);
    });

    test('Should return 0 for non-billable time entries', async () => {
      const timeEntry = await dbHelper.createTestTimeEntry({
        duration_minutes: 120,
        billable_rate: 200.00,
        is_billable: false
      });

      const { data: amount, error } = await testContext.supabase.rpc('calculate_billable_amount', {
        p_time_entry_id: timeEntry.id
      });

      expect(error).toBeNull();
      expect(parseFloat(amount)).toBe(0);
    });

    test('Should use default rate when no rate specified', async () => {
      const timeEntry = await dbHelper.createTestTimeEntry({
        duration_minutes: 60,
        break_minutes: 0,
        billable_rate: null,
        is_billable: true
      });

      const { data: amount, error } = await testContext.supabase.rpc('calculate_billable_amount', {
        p_time_entry_id: timeEntry.id
      });

      expect(error).toBeNull();
      
      // Should use default rate of 200.00
      expect(parseFloat(amount)).toBe(200.00);
    });

    test('Should lookup rate from lawyer_billing_rates table', async () => {
      // Create billing rate
      const { data: billingRate } = await testContext.supabase
        .from('lawyer_billing_rates')
        .insert({
          law_firm_id: testContext.lawFirmId,
          user_id: testContext.userId,
          rate_type: 'standard',
          hourly_rate: 250.00,
          effective_from: new Date().toISOString().split('T')[0],
          is_active: true
        })
        .select()
        .single();

      dbHelper.trackRecord('lawyer_billing_rates', billingRate.id);

      // Create time entry without specifying rate
      const timeEntry = await dbHelper.createTestTimeEntry({
        duration_minutes: 120,
        break_minutes: 0,
        billable_rate: null,
        is_billable: true
      });

      const { data: amount, error } = await testContext.supabase.rpc('calculate_billable_amount', {
        p_time_entry_id: timeEntry.id
      });

      expect(error).toBeNull();
      
      // Should use rate from billing_rates table: 2 hours * 250 = 500.00
      expect(parseFloat(amount)).toBe(500.00);
    });

    test('Should handle fractional hours correctly', async () => {
      const timeEntry = await dbHelper.createTestTimeEntry({
        duration_minutes: 45, // 0.75 hours
        break_minutes: 0,
        billable_rate: 200.00,
        is_billable: true
      });

      const { data: amount, error } = await testContext.supabase.rpc('calculate_billable_amount', {
        p_time_entry_id: timeEntry.id
      });

      expect(error).toBeNull();
      
      // 0.75 hours * 200 = 150.00
      expect(parseFloat(amount)).toBe(150.00);
    });
  });

  describe('update_invoice_total() Function', () => {
    test('Should calculate correct invoice total from line items', async () => {
      const invoice = await dbHelper.createTestInvoice({
        subtotal: 0,
        tax_amount: 0,
        total_amount: 0
      });

      // Add line items
      const lineItems = [
        { description: 'Service 1', quantity: 1, unit_price: 100.00, line_total: 100.00, tax_amount: 10.00 },
        { description: 'Service 2', quantity: 2, unit_price: 150.00, line_total: 300.00, tax_amount: 30.00 },
        { description: 'Service 3', quantity: 1, unit_price: 50.00, line_total: 50.00, tax_amount: 5.00 }
      ];

      for (const item of lineItems) {
        const { data } = await testContext.supabase
          .from('invoice_line_items')
          .insert({
            law_firm_id: testContext.lawFirmId,
            invoice_id: invoice.id,
            line_type: 'service_fee',
            ...item
          })
          .select()
          .single();

        dbHelper.trackRecord('invoice_line_items', data.id);
      }

      // Update invoice total
      const { error } = await testContext.supabase.rpc('update_invoice_total', {
        p_invoice_id: invoice.id
      });

      expect(error).toBeNull();

      // Fetch updated invoice
      const { data: updatedInvoice } = await testContext.supabase
        .from('invoices')
        .select('subtotal, tax_amount, total_amount')
        .eq('id', invoice.id)
        .single();

      expect(parseFloat(updatedInvoice.subtotal)).toBe(450.00); // 100 + 300 + 50
      expect(parseFloat(updatedInvoice.tax_amount)).toBe(45.00); // 10 + 30 + 5
      expect(parseFloat(updatedInvoice.total_amount)).toBe(495.00); // 450 + 45
    });

    test('Should account for discount when calculating total', async () => {
      const invoice = await dbHelper.createTestInvoice({
        subtotal: 0,
        tax_amount: 0,
        discount_amount: 50.00,
        total_amount: 0
      });

      // Add line item
      const { data: lineItem } = await testContext.supabase
        .from('invoice_line_items')
        .insert({
          law_firm_id: testContext.lawFirmId,
          invoice_id: invoice.id,
          line_type: 'service_fee',
          description: 'Service',
          quantity: 1,
          unit_price: 200.00,
          line_total: 200.00,
          tax_amount: 20.00
        })
        .select()
        .single();

      dbHelper.trackRecord('invoice_line_items', lineItem.id);

      // Update invoice total
      await testContext.supabase.rpc('update_invoice_total', {
        p_invoice_id: invoice.id
      });

      // Fetch updated invoice
      const { data: updatedInvoice } = await testContext.supabase
        .from('invoices')
        .select('subtotal, tax_amount, discount_amount, total_amount')
        .eq('id', invoice.id)
        .single();

      expect(parseFloat(updatedInvoice.subtotal)).toBe(200.00);
      expect(parseFloat(updatedInvoice.tax_amount)).toBe(20.00);
      expect(parseFloat(updatedInvoice.discount_amount)).toBe(50.00);
      expect(parseFloat(updatedInvoice.total_amount)).toBe(170.00); // 200 + 20 - 50
    });

    test('Should handle empty invoice (no line items)', async () => {
      const invoice = await dbHelper.createTestInvoice({
        subtotal: 100.00,
        tax_amount: 10.00,
        total_amount: 110.00
      });

      // Update invoice total (should reset to 0)
      await testContext.supabase.rpc('update_invoice_total', {
        p_invoice_id: invoice.id
      });

      const { data: updatedInvoice } = await testContext.supabase
        .from('invoices')
        .select('subtotal, tax_amount, total_amount')
        .eq('id', invoice.id)
        .single();

      expect(parseFloat(updatedInvoice.subtotal)).toBe(0);
      expect(parseFloat(updatedInvoice.tax_amount)).toBe(0);
      expect(parseFloat(updatedInvoice.total_amount)).toBe(0);
    });
  });

  describe('update_daily_time_summary() Function', () => {
    test('Should create new daily summary correctly', async () => {
      const summaryDate = new Date().toISOString().split('T')[0];

      // Create time entries for the day
      const timeEntries = [
        { entry_type: 'case_work', duration_minutes: 120, break_minutes: 10, is_billable: true, billable_rate: 200.00 },
        { entry_type: 'subscription_work', duration_minutes: 90, break_minutes: 5, is_billable: true, billable_rate: 150.00 },
        { entry_type: 'administrative', duration_minutes: 60, break_minutes: 0, is_billable: false, billable_rate: 0 }
      ];

      for (const entry of timeEntries) {
        await dbHelper.createTestTimeEntry({
          ...entry,
          entry_date: summaryDate
        });
      }

      // Update daily summary
      const { error } = await testContext.supabase.rpc('update_daily_time_summary', {
        p_law_firm_id: testContext.lawFirmId,
        p_user_id: testContext.userId,
        p_date: summaryDate
      });

      expect(error).toBeNull();

      // Fetch summary
      const { data: summary } = await testContext.supabase
        .from('daily_time_summaries')
        .select('*')
        .eq('law_firm_id', testContext.lawFirmId)
        .eq('user_id', testContext.userId)
        .eq('summary_date', summaryDate)
        .single();

      expect(summary.total_minutes).toBe(255); // 110 + 85 + 60 (effective minutes)
      expect(summary.billable_minutes).toBe(195); // 110 + 85
      expect(summary.non_billable_minutes).toBe(60);
      expect(summary.break_minutes).toBe(15); // 10 + 5 + 0
      expect(summary.case_work_minutes).toBe(110);
      expect(summary.subscription_work_minutes).toBe(85);
      expect(summary.administrative_minutes).toBe(60);
      expect(summary.total_entries).toBe(3);
      
      dbHelper.trackRecord('daily_time_summaries', summary.id);
    });

    test('Should update existing daily summary', async () => {
      const summaryDate = new Date().toISOString().split('T')[0];

      // Create initial time entry
      await dbHelper.createTestTimeEntry({
        entry_type: 'case_work',
        duration_minutes: 60,
        break_minutes: 0,
        is_billable: true,
        billable_rate: 200.00,
        entry_date: summaryDate
      });

      // Create initial summary
      await testContext.supabase.rpc('update_daily_time_summary', {
        p_law_firm_id: testContext.lawFirmId,
        p_user_id: testContext.userId,
        p_date: summaryDate
      });

      // Add another time entry
      await dbHelper.createTestTimeEntry({
        entry_type: 'case_work',
        duration_minutes: 90,
        break_minutes: 10,
        is_billable: true,
        billable_rate: 200.00,
        entry_date: summaryDate
      });

      // Update summary again
      await testContext.supabase.rpc('update_daily_time_summary', {
        p_law_firm_id: testContext.lawFirmId,
        p_user_id: testContext.userId,
        p_date: summaryDate
      });

      // Fetch updated summary
      const { data: summary } = await testContext.supabase
        .from('daily_time_summaries')
        .select('*')
        .eq('law_firm_id', testContext.lawFirmId)
        .eq('user_id', testContext.userId)
        .eq('summary_date', summaryDate)
        .single();

      expect(summary.total_minutes).toBe(140); // 60 + 80 (effective minutes)
      expect(summary.billable_minutes).toBe(140);
      expect(summary.case_work_minutes).toBe(140);
      expect(summary.total_entries).toBe(2);

      dbHelper.trackRecord('daily_time_summaries', summary.id);
    });
  });

  describe('Brazilian Tax Functions', () => {
    test('Should validate CNPJ correctly', async () => {
      // Valid CNPJ
      const validCNPJ = '11.444.777/0001-61';
      const { data: isValid } = await testContext.supabase.rpc('validate_cnpj', {
        cnpj_value: validCNPJ
      });
      expect(isValid).toBe(true);

      // Invalid CNPJ
      const invalidCNPJ = '11.444.777/0001-99';
      const { data: isInvalid } = await testContext.supabase.rpc('validate_cnpj', {
        cnpj_value: invalidCNPJ
      });
      expect(isInvalid).toBe(false);

      // Invalid format
      const invalidFormat = '123456';
      const { data: isInvalidFormat } = await testContext.supabase.rpc('validate_cnpj', {
        cnpj_value: invalidFormat
      });
      expect(isInvalidFormat).toBe(false);
    });

    test('Should validate CPF correctly', async () => {
      // Valid CPF
      const validCPF = '111.444.777-35';
      const { data: isValid } = await testContext.supabase.rpc('validate_cpf', {
        cpf_value: validCPF
      });
      expect(isValid).toBe(true);

      // Invalid CPF
      const invalidCPF = '111.444.777-99';
      const { data: isInvalid } = await testContext.supabase.rpc('validate_cpf', {
        cpf_value: invalidCPF
      });
      expect(isInvalid).toBe(false);

      // Invalid format
      const invalidFormat = '12345';
      const { data: isInvalidFormat } = await testContext.supabase.rpc('validate_cpf', {
        cpf_value: invalidFormat
      });
      expect(isInvalidFormat).toBe(false);
    });
  });

  describe('Utility Functions', () => {
    test('Should get table row count', async () => {
      const { data: count, error } = await testContext.supabase.rpc('get_table_row_count', {
        table_name: 'time_entries'
      });

      expect(error).toBeNull();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('Should analyze table statistics', async () => {
      const { data: stats, error } = await testContext.supabase.rpc('analyze_table_stats', {
        table_name: 'invoices'
      });

      expect(error).toBeNull();
      expect(Array.isArray(stats)).toBe(true);
      expect(stats.length).toBeGreaterThan(0);
      
      const statNames = stats.map(s => s.stat_name);
      expect(statNames).toContain('row_count');
      expect(statNames).toContain('table_size');
      expect(statNames).toContain('index_size');
    });

    test('Should check index usage', async () => {
      const { data: indexUsage, error } = await testContext.supabase.rpc('check_index_usage', {
        table_name: 'time_entries'
      });

      expect(error).toBeNull();
      expect(Array.isArray(indexUsage)).toBe(true);
      
      if (indexUsage.length > 0) {
        const firstIndex = indexUsage[0];
        expect(firstIndex).toHaveProperty('index_name');
        expect(firstIndex).toHaveProperty('scans');
        expect(firstIndex).toHaveProperty('tuples_read');
        expect(firstIndex).toHaveProperty('usage_ratio');
      }
    });
  });

  describe('Error Handling', () => {
    test('Should handle invalid UUID parameters gracefully', async () => {
      await expect(async () => {
        await testContext.supabase.rpc('calculate_billable_amount', {
          p_time_entry_id: 'invalid-uuid'
        });
      }).rejects.toThrow();
    });

    test('Should handle non-existent records gracefully', async () => {
      const nonExistentId = dbHelper.generateUUID();
      
      const { data, error } = await testContext.supabase.rpc('calculate_billable_amount', {
        p_time_entry_id: nonExistentId
      });

      // Function should handle this gracefully (return null or 0)
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    test('Should handle null parameters appropriately', async () => {
      const { data, error } = await testContext.supabase.rpc('validate_cnpj', {
        cnpj_value: null
      });

      expect(error).toBeNull();
      expect(data).toBe(false);
    });
  });

  describe('Performance Tests', () => {
    test('Should execute invoice number generation efficiently', async () => {
      const startTime = Date.now();
      
      // Generate 10 invoice numbers
      const promises = Array.from({ length: 10 }, () =>
        testContext.supabase.rpc('generate_invoice_number', {
          p_law_firm_id: testContext.lawFirmId,
          p_invoice_type: 'case_billing'
        })
      );

      await Promise.all(promises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (< 5 seconds)
      expect(duration).toBeLessThan(5000);
    });

    test('Should handle bulk billable amount calculations efficiently', async () => {
      // Create multiple time entries
      const timeEntryPromises = Array.from({ length: 5 }, (_, i) =>
        dbHelper.createTestTimeEntry({
          duration_minutes: 60 + (i * 10),
          billable_rate: 200.00,
          is_billable: true
        })
      );

      const timeEntries = await Promise.all(timeEntryPromises);
      
      const startTime = Date.now();
      
      // Calculate amounts for all entries
      const calculationPromises = timeEntries.map(entry =>
        testContext.supabase.rpc('calculate_billable_amount', {
          p_time_entry_id: entry.id
        })
      );

      await Promise.all(calculationPromises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan(3000);
    });
  });
});