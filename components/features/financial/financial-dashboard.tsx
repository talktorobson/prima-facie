'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  CashFlowSummary,
  AgingReport,
  ExpenseBudgetAnalysis,
  FinancialAlert
} from '@/lib/financial/types'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Target,
  PieChart,
  BarChart3,
  Wallet,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Bell
} from 'lucide-react'

interface FinancialDashboardProps {
  cashFlow: CashFlowSummary
  agingReport: AgingReport
  budgetAnalysis: ExpenseBudgetAnalysis[]
  alerts: FinancialAlert[]
  onAlertClick: (alertId: string) => void
  onViewReports: () => void
  isLoading?: boolean
}

export function FinancialDashboard({
  cashFlow,
  agingReport,
  budgetAnalysis,
  alerts,
  onAlertClick,
  onViewReports,
  isLoading = false
}: FinancialDashboardProps) {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`
  }

  const getCashFlowTrend = () => {
    const netFlow = cashFlow.total_inflow - cashFlow.total_outflow
    return {
      amount: netFlow,
      isPositive: netFlow >= 0,
      icon: netFlow >= 0 ? TrendingUp : TrendingDown,
      color: netFlow >= 0 ? 'text-green-600' : 'text-red-600'
    }
  }

  const getAlertSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'warning':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <Bell className="h-4 w-4 text-blue-600" />
    }
  }

  const getAlertSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Crítico</Badge>
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Atenção</Badge>
      default:
        return <Badge variant="outline">Info</Badge>
    }
  }

  const getBudgetStatusColor = (percentage: number) => {
    if (percentage >= 100) return 'text-red-600'
    if (percentage >= 80) return 'text-yellow-600'
    return 'text-green-600'
  }

  const cashFlowTrend = getCashFlowTrend()
  const activeAlerts = alerts.filter(alert => alert.is_active && !alert.is_acknowledged)
  const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'critical')

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-32"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Financeiro</h1>
          <p className="text-gray-600">
            Visão geral da situação financeira da empresa
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {criticalAlerts.length > 0 && (
            <Badge variant="destructive" className="flex items-center space-x-1">
              <AlertTriangle className="h-3 w-3" />
              <span>{criticalAlerts.length} alertas críticos</span>
            </Badge>
          )}
          <Button variant="outline" onClick={onViewReports}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Ver Relatórios
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Saldo Atual</p>
                <p className="text-2xl font-bold">{formatCurrency(cashFlow.closing_balance)}</p>
                <div className="flex items-center mt-1">
                  <cashFlowTrend.icon className={`h-4 w-4 mr-1 ${cashFlowTrend.color}`} />
                  <span className={`text-sm ${cashFlowTrend.color}`}>
                    {formatCurrency(Math.abs(cashFlowTrend.amount))} este mês
                  </span>
                </div>
              </div>
              <Wallet className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Entradas</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(cashFlow.total_inflow)}</p>
                <p className="text-sm text-gray-500 mt-1">{cashFlow.period}</p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Saídas</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(cashFlow.total_outflow)}</p>
                <p className="text-sm text-gray-500 mt-1">{cashFlow.period}</p>
              </div>
              <ArrowDownRight className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">A Receber</p>
                <p className="text-2xl font-bold">{formatCurrency(agingReport.receivables_total)}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {agingReport.receivables_overdue_30 + agingReport.receivables_overdue_60 + agingReport.receivables_overdue_90 + agingReport.receivables_over_90 > 0 
                    ? `${formatCurrency(agingReport.receivables_overdue_30 + agingReport.receivables_overdue_60 + agingReport.receivables_overdue_90 + agingReport.receivables_over_90)} em atraso`
                    : 'Tudo em dia'
                  }
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {activeAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Alertas Financeiros</span>
              <Badge variant="secondary">{activeAlerts.length}</Badge>
            </CardTitle>
            <CardDescription>
              Atenção necessária para itens importantes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeAlerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  {getAlertSeverityIcon(alert.severity)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">{alert.title}</h4>
                      {getAlertSeverityBadge(alert.severity)}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {new Date(alert.trigger_date).toLocaleDateString('pt-BR')}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAlertClick(alert.id)}
                        className="text-xs"
                      >
                        Marcar como visto
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {activeAlerts.length > 5 && (
                <div className="text-center">
                  <Button variant="outline" size="sm">
                    Ver todos os {activeAlerts.length} alertas
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aging Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="h-5 w-5" />
              <span>Contas a Pagar por Vencimento</span>
            </CardTitle>
            <CardDescription>
              Análise do vencimento das contas em aberto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Em dia</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded"></div>
                  <span className="font-medium">{formatCurrency(agingReport.payables_current)}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">1-30 dias</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded"></div>
                  <span className="font-medium">{formatCurrency(agingReport.payables_overdue_30)}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">31-60 dias</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded"></div>
                  <span className="font-medium">{formatCurrency(agingReport.payables_overdue_60)}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">61-90 dias</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded"></div>
                  <span className="font-medium">{formatCurrency(agingReport.payables_overdue_90)}</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Mais de 90 dias</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-500 rounded"></div>
                  <span className="font-medium">{formatCurrency(agingReport.payables_over_90)}</span>
                </div>
              </div>

              <div className="pt-3 border-t">
                <div className="flex justify-between items-center font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(agingReport.payables_total)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Budget Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Acompanhamento Orçamentário</span>
            </CardTitle>
            <CardDescription>
              Top 5 categorias com maior utilização do orçamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {budgetAnalysis
                .sort((a, b) => b.percentage_used_month - a.percentage_used_month)
                .slice(0, 5)
                .map((category) => (
                  <div key={category.category_id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium truncate">{category.category_name}</span>
                      <span className={`text-sm font-semibold ${getBudgetStatusColor(category.percentage_used_month)}`}>
                        {formatPercentage(category.percentage_used_month)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          category.percentage_used_month >= 100 ? 'bg-red-500' :
                          category.percentage_used_month >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(category.percentage_used_month, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{formatCurrency(category.spent_month)} gasto</span>
                      <span>{formatCurrency(category.budget_monthly)} orçado</span>
                    </div>
                  </div>
                ))}
              
              {budgetAnalysis.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">Nenhum orçamento configurado</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Fluxo de Caixa - {cashFlow.period}</span>
          </CardTitle>
          <CardDescription>
            Detalhamento das entradas e saídas por categoria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Inflows */}
            <div>
              <h4 className="font-medium text-green-600 mb-3 flex items-center">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                Entradas - {formatCurrency(cashFlow.total_inflow)}
              </h4>
              <div className="space-y-2">
                {Object.entries(cashFlow.inflow_by_category).map(([category, amount]) => (
                  <div key={category} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{category}</span>
                    <span className="font-medium">{formatCurrency(amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Outflows */}
            <div>
              <h4 className="font-medium text-red-600 mb-3 flex items-center">
                <ArrowDownRight className="h-4 w-4 mr-1" />
                Saídas - {formatCurrency(cashFlow.total_outflow)}
              </h4>
              <div className="space-y-2">
                {Object.entries(cashFlow.outflow_by_category).map(([category, amount]) => (
                  <div key={category} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{category}</span>
                    <span className="font-medium">{formatCurrency(amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Saldo Inicial</p>
                <p className="text-lg font-semibold">{formatCurrency(cashFlow.opening_balance)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Fluxo Líquido</p>
                <p className={`text-lg font-semibold ${cashFlowTrend.color}`}>
                  {formatCurrency(cashFlowTrend.amount)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Saldo Final</p>
                <p className="text-lg font-semibold">{formatCurrency(cashFlow.closing_balance)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Projeções</span>
          </CardTitle>
          <CardDescription>
            Estimativas para o próximo período
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Entradas Projetadas</p>
              <p className="text-2xl font-bold text-blue-800">{formatCurrency(cashFlow.projected_inflow)}</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-600 font-medium">Saídas Projetadas</p>
              <p className="text-2xl font-bold text-red-800">{formatCurrency(cashFlow.projected_outflow)}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Saldo Projetado</p>
              <p className="text-2xl font-bold text-green-800">{formatCurrency(cashFlow.projected_balance)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}