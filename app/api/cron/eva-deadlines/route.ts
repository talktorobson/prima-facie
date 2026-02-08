import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { processEvaNotification } from '@/lib/ai/eva-notifications'

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Find matters with next_court_date within 3 days
  const now = new Date()
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

  const { data: matters, error } = await supabase
    .from('matters')
    .select('id, title, law_firm_id, next_court_date, status')
    .gte('next_court_date', now.toISOString().split('T')[0])
    .lte('next_court_date', threeDaysFromNow.toISOString().split('T')[0])
    .eq('status', 'active')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Deduplicate: collect matter IDs that already received a deadline
  // notification today by checking ai_messages with source_type='proactive'
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const matterIds = (matters || []).map((m) => m.id)

  const alreadyNotifiedMatterIds = new Set<string>()

  if (matterIds.length > 0) {
    // Check conversations linked to these matters for today's proactive messages
    const { data: todayProactive } = await supabase
      .from('ai_messages')
      .select('content, law_firm_id')
      .eq('source_type', 'proactive')
      .eq('role', 'assistant')
      .gte('created_at', todayStart)

    // Mark matters as already notified if we find a proactive message
    // from the same firm today (one notification per firm per day is enough)
    if (todayProactive?.length) {
      const notifiedFirms = new Set(todayProactive.map((m) => m.law_firm_id))
      for (const matter of matters || []) {
        if (notifiedFirms.has(matter.law_firm_id)) {
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
    } catch {
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
