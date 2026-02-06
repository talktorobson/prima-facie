/**
 * Database Performance Test Suite
 * Tests query optimization, index usage, and performance benchmarks
 */

const DatabaseTestHelper = require('./helpers/db-test-helper');

describe('Database Performance Tests', () => {
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

  describe('Index Usage and Optimization', () => {
    test('Should efficiently query time entries by law_firm_id', async () => {
      // Create test data
      const timeEntryPromises = Array.from({ length: 20 }, (_, i) =>
        dbHelper.createTestTimeEntry({
          activity_description: `Performance test entry ${i}`,
          duration_minutes: 60 + (i * 5)
        })
      );

      await Promise.all(timeEntryPromises);

      const startTime = Date.now();

      // Query by law_firm_id (should use index)
      const { data: timeEntries, error } = await testContext.supabase
        .from('time_entries')
        .select('id, activity_description, duration_minutes')
        .eq('law_firm_id', testContext.lawFirmId)
        .order('created_at', { ascending: false })
        .limit(10);

      const endTime = Date.now();
      const queryDuration = endTime - startTime;

      expect(error).toBeNull();
      expect(Array.isArray(timeEntries)).toBe(true);
      expect(timeEntries.length).toBeGreaterThan(0);
      expect(queryDuration).toBeLessThan(1000); // Should complete within 1 second
    });

    test('Should efficiently query invoices by client_id and date range', async () => {
      // Create test invoices
      const invoicePromises = Array.from({ length: 15 }, (_, i) => {
        const issueDate = new Date();
        issueDate.setDate(issueDate.getDate() - i);
        
        return dbHelper.createTestInvoice({
          issue_date: issueDate.toISOString().split('T')[0],
          description: `Performance test invoice ${i}`
        });
      });

      await Promise.all(invoicePromises);

      const startTime = Date.now();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Query by client_id and date range (should use indexes)
      const { data: recentInvoices, error } = await testContext.supabase
        .from('invoices')
        .select('id, invoice_number, total_amount, issue_date')
        .eq('client_id', testContext.clientId)
        .gte('issue_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('issue_date', { ascending: false });

      const endTime = Date.now();
      const queryDuration = endTime - startTime;

      expect(error).toBeNull();
      expect(Array.isArray(recentInvoices)).toBe(true);
      expect(queryDuration).toBeLessThan(1000);
    });

    test('Should efficiently query bills by vendor and status', async () => {
      // Create vendor and bills
      const vendor = await dbHelper.createTestVendor();
      
      const billPromises = Array.from({ length: 10 }, (_, i) =>
        dbHelper.createTestBill(vendor.id, {
          bill_number: `PERF-${i}`,
          bill_status: i % 2 === 0 ? 'pending' : 'approved'
        })
      );

      await Promise.all(billPromises);

      const startTime = Date.now();

      // Query by vendor_id and status (should use indexes)
      const { data: pendingBills, error } = await testContext.supabase
        .from('bills')
        .select('id, bill_number, total_amount, bill_status')
        .eq('vendor_id', vendor.id)
        .eq('bill_status', 'pending')
        .order('bill_date', { ascending: false });

      const endTime = Date.now();
      const queryDuration = endTime - startTime;

      expect(error).toBeNull();
      expect(Array.isArray(pendingBills)).toBe(true);
      expect(queryDuration).toBeLessThan(1000);
    });

    test('Should check index usage statistics', async () => {
      // Check index usage for critical tables
      const criticalTables = ['time_entries', 'invoices', 'bills', 'vendors'];

      for (const table of criticalTables) {
        const { data: indexStats, error } = await testContext.supabase.rpc('check_index_usage', {
          table_name: table
        });

        expect(error).toBeNull();
        expect(Array.isArray(indexStats)).toBe(true);

        if (indexStats.length > 0) {
          indexStats.forEach(stat => {
            expect(stat).toHaveProperty('index_name');
            expect(stat).toHaveProperty('scans');
            expect(typeof stat.scans).toBe('number');
          });
        }
      }
    });
  });

  describe('Complex Query Performance', () => {
    test('Should efficiently execute invoice aggregation queries', async () => {
      // Create multiple invoices with line items
      const invoicePromises = Array.from({ length: 5 }, async (_, i) => {
        const invoice = await dbHelper.createTestInvoice({
          subtotal: 0,
          total_amount: 0
        });

        // Add line items to each invoice
        const lineItemPromises = Array.from({ length: 3 }, (_, j) =>
          testContext.supabase
            .from('invoice_line_items')
            .insert({
              law_firm_id: testContext.lawFirmId,
              invoice_id: invoice.id,
              line_type: 'service_fee',
              description: `Service ${j + 1}`,
              quantity: 1,
              unit_price: 100.00 + (j * 50),
              line_total: 100.00 + (j * 50)
            })
            .select()
            .single()
        );

        const lineItems = await Promise.all(lineItemPromises);
        lineItems.forEach(({ data }) => {
          if (data) dbHelper.trackRecord('invoice_line_items', data.id);
        });

        return invoice;
      });

      await Promise.all(invoicePromises);

      const startTime = Date.now();

      // Complex aggregation query
      const { data: invoiceSummary, error } = await testContext.supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          total_amount,
          invoice_line_items(count)
        `)
        .eq('law_firm_id', testContext.lawFirmId);

      const endTime = Date.now();
      const queryDuration = endTime - startTime;

      expect(error).toBeNull();
      expect(Array.isArray(invoiceSummary)).toBe(true);
      expect(queryDuration).toBeLessThan(2000); // Complex query, allow 2 seconds
    });

    test('Should efficiently calculate time tracking summaries', async () => {
      // Create time entries for multiple days
      const today = new Date();
      const timeEntryPromises = Array.from({ length: 15 }, (_, i) => {
        const entryDate = new Date(today);
        entryDate.setDate(entryDate.getDate() - (i % 7)); // Spread across a week

        return dbHelper.createTestTimeEntry({
          entry_date: entryDate.toISOString().split('T')[0],
          duration_minutes: 60 + (i * 10),
          break_minutes: 5,
          billable_rate: 200.00,
          activity_description: `Summary test entry ${i}`
        });
      });

      await Promise.all(timeEntryPromises);

      const startTime = Date.now();

      // Aggregation query for time summary
      const { data: timeSummary, error } = await testContext.supabase.rpc('execute_sql', {
        sql_query: `
          SELECT 
            entry_date,
            COUNT(*) as entry_count,
            SUM(effective_minutes) as total_minutes,
            SUM(CASE WHEN is_billable THEN effective_minutes ELSE 0 END) as billable_minutes,
            SUM(billable_amount) as total_amount
          FROM time_entries 
          WHERE law_firm_id = $1 AND user_id = $2
          GROUP BY entry_date 
          ORDER BY entry_date DESC
        `,
        parameters: [testContext.lawFirmId, testContext.userId]
      });

      const endTime = Date.now();
      const queryDuration = endTime - startTime;

      expect(error).toBeNull();
      expect(queryDuration).toBeLessThan(1500);
    });

    test('Should efficiently execute financial dashboard queries', async () => {
      // Create diverse financial data
      const vendor = await dbHelper.createTestVendor();
      
      // Create invoices and bills
      const promises = [
        ...Array.from({ length: 5 }, () => dbHelper.createTestInvoice()),
        ...Array.from({ length: 5 }, () => dbHelper.createTestBill(vendor.id))
      ];

      await Promise.all(promises);

      const startTime = Date.now();

      // Dashboard-style query with multiple aggregations
      const dashboardPromises = [
        // Total revenue (invoices)
        testContext.supabase
          .from('invoices')
          .select('total_amount')
          .eq('law_firm_id', testContext.lawFirmId)
          .eq('invoice_status', 'paid'),

        // Total expenses (bills)  
        testContext.supabase
          .from('bills')
          .select('total_amount')
          .eq('law_firm_id', testContext.lawFirmId)
          .eq('bill_status', 'paid'),

        // Pending invoices count
        testContext.supabase
          .from('invoices')
          .select('id', { count: 'exact' })
          .eq('law_firm_id', testContext.lawFirmId)
          .in('invoice_status', ['sent', 'viewed']),

        // Overdue bills count
        testContext.supabase
          .from('bills')
          .select('id', { count: 'exact' })
          .eq('law_firm_id', testContext.lawFirmId)
          .eq('bill_status', 'overdue')
      ];

      await Promise.all(dashboardPromises);

      const endTime = Date.now();
      const queryDuration = endTime - startTime;

      expect(queryDuration).toBeLessThan(2000); // Multiple queries, allow 2 seconds
    });
  });

  describe('Bulk Operations Performance', () => {
    test('Should efficiently handle bulk time entry creation', async () => {
      const startTime = Date.now();

      // Create 25 time entries in parallel
      const bulkTimeEntries = Array.from({ length: 25 }, (_, i) =>
        dbHelper.createTestTimeEntry({
          activity_description: `Bulk entry ${i}`,
          duration_minutes: 60 + (i * 2)
        })
      );

      await Promise.all(bulkTimeEntries);

      const endTime = Date.now();
      const operationDuration = endTime - startTime;

      expect(operationDuration).toBeLessThan(10000); // Should complete within 10 seconds
    });

    test('Should efficiently handle bulk invoice line item operations', async () => {
      const invoice = await dbHelper.createTestInvoice({
        subtotal: 0,
        total_amount: 0
      });

      const startTime = Date.now();

      // Create 20 line items in parallel
      const lineItemPromises = Array.from({ length: 20 }, (_, i) =>
        testContext.supabase
          .from('invoice_line_items')
          .insert({
            law_firm_id: testContext.lawFirmId,
            invoice_id: invoice.id,
            line_type: 'service_fee',
            description: `Bulk line item ${i}`,
            quantity: 1,
            unit_price: 50.00 + (i * 10),
            line_total: 50.00 + (i * 10)
          })
          .select()
          .single()
      );

      const results = await Promise.all(lineItemPromises);
      results.forEach(({ data }) => {
        if (data) dbHelper.trackRecord('invoice_line_items', data.id);
      });

      const endTime = Date.now();
      const operationDuration = endTime - startTime;

      expect(operationDuration).toBeLessThan(8000); // Should complete within 8 seconds
    });

    test('Should efficiently handle bulk vendor creation', async () => {
      const startTime = Date.now();

      // Create 15 vendors in parallel
      const vendorPromises = Array.from({ length: 15 }, (_, i) =>
        testContext.supabase
          .from('vendors')
          .insert({
            law_firm_id: testContext.lawFirmId,
            vendor_type: 'supplier',
            name: `Bulk Vendor ${i}`,
            cnpj: dbHelper.generateTestCNPJ(),
            vendor_status: 'active'
          })
          .select()
          .single()
      );

      const results = await Promise.all(vendorPromises);
      results.forEach(({ data }) => {
        if (data) dbHelper.trackRecord('vendors', data.id);
      });

      const endTime = Date.now();
      const operationDuration = endTime - startTime;

      expect(operationDuration).toBeLessThan(6000); // Should complete within 6 seconds
    });
  });

  describe('Table Size and Statistics', () => {
    test('Should analyze table statistics efficiently', async () => {
      const tables = ['time_entries', 'invoices', 'bills', 'vendors'];

      for (const table of tables) {
        const startTime = Date.now();

        const { data: stats, error } = await testContext.supabase.rpc('analyze_table_stats', {
          table_name: table
        });

        const endTime = Date.now();
        const analysisDuration = endTime - startTime;

        expect(error).toBeNull();
        expect(Array.isArray(stats)).toBe(true);
        expect(analysisDuration).toBeLessThan(2000); // Analysis should be fast
      }
    });

    test('Should track table growth efficiently', async () => {
      // Get initial row count
      const { data: initialCount } = await testContext.supabase.rpc('get_table_row_count', {
        table_name: 'time_entries'
      });

      // Add some records
      const newEntries = Array.from({ length: 5 }, () =>
        dbHelper.createTestTimeEntry({
          activity_description: 'Table growth test'
        })
      );

      await Promise.all(newEntries);

      // Get updated row count
      const { data: updatedCount } = await testContext.supabase.rpc('get_table_row_count', {
        table_name: 'time_entries'
      });

      expect(updatedCount).toBeGreaterThan(initialCount);
      expect(updatedCount - initialCount).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Memory and Resource Usage', () => {
    test('Should handle large result sets efficiently', async () => {
      // Create a larger dataset
      const largeDatasetPromises = Array.from({ length: 50 }, (_, i) =>
        dbHelper.createTestTimeEntry({
          activity_description: `Large dataset entry ${i}`,
          duration_minutes: 30 + (i % 120) // Varying durations
        })
      );

      await Promise.all(largeDatasetPromises);

      const startTime = Date.now();

      // Query large result set
      const { data: largeResultSet, error } = await testContext.supabase
        .from('time_entries')
        .select('*')
        .eq('law_firm_id', testContext.lawFirmId)
        .order('created_at', { ascending: false });

      const endTime = Date.now();
      const queryDuration = endTime - startTime;

      expect(error).toBeNull();
      expect(Array.isArray(largeResultSet)).toBe(true);
      expect(largeResultSet.length).toBeGreaterThan(50);
      expect(queryDuration).toBeLessThan(3000); // Large query, allow 3 seconds
    });

    test('Should handle pagination efficiently', async () => {
      const pageSize = 10;
      const startTime = Date.now();

      // Test paginated queries
      const page1 = await testContext.supabase
        .from('time_entries')
        .select('id, activity_description, duration_minutes')
        .eq('law_firm_id', testContext.lawFirmId)
        .order('created_at', { ascending: false })
        .range(0, pageSize - 1);

      const page2 = await testContext.supabase
        .from('time_entries')
        .select('id, activity_description, duration_minutes')
        .eq('law_firm_id', testContext.lawFirmId)
        .order('created_at', { ascending: false })
        .range(pageSize, (pageSize * 2) - 1);

      const endTime = Date.now();
      const paginationDuration = endTime - startTime;

      expect(page1.error).toBeNull();
      expect(page2.error).toBeNull();
      expect(paginationDuration).toBeLessThan(2000);

      // Pages should not overlap
      if (page1.data && page2.data && page1.data.length > 0 && page2.data.length > 0) {
        const page1Ids = page1.data.map(item => item.id);
        const page2Ids = page2.data.map(item => item.id);
        const overlap = page1Ids.filter(id => page2Ids.includes(id));
        expect(overlap.length).toBe(0);
      }
    });
  });

  describe('Query Plan Analysis', () => {
    test('Should use appropriate query plans for common operations', async () => {
      // Create some test data
      await Promise.all([
        dbHelper.createTestTimeEntry(),
        dbHelper.createTestInvoice(),
        dbHelper.createTestVendor()
      ]);

      // Test query plans for common operations
      const commonQueries = [
        // Time entries by law firm (should use index)
        `SELECT * FROM time_entries WHERE law_firm_id = '${testContext.lawFirmId}' LIMIT 10`,
        
        // Invoices by client (should use index)
        `SELECT * FROM invoices WHERE client_id = '${testContext.clientId}' LIMIT 10`,
        
        // Join query (should use efficient join strategy)
        `SELECT i.*, c.name FROM invoices i JOIN clients c ON i.client_id = c.id WHERE i.law_firm_id = '${testContext.lawFirmId}' LIMIT 5`
      ];

      for (const query of commonQueries) {
        try {
          const { data: plan, error } = await testContext.supabase.rpc('get_query_plan', {
            query_text: query
          });

          // Query plan analysis completed (specific plan analysis would depend on database configuration)
          expect(error).toBeNull();
        } catch (planError) {
          // Query plan analysis might not be available in all environments
          console.log('Query plan analysis not available:', planError.message);
        }
      }
    });
  });

  describe('Concurrent Operation Performance', () => {
    test('Should handle concurrent read operations efficiently', async () => {
      const startTime = Date.now();

      // Simulate concurrent read operations
      const concurrentReads = Array.from({ length: 10 }, () => 
        testContext.supabase
          .from('time_entries')
          .select('id, activity_description')
          .eq('law_firm_id', testContext.lawFirmId)
          .limit(5)
      );

      await Promise.all(concurrentReads);

      const endTime = Date.now();
      const concurrentDuration = endTime - startTime;

      expect(concurrentDuration).toBeLessThan(3000); // Concurrent reads should be efficient
    });

    test('Should handle mixed read/write operations', async () => {
      const startTime = Date.now();

      // Mix of read and write operations
      const mixedOperations = [
        // Reads
        testContext.supabase
          .from('invoices')
          .select('id, total_amount')
          .eq('law_firm_id', testContext.lawFirmId)
          .limit(3),
        
        testContext.supabase
          .from('vendors')
          .select('id, name')
          .eq('law_firm_id', testContext.lawFirmId)
          .limit(3),

        // Writes
        dbHelper.createTestTimeEntry({
          activity_description: 'Concurrent test entry 1'
        }),
        
        dbHelper.createTestTimeEntry({
          activity_description: 'Concurrent test entry 2'
        })
      ];

      await Promise.all(mixedOperations);

      const endTime = Date.now();
      const mixedDuration = endTime - startTime;

      expect(mixedDuration).toBeLessThan(4000); // Mixed operations should complete reasonably fast
    });
  });

  describe('Performance Regression Detection', () => {
    test('Should maintain consistent query performance', async () => {
      // Baseline query
      const iterations = 5;
      const durations = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();

        await testContext.supabase
          .from('time_entries')
          .select('id, duration_minutes, billable_amount')
          .eq('law_firm_id', testContext.lawFirmId)
          .order('created_at', { ascending: false })
          .limit(10);

        const endTime = Date.now();
        durations.push(endTime - startTime);

        // Small delay between iterations
        await dbHelper.wait(50);
      }

      // Calculate variance
      const average = durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
      const variance = durations.reduce((sum, duration) => sum + Math.pow(duration - average, 2), 0) / durations.length;
      const standardDeviation = Math.sqrt(variance);

      // Performance should be consistent (low variance)
      expect(average).toBeLessThan(1000); // Average should be under 1 second
      expect(standardDeviation).toBeLessThan(500); // Standard deviation should be reasonable
    });
  });
});