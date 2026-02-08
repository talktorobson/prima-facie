import { NextRequest, NextResponse } from 'next/server'
import { verifyAIUser } from '@/lib/ai/verify-user'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const auth = await verifyAIUser()
  if (auth.error) return auth.error

  const { profile } = auth
  const supabase = createAdminClient()

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const messageId = body.messageId as string | undefined
  const rating = body.rating as string | undefined
  const comment = body.comment as string | undefined

  if (!messageId || !rating || (rating !== 'positive' && rating !== 'negative')) {
    return NextResponse.json({ error: 'messageId e rating (positive/negative) são obrigatórios' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('ai_message_feedback')
    .upsert(
      {
        message_id: messageId,
        user_id: profile.id,
        law_firm_id: profile.law_firm_id,
        rating,
        comment,
      },
      { onConflict: 'message_id,user_id' }
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Erro ao salvar feedback' }, { status: 500 })
  }

  return NextResponse.json({ data })
}
