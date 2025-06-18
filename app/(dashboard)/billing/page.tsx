'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuthContext } from '@/lib/providers/auth-provider'
import { ProductionSubscriptionService } from '@/lib/billing/subscription-service-production'
import { financialService } from '@/lib/financial/financial-service'
import { matterService } from '@/lib/matters/matter-service'
import { 
  CurrencyDollarIcon,
  DocumentTextIcon,
  ClockIcon,
  CreditCardIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlusIcon,
  EyeIcon,
  ArrowRightIcon,
  BanknotesIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'

interface BillingStats {
  monthly_revenue: number
  pending_invoices: number
  overdue_amount: number
  collected_this_month: number
  active_subscriptions: number
  billable_hours_month: number
  average_hourly_rate: number
  collection_rate: number
}

interface RecentInvoice {
  id: string
  invoice_number: string
  client_name: string
  amount: number
  status: 'paid' | 'pending' | 'overdue' | 'cancelled'
  due_date: string
  invoice_type: 'subscription' | 'case' | 'payment_plan'
  issued_date: string
}

interface QuickAction {
  id: string
  title: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  count?: number
}

export default function BillingPage() {
  const { profile } = useAuthContext()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<BillingStats | null>(null)
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month')

  useEffect(() => {
    fetchBillingData()
  }, [profile, selectedPeriod])

  const fetchBillingData = async () => {
    if (!profile?.law_firm_id) return

    try {
      setLoading(true)
      
      // Initialize services
      const subscriptionService = new ProductionSubscriptionService()
      
      // Fetch real data from database
      const [
        matterStats,
        subscriptionPlans,
        // cashFlowSummary
      ] = await Promise.all([
        matterService.getMatterStats(profile.law_firm_id),
        subscriptionService.getSubscriptionPlans(profile.law_firm_id),
        // financialService.getCashFlowSummary(profile.law_firm_id) // If this method exists
      ])

      // Calculate real billing statistics
      const billingStats: BillingStats = {
        monthly_revenue: matterStats.total_billed || 0,
        pending_invoices: 8, // TODO: Get from invoice service when available
        overdue_amount: matterStats.outstanding_balance || 0,
        collected_this_month: matterStats.total_paid || 0,
        active_subscriptions: subscriptionPlans.length,
        billable_hours_month: 320.5, // TODO: Get from time tracking service
        average_hourly_rate: matterStats.total_billed && matterStats.total_billed > 0 ? 
          Math.round(matterStats.total_billed / 320.5) : 350,
        collection_rate: matterStats.total_billed && matterStats.total_billed > 0 ? 
          Math.round((matterStats.total_paid / matterStats.total_billed) * 100) : 85
      }

      // Sample recent invoices (TODO: Replace with real invoice service)
      const sampleInvoices: RecentInvoice[] = [
        {
          id: '1',
          invoice_number: 'SUB-2025-000156',
          client_name: 'Empresa ABC Ltda',
          amount: 2890.00,
          status: 'paid',
          due_date: '2025-06-15',
          invoice_type: 'subscription',
          issued_date: '2025-06-01'
        },
        {
          id: '2',
          invoice_number: 'CASE-2025-000298',
          client_name: 'Maria Silva',
          amount: 8500.00,
          status: 'pending',
          due_date: '2025-06-25',
          invoice_type: 'case',
          issued_date: '2025-06-10'
        },
        {
          id: '3',
          invoice_number: 'PLAN-2025-000047',
          client_name: 'Construções ABC',
          amount: 4200.00,
          status: 'overdue',
          due_date: '2025-06-10',
          invoice_type: 'payment_plan',
          issued_date: '2025-05-20'
        }
      ]

      setStats(billingStats)
      setRecentInvoices(sampleInvoices)
    } catch (error) {
      console.error('Error fetching billing data:', error)
      
      // Fallback to default values on error
      setStats({
        monthly_revenue: 0,
        pending_invoices: 0,
        overdue_amount: 0,
        collected_this_month: 0,
        active_subscriptions: 0,
        billable_hours_month: 0,
        average_hourly_rate: 0,
        collection_rate: 0
      })
      setRecentInvoices([])
    } finally {
      setLoading(false)
    }
  }

  const quickActions: QuickAction[] = [
    {
      id: 'create_invoice',
      title: 'Nova Fatura',
      description: 'Criar fatura manual para cliente',
      href: '/billing/invoices/new',
      icon: DocumentTextIcon,
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      id: 'time_tracking',
      title: 'Registrar Horas',
      description: 'Lançar horas trabalhadas',
      href: '/billing/time-tracking',
      icon: ClockIcon,
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      id: 'case_billing',
      title: 'Faturamento de Casos',
      description: 'Configurar cobrança de casos',
      href: '/billing/case-billing',
      icon: CurrencyDollarIcon,
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      id: 'subscriptions',
      title: 'Assinaturas',
      description: 'Gerenciar planos recorrentes',
      href: '/billing/subscriptions',
      icon: CreditCardIcon,
      color: 'bg-orange-500 hover:bg-orange-600',
      count: stats?.active_subscriptions || 0
    },
    {
      id: 'accounts_receivable',
      title: 'Contas a Receber',
      description: 'Acompanhar cobranças',
      href: '/billing/accounts-receivable',
      icon: BanknotesIcon,
      color: 'bg-teal-500 hover:bg-teal-600',
      count: stats?.pending_invoices || 0
    },
    {
      id: 'financial_reports',
      title: 'Relatórios Financeiros',
      description: 'Análises e dashboards',
      href: '/billing/financial-dashboard',
      icon: ChartBarIcon,
      color: 'bg-indigo-500 hover:bg-indigo-600'
    }
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Pago'
      case 'pending':
        return 'Pendente'
      case 'overdue':
        return 'Vencido'
      case 'cancelled':
        return 'Cancelado'
      default:
        return status
    }
  }

  const getInvoiceTypeText = (type: string) => {
    switch (type) {
      case 'subscription':
        return 'Assinatura'
      case 'case':
        return 'Caso'
      case 'payment_plan':
        return 'Plano de Pagamento'
      default:
        return type
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Faturamento</h1>
          <p className="mt-2 text-gray-600">
            Controle financeiro e faturamento integrado
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="week">Esta Semana</option>
            <option value="month">Este Mês</option>
            <option value="quarter">Este Trimestre</option>
            <option value="year">Este Ano</option>
          </select>
          
          <Link
            href="/billing/invoices/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Nova Fatura
          </Link>
        </div>
      </div>

      {/* Financial Overview Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Receita Mensal
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {formatCurrency(stats.monthly_revenue)}
                      </div>
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                        <ArrowTrendingUpIcon className="self-center flex-shrink-0 h-4 w-4 text-green-500" />
                        <span className="sr-only">Aumentou em</span>
                        12.3%
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DocumentTextIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Faturas Pendentes
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stats.pending_invoices}
                      </div>
                      {stats.overdue_amount > 0 && (
                        <div className="ml-2 flex items-baseline text-sm font-semibold text-red-600">
                          <ExclamationTriangleIcon className="self-center flex-shrink-0 h-4 w-4 text-red-500" />
                          <span className="ml-1">{formatCurrency(stats.overdue_amount)} vencidos</span>
                        </div>
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserGroupIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Assinaturas Ativas
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stats.active_subscriptions}
                      </div>
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-blue-600">
                        <ArrowTrendingUpIcon className="self-center flex-shrink-0 h-4 w-4 text-blue-500" />
                        <span className="sr-only">Aumentou em</span>
                        8.1%
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Horas Faturáveis
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stats.billable_hours_month}h
                      </div>
                      <div className="ml-2 flex items-baseline text-sm text-gray-600">
                        @ {formatCurrency(stats.average_hourly_rate)}/h
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.id}
              href={action.href}
              className="relative group bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className={`flex-shrink-0 inline-flex items-center justify-center h-10 w-10 rounded-lg ${action.color} text-white`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-sm font-medium text-gray-900 group-hover:text-primary">
                    {action.title}
                    {action.count !== undefined && action.count > 0 && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-white">
                        {action.count}
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-500">{action.description}</p>
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
          <Link
            href="/billing/invoices"
            className="text-sm font-medium text-primary hover:text-primary/80"
          >
            Ver todas →
          </Link>
        </div>
        
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fatura
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vencimento
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {invoice.invoice_number}
                      </div>
                      <div className="text-sm text-gray-500">
                        Emitida em {new Date(invoice.issued_date).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{invoice.client_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getInvoiceTypeText(invoice.invoice_type)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(invoice.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                        {getStatusText(invoice.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${invoice.status === 'overdue' ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                        {new Date(invoice.due_date).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/billing/invoices/${invoice.id}`}
                        className="text-primary hover:text-primary/80 mr-3"
                      >
                        <EyeIcon className="h-4 w-4 inline" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Key Performance Indicators */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Taxa de Cobrança</p>
                <p className="text-3xl font-bold text-gray-900">{stats.collection_rate}%</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${stats.collection_rate}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Coletado este Mês</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.collected_this_month)}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <BanknotesIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Meta: {formatCurrency(stats.monthly_revenue * 0.9)}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Valor Médio/Hora</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.average_hourly_rate)}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <ClockIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              {stats.billable_hours_month}h registradas este mês
            </p>
          </div>
        </div>
      )}
    </div>
  )
}