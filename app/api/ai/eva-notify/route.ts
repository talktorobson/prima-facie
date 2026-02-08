import { NextRequest, NextResponse } from 'next/server'
import { verifyAIUser } from '@/lib/ai/verify-user'
import { checkRateLimit } from '@/lib/ai/rate-limiter'
import { createAdminClient } from '@/lib/supabase/admin'
import { processEvaNotification, type NotificationEvent, VALID_EVENT_TYPES } from '@/lib/ai/eva-notifications'

export async function POST(request: NextRequest) {
  // Verify the caller is an authenticated staff+ user
  const auth = await verifyAIUser()
  if (auth.error) return auth.error

  const { profile } = auth

  const supabase = createAdminClient()

  // Rate limit check
  const rateLimit = await checkRateLimit(supabase, profile.id)
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: rateLimit.error }, { status: 429 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const eventType = body.eventType as string | undefined
  const lawFirmId = profile.law_firm_id
  const matterId = body.matterId as string | undefined
  const contactId = body.contactId as string | undefined
  const metadata = (body.metadata || {}) as Record<string, unknown>

  if (!eventType || !lawFirmId) {
    return NextResponse.json({ error: 'eventType é obrigatório e usuário deve estar vinculado a um escritório' }, { status: 400 })
  }

  if (!(VALID_EVENT_TYPES as readonly string[]).includes(eventType)) {
    return NextResponse.json({ error: `eventType inválido. Valores aceitos: ${VALID_EVENT_TYPES.join(', ')}` }, { status: 400 })
  }

  try {
    const event: NotificationEvent = {
      eventType: eventType as NotificationEvent['eventType'],
      lawFirmId,
      matterId,
      contactId,
      metadata,
    }

    await processEvaNotification(event)
    return NextResponse.json({ success: true })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erro ao processar notificação'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
