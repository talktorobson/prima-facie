'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  useMyAssignedMatters,
  useMyTasks,
  useMyTimeEntries,
  useQuickLogTime,
} from '@/lib/queries/useStaffPortal'
import { useToast } from '@/components/ui/toast-provider'
import {
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('pt-BR')

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

const priorityColors: Record<string, string> = {
  low: 'text-gray-500',
  medium: 'text-yellow-500',
  high: 'text-orange-500',
  urgent: 'text-red-500',
}

interface MatterRow {
  id: string
  title: string
  matter_number: string
  status: string
  priority: string
  next_court_date: string | null
  matter_type: { name: string } | null
}

interface TaskRow {
  id: string
  title: string
  status: string
  priority: string
  due_date: string | null
  matter_id: string | null
  matters: { id: string; title: string } | null
}

interface TimeEntryRow {
  id: string
  description: string
  hours_worked: number
  work_date: string
  is_billable: boolean
  matter_id: string
  matters: { id: string; title: string } | null
}

function getWeekRange() {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return {
    start: monday.toISOString().split('T')[0],
    end: sunday.toISOString().split('T')[0],
  }
}

export default function StaffPortalPage() {
  const toast = useToast()
  const router = useRouter()
  const weekRange = getWeekRange()

  const { data: matters, isLoading: mattersLoading } = useMyAssignedMatters()
  const { data: tasks, isLoading: tasksLoading } = useMyTasks()
  const { data: timeEntries, isLoading: timeLoading } = useMyTimeEntries(weekRange)
  const quickLog = useQuickLogTime()

  const [formMatterId, setFormMatterId] = useState('')
  const [formHours, setFormHours] = useState('')
  const [formDescription, setFormDescription] = useState('')

  const isLoading = mattersLoading || tasksLoading || timeLoading

  const matterList = (matters ?? []) as unknown as MatterRow[]
  const taskList = (tasks ?? []) as unknown as TaskRow[]
  const entryList = (timeEntries ?? []) as unknown as TimeEntryRow[]

  const activeMatters = matterList.filter((m) => m.status === 'active')
  const pendingTasks = taskList.filter(
    (t) => t.status === 'pending' || t.status === 'in_progress'
  )
  const weekHours = entryList.reduce((sum, e) => sum + e.hours_worked, 0)

  const today = new Date().toISOString().split('T')[0]
  const todayTasks = taskList.filter((t) => {
    if (!t.due_date) return false
    return t.due_date <= today && (t.status === 'pending' || t.status === 'in_progress')
  })
  const overdueTasks = taskList.filter((t) => {
    if (!t.due_date) return false
    return t.due_date < today && t.status !== 'completed' && t.status !== 'cancelled'
  })

  const handleSubmitTime = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formMatterId || !formHours || !formDescription) {
      toast.warning('Preencha todos os campos.')
      return
    }
    try {
      await quickLog.mutateAsync({
        matter_id: formMatterId,
        hours_worked: parseFloat(formHours),
        description: formDescription,
      })
      toast.success('Horas registradas com sucesso!')
      setFormMatterId('')
      setFormHours('')
      setFormDescription('')
    } catch {
      toast.error('Erro ao registrar horas. Tente novamente.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-gray-600">Carregando painel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Portal do Colaborador</h1>
        <p className="mt-1 text-gray-600">
          Gerencie seus processos, tarefas e registre suas horas.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg p-5 flex items-center">
          <DocumentTextIcon className="h-6 w-6 text-blue-600 flex-shrink-0" />
          <div className="ml-5">
            <p className="text-sm font-medium text-gray-500">Meus Processos</p>
            <p className="text-lg font-medium text-gray-900">{activeMatters.length}</p>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg p-5 flex items-center">
          <ClipboardDocumentListIcon className="h-6 w-6 text-yellow-600 flex-shrink-0" />
          <div className="ml-5">
            <p className="text-sm font-medium text-gray-500">Tarefas Pendentes</p>
            <p className="text-lg font-medium text-gray-900">{pendingTasks.length}</p>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg p-5 flex items-center">
          <ClockIcon className="h-6 w-6 text-green-600 flex-shrink-0" />
          <div className="ml-5">
            <p className="text-sm font-medium text-gray-500">Horas esta Semana</p>
            <p className="text-lg font-medium text-gray-900">{weekHours.toFixed(1)}h</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick time entry */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Registrar Horas</h3>
          </div>
          <form onSubmit={handleSubmitTime} className="p-6 space-y-4">
            <div>
              <label htmlFor="matter" className="block text-sm font-medium text-gray-700">
                Processo
              </label>
              <select
                id="matter"
                value={formMatterId}
                onChange={(e) => setFormMatterId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              >
                <option value="">Selecione um processo</option>
                {matterList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.matter_number} - {m.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="hours" className="block text-sm font-medium text-gray-700">
                Horas
              </label>
              <input
                id="hours"
                type="number"
                step="0.25"
                min="0.25"
                max="24"
                value={formHours}
                onChange={(e) => setFormHours(e.target.value)}
                placeholder="Ex: 1.5"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="desc" className="block text-sm font-medium text-gray-700">
                Descricao
              </label>
              <textarea
                id="desc"
                rows={2}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Descreva a atividade realizada..."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={quickLog.isPending}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 disabled:opacity-50"
            >
              {quickLog.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Salvando...
                </>
              ) : (
                'Registrar Horas'
              )}
            </button>
          </form>
        </div>

        {/* Today's tasks */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Tarefas de Hoje</h3>
            {overdueTasks.length > 0 && (
              <span className="inline-flex items-center text-xs font-medium text-red-600">
                <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                {overdueTasks.length} atrasada(s)
              </span>
            )}
          </div>
          <div className="p-6">
            {todayTasks.length === 0 && overdueTasks.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">
                  Nenhuma tarefa para hoje.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...overdueTasks, ...todayTasks]
                  .filter(
                    (task, idx, arr) => arr.findIndex((t) => t.id === task.id) === idx
                  )
                  .slice(0, 8)
                  .map((task) => {
                    const isOverdue = task.due_date ? task.due_date < today : false
                    return (
                      <div
                        key={task.id}
                        className={`border rounded-lg p-3 ${
                          isOverdue
                            ? 'border-red-200 bg-red-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {task.title}
                          </h4>
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                              statusColors[task.status] ?? ''
                            }`}
                          >
                            {statusLabels[task.status] ?? task.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-gray-500 truncate">
                            {task.matters?.title ?? 'Sem processo'}
                          </p>
                          <div className="flex items-center">
                            {task.priority && (
                              <CalendarIcon
                                className={`h-3.5 w-3.5 mr-1 ${
                                  priorityColors[task.priority] ?? ''
                                }`}
                              />
                            )}
                            <span className="text-xs text-gray-400">
                              {task.due_date ? formatDate(task.due_date) : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assigned matters list */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Meus Processos Atribuidos</h3>
        </div>
        <div className="p-6">
          {matterList.length === 0 ? (
            <div className="text-center py-8">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">
                Nenhum processo atribuido.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Processo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Audiencia
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {matterList.slice(0, 10).map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/portal/staff/matters/${m.id}`)}>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-primary hover:underline">{m.title}</p>
                        <p className="text-xs text-gray-500">{m.matter_number}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {m.matter_type?.name ?? '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                            statusColors[m.status] ?? ''
                          }`}
                        >
                          {statusLabels[m.status] ?? m.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {m.next_court_date ? formatDate(m.next_court_date) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
