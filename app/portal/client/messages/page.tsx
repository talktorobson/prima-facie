'use client'

import { useState, useEffect } from 'react'
import ConversationList from '@/components/chat/conversation-list'
import ChatInterface from '@/components/chat/chat-interface'
import { Conversation } from '@/lib/supabase/realtime'
import { 
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

// Mock client user data
const mockClientUser = {
  id: '1',
  name: 'João Silva Santos',
  email: 'joao.silva@email.com',
  role: 'client' as const
}

export default function ClientMessagesPage() {
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

  // Mobile view: show either conversation list or chat interface
  if (isMobileView) {
    return (
      <div className="h-screen bg-gray-50">
        {selectedConversation ? (
          <ChatInterface
            conversation={selectedConversation}
            currentUserId={mockClientUser.id}
            currentUserName={mockClientUser.name}
            isClient={true}
            onClose={handleCloseChat}
          />
        ) : (
          <ConversationList
            currentUserId={mockClientUser.id}
            isClient={true}
            onSelectConversation={handleSelectConversation}
            selectedConversationId={selectedConversation?.id}
          />
        )}
      </div>
    )
  }

  // Desktop view: show both conversation list and chat interface
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mensagens</h1>
                <p className="text-gray-500">Converse com seu advogado responsável</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Dra. Maria Silva Santos - Online</span>
              </div>
              
              <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <PhoneIcon className="h-4 w-4 mr-2" />
                Solicitar Ligação
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Urgente</h3>
              <p className="text-sm text-gray-500">Para questões que precisam de atenção imediata</p>
            </div>
          </div>
          <button className="mt-4 w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700">
            Iniciar Chat Urgente
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Consulta</h3>
              <p className="text-sm text-gray-500">Para dúvidas e consultas jurídicas</p>
            </div>
          </div>
          <button className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
            Nova Consulta
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Documentos</h3>
              <p className="text-sm text-gray-500">Para envio e recebimento de documentos</p>
            </div>
          </div>
          <button className="mt-4 w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700">
            Enviar Documento
          </button>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="bg-white rounded-lg shadow" style={{ height: '600px' }}>
        <div className="flex h-full">
          {/* Conversation List - Left Sidebar */}
          <div className="w-80 border-r border-gray-200">
            <ConversationList
              currentUserId={mockClientUser.id}
              isClient={true}
              onSelectConversation={handleSelectConversation}
              selectedConversationId={selectedConversation?.id}
            />
          </div>

          {/* Chat Interface - Main Area */}
          <div className="flex-1">
            {selectedConversation ? (
              <ChatInterface
                conversation={selectedConversation}
                currentUserId={mockClientUser.id}
                currentUserName={mockClientUser.name}
                isClient={true}
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md">
                  <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    Bem-vindo ao Chat
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Selecione uma conversa existente ou inicie uma nova comunicação com seu advogado.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <ChatBubbleLeftRightIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                        <div className="text-left">
                          <h4 className="text-sm font-medium text-blue-900">Dica</h4>
                          <p className="text-sm text-blue-700">
                            Você pode enviar mensagens, documentos e solicitar reuniões através do chat.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <PhoneIcon className="h-5 w-5 text-green-600 mt-0.5 mr-3" />
                        <div className="text-left">
                          <h4 className="text-sm font-medium text-green-900">WhatsApp Integrado</h4>
                          <p className="text-sm text-green-700">
                            Suas mensagens também chegam no WhatsApp: +55 11 9 8765-4321
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Communication Guidelines */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Diretrizes de Comunicação</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">📞 Horário de Atendimento</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Segunda a Sexta: 9h às 18h</li>
              <li>• Sábado: 9h às 12h</li>
              <li>• Urgências: 24h via chat</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">⏱️ Tempo de Resposta</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Urgente: até 1 hora</li>
              <li>• Normal: até 4 horas</li>
              <li>• Consultas: até 24 horas</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}