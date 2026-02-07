'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '@/components/providers'
import type {
  Conversation,
  ConversationInsert,
  ConversationParticipantInsert,
  Message,
  MessageInsert,
} from '@/types/database'

// =====================================================
// Conversation Queries
// =====================================================

export function useConversations(lawFirmId?: string | null, userId?: string | null) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: ['conversations', lawFirmId, userId],
    queryFn: async () => {
      // Get conversations where user is a participant
      const { data: participantRows, error: pError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId!)

      if (pError) throw pError

      const conversationIds = (participantRows || []).map(r => r.conversation_id)

      if (conversationIds.length === 0) {
        // Staff can also see all firm conversations
        const { data, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('law_firm_id', lawFirmId!)
          .order('last_message_at', { ascending: false, nullsFirst: false })

        if (error) throw error
        return (data || []) as Conversation[]
      }

      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('law_firm_id', lawFirmId!)
        .order('last_message_at', { ascending: false, nullsFirst: false })

      if (error) throw error
      return (data || []) as Conversation[]
    },
    enabled: !!lawFirmId && !!userId,
  })
}

export function useConversationMessages(conversationId?: string | null) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: ['conversation-messages', conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:users!messages_sender_id_fkey(id, first_name, last_name, full_name, email, avatar_url)
        `)
        .eq('conversation_id', conversationId!)
        .order('created_at', { ascending: true })

      if (error) throw error
      return (data || []) as (Message & { sender?: { id: string; first_name: string; last_name: string; full_name?: string; email: string; avatar_url?: string } })[]
    },
    enabled: !!conversationId,
  })
}

// =====================================================
// Conversation Mutations
// =====================================================

export function useSendMessage() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (message: MessageInsert) => {
      const { data, error } = await supabase
        .from('messages')
        .insert(message)
        .select()
        .single()

      if (error) throw error
      return data as Message
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversation-messages', data.conversation_id] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

export function useCreateConversation() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      conversation,
      participants,
    }: {
      conversation: ConversationInsert
      participants: Omit<ConversationParticipantInsert, 'conversation_id'>[]
    }) => {
      // Create conversation
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .insert(conversation)
        .select()
        .single()

      if (convError) throw convError

      // Add participants
      if (participants.length > 0) {
        const participantRows = participants.map(p => ({
          ...p,
          conversation_id: conv.id,
        }))

        const { error: partError } = await supabase
          .from('conversation_participants')
          .insert(participantRows)

        if (partError) throw partError
      }

      return conv as Conversation
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

export function useMarkAsRead() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      conversationId,
      userId,
    }: {
      conversationId: string
      userId: string
    }) => {
      const { error } = await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

export function useArchiveConversation() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { data, error } = await supabase
        .from('conversations')
        .update({ status: 'archived' })
        .eq('id', conversationId)
        .select()
        .single()

      if (error) throw error
      return data as Conversation
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}
