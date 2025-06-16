/**
 * Backend API Test Helpers
 * Comprehensive utilities for testing Prima Facie Legal-as-a-Service platform APIs
 */

import { createClient } from '@supabase/supabase-js'
import { vi } from 'vitest'

// Test database client
export const createTestClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-key'
  
  return createClient(supabaseUrl, supabaseAnonKey)
}

// Mock user authentication
export const mockAuth = {
  getUser: vi.fn().mockResolvedValue({
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User' }
      }
    },
    error: null
  }),
  signInWithPassword: vi.fn().mockResolvedValue({
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com'
      },
      session: {
        access_token: 'test-token',
        refresh_token: 'test-refresh-token'
      }
    },
    error: null
  }),
  signOut: vi.fn().mockResolvedValue({
    error: null
  })
}

// Test data factories
export const createTestLawFirm = () => ({
  id: 'test-law-firm-id',
  name: 'Test Law Firm',
  legal_name: 'Test Law Firm LTDA',
  cnpj: '12.345.678/0001-90',
  email: 'contact@testlawfirm.com',
  phone: '+55 11 99999-9999',
  address: {
    street: 'Rua Teste, 123',
    city: 'São Paulo',
    state: 'SP',
    postal_code: '01234-567',
    country: 'BR'
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
})

export const createTestClient = () => ({
  id: 'test-client-id',
  law_firm_id: 'test-law-firm-id',
  name: 'Test Client',
  email: 'client@test.com',
  phone: '+55 11 88888-8888',
  cpf: '123.456.789-00',
  client_type: 'individual' as const,
  status: 'active' as const,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
})

export const createTestMatter = () => ({
  id: 'test-matter-id',
  law_firm_id: 'test-law-firm-id',
  client_id: 'test-client-id',
  title: 'Test Legal Matter',
  description: 'Test legal matter description',
  case_type: 'civil',
  status: 'active' as const,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
})

export const createTestInvoice = () => ({
  id: 'test-invoice-id',
  law_firm_id: 'test-law-firm-id',
  client_id: 'test-client-id',
  invoice_number: 'INV-2024-001',
  invoice_type: 'subscription' as const,
  subtotal: 1000.00,
  tax_amount: 100.00,
  discount_amount: 0.00,
  total_amount: 1100.00,
  currency: 'BRL',
  invoice_status: 'draft' as const,
  issue_date: new Date().toISOString().split('T')[0],
  due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  payment_terms: '30_days' as const,
  payment_methods: ['pix', 'bank_transfer'],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
})

export const createTestTimeEntry = () => ({
  id: 'test-time-entry-id',
  law_firm_id: 'test-law-firm-id',
  user_id: 'test-user-id',
  matter_id: 'test-matter-id',
  entry_type: 'case_work' as const,
  task_category: 'research',
  activity_description: 'Legal research for case',
  start_time: new Date().toISOString(),
  end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  duration_minutes: 120,
  break_minutes: 0,
  effective_minutes: 120,
  is_billable: true,
  billable_rate: 150.00,
  billable_amount: 300.00,
  entry_status: 'pending' as const,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
})

export const createTestVendor = () => ({
  id: 'test-vendor-id',
  law_firm_id: 'test-law-firm-id',
  name: 'Test Vendor',
  legal_name: 'Test Vendor LTDA',
  cnpj: '98.765.432/0001-10',
  email: 'vendor@test.com',
  phone: '+55 11 77777-7777',
  vendor_type: 'service_provider' as const,
  payment_terms: '30_days' as const,
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
})

export const createTestBill = () => ({
  id: 'test-bill-id',
  law_firm_id: 'test-law-firm-id',
  vendor_id: 'test-vendor-id',
  bill_number: 'BILL-2024-001',
  bill_date: new Date().toISOString().split('T')[0],
  due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  subtotal: 500.00,
  tax_amount: 50.00,
  discount_amount: 0.00,
  total_amount: 550.00,
  amount_paid: 0.00,
  balance_due: 550.00,
  currency_code: 'BRL',
  payment_status: 'pending' as const,
  approval_status: 'pending' as const,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
})

export const createTestSubscription = () => ({
  id: 'test-subscription-id',
  law_firm_id: 'test-law-firm-id',
  client_id: 'test-client-id',
  plan_name: 'Professional Plan',
  plan_type: 'professional' as const,
  billing_cycle: 'monthly' as const,
  monthly_fee: 500.00,
  status: 'active' as const,
  start_date: new Date().toISOString().split('T')[0],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
})

// API response helpers
export const mockSuccessResponse = (data: any) => ({
  data,
  error: null,
  status: 200,
  statusText: 'OK'
})

export const mockErrorResponse = (message: string, code = 400) => ({
  data: null,
  error: {
    message,
    code: code.toString(),
    details: null,
    hint: null
  },
  status: code,
  statusText: code >= 400 ? 'Error' : 'OK'
})

// Database operation mocks
export const createMockSupabaseClient = () => {
  const mockFrom = vi.fn()
  const mockSelect = vi.fn()
  const mockInsert = vi.fn()
  const mockUpdate = vi.fn()
  const mockDelete = vi.fn()
  const mockEq = vi.fn()
  const mockSingle = vi.fn()
  const mockOrder = vi.fn()
  const mockLimit = vi.fn()
  const mockRange = vi.fn()
  const mockGte = vi.fn()
  const mockLte = vi.fn()
  const mockIn = vi.fn()
  const mockOr = vi.fn()
  const mockNot = vi.fn()

  // Chain all query methods
  const chainMethods = {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    eq: mockEq,
    single: mockSingle,
    order: mockOrder,
    limit: mockLimit,
    range: mockRange,
    gte: mockGte,
    lte: mockLte,
    in: mockIn,
    or: mockOr,
    not: mockNot
  }

  // Make all methods chainable
  Object.values(chainMethods).forEach(method => {
    method.mockReturnValue(chainMethods)
  })

  mockFrom.mockReturnValue(chainMethods)

  return {
    from: mockFrom,
    auth: mockAuth,
    ...chainMethods
  }
}

// Test setup and teardown
export const setupTestDatabase = async () => {
  // Setup test database state
  const client = createTestClient()
  
  // Create test data
  const lawFirm = createTestLawFirm()
  const testClient = createTestClient()
  const matter = createTestMatter()
  
  return {
    client,
    testData: {
      lawFirm,
      client: testClient,
      matter
    }
  }
}

export const cleanupTestDatabase = async () => {
  // Cleanup test database state
  const client = createTestClient()
  
  // Clean up test data in reverse order of dependencies
  const tables = [
    'invoice_payments',
    'invoice_line_items',
    'invoices',
    'bill_payments',
    'bills',
    'time_entries',
    'matters',
    'client_subscriptions',
    'clients',
    'vendors',
    'expense_categories'
  ]
  
  for (const table of tables) {
    await client.from(table).delete().like('id', 'test-%')
  }
}

// Validation helpers
export const validateInvoiceStructure = (invoice: any) => {
  expect(invoice).toHaveProperty('id')
  expect(invoice).toHaveProperty('law_firm_id')
  expect(invoice).toHaveProperty('client_id')
  expect(invoice).toHaveProperty('invoice_number')
  expect(invoice).toHaveProperty('invoice_type')
  expect(invoice).toHaveProperty('subtotal')
  expect(invoice).toHaveProperty('tax_amount')
  expect(invoice).toHaveProperty('discount_amount')
  expect(invoice).toHaveProperty('total_amount')
  expect(invoice).toHaveProperty('invoice_status')
  expect(invoice).toHaveProperty('issue_date')
  expect(invoice).toHaveProperty('due_date')
  expect(invoice).toHaveProperty('payment_terms')
  expect(invoice).toHaveProperty('created_at')
  expect(invoice).toHaveProperty('updated_at')
}

export const validateTimeEntryStructure = (timeEntry: any) => {
  expect(timeEntry).toHaveProperty('id')
  expect(timeEntry).toHaveProperty('law_firm_id')
  expect(timeEntry).toHaveProperty('user_id')
  expect(timeEntry).toHaveProperty('entry_type')
  expect(timeEntry).toHaveProperty('task_category')
  expect(timeEntry).toHaveProperty('activity_description')
  expect(timeEntry).toHaveProperty('start_time')
  expect(timeEntry).toHaveProperty('duration_minutes')
  expect(timeEntry).toHaveProperty('is_billable')
  expect(timeEntry).toHaveProperty('entry_status')
  expect(timeEntry).toHaveProperty('created_at')
  expect(timeEntry).toHaveProperty('updated_at')
}

export const validateBillStructure = (bill: any) => {
  expect(bill).toHaveProperty('id')
  expect(bill).toHaveProperty('law_firm_id')
  expect(bill).toHaveProperty('vendor_id')
  expect(bill).toHaveProperty('bill_number')
  expect(bill).toHaveProperty('bill_date')
  expect(bill).toHaveProperty('due_date')
  expect(bill).toHaveProperty('subtotal')
  expect(bill).toHaveProperty('tax_amount')
  expect(bill).toHaveProperty('total_amount')
  expect(bill).toHaveProperty('payment_status')
  expect(bill).toHaveProperty('approval_status')
  expect(bill).toHaveProperty('created_at')
  expect(bill).toHaveProperty('updated_at')
}

// Brazilian validation helpers
export const validateCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/[^\d]/g, '')
  if (cleanCPF.length !== 11) return false
  
  // Check for known invalid CPFs
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false
  
  // Validate check digits
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i)
  }
  let remainder = 11 - (sum % 11)
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false
  
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i)
  }
  remainder = 11 - (sum % 11)
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleanCPF.charAt(10))) return false
  
  return true
}

