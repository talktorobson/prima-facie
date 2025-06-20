// =====================================================
// DataJud Case Enrichment API Endpoint
// POST /api/datajud/enrich-case
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'
import { createEnrichmentService } from '@/lib/integrations/datajud/enrichment-service'
import { createMonitoringService } from '@/lib/integrations/datajud/monitoring'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    const enrichmentService = createEnrichmentService(supabase)
    const monitoringService = createMonitoringService(supabase)

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

    // Parse request body
    const body = await request.json()
    const { case_id, process_number, options = {} } = body

    if (!case_id) {
      return NextResponse.json({ error: 'case_id is required' }, { status: 400 })
    }

    if (!process_number) {
      return NextResponse.json({ error: 'process_number is required' }, { status: 400 })
    }

    // Verify case belongs to user's law firm
    const { data: caseData, error: caseError } = await supabase
      .from('matters')
      .select('id, title, process_number, law_firm_id')
      .eq('id', case_id)
      .eq('law_firm_id', userProfile.law_firm_id)
      .single()

    if (caseError || !caseData) {
      await monitoringService.logError(
        userProfile.law_firm_id,
        'data_quality',
        'Case not found for enrichment',
        `Case ${case_id} not found or access denied`,
        { case_id, user_id: session.user.id },
        'medium'
      )
      return NextResponse.json({ error: 'Case not found or access denied' }, { status: 404 })
    }

    // Log enrichment attempt
    console.log(`Starting DataJud enrichment for case ${case_id} (${caseData.title})`)

    // Perform enrichment
    const enrichmentResult = await enrichmentService.enrichCase(
      case_id,
      userProfile.law_firm_id,
      {
        force_update: options.force_update || false,
        include_timeline: options.include_timeline !== false,
        include_participants: options.include_participants !== false,
        include_legal_subjects: options.include_legal_subjects !== false,
        confidence_threshold: options.confidence_threshold || 0.7
      }
    )

    // Log result
    if (enrichmentResult.success) {
      console.log(`DataJud enrichment completed successfully for case ${case_id}:`, {
        enriched_fields: enrichmentResult.enriched_fields.length,
        confidence: enrichmentResult.confidence_score,
        timeline_events: enrichmentResult.timeline_events_added,
        participants: enrichmentResult.participants_added,
        conflicts: enrichmentResult.conflicts.length
      })
    } else {
      await monitoringService.logError(
        userProfile.law_firm_id,
        'enrichment_failure',
        'Case enrichment failed',
        enrichmentResult.errors.join(', '),
        { 
          case_id, 
          case_title: caseData.title,
          process_number: caseData.process_number,
          errors: enrichmentResult.errors 
        },
        'high'
      )
    }

    return NextResponse.json({
      success: enrichmentResult.success,
      case_id: enrichmentResult.case_id,
      enriched_fields: enrichmentResult.enriched_fields,
      conflicts: enrichmentResult.conflicts,
      confidence_score: enrichmentResult.confidence_score,
      timeline_events_added: enrichmentResult.timeline_events_added,
      participants_added: enrichmentResult.participants_added,
      legal_subjects_added: enrichmentResult.legal_subjects_added,
      errors: enrichmentResult.errors
    })

  } catch (error) {
    console.error('DataJud enrichment API error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error during case enrichment',
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}