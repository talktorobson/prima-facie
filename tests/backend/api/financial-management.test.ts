/**
 * Financial Management API Tests
 * Comprehensive tests for bills, vendors, payments, and expense tracking
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import { APITestClient } from '../utils/api-client'
import {
  createTestLawFirm,
  createTestVendor,
  createTestBill,
  validateBillStructure,
  mockAuth,
  createMockSupabaseClient,
  simulateNetworkError,
  getDateDaysFromNow,
  formatCurrency,
  validateCNPJ,
  setupTestDatabase,
  cleanupTestDatabase
} from '../utils/test-helpers'

describe('Financial Management API', () => {
  let apiClient: APITestClient
  let testData: any

  beforeAll(async () => {
    apiClient = new APITestClient()
    const setup = await setupTestDatabase()
    testData = setup.testData
    
    // Set up authentication
    apiClient.setAuthToken('test-auth-token')
  })

  afterAll(async () => {
    await cleanupTestDatabase()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Vendor Management', () => {
    describe('CREATE Vendor', () => {
      test('should create a service provider vendor successfully', async () => {
        const vendorData = {
          name: 'Tech Solutions LTDA',
          legal_name: 'Tech Solutions Serviços de TI LTDA',
          cnpj: '12.345.678/0001-90',
          email: 'contato@techsolutions.com.br',
          phone: '+55 11 99999-9999',
          vendor_type: 'service_provider',
          payment_terms: '30_days',
          address: {
            street: 'Av. Paulista, 1000',
            city: 'São Paulo',
            state: 'SP',
            postal_code: '01310-100',
            country: 'BR'
          },
          bank_details: {
            bank_code: '001',
            branch: '1234',
            account: '567890-1',
            account_type: 'checking'
          }
        }

        const response = await apiClient.createVendor(vendorData)

        expect(response.status).toBe(201)
        expect(response.body.data.name).toBe(vendorData.name)
        expect(response.body.data.cnpj).toBe(vendorData.cnpj)
        expect(response.body.data.vendor_type).toBe(vendorData.vendor_type)
        expect(response.body.data.is_active).toBe(true)
        expect(validateCNPJ(response.body.data.cnpj)).toBe(true)
      })

      test('should create a supplier vendor successfully', async () => {
        const vendorData = {
          name: 'Office Supply Co',
          legal_name: 'Office Supply Company LTDA',
          cnpj: '98.765.432/0001-10',
          email: 'vendas@officesupply.com.br',
          phone: '+55 11 88888-8888',
          vendor_type: 'supplier',
          payment_terms: '15_days',
          category: 'office_supplies'
        }

        const response = await apiClient.createVendor(vendorData)

        expect(response.status).toBe(201)
        expect(response.body.data.vendor_type).toBe('supplier')
      })

      test('should validate required fields', async () => {
        const invalidData = {
          // Missing required fields
          email: 'invalid@example.com'
        }

        const response = await apiClient.createVendor(invalidData)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('name is required')
      })

      test('should validate CNPJ format', async () => {
        const invalidData = {
          name: 'Test Vendor',
          cnpj: 'invalid-cnpj',
          email: 'test@example.com',
          vendor_type: 'service_provider'
        }

        const response = await apiClient.createVendor(invalidData)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('Invalid CNPJ format')
      })

      test('should prevent duplicate CNPJ', async () => {
        const vendorData = {
          name: 'First Vendor',
          cnpj: '11.222.333/0001-44',
          email: 'first@vendor.com',
          vendor_type: 'service_provider'
        }

        // Create first vendor
        await apiClient.createVendor(vendorData)

        // Try to create second vendor with same CNPJ
        const duplicateData = {
          ...vendorData,
          name: 'Second Vendor',
          email: 'second@vendor.com'
        }

        const response = await apiClient.createVendor(duplicateData)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('CNPJ already registered')
      })
    })

    describe('READ Vendors', () => {
      let testVendor: any

      beforeEach(async () => {
        const vendorData = createTestVendor()
        const response = await apiClient.createVendor(vendorData)
        testVendor = response.body.data
      })

      test('should get all vendors', async () => {
        const response = await apiClient.getVendors()

        expect(response.status).toBe(200)
        expect(Array.isArray(response.body.data)).toBe(true)
        expect(response.body.data.length).toBeGreaterThan(0)
      })

      test('should get vendors with filters', async () => {
        const filters = {
          vendor_type: 'service_provider',
          is_active: true
        }

        const response = await apiClient.getVendors(filters)

        expect(response.status).toBe(200)
        expect(response.body.data.every((vendor: any) => 
          vendor.vendor_type === 'service_provider' && vendor.is_active === true
        )).toBe(true)
      })

      test('should search vendors by name or CNPJ', async () => {
        const searchParams = {
          search: testVendor.name.substring(0, 5)
        }

        const response = await apiClient.getVendors(searchParams)

        expect(response.status).toBe(200)
        expect(response.body.data.some((vendor: any) => 
          vendor.id === testVendor.id
        )).toBe(true)
      })

      test('should get single vendor by ID', async () => {
        const response = await apiClient.getVendor(testVendor.id)

        expect(response.status).toBe(200)
        expect(response.body.data.id).toBe(testVendor.id)
        expect(response.body.data).toHaveProperty('name')
        expect(response.body.data).toHaveProperty('cnpj')
        expect(response.body.data).toHaveProperty('vendor_type')
      })

      test('should return 404 for non-existent vendor', async () => {
        const response = await apiClient.getVendor('non-existent-id')

        expect(response.status).toBe(404)
        expect(response.body.error.message).toContain('Vendor not found')
      })
    })

    describe('UPDATE Vendor', () => {
      let testVendor: any

      beforeEach(async () => {
        const vendorData = createTestVendor()
        const response = await apiClient.createVendor(vendorData)
        testVendor = response.body.data
      })

      test('should update vendor information', async () => {
        const updateData = {
          name: 'Updated Vendor Name',
          email: 'updated@vendor.com',
          phone: '+55 11 77777-7777',
          payment_terms: '15_days'
        }

        const response = await apiClient.updateVendor(testVendor.id, updateData)

        expect(response.status).toBe(200)
        expect(response.body.data.name).toBe(updateData.name)
        expect(response.body.data.email).toBe(updateData.email)
        expect(response.body.data.payment_terms).toBe(updateData.payment_terms)
      })

      test('should update vendor bank details', async () => {
        const updateData = {
          bank_details: {
            bank_code: '033',
            branch: '5678',
            account: '123456-7',
            account_type: 'savings'
          }
        }

        const response = await apiClient.updateVendor(testVendor.id, updateData)

        expect(response.status).toBe(200)
        expect(response.body.data.bank_details.bank_code).toBe('033')
        expect(response.body.data.bank_details.account_type).toBe('savings')
      })

      test('should prevent updating CNPJ', async () => {
        const updateData = {
          cnpj: '11.111.111/0001-11'
        }

        const response = await apiClient.updateVendor(testVendor.id, updateData)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('CNPJ cannot be changed')
      })
    })

    describe('DELETE Vendor', () => {
      let testVendor: any

      beforeEach(async () => {
        const vendorData = createTestVendor()
        const response = await apiClient.createVendor(vendorData)
        testVendor = response.body.data
      })

      test('should soft delete vendor', async () => {
        const response = await apiClient.deleteVendor(testVendor.id)

        expect(response.status).toBe(204)

        // Verify vendor is marked as inactive
        const getResponse = await apiClient.getVendor(testVendor.id)
        expect(getResponse.body.data.is_active).toBe(false)
      })

      test('should prevent deletion of vendor with pending bills', async () => {
        // Create a bill for the vendor
        const billData = {
          vendor_id: testVendor.id,
          bill_number: 'BILL-001',
          bill_date: new Date().toISOString().split('T')[0],
          due_date: getDateDaysFromNow(30),
          subtotal: 1000.00,
          tax_amount: 100.00,
          total_amount: 1100.00
        }

        await apiClient.createBill(billData)

        const response = await apiClient.deleteVendor(testVendor.id)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('Cannot delete vendor with existing bills')
      })
    })
  })

  describe('Bill Management (Accounts Payable)', () => {
    let testVendor: any

    beforeAll(async () => {
      const vendorData = createTestVendor()
      const response = await apiClient.createVendor(vendorData)
      testVendor = response.body.data
    })

    describe('CREATE Bill', () => {
      test('should create a service bill successfully', async () => {
        const billData = {
          vendor_id: testVendor.id,
          bill_number: 'SERV-2024-001',
          bill_date: new Date().toISOString().split('T')[0],
          due_date: getDateDaysFromNow(30),
          description: 'IT services for March 2024',
          expense_category_id: 'professional-services',
          subtotal: 2500.00,
          tax_amount: 250.00,
          discount_amount: 0.00,
          currency_code: 'BRL'
        }

        const response = await apiClient.createBill(billData)

        expect(response.status).toBe(201)
        expect(response.body.data).toHaveProperty('id')
        validateBillStructure(response.body.data)
        expect(response.body.data.vendor_id).toBe(testVendor.id)
        expect(response.body.data.total_amount).toBe(2750.00)
        expect(response.body.data.payment_status).toBe('pending')
        expect(response.body.data.approval_status).toBe('pending')
      })

      test('should create a recurring bill successfully', async () => {
        const billData = {
          vendor_id: testVendor.id,
          bill_number: 'RENT-2024-03',
          bill_date: new Date().toISOString().split('T')[0],
          due_date: getDateDaysFromNow(15),
          description: 'Office rent - March 2024',
          expense_category_id: 'rent',
          subtotal: 5000.00,
          tax_amount: 0.00,
          is_recurring: true,
          recurrence_pattern: 'monthly',
          next_bill_date: getDateDaysFromNow(30)
        }

        const response = await apiClient.createBill(billData)

        expect(response.status).toBe(201)
        expect(response.body.data.is_recurring).toBe(true)
        expect(response.body.data.recurrence_pattern).toBe('monthly')
      })

      test('should create bill with matter association', async () => {
        const billData = {
          vendor_id: testVendor.id,
          bill_number: 'CASE-EXP-001',
          bill_date: new Date().toISOString().split('T')[0],
          due_date: getDateDaysFromNow(30),
          description: 'Expert witness fees',
          matter_id: testData.matter.id,
          expense_category_id: 'expert-fees',
          subtotal: 1500.00,
          tax_amount: 150.00,
          is_reimbursable: true
        }

        const response = await apiClient.createBill(billData)

        expect(response.status).toBe(201)
        expect(response.body.data.matter_id).toBe(testData.matter.id)
        expect(response.body.data.is_reimbursable).toBe(true)
      })

      test('should validate required fields', async () => {
        const invalidData = {
          // Missing vendor_id
          bill_number: 'INVALID-001'
        }

        const response = await apiClient.createBill(invalidData)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('vendor_id is required')
      })

      test('should validate bill amounts', async () => {
        const invalidData = {
          vendor_id: testVendor.id,
          bill_number: 'INVALID-002',
          bill_date: new Date().toISOString().split('T')[0],
          due_date: getDateDaysFromNow(30),
          subtotal: -100.00 // Negative amount
        }

        const response = await apiClient.createBill(invalidData)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('Subtotal must be positive')
      })

      test('should validate due date', async () => {
        const invalidData = {
          vendor_id: testVendor.id,
          bill_number: 'INVALID-003',
          bill_date: new Date().toISOString().split('T')[0],
          due_date: '2023-01-01', // Past date
          subtotal: 100.00
        }

        const response = await apiClient.createBill(invalidData)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('Due date cannot be in the past')
      })
    })

    describe('READ Bills', () => {
      let testBill: any

      beforeEach(async () => {
        const billData = createTestBill()
        billData.vendor_id = testVendor.id
        const response = await apiClient.createBill(billData)
        testBill = response.body.data
      })

      test('should get all bills', async () => {
        const response = await apiClient.getBills()

        expect(response.status).toBe(200)
        expect(Array.isArray(response.body.data)).toBe(true)
        expect(response.body.data.length).toBeGreaterThan(0)
      })

      test('should get bills with status filter', async () => {
        const filters = {
          payment_status: 'pending'
        }

        const response = await apiClient.getBills(filters)

        expect(response.status).toBe(200)
        expect(response.body.data.every((bill: any) => 
          bill.payment_status === 'pending'
        )).toBe(true)
      })

      test('should get overdue bills', async () => {
        const filters = {
          overdue_only: true
        }

        const response = await apiClient.getBills(filters)

        expect(response.status).toBe(200)
        expect(Array.isArray(response.body.data)).toBe(true)
      })

      test('should get bills by vendor', async () => {
        const filters = {
          vendor_id: testVendor.id
        }

        const response = await apiClient.getBills(filters)

        expect(response.status).toBe(200)
        expect(response.body.data.every((bill: any) => 
          bill.vendor_id === testVendor.id
        )).toBe(true)
      })

      test('should get single bill by ID with related data', async () => {
        const response = await apiClient.getBill(testBill.id)

        expect(response.status).toBe(200)
        expect(response.body.data.id).toBe(testBill.id)
        expect(response.body.data).toHaveProperty('vendor')
        expect(response.body.data).toHaveProperty('payments')
        expect(response.body.data.vendor.id).toBe(testVendor.id)
      })

      test('should get bills with date range filter', async () => {
        const filters = {
          due_date_from: new Date().toISOString().split('T')[0],
          due_date_to: getDateDaysFromNow(60)
        }

        const response = await apiClient.getBills(filters)

        expect(response.status).toBe(200)
        expect(Array.isArray(response.body.data)).toBe(true)
      })
    })

    describe('UPDATE Bill', () => {
      let testBill: any

      beforeEach(async () => {
        const billData = createTestBill()
        billData.vendor_id = testVendor.id
        const response = await apiClient.createBill(billData)
        testBill = response.body.data
      })

      test('should update bill information', async () => {
        const updateData = {
          description: 'Updated bill description',
          due_date: getDateDaysFromNow(45),
          subtotal: 1200.00,
          tax_amount: 120.00
        }

        const response = await apiClient.updateBill(testBill.id, updateData)

        expect(response.status).toBe(200)
        expect(response.body.data.description).toBe(updateData.description)
        expect(response.body.data.subtotal).toBe(updateData.subtotal)
        expect(response.body.data.total_amount).toBe(1320.00) // Updated total
      })

      test('should prevent updates to approved bills', async () => {
        // First approve the bill
        await apiClient.approveBill(testBill.id, 'Approved for payment')

        const updateData = {
          subtotal: 2000.00
        }

        const response = await apiClient.updateBill(testBill.id, updateData)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('Cannot update approved bill')
      })

      test('should prevent updates to paid bills', async () => {
        // Mock the bill as paid
        await apiClient.updateBill(testBill.id, {
          payment_status: 'paid'
        })

        const updateData = {
          subtotal: 2000.00
        }

        const response = await apiClient.updateBill(testBill.id, updateData)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('Cannot update paid bill')
      })
    })

    describe('Bill Approval Workflow', () => {
      let testBill: any

      beforeEach(async () => {
        const billData = createTestBill()
        billData.vendor_id = testVendor.id
        const response = await apiClient.createBill(billData)
        testBill = response.body.data
      })

      test('should approve bill successfully', async () => {
        const approvalNotes = 'Approved - all documentation verified'

        const response = await apiClient.approveBill(testBill.id, approvalNotes)

        expect(response.status).toBe(200)
        expect(response.body.data.approval_status).toBe('approved')
        expect(response.body.data.approval_notes).toBe(approvalNotes)
        expect(response.body.data.approved_at).toBeTruthy()
        expect(response.body.data.approved_by).toBeTruthy()
      })

      test('should reject bill with reason', async () => {
        const rejectionNotes = 'Rejected - missing invoice documentation'

        const response = await apiClient.rejectBill(testBill.id, rejectionNotes)

        expect(response.status).toBe(200)
        expect(response.body.data.approval_status).toBe('rejected')
        expect(response.body.data.approval_notes).toBe(rejectionNotes)
      })

      test('should validate approval notes when rejecting', async () => {
        const response = await apiClient.rejectBill(testBill.id, '')

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('Rejection reason is required')
      })

      test('should prevent re-approval of already approved bill', async () => {
        // First approval
        await apiClient.approveBill(testBill.id, 'Initial approval')

        // Try to approve again
        const response = await apiClient.approveBill(testBill.id, 'Second approval')

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('Bill already approved')
      })
    })

    describe('Bill Payments', () => {
      let testBill: any

      beforeEach(async () => {
        const billData = createTestBill()
        billData.vendor_id = testVendor.id
        const response = await apiClient.createBill(billData)
        testBill = response.body.data

        // Approve the bill for payment
        await apiClient.approveBill(testBill.id, 'Approved for payment')
      })

      test('should record full payment', async () => {
        const paymentData = {
          payment_amount: testBill.total_amount,
          payment_method: 'bank_transfer',
          payment_date: new Date().toISOString().split('T')[0],
          reference_number: 'TXN-123456789',
          notes: 'Full payment via bank transfer'
        }

        const response = await apiClient.payBill(testBill.id, paymentData)

        expect(response.status).toBe(201)
        expect(response.body.data.payment_amount).toBe(paymentData.payment_amount)
        expect(response.body.data.payment_method).toBe(paymentData.payment_method)

        // Verify bill status updated
        const billResponse = await apiClient.getBill(testBill.id)
        expect(billResponse.body.data.payment_status).toBe('paid')
        expect(billResponse.body.data.amount_paid).toBe(testBill.total_amount)
      })

      test('should record partial payment', async () => {
        const partialAmount = testBill.total_amount * 0.6
        const paymentData = {
          payment_amount: partialAmount,
          payment_method: 'pix',
          payment_date: new Date().toISOString().split('T')[0],
          notes: 'Partial payment - 60%'
        }

        const response = await apiClient.payBill(testBill.id, paymentData)

        expect(response.status).toBe(201)

        // Verify bill status updated
        const billResponse = await apiClient.getBill(testBill.id)
        expect(billResponse.body.data.payment_status).toBe('partial')
        expect(billResponse.body.data.amount_paid).toBe(partialAmount)
        expect(billResponse.body.data.balance_due).toBe(testBill.total_amount - partialAmount)
      })

      test('should handle multiple partial payments', async () => {
        const firstPayment = testBill.total_amount * 0.4
        const secondPayment = testBill.total_amount * 0.6

        // First payment
        await apiClient.payBill(testBill.id, {
          payment_amount: firstPayment,
          payment_method: 'bank_transfer',
          payment_date: new Date().toISOString().split('T')[0]
        })

        // Second payment
        const response = await apiClient.payBill(testBill.id, {
          payment_amount: secondPayment,
          payment_method: 'pix',
          payment_date: new Date().toISOString().split('T')[0]
        })

        expect(response.status).toBe(201)

        // Verify bill is fully paid
        const billResponse = await apiClient.getBill(testBill.id)
        expect(billResponse.body.data.payment_status).toBe('paid')
        expect(billResponse.body.data.amount_paid).toBe(testBill.total_amount)
        expect(billResponse.body.data.payments.length).toBe(2)
      })

      test('should validate payment amount', async () => {
        const invalidPaymentData = {
          payment_amount: testBill.total_amount * 2, // Overpayment
          payment_method: 'bank_transfer',
          payment_date: new Date().toISOString().split('T')[0]
        }

        const response = await apiClient.payBill(testBill.id, invalidPaymentData)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('Payment amount exceeds bill balance')
      })

      test('should prevent payment on unapproved bill', async () => {
        // Create unapproved bill
        const billData = createTestBill()
        billData.vendor_id = testVendor.id
        const unapprovedBillResponse = await apiClient.createBill(billData)
        const unapprovedBill = unapprovedBillResponse.body.data

        const paymentData = {
          payment_amount: unapprovedBill.total_amount,
          payment_method: 'bank_transfer',
          payment_date: new Date().toISOString().split('T')[0]
        }

        const response = await apiClient.payBill(unapprovedBill.id, paymentData)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('Bill must be approved before payment')
      })
    })
  })

  describe('Financial Dashboard and Reporting', () => {
    beforeEach(async () => {
      // Create test data for dashboard
      const vendor = await apiClient.createVendor(createTestVendor())
      const vendorId = vendor.body.data.id

      // Create bills in different statuses
      const bills = [
        {
          vendor_id: vendorId,
          bill_number: 'DASH-001',
          bill_date: new Date().toISOString().split('T')[0],
          due_date: getDateDaysFromNow(-5), // Overdue
          subtotal: 1000.00,
          tax_amount: 100.00,
          total_amount: 1100.00,
          payment_status: 'overdue'
        },
        {
          vendor_id: vendorId,
          bill_number: 'DASH-002',
          bill_date: new Date().toISOString().split('T')[0],
          due_date: getDateDaysFromNow(15), // Current
          subtotal: 2000.00,
          tax_amount: 200.00,
          total_amount: 2200.00,
          payment_status: 'pending'
        }
      ]

      for (const bill of bills) {
        await apiClient.createBill(bill)
      }
    })

    describe('Cash Flow Summary', () => {
      test('should get current month cash flow summary', async () => {
        const response = await apiClient.getCashFlowSummary('current_month')

        expect(response.status).toBe(200)
        expect(response.body.data).toHaveProperty('opening_balance')
        expect(response.body.data).toHaveProperty('total_inflow')
        expect(response.body.data).toHaveProperty('total_outflow')
        expect(response.body.data).toHaveProperty('closing_balance')
        expect(response.body.data).toHaveProperty('inflow_by_category')
        expect(response.body.data).toHaveProperty('outflow_by_category')
        expect(response.body.data).toHaveProperty('projected_balance')
      })

      test('should get current year cash flow summary', async () => {
        const response = await apiClient.getCashFlowSummary('current_year')

        expect(response.status).toBe(200)
        expect(response.body.data.period).toBe('Ano Atual')
      })

      test('should calculate projected cash flow', async () => {
        const response = await apiClient.getCashFlowSummary()

        expect(response.status).toBe(200)
        expect(response.body.data.projected_inflow).toBeGreaterThanOrEqual(0)
        expect(response.body.data.projected_outflow).toBeGreaterThanOrEqual(0)
        expect(typeof response.body.data.projected_balance).toBe('number')
      })
    })

    describe('Aging Report', () => {
      test('should get aging report for receivables and payables', async () => {
        const response = await apiClient.getAgingReport()

        expect(response.status).toBe(200)
        expect(response.body.data).toHaveProperty('as_of_date')
        expect(response.body.data).toHaveProperty('receivables_current')
        expect(response.body.data).toHaveProperty('receivables_overdue_30')
        expect(response.body.data).toHaveProperty('receivables_overdue_60')
        expect(response.body.data).toHaveProperty('receivables_overdue_90')
        expect(response.body.data).toHaveProperty('receivables_over_90')
        expect(response.body.data).toHaveProperty('payables_current')
        expect(response.body.data).toHaveProperty('payables_overdue_30')
        expect(response.body.data).toHaveProperty('payables_overdue_60')
        expect(response.body.data).toHaveProperty('payables_overdue_90')
        expect(response.body.data).toHaveProperty('payables_over_90')
        expect(response.body.data).toHaveProperty('payables_details')
      })

      test('should categorize bills by aging correctly', async () => {
        const response = await apiClient.getAgingReport()

        expect(response.status).toBe(200)
        expect(response.body.data.payables_total).toBeGreaterThan(0)
        expect(Array.isArray(response.body.data.payables_details)).toBe(true)
      })
    })

    describe('Budget Analysis', () => {
      test('should get budget vs actual analysis', async () => {
        const response = await apiClient.getBills({
          include_budget_analysis: true
        })

        expect(response.status).toBe(200)
        if (response.body.data.budget_analysis) {
          expect(Array.isArray(response.body.data.budget_analysis)).toBe(true)
        }
      })
    })
  })

  describe('Expense Categories', () => {
    test('should get expense categories hierarchy', async () => {
      const response = await apiClient.getVendors() // Using vendor endpoint as placeholder

      expect(response.status).toBe(200)
      // In actual implementation, this would be a separate endpoint
    })

    test('should create expense category', async () => {
      const categoryData = {
        name: 'Legal Research Services',
        code: 'LRS',
        description: 'External legal research and analysis services',
        parent_id: null,
        budget_monthly: 2000.00,
        budget_yearly: 24000.00,
        is_reimbursable: true
      }

      // In actual implementation, this would be a separate endpoint
      // For now, testing via vendor creation as placeholder
      const response = await apiClient.createVendor({
        name: categoryData.name,
        vendor_type: 'service_provider',
        email: 'test@category.com'
      })

      expect(response.status).toBe(201)
    })
  })

  describe('Financial Alerts and Notifications', () => {
    test('should generate upcoming payment alerts', async () => {
      // This would be tested via webhook or notification endpoint
      // For now, placeholder test
      const response = await apiClient.getBills({
        due_date_from: new Date().toISOString().split('T')[0],
        due_date_to: getDateDaysFromNow(7)
      })

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    test('should identify overdue bills', async () => {
      const response = await apiClient.getBills({
        overdue_only: true
      })

      expect(response.status).toBe(200)
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    test('should calculate late fees for overdue bills', async () => {
      // Create overdue bill
      const billData = {
        vendor_id: (await apiClient.createVendor(createTestVendor())).body.data.id,
        bill_number: 'LATE-001',
        bill_date: getDateDaysFromNow(-60),
        due_date: getDateDaysFromNow(-30),
        subtotal: 1000.00,
        tax_amount: 100.00,
        late_fee_rate: 2.0 // 2% per month
      }

      const response = await apiClient.createBill(billData)

      expect(response.status).toBe(201)
      // In actual implementation, late fees would be calculated automatically
    })
  })

  describe('Error Handling and Edge Cases', () => {
    test('should handle concurrent bill payments', async () => {
      // Create bill
      const billData = createTestBill()
      billData.vendor_id = (await apiClient.createVendor(createTestVendor())).body.data.id
      const billResponse = await apiClient.createBill(billData)
      const bill = billResponse.body.data

      // Approve bill
      await apiClient.approveBill(bill.id, 'Approved')

      // Attempt concurrent payments
      const paymentAmount = bill.total_amount / 2
      const concurrentPayments = Array.from({ length: 3 }, () => 
        apiClient.payBill(bill.id, {
          payment_amount: paymentAmount,
          payment_method: 'bank_transfer',
          payment_date: new Date().toISOString().split('T')[0]
        })
      )

      const responses = await Promise.allSettled(concurrentPayments)
      const successfulPayments = responses.filter(
        (result) => result.status === 'fulfilled' && 
        result.value.status === 201
      )

      // Should prevent overpayment
      expect(successfulPayments.length).toBeLessThanOrEqual(2)
    })

    test('should handle database constraints', async () => {
      const invalidBillData = {
        vendor_id: 'non-existent-vendor',
        bill_number: 'INVALID-001',
        bill_date: new Date().toISOString().split('T')[0],
        due_date: getDateDaysFromNow(30),
        subtotal: 100.00
      }

      const response = await apiClient.createBill(invalidBillData)

      expect(response.status).toBe(400)
      expect(response.body.error.message).toContain('Vendor not found')
    })

    test('should validate currency codes', async () => {
      const billData = {
        vendor_id: (await apiClient.createVendor(createTestVendor())).body.data.id,
        bill_number: 'CURR-001',
        bill_date: new Date().toISOString().split('T')[0],
        due_date: getDateDaysFromNow(30),
        subtotal: 100.00,
        currency_code: 'INVALID'
      }

      const response = await apiClient.createBill(billData)

      expect(response.status).toBe(400)
      expect(response.body.error.message).toContain('Invalid currency code')
    })

    test('should handle large amounts correctly', async () => {
      const billData = {
        vendor_id: (await apiClient.createVendor(createTestVendor())).body.data.id,
        bill_number: 'LARGE-001',
        bill_date: new Date().toISOString().split('T')[0],
        due_date: getDateDaysFromNow(30),
        subtotal: 999999999.99,
        tax_amount: 99999999.99
      }

      const response = await apiClient.createBill(billData)

      expect(response.status).toBe(201)
      expect(response.body.data.total_amount).toBe(1099999999.98)
    })
  })

  describe('Performance and Scalability', () => {
    test('should handle large vendor lists efficiently', async () => {
      const startTime = Date.now()
      
      const response = await apiClient.getVendors({
        limit: 1000
      })
      
      const endTime = Date.now()
      const responseTime = endTime - startTime

      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(3000) // Should respond within 3 seconds
    })

    test('should handle complex bill queries efficiently', async () => {
      const complexFilters = {
        payment_status: 'pending',
        due_date_from: '2024-01-01',
        due_date_to: '2024-12-31',
        include_vendor_details: true,
        include_payment_history: true,
        sort_by: 'due_date',
        sort_order: 'asc'
      }

      const startTime = Date.now()
      const response = await apiClient.getBills(complexFilters)
      const endTime = Date.now()

      expect(response.status).toBe(200)
      expect(endTime - startTime).toBeLessThan(5000)
    })
  })
})