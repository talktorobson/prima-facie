'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  PaperAirplaneIcon,
  PaperClipIcon,
  FaceSmileIcon,
  EllipsisVerticalIcon,
  UserIcon,
  PhoneIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline'
import { CheckIcon, CheckCheckIcon } from '@heroicons/react/24/solid'
import { chatService, Message, Conversation, TypingIndicator, formatMessageTime, isMessageFromCurrentUser } from '@/lib/supabase/realtime'
import MessageStatusIndicator from './message-status-indicator'
import { chatNotificationService } from '@/lib/notifications/chat-notifications'

interface ChatInterfaceProps {
  conversation: Conversation
  currentUserId: string
  currentUserName: string
  isClient?: boolean
  onClose?: () => void
}

interface MessageBubbleProps {
  message: Message
  isFromCurrentUser: boolean
  senderName: string
  showAvatar?: boolean
  showTime?: boolean
}

const MessageBubble = ({ message, isFromCurrentUser, senderName, showAvatar = true, showTime = true }: MessageBubbleProps) => {
  const getMessageStatus = () => {
    if (!isFromCurrentUser) return 'delivered'
    
    // Determine status based on message data
    if (message.whatsapp_status === 'read') return 'read'
    if (message.whatsapp_status === 'delivered') return 'delivered'
    if (message.whatsapp_status === 'sent') return 'sent'
    if (message.whatsapp_status === 'failed') return 'failed'
    
    return 'sent'
  }

  const renderMessageContent = () => {
    switch (message.message_type) {
      case 'file':
      case 'document':
        return (
          <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
            <PaperClipIcon className="h-4 w-4 text-gray-500" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {message.file_name || 'Documento'}
              </p>
              <p className="text-xs text-gray-500">
                {message.file_size ? `${(message.file_size / 1024).toFixed(1)} KB` : ''}
              </p>
            </div>
          </div>
        )
      case 'image':
        return (
          <div className="space-y-2">
            {message.file_url && (
              <img 
                src={message.file_url} 
                alt={message.file_name || 'Imagem'} 
                className="max-w-xs rounded-lg cursor-pointer hover:opacity-90"
                onClick={() => window.open(message.file_url, '_blank')}
              />
            )}
            {message.content && (
              <p className="text-sm">{message.content}</p>
            )}
          </div>
        )
      case 'system':
        return (
          <p className="text-sm italic text-gray-600 text-center">
            {message.content}
          </p>
        )
      default:
        return <p className="text-sm whitespace-pre-wrap">{message.content}</p>
    }
  }

  if (message.message_type === 'system') {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-gray-100 rounded-full px-3 py-1">
          {renderMessageContent()}
        </div>
      </div>
    )
  }

  return (
    <div className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex max-w-xs lg:max-w-md ${isFromCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {showAvatar && !isFromCurrentUser && (
          <div className="flex-shrink-0 mr-2">
            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
              <UserIcon className="h-5 w-5 text-gray-600" />
            </div>
          </div>
        )}
        
        <div className={`${isFromCurrentUser ? 'mr-2' : 'ml-2'}`}>
          {!isFromCurrentUser && showAvatar && (
            <p className="text-xs text-gray-500 mb-1">{senderName}</p>
          )}
          
          <div
            className={`rounded-lg px-3 py-2 ${
              isFromCurrentUser
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-900'
            }`}
          >
            {message.reply_to_message_id && (
              <div className="border-l-2 border-gray-300 pl-2 mb-2 opacity-75">
                <p className="text-xs">Respondendo a mensagem</p>
              </div>
            )}
            
            {renderMessageContent()}
            
            <div className={`flex items-center justify-end mt-1 space-x-1 ${
              isFromCurrentUser ? 'text-white/70' : 'text-gray-500'
            }`}>
              {showTime && (
                <span className="text-xs">{formatMessageTime(message.created_at)}</span>
              )}
              {isFromCurrentUser && (
                <MessageStatusIndicator
                  status={getMessageStatus() as any}
                  whatsappStatus={message.whatsapp_status}
                  isWhatsApp={!!message.whatsapp_message_id}
                  showTooltip={true}
                  size="sm"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const TypingIndicatorComponent = ({ typing }: { typing: TypingIndicator[] }) => {
  if (typing.length === 0) return null

  return (
    <div className="flex justify-start mb-4">
      <div className="flex max-w-xs">
        <div className="flex-shrink-0 mr-2">
          <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
            <UserIcon className="h-5 w-5 text-gray-600" />
          </div>
        </div>
        <div className="ml-2">
          <p className="text-xs text-gray-500 mb-1">
            {typing.map(t => t.user_name).join(', ')} está digitando...
          </p>
          <div className="bg-gray-100 rounded-lg px-3 py-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ChatInterface({ 
  conversation, 
  currentUserId, 
  currentUserName, 
  isClient = false,
  onClose 
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [typing, setTyping] = useState<TypingIndicator[]>([])
  const [isTyping, setIsTyping] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      setIsLoading(true)
      try {
        const initialMessages = await chatService.getConversationMessages(conversation.id)
        setMessages(initialMessages)
        
        // Mark messages as read
        await chatService.markMessagesAsRead(conversation.id, currentUserId, isClient)
      } catch (error) {
        console.error('Error loading messages:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadMessages()
  }, [conversation.id, currentUserId, isClient])

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = chatService.subscribeToConversation(
      conversation.id,
      (message: Message) => {
        setMessages(prev => {
          const exists = prev.find(m => m.id === message.id)
          if (exists) {
            // Update existing message (edit/delete)
            return prev.map(m => m.id === message.id ? message : m)
          } else {
            // New message
            return [...prev, message]
          }
        })
        
        // Mark as read if not from current user
        if (!isMessageFromCurrentUser(message, currentUserId, isClient)) {
          chatService.markMessagesAsRead(conversation.id, currentUserId, isClient)
        }
      },
      (typingIndicator: TypingIndicator) => {
        setTyping(prev => {
          const userId = typingIndicator.user_id || typingIndicator.client_id
          const existingIndex = prev.findIndex(t => 
            (t.user_id || t.client_id) === userId
          )
          
          if (typingIndicator.is_typing) {
            if (existingIndex >= 0) {
              return prev.map((t, i) => i === existingIndex ? typingIndicator : t)
            } else {
              return [...prev, typingIndicator]
            }
          } else {
            return prev.filter((_, i) => i !== existingIndex)
          }
        })
      }
    )

    return unsubscribe
  }, [conversation.id, currentUserId, isClient])

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Handle typing indicator
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true)
      chatService.sendTypingIndicator(
        conversation.id,
        currentUserId,
        currentUserName,
        true,
        isClient
      )
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      chatService.sendTypingIndicator(
        conversation.id,
        currentUserId,
        currentUserName,
        false,
        isClient
      )
    }, 3000)
  }

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    try {
      const sentMessage = await chatService.sendMessage(
        conversation.id,
        newMessage.trim(),
        currentUserId,
        isClient
      )
      
      // Send notifications to other participants
      if (sentMessage) {
        // In a real app, get actual participants from conversation
        const otherParticipants = [
          { id: 'other-user-id', isClient: !isClient }
        ]
        
        for (const participant of otherParticipants) {
          await chatNotificationService.notifyNewMessage(
            sentMessage,
            conversation,
            participant.id,
            participant.isClient
          )
        }
      }
      
      setNewMessage('')
      
      // Stop typing indicator
      setIsTyping(false)
      chatService.sendTypingIndicator(
        conversation.id,
        currentUserId,
        currentUserName,
        false,
        isClient
      )
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsSending(false)
    }
  }

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // In real implementation, upload file to storage and send message with file data
    console.log('File selected:', file)
    // TODO: Implement file upload
  }

  return (
    <div className="flex flex-col bg-white" style={{ height: '600px' }}>
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
            <UserIcon className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {conversation.title || 'Conversa'}
            </h3>
            <p className="text-sm text-gray-500">
              {conversation.conversation_type === 'whatsapp' && '📱 WhatsApp • '}
              {conversation.priority === 'urgent' && '🔴 Urgente • '}
              Online
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <PhoneIcon className="h-5 w-5" />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <VideoCameraIcon className="h-5 w-5" />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <EllipsisVerticalIcon className="h-5 w-5" />
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const prevMessage = messages[index - 1]
              const isFromSameUser = prevMessage && 
                prevMessage.sender_user_id === message.sender_user_id &&
                prevMessage.sender_client_id === message.sender_client_id
              
              const showAvatar = !isFromSameUser
              const showTime = !isFromSameUser || 
                (new Date(message.created_at).getTime() - new Date(prevMessage?.created_at || 0).getTime()) > 300000 // 5 minutes
              
              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isFromCurrentUser={isMessageFromCurrentUser(message, currentUserId, isClient)}
                  senderName={message.sender_user_id ? 'Advogado' : 'Cliente'}
                  showAvatar={showAvatar}
                  showTime={showTime}
                />
              )
            })}
            
            <TypingIndicatorComponent typing={typing} />
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-end space-x-2">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <PaperClipIcon className="h-5 w-5" />
          </button>
          
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value)
                handleTyping()
              }}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              className="w-full resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={1}
              style={{ maxHeight: '120px' }}
            />
          </div>
          
          <button 
            onClick={() => console.log('Emoji picker')}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <FaceSmileIcon className="h-5 w-5" />
          </button>
          
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
            className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileUpload}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt"
        />
      </div>
    </div>
  )
}