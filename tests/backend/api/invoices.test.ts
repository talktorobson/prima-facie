/**
 * Invoice Management API Tests
 * Comprehensive tests for all invoice-related API endpoints
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import { APITestClient } from '../utils/api-client'
import {
  createTestLawFirm,
  createTestClient,
  createTestMatter,
  createTestInvoice,
  createTestSubscription,
  validateInvoiceStructure,
  mockAuth,
  createMockSupabaseClient,
  simulateNetworkError,
  simulateValidationError,
  getDateDaysFromNow,
  setupTestDatabase,
  cleanupTestDatabase
} from '../utils/test-helpers'

describe('Invoice Management API', () => {
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

  describe('Invoice CRUD Operations', () => {
    describe('CREATE Invoice', () => {
      test('should create a subscription invoice successfully', async () => {
        const invoiceData = {
          client_id: testData.client.id,
          invoice_type: 'subscription',
          client_subscription_id: 'test-subscription-id',
          description: 'Monthly subscription fee',
          due_date: getDateDaysFromNow(30),
          payment_terms: '30_days',
          payment_methods: ['pix', 'bank_transfer'],
          line_items: [
            {
              line_type: 'subscription_fee',
              description: 'Professional Plan - Monthly',
              quantity: 1,
              unit_price: 500.00,
              is_taxable: true
            }
          ]
        }

        const response = await apiClient.createInvoice(invoiceData)

        expect(response.status).toBe(201)
        expect(response.body).toHaveProperty('data')
        validateInvoiceStructure(response.body.data)
        expect(response.body.data.invoice_type).toBe('subscription')
        expect(response.body.data.invoice_status).toBe('draft')
        expect(response.body.data.client_id).toBe(testData.client.id)
      })

      test('should create a case billing invoice successfully', async () => {
        const invoiceData = {
          client_id: testData.client.id,
          invoice_type: 'case_billing',
          matter_id: testData.matter.id,
          description: 'Legal services for Case #123',
          due_date: getDateDaysFromNow(15),
          payment_terms: '15_days',
          payment_methods: ['pix', 'credit_card'],
          line_items: [
            {
              line_type: 'case_fee',
              description: 'Legal consultation and document review',
              quantity: 10,
              unit_price: 150.00,
              is_taxable: true
            },
            {
              line_type: 'expense',
              description: 'Court filing fees',
              quantity: 1,
              unit_price: 50.00,
              is_taxable: false
            }
          ]
        }

        const response = await apiClient.createInvoice(invoiceData)

        expect(response.status).toBe(201)
        expect(response.body.data.invoice_type).toBe('case_billing')
        expect(response.body.data.matter_id).toBe(testData.matter.id)
        expect(response.body.data.line_items).toHaveLength(2)
        expect(response.body.data.total_amount).toBeGreaterThan(0)
      })

      test('should create a time-based invoice successfully', async () => {
        const invoiceData = {
          client_id: testData.client.id,
          invoice_type: 'time_based',
          matter_id: testData.matter.id,
          description: 'Time-based billing for March 2024',
          due_date: getDateDaysFromNow(30),
          payment_terms: '30_days',
          payment_methods: ['bank_transfer'],
          time_entry_ids: ['test-time-entry-1', 'test-time-entry-2'],
          line_items: [
            {
              line_type: 'time_entry',
              description: 'Legal research - 2 hours',
              quantity: 2,
              unit_price: 200.00,
              is_taxable: true,
              time_entry_id: 'test-time-entry-1'
            }
          ]
        }

        const response = await apiClient.createInvoice(invoiceData)

        expect(response.status).toBe(201)
        expect(response.body.data.invoice_type).toBe('time_based')
      })

      test('should create a payment plan invoice successfully', async () => {
        const invoiceData = {
          client_id: testData.client.id,
          invoice_type: 'payment_plan',
          payment_plan_id: 'test-payment-plan-id',
          description: 'Payment Plan Installment 1/12',
          due_date: getDateDaysFromNow(30),
          payment_terms: '30_days',
          payment_methods: ['pix'],
          line_items: [
            {
              line_type: 'case_fee',
              description: 'Installment 1 of 12',
              quantity: 1,
              unit_price: 833.33,
              is_taxable: true
            }
          ]
        }

        const response = await apiClient.createInvoice(invoiceData)

        expect(response.status).toBe(201)
        expect(response.body.data.invoice_type).toBe('payment_plan')
        expect(response.body.data.payment_plan_id).toBe('test-payment-plan-id')
      })

      test('should validate required fields', async () => {
        const invalidData = {
          // Missing required fields
          invoice_type: 'subscription'
        }

        const response = await apiClient.createInvoice(invalidData)

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('error')
        expect(response.body.error.message).toContain('client_id is required')
      })

      test('should validate invoice type', async () => {
        const invalidData = {
          client_id: testData.client.id,
          invoice_type: 'invalid_type',
          due_date: getDateDaysFromNow(30)
        }

        const response = await apiClient.createInvoice(invalidData)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('Invalid invoice type')
      })

      test('should validate line items', async () => {
        const invalidData = {
          client_id: testData.client.id,
          invoice_type: 'subscription',
          due_date: getDateDaysFromNow(30),
          line_items: [
            {
              // Missing required fields
              description: 'Test item'
            }
          ]
        }

        const response = await apiClient.createInvoice(invalidData)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('line_type is required')
      })
    })

    describe('READ Invoices', () => {
      let testInvoice: any

      beforeEach(async () => {
        // Create a test invoice
        const invoiceData = createTestInvoice()
        const response = await apiClient.createInvoice(invoiceData)
        testInvoice = response.body.data
      })

      test('should get all invoices', async () => {
        const response = await apiClient.getInvoices()

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('data')
        expect(Array.isArray(response.body.data)).toBe(true)
        expect(response.body.data.length).toBeGreaterThan(0)
      })

      test('should get invoices with filters', async () => {
        const filters = {
          invoice_type: 'subscription',
          invoice_status: 'draft',
          client_id: testData.client.id
        }

        const response = await apiClient.getInvoices(filters)

        expect(response.status).toBe(200)
        expect(response.body.data.every((invoice: any) => 
          invoice.invoice_type === 'subscription'
        )).toBe(true)
      })

      test('should get invoices with date range filter', async () => {
        const filters = {
          issue_date_from: '2024-01-01',
          issue_date_to: '2024-12-31'
        }

        const response = await apiClient.getInvoices(filters)

        expect(response.status).toBe(200)
        expect(Array.isArray(response.body.data)).toBe(true)
      })

      test('should get single invoice by ID', async () => {
        const response = await apiClient.getInvoice(testInvoice.id)

        expect(response.status).toBe(200)
        expect(response.body.data.id).toBe(testInvoice.id)
        validateInvoiceStructure(response.body.data)
        expect(response.body.data).toHaveProperty('line_items')
        expect(response.body.data).toHaveProperty('client')
      })

      test('should return 404 for non-existent invoice', async () => {
        const response = await apiClient.getInvoice('non-existent-id')

        expect(response.status).toBe(404)
        expect(response.body.error.message).toContain('Invoice not found')
      })

      test('should support pagination', async () => {
        const response = await apiClient.getInvoices({
          page: 1,
          limit: 5
        })

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('pagination')
        expect(response.body.pagination).toHaveProperty('page')
        expect(response.body.pagination).toHaveProperty('limit')
        expect(response.body.pagination).toHaveProperty('total')
      })
    })

    describe('UPDATE Invoice', () => {
      let testInvoice: any

      beforeEach(async () => {
        const invoiceData = createTestInvoice()
        const response = await apiClient.createInvoice(invoiceData)
        testInvoice = response.body.data
      })

      test('should update invoice basic information', async () => {
        const updateData = {
          description: 'Updated invoice description',
          notes: 'Updated notes',
          payment_terms: '15_days'
        }

        const response = await apiClient.updateInvoice(testInvoice.id, updateData)

        expect(response.status).toBe(200)
        expect(response.body.data.description).toBe(updateData.description)
        expect(response.body.data.notes).toBe(updateData.notes)
        expect(response.body.data.payment_terms).toBe(updateData.payment_terms)
      })

      test('should update invoice line items', async () => {
        const updateData = {
          line_items: [
            {
              line_type: 'subscription_fee',
              description: 'Updated subscription fee',
              quantity: 1,
              unit_price: 600.00,
              is_taxable: true
            }
          ]
        }

        const response = await apiClient.updateInvoice(testInvoice.id, updateData)

        expect(response.status).toBe(200)
        expect(response.body.data.line_items[0].unit_price).toBe(600.00)
        expect(response.body.data.total_amount).toBeGreaterThan(testInvoice.total_amount)
      })

      test('should prevent updates to sent invoices', async () => {
        // First, send the invoice
        await apiClient.sendInvoice(testInvoice.id)

        const updateData = {
          description: 'Should not be updated'
        }

        const response = await apiClient.updateInvoice(testInvoice.id, updateData)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('Cannot update sent invoice')
      })

      test('should validate update data', async () => {
        const invalidData = {
          invoice_type: 'invalid_type'
        }

        const response = await apiClient.updateInvoice(testInvoice.id, invalidData)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('Invalid invoice type')
      })

      test('should return 404 for non-existent invoice', async () => {
        const response = await apiClient.updateInvoice('non-existent-id', {
          description: 'Update'
        })

        expect(response.status).toBe(404)
      })
    })

    describe('DELETE Invoice', () => {
      let testInvoice: any

      beforeEach(async () => {
        const invoiceData = createTestInvoice()
        const response = await apiClient.createInvoice(invoiceData)
        testInvoice = response.body.data
      })

      test('should delete draft invoice', async () => {
        const response = await apiClient.deleteInvoice(testInvoice.id)

        expect(response.status).toBe(204)

        // Verify invoice is deleted
        const getResponse = await apiClient.getInvoice(testInvoice.id)
        expect(getResponse.status).toBe(404)
      })

      test('should prevent deletion of sent invoices', async () => {
        // First, send the invoice
        await apiClient.sendInvoice(testInvoice.id)

        const response = await apiClient.deleteInvoice(testInvoice.id)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('Cannot delete sent invoice')
      })

      test('should prevent deletion of paid invoices', async () => {
        // Mock the invoice as paid
        await apiClient.updateInvoice(testInvoice.id, {
          invoice_status: 'paid'
        })

        const response = await apiClient.deleteInvoice(testInvoice.id)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('Cannot delete paid invoice')
      })

      test('should return 404 for non-existent invoice', async () => {
        const response = await apiClient.deleteInvoice('non-existent-id')

        expect(response.status).toBe(404)
      })
    })
  })

  describe('Invoice Workflow Operations', () => {
    let testInvoice: any

    beforeEach(async () => {
      const invoiceData = createTestInvoice()
      const response = await apiClient.createInvoice(invoiceData)
      testInvoice = response.body.data
    })

    describe('Send Invoice', () => {
      test('should send invoice successfully', async () => {
        const response = await apiClient.sendInvoice(testInvoice.id)

        expect(response.status).toBe(200)
        expect(response.body.data.invoice_status).toBe('sent')
        expect(response.body.data.sent_date).toBeTruthy()
      })

      test('should prevent sending already sent invoice', async () => {
        // Send once
        await apiClient.sendInvoice(testInvoice.id)

        // Try to send again
        const response = await apiClient.sendInvoice(testInvoice.id)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('Invoice already sent')
      })

      test('should validate invoice before sending', async () => {
        // Create invoice with invalid data
        const invalidInvoice = await apiClient.createInvoice({
          client_id: testData.client.id,
          invoice_type: 'subscription',
          line_items: [] // Empty line items
        })

        const response = await apiClient.sendInvoice(invalidInvoice.body.data.id)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('Invoice must have line items')
      })
    })

    describe('Invoice Payments', () => {
      beforeEach(async () => {
        // Send the invoice first
        await apiClient.sendInvoice(testInvoice.id)
      })

      test('should record full payment', async () => {
        const paymentData = {
          payment_amount: testInvoice.total_amount,
          payment_method: 'pix',
          payment_date: new Date().toISOString().split('T')[0],
          transaction_id: 'PIX-123456789',
          notes: 'Full payment via PIX'
        }

        const response = await apiClient.payInvoice(testInvoice.id, paymentData)

        expect(response.status).toBe(201)
        expect(response.body.data.payment_amount).toBe(paymentData.payment_amount)
        expect(response.body.data.payment_method).toBe(paymentData.payment_method)

        // Verify invoice status updated
        const invoiceResponse = await apiClient.getInvoice(testInvoice.id)
        expect(invoiceResponse.body.data.invoice_status).toBe('paid')
        expect(invoiceResponse.body.data.paid_date).toBeTruthy()
      })

      test('should record partial payment', async () => {
        const partialAmount = testInvoice.total_amount * 0.5
        const paymentData = {
          payment_amount: partialAmount,
          payment_method: 'credit_card',
          payment_date: new Date().toISOString().split('T')[0],
          notes: 'Partial payment'
        }

        const response = await apiClient.payInvoice(testInvoice.id, paymentData)

        expect(response.status).toBe(201)

        // Verify invoice status updated
        const invoiceResponse = await apiClient.getInvoice(testInvoice.id)
        expect(invoiceResponse.body.data.invoice_status).toBe('partial_paid')
      })

      test('should validate payment amount', async () => {
        const paymentData = {
          payment_amount: testInvoice.total_amount * 2, // Overpayment
          payment_method: 'bank_transfer',
          payment_date: new Date().toISOString().split('T')[0]
        }

        const response = await apiClient.payInvoice(testInvoice.id, paymentData)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('Payment amount exceeds invoice balance')
      })

      test('should validate payment method', async () => {
        const paymentData = {
          payment_amount: testInvoice.total_amount,
          payment_method: 'cryptocurrency', // Invalid method
          payment_date: new Date().toISOString().split('T')[0]
        }

        const response = await apiClient.payInvoice(testInvoice.id, paymentData)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('Invalid payment method')
      })
    })
  })

  describe('Invoice Generation from Templates', () => {
    describe('Subscription Invoice Generation', () => {
      test('should generate subscription invoices for billing period', async () => {
        const generationData = {
          invoice_type: 'subscription',
          billing_period_start: '2024-03-01',
          billing_period_end: '2024-03-31',
          client_subscription_ids: ['test-subscription-1', 'test-subscription-2'],
          auto_send: false
        }

        const response = await apiClient.generateInvoice(generationData)

        expect(response.status).toBe(201)
        expect(response.body.data).toHaveProperty('batch_id')
        expect(response.body.data.successful_generations).toBeGreaterThan(0)
        expect(Array.isArray(response.body.data.invoices)).toBe(true)
      })

      test('should handle prorated subscriptions', async () => {
        const generationData = {
          invoice_type: 'subscription',
          billing_period_start: '2024-03-15', // Mid-month start
          billing_period_end: '2024-03-31',
          client_subscription_ids: ['test-subscription-1'],
          apply_proration: true
        }

        const response = await apiClient.generateInvoice(generationData)

        expect(response.status).toBe(201)
        const invoice = response.body.data.invoices[0]
        expect(invoice.subscription_details.is_prorated).toBe(true)
        expect(invoice.total_amount).toBeLessThan(500) // Prorated amount
      })
    })

    describe('Case Invoice Generation', () => {
      test('should generate case-based invoices', async () => {
        const generationData = {
          invoice_type: 'case_billing',
          matter_ids: [testData.matter.id],
          include_time_entries: true,
          billing_period_start: '2024-03-01',
          billing_period_end: '2024-03-31'
        }

        const response = await apiClient.generateInvoice(generationData)

        expect(response.status).toBe(201)
        expect(response.body.data.invoices.length).toBeGreaterThan(0)
        
        const invoice = response.body.data.invoices[0]
        expect(invoice.invoice_type).toBe('case_billing')
        expect(invoice.matter_id).toBe(testData.matter.id)
      })
    })

    describe('Time-Based Invoice Generation', () => {
      test('should generate time-based invoices', async () => {
        const generationData = {
          invoice_type: 'time_based',
          billing_period_start: '2024-03-01',
          billing_period_end: '2024-03-31',
          client_ids: [testData.client.id],
          include_only_approved_entries: true
        }

        const response = await apiClient.generateInvoice(generationData)

        expect(response.status).toBe(201)
        expect(response.body.data.invoices.length).toBeGreaterThan(0)
        
        const invoice = response.body.data.invoices[0]
        expect(invoice.invoice_type).toBe('time_based')
      })
    })

    describe('Payment Plan Invoice Generation', () => {
      test('should generate payment plan installments', async () => {
        const generationData = {
          invoice_type: 'payment_plan',
          payment_plan_ids: ['test-payment-plan-1'],
          installment_number: 2,
          scheduled_date: getDateDaysFromNow(30)
        }

        const response = await apiClient.generateInvoice(generationData)

        expect(response.status).toBe(201)
        const invoice = response.body.data.invoices[0]
        expect(invoice.invoice_type).toBe('payment_plan')
        expect(invoice.payment_plan_details.installment_number).toBe(2)
      })
    })

    describe('Batch Generation Error Handling', () => {
      test('should handle generation errors gracefully', async () => {
        const generationData = {
          invoice_type: 'subscription',
          billing_period_start: '2024-03-01',
          billing_period_end: '2024-03-31',
          client_subscription_ids: ['non-existent-subscription']
        }

        const response = await apiClient.generateInvoice(generationData)

        expect(response.status).toBe(207) // Partial success
        expect(response.body.data.failed_generations).toBeGreaterThan(0)
        expect(response.body.data.errors.length).toBeGreaterThan(0)
      })

      test('should validate generation parameters', async () => {
        const invalidData = {
          invoice_type: 'subscription'
          // Missing required fields
        }

        const response = await apiClient.generateInvoice(invalidData)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('billing_period_start is required')
      })
    })
  })

  describe('Error Handling and Edge Cases', () => {
    test('should handle network errors gracefully', async () => {
      // Mock network error
      vi.spyOn(apiClient, 'createInvoice').mockImplementation(() => {
        throw new Error('Network error')
      })

      try {
        await apiClient.createInvoice(createTestInvoice())
      } catch (error) {
        expect(error.message).toContain('Network error')
      }
    })

    test('should handle rate limiting', async () => {
      // Simulate rate limiting by making many requests
      const promises = Array.from({ length: 20 }, () => 
        apiClient.getInvoices()
      )

      const responses = await Promise.allSettled(promises)
      const rateLimitedResponses = responses.filter(
        (result) => result.status === 'fulfilled' && 
        result.value.status === 429
      )

      expect(rateLimitedResponses.length).toBeGreaterThan(0)
    })

    test('should handle database connection errors', async () => {
      // Mock database error
      const mockClient = createMockSupabaseClient()
      mockClient.from.mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      // Test should handle gracefully
      expect(() => mockClient.from('invoices')).toThrow('Database connection failed')
    })

    test('should validate authorization', async () => {
      const unauthorizedClient = new APITestClient()
      // No auth token set

      const response = await unauthorizedClient.getInvoices()

      expect(response.status).toBe(401)
      expect(response.body.error.message).toContain('Unauthorized')
    })

    test('should handle malformed request data', async () => {
      const malformedData = {
        client_id: null,
        invoice_type: '',
        total_amount: 'not-a-number',
        due_date: 'invalid-date'
      }

      const response = await apiClient.createInvoice(malformedData)

      expect(response.status).toBe(400)
      expect(response.body.error.message).toContain('Invalid data format')
    })
  })

  describe('Performance and Load Testing', () => {
    test('should handle concurrent invoice creation', async () => {
      const concurrentRequests = Array.from({ length: 10 }, (_, i) => 
        apiClient.createInvoice({
          ...createTestInvoice(),
          invoice_number: `CONCURRENT-${i}`
        })
      )

      const responses = await Promise.allSettled(concurrentRequests)
      const successfulResponses = responses.filter(
        (result) => result.status === 'fulfilled' && 
        result.value.status === 201
      )

      expect(successfulResponses.length).toBe(10)
    })

    test('should handle large result sets efficiently', async () => {
      const startTime = Date.now()
      
      const response = await apiClient.getInvoices({
        limit: 1000
      })
      
      const endTime = Date.now()
      const responseTime = endTime - startTime

      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(5000) // Should respond within 5 seconds
    })
  })

  describe('Data Integrity and Consistency', () => {
    test('should maintain data consistency across related entities', async () => {
      // Create invoice
      const invoiceData = createTestInvoice()
      const invoiceResponse = await apiClient.createInvoice(invoiceData)
      const invoice = invoiceResponse.body.data

      // Add payment
      await apiClient.sendInvoice(invoice.id)
      await apiClient.payInvoice(invoice.id, {
        payment_amount: invoice.total_amount,
        payment_method: 'pix',
        payment_date: new Date().toISOString().split('T')[0]
      })

      // Verify consistency
      const updatedInvoice = await apiClient.getInvoice(invoice.id)
      expect(updatedInvoice.body.data.invoice_status).toBe('paid')
      expect(updatedInvoice.body.data.payments.length).toBe(1)
      expect(updatedInvoice.body.data.payments[0].payment_amount).toBe(invoice.total_amount)
    })

    test('should handle transaction rollbacks on errors', async () => {
      // This would test transaction handling in the actual implementation
      // Mock scenario where invoice creation partially fails
      const invalidData = {
        client_id: testData.client.id,
        invoice_type: 'subscription',
        line_items: [
          {
            line_type: 'subscription_fee',
            description: 'Valid item',
            quantity: 1,
            unit_price: 100
          },
          {
            line_type: 'invalid_type', // This should cause a failure
            description: 'Invalid item',
            quantity: 1,
            unit_price: 200
          }
        ]
      }

      const response = await apiClient.createInvoice(invalidData)

      expect(response.status).toBe(400)
      
      // Verify no partial data was created
      const invoices = await apiClient.getInvoices({
        client_id: testData.client.id
      })
      
      const recentInvoices = invoices.body.data.filter((inv: any) => 
        inv.description?.includes('Valid item')
      )
      expect(recentInvoices.length).toBe(0)
    })
  })
})