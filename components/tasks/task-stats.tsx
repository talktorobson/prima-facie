'use client'

import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  FlagIcon,
  PlayIcon,
} from '@heroicons/react/24/outline'

interface TaskStatsProps {
  stats: {
    totalTasks: number
    pendingTasks: number
    inProgress: number
    completedToday: number
    overdueTasks: number
    highPriorityTasks: number
  }
}

export function TaskStats({ stats }: TaskStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-3 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.totalTasks}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-3 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Pendentes</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.pendingTasks}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <PlayIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Em Andamento</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.inProgress}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-3 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Hoje</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.completedToday}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-3 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Atrasadas</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.overdueTasks}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FlagIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-3 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Alta Prioridade</dt>
                <dd className="text-lg font-medium text-gray-900">{stats.highPriorityTasks}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
