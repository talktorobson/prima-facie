// =====================================================
// DataJud Timeline Event Update API Endpoint
// PATCH /api/datajud/timeline-events/[eventId]
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    const { eventId } = params

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

    // Only allow staff, lawyers, and admins to update events
    if (userProfile.user_type === 'client') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const allowedFields = [
      'is_relevant',
      'is_visible_client', 
      'is_visible_timeline',
      'priority_level',
      'event_category',
      'custom_description'
    ]

    // Filter to only allowed fields
    const updates: any = {}
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Add updated_at timestamp
    updates.updated_at = new Date().toISOString()

    // Verify event belongs to user's law firm and update
    const { data: updatedEvent, error: updateError } = await supabase
      .from('datajud_timeline_events')
      .update(updates)
      .eq('id', eventId)
      .eq('law_firm_id', userProfile.law_firm_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating timeline event:', updateError)
      
      if (updateError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Timeline event not found or access denied' }, { status: 404 })
      }
      
      return NextResponse.json({ error: 'Failed to update timeline event' }, { status: 500 })
    }

    console.log(`Timeline event ${eventId} updated by user ${session.user.id}:`, updates)

    return NextResponse.json({
      success: true,
      event: updatedEvent,
      updated_fields: Object.keys(updates)
    })

  } catch (error) {
    console.error('Timeline event update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
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
      'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}