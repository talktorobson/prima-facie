import { NextRequest, NextResponse } from 'next/server'
import { generateText, stepCountIs } from 'ai'
import { getProvider } from '@/lib/ai/providers'
import { verifyAIUser } from '@/lib/ai/verify-user'
import { buildClientQAPrompt } from '@/lib/ai/system-prompt'
import { checkRateLimit } from '@/lib/ai/rate-limiter'
import { getClientTools } from '@/lib/ai/tools/client-tools'
import { createAdminClient } from '@/lib/supabase/admin'
import { AI_CONFIG } from '@/lib/ai/config'

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
  if (!query?.trim()) {
    return NextResponse.json({ error: 'Query é obrigatória' }, { status: 400 })
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

  if (matterLinks?.length) {
    const { data: matter } = await supabase
      .from('matters')
      .select('responsible_lawyer_id')
      .eq('id', matterLinks[0].matter_id)
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

  // Fetch firm name
  let firmName = 'Prima Facie'
  const { data: firm } = await supabase
    .from('law_firms')
    .select('name')
    .eq('id', lawFirmId)
    .single()
  if (firm) firmName = firm.name

  const clientName = contact.contact_type === 'company'
    ? (contact.company_name || contact.full_name || 'Cliente')
    : (contact.full_name || 'Cliente')

  // Build client Q&A system prompt
  const systemPrompt = buildClientQAPrompt({ firmName, clientName })

  // Get client-scoped tools
  const tools = getClientTools(supabase, lawFirmId, contact.id)

  // Create or reuse AI conversation for logging (scoped to client_portal context)
  let aiConversationId: string
  const { data: existingConv } = await supabase
    .from('ai_conversations')
    .select('id')
    .eq('user_id', profile.id)
    .eq('status', 'active')
    .like('title', 'Portal:%')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  if (existingConv) {
    aiConversationId = existingConv.id
  } else {
    const { data: newConv, error: convError } = await supabase
      .from('ai_conversations')
      .insert({
        law_firm_id: lawFirmId,
        user_id: profile.id,
        title: `Portal: ${query.slice(0, 80)}`,
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

    // Log user query
    await supabase.from('ai_messages').insert({
      conversation_id: aiConversationId,
      law_firm_id: lawFirmId,
      role: 'user',
      content: query,
      source_type: 'client_portal',
    })

    // Log assistant response
    await supabase.from('ai_messages').insert({
      conversation_id: aiConversationId,
      law_firm_id: lawFirmId,
      role: 'assistant',
      content: assistantContent,
      tokens_input: tokensInput,
      tokens_output: tokensOutput,
      source_type: 'client_portal',
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

    // Insert EVA's response as a message from the firm (server-side to bypass RLS)
    if (assistantContent.trim() && lawyerSenderId) {
      await supabase.from('messages').insert({
        content: assistantContent,
        contact_id: contact.id,
        law_firm_id: lawFirmId,
        sender_id: lawyerSenderId,
        sender_type: 'user',
        message_type: 'text',
        status: 'sent',
      })
    }

    return NextResponse.json({ content: assistantContent })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erro ao processar mensagem'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
