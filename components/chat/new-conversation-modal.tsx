'use client'

import { useState, useEffect } from 'react'
import { 
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  TagIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase/client'

interface Client {
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
  icon: string
  is_active: boolean
}

interface NewConversationModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateConversation: (data: {
    clientId: string
    topicId: string
    title: string
    conversationType: 'internal' | 'client' | 'whatsapp'
    priority: 'low' | 'normal' | 'high' | 'urgent'
  }) => void
}

const CONVERSATION_TOPICS: ConversationTopic[] = [
  { id: '1', name: 'Geral', description: 'Conversas gerais com clientes', color: '#0066CC', icon: 'ChatBubbleLeftRightIcon', is_active: true },
  { id: '2', name: 'Consulta Jurídica', description: 'Consultas e dúvidas jurídicas', color: '#10B981', icon: 'DocumentTextIcon', is_active: true },
  { id: '3', name: 'Documentos', description: 'Envio e recebimento de documentos', color: '#F59E0B', icon: 'PaperClipIcon', is_active: true },
  { id: '4', name: 'Audiências', description: 'Informações sobre audiências e prazos', color: '#EF4444', icon: 'CalendarIcon', is_active: true },
  { id: '5', name: 'Urgente', description: 'Comunicações urgentes', color: '#DC2626', icon: 'ExclamationTriangleIcon', is_active: true },
]

export default function NewConversationModal({ isOpen, onClose, onCreateConversation }: NewConversationModalProps) {
  const [step, setStep] = useState(1) // 1: Select Client, 2: Select Topic & Details
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<ConversationTopic | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [title, setTitle] = useState('')
  const [conversationType, setConversationType] = useState<'internal' | 'client' | 'whatsapp'>('client')
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal')
  const [clients, setClients] = useState<Client[]>([])
  const [topics] = useState<ConversationTopic[]>(CONVERSATION_TOPICS)

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setSelectedClient(null)
      setSelectedTopic(null)
      setSearchTerm('')
      setTitle('')
      setConversationType('client')
      setPriority('normal')
    }
  }, [isOpen])

  // Load clients from Supabase
  useEffect(() => {
    const loadClients = async () => {
      try {
        const { data, error } = await supabase
          .from('contacts')
          .select('id, full_name, email, phone, cpf_cnpj')
          .order('full_name')
        if (error) throw error
        setClients((data || []).map(c => ({
          id: c.id,
          name: c.full_name,
          email: c.email,
          phone: c.phone || undefined,
          cpf_cnpj: c.cpf_cnpj || undefined,
        })))
      } catch (error) {
        console.error('Error loading clients:', error)
      }
    }
    if (isOpen) loadClients()
  }, [isOpen])

  // Filter clients based on search term
  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.cpf_cnpj && client.cpf_cnpj.includes(searchTerm))
  )

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client)
    setTitle(`Conversa com ${client.name}`)
    setStep(2)
  }

  const handleTopicSelect = (topic: ConversationTopic) => {
    setSelectedTopic(topic)
  }

  const handleCreateConversation = () => {
    if (!selectedClient || !selectedTopic) return

    onCreateConversation({
      clientId: selectedClient.id,
      topicId: selectedTopic.id,
      title: title || `Conversa com ${selectedClient.name}`,
      conversationType,
      priority
    })

    onClose()
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
                {step === 1 ? 'Escolha o cliente para iniciar a conversa' : 'Configure o tópico e detalhes da conversa'}
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

        {/* Step 1: Select Client */}
        {step === 1 && (
          <div className="p-6">
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar cliente por nome, email ou CPF/CNPJ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Client List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  onClick={() => handleClientSelect(client)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 cursor-pointer transition-all"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <UserIcon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{client.name}</h4>
                      <p className="text-sm text-gray-500">{client.email}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        {client.phone && (
                          <span className="text-xs text-gray-500">{client.phone}</span>
                        )}
                        {client.cpf_cnpj && (
                          <span className="text-xs text-gray-500">{client.cpf_cnpj}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredClients.length === 0 && (
              <div className="text-center py-8">
                <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum cliente encontrado</p>
                <p className="text-sm text-gray-400">Tente buscar com outros termos</p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Topic & Details */}
        {step === 2 && selectedClient && (
          <div className="p-6">
            {/* Selected Client */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <UserIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{selectedClient.name}</h4>
                  <p className="text-sm text-gray-500">{selectedClient.email}</p>
                </div>
              </div>
            </div>

            {/* Topic Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tópico da Conversa *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {topics.filter(topic => topic.is_active).map((topic) => (
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
                Título da Conversa
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder={`Conversa com ${selectedClient.name}`}
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
                  onChange={(e) => setConversationType(e.target.value as 'internal' | 'client' | 'whatsapp')}
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
                  onChange={(e) => setPriority(e.target.value as 'low' | 'normal' | 'high' | 'urgent')}
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
                disabled={!selectedTopic}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Criar Conversa
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}