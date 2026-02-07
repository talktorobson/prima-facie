'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { productionSubscriptionService } from '@/lib/billing/subscription-service-production'
import { SubscriptionPlan, PlanFormData } from '@/lib/billing/subscription-types'
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  StarIcon,
  CheckCircleIcon,
  XCircleIcon,
  CurrencyDollarIcon,
  ClockIcon,
  UserGroupIcon,
  DocumentTextIcon,
  PhoneIcon,
  LifebuoyIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'

// Note: SubscriptionPlan type is now imported from types

// Service inclusion options
const serviceOptions = [
  { value: 'compliance_review', label: 'Revisão de Compliance', icon: CheckCircleIcon },
  { value: 'email_support', label: 'Suporte por Email', icon: DocumentTextIcon },
  { value: 'phone_support', label: 'Suporte Telefônico', icon: PhoneIcon },
  { value: 'priority_support', label: 'Suporte Prioritário', icon: LifebuoyIcon },
  { value: '24_7_support', label: 'Suporte 24/7', icon: ClockIcon },
  { value: 'document_review', label: 'Revisão de Documentos', icon: DocumentTextIcon },
  { value: 'contract_review', label: 'Revisão de Contratos', icon: DocumentTextIcon },
  { value: 'regulatory_alerts', label: 'Alertas Regulatórios', icon: CheckCircleIcon },
  { value: 'dedicated_lawyer', label: 'Advogado Dedicado', icon: UserGroupIcon },
  { value: 'unlimited_hours', label: 'Horas Ilimitadas', icon: ClockIcon },
  { value: 'consultation', label: 'Consultas Jurídicas', icon: UserGroupIcon },
  { value: 'case_review', label: 'Revisão de Casos', icon: EyeIcon },
  { value: 'board_support', label: 'Suporte Jurídico Board', icon: UserGroupIcon }
]

const planTypeOptions = [
  { value: 'labor', label: 'Direito Trabalhista', color: 'bg-blue-100 text-blue-800' },
  { value: 'corporate', label: 'Direito Empresarial', color: 'bg-green-100 text-green-800' },
  { value: 'criminal', label: 'Direito Criminal', color: 'bg-red-100 text-red-800' },
  { value: 'family', label: 'Direito de Família', color: 'bg-purple-100 text-purple-800' },
  { value: 'general', label: 'Geral', color: 'bg-gray-100 text-gray-800' }
]

const supportLevelOptions = [
  { value: 'email', label: 'Email (48h)', icon: DocumentTextIcon },
  { value: 'phone', label: 'Telefone (24h)', icon: PhoneIcon },
  { value: 'priority', label: 'Prioritário (4h)', icon: LifebuoyIcon },
  { value: '24_7', label: '24/7 (Imediato)', icon: ClockIcon }
]

// Note: PlanFormData type is now imported from types

const initialFormData: PlanFormData = {
  plan_name: '',
  plan_type: 'general',
  description: '',
  monthly_fee: 0,
  yearly_fee: 0,
  setup_fee: 0,
  services_included: [],
  max_monthly_hours: 0,
  max_document_reviews: 0,
  support_level: 'email',
  billing_interval: 'monthly',
  trial_period_days: 14,
  is_active: true,
  is_featured: false
}

