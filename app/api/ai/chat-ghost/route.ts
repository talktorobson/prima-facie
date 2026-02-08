import { NextRequest, NextResponse } from 'next/server'
import { generateText, stepCountIs } from 'ai'
import { getProvider } from '@/lib/ai/providers'
import { verifyAIUser } from '@/lib/ai/verify-user'
import { buildGhostWritePrompt } from '@/lib/ai/system-prompt'
import { buildConversationContext } from '@/lib/ai/context-builder'
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

  const query = body.query as string | undefined
  const conversationId = body.conversationId as string | undefined
  const lawFirmId = profile.law_firm_id

  if (!query?.trim()) {
    return NextResponse.json({ error: 'Query é obrigatória' }, { status: 400 })
  }
  if (!conversationId) {
    return NextResponse.json({ error: 'conversationId é obrigatório' }, { status: 400 })
  }
  if (!lawFirmId) {
    return NextResponse.json({ error: 'Usuário não vinculado a um escritório' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Rate limit check
  const rateLimit = await checkRateLimit(supabase, profile.id)
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: rateLimit.error }, { status: 429 })
  }

  // Fetch firm name
  let firmName = 'Prima Facie'
  const { data: firm } = await supabase
    .from('law_firms')
    .select('name')
    .eq('id', lawFirmId)
    .single()
  if (firm) firmName = firm.name

  // Build conversation context
  const conversationContext = await buildConversationContext(supabase, conversationId, lawFirmId) || 'Nenhum contexto disponível.'

  // Build ghost-write system prompt
  const systemPrompt = buildGhostWritePrompt({
    firmName,
    userName: profile.full_name || `${profile.first_name} ${profile.last_name}`,
    userRole: profile.user_type,
    conversationContext,
  })

  // Get tools scoped to the user's role and firm
  const toolContext = {
    supabase,
    lawFirmId,
    userId: profile.id,
    userRole: profile.user_type,
  }
  const tools = getAllTools(toolContext)

  // Resolve or create an AI conversation for logging (scoped to chat_ghost context)
  let aiConversationId: string
  const { data: existingConv } = await supabase
    .from('ai_conversations')
    .select('id')
    .eq('user_id', profile.id)
    .eq('status', 'active')
    .like('title', 'Ghost-write:%')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  if (existingConv) {
    aiConversationId = existingConv.id
  } else {
    const { data: newConv, error: convError } = await supabase
      .from('ai_conversations')
      .insert({
        law_firm_id: profile.law_firm_id,
        user_id: profile.id,
        title: `Ghost-write: ${query.slice(0, 80)}`,
        status: 'active',
        provider: AI_CONFIG.defaultProvider,
        model: AI_CONFIG.defaultModel,
      })
      .select('id')
      .single()

    if (convError || !newConv) {
      return NextResponse.json({ error: 'Erro ao criar conversa AI' }, { status: 500 })
    }
    aiConversationId = newConv.id
  }

  try {
    const result = await generateText({
      model: getProvider(),
      system: systemPrompt,
      messages: [{ role: 'user', content: query }],
      tools,
      maxOutputTokens: AI_CONFIG.maxTokens,
      temperature: AI_CONFIG.temperature,
      stopWhen: stepCountIs(5),
    })

    const assistantContent = result.text || ''
    const tokensInput = result.usage?.inputTokens || 0
    const tokensOutput = result.usage?.outputTokens || 0

    // Log user query to ai_messages
    await supabase.from('ai_messages').insert({
      conversation_id: aiConversationId,
      law_firm_id: profile.law_firm_id,
      role: 'user',
      content: query,
      source_type: 'chat_ghost',
      source_conversation_id: conversationId,
    })

    // Log assistant response to ai_messages
    await supabase.from('ai_messages').insert({
      conversation_id: aiConversationId,
      law_firm_id: profile.law_firm_id,
      role: 'assistant',
      content: assistantContent,
      tokens_input: tokensInput,
      tokens_output: tokensOutput,
      source_type: 'chat_ghost',
      source_conversation_id: conversationId,
    })

    // Increment conversation token count
    const { data: currentConv } = await supabase
      .from('ai_conversations')
      .select('total_tokens_used')
      .eq('id', aiConversationId)
      .single()

    await supabase
      .from('ai_conversations')
      .update({ total_tokens_used: (currentConv?.total_tokens_used || 0) + tokensInput + tokensOutput })
      .eq('id', aiConversationId)

    return NextResponse.json({ content: assistantContent })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erro ao processar mensagem'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
