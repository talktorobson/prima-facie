'use client'

import { useState, useEffect, useRef, memo, useMemo, useCallback } from 'react'
import {
  PaperAirplaneIcon,
  PaperClipIcon,
  FaceSmileIcon,
  EllipsisVerticalIcon,
  UserIcon,
  PhoneIcon,
  VideoCameraIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { useConversationMessages, useSendMessage, useMarkAsRead } from '@/lib/queries/useMessages'
import { useConversationRealtime, useTypingBroadcast, formatMessageTime, isMessageFromCurrentUser } from '@/lib/supabase/realtime'
import type { Conversation, Message } from '@/types/database'
import type { TypingIndicator } from '@/lib/supabase/realtime'
import MessageStatusIndicator from './message-status-indicator'
import { useToast } from '@/components/ui/toast-provider'

const COMMON_EMOJIS = ['😀', '😂', '👍', '❤️', '🙏', '👋', '✅', '⚖️', '📄', '📎', '🔔', '⏰', '📅', '💼', '🏛️', '📝', '🤝', '👏', '🎉', '✨']

const EVA_MENTION_RE = /^@eva\s+([\s\S]+)/i

function extractEvaQuery(text: string): string | null {
  const match = text.match(EVA_MENTION_RE)
  return match ? match[1].trim() : null
}

interface ChatInterfaceProps {
  conversation: Conversation
  currentUserId: string
  currentUserName: string
  lawFirmId: string
  isClient?: boolean
  onClose?: () => void
}

interface MessageBubbleProps {
  message: Message & { sender?: { id: string; first_name: string; last_name: string; full_name?: string } }
  isFromCurrentUser: boolean
  showAvatar?: boolean
  showTime?: boolean
}

const MessageBubble = memo(({ message, isFromCurrentUser, showAvatar = true, showTime = true }: MessageBubbleProps) => {
  const senderName = message.sender?.full_name || message.sender?.first_name || (isFromCurrentUser ? 'Voce' : 'Usuario')

  const renderMessageContent = () => {
    switch (message.message_type) {
      case 'file':
        return (
          <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
            <PaperClipIcon className="h-4 w-4 text-gray-500" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">Documento</p>
            </div>
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
            {message.parent_message_id && (
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
                  status={(message.status as 'sent' | 'delivered' | 'read' | 'failed') || 'sent'}
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
}, (prev, next) => (
  prev.message.id === next.message.id &&
  prev.message.status === next.message.status &&
  prev.showAvatar === next.showAvatar &&
  prev.showTime === next.showTime
))
MessageBubble.displayName = 'MessageBubble'

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
            {typing.map(t => t.user_name).join(', ')} esta digitando...
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
  lawFirmId,
  isClient = false,
  onClose
}: ChatInterfaceProps) {
  const toast = useToast()
  const [newMessage, setNewMessage] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isEvaProcessing, setIsEvaProcessing] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // React Query hooks
  const { data: messages = [], isLoading } = useConversationMessages(conversation.id)
  const sendMessageMutation = useSendMessage()
  const markAsReadMutation = useMarkAsRead()

  // Real-time subscriptions
  useConversationRealtime(conversation.id)
  const { sendTyping, typingUsers } = useTypingBroadcast(conversation.id, currentUserId, currentUserName)

  // Mark as read on conversation open (not on every message change)
  const markAsRead = markAsReadMutation.mutate
  useEffect(() => {
    if (conversation.id && currentUserId) {
      markAsRead({ conversationId: conversation.id, userId: currentUserId })
    }
  }, [conversation.id, currentUserId, markAsRead])

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }
  }, [])

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Handle typing indicator
  const handleTyping = () => {
    sendTyping(true)

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(false)
    }, 3000)
  }

  // Send message (with @eva ghost-write support)
  const handleSendMessage = async () => {
    if (!newMessage.trim() || sendMessageMutation.isPending || isEvaProcessing) return

    const evaQuery = extractEvaQuery(newMessage.trim())

    if (evaQuery && !isClient) {
      // @eva ghost-write flow
      setIsEvaProcessing(true)
      setNewMessage('')
      sendTyping(false)
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

      try {
        const response = await fetch('/api/ai/chat-ghost', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: evaQuery,
            conversationId: conversation.id,
          }),
        })

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}))
          throw new Error(errData.error || 'Erro ao processar')
        }

        const { content } = await response.json()

        // Send EVA's response as the user's own message
        sendMessageMutation.mutate(
          {
            law_firm_id: lawFirmId,
            conversation_id: conversation.id,
            content,
            message_type: 'text',
            sender_id: currentUserId,
            sender_type: 'user',
            status: 'sent',
          },
          {
            onError: () => {
              toast.error('Erro ao enviar a resposta da EVA.')
            },
          }
        )
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido'
        toast.error(`EVA nao conseguiu processar: ${msg}`)
      } finally {
        setIsEvaProcessing(false)
      }
      return
    }

    // Normal message flow
    sendMessageMutation.mutate(
      {
        law_firm_id: lawFirmId,
        conversation_id: conversation.id,
        content: newMessage.trim(),
        message_type: 'text',
        sender_id: currentUserId,
        sender_type: 'user',
        status: 'sent',
      },
      {
        onSuccess: () => {
          setNewMessage('')
          sendTyping(false)
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current)
          }
        },
        onError: () => {
          toast.error('Erro ao enviar mensagem. Tente novamente.')
        },
      }
    )
  }

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast.error('O arquivo deve ter no maximo 10MB')
      return
    }

    toast.info('Upload de arquivos em breve')

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Memoized message list
  const renderedMessages = useMemo(() =>
    messages.map((message, index) => {
      const prevMessage = messages[index - 1]
      const isFromSameUser = prevMessage &&
        prevMessage.sender_id === message.sender_id

      const showAvatar = !isFromSameUser
      const showTime = !isFromSameUser ||
        (new Date(message.created_at).getTime() - new Date(prevMessage?.created_at || 0).getTime()) > 300000

      return (
        <MessageBubble
          key={message.id}
          message={message}
          isFromCurrentUser={isMessageFromCurrentUser(message, currentUserId)}
          showAvatar={showAvatar}
          showTime={showTime}
        />
      )
    }),
    [messages, currentUserId]
  )

  return (
    <div className="flex flex-col bg-white h-[600px]">
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
            {renderedMessages}
            {isEvaProcessing && (
              <div className="flex justify-start mb-4">
                <div className="flex max-w-xs">
                  <div className="flex-shrink-0 mr-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <SparklesIcon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div className="ml-2">
                    <p className="text-xs text-primary font-medium mb-1">EVA esta preparando uma resposta...</p>
                    <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <TypingIndicatorComponent typing={typingUsers} />
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-end space-x-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={sendMessageMutation.isPending}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50"
            title="Enviar arquivo"
          >
            {sendMessageMutation.isPending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
            ) : (
              <PaperClipIcon className="h-5 w-5" />
            )}
          </button>

          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value)
                handleTyping()
              }}
              onKeyPress={handleKeyPress}
              placeholder={isClient ? 'Digite sua mensagem...' : 'Digite sua mensagem ou @eva para usar a assistente de IA...'}
              disabled={isEvaProcessing}
              className="w-full resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:bg-gray-50"
              rows={1}
              style={{ maxHeight: '120px' }}
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <FaceSmileIcon className="h-5 w-5" />
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 grid grid-cols-5 gap-1 w-52">
                {COMMON_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      setNewMessage((prev) => prev + emoji)
                      setShowEmojiPicker(false)
                    }}
                    className="text-xl p-1 hover:bg-gray-100 rounded"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sendMessageMutation.isPending || isEvaProcessing}
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
