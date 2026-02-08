import { NextRequest, NextResponse } from 'next/server'
import { verifyAIUser } from '@/lib/ai/verify-user'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifyAIUser()
  if (auth.error) return auth.error

  const { profile } = auth
  const supabase = createAdminClient()

  const { data: conversation, error } = await supabase
    .from('ai_conversations')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', profile.id)
    .single()

  if (error || !conversation) {
    return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 })
  }

  // Also fetch messages
  const { data: messages } = await supabase
    .from('ai_messages')
    .select('id, role, content, tool_calls, tool_results, tokens_input, tokens_output, created_at')
    .eq('conversation_id', params.id)
    .order('created_at', { ascending: true })

  return NextResponse.json({
    data: {
      ...conversation,
      messages: messages || [],
    },
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

  const updates: Record<string, unknown> = {}
  if (typeof body.title === 'string') updates.title = body.title
  if (body.status === 'active' || body.status === 'archived') updates.status = body.status

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('ai_conversations')
    .update(updates)
    .eq('id', params.id)
    .eq('user_id', profile.id)
    .select()
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Erro ao atualizar conversa' }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifyAIUser()
  if (auth.error) return auth.error

  const { profile } = auth
  const supabase = createAdminClient()

  // Soft delete
  const { error } = await supabase
    .from('ai_conversations')
    .update({ status: 'deleted' })
    .eq('id', params.id)
    .eq('user_id', profile.id)

  if (error) {
    return NextResponse.json({ error: 'Erro ao excluir conversa' }, { status: 500 })
  }

  return NextResponse.json({ message: 'Conversa excluída' })
}
