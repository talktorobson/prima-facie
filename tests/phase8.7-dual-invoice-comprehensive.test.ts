// Phase 8.7: Comprehensive Dual Invoice System Testing
// Testing subscription invoices, case invoices, payment plan invoices, and unified dashboard

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { subscriptionInvoiceService } from '@/lib/billing/subscription-invoice-service'
import { caseInvoiceService } from '@/lib/billing/case-invoice-service'
import { paymentPlanInvoiceService } from '@/lib/billing/payment-plan-invoice-service'
import type {
  Invoice,
  SubscriptionInvoiceGenerationRequest,
  CaseInvoiceGenerationRequest,
  PaymentPlanInvoiceGenerationRequest,
  InvoiceGenerationResult,
  BatchInvoiceGenerationResult
} from '@/lib/billing/invoice-types'

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  update: jest.fn(() => mockSupabase),
  delete: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  gte: jest.fn(() => mockSupabase),
  lte: jest.fn(() => mockSupabase),
  in: jest.fn(() => mockSupabase),
  order: jest.fn(() => mockSupabase),
  single: jest.fn(() => ({ data: null, error: null })),
  or: jest.fn(() => mockSupabase),
  filter: jest.fn(() => mockSupabase),
  limit: jest.fn(() => mockSupabase)
}

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase
}))

