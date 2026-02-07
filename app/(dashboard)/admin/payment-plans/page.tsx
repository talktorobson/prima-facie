'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuthContext } from '@/lib/providers/auth-provider'
import { useEffectiveLawFirmId } from '@/lib/hooks/use-effective-law-firm-id'
import { 
  PlusIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  PencilIcon,
  TrashIcon,
  BanknotesIcon,
  ChartBarIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { 
  PaymentPlan,
  PaymentPlanFormData,
  PaymentFrequency,
  PaymentPlanStatus,
  PAYMENT_FREQUENCY_OPTIONS,
  PAYMENT_PLAN_STATUS_OPTIONS
} from '@/lib/billing/payment-plan-types'
import { paymentPlanService } from '@/lib/billing/payment-plan-service'

const initialFormData: PaymentPlanFormData = {
  matter_id: '',
  plan_name: '',
  total_amount: 0,
  installment_count: 6,
  down_payment: 0,
  payment_frequency: 'monthly',
  start_date: new Date().toISOString().split('T')[0],
  auto_charge: true,
  late_fee_percentage: 2.0,
  grace_period_days: 5,
  notes: ''
}

export default function PaymentPlansPage(): JSX.Element {
  const { profile } = useAuthContext()
  const effectiveLawFirmId = useEffectiveLawFirmId()
  const [plans, setPlans] = useState<PaymentPlan[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<PaymentPlan | null>(null)
  const [formData, setFormData] = useState<PaymentPlanFormData>(initialFormData)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<PaymentPlanStatus | 'all'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'amount' | 'created' | 'due_date'>('created')

  const loadPaymentPlans = useCallback(async () => {
    if (!effectiveLawFirmId) return
    try {
      setIsLoading(true)
      const plansData = await paymentPlanService.getPaymentPlans(effectiveLawFirmId)
      setPlans(plansData)
    } catch (error) {
      console.error('Error loading payment plans:', error)
    } finally {
      setIsLoading(false)
    }
  }, [effectiveLawFirmId])

  useEffect(() => {
    loadPaymentPlans()
  }, [loadPaymentPlans])

  // Filter and sort plans
  const filteredPlans = plans
    .filter(plan => {
      const matchesSearch = plan.plan_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           plan.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = filterStatus === 'all' || plan.status === filterStatus
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.plan_name.localeCompare(b.plan_name)
        case 'amount':
          return b.total_amount - a.total_amount
        case 'due_date':
          return new Date(a.end_date).getTime() - new Date(b.end_date).getTime()
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getStatusLabel = (status: PaymentPlanStatus) => {
    return PAYMENT_PLAN_STATUS_OPTIONS.find(option => option.value === status)?.label || status
  }

  const getStatusColor = (status: PaymentPlanStatus) => {
    return PAYMENT_PLAN_STATUS_OPTIONS.find(option => option.value === status)?.color || 'bg-gray-100 text-gray-800'
  }

  const getFrequencyLabel = (frequency: PaymentFrequency) => {
    return PAYMENT_FREQUENCY_OPTIONS.find(option => option.value === frequency)?.label || frequency
  }

  const handleCreatePlan = () => {
    setEditingPlan(null)
    setFormData(initialFormData)
    setIsModalOpen(true)
  }

  const handleEditPlan = (plan: PaymentPlan) => {
    setEditingPlan(plan)
    setFormData({
      matter_id: plan.matter_id,
      plan_name: plan.plan_name,
      total_amount: plan.total_amount,
      installment_count: plan.installment_count,
      down_payment: plan.down_payment,
      payment_frequency: plan.payment_frequency,
      start_date: plan.start_date,
      auto_charge: plan.auto_charge,
      late_fee_percentage: plan.late_fee_percentage,
      grace_period_days: plan.grace_period_days,
      notes: plan.notes || ''
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setIsLoading(true)
      
      if (editingPlan) {
        await paymentPlanService.updatePaymentPlan(editingPlan.id, formData)
      } else {
        if (!effectiveLawFirmId) return
        await paymentPlanService.createPaymentPlan(effectiveLawFirmId, formData.matter_id, formData)
      }
      
      await loadPaymentPlans()
      setIsModalOpen(false)
      setFormData(initialFormData)
    } catch (error) {
      console.error('Error saving payment plan:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleActivatePlan = async (planId: string) => {
    try {
      await paymentPlanService.activatePaymentPlan(planId)
      await loadPaymentPlans()
    } catch (error) {
      console.error('Error activating payment plan:', error)
    }
  }

  const handleCancelPlan = async (planId: string) => {
    if (confirm('Tem certeza que deseja cancelar este plano de pagamento?')) {
      try {
        await paymentPlanService.cancelPaymentPlan(planId)
        await loadPaymentPlans()
      } catch (error) {
        console.error('Error cancelling payment plan:', error)
      }
    }
  }

  const calculateProgress = (plan: PaymentPlan) => {
    if (plan.status === 'completed') return 100
    if (plan.status === 'cancelled' || plan.status === 'defaulted') return 0
    const now = new Date()
    const start = new Date(plan.start_date)
    const end = new Date(plan.end_date)
    const totalDuration = end.getTime() - start.getTime()
    if (totalDuration <= 0) return 0
    const elapsed = now.getTime() - start.getTime()
    return Math.max(0, Math.min(100, (elapsed / totalDuration) * 100))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planos de Pagamento</h1>
          <p className="text-gray-600">Gerencie parcelamentos e cobranças de casos</p>
        </div>
        <button
          onClick={handleCreatePlan}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Novo Plano
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nome do plano..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as PaymentPlanStatus | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos</option>
              {PAYMENT_PLAN_STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ordenar por
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'amount' | 'created' | 'due_date')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="created">Data de criação</option>
              <option value="name">Nome</option>
              <option value="amount">Valor</option>
              <option value="due_date">Vencimento</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={loadPaymentPlans}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Atualizar
            </button>
          </div>
        </div>
      </div>

      {/* Payment Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredPlans.map((plan) => (
          <div key={plan.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {plan.plan_name}
                  </h3>
                  <div className="flex items-center mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(plan.status)}`}>
                      {getStatusLabel(plan.status)}
                    </span>
                  </div>
                </div>
                
                <div className="flex space-x-1 ml-4">
                  <button
                    onClick={() => handleEditPlan(plan)}
                    className="p-1 text-gray-400 hover:text-blue-600"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleCancelPlan(plan.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Amount and Progress */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {formatCurrency(plan.total_amount)}
                  </span>
                  <span className="text-sm text-gray-600">
                    {plan.installment_count}x de {formatCurrency(plan.installment_amount)}
                  </span>
                </div>
                
                {plan.status === 'active' && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${calculateProgress(plan)}%` }}
                    ></div>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <CalendarDaysIcon className="w-4 h-4 mr-2" />
                  <span>Frequência: {getFrequencyLabel(plan.payment_frequency)}</span>
                </div>
                
                <div className="flex items-center">
                  <BanknotesIcon className="w-4 h-4 mr-2" />
                  <span>Entrada: {formatCurrency(plan.down_payment)}</span>
                </div>
                
                <div className="flex items-center">
                  <ClockIcon className="w-4 h-4 mr-2" />
                  <span>Vencimento: {formatDate(plan.end_date)}</span>
                </div>
                
                {plan.auto_charge && (
                  <div className="flex items-center">
                    <CreditCardIcon className="w-4 h-4 mr-2" />
                    <span>Cobrança automática</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  {plan.status === 'draft' && (
                    <button
                      onClick={() => handleActivatePlan(plan.id)}
                      className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                    >
                      Ativar
                    </button>
                  )}
                  
                  <button
                    onClick={() => {/* Navigate to installments view */}}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                  >
                    Ver Parcelas
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredPlans.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum plano de pagamento encontrado
          </h3>
          <p className="text-gray-600">
            Comece criando um novo plano de parcelamento para seus clientes.
          </p>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {editingPlan ? 'Editar Plano de Pagamento' : 'Novo Plano de Pagamento'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome do Plano *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.plan_name}
                      onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })}
                      placeholder="Ex: Processo Trabalhista - João Silva"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor Total *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.total_amount}
                      onChange={(e) => setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Entrada
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.down_payment}
                      onChange={(e) => setFormData({ ...formData, down_payment: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Parcelas *
                    </label>
                    <input
                      type="number"
                      required
                      min="2"
                      max="60"
                      value={formData.installment_count}
                      onChange={(e) => setFormData({ ...formData, installment_count: parseInt(e.target.value) || 6 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Frequência de Pagamento *
                    </label>
                    <select
                      required
                      value={formData.payment_frequency}
                      onChange={(e) => setFormData({ ...formData, payment_frequency: e.target.value as PaymentFrequency })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {PAYMENT_FREQUENCY_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data de Início *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Taxa de Multa (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={formData.late_fee_percentage}
                      onChange={(e) => setFormData({ ...formData, late_fee_percentage: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Período de Carência (dias)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={formData.grace_period_days}
                      onChange={(e) => setFormData({ ...formData, grace_period_days: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.auto_charge}
                        onChange={(e) => setFormData({ ...formData, auto_charge: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Cobrança automática</span>
                    </label>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observações
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Observações adicionais sobre o plano..."
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Salvando...' : editingPlan ? 'Atualizar' : 'Criar Plano'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}