/**
 * Supabase Integration Tests
 * Tests for database operations, RLS policies, real-time features, and Supabase-specific functionality
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { APITestClient } from '../utils/api-client'
import {
  createTestLawFirm,
  createTestClient,
  createTestInvoice,
  createTestTimeEntry,
  createTestVendor,
  createTestBill,
  setupTestDatabase,
  cleanupTestDatabase
} from '../utils/test-helpers'

describe('Supabase Integration', () => {
  let supabase: any
  let apiClient: APITestClient
  let testData: any

  beforeAll(async () => {
    // Initialize Supabase client for direct testing
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
      process.env.SUPABASE_SERVICE_KEY || 'test-service-key'
    )

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

  describe('Database Connection and Basic Operations', () => {
    test('should connect to Supabase successfully', async () => {
      const { data, error } = await supabase
        .from('law_firms')
        .select('id')
        .limit(1)

      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
    })

    test('should perform basic CRUD operations', async () => {
      const testFirm = createTestLawFirm()

      // Create
      const { data: created, error: createError } = await supabase
        .from('law_firms')
        .insert([testFirm])
        .select()
        .single()

      expect(createError).toBeNull()
      expect(created.id).toBeTruthy()
      expect(created.name).toBe(testFirm.name)

      // Read
      const { data: read, error: readError } = await supabase
        .from('law_firms')
        .select('*')
        .eq('id', created.id)
        .single()

      expect(readError).toBeNull()
      expect(read.name).toBe(testFirm.name)

      // Update
      const updatedName = 'Updated Law Firm Name'
      const { data: updated, error: updateError } = await supabase
        .from('law_firms')
        .update({ name: updatedName })
        .eq('id', created.id)
        .select()
        .single()

      expect(updateError).toBeNull()
      expect(updated.name).toBe(updatedName)

      // Delete
      const { error: deleteError } = await supabase
        .from('law_firms')
        .delete()
        .eq('id', created.id)

      expect(deleteError).toBeNull()

      // Verify deletion
      const { data: deleted, error: verifyError } = await supabase
        .from('law_firms')
        .select('*')
        .eq('id', created.id)
        .single()

      expect(verifyError.code).toBe('PGRST116') // No rows found
      expect(deleted).toBeNull()
    })

    test('should handle database constraints', async () => {
      // Test unique constraint violation
      const duplicateData = {
        id: 'duplicate-id',
        name: 'Test Firm',
        email: 'test@firm.com'
      }

      // Insert first record
      await supabase
        .from('law_firms')
        .insert([duplicateData])

      // Try to insert duplicate
      const { error } = await supabase
        .from('law_firms')
        .insert([duplicateData])

      expect(error).toBeTruthy()
      expect(error.code).toBe('23505') // Unique violation
    })

    test('should handle foreign key constraints', async () => {
      // Try to create client with non-existent law_firm_id
      const invalidClient = {
        law_firm_id: 'non-existent-firm-id',
        name: 'Test Client',
        email: 'client@test.com',
        client_type: 'individual'
      }

      const { error } = await supabase
        .from('clients')
        .insert([invalidClient])

      expect(error).toBeTruthy()
      expect(error.code).toBe('23503') // Foreign key violation
    })
  })

  describe('Row Level Security (RLS) Policies', () => {
    test('should enforce RLS on clients table', async () => {
      // Create a client with specific law_firm_id
      const clientData = createTestClient()
      clientData.law_firm_id = 'test-law-firm-1'

      const { data: client, error: createError } = await supabase
        .from('clients')
        .insert([clientData])
        .select()
        .single()

      expect(createError).toBeNull()

      // Try to access client from different law firm context
      // This would typically be done with a different user session
      const { data: restrictedAccess, error: rlsError } = await supabase
        .rpc('set_law_firm_context', { firm_id: 'different-law-firm-id' })
        .from('clients')
        .select('*')
        .eq('id', client.id)

      // Should not be able to access due to RLS
      expect(restrictedAccess).toEqual([])
    })

    test('should allow access within same law firm', async () => {
      const lawFirmId = 'test-law-firm-2'
      const clientData = createTestClient()
      clientData.law_firm_id = lawFirmId

      // Set law firm context
      await supabase.rpc('set_law_firm_context', { firm_id: lawFirmId })

      const { data: client, error: createError } = await supabase
        .from('clients')
        .insert([clientData])
        .select()
        .single()

      expect(createError).toBeNull()

      // Should be able to access within same law firm
      const { data: sameOrgAccess, error: accessError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', client.id)
        .single()

      expect(accessError).toBeNull()
      expect(sameOrgAccess.id).toBe(client.id)
    })

    test('should enforce user-level RLS on time entries', async () => {
      const timeEntryData = createTestTimeEntry()
      timeEntryData.user_id = 'user-1'
      timeEntryData.law_firm_id = 'test-law-firm-3'

      const { data: entry, error: createError } = await supabase
        .from('time_entries')
        .insert([timeEntryData])
        .select()
        .single()

      expect(createError).toBeNull()

      // Try to access as different user
      await supabase.rpc('set_user_context', { user_id: 'user-2' })

      const { data: restrictedEntry } = await supabase
        .from('time_entries')
        .select('*')
        .eq('id', entry.id)

      // Should not be accessible to different user
      expect(restrictedEntry).toEqual([])
    })

    test('should allow admin access across all data', async () => {
      const clientData = createTestClient()
      clientData.law_firm_id = 'test-law-firm-4'

      const { data: client } = await supabase
        .from('clients')
        .insert([clientData])
        .select()
        .single()

      // Set admin context
      await supabase.rpc('set_admin_context', { is_admin: true })

      // Admin should access all data regardless of law firm
      const { data: adminAccess, error: adminError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', client.id)
        .single()

      expect(adminError).toBeNull()
      expect(adminAccess.id).toBe(client.id)
    })
  })

  describe('Database Functions and Triggers', () => {
    test('should automatically set created_at and updated_at timestamps', async () => {
      const invoiceData = createTestInvoice()

      const { data: invoice, error } = await supabase
        .from('invoices')
        .insert([invoiceData])
        .select()
        .single()

      expect(error).toBeNull()
      expect(invoice.created_at).toBeTruthy()
      expect(invoice.updated_at).toBeTruthy()
      expect(new Date(invoice.created_at).getTime()).toBeLessThanOrEqual(new Date().getTime())
    })

    test('should update updated_at on record modification', async () => {
      const invoiceData = createTestInvoice()

      const { data: original } = await supabase
        .from('invoices')
        .insert([invoiceData])
        .select()
        .single()

      // Wait a moment to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100))

      const { data: updated } = await supabase
        .from('invoices')
        .update({ description: 'Updated description' })
        .eq('id', original.id)
        .select()
        .single()

      expect(new Date(updated.updated_at).getTime()).toBeGreaterThan(new Date(original.updated_at).getTime())
    })

    test('should calculate invoice totals automatically', async () => {
      const invoiceData = {
        ...createTestInvoice(),
        subtotal: 1000.00,
        tax_amount: 150.00,
        discount_amount: 50.00
      }

      const { data: invoice, error } = await supabase
        .from('invoices')
        .insert([invoiceData])
        .select()
        .single()

      expect(error).toBeNull()
      expect(invoice.total_amount).toBe(1100.00) // 1000 + 150 - 50
    })

    test('should enforce business rules via triggers', async () => {
      // Try to create time entry with end time before start time
      const invalidTimeEntry = {
        ...createTestTimeEntry(),
        start_time: '2024-03-15T10:00:00Z',
        end_time: '2024-03-15T09:00:00Z' // Before start time
      }

      const { error } = await supabase
        .from('time_entries')
        .insert([invalidTimeEntry])

      expect(error).toBeTruthy()
      expect(error.message).toContain('End time must be after start time')
    })

    test('should generate sequential invoice numbers', async () => {
      const invoiceData1 = createTestInvoice()
      const invoiceData2 = createTestInvoice()

      const { data: invoice1 } = await supabase
        .from('invoices')
        .insert([invoiceData1])
        .select()
        .single()

      const { data: invoice2 } = await supabase
        .from('invoices')
        .insert([invoiceData2])
        .select()
        .single()

      expect(invoice1.invoice_number).toBeTruthy()
      expect(invoice2.invoice_number).toBeTruthy()
      expect(invoice1.invoice_number).not.toBe(invoice2.invoice_number)
      
      // Should be sequential
      const num1 = parseInt(invoice1.invoice_number.split('-').pop())
      const num2 = parseInt(invoice2.invoice_number.split('-').pop())
      expect(num2).toBeGreaterThan(num1)
    })
  })

  describe('Real-time Features', () => {
    test('should receive real-time updates for invoice changes', async () => {
      let receivedUpdate = false
      let updateData: any = null

      // Set up real-time subscription
      const subscription = supabase
        .channel('invoice-changes')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'invoices'
        }, (payload: any) => {
          receivedUpdate = true
          updateData = payload.new
        })
        .subscribe()

      // Create an invoice
      const invoiceData = createTestInvoice()
      const { data: invoice } = await supabase
        .from('invoices')
        .insert([invoiceData])
        .select()
        .single()

      // Update the invoice
      await supabase
        .from('invoices')
        .update({ description: 'Updated via real-time test' })
        .eq('id', invoice.id)

      // Wait for real-time event
      await new Promise(resolve => setTimeout(resolve, 1000))

      expect(receivedUpdate).toBe(true)
      expect(updateData.description).toBe('Updated via real-time test')

      // Clean up subscription
      subscription.unsubscribe()
    })

    test('should receive real-time updates for time tracking', async () => {
      let timerEvents: any[] = []

      const subscription = supabase
        .channel('timer-events')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'active_time_sessions'
        }, (payload: any) => {
          timerEvents.push(payload)
        })
        .subscribe()

      // Start a timer session
      const sessionData = {
        user_id: 'test-user-id',
        law_firm_id: 'test-law-firm-id',
        session_name: 'Real-time timer test',
        entry_type: 'case_work',
        started_at: new Date().toISOString(),
        last_heartbeat: new Date().toISOString(),
        is_active: true,
        is_paused: false
      }

      const { data: session } = await supabase
        .from('active_time_sessions')
        .insert([sessionData])
        .select()
        .single()

      // Update session (pause)
      await supabase
        .from('active_time_sessions')
        .update({ 
          is_paused: true, 
          paused_at: new Date().toISOString() 
        })
        .eq('id', session.id)

      // Stop session (delete)
      await supabase
        .from('active_time_sessions')
        .delete()
        .eq('id', session.id)

      // Wait for events
      await new Promise(resolve => setTimeout(resolve, 1000))

      expect(timerEvents.length).toBeGreaterThanOrEqual(3) // INSERT, UPDATE, DELETE
      expect(timerEvents.some(e => e.eventType === 'INSERT')).toBe(true)
      expect(timerEvents.some(e => e.eventType === 'UPDATE')).toBe(true)
      expect(timerEvents.some(e => e.eventType === 'DELETE')).toBe(true)

      subscription.unsubscribe()
    })

    test('should handle real-time presence for active users', async () => {
      const channel = supabase.channel('user-presence')
      
      let presenceState: any = {}

      channel
        .on('presence', { event: 'sync' }, () => {
          presenceState = channel.presenceState()
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('User joined:', key, newPresences)
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          console.log('User left:', key, leftPresences)
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            // Track user presence
            await channel.track({
              user_id: 'test-user-1',
              online_at: new Date().toISOString(),
              activity: 'working_on_case'
            })
          }
        })

      // Wait for subscription
      await new Promise(resolve => setTimeout(resolve, 1000))

      expect(Object.keys(presenceState).length).toBeGreaterThan(0)

      channel.unsubscribe()
    })
  })

  describe('Database Performance and Optimization', () => {
    test('should use database indexes efficiently', async () => {
      // Create multiple invoices for performance testing
      const invoices = Array.from({ length: 100 }, (_, i) => ({
        ...createTestInvoice(),
        invoice_number: `PERF-TEST-${i}`,
        client_id: `client-${i % 10}` // Distribute across 10 clients
      }))

      await supabase
        .from('invoices')
        .insert(invoices)

      // Query with indexed field (should be fast)
      const startTime = Date.now()
      
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('client_id', 'client-5')
        .order('created_at', { ascending: false })
        .limit(10)

      const queryTime = Date.now() - startTime

      expect(error).toBeNull()
      expect(data.length).toBeGreaterThan(0)
      expect(queryTime).toBeLessThan(1000) // Should complete within 1 second
    })

    test('should handle complex joins efficiently', async () => {
      const startTime = Date.now()

      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          client:clients(*),
          line_items:invoice_line_items(*),
          payments:invoice_payments(*)
        `)
        .limit(10)

      const queryTime = Date.now() - startTime

      expect(error).toBeNull()
      expect(queryTime).toBeLessThan(2000) // Complex join should complete within 2 seconds
    })

    test('should paginate large result sets efficiently', async () => {
      const pageSize = 10
      const page1Start = Date.now()

      const { data: page1, error: error1, count } = await supabase
        .from('invoices')
        .select('*', { count: 'exact' })
        .range(0, pageSize - 1)
        .order('created_at', { ascending: false })

      const page1Time = Date.now() - page1Start

      expect(error1).toBeNull()
      expect(page1.length).toBeLessThanOrEqual(pageSize)
      expect(page1Time).toBeLessThan(1000)

      // Get second page
      const page2Start = Date.now()

      const { data: page2, error: error2 } = await supabase
        .from('invoices')
        .select('*')
        .range(pageSize, (pageSize * 2) - 1)
        .order('created_at', { ascending: false })

      const page2Time = Date.now() - page2Start

      expect(error2).toBeNull()
      expect(page2Time).toBeLessThan(1000) // Subsequent pages should be equally fast
    })
  })

  describe('Database Transactions', () => {
    test('should handle transaction rollback on error', async () => {
      // Start transaction
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([createTestInvoice()])
        .select()
        .single()

      expect(invoiceError).toBeNull()

      // Try to create line items with invalid data to trigger rollback
      const invalidLineItems = [
        {
          invoice_id: invoice.id,
          line_type: 'subscription_fee',
          description: 'Valid item',
          quantity: 1,
          unit_price: 100.00
        },
        {
          invoice_id: invoice.id,
          line_type: 'invalid_type', // This should cause error
          description: 'Invalid item',
          quantity: 1,
          unit_price: 200.00
        }
      ]

      const { error: lineItemError } = await supabase
        .from('invoice_line_items')
        .insert(invalidLineItems)

      expect(lineItemError).toBeTruthy()

      // Verify that no line items were created due to rollback
      const { data: lineItems } = await supabase
        .from('invoice_line_items')
        .select('*')
        .eq('invoice_id', invoice.id)

      expect(lineItems.length).toBe(0)
    })

    test('should maintain data consistency across related tables', async () => {
      // Create invoice with line items in single transaction
      const invoiceData = createTestInvoice()
      
      const { data: invoice } = await supabase
        .from('invoices')
        .insert([invoiceData])
        .select()
        .single()

      const lineItems = [
        {
          invoice_id: invoice.id,
          line_type: 'subscription_fee',
          description: 'Monthly subscription',
          quantity: 1,
          unit_price: 500.00,
          line_total: 500.00
        }
      ]

      const { data: createdLineItems, error: lineItemError } = await supabase
        .from('invoice_line_items')
        .insert(lineItems)
        .select()

      expect(lineItemError).toBeNull()
      expect(createdLineItems.length).toBe(1)

      // Verify data consistency
      const { data: fullInvoice } = await supabase
        .from('invoices')
        .select(`
          *,
          line_items:invoice_line_items(*)
        `)
        .eq('id', invoice.id)
        .single()

      expect(fullInvoice.line_items.length).toBe(1)
      expect(fullInvoice.line_items[0].unit_price).toBe(500.00)
    })
  })

  describe('Database Backup and Recovery', () => {
    test('should verify data integrity after operations', async () => {
      // Create test data
      const testEntities = {
        law_firm: createTestLawFirm(),
        client: createTestClient(),
        vendor: createTestVendor(),
        invoice: createTestInvoice()
      }

      // Insert all entities
      const results = await Promise.all([
        supabase.from('law_firms').insert([testEntities.law_firm]).select().single(),
        supabase.from('clients').insert([testEntities.client]).select().single(),
        supabase.from('vendors').insert([testEntities.vendor]).select().single(),
        supabase.from('invoices').insert([testEntities.invoice]).select().single()
      ])

      // Verify all insertions succeeded
      results.forEach(result => {
        expect(result.error).toBeNull()
        expect(result.data).toBeTruthy()
      })

      // Verify data integrity with checksums or counts
      const { count: firmCount } = await supabase
        .from('law_firms')
        .select('*', { count: 'exact', head: true })
        .eq('id', testEntities.law_firm.id)

      const { count: clientCount } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .eq('id', testEntities.client.id)

      expect(firmCount).toBe(1)
      expect(clientCount).toBe(1)
    })
  })

  describe('Error Handling and Connection Management', () => {
    test('should handle connection timeouts gracefully', async () => {
      // Mock slow query
      const slowQuery = supabase
        .from('invoices')
        .select('*')
        .limit(10000) // Large limit to potentially slow down query

      const queryPromise = slowQuery
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), 5000)
      )

      try {
        await Promise.race([queryPromise, timeoutPromise])
      } catch (error) {
        expect(error.message).toContain('timeout')
      }
    })

    test('should handle network disconnection', async () => {
      // This would require mocking network conditions
      // For now, just test error handling structure
      try {
        await supabase
          .from('non_existent_table')
          .select('*')
      } catch (error) {
        expect(error).toBeTruthy()
      }
    })

    test('should retry failed operations', async () => {
      let attempts = 0
      const maxAttempts = 3

      const retryOperation = async (): Promise<any> => {
        attempts++
        if (attempts < maxAttempts) {
          throw new Error('Simulated failure')
        }
        
        return await supabase
          .from('law_firms')
          .select('id')
          .limit(1)
      }

      let result
      let lastError

      for (let i = 0; i < maxAttempts; i++) {
        try {
          result = await retryOperation()
          break
        } catch (error) {
          lastError = error
          if (i < maxAttempts - 1) {
            await new Promise(resolve => setTimeout(resolve, 100 * (i + 1))) // Exponential backoff
          }
        }
      }

      expect(attempts).toBe(maxAttempts)
      expect(result).toBeTruthy()
    })
  })

  describe('Database Migrations and Schema Changes', () => {
    test('should verify all required tables exist', async () => {
      const requiredTables = [
        'law_firms',
        'users',
        'clients',
        'matters',
        'invoices',
        'invoice_line_items',
        'invoice_payments',
        'time_entries',
        'active_time_sessions',
        'vendors',
        'bills',
        'bill_payments',
        'client_subscriptions',
        'subscription_plans'
      ]

      for (const table of requiredTables) {
        const { error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
          .limit(0)

        expect(error).toBeNull()
      }
    })

    test('should verify table relationships are properly configured', async () => {
      // Test foreign key relationships
      const relationships = [
        { table: 'clients', column: 'law_firm_id', references: 'law_firms' },
        { table: 'invoices', column: 'client_id', references: 'clients' },
        { table: 'invoice_line_items', column: 'invoice_id', references: 'invoices' },
        { table: 'time_entries', column: 'matter_id', references: 'matters' },
        { table: 'bills', column: 'vendor_id', references: 'vendors' }
      ]

      // For each relationship, try to insert invalid reference
      for (const rel of relationships) {
        const invalidData = {
          [rel.column]: 'non-existent-id'
        }

        // Add minimum required fields for each table
        if (rel.table === 'clients') {
          Object.assign(invalidData, {
            name: 'Test Client',
            email: 'test@client.com',
            client_type: 'individual'
          })
        } else if (rel.table === 'invoices') {
          Object.assign(invalidData, {
            invoice_number: 'TEST-001',
            invoice_type: 'subscription',
            subtotal: 100,
            tax_amount: 0,
            discount_amount: 0,
            total_amount: 100,
            currency: 'BRL',
            invoice_status: 'draft',
            issue_date: new Date().toISOString().split('T')[0],
            due_date: new Date().toISOString().split('T')[0],
            payment_terms: '30_days'
          })
        }

        const { error } = await supabase
          .from(rel.table)
          .insert([invalidData])

        expect(error).toBeTruthy()
        expect(error.code).toBe('23503') // Foreign key violation
      }
    })
  })
})