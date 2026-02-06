/**
 * Database Views and Reporting Test Suite
 * Tests database views, reporting functionality, and complex aggregations
 */

const DatabaseTestHelper = require('./helpers/db-test-helper');

describe('Database Views and Reporting Tests', () => {
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

  describe('Invoice Summary View Tests', () => {
    test('Should provide accurate invoice summary data', async () => {
      // Create test invoices with different statuses
      const testInvoices = [
        { invoice_status: 'paid', total_amount: 1000.00, paid_date: new Date().toISOString().split('T')[0] },
        { invoice_status: 'sent', total_amount: 2000.00, due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
        { invoice_status: 'overdue', total_amount: 1500.00, due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
      ];

      const invoices = [];
      for (const invoiceData of testInvoices) {
        const invoice = await dbHelper.createTestInvoice(invoiceData);
        invoices.push(invoice);
        
        // Add line items to calculate line_item_count
        const { data: lineItem } = await testContext.supabase
          .from('invoice_line_items')
          .insert({
            law_firm_id: testContext.lawFirmId,
            invoice_id: invoice.id,
            line_type: 'service_fee',
            description: 'Test service',
            quantity: 1,
            unit_price: invoiceData.total_amount,
            line_total: invoiceData.total_amount
          })
          .select()
          .single();

        dbHelper.trackRecord('invoice_line_items', lineItem.id);
      }

      // Test invoice summary view
      const { data: invoiceSummaries, error } = await testContext.supabase
        .from('invoice_summary')
        .select('*')
        .in('id', invoices.map(inv => inv.id));

      expect(error).toBeNull();
      expect(invoiceSummaries.length).toBe(3);

      // Verify payment status calculation
      const paidInvoice = invoiceSummaries.find(inv => inv.invoice_status === 'paid');
      const sentInvoice = invoiceSummaries.find(inv => inv.invoice_status === 'sent');
      const overdueInvoice = invoiceSummaries.find(inv => inv.invoice_status === 'overdue');

      expect(paidInvoice.payment_status).toBe('Paid');
      expect(sentInvoice.payment_status).toBe('Due Soon');
      expect(overdueInvoice.payment_status).toBe('Overdue');

      // Verify line item count
      invoiceSummaries.forEach(summary => {
        expect(summary.line_item_count).toBe(1);
      });
    });

    test('Should handle invoice payments correctly in summary', async () => {
      const invoice = await dbHelper.createTestInvoice({
        total_amount: 1000.00,
        invoice_status: 'sent'
      });

      // Add partial payment
      const { data: payment } = await testContext.supabase
        .from('invoice_payments')
        .insert({
          law_firm_id: testContext.lawFirmId,
          invoice_id: invoice.id,
          payment_amount: 600.00,
          payment_method: 'bank_transfer'
        })
        .select()
        .single();

      dbHelper.trackRecord('invoice_payments', payment.id);

      // Check summary view
      const { data: summary } = await testContext.supabase
        .from('invoice_summary')
        .select('*')
        .eq('id', invoice.id)
        .single();

      expect(parseFloat(summary.total_payments)).toBe(600.00);
      expect(parseFloat(summary.total_amount)).toBe(1000.00);
    });
  });

  describe('Time Tracking Summary View Tests', () => {
    test('Should provide accurate time tracking summaries', async () => {
      const testDate = new Date().toISOString().split('T')[0];

      // Create time entries for the test date
      const timeEntries = [
        { 
          entry_type: 'case_work', 
          duration_minutes: 120, 
          break_minutes: 10, 
          is_billable: true, 
          billable_rate: 200.00,
          entry_date: testDate
        },
        { 
          entry_type: 'case_work', 
          duration_minutes: 90, 
          break_minutes: 5, 
          is_billable: true, 
          billable_rate: 200.00,
          entry_date: testDate
        },
        { 
          entry_type: 'administrative', 
          duration_minutes: 60, 
          break_minutes: 0, 
          is_billable: false,
          entry_date: testDate
        }
      ];

      for (const entryData of timeEntries) {
        await dbHelper.createTestTimeEntry(entryData);
      }

      // Query time tracking summary view
      const { data: summary, error } = await testContext.supabase
        .from('time_tracking_summary')
        .select('*')
        .eq('law_firm_id', testContext.lawFirmId)
        .eq('user_id', testContext.userId)
        .eq('entry_date', testDate)
        .single();

      expect(error).toBeNull();
      expect(summary.entry_count).toBe(3);
      expect(summary.total_minutes).toBe(195); // 110 + 85 + 60 (effective minutes)
      expect(summary.billable_minutes).toBe(195); // 110 + 85 (only billable entries)
      expect(parseFloat(summary.total_hours)).toBeCloseTo(3.25, 2); // 195 / 60
      expect(parseFloat(summary.billable_hours)).toBeCloseTo(3.25, 2); // 195 / 60
      expect(parseFloat(summary.total_billable_amount)).toBeGreaterThan(0);
    });

    test('Should exclude rejected entries from summary', async () => {
      const testDate = new Date().toISOString().split('T')[0];

      // Create approved and rejected entries
      await dbHelper.createTestTimeEntry({
        entry_status: 'approved',
        duration_minutes: 60,
        is_billable: true,
        billable_rate: 200.00,
        entry_date: testDate
      });

      await dbHelper.createTestTimeEntry({
        entry_status: 'rejected',
        duration_minutes: 120,
        is_billable: true,
        billable_rate: 200.00,
        entry_date: testDate
      });

      // Query summary (should exclude rejected entries)
      const { data: summary } = await testContext.supabase
        .from('time_tracking_summary')
        .select('*')
        .eq('law_firm_id', testContext.lawFirmId)
        .eq('user_id', testContext.userId)
        .eq('entry_date', testDate)
        .single();

      expect(summary.entry_count).toBe(1); // Only approved entry
      expect(summary.total_minutes).toBe(60);
    });
  });

  describe('Financial Summary View Tests', () => {
    test('Should provide accurate financial summary by month', async () => {
      const vendor = await dbHelper.createTestVendor();
      const currentMonth = new Date().toISOString().slice(0, 7) + '-01'; // First day of current month

      // Create bills with different statuses
      const billData = [
        { bill_status: 'paid', total_amount: 500.00, bill_date: currentMonth },
        { bill_status: 'approved', total_amount: 300.00, bill_date: currentMonth },
        { bill_status: 'overdue', total_amount: 200.00, bill_date: currentMonth, due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
      ];

      for (const data of billData) {
        await dbHelper.createTestBill(vendor.id, data);
      }

      // Query financial summary view
      const { data: financialSummary, error } = await testContext.supabase
        .from('financial_summary')
        .select('*')
        .eq('law_firm_id', testContext.lawFirmId);

      expect(error).toBeNull();
      expect(financialSummary.length).toBeGreaterThan(0);

      const currentMonthSummary = financialSummary.find(summary => 
        summary.month_year.startsWith(new Date().getFullYear().toString())
      );

      if (currentMonthSummary) {
        expect(currentMonthSummary.bill_count).toBe(3);
        expect(parseFloat(currentMonthSummary.total_expenses)).toBe(1000.00);
        expect(parseFloat(currentMonthSummary.paid_expenses)).toBe(500.00);
        expect(parseFloat(currentMonthSummary.pending_expenses)).toBe(300.00);
        expect(parseFloat(currentMonthSummary.overdue_expenses)).toBe(200.00);
      }
    });
  });

  describe('Custom Reporting Queries', () => {
    test('Should generate aging report for invoices', async () => {
      const today = new Date();
      
      // Create invoices with different ages
      const invoiceAges = [
        { days: 0, amount: 1000.00, status: 'sent' },
        { days: 15, amount: 2000.00, status: 'sent' },
        { days: 35, amount: 1500.00, status: 'sent' },
        { days: 65, amount: 800.00, status: 'sent' }
      ];

      for (const { days, amount, status } of invoiceAges) {
        const issueDate = new Date(today);
        issueDate.setDate(issueDate.getDate() - days);
        
        const dueDate = new Date(issueDate);
        dueDate.setDate(dueDate.getDate() + 30);

        await dbHelper.createTestInvoice({
          issue_date: issueDate.toISOString().split('T')[0],
          due_date: dueDate.toISOString().split('T')[0],
          total_amount: amount,
          invoice_status: status
        });
      }

      // Aging report query
      const { data: agingReport, error } = await testContext.supabase.rpc('execute_sql', {
        sql_query: `
          SELECT 
            CASE 
              WHEN CURRENT_DATE <= due_date THEN 'Current'
              WHEN CURRENT_DATE - due_date <= 30 THEN '1-30 Days'
              WHEN CURRENT_DATE - due_date <= 60 THEN '31-60 Days'
              ELSE '60+ Days'
            END as age_bucket,
            COUNT(*) as invoice_count,
            SUM(total_amount) as total_amount
          FROM invoices 
          WHERE law_firm_id = $1 AND invoice_status != 'paid'
          GROUP BY age_bucket
          ORDER BY 
            CASE age_bucket
              WHEN 'Current' THEN 1
              WHEN '1-30 Days' THEN 2
              WHEN '31-60 Days' THEN 3
              ELSE 4
            END
        `,
        parameters: [testContext.lawFirmId]
      });

      expect(error).toBeNull();
      expect(Array.isArray(agingReport)).toBe(true);
      
      if (agingReport.length > 0) {
        agingReport.forEach(bucket => {
          expect(bucket).toHaveProperty('age_bucket');
          expect(bucket).toHaveProperty('invoice_count');
          expect(bucket).toHaveProperty('total_amount');
        });
      }
    });

    test('Should generate time utilization report', async () => {
      const reportDate = new Date().toISOString().split('T')[0];

      // Create time entries with different types
      const entryTypes = [
        { type: 'case_work', minutes: 240, billable: true },
        { type: 'subscription_work', minutes: 120, billable: true },
        { type: 'administrative', minutes: 60, billable: false },
        { type: 'business_development', minutes: 90, billable: false }
      ];

      for (const { type, minutes, billable } of entryTypes) {
        await dbHelper.createTestTimeEntry({
          entry_type: type,
          duration_minutes: minutes,
          break_minutes: 0,
          is_billable: billable,
          billable_rate: billable ? 200.00 : 0,
          entry_date: reportDate
        });
      }

      // Utilization report query
      const { data: utilizationReport, error } = await testContext.supabase.rpc('execute_sql', {
        sql_query: `
          SELECT 
            entry_type,
            COUNT(*) as entry_count,
            SUM(effective_minutes) as total_minutes,
            ROUND(SUM(effective_minutes) / 60.0, 2) as total_hours,
            SUM(CASE WHEN is_billable THEN effective_minutes ELSE 0 END) as billable_minutes,
            SUM(billable_amount) as revenue
          FROM time_entries 
          WHERE law_firm_id = $1 AND user_id = $2 AND entry_date = $3
          GROUP BY entry_type
          ORDER BY total_minutes DESC
        `,
        parameters: [testContext.lawFirmId, testContext.userId, reportDate]
      });

      expect(error).toBeNull();
      expect(Array.isArray(utilizationReport)).toBe(true);
      expect(utilizationReport.length).toBe(4);

      const caseWorkEntry = utilizationReport.find(entry => entry.entry_type === 'case_work');
      expect(caseWorkEntry.total_minutes).toBe(240);
      expect(caseWorkEntry.billable_minutes).toBe(240);
      expect(parseFloat(caseWorkEntry.revenue)).toBeGreaterThan(0);
    });

    test('Should generate profitability report', async () => {
      // Create revenue (invoices) and expenses (bills)
      const revenue = await dbHelper.createTestInvoice({
        total_amount: 5000.00,
        invoice_status: 'paid',
        paid_date: new Date().toISOString().split('T')[0]
      });

      const vendor = await dbHelper.createTestVendor();
      const expense = await dbHelper.createTestBill(vendor.id, {
        total_amount: 1500.00,
        bill_status: 'paid'
      });

      // Profitability query
      const { data: profitabilityReport, error } = await testContext.supabase.rpc('execute_sql', {
        sql_query: `
          WITH revenue_summary AS (
            SELECT 
              DATE_TRUNC('month', issue_date) as month,
              SUM(total_amount) as total_revenue
            FROM invoices 
            WHERE law_firm_id = $1 AND invoice_status = 'paid'
            GROUP BY DATE_TRUNC('month', issue_date)
          ),
          expense_summary AS (
            SELECT 
              DATE_TRUNC('month', bill_date) as month,
              SUM(total_amount) as total_expenses
            FROM bills 
            WHERE law_firm_id = $1 AND bill_status = 'paid'
            GROUP BY DATE_TRUNC('month', bill_date)
          )
          SELECT 
            COALESCE(r.month, e.month) as month,
            COALESCE(r.total_revenue, 0) as revenue,
            COALESCE(e.total_expenses, 0) as expenses,
            COALESCE(r.total_revenue, 0) - COALESCE(e.total_expenses, 0) as profit
          FROM revenue_summary r
          FULL OUTER JOIN expense_summary e ON r.month = e.month
          ORDER BY month DESC
        `,
        parameters: [testContext.lawFirmId]
      });

      expect(error).toBeNull();
      expect(Array.isArray(profitabilityReport)).toBe(true);
      
      if (profitabilityReport.length > 0) {
        const currentMonth = profitabilityReport[0];
        expect(parseFloat(currentMonth.revenue)).toBe(5000.00);
        expect(parseFloat(currentMonth.expenses)).toBe(1500.00);
        expect(parseFloat(currentMonth.profit)).toBe(3500.00);
      }
    });
  });

  describe('Dashboard Aggregations', () => {
    test('Should provide dashboard KPI calculations', async () => {
      // Create comprehensive test data
      const vendor = await dbHelper.createTestVendor();
      
      // Revenue data
      await Promise.all([
        dbHelper.createTestInvoice({ total_amount: 2000.00, invoice_status: 'paid' }),
        dbHelper.createTestInvoice({ total_amount: 1500.00, invoice_status: 'sent' }),
        dbHelper.createTestInvoice({ total_amount: 1000.00, invoice_status: 'overdue' })
      ]);

      // Expense data
      await Promise.all([
        dbHelper.createTestBill(vendor.id, { total_amount: 800.00, bill_status: 'paid' }),
        dbHelper.createTestBill(vendor.id, { total_amount: 600.00, bill_status: 'pending' })
      ]);

      // KPI calculations
      const kpiQueries = await Promise.all([
        // Total revenue (paid invoices)
        testContext.supabase
          .from('invoices')
          .select('total_amount')
          .eq('law_firm_id', testContext.lawFirmId)
          .eq('invoice_status', 'paid'),

        // Outstanding receivables  
        testContext.supabase
          .from('invoices')
          .select('total_amount')
          .eq('law_firm_id', testContext.lawFirmId)
          .in('invoice_status', ['sent', 'viewed', 'overdue']),

        // Total expenses
        testContext.supabase
          .from('bills')
          .select('total_amount')
          .eq('law_firm_id', testContext.lawFirmId)
          .eq('bill_status', 'paid'),

        // Pending bills
        testContext.supabase
          .from('bills')
          .select('total_amount')
          .eq('law_firm_id', testContext.lawFirmId)
          .in('bill_status', ['pending', 'approved'])
      ]);

      const [revenue, receivables, expenses, pendingBills] = kpiQueries;

      expect(revenue.error).toBeNull();
      expect(receivables.error).toBeNull();
      expect(expenses.error).toBeNull();
      expect(pendingBills.error).toBeNull();

      // Calculate totals
      const totalRevenue = revenue.data.reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0);
      const totalReceivables = receivables.data.reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0);
      const totalExpenses = expenses.data.reduce((sum, bill) => sum + parseFloat(bill.total_amount), 0);
      const totalPendingBills = pendingBills.data.reduce((sum, bill) => sum + parseFloat(bill.total_amount), 0);

      expect(totalRevenue).toBe(2000.00);
      expect(totalReceivables).toBe(2500.00); // 1500 + 1000
      expect(totalExpenses).toBe(800.00);
      expect(totalPendingBills).toBe(600.00);
    });

    test('Should calculate monthly trends', async () => {
      const currentDate = new Date();
      const lastMonth = new Date(currentDate);
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      // Create data for current and last month
      await Promise.all([
        // Current month
        dbHelper.createTestInvoice({ 
          total_amount: 3000.00, 
          invoice_status: 'paid',
          issue_date: currentDate.toISOString().split('T')[0]
        }),
        
        // Last month
        dbHelper.createTestInvoice({ 
          total_amount: 2500.00, 
          invoice_status: 'paid',
          issue_date: lastMonth.toISOString().split('T')[0]
        })
      ]);

      // Monthly trend query
      const { data: monthlyTrend, error } = await testContext.supabase.rpc('execute_sql', {
        sql_query: `
          SELECT 
            DATE_TRUNC('month', issue_date) as month,
            COUNT(*) as invoice_count,
            SUM(total_amount) as revenue
          FROM invoices 
          WHERE law_firm_id = $1 AND invoice_status = 'paid'
            AND issue_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '2 months')
          GROUP BY DATE_TRUNC('month', issue_date)
          ORDER BY month DESC
        `,
        parameters: [testContext.lawFirmId]
      });

      expect(error).toBeNull();
      expect(Array.isArray(monthlyTrend)).toBe(true);
      expect(monthlyTrend.length).toBeGreaterThanOrEqual(1);

      if (monthlyTrend.length >= 2) {
        const currentMonthData = monthlyTrend[0];
        const lastMonthData = monthlyTrend[1];
        
        expect(parseFloat(currentMonthData.revenue)).toBeGreaterThan(parseFloat(lastMonthData.revenue));
      }
    });
  });

  describe('Performance and Scalability', () => {
    test('Should handle view queries efficiently with large datasets', async () => {
      // Create larger dataset for performance testing
      const vendor = await dbHelper.createTestVendor();
      
      const promises = [
        ...Array.from({ length: 20 }, () => dbHelper.createTestTimeEntry()),
        ...Array.from({ length: 15 }, () => dbHelper.createTestInvoice()),
        ...Array.from({ length: 10 }, () => dbHelper.createTestBill(vendor.id))
      ];

      await Promise.all(promises);

      const startTime = Date.now();

      // Query multiple views
      await Promise.all([
        testContext.supabase.from('invoice_summary').select('*').eq('law_firm_id', testContext.lawFirmId),
        testContext.supabase.from('time_tracking_summary').select('*').eq('law_firm_id', testContext.lawFirmId),
        testContext.supabase.from('financial_summary').select('*').eq('law_firm_id', testContext.lawFirmId)
      ]);

      const endTime = Date.now();
      const queryDuration = endTime - startTime;

      expect(queryDuration).toBeLessThan(3000); // Should complete within 3 seconds
    });
  });

  describe('Data Accuracy and Consistency', () => {
    test('Should maintain data consistency across views and base tables', async () => {
      const testDate = new Date().toISOString().split('T')[0];
      
      // Create time entry
      const timeEntry = await dbHelper.createTestTimeEntry({
        duration_minutes: 120,
        break_minutes: 20,
        is_billable: true,
        billable_rate: 250.00,
        entry_date: testDate
      });

      // Query base table
      const { data: baseData } = await testContext.supabase
        .from('time_entries')
        .select('effective_minutes, billable_amount')
        .eq('id', timeEntry.id)
        .single();

      // Query view
      const { data: viewData } = await testContext.supabase
        .from('time_tracking_summary')
        .select('total_minutes, total_billable_amount')
        .eq('law_firm_id', testContext.lawFirmId)
        .eq('user_id', testContext.userId)
        .eq('entry_date', testDate)
        .single();

      // Data should be consistent
      expect(baseData.effective_minutes).toBe(100); // 120 - 20
      expect(viewData.total_minutes).toBe(100);
      expect(parseFloat(baseData.billable_amount)).toBeCloseTo(parseFloat(viewData.total_billable_amount), 2);
    });

    test('Should handle null values correctly in aggregations', async () => {
      // Create invoice without payments
      const invoice = await dbHelper.createTestInvoice({
        total_amount: 1000.00,
        invoice_status: 'sent'
      });

      // Query invoice summary view
      const { data: summary } = await testContext.supabase
        .from('invoice_summary')
        .select('*')
        .eq('id', invoice.id)
        .single();

      // Should handle null total_payments gracefully
      expect(summary.total_payments).toBe(null);
      expect(parseFloat(summary.total_amount)).toBe(1000.00);
    });
  });
});