export const validateCNPJ = (cnpj: string): boolean => {
  const cleanCNPJ = cnpj.replace(/[^\d]/g, '')
  if (cleanCNPJ.length !== 14) return false
  
  // Check for known invalid CNPJs
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false
  
  // Validate first check digit
  let sum = 0
  let weight = 2
  for (let i = 11; i >= 0; i--) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weight
    weight = weight === 9 ? 2 : weight + 1
  }
  let remainder = sum % 11
  let digit1 = remainder < 2 ? 0 : 11 - remainder
  if (digit1 !== parseInt(cleanCNPJ.charAt(12))) return false
  
  // Validate second check digit
  sum = 0
  weight = 2
  for (let i = 12; i >= 0; i--) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weight
    weight = weight === 9 ? 2 : weight + 1
  }
  remainder = sum % 11
  let digit2 = remainder < 2 ? 0 : 11 - remainder
  if (digit2 !== parseInt(cleanCNPJ.charAt(13))) return false
  
  return true
}

// Error simulation helpers
export const simulateNetworkError = () => {
  throw new Error('Network error: Connection failed')
}

export const simulateTimeout = () => {
  throw new Error('Request timeout')
}

export const simulateRateLimitError = () => {
  throw new Error('Rate limit exceeded')
}

export const simulateValidationError = (field: string, message: string) => {
  throw new Error(`Validation error: ${field} - ${message}`)
}

// Date helpers for testing
export const getDateDaysFromNow = (days: number): string => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

export const getISODateString = (date: Date = new Date()): string => {
  return date.toISOString()
}

export const getISODateOnly = (date: Date = new Date()): string => {
  return date.toISOString().split('T')[0]
}

// Currency helpers
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(amount)
}

export const parseCurrency = (formatted: string): number => {
  return parseFloat(formatted.replace(/[^\d,-]/g, '').replace(',', '.'))
}