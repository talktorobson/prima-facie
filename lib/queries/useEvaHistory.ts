'use client'

import { useQuery } from '@tanstack/react-query'
import { useSupabase } from '@/components/providers'

export interface EvaHistoryItem {
  id: string
  content: string | null
  message_type?: string
  sender_type?: string
  created_at: string
}

export function useEvaHistory(conversationId?: string | null) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: ['eva-history', conversationId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('id, content, message_type, sender_type, created_at')
          .eq('conversation_id', conversationId!)
          .eq('sender_type', 'ai')
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) throw error
        return (data || []) as EvaHistoryItem[]
      } catch {
        return []
      }
    },
    enabled: !!conversationId,
  })
}
