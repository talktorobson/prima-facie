'use client'

import { MatterCard } from './cards/matter-card'
import { ClientCard } from './cards/client-card'
import { TaskCard } from './cards/task-card'
import { InvoiceCard } from './cards/invoice-card'
import { DatajudCard } from './cards/datajud-card'
import { ConfirmationCard } from './cards/confirmation-card'
import { ErrorCard } from './cards/error-card'

interface AIToolCardProps {
  toolResult: Record<string, unknown>
}

export function AIToolCard({ toolResult }: AIToolCardProps) {
  // Error case
  if (toolResult.error) {
    return <ErrorCard error={toolResult.error as string} />
  }

  // Confirmation cards for write tools
  if (toolResult.requiresConfirmation) {
    return (
      <ConfirmationCard
        action={toolResult.action as string}
        data={toolResult.data as Record<string, unknown>}
        displayMessage={toolResult.displayMessage as string}
        entityId={toolResult.entityId as string | undefined}
      />
    )
  }

  // Results list
  const results = toolResult.results as Record<string, unknown>[] | undefined
  if (!results?.length) return null

  // Detect card type based on result shape
  const sample = results[0]

  if ('matter_number' in sample || 'billing_method' in sample) {
    return (
      <div className="space-y-1.5 px-1">
        {results.map((r, i) => <MatterCard key={i} matter={r} />)}
      </div>
    )
  }

  if ('cpf' in sample || 'cnpj' in sample || 'client_status' in sample) {
    return (
      <div className="space-y-1.5 px-1">
        {results.map((r, i) => <ClientCard key={i} client={r} />)}
      </div>
    )
  }

  if ('task_type' in sample || 'assigned_to' in sample) {
    return (
      <div className="space-y-1.5 px-1">
        {results.map((r, i) => <TaskCard key={i} task={r} />)}
      </div>
    )
  }

  if ('invoice_number' in sample || 'total_amount' in sample) {
    return (
      <div className="space-y-1.5 px-1">
        {results.map((r, i) => <InvoiceCard key={i} invoice={r} />)}
      </div>
    )
  }

  if ('process_number' in sample && 'judge_name' in sample) {
    return (
      <div className="space-y-1.5 px-1">
        {results.map((r, i) => <DatajudCard key={i} caseData={r} />)}
      </div>
    )
  }

  // Generic fallback for calendar events and other types
  return (
    <div className="space-y-1 px-1">
      {results.map((r, i) => (
        <div key={i} className="rounded-lg border border-gray-200 bg-white p-2.5 text-xs">
          <p className="font-medium text-gray-900">{String(r.title || r.type || '')}</p>
          {r.date ? (
            <p className="text-gray-500 mt-0.5">
              {new Date(String(r.date)).toLocaleDateString('pt-BR')}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  )
}
