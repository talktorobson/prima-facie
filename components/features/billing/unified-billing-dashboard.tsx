'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { 
  CreditCard,
  FileText,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  Download,
  Eye,
  Filter,
  Search,
  RefreshCw,
  PlusCircle,
  Settings
} from 'lucide-react'
import { ExportButton } from '@/components/features/exports/export-button'
import type { 
  Invoice, 
  InvoiceStatus, 
  InvoiceType,
  INVOICE_STATUS_OPTIONS,
  INVOICE_TYPE_OPTIONS
} from '@/lib/billing/invoice-types'

interface UnifiedBillingDashboardProps {
  lawFirmId: string
  clientId?: string
  userRole?: 'admin' | 'lawyer' | 'client'
  showClientSelector?: boolean
}

interface BillingDashboardData {
  invoices: Invoice[]
  summary: {
    total_invoices: number
    total_amount: number
    paid_amount: number
    pending_amount: number
    overdue_amount: number
    subscription_invoices: number
    case_invoices: number
    payment_plan_invoices: number
  }
  subscription_status?: {
    active_subscriptions: number
    monthly_recurring_revenue: number
    next_billing_date: string
  }
  payment_plans?: Array<{
    id: string
    matter_title: string
    total_amount: number
    paid_amount: number
    remaining_amount: number
    completion_percentage: number
    next_payment_date: string
  }>
}

