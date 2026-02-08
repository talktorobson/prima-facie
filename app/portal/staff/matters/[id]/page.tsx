'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useMatter } from '@/lib/queries/useMatters'
import { useSupabase } from '@/components/providers'
import { useAuthContext } from '@/lib/providers/auth-provider'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  FolderIcon,
  CalendarIcon,
  ScaleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

const statusLabels: Record<string, string> = {
  active: 'Ativo',
  closed: 'Encerrado',
  on_hold: 'Suspenso',
  settled: 'Acordo',
  dismissed: 'Arquivado',
  pending: 'Pendente',
  in_progress: 'Em Progresso',
  completed: 'Concluido',
  cancelled: 'Cancelada',
}

const statusColors: Record<string, string> = {
  active: 'bg-green-50 text-green-700 ring-green-600/20',
  closed: 'bg-gray-50 text-gray-700 ring-gray-600/20',
  on_hold: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
  pending: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
  in_progress: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  completed: 'bg-green-50 text-green-700 ring-green-600/20',
  cancelled: 'bg-gray-50 text-gray-500 ring-gray-400/20',
}

const priorityLabels: Record<string, string> = {
  low: 'Baixa',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
}

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
}

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('pt-BR')

type TabKey = 'overview' | 'tasks' | 'hours' | 'documents'

const tabs: { key: TabKey; label: string; icon: typeof DocumentTextIcon }[] = [
  { key: 'overview', label: 'Visao Geral', icon: DocumentTextIcon },
  { key: 'tasks', label: 'Tarefas', icon: ClipboardDocumentListIcon },
  { key: 'hours', label: 'Horas', icon: ClockIcon },
  { key: 'documents', label: 'Documentos', icon: FolderIcon },
]

interface TaskRow {
  id: string
  title: string
  status: string
  priority: string
  due_date: string | null
}

interface TimeEntryRow {
  id: string
  description: string
  hours_worked: number
  work_date: string
  is_billable: boolean
}

interface DocumentRow {
  id: string
  title: string
  file_name: string | null
  file_size: number | null
  file_type: string | null
  created_at: string
}

