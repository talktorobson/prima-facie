import { NextRequest, NextResponse } from 'next/server'
import { verifyAIUser } from '@/lib/ai/verify-user'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const auth = await verifyAIUser()
  if (auth.error) return auth.error

  const { profile } = auth
  const supabase = createAdminClient()

  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1')
  const perPage = parseInt(searchParams.get('per_page') || '20')
  const offset = (page - 1) * perPage

  const { data, error, count } = await supabase
    .from('ai_conversations')
    .select('id, title, status, context_type, provider, model, total_tokens_used, created_at, updated_at', { count: 'exact' })
    .eq('user_id', profile.id)
    .neq('status', 'deleted')
    .order('updated_at', { ascending: false })
    .range(offset, offset + perPage - 1)

  if (error) {
    return NextResponse.json({ error: 'Erro ao buscar conversas' }, { status: 500 })
  }

  return NextResponse.json({
    data: data || [],
    count: count || 0,
    page,
    per_page: perPage,
    total_pages: Math.ceil((count || 0) / perPage),
  })
}

export async function POST(request: NextRequest) {
  const auth = await verifyAIUser()
  if (auth.error) return auth.error

  const { profile } = auth
  const supabase = createAdminClient()

  let body: Record<string, unknown> = {}
  try {
    body = await request.json()
  } catch {
    // Empty body is OK, we have defaults
  }

  const { data, error } = await supabase
    .from('ai_conversations')
    .insert({
      law_firm_id: profile.law_firm_id,
      user_id: profile.id,
      title: (body.title as string) || 'Nova conversa',
      context_type: body.contextType as string | undefined,
      context_entity_id: body.contextEntityId as string | undefined,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Erro ao criar conversa' }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
