import { NextRequest, NextResponse } from 'next/server'
import { verifyAIUser } from '@/lib/ai/verify-user'
import { createAdminClient } from '@/lib/supabase/admin'

const WRITE_ACTIONS: Record<string, { table: string; operation: 'insert' | 'update' }> = {
  create_task: { table: 'tasks', operation: 'insert' },
  update_task_status: { table: 'tasks', operation: 'update' },
  create_time_entry: { table: 'time_entries', operation: 'insert' },
  create_calendar_event: { table: 'tasks', operation: 'insert' },
  update_matter_status: { table: 'matters', operation: 'update' },
}

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

  const toolExecutionId = body.toolExecutionId as string | undefined
  const approved = body.approved as boolean | undefined
  const action = body.action as string | undefined
  const entityId = body.entityId as string | undefined
  const data = body.data as Record<string, unknown> | undefined

  if (approved === undefined) {
    return NextResponse.json({ error: 'Campo "approved" é obrigatório' }, { status: 400 })
  }

  // If we have a toolExecutionId, update its status
  if (toolExecutionId) {
    await supabase
      .from('ai_tool_executions')
      .update({
        status: approved ? 'executed' : 'rejected',
        executed_at: approved ? new Date().toISOString() : undefined,
      })
      .eq('id', toolExecutionId)
  }

  if (!approved) {
    return NextResponse.json({ message: 'Ação cancelada pelo usuário' })
  }

  if (!action || !data) {
    return NextResponse.json({ error: 'Ação e dados são obrigatórios para confirmação' }, { status: 400 })
  }

  const actionConfig = WRITE_ACTIONS[action]
  if (!actionConfig) {
    return NextResponse.json({ error: 'Ação desconhecida' }, { status: 400 })
  }

  // Verify law_firm_id matches
  if (data.law_firm_id && data.law_firm_id !== profile.law_firm_id) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  try {
    if (actionConfig.operation === 'insert') {
      const { data: result, error } = await supabase
        .from(actionConfig.table)
        .insert(data)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: `Erro ao executar ação: ${error.message}` }, { status: 500 })
      }

      return NextResponse.json({
        message: 'Ação executada com sucesso',
        data: result,
      })
    }

    if (actionConfig.operation === 'update' && entityId) {
      const { data: result, error } = await supabase
        .from(actionConfig.table)
        .update(data)
        .eq('id', entityId)
        .eq('law_firm_id', profile.law_firm_id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: `Erro ao executar ação: ${error.message}` }, { status: 500 })
      }

      return NextResponse.json({
        message: 'Ação executada com sucesso',
        data: result,
      })
    }

    return NextResponse.json({ error: 'Dados insuficientes para executar a ação' }, { status: 400 })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erro inesperado'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
