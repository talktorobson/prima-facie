'use client'

import { useState, useEffect } from 'react'
import { FinancialDashboard } from '@/components/features/financial/financial-dashboard'
import { AgingReport } from '@/components/features/financial/aging-report'
import { ExportButton } from '@/components/features/exports/export-button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart3,
  PieChart,
  TrendingUp,
  Download,
  RefreshCw,
  Calendar,
  AlertTriangle,
  FileText
} from 'lucide-react'
import { exportService } from '@/lib/exports/export-service'
import type { 
  AgingReport as AgingReportType,
  CashFlowSummary,
  ExpenseBudgetAnalysis,
  FinancialAlert
} from '@/lib/financial/types'
import type { ExportOptions, ExportResult } from '@/lib/exports/types'

export default function FinancialDashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [activeTab, setActiveTab] = useState('overview')
  
  // Mock law firm ID - in real app, this would come from auth context
  const lawFirmId = 'test-law-firm-123'

  // Mock data - in real app, this would come from API calls
  const [cashFlow] = useState<CashFlowSummary>({
    period: 'Janeiro 2025',
    opening_balance: 150000,
    closing_balance: 285000,
    total_inflow: 320000,
    total_outflow: 185000,
    projected_inflow: 350000,
    projected_outflow: 200000,
    projected_balance: 435000,
    inflow_by_category: {
      'Honorários': 250000,
      'Consultoria': 50000,
      'Outros': 20000
    },
    outflow_by_category: {
      'Folha de Pagamento': 80000,
      'Tecnologia': 35000,
      'Marketing': 25000,
      'Infraestrutura': 45000
    }
  })

  const [agingReport] = useState<AgingReportType>({
    as_of_date: '2025-01-16',
    receivables_current: 265000,
    receivables_overdue_30: 95000,
    receivables_overdue_60: 55000,
    receivables_overdue_90: 25000,
    receivables_over_90: 10000,
    receivables_total: 450000,
    payables_current: 125000,
    payables_overdue_30: 35000,
    payables_overdue_60: 15000,
    payables_overdue_90: 5000,
    payables_over_90: 0,
    payables_total: 180000,
    receivables_details: [],
    payables_details: []
  })

  const [budgetAnalysis] = useState<ExpenseBudgetAnalysis[]>([
    {
      category_id: 'cat-1',
      category_name: 'Tecnologia',
      budget_monthly: 40000,
      spent_month: 35000,
      percentage_used_month: 87.5,
      budget_yearly: 480000,
      spent_year: 315000,
      percentage_used_year: 65.6
    },
    {
      category_id: 'cat-2',
      category_name: 'Marketing',
      budget_monthly: 30000,
      spent_month: 25000,
      percentage_used_month: 83.3,
      budget_yearly: 360000,
      spent_year: 180000,
      percentage_used_year: 50.0
    },
    {
      category_id: 'cat-3',
      category_name: 'Folha de Pagamento',
      budget_monthly: 90000,
      spent_month: 80000,
      percentage_used_month: 88.9,
      budget_yearly: 1080000,
      spent_year: 720000,
      percentage_used_year: 66.7
    }
  ])

  const [alerts] = useState<FinancialAlert[]>([
    {
      id: 'alert-1',
      law_firm_id: lawFirmId,
      alert_type: 'overdue_receivable',
      severity: 'critical',
      title: 'Recebíveis Críticos',
      message: '5 faturas com mais de 90 dias de atraso totalizam R$ 85.000',
      trigger_date: '2025-01-16',
      is_active: true,
      is_acknowledged: false,
      acknowledged_by: null,
      acknowledged_date: null,
      created_at: '2025-01-16T09:00:00Z'
    },
    {
      id: 'alert-2',
      law_firm_id: lawFirmId,
      alert_type: 'budget_exceeded',
      severity: 'warning',
      title: 'Orçamento de TI',
      message: 'Categoria Tecnologia atingiu 87% do orçamento mensal',
      trigger_date: '2025-01-15',
      is_active: true,
      is_acknowledged: false,
      acknowledged_by: null,
      acknowledged_date: null,
      created_at: '2025-01-15T14:30:00Z'
    }
  ])

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const handleRefresh = () => {
    setIsLoading(true)
    setLastUpdate(new Date())
    
    // Simulate refresh
    setTimeout(() => {
      setIsLoading(false)
    }, 800)
  }

  const handleAlertClick = async (alertId: string) => {
    // In real app, this would acknowledge the alert
    console.log('Alert acknowledged:', alertId)
  }

  const handleViewReports = () => {
    setActiveTab('reports')
  }

  const handleExportDashboard = async (options: ExportOptions): Promise<ExportResult> => {
    return await exportService.exportFinancialDashboard(lawFirmId, options)
  }

  const handleDrillDown = (category: string, ageRange: string) => {
    console.log('Drill down:', category, ageRange)
    // In real app, this would navigate to detailed view
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Financeiro</h1>
          <p className="text-gray-600 mt-1">
            Visão completa da saúde financeira do escritório
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>Atualizado: {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
          </Badge>
          
          <ExportButton
            data={[{ dashboard: 'complete' }]}
            type="aging"
            onExport={handleExportDashboard}
            disabled={isLoading}
            className="text-sm"
          />
          
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Saldo Atual</p>
                <p className="text-xl font-bold text-green-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cashFlow.closing_balance)}
                </p>
              </div>
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">A Receber</p>
                <p className="text-xl font-bold text-blue-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(agingReport.receivables_total)}
                </p>
              </div>
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">A Pagar</p>
                <p className="text-xl font-bold text-red-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(agingReport.payables_total)}
                </p>
              </div>
              <FileText className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Alertas Ativos</p>
                <p className="text-xl font-bold text-orange-600">{alerts.filter(a => a.is_active).length}</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="aging" className="flex items-center space-x-2">
            <PieChart className="h-4 w-4" />
            <span>Aging Report</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Relatórios</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <FinancialDashboard
            cashFlow={cashFlow}
            agingReport={agingReport}
            budgetAnalysis={budgetAnalysis}
            alerts={alerts}
            onAlertClick={handleAlertClick}
            onViewReports={handleViewReports}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="aging" className="space-y-6">
          <AgingReport
            agingReport={agingReport}
            lawFirmId={lawFirmId}
            onDrillDown={handleDrillDown}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Relatório de Aging</span>
                </CardTitle>
                <CardDescription>
                  Análise detalhada de vencimentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ExportButton
                  data={[agingReport]}
                  type="aging"
                  onExport={async (options) => exportService.exportAgingReport(lawFirmId, options)}
                  disabled={isLoading}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Contas a Receber</span>
                </CardTitle>
                <CardDescription>
                  Relatório completo de cobranças
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ExportButton
                  data={[]}
                  type="collections"
                  onExport={async (options) => exportService.exportCollections(lawFirmId, options)}
                  disabled={isLoading}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5" />
                  <span>Contas a Pagar</span>
                </CardTitle>
                <CardDescription>
                  Relatório de despesas e fornecedores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ExportButton
                  data={[]}
                  type="bills"
                  onExport={async (options) => exportService.exportBills(lawFirmId, options)}
                  disabled={isLoading}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Dashboard Completo</span>
                </CardTitle>
                <CardDescription>
                  Exportação completa do dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ExportButton
                  data={[{ dashboard: 'complete' }]}
                  type="aging"
                  onExport={handleExportDashboard}
                  disabled={isLoading}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Fornecedores</span>
                </CardTitle>
                <CardDescription>
                  Diretório de fornecedores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ExportButton
                  data={[]}
                  type="vendors"
                  onExport={async (options) => exportService.exportVendors(lawFirmId, options)}
                  disabled={isLoading}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Relatórios Customizados</span>
                </CardTitle>
                <CardDescription>
                  Relatórios personalizados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" disabled className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Em Breve
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}