export function UnifiedBillingDashboard({
  lawFirmId,
  clientId,
  userRole = 'admin',
  showClientSelector = false
}: UnifiedBillingDashboardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<BillingDashboardData | null>(null)
  const [selectedClient, setSelectedClient] = useState<string>(clientId || '')
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month')
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<InvoiceType | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [lawFirmId, selectedClient, selectedPeriod])

  const loadDashboardData = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Mock data - in real app, this would be API calls
      const mockData: BillingDashboardData = {
        invoices: [
          {
            id: 'inv-001',
            law_firm_id: lawFirmId,
            client_id: selectedClient || 'client-1',
            invoice_number: 'SUB-2025-000001',
            invoice_type: 'subscription',
            invoice_status: 'paid',
            issue_date: '2025-01-01',
            due_date: '2025-01-31',
            paid_date: '2025-01-25',
            subtotal: 1500,
            tax_amount: 0,
            discount_amount: 0,
            total_amount: 1500,
            currency: 'BRL',
            payment_terms: '30_days',
            payment_methods: ['pix', 'bank_transfer'],
            description: 'Assinatura mensal - Plano Empresarial',
            created_at: '2025-01-01T10:00:00Z',
            updated_at: '2025-01-25T15:30:00Z',
            client: {
              id: 'client-1',
              name: 'TechCorp Ltda',
              email: 'contato@techcorp.com',
              cnpj: '12.345.678/0001-90'
            }
          },
          {
            id: 'inv-002',
            law_firm_id: lawFirmId,
            client_id: selectedClient || 'client-1',
            invoice_number: 'CASE-2025-000001',
            invoice_type: 'case_billing',
            invoice_status: 'pending_review',
            issue_date: '2025-01-15',
            due_date: '2025-02-14',
            subtotal: 8500,
            tax_amount: 0,
            discount_amount: 500,
            total_amount: 8000,
            currency: 'BRL',
            payment_terms: '30_days',
            payment_methods: ['pix', 'bank_transfer', 'credit_card'],
            description: 'Honorários advocatícios - Ação Trabalhista',
            matter_id: 'matter-1',
            created_at: '2025-01-15T14:00:00Z',
            updated_at: '2025-01-15T14:00:00Z',
            client: {
              id: 'client-1',
              name: 'TechCorp Ltda',
              email: 'contato@techcorp.com',
              cnpj: '12.345.678/0001-90'
            }
          },
          {
            id: 'inv-003',
            law_firm_id: lawFirmId,
            client_id: selectedClient || 'client-1',
            invoice_number: 'PLAN-2025-000001',
            invoice_type: 'payment_plan',
            invoice_status: 'sent',
            issue_date: '2025-01-10',
            due_date: '2025-01-25',
            sent_date: '2025-01-10',
            subtotal: 2500,
            tax_amount: 0,
            discount_amount: 0,
            total_amount: 2500,
            currency: 'BRL',
            payment_terms: '15_days',
            payment_methods: ['pix', 'bank_transfer'],
            description: 'Parcela 1/6 - Contrato Empresarial',
            payment_plan_id: 'plan-1',
            created_at: '2025-01-10T09:00:00Z',
            updated_at: '2025-01-10T09:00:00Z',
            client: {
              id: 'client-1',
              name: 'TechCorp Ltda',
              email: 'contato@techcorp.com',
              cnpj: '12.345.678/0001-90'
            }
          }
        ],
        summary: {
          total_invoices: 3,
          total_amount: 12000,
          paid_amount: 1500,
          pending_amount: 10500,
          overdue_amount: 0,
          subscription_invoices: 1,
          case_invoices: 1,
          payment_plan_invoices: 1
        },
        subscription_status: {
          active_subscriptions: 1,
          monthly_recurring_revenue: 1500,
          next_billing_date: '2025-02-01'
        },
        payment_plans: [
          {
            id: 'plan-1',
            matter_title: 'Contrato Empresarial',
            total_amount: 15000,
            paid_amount: 2500,
            remaining_amount: 12500,
            completion_percentage: 16.7,
            next_payment_date: '2025-02-10'
          }
        ]
      }

      setDashboardData(mockData)
    } catch (err) {
      setError('Erro ao carregar dados de faturamento')
      console.error('Error loading billing dashboard:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredInvoices = dashboardData?.invoices.filter(invoice => {
    const matchesStatus = statusFilter === 'all' || invoice.invoice_status === statusFilter
    const matchesType = typeFilter === 'all' || invoice.invoice_type === typeFilter
    const matchesSearch = searchTerm === '' || 
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.client?.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesStatus && matchesType && matchesSearch
  }) || []

  const getStatusBadgeColor = (status: InvoiceStatus) => {
    const option = INVOICE_STATUS_OPTIONS.find(opt => opt.value === status)
    return option?.color || 'bg-gray-100 text-gray-800'
  }

  const getTypeBadgeColor = (type: InvoiceType) => {
    const option = INVOICE_TYPE_OPTIONS.find(opt => opt.value === type)
    return option?.color || 'bg-gray-100 text-gray-800'
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('pt-BR')
  }

  const handleExportInvoices = async (options: any) => {
    // Export logic would be implemented here
    console.log('Exporting invoices:', options)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin" />
          <p>Carregando dashboard de faturamento...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard de Faturamento</h1>
          <p className="text-gray-600 mt-1">
            Visão unificada de todas as faturas e planos de pagamento
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <Button
              variant={selectedPeriod === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod('month')}
            >
              Mês
            </Button>
            <Button
              variant={selectedPeriod === 'quarter' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod('quarter')}
            >
              Trimestre
            </Button>
            <Button
              variant={selectedPeriod === 'year' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod('year')}
            >
              Ano
            </Button>
          </div>
          
          {userRole === 'admin' && (
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Nova Fatura
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Faturas</p>
                <p className="text-2xl font-bold text-blue-600">
                  {dashboardData?.summary.total_invoices || 0}
                </p>
              </div>
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(dashboardData?.summary.total_amount || 0)}
                </p>
              </div>
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Valor Pago</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(dashboardData?.summary.paid_amount || 0)}
                </p>
              </div>
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Valor Pendente</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(dashboardData?.summary.pending_amount || 0)}
                </p>
              </div>
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="invoices" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="invoices" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Todas as Faturas</span>
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span>Assinaturas</span>
          </TabsTrigger>
          <TabsTrigger value="payment-plans" className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Planos de Pagamento</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Análises</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Buscar por número, descrição ou cliente..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <select
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | 'all')}
                >
                  <option value="all">Todos os Status</option>
                  {INVOICE_STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                
                <select
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as InvoiceType | 'all')}
                >
                  <option value="all">Todos os Tipos</option>
                  {INVOICE_TYPE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                
                <ExportButton
                  data={filteredInvoices}
                  type="invoices"
                  onExport={handleExportInvoices}
                />
              </div>
            </CardContent>
          </Card>

          {/* Invoices List */}
          <Card>
            <CardHeader>
              <CardTitle>Faturas ({filteredInvoices.length})</CardTitle>
              <CardDescription>
                Lista de todas as faturas com filtros aplicados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredInvoices.map((invoice) => (
                  <div key={invoice.id} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="font-mono font-medium">
                            {invoice.invoice_number}
                          </span>
                          <Badge className={getTypeBadgeColor(invoice.invoice_type)}>
                            {INVOICE_TYPE_OPTIONS.find(o => o.value === invoice.invoice_type)?.label}
                          </Badge>
                          <Badge className={getStatusBadgeColor(invoice.invoice_status)}>
                            {INVOICE_STATUS_OPTIONS.find(o => o.value === invoice.invoice_status)?.label}
                          </Badge>
                        </div>
                        
                        <p className="font-medium text-gray-900 mb-1">
                          {invoice.description}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>Cliente: {invoice.client?.name}</span>
                          <span>Emitida: {formatDate(invoice.issue_date)}</span>
                          <span>Vencimento: {formatDate(invoice.due_date)}</span>
                          {invoice.paid_date && (
                            <span>Paga: {formatDate(invoice.paid_date)}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-bold text-lg">
                          {formatCurrency(invoice.total_amount)}
                        </div>
                        {invoice.discount_amount > 0 && (
                          <div className="text-sm text-green-600">
                            Desconto: {formatCurrency(invoice.discount_amount)}
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2 mt-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4 mr-1" />
                            PDF
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredInvoices.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma fatura encontrada</p>
                    <p className="text-sm">Ajuste os filtros ou crie uma nova fatura</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status das Assinaturas</CardTitle>
              <CardDescription>
                Acompanhe o desempenho das assinaturas ativas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-800">Assinaturas Ativas</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {dashboardData?.subscription_status?.active_subscriptions || 0}
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">MRR</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(dashboardData?.subscription_status?.monthly_recurring_revenue || 0)}
                  </div>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-purple-800">Próxima Cobrança</span>
                  </div>
                  <div className="text-lg font-medium text-purple-600">
                    {dashboardData?.subscription_status?.next_billing_date ? 
                      formatDate(dashboardData.subscription_status.next_billing_date) : 
                      'N/A'
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment-plans" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Planos de Pagamento Ativos</CardTitle>
              <CardDescription>
                Acompanhe o progresso dos planos de pagamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData?.payment_plans?.map((plan) => (
                  <div key={plan.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900">{plan.matter_title}</h3>
                        <p className="text-sm text-gray-600">
                          {formatCurrency(plan.paid_amount)} de {formatCurrency(plan.total_amount)} pagos
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">
                          {plan.completion_percentage.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">
                          Próximo: {formatDate(plan.next_payment_date)}
                        </div>
                      </div>
                    </div>
                    
                    <Progress value={plan.completion_percentage} className="h-2 mb-2" />
                    
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Restante: {formatCurrency(plan.remaining_amount)}</span>
                      <Button size="sm" variant="outline">
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                ))}
                
                {!dashboardData?.payment_plans?.length && (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum plano de pagamento ativo</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Assinaturas</span>
                    <span className="font-medium">
                      {dashboardData?.summary.subscription_invoices || 0} faturas
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Casos</span>
                    <span className="font-medium">
                      {dashboardData?.summary.case_invoices || 0} faturas
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Planos de Pagamento</span>
                    <span className="font-medium">
                      {dashboardData?.summary.payment_plan_invoices || 0} faturas
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumo Financeiro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Taxa de Pagamento</span>
                    <span className="font-medium">
                      {dashboardData?.summary.total_amount ? 
                        ((dashboardData.summary.paid_amount / dashboardData.summary.total_amount) * 100).toFixed(1) : 0
                      }%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Valor Médio por Fatura</span>
                    <span className="font-medium">
                      {dashboardData?.summary.total_invoices ? 
                        formatCurrency(dashboardData.summary.total_amount / dashboardData.summary.total_invoices) :
                        formatCurrency(0)
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Faturas em Atraso</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(dashboardData?.summary.overdue_amount || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}