'use client'

import { useState } from 'react'
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
import { useConversations } from '@/lib/queries/useMessages'
import { useConversationListRealtime, formatMessageTime } from '@/lib/supabase/realtime'
import type { Conversation } from '@/types/database'
import NewConversationModal from './new-conversation-modal'

interface ConversationListProps {
  lawFirmId: string
  currentUserId: string
  isClient?: boolean
  onSelectConversation: (conversation: Conversation) => void
  selectedConversationId?: string
}

const TOPIC_COLORS: Record<string, string> = {
  'Geral': '#0066CC',
  'Consulta Juridica': '#10B981',
  'Documentos': '#F59E0B',
  'Audiencias': '#EF4444',
  'Urgente': '#DC2626',
}

interface ConversationItemProps {
  conversation: Conversation
  isSelected: boolean
  onClick: () => void
}

const ConversationItem = ({ conversation, isSelected, onClick }: ConversationItemProps) => {
  const getConversationTypeIcon = () => {
    switch (conversation.conversation_type) {
      case 'whatsapp':
        return '📱'
      case 'internal':
        return '🔒'
      default:
        return '💬'
    }
  }

  const getPriorityIndicator = () => {
    if (conversation.priority === 'urgent') {
      return <div className="w-2 h-2 bg-red-500 rounded-full" />
    } else if (conversation.priority === 'high') {
      return <div className="w-2 h-2 bg-orange-500 rounded-full" />
    }
    return null
  }

  const lastMessageTime = conversation.last_message_at || conversation.created_at

  return (
    <div
      onClick={onClick}
      className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
        isSelected ? 'bg-blue-50 border-blue-200' : ''
      }`}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
            <UserIcon className="h-7 w-7 text-gray-600" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {conversation.title || 'Conversa sem titulo'}
              </h3>
              <span className="text-xs">{getConversationTypeIcon()}</span>
              {getPriorityIndicator()}
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-500">
                {formatMessageTime(lastMessageTime)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-1">
            <p className="text-sm text-gray-600 truncate">
              {conversation.last_message_preview || 'Nenhuma mensagem ainda'}
            </p>
          </div>

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              {conversation.topic && (
                <span className="bg-gray-100 px-2 py-1 rounded">
                  {conversation.topic}
                </span>
              )}
              {conversation.matter_id && (
                <span className="bg-gray-100 px-2 py-1 rounded">
                  📂 Processo
                </span>
              )}
              <span className="capitalize">
                {conversation.status}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ConversationList({
  lawFirmId,
  currentUserId,
  isClient = false,
  onSelectConversation,
  selectedConversationId
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'urgent'>('all')
  const [showNewConversationModal, setShowNewConversationModal] = useState(false)
  const [showTopicFilter, setShowTopicFilter] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)

  // React Query for conversations
  const { data: conversations = [], isLoading } = useConversations(lawFirmId, currentUserId)

  // Real-time subscription for conversation list updates
  useConversationListRealtime(lawFirmId)

  // Filter conversations
  const filteredConversations = conversations.filter(conversation => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const title = conversation.title?.toLowerCase() || ''
      const preview = conversation.last_message_preview?.toLowerCase() || ''
      if (!title.includes(query) && !preview.includes(query)) {
        return false
      }
    }

    if (selectedTopic && conversation.topic !== selectedTopic) {
      return false
    }

    if (filterType === 'urgent') {
      return conversation.priority === 'urgent'
    }

    return true
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

        {/* Status Filters */}
        <div className="flex space-x-2 mb-3">
          {(['all', 'urgent'] as const).map((filter) => (
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
              {filter === 'urgent' && 'Urgentes'}
            </button>
          ))}
        </div>

        {/* Topic Filters */}
        {showTopicFilter && (
          <div className="mb-3">
            <div className="flex items-center mb-2">
              <TagIcon className="h-4 w-4 text-gray-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">Filtrar por topico:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTopic(null)}
                className={`px-2 py-1 text-xs rounded-full transition-colors ${
                  selectedTopic === null
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Todos
              </button>
              {Object.entries(TOPIC_COLORS).map(([topic, color]) => (
                <button
                  key={topic}
                  onClick={() => setSelectedTopic(topic)}
                  className={`px-2 py-1 text-xs rounded-full transition-colors flex items-center space-x-1 ${
                    selectedTopic === topic
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={{
                    backgroundColor: selectedTopic === topic ? color : undefined
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: selectedTopic === topic ? 'white' : color }}
                  />
                  <span>{topic}</span>
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
                  ? 'Suas conversas com o escritorio aparecerao aqui'
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
              Video
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
        lawFirmId={lawFirmId}
        currentUserId={currentUserId}
        isOpen={showNewConversationModal}
        onClose={() => setShowNewConversationModal(false)}
        onConversationCreated={(conversation) => {
          setShowNewConversationModal(false)
          onSelectConversation(conversation)
        }}
      />
    </div>
  )
}
