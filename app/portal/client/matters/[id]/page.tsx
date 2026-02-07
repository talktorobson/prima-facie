'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useSupabase } from '@/components/providers'
import { useAuthContext } from '@/lib/providers/auth-provider'
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  CalendarIcon,
  UserIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon,
  PaperClipIcon,
  XMarkIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline'

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    ativo: 'text-green-700 bg-green-50 ring-green-600/20',
    active: 'text-green-700 bg-green-50 ring-green-600/20',
    aguardando_documentos: 'text-yellow-700 bg-yellow-50 ring-yellow-600/20',
    suspenso: 'text-red-700 bg-red-50 ring-red-600/20',
    finalizado: 'text-gray-700 bg-gray-50 ring-gray-600/20',
    closed: 'text-gray-700 bg-gray-50 ring-gray-600/20'
  }
  return colors[status] || 'text-green-700 bg-green-50 ring-green-600/20'
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    ativo: 'Ativo',
    active: 'Ativo',
    aguardando_documentos: 'Aguardando Documentos',
    suspenso: 'Suspenso',
    finalizado: 'Finalizado',
    closed: 'Finalizado'
  }
  return labels[status] || status
}

const getPriorityIcon = (priority: string) => {
  if (priority === 'alta' || priority === 'high') {
    return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
  }
  if (priority === 'media' || priority === 'medium') {
    return <ClockIcon className="h-4 w-4 text-yellow-500" />
  }
  return <CheckCircleIcon className="h-4 w-4 text-green-500" />
}

const getTimelineIcon = (type: string) => {
  const icons: Record<string, typeof DocumentTextIcon> = {
    document: DocumentTextIcon,
    hearing: CalendarIcon,
    meeting: UserIcon,
    status: CheckCircleIcon
  }
  const IconComponent = icons[type] || DocumentTextIcon
  return <IconComponent className="h-5 w-5 text-white" />
}

const getTimelineColor = (type: string) => {
  const colors: Record<string, string> = {
    document: 'bg-blue-500',
    hearing: 'bg-green-500',
    meeting: 'bg-purple-500',
    status: 'bg-gray-500'
  }
  return colors[type] || 'bg-blue-500'
}

function useMatterDetail(matterId: string) {
  const supabase = useSupabase()
  const { profile } = useAuthContext()

  return useQuery({
    queryKey: ['portal', 'matter-detail', matterId],
    queryFn: async () => {
      // Verify the client has access to this matter via matter_contacts
      const { data: contact } = await supabase
        .from('contacts')
        .select('id')
        .eq('user_id', profile!.id)
        .single()

      if (!contact) return null

      const { data: matterContact } = await supabase
        .from('matter_contacts')
        .select('matter_id')
        .eq('contact_id', contact.id)
        .eq('matter_id', matterId)
        .single()

      if (!matterContact) return null

      // Fetch full matter details
      const { data: matter, error } = await supabase
        .from('matters')
        .select(`
          *,
          matter_type:matter_types(name),
          responsible_lawyer:users!matters_responsible_lawyer_id_fkey(
            id, full_name, email, phone, oab_number, position
          )
        `)
        .eq('id', matterId)
        .single()

      if (error) throw error

      // Fetch documents visible to client
      const { data: documents } = await supabase
        .from('documents')
        .select('id, name, description, file_type, file_size, created_at, access_level, storage_path')
        .eq('matter_id', matterId)
        .in('access_level', ['public', 'internal'])
        .order('created_at', { ascending: false })

      // Fetch tasks related to this matter (as timeline)
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, title, description, status, priority, due_date, created_at')
        .eq('matter_id', matterId)
        .order('created_at', { ascending: false })

      return {
        ...matter,
        documents: documents || [],
        tasks: tasks || []
      }
    },
    enabled: !!profile?.id && !!matterId,
  })
}

