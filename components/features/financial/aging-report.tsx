'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  AgingReport as AgingReportType,
  PaymentCollection,
  Bill
} from '@/lib/financial/types'
import { 
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  FileText,
  Download,
  Filter,
  BarChart3,
  PieChart,
  Users,
  Building2
} from 'lucide-react'
import { ExportButton } from '@/components/features/exports/export-button'
import { exportService } from '@/lib/exports/export-service'
import type { ExportOptions, ExportResult } from '@/lib/exports/types'

interface AgingReportProps {
  agingReport: AgingReportType
  lawFirmId: string
  onDrillDown: (category: string, ageRange: string) => void
  isLoading?: boolean
}

export function AgingReport({
  agingReport,
  lawFirmId,
  onDrillDown,
  isLoading = false
}: AgingReportProps) {
  const [viewMode, setViewMode] = useState<'summary' | 'receivables' | 'payables'>('summary')
  const [selectedAgeRange, setSelectedAgeRange] = useState('')

  const handleExport = async (options: ExportOptions): Promise<ExportResult> => {
    return await exportService.exportAgingReport(lawFirmId, options)
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  const formatPercentage = (part: number, total: number): string => {
    if (total === 0) return '0%'
    return `${((part / total) * 100).toFixed(1)}%`
  }

  const getAgeRangeColor = (range: string) => {
    switch (range) {
      case 'current':
        return 'text-green-600 bg-green-100'
      case 'overdue_30':
        return 'text-yellow-600 bg-yellow-100'
      case 'overdue_60':
        return 'text-orange-600 bg-orange-100'
      case 'overdue_90':
        return 'text-red-600 bg-red-100'
      case 'over_90':
        return 'text-gray-600 bg-gray-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (daysOverdue: number) => {
    if (daysOverdue <= 0) return <Clock className="h-4 w-4 text-green-600" />
    if (daysOverdue <= 30) return <Clock className="h-4 w-4 text-yellow-600" />
    if (daysOverdue <= 60) return <AlertTriangle className="h-4 w-4 text-orange-600" />
    return <AlertTriangle className="h-4 w-4 text-red-600" />
  }

  const receivablesData = [
    { label: 'Em Dia', amount: agingReport.receivables_current, range: 'current' },
    { label: '1-30 dias', amount: agingReport.receivables_overdue_30, range: 'overdue_30' },
    { label: '31-60 dias', amount: agingReport.receivables_overdue_60, range: 'overdue_60' },
    { label: '61-90 dias', amount: agingReport.receivables_overdue_90, range: 'overdue_90' },
    { label: '90+ dias', amount: agingReport.receivables_over_90, range: 'over_90' }
  ]

  const payablesData = [
    { label: 'Em Dia', amount: agingReport.payables_current, range: 'current' },
    { label: '1-30 dias', amount: agingReport.payables_overdue_30, range: 'overdue_30' },
    { label: '31-60 dias', amount: agingReport.payables_overdue_60, range: 'overdue_60' },
    { label: '61-90 dias', amount: agingReport.payables_overdue_90, range: 'overdue_90' },
    { label: '90+ dias', amount: agingReport.payables_over_90, range: 'over_90' }
  ]

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
          <h1 className="text-2xl font-bold text-gray-900">Relatório de Aging</h1>
          <p className="text-gray-600">
            Análise por vencimento das contas a receber e pagar - {new Date(agingReport.as_of_date).toLocaleDateString('pt-BR')}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="summary">Visão Geral</SelectItem>
              <SelectItem value="receivables">Contas a Receber</SelectItem>
              <SelectItem value="payables">Contas a Pagar</SelectItem>
            </SelectContent>
          </Select>
          <ExportButton
            data={[agingReport]}
            type="aging"
            onExport={handleExport}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total a Receber</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(agingReport.receivables_total)}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {agingReport.receivables_details?.length || 0} faturas
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total a Pagar</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(agingReport.payables_total)}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {agingReport.payables_details?.length || 0} faturas
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Fluxo Líquido</p>
                <p className={`text-2xl font-bold ${agingReport.receivables_total >= agingReport.payables_total ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(agingReport.receivables_total - agingReport.payables_total)}
                </p>
                <p className="text-sm text-gray-500 mt-1">Diferença</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Em Atraso</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(
                    (agingReport.receivables_overdue_30 + agingReport.receivables_overdue_60 + 
                     agingReport.receivables_overdue_90 + agingReport.receivables_over_90) -
                    (agingReport.payables_overdue_30 + agingReport.payables_overdue_60 + 
                     agingReport.payables_overdue_90 + agingReport.payables_over_90)
                  )}
                </p>
                <p className="text-sm text-gray-500 mt-1">Saldo líquido</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      {viewMode === 'summary' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Receivables Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span>Contas a Receber</span>
              </CardTitle>
              <CardDescription>
                Distribuição por faixa de vencimento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {receivablesData.map((item) => (
                  <div key={item.range} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{item.label}</span>
                      <div className="text-right">
                        <span className="font-semibold">{formatCurrency(item.amount)}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          ({formatPercentage(item.amount, agingReport.receivables_total)})
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getAgeRangeColor(item.range).replace('text-', 'bg-').replace('bg-green-600', 'bg-green-500').replace('bg-yellow-600', 'bg-yellow-500').replace('bg-orange-600', 'bg-orange-500').replace('bg-red-600', 'bg-red-500')}`}
                        style={{ 
                          width: `${agingReport.receivables_total > 0 ? (item.amount / agingReport.receivables_total) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payables Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                <span>Contas a Pagar</span>
              </CardTitle>
              <CardDescription>
                Distribuição por faixa de vencimento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payablesData.map((item) => (
                  <div key={item.range} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{item.label}</span>
                      <div className="text-right">
                        <span className="font-semibold">{formatCurrency(item.amount)}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          ({formatPercentage(item.amount, agingReport.payables_total)})
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getAgeRangeColor(item.range).replace('text-', 'bg-').replace('bg-green-600', 'bg-green-500').replace('bg-yellow-600', 'bg-yellow-500').replace('bg-orange-600', 'bg-orange-500').replace('bg-red-600', 'bg-red-500')}`}
                        style={{ 
                          width: `${agingReport.payables_total > 0 ? (item.amount / agingReport.payables_total) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Receivables Detail View */}
      {viewMode === 'receivables' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Detalhamento - Contas a Receber</span>
            </CardTitle>
            <CardDescription>
              Lista detalhada de clientes com pagamentos pendentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {agingReport.receivables_details && agingReport.receivables_details.length > 0 ? (
              <div className="space-y-4">
                {agingReport.receivables_details.map((collection) => (
                  <div key={collection.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(collection.days_overdue)}
                      <div>
                        <h4 className="font-medium">{collection.client?.name}</h4>
                        <p className="text-sm text-gray-600">
                          Fatura: {collection.invoice?.invoice_number}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant={collection.days_overdue > 60 ? 'destructive' : collection.days_overdue > 30 ? 'secondary' : 'default'}>
                            {collection.days_overdue === 0 ? 'Em dia' : `${collection.days_overdue} dias`}
                          </Badge>
                          <Badge variant="outline">
                            {collection.collection_status === 'current' && 'Em Dia'}
                            {collection.collection_status === 'overdue_30' && '30 dias'}
                            {collection.collection_status === 'overdue_60' && '60 dias'}
                            {collection.collection_status === 'overdue_90' && '90 dias'}
                            {collection.collection_status === 'in_collection' && 'Em Cobrança'}
                            {collection.collection_status === 'disputed' && 'Contestado'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">{formatCurrency(collection.invoice?.balance_due || 0)}</p>
                      <p className="text-sm text-gray-600">
                        Venc: {collection.invoice?.due_date ? new Date(collection.invoice.due_date).toLocaleDateString('pt-BR') : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma conta a receber
                </h3>
                <p className="text-gray-600">
                  Todas as faturas foram pagas
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payables Detail View */}
      {viewMode === 'payables' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Detalhamento - Contas a Pagar</span>
            </CardTitle>
            <CardDescription>
              Lista detalhada de fornecedores com pagamentos pendentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {agingReport.payables_details && agingReport.payables_details.length > 0 ? (
              <div className="space-y-4">
                {agingReport.payables_details.map((bill) => {
                  const daysOverdue = Math.max(0, Math.floor((new Date().getTime() - new Date(bill.due_date).getTime()) / (1000 * 3600 * 24)))
                  
                  return (
                    <div key={bill.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(daysOverdue)}
                        <div>
                          <h4 className="font-medium">{bill.vendor?.name}</h4>
                          <p className="text-sm text-gray-600">
                            Fatura: {bill.bill_number}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant={daysOverdue > 60 ? 'destructive' : daysOverdue > 30 ? 'secondary' : 'default'}>
                              {daysOverdue === 0 ? 'Em dia' : `${daysOverdue} dias`}
                            </Badge>
                            <Badge variant="outline">
                              {bill.payment_status === 'pending' && 'Pendente'}
                              {bill.payment_status === 'partial' && 'Parcial'}
                              {bill.payment_status === 'overdue' && 'Em Atraso'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">{formatCurrency(bill.balance_due)}</p>
                        <p className="text-sm text-gray-600">
                          Venc: {new Date(bill.due_date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma conta a pagar
                </h3>
                <p className="text-gray-600">
                  Todas as faturas foram pagas
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Analysis Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Análise Financeira</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Concentração de Risco</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Recebíveis em atraso:</span>
                  <span className="font-medium">
                    {formatPercentage(
                      agingReport.receivables_overdue_30 + agingReport.receivables_overdue_60 + 
                      agingReport.receivables_overdue_90 + agingReport.receivables_over_90,
                      agingReport.receivables_total
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Pagamentos em atraso:</span>
                  <span className="font-medium">
                    {formatPercentage(
                      agingReport.payables_overdue_30 + agingReport.payables_overdue_60 + 
                      agingReport.payables_overdue_90 + agingReport.payables_over_90,
                      agingReport.payables_total
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Liquidez</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Recebível / Pagável:</span>
                  <span className="font-medium">
                    {agingReport.payables_total > 0 
                      ? (agingReport.receivables_total / agingReport.payables_total).toFixed(2)
                      : '∞'
                    }x
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Margem de segurança:</span>
                  <span className={`font-medium ${
                    agingReport.receivables_total > agingReport.payables_total ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(agingReport.receivables_total - agingReport.payables_total)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Prazos Médios</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Recebimento:</span>
                  <span className="font-medium">~45 dias</span>
                </div>
                <div className="flex justify-between">
                  <span>Pagamento:</span>
                  <span className="font-medium">~35 dias</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}