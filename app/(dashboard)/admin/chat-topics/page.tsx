'use client'

import { useState } from 'react'
import { AdminOnly } from '@/components/auth/role-guard'
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  TagIcon
} from '@heroicons/react/24/outline'

interface ConversationTopic {
  id: string
  name: string
  description: string
  color: string
  icon: string
  is_active: boolean
  created_at: string
  conversation_count?: number
}

// Mock data for conversation topics
const mockTopics: ConversationTopic[] = [
  {
    id: '1',
    name: 'Geral',
    description: 'Conversas gerais com clientes',
    color: '#0066CC',
    icon: 'ChatBubbleLeftRightIcon',
    is_active: true,
    created_at: '2024-01-15',
    conversation_count: 25
  },
  {
    id: '2',
    name: 'Consulta Jurídica',
    description: 'Consultas e dúvidas jurídicas',
    color: '#10B981',
    icon: 'DocumentTextIcon',
    is_active: true,
    created_at: '2024-01-15',
    conversation_count: 18
  },
  {
    id: '3',
    name: 'Documentos',
    description: 'Envio e recebimento de documentos',
    color: '#F59E0B',
    icon: 'PaperClipIcon',
    is_active: true,
    created_at: '2024-01-15',
    conversation_count: 12
  },
  {
    id: '4',
    name: 'Audiências',
    description: 'Informações sobre audiências e prazos',
    color: '#EF4444',
    icon: 'CalendarIcon',
    is_active: true,
    created_at: '2024-01-15',
    conversation_count: 8
  },
  {
    id: '5',
    name: 'Urgente',
    description: 'Comunicações urgentes',
    color: '#DC2626',
    icon: 'ExclamationTriangleIcon',
    is_active: true,
    created_at: '2024-01-15',
    conversation_count: 3
  }
]

const availableIcons = [
  { name: 'ChatBubbleLeftRightIcon', label: 'Chat' },
  { name: 'DocumentTextIcon', label: 'Documento' },
  { name: 'PaperClipIcon', label: 'Anexo' },
  { name: 'CalendarIcon', label: 'Calendário' },
  { name: 'ExclamationTriangleIcon', label: 'Urgente' },
  { name: 'UserIcon', label: 'Usuário' },
  { name: 'PhoneIcon', label: 'Telefone' },
  { name: 'EnvelopeIcon', label: 'Email' },
  { name: 'CogIcon', label: 'Configuração' },
  { name: 'QuestionMarkCircleIcon', label: 'Ajuda' }
]

const predefinedColors = [
  '#0066CC', '#10B981', '#F59E0B', '#EF4444', '#DC2626',
  '#8B5CF6', '#06B6D4', '#84CC16', '#F97316', '#EC4899'
]

export default function ChatTopicsPage() {
  const [topics, setTopics] = useState<ConversationTopic[]>(mockTopics)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTopic, setEditingTopic] = useState<ConversationTopic | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#0066CC',
    icon: 'ChatBubbleLeftRightIcon',
    is_active: true
  })

  const handleCreateTopic = () => {
    setEditingTopic(null)
    setFormData({
      name: '',
      description: '',
      color: '#0066CC',
      icon: 'ChatBubbleLeftRightIcon',
      is_active: true
    })
    setIsModalOpen(true)
  }

  const handleEditTopic = (topic: ConversationTopic) => {
    setEditingTopic(topic)
    setFormData({
      name: topic.name,
      description: topic.description,
      color: topic.color,
      icon: topic.icon,
      is_active: topic.is_active
    })
    setIsModalOpen(true)
  }

  const handleSaveTopic = () => {
    if (!formData.name.trim()) return

    if (editingTopic) {
      // Update existing topic
      setTopics(prev => prev.map(topic => 
        topic.id === editingTopic.id 
          ? { ...topic, ...formData }
          : topic
      ))
    } else {
      // Create new topic
      const newTopic: ConversationTopic = {
        id: Date.now().toString(),
        ...formData,
        created_at: new Date().toISOString().split('T')[0],
        conversation_count: 0
      }
      setTopics(prev => [...prev, newTopic])
    }

    setIsModalOpen(false)
    console.log('Topic saved:', formData)
  }

  const handleDeleteTopic = (topic: ConversationTopic) => {
    if (topic.conversation_count && topic.conversation_count > 0) {
      if (!confirm(`Este tópico tem ${topic.conversation_count} conversas. Tem certeza que deseja excluí-lo?`)) {
        return
      }
    }
    
    setTopics(prev => prev.filter(t => t.id !== topic.id))
    console.log('Topic deleted:', topic.id)
  }

  const handleToggleActive = (topic: ConversationTopic) => {
    setTopics(prev => prev.map(t => 
      t.id === topic.id 
        ? { ...t, is_active: !t.is_active }
        : t
    ))
    console.log('Topic status toggled:', topic.id)
  }

  return (
    <AdminOnly>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tópicos de Conversa</h1>
            <p className="text-gray-600">Gerencie os tópicos para organizar as conversas com clientes</p>
          </div>
          <button
            onClick={handleCreateTopic}
            className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Novo Tópico
          </button>
        </div>

        {/* Topics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic) => (
            <div 
              key={topic.id} 
              className={`bg-white rounded-lg shadow-sm border-2 transition-all ${
                topic.is_active ? 'border-gray-200' : 'border-gray-100 opacity-60'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${topic.color}20`, color: topic.color }}
                    >
                      <TagIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{topic.name}</h3>
                      <p className="text-sm text-gray-500">{topic.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleEditTopic(topic)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTopic(topic)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Conversas:</span>
                    <span className="font-medium">{topic.conversation_count || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Cor:</span>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: topic.color }}
                      />
                      <span className="font-mono text-xs">{topic.color}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Status:</span>
                    <button
                      onClick={() => handleToggleActive(topic)}
                      className={`px-2 py-1 text-xs rounded-full ${
                        topic.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {topic.is_active ? 'Ativo' : 'Inativo'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Statistics */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Estatísticas</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{topics.length}</div>
              <div className="text-sm text-gray-500">Total de Tópicos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {topics.filter(t => t.is_active).length}
              </div>
              <div className="text-sm text-gray-500">Tópicos Ativos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {topics.reduce((sum, t) => sum + (t.conversation_count || 0), 0)}
              </div>
              <div className="text-sm text-gray-500">Total de Conversas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(topics.reduce((sum, t) => sum + (t.conversation_count || 0), 0) / topics.filter(t => t.is_active).length) || 0}
              </div>
              <div className="text-sm text-gray-500">Média por Tópico</div>
            </div>
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">
                  {editingTopic ? 'Editar Tópico' : 'Novo Tópico'}
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome do Tópico *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Ex: Consulta Jurídica"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descrição
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Descreva o propósito deste tópico..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cor
                    </label>
                    <div className="grid grid-cols-5 gap-2 mb-3">
                      {predefinedColors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setFormData(prev => ({ ...prev, color }))}
                          className={`w-10 h-10 rounded-lg border-2 ${
                            formData.color === color ? 'border-gray-800' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="w-full h-10 rounded-lg border border-gray-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ícone
                    </label>
                    <select
                      value={formData.icon}
                      onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      {availableIcons.map((icon) => (
                        <option key={icon.name} value={icon.name}>
                          {icon.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                      Tópico ativo
                    </label>
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveTopic}
                    disabled={!formData.name.trim()}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                  >
                    {editingTopic ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminOnly>
  )
}