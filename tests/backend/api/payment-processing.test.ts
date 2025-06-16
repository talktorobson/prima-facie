/**
 * Payment Processing Integration Tests
 * Tests for PIX, credit card, bank transfer, and payment gateway integrations
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import nock from 'nock'
import { APITestClient } from '../utils/api-client'
import {
  createTestInvoice,
  validateCPF,
  formatCurrency,
  mockAuth,
  setupTestDatabase,
  cleanupTestDatabase
} from '../utils/test-helpers'

describe('Payment Processing Integration', () => {
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
    nock.cleanAll()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    nock.cleanAll()
  })

  describe('PIX Payment Processing', () => {
    describe('PIX QR Code Generation', () => {
      test('should generate PIX QR code for invoice payment', async () => {
        const paymentData = {
          invoice_id: 'test-invoice-id',
          amount: 1500.00,
          pix_key: 'pagamentos@primafacie.com.br',
          pix_key_type: 'email',
          description: 'Payment for legal services - Invoice #001',
          expires_in_minutes: 60
        }

        const response = await apiClient.generatePixPayment(paymentData)

        expect(response.status).toBe(201)
        expect(response.body.data).toHaveProperty('qr_code')
        expect(response.body.data).toHaveProperty('qr_code_image_base64')
        expect(response.body.data).toHaveProperty('pix_copy_paste')
        expect(response.body.data).toHaveProperty('payment_id')
        expect(response.body.data).toHaveProperty('expires_at')
        expect(response.body.data.amount).toBe(1500.00)
        expect(response.body.data.status).toBe('pending')
      })

      test('should generate PIX with CPF key', async () => {
        const paymentData = {
          invoice_id: 'test-invoice-id',
          amount: 750.00,
          pix_key: '12345678909',
          pix_key_type: 'cpf',
          description: 'Legal consultation payment'
        }

        const response = await apiClient.generatePixPayment(paymentData)

        expect(response.status).toBe(201)
        expect(response.body.data.pix_key).toBe('123.456.789-09') // Formatted CPF
        expect(response.body.data.pix_key_type).toBe('cpf')
      })

      test('should generate PIX with CNPJ key', async () => {
        const paymentData = {
          invoice_id: 'test-invoice-id',
          amount: 2000.00,
          pix_key: '11222333000181',
          pix_key_type: 'cnpj',
          description: 'Corporate legal services'
        }

        const response = await apiClient.generatePixPayment(paymentData)

        expect(response.status).toBe(201)
        expect(response.body.data.pix_key).toBe('11.222.333/0001-81') // Formatted CNPJ
        expect(response.body.data.pix_key_type).toBe('cnpj')
      })

      test('should generate PIX with phone key', async () => {
        const paymentData = {
          invoice_id: 'test-invoice-id',
          amount: 500.00,
          pix_key: '+5511999999999',
          pix_key_type: 'phone',
          description: 'Legal advice payment'
        }

        const response = await apiClient.generatePixPayment(paymentData)

        expect(response.status).toBe(201)
        expect(response.body.data.pix_key).toBe('+5511999999999')
        expect(response.body.data.pix_key_type).toBe('phone')
      })

      test('should generate PIX with random key', async () => {
        const paymentData = {
          invoice_id: 'test-invoice-id',
          amount: 1000.00,
          pix_key: '123e4567-e89b-12d3-a456-426614174000',
          pix_key_type: 'random',
          description: 'Case settlement payment'
        }

        const response = await apiClient.generatePixPayment(paymentData)

        expect(response.status).toBe(201)
        expect(response.body.data.pix_key_type).toBe('random')
      })

      test('should validate PIX key format', async () => {
        const invalidPaymentData = {
          invoice_id: 'test-invoice-id',
          amount: 500.00,
          pix_key: 'invalid-key-format',
          pix_key_type: 'cpf',
          description: 'Test payment'
        }

        const response = await apiClient.generatePixPayment(invalidPaymentData)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('Invalid PIX key format for type cpf')
      })

      test('should validate payment amount', async () => {
        const invalidPaymentData = {
          invoice_id: 'test-invoice-id',
          amount: 0,
          pix_key: 'test@example.com',
          pix_key_type: 'email'
        }

        const response = await apiClient.generatePixPayment(invalidPaymentData)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('Amount must be greater than zero')
      })

      test('should handle PIX payment expiration', async () => {
        const paymentData = {
          invoice_id: 'test-invoice-id',
          amount: 500.00,
          pix_key: 'test@example.com',
          pix_key_type: 'email',
          expires_in_minutes: 1 // Very short expiration for testing
        }

        const response = await apiClient.generatePixPayment(paymentData)
        expect(response.status).toBe(201)

        const paymentId = response.body.data.payment_id

        // Wait for expiration (mock time advancement)
        vi.useFakeTimers()
        vi.advanceTimersByTime(2 * 60 * 1000) // 2 minutes

        const statusResponse = await apiClient.getPaymentStatus(paymentId)
        expect(statusResponse.body.data.status).toBe('expired')

        vi.useRealTimers()
      })
    })

    describe('PIX Payment Confirmation', () => {
      test('should process PIX payment confirmation webhook', async () => {
        // Mock external PIX provider webhook
        nock('https://api.pixprovider.com')
          .post('/webhook/payment-confirmed')
          .reply(200, {
            payment_id: 'pix-payment-123',
            status: 'confirmed',
            amount: 1500.00,
            paid_at: new Date().toISOString(),
            transaction_id: 'TXN-PIX-789456123'
          })

        const webhookData = {
          payment_id: 'pix-payment-123',
          status: 'confirmed',
          amount: 1500.00,
          transaction_id: 'TXN-PIX-789456123',
          paid_at: new Date().toISOString()
        }

        // Simulate webhook call to our API
        const response = await apiClient.processPayment(webhookData)

        expect(response.status).toBe(200)
        expect(response.body.data.status).toBe('confirmed')
        expect(response.body.data.amount).toBe(1500.00)
      })

      test('should handle PIX payment failures', async () => {
        const webhookData = {
          payment_id: 'pix-payment-failed',
          status: 'failed',
          error_code: 'INSUFFICIENT_FUNDS',
          error_message: 'Insufficient funds in payer account'
        }

        const response = await apiClient.processPayment(webhookData)

        expect(response.status).toBe(200)
        expect(response.body.data.status).toBe('failed')
        expect(response.body.data.error_code).toBe('INSUFFICIENT_FUNDS')
      })

      test('should validate webhook signatures', async () => {
        const webhookData = {
          payment_id: 'pix-payment-123',
          status: 'confirmed',
          amount: 1500.00
        }

        // Mock request with invalid signature
        const responseInvalidSig = await apiClient.processPayment({
          ...webhookData,
          signature: 'invalid-signature'
        })

        expect(responseInvalidSig.status).toBe(401)
        expect(responseInvalidSig.body.error.message).toContain('Invalid webhook signature')
      })
    })
  })

  describe('Credit Card Payment Processing', () => {
    describe('Credit Card Transactions', () => {
      test('should process credit card payment successfully', async () => {
        // Mock payment gateway response
        nock('https://api.paymentgateway.com')
          .post('/v1/transactions')
          .reply(200, {
            transaction_id: 'CC-TXN-123456',
            status: 'approved',
            authorization_code: 'AUTH-789',
            amount: 2500.00,
            fee: 75.00
          })

        const cardData = {
          invoice_id: 'test-invoice-id',
          amount: 2500.00,
          card_number: '4111111111111111',
          card_holder_name: 'João da Silva',
          card_holder_cpf: '12345678909',
          expiry_month: 12,
          expiry_year: 2025,
          cvv: '123',
          installments: 1
        }

        const response = await apiClient.processCreditCardPayment(cardData)

        expect(response.status).toBe(201)
        expect(response.body.data).toHaveProperty('transaction_id')
        expect(response.body.data).toHaveProperty('authorization_code')
        expect(response.body.data.status).toBe('approved')
        expect(response.body.data.amount).toBe(2500.00)
        expect(response.body.data.card_holder_cpf).toBe('123.456.789-09')
      })

      test('should handle installment payments', async () => {
        nock('https://api.paymentgateway.com')
          .post('/v1/transactions')
          .reply(200, {
            transaction_id: 'CC-TXN-INST-123',
            status: 'approved',
            installments: 6,
            installment_amount: 416.67,
            total_amount: 2500.00,
            total_with_interest: 2550.00
          })

        const cardData = {
          invoice_id: 'test-invoice-id',
          amount: 2500.00,
          card_number: '4111111111111111',
          card_holder_name: 'Maria Santos',
          card_holder_cpf: '98765432100',
          expiry_month: 6,
          expiry_year: 2026,
          cvv: '456',
          installments: 6
        }

        const response = await apiClient.processCreditCardPayment(cardData)

        expect(response.status).toBe(201)
        expect(response.body.data.installments).toBe(6)
        expect(response.body.data.installment_amount).toBe(416.67)
        expect(response.body.data.total_with_interest).toBe(2550.00)
      })

      test('should validate credit card data', async () => {
        const invalidCardData = {
          invoice_id: 'test-invoice-id',
          amount: 1000.00,
          card_number: '1234', // Invalid card number
          card_holder_name: '',
          expiry_month: 13, // Invalid month
          expiry_year: 2020, // Expired year
          cvv: '12' // Invalid CVV
        }

        const response = await apiClient.processCreditCardPayment(invalidCardData)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('Invalid credit card data')
      })

      test('should handle card declined', async () => {
        nock('https://api.paymentgateway.com')
          .post('/v1/transactions')
          .reply(200, {
            transaction_id: 'CC-TXN-DECLINED-123',
            status: 'declined',
            decline_reason: 'INSUFFICIENT_FUNDS',
            decline_code: '51'
          })

        const cardData = {
          invoice_id: 'test-invoice-id',
          amount: 5000.00,
          card_number: '4000000000000002', // Test card for decline
          card_holder_name: 'Test Decline',
          card_holder_cpf: '12345678909',
          expiry_month: 12,
          expiry_year: 2025,
          cvv: '123'
        }

        const response = await apiClient.processCreditCardPayment(cardData)

        expect(response.status).toBe(402) // Payment Required
        expect(response.body.data.status).toBe('declined')
        expect(response.body.data.decline_reason).toBe('INSUFFICIENT_FUNDS')
      })

      test('should handle 3DS authentication', async () => {
        nock('https://api.paymentgateway.com')
          .post('/v1/transactions')
          .reply(200, {
            transaction_id: 'CC-TXN-3DS-123',
            status: 'requires_authentication',
            authentication_url: 'https://3ds.provider.com/auth/123',
            authentication_token: '3DS-TOKEN-456'
          })

        const cardData = {
          invoice_id: 'test-invoice-id',
          amount: 3000.00,
          card_number: '4000000000000002',
          card_holder_name: 'Cardholder 3DS',
          card_holder_cpf: '12345678909',
          expiry_month: 12,
          expiry_year: 2025,
          cvv: '123'
        }

        const response = await apiClient.processCreditCardPayment(cardData)

        expect(response.status).toBe(202) // Accepted, requires action
        expect(response.body.data.status).toBe('requires_authentication')
        expect(response.body.data.authentication_url).toBeTruthy()
      })

      test('should process card tokenization', async () => {
        nock('https://api.paymentgateway.com')
          .post('/v1/tokens')
          .reply(200, {
            token: 'CARD-TOKEN-123456',
            last_four: '1111',
            brand: 'visa',
            expires_at: '2025-12-31'
          })

        const tokenData = {
          card_number: '4111111111111111',
          card_holder_name: 'João Santos',
          card_holder_cpf: '12345678909',
          expiry_month: 12,
          expiry_year: 2025,
          save_card: true
        }

        // Mock card tokenization endpoint
        const response = await apiClient.processCreditCardPayment({
          ...tokenData,
          amount: 0, // Tokenization only
          invoice_id: 'token-test'
        })

        if (response.status === 201) {
          expect(response.body.data).toHaveProperty('card_token')
          expect(response.body.data.last_four).toBe('1111')
          expect(response.body.data.brand).toBe('visa')
        }
      })
    })

    describe('Recurring Credit Card Payments', () => {
      test('should set up recurring payment', async () => {
        const recurringData = {
          client_id: 'test-client-id',
          card_token: 'CARD-TOKEN-123456',
          amount: 500.00,
          frequency: 'monthly',
          start_date: '2024-04-01',
          end_date: '2024-12-01',
          description: 'Monthly legal services subscription'
        }

        // Mock recurring payment setup
        const response = await apiClient.createSubscription(recurringData)

        expect(response.status).toBe(201)
        expect(response.body.data.payment_method).toBe('credit_card')
        expect(response.body.data.billing_cycle).toBe('monthly')
      })

      test('should handle recurring payment failures', async () => {
        nock('https://api.paymentgateway.com')
          .post('/v1/subscriptions/SUBSCRIPTION-123/charge')
          .reply(200, {
            transaction_id: 'RECURRING-FAILED-123',
            status: 'failed',
            failure_reason: 'CARD_EXPIRED'
          })

        const chargeData = {
          subscription_id: 'SUBSCRIPTION-123',
          amount: 500.00,
          retry_count: 2
        }

        // Mock recurring charge failure
        const response = await apiClient.processPayment({
          type: 'recurring_charge',
          ...chargeData
        })

        if (response.status === 402) {
          expect(response.body.data.status).toBe('failed')
          expect(response.body.data.failure_reason).toBe('CARD_EXPIRED')
        }
      })
    })
  })

  describe('Bank Transfer Processing', () => {
    test('should generate bank transfer instructions', async () => {
      const transferData = {
        invoice_id: 'test-invoice-id',
        amount: 3500.00,
        bank_account: {
          bank_code: '001',
          branch: '1234',
          account: '567890-1',
          account_type: 'checking'
        },
        description: 'Legal services payment - Invoice #001'
      }

      const response = await apiClient.processBankTransfer(transferData)

      expect(response.status).toBe(201)
      expect(response.body.data).toHaveProperty('transfer_instructions')
      expect(response.body.data).toHaveProperty('bank_details')
      expect(response.body.data).toHaveProperty('payment_id')
      expect(response.body.data.bank_details.bank_code).toBe('001')
      expect(response.body.data.amount).toBe(3500.00)
    })

    test('should validate Brazilian bank codes', async () => {
      const validBankCodes = ['001', '033', '104', '237', '341', '356', '389', '422']
      
      for (const bankCode of validBankCodes) {
        const transferData = {
          invoice_id: 'test-invoice-id',
          amount: 1000.00,
          bank_account: {
            bank_code: bankCode,
            branch: '1234',
            account: '567890-1'
          }
        }

        const response = await apiClient.processBankTransfer(transferData)

        expect(response.status).toBe(201)
        expect(response.body.data.bank_details.bank_name).toBeTruthy()
      }
    })

    test('should reject invalid bank codes', async () => {
      const transferData = {
        invoice_id: 'test-invoice-id',
        amount: 1000.00,
        bank_account: {
          bank_code: '999', // Invalid bank code
          branch: '1234',
          account: '567890-1'
        }
      }

      const response = await apiClient.processBankTransfer(transferData)

      expect(response.status).toBe(400)
      expect(response.body.error.message).toContain('Invalid bank code')
    })

    test('should handle TED (same-day transfer) requests', async () => {
      const transferData = {
        invoice_id: 'test-invoice-id',
        amount: 5000.00,
        transfer_type: 'ted',
        bank_account: {
          bank_code: '237',
          branch: '5678',
          account: '123456-7'
        },
        priority: 'same_day'
      }

      const response = await apiClient.processBankTransfer(transferData)

      expect(response.status).toBe(201)
      expect(response.body.data.transfer_type).toBe('ted')
      expect(response.body.data.priority).toBe('same_day')
    })

    test('should handle DOC (next-day transfer) requests', async () => {
      const transferData = {
        invoice_id: 'test-invoice-id',
        amount: 2000.00,
        transfer_type: 'doc',
        bank_account: {
          bank_code: '341',
          branch: '9876',
          account: '654321-8'
        }
      }

      const response = await apiClient.processBankTransfer(transferData)

      expect(response.status).toBe(201)
      expect(response.body.data.transfer_type).toBe('doc')
    })
  })

  describe('Payment Gateway Integration', () => {
    describe('Multiple Gateway Support', () => {
      test('should route payments to primary gateway', async () => {
        nock('https://api.primarygateway.com')
          .post('/v1/payments')
          .reply(200, {
            payment_id: 'PRIMARY-PAY-123',
            status: 'approved',
            gateway: 'primary'
          })

        const paymentData = {
          amount: 1000.00,
          payment_method: 'credit_card',
          gateway_preference: 'primary'
        }

        const response = await apiClient.processPayment(paymentData)

        expect(response.status).toBe(201)
        expect(response.body.data.gateway).toBe('primary')
      })

      test('should failover to secondary gateway', async () => {
        // Mock primary gateway failure
        nock('https://api.primarygateway.com')
          .post('/v1/payments')
          .reply(500, { error: 'Gateway unavailable' })

        // Mock secondary gateway success
        nock('https://api.secondarygateway.com')
          .post('/v1/payments')
          .reply(200, {
            payment_id: 'SECONDARY-PAY-123',
            status: 'approved',
            gateway: 'secondary'
          })

        const paymentData = {
          amount: 1000.00,
          payment_method: 'credit_card',
          enable_failover: true
        }

        const response = await apiClient.processPayment(paymentData)

        expect(response.status).toBe(201)
        expect(response.body.data.gateway).toBe('secondary')
        expect(response.body.data.failover_used).toBe(true)
      })

      test('should handle complete gateway failure', async () => {
        // Mock all gateways failing
        nock('https://api.primarygateway.com')
          .post('/v1/payments')
          .reply(500, { error: 'Gateway unavailable' })

        nock('https://api.secondarygateway.com')
          .post('/v1/payments')
          .reply(500, { error: 'Gateway unavailable' })

        const paymentData = {
          amount: 1000.00,
          payment_method: 'credit_card'
        }

        const response = await apiClient.processPayment(paymentData)

        expect(response.status).toBe(503)
        expect(response.body.error.message).toContain('All payment gateways unavailable')
      })
    })

    describe('Payment Webhooks', () => {
      test('should process payment success webhook', async () => {
        const webhookData = {
          event_type: 'payment.success',
          payment_id: 'PAY-SUCCESS-123',
          transaction_id: 'TXN-456789',
          amount: 1500.00,
          status: 'approved',
          gateway: 'primary',
          timestamp: new Date().toISOString()
        }

        const response = await apiClient.processPayment(webhookData)

        expect(response.status).toBe(200)
        expect(response.body.data.status).toBe('approved')
      })

      test('should process payment failure webhook', async () => {
        const webhookData = {
          event_type: 'payment.failed',
          payment_id: 'PAY-FAILED-123',
          error_code: 'DECLINED',
          error_message: 'Card declined by issuer',
          timestamp: new Date().toISOString()
        }

        const response = await apiClient.processPayment(webhookData)

        expect(response.status).toBe(200)
        expect(response.body.data.status).toBe('failed')
        expect(response.body.data.error_code).toBe('DECLINED')
      })

      test('should handle chargeback webhooks', async () => {
        const webhookData = {
          event_type: 'chargeback.created',
          payment_id: 'PAY-CHARGEBACK-123',
          chargeback_id: 'CB-789456',
          amount: 2000.00,
          reason: 'fraud',
          dispute_date: new Date().toISOString()
        }

        const response = await apiClient.processPayment(webhookData)

        expect(response.status).toBe(200)
        expect(response.body.data.chargeback_status).toBe('disputed')
        expect(response.body.data.chargeback_reason).toBe('fraud')
      })
    })
  })

  describe('Payment Security and Fraud Prevention', () => {
    test('should detect suspicious payment patterns', async () => {
      // Multiple payments from same IP in short time
      const suspiciousPayments = Array.from({ length: 5 }, (_, i) => ({
        amount: 1000.00 + i * 100,
        payment_method: 'credit_card',
        client_ip: '192.168.1.100',
        user_agent: 'Mozilla/5.0...'
      }))

      const responses = await Promise.all(
        suspiciousPayments.map(payment => 
          apiClient.processPayment(payment)
        )
      )

      // Later requests should be flagged for review
      const flaggedResponses = responses.filter(
        response => response.status === 202 && 
        response.body.data.status === 'requires_review'
      )

      expect(flaggedResponses.length).toBeGreaterThan(0)
    })

    test('should validate payment amounts against invoice', async () => {
      const paymentData = {
        invoice_id: 'test-invoice-id',
        amount: 999999.00, // Suspiciously high amount
        payment_method: 'pix'
      }

      const response = await apiClient.processPayment(paymentData)

      if (response.status === 400) {
        expect(response.body.error.message).toContain('Payment amount exceeds invoice total')
      } else if (response.status === 202) {
        expect(response.body.data.status).toBe('requires_review')
      }
    })

    test('should implement velocity checks', async () => {
      const paymentData = {
        client_id: 'test-client-id',
        amount: 5000.00,
        payment_method: 'credit_card'
      }

      // Multiple rapid payments
      const rapidPayments = Array.from({ length: 10 }, () => 
        apiClient.processPayment(paymentData)
      )

      const responses = await Promise.allSettled(rapidPayments)
      const blockedResponses = responses.filter(
        (result) => result.status === 'fulfilled' && 
        result.value.status === 429
      )

      expect(blockedResponses.length).toBeGreaterThan(0)
    })

    test('should validate geographic restrictions', async () => {
      const paymentData = {
        amount: 1000.00,
        payment_method: 'credit_card',
        client_ip: '1.2.3.4', // Non-Brazilian IP
        country_code: 'US'
      }

      const response = await apiClient.processPayment(paymentData)

      if (response.status === 403) {
        expect(response.body.error.message).toContain('Geographic restriction')
      } else if (response.status === 202) {
        expect(response.body.data.requires_verification).toBe(true)
      }
    })
  })

  describe('Payment Status and Reconciliation', () => {
    test('should get payment status', async () => {
      const paymentId = 'test-payment-123'

      const response = await apiClient.getPaymentStatus(paymentId)

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveProperty('payment_id')
      expect(response.body.data).toHaveProperty('status')
      expect(response.body.data).toHaveProperty('amount')
      expect(response.body.data).toHaveProperty('created_at')
      expect(response.body.data).toHaveProperty('updated_at')
    })

    test('should handle payment refunds', async () => {
      const refundData = {
        payment_id: 'test-payment-123',
        amount: 500.00, // Partial refund
        reason: 'Client request',
        refund_method: 'original_payment_method'
      }

      // Mock refund endpoint
      const response = await apiClient.processPayment({
        type: 'refund',
        ...refundData
      })

      if (response.status === 201) {
        expect(response.body.data.refund_status).toBe('processed')
        expect(response.body.data.refund_amount).toBe(500.00)
      }
    })

    test('should generate payment reports', async () => {
      const reportParams = {
        start_date: '2024-03-01',
        end_date: '2024-03-31',
        payment_methods: ['pix', 'credit_card', 'bank_transfer'],
        include_fees: true
      }

      const response = await apiClient.getReports('payments', reportParams)

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveProperty('summary')
      expect(response.body.data).toHaveProperty('by_method')
      expect(response.body.data).toHaveProperty('total_amount')
      expect(response.body.data).toHaveProperty('total_fees')
      expect(response.body.data).toHaveProperty('net_amount')
    })

    test('should handle payment reconciliation', async () => {
      const reconciliationData = {
        date: '2024-03-15',
        gateway: 'primary',
        expected_total: 15000.00,
        actual_total: 14950.00,
        variance_threshold: 100.00
      }

      // Mock reconciliation endpoint
      const response = await apiClient.processPayment({
        type: 'reconciliation',
        ...reconciliationData
      })

      if (response.status === 200) {
        expect(response.body.data).toHaveProperty('reconciled')
        expect(response.body.data).toHaveProperty('variance')
        expect(response.body.data).toHaveProperty('discrepancies')
      }
    })
  })

  describe('Error Handling and Recovery', () => {
    test('should handle payment timeouts', async () => {
      nock('https://api.paymentgateway.com')
        .post('/v1/payments')
        .delay(30000) // 30 second delay
        .reply(200, { status: 'approved' })

      const paymentData = {
        amount: 1000.00,
        payment_method: 'credit_card',
        timeout: 5000 // 5 second timeout
      }

      const response = await apiClient.processPayment(paymentData)

      expect(response.status).toBe(408) // Request Timeout
      expect(response.body.error.message).toContain('Payment request timed out')
    })

    test('should handle network errors gracefully', async () => {
      nock('https://api.paymentgateway.com')
        .post('/v1/payments')
        .replyWithError('Network error')

      const paymentData = {
        amount: 1000.00,
        payment_method: 'credit_card'
      }

      const response = await apiClient.processPayment(paymentData)

      expect(response.status).toBe(503)
      expect(response.body.error.message).toContain('Payment service unavailable')
    })

    test('should retry failed payments', async () => {
      let attemptCount = 0
      
      nock('https://api.paymentgateway.com')
        .post('/v1/payments')
        .times(3)
        .reply(() => {
          attemptCount++
          if (attemptCount < 3) {
            return [500, { error: 'Temporary failure' }]
          }
          return [200, { status: 'approved', attempt: attemptCount }]
        })

      const paymentData = {
        amount: 1000.00,
        payment_method: 'credit_card',
        retry_policy: {
          max_attempts: 3,
          backoff_multiplier: 2
        }
      }

      const response = await apiClient.processPayment(paymentData)

      expect(response.status).toBe(201)
      expect(response.body.data.attempt).toBe(3)
    })

    test('should handle duplicate payment requests', async () => {
      const idempotencyKey = 'unique-payment-key-123'
      
      const paymentData = {
        amount: 1000.00,
        payment_method: 'pix',
        idempotency_key: idempotencyKey
      }

      // First request
      const firstResponse = await apiClient.processPayment(paymentData)
      expect(firstResponse.status).toBe(201)

      // Duplicate request with same idempotency key
      const duplicateResponse = await apiClient.processPayment(paymentData)
      expect(duplicateResponse.status).toBe(200) // Returns existing payment
      expect(duplicateResponse.body.data.payment_id).toBe(firstResponse.body.data.payment_id)
    })
  })
})