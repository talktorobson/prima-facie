// =====================================================
// DataJud Timeline Events API Endpoint
// GET /api/datajud/timeline-events/[caseId]
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

    // Parse query parameters
    const url = new URL(request.url)
    const relevantOnly = url.searchParams.get('relevant_only') === 'true'
    const clientView = url.searchParams.get('client_view') === 'true'
    const category = url.searchParams.get('category')
    const priority = url.searchParams.get('priority')
    const limit = parseInt(url.searchParams.get('limit') || '50')

    // Verify case belongs to user's law firm
    const { data: caseData, error: caseError } = await supabase
      .from('matters')
      .select('id, title, law_firm_id')
      .eq('id', caseId)
      .eq('law_firm_id', userProfile.law_firm_id)
      .single()

    if (caseError || !caseData) {
      return NextResponse.json({ error: 'Case not found or access denied' }, { status: 404 })
    }

    // Get DataJud case details
    const { data: caseDetails, error: detailsError } = await supabase
      .from('datajud_case_details')
      .select('id')
      .eq('matter_id', caseId)
      .eq('law_firm_id', userProfile.law_firm_id)
      .single()

    if (detailsError || !caseDetails) {
      return NextResponse.json({ 
        events: [],
        total: 0,
        message: 'No DataJud enrichment found for this case'
      })
    }

    // Build timeline events query
    let query = supabase
      .from('datajud_timeline_events')
      .select('*')
      .eq('datajud_case_detail_id', caseDetails.id)
      .eq('law_firm_id', userProfile.law_firm_id)
      .eq('is_visible_timeline', true)

    // Apply filters
    if (relevantOnly) {
      query = query.eq('is_relevant', true)
    }

    if (clientView) {
      query = query.eq('is_visible_client', true)
    }

    if (category) {
      query = query.eq('event_category', category)
    }

    if (priority) {
      query = query.eq('priority_level', priority)
    }

    // Order by date descending and limit
    query = query
      .order('event_datetime', { ascending: false })
      .limit(limit)

    const { data: events, error: eventsError } = await query

    if (eventsError) {
      console.error('Error fetching timeline events:', eventsError)
      return NextResponse.json({ error: 'Failed to fetch timeline events' }, { status: 500 })
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('datajud_timeline_events')
      .select('id', { count: 'exact' })
      .eq('datajud_case_detail_id', caseDetails.id)
      .eq('law_firm_id', userProfile.law_firm_id)
      .eq('is_visible_timeline', true)

    if (relevantOnly) {
      countQuery = countQuery.eq('is_relevant', true)
    }

    if (clientView) {
      countQuery = countQuery.eq('is_visible_client', true)
    }

    if (category) {
      countQuery = countQuery.eq('event_category', category)
    }

    if (priority) {
      countQuery = countQuery.eq('priority_level', priority)
    }

    const { count, error: countError } = await countQuery

    return NextResponse.json({
      events: events || [],
      total: count || 0,
      case_id: caseId,
      case_title: caseData.title,
      filters: {
        relevant_only: relevantOnly,
        client_view: clientView,
        category,
        priority,
        limit
      }
    })

  } catch (error) {
    console.error('Timeline events API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}