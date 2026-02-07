'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSupabase } from '@/components/providers'
import { useQueryClient } from '@tanstack/react-query'
import type { Message, Conversation } from '@/types/database'

// Re-export types used by components
export type { Message, Conversation } from '@/types/database'

// =====================================================
// Typing Indicator Types
// =====================================================

export interface TypingIndicator {
  user_id: string
  user_name: string
  is_typing: boolean
  timestamp: string
}

// =====================================================
// useConversationRealtime
// Subscribes to new messages in a conversation via postgres_changes
// =====================================================

export function useConversationRealtime(conversationId?: string | null) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!conversationId) return

    const channel = supabase
      .channel(`conversation-messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message
          queryClient.setQueryData(
            ['conversation-messages', conversationId],
            (old: Message[] | undefined) => {
              if (!old) return [newMessage]
              // Avoid duplicates
              if (old.some(m => m.id === newMessage.id)) return old
              return [...old, newMessage]
            }
          )
          // Also refresh conversation list (for last_message_preview)
          queryClient.invalidateQueries({ queryKey: ['conversations'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, supabase, queryClient])
}

// =====================================================
// useConversationListRealtime
// Subscribes to conversation updates for the law firm
// =====================================================

export function useConversationListRealtime(lawFirmId?: string | null) {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!lawFirmId) return

    const channel = supabase
      .channel(`conversations:${lawFirmId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `law_firm_id=eq.${lawFirmId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['conversations'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [lawFirmId, supabase, queryClient])
}

// =====================================================
// useTypingBroadcast
// Broadcasts / receives typing indicators via Supabase broadcast
// =====================================================

export function useTypingBroadcast(conversationId?: string | null, userId?: string, userName?: string) {
  const supabase = useSupabase()
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([])
  const typingTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!conversationId) return

    const channel = supabase.channel(`typing:${conversationId}`)
    channelRef.current = channel

    channel
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const indicator = payload as TypingIndicator
        // Ignore own typing
        if (indicator.user_id === userId) return

        if (indicator.is_typing) {
          setTypingUsers(prev => {
            const exists = prev.find(t => t.user_id === indicator.user_id)
            if (exists) return prev.map(t => t.user_id === indicator.user_id ? indicator : t)
            return [...prev, indicator]
          })

          // Auto-clear after 4 seconds
          const existing = typingTimeoutsRef.current.get(indicator.user_id)
          if (existing) clearTimeout(existing)
          const timeout = setTimeout(() => {
            setTypingUsers(prev => prev.filter(t => t.user_id !== indicator.user_id))
            typingTimeoutsRef.current.delete(indicator.user_id)
          }, 4000)
          typingTimeoutsRef.current.set(indicator.user_id, timeout)
        } else {
          setTypingUsers(prev => prev.filter(t => t.user_id !== indicator.user_id))
          const existing = typingTimeoutsRef.current.get(indicator.user_id)
          if (existing) {
            clearTimeout(existing)
            typingTimeoutsRef.current.delete(indicator.user_id)
          }
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
      typingTimeoutsRef.current.forEach(t => clearTimeout(t))
      typingTimeoutsRef.current.clear()
    }
  }, [conversationId, userId, supabase])

  const sendTyping = useCallback((isTyping: boolean) => {
    if (!channelRef.current || !userId || !userName) return

    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        user_id: userId,
        user_name: userName,
        is_typing: isTyping,
        timestamp: new Date().toISOString(),
      } satisfies TypingIndicator,
    })
  }, [userId, userName])

  return { sendTyping, typingUsers }
}

// =====================================================
// Utility Functions (preserved from original)
// =====================================================

export const formatMessageTime = (timestamp: string): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInHours = diffInMs / (1000 * 60 * 60)

  if (diffInHours < 24) {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  } else if (diffInHours < 24 * 7) {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  } else {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

export const isMessageFromCurrentUser = (
  message: Message,
  currentUserId: string
): boolean => {
  return message.sender_id === currentUserId
}
