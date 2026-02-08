// Chat Notifications Service
// Handles message notifications, status indicators, and real-time alerts

import { createClient } from '@/lib/supabase/client'
import type { Message, Conversation } from '@/types/database'

const supabase = createClient()

export interface NotificationPreference {
  id: string
  user_id?: string
  client_id?: string
  email_notifications: boolean
  push_notifications: boolean
  whatsapp_notifications: boolean
  urgent_only: boolean
  business_hours_only: boolean
  created_at: string
  updated_at: string
}

export interface ChatNotification {
  id: string
  recipient_user_id?: string
  recipient_client_id?: string
  conversation_id: string
  message_id: string
  notification_type: 'new_message' | 'mention' | 'urgent' | 'whatsapp' | 'status_update'
  title: string
  content: string
  is_read: boolean
  is_sent: boolean
  sent_via: ('email' | 'push' | 'whatsapp')[]
  created_at: string
  read_at?: string
}

export interface MessageStatus {
  message_id: string
  user_id?: string
  client_id?: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
  timestamp: string
}

class ChatNotificationService {
  // Send notification for new message
  async notifyNewMessage(
    message: Message,
    conversation: Conversation,
    recipientId: string,
    isRecipientClient: boolean = false
  ): Promise<void> {
    try {
      // Get recipient notification preferences
      const preferences = await this.getNotificationPreferences(recipientId, isRecipientClient)
      
      if (!preferences) {
        console.log('No notification preferences found for recipient:', recipientId)
        return
      }

      // Check if we should send notification (business hours, urgent only, etc.)
      if (!this.shouldSendNotification(message, conversation, preferences)) {
        return
      }

      // Create notification record
      const notification = await this.createNotification({
        recipient_user_id: isRecipientClient ? undefined : recipientId,
        recipient_client_id: isRecipientClient ? recipientId : undefined,
        conversation_id: conversation.id,
        message_id: message.id,
        notification_type: this.getNotificationType(message, conversation),
        title: this.getNotificationTitle(message, conversation),
        content: this.getNotificationContent(message, conversation)
      })

      // Send notifications via enabled channels
      const channels: ('email' | 'push' | 'whatsapp')[] = []
      
      if (preferences.email_notifications) {
        await this.sendEmailNotification(notification, preferences)
        channels.push('email')
      }
      
      if (preferences.push_notifications) {
        await this.sendPushNotification(notification, preferences)
        channels.push('push')
      }
      
      if (preferences.whatsapp_notifications && !isRecipientClient) {
        await this.sendWhatsAppNotification(notification, preferences)
        channels.push('whatsapp')
      }

      // Mark notification as sent
      await this.markNotificationAsSent(notification.id, channels)

      console.log('Notification sent successfully:', {
        notificationId: notification.id,
        channels,
        recipient: recipientId
      })
    } catch (error) {
      console.error('Error sending notification:', error)
    }
  }

  // Get notification preferences for user/client
  async getNotificationPreferences(
    userId: string,
    isClient: boolean = false
  ): Promise<NotificationPreference | null> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq(isClient ? 'client_id' : 'user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') { // Not found error
        console.error('Error fetching notification preferences:', error)
        return null
      }

      // Return default preferences if none found
      if (!data) {
        return this.getDefaultNotificationPreferences(userId, isClient)
      }

