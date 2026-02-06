// Financial Management Service for Prima Facie
// Phase 8.10.1: Core service layer for AP/AR operations

import { createClient } from '@/lib/supabase/client';
import type { 
  Vendor, 
  VendorFormData,
  ExpenseCategory,
  Bill,
  BillFormData,
  BillPayment,
  BillPaymentFormData,
  PaymentCollection,
  PaymentReminder,
  FinancialAlert,
  CashFlowSummary,
  AgingReport,
  ExpenseBudgetAnalysis
} from './types';

class FinancialService {
  private supabase = createClient();

  // ====================================
  // VENDOR MANAGEMENT
  // ====================================

  async getVendors(lawFirmId: string): Promise<Vendor[]> {
    const { data, error } = await this.supabase
      .from('vendors')
      .select('*')
      .eq('law_firm_id', lawFirmId)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  async getVendor(vendorId: string): Promise<Vendor | null> {
    const { data, error } = await this.supabase
      .from('vendors')
      .select('*')
      .eq('id', vendorId)
      .single();

    if (error) throw error;
    return data;
  }

  async createVendor(lawFirmId: string, vendorData: VendorFormData): Promise<Vendor> {
    const { data, error } = await this.supabase
      .from('vendors')
      .insert({
        ...vendorData,
        law_firm_id: lawFirmId,
        created_by: (await this.supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateVendor(vendorId: string, vendorData: Partial<VendorFormData>): Promise<Vendor> {
    const { data, error } = await this.supabase
      .from('vendors')
      .update({
        ...vendorData,
        updated_by: (await this.supabase.auth.getUser()).data.user?.id
      })
      .eq('id', vendorId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteVendor(vendorId: string): Promise<void> {
    const { error } = await this.supabase
      .from('vendors')
      .update({ 
        is_active: false,
        updated_by: (await this.supabase.auth.getUser()).data.user?.id
      })
      .eq('id', vendorId);

    if (error) throw error;
  }

  async searchVendors(lawFirmId: string, query: string): Promise<Vendor[]> {
    const { data, error } = await this.supabase
      .from('vendors')
      .select('*')
      .eq('law_firm_id', lawFirmId)
      .eq('is_active', true)
      .or(`name.ilike.%${query}%,legal_name.ilike.%${query}%,cnpj.ilike.%${query}%`)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  // ====================================
  // EXPENSE CATEGORIES
  // ====================================

  async getExpenseCategories(lawFirmId: string): Promise<ExpenseCategory[]> {
    const { data, error } = await this.supabase
      .from('expense_categories')
      .select('*')
      .eq('law_firm_id', lawFirmId)
      .eq('is_active', true)
      .order('code');

    if (error) throw error;
    return data || [];
  }

  async getExpenseCategoriesHierarchy(lawFirmId: string): Promise<ExpenseCategory[]> {
    const categories = await this.getExpenseCategories(lawFirmId);
    
    // Build hierarchy
    const categoryMap = new Map<string, ExpenseCategory>();
    const rootCategories: ExpenseCategory[] = [];

    // First pass: create map
    categories.forEach(cat => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    // Second pass: build hierarchy
    categories.forEach(cat => {
      const categoryWithChildren = categoryMap.get(cat.id)!;
      
      if (cat.parent_id) {
        const parent = categoryMap.get(cat.parent_id);
        if (parent) {
          parent.children!.push(categoryWithChildren);
        }
      } else {
        rootCategories.push(categoryWithChildren);
      }
    });

    return rootCategories;
  }

  async createExpenseCategory(lawFirmId: string, categoryData: Partial<ExpenseCategory>): Promise<ExpenseCategory> {
    const { data, error } = await this.supabase
      .from('expense_categories')
      .insert({
        ...categoryData,
        law_firm_id: lawFirmId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ====================================
  // BILLS (ACCOUNTS PAYABLE)
  // ====================================

  async getBills(lawFirmId: string, filters?: {
    status?: string;
    vendor_id?: string;
    due_date_from?: string;
    due_date_to?: string;
    overdue_only?: boolean;
  }): Promise<Bill[]> {
    let query = this.supabase
      .from('bills')
      .select(`
        *,
        vendor:vendors(*),
        expense_category:expense_categories(*),
        matter:matters(*),
        payments:bill_payments(*)
      `)
      .eq('law_firm_id', lawFirmId);

    if (filters?.status) {
      query = query.eq('payment_status', filters.status);
    }

    if (filters?.vendor_id) {
      query = query.eq('vendor_id', filters.vendor_id);
    }

    if (filters?.due_date_from) {
      query = query.gte('due_date', filters.due_date_from);
    }

    if (filters?.due_date_to) {
      query = query.lte('due_date', filters.due_date_to);
    }

    if (filters?.overdue_only) {
      query = query.in('payment_status', ['overdue', 'partial'])
        .lt('due_date', new Date().toISOString().split('T')[0]);
    }

    query = query.order('due_date', { ascending: true });

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  async getBill(billId: string): Promise<Bill | null> {
    const { data, error } = await this.supabase
      .from('bills')
      .select(`
        *,
        vendor:vendors(*),
        expense_category:expense_categories(*),
        matter:matters(*),
        payments:bill_payments(*)
      `)
      .eq('id', billId)
      .single();

    if (error) throw error;
    return data;
  }

  async createBill(lawFirmId: string, billData: BillFormData): Promise<Bill> {
    const totalAmount = billData.subtotal + billData.tax_amount - billData.discount_amount;
    
    const { data, error } = await this.supabase
      .from('bills')
      .insert({
        ...billData,
        law_firm_id: lawFirmId,
        total_amount: totalAmount,
        currency_code: 'BRL',
        payment_status: 'pending',
        approval_status: 'pending',
        created_by: (await this.supabase.auth.getUser()).data.user?.id
      })
      .select(`
        *,
        vendor:vendors(*),
        expense_category:expense_categories(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async updateBill(billId: string, billData: Partial<BillFormData>): Promise<Bill> {
    const updateData: any = { ...billData };
    
    if (billData.subtotal !== undefined || billData.tax_amount !== undefined || billData.discount_amount !== undefined) {
      const bill = await this.getBill(billId);
      if (bill) {
        updateData.total_amount = 
          (billData.subtotal ?? bill.subtotal) + 
          (billData.tax_amount ?? bill.tax_amount) - 
          (billData.discount_amount ?? bill.discount_amount);
      }
    }

    updateData.updated_by = (await this.supabase.auth.getUser()).data.user?.id;

    const { data, error } = await this.supabase
      .from('bills')
      .update(updateData)
      .eq('id', billId)
      .select(`
        *,
        vendor:vendors(*),
        expense_category:expense_categories(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async approveBill(billId: string, notes?: string): Promise<Bill> {
    const { data, error } = await this.supabase
      .from('bills')
      .update({
        approval_status: 'approved',
        approved_by: (await this.supabase.auth.getUser()).data.user?.id,
        approved_at: new Date().toISOString(),
        approval_notes: notes
      })
      .eq('id', billId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async rejectBill(billId: string, notes: string): Promise<Bill> {
    const { data, error } = await this.supabase
      .from('bills')
      .update({
        approval_status: 'rejected',
        approved_by: (await this.supabase.auth.getUser()).data.user?.id,
        approved_at: new Date().toISOString(),
        approval_notes: notes
      })
      .eq('id', billId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ====================================
  // BILL PAYMENTS
  // ====================================

  async getBillPayments(billId: string): Promise<BillPayment[]> {
    const { data, error } = await this.supabase
      .from('bill_payments')
      .select('*')
      .eq('bill_id', billId)
      .order('payment_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createBillPayment(paymentData: BillPaymentFormData): Promise<BillPayment> {
    const { data, error } = await this.supabase
      .from('bill_payments')
      .insert({
        ...paymentData,
        created_by: (await this.supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteBillPayment(paymentId: string): Promise<void> {
    const { error } = await this.supabase
      .from('bill_payments')
      .delete()
      .eq('id', paymentId);

    if (error) throw error;
  }

  // ====================================
  // FINANCIAL DASHBOARD
  // ====================================

  async getCashFlowSummary(lawFirmId: string, period: 'current_month' | 'current_year' = 'current_month'): Promise<CashFlowSummary> {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (period === 'current_month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
    }

    // Get outflows (bills)
    const { data: bills } = await this.supabase
      .from('bills')
      .select('total_amount, amount_paid, expense_category:expense_categories(name)')
      .eq('law_firm_id', lawFirmId)
      .gte('bill_date', startDate.toISOString().split('T')[0])
      .lte('bill_date', endDate.toISOString().split('T')[0]);

    // Get inflows (from existing invoices system - would need to be implemented)
    // For now, using mock data
    const totalOutflow = bills?.reduce((sum, bill) => sum + bill.amount_paid, 0) || 0;
    
    return {
      period: period === 'current_month' ? 'Mês Atual' : 'Ano Atual',
      opening_balance: 250000, // Mock data
      total_inflow: 450000, // Mock data
      total_outflow: totalOutflow,
      closing_balance: 250000 + 450000 - totalOutflow,
      inflow_by_category: {
        'Honorários de Casos': 300000,
        'Assinaturas': 100000,
        'Consultas Avulsas': 50000
      },
      outflow_by_category: bills?.reduce((acc, bill) => {
        const category = bill.expense_category?.name || 'Outros';
        acc[category] = (acc[category] || 0) + bill.amount_paid;
        return acc;
      }, {} as Record<string, number>) || {},
      projected_inflow: 500000,
      projected_outflow: totalOutflow + 50000,
      projected_balance: 250000 + 500000 - (totalOutflow + 50000)
    };
  }

  async getAgingReport(lawFirmId: string): Promise<AgingReport> {
    const today = new Date().toISOString().split('T')[0];

    // Get payables aging
    const { data: payables } = await this.supabase
      .from('bills')
      .select(`
        *,
        vendor:vendors(name),
        expense_category:expense_categories(name)
      `)
      .eq('law_firm_id', lawFirmId)
      .in('payment_status', ['pending', 'partial', 'overdue']);

    const payablesAging = {
      current: 0,
      overdue_30: 0,
      overdue_60: 0,
      overdue_90: 0,
      over_90: 0,
      total: 0
    };

    payables?.forEach(bill => {
      const daysOverdue = Math.max(0, Math.floor((new Date().getTime() - new Date(bill.due_date).getTime()) / (1000 * 3600 * 24)));
      const amount = bill.balance_due;

      if (daysOverdue <= 0) {
        payablesAging.current += amount;
      } else if (daysOverdue <= 30) {
        payablesAging.overdue_30 += amount;
      } else if (daysOverdue <= 60) {
        payablesAging.overdue_60 += amount;
      } else if (daysOverdue <= 90) {
        payablesAging.overdue_90 += amount;
      } else {
        payablesAging.over_90 += amount;
      }

      payablesAging.total += amount;
    });

    return {
      as_of_date: today,
      receivables_current: 150000, // Mock - would come from invoices
      receivables_overdue_30: 25000,
      receivables_overdue_60: 15000,
      receivables_overdue_90: 10000,
      receivables_over_90: 5000,
      receivables_total: 205000,
      payables_current: payablesAging.current,
      payables_overdue_30: payablesAging.overdue_30,
      payables_overdue_60: payablesAging.overdue_60,
      payables_overdue_90: payablesAging.overdue_90,
      payables_over_90: payablesAging.over_90,
      payables_total: payablesAging.total,
      receivables_details: [], // Would be populated from payment_collections
      payables_details: payables || []
    };
  }

  async getBudgetAnalysis(lawFirmId: string): Promise<ExpenseBudgetAnalysis[]> {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Get categories with budgets
    const { data: categories } = await this.supabase
      .from('expense_categories')
      .select('*')
      .eq('law_firm_id', lawFirmId)
      .eq('is_active', true)
      .not('budget_monthly', 'is', null);

    if (!categories) return [];

    // Get spending per category
    const { data: bills } = await this.supabase
      .from('bills')
      .select('expense_category_id, amount_paid, bill_date')
      .eq('law_firm_id', lawFirmId)
      .eq('payment_status', 'paid');

    const spendingByCategory = bills?.reduce((acc, bill) => {
      const billDate = new Date(bill.bill_date);
      const billMonth = billDate.getMonth() + 1;
      const billYear = billDate.getFullYear();

      if (!acc[bill.expense_category_id]) {
        acc[bill.expense_category_id] = { month: 0, year: 0 };
      }

      if (billYear === currentYear) {
        acc[bill.expense_category_id].year += bill.amount_paid;
        
        if (billMonth === currentMonth) {
          acc[bill.expense_category_id].month += bill.amount_paid;
        }
      }

      return acc;
    }, {} as Record<string, { month: number; year: number }>) || {};

    return categories.map(category => {
      const spending = spendingByCategory[category.id] || { month: 0, year: 0 };
      const budgetMonthly = category.budget_monthly || 0;
      const budgetYearly = category.budget_yearly || 0;

      return {
        category_id: category.id,
        category_name: category.name,
        budget_monthly: budgetMonthly,
        budget_yearly: budgetYearly,
        spent_month: spending.month,
        spent_year: spending.year,
        remaining_month: budgetMonthly - spending.month,
        remaining_year: budgetYearly - spending.year,
        percentage_used_month: budgetMonthly > 0 ? (spending.month / budgetMonthly) * 100 : 0,
        percentage_used_year: budgetYearly > 0 ? (spending.year / budgetYearly) * 100 : 0,
        is_over_budget: spending.month > budgetMonthly || spending.year > budgetYearly
      };
    });
  }

  // ====================================
  // ALERTS & NOTIFICATIONS
  // ====================================

  async getFinancialAlerts(lawFirmId: string, activeOnly = true): Promise<FinancialAlert[]> {
    let query = this.supabase
      .from('financial_alerts')
      .select('*')
      .eq('law_firm_id', lawFirmId);

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    query = query.order('severity', { ascending: false })
      .order('trigger_date', { ascending: true });

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    const { error } = await this.supabase
      .from('financial_alerts')
      .update({
        is_acknowledged: true,
        acknowledged_by: (await this.supabase.auth.getUser()).data.user?.id,
        acknowledged_at: new Date().toISOString()
      })
      .eq('id', alertId);

    if (error) throw error;
  }

  async generateUpcomingDueAlerts(lawFirmId: string, daysAhead = 7): Promise<void> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysAhead);
    
    const { data: upcomingBills } = await this.supabase
      .from('bills')
      .select('*, vendor:vendors(name)')
      .eq('law_firm_id', lawFirmId)
      .eq('payment_status', 'pending')
      .lte('due_date', targetDate.toISOString().split('T')[0])
      .gte('due_date', new Date().toISOString().split('T')[0]);

    if (upcomingBills) {
      const alerts = upcomingBills.map(bill => ({
        law_firm_id: lawFirmId,
        alert_type: 'payment_due' as const,
        entity_type: 'bill' as const,
        entity_id: bill.id,
        title: `Pagamento vence em ${Math.ceil((new Date(bill.due_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24))} dias`,
        message: `${bill.vendor?.name} - ${bill.bill_number} - R$ ${bill.balance_due.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        severity: 'warning' as const,
        trigger_date: new Date().toISOString().split('T')[0]
      }));

      if (alerts.length > 0) {
        await this.supabase
          .from('financial_alerts')
          .insert(alerts);
      }
    }
  }
}

export const financialService = new FinancialService();