'use client'

import { useState } from 'react'
import { useAuthContext } from '@/lib/providers/auth-provider'
import { useEffectiveLawFirmId } from '@/lib/hooks/use-effective-law-firm-id'
import ConversationList from '@/components/chat/conversation-list'
import ChatInterface from '@/components/chat/chat-interface'
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import type { Conversation } from '@/types/database'

export default function StaffMessagesPage() {
  const { profile } = useAuthContext()
  const lawFirmId = useEffectiveLawFirmId()
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)

  if (!profile || !lawFirmId) return null

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mensagens</h1>
        <p className="mt-1 text-gray-600">Comunique-se com clientes e colegas.</p>
      </div>
      <div className="bg-white shadow rounded-lg overflow-hidden" style={{ height: 'calc(100vh - 220px)' }}>
        {/* Mobile: toggle between list and chat */}
        <div className="flex h-full">
          <div className={`${selectedConversation ? 'hidden md:block' : ''} w-full md:w-80 border-r border-gray-200 overflow-y-auto`}>
            <ConversationList
              lawFirmId={lawFirmId}
              currentUserId={profile.id}
              isClient={false}
              onSelectConversation={(conv) => setSelectedConversation(conv)}
              selectedConversationId={selectedConversation?.id}
            />
          </div>
          <div className={`${!selectedConversation ? 'hidden md:flex' : 'flex'} flex-1 flex-col`}>
            {selectedConversation ? (
              <ChatInterface
                conversation={selectedConversation}
                currentUserId={profile.id}
                currentUserName={profile.full_name || 'Colaborador'}
                lawFirmId={lawFirmId}
                isClient={false}
                onClose={() => setSelectedConversation(null)}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-2 text-sm text-gray-500">Selecione uma conversa</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