export default function SubscriptionPlansPage() {
  const { user } = useAuth()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null)
  const [formData, setFormData] = useState<PlanFormData>(initialFormData)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'created' | 'sort_order'>('sort_order')
  const [error, setError] = useState<string | null>(null)

  // Load subscription plans from database
  useEffect(() => {
    const loadPlans = async () => {
      if (!user?.law_firm_id) return
      
      try {
        setIsLoadingData(true)
        setError(null)
        const loadedPlans = await productionSubscriptionService.getSubscriptionPlans(user.law_firm_id)
        setPlans(loadedPlans)
      } catch (error) {
        console.error('Error loading subscription plans:', error)
        setError('Falha ao carregar planos de assinatura')
      } finally {
        setIsLoadingData(false)
      }
    }

    loadPlans()
  }, [user?.law_firm_id])

  // Filter and sort plans
  const filteredPlans = plans
    .filter(plan => {
      const matchesSearch = plan.plan_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           plan.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = filterType === 'all' || plan.plan_type === filterType
      return matchesSearch && matchesType
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.plan_name.localeCompare(b.plan_name)
        case 'price':
          return a.monthly_fee - b.monthly_fee
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        default:
          return a.sort_order - b.sort_order
      }
    })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  const getPlanTypeLabel = (type: string) => {
    return planTypeOptions.find(option => option.value === type)?.label || type
  }

  const getPlanTypeColor = (type: string) => {
    return planTypeOptions.find(option => option.value === type)?.color || 'bg-gray-100 text-gray-800'
  }

  const getSupportLevelLabel = (level: string) => {
    return supportLevelOptions.find(option => option.value === level)?.label || level
  }

  const getServiceLabel = (service: string) => {
    return serviceOptions.find(option => option.value === service)?.label || service
  }

  const handleCreatePlan = () => {
    setEditingPlan(null)
    setFormData(initialFormData)
    setIsModalOpen(true)
  }

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan)
    setFormData({
      plan_name: plan.plan_name,
      plan_type: plan.plan_type,
      description: plan.description,
      monthly_fee: plan.monthly_fee,
      yearly_fee: plan.yearly_fee,
      setup_fee: plan.setup_fee,
      services_included: plan.services_included,
      max_monthly_hours: plan.max_monthly_hours,
      max_document_reviews: plan.max_document_reviews,
      support_level: plan.support_level,
      billing_interval: plan.billing_interval,
      trial_period_days: plan.trial_period_days,
      is_active: plan.is_active,
      is_featured: plan.is_featured
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (!user?.law_firm_id) {
        throw new Error('Law firm ID not found')
      }

      if (editingPlan) {
        // Update existing plan
        const updatedPlan = await productionSubscriptionService.updateSubscriptionPlan(
          editingPlan.id, 
          formData
        )
        setPlans(plans.map(p => p.id === editingPlan.id ? updatedPlan : p))
        console.log('Plan updated:', updatedPlan)
      } else {
        // Create new plan
        const newPlan = await productionSubscriptionService.createSubscriptionPlan(
          user.law_firm_id,
          formData
        )
        setPlans([...plans, newPlan])
        console.log('Plan created:', newPlan)
      }

      setIsModalOpen(false)
      setFormData(initialFormData)
      setEditingPlan(null)
    } catch (error) {
      console.error('Error saving plan:', error)
      setError('Falha ao salvar plano. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeletePlan = async (planId: string) => {
    if (confirm('Tem certeza que deseja excluir este plano? Esta ação não pode ser desfeita.')) {
      try {
        await productionSubscriptionService.deleteSubscriptionPlan(planId)
        setPlans(plans.filter(p => p.id !== planId))
        console.log('Plan deleted:', planId)
      } catch (error) {
        console.error('Error deleting plan:', error)
        setError('Falha ao excluir plano. Verifique se não há assinaturas ativas.')
      }
    }
  }

  const handleToggleActive = async (planId: string) => {
    try {
      const plan = plans.find(p => p.id === planId)
      if (!plan) return

      const updatedPlan = await productionSubscriptionService.updateSubscriptionPlan(
        planId, 
        { is_active: !plan.is_active }
      )
      setPlans(plans.map(p => p.id === planId ? updatedPlan : p))
    } catch (error) {
      console.error('Error toggling plan active status:', error)
      setError('Falha ao atualizar status do plano.')
    }
  }

  const handleToggleFeatured = async (planId: string) => {
    try {
      const plan = plans.find(p => p.id === planId)
      if (!plan) return

      const updatedPlan = await productionSubscriptionService.updateSubscriptionPlan(
        planId,
        { is_featured: !plan.is_featured }
      )
      setPlans(plans.map(p => p.id === planId ? updatedPlan : p))
    } catch (error) {
      console.error('Error toggling plan featured status:', error)
      setError('Falha ao atualizar destaque do plano.')
    }
  }

  const handleServiceToggle = (service: string) => {
    const newServices = formData.services_included.includes(service)
      ? formData.services_included.filter(s => s !== service)
      : [...formData.services_included, service]
    
    setFormData({ ...formData, services_included: newServices })
  }

  // Calculate yearly discount
  const yearlyDiscount = formData.monthly_fee > 0 && formData.yearly_fee > 0
    ? Math.round(((formData.monthly_fee * 12 - formData.yearly_fee) / (formData.monthly_fee * 12)) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <CurrencyDollarIcon className="h-8 w-8 text-primary mr-3" />
                Planos de Assinatura
              </h1>
              <p className="mt-2 text-gray-600">
                Gerencie os planos de consultoria recorrente da sua firma
              </p>
            </div>
            <button
              onClick={handleCreatePlan}
              className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Novo Plano
            </button>
          </div>

          {/* Stats Cards */}
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UserGroupIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total de Planos
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {plans.length}
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
                    <CheckCircleIcon className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Planos Ativos
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {plans.filter(p => p.is_active).length}
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
                    <StarSolidIcon className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Planos Destacados
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {plans.filter(p => p.is_featured).length}
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
                    <CurrencyDollarIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Preço Médio Mensal
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {formatCurrency(plans.reduce((acc, p) => acc + p.monthly_fee, 0) / plans.length || 0)}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar planos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <EyeIcon className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="block w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          >
            <option value="all">Todos os Tipos</option>
            {planTypeOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="block w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          >
            <option value="sort_order">Ordem Padrão</option>
            <option value="name">Nome</option>
            <option value="price">Preço</option>
            <option value="created">Data de Criação</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-6 py-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Erro</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
                <div className="mt-4">
                  <button
                    onClick={() => setError(null)}
                    className="text-sm bg-red-100 text-red-800 rounded-md px-2 py-1 hover:bg-red-200"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="px-6 py-8">
        {isLoadingData ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-500">Carregando planos...</p>
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="text-center py-12">
            <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum plano encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery || filterType !== 'all' 
                ? 'Tente ajustar os filtros de busca'
                : 'Comece criando seu primeiro plano de assinatura'
              }
            </p>
            {!searchQuery && filterType === 'all' && (
              <div className="mt-6">
                <button
                  onClick={handleCreatePlan}
                  className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Criar Primeiro Plano
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {filteredPlans.map((plan) => (
              <div key={plan.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Plan Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{plan.plan_name}</h3>
                        {plan.is_featured && (
                          <StarSolidIcon className="h-5 w-5 text-yellow-400" />
                        )}
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPlanTypeColor(plan.plan_type)}`}>
                        {getPlanTypeLabel(plan.plan_type)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${plan.is_active ? 'bg-green-400' : 'bg-red-400'}`} />
                      <span className="text-sm text-gray-500">
                        {plan.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                  
                  <p className="mt-3 text-sm text-gray-600">{plan.description}</p>
                </div>

                {/* Pricing */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-3xl font-bold text-gray-900">
                        {formatCurrency(plan.monthly_fee)}
                      </span>
                      <span className="text-gray-500 ml-1">/mês</span>
                    </div>
                    {plan.yearly_fee > 0 && (
                      <div className="text-right">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(plan.yearly_fee)}/ano
                        </div>
                        <div className="text-xs text-green-600">
                          Economize {Math.round(((plan.monthly_fee * 12 - plan.yearly_fee) / (plan.monthly_fee * 12)) * 100)}%
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {plan.setup_fee > 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                      Taxa de configuração: {formatCurrency(plan.setup_fee)}
                    </div>
                  )}
                  
                  {plan.trial_period_days > 0 && (
                    <div className="mt-2 text-sm text-green-600 font-medium">
                      {plan.trial_period_days} dias de teste grátis
                    </div>
                  )}
                </div>

                {/* Features */}
                <div className="p-6 border-b border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Recursos Inclusos:</h4>
                  <ul className="space-y-2">
                    {plan.max_monthly_hours > 0 && (
                      <li className="flex items-center text-sm text-gray-600">
                        <ClockIcon className="h-4 w-4 text-green-500 mr-2" />
                        {plan.max_monthly_hours} horas de consultoria/mês
                      </li>
                    )}
                    {plan.max_monthly_hours === 0 && plan.services_included.includes('unlimited_hours') && (
                      <li className="flex items-center text-sm text-gray-600">
                        <ClockIcon className="h-4 w-4 text-green-500 mr-2" />
                        Horas ilimitadas de consultoria
                      </li>
                    )}
                    {plan.max_document_reviews > 0 && (
                      <li className="flex items-center text-sm text-gray-600">
                        <DocumentTextIcon className="h-4 w-4 text-green-500 mr-2" />
                        {plan.max_document_reviews} revisões de documentos/mês
                      </li>
                    )}
                    <li className="flex items-center text-sm text-gray-600">
                      <LifebuoyIcon className="h-4 w-4 text-green-500 mr-2" />
                      Suporte: {getSupportLevelLabel(plan.support_level)}
                    </li>
                    {plan.services_included.slice(0, 3).map((service) => (
                      <li key={service} className="flex items-center text-sm text-gray-600">
                        <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                        {getServiceLabel(service)}
                      </li>
                    ))}
                    {plan.services_included.length > 3 && (
                      <li className="text-sm text-gray-500">
                        +{plan.services_included.length - 3} recursos adicionais
                      </li>
                    )}
                  </ul>
                </div>

                {/* Actions */}
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleToggleActive(plan.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          plan.is_active 
                            ? 'text-green-600 hover:bg-green-50' 
                            : 'text-gray-400 hover:bg-gray-50'
                        }`}
                        title={plan.is_active ? 'Desativar plano' : 'Ativar plano'}
                      >
                        {plan.is_active ? <CheckCircleIcon className="h-5 w-5" /> : <XCircleIcon className="h-5 w-5" />}
                      </button>
                      
                      <button
                        onClick={() => handleToggleFeatured(plan.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          plan.is_featured 
                            ? 'text-yellow-600 hover:bg-yellow-50' 
                            : 'text-gray-400 hover:bg-gray-50'
                        }`}
                        title={plan.is_featured ? 'Remover destaque' : 'Destacar plano'}
                      >
                        {plan.is_featured ? <StarSolidIcon className="h-5 w-5" /> : <StarIcon className="h-5 w-5" />}
                      </button>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditPlan(plan)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Editar plano"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      
                      <button
                        onClick={() => handleDeletePlan(plan.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir plano"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Plan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsModalOpen(false)}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
                        {editingPlan ? 'Editar Plano de Assinatura' : 'Criar Novo Plano de Assinatura'}
                      </h3>

                      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        {/* Basic Information */}
                        <div className="space-y-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Nome do Plano</label>
                            <input
                              type="text"
                              required
                              value={formData.plan_name}
                              onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                              placeholder="Ex: Trabalhista Premium"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">Tipo de Plano</label>
                            <select
                              value={formData.plan_type}
                              onChange={(e) => setFormData({ ...formData, plan_type: e.target.value })}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                            >
                              {planTypeOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">Descrição</label>
                            <textarea
                              required
                              rows={3}
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                              placeholder="Descreva o que está incluído neste plano..."
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Valor Mensal (R$)</label>
                              <input
                                type="number"
                                required
                                min="0"
                                step="0.01"
                                value={formData.monthly_fee}
                                onChange={(e) => setFormData({ ...formData, monthly_fee: parseFloat(e.target.value) || 0 })}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Valor Anual (R$)
                                {yearlyDiscount > 0 && (
                                  <span className="text-green-600 text-xs ml-1">
                                    ({yearlyDiscount}% desconto)
                                  </span>
                                )}
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.yearly_fee}
                                onChange={(e) => setFormData({ ...formData, yearly_fee: parseFloat(e.target.value) || 0 })}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">Taxa de Configuração (R$)</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={formData.setup_fee}
                              onChange={(e) => setFormData({ ...formData, setup_fee: parseFloat(e.target.value) || 0 })}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                            />
                          </div>
                        </div>

                        {/* Service Configuration */}
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Horas Mensais Incluídas</label>
                              <input
                                type="number"
                                min="0"
                                value={formData.max_monthly_hours}
                                onChange={(e) => setFormData({ ...formData, max_monthly_hours: parseInt(e.target.value) || 0 })}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                                placeholder="0 = ilimitado"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">Revisões de Documentos</label>
                              <input
                                type="number"
                                min="0"
                                value={formData.max_document_reviews}
                                onChange={(e) => setFormData({ ...formData, max_document_reviews: parseInt(e.target.value) || 0 })}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                                placeholder="0 = ilimitado"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">Nível de Suporte</label>
                            <select
                              value={formData.support_level}
                              onChange={(e) => setFormData({ ...formData, support_level: e.target.value })}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                            >
                              {supportLevelOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">Período de Teste (dias)</label>
                            <input
                              type="number"
                              min="0"
                              max="365"
                              value={formData.trial_period_days}
                              onChange={(e) => setFormData({ ...formData, trial_period_days: parseInt(e.target.value) || 0 })}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">Serviços Incluídos</label>
                            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3">
                              {serviceOptions.map((service) => (
                                <label key={service.value} className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={formData.services_included.includes(service.value)}
                                    onChange={() => handleServiceToggle(service.value)}
                                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                  />
                                  <span className="ml-2 text-sm text-gray-700">{service.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center space-x-6">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-700">Plano Ativo</span>
                            </label>

                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={formData.is_featured}
                                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-700">Plano Destacado</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {isLoading ? 'Salvando...' : editingPlan ? 'Atualizar Plano' : 'Criar Plano'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancelar
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