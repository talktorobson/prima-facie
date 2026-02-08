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
      if (!lawFirmId || !userId) throw new Error('Missing lawFirmId or userId')

      // Single query: get conversations where user is a participant via !inner JOIN
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id, law_firm_id, title, conversation_type, priority, topic, status,
          matter_id, contact_id, last_message_at, last_message_preview, created_at, updated_at,
          participants:conversation_participants!inner(user_id)
        `)
        .eq('law_firm_id', lawFirmId)
        .eq('participants.user_id', userId)
        .order('last_message_at', { ascending: false, nullsFirst: false })

      if (error) throw error
      return (data || []) as Conversation[]
    },
    enabled: !!lawFirmId && !!userId,
  })
}

const MESSAGE_PAGE_SIZE = 50

export function useConversationMessages(conversationId?: string | null) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: ['conversation-messages', conversationId],
    queryFn: async () => {
      if (!conversationId) throw new Error('Missing conversationId')

      const { data, error } = await supabase
        .from('messages')
        .select(`
          id, conversation_id, content, message_type, sender_id, sender_type,
          parent_message_id, status, attachments,
          created_at, updated_at,
          sender:users!messages_sender_id_fkey(id, first_name, last_name, full_name, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(MESSAGE_PAGE_SIZE)

      if (error) throw error
      // Reverse to show oldest-first in UI
      return ((data || []) as (Message & { sender?: { id: string; first_name: string; last_name: string; full_name?: string; avatar_url?: string } })[]).reverse()
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
      // Invalidate messages for this conversation only
      queryClient.invalidateQueries({ queryKey: ['conversation-messages', data.conversation_id] })
      // Don't invalidate conversations list — useConversationListRealtime handles it
      // via the DB trigger that updates conversations.last_message_at
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
