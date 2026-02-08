'use client'

import { CheckSquare } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const priorityColors: Record<string, string> = {
  low: 'text-gray-500',
  medium: 'text-blue-600',
  high: 'text-orange-600',
  urgent: 'text-red-600',
}

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  in_progress: 'Em andamento',
  completed: 'Concluída',
  cancelled: 'Cancelada',
}

interface TaskCardProps {
  task: Record<string, unknown>
}

export function TaskCard({ task }: TaskCardProps) {
  const priority = (task.priority as string) || 'medium'
  const status = (task.status as string) || 'pending'
  const dueDate = task.due_date ? new Date(task.due_date as string) : null
  const isOverdue = dueDate && dueDate < new Date() && status !== 'completed' && status !== 'cancelled'

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 text-xs hover:border-primary/30 transition-colors">
      <div className="flex items-start gap-2">
        <CheckSquare className={cn('h-4 w-4 mt-0.5 flex-shrink-0', priorityColors[priority])} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{task.title as string}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-gray-500">{statusLabels[status] || status}</span>
            {dueDate && (
              <span className={cn('text-gray-400', isOverdue && 'text-red-500 font-medium')}>
                {isOverdue ? 'Atrasada — ' : ''}
                {dueDate.toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