export default function StaffMatterDetailPage({ params }: { params: { id: string } }) {
  const { id } = params
  const supabase = useSupabase()
  const { profile } = useAuthContext()
  const [activeTab, setActiveTab] = useState<TabKey>('overview')

  const { data: matter, isLoading: matterLoading } = useMatter(id)

  const { data: tasks = [] } = useQuery({
    queryKey: ['staff-matter-tasks', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, status, priority, due_date')
        .eq('matter_id', id)
        .order('due_date')
      if (error) throw error
      return data as TaskRow[]
    },
    enabled: !!id,
  })

  const { data: timeEntries = [] } = useQuery({
    queryKey: ['staff-matter-time-entries', id, profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('time_entries')
        .select('id, description, hours_worked, work_date, is_billable')
        .eq('matter_id', id)
        .eq('user_id', profile!.id)
        .order('work_date', { ascending: false })
      if (error) throw error
      return data as TimeEntryRow[]
    },
    enabled: !!id && !!profile?.id,
  })

  const { data: documents = [] } = useQuery({
    queryKey: ['staff-matter-documents', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('id, title, file_name, file_size, file_type, created_at')
        .eq('matter_id', id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as DocumentRow[]
    },
    enabled: !!id,
  })

  if (matterLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-gray-600">Carregando processo...</p>
        </div>
      </div>
    )
  }

  if (!matter) {
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-300" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Processo nao encontrado</h3>
        <p className="mt-1 text-sm text-gray-500">O processo solicitado nao foi encontrado.</p>
        <div className="mt-6">
          <Link
            href="/portal/staff"
            className="text-sm font-medium text-primary hover:text-primary/80"
          >
            Voltar ao painel
          </Link>
        </div>
      </div>
    )
  }

  const matterData = matter as unknown as Record<string, unknown>
  const matterType = matterData.matter_type as { name?: string } | null
  const today = new Date().toISOString().split('T')[0]

  const totalHours = timeEntries.reduce((sum, e) => sum + e.hours_worked, 0)

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/portal/staff"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeftIcon className="h-4 w-4 mr-1" />
        Voltar ao painel
      </Link>

      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {matter.title}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {(matter as unknown as Record<string, unknown>).matter_number as string}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                statusColors[matter.status ?? ''] ?? ''
              }`}
            >
              {statusLabels[matter.status ?? ''] ?? matter.status}
            </span>
            {matter.priority && (
              <span
                className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ${
                  priorityColors[matter.priority] ?? ''
                }`}
              >
                {priorityLabels[matter.priority] ?? matter.priority}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Description */}
          {(matterData.description as string) && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Descricao</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {matterData.description as string}
              </p>
            </div>
          )}

          {/* Legal info grid */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Informacoes do Processo</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">Tipo</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  <ScaleIcon className="h-4 w-4 text-gray-400 mr-1" />
                  {matterType?.name ?? '-'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">Numero do Caso</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {(matterData.case_number as string) ?? '-'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">Tribunal</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {(matterData.court as string) ?? '-'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">Jurisdicao</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {(matterData.jurisdiction as string) ?? '-'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">Metodo de Cobranca</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {(matterData.billing_method as string) ?? '-'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">Minhas Horas</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {totalHours.toFixed(1)}h
                </dd>
              </div>
            </div>
          </div>

          {/* Important dates */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Datas Importantes</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">Data de Abertura</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
                  {(matterData.open_date as string) ? formatDate(matterData.open_date as string) : '-'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">Proxima Audiencia</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
                  {(matterData.next_court_date as string) ? formatDate(matterData.next_court_date as string) : '-'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase">Prazo Final</dt>
                <dd className="mt-1 text-sm text-gray-900 flex items-center">
                  <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
                  {(matterData.statute_of_limitations as string) ? formatDate(matterData.statute_of_limitations as string) : '-'}
                </dd>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Tarefas ({tasks.length})
            </h3>
          </div>
          <div className="p-6">
            {tasks.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">
                  Nenhuma tarefa neste processo.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => {
                  const isOverdue =
                    task.due_date &&
                    task.due_date < today &&
                    task.status !== 'completed' &&
                    task.status !== 'cancelled'
                  return (
                    <div
                      key={task.id}
                      className={`border rounded-lg p-3 ${
                        isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {task.title}
                          </h4>
                          {isOverdue && (
                            <ExclamationTriangleIcon className="h-4 w-4 text-red-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {task.priority && (
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                                priorityColors[task.priority] ?? ''
                              }`}
                            >
                              {priorityLabels[task.priority] ?? task.priority}
                            </span>
                          )}
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                              statusColors[task.status] ?? ''
                            }`}
                          >
                            {statusLabels[task.status] ?? task.status}
                          </span>
                        </div>
                      </div>
                      {task.due_date && (
                        <p className="text-xs text-gray-500 mt-1 flex items-center">
                          <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                          {formatDate(task.due_date)}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'hours' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Minhas Horas ({timeEntries.length})
            </h3>
            <span className="text-sm font-medium text-gray-700">
              Total: {totalHours.toFixed(1)}h
            </span>
          </div>
          <div className="p-6">
            {timeEntries.length === 0 ? (
              <div className="text-center py-8">
                <ClockIcon className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">
                  Nenhum registro de horas neste processo.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Data
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Descricao
                      </th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Horas
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Faturavel
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {timeEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-3 py-3 text-sm text-gray-700 whitespace-nowrap">
                          {formatDate(entry.work_date)}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-700 truncate max-w-[250px]">
                          {entry.description}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-900 font-medium text-right whitespace-nowrap">
                          {entry.hours_worked.toFixed(2)}h
                        </td>
                        <td className="px-3 py-3 text-center">
                          {entry.is_billable ? (
                            <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                              Sim
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-500">
                              Nao
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Documentos ({documents.length})
            </h3>
          </div>
          <div className="p-6">
            {documents.length === 0 ? (
              <div className="text-center py-8">
                <FolderIcon className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">
                  Nenhum documento neste processo.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => {
                  const formatSize = (bytes: number) => {
                    if (bytes < 1024) return `${bytes} B`
                    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
                    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
                  }

                  return (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
                    >
                      <div className="flex items-center min-w-0">
                        <FolderIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mr-3" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {doc.title || doc.file_name || 'Documento'}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            {doc.file_type && <span>{doc.file_type}</span>}
                            {doc.file_size && <span>{formatSize(doc.file_size)}</span>}
                            <span>{formatDate(doc.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
