'use client'

import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { ChartBarIcon } from '@heroicons/react/24/outline'
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  CartesianGrid,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

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

const PIE_COLORS = ['#0066CC', '#059669', '#7C3AED', '#EA580C', '#DC2626', '#0891B2', '#CA8A04', '#6366F1']

const numberFormatter = new Intl.NumberFormat('pt-BR')
const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function BarChart({ data, valuePrefix }: { data: { label: string; value: number }[]; valuePrefix?: string }) {
  const height = Math.max(data.length * 40 + 40, 200)
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} layout="horizontal" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value: number | string | undefined) =>
            valuePrefix
              ? currencyFormatter.format(Number(value ?? 0))
              : numberFormatter.format(Number(value ?? 0))
          }
        />
        <Bar dataKey="value" fill="hsl(211, 100%, 40%)" radius={[4, 4, 0, 0]} />
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}

export function PieChartComponent({ data }: { data: { label: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsPieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number | string | undefined) => numberFormatter.format(Number(value ?? 0))} />
        <Legend />
      </RechartsPieChart>
    </ResponsiveContainer>
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
