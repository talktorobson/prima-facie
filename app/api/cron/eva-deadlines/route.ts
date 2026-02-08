import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { processEvaNotification } from '@/lib/ai/eva-notifications'

const DEADLINE_WARNING_DAYS = 3
const MS_PER_DAY = 24 * 60 * 60 * 1000

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error('[CRON] CRON_SECRET not configured')
    return NextResponse.json({ error: 'Serviço não configurado' }, { status: 500 })
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Find matters with next_court_date within the warning window
  const now = new Date()
  const deadlineThreshold = new Date(now.getTime() + DEADLINE_WARNING_DAYS * MS_PER_DAY)

  const { data: matters, error } = await supabase
    .from('matters')
    .select('id, title, law_firm_id, next_court_date, status')
    .gte('next_court_date', now.toISOString().split('T')[0])
    .lte('next_court_date', deadlineThreshold.toISOString().split('T')[0])
    .eq('status', 'active')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Deduplicate: check which specific matters already got a deadline notification today
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const matterIds = (matters || []).map((m) => m.id)

  const alreadyNotifiedMatterIds = new Set<string>()

  if (matterIds.length > 0) {
    // Check for today's proactive messages and extract matter IDs from their content metadata
    const { data: todayProactive } = await supabase
      .from('ai_messages')
      .select('content, law_firm_id, source_conversation_id')
      .eq('source_type', 'proactive')
      .eq('role', 'assistant')
      .gte('created_at', todayStart)

    if (todayProactive?.length) {
      // Build a set of (law_firm_id + source_conversation_id) pairs already notified
      const notifiedKeys = new Set(
        todayProactive.map((m) => `${m.law_firm_id}`)
      )
      // Skip matters from firms that already received any proactive notification today
      for (const matter of matters || []) {
        if (notifiedKeys.has(matter.law_firm_id)) {
          alreadyNotifiedMatterIds.add(matter.id)
        }
      }
    }
  }

  let processed = 0
  let skipped = 0

  for (const matter of matters || []) {
    if (alreadyNotifiedMatterIds.has(matter.id)) {
      skipped++
      continue
    }

    try {
      await processEvaNotification({
        eventType: 'upcoming_deadline',
        lawFirmId: matter.law_firm_id,
        matterId: matter.id,
        metadata: {
          matter_title: matter.title,
          next_court_date: matter.next_court_date,
        },
      })
      processed++
    } catch (err) {
      console.error('[CRON] Failed to process deadline notification:', {
        matterId: matter.id,
        error: err instanceof Error ? err.message : err,
      })
      skipped++
    }
  }

  return NextResponse.json({
    success: true,
    total: matters?.length || 0,
    processed,
    skipped,
  })
}
