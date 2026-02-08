import { NextRequest, NextResponse } from 'next/server'
import { generateText, stepCountIs } from 'ai'
import { getProvider } from '@/lib/ai/providers'
import { verifyAIUser } from '@/lib/ai/verify-user'
import { buildClientQAPrompt } from '@/lib/ai/system-prompt'
import { checkRateLimit } from '@/lib/ai/rate-limiter'
import { getClientTools } from '@/lib/ai/tools/client-tools'
import { createAdminClient } from '@/lib/supabase/admin'
import { AI_CONFIG } from '@/lib/ai/config'
import { resolveOrCreateAIConversation, incrementConversationTokens, logAIMessages } from '@/lib/ai/conversation-resolver'

const MAX_QUERY_LENGTH = 5000

export async function POST(request: NextRequest) {
  // Allow clients + all staff roles
  const auth = await verifyAIUser(['client', 'super_admin', 'admin', 'lawyer', 'staff'])
  if (auth.error) return auth.error

  const { profile } = auth

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const query = body.query as string | undefined
  if (!query?.trim() || query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({ error: `Query deve ter entre 1 e ${MAX_QUERY_LENGTH} caracteres` }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Rate limit check
  const rateLimit = await checkRateLimit(supabase, profile.id)
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: rateLimit.error }, { status: 429 })
  }

  // Resolve contact_id from the user's profile
  const { data: contact } = await supabase
    .from('contacts')
    .select('id, law_firm_id, full_name, company_name, contact_type')
    .eq('user_id', profile.id)
    .single()

  if (!contact) {
    return NextResponse.json({ error: 'Perfil de contato não encontrado.' }, { status: 404 })
  }

  const lawFirmId = contact.law_firm_id
  if (!lawFirmId) {
    return NextResponse.json({ error: 'Escritório não encontrado.' }, { status: 404 })
  }

  // Resolve responsible lawyer for message attribution
  let lawyerSenderId: string | undefined
  const { data: matterLinks } = await supabase
    .from('matter_contacts')
    .select('matter_id')
    .eq('contact_id', contact.id)
    .eq('law_firm_id', lawFirmId)
    .limit(1)

  const firstMatterId = matterLinks?.[0]?.matter_id
  if (firstMatterId) {
    const { data: matter } = await supabase
      .from('matters')
      .select('responsible_lawyer_id')
      .eq('id', firstMatterId)
      .single()
    lawyerSenderId = matter?.responsible_lawyer_id
  }

  if (!lawyerSenderId) {
    const { data: firmAdmin } = await supabase
      .from('users')
      .select('id')
      .eq('law_firm_id', lawFirmId)
      .in('user_type', ['admin', 'lawyer'])
      .limit(1)
      .single()
    lawyerSenderId = firmAdmin?.id
  }

  // Parallelize firm name + AI conversation resolution
  const [firmResult, aiConversationId] = await Promise.all([
    supabase.from('law_firms').select('name').eq('id', lawFirmId).single(),
    resolveOrCreateAIConversation(supabase, profile.id, lawFirmId, 'Portal', query),
  ])

  const firmName = firmResult.data?.name || 'Prima Facie'

  if (!aiConversationId) {
    return NextResponse.json({ error: 'Erro ao criar conversa AI' }, { status: 500 })
  }

  const clientName = contact.contact_type === 'company'
    ? (contact.company_name || contact.full_name || 'Cliente')
    : (contact.full_name || 'Cliente')

  // Build client Q&A system prompt
  const systemPrompt = buildClientQAPrompt({ firmName, clientName })

  // Get client-scoped tools
  const tools = getClientTools(supabase, lawFirmId, contact.id)

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

    // Log messages, increment tokens, and insert EVA response (all non-blocking)
    const insertPromises: Promise<unknown>[] = [
      logAIMessages(supabase, {
        conversationId: aiConversationId,
        lawFirmId,
        query,
        assistantContent,
        tokensInput,
        tokensOutput,
        sourceType: 'client_portal',
      }),
      incrementConversationTokens(supabase, aiConversationId, tokensInput, tokensOutput),
    ]

    // Insert EVA's response as a message from the firm (server-side to bypass RLS)
    if (assistantContent.trim() && lawyerSenderId) {
      insertPromises.push(
        supabase.from('messages').insert({
          content: assistantContent,
          contact_id: contact.id,
          law_firm_id: lawFirmId,
          sender_id: lawyerSenderId,
          sender_type: 'user',
          message_type: 'text',
          status: 'sent',
        }).then(({ error }) => {
          if (error) console.error('[client-qa] Failed to insert EVA message:', error.message)
        })
      )
    }

    await Promise.all(insertPromises)

    return NextResponse.json({ content: assistantContent })
  } catch (err) {
    console.error('[client-qa] AI generation failed:', {
      userId: profile.id,
      error: err instanceof Error ? err.message : err,
    })
    return NextResponse.json({ error: 'Erro ao processar mensagem. Tente novamente.' }, { status: 500 })
  }
}
