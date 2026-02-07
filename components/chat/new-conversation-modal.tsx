'use client'

import { useState, useEffect } from 'react'
import {
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  TagIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import { useSupabase } from '@/components/providers'
import { useCreateConversation } from '@/lib/queries/useMessages'
import type { Conversation, ConversationType, ConversationPriority } from '@/types/database'

interface Contact {
  id: string
  name: string
  email: string
  phone?: string
  cpf_cnpj?: string
}

interface ConversationTopic {
  id: string
  name: string
  description: string
  color: string
}

const CONVERSATION_TOPICS: ConversationTopic[] = [
  { id: '1', name: 'Geral', description: 'Conversas gerais com clientes', color: '#0066CC' },
  { id: '2', name: 'Consulta Juridica', description: 'Consultas e duvidas juridicas', color: '#10B981' },
  { id: '3', name: 'Documentos', description: 'Envio e recebimento de documentos', color: '#F59E0B' },
  { id: '4', name: 'Audiencias', description: 'Informacoes sobre audiencias e prazos', color: '#EF4444' },
  { id: '5', name: 'Urgente', description: 'Comunicacoes urgentes', color: '#DC2626' },
]

interface NewConversationModalProps {
  lawFirmId: string
  currentUserId: string
  isOpen: boolean
  onClose: () => void
  onConversationCreated: (conversation: Conversation) => void
}

export default function NewConversationModal({
  lawFirmId,
  currentUserId,
  isOpen,
  onClose,
  onConversationCreated
}: NewConversationModalProps) {
  const supabase = useSupabase()
  const createConversation = useCreateConversation()

  const [step, setStep] = useState(1)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<ConversationTopic | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [title, setTitle] = useState('')
  const [conversationType, setConversationType] = useState<ConversationType>('client')
  const [priority, setPriority] = useState<ConversationPriority>('normal')
  const [contacts, setContacts] = useState<Contact[]>([])

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setSelectedContact(null)
      setSelectedTopic(null)
      setSearchTerm('')
      setTitle('')
      setConversationType('client')
      setPriority('normal')
    }
  }, [isOpen])

  // Load contacts from Supabase
  useEffect(() => {
    const loadContacts = async () => {
      try {
        const { data, error } = await supabase
          .from('contacts')
          .select('id, full_name, email, phone')
          .eq('law_firm_id', lawFirmId)
          .order('full_name')
        if (error) throw error
        setContacts((data || []).map(c => ({
          id: c.id,
          name: c.full_name || 'Sem nome',
          email: c.email || '',
          phone: c.phone || undefined,
        })))
      } catch (error) {
        console.error('Error loading contacts:', error)
      }
    }
    if (isOpen) loadContacts()
  }, [isOpen, lawFirmId, supabase])

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact)
    setTitle(`Conversa com ${contact.name}`)
    setStep(2)
  }

  const handleTopicSelect = (topic: ConversationTopic) => {
    setSelectedTopic(topic)
  }

  const handleCreateConversation = () => {
    if (!selectedContact || !selectedTopic) return

    createConversation.mutate(
      {
        conversation: {
          law_firm_id: lawFirmId,
          contact_id: selectedContact.id,
          title: title || `Conversa com ${selectedContact.name}`,
          conversation_type: conversationType,
          priority,
          status: 'active',
          topic: selectedTopic.name,
          created_by: currentUserId,
        },
        participants: [
          { user_id: currentUserId, role: 'owner' as const },
        ],
      },
      {
        onSuccess: (conversation) => {
          onConversationCreated(conversation)
        },
        onError: (error) => {
          console.error('Error creating conversation:', error)
        },
      }
    )
  }

  const handleBack = () => {
    setStep(1)
    setSelectedTopic(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <ChatBubbleLeftRightIcon className="h-6 w-6 text-primary" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {step === 1 ? 'Nova Conversa - Selecionar Cliente' : 'Nova Conversa - Detalhes'}
              </h3>
              <p className="text-sm text-gray-500">
                {step === 1 ? 'Escolha o cliente para iniciar a conversa' : 'Configure o topico e detalhes da conversa'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Step 1: Select Contact */}
        {step === 1 && (
          <div className="p-6">
            <div className="mb-6">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar cliente por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => handleContactSelect(contact)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 cursor-pointer transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <UserIcon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{contact.name}</h4>
                      <p className="text-sm text-gray-500">{contact.email}</p>
                      {contact.phone && (
                        <span className="text-xs text-gray-500">{contact.phone}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredContacts.length === 0 && (
              <div className="text-center py-8">
                <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum cliente encontrado</p>
                <p className="text-sm text-gray-400">Tente buscar com outros termos</p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Topic & Details */}
        {step === 2 && selectedContact && (
          <div className="p-6">
            {/* Selected Contact */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <UserIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{selectedContact.name}</h4>
                  <p className="text-sm text-gray-500">{selectedContact.email}</p>
                </div>
              </div>
            </div>

            {/* Topic Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Topico da Conversa *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {CONVERSATION_TOPICS.map((topic) => (
                  <div
                    key={topic.id}
                    onClick={() => handleTopicSelect(topic)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedTopic?.id === topic.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${topic.color}20`, color: topic.color }}
                      >
                        <TagIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{topic.name}</h4>
                        <p className="text-sm text-gray-500">{topic.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titulo da Conversa
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder={`Conversa com ${selectedContact.name}`}
              />
            </div>

            {/* Type and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Conversa
                </label>
                <select
                  value={conversationType}
                  onChange={(e) => setConversationType(e.target.value as ConversationType)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="client">Cliente</option>
                  <option value="internal">Interna</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prioridade
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as ConversationPriority)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="low">Baixa</option>
                  <option value="normal">Normal</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                onClick={handleBack}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Voltar
              </button>
              <button
                onClick={handleCreateConversation}
                disabled={!selectedTopic || createConversation.isPending}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createConversation.isPending ? 'Criando...' : 'Criar Conversa'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
