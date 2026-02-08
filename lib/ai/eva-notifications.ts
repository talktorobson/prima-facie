import { generateText, stepCountIs } from 'ai'
import { getProvider } from '@/lib/ai/providers'
import { createAdminClient } from '@/lib/supabase/admin'
import { AI_CONFIG } from '@/lib/ai/config'

export interface NotificationEvent {
  eventType: string
  lawFirmId: string
  matterId?: string
  contactId?: string
  metadata: Record<string, unknown>
}

export const VALID_EVENT_TYPES = [
  'matter_status_change',
  'new_document',
  'upcoming_deadline',
  'invoice_created',
  'task_completed',
] as const

const EVENT_PROMPTS: Record<string, string> = {
  matter_status_change: 'Informe o cliente que o status do processo foi alterado. Mencione o nome do processo e o novo status. Seja breve e profissional.',
  new_document: 'Informe o cliente que um novo documento foi adicionado ao processo. Mencione o nome do documento se disponivel.',
  upcoming_deadline: 'Informe o cliente que ha um prazo se aproximando no processo. Mencione a data e o tipo de evento.',
  invoice_created: 'Informe o cliente que uma nova fatura foi emitida. Mencione o valor e a data de vencimento.',
  task_completed: 'Informe o cliente que uma tarefa relacionada ao processo foi concluida.',
}

const MAX_METADATA_VALUE_LENGTH = 500

function sanitizeMetadata(metadata: Record<string, unknown>): Record<string, string> {
  const sanitized: Record<string, string> = {}
  for (const [key, value] of Object.entries(metadata)) {
    const safeKey = String(key).slice(0, 50).replace(/[\n\r]/g, ' ')
    const safeValue = String(value ?? '').slice(0, MAX_METADATA_VALUE_LENGTH).replace(/[\n\r]/g, ' ')
    sanitized[safeKey] = safeValue
  }
  return sanitized
}

export async function processEvaNotification(event: NotificationEvent): Promise<void> {
  const supabase = createAdminClient()

  // 1. Check if event type is enabled for this firm
  const { data: firm } = await supabase
    .from('law_firms')
    .select('name, features')
    .eq('id', event.lawFirmId)
    .single()

  if (!firm) return

  const features = (firm.features || {}) as Record<string, unknown>
  const evaConfig = (features.eva_notifications || {}) as Record<string, boolean>

  if (!evaConfig[event.eventType]) return // Event type is disabled

  // 2. Resolve the contact
  let contactId = event.contactId
  if (!contactId && event.matterId) {
    const { data: matterContact } = await supabase
      .from('matter_contacts')
      .select('contact_id')
      .eq('matter_id', event.matterId)
      .eq('law_firm_id', event.lawFirmId)
      .limit(1)
      .single()

    if (!matterContact) return
    contactId = matterContact.contact_id
  }

  if (!contactId) return

  // 3. Find the responsible lawyer for sender attribution
  let lawyerUserId: string | undefined
  if (event.matterId) {
    const { data: matter } = await supabase
      .from('matters')
      .select('responsible_lawyer_id')
      .eq('id', event.matterId)
      .single()

    lawyerUserId = matter?.responsible_lawyer_id
  }

  // Fallback: get any admin user from the firm
  if (!lawyerUserId) {
    const { data: adminUser } = await supabase
      .from('users')
      .select('id')
      .eq('law_firm_id', event.lawFirmId)
      .in('user_type', ['admin', 'lawyer'])
      .limit(1)
      .single()

    lawyerUserId = adminUser?.id
  }

  if (!lawyerUserId) return

  // 4. Find or create a conversation with the contact
  let conversationId: string
  const { data: existingConv } = await supabase
    .from('conversations')
    .select('id')
    .eq('law_firm_id', event.lawFirmId)
    .eq('contact_id', contactId)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  if (existingConv) {
    conversationId = existingConv.id
  } else {
    // Get contact name for conversation title
    const { data: contact } = await supabase
      .from('contacts')
      .select('full_name, company_name')
      .eq('id', contactId)
      .single()

    const contactName = contact?.full_name || contact?.company_name || 'Cliente'

    const { data: newConv, error: convError } = await supabase
      .from('conversations')
      .insert({
        law_firm_id: event.lawFirmId,
        title: `Conversa com ${contactName}`,
        contact_id: contactId,
        conversation_type: 'chat',
        status: 'active',
      })
      .select('id')
      .single()

    if (convError || !newConv) return
    conversationId = newConv.id
  }

  // 5. Build context for the notification prompt
  const eventPrompt = EVENT_PROMPTS[event.eventType] || 'Envie uma notificacao relevante ao cliente.'
  const safeMetadata = sanitizeMetadata(event.metadata)
  const metadataContext = Object.entries(safeMetadata)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n')

  const systemPrompt = `Voce e EVA, assistente do escritorio "${firm.name}".
Voce esta enviando uma notificacao automatica para um cliente.
O cliente vera esta mensagem como enviada pelo advogado responsavel.
NAO mencione que voce e uma IA.
Seja breve, profissional e acolhedor(a).
Responda em portugues brasileiro.
NAO use formatacao Markdown.

Tarefa: ${eventPrompt}

Dados do evento:
${metadataContext}`

  try {
    const result = await generateText({
      model: getProvider(),
      system: systemPrompt,
      messages: [{ role: 'user', content: 'Gere a mensagem de notificacao.' }],
      maxOutputTokens: 500,
      temperature: 0.7,
      stopWhen: stepCountIs(1),
    })

    const messageContent = result.text || ''
    if (!messageContent.trim()) return

    // 6. Insert as message in conversation
    await supabase.from('messages').insert({
      law_firm_id: event.lawFirmId,
      conversation_id: conversationId,
      content: messageContent,
      message_type: 'text',
      sender_id: lawyerUserId,
      sender_type: 'user',
      status: 'sent',
    })

    // 7. Log to ai_messages
    // Find or create an AI conversation for proactive logs
    let aiConvId: string
    const { data: aiConv } = await supabase
      .from('ai_conversations')
      .select('id')
      .eq('user_id', lawyerUserId)
      .eq('law_firm_id', event.lawFirmId)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (aiConv) {
      aiConvId = aiConv.id
    } else {
      const { data: newAiConv } = await supabase
        .from('ai_conversations')
        .insert({
          law_firm_id: event.lawFirmId,
          user_id: lawyerUserId,
          title: `Notificacoes proativas`,
          status: 'active',
          provider: AI_CONFIG.defaultProvider,
          model: AI_CONFIG.defaultModel,
        })
        .select('id')
        .single()

      if (!newAiConv) return
      aiConvId = newAiConv.id
    }

    const tokensInput = result.usage?.inputTokens || 0
    const tokensOutput = result.usage?.outputTokens || 0

    await supabase.from('ai_messages').insert({
      conversation_id: aiConvId,
      law_firm_id: event.lawFirmId,
      role: 'assistant',
      content: messageContent,
      tokens_input: tokensInput,
      tokens_output: tokensOutput,
      source_type: 'proactive',
      source_conversation_id: conversationId,
    })
  } catch (err) {
    console.error('[EVA Notifications] Failed to process event:', {
      eventType: event.eventType,
      lawFirmId: event.lawFirmId,
      matterId: event.matterId,
      error: err instanceof Error ? err.message : err,
    })
  }
}
