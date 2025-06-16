'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Clock, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  PlayCircle,
  PauseCircle,
  StopCircle,
  Plus,
  Calendar,
  Target,
  Timer,
  Users,
  BarChart3,
  PieChart,
  Activity,
  CheckCircle
} from 'lucide-react'
import { timeTrackingService } from '@/lib/billing/time-tracking-service'
import { TimeEntryForm } from './time-entry-form'
import type {
  TimeTrackingDashboard as DashboardData,
  TimeEntry,
  ActiveTimeSession,
  DailyTimeSummary,
  TimeTrackingMetrics,
  TimeEntryFormData
} from '@/lib/billing/time-tracking-types'
import {
  TIME_ENTRY_STATUS_OPTIONS,
  TIME_ENTRY_TYPE_OPTIONS
} from '@/lib/billing/time-tracking-types'

interface TimeTrackingDashboardProps {
  lawFirmId: string
  userId: string
  userRole?: 'admin' | 'lawyer' | 'staff'
}

export function TimeTrackingDashboard({
  lawFirmId,
  userId,
  userRole = 'lawyer'
}: TimeTrackingDashboardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [activeSession, setActiveSession] = useState<ActiveTimeSession | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [showNewEntry, setShowNewEntry] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('week')
  const [metrics, setMetrics] = useState<TimeTrackingMetrics | null>(null)
  const [recentEntries, setRecentEntries] = useState<TimeEntry[]>([])

  useEffect(() => {
    loadDashboardData()
    loadActiveSession()
    const interval = setInterval(loadActiveSession, 60000) // Check every minute
    return () => clearInterval(interval)
  }, [userId, selectedPeriod])

  useEffect(() => {
    let timerInterval: NodeJS.Timeout
    
    if (activeSession && !activeSession.is_paused) {
      timerInterval = setInterval(() => {
        const start = new Date(activeSession.started_at).getTime()
        const now = Date.now()
        const elapsed = Math.floor((now - start) / 60000) - (activeSession.pause_duration_minutes || 0)
        setElapsedTime(Math.max(0, elapsed))
      }, 1000)
    }

    return () => {
      if (timerInterval) clearInterval(timerInterval)
    }
  }, [activeSession])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      const endDate = new Date()
      let startDate = new Date()
      
      switch (selectedPeriod) {
        case 'today':
          startDate = new Date()
          break
        case 'week':
          startDate = new Date(endDate)
          startDate.setDate(startDate.getDate() - 7)
          break
        case 'month':
          startDate = new Date(endDate)
          startDate.setMonth(startDate.getMonth() - 1)
          break
      }

      const [dashboard, metricsData, entries] = await Promise.all([
        timeTrackingService.getTimeTrackingDashboard(
          userId,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        ),
        timeTrackingService.getTimeTrackingMetrics({
          user_id: userId,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0]
        }),
        timeTrackingService.getTimeEntries({
          user_id: userId,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0]
        })
      ])

      setDashboardData({ ...dashboard, law_firm_id: lawFirmId })
      setMetrics(metricsData)
      setRecentEntries(entries.slice(0, 10))
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadActiveSession = async () => {
    try {
      const session = await timeTrackingService.getCurrentSession(userId)
      setActiveSession(session)
    } catch (error) {
      console.error('Error loading active session:', error)
    }
  }

  const handleStartTimer = async () => {
    try {
      const sessionId = await timeTrackingService.startTimer(userId, {
        entry_type: 'case_work',
        activity_description: 'Nova sessão de trabalho',
        is_billable: true
      })
      await loadActiveSession()
    } catch (error) {
      console.error('Error starting timer:', error)
    }
  }

  const handlePauseTimer = async () => {
    if (activeSession) {
      try {
        await timeTrackingService.pauseTimer(activeSession.id)
        setActiveSession({ ...activeSession, is_paused: true })
      } catch (error) {
        console.error('Error pausing timer:', error)
      }
    }
  }

  const handleResumeTimer = async () => {
    if (activeSession) {
      try {
        await timeTrackingService.resumeTimer(activeSession.id)
        setActiveSession({ ...activeSession, is_paused: false })
      } catch (error) {
        console.error('Error resuming timer:', error)
      }
    }
  }

  const handleStopTimer = async () => {
    if (activeSession) {
      try {
        await timeTrackingService.stopTimer(activeSession.id, true)
        setActiveSession(null)
        setElapsedTime(0)
        loadDashboardData() // Refresh data
      } catch (error) {
        console.error('Error stopping timer:', error)
      }
    }
  }

  const handleCreateTimeEntry = async (data: TimeEntryFormData) => {
    try {
      await timeTrackingService.createTimeEntry(data)
      setShowNewEntry(false)
      loadDashboardData() // Refresh data
    } catch (error) {
      console.error('Error creating time entry:', error)
      throw error
    }
  }

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}:${mins.toString().padStart(2, '0')}`
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  const getStatusBadgeColor = (status: string) => {
    const option = TIME_ENTRY_STATUS_OPTIONS.find(opt => opt.value === status)
    return option?.color || 'bg-gray-100 text-gray-800'
  }

  const getTypeBadgeColor = (type: string) => {
    const option = TIME_ENTRY_TYPE_OPTIONS.find(opt => opt.value === type)
    return option?.color || 'bg-gray-100 text-gray-800'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Clock className="h-8 w-8 mx-auto mb-4 animate-spin" />
          <p>Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Controle de Tempo</h1>
          <p className="text-gray-600 mt-1">
            Gerencie seu tempo e maximize sua produtividade
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <Button
              variant={selectedPeriod === 'today' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod('today')}
            >
              Hoje
            </Button>
            <Button
              variant={selectedPeriod === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod('week')}
            >
              Semana
            </Button>
            <Button
              variant={selectedPeriod === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod('month')}
            >
              Mês
            </Button>
          </div>
          
          <Button onClick={() => setShowNewEntry(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Entrada
          </Button>
        </div>
      </div>

      {/* Active Timer Section */}
      {activeSession ? (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Timer className="h-6 w-6 text-blue-600" />
                </div>
                
                <div>
                  <div className="text-2xl font-mono font-bold text-blue-900">
                    {formatTime(elapsedTime)}
                  </div>
                  <p className="text-blue-700 font-medium">
                    {activeSession.activity_description || 'Timer ativo'}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge className="bg-blue-200 text-blue-800">
                      {TIME_ENTRY_TYPE_OPTIONS.find(o => o.value === activeSession.entry_type)?.label}
                    </Badge>
                    {activeSession.is_paused && (
                      <Badge variant="secondary">Pausado</Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {activeSession.is_paused ? (
                  <Button onClick={handleResumeTimer} size="sm">
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Continuar
                  </Button>
                ) : (
                  <Button onClick={handlePauseTimer} size="sm" variant="outline">
                    <PauseCircle className="h-4 w-4 mr-2" />
                    Pausar
                  </Button>
                )}
                
                <Button onClick={handleStopTimer} size="sm" variant="destructive">
                  <StopCircle className="h-4 w-4 mr-2" />
                  Parar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gray-100 rounded-full">
                  <Timer className="h-6 w-6 text-gray-400" />
                </div>
                
                <div>
                  <div className="text-lg font-medium text-gray-900">
                    Nenhum timer ativo
                  </div>
                  <p className="text-gray-600">
                    Inicie um timer para registrar seu tempo automaticamente
                  </p>
                </div>
              </div>
              
              <Button onClick={handleStartTimer}>
                <PlayCircle className="h-4 w-4 mr-2" />
                Iniciar Timer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Horas</p>
                <p className="text-2xl font-bold text-blue-600">
                  {dashboardData?.current_period.total_hours.toFixed(1)}h
                </p>
              </div>
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Horas Faturáveis</p>
                <p className="text-2xl font-bold text-green-600">
                  {dashboardData?.current_period.billable_hours.toFixed(1)}h
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
                <p className="text-sm text-gray-600">Taxa de Utilização</p>
                <p className="text-2xl font-bold text-orange-600">
                  {dashboardData?.current_period.utilization_rate.toFixed(1)}%
                </p>
              </div>
              <Target className="h-6 w-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Receita Total</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(dashboardData?.current_period.total_revenue || 0)}
                </p>
              </div>
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="entries" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Entradas de Tempo</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <PieChart className="h-4 w-4" />
            <span>Análises</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Relatórios</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Breakdown Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Atividade Diária</span>
                </CardTitle>
                <CardDescription>
                  Distribuição de horas nos últimos dias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.daily_breakdown.slice(0, 7).map((day, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">
                          {new Date(day.date).toLocaleDateString('pt-BR', { 
                            weekday: 'short', 
                            day: '2-digit', 
                            month: '2-digit' 
                          })}
                        </span>
                        <span className="text-gray-600">
                          {formatTime(day.total_minutes)} ({day.entries_count} entradas)
                        </span>
                      </div>
                      <Progress 
                        value={(day.billable_minutes / Math.max(day.total_minutes, 1)) * 100} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Activities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5" />
                  <span>Principais Atividades</span>
                </CardTitle>
                <CardDescription>
                  Atividades com mais tempo registrado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(
                    recentEntries.reduce((acc, entry) => {
                      const category = entry.task_category || 'Outros'
                      if (!acc[category]) {
                        acc[category] = { minutes: 0, count: 0 }
                      }
                      acc[category].minutes += entry.effective_minutes
                      acc[category].count += 1
                      return acc
                    }, {} as Record<string, { minutes: number, count: number }>)
                  )
                    .sort(([,a], [,b]) => b.minutes - a.minutes)
                    .slice(0, 5)
                    .map(([category, data], index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                          <span className="font-medium">{category}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{formatTime(data.minutes)}</div>
                          <div className="text-sm text-gray-500">{data.count} entradas</div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Productivity Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Insights de Produtividade</CardTitle>
              <CardDescription>
                Análise do seu desempenho e sugestões de melhoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">Pontos Fortes</span>
                  </div>
                  <ul className="text-sm text-green-700 space-y-1">
                    {metrics && metrics.utilization_rate > 80 && (
                      <li>• Alta taxa de utilização ({metrics.utilization_rate.toFixed(1)}%)</li>
                    )}
                    {metrics && metrics.average_hourly_rate > 300 && (
                      <li>• Boa taxa horária média (R$ {metrics.average_hourly_rate.toFixed(0)})</li>
                    )}
                    {recentEntries.length > 10 && (
                      <li>• Registro consistente de tempo</li>
                    )}
                  </ul>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium text-yellow-800">Oportunidades</span>
                  </div>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {metrics && metrics.utilization_rate < 70 && (
                      <li>• Aumentar tempo faturável</li>
                    )}
                    {dashboardData && dashboardData.current_period.total_hours < 30 && selectedPeriod === 'week' && (
                      <li>• Registrar mais horas trabalhadas</li>
                    )}
                    <li>• Usar mais templates para agilizar registro</li>
                  </ul>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-800">Metas</span>
                  </div>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Taxa de utilização: 85%</li>
                    <li>• Horas semanais: 40h</li>
                    <li>• Receita mensal: R$ 25.000</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entries" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Entradas de Tempo Recentes</CardTitle>
              <CardDescription>
                Suas últimas {recentEntries.length} entradas de tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentEntries.map((entry) => (
                  <div key={entry.id} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Badge className={getTypeBadgeColor(entry.entry_type)}>
                            {TIME_ENTRY_TYPE_OPTIONS.find(o => o.value === entry.entry_type)?.label}
                          </Badge>
                          <Badge className={getStatusBadgeColor(entry.entry_status)}>
                            {TIME_ENTRY_STATUS_OPTIONS.find(o => o.value === entry.entry_status)?.label}
                          </Badge>
                          {entry.task_category && (
                            <span className="text-sm text-gray-500">{entry.task_category}</span>
                          )}
                        </div>
                        
                        <p className="font-medium text-gray-900 mb-1">
                          {entry.activity_description}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>
                            {new Date(entry.entry_date).toLocaleDateString('pt-BR')}
                          </span>
                          <span>
                            {formatTime(entry.effective_minutes)}
                          </span>
                          {entry.matter?.title && (
                            <span>• {entry.matter.title}</span>
                          )}
                          {entry.client_subscription?.plan_name && (
                            <span>• {entry.client_subscription.plan_name}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-bold text-lg">
                          {formatCurrency(entry.billable_amount)}
                        </div>
                        {entry.billable_rate && (
                          <div className="text-sm text-gray-500">
                            R$ {entry.billable_rate}/h
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {recentEntries.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma entrada de tempo encontrada</p>
                    <p className="text-sm">Comece registrando seu primeiro tempo!</p>
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
                <CardTitle>Métricas de Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {metrics && (
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total de Entradas:</span>
                      <span className="font-bold">{metrics.total_entries}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Horas Totais:</span>
                      <span className="font-bold">{metrics.total_hours.toFixed(1)}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Horas Faturáveis:</span>
                      <span className="font-bold">{metrics.billable_hours.toFixed(1)}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxa Horária Média:</span>
                      <span className="font-bold">R$ {metrics.average_hourly_rate.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Score de Produtividade:</span>
                      <span className="font-bold">{metrics.productivity_score}/100</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {TIME_ENTRY_TYPE_OPTIONS.map((type) => {
                    const typeEntries = recentEntries.filter(e => e.entry_type === type.value)
                    const totalMinutes = typeEntries.reduce((sum, e) => sum + e.effective_minutes, 0)
                    const totalHours = totalMinutes / 60
                    const percentage = metrics ? (totalHours / metrics.total_hours) * 100 : 0
                    
                    return (
                      <div key={type.value} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{type.label}</span>
                          <span>{totalHours.toFixed(1)}h ({percentage.toFixed(1)}%)</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios</CardTitle>
              <CardDescription>
                Gere relatórios detalhados do seu tempo trabalhado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center space-y-2">
                  <Calendar className="h-6 w-6" />
                  <span>Relatório Semanal</span>
                </Button>
                
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center space-y-2">
                  <BarChart3 className="h-6 w-6" />
                  <span>Relatório Mensal</span>
                </Button>
                
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center space-y-2">
                  <DollarSign className="h-6 w-6" />
                  <span>Relatório de Faturamento</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* New Entry Modal */}
      {showNewEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <TimeEntryForm
              lawFirmId={lawFirmId}
              userId={userId}
              onSubmit={handleCreateTimeEntry}
              onCancel={() => setShowNewEntry(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}