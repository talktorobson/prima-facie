'use client'

import { useState, useEffect } from 'react'
import { AdminOnly } from '@/components/auth/role-guard'
import { useEffectiveLawFirmId } from '@/lib/hooks/use-effective-law-firm-id'
import { useLawFirm, useUpdateLawFirm } from '@/lib/queries/useSettings'
import { useToast } from '@/components/ui/toast-provider'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'

interface ChatTopic {
  id: string
  name: string
  color: string
  description: string
  is_active: boolean
}

const COLOR_PALETTE = [
  '#0066CC', '#10B981', '#F59E0B', '#EF4444', '#DC2626',
  '#8B5CF6', '#EC4899', '#06B6D4', '#14B8A6', '#F97316',
]

const DEFAULT_TOPICS: ChatTopic[] = [
  { id: '1', name: 'Geral', color: '#0066CC', description: 'Conversas gerais com clientes', is_active: true },
  { id: '2', name: 'Consulta Juridica', color: '#10B981', description: 'Consultas e duvidas juridicas', is_active: true },
  { id: '3', name: 'Documentos', color: '#F59E0B', description: 'Envio e recebimento de documentos', is_active: true },
  { id: '4', name: 'Audiencias', color: '#EF4444', description: 'Informacoes sobre audiencias e prazos', is_active: true },
  { id: '5', name: 'Urgente', color: '#DC2626', description: 'Comunicacoes urgentes', is_active: true },
]

const emptyForm = { name: '', color: '#0066CC', description: '' }

export default function ChatTopicsPage() {
  const effectiveLawFirmId = useEffectiveLawFirmId()
  const toast = useToast()
  const { data: lawFirm, isLoading } = useLawFirm(effectiveLawFirmId ?? undefined)
  const updateLawFirm = useUpdateLawFirm()

  const [topics, setTopics] = useState<ChatTopic[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTopic, setEditingTopic] = useState<ChatTopic | null>(null)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (lawFirm?.features) {
      const features = lawFirm.features as Record<string, unknown>
      const saved = features.chat_topics as ChatTopic[] | undefined
      if (saved && Array.isArray(saved)) {
        setTopics(saved)
      }
    }
  }, [lawFirm])

  const saveTopics = (updated: ChatTopic[], onSuccess?: () => void) => {
    if (!effectiveLawFirmId) return

    const features = {
      ...((lawFirm?.features as Record<string, unknown>) || {}),
      chat_topics: updated,
    }

    updateLawFirm.mutate(
      { id: effectiveLawFirmId, updates: { features } },
      {
        onSuccess: () => {
          setTopics(updated)
          toast.success('Topicos salvos com sucesso!')
          onSuccess?.()
        },
        onError: () => toast.error('Erro ao salvar topicos.'),
      }
    )
  }

  const handleSeedDefaults = () => {
    if (topics.length > 0) {
      if (!confirm('Isso ira substituir os topicos existentes pelos padrao. Continuar?')) return
    }
    saveTopics(DEFAULT_TOPICS)
  }

  const handleOpenCreate = () => {
    setEditingTopic(null)
    setForm(emptyForm)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (topic: ChatTopic) => {
    setEditingTopic(topic)
    setForm({ name: topic.name, color: topic.color, description: topic.description })
    setIsModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return

    let updated: ChatTopic[]
    if (editingTopic) {
      updated = topics.map((t) =>
        t.id === editingTopic.id ? { ...t, name: form.name, color: form.color, description: form.description } : t
      )
    } else {
      const newTopic: ChatTopic = {
        id: crypto.randomUUID(),
        name: form.name,
        color: form.color,
        description: form.description,
        is_active: true,
      }
      updated = [...topics, newTopic]
    }

    saveTopics(updated, () => setIsModalOpen(false))
  }

  const handleToggleActive = (topicId: string) => {
    const updated = topics.map((t) => (t.id === topicId ? { ...t, is_active: !t.is_active } : t))
    saveTopics(updated)
  }

  const handleDelete = (topicId: string) => {
    const topic = topics.find((t) => t.id === topicId)
    if (!topic) return
    if (!confirm(`Excluir o topico "${topic.name}"?`)) return
    saveTopics(topics.filter((t) => t.id !== topicId))
  }

  return (
    <AdminOnly>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/admin" className="flex items-center text-gray-500 hover:text-gray-700">
              <ArrowLeftIcon className="h-5 w-5 mr-1" />
              Voltar
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Topicos de Conversa</h1>
              <p className="text-gray-600">Gerencie os topicos para organizar as conversas com clientes</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSeedDefaults}
              disabled={updateLawFirm.isPending}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <SparklesIcon className="h-4 w-4 mr-2" />
              Criar Topicos Padrao
            </button>
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Novo Topico
            </button>
          </div>
        </div>

        {/* Topics List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
            <p className="mt-3 text-gray-500">Carregando topicos...</p>
          </div>
        ) : topics.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <ChatBubbleLeftRightIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum topico configurado</h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              Crie topicos para categorizar as conversas com seus clientes ou use os topicos padrao.
            </p>
            <button
              onClick={handleSeedDefaults}
              disabled={updateLawFirm.isPending}
              className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              <SparklesIcon className="h-4 w-4 mr-2" />
              Criar Topicos Padrao
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topics.map((topic) => (
              <div
                key={topic.id}
                className={`bg-white rounded-lg border border-gray-200 p-5 transition-shadow hover:shadow-md ${
                  !topic.is_active ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: topic.color }}
                    />
                    <h3 className="font-semibold text-gray-900">{topic.name}</h3>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      topic.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {topic.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-4">{topic.description || 'Sem descricao'}</p>

                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <button
                    onClick={() => handleToggleActive(topic.id)}
                    disabled={updateLawFirm.isPending}
                    className="text-xs font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  >
                    {topic.is_active ? 'Desativar' : 'Ativar'}
                  </button>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleOpenEdit(topic)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded"
                      title="Editar"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(topic.id)}
                      disabled={updateLawFirm.isPending}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                      title="Excluir"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-5 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingTopic ? 'Editar Topico' : 'Novo Topico'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Ex: Consulta Juridica"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descricao</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Breve descricao do topico"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cor</label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_PALETTE.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setForm({ ...form, color })}
                        className={`w-8 h-8 rounded-full border-2 transition-transform ${
                          form.color === color ? 'border-gray-900 scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={updateLawFirm.isPending}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                  >
                    {updateLawFirm.isPending ? 'Salvando...' : editingTopic ? 'Salvar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminOnly>
  )
}
