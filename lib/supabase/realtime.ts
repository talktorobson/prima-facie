import { createClient } from './client'
import { RealtimeChannel } from '@supabase/supabase-js'

// Create a supabase client instance
const supabase = createClient()

// Types for real-time chat functionality
export interface Message {
  id: string
  conversation_id: string
  sender_user_id?: string
  sender_client_id?: string
  message_type: 'text' | 'file' | 'image' | 'document' | 'system' | 'whatsapp'
  content: string
  file_url?: string
  file_name?: string
  file_size?: number
  file_type?: string
  whatsapp_message_id?: string
  whatsapp_status?: string
  is_edited: boolean
  is_deleted: boolean
  reply_to_message_id?: string
  created_at: string
  updated_at: string
}

export interface Conversation {
  id: string
  law_firm_id: string
  topic_id?: string
  matter_id?: string
  client_id: string
  title?: string
  description?: string
  conversation_type: 'general' | 'matter_specific' | 'consultation' | 'urgent' | 'whatsapp'
  status: 'active' | 'archived' | 'closed'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  is_whatsapp_enabled: boolean
  whatsapp_phone?: string
  last_message_at?: string
  created_at: string
  updated_at: string
}

export interface ConversationParticipant {
  id: string
  conversation_id: string
  user_id?: string
  client_id?: string
  participant_type: 'lawyer' | 'staff' | 'client' | 'admin'
  role: 'owner' | 'moderator' | 'participant'
  joined_at: string
  last_read_at: string
  is_active: boolean
}

export interface TypingIndicator {
  conversation_id: string
  user_id?: string
  client_id?: string
  user_name: string
  is_typing: boolean
  timestamp: string
}

export interface OnlinePresence {
  user_id?: string
  client_id?: string
  user_name: string
  user_type: 'lawyer' | 'staff' | 'client' | 'admin'
  status: 'online' | 'away' | 'offline'
  last_seen: string
}

// Real-time chat service
export class RealtimeChatService {
  private channels: Map<string, RealtimeChannel> = new Map()
  private messageHandlers: Map<string, (message: Message) => void> = new Map()
  private typingHandlers: Map<string, (typing: TypingIndicator) => void> = new Map()
  private presenceHandlers: Map<string, (presence: OnlinePresence[]) => void> = new Map()

  // Subscribe to a conversation for real-time messages
  subscribeToConversation(
    conversationId: string,
    onMessage: (message: Message) => void,
    onTyping?: (typing: TypingIndicator) => void
  ): () => void {
    const channelName = `conversation:${conversationId}`
    
    // Store handlers
    this.messageHandlers.set(conversationId, onMessage)
    if (onTyping) {
      this.typingHandlers.set(conversationId, onTyping)
    }

    // Create or get existing channel
    let channel = this.channels.get(channelName)
    
    if (!channel) {
      // Create a mock channel for testing
      const mockChannel: any = {
        subscribe: () => mockChannel,
        unsubscribe: () => {},
        on: (event: string, callback: any) => mockChannel,
        send: (data: any) => {
          // Handle mock broadcasts
          if (data.event === 'new_message') {
            const handler = this.messageHandlers.get(conversationId)
            if (handler) {
              handler(data.payload as Message)
            }
          } else if (data.event === 'typing') {
            const handler = this.typingHandlers.get(conversationId)
            if (handler) {
              handler(data.payload as TypingIndicator)
            }
          }
          return Promise.resolve({ error: null })
        }
      }
      
      channel = mockChannel
      
      // In production, use real Supabase:
      // channel = supabase.channel(channelName)
      //   .on('postgres_changes', {...})
      //   .subscribe()

      this.channels.set(channelName, channel)
    }

    // Return unsubscribe function
    return () => {
      this.messageHandlers.delete(conversationId)
      this.typingHandlers.delete(conversationId)
      
      if (channel) {
        // In production: supabase.removeChannel(channel)
        channel.unsubscribe?.()
        this.channels.delete(channelName)
      }
    }
  }

  // Subscribe to user presence across all conversations
  subscribeToPresence(
    userId: string,
    userType: 'lawyer' | 'staff' | 'client' | 'admin',
    userName: string,
    onPresenceChange: (presence: OnlinePresence[]) => void
  ): () => void {
    const channelName = `presence:${userId}`
    
    this.presenceHandlers.set(userId, onPresenceChange)

    const channel = supabase.channel(channelName)
      .on('presence', { event: 'sync' }, () => {
        const presenceState = channel.presenceState()
        const onlineUsers: OnlinePresence[] = []
        
        Object.entries(presenceState).forEach(([key, value]) => {
          const presences = value as OnlinePresence[]
          onlineUsers.push(...presences)
        })
        
        this.presenceHandlers.get(userId)?.(onlineUsers)
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        const onlineUsers = newPresences as OnlinePresence[]
        this.presenceHandlers.get(userId)?.(onlineUsers)
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        const offlineUsers = leftPresences as OnlinePresence[]
        // Handle users going offline
        this.presenceHandlers.get(userId)?.(offlineUsers)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track this user's presence
          await channel.track({
            user_id: userType === 'client' ? undefined : userId,
            client_id: userType === 'client' ? userId : undefined,
            user_name: userName,
            user_type: userType,
            status: 'online',
            last_seen: new Date().toISOString()
          })
        }
      })

