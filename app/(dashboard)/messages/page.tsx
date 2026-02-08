'use client'

import { useState, useEffect } from 'react'
import { useAuthContext } from '@/lib/providers/auth-provider'
import ConversationList from '@/components/chat/conversation-list'
import ChatInterface from '@/components/chat/chat-interface'
import NotificationPanel from '@/components/notifications/notification-panel'
import type { Conversation } from '@/types/database'
import { useToast } from '@/components/ui/toast-provider'
import {
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  VideoCameraIcon,
  CogIcon
} from '@heroicons/react/24/outline'

export default function MessagesPage() {
  const { profile } = useAuthContext()
  const toast = useToast()
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [isMobileView, setIsMobileView] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)

  const lawFirmId = profile?.law_firm_id
  const userId = profile?.id
  const userType = profile?.user_type
  const userName = profile?.full_name || profile?.first_name || profile?.email || ''
  const isClient = userType === 'client'

  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 1024)
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

  const handlePhoneCall = () => {
    toast.info('Funcionalidade de ligacao em breve')
  }

  const handleVideoCall = () => {
    toast.info('Funcionalidade de videochamada em breve')
  }

  const handleWhatsAppIntegration = () => {
    toast.info('Integracao WhatsApp Business em breve')
  }

  const handlePhoneIntegration = () => {
    toast.info('Integracao telefonica em breve')
  }

  const handleVideoIntegration = () => {
    toast.info('Integracao de video em breve')
  }

  if (!profile || !lawFirmId || !userId) {
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
            currentUserId={userId}
            currentUserName={userName}
            lawFirmId={lawFirmId}
            isClient={isClient}
            onClose={handleCloseChat}
          />
        ) : (
          <ConversationList
            lawFirmId={lawFirmId}
            currentUserId={userId}
            isClient={isClient}
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
                {isClient
                  ? 'Converse com seu advogado'
                  : 'Central de comunicacao com clientes'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {!isClient && (
              <>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Online</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handlePhoneCall}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    title="Fazer ligacao"
                  >
                    <PhoneIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleVideoCall}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    title="Videochamada"
                  >
                    <VideoCameraIcon className="h-5 w-5" />
                  </button>
                  <NotificationPanel userId={userId} isClient={isClient} />
                  <button
                    onClick={() => setShowSettingsModal(true)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    title="Configuracoes"
                  >
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
            lawFirmId={lawFirmId}
            currentUserId={userId}
            isClient={isClient}
            onSelectConversation={handleSelectConversation}
            selectedConversationId={selectedConversation?.id}
          />
        </div>

        {/* Chat Interface - Main Area */}
        <div className="flex-1">
          {selectedConversation ? (
            <ChatInterface
              conversation={selectedConversation}
              currentUserId={userId}
              currentUserName={userName}
              lawFirmId={lawFirmId}
              isClient={isClient}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Selecione uma conversa
                </h3>
                <p className="text-gray-500 mb-6 max-w-sm">
                  Escolha uma conversa da lista a esquerda para comecar a enviar mensagens.
                </p>

                {!isClient && (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-500">
                      <p>Ou use as integracoes disponiveis:</p>
                      <div className="flex items-center justify-center space-x-4 mt-2">
                        <button
                          onClick={handleWhatsAppIntegration}
                          className="flex items-center space-x-1 text-green-600 hover:text-green-700"
                        >
                          <span>📱</span>
                          <span>WhatsApp</span>
                        </button>
                        <button
                          onClick={handlePhoneIntegration}
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                        >
                          <PhoneIcon className="h-4 w-4" />
                          <span>Telefone</span>
                        </button>
                        <button
                          onClick={handleVideoIntegration}
                          className="flex items-center space-x-1 text-purple-600 hover:text-purple-700"
                        >
                          <VideoCameraIcon className="h-4 w-4" />
                          <span>Video</span>
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

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuracoes de Mensagens</h3>
            <div className="space-y-4">
              <div className="border-b border-gray-200 pb-3">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Notificacoes</h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Notificacoes por email</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Sons de notificacao</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
              </div>

              <div className="border-b border-gray-200 pb-3">
                <h4 className="text-sm font-medium text-gray-900 mb-2">WhatsApp Business</h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Integracao ativa</span>
                  <span className="text-sm text-green-600">Conectado</span>
                </div>
                <button className="text-sm text-blue-600 hover:text-blue-700">
                  Gerenciar integracao
                </button>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Privacidade</h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status de leitura</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status online</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  toast.info('Configuracoes de mensagens em breve')
                  setShowSettingsModal(false)
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
