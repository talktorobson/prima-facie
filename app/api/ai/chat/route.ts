import { NextRequest, NextResponse } from 'next/server'
import { generateText, stepCountIs } from 'ai'
import { getProvider } from '@/lib/ai/providers'
import { verifyAIUser } from '@/lib/ai/verify-user'
import { buildSystemPrompt } from '@/lib/ai/system-prompt'
import { buildContextInfo } from '@/lib/ai/context-builder'
import { checkRateLimit } from '@/lib/ai/rate-limiter'
import { getAllTools } from '@/lib/ai/tools'
import { createAdminClient } from '@/lib/supabase/admin'
import { AI_CONFIG } from '@/lib/ai/config'

export async function POST(request: NextRequest) {
  const auth = await verifyAIUser()
  if (auth.error) return auth.error

  const { profile } = auth

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const message = body.message as string | undefined
  if (!message?.trim()) {
    return NextResponse.json({ error: 'Mensagem é obrigatória' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Rate limit check
  const rateLimit = await checkRateLimit(supabase, profile.id)
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: rateLimit.error }, { status: 429 })
  }

  // Resolve or create conversation
  let conversationId = body.conversationId as string | undefined
  if (!conversationId) {
    const { data: conv, error: convError } = await supabase
      .from('ai_conversations')
      .insert({
        law_firm_id: profile.law_firm_id,
        user_id: profile.id,
        title: message.slice(0, 100),
        status: 'active',
        provider: AI_CONFIG.defaultProvider,
        model: AI_CONFIG.defaultModel,
      })
      .select('id')
      .single()

    if (convError || !conv) {
      return NextResponse.json({ error: 'Erro ao criar conversa' }, { status: 500 })
    }
    conversationId = conv.id
  }

  // Build context from page
  const pageContext = body.pageContext as { route?: string; entityType?: string; entityId?: string } | undefined
  const contextInfo = await buildContextInfo(supabase, profile.law_firm_id, {
    contextType: pageContext?.entityType,
    entityId: pageContext?.entityId,
  })

  // Fetch firm name
  let firmName = 'Prima Facie'
  if (profile.law_firm_id) {
    const { data: firm } = await supabase
      .from('law_firms')
      .select('name')
      .eq('id', profile.law_firm_id)
      .single()
    if (firm) firmName = firm.name
  }

  // Build system prompt
  const systemPrompt = buildSystemPrompt({
    firmName,
    userName: profile.full_name || `${profile.first_name} ${profile.last_name}`,
    userRole: profile.user_type,
    currentPage: pageContext?.route || '/',
    contextInfo,
  })

  // Load conversation history
  const { data: history } = await supabase
    .from('ai_messages')
    .select('role, content, tool_calls, tool_results')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(AI_CONFIG.maxHistoryMessages)

  const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = []
  if (history) {
    for (const msg of history) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({ role: msg.role, content: msg.content || '' })
      }
    }
  }
  messages.push({ role: 'user', content: message })

  // Save user message
  await supabase.from('ai_messages').insert({
    conversation_id: conversationId,
    law_firm_id: profile.law_firm_id,
    role: 'user',
    content: message,
  })

  // Get tools scoped to the user's role and firm
  const toolContext = {
    supabase,
    lawFirmId: profile.law_firm_id || '',
    userId: profile.id,
    userRole: profile.user_type,
  }
  const tools = profile.law_firm_id ? getAllTools(toolContext) : {}

  try {
    const result = await generateText({
      model: getProvider(),
      system: systemPrompt,
      messages,
      tools,
      maxOutputTokens: AI_CONFIG.maxTokens,
      temperature: AI_CONFIG.temperature,
      stopWhen: stepCountIs(5),
    })

    const assistantContent = result.text || ''
    const tokensInput = result.usage?.inputTokens || 0
    const tokensOutput = result.usage?.outputTokens || 0

    // Collect tool calls and results
    const collectedToolCalls: Record<string, unknown>[] = []
    const collectedToolResults: Record<string, unknown>[] = []

    for (const step of result.steps || []) {
      if (step.toolCalls?.length) {
        for (const tc of step.toolCalls) {
          collectedToolCalls.push({ toolName: tc.toolName, input: tc.input })
        }
      }
      if (step.toolResults?.length) {
        for (const tr of step.toolResults) {
          collectedToolResults.push({ toolName: tr.toolName, output: tr.output })

          // Log tool execution
          const toolOutput = tr.output as Record<string, unknown>
          await supabase.from('ai_tool_executions').insert({
            message_id: conversationId, // placeholder — updated when we save the message
            law_firm_id: profile.law_firm_id,
            tool_name: tr.toolName,
            tool_input: (collectedToolCalls.find((tc) => (tc as Record<string, unknown>).toolName === tr.toolName) as Record<string, unknown>)?.input as Record<string, unknown>,
            tool_output: toolOutput,
            status: toolOutput?.requiresConfirmation ? 'pending' : 'executed',
            requires_confirmation: !!toolOutput?.requiresConfirmation,
            executed_at: toolOutput?.requiresConfirmation ? undefined : new Date().toISOString(),
          })
        }
      }
    }

    // Save assistant message
    const { data: savedMsg } = await supabase
      .from('ai_messages')
      .insert({
        conversation_id: conversationId,
        law_firm_id: profile.law_firm_id,
        role: 'assistant',
        content: assistantContent,
        tool_calls: collectedToolCalls.length ? collectedToolCalls : undefined,
        tool_results: collectedToolResults.length ? collectedToolResults : undefined,
        tokens_input: tokensInput,
        tokens_output: tokensOutput,
      })
      .select('id')
      .single()

    // Update conversation token count
    await supabase
      .from('ai_conversations')
      .update({
        total_tokens_used: tokensInput + tokensOutput,
      })
      .eq('id', conversationId)

    return NextResponse.json({
      conversationId,
      message: {
        id: savedMsg?.id,
        content: assistantContent,
        toolCalls: collectedToolCalls.length ? collectedToolCalls : undefined,
        toolResults: collectedToolResults.length ? collectedToolResults : undefined,
        tokensInput,
        tokensOutput,
      },
    })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erro ao processar mensagem'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
