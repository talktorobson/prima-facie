'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useAuthContext } from '@/lib/providers/auth-provider'
import { useInvoices } from '@/lib/queries/useInvoices'
import { useTimeEntries } from '@/lib/queries/useTimeEntries'
import {
  CurrencyDollarIcon, DocumentTextIcon, ClockIcon, CreditCardIcon,
  ChartBarIcon, ExclamationTriangleIcon, CheckCircleIcon, PlusIcon,
  EyeIcon, ArrowRightIcon, BanknotesIcon,
} from '@heroicons/react/24/outline'

interface QuickAction {
  id: string; title: string; description: string; href: string
  icon: React.ComponentType<{ className?: string }>; color: string; count?: number
}

const fmt = (amount: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)

const statusColor = (s: string) => {
  if (s === 'paid') return 'bg-green-100 text-green-800'
  if (s === 'overdue') return 'bg-red-100 text-red-800'
  if (s === 'cancelled') return 'bg-gray-100 text-gray-800'
  return 'bg-yellow-100 text-yellow-800'
}

const statusText = (s: string) => {
  const map: Record<string, string> = { paid: 'Pago', draft: 'Pendente', pending: 'Pendente', sent: 'Enviado', viewed: 'Visualizado', overdue: 'Vencido', cancelled: 'Cancelado' }
  return map[s] || s
}

