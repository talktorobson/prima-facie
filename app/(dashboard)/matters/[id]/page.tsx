'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  PencilIcon,
  DocumentTextIcon,
  CalendarIcon,
  UserIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  PlusIcon,
  EyeIcon,
  TrashIcon,
  CircleStackIcon
} from '@heroicons/react/24/outline'
import { useQuery, useQueryClient } from '@tanstack/react-query'

// Import DataJud components
import { DataJudEnrichmentPanel } from '@/components/features/datajud/enrichment-panel'
import { DataJudTimelineEvents } from '@/components/features/datajud/timeline-events'

// Import hooks
import { useEffectiveLawFirmId } from '@/lib/hooks/use-effective-law-firm-id'
import { useMatter } from '@/lib/queries/useMatters'
import { useDocuments } from '@/lib/queries/useDocuments'
import { useSupabase } from '@/components/providers'
import { useToast } from '@/components/ui/toast-provider'

export default function MatterDetailPage() {
  const params = useParams()
  const router = useRouter()
  const effectiveLawFirmId = useEffectiveLawFirmId()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('overview')

  const matterId = params.id as string

  // Fetch matter data
  const { data: matter, isLoading: matterLoading, error: matterError } = useMatter(matterId)

  // Fetch documents for this matter
  const { data: documents = [], isLoading: docsLoading } = useDocuments(effectiveLawFirmId, { matter_id: matterId })

  // Fetch tasks for this matter
  const supabase = useSupabase()
  const { data: tasks = [] } = useQuery({
    queryKey: ['matter-tasks', matterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, assigned_user:users!tasks_assigned_to_fkey(id, full_name)')
        .eq('matter_id', matterId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!matterId,
  })

  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      novo: 'bg-blue-100 text-blue-800',
      analise: 'bg-yellow-100 text-yellow-800',
      ativo: 'bg-green-100 text-green-800',
      suspenso: 'bg-gray-100 text-gray-800',
      aguardando_cliente: 'bg-orange-100 text-orange-800',
      aguardando_documentos: 'bg-purple-100 text-purple-800',
      finalizado: 'bg-emerald-100 text-emerald-800',
      arquivado: 'bg-slate-100 text-slate-800',
      cancelado: 'bg-red-100 text-red-800'
    }

    const statusLabels: Record<string, string> = {
      novo: 'Novo',
      analise: 'Em Análise',
      ativo: 'Ativo',
      suspenso: 'Suspenso',
      aguardando_cliente: 'Aguardando Cliente',
      aguardando_documentos: 'Aguardando Docs',
      finalizado: 'Finalizado',
      arquivado: 'Arquivado',
      cancelado: 'Cancelado'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status] || status}
      </span>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const priorityStyles: Record<string, string> = {
      baixa: 'bg-gray-100 text-gray-600',
      media: 'bg-blue-100 text-blue-600',
      alta: 'bg-orange-100 text-orange-600',
      urgente: 'bg-red-100 text-red-600'
    }

    const priorityLabels: Record<string, string> = {
      baixa: 'Baixa',
      media: 'Média',
      alta: 'Alta',
      urgente: 'Urgente'
    }

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${priorityStyles[priority] || 'bg-gray-100 text-gray-600'}`}>
        {priorityLabels[priority] || priority}
      </span>
    )
  }

  const formatCurrency = (value: number | null | undefined) => {
    if (value == null) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getEventIcon = (eventType: string) => {
    const icons: Record<string, typeof CalendarIcon> = {
      audiencia: CalendarIcon,
      prazo: ClockIcon,
      peticao: DocumentTextIcon,
      despacho: ExclamationTriangleIcon,
      sentenca: CheckCircleIcon,
      recurso: ArrowLeftIcon,
      reuniao: UserIcon,
      ligacao: UserIcon,
      email: UserIcon,
      documento: DocumentTextIcon,
      outro: DocumentTextIcon
    }

    const IconComponent = icons[eventType] || DocumentTextIcon
    return <IconComponent className="h-4 w-4" />
  }

  const getEventStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      agendado: 'text-blue-600',
      em_andamento: 'text-yellow-600',
      concluido: 'text-green-600',
      cancelado: 'text-red-600',
      adiado: 'text-orange-600'
    }
    return colors[status] || 'text-gray-600'
  }

  // Derive display fields from real data
  const clientName = matter?.contacts?.[0]?.contact?.full_name || '-'
  const clientCpfCnpj = matter?.contacts?.[0]?.contact?.cpf_cnpj || ''
  const areaJuridica = matter?.matter_type?.name || '-'
  const responsibleLawyer = matter?.assigned_lawyer?.full_name || '-'

  // Loading state
  if (matterLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <svg className="animate-spin h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-500">Carregando processo...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (matterError || !matter) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Processo não encontrado</h3>
          <p className="mt-2 text-gray-500">
            {matterError?.message || 'Não foi possível carregar os dados do processo.'}
          </p>
          <Link
            href="/matters"
            className="mt-4 inline-flex items-center text-sm text-primary hover:text-primary/80"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Voltar para Processos
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/matters"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Voltar para Processos
          </Link>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab('datajud')}
            className="inline-flex items-center px-3 py-2 border border-indigo-300 shadow-sm text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <CircleStackIcon className="h-4 w-4 mr-2" />
            DataJud CNJ
          </button>
          <Link
            href={`/matters/${matter.id}/workflow`}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <ClockIcon className="h-4 w-4 mr-2" />
            Workflow
          </Link>
          <Link
            href={`/matters/${matter.id}/edit`}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Editar
          </Link>
        </div>
      </div>

      {/* Matter Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900">{matter.process_number || matter.title}</h1>
                {matter.priority && getPriorityBadge(matter.priority)}
                {matter.status && getStatusBadge(matter.status)}
              </div>
              <h2 className="mt-1 text-lg text-gray-600">{matter.title}</h2>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="px-6 py-4">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Cliente</dt>
              <dd className="mt-1 text-sm text-gray-900">{clientName}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Área Jurídica</dt>
              <dd className="mt-1 text-sm text-gray-900">{areaJuridica}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Responsável</dt>
              <dd className="mt-1 text-sm text-gray-900">{responsibleLawyer}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Valor da Causa</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatCurrency(matter.case_value)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'overview', name: 'Visão Geral', icon: DocumentTextIcon },
              { id: 'timeline', name: 'Cronologia', icon: ClockIcon },
              { id: 'datajud', name: 'DataJud CNJ', icon: CircleStackIcon },
              { id: 'documents', name: 'Documentos', icon: DocumentTextIcon },
              { id: 'financial', name: 'Financeiro', icon: CurrencyDollarIcon }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Description */}
              {matter.description && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Descrição</h3>
                  <p className="text-gray-700">{matter.description}</p>
                </div>
              )}

              {/* Key Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Legal Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-orange-600" />
                    Informações Jurídicas
                  </h4>
                  <dl className="space-y-2">
                    {matter.process_number && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Processo Nº</dt>
                        <dd className="text-sm text-gray-900">{matter.process_number}</dd>
                      </div>
                    )}
                    {matter.court_name && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Vara/Tribunal</dt>
                        <dd className="text-sm text-gray-900">{matter.court_name}</dd>
                      </div>
                    )}
                    {matter.jurisdiction && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Comarca</dt>
                        <dd className="text-sm text-gray-900">{matter.jurisdiction}</dd>
                      </div>
                    )}
                    {matter.opposing_party && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Parte Contrária</dt>
                        <dd className="text-sm text-gray-900">{matter.opposing_party}</dd>
                      </div>
                    )}
                    {matter.opposing_party_lawyer && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Advogado da Parte Contrária</dt>
                        <dd className="text-sm text-gray-900">{matter.opposing_party_lawyer}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Dates */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                    <CalendarIcon className="h-5 w-5 mr-2 text-purple-600" />
                    Datas Importantes
                  </h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Abertura</dt>
                      <dd className="text-sm text-gray-900">{formatDate(matter.opened_date)}</dd>
                    </div>
                    {matter.statute_of_limitations && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Prescrição</dt>
                        <dd className="text-sm text-gray-900">{formatDate(matter.statute_of_limitations)}</dd>
                      </div>
                    )}
                    {matter.next_hearing_date && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Próxima Audiência</dt>
                        <dd className="text-sm text-orange-600 font-medium">
                          {formatDateTime(matter.next_hearing_date)}
                        </dd>
                      </div>
                    )}
                    {matter.closed_date && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Encerramento</dt>
                        <dd className="text-sm text-gray-900">{formatDate(matter.closed_date)}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>

              {/* Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {matter.internal_notes && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Notas Internas</h4>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                      <p className="text-sm text-gray-700">{matter.internal_notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Cronologia do Processo</h3>
                <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Novo Evento
                </button>
              </div>

              {/* DataJud Timeline Integration */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-indigo-900 mb-2">Timeline Integrada DataJud</h4>
                <p className="text-sm text-indigo-700">
                  Esta timeline combina eventos manuais do sistema com movimentações oficiais do DataJud CNJ.
                  Eventos com baixa relevância podem ser filtrados.
                </p>
              </div>

              {/* DataJud Timeline Component */}
              <DataJudTimelineEvents
                caseId={matter.id}
                showClientView={false}
                maxHeight="500px"
                onEventToggle={(eventId, field, value) => {
                  toast.success('Evento atualizado')
                }}
              />

              {/* Tasks Section (replaces manual events) */}
              <div className="border-t pt-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Tarefas do Processo</h4>
                {tasks.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhuma tarefa registrada.</p>
                ) : (
                  <div className="flow-root">
                    <ul className="-mb-8">
                      {tasks.map((task: Record<string, unknown>, taskIdx: number) => (
                        <li key={task.id as string}>
                          <div className="relative pb-8">
                            {taskIdx !== tasks.length - 1 ? (
                              <span
                                className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                                aria-hidden="true"
                              />
                            ) : null}
                            <div className="relative flex space-x-3">
                              <div>
                                <span className={`bg-white h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${getEventStatusColor((task.status as string) || '')}`}>
                                  {getEventIcon((task.task_type as string) || 'outro')}
                                </span>
                              </div>
                              <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                <div>
                                  <p className="text-sm text-gray-900 font-medium">{task.title as string}</p>
                                  <p className="text-sm text-gray-500">{task.description as string}</p>
                                  {task.assigned_user && (
                                    <p className="text-xs text-gray-400 mt-1">
                                      Responsável: {(task.assigned_user as Record<string, string>).full_name}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                  <time dateTime={task.created_at as string}>{formatDateTime(task.created_at as string)}</time>
                                  <div className={`text-xs ${getEventStatusColor((task.status as string) || '')}`}>
                                    {(task.status as string) || ''}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DataJud Tab */}
          {activeTab === 'datajud' && (
            <div className="space-y-6">
              <DataJudEnrichmentPanel
                caseId={matter.id}
                caseTitle={matter.title}
                processNumber={matter.process_number || ''}
                onEnrichmentComplete={() => {
                  toast.success('Enriquecimento DataJud concluído')
                  queryClient.invalidateQueries({ queryKey: ['matters'] })
                }}
              />
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Documentos do Processo</h3>
                <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Upload Documento
                </button>
              </div>

              {docsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <svg className="animate-spin h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              ) : documents.length === 0 ? (
                <p className="text-sm text-gray-500 py-4">Nenhum documento encontrado.</p>
              ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {documents.map((document) => (
                      <li key={document.id}>
                        <div className="px-4 py-4 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <DocumentTextIcon className="h-8 w-8 text-gray-400" />
                              </div>
                              <div className="ml-4">
                                <div className="flex items-center">
                                  <p className="text-sm font-medium text-gray-900">{document.title}</p>
                                  {document.access_level === 'client' && (
                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                      Visível ao Cliente
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500">{document.description}</p>
                                <div className="mt-1 text-xs text-gray-400">
                                  {document.file_name} • {formatFileSize(document.file_size || 0)} •
                                  Enviado em {formatDateTime(document.created_at)}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button className="text-gray-400 hover:text-gray-600">
                                <EyeIcon className="h-5 w-5" />
                              </button>
                              <button className="text-gray-400 hover:text-red-600">
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Financial Tab */}
          {activeTab === 'financial' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Informações Financeiras</h3>

              {/* Financial Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ClockIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-blue-900">Horas Trabalhadas</p>
                      <p className="text-lg font-semibold text-blue-900">-</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-green-900">Total Faturado</p>
                      <p className="text-lg font-semibold text-green-900">-</p>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CurrencyDollarIcon className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-orange-900">Valor da Causa</p>
                      <p className="text-lg font-semibold text-orange-900">{formatCurrency(matter.case_value)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Billing Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">Configuração de Cobrança</h4>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Método de Cobrança</dt>
                    <dd className="text-sm text-gray-900">
                      {matter.billing_method === 'hourly' && 'Por Hora'}
                      {matter.billing_method === 'fixed' && 'Valor Fixo'}
                      {matter.billing_method === 'contingency' && 'Êxito'}
                      {matter.billing_method === 'retainer' && 'Honorários Antecipados'}
                      {!matter.billing_method && '-'}
                    </dd>
                  </div>
                  {matter.hourly_rate && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Valor por Hora</dt>
                      <dd className="text-sm text-gray-900">{formatCurrency(matter.hourly_rate)}</dd>
                    </div>
                  )}
                  {matter.fixed_fee && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Valor Fixo</dt>
                      <dd className="text-sm text-gray-900">{formatCurrency(matter.fixed_fee)}</dd>
                    </div>
                  )}
                  {matter.retainer_amount && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Honorários Antecipados</dt>
                      <dd className="text-sm text-gray-900">{formatCurrency(matter.retainer_amount)}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
