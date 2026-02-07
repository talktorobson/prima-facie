'use client'

import { useMemo } from 'react'
import { useMyInvoices } from '@/lib/queries/useClientPortal'
import {
  CreditCardIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

const statusLabels: Record<string, string> = {
  draft: 'Rascunho',
  sent: 'Enviada',
  paid: 'Paga',
  overdue: 'Vencida',
  cancelled: 'Cancelada',
  partially_paid: 'Parcial',
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-50 text-gray-700 ring-gray-600/20',
  sent: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  paid: 'bg-green-50 text-green-700 ring-green-600/20',
  overdue: 'bg-red-50 text-red-700 ring-red-600/20',
  cancelled: 'bg-gray-50 text-gray-500 ring-gray-500/20',
  partially_paid: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
}

interface InvoiceRow {
  id: string
  invoice_number: string | null
  title: string | null
  total_amount: number | null
  paid_amount: number | null
  outstanding_amount: number | null
  status: string
  due_date: string | null
  issue_date: string | null
}

export default function ClientBillingPage() {
  const { data: invoices, isLoading } = useMyInvoices()

  const invoiceList = (invoices ?? []) as InvoiceRow[]

  const summary = useMemo(() => {
    const total = invoiceList.reduce((s, i) => s + (i.total_amount ?? 0), 0)
    const paid = invoiceList.reduce((s, i) => s + (i.paid_amount ?? 0), 0)
    const outstanding = invoiceList.reduce((s, i) => s + (i.outstanding_amount ?? 0), 0)
    const overdueCount = invoiceList.filter((i) => i.status === 'overdue').length
    return { total, paid, outstanding, overdueCount }
  }, [invoiceList])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-gray-600">Carregando faturas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Minhas Faturas</h1>
        <p className="mt-1 text-gray-600">
          Acompanhe suas faturas e pagamentos.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white shadow rounded-lg p-5">
          <div className="flex items-center">
            <CreditCardIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Pago</p>
              <p className="text-xl font-bold text-green-600">
                R$ {summary.paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-5">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-amber-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Em Aberto</p>
              <p className="text-xl font-bold text-amber-600">
                R$ {summary.outstanding.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
        {summary.overdueCount > 0 && (
          <div className="bg-white shadow rounded-lg p-5">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Faturas Vencidas</p>
                <p className="text-xl font-bold text-red-600">{summary.overdueCount}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Invoice List */}
      {invoiceList.length === 0 ? (
        <div className="text-center py-12 bg-white shadow rounded-lg">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma fatura encontrada</h3>
          <p className="mt-1 text-sm text-gray-500">Voce nao possui faturas no momento.</p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fatura</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimento</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoiceList.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-medium text-gray-900">
                      {inv.invoice_number || inv.title || '-'}
                    </p>
                    {inv.issue_date && (
                      <p className="text-xs text-gray-500">
                        Emitida em {new Date(inv.issue_date).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    R$ {(inv.total_amount ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusColors[inv.status] ?? statusColors.draft}`}>
                      {statusLabels[inv.status] ?? inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {inv.due_date ? new Date(inv.due_date).toLocaleDateString('pt-BR') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
