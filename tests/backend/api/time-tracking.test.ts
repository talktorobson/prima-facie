/**
 * Time Tracking API Tests
 * Comprehensive tests for time tracking, timer functionality, and billing integration
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import { APITestClient } from '../utils/api-client'
import {
  createTestLawFirm,
  createTestClient,
  createTestMatter,
  createTestTimeEntry,
  validateTimeEntryStructure,
  mockAuth,
  createMockSupabaseClient,
  simulateNetworkError,
  getDateDaysFromNow,
  getISODateString,
  setupTestDatabase,
  cleanupTestDatabase
} from '../utils/test-helpers'

describe('Time Tracking API', () => {
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

  describe('Time Entry CRUD Operations', () => {
    describe('CREATE Time Entry', () => {
      test('should create a basic time entry successfully', async () => {
        const timeEntryData = {
          entry_type: 'case_work',
          matter_id: testData.matter.id,
          task_category: 'research',
          activity_description: 'Legal research for contract review',
          start_time: '2024-03-15T09:00:00Z',
          end_time: '2024-03-15T11:00:00Z',
          is_billable: true,
          billable_rate: 150.00
        }

        const response = await apiClient.createTimeEntry(timeEntryData)

        expect(response.status).toBe(201)
        expect(response.body).toHaveProperty('data')
        validateTimeEntryStructure(response.body.data)
        expect(response.body.data.entry_type).toBe('case_work')
        expect(response.body.data.duration_minutes).toBe(120)
        expect(response.body.data.effective_minutes).toBe(120)
        expect(response.body.data.billable_amount).toBe(300.00)
      })

      test('should create time entry with break time', async () => {
        const timeEntryData = {
          entry_type: 'case_work',
          matter_id: testData.matter.id,
          task_category: 'consultation',
          activity_description: 'Client consultation with break',
          start_time: '2024-03-15T14:00:00Z',
          end_time: '2024-03-15T17:00:00Z',
          break_minutes: 30,
          is_billable: true,
          billable_rate: 200.00
        }

        const response = await apiClient.createTimeEntry(timeEntryData)

        expect(response.status).toBe(201)
        expect(response.body.data.duration_minutes).toBe(180)
        expect(response.body.data.break_minutes).toBe(30)
        expect(response.body.data.effective_minutes).toBe(150)
        expect(response.body.data.billable_amount).toBe(500.00) // 2.5 hours * 200
      })

      test('should create subscription-based time entry', async () => {
        const timeEntryData = {
          entry_type: 'subscription_work',
          client_subscription_id: 'test-subscription-id',
          task_category: 'document_review',
          activity_description: 'Monthly document review for subscription client',
          start_time: '2024-03-15T10:00:00Z',
          end_time: '2024-03-15T12:00:00Z',
          is_billable: false // Covered by subscription
        }

        const response = await apiClient.createTimeEntry(timeEntryData)

        expect(response.status).toBe(201)
        expect(response.body.data.entry_type).toBe('subscription_work')
        expect(response.body.data.is_billable).toBe(false)
        expect(response.body.data.billable_amount).toBe(0)
      })

      test('should create administrative time entry', async () => {
        const timeEntryData = {
          entry_type: 'administrative',
          task_category: 'training',
          activity_description: 'Legal software training',
          start_time: '2024-03-15T13:00:00Z',
          end_time: '2024-03-15T15:00:00Z',
          is_billable: false,
          location: 'office'
        }

        const response = await apiClient.createTimeEntry(timeEntryData)

        expect(response.status).toBe(201)
        expect(response.body.data.entry_type).toBe('administrative')
        expect(response.body.data.is_billable).toBe(false)
      })

      test('should validate required fields', async () => {
        const invalidData = {
          // Missing entry_type and activity_description
          start_time: '2024-03-15T09:00:00Z',
          end_time: '2024-03-15T10:00:00Z'
        }

        const response = await apiClient.createTimeEntry(invalidData)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('entry_type is required')
      })

      test('should validate time entry duration', async () => {
        const invalidData = {
          entry_type: 'case_work',
          matter_id: testData.matter.id,
          activity_description: 'Invalid time entry',
          start_time: '2024-03-15T10:00:00Z',
          end_time: '2024-03-15T09:00:00Z' // End before start
        }

        const response = await apiClient.createTimeEntry(invalidData)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('End time must be after start time')
      })

      test('should validate billable rate for billable entries', async () => {
        const invalidData = {
          entry_type: 'case_work',
          matter_id: testData.matter.id,
          activity_description: 'Billable work without rate',
          start_time: '2024-03-15T09:00:00Z',
          end_time: '2024-03-15T10:00:00Z',
          is_billable: true
          // Missing billable_rate
        }

        const response = await apiClient.createTimeEntry(invalidData)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('Billable rate is required for billable entries')
      })
    })

    describe('READ Time Entries', () => {
      let testTimeEntry: any

      beforeEach(async () => {
        const timeEntryData = createTestTimeEntry()
        const response = await apiClient.createTimeEntry(timeEntryData)
        testTimeEntry = response.body.data
      })

      test('should get all time entries', async () => {
        const response = await apiClient.getTimeEntries()

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('data')
        expect(Array.isArray(response.body.data)).toBe(true)
        expect(response.body.data.length).toBeGreaterThan(0)
      })

      test('should get time entries with filters', async () => {
        const filters = {
          entry_type: 'case_work',
          is_billable: true,
          matter_id: testData.matter.id
        }

        const response = await apiClient.getTimeEntries(filters)

        expect(response.status).toBe(200)
        expect(response.body.data.every((entry: any) => 
          entry.entry_type === 'case_work' && entry.is_billable === true
        )).toBe(true)
      })

      test('should get time entries with date range filter', async () => {
        const filters = {
          start_date: '2024-03-01',
          end_date: '2024-03-31'
        }

        const response = await apiClient.getTimeEntries(filters)

        expect(response.status).toBe(200)
        expect(Array.isArray(response.body.data)).toBe(true)
      })

      test('should get single time entry by ID', async () => {
        const response = await apiClient.getTimeEntry(testTimeEntry.id)

        expect(response.status).toBe(200)
        expect(response.body.data.id).toBe(testTimeEntry.id)
        validateTimeEntryStructure(response.body.data)
        expect(response.body.data).toHaveProperty('matter')
        expect(response.body.data).toHaveProperty('user')
      })

      test('should return 404 for non-existent time entry', async () => {
        const response = await apiClient.getTimeEntry('non-existent-id')

        expect(response.status).toBe(404)
        expect(response.body.error.message).toContain('Time entry not found')
      })

      test('should support pagination and sorting', async () => {
        const response = await apiClient.getTimeEntries({
          page: 1,
          limit: 5,
          sort_by: 'start_time',
          sort_order: 'desc'
        })

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('pagination')
        expect(response.body.data.length).toBeLessThanOrEqual(5)
      })
    })

    describe('UPDATE Time Entry', () => {
      let testTimeEntry: any

      beforeEach(async () => {
        const timeEntryData = createTestTimeEntry()
        const response = await apiClient.createTimeEntry(timeEntryData)
        testTimeEntry = response.body.data
      })

      test('should update time entry basic information', async () => {
        const updateData = {
          activity_description: 'Updated activity description',
          task_category: 'writing',
          billable_rate: 175.00
        }

        const response = await apiClient.updateTimeEntry(testTimeEntry.id, updateData)

        expect(response.status).toBe(200)
        expect(response.body.data.activity_description).toBe(updateData.activity_description)
        expect(response.body.data.task_category).toBe(updateData.task_category)
        expect(response.body.data.billable_rate).toBe(updateData.billable_rate)
      })

      test('should update time entry duration', async () => {
        const updateData = {
          end_time: '2024-03-15T12:00:00Z', // Extending duration
          break_minutes: 15
        }

        const response = await apiClient.updateTimeEntry(testTimeEntry.id, updateData)

        expect(response.status).toBe(200)
        expect(response.body.data.duration_minutes).toBeGreaterThan(testTimeEntry.duration_minutes)
        expect(response.body.data.break_minutes).toBe(15)
        expect(response.body.data.billable_amount).toBeGreaterThan(testTimeEntry.billable_amount)
      })

      test('should prevent updates to approved entries', async () => {
        // First approve the entry
        const approveResponse = await apiClient.updateTimeEntry(testTimeEntry.id, {
          entry_status: 'approved'
        })
        expect(approveResponse.status).toBe(200)

        const updateData = {
          activity_description: 'Should not be updated'
        }

        const response = await apiClient.updateTimeEntry(testTimeEntry.id, updateData)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('Cannot update approved time entry')
      })

      test('should validate update data', async () => {
        const invalidData = {
          billable_rate: -50 // Negative rate
        }

        const response = await apiClient.updateTimeEntry(testTimeEntry.id, invalidData)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('Billable rate must be positive')
      })
    })

    describe('DELETE Time Entry', () => {
      let testTimeEntry: any

      beforeEach(async () => {
        const timeEntryData = createTestTimeEntry()
        const response = await apiClient.createTimeEntry(timeEntryData)
        testTimeEntry = response.body.data
      })

      test('should delete pending time entry', async () => {
        const response = await apiClient.deleteTimeEntry(testTimeEntry.id)

        expect(response.status).toBe(204)

        // Verify time entry is deleted
        const getResponse = await apiClient.getTimeEntry(testTimeEntry.id)
        expect(getResponse.status).toBe(404)
      })

      test('should prevent deletion of approved entries', async () => {
        // First approve the entry
        await apiClient.updateTimeEntry(testTimeEntry.id, {
          entry_status: 'approved'
        })

        const response = await apiClient.deleteTimeEntry(testTimeEntry.id)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('Cannot delete approved time entry')
      })

      test('should prevent deletion of billed entries', async () => {
        // Mock the entry as billed
        await apiClient.updateTimeEntry(testTimeEntry.id, {
          billing_status: 'billed'
        })

        const response = await apiClient.deleteTimeEntry(testTimeEntry.id)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('Cannot delete billed time entry')
      })
    })
  })

  describe('Timer Functionality', () => {
    describe('Timer Lifecycle', () => {
      test('should start timer successfully', async () => {
        const timerData = {
          entry_type: 'case_work',
          matter_id: testData.matter.id,
          task_category: 'research',
          activity_description: 'Legal research session'
        }

        const response = await apiClient.startTimer(timerData)

        expect(response.status).toBe(201)
        expect(response.body.data).toHaveProperty('session_id')
        expect(response.body.data.is_active).toBe(true)
        expect(response.body.data.is_paused).toBe(false)
      })

      test('should stop existing timer when starting new one', async () => {
        // Start first timer
        const timer1Data = {
          entry_type: 'case_work',
          matter_id: testData.matter.id,
          activity_description: 'First session'
        }
        const timer1Response = await apiClient.startTimer(timer1Data)
        const sessionId1 = timer1Response.body.data.session_id

        // Start second timer (should stop first)
        const timer2Data = {
          entry_type: 'administrative',
          activity_description: 'Second session'
        }
        const timer2Response = await apiClient.startTimer(timer2Data)

        expect(timer2Response.status).toBe(201)

        // Verify first timer was stopped
        const getSessionResponse = await apiClient.getCurrentSession()
        expect(getSessionResponse.body.data.session_id).toBe(timer2Response.body.data.session_id)
        expect(getSessionResponse.body.data.session_id).not.toBe(sessionId1)
      })

      test('should pause timer successfully', async () => {
        // Start timer
        const timerData = {
          entry_type: 'case_work',
          matter_id: testData.matter.id,
          activity_description: 'Timer pause test'
        }
        const startResponse = await apiClient.startTimer(timerData)
        const sessionId = startResponse.body.data.session_id

        // Pause timer
        const response = await apiClient.pauseTimer(sessionId)

        expect(response.status).toBe(200)
        expect(response.body.data.is_paused).toBe(true)
        expect(response.body.data.paused_at).toBeTruthy()
      })

      test('should resume timer successfully', async () => {
        // Start timer
        const timerData = {
          entry_type: 'case_work',
          matter_id: testData.matter.id,
          activity_description: 'Timer resume test'
        }
        const startResponse = await apiClient.startTimer(timerData)
        const sessionId = startResponse.body.data.session_id

        // Pause timer
        await apiClient.pauseTimer(sessionId)

        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 100))

        // Resume timer
        const response = await apiClient.resumeTimer(sessionId)

        expect(response.status).toBe(200)
        expect(response.body.data.is_paused).toBe(false)
        expect(response.body.data.pause_duration_minutes).toBeGreaterThan(0)
      })

      test('should stop timer and save entry', async () => {
        // Start timer
        const timerData = {
          entry_type: 'case_work',
          matter_id: testData.matter.id,
          activity_description: 'Timer stop test',
          task_category: 'research'
        }
        const startResponse = await apiClient.startTimer(timerData)
        const sessionId = startResponse.body.data.session_id

        // Wait a moment for duration
        await new Promise(resolve => setTimeout(resolve, 100))

        // Stop timer
        const response = await apiClient.stopTimer(sessionId, true)

        expect(response.status).toBe(200)
        expect(response.body.data).toHaveProperty('time_entry')
        expect(response.body.data.time_entry.activity_description).toBe(timerData.activity_description)
        expect(response.body.data.time_entry.duration_minutes).toBeGreaterThan(0)
      })

      test('should stop timer without saving entry', async () => {
        // Start timer
        const timerData = {
          entry_type: 'administrative',
          activity_description: 'Timer discard test'
        }
        const startResponse = await apiClient.startTimer(timerData)
        const sessionId = startResponse.body.data.session_id

        // Stop timer without saving
        const response = await apiClient.stopTimer(sessionId, false)

        expect(response.status).toBe(200)
        expect(response.body.data.time_entry).toBeNull()
      })

      test('should get current active session', async () => {
        // Start timer
        const timerData = {
          entry_type: 'case_work',
          matter_id: testData.matter.id,
          activity_description: 'Current session test'
        }
        const startResponse = await apiClient.startTimer(timerData)
        const sessionId = startResponse.body.data.session_id

        // Get current session
        const response = await apiClient.getCurrentSession()

        expect(response.status).toBe(200)
        expect(response.body.data.session_id).toBe(sessionId)
        expect(response.body.data.is_active).toBe(true)
        expect(response.body.data.activity_description).toBe(timerData.activity_description)
      })

      test('should return null when no active session', async () => {
        const response = await apiClient.getCurrentSession()

        expect(response.status).toBe(200)
        expect(response.body.data).toBeNull()
      })
    })

    describe('Timer Validation and Error Handling', () => {
      test('should validate timer start data', async () => {
        const invalidData = {
          // Missing entry_type
          activity_description: 'Invalid timer'
        }

        const response = await apiClient.startTimer(invalidData)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('entry_type is required')
      })

      test('should handle pause on non-existent session', async () => {
        const response = await apiClient.pauseTimer('non-existent-session-id')

        expect(response.status).toBe(404)
        expect(response.body.error.message).toContain('Timer session not found')
      })

      test('should handle resume on non-paused session', async () => {
        // Start timer
        const timerData = {
          entry_type: 'case_work',
          matter_id: testData.matter.id,
          activity_description: 'Resume test'
        }
        const startResponse = await apiClient.startTimer(timerData)
        const sessionId = startResponse.body.data.session_id

        // Try to resume without pausing
        const response = await apiClient.resumeTimer(sessionId)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('Timer is not paused')
      })

      test('should handle minimum time requirements', async () => {
        // Start timer
        const timerData = {
          entry_type: 'case_work',
          matter_id: testData.matter.id,
          activity_description: 'Minimum time test'
        }
        const startResponse = await apiClient.startTimer(timerData)
        const sessionId = startResponse.body.data.session_id

        // Stop immediately (less than minimum time)
        const response = await apiClient.stopTimer(sessionId, true)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('Minimum timer duration not met')
      })
    })
  })

  describe('Time Tracking Dashboard and Analytics', () => {
    beforeEach(async () => {
      // Create some test time entries for dashboard testing
      const timeEntries = [
        {
          entry_type: 'case_work',
          matter_id: testData.matter.id,
          activity_description: 'Research task 1',
          start_time: '2024-03-15T09:00:00Z',
          end_time: '2024-03-15T11:00:00Z',
          is_billable: true,
          billable_rate: 150.00
        },
        {
          entry_type: 'case_work',
          matter_id: testData.matter.id,
          activity_description: 'Writing task 1',
          start_time: '2024-03-15T14:00:00Z',
          end_time: '2024-03-15T16:00:00Z',
          is_billable: true,
          billable_rate: 150.00
        },
        {
          entry_type: 'administrative',
          activity_description: 'Team meeting',
          start_time: '2024-03-15T10:00:00Z',
          end_time: '2024-03-15T11:00:00Z',
          is_billable: false
        }
      ]

      for (const entry of timeEntries) {
        await apiClient.createTimeEntry(entry)
      }
    })

    test('should get time tracking dashboard data', async () => {
      const params = {
        start_date: '2024-03-01',
        end_date: '2024-03-31'
      }

      const response = await apiClient.getTimeTrackingDashboard(params)

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveProperty('current_period')
      expect(response.body.data.current_period).toHaveProperty('total_hours')
      expect(response.body.data.current_period).toHaveProperty('billable_hours')
      expect(response.body.data.current_period).toHaveProperty('utilization_rate')
      expect(response.body.data.current_period).toHaveProperty('total_revenue')
      expect(response.body.data).toHaveProperty('recent_entries')
      expect(response.body.data).toHaveProperty('daily_breakdown')
    })

    test('should calculate utilization rate correctly', async () => {
      const params = {
        start_date: '2024-03-15',
        end_date: '2024-03-15'
      }

      const response = await apiClient.getTimeTrackingDashboard(params)

      expect(response.status).toBe(200)
      
      const currentPeriod = response.body.data.current_period
      expect(currentPeriod.total_hours).toBe(5) // 4 billable + 1 non-billable
      expect(currentPeriod.billable_hours).toBe(4)
      expect(currentPeriod.utilization_rate).toBe(80) // 4/5 * 100
      expect(currentPeriod.total_revenue).toBe(600) // 4 hours * 150
    })

    test('should get time tracking metrics', async () => {
      const params = {
        start_date: '2024-03-01',
        end_date: '2024-03-31',
        group_by: 'matter'
      }

      const response = await apiClient.getTimeEntries(params)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('metrics')
      expect(response.body.metrics).toHaveProperty('total_entries')
      expect(response.body.metrics).toHaveProperty('total_hours')
      expect(response.body.metrics).toHaveProperty('billable_hours')
      expect(response.body.metrics).toHaveProperty('average_hourly_rate')
    })

    test('should get time breakdown by matter', async () => {
      const params = {
        start_date: '2024-03-15',
        end_date: '2024-03-15',
        group_by: 'matter'
      }

      const response = await apiClient.getTimeEntries(params)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('breakdown')
      expect(response.body.breakdown).toHaveProperty('by_matter')
      expect(Object.keys(response.body.breakdown.by_matter)).toContain(testData.matter.id)
    })

    test('should get time breakdown by user', async () => {
      const params = {
        start_date: '2024-03-15',
        end_date: '2024-03-15',
        group_by: 'user'
      }

      const response = await apiClient.getTimeEntries(params)

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('breakdown')
      expect(response.body.breakdown).toHaveProperty('by_user')
    })
  })

  describe('Time Entry Templates', () => {
    test('should create time entry template', async () => {
      const templateData = {
        template_name: 'Legal Research Template',
        default_entry_type: 'case_work',
        default_task_category: 'research',
        default_activity_description: 'Legal research and case law analysis',
        default_duration_minutes: 120,
        default_is_billable: true,
        default_billable_rate: 150.00,
        is_shared: true
      }

      const response = await apiClient.createTimeEntry(templateData) // Assuming same endpoint with template flag

      expect(response.status).toBe(201)
      expect(response.body.data.template_name).toBe(templateData.template_name)
      expect(response.body.data.is_shared).toBe(true)
    })

    test('should use template to create time entry', async () => {
      // First create a template
      const templateData = {
        template_name: 'Quick Consultation',
        default_entry_type: 'case_work',
        default_task_category: 'consultation',
        default_activity_description: 'Client consultation',
        default_duration_minutes: 60,
        default_is_billable: true,
        default_billable_rate: 200.00
      }

      const templateResponse = await apiClient.createTimeEntry(templateData)
      const templateId = templateResponse.body.data.id

      // Use template to create entry
      const entryData = {
        template_id: templateId,
        matter_id: testData.matter.id,
        start_time: '2024-03-15T15:00:00Z'
      }

      const response = await apiClient.createTimeEntry(entryData)

      expect(response.status).toBe(201)
      expect(response.body.data.activity_description).toBe(templateData.default_activity_description)
      expect(response.body.data.task_category).toBe(templateData.default_task_category)
      expect(response.body.data.billable_rate).toBe(templateData.default_billable_rate)
    })
  })

  describe('Billing Integration', () => {
    test('should get billable time entries for invoice generation', async () => {
      const params = {
        is_billable: true,
        billing_status: 'unbilled',
        matter_id: testData.matter.id,
        start_date: '2024-03-01',
        end_date: '2024-03-31'
      }

      const response = await apiClient.getTimeEntries(params)

      expect(response.status).toBe(200)
      expect(response.body.data.every((entry: any) => 
        entry.is_billable === true && entry.billing_status === 'unbilled'
      )).toBe(true)
    })

    test('should mark time entries as billed', async () => {
      // Create a billable time entry
      const timeEntryData = {
        entry_type: 'case_work',
        matter_id: testData.matter.id,
        activity_description: 'Billable work',
        start_time: '2024-03-15T09:00:00Z',
        end_time: '2024-03-15T10:00:00Z',
        is_billable: true,
        billable_rate: 150.00
      }

      const createResponse = await apiClient.createTimeEntry(timeEntryData)
      const timeEntryId = createResponse.body.data.id

      // Mark as billed
      const updateData = {
        billing_status: 'billed',
        invoice_id: 'test-invoice-id'
      }

      const response = await apiClient.updateTimeEntry(timeEntryId, updateData)

      expect(response.status).toBe(200)
      expect(response.body.data.billing_status).toBe('billed')
      expect(response.body.data.invoice_id).toBe('test-invoice-id')
    })

    test('should calculate billing amounts correctly', async () => {
      const timeEntryData = {
        entry_type: 'case_work',
        matter_id: testData.matter.id,
        activity_description: 'Billing calculation test',
        start_time: '2024-03-15T09:00:00Z',
        end_time: '2024-03-15T11:30:00Z', // 2.5 hours
        break_minutes: 15,
        is_billable: true,
        billable_rate: 200.00
      }

      const response = await apiClient.createTimeEntry(timeEntryData)

      expect(response.status).toBe(201)
      expect(response.body.data.duration_minutes).toBe(150) // 2.5 hours
      expect(response.body.data.effective_minutes).toBe(135) // 2.25 hours after break
      expect(response.body.data.billable_amount).toBe(450.00) // 2.25 * 200
    })
  })

  describe('Error Handling and Validation', () => {
    test('should handle concurrent timer operations', async () => {
      const timerData = {
        entry_type: 'case_work',
        matter_id: testData.matter.id,
        activity_description: 'Concurrent test'
      }

      // Start multiple timers concurrently
      const promises = Array.from({ length: 5 }, () => 
        apiClient.startTimer(timerData)
      )

      const responses = await Promise.allSettled(promises)
      const successfulResponses = responses.filter(
        (result) => result.status === 'fulfilled' && 
        result.value.status === 201
      )

      // Only one should succeed, others should fail or stop existing timer
      expect(successfulResponses.length).toBe(1)
    })

    test('should validate time entry overlaps', async () => {
      // Create first time entry
      const firstEntryData = {
        entry_type: 'case_work',
        matter_id: testData.matter.id,
        activity_description: 'First entry',
        start_time: '2024-03-15T09:00:00Z',
        end_time: '2024-03-15T11:00:00Z'
      }

      await apiClient.createTimeEntry(firstEntryData)

      // Try to create overlapping entry
      const overlappingEntryData = {
        entry_type: 'case_work',
        matter_id: testData.matter.id,
        activity_description: 'Overlapping entry',
        start_time: '2024-03-15T10:00:00Z',
        end_time: '2024-03-15T12:00:00Z'
      }

      const response = await apiClient.createTimeEntry(overlappingEntryData)

      expect(response.status).toBe(400)
      expect(response.body.error.message).toContain('Time entry overlaps with existing entry')
    })

    test('should handle maximum daily hours validation', async () => {
      const timeEntryData = {
        entry_type: 'case_work',
        matter_id: testData.matter.id,
        activity_description: 'Long work day',
        start_time: '2024-03-15T08:00:00Z',
        end_time: '2024-03-16T02:00:00Z', // 18 hours
        is_billable: true,
        billable_rate: 150.00
      }

      const response = await apiClient.createTimeEntry(timeEntryData)

      expect(response.status).toBe(400)
      expect(response.body.error.message).toContain('Exceeds maximum daily hours limit')
    })

    test('should handle timer heartbeat timeout', async () => {
      // Start timer
      const timerData = {
        entry_type: 'case_work',
        matter_id: testData.matter.id,
        activity_description: 'Heartbeat test'
      }
      const startResponse = await apiClient.startTimer(timerData)
      const sessionId = startResponse.body.data.session_id

      // Mock heartbeat timeout scenario
      // In real implementation, this would be handled by background job
      const response = await apiClient.getCurrentSession()

      expect(response.status).toBe(200)
      // Should still return active session until timeout period expires
      expect(response.body.data.session_id).toBe(sessionId)
    })
  })

  describe('Reporting and Export', () => {
    test('should export time entries to various formats', async () => {
      const params = {
        start_date: '2024-03-01',
        end_date: '2024-03-31',
        format: 'csv'
      }

      const response = await apiClient.exportReport('time-entries', 'csv', params)

      expect(response.status).toBe(200)
      expect(response.headers['content-type']).toContain('text/csv')
    })

    test('should generate time tracking reports', async () => {
      const params = {
        report_type: 'utilization',
        start_date: '2024-03-01',
        end_date: '2024-03-31',
        group_by: 'user'
      }

      const response = await apiClient.getReports('time-tracking', params)

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveProperty('report_data')
      expect(response.body.data).toHaveProperty('summary')
      expect(response.body.data).toHaveProperty('charts')
    })
  })
})