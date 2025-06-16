/**
 * Data Integrity Test Suite
 * Tests foreign key relationships, check constraints, unique constraints, and data consistency
 */

const DatabaseTestHelper = require('./helpers/db-test-helper');

describe('Database Data Integrity Tests', () => {
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

  describe('Foreign Key Relationship Tests', () => {
    describe('Time Entries Foreign Keys', () => {
      test('Should enforce law_firm_id foreign key', async () => {
        const invalidLawFirmId = dbHelper.generateUUID();
        
        await expect(async () => {
          await testContext.supabase
            .from('time_entries')
            .insert({
              law_firm_id: invalidLawFirmId,
              user_id: testContext.userId,
              entry_type: 'case_work',
              duration_minutes: 60,
              activity_description: 'Test work'
            });
        }).rejects.toThrow();
      });

      test('Should enforce user_id foreign key', async () => {
        const invalidUserId = dbHelper.generateUUID();
        
        await expect(async () => {
          await testContext.supabase
            .from('time_entries')
            .insert({
              law_firm_id: testContext.lawFirmId,
              user_id: invalidUserId,
              entry_type: 'case_work',
              duration_minutes: 60,
              activity_description: 'Test work'
            });
        }).rejects.toThrow();
      });

      test('Should allow null matter_id (optional relationship)', async () => {
        const { data, error } = await testContext.supabase
          .from('time_entries')
          .insert({
            law_firm_id: testContext.lawFirmId,
            user_id: testContext.userId,
            entry_type: 'administrative',
            duration_minutes: 60,
            activity_description: 'Administrative work',
            matter_id: null
          })
          .select()
          .single();

        expect(error).toBeNull();
        expect(data.matter_id).toBeNull();
        dbHelper.trackRecord('time_entries', data.id);
      });
    });

    describe('Invoice Foreign Keys', () => {
      test('Should enforce client_id foreign key', async () => {
        const invalidClientId = dbHelper.generateUUID();
        
        await expect(async () => {
          await testContext.supabase
            .from('invoices')
            .insert({
              law_firm_id: testContext.lawFirmId,
              client_id: invalidClientId,
              invoice_type: 'case_billing',
              total_amount: 1000.00
            });
        }).rejects.toThrow();
      });

      test('Should enforce parent_invoice_id self-reference', async () => {
        const invalidParentId = dbHelper.generateUUID();
        
        await expect(async () => {
          await testContext.supabase
            .from('invoices')
            .insert({
              law_firm_id: testContext.lawFirmId,
              client_id: testContext.clientId,
              invoice_type: 'case_billing',
              total_amount: 1000.00,
              parent_invoice_id: invalidParentId
            });
        }).rejects.toThrow();
      });
    });

    describe('Invoice Line Items Foreign Keys', () => {
      test('Should enforce invoice_id foreign key', async () => {
        const invalidInvoiceId = dbHelper.generateUUID();
        
        await expect(async () => {
          await testContext.supabase
            .from('invoice_line_items')
            .insert({
              law_firm_id: testContext.lawFirmId,
              invoice_id: invalidInvoiceId,
              line_type: 'service_fee',
              description: 'Test line item',
              quantity: 1,
              unit_price: 100.00,
              line_total: 100.00
            });
        }).rejects.toThrow();
      });

      test('Should cascade delete when invoice is deleted', async () => {
        // Create test invoice
        const invoice = await dbHelper.createTestInvoice();
        
        // Create line item
        const { data: lineItem, error } = await testContext.supabase
          .from('invoice_line_items')
          .insert({
            law_firm_id: testContext.lawFirmId,
            invoice_id: invoice.id,
            line_type: 'service_fee',
            description: 'Test line item',
            quantity: 1,
            unit_price: 100.00,
            line_total: 100.00
          })
          .select()
          .single();

        expect(error).toBeNull();
        dbHelper.trackRecord('invoice_line_items', lineItem.id);

        // Delete invoice
        await testContext.supabase
          .from('invoices')
          .delete()
          .eq('id', invoice.id);

        // Verify line item is also deleted
        const { data: deletedLineItem } = await testContext.supabase
          .from('invoice_line_items')
          .select()
          .eq('id', lineItem.id)
          .single();

        expect(deletedLineItem).toBeNull();
      });
    });

    describe('Bills and Vendors Foreign Keys', () => {
      test('Should enforce vendor_id foreign key in bills', async () => {
        const invalidVendorId = dbHelper.generateUUID();
        
        await expect(async () => {
          await testContext.supabase
            .from('bills')
            .insert({
              law_firm_id: testContext.lawFirmId,
              vendor_id: invalidVendorId,
              bill_number: 'TEST-001',
              total_amount: 500.00,
              bill_date: new Date().toISOString().split('T')[0],
              due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            });
        }).rejects.toThrow();
      });

      test('Should enforce expense_category_id foreign key in bills', async () => {
        const vendor = await dbHelper.createTestVendor();
        const invalidCategoryId = dbHelper.generateUUID();
        
        await expect(async () => {
          await testContext.supabase
            .from('bills')
            .insert({
              law_firm_id: testContext.lawFirmId,
              vendor_id: vendor.id,
              expense_category_id: invalidCategoryId,
              bill_number: 'TEST-002',
              total_amount: 500.00,
              bill_date: new Date().toISOString().split('T')[0],
              due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            });
        }).rejects.toThrow();
      });
    });

    describe('Payment Collections Foreign Keys', () => {
      test('Should enforce client_id foreign key', async () => {
        const invalidClientId = dbHelper.generateUUID();
        
        await expect(async () => {
          await testContext.supabase
            .from('payment_collections')
            .insert({
              law_firm_id: testContext.lawFirmId,
              client_id: invalidClientId,
              original_amount: 1000.00,
              due_date: new Date().toISOString().split('T')[0]
            });
        }).rejects.toThrow();
      });

      test('Should allow null invoice_id (optional relationship)', async () => {
        const { data, error } = await testContext.supabase
          .from('payment_collections')
          .insert({
            law_firm_id: testContext.lawFirmId,
            client_id: testContext.clientId,
            original_amount: 1000.00,
            due_date: new Date().toISOString().split('T')[0],
            invoice_id: null
          })
          .select()
          .single();

        expect(error).toBeNull();
        expect(data.invoice_id).toBeNull();
        dbHelper.trackRecord('payment_collections', data.id);
      });
    });
  });

  describe('Check Constraint Tests', () => {
    describe('Time Entry Check Constraints', () => {
      test('Should enforce valid entry_type values', async () => {
        await expect(async () => {
          await testContext.supabase
            .from('time_entries')
            .insert({
              law_firm_id: testContext.lawFirmId,
              user_id: testContext.userId,
              entry_type: 'invalid_type',
              duration_minutes: 60,
              activity_description: 'Test work'
            });
        }).rejects.toThrow();
      });

      test('Should enforce valid entry_status values', async () => {
        await expect(async () => {
          await testContext.supabase
            .from('time_entries')
            .insert({
              law_firm_id: testContext.lawFirmId,
              user_id: testContext.userId,
              entry_type: 'case_work',
              entry_status: 'invalid_status',
              duration_minutes: 60,
              activity_description: 'Test work'
            });
        }).rejects.toThrow();
      });

      test('Should allow valid entry_type values', async () => {
        const validTypes = ['case_work', 'subscription_work', 'administrative', 'business_development', 'non_billable'];
        
        for (const type of validTypes) {
          const { data, error } = await testContext.supabase
            .from('time_entries')
            .insert({
              law_firm_id: testContext.lawFirmId,
              user_id: testContext.userId,
              entry_type: type,
              duration_minutes: 60,
              activity_description: `Test ${type} work`
            })
            .select()
            .single();

          expect(error).toBeNull();
          expect(data.entry_type).toBe(type);
          dbHelper.trackRecord('time_entries', data.id);
        }
      });
    });

    describe('Invoice Check Constraints', () => {
      test('Should enforce positive amount constraints', async () => {
        await expect(async () => {
          await testContext.supabase
            .from('invoices')
            .insert({
              law_firm_id: testContext.lawFirmId,
              client_id: testContext.clientId,
              invoice_type: 'case_billing',
              subtotal: -100.00,
              total_amount: -100.00
            });
        }).rejects.toThrow();
      });

      test('Should enforce total calculation constraint', async () => {
        await expect(async () => {
          await testContext.supabase
            .from('invoices')
            .insert({
              law_firm_id: testContext.lawFirmId,
              client_id: testContext.clientId,
              invoice_type: 'case_billing',
              subtotal: 100.00,
              tax_amount: 10.00,
              discount_amount: 5.00,
              total_amount: 200.00 // Should be 105.00
            });
        }).rejects.toThrow();
      });

      test('Should allow correct total calculation', async () => {
        const { data, error } = await testContext.supabase
          .from('invoices')
          .insert({
            law_firm_id: testContext.lawFirmId,
            client_id: testContext.clientId,
            invoice_type: 'case_billing',
            subtotal: 100.00,
            tax_amount: 10.00,
            discount_amount: 5.00,
            total_amount: 105.00
          })
          .select()
          .single();

        expect(error).toBeNull();
        expect(parseFloat(data.total_amount)).toBe(105.00);
        dbHelper.trackRecord('invoices', data.id);
      });

      test('Should enforce valid invoice_type values', async () => {
        const validTypes = ['subscription', 'case_billing', 'payment_plan', 'time_based', 'hybrid', 'adjustment', 'late_fee'];
        
        for (const type of validTypes) {
          const { data, error } = await testContext.supabase
            .from('invoices')
            .insert({
              law_firm_id: testContext.lawFirmId,
              client_id: testContext.clientId,
              invoice_type: type,
              subtotal: 100.00,
              total_amount: 100.00
            })
            .select()
            .single();

          expect(error).toBeNull();
          expect(data.invoice_type).toBe(type);
          dbHelper.trackRecord('invoices', data.id);
        }
      });

      test('Should enforce valid payment_terms values', async () => {
        const validTerms = ['immediate', '7_days', '15_days', '30_days', '45_days', '60_days', 'custom'];
        
        for (const terms of validTerms) {
          const { data, error } = await testContext.supabase
            .from('invoices')
            .insert({
              law_firm_id: testContext.lawFirmId,
              client_id: testContext.clientId,
              invoice_type: 'case_billing',
              payment_terms: terms,
              subtotal: 100.00,
              total_amount: 100.00
            })
            .select()
            .single();

          expect(error).toBeNull();
          expect(data.payment_terms).toBe(terms);
          dbHelper.trackRecord('invoices', data.id);
        }
      });
    });

    describe('Invoice Line Items Check Constraints', () => {
      test('Should enforce positive quantities and amounts', async () => {
        const invoice = await dbHelper.createTestInvoice();
        
        await expect(async () => {
          await testContext.supabase
            .from('invoice_line_items')
            .insert({
              law_firm_id: testContext.lawFirmId,
              invoice_id: invoice.id,
              line_type: 'service_fee',
              description: 'Test item',
              quantity: -1,
              unit_price: 100.00,
              line_total: -100.00
            });
        }).rejects.toThrow();
      });

      test('Should enforce line total calculation', async () => {
        const invoice = await dbHelper.createTestInvoice();
        
        await expect(async () => {
          await testContext.supabase
            .from('invoice_line_items')
            .insert({
              law_firm_id: testContext.lawFirmId,
              invoice_id: invoice.id,
              line_type: 'service_fee',
              description: 'Test item',
              quantity: 2,
              unit_price: 100.00,
              line_total: 150.00 // Should be 200.00
            });
        }).rejects.toThrow();
      });
    });

    describe('Vendor Check Constraints', () => {
      test('Should enforce valid vendor_type values', async () => {
        const validTypes = ['supplier', 'contractor', 'service_provider', 'utility', 'government', 'other'];
        
        for (const type of validTypes) {
          const { data, error } = await testContext.supabase
            .from('vendors')
            .insert({
              law_firm_id: testContext.lawFirmId,
              vendor_type: type,
              name: `Test Vendor ${type}`,
              vendor_status: 'active'
            })
            .select()
            .single();

          expect(error).toBeNull();
          expect(data.vendor_type).toBe(type);
          dbHelper.trackRecord('vendors', data.id);
        }
      });

      test('Should enforce valid vendor_status values', async () => {
        const validStatuses = ['active', 'inactive', 'suspended', 'blocked'];
        
        for (const status of validStatuses) {
          const { data, error } = await testContext.supabase
            .from('vendors')
            .insert({
              law_firm_id: testContext.lawFirmId,
              vendor_type: 'supplier',
              name: `Test Vendor ${status}`,
              vendor_status: status
            })
            .select()
            .single();

          expect(error).toBeNull();
          expect(data.vendor_status).toBe(status);
          dbHelper.trackRecord('vendors', data.id);
        }
      });
    });

    describe('Bill Check Constraints', () => {
      test('Should enforce valid bill_status values', async () => {
        const vendor = await dbHelper.createTestVendor();
        const validStatuses = ['draft', 'pending', 'approved', 'rejected', 'paid', 'overdue', 'cancelled'];
        
        for (const status of validStatuses) {
          const { data, error } = await testContext.supabase
            .from('bills')
            .insert({
              law_firm_id: testContext.lawFirmId,
              vendor_id: vendor.id,
              bill_number: `TEST-${status}-${Date.now()}`,
              bill_status: status,
              total_amount: 500.00,
              bill_date: new Date().toISOString().split('T')[0],
              due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            })
            .select()
            .single();

          expect(error).toBeNull();
          expect(data.bill_status).toBe(status);
          dbHelper.trackRecord('bills', data.id);
        }
      });
    });

    describe('Payment Method Check Constraints', () => {
      test('Should enforce valid payment methods in invoice_payments', async () => {
        const invoice = await dbHelper.createTestInvoice();
        const validMethods = ['cash', 'check', 'bank_transfer', 'pix', 'credit_card', 'debit_card', 'other'];
        
        for (const method of validMethods) {
          const { data, error } = await testContext.supabase
            .from('invoice_payments')
            .insert({
              law_firm_id: testContext.lawFirmId,
              invoice_id: invoice.id,
              payment_amount: 100.00,
              payment_method: method
            })
            .select()
            .single();

          expect(error).toBeNull();
          expect(data.payment_method).toBe(method);
          dbHelper.trackRecord('invoice_payments', data.id);
        }
      });
    });
  });

  describe('Unique Constraint Tests', () => {
    test('Should enforce unique invoice numbers', async () => {
      const invoiceNumber = `TEST-UNIQUE-${Date.now()}`;
      
      // Create first invoice
      const firstInvoice = await testContext.supabase
        .from('invoices')
        .insert({
          law_firm_id: testContext.lawFirmId,
          client_id: testContext.clientId,
          invoice_type: 'case_billing',
          invoice_number: invoiceNumber,
          total_amount: 100.00
        })
        .select()
        .single();

      expect(firstInvoice.error).toBeNull();
      dbHelper.trackRecord('invoices', firstInvoice.data.id);

      // Try to create second invoice with same number
      await expect(async () => {
        await testContext.supabase
          .from('invoices')
          .insert({
            law_firm_id: testContext.lawFirmId,
            client_id: testContext.clientId,
            invoice_type: 'case_billing',
            invoice_number: invoiceNumber,
            total_amount: 200.00
          });
      }).rejects.toThrow();
    });

    test('Should enforce unique daily time summary per user per date', async () => {
      const summaryDate = new Date().toISOString().split('T')[0];
      
      // Create first summary
      const firstSummary = await testContext.supabase
        .from('daily_time_summaries')
        .insert({
          law_firm_id: testContext.lawFirmId,
          user_id: testContext.userId,
          summary_date: summaryDate,
          total_minutes: 480
        })
        .select()
        .single();

      expect(firstSummary.error).toBeNull();
      dbHelper.trackRecord('daily_time_summaries', firstSummary.data.id);

      // Try to create duplicate summary
      await expect(async () => {
        await testContext.supabase
          .from('daily_time_summaries')
          .insert({
            law_firm_id: testContext.lawFirmId,
            user_id: testContext.userId,
            summary_date: summaryDate,
            total_minutes: 240
          });
      }).rejects.toThrow();
    });
  });

  describe('Data Consistency Tests', () => {
    test('Should maintain referential integrity on bulk operations', async () => {
      // Create vendor and multiple bills
      const vendor = await dbHelper.createTestVendor();
      const bills = [];
      
      for (let i = 0; i < 5; i++) {
        const bill = await dbHelper.createTestBill(vendor.id, {
          bill_number: `BULK-TEST-${i}-${Date.now()}`
        });
        bills.push(bill);
      }

      // Verify all bills are linked to the vendor
      const { data: linkedBills } = await testContext.supabase
        .from('bills')
        .select('id, vendor_id')
        .eq('vendor_id', vendor.id);

      expect(linkedBills.length).toBe(5);
      linkedBills.forEach(bill => {
        expect(bill.vendor_id).toBe(vendor.id);
      });
    });

    test('Should handle circular reference prevention', async () => {
      // Create parent invoice
      const parentInvoice = await dbHelper.createTestInvoice();
      
      // Create child invoice referencing parent
      const childInvoice = await testContext.supabase
        .from('invoices')
        .insert({
          law_firm_id: testContext.lawFirmId,
          client_id: testContext.clientId,
          invoice_type: 'adjustment',
          parent_invoice_id: parentInvoice.id,
          total_amount: 50.00
        })
        .select()
        .single();

      expect(childInvoice.error).toBeNull();
      dbHelper.trackRecord('invoices', childInvoice.data.id);

      // Try to create circular reference (parent referencing child)
      await expect(async () => {
        await testContext.supabase
          .from('invoices')
          .update({
            parent_invoice_id: childInvoice.data.id
          })
          .eq('id', parentInvoice.id);
      }).rejects.toThrow();
    });

    test('Should maintain data consistency during concurrent operations', async () => {
      const vendor = await dbHelper.createTestVendor();
      
      // Create multiple bills concurrently
      const billPromises = Array.from({ length: 10 }, (_, i) =>
        testContext.supabase
          .from('bills')
          .insert({
            law_firm_id: testContext.lawFirmId,
            vendor_id: vendor.id,
            bill_number: `CONCURRENT-${i}-${Date.now()}`,
            total_amount: (i + 1) * 100,
            bill_date: new Date().toISOString().split('T')[0],
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          })
          .select()
          .single()
      );

      const results = await Promise.allSettled(billPromises);
      const successful = results.filter(r => r.status === 'fulfilled');
      
      // All operations should succeed
      expect(successful.length).toBe(10);
      
      // Track for cleanup
      successful.forEach(result => {
        dbHelper.trackRecord('bills', result.value.data.id);
      });
    });
  });

  describe('Cascade Operations Tests', () => {
    test('Should cascade delete invoice line items when invoice is deleted', async () => {
      const invoice = await dbHelper.createTestInvoice();
      
      // Create line items
      const lineItemPromises = Array.from({ length: 3 }, (_, i) =>
        testContext.supabase
          .from('invoice_line_items')
          .insert({
            law_firm_id: testContext.lawFirmId,
            invoice_id: invoice.id,
            line_type: 'service_fee',
            description: `Line item ${i + 1}`,
            quantity: 1,
            unit_price: 100.00,
            line_total: 100.00
          })
          .select()
          .single()
      );

      const lineItems = await Promise.all(lineItemPromises);
      lineItems.forEach(({ data }) => {
        dbHelper.trackRecord('invoice_line_items', data.id);
      });

      // Delete invoice
      await testContext.supabase
        .from('invoices')
        .delete()
        .eq('id', invoice.id);

      // Verify line items are deleted
      const { data: remainingLineItems } = await testContext.supabase
        .from('invoice_line_items')
        .select('id')
        .eq('invoice_id', invoice.id);

      expect(remainingLineItems).toHaveLength(0);
    });

    test('Should cascade delete bill payments when bill is deleted', async () => {
      const vendor = await dbHelper.createTestVendor();
      const bill = await dbHelper.createTestBill(vendor.id);
      
      // Create payment
      const { data: payment } = await testContext.supabase
        .from('bill_payments')
        .insert({
          law_firm_id: testContext.lawFirmId,
          bill_id: bill.id,
          payment_amount: 250.00,
          payment_method: 'bank_transfer'
        })
        .select()
        .single();

      dbHelper.trackRecord('bill_payments', payment.id);

      // Delete bill
      await testContext.supabase
        .from('bills')
        .delete()
        .eq('id', bill.id);

      // Verify payment is deleted
      const { data: remainingPayments } = await testContext.supabase
        .from('bill_payments')
        .select('id')
        .eq('bill_id', bill.id);

      expect(remainingPayments).toHaveLength(0);
    });
  });

  describe('Multi-tenant Data Isolation Tests', () => {
    test('Should isolate data by law_firm_id', async () => {
      // Create second test law firm
      const { data: secondLawFirm } = await testContext.supabase
        .from('law_firms')
        .insert({
          name: 'Second Test Law Firm',
          cnpj: dbHelper.generateTestCNPJ(),
          email: 'second@testfirm.com'
        })
        .select()
        .single();

      dbHelper.trackRecord('law_firms', secondLawFirm.id);

      // Create vendor for first law firm
      const vendor1 = await dbHelper.createTestVendor();
      
      // Create vendor for second law firm
      const { data: vendor2 } = await testContext.supabase
        .from('vendors')
        .insert({
          law_firm_id: secondLawFirm.id,
          vendor_type: 'supplier',
          name: 'Second Law Firm Vendor',
          vendor_status: 'active'
        })
        .select()
        .single();

      dbHelper.trackRecord('vendors', vendor2.id);

      // Query vendors for first law firm should not return second law firm's vendor
      const { data: firstLawFirmVendors } = await testContext.supabase
        .from('vendors')
        .select('id')
        .eq('law_firm_id', testContext.lawFirmId);

      const vendorIds = firstLawFirmVendors.map(v => v.id);
      expect(vendorIds).toContain(vendor1.id);
      expect(vendorIds).not.toContain(vendor2.id);
    });
  });
});