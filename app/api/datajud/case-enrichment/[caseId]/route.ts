// =====================================================
// DataJud Case Enrichment Details API Endpoint
// GET /api/datajud/case-enrichment/[caseId]
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { caseId: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    const { caseId } = params

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

    // Verify case belongs to user's law firm
    const { data: caseData, error: caseError } = await supabase
      .from('matters')
      .select('id, title, matter_number, process_number, law_firm_id')
      .eq('id', caseId)
      .eq('law_firm_id', userProfile.law_firm_id)
      .single()

    if (caseError || !caseData) {
      return NextResponse.json({ error: 'Case not found or access denied' }, { status: 404 })
    }

    // Get DataJud case details
    const { data: enrichmentData, error: enrichmentError } = await supabase
      .from('datajud_case_details')
      .select('*')
      .eq('matter_id', caseId)
      .eq('law_firm_id', userProfile.law_firm_id)
      .single()

    if (enrichmentError && enrichmentError.code !== 'PGRST116') {
      console.error('Error fetching enrichment data:', enrichmentError)
      return NextResponse.json({ error: 'Failed to fetch enrichment data' }, { status: 500 })
    }

    // If no enrichment data exists, return basic structure
    if (!enrichmentData) {
      return NextResponse.json({
        case_id: caseId,
        case_title: caseData.title,
        case_number: caseData.matter_number,
        process_number: caseData.process_number,
        enrichment_status: 'not_enriched',
        has_enrichment: false,
        legal_subjects_count: 0,
        participants_count: 0,
        timeline_events_count: 0,
        message: 'No DataJud enrichment found for this case'
      })
    }

    // Get related data counts
    const [
      { count: legalSubjectsCount },
      { count: participantsCount },
      { count: timelineEventsCount }
    ] = await Promise.all([
      supabase
        .from('datajud_legal_subjects')
        .select('id', { count: 'exact' })
        .eq('datajud_case_detail_id', enrichmentData.id),
      
      supabase
        .from('datajud_case_participants')
        .select('id', { count: 'exact' })
        .eq('datajud_case_detail_id', enrichmentData.id),
      
      supabase
        .from('datajud_timeline_events')
        .select('id', { count: 'exact' })
        .eq('datajud_case_detail_id', enrichmentData.id)
    ])

    // Get detailed legal subjects
    const { data: legalSubjects } = await supabase
      .from('datajud_legal_subjects')
      .select('*')
      .eq('datajud_case_detail_id', enrichmentData.id)
      .order('is_primary_subject', { ascending: false })

    // Get detailed participants
    const { data: participants } = await supabase
      .from('datajud_case_participants')
      .select(`
        *,
        contacts (
          id,
          full_name,
          company_name,
          email,
          phone
        )
      `)
      .eq('datajud_case_detail_id', enrichmentData.id)
      .order('case_role')

    // Get recent timeline events (last 10)
    const { data: recentEvents } = await supabase
      .from('datajud_timeline_events')
      .select('*')
      .eq('datajud_case_detail_id', enrichmentData.id)
      .order('event_datetime', { ascending: false })
      .limit(10)

    // Format enrichment details
    const enrichmentDetails = {
      ...enrichmentData,
      case_id: caseId,
      case_title: caseData.title,
      case_number: caseData.matter_number,
      process_number: caseData.process_number,
      has_enrichment: true,
      
      // Counts
      legal_subjects_count: legalSubjectsCount || 0,
      participants_count: participantsCount || 0,
      timeline_events_count: timelineEventsCount || 0,
      
      // Detailed data
      legal_subjects: legalSubjects?.map(subject => ({
        id: subject.id,
        code: subject.subject_code,
        name: subject.subject_name,
        is_primary: subject.is_primary_subject
      })) || [],
      
      participants: participants?.map(participant => ({
        id: participant.id,
        name: participant.participant_name,
        cpf_cnpj: participant.participant_cpf_cnpj,
        type: participant.participant_type,
        role: participant.case_role,
        participation_type: participant.participation_type,
        matched_contact: participant.contacts ? {
          id: participant.contacts.id,
          name: participant.contacts.full_name || participant.contacts.company_name,
          email: participant.contacts.email,
          phone: participant.contacts.phone
        } : null,
        match_confidence: participant.match_confidence
      })) || [],
      
      recent_timeline_events: recentEvents?.map(event => ({
        id: event.id,
        movement_code: event.movement_code,
        movement_name: event.movement_name,
        event_datetime: event.event_datetime,
        category: event.event_category,
        priority: event.priority_level,
        is_relevant: event.is_relevant,
        is_visible_client: event.is_visible_client
      })) || [],
      
      // Data quality indicators
      quality_indicators: {
        confidence_score: Number(enrichmentData.enrichment_confidence || 0),
        has_court_info: !!(enrichmentData.court_name && enrichmentData.court_code),
        has_classification: !!(enrichmentData.process_class_name),
        has_legal_subjects: (legalSubjectsCount || 0) > 0,
        has_participants: (participantsCount || 0) > 0,
        has_timeline_events: (timelineEventsCount || 0) > 0,
        has_conflicts: !!(enrichmentData.data_conflicts)
      }
    }

    return NextResponse.json(enrichmentDetails)

  } catch (error) {
    console.error('Case enrichment details API error:', error)
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