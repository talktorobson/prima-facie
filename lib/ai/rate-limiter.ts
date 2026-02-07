import type { SupabaseClient } from '@supabase/supabase-js'
import { AI_CONFIG } from './config'

interface RateLimitResult {
  allowed: boolean
  error?: string
  remaining?: number
}

export async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string
): Promise<RateLimitResult> {
  const now = new Date()

  // Get user's conversation IDs first
  const { data: conversations } = await supabase
    .from('ai_conversations')
    .select('id')
    .eq('user_id', userId)

  if (!conversations?.length) {
    return { allowed: true, remaining: AI_CONFIG.rateLimits.messagesPerDay }
  }

  const conversationIds = conversations.map((c) => c.id)

  // Check per-minute limit
  const oneMinuteAgo = new Date(now.getTime() - 60_000).toISOString()
  const { count: minuteCount } = await supabase
    .from('ai_messages')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'user')
    .gte('created_at', oneMinuteAgo)
    .in('conversation_id', conversationIds)

  if ((minuteCount ?? 0) >= AI_CONFIG.rateLimits.messagesPerMinute) {
    return {
      allowed: false,
      error: `Limite de ${AI_CONFIG.rateLimits.messagesPerMinute} mensagens por minuto atingido. Aguarde um momento.`,
    }
  }

  // Check per-day limit
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const { count: dayCount } = await supabase
    .from('ai_messages')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'user')
    .gte('created_at', startOfDay)
    .in('conversation_id', conversationIds)

  if ((dayCount ?? 0) >= AI_CONFIG.rateLimits.messagesPerDay) {
    return {
      allowed: false,
      error: `Limite de ${AI_CONFIG.rateLimits.messagesPerDay} mensagens por dia atingido. Tente novamente amanhã.`,
    }
  }

  return {
    allowed: true,
    remaining: AI_CONFIG.rateLimits.messagesPerDay - (dayCount ?? 0),
  }
}
