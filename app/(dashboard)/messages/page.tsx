'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import ConversationList from '@/components/chat/conversation-list'
import ChatInterface from '@/components/chat/chat-interface'
import NotificationPanel from '@/components/notifications/notification-panel'
import { Conversation } from '@/lib/supabase/realtime'
import { 
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  VideoCameraIcon,
  CogIcon
} from '@heroicons/react/24/outline'

export default function MessagesPage() {
  const { user } = useAuth()
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [isMobileView, setIsMobileView] = useState(false)

  // Check for mobile view
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768)
    }
    
    checkMobileView()
    window.addEventListener('resize', checkMobileView)
    
    return () => window.removeEventListener('resize', checkMobileView)
  }, [])

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation)
  }

  const handleCloseChat = () => {
    setSelectedConversation(null)
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  // Mobile view: show either conversation list or chat interface
  if (isMobileView) {
    return (
      <div className="h-screen bg-gray-50">
        {selectedConversation ? (
          <ChatInterface
            conversation={selectedConversation}
            currentUserId={user.id}
            currentUserName={user.name || user.email}
            isClient={user.role === 'client'}
            onClose={handleCloseChat}
          />
        ) : (
          <ConversationList
            currentUserId={user.id}
            isClient={user.role === 'client'}
            onSelectConversation={handleSelectConversation}
            selectedConversationId={selectedConversation?.id}
          />
        )}
      </div>
    )
  }

  // Desktop view: show both conversation list and chat interface
  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ChatBubbleLeftRightIcon className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mensagens</h1>
              <p className="text-gray-500">
                {user.role === 'client' 
                  ? 'Converse com seu advogado'
                  : 'Central de comunicação com clientes'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user.role !== 'client' && (
              <>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Online</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                    <PhoneIcon className="h-5 w-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                    <VideoCameraIcon className="h-5 w-5" />
                  </button>
                  <NotificationPanel userId={user.id} isClient={user.role === 'client'} />
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                    <CogIcon className="h-5 w-5" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Conversation List - Left Sidebar */}
        <div className="w-80 border-r border-gray-200 bg-white h-full">
          <ConversationList
            currentUserId={user.id}
            isClient={user.role === 'client'}
            onSelectConversation={handleSelectConversation}
            selectedConversationId={selectedConversation?.id}
          />
        </div>

        {/* Chat Interface - Main Area */}
        <div className="flex-1">
          {selectedConversation ? (
            <ChatInterface
              conversation={selectedConversation}
              currentUserId={user.id}
              currentUserName={user.name || user.email}
              isClient={user.role === 'client'}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Selecione uma conversa
                </h3>
                <p className="text-gray-500 mb-6 max-w-sm">
                  Escolha uma conversa da lista à esquerda para começar a enviar mensagens.
                </p>
                
                {user.role !== 'client' && (
                  <div className="space-y-3">
                    <button className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                      <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                      Nova Conversa
                    </button>
                    
                    <div className="text-sm text-gray-500">
                      <p>Ou use as integrações disponíveis:</p>
                      <div className="flex items-center justify-center space-x-4 mt-2">
                        <button className="flex items-center space-x-1 text-green-600 hover:text-green-700">
                          <span>📱</span>
                          <span>WhatsApp</span>
                        </button>
                        <button className="flex items-center space-x-1 text-blue-600 hover:text-blue-700">
                          <PhoneIcon className="h-4 w-4" />
                          <span>Telefone</span>
                        </button>
                        <button className="flex items-center space-x-1 text-purple-600 hover:text-purple-700">
                          <VideoCameraIcon className="h-4 w-4" />
                          <span>Vídeo</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}