// =====================================================
// DataJud Health Check API Endpoint
// GET /api/datajud/health-check
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'
import { createMonitoringService } from '@/lib/integrations/datajud/monitoring'
import { getDataJudApi } from '@/lib/integrations/datajud/api'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    const monitoringService = createMonitoringService(supabase)

    // Get authenticated user (optional for health check)
    const { data: { session } } = await supabase.auth.getSession()
    let userProfile = null

    if (session) {
      const { data: profile } = await supabase
        .from('users')
        .select('law_firm_id, user_type')
        .eq('auth_user_id', session.user.id)
        .single()
      
      userProfile = profile
    }

    // Perform comprehensive health check
    console.log('Performing DataJud health check...')
    const startTime = Date.now()

    // Test basic DataJud API connectivity
    let apiStatus = 'healthy'
    let apiResponseTime = 0
    let apiError = null

    try {
      const dataJudApi = getDataJudApi()
      const connectionTest = await dataJudApi.testConnection()

      apiResponseTime = connectionTest.responseTimeMs

      if (!connectionTest.success) {
        apiStatus = 'down'
        apiError = connectionTest.message
      } else if (apiResponseTime > 5000) {
        apiStatus = 'degraded'
        apiError = `Slow response time: ${apiResponseTime}ms`
      }
    } catch (error) {
      apiStatus = 'down'
      apiError = error instanceof Error ? error.message : 'Unknown API error'
      apiResponseTime = Date.now() - startTime
    }

    // Test database connectivity
    let dbStatus = 'healthy'
    let dbError = null

    try {
      // Test basic database query
      const { data: testQuery, error: dbTestError } = await supabase
        .from('datajud_case_details')
        .select('id')
        .limit(1)

      if (dbTestError) {
        dbStatus = 'degraded'
        dbError = dbTestError.message
      }
    } catch (error) {
      dbStatus = 'down'
      dbError = error instanceof Error ? error.message : 'Database connection failed'
    }

    // Get recent sync status
    let syncStatus = 'healthy'
    let syncError = null
    let lastSuccessfulSync = null

    try {
      let syncQuery = supabase
        .from('datajud_sync_log')
        .select('sync_status, completed_at, started_at')
        .order('started_at', { ascending: false })
        .limit(10)

      // Filter by law firm if user is authenticated
      if (userProfile?.law_firm_id) {
        syncQuery = syncQuery.eq('law_firm_id', userProfile.law_firm_id)
      }

      const { data: recentSyncs, error: syncQueryError } = await syncQuery

      if (syncQueryError) {
        syncStatus = 'degraded'
        syncError = syncQueryError.message
      } else if (recentSyncs && recentSyncs.length > 0) {
        // Check for stuck syncs (running > 2 hours)
        const now = Date.now()
        const stuckSyncs = recentSyncs.filter(sync => 
          sync.sync_status === 'started' && 
          now - new Date(sync.started_at).getTime() > 2 * 60 * 60 * 1000
        )

        if (stuckSyncs.length > 0) {
          syncStatus = 'degraded'
          syncError = `${stuckSyncs.length} stuck sync(s) detected`
        }

        // Find last successful sync
        const lastSuccess = recentSyncs.find(sync => sync.sync_status === 'completed')
        lastSuccessfulSync = lastSuccess?.completed_at || null
      }
    } catch (error) {
      syncStatus = 'down'
      syncError = error instanceof Error ? error.message : 'Sync status check failed'
    }

    // Get monitoring metrics if user is authenticated
    let metrics = null
    if (userProfile?.law_firm_id) {
      try {
        metrics = await monitoringService.getMetrics(userProfile.law_firm_id)
      } catch (error) {
        console.warn('Failed to get monitoring metrics:', error)
      }
    }

    // Calculate overall health
    const totalResponseTime = Date.now() - startTime
    const services = [apiStatus, dbStatus, syncStatus]
    let overallStatus = 'healthy'

    if (services.includes('down')) {
      overallStatus = 'down'
    } else if (services.includes('degraded')) {
      overallStatus = 'degraded'
    }

    const healthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      response_time_ms: totalResponseTime,
      services: {
        datajud_api: {
          status: apiStatus,
          response_time_ms: apiResponseTime,
          error: apiError
        },
        database: {
          status: dbStatus,
          error: dbError
        },
        sync_service: {
          status: syncStatus,
          error: syncError,
          last_successful_sync: lastSuccessfulSync
        }
      },
      metrics: metrics,
      environment: {
        node_env: process.env.NODE_ENV || 'unknown',
        datajud_api_configured: true, // Public API key is built-in
        datajud_api_key_override: !!process.env.DATAJUD_API_KEY
      }
    }

    console.log(`DataJud health check completed in ${totalResponseTime}ms - Status: ${overallStatus}`)

    // Return appropriate HTTP status based on health
    const httpStatus = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 206 : 503

    return NextResponse.json(healthCheckResult, { status: httpStatus })

  } catch (error) {
    console.error('Health check API error:', error)
    
    return NextResponse.json({
      status: 'down',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 })
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}