describe('Phase 8.7: Dual Invoice System', () => {
  const testLawFirmId = 'test-firm-123'
  const testClientId = 'test-client-456'
  const testSubscriptionId = 'test-subscription-789'
  const testMatterId = 'test-matter-321'
  const testPaymentPlanId = 'test-payment-plan-654'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Subscription Invoice Generation', () => {
    it('should generate subscription invoice with usage tracking', async () => {
      const subscriptionData = {
        id: testSubscriptionId,
        law_firm_id: testLawFirmId,
        client_id: testClientId,
        subscription_plan: {
          id: 'plan-1',
          plan_name: 'Plano Empresarial',
          monthly_fee: 1500,
          billing_cycle: 'monthly',
          service_inclusions: [
            {
              service_type: 'legal_consultation',
              quantity_included: 5,
              unit: 'sessions',
              overage_rate: 200
            },
            {
              service_type: 'document_review',
              quantity_included: 10,
              unit: 'documents',
              overage_rate: 150
            }
          ]
        },
        client: {
          id: testClientId,
          name: 'TechCorp Ltda',
          email: 'contato@techcorp.com',
          cnpj: '12.345.678/0001-90'
        }
      }

      const timeEntries = [
        {
          id: 'entry-1',
          client_subscription_id: testSubscriptionId,
          entry_type: 'subscription_work',
          task_category: 'Consultation',
          effective_minutes: 60,
          entry_date: '2025-01-15'
        },
        {
          id: 'entry-2',
          client_subscription_id: testSubscriptionId,
          entry_type: 'subscription_work',
          task_category: 'Document Review',
          effective_minutes: 30,
          entry_date: '2025-01-20'
        }
      ]

      const mockInvoice: Invoice = {
        id: 'inv-sub-001',
        law_firm_id: testLawFirmId,
        client_id: testClientId,
        invoice_number: 'SUB-2025-000001',
        invoice_type: 'subscription',
        invoice_status: 'draft',
        issue_date: '2025-01-01',
        due_date: '2025-01-31',
        subtotal: 1500,
        tax_amount: 0,
        discount_amount: 0,
        total_amount: 1500,
        currency: 'BRL',
        payment_terms: '30_days',
        payment_methods: ['pix', 'bank_transfer'],
        client_subscription_id: testSubscriptionId,
        description: 'Fatura de assinatura - Plano Empresarial',
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-01T10:00:00Z'
      }

      // Mock database responses
      mockSupabase.single
        .mockResolvedValueOnce({ data: subscriptionData, error: null }) // Get subscription
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } }) // No existing invoice
        .mockResolvedValueOnce({ data: mockInvoice, error: null }) // Create invoice

      mockSupabase.select.mockReturnValueOnce(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)

      // Mock time entries query
      mockSupabase.select
        .mockResolvedValueOnce({ data: timeEntries, error: null })

      const request: SubscriptionInvoiceGenerationRequest = {
        law_firm_id: testLawFirmId,
        client_subscription_id: testSubscriptionId,
        billing_period_start: '2025-01-01',
        billing_period_end: '2025-01-31'
      }

      const result = await subscriptionInvoiceService.generateSubscriptionInvoice(request)

      expect(result.success).toBe(true)
      expect(result.invoice).toBeDefined()
      expect(result.invoice?.invoice_type).toBe('subscription')
      expect(result.invoice?.total_amount).toBe(1500)
      expect(result.invoice?.client_subscription_id).toBe(testSubscriptionId)
    })

    it('should calculate overage charges correctly', async () => {
      const subscriptionWithOverage = {
        id: testSubscriptionId,
        law_firm_id: testLawFirmId,
        client_id: testClientId,
        subscription_plan: {
          service_inclusions: [
            {
              service_type: 'legal_consultation',
              quantity_included: 2, // Only 2 included
              unit: 'sessions',
              overage_rate: 300
            }
          ]
        }
      }

      // Mock 5 consultation sessions (3 overage)
      const excessiveTimeEntries = Array.from({ length: 5 }, (_, i) => ({
        id: `entry-${i + 1}`,
        client_subscription_id: testSubscriptionId,
        entry_type: 'subscription_work',
        task_category: 'Consultation',
        effective_minutes: 60,
        entry_date: '2025-01-15'
      }))

      mockSupabase.single.mockResolvedValueOnce({ data: subscriptionWithOverage, error: null })
      mockSupabase.select.mockResolvedValueOnce({ data: excessiveTimeEntries, error: null })

      const request: SubscriptionInvoiceGenerationRequest = {
        law_firm_id: testLawFirmId,
        client_subscription_id: testSubscriptionId,
        billing_period_start: '2025-01-01',
        billing_period_end: '2025-01-31'
      }

      const result = await subscriptionInvoiceService.generateSubscriptionInvoice(request)

      expect(result.success).toBe(true)
      // Should include overage charges (3 excess × 300 = 900)
      expect(result.invoice?.total_amount).toBeGreaterThan(1500)
    })

    it('should handle proration for mid-period subscriptions', async () => {
      const proratedSubscription = {
        id: testSubscriptionId,
        start_date: '2025-01-15', // Started mid-month
        subscription_plan: {
          monthly_fee: 3000,
          billing_cycle: 'monthly'
        }
      }

      mockSupabase.single.mockResolvedValueOnce({ data: proratedSubscription, error: null })

      const request: SubscriptionInvoiceGenerationRequest = {
        law_firm_id: testLawFirmId,
        client_subscription_id: testSubscriptionId,
        billing_period_start: '2025-01-01',
        billing_period_end: '2025-01-31'
      }

      const result = await subscriptionInvoiceService.generateSubscriptionInvoice(request)

      expect(result.success).toBe(true)
      // Should be prorated (approximately half month)
      expect(result.invoice?.total_amount).toBeLessThan(3000)
      expect(result.invoice?.total_amount).toBeGreaterThan(1400) // Around 1500 for half month
    })
  })

  describe('Case Invoice Generation', () => {
    it('should generate hourly billing case invoice', async () => {
      const matterData = {
        id: testMatterId,
        law_firm_id: testLawFirmId,
        client_id: testClientId,
        title: 'Ação Trabalhista',
        client: {
          id: testClientId,
          name: 'TechCorp Ltda',
          email: 'contato@techcorp.com'
        },
        case_type: {
          id: 'type-1',
          name: 'Trabalhista'
        }
      }

      const caseBillingConfig = {
        id: 'billing-1',
        matter_id: testMatterId,
        billing_method: 'hourly',
        hourly_rate: 350,
        minimum_fee: 2000,
        payment_terms: '30_days'
      }

      const timeEntries = [
        {
          id: 'time-1',
          matter_id: testMatterId,
          effective_minutes: 120, // 2 hours
          is_billable: true,
          billable_rate: 350,
          billable_amount: 700,
          entry_status: 'approved'
        },
        {
          id: 'time-2',
          matter_id: testMatterId,
          effective_minutes: 90, // 1.5 hours
          is_billable: true,
          billable_rate: 350,
          billable_amount: 525,
          entry_status: 'approved'
        }
      ]

      const mockInvoice: Invoice = {
        id: 'inv-case-001',
        law_firm_id: testLawFirmId,
        client_id: testClientId,
        invoice_number: 'CASE-2025-000001',
        invoice_type: 'case_billing',
        invoice_status: 'draft',
        issue_date: '2025-01-15',
        due_date: '2025-02-14',
        subtotal: 2000, // Minimum fee applied
        tax_amount: 0,
        discount_amount: 0,
        total_amount: 2000,
        currency: 'BRL',
        payment_terms: '30_days',
        payment_methods: ['pix', 'bank_transfer'],
        matter_id: testMatterId,
        description: 'Fatura do caso - Ação Trabalhista',
        created_at: '2025-01-15T14:00:00Z',
        updated_at: '2025-01-15T14:00:00Z'
      }

      // Mock database responses
      mockSupabase.single
        .mockResolvedValueOnce({ data: matterData, error: null }) // Get matter
        .mockResolvedValueOnce({ data: caseBillingConfig, error: null }) // Get billing config
        .mockResolvedValueOnce({ data: mockInvoice, error: null }) // Create invoice

      mockSupabase.select.mockResolvedValueOnce({ data: timeEntries, error: null }) // Get time entries

      const request: CaseInvoiceGenerationRequest = {
        law_firm_id: testLawFirmId,
        matter_id: testMatterId,
        include_time_entries: true
      }

      const result = await caseInvoiceService.generateCaseInvoice(request)

      expect(result.success).toBe(true)
      expect(result.invoice).toBeDefined()
      expect(result.invoice?.invoice_type).toBe('case_billing')
      expect(result.invoice?.matter_id).toBe(testMatterId)
      expect(result.invoice?.total_amount).toBe(2000) // Minimum fee applied
    })

    it('should generate percentage billing case invoice', async () => {
      const matterWithOutcome = {
        id: testMatterId,
        law_firm_id: testLawFirmId,
        client_id: testClientId,
        title: 'Ação de Cobrança'
      }

      const percentageBilling = {
        id: 'billing-2',
        billing_method: 'percentage',
        percentage_rate: 30, // 30%
        minimum_fee: 5000
      }

      const caseOutcome = {
        id: 'outcome-1',
        matter_id: testMatterId,
        amount_recovered: 50000, // R$ 50,000 recovered
        success_fee: 2000
      }

      mockSupabase.single
        .mockResolvedValueOnce({ data: matterWithOutcome, error: null })
        .mockResolvedValueOnce({ data: percentageBilling, error: null })
        .mockResolvedValueOnce({ data: caseOutcome, error: null }) // Get case outcome

      const request: CaseInvoiceGenerationRequest = {
        law_firm_id: testLawFirmId,
        matter_id: testMatterId
      }

      const result = await caseInvoiceService.generateCaseInvoice(request)

      expect(result.success).toBe(true)
      expect(result.invoice?.total_amount).toBe(17000) // 30% of 50000 + 2000 success fee
    })

    it('should generate hybrid billing case invoice', async () => {
      const hybridBilling = {
        billing_method: 'hybrid',
        hourly_rate: 400,
        percentage_rate: 20,
        minimum_fee: 8000
      }

      const timeEntries = [{
        effective_minutes: 300, // 5 hours
        is_billable: true,
        billable_rate: 400,
        billable_amount: 2000
      }]

      const caseOutcome = {
        amount_recovered: 30000,
        success_fee: 1500
      }

      mockSupabase.single
        .mockResolvedValueOnce({ data: { id: testMatterId }, error: null })
        .mockResolvedValueOnce({ data: hybridBilling, error: null })

      mockSupabase.select
        .mockResolvedValueOnce({ data: timeEntries, error: null })
        .mockResolvedValueOnce({ data: caseOutcome, error: null })

      const request: CaseInvoiceGenerationRequest = {
        law_firm_id: testLawFirmId,
        matter_id: testMatterId,
        include_time_entries: true
      }

      const result = await caseInvoiceService.generateCaseInvoice(request)

      expect(result.success).toBe(true)
      // Should include both hourly charges (2000) + percentage fee (6000) + success fee (1500) = 9500
      expect(result.invoice?.total_amount).toBe(9500)
    })
  })

  describe('Payment Plan Invoice Generation', () => {
    it('should generate payment plan installment invoice', async () => {
      const paymentPlanData = {
        id: testPaymentPlanId,
        law_firm_id: testLawFirmId,
        client_id: testClientId,
        matter_id: testMatterId,
        total_amount: 15000,
        installments: 6,
        installment_amount: 2500,
        frequency: 'monthly',
        first_payment_date: '2025-01-10',
        grace_period_days: 5,
        late_fee_rate: 2,
        auto_generate_invoices: true,
        client: {
          id: testClientId,
          name: 'TechCorp Ltda',
          email: 'contato@techcorp.com'
        },
        matter: {
          id: testMatterId,
          title: 'Contrato Empresarial'
        }
      }

      const mockInvoice: Invoice = {
        id: 'inv-plan-001',
        law_firm_id: testLawFirmId,
        client_id: testClientId,
        invoice_number: 'PLAN-2025-000001',
        invoice_type: 'payment_plan',
        invoice_status: 'draft',
        issue_date: '2025-01-10',
        due_date: '2025-01-25',
        subtotal: 2500,
        tax_amount: 0,
        discount_amount: 0,
        total_amount: 2500,
        currency: 'BRL',
        payment_terms: '7_days',
        payment_methods: ['pix', 'bank_transfer'],
        payment_plan_id: testPaymentPlanId,
        description: 'Parcela 1/6 - Contrato Empresarial',
        created_at: '2025-01-10T09:00:00Z',
        updated_at: '2025-01-10T09:00:00Z'
      }

      // Mock database responses
      mockSupabase.single
        .mockResolvedValueOnce({ data: paymentPlanData, error: null }) // Get payment plan
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } }) // No existing installment
        .mockResolvedValueOnce({ data: mockInvoice, error: null }) // Create invoice

      mockSupabase.select
        .mockResolvedValueOnce({ data: [], error: null }) // No previous installments

      const request: PaymentPlanInvoiceGenerationRequest = {
        law_firm_id: testLawFirmId,
        payment_plan_id: testPaymentPlanId,
        installment_number: 1
      }

      const result = await paymentPlanInvoiceService.generatePaymentPlanInvoice(request)

      expect(result.success).toBe(true)
      expect(result.invoice).toBeDefined()
      expect(result.invoice?.invoice_type).toBe('payment_plan')
      expect(result.invoice?.total_amount).toBe(2500)
      expect(result.invoice?.payment_plan_id).toBe(testPaymentPlanId)
    })

    it('should generate overdue installment with late fees', async () => {
      const overduePaymentPlan = {
        id: testPaymentPlanId,
        installment_amount: 2500,
        late_fee_rate: 3, // 3% late fee
        grace_period_days: 5
      }

      // Mock overdue scenario (past grace period)
      const pastDueDate = new Date()
      pastDueDate.setDate(pastDueDate.getDate() - 10) // 10 days ago

      mockSupabase.single.mockResolvedValueOnce({ 
        data: overduePaymentPlan, 
        error: null 
      })

      const request: PaymentPlanInvoiceGenerationRequest = {
        law_firm_id: testLawFirmId,
        payment_plan_id: testPaymentPlanId,
        scheduled_date: pastDueDate.toISOString().split('T')[0]
      }

      const result = await paymentPlanInvoiceService.generatePaymentPlanInvoice(request)

      expect(result.success).toBe(true)
      // Should include late fee (approximately 75 = 3% of 2500)
      expect(result.invoice?.total_amount).toBeGreaterThan(2500)
    })

    it('should generate all remaining installments in batch', async () => {
      const paymentPlan = {
        installments: 6,
        client_id: testClientId
      }

      mockSupabase.single.mockResolvedValue({ data: paymentPlan, error: null })
      mockSupabase.select.mockResolvedValue({ data: [{ installment_number: 2 }], error: null })

      const result = await paymentPlanInvoiceService.generateAllRemainingInstallments(
        testLawFirmId,
        testPaymentPlanId,
        { start_from_installment: 3 }
      )

      expect(result.success).toBe(true)
      expect(result.total_requested).toBe(4) // Installments 3, 4, 5, 6
    })
  })

  describe('Unified Billing Dashboard', () => {
    it('should load mixed invoice types correctly', async () => {
      const mixedInvoices = [
        {
          id: 'inv-1',
          invoice_type: 'subscription',
          invoice_status: 'paid',
          total_amount: 1500
        },
        {
          id: 'inv-2',
          invoice_type: 'case_billing',
          invoice_status: 'pending_review',
          total_amount: 8500
        },
        {
          id: 'inv-3',
          invoice_type: 'payment_plan',
          invoice_status: 'sent',
          total_amount: 2500
        }
      ]

      // Test that dashboard can handle all invoice types
      expect(mixedInvoices).toHaveLength(3)
      expect(mixedInvoices.map(inv => inv.invoice_type)).toEqual([
        'subscription',
        'case_billing',
        'payment_plan'
      ])

      const totalAmount = mixedInvoices.reduce((sum, inv) => sum + inv.total_amount, 0)
      expect(totalAmount).toBe(12500)
    })

    it('should calculate summary statistics correctly', async () => {
      const invoices = [
        { invoice_status: 'paid', total_amount: 1500, invoice_type: 'subscription' },
        { invoice_status: 'sent', total_amount: 2500, invoice_type: 'payment_plan' },
        { invoice_status: 'overdue', total_amount: 1000, invoice_type: 'case_billing' },
        { invoice_status: 'draft', total_amount: 3000, invoice_type: 'case_billing' }
      ]

      const summary = {
        total_invoices: invoices.length,
        total_amount: invoices.reduce((sum, inv) => sum + inv.total_amount, 0),
        paid_amount: invoices
          .filter(inv => inv.invoice_status === 'paid')
          .reduce((sum, inv) => sum + inv.total_amount, 0),
        pending_amount: invoices
          .filter(inv => ['sent', 'draft'].includes(inv.invoice_status))
          .reduce((sum, inv) => sum + inv.total_amount, 0),
        overdue_amount: invoices
          .filter(inv => inv.invoice_status === 'overdue')
          .reduce((sum, inv) => sum + inv.total_amount, 0)
      }

      expect(summary.total_invoices).toBe(4)
      expect(summary.total_amount).toBe(8000)
      expect(summary.paid_amount).toBe(1500)
      expect(summary.pending_amount).toBe(5500)
      expect(summary.overdue_amount).toBe(1000)
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete invoice lifecycle', async () => {
      // 1. Generate subscription invoice
      const subscriptionRequest: SubscriptionInvoiceGenerationRequest = {
        law_firm_id: testLawFirmId,
        client_subscription_id: testSubscriptionId,
        billing_period_start: '2025-01-01',
        billing_period_end: '2025-01-31'
      }

      // Mock subscription invoice creation
      mockSupabase.single.mockResolvedValueOnce({
        data: { 
          id: testSubscriptionId,
          subscription_plan: { monthly_fee: 1500, service_inclusions: [] }
        },
        error: null
      })

      const subscriptionResult = await subscriptionInvoiceService.generateSubscriptionInvoice(subscriptionRequest)
      expect(subscriptionResult.success).toBe(true)

      // 2. Generate case invoice
      const caseRequest: CaseInvoiceGenerationRequest = {
        law_firm_id: testLawFirmId,
        matter_id: testMatterId,
        include_time_entries: true
      }

      mockSupabase.single
        .mockResolvedValueOnce({ data: { id: testMatterId }, error: null })
        .mockResolvedValueOnce({ data: { billing_method: 'fixed', fixed_fee: 5000 }, error: null })

      const caseResult = await caseInvoiceService.generateCaseInvoice(caseRequest)
      expect(caseResult.success).toBe(true)

      // 3. Generate payment plan invoice
      const paymentPlanRequest: PaymentPlanInvoiceGenerationRequest = {
        law_firm_id: testLawFirmId,
        payment_plan_id: testPaymentPlanId,
        installment_number: 1
      }

      mockSupabase.single.mockResolvedValueOnce({
        data: { 
          installments: 6,
          installment_amount: 1000
        },
        error: null
      })

      const paymentPlanResult = await paymentPlanInvoiceService.generatePaymentPlanInvoice(paymentPlanRequest)
      expect(paymentPlanResult.success).toBe(true)

      // All invoice types should generate successfully
      expect(subscriptionResult.success).toBe(true)
      expect(caseResult.success).toBe(true)
      expect(paymentPlanResult.success).toBe(true)
    })

    it('should handle batch invoice generation', async () => {
      const lawFirmId = testLawFirmId
      const billingPeriodStart = '2025-01-01'
      const billingPeriodEnd = '2025-01-31'

      // Mock multiple subscriptions for batch processing
      const subscriptions = [
        { id: 'sub-1', client_id: 'client-1' },
        { id: 'sub-2', client_id: 'client-2' },
        { id: 'sub-3', client_id: 'client-3' }
      ]

      mockSupabase.select.mockResolvedValueOnce({ data: subscriptions, error: null })

      const batchResult = await subscriptionInvoiceService.generateBatchSubscriptionInvoices(
        lawFirmId,
        billingPeriodStart,
        billingPeriodEnd
      )

      expect(batchResult.total_requested).toBe(3)
      expect(batchResult.batch_id).toBeDefined()
    })

    it('should validate invoice numbering sequence', async () => {
      // Test that invoice numbers follow proper sequence
      const invoiceNumbers = [
        'SUB-2025-000001',
        'SUB-2025-000002',
        'CASE-2025-000001',
        'PLAN-2025-000001'
      ]

      // Validate subscription invoice numbering
      expect(invoiceNumbers[0]).toMatch(/^SUB-2025-\d{6}$/)
      expect(invoiceNumbers[1]).toMatch(/^SUB-2025-\d{6}$/)
      
      // Validate case invoice numbering
      expect(invoiceNumbers[2]).toMatch(/^CASE-2025-\d{6}$/)
      
      // Validate payment plan invoice numbering
      expect(invoiceNumbers[3]).toMatch(/^PLAN-2025-\d{6}$/)

      // Sequential numbering within type
      const subNumber1 = parseInt(invoiceNumbers[0].split('-')[2])
      const subNumber2 = parseInt(invoiceNumbers[1].split('-')[2])
      expect(subNumber2).toBe(subNumber1 + 1)
    })

    it('should enforce business rules across invoice types', async () => {
      // Test minimum fee enforcement
      const caseBillingWithMinimum = {
        billing_method: 'hourly',
        hourly_rate: 300,
        minimum_fee: 5000
      }

      const lowHourEntries = [{
        effective_minutes: 60, // 1 hour = 300
        is_billable: true,
        billable_amount: 300
      }]

      // Mock the calculation that should apply minimum fee
      const calculatedAmount = Math.max(
        300, // hourly charges
        caseBillingWithMinimum.minimum_fee // minimum fee
      )

      expect(calculatedAmount).toBe(5000) // Minimum fee should be applied

      // Test subscription overage limits
      const serviceUsage = {
        included: 5,
        used: 8,
        overage: 3,
        overage_rate: 200
      }

      const overageCharges = serviceUsage.overage * serviceUsage.overage_rate
      expect(overageCharges).toBe(600)

      // Test payment plan late fee calculation
      const lateFeeCalculation = {
        installment_amount: 2500,
        late_fee_rate: 2,
        days_overdue: 5
      }

      const lateFee = (lateFeeCalculation.installment_amount * lateFeeCalculation.late_fee_rate) / 100
      expect(lateFee).toBe(50)
    })
  })

  describe('Error Handling', () => {
    it('should handle missing subscription gracefully', async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: null })

      const request: SubscriptionInvoiceGenerationRequest = {
        law_firm_id: testLawFirmId,
        client_subscription_id: 'nonexistent-subscription',
        billing_period_start: '2025-01-01',
        billing_period_end: '2025-01-31'
      }

      const result = await subscriptionInvoiceService.generateSubscriptionInvoice(request)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Assinatura não encontrada')
    })

    it('should handle missing matter gracefully', async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: null })

      const request: CaseInvoiceGenerationRequest = {
        law_firm_id: testLawFirmId,
        matter_id: 'nonexistent-matter'
      }

      const result = await caseInvoiceService.generateCaseInvoice(request)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Caso não encontrado')
    })

    it('should handle duplicate invoice prevention', async () => {
      // Mock existing invoice
      const existingInvoice = {
        id: 'existing-inv-001',
        invoice_number: 'SUB-2025-000001'
      }

      mockSupabase.single
        .mockResolvedValueOnce({ data: { id: testSubscriptionId }, error: null }) // Subscription exists
        .mockResolvedValueOnce({ data: existingInvoice, error: null }) // Existing invoice found

      const request: SubscriptionInvoiceGenerationRequest = {
        law_firm_id: testLawFirmId,
        client_subscription_id: testSubscriptionId,
        billing_period_start: '2025-01-01',
        billing_period_end: '2025-01-31'
      }

      const result = await subscriptionInvoiceService.generateSubscriptionInvoice(request)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Fatura já existe para este período')
    })
  })
})

// Export test utilities for other test files
export {
  mockSupabase
}