'use client'

import { useState, useEffect } from 'react'
import { 
  ChatBubbleLeftRightIcon,
  MagnifyingGlassIcon,
  UserIcon,
  PhoneIcon,
  PlusIcon,
  VideoCameraIcon,
  EllipsisVerticalIcon,
  TagIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import { CheckIcon } from '@heroicons/react/24/solid'
import { chatService, Conversation, formatMessageTime } from '@/lib/supabase/realtime'
import NewConversationModal from './new-conversation-modal'

interface ConversationListProps {
  currentUserId: string
  isClient?: boolean
  onSelectConversation: (conversation: Conversation) => void
  selectedConversationId?: string
}

interface ConversationTopic {
  id: string
  name: string
  color: string
  icon: string
}

const CONVERSATION_TOPICS: ConversationTopic[] = [
  { id: '1', name: 'Geral', color: '#0066CC', icon: 'ChatBubbleLeftRightIcon' },
  { id: '2', name: 'Consulta Jurídica', color: '#10B981', icon: 'DocumentTextIcon' },
  { id: '3', name: 'Documentos', color: '#F59E0B', icon: 'PaperClipIcon' },
  { id: '4', name: 'Audiências', color: '#EF4444', icon: 'CalendarIcon' },
  { id: '5', name: 'Urgente', color: '#DC2626', icon: 'ExclamationTriangleIcon' }
]

interface ConversationItemProps {
  conversation: Conversation
  isSelected: boolean
  onClick: () => void
  isClient?: boolean
}

const ConversationItem = ({ conversation, isSelected, onClick, isClient = false }: ConversationItemProps) => {
  const getLastMessagePreview = () => {
    return conversation.description || 'Nenhuma mensagem ainda'
  }

  const getUnreadCount = () => {
    return 0
  }

  const getStatusIcon = () => {
    return <CheckIcon className="h-3 w-3 text-gray-400" />
  }

  const getPriorityIndicator = () => {
    if (conversation.priority === 'urgent') {
      return <div className="w-2 h-2 bg-red-500 rounded-full" />
    } else if (conversation.priority === 'high') {
      return <div className="w-2 h-2 bg-orange-500 rounded-full" />
    }
    return null
  }

  const getConversationTypeIcon = () => {
    switch (conversation.conversation_type) {
      case 'whatsapp':
        return '📱'
      case 'urgent':
        return '🔴'
      case 'consultation':
        return '💬'
      case 'matter_specific':
        return '📂'
      default:
        return '💬'
    }
  }

  const unreadCount = getUnreadCount()
  const lastMessageTime = conversation.last_message_at || conversation.created_at

  return (
    <div
      onClick={onClick}
      className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
        isSelected ? 'bg-blue-50 border-blue-200' : ''
      }`}
    >
      <div className="flex items-start space-x-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center relative">
            <UserIcon className="h-7 w-7 text-gray-600" />
            {conversation.is_whatsapp_enabled && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">📱</span>
              </div>
            )}
          </div>
        </div>

        {/* Conversation Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {conversation.title || 'Conversa sem título'}
              </h3>
              <span className="text-xs">{getConversationTypeIcon()}</span>
              {getPriorityIndicator()}
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-500">
                {formatMessageTime(lastMessageTime)}
              </span>
              {!isClient && getStatusIcon()}
            </div>
          </div>

          {/* Last Message Preview */}
          <div className="flex items-center justify-between mt-1">
            <p className="text-sm text-gray-600 truncate">
              {getLastMessagePreview()}
            </p>
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>

          {/* Conversation Details */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              {conversation.matter_id && (
                <span className="bg-gray-100 px-2 py-1 rounded">
                  📂 Processo
                </span>
              )}
              <span className="capitalize">
                {conversation.status}
              </span>
            </div>
            
            {conversation.is_whatsapp_enabled && (
              <div className="flex items-center space-x-1">
                <PhoneIcon className="h-3 w-3 text-green-500" />
                <span className="text-xs text-green-600">WhatsApp</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ConversationList({ 
  currentUserId, 
  isClient = false, 
  onSelectConversation,
  selectedConversationId 
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'urgent'>('all')
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null)
  const [showNewConversationModal, setShowNewConversationModal] = useState(false)
  const [showTopicFilter, setShowTopicFilter] = useState(false)

  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      setIsLoading(true)
      try {
        const userConversations = await chatService.getUserConversations(currentUserId, isClient)
        setConversations(userConversations)
      } catch (error) {
        console.error('Error loading conversations:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadConversations()

    // Simple polling for cross-user sync (every 3 seconds)
    const pollInterval = setInterval(async () => {
      try {
        const latestConversations = await chatService.getUserConversations(currentUserId, isClient)
        setConversations(prevConversations => {
          // Only update if there are new conversations
          if (latestConversations.length !== prevConversations.length) {
            console.log('Conversations synced - found new conversations')
            return latestConversations
          }
          return prevConversations
        })
      } catch (error) {
        console.error('Error polling conversations:', error)
      }
    }, 3000)

    return () => {
      clearInterval(pollInterval)
    }
  }, [currentUserId, isClient])

  const handleCreateConversation = async (data: {
    clientId: string
    topicId: string
    title: string
    conversationType: 'internal' | 'client' | 'whatsapp'
    priority: 'low' | 'normal' | 'high' | 'urgent'
  }) => {
    const conversationType = data.conversationType === 'whatsapp' ? 'whatsapp' :
                             data.conversationType === 'internal' ? 'consultation' : 'general' as const

    try {
      const newConversation = await chatService.createConversation({
        law_firm_id: 'default-firm-id',
        topic_id: data.topicId,
        client_id: data.clientId,
        title: data.title,
        conversation_type: conversationType,
        priority: data.priority,
        status: 'active',
      })

      setConversations(prev => [newConversation, ...prev])
      onSelectConversation(newConversation)
    } catch (error) {
      console.error('Error creating conversation via Supabase, using fallback:', error)
      const fallbackConversation: Conversation = {
        id: `local-${Date.now()}`,
        law_firm_id: 'default-firm-id',
        topic_id: data.topicId,
        client_id: data.clientId,
        title: data.title,
        conversation_type: conversationType,
        priority: data.priority,
        status: 'active',
        is_whatsapp_enabled: data.conversationType === 'whatsapp',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      chatService.addMockConversation(fallbackConversation)
      setConversations(prev => [fallbackConversation, ...prev])
      onSelectConversation(fallbackConversation)
    }
  }

  // Filter conversations
  const filteredConversations = conversations.filter(conversation => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const title = conversation.title?.toLowerCase() || ''
      const description = conversation.description?.toLowerCase() || ''
      if (!title.includes(query) && !description.includes(query)) {
        return false
      }
    }

    // Topic filter
    if (selectedTopicId && conversation.topic_id !== selectedTopicId) {
      return false
    }

    // Type filter
    switch (filterType) {
      case 'unread':
        return false
      case 'urgent':
        return conversation.priority === 'urgent'
      default:
        return true
    }
  })

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Carregando conversas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {isClient ? 'Minhas Conversas' : 'Chat'}
          </h2>
          <div className="flex items-center space-x-2">
            {!isClient && (
              <>
                <button 
                  onClick={() => setShowTopicFilter(!showTopicFilter)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <FunnelIcon className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => setShowNewConversationModal(true)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar conversas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Sync indicator */}
        <div className="mb-2 text-xs text-gray-500 text-center">
          🔄 Sincronização automática ativa
        </div>

        {/* Status Filters */}
        <div className="flex space-x-2 mb-3">
          {(['all', 'unread', 'urgent'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setFilterType(filter)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                filterType === filter
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter === 'all' && 'Todas'}
              {filter === 'unread' && 'Não lidas'}
              {filter === 'urgent' && 'Urgentes'}
            </button>
          ))}
        </div>

        {/* Topic Filters */}
        {showTopicFilter && (
          <div className="mb-3">
            <div className="flex items-center mb-2">
              <TagIcon className="h-4 w-4 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">Filtrar por tópico:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTopicId(null)}
                className={`px-2 py-1 text-xs rounded-full transition-colors ${
                  selectedTopicId === null
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Todos
              </button>
              {CONVERSATION_TOPICS.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopicId(topic.id)}
                  className={`px-2 py-1 text-xs rounded-full transition-colors flex items-center space-x-1 ${
                    selectedTopicId === topic.id
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={{
                    backgroundColor: selectedTopicId === topic.id ? topic.color : undefined
                  }}
                >
                  <span 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: selectedTopicId === topic.id ? 'white' : topic.color }}
                  />
                  <span>{topic.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery 
                ? 'Tente ajustar sua busca ou filtros'
                : isClient 
                  ? 'Suas conversas com o escritório aparecerão aqui'
                  : 'Inicie uma nova conversa com um cliente'
              }
            </p>
            {!isClient && !searchQuery && (
              <button 
                onClick={() => setShowNewConversationModal(true)}
                className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Nova Conversa
              </button>
            )}
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isSelected={selectedConversationId === conversation.id}
              onClick={() => onSelectConversation(conversation)}
              isClient={isClient}
            />
          ))
        )}
      </div>

      {/* Quick Actions */}
      {!isClient && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <button className="flex-1 flex items-center justify-center py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              <PhoneIcon className="h-4 w-4 mr-2" />
              Ligar
            </button>
            <button className="flex-1 flex items-center justify-center py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              <VideoCameraIcon className="h-4 w-4 mr-2" />
              Vídeo
            </button>
            <button className="flex-1 flex items-center justify-center py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              <EllipsisVerticalIcon className="h-4 w-4 mr-2" />
              Mais
            </button>
          </div>
        </div>
      )}

      {/* New Conversation Modal */}
      <NewConversationModal
        isOpen={showNewConversationModal}
        onClose={() => setShowNewConversationModal(false)}
        onCreateConversation={handleCreateConversation}
      />
    </div>
  )
}