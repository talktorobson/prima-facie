'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Clock, 
  Play, 
  Pause, 
  Square, 
  Calculator, 
  AlertCircle, 
  CheckCircle,
  Timer,
  Calendar,
  DollarSign,
  MapPin,
  User
} from 'lucide-react'
import { timeTrackingService } from '@/lib/billing/time-tracking-service'
import type {
  TimeEntryFormData,
  TimeEntryTemplate,
  LawyerBillingRate,
  ActiveTimeSession,
  TimeEntry,
  TimeEntryType,
  BillingRateSource
} from '@/lib/billing/time-tracking-types'
import {
  TIME_ENTRY_TYPE_OPTIONS,
  TASK_CATEGORY_OPTIONS,
  LOCATION_OPTIONS,
  BILLING_RATE_TYPE_OPTIONS
} from '@/lib/billing/time-tracking-types'

interface TimeEntryFormProps {
  initialData?: Partial<TimeEntryFormData>
  timeEntry?: TimeEntry
  onSubmit: (data: TimeEntryFormData) => Promise<void>
  onCancel?: () => void
  lawFirmId: string
  userId: string
}

export function TimeEntryForm({
  initialData,
  timeEntry,
  onSubmit,
  onCancel,
  lawFirmId,
  userId
}: TimeEntryFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [useTimer, setUseTimer] = useState(false)
  const [activeSession, setActiveSession] = useState<ActiveTimeSession | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [templates, setTemplates] = useState<TimeEntryTemplate[]>([])
  const [billingRates, setBillingRates] = useState<LawyerBillingRate[]>([])
  const [calculatedAmount, setCalculatedAmount] = useState(0)
  const [matters, setMatters] = useState<Array<{id: string, title: string, client_name?: string}>>([])
  const [subscriptions, setSubscriptions] = useState<Array<{id: string, plan_name: string, client_name?: string}>>([])

  const { register, watch, setValue, handleSubmit, formState: { errors }, reset } = useForm<TimeEntryFormData>({
    defaultValues: {
      entry_type: 'case_work',
      is_billable: true,
      is_remote_work: false,
      break_minutes: 0,
      billing_rate_source: 'user_default',
      ...initialData
    }
  })

  const watchedValues = watch()

  // Load initial data
  useEffect(() => {
    loadTemplates()
    loadBillingRates()
    loadMatters()
    loadSubscriptions()
    checkActiveSession()
  }, [userId])

  // Update calculated amount when relevant fields change
  useEffect(() => {
    calculateBillableAmount()
  }, [
    watchedValues.duration_minutes,
    watchedValues.break_minutes,
    watchedValues.billable_rate,
    watchedValues.is_billable
  ])

  // Timer update effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (activeSession && !activeSession.is_paused) {
      interval = setInterval(() => {
        const start = new Date(activeSession.started_at).getTime()
        const now = Date.now()
        const elapsed = Math.floor((now - start) / 60000) - (activeSession.pause_duration_minutes || 0)
        setElapsedTime(Math.max(0, elapsed))
        
        // Update heartbeat every minute
        if (elapsed % 1 === 0) {
          timeTrackingService.updateHeartbeat(activeSession.id)
        }
      }, 60000) // Update every minute
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [activeSession])

  const loadTemplates = async () => {
    try {
      const data = await timeTrackingService.getTimeEntryTemplates(userId, true)
      setTemplates(data)
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  const loadBillingRates = async () => {
    try {
      const data = await timeTrackingService.getBillingRates(userId)
      setBillingRates(data)
      
      // Set default rate if none specified
      if (!watchedValues.billable_rate && data.length > 0) {
        const defaultRate = data.find(rate => rate.rate_type === 'standard') || data[0]
        setValue('billable_rate', defaultRate.hourly_rate)
      }
    } catch (error) {
      console.error('Error loading billing rates:', error)
    }
  }

  const loadMatters = async () => {
    // Mock data - in real app, would fetch from API
    setMatters([
      { id: 'matter-1', title: 'Ação Trabalhista - Empresa ABC', client_name: 'Empresa ABC Ltda' },
      { id: 'matter-2', title: 'Revisão Contratual', client_name: 'Cliente XYZ' },
      { id: 'matter-3', title: 'Defesa Criminal', client_name: 'João Silva' }
    ])
  }

  const loadSubscriptions = async () => {
    // Mock data - in real app, would fetch from API
    setSubscriptions([
      { id: 'sub-1', plan_name: 'Consultoria Empresarial', client_name: 'Empresa ABC Ltda' },
      { id: 'sub-2', plan_name: 'Suporte Trabalhista', client_name: 'Cliente XYZ' }
    ])
  }

  const checkActiveSession = async () => {
    try {
      const session = await timeTrackingService.getCurrentSession(userId)
      setActiveSession(session)
      
      if (session) {
        setUseTimer(true)
        // Pre-fill form with session data
        setValue('entry_type', session.entry_type)
        setValue('matter_id', session.matter_id)
        setValue('client_subscription_id', session.client_subscription_id)
        setValue('task_category', session.task_category)
        setValue('activity_description', session.activity_description)
      }
    } catch (error) {
      console.error('Error checking active session:', error)
    }
  }

  const calculateBillableAmount = () => {
    if (!watchedValues.is_billable || !watchedValues.billable_rate) {
      setCalculatedAmount(0)
      return
    }

    const effectiveMinutes = (watchedValues.duration_minutes || 0) - (watchedValues.break_minutes || 0)
    const hours = effectiveMinutes / 60
    const amount = hours * (watchedValues.billable_rate || 0)
    setCalculatedAmount(amount)
  }

  const handleStartTimer = async () => {
    try {
      const sessionId = await timeTrackingService.startTimer(userId, watchedValues)
      const session = await timeTrackingService.getCurrentSession(userId)
      setActiveSession(session)
      setUseTimer(true)
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

  const handleStopTimer = async (saveEntry = true) => {
    if (activeSession) {
      try {
        const timeEntry = await timeTrackingService.stopTimer(activeSession.id, saveEntry)
        setActiveSession(null)
        setElapsedTime(0)
        setUseTimer(false)
        
        if (timeEntry && saveEntry) {
          // Fill form with timer data
          setValue('duration_minutes', timeEntry.duration_minutes)
          setValue('break_minutes', timeEntry.break_minutes)
          setValue('start_time', timeEntry.start_time)
          setValue('end_time', timeEntry.end_time)
        }
      } catch (error) {
        console.error('Error stopping timer:', error)
      }
    }
  }

  const handleUseTemplate = async (templateId: string) => {
    try {
      const templateData = await timeTrackingService.useTemplate(templateId, watchedValues)
      
      Object.entries(templateData).forEach(([key, value]) => {
        if (value !== undefined) {
          setValue(key as keyof TimeEntryFormData, value)
        }
      })
    } catch (error) {
      console.error('Error using template:', error)
    }
  }

  const handleFormSubmit = async (data: TimeEntryFormData) => {
    setIsLoading(true)
    
    try {
      // If timer is running, stop it first
      if (activeSession) {
        await handleStopTimer(false)
      }
      
      // Set current time if using timer mode
      if (useTimer && !data.start_time) {
        data.start_time = new Date().toISOString()
        data.duration_minutes = elapsedTime
      }
      
      await onSubmit(data)
      reset()
    } catch (error) {
      console.error('Error submitting time entry:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}:${mins.toString().padStart(2, '0')}`
  }

  const getCurrentRate = (): number => {
    return watchedValues.billable_rate || 0
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>{timeEntry ? 'Editar Entrada de Tempo' : 'Nova Entrada de Tempo'}</span>
            </CardTitle>
            <CardDescription>
              Registre seu tempo trabalhado com cálculo automático de faturamento
            </CardDescription>
          </div>
          
          {activeSession && (
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="flex items-center space-x-1">
                <Timer className="h-3 w-3" />
                <span>{formatTime(elapsedTime)}</span>
              </Badge>
              {activeSession.is_paused && (
                <Badge variant="secondary">Pausado</Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs defaultValue="entry" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="entry">Entrada de Tempo</TabsTrigger>
            <TabsTrigger value="timer">Timer</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="entry" className="space-y-6">
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
              {/* Entry Type & Work Classification */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="entry_type">Tipo de Entrada</Label>
                  <Select
                    value={watchedValues.entry_type}
                    onValueChange={(value: TimeEntryType) => setValue('entry_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_ENTRY_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center space-x-2">
                            <Badge className={option.color} variant="secondary">
                              {option.label}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="task_category">Categoria da Atividade</Label>
                  <Select
                    value={watchedValues.task_category}
                    onValueChange={(value) => setValue('task_category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_CATEGORY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Matter/Subscription Selection */}
              {watchedValues.entry_type === 'case_work' && (
                <div className="space-y-2">
                  <Label htmlFor="matter_id">Caso/Processo</Label>
                  <Select
                    value={watchedValues.matter_id}
                    onValueChange={(value) => setValue('matter_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o caso" />
                    </SelectTrigger>
                    <SelectContent>
                      {matters.map((matter) => (
                        <SelectItem key={matter.id} value={matter.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{matter.title}</span>
                            {matter.client_name && (
                              <span className="text-sm text-gray-500">{matter.client_name}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {watchedValues.entry_type === 'subscription_work' && (
                <div className="space-y-2">
                  <Label htmlFor="client_subscription_id">Plano de Consultoria</Label>
                  <Select
                    value={watchedValues.client_subscription_id}
                    onValueChange={(value) => setValue('client_subscription_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o plano" />
                    </SelectTrigger>
                    <SelectContent>
                      {subscriptions.map((subscription) => (
                        <SelectItem key={subscription.id} value={subscription.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{subscription.plan_name}</span>
                            {subscription.client_name && (
                              <span className="text-sm text-gray-500">{subscription.client_name}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Activity Description */}
              <div className="space-y-2">
                <Label htmlFor="activity_description">Descrição da Atividade</Label>
                <Textarea
                  {...register('activity_description', { required: 'Descrição é obrigatória' })}
                  placeholder="Descreva as atividades realizadas..."
                  rows={3}
                />
                {errors.activity_description && (
                  <span className="text-sm text-red-500">{errors.activity_description.message}</span>
                )}
              </div>

              {/* Time Entry */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <Label className="text-base font-medium">Registro de Tempo</Label>
                </div>

                {!useTimer && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_time">Início</Label>
                      <Input
                        {...register('start_time')}
                        type="datetime-local"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="end_time">Fim</Label>
                      <Input
                        {...register('end_time')}
                        type="datetime-local"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration_minutes">Duração (min)</Label>
                      <Input
                        {...register('duration_minutes', { 
                          valueAsNumber: true,
                          min: { value: 1, message: 'Duração deve ser maior que 0' }
                        })}
                        type="number"
                        placeholder="0"
                      />
                      {errors.duration_minutes && (
                        <span className="text-sm text-red-500">{errors.duration_minutes.message}</span>
                      )}
                    </div>
                  </div>
                )}

                {useTimer && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl font-mono font-bold">
                          {formatTime(elapsedTime)}
                        </div>
                        {activeSession?.is_paused && (
                          <Badge variant="secondary">Pausado</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {!activeSession ? (
                          <Button onClick={handleStartTimer} size="sm">
                            <Play className="h-4 w-4 mr-2" />
                            Iniciar
                          </Button>
                        ) : (
                          <>
                            {activeSession.is_paused ? (
                              <Button onClick={handleResumeTimer} size="sm">
                                <Play className="h-4 w-4 mr-2" />
                                Continuar
                              </Button>
                            ) : (
                              <Button onClick={handlePauseTimer} size="sm" variant="outline">
                                <Pause className="h-4 w-4 mr-2" />
                                Pausar
                              </Button>
                            )}
                            <Button onClick={() => handleStopTimer(false)} size="sm" variant="destructive">
                              <Square className="h-4 w-4 mr-2" />
                              Parar
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="break_minutes">Pausas (min)</Label>
                    <Input
                      {...register('break_minutes', { valueAsNumber: true })}
                      type="number"
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Local</Label>
                    <Select
                      value={watchedValues.location}
                      onValueChange={(value) => setValue('location', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o local" />
                      </SelectTrigger>
                      <SelectContent>
                        {LOCATION_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={watchedValues.is_remote_work}
                    onCheckedChange={(checked) => setValue('is_remote_work', checked)}
                  />
                  <Label>Trabalho remoto</Label>
                </div>
              </div>

              <Separator />

              {/* Billing Information */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4" />
                  <Label className="text-base font-medium">Informações de Faturamento</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={watchedValues.is_billable}
                    onCheckedChange={(checked) => setValue('is_billable', checked)}
                  />
                  <Label>Tempo faturável</Label>
                </div>

                {watchedValues.is_billable && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="billable_rate">Taxa por Hora (R$)</Label>
                      <Input
                        {...register('billable_rate', { 
                          valueAsNumber: true,
                          min: { value: 0, message: 'Taxa deve ser maior que 0' }
                        })}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                      />
                      {errors.billable_rate && (
                        <span className="text-sm text-red-500">{errors.billable_rate.message}</span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Valor Calculado</Label>
                      <div className="p-2 bg-green-50 border rounded-md">
                        <div className="flex items-center space-x-2">
                          <Calculator className="h-4 w-4 text-green-600" />
                          <span className="font-bold text-green-700">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(calculatedAmount)}
                          </span>
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          {((watchedValues.duration_minutes || 0) - (watchedValues.break_minutes || 0)) / 60}h × R$ {getCurrentRate()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {watchedValues.entry_type === 'subscription_work' && (
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={watchedValues.counts_toward_subscription}
                      onCheckedChange={(checked) => setValue('counts_toward_subscription', checked)}
                    />
                    <Label>Contar para limite da assinatura</Label>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-3 pt-6">
                {onCancel && (
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Cancelar
                  </Button>
                )}
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Salvando...' : timeEntry ? 'Atualizar' : 'Salvar'}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="timer" className="space-y-6">
            <div className="text-center py-8">
              <div className="text-6xl font-mono font-bold mb-4">
                {formatTime(elapsedTime)}
              </div>
              
              {activeSession ? (
                <div className="space-y-4">
                  <div className="text-lg text-gray-600">
                    {activeSession.activity_description || 'Timer ativo'}
                  </div>
                  
                  <div className="flex items-center justify-center space-x-4">
                    {activeSession.is_paused ? (
                      <Button onClick={handleResumeTimer} size="lg">
                        <Play className="h-5 w-5 mr-2" />
                        Continuar
                      </Button>
                    ) : (
                      <Button onClick={handlePauseTimer} size="lg" variant="outline">
                        <Pause className="h-5 w-5 mr-2" />
                        Pausar
                      </Button>
                    )}
                    
                    <Button onClick={() => handleStopTimer(true)} size="lg" variant="destructive">
                      <Square className="h-5 w-5 mr-2" />
                      Parar e Salvar
                    </Button>
                  </div>
                  
                  {activeSession.is_paused && (
                    <Badge variant="secondary" className="mt-2">
                      Timer pausado
                    </Badge>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-lg text-gray-600">
                    Nenhum timer ativo
                  </div>
                  
                  <Button onClick={() => setUseTimer(true)} size="lg">
                    <Timer className="h-5 w-5 mr-2" />
                    Configurar Timer
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <div className="grid gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleUseTemplate(template.id)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{template.template_name}</h4>
                        <p className="text-sm text-gray-600">{template.template_description}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <Badge variant="outline">
                            {TIME_ENTRY_TYPE_OPTIONS.find(o => o.value === template.default_entry_type)?.label}
                          </Badge>
                          {template.default_duration_minutes && (
                            <span className="text-sm text-gray-500">
                              {formatTime(template.default_duration_minutes)}
                            </span>
                          )}
                          {template.default_billable_rate && (
                            <span className="text-sm text-gray-500">
                              R$ {template.default_billable_rate}/h
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          Usado {template.usage_count} vezes
                        </div>
                        {template.is_shared && (
                          <Badge variant="secondary" className="mt-1">
                            Compartilhado
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {templates.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum template encontrado</p>
                  <p className="text-sm">Templates são criados automaticamente com base no seu histórico</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}