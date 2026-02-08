'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  PaperAirplaneIcon,
  PaperClipIcon,
  FaceSmileIcon,
  EllipsisVerticalIcon,
  PhoneIcon,
  VideoCameraIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import { useConversationMessages, useSendMessage, useMarkAsRead } from '@/lib/queries/useMessages'
import { useMessageSearch } from '@/lib/queries/useMessageSearch'
import { useConversationRealtime, useTypingBroadcast, formatMessageTime, isMessageFromCurrentUser } from '@/lib/supabase/realtime'
import { useSupabase } from '@/components/providers'
import { uploadFile, getSignedUrl } from '@/lib/supabase/storage'
import type { Conversation } from '@/types/database'
import { MessageBubble, TypingIndicatorComponent } from './message-bubble'
import EvaHistoryPanel from './eva-history-panel'
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

export default function ChatInterface({
  conversation,
  currentUserId,
  currentUserName,
  lawFirmId,
  isClient = false,
  onClose
}: ChatInterfaceProps) {
  const toast = useToast()
  const supabase = useSupabase()
  const [newMessage, setNewMessage] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isEvaProcessing, setIsEvaProcessing] = useState(false)
  const [evaDraft, setEvaDraft] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [showEvaHistory, setShowEvaHistory] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isInitialLoadRef = useRef(true)

  // React Query hooks
  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useConversationMessages(conversation.id)
  const messages = useMemo(() => (data?.pages ?? []).flat().reverse(), [data])
  const sendMessageMutation = useSendMessage()
  const markAsReadMutation = useMarkAsRead()

  // Real-time subscriptions
  useConversationRealtime(conversation.id)
  const { sendTyping, typingUsers } = useTypingBroadcast(conversation.id, currentUserId, currentUserName)

  // Message search with debounce
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const { data: searchResults = [] } = useMessageSearch(conversation.id, debouncedSearch)

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    }
  }, [searchQuery])

  // Mark as read on conversation open (not on every message change)
  const markAsRead = markAsReadMutation.mutate
  useEffect(() => {
    if (conversation.id && currentUserId) {
      markAsRead({ conversationId: conversation.id, userId: currentUserId })
    }
  }, [conversation.id, currentUserId, markAsRead])

  // Clear highlight after animation
  useEffect(() => {
    if (!highlightedMessageId) return
    const timer = setTimeout(() => setHighlightedMessageId(null), 2000)
    return () => clearTimeout(timer)
  }, [highlightedMessageId])

  // Scroll to a specific message by ID and highlight it
  const scrollToMessage = useCallback((messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setHighlightedMessageId(messageId)
      setShowSearch(false)
      setSearchQuery('')
    }
  }, [])

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }
  }, [])

  // Auto-scroll to bottom only on initial load or when user is near bottom
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }, [])

  const isNearBottom = useCallback(() => {
    const container = messagesContainerRef.current
    if (!container) return true
    return container.scrollHeight - container.scrollTop - container.clientHeight < 100
  }, [])

  useEffect(() => {
    if (isInitialLoadRef.current && messages.length > 0) {
      isInitialLoadRef.current = false
      scrollToBottom('instant')
      return
    }
    if (isNearBottom()) {
      scrollToBottom()
    }
  }, [messages, scrollToBottom, isNearBottom])

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
      // @eva ghost-write flow — fetch draft, show preview before sending
      setIsEvaProcessing(true)
      setNewMessage('')
      sendTyping(false)
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      try {
        const response = await fetch('/api/ai/chat-ghost', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: evaQuery,
            conversationId: conversation.id,
          }),
          signal: controller.signal,
        })

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}))
          throw new Error(errData.error || 'Erro ao processar')
        }

        const { content } = await response.json()
        setEvaDraft(content)
      } catch (err) {
        const retryEva = () => {
          setNewMessage(`@eva ${evaQuery}`)
          setTimeout(() => handleSendMessage(), 0)
        }
        if (err instanceof DOMException && err.name === 'AbortError') {
          toast.error('A operacao excedeu o tempo limite. Tente novamente.', { label: 'Tentar novamente', onClick: retryEva })
        } else {
          const msg = err instanceof Error ? err.message : 'Erro desconhecido'
          toast.error(`EVA nao conseguiu processar: ${msg}`, { label: 'Tentar novamente', onClick: retryEva })
        }
      } finally {
        clearTimeout(timeoutId)
        setIsEvaProcessing(false)
      }
      return
    }

    // Normal message flow
    const messageContent = newMessage.trim()
    sendMessageMutation.mutate(
      {
        law_firm_id: lawFirmId,
        conversation_id: conversation.id,
        content: messageContent,
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
          toast.error('Erro ao enviar mensagem. Tente novamente.', {
            label: 'Tentar novamente',
            onClick: () => {
              setNewMessage(messageContent)
              setTimeout(() => handleSendMessage(), 0)
            },
          })
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

    try {
      setIsUploading(true)
      const timestamp = Date.now()
      const storagePath = `${lawFirmId}/messages/${conversation.id}/${timestamp}_${file.name}`
      await uploadFile(supabase, 'documents', storagePath, file)
      const signedUrl = await getSignedUrl(supabase, 'documents', storagePath, 86400)

      sendMessageMutation.mutate(
        {
          law_firm_id: lawFirmId,
          conversation_id: conversation.id,
          content: file.name,
          message_type: 'file',
          sender_id: currentUserId,
          sender_type: 'user',
          status: 'sent',
          attachments: [{ name: file.name, size: file.size, type: file.type, path: storagePath, url: signedUrl }],
        },
        {
          onError: () => {
            toast.error('Erro ao enviar arquivo. Tente novamente.')
          },
        }
      )
    } catch {
      toast.error('Erro ao fazer upload do arquivo.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
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
        <div
          key={message.id}
          id={`msg-${message.id}`}
          className={`transition-colors duration-700 ${highlightedMessageId === message.id ? 'bg-yellow-100 rounded-lg' : ''}`}
        >
          <MessageBubble
            message={message}
            isFromCurrentUser={isMessageFromCurrentUser(message, currentUserId)}
            showAvatar={showAvatar}
            showTime={showTime}
          />
        </div>
      )
    }),
    [messages, currentUserId, highlightedMessageId]
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
          <button
            onClick={() => {
              setShowSearch(!showSearch)
              if (showSearch) setSearchQuery('')
            }}
            className={`p-2 rounded-lg hover:bg-gray-100 ${showSearch ? 'text-primary bg-primary/10' : 'text-gray-400 hover:text-gray-600'}`}
            aria-label="Buscar mensagens"
            title="Buscar mensagens"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
          </button>
          {!isClient && (
            <button
              onClick={() => setShowEvaHistory(!showEvaHistory)}
              className={`p-2 rounded-lg hover:bg-gray-100 ${showEvaHistory ? 'text-primary bg-primary/10' : 'text-gray-400 hover:text-gray-600'}`}
              aria-label="Historico da EVA"
              title="Historico da EVA"
            >
              <SparklesIcon className="h-5 w-5" />
            </button>
          )}
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

      {/* Search Bar */}
      {showSearch && (
        <div className="relative border-b border-gray-200 p-2">
          <div className="flex items-center gap-2">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar na conversa..."
              className="flex-1 text-sm border-none focus:outline-none focus:ring-0 bg-transparent"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Limpar
              </button>
            )}
          </div>
          {searchQuery.length >= 2 && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full bg-white border border-gray-200 rounded-b-lg shadow-lg max-h-48 overflow-y-auto z-20">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => scrollToMessage(result.id)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <p className="text-sm text-gray-800 truncate">{result.content}</p>
                  <p className="text-xs text-gray-400">{formatMessageTime(result.created_at)}</p>
                </button>
              ))}
            </div>
          )}
          {searchQuery.length >= 2 && searchResults.length === 0 && debouncedSearch === searchQuery && (
            <div className="absolute left-0 right-0 top-full bg-white border border-gray-200 rounded-b-lg shadow-lg p-3 z-20">
              <p className="text-sm text-gray-500 text-center">Nenhuma mensagem encontrada</p>
            </div>
          )}
        </div>
      )}

      {/* Messages Container */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {hasNextPage && (
              <div className="flex justify-center py-2">
                <button
                  onClick={() => {
                    const container = messagesContainerRef.current
                    const prevScrollHeight = container?.scrollHeight ?? 0
                    fetchNextPage().then(() => {
                      if (container) {
                        container.scrollTop = container.scrollHeight - prevScrollHeight
                      }
                    })
                  }}
                  disabled={isFetchingNextPage}
                  className="text-sm text-primary hover:text-primary/80 font-medium disabled:opacity-50"
                >
                  {isFetchingNextPage ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                      Carregando...
                    </span>
                  ) : (
                    'Carregar mensagens anteriores'
                  )}
                </button>
              </div>
            )}
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
            {/* EVA draft preview — user can edit, send, or discard */}
            {evaDraft && (
              <div className="flex justify-start mb-4">
                <div className="max-w-sm">
                  <div className="flex items-center gap-1 mb-1">
                    <SparklesIcon className="h-4 w-4 text-primary" />
                    <p className="text-xs text-primary font-medium">Rascunho da EVA — revise antes de enviar</p>
                  </div>
                  <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                    <textarea
                      value={evaDraft}
                      onChange={(e) => setEvaDraft(e.target.value)}
                      className="w-full bg-transparent text-sm text-gray-900 resize-none border-none focus:outline-none focus:ring-0 p-0"
                      rows={Math.min(6, evaDraft.split('\n').length + 1)}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => setEvaDraft(null)}
                        className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded"
                      >
                        Descartar
                      </button>
                      <button
                        onClick={() => {
                          const content = evaDraft.trim()
                          if (!content) return
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
                              onError: () => toast.error('Erro ao enviar a resposta da EVA.'),
                            }
                          )
                          setEvaDraft(null)
                        }}
                        className="text-xs bg-primary text-white px-3 py-1 rounded hover:bg-primary/90"
                      >
                        Enviar
                      </button>
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
            disabled={isUploading || sendMessageMutation.isPending}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50"
            title="Enviar arquivo"
            aria-label="Enviar arquivo"
          >
            {isUploading || sendMessageMutation.isPending ? (
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
              aria-label="Selecionar emoji"
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
            aria-label="Enviar mensagem"
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

      {/* EVA History Panel */}
      {showEvaHistory && (
        <EvaHistoryPanel
          conversationId={conversation.id}
          onUseResponse={(content) => {
            setNewMessage(content)
            setShowEvaHistory(false)
          }}
          onClose={() => setShowEvaHistory(false)}
        />
      )}
    </div>
  )
}
