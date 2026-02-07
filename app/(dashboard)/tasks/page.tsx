'use client'

import { useState, useMemo } from 'react'
import { useAuthContext } from '@/lib/providers/auth-provider'
import { StaffOnly } from '@/components/auth/role-guard'
import { useTasks, useToggleTaskStatus, useDeleteTask } from '@/lib/queries/useTasks'
import { useToast } from '@/components/ui/toast-provider'
import { CreateTaskDialog } from '@/components/tasks/create-task-dialog'
import { EditTaskDialog } from '@/components/tasks/edit-task-dialog'
import { DeleteTaskDialog } from '@/components/tasks/delete-task-dialog'
import { TaskStats } from '@/components/tasks/task-stats'
import { TaskItem } from '@/components/tasks/task-item'
import type { Task } from '@/types/database'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline'

const statusOptions = [
  { value: '', label: 'Todos os Status' },
  { value: 'pending', label: 'Pendente' },
  { value: 'in_progress', label: 'Em Andamento' },
  { value: 'completed', label: 'Concluída' },
  { value: 'cancelled', label: 'Cancelada' },
]

const priorityOptions = [
  { value: '', label: 'Todas as Prioridades' },
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
]

export default function TasksPage() {
  const { profile } = useAuthContext()
  const toast = useToast()
  const { data: tasks = [], isLoading } = useTasks(profile?.law_firm_id)
  const toggleStatus = useToggleTaskStatus()
  const deleteTask = useDeleteTask()

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deletingTask, setDeletingTask] = useState<Task | null>(null)

  const filteredTasks = useMemo(() => {
    let filtered = tasks

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(term) ||
          task.description?.toLowerCase().includes(term) ||
          task.matter?.title?.toLowerCase().includes(term) ||
          task.assigned_user?.full_name?.toLowerCase().includes(term)
      )
    }

    if (statusFilter) {
      filtered = filtered.filter((task) => task.status === statusFilter)
    }

    if (priorityFilter) {
      filtered = filtered.filter((task) => task.priority === priorityFilter)
    }

    return filtered
  }, [tasks, searchTerm, statusFilter, priorityFilter])

  const stats = useMemo(() => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]

    return {
      totalTasks: tasks.length,
      pendingTasks: tasks.filter((t) => t.status === 'pending').length,
      inProgress: tasks.filter((t) => t.status === 'in_progress').length,
      completedToday: tasks.filter(
        (t) => t.status === 'completed' && t.completed_date?.split('T')[0] === today
      ).length,
      overdueTasks: tasks.filter(
        (t) => t.status !== 'completed' && t.due_date && new Date(t.due_date) < now
      ).length,
      highPriorityTasks: tasks.filter(
        (t) => ['high', 'urgent'].includes(t.priority || '') && t.status !== 'completed'
      ).length,
    }
  }, [tasks])

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    try {
      await toggleStatus.mutateAsync({ id: taskId, status: newStatus })
      toast.success('Status atualizado com sucesso')
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Erro ao atualizar status')
    }
  }

  const handleDelete = async () => {
    if (!deletingTask) return
    try {
      await deleteTask.mutateAsync(deletingTask.id)
      toast.success('Tarefa excluída com sucesso')
      setDeletingTask(null)
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Erro ao excluir tarefa')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <StaffOnly
      fallback={
        <div className="min-h-64 flex items-center justify-center">
          <div className="text-center">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Acesso Restrito</h3>
            <p className="text-gray-600">Você não tem permissão para acessar as tarefas internas.</p>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tarefas</h1>
            <p className="mt-2 text-gray-600">Gerencie tarefas e atividades do escritório</p>
          </div>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Nova Tarefa
          </button>
        </div>

        <TaskStats stats={stats} />

        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="Buscar por título, descrição, caso..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <FunnelIcon className="-ml-1 mr-2 h-5 w-5" />
                Filtros
                <ChevronDownIcon
                  className={`ml-2 h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`}
                />
              </button>
            </div>

            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      id="status-filter"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="priority-filter" className="block text-sm font-medium text-gray-700">
                      Prioridade
                    </label>
                    <select
                      id="priority-filter"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                    >
                      {priorityOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {(searchTerm || statusFilter || priorityFilter) && (
                  <div className="mt-4">
                    <button
                      onClick={() => {
                        setSearchTerm('')
                        setStatusFilter('')
                        setPriorityFilter('')
                      }}
                      className="text-sm text-primary hover:text-primary/80"
                    >
                      Limpar todos os filtros
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="text-sm text-gray-700">
          Mostrando {filteredTasks.length} de {tasks.length} tarefas
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma tarefa encontrada</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter || priorityFilter
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Comece criando uma nova tarefa.'}
              </p>
              {!searchTerm && !statusFilter && !priorityFilter && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowCreateDialog(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                    Nova Tarefa
                  </button>
                </div>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredTasks.map((task) => (
                <li key={task.id}>
                  <TaskItem
                    task={task}
                    onEdit={setEditingTask}
                    onDelete={setDeletingTask}
                    onStatusChange={handleStatusChange}
                    isUpdating={toggleStatus.isPending}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <CreateTaskDialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} />
        <EditTaskDialog task={editingTask} onClose={() => setEditingTask(null)} />
        <DeleteTaskDialog
          task={deletingTask}
          onClose={() => setDeletingTask(null)}
          onConfirm={handleDelete}
          isDeleting={deleteTask.isPending}
        />
      </div>
    </StaffOnly>
  )
}
