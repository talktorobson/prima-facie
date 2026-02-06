'use client'

import { useState, useEffect } from 'react'
import { UnifiedBillingDashboard } from '@/components/features/billing/unified-billing-dashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Plus, 
  RefreshCw, 
  Settings, 
  AlertCircle, 
  CheckCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Calendar
} from 'lucide-react'

export default function InvoicesPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [lawFirm, setLawFirm] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [quickStats, setQuickStats] = useState<any>(null)

  useEffect(() => {
    loadPageData()
  }, [])

  const loadPageData = async () => {
    try {
      // Mock user and law firm data - in real app, would come from authentication context
      setUser({
        id: 'user-123',
        full_name: 'Dr. João Silva',
        email: 'joao@exemplo.com',
        role: 'admin'
      })
      
      setLawFirm({
        id: 'firm-123',
        name: 'Silva & Associados',
        settings: {
          invoice_automation_enabled: true,
          auto_send_invoices: false,
          late_fee_enabled: true,
          default_payment_terms: '30_days'
        }
      })

      // Mock quick stats
      setQuickStats({
        total_invoices_this_month: 15,
        total_revenue_this_month: 75000,
        pending_approvals: 3,
        overdue_invoices: 2,
        subscription_revenue: 25000,
        case_revenue: 45000,
        payment_plan_revenue: 5000
      })
    } catch (err) {
      setError('Erro ao carregar dados da página')
      console.error('Error loading page data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Carregando sistema de faturas...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sistema de Faturas</h1>
          <p className="text-gray-600 mt-1">
            Gerencie assinaturas, casos e planos de pagamento
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Fatura
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      {quickStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Faturas Este Mês</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {quickStats.total_invoices_this_month}
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
                  <p className="text-sm text-gray-600">Receita Este Mês</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(quickStats.total_revenue_this_month)}
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
                  <p className="text-sm text-gray-600">Aguardando Aprovação</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {quickStats.pending_approvals}
                  </p>
                </div>
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Faturas Vencidas</p>
                  <p className="text-2xl font-bold text-red-600">
                    {quickStats.overdue_invoices}
                  </p>
                </div>
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Automation Status */}
      {lawFirm?.settings?.invoice_automation_enabled && (
        <Alert className="mb-6">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Automação de Faturas Ativa</strong>
            <br />
            As faturas de assinatura são geradas automaticamente todo mês. 
            {lawFirm.settings.auto_send_invoices 
              ? ' Envio automático habilitado.' 
              : ' Revise e envie manualmente.'
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Revenue Breakdown */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Distribuição de Receita Este Mês</span>
          </CardTitle>
          <CardDescription>
            Análise da receita por tipo de faturamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-blue-800">Assinaturas</span>
                <Badge className="bg-blue-100 text-blue-800">Recorrente</Badge>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(quickStats?.subscription_revenue || 0)}
              </div>
              <div className="text-sm text-blue-600 mt-1">
                {quickStats?.total_revenue_this_month ? 
                  `${((quickStats.subscription_revenue / quickStats.total_revenue_this_month) * 100).toFixed(1)}% do total` :
                  '0% do total'
                }
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-green-800">Casos</span>
                <Badge className="bg-green-100 text-green-800">Pontual</Badge>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(quickStats?.case_revenue || 0)}
              </div>
              <div className="text-sm text-green-600 mt-1">
                {quickStats?.total_revenue_this_month ? 
                  `${((quickStats.case_revenue / quickStats.total_revenue_this_month) * 100).toFixed(1)}% do total` :
                  '0% do total'
                }
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-purple-800">Planos de Pagamento</span>
                <Badge className="bg-purple-100 text-purple-800">Parcelado</Badge>
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(quickStats?.payment_plan_revenue || 0)}
              </div>
              <div className="text-sm text-purple-600 mt-1">
                {quickStats?.total_revenue_this_month ? 
                  `${((quickStats.payment_plan_revenue / quickStats.total_revenue_this_month) * 100).toFixed(1)}% do total` :
                  '0% do total'
                }
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Billing Dashboard */}
      <UnifiedBillingDashboard
        lawFirmId={lawFirm.id}
        userRole={user.role}
        showClientSelector={user.role === 'admin'}
      />
    </div>
  )
}