// =====================================================
// DataJud Integration Monitoring & Error Handling
// Comprehensive monitoring and alerting system
// =====================================================

import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

type SupabaseClient = ReturnType<typeof createClient<Database>>

export interface ErrorAlert {
  id: string
  law_firm_id: string
  error_type: 'api_failure' | 'rate_limit' | 'data_quality' | 'sync_failure' | 'authentication'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  context: Record<string, any>
  occurred_at: string
  resolved_at?: string
  resolution_notes?: string
}

export interface HealthCheck {
  service: 'datajud_api' | 'enrichment_service' | 'sync_service'
  status: 'healthy' | 'degraded' | 'down'
  response_time_ms?: number
  last_check: string
  error_message?: string
  success_rate_24h: number
  details: Record<string, any>
}

export interface MonitoringMetrics {
  api_calls_today: number
  api_calls_this_hour: number
  success_rate_24h: number
  average_response_time: number
  rate_limit_hits_today: number
  failed_enrichments_today: number
  active_syncs: number
  last_successful_sync: string | null
}

class DataJudMonitoringService {
  private supabase: SupabaseClient
  private alertThresholds = {
    api_failure_rate: 0.1, // Alert if > 10% API calls fail
    rate_limit_hits_per_hour: 5, // Alert if > 5 rate limit hits per hour
    sync_failure_rate: 0.2, // Alert if > 20% syncs fail
    response_time_ms: 5000, // Alert if response time > 5 seconds
    enrichment_failure_rate: 0.15 // Alert if > 15% enrichments fail
  }

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient
  }

  /**
   * Log an error and create alert if necessary
   */
  async logError(
    lawFirmId: string,
    errorType: ErrorAlert['error_type'],
    title: string,
    description: string,
    context: Record<string, any> = {},
    severity: ErrorAlert['severity'] = 'medium'
  ): Promise<void> {
    try {
      // Create error alert
      const { error } = await this.supabase
        .from('datajud_error_alerts')
        .insert({
          law_firm_id: lawFirmId,
          error_type: errorType,
          severity,
          title,
          description,
          context,
          occurred_at: new Date().toISOString()
        })

      if (error) {
        console.error('Failed to log DataJud error:', error)
      }

      // Console log for immediate visibility
      console.error(`DataJud ${severity.toUpperCase()} Error [${errorType}]:`, {
        law_firm_id: lawFirmId,
        title,
        description,
        context
      })

      // Send notifications for high/critical errors
      if (severity === 'high' || severity === 'critical') {
        await this.sendErrorNotification(lawFirmId, errorType, title, description, severity)
      }

    } catch (error) {
      console.error('Failed to log DataJud error:', error)
    }
  }

  /**
   * Perform health check on DataJud services
   */
  async performHealthCheck(): Promise<HealthCheck[]> {
    const healthChecks: HealthCheck[] = []

    try {
      // Check DataJud API health
      const apiHealth = await this.checkDataJudApiHealth()
      healthChecks.push(apiHealth)

      // Check enrichment service health
      const enrichmentHealth = await this.checkEnrichmentServiceHealth()
      healthChecks.push(enrichmentHealth)

      // Check sync service health
      const syncHealth = await this.checkSyncServiceHealth()
      healthChecks.push(syncHealth)

      // Store health check results
      await this.storeHealthCheckResults(healthChecks)

    } catch (error) {
      console.error('Health check failed:', error)
    }

    return healthChecks
  }

  /**
   * Check DataJud API health
   */
  private async checkDataJudApiHealth(): Promise<HealthCheck> {
    const startTime = Date.now()
    let status: HealthCheck['status'] = 'healthy'
    let errorMessage: string | undefined
    let responseTime: number | undefined

    try {
      // This would call the actual DataJud API test endpoint
      const response = await fetch('/api/datajud/health-check', {
        method: 'GET',
        timeout: 10000
      })

      responseTime = Date.now() - startTime

      if (!response.ok) {
        status = 'degraded'
        errorMessage = `API returned ${response.status}: ${response.statusText}`
      } else if (responseTime > this.alertThresholds.response_time_ms) {
        status = 'degraded'
        errorMessage = `Slow response time: ${responseTime}ms`
      }

    } catch (error) {
      status = 'down'
      errorMessage = error instanceof Error ? error.message : 'Unknown error'
      responseTime = Date.now() - startTime
    }

    // Calculate 24h success rate
    const successRate24h = await this.calculateApiSuccessRate()

    return {
      service: 'datajud_api',
      status,
      response_time_ms: responseTime,
      last_check: new Date().toISOString(),
      error_message: errorMessage,
      success_rate_24h: successRate24h,
      details: {
        endpoint_tested: '/api/datajud/health-check',
        threshold_response_time: this.alertThresholds.response_time_ms
      }
    }
  }

  /**
   * Check enrichment service health
   */
  private async checkEnrichmentServiceHealth(): Promise<HealthCheck> {
    let status: HealthCheck['status'] = 'healthy'
    let errorMessage: string | undefined

    try {
      // Check recent enrichment success rate
      const { data: recentEnrichments, error } = await this.supabase
        .from('datajud_case_details')
        .select('enrichment_status, last_enrichment_at')
        .gte('last_enrichment_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(100)

      if (error) {
        status = 'degraded'
        errorMessage = `Database query failed: ${error.message}`
      } else if (recentEnrichments) {
        const totalEnrichments = recentEnrichments.length
        const failedEnrichments = recentEnrichments.filter(e => e.enrichment_status === 'failed').length
        const failureRate = totalEnrichments > 0 ? failedEnrichments / totalEnrichments : 0

        if (failureRate > this.alertThresholds.enrichment_failure_rate) {
          status = 'degraded'
          errorMessage = `High failure rate: ${(failureRate * 100).toFixed(1)}%`
        }
      }

    } catch (error) {
      status = 'down'
      errorMessage = error instanceof Error ? error.message : 'Unknown error'
    }

    return {
      service: 'enrichment_service',
      status,
      last_check: new Date().toISOString(),
      error_message: errorMessage,
      success_rate_24h: await this.calculateEnrichmentSuccessRate(),
      details: {
        failure_rate_threshold: this.alertThresholds.enrichment_failure_rate
      }
    }
  }

  /**
   * Check sync service health
   */
  private async checkSyncServiceHealth(): Promise<HealthCheck> {
    let status: HealthCheck['status'] = 'healthy'
    let errorMessage: string | undefined

    try {
      // Check recent sync status
      const { data: recentSyncs, error } = await this.supabase
        .from('datajud_sync_log')
        .select('sync_status, started_at, completed_at')
        .gte('started_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('started_at', { ascending: false })
        .limit(50)

      if (error) {
        status = 'degraded'
        errorMessage = `Database query failed: ${error.message}`
      } else if (recentSyncs) {
        const totalSyncs = recentSyncs.length
        const failedSyncs = recentSyncs.filter(s => s.sync_status === 'failed').length
        const failureRate = totalSyncs > 0 ? failedSyncs / totalSyncs : 0

        if (failureRate > this.alertThresholds.sync_failure_rate) {
          status = 'degraded'
          errorMessage = `High sync failure rate: ${(failureRate * 100).toFixed(1)}%`
        }

        // Check for stuck syncs (running > 2 hours)
        const stuckSyncs = recentSyncs.filter(s => 
          s.sync_status === 'started' && 
          Date.now() - new Date(s.started_at).getTime() > 2 * 60 * 60 * 1000
        )

        if (stuckSyncs.length > 0) {
          status = 'degraded'
          errorMessage = `${stuckSyncs.length} stuck sync(s) detected`
        }
      }

    } catch (error) {
      status = 'down'
      errorMessage = error instanceof Error ? error.message : 'Unknown error'
    }

    return {
      service: 'sync_service',
      status,
      last_check: new Date().toISOString(),
      error_message: errorMessage,
      success_rate_24h: await this.calculateSyncSuccessRate(),
      details: {
        failure_rate_threshold: this.alertThresholds.sync_failure_rate,
        stuck_sync_threshold_hours: 2
      }
    }
  }

  /**
   * Get comprehensive monitoring metrics
   */
  async getMetrics(lawFirmId?: string): Promise<MonitoringMetrics> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const thisHour = new Date()
    thisHour.setMinutes(0, 0, 0)

    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)

    try {
      // Build base query
      let syncQuery = this.supabase.from('datajud_sync_log').select('*')
      let enrichmentQuery = this.supabase.from('datajud_case_details').select('*')

      if (lawFirmId) {
        syncQuery = syncQuery.eq('law_firm_id', lawFirmId)
        enrichmentQuery = enrichmentQuery.eq('law_firm_id', lawFirmId)
      }

      // Get sync metrics
      const { data: todaySyncs } = await syncQuery
        .gte('started_at', today.toISOString())

      const { data: activeSyncs } = await syncQuery
        .eq('sync_status', 'started')

      const { data: last24hSyncs } = await syncQuery
        .gte('started_at', last24h.toISOString())

      // Get enrichment metrics
      const { data: todayEnrichments } = await enrichmentQuery
        .gte('last_enrichment_at', today.toISOString())

      const { data: recentEnrichments } = await enrichmentQuery
        .gte('last_enrichment_at', last24h.toISOString())

      // Calculate metrics
      const apiCallsToday = todaySyncs?.reduce((sum, sync) => sum + (sync.api_calls_made || 0), 0) || 0
      const rateLimitHitsToday = todaySyncs?.reduce((sum, sync) => sum + (sync.rate_limit_hits || 0), 0) || 0
      
      const failedEnrichmentsToday = todayEnrichments?.filter(e => e.enrichment_status === 'failed').length || 0
      const totalEnrichments24h = recentEnrichments?.length || 0
      const successfulEnrichments24h = recentEnrichments?.filter(e => e.enrichment_status === 'completed').length || 0
      
      const successRate24h = totalEnrichments24h > 0 ? 
        (successfulEnrichments24h / totalEnrichments24h) * 100 : 100

      // Get last successful sync
      const { data: lastSuccessfulSync } = await syncQuery
        .eq('sync_status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .single()

      return {
        api_calls_today: apiCallsToday,
        api_calls_this_hour: 0, // Would need hour-specific calculation
        success_rate_24h: successRate24h,
        average_response_time: 2500, // Would need to track actual response times
        rate_limit_hits_today: rateLimitHitsToday,
        failed_enrichments_today: failedEnrichmentsToday,
        active_syncs: activeSyncs?.length || 0,
        last_successful_sync: lastSuccessfulSync?.completed_at || null
      }

    } catch (error) {
      console.error('Failed to get monitoring metrics:', error)
      
      // Return default metrics on error
      return {
        api_calls_today: 0,
        api_calls_this_hour: 0,
        success_rate_24h: 0,
        average_response_time: 0,
        rate_limit_hits_today: 0,
        failed_enrichments_today: 0,
        active_syncs: 0,
        last_successful_sync: null
      }
    }
  }

  /**
   * Get error alerts for a law firm
   */
  async getErrorAlerts(lawFirmId: string, limit: number = 20): Promise<ErrorAlert[]> {
    try {
      const { data: alerts, error } = await this.supabase
        .from('datajud_error_alerts')
        .select('*')
        .eq('law_firm_id', lawFirmId)
        .order('occurred_at', { ascending: false })
        .limit(limit)

      if (error) {
        throw new Error(`Failed to get error alerts: ${error.message}`)
      }

      return alerts || []
    } catch (error) {
      console.error('Failed to get error alerts:', error)
      return []
    }
  }

  /**
   * Resolve an error alert
   */
  async resolveAlert(alertId: string, resolutionNotes: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('datajud_error_alerts')
        .update({
          resolved_at: new Date().toISOString(),
          resolution_notes: resolutionNotes
        })
        .eq('id', alertId)

      if (error) {
        throw new Error(`Failed to resolve alert: ${error.message}`)
      }
    } catch (error) {
      console.error('Failed to resolve alert:', error)
      throw error
    }
  }

  /**
   * Calculate API success rate for last 24 hours
   */
  private async calculateApiSuccessRate(): Promise<number> {
    try {
      const { data: syncLogs } = await this.supabase
        .from('datajud_sync_log')
        .select('sync_status, api_calls_made')
        .gte('started_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      if (!syncLogs || syncLogs.length === 0) return 100

      const totalCalls = syncLogs.reduce((sum, log) => sum + (log.api_calls_made || 0), 0)
      const successfulSyncs = syncLogs.filter(log => log.sync_status === 'completed').length
      
      return totalCalls > 0 ? (successfulSyncs / syncLogs.length) * 100 : 100
    } catch (error) {
      console.error('Failed to calculate API success rate:', error)
      return 0
    }
  }

  /**
   * Calculate enrichment success rate for last 24 hours
   */
  private async calculateEnrichmentSuccessRate(): Promise<number> {
    try {
      const { data: enrichments } = await this.supabase
        .from('datajud_case_details')
        .select('enrichment_status')
        .gte('last_enrichment_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      if (!enrichments || enrichments.length === 0) return 100

      const successfulEnrichments = enrichments.filter(e => e.enrichment_status === 'completed').length
      return (successfulEnrichments / enrichments.length) * 100
    } catch (error) {
      console.error('Failed to calculate enrichment success rate:', error)
      return 0
    }
  }

  /**
   * Calculate sync success rate for last 24 hours
   */
  private async calculateSyncSuccessRate(): Promise<number> {
    try {
      const { data: syncs } = await this.supabase
        .from('datajud_sync_log')
        .select('sync_status')
        .gte('started_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      if (!syncs || syncs.length === 0) return 100

      const successfulSyncs = syncs.filter(s => s.sync_status === 'completed').length
      return (successfulSyncs / syncs.length) * 100
    } catch (error) {
      console.error('Failed to calculate sync success rate:', error)
      return 0
    }
  }

  /**
   * Store health check results
   */
  private async storeHealthCheckResults(healthChecks: HealthCheck[]): Promise<void> {
    try {
      for (const check of healthChecks) {
        await this.supabase
          .from('datajud_health_checks')
          .upsert({
            service: check.service,
            status: check.status,
            response_time_ms: check.response_time_ms,
            last_check: check.last_check,
            error_message: check.error_message,
            success_rate_24h: check.success_rate_24h,
            details: check.details
          }, {
            onConflict: 'service'
          })
      }
    } catch (error) {
      console.error('Failed to store health check results:', error)
    }
  }

  /**
   * Send error notification (placeholder for email/webhook integration)
   */
  private async sendErrorNotification(
    lawFirmId: string,
    errorType: string,
    title: string,
    description: string,
    severity: string
  ): Promise<void> {
    try {
      // This would integrate with your notification system (email, Slack, etc.)
      console.log(`🚨 DataJud ${severity.toUpperCase()} Alert:`, {
        law_firm_id: lawFirmId,
        error_type: errorType,
        title,
        description
      })

      // Example webhook call (replace with your notification service)
      if (process.env.DATAJUD_WEBHOOK_URL) {
        await fetch(process.env.DATAJUD_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            severity,
            error_type: errorType,
            title,
            description,
            law_firm_id: lawFirmId,
            timestamp: new Date().toISOString()
          })
        })
      }
    } catch (error) {
      console.error('Failed to send error notification:', error)
    }
  }
}

// Export service instance creator
export const createMonitoringService = (supabaseClient: SupabaseClient) => {
  return new DataJudMonitoringService(supabaseClient)
}

export default DataJudMonitoringService