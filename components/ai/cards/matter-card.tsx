'use client'

import { Briefcase } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-700',
  on_hold: 'bg-yellow-100 text-yellow-700',
  settled: 'bg-blue-100 text-blue-700',
  dismissed: 'bg-red-100 text-red-700',
}

const statusLabels: Record<string, string> = {
  active: 'Ativo',
  closed: 'Encerrado',
  on_hold: 'Suspenso',
  settled: 'Acordo',
  dismissed: 'Arquivado',
}

interface MatterCardProps {
  matter: Record<string, unknown>
}

export function MatterCard({ matter }: MatterCardProps) {
  const status = (matter.status as string) || 'active'

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 text-xs hover:border-primary/30 transition-colors">
      <div className="flex items-start gap-2">
        <Briefcase className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{String(matter.title)}</p>
          <p className="text-gray-500 mt-0.5">{String(matter.matter_number)}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', statusColors[status])}>
              {statusLabels[status] || status}
            </span>
            {matter.priority ? (
              <span className="text-gray-400">{String(matter.priority)}</span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
