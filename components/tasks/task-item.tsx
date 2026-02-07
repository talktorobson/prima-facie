'use client'

import type { Task } from '@/types/database'
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  FlagIcon,
  CalendarIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

interface TaskItemProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onStatusChange: (taskId: string, status: Task['status']) => void
  isUpdating: boolean
}

const taskTypeLabels = {
  general: 'Geral',
  deadline: 'Prazo',
  court_date: 'Audiência',
  client_meeting: 'Reunião com Cliente',
  document_review: 'Revisão de Documentos',
}

const getStatusBadge = (status?: string) => {
  const statusStyles = {
    pending: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  const statusLabels = {
    pending: 'Pendente',
    in_progress: 'Em Andamento',
    completed: 'Concluída',
    cancelled: 'Cancelada',
  }

  const statusIcons = {
    pending: ClockIcon,
    in_progress: PlayIcon,
    completed: CheckCircleIcon,
    cancelled: XMarkIcon,
  }

  const Icon = statusIcons[status as keyof typeof statusIcons] || ClockIcon

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800'
      }`}
    >
      <Icon className="w-3 h-3 mr-1" />
      {statusLabels[status as keyof typeof statusLabels] || status}
    </span>
  )
}

const getPriorityBadge = (priority?: string) => {
  const priorityStyles = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  }

  const priorityLabels = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
    urgent: 'Urgente',
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        priorityStyles[priority as keyof typeof priorityStyles] || 'bg-gray-100 text-gray-800'
      }`}
    >
      <FlagIcon className="w-3 h-3 mr-1" />
      {priorityLabels[priority as keyof typeof priorityLabels] || priority}
    </span>
  )
}

const formatDate = (dateString?: string) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('pt-BR')
}

const isOverdue = (task: Task) => {
  return task.status !== 'completed' && task.due_date && new Date(task.due_date) < new Date()
}

export function TaskItem({ task, onEdit, onDelete, onStatusChange, isUpdating }: TaskItemProps) {
  return (
    <div
      className={`px-4 py-4 sm:px-6 hover:bg-gray-50 ${
        isOverdue(task) ? 'border-l-4 border-red-500 bg-red-50' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <p className="text-lg font-medium text-gray-900 truncate">{task.title}</p>
            {getStatusBadge(task.status)}
            {getPriorityBadge(task.priority)}
            {isOverdue(task) && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                ATRASADA
              </span>
            )}
          </div>

          {task.description && <div className="mt-1 text-sm text-gray-700">{task.description}</div>}

          <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4 flex-wrap gap-y-1">
            {task.matter && <span>Caso: {task.matter.title}</span>}
            {task.assigned_user && <span>Atribuído: {task.assigned_user.full_name}</span>}
            {task.task_type && (
              <span>Tipo: {taskTypeLabels[task.task_type as keyof typeof taskTypeLabels]}</span>
            )}
          </div>

          <div className="mt-1 flex items-center text-sm text-gray-500 space-x-4">
            {task.due_date && (
              <span className="flex items-center">
                <CalendarIcon className="w-4 h-4 mr-1" />
                Prazo: {formatDate(task.due_date)}
              </span>
            )}
            {task.estimated_hours && <span>Estimado: {task.estimated_hours}h</span>}
          </div>
        </div>

        <div className="ml-5 flex-shrink-0 flex items-center space-x-2">
          <select
            value={task.status || 'pending'}
            onChange={(e) => onStatusChange(task.id, e.target.value as Task['status'])}
            className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isUpdating}
          >
            <option value="pending">Pendente</option>
            <option value="in_progress">Em Andamento</option>
            <option value="completed">Concluída</option>
            <option value="cancelled">Cancelada</option>
          </select>

          <button
            onClick={() => onEdit(task)}
            className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <PencilIcon className="h-4 w-4" />
          </button>

          <button
            onClick={() => onDelete(task)}
            className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
