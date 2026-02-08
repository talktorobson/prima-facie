'use client'

import { Scale } from 'lucide-react'

interface DatajudCardProps {
  caseData: Record<string, unknown>
}

export function DatajudCard({ caseData }: DatajudCardProps) {
  const lastMovement = caseData.last_movement_date
    ? new Date(caseData.last_movement_date as string).toLocaleDateString('pt-BR')
    : null

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 text-xs hover:border-primary/30 transition-colors">
      <div className="flex items-start gap-2">
        <Scale className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{String(caseData.process_number)}</p>
          {caseData.court_name ? (
            <p className="text-gray-500 mt-0.5">{String(caseData.court_name)}</p>
          ) : null}
          {caseData.case_subject ? (
            <p className="text-gray-400 mt-0.5 truncate">{String(caseData.case_subject)}</p>
          ) : null}
          {lastMovement && (
            <p className="text-gray-400 mt-0.5">Última movimentação: {lastMovement}</p>
          )}
        </div>
      </div>
    </div>
  )
}
