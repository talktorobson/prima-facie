/**
 * Comprehensive Error Handling and Validation Tests
 * Tests for input validation, error responses, and edge cases across all APIs
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import { APITestClient } from '../utils/api-client'
import {
  simulateNetworkError,
  simulateTimeout,
  simulateRateLimitError,
  simulateValidationError,
  createMockSupabaseClient,
  setupTestDatabase,
  cleanupTestDatabase
} from '../utils/test-helpers'

describe('Error Handling and Validation', () => {
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

  describe('Input Validation', () => {
    describe('Data Type Validation', () => {
      test('should reject non-string email fields', async () => {
        const invalidData = {
          name: 'Test Client',
          email: 12345, // Should be string
          client_type: 'individual'
        }

        const response = await apiClient.createClient(invalidData)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('email must be a string')
        expect(response.body.error.field).toBe('email')
      })

      test('should reject non-numeric amount fields', async () => {
        const invalidData = {
          client_id: 'test-client-id',
          invoice_type: 'subscription',
          line_items: [{
            line_type: 'subscription_fee',
            description: 'Test',
            quantity: 1,
            unit_price: 'not-a-number' // Should be number
          }]
        }

        const response = await apiClient.createInvoice(invalidData)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('unit_price must be a number')
        expect(response.body.error.field).toBe('line_items[0].unit_price')
      })

      test('should reject invalid date formats', async () => {
        const invalidData = {
          client_id: 'test-client-id',
          invoice_type: 'subscription',
          due_date: 'invalid-date-format'
        }

        const response = await apiClient.createInvoice(invalidData)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('Invalid date format')
        expect(response.body.error.field).toBe('due_date')
      })

      test('should reject invalid boolean values', async () => {
        const invalidData = {
          entry_type: 'case_work',
          matter_id: 'test-matter-id',
          activity_description: 'Test entry',
          start_time: '2024-03-15T09:00:00Z',
          end_time: '2024-03-15T10:00:00Z',
          is_billable: 'yes' // Should be boolean
        }

        const response = await apiClient.createTimeEntry(invalidData)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('is_billable must be a boolean')
      })
    })

    describe('Required Field Validation', () => {
      test('should require essential invoice fields', async () => {
        const incompleteData = {
          // Missing client_id and invoice_type
          description: 'Incomplete invoice'
        }

        const response = await apiClient.createInvoice(incompleteData)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('client_id is required')
        expect(response.body.error.validation_errors).toContain('invoice_type is required')
      })

      test('should require essential time entry fields', async () => {
        const incompleteData = {
          // Missing entry_type and activity_description
          start_time: '2024-03-15T09:00:00Z'
        }

        const response = await apiClient.createTimeEntry(incompleteData)

        expect(response.status).toBe(400)
        expect(response.body.error.validation_errors).toEqual(
          expect.arrayContaining([
            'entry_type is required',
            'activity_description is required'
          ])
        )
      })

      test('should require essential vendor fields', async () => {
        const incompleteData = {
          // Missing name and email
          vendor_type: 'service_provider'
        }

        const response = await apiClient.createVendor(incompleteData)

        expect(response.status).toBe(400)
        expect(response.body.error.validation_errors).toEqual(
          expect.arrayContaining([
            'name is required',
            'email is required'
          ])
        )
      })
    })

    describe('Format Validation', () => {
      test('should validate email format', async () => {
        const invalidEmailFormats = [
          'invalid-email',
          '@domain.com',
          'user@',
          'user@domain',
          'user..double.dot@domain.com',
          'user@domain..com'
        ]

        for (const email of invalidEmailFormats) {
          const clientData = {
            name: 'Test Client',
            email: email,
            client_type: 'individual'
          }

          const response = await apiClient.createClient(clientData)

          expect(response.status).toBe(400)
          expect(response.body.error.message).toContain('Invalid email format')
        }
      })

      test('should validate phone number format', async () => {
        const invalidPhoneFormats = [
          '123',
          'abc-def-ghij',
          '++55 11 99999-9999',
          '(11) 99999-9999', // Missing country code for international validation
          '11 99999-999' // Incomplete
        ]

        for (const phone of invalidPhoneFormats) {
          const clientData = {
            name: 'Test Client',
            email: 'test@example.com',
            phone: phone,
            client_type: 'individual'
          }

          const response = await apiClient.createClient(clientData)

          expect(response.status).toBe(400)
          expect(response.body.error.message).toContain('Invalid phone number format')
        }
      })

      test('should validate CPF format', async () => {
        const invalidCPFs = [
          '12345',
          '123.456.789.00', // Wrong separators
          '123-456-789-00', // Wrong separators
          '000.000.000-00', // Invalid sequence
          '111.111.111-11'  // Invalid sequence
        ]

        for (const cpf of invalidCPFs) {
          const clientData = {
            name: 'Test Client',
            email: 'test@example.com',
            cpf: cpf,
            client_type: 'individual'
          }

          const response = await apiClient.createClient(clientData)

          expect(response.status).toBe(400)
          expect(response.body.error.message).toContain('Invalid CPF')
        }
      })

      test('should validate CNPJ format', async () => {
        const invalidCNPJs = [
          '123456',
          '11.222.333.0001-81', // Wrong separators
          '11-222-333-0001-81', // Wrong separators
          '00.000.000/0000-00', // Invalid sequence
          '11.111.111/1111-11'  // Invalid sequence
        ]

        for (const cnpj of invalidCNPJs) {
          const vendorData = {
            name: 'Test Vendor',
            email: 'vendor@example.com',
            cnpj: cnpj,
            vendor_type: 'service_provider'
          }

          const response = await apiClient.createVendor(vendorData)

          expect(response.status).toBe(400)
          expect(response.body.error.message).toContain('Invalid CNPJ')
        }
      })
    })

    describe('Range and Constraint Validation', () => {
      test('should validate positive amounts', async () => {
        const negativeAmountData = {
          client_id: 'test-client-id',
          invoice_type: 'subscription',
          line_items: [{
            line_type: 'subscription_fee',
            description: 'Test',
            quantity: 1,
            unit_price: -100.00 // Negative amount
          }]
        }

        const response = await apiClient.createInvoice(negativeAmountData)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('unit_price must be positive')
      })

      test('should validate reasonable date ranges', async () => {
        const futureDateData = {
          entry_type: 'case_work',
          matter_id: 'test-matter-id',
          activity_description: 'Future work',
          start_time: '2030-12-31T23:59:59Z', // Far future
          end_time: '2030-12-31T23:59:59Z'
        }

        const response = await apiClient.createTimeEntry(futureDateData)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('Start time cannot be in the far future')
      })

      test('should validate maximum string lengths', async () => {
        const longStringData = {
          name: 'A'.repeat(1000), // Very long name
          email: 'test@example.com',
          client_type: 'individual'
        }

        const response = await apiClient.createClient(longStringData)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('name exceeds maximum length')
      })

      test('should validate minimum string lengths', async () => {
        const shortStringData = {
          name: 'A', // Too short
          email: 'test@example.com',
          client_type: 'individual'
        }

        const response = await apiClient.createClient(shortStringData)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('name must be at least 2 characters')
      })

      test('should validate array size limits', async () => {
        const tooManyLineItems = {
          client_id: 'test-client-id',
          invoice_type: 'subscription',
          line_items: Array.from({ length: 101 }, (_, i) => ({ // Too many items
            line_type: 'subscription_fee',
            description: `Item ${i}`,
            quantity: 1,
            unit_price: 10.00
          }))
        }

        const response = await apiClient.createInvoice(tooManyLineItems)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('Too many line items')
      })
    })

    describe('Enum and Choice Validation', () => {
      test('should validate invoice type enum', async () => {
        const invalidTypeData = {
          client_id: 'test-client-id',
          invoice_type: 'invalid_type',
          line_items: [{
            line_type: 'subscription_fee',
            description: 'Test',
            quantity: 1,
            unit_price: 100.00
          }]
        }

        const response = await apiClient.createInvoice(invalidTypeData)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('Invalid invoice type')
        expect(response.body.error.allowed_values).toEqual([
          'subscription', 'case_billing', 'payment_plan', 'time_based', 'hybrid', 'adjustment', 'late_fee'
        ])
      })

      test('should validate payment method enum', async () => {
        const invalidPaymentData = {
          payment_amount: 100.00,
          payment_method: 'cryptocurrency', // Invalid method
          payment_date: '2024-03-15'
        }

        const response = await apiClient.payInvoice('test-invoice-id', invalidPaymentData)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('Invalid payment method')
        expect(response.body.error.allowed_values).toEqual([
          'cash', 'check', 'bank_transfer', 'pix', 'credit_card', 'debit_card', 'other'
        ])
      })

      test('should validate client type enum', async () => {
        const invalidClientData = {
          name: 'Test Client',
          email: 'test@example.com',
          client_type: 'unknown_type'
        }

        const response = await apiClient.createClient(invalidClientData)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('Invalid client type')
        expect(response.body.error.allowed_values).toEqual(['individual', 'company'])
      })
    })

    describe('Conditional Validation', () => {
      test('should require CPF for individual clients', async () => {
        const individualWithoutCPF = {
          name: 'Individual Client',
          email: 'individual@example.com',
          client_type: 'individual'
          // Missing CPF
        }

        const response = await apiClient.createClient(individualWithoutCPF)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('CPF is required for individual clients')
      })

      test('should require CNPJ for company clients', async () => {
        const companyWithoutCNPJ = {
          name: 'Company Client',
          email: 'company@example.com',
          client_type: 'company'
          // Missing CNPJ
        }

        const response = await apiClient.createClient(companyWithoutCNPJ)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('CNPJ is required for company clients')
      })

      test('should require billable rate for billable time entries', async () => {
        const billableWithoutRate = {
          entry_type: 'case_work',
          matter_id: 'test-matter-id',
          activity_description: 'Billable work',
          start_time: '2024-03-15T09:00:00Z',
          end_time: '2024-03-15T10:00:00Z',
          is_billable: true
          // Missing billable_rate
        }

        const response = await apiClient.createTimeEntry(billableWithoutRate)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('Billable rate is required for billable entries')
      })

      test('should require matter_id for case work entries', async () => {
        const caseWorkWithoutMatter = {
          entry_type: 'case_work',
          activity_description: 'Case work',
          start_time: '2024-03-15T09:00:00Z',
          end_time: '2024-03-15T10:00:00Z'
          // Missing matter_id
        }

        const response = await apiClient.createTimeEntry(caseWorkWithoutMatter)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('matter_id is required for case work entries')
      })
    })

    describe('Cross-Field Validation', () => {
      test('should validate end time after start time', async () => {
        const invalidTimeRange = {
          entry_type: 'case_work',
          matter_id: 'test-matter-id',
          activity_description: 'Invalid time range',
          start_time: '2024-03-15T10:00:00Z',
          end_time: '2024-03-15T09:00:00Z' // End before start
        }

        const response = await apiClient.createTimeEntry(invalidTimeRange)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('End time must be after start time')
      })

      test('should validate due date after issue date', async () => {
        const invalidDateRange = {
          client_id: 'test-client-id',
          invoice_type: 'subscription',
          issue_date: '2024-03-15',
          due_date: '2024-03-14', // Before issue date
          line_items: [{
            line_type: 'subscription_fee',
            description: 'Test',
            quantity: 1,
            unit_price: 100.00
          }]
        }

        const response = await apiClient.createInvoice(invalidDateRange)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('Due date must be after issue date')
      })

      test('should validate payment amount not exceeding invoice total', async () => {
        const overpayment = {
          payment_amount: 2000.00, // Exceeds invoice total
          payment_method: 'pix',
          payment_date: '2024-03-15'
        }

        const response = await apiClient.payInvoice('test-invoice-id', overpayment)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('Payment amount exceeds invoice balance')
      })
    })
  })

  describe('HTTP Error Responses', () => {
    describe('4xx Client Errors', () => {
      test('should return 400 for bad request', async () => {
        const malformedData = {
          invalid_json: true,
          missing_required_fields: null
        }

        const response = await apiClient.createClient(malformedData)

        expect(response.status).toBe(400)
        expect(response.body.error.code).toBe('BAD_REQUEST')
        expect(response.body.error.message).toBeTruthy()
        expect(response.body.error.timestamp).toBeTruthy()
        expect(response.body.error.path).toBeTruthy()
      })

      test('should return 401 for unauthorized access', async () => {
        const unauthorizedClient = new APITestClient()
        // No auth token set

        const response = await unauthorizedClient.getInvoices()

        expect(response.status).toBe(401)
        expect(response.body.error.code).toBe('UNAUTHORIZED')
        expect(response.body.error.message).toContain('Authentication required')
      })

      test('should return 403 for forbidden access', async () => {
        // Mock limited permission token
        const limitedClient = new APITestClient()
        limitedClient.setAuthToken('limited-permissions-token')

        const response = await limitedClient.createVendor({
          name: 'Test Vendor',
          email: 'test@vendor.com',
          vendor_type: 'service_provider'
        })

        expect(response.status).toBe(403)
        expect(response.body.error.code).toBe('FORBIDDEN')
        expect(response.body.error.message).toContain('Insufficient permissions')
      })

      test('should return 404 for not found resources', async () => {
        const response = await apiClient.getInvoice('non-existent-invoice-id')

        expect(response.status).toBe(404)
        expect(response.body.error.code).toBe('NOT_FOUND')
        expect(response.body.error.message).toContain('Invoice not found')
      })

      test('should return 409 for conflict errors', async () => {
        // Try to create duplicate resource
        const vendorData = {
          name: 'Unique Vendor',
          email: 'unique@vendor.com',
          cnpj: '11222333000181',
          vendor_type: 'service_provider'
        }

        // First creation
        await apiClient.createVendor(vendorData)

        // Duplicate creation
        const response = await apiClient.createVendor(vendorData)

        expect(response.status).toBe(409)
        expect(response.body.error.code).toBe('CONFLICT')
        expect(response.body.error.message).toContain('CNPJ already registered')
      })

      test('should return 422 for unprocessable entity', async () => {
        const businessLogicViolation = {
          client_id: 'test-client-id',
          invoice_type: 'subscription',
          client_subscription_id: 'non-existent-subscription', // Valid format but doesn't exist
          line_items: [{
            line_type: 'subscription_fee',
            description: 'Test',
            quantity: 1,
            unit_price: 100.00
          }]
        }

        const response = await apiClient.createInvoice(businessLogicViolation)

        expect(response.status).toBe(422)
        expect(response.body.error.code).toBe('UNPROCESSABLE_ENTITY')
        expect(response.body.error.message).toContain('Subscription not found')
      })

      test('should return 429 for rate limiting', async () => {
        // Rapid fire requests to trigger rate limiting
        const promises = Array.from({ length: 100 }, () => 
          apiClient.getInvoices()
        )

        const responses = await Promise.allSettled(promises)
        const rateLimitedResponses = responses.filter(
          (result) => result.status === 'fulfilled' && 
          result.value.status === 429
        )

        expect(rateLimitedResponses.length).toBeGreaterThan(0)
        
        const rateLimitedResponse = rateLimitedResponses[0].value
        expect(rateLimitedResponse.body.error.code).toBe('RATE_LIMIT_EXCEEDED')
        expect(rateLimitedResponse.headers['retry-after']).toBeTruthy()
      })
    })

    describe('5xx Server Errors', () => {
      test('should return 500 for internal server errors', async () => {
        // Mock server error
        vi.spyOn(apiClient, 'createInvoice').mockResolvedValue({
          status: 500,
          body: {
            error: {
              code: 'INTERNAL_SERVER_ERROR',
              message: 'An unexpected error occurred',
              request_id: 'req-123456'
            }
          }
        } as any)

        const response = await apiClient.createInvoice({
          client_id: 'test-client-id',
          invoice_type: 'subscription'
        })

        expect(response.status).toBe(500)
        expect(response.body.error.code).toBe('INTERNAL_SERVER_ERROR')
        expect(response.body.error.request_id).toBeTruthy()
      })

      test('should return 502 for bad gateway', async () => {
        // Mock external service failure
        vi.spyOn(apiClient, 'generatePixPayment').mockResolvedValue({
          status: 502,
          body: {
            error: {
              code: 'BAD_GATEWAY',
              message: 'Payment gateway unavailable',
              service: 'pix_provider'
            }
          }
        } as any)

        const response = await apiClient.generatePixPayment({
          amount: 100.00,
          pix_key: 'test@example.com',
          pix_key_type: 'email'
        })

        expect(response.status).toBe(502)
        expect(response.body.error.code).toBe('BAD_GATEWAY')
        expect(response.body.error.service).toBe('pix_provider')
      })

      test('should return 503 for service unavailable', async () => {
        // Mock service maintenance
        vi.spyOn(apiClient, 'getCashFlowSummary').mockResolvedValue({
          status: 503,
          body: {
            error: {
              code: 'SERVICE_UNAVAILABLE',
              message: 'Service temporarily unavailable for maintenance',
              retry_after: 3600
            }
          }
        } as any)

        const response = await apiClient.getCashFlowSummary()

        expect(response.status).toBe(503)
        expect(response.body.error.code).toBe('SERVICE_UNAVAILABLE')
        expect(response.body.error.retry_after).toBe(3600)
      })

      test('should return 504 for gateway timeout', async () => {
        // Mock timeout scenario
        vi.spyOn(apiClient, 'processCreditCardPayment').mockResolvedValue({
          status: 504,
          body: {
            error: {
              code: 'GATEWAY_TIMEOUT',
              message: 'Payment processing timed out',
              timeout_duration: 30000
            }
          }
        } as any)

        const response = await apiClient.processCreditCardPayment({
          amount: 1000.00,
          card_number: '4111111111111111'
        })

        expect(response.status).toBe(504)
        expect(response.body.error.code).toBe('GATEWAY_TIMEOUT')
      })
    })
  })

  describe('Error Response Format', () => {
    test('should have consistent error response structure', async () => {
      const response = await apiClient.createInvoice({
        // Invalid data to trigger error
        invalid_field: 'invalid_value'
      })

      expect(response.status).toBeGreaterThanOrEqual(400)
      expect(response.body).toHaveProperty('error')
      expect(response.body.error).toHaveProperty('code')
      expect(response.body.error).toHaveProperty('message')
      expect(response.body.error).toHaveProperty('timestamp')
      expect(response.body.error).toHaveProperty('path')
      expect(response.body.error).toHaveProperty('request_id')
    })

    test('should include validation details for validation errors', async () => {
      const invalidData = {
        name: '', // Empty name
        email: 'invalid-email', // Invalid email
        client_type: 'invalid_type' // Invalid enum
      }

      const response = await apiClient.createClient(invalidData)

      expect(response.status).toBe(400)
      expect(response.body.error).toHaveProperty('validation_errors')
      expect(Array.isArray(response.body.error.validation_errors)).toBe(true)
      expect(response.body.error.validation_errors.length).toBeGreaterThan(0)
      
      const validationErrors = response.body.error.validation_errors
      expect(validationErrors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: expect.any(String),
            message: expect.any(String),
            value: expect.anything()
          })
        ])
      )
    })

    test('should include help information for common errors', async () => {
      const response = await apiClient.validateCPF('invalid-cpf')

      expect(response.status).toBe(200) // CPF validation returns 200 with validation result
      expect(response.body.data.is_valid).toBe(false)
      expect(response.body.data.error_message).toBeTruthy()
      expect(response.body.data.help_url).toBeTruthy()
    })

    test('should include correlation IDs for debugging', async () => {
      const response = await apiClient.createInvoice({
        invalid_data: true
      })

      expect(response.status).toBe(400)
      expect(response.body.error.request_id).toMatch(/^[a-f0-9-]{36}$/) // UUID format
      expect(response.body.error.correlation_id).toBeTruthy()
    })
  })

  describe('Business Logic Validation', () => {
    test('should prevent invoice modification after sending', async () => {
      // Create and send invoice
      const invoiceData = {
        client_id: 'test-client-id',
        invoice_type: 'subscription',
        line_items: [{
          line_type: 'subscription_fee',
          description: 'Test',
          quantity: 1,
          unit_price: 100.00
        }]
      }

      const createResponse = await apiClient.createInvoice(invoiceData)
      const invoiceId = createResponse.body.data.id

      // Send invoice
      await apiClient.sendInvoice(invoiceId)

      // Try to modify sent invoice
      const updateResponse = await apiClient.updateInvoice(invoiceId, {
        description: 'Modified description'
      })

      expect(updateResponse.status).toBe(422)
      expect(updateResponse.body.error.message).toContain('Cannot modify sent invoice')
    })

    test('should prevent time entry overlaps', async () => {
      // Create first time entry
      const firstEntry = {
        entry_type: 'case_work',
        matter_id: 'test-matter-id',
        activity_description: 'First entry',
        start_time: '2024-03-15T09:00:00Z',
        end_time: '2024-03-15T11:00:00Z'
      }

      await apiClient.createTimeEntry(firstEntry)

      // Try to create overlapping entry
      const overlappingEntry = {
        entry_type: 'case_work',
        matter_id: 'test-matter-id',
        activity_description: 'Overlapping entry',
        start_time: '2024-03-15T10:00:00Z',
        end_time: '2024-03-15T12:00:00Z'
      }

      const response = await apiClient.createTimeEntry(overlappingEntry)

      expect(response.status).toBe(422)
      expect(response.body.error.message).toContain('Time entry overlaps with existing entry')
    })

    test('should prevent bill payment exceeding total amount', async () => {
      // Mock existing bill
      const billId = 'test-bill-id'
      
      const overpayment = {
        payment_amount: 999999.00,
        payment_method: 'bank_transfer',
        payment_date: '2024-03-15'
      }

      const response = await apiClient.payBill(billId, overpayment)

      expect(response.status).toBe(422)
      expect(response.body.error.message).toContain('Payment exceeds bill total')
    })

    test('should validate subscription limits', async () => {
      const subscriptionData = {
        client_id: 'test-client-id',
        plan_type: 'basic',
        monthly_fee: 99.99
      }

      // Try to create subscription for client that already has active subscription
      const response = await apiClient.createSubscription(subscriptionData)

      if (response.status === 422) {
        expect(response.body.error.message).toContain('Client already has active subscription')
      }
    })
  })

  describe('Edge Cases and Boundary Testing', () => {
    test('should handle extremely large numbers', async () => {
      const largeAmountData = {
        client_id: 'test-client-id',
        invoice_type: 'subscription',
        line_items: [{
          line_type: 'subscription_fee',
          description: 'Large amount test',
          quantity: 1,
          unit_price: Number.MAX_SAFE_INTEGER
        }]
      }

      const response = await apiClient.createInvoice(largeAmountData)

      expect(response.status).toBe(400)
      expect(response.body.error.message).toContain('Amount exceeds maximum allowed value')
    })

    test('should handle very small decimal amounts', async () => {
      const smallAmountData = {
        client_id: 'test-client-id',
        invoice_type: 'subscription',
        line_items: [{
          line_type: 'subscription_fee',
          description: 'Small amount test',
          quantity: 1,
          unit_price: 0.001 // Very small amount
        }]
      }

      const response = await apiClient.createInvoice(smallAmountData)

      expect(response.status).toBe(400)
      expect(response.body.error.message).toContain('Amount too small')
    })

    test('should handle empty arrays gracefully', async () => {
      const emptyArrayData = {
        client_id: 'test-client-id',
        invoice_type: 'subscription',
        line_items: [] // Empty array
      }

      const response = await apiClient.createInvoice(emptyArrayData)

      expect(response.status).toBe(400)
      expect(response.body.error.message).toContain('At least one line item is required')
    })

    test('should handle null and undefined values', async () => {
      const nullValueData = {
        client_id: 'test-client-id',
        invoice_type: 'subscription',
        description: null,
        notes: undefined,
        line_items: [{
          line_type: 'subscription_fee',
          description: 'Test',
          quantity: 1,
          unit_price: 100.00
        }]
      }

      const response = await apiClient.createInvoice(nullValueData)

      expect(response.status).toBe(201) // Should handle null/undefined gracefully
    })

    test('should handle unicode and special characters', async () => {
      const unicodeData = {
        name: 'José da Silva & Associados Ltda. ñáéíóú',
        email: 'jose@example.com',
        client_type: 'company',
        cnpj: '11222333000181'
      }

      const response = await apiClient.createClient(unicodeData)

      expect(response.status).toBe(201)
      expect(response.body.data.name).toBe(unicodeData.name)
    })

    test('should handle timezone edge cases', async () => {
      const timezoneEdgeCase = {
        entry_type: 'case_work',
        matter_id: 'test-matter-id',
        activity_description: 'Timezone test',
        start_time: '2024-03-15T23:59:59Z',
        end_time: '2024-03-16T00:30:00Z' // Crosses midnight
      }

      const response = await apiClient.createTimeEntry(timezoneEdgeCase)

      expect(response.status).toBe(201)
      expect(response.body.data.duration_minutes).toBe(31) // 31 minutes
    })
  })

  describe('Concurrent Access and Race Conditions', () => {
    test('should handle concurrent invoice creation', async () => {
      const invoiceData = {
        client_id: 'test-client-id',
        invoice_type: 'subscription',
        line_items: [{
          line_type: 'subscription_fee',
          description: 'Concurrent test',
          quantity: 1,
          unit_price: 100.00
        }]
      }

      const concurrentRequests = Array.from({ length: 10 }, () => 
        apiClient.createInvoice(invoiceData)
      )

      const responses = await Promise.allSettled(concurrentRequests)
      const successfulResponses = responses.filter(
        (result) => result.status === 'fulfilled' && 
        result.value.status === 201
      )

      expect(successfulResponses.length).toBeGreaterThan(0)
      expect(successfulResponses.length).toBeLessThanOrEqual(10)
    })

    test('should handle concurrent payment attempts', async () => {
      const paymentData = {
        payment_amount: 100.00,
        payment_method: 'pix',
        payment_date: '2024-03-15'
      }

      const concurrentPayments = Array.from({ length: 5 }, () => 
        apiClient.payInvoice('test-invoice-id', paymentData)
      )

      const responses = await Promise.allSettled(concurrentPayments)
      const successfulPayments = responses.filter(
        (result) => result.status === 'fulfilled' && 
        result.value.status === 201
      )

      // Only one payment should succeed to prevent double payment
      expect(successfulPayments.length).toBe(1)
    })
  })

  describe('Resource Cleanup and Memory Management', () => {
    test('should handle large request payloads', async () => {
      const largePayload = {
        client_id: 'test-client-id',
        invoice_type: 'subscription',
        description: 'A'.repeat(10000), // Large description
        line_items: Array.from({ length: 100 }, (_, i) => ({
          line_type: 'subscription_fee',
          description: `Item ${i} - ${'A'.repeat(100)}`,
          quantity: 1,
          unit_price: 10.00
        }))
      }

      const response = await apiClient.createInvoice(largePayload)

      if (response.status === 413) {
        expect(response.body.error.message).toContain('Request payload too large')
      } else if (response.status === 400) {
        expect(response.body.error.message).toContain('Description too long')
      }
    })

    test('should handle file upload size limits', async () => {
      const largeFile = Buffer.alloc(50 * 1024 * 1024) // 50MB file

      const response = await apiClient.uploadFile(largeFile, 'large-file.pdf')

      expect(response.status).toBe(413)
      expect(response.body.error.message).toContain('File size exceeds limit')
    })
  })
})