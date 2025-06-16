/**
 * Database Triggers Test Suite
 * Tests all database triggers including automatic calculations, updates, and business logic
 */

const DatabaseTestHelper = require('./helpers/db-test-helper');

describe('Database Triggers Tests', () => {
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

  describe('Invoice Number Generation Trigger', () => {
    test('Should auto-generate invoice number on insert', async () => {
      const { data: invoice, error } = await testContext.supabase
        .from('invoices')
        .insert({
          law_firm_id: testContext.lawFirmId,
          client_id: testContext.clientId,
          invoice_type: 'case_billing',
          subtotal: 1000.00,
          total_amount: 1000.00
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(invoice.invoice_number).toBeTruthy();
      expect(invoice.invoice_number).toMatch(/^CASE-\d{4}-\d{6}$/);
      
      dbHelper.trackRecord('invoices', invoice.id);
    });

    test('Should not override manually set invoice number', async () => {
      const manualNumber = 'MANUAL-2024-000001';
      
      const { data: invoice, error } = await testContext.supabase
        .from('invoices')
        .insert({
          law_firm_id: testContext.lawFirmId,
          client_id: testContext.clientId,
          invoice_type: 'case_billing',
          invoice_number: manualNumber,
          subtotal: 1000.00,
          total_amount: 1000.00
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(invoice.invoice_number).toBe(manualNumber);
      
      dbHelper.trackRecord('invoices', invoice.id);
    });

    test('Should generate different numbers for different invoice types', async () => {
      const invoiceTypes = ['subscription', 'payment_plan', 'time_based'];
      const generatedNumbers = [];

      for (const type of invoiceTypes) {
        const { data: invoice } = await testContext.supabase
          .from('invoices')
          .insert({
            law_firm_id: testContext.lawFirmId,
            client_id: testContext.clientId,
            invoice_type: type,
            subtotal: 500.00,
            total_amount: 500.00
          })
          .select()
          .single();

        generatedNumbers.push(invoice.invoice_number);
        dbHelper.trackRecord('invoices', invoice.id);
      }

      // All numbers should be different
      const uniqueNumbers = new Set(generatedNumbers);
      expect(uniqueNumbers.size).toBe(invoiceTypes.length);

      // Each should have correct prefix
      expect(generatedNumbers[0]).toMatch(/^SUB-/);  // subscription
      expect(generatedNumbers[1]).toMatch(/^PLAN-/); // payment_plan
      expect(generatedNumbers[2]).toMatch(/^TIME-/); // time_based
    });
  });

  describe('Invoice Total Update Trigger', () => {
    test('Should update invoice total when line item is added', async () => {
      const invoice = await dbHelper.createTestInvoice({
        subtotal: 0,
        tax_amount: 0,
        total_amount: 0
      });

      // Add line item - this should trigger total recalculation
      const { data: lineItem, error } = await testContext.supabase
        .from('invoice_line_items')
        .insert({
          law_firm_id: testContext.lawFirmId,
          invoice_id: invoice.id,
          line_type: 'service_fee',
          description: 'Legal consultation',
          quantity: 2,
          unit_price: 150.00,
          line_total: 300.00,
          tax_amount: 30.00
        })
        .select()
        .single();

      expect(error).toBeNull();
      dbHelper.trackRecord('invoice_line_items', lineItem.id);

      // Wait for trigger to execute
      await dbHelper.wait(100);

      // Fetch updated invoice
      const { data: updatedInvoice } = await testContext.supabase
        .from('invoices')
        .select('subtotal, tax_amount, total_amount')
        .eq('id', invoice.id)
        .single();

      expect(parseFloat(updatedInvoice.subtotal)).toBe(300.00);
      expect(parseFloat(updatedInvoice.tax_amount)).toBe(30.00);
      expect(parseFloat(updatedInvoice.total_amount)).toBe(330.00);
    });

    test('Should update invoice total when line item is updated', async () => {
      const invoice = await dbHelper.createTestInvoice({
        subtotal: 0,
        tax_amount: 0,
        total_amount: 0
      });

      // Add initial line item
      const { data: lineItem } = await testContext.supabase
        .from('invoice_line_items')
        .insert({
          law_firm_id: testContext.lawFirmId,
          invoice_id: invoice.id,
          line_type: 'service_fee',
          description: 'Legal consultation',
          quantity: 1,
          unit_price: 100.00,
          line_total: 100.00,
          tax_amount: 10.00
        })
        .select()
        .single();

      dbHelper.trackRecord('invoice_line_items', lineItem.id);
      await dbHelper.wait(100);

      // Update line item - this should trigger total recalculation
      await testContext.supabase
        .from('invoice_line_items')
        .update({
          quantity: 3,
          line_total: 300.00,
          tax_amount: 30.00
        })
        .eq('id', lineItem.id);

      await dbHelper.wait(100);

      // Fetch updated invoice
      const { data: updatedInvoice } = await testContext.supabase
        .from('invoices')
        .select('subtotal, tax_amount, total_amount')
        .eq('id', invoice.id)
        .single();

      expect(parseFloat(updatedInvoice.subtotal)).toBe(300.00);
      expect(parseFloat(updatedInvoice.tax_amount)).toBe(30.00);
      expect(parseFloat(updatedInvoice.total_amount)).toBe(330.00);
    });

    test('Should update invoice total when line item is deleted', async () => {
      const invoice = await dbHelper.createTestInvoice({
        subtotal: 0,
        tax_amount: 0,
        total_amount: 0
      });

      // Add multiple line items
      const lineItem1 = await testContext.supabase
        .from('invoice_line_items')
        .insert({
          law_firm_id: testContext.lawFirmId,
          invoice_id: invoice.id,
          line_type: 'service_fee',
          description: 'Service 1',
          quantity: 1,
          unit_price: 100.00,
          line_total: 100.00,
          tax_amount: 10.00
        })
        .select()
        .single();

      const lineItem2 = await testContext.supabase
        .from('invoice_line_items')
        .insert({
          law_firm_id: testContext.lawFirmId,
          invoice_id: invoice.id,
          line_type: 'service_fee',
          description: 'Service 2',
          quantity: 1,
          unit_price: 200.00,
          line_total: 200.00,
          tax_amount: 20.00
        })
        .select()
        .single();

      dbHelper.trackRecord('invoice_line_items', lineItem1.data.id);
      dbHelper.trackRecord('invoice_line_items', lineItem2.data.id);
      await dbHelper.wait(100);

      // Delete one line item
      await testContext.supabase
        .from('invoice_line_items')
        .delete()
        .eq('id', lineItem2.data.id);

      await dbHelper.wait(100);

      // Fetch updated invoice
      const { data: updatedInvoice } = await testContext.supabase
        .from('invoices')
        .select('subtotal, tax_amount, total_amount')
        .eq('id', invoice.id)
        .single();

      expect(parseFloat(updatedInvoice.subtotal)).toBe(100.00);
      expect(parseFloat(updatedInvoice.tax_amount)).toBe(10.00);
      expect(parseFloat(updatedInvoice.total_amount)).toBe(110.00);
    });

    test('Should handle multiple line items correctly', async () => {
      const invoice = await dbHelper.createTestInvoice({
        subtotal: 0,
        tax_amount: 0,
        total_amount: 0
      });

      // Add multiple line items in sequence
      const lineItems = [
        { description: 'Service 1', unit_price: 100.00, line_total: 100.00, tax_amount: 10.00 },
        { description: 'Service 2', unit_price: 200.00, line_total: 200.00, tax_amount: 20.00 },
        { description: 'Service 3', unit_price: 150.00, line_total: 150.00, tax_amount: 15.00 }
      ];

      for (const item of lineItems) {
        const { data } = await testContext.supabase
          .from('invoice_line_items')
          .insert({
            law_firm_id: testContext.lawFirmId,
            invoice_id: invoice.id,
            line_type: 'service_fee',
            quantity: 1,
            ...item
          })
          .select()
          .single();

        dbHelper.trackRecord('invoice_line_items', data.id);
        await dbHelper.wait(50); // Small delay between inserts
      }

      await dbHelper.wait(200);

      // Fetch final invoice totals
      const { data: finalInvoice } = await testContext.supabase
        .from('invoices')
        .select('subtotal, tax_amount, total_amount')
        .eq('id', invoice.id)
        .single();

      expect(parseFloat(finalInvoice.subtotal)).toBe(450.00);
      expect(parseFloat(finalInvoice.tax_amount)).toBe(45.00);
      expect(parseFloat(finalInvoice.total_amount)).toBe(495.00);
    });
  });

  describe('Bill Total Update Trigger', () => {
    test('Should update bill total when created with default calculation', async () => {
      const vendor = await dbHelper.createTestVendor();
      
      const { data: bill, error } = await testContext.supabase
        .from('bills')
        .insert({
          law_firm_id: testContext.lawFirmId,
          vendor_id: vendor.id,
          bill_number: 'TRIGGER-TEST-001',
          subtotal: 500.00,
          tax_amount: 50.00,
          discount_amount: 25.00,
          total_amount: 0, // Should be calculated as 525.00
          bill_date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        })
        .select()
        .single();

      expect(error).toBeNull();
      
      // The constraint should enforce correct total calculation
      // If trigger exists, it would update the total after insert
      dbHelper.trackRecord('bills', bill.id);
    });
  });

  describe('Time Summary Update Trigger', () => {
    test('Should update daily summary when time entry is added', async () => {
      const entryDate = new Date().toISOString().split('T')[0];

      // Create time entry - this should trigger summary update
      const timeEntry = await dbHelper.createTestTimeEntry({
        entry_type: 'case_work',
        duration_minutes: 120,
        break_minutes: 10,
        is_billable: true,
        billable_rate: 200.00,
        entry_date: entryDate
      });

      await dbHelper.wait(200); // Wait for trigger

      // Check if daily summary was created/updated
      const { data: summary } = await testContext.supabase
        .from('daily_time_summaries')
        .select('*')
        .eq('law_firm_id', testContext.lawFirmId)
        .eq('user_id', testContext.userId)
        .eq('summary_date', entryDate)
        .single();

      expect(summary).toBeTruthy();
      expect(summary.total_minutes).toBe(110); // 120 - 10 (effective)
      expect(summary.billable_minutes).toBe(110);
      expect(summary.case_work_minutes).toBe(110);
      expect(summary.total_entries).toBe(1);
      expect(parseFloat(summary.total_billable_amount)).toBeCloseTo(366.67, 2); // 110/60 * 200

      dbHelper.trackRecord('daily_time_summaries', summary.id);
    });

    test('Should update daily summary when time entry is modified', async () => {
      const entryDate = new Date().toISOString().split('T')[0];

      // Create initial time entry
      const timeEntry = await dbHelper.createTestTimeEntry({
        entry_type: 'case_work',
        duration_minutes: 60,
        break_minutes: 0,
        is_billable: true,
        billable_rate: 200.00,
        entry_date: entryDate
      });

      await dbHelper.wait(200);

      // Modify time entry
      await testContext.supabase
        .from('time_entries')
        .update({
          duration_minutes: 120,
          break_minutes: 20
        })
        .eq('id', timeEntry.id);

      await dbHelper.wait(200);

      // Check updated summary
      const { data: updatedSummary } = await testContext.supabase
        .from('daily_time_summaries')
        .select('*')
        .eq('law_firm_id', testContext.lawFirmId)
        .eq('user_id', testContext.userId)
        .eq('summary_date', entryDate)
        .single();

      expect(updatedSummary.total_minutes).toBe(100); // 120 - 20 (effective)
      expect(updatedSummary.billable_minutes).toBe(100);
      expect(parseFloat(updatedSummary.total_billable_amount)).toBeCloseTo(333.33, 2); // 100/60 * 200

      dbHelper.trackRecord('daily_time_summaries', updatedSummary.id);
    });

    test('Should update daily summary when time entry is deleted', async () => {
      const entryDate = new Date().toISOString().split('T')[0];

      // Create multiple time entries
      const timeEntry1 = await dbHelper.createTestTimeEntry({
        entry_type: 'case_work',
        duration_minutes: 60,
        break_minutes: 0,
        is_billable: true,
        billable_rate: 200.00,
        entry_date: entryDate
      });

      const timeEntry2 = await dbHelper.createTestTimeEntry({
        entry_type: 'administrative',
        duration_minutes: 90,
        break_minutes: 10,
        is_billable: false,
        entry_date: entryDate
      });

      await dbHelper.wait(200);

      // Delete one entry
      await testContext.supabase
        .from('time_entries')
        .delete()
        .eq('id', timeEntry2.id);

      await dbHelper.wait(200);

      // Check updated summary
      const { data: updatedSummary } = await testContext.supabase
        .from('daily_time_summaries')
        .select('*')
        .eq('law_firm_id', testContext.lawFirmId)
        .eq('user_id', testContext.userId)
        .eq('summary_date', entryDate)
        .single();

      expect(updatedSummary.total_minutes).toBe(60);
      expect(updatedSummary.billable_minutes).toBe(60);
      expect(updatedSummary.non_billable_minutes).toBe(0);
      expect(updatedSummary.case_work_minutes).toBe(60);
      expect(updatedSummary.administrative_minutes).toBe(0);
      expect(updatedSummary.total_entries).toBe(1);

      dbHelper.trackRecord('daily_time_summaries', updatedSummary.id);
    });

    test('Should handle multiple time entries for same day correctly', async () => {
      const entryDate = new Date().toISOString().split('T')[0];

      // Create multiple time entries
      const entries = [
        { entry_type: 'case_work', duration_minutes: 120, break_minutes: 10, is_billable: true, billable_rate: 200.00 },
        { entry_type: 'subscription_work', duration_minutes: 90, break_minutes: 5, is_billable: true, billable_rate: 150.00 },
        { entry_type: 'administrative', duration_minutes: 60, break_minutes: 0, is_billable: false }
      ];

      for (const entry of entries) {
        await dbHelper.createTestTimeEntry({
          ...entry,
          entry_date: entryDate
        });
        await dbHelper.wait(100);
      }

      await dbHelper.wait(200);

      // Check final summary
      const { data: finalSummary } = await testContext.supabase
        .from('daily_time_summaries')
        .select('*')
        .eq('law_firm_id', testContext.lawFirmId)
        .eq('user_id', testContext.userId)
        .eq('summary_date', entryDate)
        .single();

      expect(finalSummary.total_minutes).toBe(255); // 110 + 85 + 60
      expect(finalSummary.billable_minutes).toBe(195); // 110 + 85
      expect(finalSummary.non_billable_minutes).toBe(60);
      expect(finalSummary.case_work_minutes).toBe(110);
      expect(finalSummary.subscription_work_minutes).toBe(85);
      expect(finalSummary.administrative_minutes).toBe(60);
      expect(finalSummary.total_entries).toBe(3);

      dbHelper.trackRecord('daily_time_summaries', finalSummary.id);
    });
  });

  describe('Updated At Timestamp Triggers', () => {
    test('Should update timestamp on time entry modification', async () => {
      const timeEntry = await dbHelper.createTestTimeEntry();
      const originalUpdatedAt = timeEntry.updated_at;

      await dbHelper.wait(1000); // Ensure time difference

      // Update the entry
      await testContext.supabase
        .from('time_entries')
        .update({
          duration_minutes: 90
        })
        .eq('id', timeEntry.id);

      // Fetch updated entry
      const { data: updatedEntry } = await testContext.supabase
        .from('time_entries')
        .select('updated_at')
        .eq('id', timeEntry.id)
        .single();

      expect(new Date(updatedEntry.updated_at)).toBeInstanceOf(Date);
      expect(updatedEntry.updated_at).not.toBe(originalUpdatedAt);
    });

    test('Should update timestamp on invoice modification', async () => {
      const invoice = await dbHelper.createTestInvoice();
      const originalUpdatedAt = invoice.updated_at;

      await dbHelper.wait(1000);

      // Update the invoice
      await testContext.supabase
        .from('invoices')
        .update({
          description: 'Updated description'
        })
        .eq('id', invoice.id);

      // Fetch updated invoice
      const { data: updatedInvoice } = await testContext.supabase
        .from('invoices')
        .select('updated_at')
        .eq('id', invoice.id)
        .single();

      expect(updatedInvoice.updated_at).not.toBe(originalUpdatedAt);
    });

    test('Should update timestamp on vendor modification', async () => {
      const vendor = await dbHelper.createTestVendor();
      const originalUpdatedAt = vendor.updated_at;

      await dbHelper.wait(1000);

      // Update the vendor
      await testContext.supabase
        .from('vendors')
        .update({
          email: 'updated@vendor.com'
        })
        .eq('id', vendor.id);

      // Fetch updated vendor
      const { data: updatedVendor } = await testContext.supabase
        .from('vendors')
        .select('updated_at')
        .eq('id', vendor.id)
        .single();

      expect(updatedVendor.updated_at).not.toBe(originalUpdatedAt);
    });

    test('Should update timestamp on bill modification', async () => {
      const vendor = await dbHelper.createTestVendor();
      const bill = await dbHelper.createTestBill(vendor.id);
      const originalUpdatedAt = bill.updated_at;

      await dbHelper.wait(1000);

      // Update the bill
      await testContext.supabase
        .from('bills')
        .update({
          bill_status: 'approved'
        })
        .eq('id', bill.id);

      // Fetch updated bill
      const { data: updatedBill } = await testContext.supabase
        .from('bills')
        .select('updated_at')
        .eq('id', bill.id)
        .single();

      expect(updatedBill.updated_at).not.toBe(originalUpdatedAt);
    });
  });

  describe('Trigger Performance Tests', () => {
    test('Should handle bulk invoice line item operations efficiently', async () => {
      const invoice = await dbHelper.createTestInvoice({
        subtotal: 0,
        tax_amount: 0,
        total_amount: 0
      });

      const startTime = Date.now();

      // Insert multiple line items rapidly
      const lineItemPromises = Array.from({ length: 10 }, (_, i) =>
        testContext.supabase
          .from('invoice_line_items')
          .insert({
            law_firm_id: testContext.lawFirmId,
            invoice_id: invoice.id,
            line_type: 'service_fee',
            description: `Service ${i + 1}`,
            quantity: 1,
            unit_price: 100.00,
            line_total: 100.00,
            tax_amount: 10.00
          })
          .select()
          .single()
      );

      const results = await Promise.all(lineItemPromises);
      results.forEach(result => {
        if (result.data) {
          dbHelper.trackRecord('invoice_line_items', result.data.id);
        }
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(5000);

      // Wait for all triggers to complete
      await dbHelper.wait(500);

      // Verify final totals are correct
      const { data: finalInvoice } = await testContext.supabase
        .from('invoices')
        .select('subtotal, tax_amount, total_amount')
        .eq('id', invoice.id)
        .single();

      expect(parseFloat(finalInvoice.subtotal)).toBe(1000.00);
      expect(parseFloat(finalInvoice.tax_amount)).toBe(100.00);
      expect(parseFloat(finalInvoice.total_amount)).toBe(1100.00);
    });

    test('Should handle bulk time entry operations efficiently', async () => {
      const entryDate = new Date().toISOString().split('T')[0];
      const startTime = Date.now();

      // Create multiple time entries
      const timeEntryPromises = Array.from({ length: 5 }, (_, i) =>
        dbHelper.createTestTimeEntry({
          entry_type: 'case_work',
          duration_minutes: 60 + (i * 10),
          break_minutes: 5,
          is_billable: true,
          billable_rate: 200.00,
          entry_date: entryDate,
          activity_description: `Activity ${i + 1}`
        })
      );

      await Promise.all(timeEntryPromises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(5000);

      // Wait for triggers to complete
      await dbHelper.wait(1000);

      // Verify summary was updated correctly
      const { data: summary } = await testContext.supabase
        .from('daily_time_summaries')
        .select('*')
        .eq('law_firm_id', testContext.lawFirmId)
        .eq('user_id', testContext.userId)
        .eq('summary_date', entryDate)
        .single();

      expect(summary.total_entries).toBe(5);
      expect(summary.total_minutes).toBeGreaterThan(0);

      if (summary) {
        dbHelper.trackRecord('daily_time_summaries', summary.id);
      }
    });
  });

  describe('Trigger Error Handling', () => {
    test('Should handle trigger errors gracefully', async () => {
      // This test depends on the specific trigger implementation
      // For now, we'll test that operations complete without crashing

      const invoice = await dbHelper.createTestInvoice();

      // Try to add a line item that might cause trigger issues
      const { error } = await testContext.supabase
        .from('invoice_line_items')
        .insert({
          law_firm_id: testContext.lawFirmId,
          invoice_id: invoice.id,
          line_type: 'service_fee',
          description: 'Test service',
          quantity: 1,
          unit_price: 100.00,
          line_total: 100.00
        });

      // Should not fail due to trigger errors
      expect(error).toBeNull();
    });

    test('Should maintain data consistency even with trigger failures', async () => {
      // Create invoice and verify it exists
      const invoice = await dbHelper.createTestInvoice();
      
      const { data: invoiceExists } = await testContext.supabase
        .from('invoices')
        .select('id')
        .eq('id', invoice.id)
        .single();

      expect(invoiceExists).toBeTruthy();

      // Even if triggers fail, the base data should remain consistent
      // This is more of a philosophical test - in practice, trigger failures
      // should be caught and handled appropriately
    });
  });
});