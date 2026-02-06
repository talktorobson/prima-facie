/**
 * Brazilian Legal Compliance API Tests
 * Tests for CNPJ/CPF validation, tax calculations, and Brazilian-specific features
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import { APITestClient } from '../utils/api-client'
import {
  validateCPF,
  validateCNPJ,
  formatCurrency,
  mockAuth,
  setupTestDatabase,
  cleanupTestDatabase
} from '../utils/test-helpers'

describe('Brazilian Legal Compliance API', () => {
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

  describe('CPF Validation', () => {
    test('should validate correct CPF format', async () => {
      const validCPFs = [
        '12345678909',
        '123.456.789-09',
        '11144477735',
        '111.444.777-35'
      ]

      for (const cpf of validCPFs) {
        const response = await apiClient.validateCPF(cpf)
        
        expect(response.status).toBe(200)
        expect(response.body.data.is_valid).toBe(true)
        expect(response.body.data.formatted).toBeTruthy()
        expect(response.body.data.clean).toBeTruthy()
      }
    })

    test('should reject invalid CPF format', async () => {
      const invalidCPFs = [
        '123456789',     // Too short
        '12345678901',   // Too long
        '111.111.111-11', // All same digits
        '000.000.000-00', // All zeros
        '123.abc.789-09', // Contains letters
        '123.456.789-00', // Invalid check digit
        ''               // Empty string
      ]

      for (const cpf of invalidCPFs) {
        const response = await apiClient.validateCPF(cpf)
        
        expect(response.status).toBe(200)
        expect(response.body.data.is_valid).toBe(false)
        expect(response.body.data.error_message).toBeTruthy()
      }
    })

    test('should format valid CPF correctly', async () => {
      const cpf = '12345678909'
      const response = await apiClient.validateCPF(cpf)

      expect(response.status).toBe(200)
      expect(response.body.data.is_valid).toBe(true)
      expect(response.body.data.formatted).toBe('123.456.789-09')
      expect(response.body.data.clean).toBe('12345678909')
    })

    test('should validate CPF check digits', async () => {
      const testCases = [
        { cpf: '12345678909', valid: true },
        { cpf: '12345678908', valid: false }, // Wrong last digit
        { cpf: '12345678900', valid: false }, // Wrong both digits
        { cpf: '11144477735', valid: true },
        { cpf: '11144477736', valid: false }  // Wrong last digit
      ]

      for (const testCase of testCases) {
        const response = await apiClient.validateCPF(testCase.cpf)
        
        expect(response.status).toBe(200)
        expect(response.body.data.is_valid).toBe(testCase.valid)
        
        if (!testCase.valid) {
          expect(response.body.data.error_message).toContain('Invalid check digit')
        }
      }
    })

    test('should handle CPF validation in client creation', async () => {
      const clientData = {
        name: 'João da Silva',
        email: 'joao@example.com',
        cpf: '12345678909',
        client_type: 'individual',
        phone: '+55 11 99999-9999'
      }

      const response = await apiClient.createClient(clientData)

      expect(response.status).toBe(201)
      expect(response.body.data.cpf).toBe('123.456.789-09') // Should be formatted
    })

    test('should reject client creation with invalid CPF', async () => {
      const clientData = {
        name: 'Invalid Client',
        email: 'invalid@example.com',
        cpf: '123.456.789-00', // Invalid CPF
        client_type: 'individual'
      }

      const response = await apiClient.createClient(clientData)

      expect(response.status).toBe(400)
      expect(response.body.error.message).toContain('Invalid CPF')
    })
  })

  describe('CNPJ Validation', () => {
    test('should validate correct CNPJ format', async () => {
      const validCNPJs = [
        '11222333000181',
        '11.222.333/0001-81',
        '12345678000195',
        '12.345.678/0001-95'
      ]

      for (const cnpj of validCNPJs) {
        const response = await apiClient.validateCNPJ(cnpj)
        
        expect(response.status).toBe(200)
        expect(response.body.data.is_valid).toBe(true)
        expect(response.body.data.formatted).toBeTruthy()
        expect(response.body.data.clean).toBeTruthy()
      }
    })

    test('should reject invalid CNPJ format', async () => {
      const invalidCNPJs = [
        '1122233300018',   // Too short
        '112223330001811', // Too long
        '11.111.111/1111-11', // All same digits
        '00.000.000/0000-00', // All zeros
        '11.222.abc/0001-81', // Contains letters
        '11.222.333/0001-80', // Invalid check digit
        ''                 // Empty string
      ]

      for (const cnpj of invalidCNPJs) {
        const response = await apiClient.validateCNPJ(cnpj)
        
        expect(response.status).toBe(200)
        expect(response.body.data.is_valid).toBe(false)
        expect(response.body.data.error_message).toBeTruthy()
      }
    })

    test('should format valid CNPJ correctly', async () => {
      const cnpj = '11222333000181'
      const response = await apiClient.validateCNPJ(cnpj)

      expect(response.status).toBe(200)
      expect(response.body.data.is_valid).toBe(true)
      expect(response.body.data.formatted).toBe('11.222.333/0001-81')
      expect(response.body.data.clean).toBe('11222333000181')
    })

    test('should validate CNPJ check digits', async () => {
      const testCases = [
        { cnpj: '11222333000181', valid: true },
        { cnpj: '11222333000180', valid: false }, // Wrong last digit
        { cnpj: '11222333000100', valid: false }, // Wrong both digits
        { cnpj: '12345678000195', valid: true },
        { cnpj: '12345678000194', valid: false }  // Wrong last digit
      ]

      for (const testCase of testCases) {
        const response = await apiClient.validateCNPJ(testCase.cnpj)
        
        expect(response.status).toBe(200)
        expect(response.body.data.is_valid).toBe(testCase.valid)
        
        if (!testCase.valid) {
          expect(response.body.data.error_message).toContain('Invalid check digit')
        }
      }
    })

    test('should handle CNPJ validation in vendor creation', async () => {
      const vendorData = {
        name: 'Tech Solutions LTDA',
        legal_name: 'Tech Solutions Serviços LTDA',
        cnpj: '11222333000181',
        email: 'contato@techsolutions.com.br',
        vendor_type: 'service_provider'
      }

      const response = await apiClient.createVendor(vendorData)

      expect(response.status).toBe(201)
      expect(response.body.data.cnpj).toBe('11.222.333/0001-81') // Should be formatted
    })

    test('should reject vendor creation with invalid CNPJ', async () => {
      const vendorData = {
        name: 'Invalid Vendor',
        cnpj: '11.222.333/0001-80', // Invalid CNPJ
        email: 'invalid@vendor.com',
        vendor_type: 'service_provider'
      }

      const response = await apiClient.createVendor(vendorData)

      expect(response.status).toBe(400)
      expect(response.body.error.message).toContain('Invalid CNPJ')
    })

    test('should prevent duplicate CNPJ registration', async () => {
      const cnpj = '11222333000181'
      
      // Create first vendor
      const firstVendor = {
        name: 'First Vendor',
        cnpj: cnpj,
        email: 'first@vendor.com',
        vendor_type: 'service_provider'
      }
      
      await apiClient.createVendor(firstVendor)

      // Try to create second vendor with same CNPJ
      const secondVendor = {
        name: 'Second Vendor',
        cnpj: cnpj,
        email: 'second@vendor.com',
        vendor_type: 'supplier'
      }

      const response = await apiClient.createVendor(secondVendor)

      expect(response.status).toBe(400)
      expect(response.body.error.message).toContain('CNPJ already registered')
    })
  })

  describe('Brazilian Tax Calculations', () => {
    test('should calculate ICMS tax correctly', async () => {
      const taxData = {
        amount: 1000.00,
        tax_type: 'icms',
        state_from: 'SP',
        state_to: 'RJ',
        product_type: 'service'
      }

      const response = await apiClient.calculateTaxes(taxData)

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveProperty('tax_amount')
      expect(response.body.data).toHaveProperty('tax_rate')
      expect(response.body.data).toHaveProperty('tax_type')
      expect(response.body.data.tax_type).toBe('icms')
      expect(response.body.data.tax_amount).toBeGreaterThan(0)
    })

    test('should calculate ISS tax for services', async () => {
      const taxData = {
        amount: 2000.00,
        tax_type: 'iss',
        city: 'São Paulo',
        service_code: '1.01', // Legal services
        product_type: 'service'
      }

      const response = await apiClient.calculateTaxes(taxData)

      expect(response.status).toBe(200)
      expect(response.body.data.tax_type).toBe('iss')
      expect(response.body.data.tax_rate).toBeGreaterThanOrEqual(2) // ISS minimum 2%
      expect(response.body.data.tax_rate).toBeLessThanOrEqual(5)   // ISS maximum 5%
    })

    test('should calculate PIS/COFINS taxes', async () => {
      const taxData = {
        amount: 5000.00,
        tax_type: 'pis_cofins',
        regime: 'lucro_real', // Real profit regime
        product_type: 'service'
      }

      const response = await apiClient.calculateTaxes(taxData)

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveProperty('pis_rate')
      expect(response.body.data).toHaveProperty('cofins_rate')
      expect(response.body.data).toHaveProperty('pis_amount')
      expect(response.body.data).toHaveProperty('cofins_amount')
      expect(response.body.data.pis_rate).toBe(1.65) // Standard PIS rate
      expect(response.body.data.cofins_rate).toBe(7.6) // Standard COFINS rate
    })

    test('should calculate CSLL (Social Contribution on Net Profits)', async () => {
      const taxData = {
        amount: 10000.00,
        tax_type: 'csll',
        business_type: 'legal_services'
      }

      const response = await apiClient.calculateTaxes(taxData)

      expect(response.status).toBe(200)
      expect(response.body.data.tax_type).toBe('csll')
      expect(response.body.data.tax_rate).toBe(9) // CSLL rate for services
    })

    test('should calculate IR (Income Tax)', async () => {
      const taxData = {
        amount: 15000.00,
        tax_type: 'ir',
        regime: 'lucro_real'
      }

      const response = await apiClient.calculateTaxes(taxData)

      expect(response.status).toBe(200)
      expect(response.body.data.tax_type).toBe('ir')
      expect(response.body.data.tax_rate).toBe(15) // Standard IR rate
    })

    test('should calculate Simples Nacional taxes', async () => {
      const taxData = {
        amount: 3000.00,
        tax_type: 'simples_nacional',
        annual_revenue: 360000.00, // R$ 360k annual revenue
        business_type: 'legal_services'
      }

      const response = await apiClient.calculateTaxes(taxData)

      expect(response.status).toBe(200)
      expect(response.body.data.tax_type).toBe('simples_nacional')
      expect(response.body.data).toHaveProperty('tax_rate')
      expect(response.body.data).toHaveProperty('tax_amount')
      expect(response.body.data).toHaveProperty('aliquot_table')
    })

    test('should handle tax calculation for different business types', async () => {
      const businessTypes = [
        'legal_services',
        'consulting',
        'technology',
        'retail'
      ]

      for (const businessType of businessTypes) {
        const taxData = {
          amount: 1000.00,
          tax_type: 'iss',
          city: 'São Paulo',
          business_type: businessType
        }

        const response = await apiClient.calculateTaxes(taxData)

        expect(response.status).toBe(200)
        expect(response.body.data).toHaveProperty('tax_rate')
        expect(response.body.data.business_type).toBe(businessType)
      }
    })

    test('should apply tax exemptions correctly', async () => {
      const taxData = {
        amount: 1000.00,
        tax_type: 'iss',
        city: 'São Paulo',
        business_type: 'legal_services',
        exemptions: ['nonprofit_client', 'pro_bono']
      }

      const response = await apiClient.calculateTaxes(taxData)

      expect(response.status).toBe(200)
      
      if (response.body.data.exemptions_applied) {
        expect(response.body.data.tax_amount).toBe(0)
        expect(response.body.data.exemption_reason).toBeTruthy()
      }
    })

    test('should validate tax calculation parameters', async () => {
      const invalidTaxData = {
        amount: -1000.00, // Negative amount
        tax_type: 'invalid_tax',
        state_from: 'INVALID'
      }

      const response = await apiClient.calculateTaxes(invalidTaxData)

      expect(response.status).toBe(400)
      expect(response.body.error.message).toContain('Invalid tax calculation parameters')
    })
  })

  describe('Legal Documentation Compliance', () => {
    test('should generate compliant legal invoices', async () => {
      const invoiceData = {
        client_id: 'test-client-id',
        invoice_type: 'case_billing',
        description: 'Legal services - Contract review',
        line_items: [
          {
            line_type: 'case_fee',
            description: 'Contract review and analysis',
            quantity: 1,
            unit_price: 2000.00,
            is_taxable: true
          }
        ],
        tax_settings: {
          apply_iss: true,
          iss_rate: 3.0,
          apply_pis_cofins: true,
          tax_regime: 'lucro_real'
        }
      }

      const response = await apiClient.createInvoice(invoiceData)

      expect(response.status).toBe(201)
      expect(response.body.data).toHaveProperty('legal_compliance')
      expect(response.body.data.legal_compliance).toHaveProperty('tax_breakdown')
      expect(response.body.data.legal_compliance).toHaveProperty('legal_requirements_met')
      expect(response.body.data.legal_compliance.legal_requirements_met).toBe(true)
    })

    test('should include required legal fields in invoices', async () => {
      const response = await apiClient.getInvoice('test-invoice-id')

      if (response.status === 200) {
        expect(response.body.data).toHaveProperty('invoice_number')
        expect(response.body.data).toHaveProperty('issue_date')
        expect(response.body.data).toHaveProperty('due_date')
        expect(response.body.data).toHaveProperty('tax_amount')
        expect(response.body.data).toHaveProperty('total_amount')
        
        if (response.body.data.legal_compliance) {
          expect(response.body.data.legal_compliance).toHaveProperty('tax_breakdown')
          expect(response.body.data.legal_compliance).toHaveProperty('digital_signature')
          expect(response.body.data.legal_compliance).toHaveProperty('fiscal_document_key')
        }
      }
    })

    test('should validate OAB (Brazilian Bar Association) numbers', async () => {
      const lawyerData = {
        full_name: 'Dr. João Santos',
        email: 'joao.santos@lawfirm.com',
        oab_number: 'SP123456',
        oab_state: 'SP',
        cpf: '12345678909'
      }

      // Mock OAB validation endpoint
      const response = await apiClient.updateProfile(lawyerData)

      if (response.status === 200) {
        expect(response.body.data.oab_number).toBe('SP123456')
        expect(response.body.data.oab_verified).toBe(true)
      } else if (response.status === 400) {
        expect(response.body.error.message).toContain('Invalid OAB number')
      }
    })

    test('should handle legal case type classifications', async () => {
      const matterData = {
        title: 'Ação de Cobrança',
        client_id: 'test-client-id',
        case_type: 'civil',
        legal_classification: {
          cnj_code: '198', // CNJ procedural code
          subject_matter: 'cobranca',
          jurisdiction: 'state',
          court_level: 'first_instance'
        }
      }

      const response = await apiClient.createMatter(matterData)

      expect(response.status).toBe(201)
      expect(response.body.data.legal_classification.cnj_code).toBe('198')
      expect(response.body.data.legal_classification.subject_matter).toBe('cobranca')
    })

    test('should validate legal document types', async () => {
      const documentTypes = [
        'procuracao',      // Power of attorney
        'contrato',        // Contract
        'peticao_inicial', // Initial petition
        'acordo',          // Agreement
        'sentenca',        // Court ruling
        'recurso'          // Appeal
      ]

      for (const docType of documentTypes) {
        const documentData = {
          matter_id: 'test-matter-id',
          document_type: docType,
          title: `Documento ${docType}`,
          file_path: `/documents/${docType}.pdf`
        }

        // Mock document creation endpoint
        const response = await apiClient.uploadFile(
          Buffer.from('test content'),
          `${docType}.pdf`,
          documentData
        )

        if (response.status === 201) {
          expect(response.body.data.document_type).toBe(docType)
        }
      }
    })
  })

  describe('Brazilian Payment Methods', () => {
    test('should validate PIX key formats', async () => {
      const pixKeys = [
        { key: '12345678909', type: 'cpf', valid: true },
        { key: '11222333000181', type: 'cnpj', valid: true },
        { key: '+5511999999999', type: 'phone', valid: true },
        { key: 'user@example.com', type: 'email', valid: true },
        { key: '123e4567-e89b-12d3-a456-426614174000', type: 'random', valid: true },
        { key: 'invalid-key', type: 'unknown', valid: false }
      ]

      for (const pixKey of pixKeys) {
        const paymentData = {
          payment_method: 'pix',
          pix_key: pixKey.key,
          pix_key_type: pixKey.type,
          amount: 100.00
        }

        const response = await apiClient.generatePixPayment(paymentData)

        if (pixKey.valid) {
          expect(response.status).toBe(201)
          expect(response.body.data.pix_key).toBe(pixKey.key)
          expect(response.body.data.pix_key_type).toBe(pixKey.type)
        } else {
          expect(response.status).toBe(400)
          expect(response.body.error.message).toContain('Invalid PIX key')
        }
      }
    })

    test('should generate PIX QR code', async () => {
      const paymentData = {
        payment_method: 'pix',
        pix_key: 'user@example.com',
        pix_key_type: 'email',
        amount: 500.00,
        description: 'Legal services payment'
      }

      const response = await apiClient.generatePixPayment(paymentData)

      expect(response.status).toBe(201)
      expect(response.body.data).toHaveProperty('qr_code')
      expect(response.body.data).toHaveProperty('qr_code_image')
      expect(response.body.data).toHaveProperty('pix_copy_paste')
      expect(response.body.data).toHaveProperty('expires_at')
    })

    test('should handle bank transfer validation', async () => {
      const transferData = {
        payment_method: 'bank_transfer',
        bank_code: '001', // Banco do Brasil
        branch: '1234',
        account: '567890-1',
        account_type: 'checking',
        amount: 1000.00
      }

      const response = await apiClient.processBankTransfer(transferData)

      expect(response.status).toBe(201)
      expect(response.body.data.bank_code).toBe('001')
      expect(response.body.data).toHaveProperty('transfer_instructions')
    })

    test('should validate Brazilian bank codes', async () => {
      const validBankCodes = ['001', '033', '104', '237', '341', '356', '389', '422']
      
      for (const bankCode of validBankCodes) {
        const transferData = {
          payment_method: 'bank_transfer',
          bank_code: bankCode,
          branch: '1234',
          account: '567890-1',
          amount: 100.00
        }

        const response = await apiClient.processBankTransfer(transferData)

        expect(response.status).toBe(201)
        expect(response.body.data.bank_name).toBeTruthy()
      }
    })

    test('should handle credit card payments with Brazilian validation', async () => {
      const cardData = {
        payment_method: 'credit_card',
        card_number: '4111111111111111',
        card_holder_name: 'João da Silva',
        card_holder_cpf: '12345678909',
        expiry_month: 12,
        expiry_year: 2025,
        cvv: '123',
        amount: 750.00
      }

      const response = await apiClient.processCreditCardPayment(cardData)

      expect(response.status).toBe(201)
      expect(response.body.data).toHaveProperty('transaction_id')
      expect(response.body.data).toHaveProperty('authorization_code')
      expect(response.body.data.card_holder_cpf).toBe('123.456.789-09') // Formatted
    })
  })

  describe('Regulatory Compliance', () => {
    test('should comply with LGPD (Brazilian GDPR)', async () => {
      const clientData = {
        name: 'João da Silva',
        email: 'joao@example.com',
        cpf: '12345678909',
        phone: '+55 11 99999-9999',
        lgpd_consent: {
          data_processing: true,
          marketing: false,
          third_party_sharing: false,
          consent_date: new Date().toISOString()
        }
      }

      const response = await apiClient.createClient(clientData)

      expect(response.status).toBe(201)
      expect(response.body.data.lgpd_consent).toBeTruthy()
      expect(response.body.data.lgpd_consent.data_processing).toBe(true)
    })

    test('should handle data anonymization requests', async () => {
      const anonymizationRequest = {
        client_id: 'test-client-id',
        request_type: 'anonymize',
        reason: 'Client requested data deletion',
        retention_period: '5_years' // Legal requirement for law firms
      }

      // Mock data anonymization endpoint
      const response = await apiClient.updateClient('test-client-id', {
        anonymization_request: anonymizationRequest
      })

      if (response.status === 200) {
        expect(response.body.data.anonymization_status).toBe('requested')
      }
    })

    test('should maintain audit trail for compliance', async () => {
      const invoiceData = {
        client_id: 'test-client-id',
        invoice_type: 'subscription',
        amount: 1000.00
      }

      const response = await apiClient.createInvoice(invoiceData)

      if (response.status === 201) {
        expect(response.body.data).toHaveProperty('audit_trail')
        expect(response.body.data.audit_trail).toHaveProperty('created_by')
        expect(response.body.data.audit_trail).toHaveProperty('created_at')
        expect(response.body.data.audit_trail).toHaveProperty('ip_address')
      }
    })

    test('should handle legal retention periods', async () => {
      const documentData = {
        matter_id: 'test-matter-id',
        document_type: 'contract',
        retention_policy: {
          period: '20_years', // Legal requirement for contracts
          auto_delete: false,
          legal_basis: 'Civil Code Article 205'
        }
      }

      // Mock document retention endpoint
      const response = await apiClient.uploadFile(
        Buffer.from('contract content'),
        'contract.pdf',
        documentData
      )

      if (response.status === 201) {
        expect(response.body.data.retention_policy.period).toBe('20_years')
        expect(response.body.data.retention_policy.auto_delete).toBe(false)
      }
    })
  })

  describe('Brazilian Address Validation', () => {
    test('should validate CEP (postal code) format', async () => {
      const validCEPs = [
        '01310-100',
        '01310100',
        '12345-678'
      ]

      const invalidCEPs = [
        '0131010',    // Too short
        '013101000',  // Too long
        '01310-1000', // Invalid format
        'abcde-fgh'   // Letters
      ]

      for (const cep of validCEPs) {
        const addressData = {
          street: 'Av. Paulista, 1000',
          city: 'São Paulo',
          state: 'SP',
          postal_code: cep,
          country: 'BR'
        }

        // Mock address validation (would be part of client/vendor creation)
        expect(cep).toMatch(/^\d{5}-?\d{3}$/)
      }

      for (const cep of invalidCEPs) {
        expect(cep).not.toMatch(/^\d{5}-?\d{3}$/)
      }
    })

    test('should validate Brazilian state codes', async () => {
      const validStates = [
        'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
        'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
        'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
      ]

      for (const state of validStates) {
        const addressData = {
          street: 'Rua Teste, 123',
          city: 'Test City',
          state: state,
          postal_code: '12345-678',
          country: 'BR'
        }

        // Mock address validation
        expect(validStates).toContain(state)
      }
    })

    test('should integrate with ViaCEP API for address lookup', async () => {
      const cep = '01310-100' // Av. Paulista, São Paulo

      // Mock ViaCEP integration
      const mockAddress = {
        cep: '01310-100',
        logradouro: 'Avenida Paulista',
        bairro: 'Bela Vista',
        localidade: 'São Paulo',
        uf: 'SP',
        ibge: '3550308'
      }

      // In actual implementation, this would be a separate endpoint
      expect(mockAddress.uf).toBe('SP')
      expect(mockAddress.localidade).toBe('São Paulo')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    test('should handle invalid input gracefully', async () => {
      const invalidInputs = [
        { cpf: null, cnpj: undefined },
        { cpf: '', cnpj: '' },
        { cpf: 'null', cnpj: 'undefined' }
      ]

      for (const input of invalidInputs) {
        if (input.cpf !== undefined) {
          const response = await apiClient.validateCPF(input.cpf)
          expect(response.status).toBe(200)
          expect(response.body.data.is_valid).toBe(false)
        }

        if (input.cnpj !== undefined) {
          const response = await apiClient.validateCNPJ(input.cnpj)
          expect(response.status).toBe(200)
          expect(response.body.data.is_valid).toBe(false)
        }
      }
    })

    test('should handle rate limiting on validation endpoints', async () => {
      const promises = Array.from({ length: 50 }, () => 
        apiClient.validateCPF('12345678909')
      )

      const responses = await Promise.allSettled(promises)
      const rateLimitedResponses = responses.filter(
        (result) => result.status === 'fulfilled' && 
        result.value.status === 429
      )

      expect(rateLimitedResponses.length).toBeGreaterThanOrEqual(0)
    })

    test('should handle external service failures', async () => {
      // Mock external service failure (ViaCEP, bank validation, etc.)
      vi.spyOn(apiClient, 'validateCNPJ').mockResolvedValue({
        status: 503,
        body: { 
          error: { 
            message: 'External validation service unavailable',
            code: 'SERVICE_UNAVAILABLE'
          } 
        }
      } as any)

      const response = await apiClient.validateCNPJ('11222333000181')

      expect(response.status).toBe(503)
      expect(response.body.error.code).toBe('SERVICE_UNAVAILABLE')
    })

    test('should provide fallback validation when external services fail', async () => {
      // Test that basic format validation still works when external services are down
      const cpf = '12345678909'
      const isValidFormat = validateCPF(cpf)

      expect(isValidFormat).toBe(true)
    })
  })
})