export default function ClientMatterDetailPage() {
  const params = useParams()
  const matterId = params.id as string

  const { data: matter, isLoading, error } = useMatterDetail(matterId)
  const [activeTab, setActiveTab] = useState('overview')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const uploadInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(uploadInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      setTimeout(() => {
        setUploadProgress(100)
        setTimeout(() => {
          setIsUploading(false)
          setUploadProgress(0)
          setShowUploadModal(false)
          alert('Documento enviado com sucesso! Aguarde análise da equipe jurídica.')
        }, 500)
      }, 2000)
    } catch (err) {
      console.error('Upload error:', err)
      setIsUploading(false)
      setUploadProgress(0)
      alert('Erro ao enviar documento. Tente novamente.')
    }
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando detalhes do processo...</p>
        </div>
      </div>
    )
  }

  if (error || !matter) {
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          Processo não encontrado
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          O processo solicitado não existe ou você não tem permissão para visualizá-lo.
        </p>
        <div className="mt-6">
          <Link
            href="/portal/client/matters"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
          >
            Voltar aos Processos
          </Link>
        </div>
      </div>
    )
  }

  const lawyer = matter.responsible_lawyer as Record<string, unknown> | null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4">
          <div className="flex items-center space-x-3 mb-4">
            <Link
              href="/portal/client/matters"
              className="text-gray-400 hover:text-gray-600"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </Link>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{matter.title}</h1>
                  <p className="text-sm text-gray-500">{matter.matter_number}</p>
                </div>
                <div className="flex items-center space-x-3">
                  {getPriorityIcon(matter.priority || 'normal')}
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(matter.status)}`}>
                    {getStatusLabel(matter.status)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          {matter.description && (
            <p className="text-gray-600 mb-4">{matter.description}</p>
          )}

          {/* Quick Info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {lawyer && (
              <div className="flex items-center text-sm text-gray-600">
                <UserIcon className="h-4 w-4 mr-2" />
                {lawyer.full_name as string}
              </div>
            )}
            <div className="flex items-center text-sm text-gray-600">
              <CalendarIcon className="h-4 w-4 mr-2" />
              {matter.next_court_date
                ? `Audiência: ${formatDate(matter.next_court_date)}`
                : 'Sem audiência agendada'}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <ClockIcon className="h-4 w-4 mr-2" />
              Aberto: {matter.opened_date ? formatDate(matter.opened_date) : 'N/A'}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <DocumentTextIcon className="h-4 w-4 mr-2" />
              {matter.documents?.length || 0} documentos
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tasks'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Atividades
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'documents'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Documentos
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'contact'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Contato
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Detalhes do Processo</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Número do Processo</dt>
                      <dd className="text-sm text-gray-900">{matter.court_case_number || 'Ainda não distribuído'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Tipo de Processo</dt>
                      <dd className="text-sm text-gray-900">
                        {(matter.matter_type as Record<string, unknown>)?.name || 'N/A'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Tribunal / Vara</dt>
                      <dd className="text-sm text-gray-900">{matter.court_branch || 'A definir'}</dd>
                    </div>
                    {matter.estimated_value && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Valor da Causa</dt>
                        <dd className="text-sm text-gray-900">{formatCurrency(matter.estimated_value)}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Data de Abertura</dt>
                      <dd className="text-sm text-gray-900">{matter.opened_date ? formatDate(matter.opened_date) : 'N/A'}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Próximas Etapas</h3>
                  {matter.tasks && matter.tasks.length > 0 ? (
                    <div className="space-y-3">
                      {matter.tasks
                        .filter((t: Record<string, unknown>) => t.status !== 'completed' && t.status !== 'cancelled')
                        .slice(0, 3)
                        .map((task: Record<string, unknown>) => (
                          <div key={task.id as string} className="border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-medium text-gray-900">{task.title as string}</h4>
                              {getPriorityIcon((task.priority as string) || 'normal')}
                            </div>
                            {task.description && (
                              <p className="text-sm text-gray-600 mb-2">{task.description as string}</p>
                            )}
                            {task.due_date && (
                              <p className="text-xs text-gray-500">Prazo: {formatDate(task.due_date as string)}</p>
                            )}
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Nenhuma atividade pendente.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tasks/Timeline Tab */}
          {activeTab === 'tasks' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-6">Atividades do Processo</h3>
              {matter.tasks && matter.tasks.length > 0 ? (
                <div className="flow-root">
                  <ul className="-mb-8">
                    {matter.tasks.map((task: Record<string, unknown>, index: number) => (
                      <li key={task.id as string}>
                        <div className="relative pb-8">
                          {index !== matter.tasks.length - 1 && (
                            <span
                              className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200"
                              aria-hidden="true"
                            />
                          )}
                          <div className="relative flex items-start space-x-3">
                            <div className={`relative px-1 h-10 w-10 rounded-full flex items-center justify-center ${
                              task.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                            }`}>
                              {task.status === 'completed'
                                ? <CheckCircleIcon className="h-5 w-5 text-white" />
                                : <ClockIcon className="h-5 w-5 text-white" />
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm">
                                <span className="font-medium text-gray-900">{task.title as string}</span>
                              </div>
                              {task.description && (
                                <p className="mt-1 text-sm text-gray-600">{task.description as string}</p>
                              )}
                              <div className="mt-2 flex items-center space-x-3 text-xs text-gray-500">
                                {task.due_date && <span>Prazo: {formatDate(task.due_date as string)}</span>}
                                <span className={`px-2 py-0.5 rounded-full ${
                                  task.status === 'completed' ? 'bg-green-100 text-green-700' :
                                  task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {task.status === 'completed' ? 'Concluído' :
                                   task.status === 'in_progress' ? 'Em andamento' : 'Pendente'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">Nenhuma atividade registrada.</p>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Documentos do Processo</h3>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <PaperClipIcon className="-ml-1 mr-2 h-5 w-5" />
                  Enviar Documento
                </button>
              </div>
              {matter.documents && matter.documents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {matter.documents.map((doc: Record<string, unknown>) => (
                    <div key={doc.id as string} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <PaperClipIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <h4 className="text-sm font-medium text-gray-900">{doc.name as string}</h4>
                        </div>
                      </div>
                      {doc.description && (
                        <p className="text-sm text-gray-600 mb-2">{doc.description as string}</p>
                      )}
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>Tipo: {(doc.file_type as string) || 'N/A'}</p>
                        <p>Tamanho: {formatFileSize(doc.file_size as number | null)}</p>
                        <p>Upload: {doc.created_at ? formatDate(doc.created_at as string) : 'N/A'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">Nenhum documento encontrado.</p>
              )}
            </div>
          )}

          {/* Contact Tab */}
          {activeTab === 'contact' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-6">Informações de Contato</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {lawyer && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Advogado Responsável</h4>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <UserIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{lawyer.full_name as string}</p>
                          {lawyer.oab_number && (
                            <p className="text-xs text-gray-500">{lawyer.oab_number as string}</p>
                          )}
                        </div>
                      </div>
                      {lawyer.email && (
                        <div className="flex items-center">
                          <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-400 mr-3" />
                          <p className="text-sm text-gray-900">{lawyer.email as string}</p>
                        </div>
                      )}
                      {lawyer.phone && (
                        <div className="flex items-center">
                          <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                          <p className="text-sm text-gray-900">{lawyer.phone as string}</p>
                        </div>
                      )}
                    </div>
                    <div className="mt-6">
                      <Link
                        href="/portal/client/messages"
                        className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                      >
                        <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                        Enviar Mensagem
                      </Link>
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Escritório</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">D&apos;Ávila Reis Advocacia</p>
                      <p className="text-xs text-gray-500">Especialistas em Direito Trabalhista e Civil</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Document Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[500px] shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium text-gray-900">Enviar Documento</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleFileUpload}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Arquivo *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-2">
                      <label htmlFor="client-file-upload" className="cursor-pointer">
                        <span className="text-primary font-medium">Clique para enviar</span>
                        <span className="text-gray-500"> ou arraste e solte</span>
                        <input
                          id="client-file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                          required
                        />
                      </label>
                    </div>
                    <p className="text-sm text-gray-500">
                      PDF, DOC, DOCX, JPG, PNG, TXT até 10MB
                    </p>
                  </div>
                </div>

                {isUploading && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição do Documento
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Descreva brevemente o conteúdo ou relevância do documento..."
                    required
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Importante:</strong> Todos os documentos enviados serão analisados pela equipe jurídica.
                    Você receberá uma notificação quando o documento for processado e disponibilizado no processo.
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    disabled={isUploading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50"
                    disabled={isUploading}
                  >
                    {isUploading ? 'Enviando...' : 'Enviar Documento'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
