// =====================================================
// DataJud Enrichment Statistics API Endpoint
// GET /api/datajud/enrichment-stats
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'
import { createMonitoringService } from '@/lib/integrations/datajud/monitoring'
import { createEnrichmentService } from '@/lib/integrations/datajud/enrichment-service'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    const monitoringService = createMonitoringService(supabase)
    const enrichmentService = createEnrichmentService(supabase)

    // Get authenticated user
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to determine law firm
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('law_firm_id, user_type')
      .eq('auth_user_id', session.user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Get monitoring metrics
    const metrics = await monitoringService.getMetrics(userProfile.law_firm_id)
    
    // Get enrichment summary
    const enrichmentSummary = await enrichmentService.getEnrichmentSummary(userProfile.law_firm_id)

    // Get detailed enrichment statistics
    const { data: enrichmentDetails, error: detailsError } = await supabase
      .from('datajud_case_details')
      .select(`
        id,
        matter_id,
        enrichment_status,
        enrichment_confidence,
        last_enrichment_at,
        court_name,
        tribunal_alias,
        matters!inner (
          id,
          title,
          matter_number,
          process_number
        )
      `)
      .eq('law_firm_id', userProfile.law_firm_id)
      .order('last_enrichment_at', { ascending: false })

    if (detailsError) {
      console.error('Error fetching enrichment details:', detailsError)
      return NextResponse.json({ error: 'Failed to fetch enrichment statistics' }, { status: 500 })
    }

    // Get timeline events statistics
    const { data: timelineStats, error: timelineError } = await supabase
      .from('datajud_timeline_events')
      .select('event_category, priority_level, is_relevant')
      .eq('law_firm_id', userProfile.law_firm_id)

    // Get participants statistics
    const { data: participantsStats, error: participantsError } = await supabase
      .from('datajud_case_participants')
      .select('case_role, participant_type, matched_contact_id')
      .eq('law_firm_id', userProfile.law_firm_id)

    // Get legal subjects statistics
    const { data: subjectsStats, error: subjectsError } = await supabase
      .from('datajud_legal_subjects')
      .select('subject_name, is_primary_subject')
      .eq('law_firm_id', userProfile.law_firm_id)

    // Get recent sync history
    const { data: recentSyncs, error: syncError } = await supabase
      .from('datajud_sync_log')
      .select('*')
      .eq('law_firm_id', userProfile.law_firm_id)
      .order('started_at', { ascending: false })
      .limit(10)

    // Calculate timeline statistics
    const timelineStatistics = {
      total_events: timelineStats?.length || 0,
      by_category: {} as Record<string, number>,
      by_priority: {} as Record<string, number>,
      relevant_events: timelineStats?.filter(e => e.is_relevant).length || 0
    }

    timelineStats?.forEach(event => {
      // Count by category
      const category = event.event_category || 'unknown'
      timelineStatistics.by_category[category] = (timelineStatistics.by_category[category] || 0) + 1

      // Count by priority
      const priority = event.priority_level || 'unknown'
      timelineStatistics.by_priority[priority] = (timelineStatistics.by_priority[priority] || 0) + 1
    })

    // Calculate participants statistics
    const participantsStatistics = {
      total_participants: participantsStats?.length || 0,
      by_role: {} as Record<string, number>,
      by_type: {} as Record<string, number>,
      matched_contacts: participantsStats?.filter(p => p.matched_contact_id).length || 0
    }

    participantsStats?.forEach(participant => {
      // Count by role
      const role = participant.case_role || 'unknown'
      participantsStatistics.by_role[role] = (participantsStatistics.by_role[role] || 0) + 1

      // Count by type
      const type = participant.participant_type || 'unknown'
      participantsStatistics.by_type[type] = (participantsStatistics.by_type[type] || 0) + 1
    })

    // Calculate legal subjects statistics
    const subjectsStatistics = {
      total_subjects: subjectsStats?.length || 0,
      primary_subjects: subjectsStats?.filter(s => s.is_primary_subject).length || 0,
      unique_subjects: [...new Set(subjectsStats?.map(s => s.subject_name) || [])].length
    }

    // Calculate enrichment quality metrics
    const qualityMetrics = {
      high_confidence_cases: enrichmentDetails?.filter(e => Number(e.enrichment_confidence) >= 0.8).length || 0,
      medium_confidence_cases: enrichmentDetails?.filter(e => {
        const conf = Number(e.enrichment_confidence)
        return conf >= 0.6 && conf < 0.8
      }).length || 0,
      low_confidence_cases: enrichmentDetails?.filter(e => Number(e.enrichment_confidence) < 0.6).length || 0,
      average_confidence: enrichmentDetails?.length > 0 ? 
        enrichmentDetails.reduce((sum, e) => sum + Number(e.enrichment_confidence || 0), 0) / enrichmentDetails.length : 0
    }

    // Recent activity
    const recentActivity = enrichmentDetails?.slice(0, 5).map(detail => ({
      case_id: detail.matter_id,
      case_title: detail.matters?.title || 'Unknown',
      case_number: detail.matters?.matter_number || 'N/A',
      process_number: detail.matters?.process_number || 'N/A',
      enrichment_status: detail.enrichment_status,
      confidence: Number(detail.enrichment_confidence || 0),
      last_enrichment: detail.last_enrichment_at,
      court_name: detail.court_name,
      tribunal: detail.tribunal_alias
    })) || []

    const response = {
      law_firm_id: userProfile.law_firm_id,
      generated_at: new Date().toISOString(),
      
      // Overall metrics
      overview: {
        ...metrics,
        ...enrichmentSummary
      },

      // Quality metrics
      quality: qualityMetrics,

      // Component statistics
      timeline: timelineStatistics,
      participants: participantsStatistics,
      legal_subjects: subjectsStatistics,

      // Recent activity
      recent_activity: recentActivity,

      // Sync history
      recent_syncs: recentSyncs?.map(sync => ({
        id: sync.id,
        type: sync.sync_type,
        status: sync.sync_status,
        started_at: sync.started_at,
        completed_at: sync.completed_at,
        duration_seconds: sync.duration_seconds,
        total_cases: sync.total_cases_processed,
        successful_cases: sync.successful_cases,
        failed_cases: sync.failed_cases,
        api_calls: sync.api_calls_made
      })) || [],

      // Distribution by status
      status_distribution: {
        completed: enrichmentDetails?.filter(e => e.enrichment_status === 'completed').length || 0,
        partial: enrichmentDetails?.filter(e => e.enrichment_status === 'partial').length || 0,
        failed: enrichmentDetails?.filter(e => e.enrichment_status === 'failed').length || 0,
        pending: enrichmentDetails?.filter(e => e.enrichment_status === 'pending').length || 0
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Enrichment stats API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
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