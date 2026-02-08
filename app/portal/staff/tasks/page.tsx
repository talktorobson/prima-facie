'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useMyTasks } from '@/lib/queries/useStaffPortal'
import { useToast } from '@/components/ui/toast-provider'
import { useSupabase } from '@/components/providers'
import {
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  in_progress: 'Em Progresso',
  completed: 'Concluido',
  cancelled: 'Cancelada',
}

const statusColors: Record<string, string> = {
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

interface TaskRow {
  id: string
  title: string
  status: string
  priority: string
  due_date: string | null
  matter_id: string | null
  matters: { id: string; title: string } | null
}

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('pt-BR')

const statusFlow: Record<string, string> = {
  pending: 'in_progress',
  in_progress: 'completed',
}

export default function StaffTasksPage() {
  const toast = useToast()
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  const { data: tasks, isLoading } = useMyTasks()
  const taskList = (tasks ?? []) as unknown as TaskRow[]

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)

  const today = new Date().toISOString().split('T')[0]

  const filteredTasks = taskList.filter((task) => {
    if (search) {
      const q = search.toLowerCase()
      const title = task.title.toLowerCase()
      const matter = task.matters?.title?.toLowerCase() ?? ''
      if (!title.includes(q) && !matter.includes(q)) return false
    }
    if (statusFilter !== 'all' && task.status !== statusFilter) return false
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false
    return true
  })

  const totalCount = taskList.length
  const pendingCount = taskList.filter((t) => t.status === 'pending').length
  const inProgressCount = taskList.filter((t) => t.status === 'in_progress').length
  const overdueCount = taskList.filter(
    (t) => t.due_date && t.due_date < today && t.status !== 'completed' && t.status !== 'cancelled'
  ).length

  const updateStatus = async (taskId: string, newStatus: string) => {
    setUpdatingTaskId(taskId)
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId)

      if (error) throw error

      queryClient.invalidateQueries({ queryKey: ['portal', 'staff', 'my-tasks'] })
      toast.success(`Tarefa atualizada para ${statusLabels[newStatus] ?? newStatus}.`)
    } catch {
      toast.error('Erro ao atualizar tarefa. Tente novamente.')
    } finally {
      setUpdatingTaskId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-gray-600">Carregando tarefas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Minhas Tarefas</h1>
        <p className="mt-1 text-gray-600">Gerencie e acompanhe suas tarefas atribuidas.</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white shadow rounded-lg p-4 flex items-center">
          <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600 flex-shrink-0" />
          <div className="ml-3">
            <p className="text-xs font-medium text-gray-500">Total</p>
            <p className="text-lg font-semibold text-gray-900">{totalCount}</p>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-4 flex items-center">
          <ClockIcon className="h-6 w-6 text-yellow-600 flex-shrink-0" />
          <div className="ml-3">
            <p className="text-xs font-medium text-gray-500">Pendentes</p>
            <p className="text-lg font-semibold text-gray-900">{pendingCount}</p>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-4 flex items-center">
          <CheckCircleIcon className="h-6 w-6 text-blue-600 flex-shrink-0" />
          <div className="ml-3">
            <p className="text-xs font-medium text-gray-500">Em Andamento</p>
            <p className="text-lg font-semibold text-gray-900">{inProgressCount}</p>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-4 flex items-center">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-600 flex-shrink-0" />
          <div className="ml-3">
            <p className="text-xs font-medium text-gray-500">Atrasadas</p>
            <p className="text-lg font-semibold text-gray-900">{overdueCount}</p>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por titulo ou processo..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Todas</option>
            <option value="pending">Pendente</option>
            <option value="in_progress">Em Progresso</option>
            <option value="completed">Concluida</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Todas</option>
            <option value="low">Baixa</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
            <option value="urgent">Urgente</option>
          </select>
        </div>
      </div>

      {/* Task list */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-white shadow rounded-lg py-12 text-center">
            <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">
              {search || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Nenhuma tarefa encontrada com os filtros selecionados.'
                : 'Nenhuma tarefa atribuida.'}
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isOverdue =
              task.due_date &&
              task.due_date < today &&
              task.status !== 'completed' &&
              task.status !== 'cancelled'
            const nextStatus = statusFlow[task.status]
            const isUpdating = updatingTaskId === task.id

            return (
              <div
                key={task.id}
                className={`bg-white shadow rounded-lg p-4 ${
                  isOverdue ? 'border-l-4 border-red-500' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {task.title}
                      </h3>
                      {isOverdue && (
                        <span className="inline-flex items-center text-xs text-red-600">
                          <ExclamationTriangleIcon className="h-3.5 w-3.5 mr-0.5" />
                          Atrasada
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      {task.matters && (
                        <span className="truncate">{task.matters.title}</span>
                      )}
                      {task.due_date && (
                        <span className="flex items-center whitespace-nowrap">
                          <CalendarIcon className="h-3.5 w-3.5 mr-0.5" />
                          {formatDate(task.due_date)}
                        </span>
                      )}
                    </div>
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
                    {nextStatus && (
                      <button
                        onClick={() => updateStatus(task.id, nextStatus)}
                        disabled={isUpdating}
                        className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md bg-primary text-white hover:bg-primary/90 disabled:opacity-50 whitespace-nowrap"
                      >
                        {isUpdating ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                        ) : task.status === 'pending' ? (
                          'Iniciar'
                        ) : (
                          'Concluir'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
