'use client'

import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { ChartBarIcon } from '@heroicons/react/24/outline'

const STATUS_LABELS: Record<string, string> = {
  active: 'Ativo', closed: 'Encerrado', pending: 'Pendente', suspended: 'Suspenso',
  archived: 'Arquivado', draft: 'Rascunho', sent: 'Enviada', paid: 'Paga',
  overdue: 'Vencida', cancelled: 'Cancelada', prospect: 'Prospecto',
  lead: 'Lead', client: 'Cliente', former_client: 'Ex-cliente',
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR')
}

export function translateStatus(status: string): string {
  return STATUS_LABELS[status] || status
}

export function SummaryCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    red: 'bg-red-50 text-red-700',
    purple: 'bg-purple-50 text-purple-700',
    indigo: 'bg-indigo-50 text-indigo-700',
  }
  const classes = colorMap[color] || colorMap.blue
  return (
    <div className={`rounded-lg p-4 ${classes}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm mt-1 opacity-80">{label}</div>
    </div>
  )
}

export function BarChart({ data, valuePrefix }: { data: { label: string; value: number }[]; valuePrefix?: string }) {
  const maxValue = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.label}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-700 truncate mr-2">{item.label}</span>
            <span className="text-gray-900 font-medium whitespace-nowrap">
              {valuePrefix}{typeof item.value === 'number' && valuePrefix === 'R$ '
                ? item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                : item.value}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-primary h-3 rounded-full transition-all duration-300"
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  )
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="text-center py-12">
      <ChartBarIcon className="mx-auto h-12 w-12 text-red-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">Erro ao carregar dados</h3>
      <p className="mt-1 text-sm text-gray-500">{message}</p>
    </div>
  )
}

export function EmptyState() {
  return (
    <div className="text-center py-12">
      <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">Sem dados para o periodo selecionado</h3>
      <p className="mt-1 text-sm text-gray-500">Ajuste o intervalo de datas e tente novamente.</p>
    </div>
  )
}

export function ExportButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex justify-end">
      <button
        onClick={onClick}
        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
      >
        <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
        Exportar CSV
      </button>
    </div>
  )
}

export function downloadCSV(content: string, filenameBase: string) {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' })
  const timestamp = new Date().toISOString().split('T')[0]
  const filename = `${filenameBase}_${timestamp}.csv`
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