      return data
    } catch (error) {
      console.error('Error in getNotificationPreferences:', error)
      return null
    }
  }

  // Create default notification preferences
  private getDefaultNotificationPreferences(
    userId: string,
    isClient: boolean = false
  ): NotificationPreference {
    return {
      id: `default-${userId}`,
      user_id: isClient ? undefined : userId,
      client_id: isClient ? userId : undefined,
      email_notifications: true,
      push_notifications: true,
      whatsapp_notifications: false,
      urgent_only: false,
      business_hours_only: isClient, // Clients get notifications only during business hours by default
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  // Check if notification should be sent based on preferences and conditions
  private shouldSendNotification(
    message: Message,
    conversation: Conversation,
    preferences: NotificationPreference
  ): boolean {
    // Don't notify for system messages
    if (message.message_type === 'system') {
      return false
    }

    // Check urgent only preference
    if (preferences.urgent_only && conversation.priority !== 'urgent') {
      return false
    }

    // Check business hours preference
    if (preferences.business_hours_only && !this.isBusinessHours()) {
      return false
    }

    return true
  }

  // Check if current time is within business hours
  private isBusinessHours(): boolean {
    const now = new Date()
    const hour = now.getHours()
    const dayOfWeek = now.getDay()
    
    // Monday to Friday: 9 AM to 6 PM
    // Saturday: 9 AM to 12 PM
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      return hour >= 9 && hour < 18
    } else if (dayOfWeek === 6) {
      return hour >= 9 && hour < 12
    }
    
    return false
  }

  // Get notification type based on message and conversation
  private getNotificationType(
    message: Message,
    conversation: Conversation
  ): ChatNotification['notification_type'] {
    if (conversation.priority === 'urgent') {
      return 'urgent'
    }
    
    if (message.message_type === 'whatsapp') {
      return 'whatsapp'
    }
    
    // Check for mentions (simplified - in real app, parse message content)
    if (message.content.includes('@')) {
      return 'mention'
    }
    
    return 'new_message'
  }

  // Generate notification title
  private getNotificationTitle(
    message: Message,
    conversation: Conversation
  ): string {
    const senderName = 'Remetente' // In real app, get from message relations
    
    switch (conversation.priority) {
      case 'urgent':
        return `🔴 Mensagem Urgente - ${conversation.title}`
      case 'high':
        return `⚡ Mensagem Importante - ${conversation.title}`
      default:
        return `💬 Nova Mensagem - ${conversation.title}`
    }
  }

  // Generate notification content
  private getNotificationContent(
    message: Message,
    conversation: Conversation
  ): string {
    let content = message.content
    
    // Truncate long messages
    if (content.length > 100) {
      content = content.substring(0, 97) + '...'
    }
    
    // Add file indicator for non-text messages
    if (message.message_type === 'file') {
      content = `📎 Arquivo: ${message.file_name || 'Documento'}`
    } else if (message.message_type === 'image') {
      content = `🖼️ Imagem: ${message.file_name || 'Imagem'}`
    } else if (message.message_type === 'document') {
      content = `📄 Documento: ${message.file_name || 'Documento'}`
    }
    
    return content
  }

  // Create notification record in database
  private async createNotification(data: {
    recipient_user_id?: string
    recipient_client_id?: string
    conversation_id: string
    message_id: string
    notification_type: ChatNotification['notification_type']
    title: string
    content: string
  }): Promise<ChatNotification> {
    const { data: notification, error } = await supabase
      .from('chat_notifications')
      .insert({
        ...data,
        is_read: false,
        is_sent: false,
        sent_via: []
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return notification
  }

  // Send email notification
  private async sendEmailNotification(
    notification: ChatNotification,
    preferences: NotificationPreference
  ): Promise<void> {
    try {
      // In production, integrate with SendGrid or similar service
      console.log('Sending email notification:', {
        to: preferences.user_id || preferences.client_id,
        subject: notification.title,
        content: notification.content
      })
      
      // Mock email sending
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      console.error('Error sending email notification:', error)
    }
  }

  // Send push notification
  private async sendPushNotification(
    notification: ChatNotification,
    preferences: NotificationPreference
  ): Promise<void> {
    try {
      // In production, integrate with Firebase Cloud Messaging or similar
      console.log('Sending push notification:', {
        to: preferences.user_id || preferences.client_id,
        title: notification.title,
        body: notification.content
      })
      
      // Mock push notification
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      console.error('Error sending push notification:', error)
    }
  }

  // Send WhatsApp notification
  private async sendWhatsAppNotification(
    notification: ChatNotification,
    preferences: NotificationPreference
  ): Promise<void> {
    try {
      // In production, use WhatsApp Business API
      console.log('Sending WhatsApp notification:', {
        to: preferences.user_id,
        message: `${notification.title}\n\n${notification.content}`
      })
      
      // Mock WhatsApp notification
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      console.error('Error sending WhatsApp notification:', error)
    }
  }

  // Mark notification as sent
  private async markNotificationAsSent(
    notificationId: string,
    channels: ('email' | 'push' | 'whatsapp')[]
  ): Promise<void> {
    await supabase
      .from('chat_notifications')
      .update({
        is_sent: true,
        sent_via: channels
      })
      .eq('id', notificationId)
  }

  // Update message status
  async updateMessageStatus(
    messageId: string,
    userId: string,
    status: MessageStatus['status'],
    isClient: boolean = false
  ): Promise<void> {
    try {
      const statusData = {
        message_id: messageId,
        user_id: isClient ? undefined : userId,
        client_id: isClient ? userId : undefined,
        status,
        timestamp: new Date().toISOString()
      }

      await supabase
        .from('message_status')
        .upsert(statusData)

      console.log('Message status updated:', statusData)
    } catch (error) {
      console.error('Error updating message status:', error)
    }
  }

  // Get unread notifications for user
  async getUnreadNotifications(
    userId: string,
    isClient: boolean = false
  ): Promise<ChatNotification[]> {
    try {
      const { data, error } = await supabase
        .from('chat_notifications')
        .select(`
          *,
          conversation:conversations(*),
          message:messages(*)
        `)
        .eq(isClient ? 'recipient_client_id' : 'recipient_user_id', userId)
        .eq('is_read', false)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching unread notifications:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getUnreadNotifications:', error)
      return []
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await supabase
        .from('chat_notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Mark all notifications as read for user
  async markAllNotificationsAsRead(
    userId: string,
    isClient: boolean = false
  ): Promise<void> {
    try {
      await supabase
        .from('chat_notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq(isClient ? 'recipient_client_id' : 'recipient_user_id', userId)
        .eq('is_read', false)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  // Update notification preferences
  async updateNotificationPreferences(
    userId: string,
    preferences: Partial<NotificationPreference>,
    isClient: boolean = false
  ): Promise<void> {
    try {
      const updateData = {
        ...preferences,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          ...updateData,
          user_id: isClient ? undefined : userId,
          client_id: isClient ? userId : undefined
        })

      if (error) {
        throw error
      }

      console.log('Notification preferences updated:', updateData)
    } catch (error) {
      console.error('Error updating notification preferences:', error)
    }
  }
}

// Export singleton instance
export const chatNotificationService = new ChatNotificationService()

// Utility functions
export const getNotificationIcon = (type: ChatNotification['notification_type']): string => {
  switch (type) {
    case 'urgent':
      return '🔴'
    case 'mention':
      return '👤'
    case 'whatsapp':
      return '📱'
    case 'status_update':
      return '📊'
    default:
      return '💬'
  }
}

export const getNotificationColor = (type: ChatNotification['notification_type']): string => {
  switch (type) {
    case 'urgent':
      return 'text-red-600'
    case 'mention':
      return 'text-blue-600'
    case 'whatsapp':
      return 'text-green-600'
    case 'status_update':
      return 'text-gray-600'
    default:
      return 'text-gray-800'
  }
}

export const formatNotificationTime = (timestamp: string): string => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInMinutes = diffInMs / (1000 * 60)
  
  if (diffInMinutes < 1) {
    return 'agora'
  } else if (diffInMinutes < 60) {
    return `${Math.floor(diffInMinutes)}min`
  } else if (diffInMinutes < 24 * 60) {
    return `${Math.floor(diffInMinutes / 60)}h`
  } else {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    })
  }
}