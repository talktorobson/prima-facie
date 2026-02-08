'use client'

import { useQuery } from '@tanstack/react-query'
import { useSupabase } from '@/components/providers'

export interface MessageSearchResult {
  id: string
  content: string
  sender_type?: string
  created_at: string
}

export function useMessageSearch(conversationId?: string | null, query?: string) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: ['message-search', conversationId, query],
    queryFn: async () => {
      if (!conversationId || !query) return []

      const { data, error } = await supabase
        .from('messages')
        .select('id, content, sender_type, created_at')
        .eq('conversation_id', conversationId)
        .ilike('content', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      return (data || []) as MessageSearchResult[]
    },
    enabled: !!conversationId && !!query && query.length >= 2,
  })
}
