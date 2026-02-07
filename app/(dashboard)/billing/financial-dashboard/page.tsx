'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useAuthContext } from '@/lib/providers/auth-provider'
import { useEffectiveLawFirmId } from '@/lib/hooks/use-effective-law-firm-id'
import { useInvoices } from '@/lib/queries/useInvoices'
import { useTimeEntries } from '@/lib/queries/useTimeEntries'
import {
  TrendingUp,
  DollarSign,
  Clock,
  FileText,
  AlertTriangle,
  BarChart3,
  ArrowLeft,
} from 'lucide-react'

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)

const getStatusText = (status: string) => {
  switch (status) {
    case 'paid':
      return 'Pago'
    case 'draft':
      return 'Rascunho'
    case 'sent':
      return 'Enviado'
    case 'viewed':
      return 'Visualizado'
    case 'overdue':
      return 'Vencido'
    case 'cancelled':
      return 'Cancelado'
    default:
      return status
  }
}

export default function FinancialDashboardPage() {
  const { profile } = useAuthContext()
  const effectiveLawFirmId = useEffectiveLawFirmId()
  const { data: invoices, isLoading: invoicesLoading } = useInvoices(effectiveLawFirmId)
  const { data: timeEntries, isLoading: timeEntriesLoading } = useTimeEntries(effectiveLawFirmId)

  const isLoading = invoicesLoading || timeEntriesLoading

  const financialData = useMemo(() => {
    if (!invoices || !timeEntries) return null

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // --- Revenue by month (last 6 months, CSS bar charts) ---
    const monthlyRevenue: { month: string; revenue: number; paid: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0)
      const monthLabel = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })

      const monthInvoices = invoices.filter((inv) => {
        const issueDate = inv.issue_date ? new Date(inv.issue_date) : new Date(inv.created_at)
        return issueDate >= d && issueDate <= monthEnd
      })

      const revenue = monthInvoices.reduce((s, inv) => s + (inv.total_amount || 0), 0)
      const paid = monthInvoices
        .filter((inv) => inv.status === 'paid')
        .reduce((s, inv) => s + (inv.paid_amount || inv.total_amount || 0), 0)

      monthlyRevenue.push({ month: monthLabel, revenue, paid })
    }

    const maxRevenue = Math.max(...monthlyRevenue.map((m) => m.revenue), 1)

    // --- Accounts receivable (aging) ---
    const overdueInvoices = invoices.filter((inv) => inv.status === 'overdue')
    const current = invoices
      .filter((inv) => (inv.status === 'sent' || inv.status === 'viewed') && new Date(inv.due_date) >= now)
      .reduce((s, inv) => s + (inv.outstanding_amount || inv.total_amount || 0), 0)

    const overdue30 = overdueInvoices
      .filter((inv) => {
        const daysPast = Math.floor((now.getTime() - new Date(inv.due_date).getTime()) / 86400000)
        return daysPast <= 30
      })
      .reduce((s, inv) => s + (inv.outstanding_amount || inv.total_amount || 0), 0)

    const overdue60 = overdueInvoices
      .filter((inv) => {
        const daysPast = Math.floor((now.getTime() - new Date(inv.due_date).getTime()) / 86400000)
        return daysPast > 30 && daysPast <= 60
      })
      .reduce((s, inv) => s + (inv.outstanding_amount || inv.total_amount || 0), 0)

    const overdue90plus = overdueInvoices
      .filter((inv) => {
        const daysPast = Math.floor((now.getTime() - new Date(inv.due_date).getTime()) / 86400000)
        return daysPast > 60
      })
      .reduce((s, inv) => s + (inv.outstanding_amount || inv.total_amount || 0), 0)

    const totalReceivable = current + overdue30 + overdue60 + overdue90plus

    // --- Summary stats ---
    const thisMonthInvoices = invoices.filter((inv) => {
      const issueDate = inv.issue_date ? new Date(inv.issue_date) : new Date(inv.created_at)
      return issueDate >= startOfMonth
    })

    const totalRevenue = thisMonthInvoices.reduce((s, inv) => s + (inv.total_amount || 0), 0)
    const totalPaid = thisMonthInvoices
      .filter((inv) => inv.status === 'paid')
      .reduce((s, inv) => s + (inv.paid_amount || inv.total_amount || 0), 0)

    const totalOverdue = invoices
      .filter((inv) => inv.status === 'overdue')
      .reduce((s, inv) => s + (inv.total_amount || 0), 0)

    const thisMonthEntries = timeEntries.filter((te) => {
      const d = te.work_date ? new Date(te.work_date) : new Date(te.created_at)
      return d >= startOfMonth
    })

    const billableHours = thisMonthEntries
      .filter((te) => te.is_billable !== false)
      .reduce((s, te) => s + (te.hours_worked || 0), 0)

    const billableAmount = thisMonthEntries
      .filter((te) => te.is_billable !== false)
      .reduce(
        (s, te) => s + (te.total_amount || (te.hours_worked || 0) * (te.hourly_rate || 0)),
        0
      )

    const nonBillableHours = thisMonthEntries
      .filter((te) => te.is_billable === false)
      .reduce((s, te) => s + (te.hours_worked || 0), 0)

    const utilizationRate =
      billableHours + nonBillableHours > 0
        ? Math.round((billableHours / (billableHours + nonBillableHours)) * 100)
        : 0

    // --- Status breakdown ---
    const statusBreakdown = invoices.reduce<Record<string, { count: number; total: number }>>(
      (acc, inv) => {
        const status = inv.status || 'draft'
        if (!acc[status]) acc[status] = { count: 0, total: 0 }
        acc[status].count += 1
        acc[status].total += inv.total_amount || 0
        return acc
      },
      {}
    )

    return {
      monthlyRevenue,
      maxRevenue,
      current,
      overdue30,
      overdue60,
      overdue90plus,
      totalReceivable,
      totalRevenue,
      totalPaid,
      totalOverdue,
      billableHours: Math.round(billableHours * 10) / 10,
      billableAmount,
      nonBillableHours: Math.round(nonBillableHours * 10) / 10,
      utilizationRate,
      statusBreakdown,
      invoiceCount: invoices.length,
    }
  }, [invoices, timeEntries])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!financialData) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
          Nenhum dado financeiro disponível.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <Link href="/billing" className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Financeiro</h1>
          </div>
          <p className="text-gray-600 ml-8">
            Visão completa da saúde financeira do escritório
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Receita Mensal</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(financialData.totalRevenue)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Recebido: {formatCurrency(financialData.totalPaid)}
          </p>
        </div>

        <div className="bg-white p-5 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Vencido</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(financialData.totalOverdue)}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            A receber: {formatCurrency(financialData.totalReceivable)}
          </p>
        </div>

        <div className="bg-white p-5 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Horas Faturáveis</p>
              <p className="text-2xl font-bold text-gray-900">
                {financialData.billableHours}h
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Valor: {formatCurrency(financialData.billableAmount)}
          </p>
        </div>

        <div className="bg-white p-5 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Taxa de Utilização</p>
              <p className="text-2xl font-bold text-gray-900">
                {financialData.utilizationRate}%
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full"
              style={{ width: `${Math.min(financialData.utilizationRate, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Revenue Chart + Aging Report side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart (CSS bar chart) */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
            Receita por Mês
          </h2>
          <div className="space-y-3">
            {financialData.monthlyRevenue.map((item) => (
              <div key={item.month}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 capitalize">{item.month}</span>
                  <span className="font-medium text-gray-900">{formatCurrency(item.revenue)}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-4 relative">
                  <div
                    className="bg-blue-200 h-4 rounded-full absolute top-0 left-0"
                    style={{
                      width: `${(item.revenue / financialData.maxRevenue) * 100}%`,
                    }}
                  ></div>
                  <div
                    className="bg-green-500 h-4 rounded-full absolute top-0 left-0"
                    style={{
                      width: `${(item.paid / financialData.maxRevenue) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-200 rounded mr-1"></div>
              Faturado
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded mr-1"></div>
              Recebido
            </div>
          </div>
        </div>

        {/* Aging Report */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-orange-600" />
            Contas a Receber (Aging)
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-green-800">A vencer</p>
                <p className="text-xs text-green-600">Dentro do prazo</p>
              </div>
              <p className="text-lg font-bold text-green-800">
                {formatCurrency(financialData.current)}
              </p>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-yellow-800">1-30 dias</p>
                <p className="text-xs text-yellow-600">Vencidas</p>
              </div>
              <p className="text-lg font-bold text-yellow-800">
                {formatCurrency(financialData.overdue30)}
              </p>
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-orange-800">31-60 dias</p>
                <p className="text-xs text-orange-600">Vencidas</p>
              </div>
              <p className="text-lg font-bold text-orange-800">
                {formatCurrency(financialData.overdue60)}
              </p>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-red-800">60+ dias</p>
                <p className="text-xs text-red-600">Vencidas</p>
              </div>
              <p className="text-lg font-bold text-red-800">
                {formatCurrency(financialData.overdue90plus)}
              </p>
            </div>
            <div className="border-t pt-3 flex justify-between items-center">
              <p className="text-sm font-semibold text-gray-900">Total a Receber</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(financialData.totalReceivable)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status breakdown + Time utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoice Status Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Faturas por Status ({financialData.invoiceCount} total)
          </h2>
          <div className="space-y-3">
            {Object.entries(financialData.statusBreakdown).map(([status, data]) => {
              const pct = financialData.invoiceCount > 0
                ? Math.round((data.count / financialData.invoiceCount) * 100)
                : 0

              const colorMap: Record<string, string> = {
                paid: 'bg-green-500',
                draft: 'bg-gray-400',
                sent: 'bg-blue-500',
                viewed: 'bg-blue-300',
                overdue: 'bg-red-500',
                cancelled: 'bg-gray-300',
              }
              const barColor = colorMap[status] || 'bg-gray-400'

              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">
                      {getStatusText(status)} ({data.count})
                    </span>
                    <span className="font-medium text-gray-900">{formatCurrency(data.total)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`${barColor} h-2 rounded-full`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Time Utilization */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Utilização de Tempo (Mês)</h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-700">Horas Faturáveis</span>
                <span className="font-bold text-green-700">{financialData.billableHours}h</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-4">
                <div
                  className="bg-green-500 h-4 rounded-full"
                  style={{
                    width: `${Math.min(financialData.utilizationRate, 100)}%`,
                  }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-700">Horas Não Faturáveis</span>
                <span className="font-bold text-gray-600">{financialData.nonBillableHours}h</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-4">
                <div
                  className="bg-gray-400 h-4 rounded-full"
                  style={{
                    width: `${100 - financialData.utilizationRate}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="border-t pt-4 grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">Valor Faturável</p>
                <p className="text-xl font-bold text-green-700">
                  {formatCurrency(financialData.billableAmount)}
                </p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">Utilização</p>
                <p className="text-xl font-bold text-blue-700">
                  {financialData.utilizationRate}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
