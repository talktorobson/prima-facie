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
import { resolveOrCreateAIConversation, incrementConversationTokens, logAIMessages } from '@/lib/ai/conversation-resolver'

const MAX_QUERY_LENGTH = 5000
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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

  if (!query?.trim() || query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({ error: `Query deve ter entre 1 e ${MAX_QUERY_LENGTH} caracteres` }, { status: 400 })
  }
  if (!conversationId || !UUID_RE.test(conversationId)) {
    return NextResponse.json({ error: 'conversationId inválido' }, { status: 400 })
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

  // Parallelize independent lookups: firm name, conversation context, AI conversation
  const [firmResult, conversationContext, aiConversationId] = await Promise.all([
    supabase.from('law_firms').select('name').eq('id', lawFirmId).single(),
    buildConversationContext(supabase, conversationId, lawFirmId),
    resolveOrCreateAIConversation(supabase, profile.id, lawFirmId, 'Ghost-write', query),
  ])

  const firmName = firmResult.data?.name || 'Prima Facie'

  if (!aiConversationId) {
    return NextResponse.json({ error: 'Erro ao criar conversa AI' }, { status: 500 })
  }

  // Build ghost-write system prompt
  const systemPrompt = buildGhostWritePrompt({
    firmName,
    userName: profile.full_name || `${profile.first_name} ${profile.last_name}`,
    userRole: profile.user_type,
    conversationContext: conversationContext || 'Nenhum contexto disponível.',
  })

  // Get tools scoped to the user's role and firm
  const tools = getAllTools({
    supabase,
    lawFirmId,
    userId: profile.id,
    userRole: profile.user_type,
  })

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

    // Log messages and increment tokens (non-blocking, non-critical)
    await Promise.all([
      logAIMessages(supabase, {
        conversationId: aiConversationId,
        lawFirmId,
        query,
        assistantContent,
        tokensInput,
        tokensOutput,
        sourceType: 'chat_ghost',
        sourceConversationId: conversationId,
      }),
      incrementConversationTokens(supabase, aiConversationId, tokensInput, tokensOutput),
    ])

    return NextResponse.json({ content: assistantContent })
  } catch (err) {
    console.error('[chat-ghost] AI generation failed:', {
      userId: profile.id,
      conversationId,
      error: err instanceof Error ? err.message : err,
    })
    return NextResponse.json({ error: 'Erro ao processar mensagem. Tente novamente.' }, { status: 500 })
  }
}
