'use client'

import { useState, useEffect } from 'react'
import { TimeTrackingDashboard } from '@/components/features/billing/time-tracking-dashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Clock, AlertCircle, CheckCircle, Info } from 'lucide-react'

export default function TimeTrackingPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [lawFirm, setLawFirm] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      // Mock user data - in real app, would come from authentication context
      setUser({
        id: 'user-123',
        full_name: 'Dr. João Silva',
        email: 'joao@exemplo.com',
        role: 'lawyer'
      })
      
      setLawFirm({
        id: 'firm-123',
        name: 'Silva & Associados',
        settings: {
          time_tracking_enabled: true,
          auto_billing_enabled: true,
          minimum_billing_increment: 15
        }
      })
    } catch (err) {
      setError('Erro ao carregar dados do usuário')
      console.error('Error loading user data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="h-8 w-8 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Carregando sistema de controle de tempo...</p>
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

  if (!lawFirm?.settings?.time_tracking_enabled) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Controle de Tempo</span>
            </CardTitle>
            <CardDescription>
              Sistema de controle de tempo não está habilitado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                O sistema de controle de tempo não está habilitado para este escritório.
                Entre em contato com o administrador para ativar esta funcionalidade.
              </AlertDescription>
            </Alert>
            
            <div className="mt-6 space-y-4">
              <h3 className="font-medium">Recursos do Sistema de Controle de Tempo:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Timer automático para registro de tempo em tempo real</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Integração automática com sistema de faturamento</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Controle de horas para assinantes vs casos individuais</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Relatórios de produtividade e utilização</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Templates de atividades para agilizar registro</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Aprovação de horas e workflow de faturamento</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Welcome Message for First Time Users */}
      {!localStorage.getItem('time_tracking_intro_seen') && (
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Bem-vindo ao Sistema de Controle de Tempo!</strong>
            <br />
            Use o timer para registrar automaticamente seu tempo de trabalho ou crie entradas manuais.
            Todo tempo aprovado será integrado automaticamente ao sistema de faturamento.
            <button 
              className="ml-2 text-blue-600 underline"
              onClick={() => localStorage.setItem('time_tracking_intro_seen', 'true')}
            >
              Não mostrar novamente
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Auto-billing Status */}
      {lawFirm?.settings?.auto_billing_enabled && (
        <Alert className="mb-6">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Faturamento Automático Ativo</strong>
            <br />
            Suas horas aprovadas serão automaticamente incluídas nas faturas geradas pelo sistema.
            Increments mínimos de {lawFirm.settings.minimum_billing_increment} minutos.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Dashboard */}
      <TimeTrackingDashboard
        lawFirmId={lawFirm.id}
        userId={user.id}
        userRole={user.role}
      />
    </div>
  )
}