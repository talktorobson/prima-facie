// =====================================================
// DataJud Automated Synchronization Service
// Daily sync and background enrichment system
// =====================================================

import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { getDataJudApi } from './api'
import { createEnrichmentService, EnrichmentResult } from './enrichment-service'

type SupabaseClient = ReturnType<typeof createClient<Database>>

export interface SyncOptions {
  type: 'full' | 'incremental' | 'manual' | 'case_specific'
  law_firm_id?: string
  matter_id?: string
  batch_size?: number
  max_concurrent?: number
  retry_failed?: boolean
  include_timeline?: boolean
  include_participants?: boolean
  include_legal_subjects?: boolean
}

export interface SyncResult {
  sync_id: string
  started_at: string
  completed_at?: string
  duration_seconds?: number
  total_cases_processed: number
  successful_cases: number
  failed_cases: number
  api_calls_made: number
  rate_limit_hits: number
  errors: string[]
  summary: {
    cases_enriched: number
    timeline_events_added: number
    participants_added: number
    legal_subjects_added: number
    conflicts_detected: number
  }
}

export interface SyncProgress {
  current_case: number
  total_cases: number
  current_case_title: string
  status: 'processing' | 'rate_limited' | 'error' | 'completed'
  estimated_completion?: string
}

class DataJudSyncService {
  private supabase: SupabaseClient
  private dataJudApi: ReturnType<typeof getDataJudApi>
  private enrichmentService: ReturnType<typeof createEnrichmentService>
  private isRunning: boolean = false
  private currentSyncId: string | null = null
  private progressCallback?: (progress: SyncProgress) => void

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient
    this.dataJudApi = getDataJudApi()
    this.enrichmentService = createEnrichmentService(supabaseClient)
  }

  /**
   * Start automated synchronization
   */
  async startSync(options: SyncOptions): Promise<SyncResult> {
    if (this.isRunning) {
      throw new Error('Sync is already running')
    }

    this.isRunning = true
    const startTime = new Date()

    // Initialize sync log
    const syncLog = await this.initializeSyncLog(options, startTime)
    this.currentSyncId = syncLog.id

    const result: SyncResult = {
      sync_id: syncLog.id,
      started_at: startTime.toISOString(),
      total_cases_processed: 0,
      successful_cases: 0,
      failed_cases: 0,
      api_calls_made: 0,
      rate_limit_hits: 0,
      errors: [],
      summary: {
        cases_enriched: 0,
        timeline_events_added: 0,
        participants_added: 0,
        legal_subjects_added: 0,
        conflicts_detected: 0
      }
    }

    try {
      // Get cases to sync
      const casesToSync = await this.getCasesToSync(options)
      result.total_cases_processed = casesToSync.length

      if (casesToSync.length === 0) {
        result.errors.push('No cases found to synchronize')
        await this.completeSyncLog(syncLog.id, result, 'completed')
        return result
      }

      // Process cases in batches
      const batchSize = options.batch_size || 10
      const maxConcurrent = options.max_concurrent || 3

      for (let i = 0; i < casesToSync.length; i += batchSize) {
        const batch = casesToSync.slice(i, i + batchSize)
        
        // Process batch with concurrency control
        const batchResults = await this.processBatch(batch, options, maxConcurrent, i + 1, casesToSync.length)
        
        // Aggregate results
        batchResults.forEach(batchResult => {
          if (batchResult.success) {
            result.successful_cases++
            result.summary.cases_enriched++
            result.summary.timeline_events_added += batchResult.timeline_events_added
            result.summary.participants_added += batchResult.participants_added
            result.summary.legal_subjects_added += batchResult.legal_subjects_added
            result.summary.conflicts_detected += batchResult.conflicts.length
          } else {
            result.failed_cases++
            result.errors.push(...batchResult.errors)
          }
        })

        result.api_calls_made += batchResults.length * 2 // Estimate API calls per case

        // Check rate limiting
        const rateLimitStatus = this.dataJudApi.getRateLimitStatus()
        if (rateLimitStatus.current_requests >= rateLimitStatus.requests_per_minute * 0.9) {
          result.rate_limit_hits++
          await this.waitForRateLimit()
        }
      }

      // Complete sync
      const endTime = new Date()
      result.completed_at = endTime.toISOString()
      result.duration_seconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)

      await this.completeSyncLog(syncLog.id, result, result.failed_cases === 0 ? 'completed' : 'partial')

    } catch (error) {
      console.error('Sync failed:', error)
      result.errors.push(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      await this.completeSyncLog(syncLog.id, result, 'failed')
    } finally {
      this.isRunning = false
      this.currentSyncId = null
    }

    return result
  }

  /**
   * Process a batch of cases with concurrency control
   */
  private async processBatch(
    cases: any[],
    options: SyncOptions,
    maxConcurrent: number,
    currentBatch: number,
    totalCases: number
  ): Promise<EnrichmentResult[]> {
    const results: EnrichmentResult[] = []
    const semaphore = Array(maxConcurrent).fill(null)

    // Process cases with concurrency limit
    const processConcurrently = async (caseData: any, index: number): Promise<void> => {
      // Update progress
      this.progressCallback?.({
        current_case: currentBatch + index,
        total_cases: totalCases,
        current_case_title: caseData.title,
        status: 'processing'
      })

      try {
        const enrichmentOptions = {
          include_timeline: options.include_timeline !== false,
          include_participants: options.include_participants !== false,
          include_legal_subjects: options.include_legal_subjects !== false,
          force_update: options.type === 'full'
        }

        const result = await this.enrichmentService.enrichCase(
          caseData.id,
          caseData.law_firm_id,
          enrichmentOptions
        )

        results[index] = result
      } catch (error) {
        results[index] = {
          success: false,
          case_id: caseData.id,
          enriched_fields: [],
          conflicts: [],
          confidence_score: 0,
          timeline_events_added: 0,
          participants_added: 0,
          legal_subjects_added: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error']
        }
      }
    }

    // Execute with concurrency control
    await Promise.all(
      cases.map(async (caseData, index) => {
        // Wait for available slot
        while (semaphore.filter(slot => slot !== null).length >= maxConcurrent) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }

        // Find available slot
        const slotIndex = semaphore.findIndex(slot => slot === null)
        semaphore[slotIndex] = processConcurrently(caseData, index)

        // Wait for slot completion
        await semaphore[slotIndex]
        semaphore[slotIndex] = null
      })
    )

    return results
  }

  /**
   * Get cases that need synchronization
   */
  private async getCasesToSync(options: SyncOptions): Promise<any[]> {
    let query = this.supabase
      .from('matters')
      .select(`
        id,
        law_firm_id,
        title,
        process_number,
        datajud_case_details (
          id,
          enrichment_status,
          last_enrichment_at
        )
      `)

    // Filter by law firm if specified
    if (options.law_firm_id) {
      query = query.eq('law_firm_id', options.law_firm_id)
    }

    // Filter by specific case if specified
    if (options.matter_id) {
      query = query.eq('id', options.matter_id)
    }

    // Only cases with process numbers
    query = query.not('process_number', 'is', null)

    const { data: cases, error } = await query

    if (error) {
      throw new Error(`Failed to get cases: ${error.message}`)
    }

    // Filter based on sync type
    return (cases || []).filter(caseData => {
      if (options.type === 'full') {
        return true // Sync all cases
      }

      if (options.type === 'case_specific' && options.matter_id) {
        return caseData.id === options.matter_id
      }

      if (options.type === 'incremental') {
        // Sync cases that haven't been enriched or were enriched more than 7 days ago
        const enrichmentData = caseData.datajud_case_details?.[0]
        if (!enrichmentData) return true

        if (enrichmentData.enrichment_status === 'failed' && options.retry_failed) {
          return true
        }

        const lastEnrichment = new Date(enrichmentData.last_enrichment_at)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        return lastEnrichment < sevenDaysAgo
      }

      return false
    })
  }

  /**
   * Initialize sync log entry
   */
  private async initializeSyncLog(options: SyncOptions, startTime: Date) {
    const { data: syncLog, error } = await this.supabase
      .from('datajud_sync_log')
      .insert({
        law_firm_id: options.law_firm_id!,
        sync_type: options.type,
        sync_status: 'started',
        matter_id: options.matter_id || null,
        started_at: startTime.toISOString(),
        summary: {
          options: options,
          started_at: startTime.toISOString()
        }
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to initialize sync log: ${error.message}`)
    }

    return syncLog
  }

  /**
   * Complete sync log entry
   */
  private async completeSyncLog(syncId: string, result: SyncResult, status: string) {
    const { error } = await this.supabase
      .from('datajud_sync_log')
      .update({
        sync_status: status,
        completed_at: new Date().toISOString(),
        duration_seconds: result.duration_seconds,
        total_cases_processed: result.total_cases_processed,
        successful_cases: result.successful_cases,
        failed_cases: result.failed_cases,
        api_calls_made: result.api_calls_made,
        rate_limit_hits: result.rate_limit_hits,
        summary: result.summary,
        errors: result.errors.length > 0 ? result.errors : null
      })
      .eq('id', syncId)

    if (error) {
      console.error('Failed to update sync log:', error)
    }
  }

  /**
   * Wait for rate limit window to reset
   */
  private async waitForRateLimit(): Promise<void> {
    this.progressCallback?.({
      current_case: 0,
      total_cases: 0,
      current_case_title: '',
      status: 'rate_limited'
    })

    // Wait 60 seconds for rate limit to reset
    await new Promise(resolve => setTimeout(resolve, 60000))
    
    // Reset rate limit counter
    this.dataJudApi.resetRateLimit()
  }

  /**
   * Set progress callback for real-time updates
   */
  setProgressCallback(callback: (progress: SyncProgress) => void) {
    this.progressCallback = callback
  }

  /**
   * Check if sync is currently running
   */
  isRunning(): boolean {
    return this.isRunning
  }

  /**
   * Get current sync ID
   */
  getCurrentSyncId(): string | null {
    return this.currentSyncId
  }

  /**
   * Cancel running sync
   */
  async cancelSync(): Promise<void> {
    if (!this.isRunning || !this.currentSyncId) {
      throw new Error('No sync is currently running')
    }

    this.isRunning = false

    // Update sync log
    await this.supabase
      .from('datajud_sync_log')
      .update({
        sync_status: 'failed',
        completed_at: new Date().toISOString(),
        errors: ['Sync cancelled by user']
      })
      .eq('id', this.currentSyncId)

    this.currentSyncId = null
  }

  /**
   * Get sync history for a law firm
   */
  async getSyncHistory(lawFirmId: string, limit: number = 10) {
    const { data: syncHistory, error } = await this.supabase
      .from('datajud_sync_log')
      .select('*')
      .eq('law_firm_id', lawFirmId)
      .order('started_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to get sync history: ${error.message}`)
    }

    return syncHistory || []
  }

  /**
   * Schedule daily sync (this would be called by a cron job or scheduler)
   */
  async scheduleDailySync(lawFirmId: string): Promise<void> {
    try {
      // Check if there's already a sync running
      if (this.isRunning) {
        console.log(`Skipping daily sync for law firm ${lawFirmId} - sync already running`)
        return
      }

      // Check last sync time to avoid duplicate runs
      const { data: lastSync } = await this.supabase
        .from('datajud_sync_log')
        .select('started_at')
        .eq('law_firm_id', lawFirmId)
        .eq('sync_type', 'incremental')
        .order('started_at', { ascending: false })
        .limit(1)
        .single()

      if (lastSync) {
        const lastSyncTime = new Date(lastSync.started_at)
        const twentyHoursAgo = new Date(Date.now() - 20 * 60 * 60 * 1000)
        
        if (lastSyncTime > twentyHoursAgo) {
          console.log(`Skipping daily sync for law firm ${lawFirmId} - already synced within 20 hours`)
          return
        }
      }

      // Start incremental sync
      const syncOptions: SyncOptions = {
        type: 'incremental',
        law_firm_id: lawFirmId,
        batch_size: 5, // Smaller batches for daily sync
        max_concurrent: 2,
        retry_failed: true,
        include_timeline: true,
        include_participants: true,
        include_legal_subjects: true
      }

      console.log(`Starting daily sync for law firm ${lawFirmId}`)
      const result = await this.startSync(syncOptions)
      
      console.log(`Daily sync completed for law firm ${lawFirmId}:`, {
        total_processed: result.total_cases_processed,
        successful: result.successful_cases,
        failed: result.failed_cases,
        duration: result.duration_seconds
      })

    } catch (error) {
      console.error(`Daily sync failed for law firm ${lawFirmId}:`, error)
    }
  }
}

// Export service instance creator
export const createSyncService = (supabaseClient: SupabaseClient) => {
  return new DataJudSyncService(supabaseClient)
}

// Utility function for scheduling daily syncs across all law firms
export const runDailySyncForAllFirms = async (supabaseClient: SupabaseClient): Promise<void> => {
  const syncService = createSyncService(supabaseClient)
  
  try {
    // Get all active law firms
    const { data: lawFirms, error } = await supabaseClient
      .from('law_firms')
      .select('id')
      .eq('subscription_active', true)

    if (error) {
      throw new Error(`Failed to get law firms: ${error.message}`)
    }

    // Schedule sync for each law firm (run sequentially to avoid overwhelming the API)
    for (const firm of lawFirms || []) {
      await syncService.scheduleDailySync(firm.id)
      
      // Wait 5 minutes between law firm syncs to spread the load
      await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000))
    }

  } catch (error) {
    console.error('Failed to run daily sync for all firms:', error)
  }
}

export default DataJudSyncService