export default function BillingPage() {
  useAuthContext()
  const { data: invoices, isLoading: il } = useInvoices()
  const { data: timeEntries, isLoading: tl } = useTimeEntries()
  const loading = il || tl

  const stats = useMemo(() => {
    if (!invoices || !timeEntries) return null
    const now = new Date()
    const som = new Date(now.getFullYear(), now.getMonth(), 1)
    const mInv = invoices.filter((i) => (i.issue_date ? new Date(i.issue_date) : new Date(i.created_at)) >= som)
    const monthlyRevenue = mInv.reduce((s, i) => s + (i.total_amount || 0), 0)
    const pendingInvoices = invoices.filter((i) => i.status === 'sent' || i.status === 'viewed' || i.status === 'draft').length
    const overdueAmount = invoices.filter((i) => i.status === 'overdue').reduce((s, i) => s + (i.total_amount || 0), 0)
    const paidThisMonth = mInv.filter((i) => i.status === 'paid').reduce((s, i) => s + (i.paid_amount || i.total_amount || 0), 0)
    const mTe = timeEntries.filter((t) => (t.work_date ? new Date(t.work_date) : new Date(t.created_at)) >= som)
    const billable = mTe.filter((t) => t.is_billable !== false)
    const bh = billable.reduce((s, t) => s + (t.hours_worked || 0), 0)
    const ratedEntries = billable.filter((t) => t.hourly_rate)
    const avgRate = ratedEntries.length > 0 ? ratedEntries.reduce((s, t) => s + (t.hourly_rate || 0), 0) / ratedEntries.length : 0
    const collectionRate = monthlyRevenue > 0 ? Math.round((paidThisMonth / monthlyRevenue) * 100) : 0
    return { monthlyRevenue, pendingInvoices, overdueAmount, paidThisMonth, billableHours: Math.round(bh * 10) / 10, avgRate: Math.round(avgRate), collectionRate }
  }, [invoices, timeEntries])

  const recent = useMemo(() => invoices?.slice(0, 5) || [], [invoices])

  const quickActions: QuickAction[] = [
    { id: 'inv', title: 'Nova Fatura', description: 'Criar fatura manual', href: '/billing/invoices', icon: DocumentTextIcon, color: 'bg-blue-500 hover:bg-blue-600' },
    { id: 'time', title: 'Registrar Horas', description: 'Lançar horas trabalhadas', href: '/billing/time-tracking', icon: ClockIcon, color: 'bg-green-500 hover:bg-green-600' },
    { id: 'list', title: 'Faturas', description: 'Gerenciar todas as faturas', href: '/billing/invoices', icon: CurrencyDollarIcon, color: 'bg-purple-500 hover:bg-purple-600' },
    { id: 'sub', title: 'Assinaturas', description: 'Gerenciar planos recorrentes', href: '/billing/subscriptions', icon: CreditCardIcon, color: 'bg-orange-500 hover:bg-orange-600' },
    { id: 'ar', title: 'Contas a Receber', description: 'Acompanhar cobranças', href: '/billing/invoices', icon: BanknotesIcon, color: 'bg-teal-500 hover:bg-teal-600', count: stats?.pendingInvoices || 0 },
    { id: 'fin', title: 'Relatórios Financeiros', description: 'Análises e dashboards', href: '/billing/financial-dashboard', icon: ChartBarIcon, color: 'bg-indigo-500 hover:bg-indigo-600' },
  ]

  if (loading) {
    return <div className="flex items-center justify-center min-h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Faturamento</h1>
          <p className="mt-2 text-gray-600">Controle financeiro e faturamento integrado</p>
        </div>
        <Link href="/billing/invoices" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90">
          <PlusIcon className="w-4 h-4 mr-2" /> Nova Fatura
        </Link>
      </div>

      {/* Overview Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: CurrencyDollarIcon, ic: 'text-green-600', label: 'Receita Mensal', value: fmt(stats.monthlyRevenue) },
            { icon: DocumentTextIcon, ic: 'text-yellow-600', label: 'Faturas Pendentes', value: String(stats.pendingInvoices),
              extra: stats.overdueAmount > 0 ? <span className="ml-2 text-sm font-semibold text-red-600 flex items-baseline"><ExclamationTriangleIcon className="h-4 w-4 text-red-500 mr-1" />{fmt(stats.overdueAmount)} vencidos</span> : null },
            { icon: BanknotesIcon, ic: 'text-blue-600', label: 'Coletado este Mês', value: fmt(stats.paidThisMonth) },
            { icon: ClockIcon, ic: 'text-purple-600', label: 'Horas Faturáveis', value: `${stats.billableHours}h`,
              extra: stats.avgRate > 0 ? <span className="ml-2 text-sm text-gray-600">@ {fmt(stats.avgRate)}/h</span> : null },
          ].map((card) => (
            <div key={card.label} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5 flex items-center">
                <card.icon className={`h-6 w-6 flex-shrink-0 ${card.ic}`} />
                <div className="ml-5 w-0 flex-1">
                  <p className="text-sm font-medium text-gray-500 truncate">{card.label}</p>
                  <div className="flex items-baseline">
                    <span className="text-2xl font-semibold text-gray-900">{card.value}</span>
                    {card.extra}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((a) => (
            <Link key={a.id} href={a.href} className="relative group bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className={`flex-shrink-0 inline-flex items-center justify-center h-10 w-10 rounded-lg ${a.color} text-white`}>
                  <a.icon className="h-5 w-5" />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-sm font-medium text-gray-900 group-hover:text-primary">
                    {a.title}
                    {a.count !== undefined && a.count > 0 && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-white">{a.count}</span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-500">{a.description}</p>
                </div>
                <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-primary" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Invoices */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Faturas Recentes</h2>
          <Link href="/billing/invoices" className="text-sm font-medium text-primary hover:text-primary/80">Ver todas</Link>
        </div>
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {recent.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <DocumentTextIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Nenhuma fatura encontrada</p>
              <Link href="/billing/invoices" className="mt-2 inline-block text-sm text-primary hover:text-primary/80">Criar primeira fatura</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['Fatura', 'Cliente', 'Valor', 'Status', 'Vencimento', ''].map((h, i) => (
                      <th key={h || 'actions'} className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${i === 5 ? 'text-right' : 'text-left'}`}>{h || 'Ações'}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recent.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{inv.invoice_number}</div>
                        {inv.issue_date && <div className="text-sm text-gray-500">Emitida em {new Date(inv.issue_date).toLocaleDateString('pt-BR')}</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{inv.contacts?.full_name || inv.contacts?.company_name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{fmt(inv.total_amount)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColor(inv.status || 'draft')}`}>{statusText(inv.status || 'draft')}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm ${inv.status === 'overdue' ? 'text-red-600 font-medium' : 'text-gray-900'}`}>{new Date(inv.due_date).toLocaleDateString('pt-BR')}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link href="/billing/invoices" className="text-primary hover:text-primary/80"><EyeIcon className="h-4 w-4 inline" /></Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Taxa de Cobrança</p>
                <p className="text-3xl font-bold text-gray-900">{stats.collectionRate}%</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full"><CheckCircleIcon className="h-6 w-6 text-green-600" /></div>
            </div>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: `${Math.min(stats.collectionRate, 100)}%` }}></div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Coletado este Mês</p>
                <p className="text-3xl font-bold text-gray-900">{fmt(stats.paidThisMonth)}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full"><BanknotesIcon className="h-6 w-6 text-blue-600" /></div>
            </div>
            <p className="mt-2 text-sm text-gray-600">Receita total: {fmt(stats.monthlyRevenue)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Valor Médio/Hora</p>
                <p className="text-3xl font-bold text-gray-900">{fmt(stats.avgRate)}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full"><ClockIcon className="h-6 w-6 text-purple-600" /></div>
            </div>
            <p className="mt-2 text-sm text-gray-600">{stats.billableHours}h registradas este mês</p>
          </div>
        </div>
      )}
    </div>
  )
}
