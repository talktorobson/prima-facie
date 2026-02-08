import type { SupabaseClient } from '@supabase/supabase-js'
import { AI_CONFIG } from '@/lib/ai/config'

/**
 * Resolves or creates an AI conversation for logging, scoped by title prefix
 * to prevent cross-context bleed between widget, ghost-write, portal, and proactive contexts.
 */
export async function resolveOrCreateAIConversation(
  supabase: SupabaseClient,
  userId: string,
  lawFirmId: string,
  titlePrefix: string,
  firstQuery: string,
): Promise<string | null> {
  const { data: existingConv } = await supabase
    .from('ai_conversations')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .like('title', `${titlePrefix}:%`)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  if (existingConv) return existingConv.id

  const { data: newConv, error: convError } = await supabase
    .from('ai_conversations')
    .insert({
      law_firm_id: lawFirmId,
      user_id: userId,
      title: `${titlePrefix}: ${firstQuery.slice(0, 80)}`,
      status: 'active',
      provider: AI_CONFIG.defaultProvider,
      model: AI_CONFIG.defaultModel,
    })
    .select('id')
    .single()

  if (convError || !newConv) {
    console.error(`[AI] Failed to create ${titlePrefix} conversation:`, convError?.message)
    return null
  }

  return newConv.id
}

/**
 * Atomically increments token usage on an AI conversation.
 * Uses read-then-update since Supabase JS doesn't support SQL expressions in update.
 * Non-critical — logs errors but doesn't throw.
 */
export async function incrementConversationTokens(
  supabase: SupabaseClient,
  conversationId: string,
  tokensInput: number,
  tokensOutput: number,
): Promise<void> {
  const { data: currentConv } = await supabase
    .from('ai_conversations')
    .select('total_tokens_used')
    .eq('id', conversationId)
    .single()

  const { error } = await supabase
    .from('ai_conversations')
    .update({
      total_tokens_used: (currentConv?.total_tokens_used || 0) + tokensInput + tokensOutput,
    })
    .eq('id', conversationId)

  if (error) {
    console.error('[AI] Failed to increment token count:', error.message)
  }
}

/**
 * Logs user + assistant messages to ai_messages. Non-critical — logs errors but doesn't throw.
 */
export async function logAIMessages(
  supabase: SupabaseClient,
  params: {
    conversationId: string
    lawFirmId: string
    query: string
    assistantContent: string
    tokensInput: number
    tokensOutput: number
    sourceType: string
    sourceConversationId?: string
  },
): Promise<void> {
  const { error: userErr } = await supabase.from('ai_messages').insert({
    conversation_id: params.conversationId,
    law_firm_id: params.lawFirmId,
    role: 'user',
    content: params.query,
    source_type: params.sourceType,
    ...(params.sourceConversationId && { source_conversation_id: params.sourceConversationId }),
  })
  if (userErr) console.error('[AI] Failed to log user message:', userErr.message)

  const { error: assistantErr } = await supabase.from('ai_messages').insert({
    conversation_id: params.conversationId,
    law_firm_id: params.lawFirmId,
    role: 'assistant',
    content: params.assistantContent,
    tokens_input: params.tokensInput,
    tokens_output: params.tokensOutput,
    source_type: params.sourceType,
    ...(params.sourceConversationId && { source_conversation_id: params.sourceConversationId }),
  })
  if (assistantErr) console.error('[AI] Failed to log assistant message:', assistantErr.message)
}
