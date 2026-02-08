'use client'

import { DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-100 text-blue-700',
  viewed: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

const statusLabels: Record<string, string> = {
  draft: 'Rascunho',
  sent: 'Enviada',
  viewed: 'Visualizada',
  paid: 'Paga',
  overdue: 'Vencida',
  cancelled: 'Cancelada',
}

interface InvoiceCardProps {
  invoice: Record<string, unknown>
}

export function InvoiceCard({ invoice }: InvoiceCardProps) {
  const status = (invoice.status as string) || 'draft'
  const total = (invoice.total_amount as number) || 0
  const dueDate = invoice.due_date ? new Date(invoice.due_date as string) : null

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 text-xs hover:border-primary/30 transition-colors">
      <div className="flex items-start gap-2">
        <DollarSign className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="font-medium text-gray-900">{invoice.invoice_number as string}</p>
            <span className="font-medium text-gray-900">
              R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', statusColors[status])}>
              {statusLabels[status] || status}
            </span>
            {dueDate && (
              <span className="text-gray-400">
                Vence: {dueDate.toLocaleDateString('pt-BR')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