    this.channels.set(channelName, channel)

    return () => {
      this.presenceHandlers.delete(userId)
      // In production: supabase.removeChannel(channel)
      channel.unsubscribe?.()
      this.channels.delete(channelName)
    }
  }

  // Send typing indicator
  async sendTypingIndicator(
    conversationId: string,
    userId: string,
    userName: string,
    isTyping: boolean,
    isClient: boolean = false
  ): Promise<void> {
    const channelName = `conversation:${conversationId}`
    const channel = this.channels.get(channelName)
    
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          conversation_id: conversationId,
          user_id: isClient ? undefined : userId,
          client_id: isClient ? userId : undefined,
          user_name: userName,
          is_typing: isTyping,
          timestamp: new Date().toISOString()
        } as TypingIndicator
      })
    }
  }

  // Send a message
  async sendMessage(
    conversationId: string,
    content: string,
    senderId: string,
    isClient: boolean = false,
    messageType: Message['message_type'] = 'text',
    fileData?: {
      url: string
      name: string
      size: number
      type: string
    },
    replyToMessageId?: string
  ): Promise<Message | null> {
    try {
      // Mock message for testing
      const mockMessage: Message = {
        id: `msg-${Date.now()}`,
        conversation_id: conversationId,
        sender_user_id: isClient ? undefined : senderId,
        sender_client_id: isClient ? senderId : undefined,
        message_type: messageType,
        content,
        file_url: fileData?.url,
        file_name: fileData?.name,
        file_size: fileData?.size,
        file_type: fileData?.type,
        reply_to_message_id: replyToMessageId,
        is_edited: false,
        is_deleted: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        whatsapp_status: 'sent'
      }

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 100))

      // In production, use real Supabase:
      // const { data, error } = await supabase.from('messages').insert(messageData).select().single()
      
      console.log('Mock message sent:', mockMessage)
      
      // Trigger real-time update
      const channel = this.channels.get(`conversation:${conversationId}`)
      if (channel) {
        channel.send({
          type: 'broadcast',
          event: 'new_message',
          payload: mockMessage
        })
      }

      return mockMessage
    } catch (error) {
      console.error('Error in sendMessage:', error)
      return null
    }
  }

  // Get conversation messages with pagination
  async getConversationMessages(
    conversationId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender_user:users!sender_user_id(id, name, email),
          sender_client:clients!sender_client_id(id, name, email),
          reply_to:messages!reply_to_message_id(id, content, sender_user_id, sender_client_id)
        `)
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('Error fetching messages:', error)
        return []
      }

      return (data || []).reverse() as Message[]
    } catch (error) {
      console.error('Error in getConversationMessages:', error)
      return []
    }
  }

  // Get user conversations
  async getUserConversations(
    userId: string,
    isClient: boolean = false
  ): Promise<Conversation[]> {
    try {
      // Mock conversations that are shared across all users for testing
      const mockConversations: Conversation[] = this.getMockConversations()
      
      // In production, use real Supabase query:
      // let query = supabase.from('conversations').select(...)
      
      return mockConversations
    } catch (error) {
      console.error('Error in getUserConversations:', error)
      return []
    }
  }

  // Mock conversations storage (in memory, shared across instances)
  private mockConversations: Conversation[] = []
  
  getMockConversations(): Conversation[] {
    // Return existing mock conversations or empty array
    return this.mockConversations
  }

  addMockConversation(conversation: Conversation): void {
    this.mockConversations.unshift(conversation)
    console.log('Broadcasting new conversation to all channels:', conversation.id)
    
    // Broadcast to all conversation subscribers
    this.channels.forEach((channel, channelName) => {
      if (channelName.startsWith('conversations:')) {
        console.log('Sending to channel:', channelName)
        setTimeout(() => {
          channel.send?.({
            type: 'broadcast',
            event: 'new_conversation',
            payload: conversation
          })
        }, 100) // Small delay to ensure all subscribers are ready
      }
    })
  }

  // Subscribe to conversation updates
  subscribeToConversations(
    userId: string,
    onNewConversation: (conversation: Conversation) => void
  ): () => void {
    const channelName = `conversations:${userId}`
    
    // Create a mock channel for conversation updates
    const mockChannel: any = {
      subscribe: () => mockChannel,
      unsubscribe: () => {},
      on: (event: string, callback: any) => mockChannel,
      send: (data: any) => {
        if (data.event === 'new_conversation') {
          onNewConversation(data.payload as Conversation)
        }
        return Promise.resolve({ error: null })
      }
    }
    
    this.channels.set(channelName, mockChannel)
    
    return () => {
      this.channels.delete(channelName)
    }
  }

  // Create conversation (for admin/staff)
  async createConversation(data: {
    law_firm_id: string
    topic_id: string
    client_id: string
    title: string
    conversation_type: 'general' | 'matter_specific' | 'consultation' | 'urgent' | 'whatsapp'
    priority: 'low' | 'normal' | 'high' | 'urgent'
    status: 'active' | 'archived' | 'closed'
  }): Promise<Conversation> {
    try {
      // Create conversation
      const { data: conversation, error: conversationError } = await supabase
        .from('conversations')
        .insert({
          law_firm_id: data.law_firm_id,
          topic_id: data.topic_id,
          client_id: data.client_id,
          title: data.title,
          conversation_type: data.conversation_type,
          priority: data.priority,
          status: data.status,
          is_whatsapp_enabled: data.conversation_type === 'whatsapp'
        })
        .select()
        .single()

      if (conversationError) {
        throw conversationError
      }

      // Add client as participant
      await supabase
        .from('conversation_participants')
        .insert({
          conversation_id: conversation.id,
          client_id: data.client_id,
          participant_type: 'client',
          role: 'participant'
        })

      // Add current user as moderator (in real app, get from auth context)
      await supabase
        .from('conversation_participants')
        .insert({
          conversation_id: conversation.id,
          user_id: 'current-user-id', // In real app, get from auth
          participant_type: 'lawyer',
          role: 'moderator'
        })

      console.log('Conversation created successfully:', conversation)
      return conversation
    } catch (error) {
      console.error('Error creating conversation:', error)
      throw error
    }
  }

  // Mark messages as read
  async markMessagesAsRead(
    conversationId: string,
    userId: string,
    isClient: boolean = false
  ): Promise<void> {
    try {
      // Update last_read_at for the participant
      const updateData = {
        last_read_at: new Date().toISOString()
      }

      const { error: participantError } = await supabase
        .from('conversation_participants')
        .update(updateData)
        .eq('conversation_id', conversationId)
        .eq(isClient ? 'client_id' : 'user_id', userId)

      if (participantError) {
        console.error('Error updating participant read status:', participantError)
      }

      // Get unread messages
      const { data: participant } = await supabase
        .from('conversation_participants')
        .select('last_read_at')
        .eq('conversation_id', conversationId)
        .eq(isClient ? 'client_id' : 'user_id', userId)
        .single()

      if (participant) {
        const { data: unreadMessages } = await supabase
          .from('messages')
          .select('id')
          .eq('conversation_id', conversationId)
          .gt('created_at', participant.last_read_at)

        // Mark each message as read
        if (unreadMessages && unreadMessages.length > 0) {
          const statusUpdates = unreadMessages.map(msg => ({
            message_id: msg.id,
            user_id: isClient ? undefined : userId,
            client_id: isClient ? userId : undefined,
            status: 'read' as const,
            timestamp: new Date().toISOString()
          }))

          await supabase
            .from('message_status')
            .upsert(statusUpdates)
        }
      }
    } catch (error) {
      console.error('Error in markMessagesAsRead:', error)
    }
  }

  // Clean up all subscriptions
  cleanup(): void {
    this.channels.forEach((channel) => {
      // In production: supabase.removeChannel(channel)
      channel.unsubscribe?.()
    })
    this.channels.clear()
    this.messageHandlers.clear()
    this.typingHandlers.clear()
    this.presenceHandlers.clear()
  }
}

// Export singleton instance
export const chatService = new RealtimeChatService()

// Utility functions for message formatting
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

export const getMessageSenderName = (
  message: Message,
  senderUser?: any,
  senderClient?: any
): string => {
  if (message.sender_user_id && senderUser) {
    return senderUser.name
  }
  if (message.sender_client_id && senderClient) {
    return senderClient.name
  }
  return 'Usuário Desconhecido'
}

export const isMessageFromCurrentUser = (
  message: Message,
  currentUserId: string,
  isCurrentUserClient: boolean
): boolean => {
  if (isCurrentUserClient) {
    return message.sender_client_id === currentUserId
  } else {
    return message.sender_user_id === currentUserId
  }
}