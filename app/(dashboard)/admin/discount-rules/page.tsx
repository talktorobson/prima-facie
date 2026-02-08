'use client'

import { useState } from 'react'
import { useEffectiveLawFirmId } from '@/lib/hooks/use-effective-law-firm-id'
import {
  useDiscountRules,
  useCreateDiscountRule,
  useUpdateDiscountRule,
  useToggleDiscountRule,
  useDeleteDiscountRule,
  useCreatePresetRules,
} from '@/lib/queries/useDiscountRules'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PercentBadgeIcon,
  UserGroupIcon,
  StarIcon,
  TrophyIcon,
  MegaphoneIcon,
  DocumentCheckIcon,
  SparklesIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid'
import { 
  DiscountRule,
  DiscountRuleFormData,
  DiscountRuleType,
  DiscountType,
  ConditionType,
  ConditionOperator,
  DISCOUNT_RULE_TYPE_OPTIONS,
  DISCOUNT_TYPE_OPTIONS,
  CONDITION_TYPE_OPTIONS,
  CONDITION_OPERATOR_OPTIONS
} from '@/lib/billing/discount-types'

const initialFormData: DiscountRuleFormData = {
  rule_name: '',
  rule_type: 'subscription_based',
  priority: 5,
  conditions: [],
  discount_config: {
    discount_type: 'percentage',
    value: 10,
    max_discount_amount: undefined,
    min_case_value: undefined,
    applies_to: ['hourly_fees'],
    compound_with_other_discounts: true
  },
  valid_from: new Date().toISOString().split('T')[0],
  valid_until: undefined,
  max_uses: undefined,
  is_active: true
}

export default function DiscountRulesPage(): JSX.Element {
  const effectiveLawFirmId = useEffectiveLawFirmId()
  const { data: rules = [], isLoading } = useDiscountRules(effectiveLawFirmId)
  const createRuleMutation = useCreateDiscountRule()
  const updateRuleMutation = useUpdateDiscountRule()
  const toggleRuleMutation = useToggleDiscountRule()
  const deleteRuleMutation = useDeleteDiscountRule()
  const createPresetMutation = useCreatePresetRules()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<DiscountRule | null>(null)
  const [formData, setFormData] = useState<DiscountRuleFormData>(initialFormData)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<DiscountRuleType | 'all'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'priority' | 'created' | 'uses'>('priority')

  // Filter and sort rules
  const filteredRules = rules
    .filter(rule => {
      const matchesSearch = rule.rule_name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = filterType === 'all' || rule.rule_type === filterType
      return matchesSearch && matchesType
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.rule_name.localeCompare(b.rule_name)
        case 'priority':
          return b.priority - a.priority
        case 'uses':
          return b.current_uses - a.current_uses
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

  const getRuleTypeIcon = (type: DiscountRuleType) => {
    const iconMap = {
      subscription_based: UserGroupIcon,
      volume_based: TrophyIcon,
      loyalty_based: StarIcon,
      promotional: MegaphoneIcon,
      case_specific: DocumentCheckIcon
    }
    return iconMap[type] || PercentBadgeIcon
  }

  const getRuleTypeLabel = (type: DiscountRuleType) => {
    return DISCOUNT_RULE_TYPE_OPTIONS.find(option => option.value === type)?.label || type
  }

  const getRuleTypeColor = (type: DiscountRuleType) => {
    const colorMap = {
      subscription_based: 'bg-blue-100 text-blue-800',
      volume_based: 'bg-green-100 text-green-800',
      loyalty_based: 'bg-purple-100 text-purple-800',
      promotional: 'bg-orange-100 text-orange-800',
      case_specific: 'bg-gray-100 text-gray-800'
    }
    return colorMap[type] || 'bg-gray-100 text-gray-800'
  }

  const handleCreateRule = () => {
    setEditingRule(null)
    setFormData(initialFormData)
    setIsModalOpen(true)
  }

  const handleEditRule = (rule: DiscountRule) => {
    setEditingRule(rule)
    setFormData({
      rule_name: rule.rule_name,
      rule_type: rule.rule_type,
      priority: rule.priority,
      conditions: rule.conditions.map(({ id, ...rest }) => rest),
      discount_config: rule.discount_config,
      valid_from: rule.valid_from,
      valid_until: rule.valid_until,
      max_uses: rule.max_uses,
      is_active: rule.is_active
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingRule) {
        await updateRuleMutation.mutateAsync({ ruleId: editingRule.id, formData })
      } else {
        if (!effectiveLawFirmId) return
        await createRuleMutation.mutateAsync({ lawFirmId: effectiveLawFirmId, formData })
      }
      setIsModalOpen(false)
      setFormData(initialFormData)
    } catch (error) {
      console.error('Error saving discount rule:', error)
    }
  }

  const handleToggleRule = async (ruleId: string) => {
    try {
      await toggleRuleMutation.mutateAsync(ruleId)
    } catch (error) {
      console.error('Error toggling discount rule:', error)
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    if (confirm('Tem certeza que deseja excluir esta regra de desconto?')) {
      try {
        await deleteRuleMutation.mutateAsync(ruleId)
      } catch (error) {
        console.error('Error deleting discount rule:', error)
      }
    }
  }

  const handleCreatePresetRules = async () => {
    if (!effectiveLawFirmId) return
    try {
      await createPresetMutation.mutateAsync(effectiveLawFirmId)
    } catch (error) {
      console.error('Error creating preset rules:', error)
    }
  }

  const addCondition = () => {
    const newCondition = {
      condition_type: 'subscription_status' as ConditionType,
      field_name: 'subscription_status',
      operator: 'equals' as ConditionOperator,
      value: '',
      is_required: true
    }
    
    setFormData({
      ...formData,
      conditions: [...formData.conditions, newCondition]
    })
  }

  const removeCondition = (index: number) => {
    setFormData({
      ...formData,
      conditions: formData.conditions.filter((_, i) => i !== index)
    })
  }

  const updateCondition = (index: number, field: string, value: any) => {
    const updatedConditions = formData.conditions.map((condition, i) => 
      i === index ? { ...condition, [field]: value } : condition
    )
    
    setFormData({
      ...formData,
      conditions: updatedConditions
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Regras de Desconto</h1>
          <p className="text-gray-600">Gerencie descontos automáticos e cross-selling</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleCreatePresetRules}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <SparklesIcon className="w-5 h-5 mr-2" />
            Regras Predefinidas
          </button>
          <button
            onClick={handleCreateRule}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Nova Regra
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nome da regra..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as DiscountRuleType | 'all')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos</option>
              {DISCOUNT_RULE_TYPE_OPTIONS.map(option => (
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
              onChange={(e) => setSortBy(e.target.value as 'name' | 'priority' | 'created' | 'uses')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="priority">Prioridade</option>
              <option value="name">Nome</option>
              <option value="uses">Usos</option>
              <option value="created">Data de criação</option>
            </select>
          </div>
          
          <div className="flex items-end">
            {/* Data refreshes automatically via React Query */}
          </div>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredRules.map((rule) => {
          const IconComponent = getRuleTypeIcon(rule.rule_type)
          
          return (
            <div key={rule.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <IconComponent className="w-5 h-5 text-gray-600 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {rule.rule_name}
                      </h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRuleTypeColor(rule.rule_type)}`}>
                        {getRuleTypeLabel(rule.rule_type)}
                      </span>
                      {rule.is_active ? (
                        <CheckCircleSolidIcon className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircleIcon className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-1 ml-4">
                    <button
                      onClick={() => handleEditRule(rule)}
                      className="p-1 text-gray-400 hover:text-blue-600"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Discount Info */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {rule.discount_config.discount_type === 'percentage' 
                        ? `${rule.discount_config.value}%`
                        : formatCurrency(rule.discount_config.value)
                      }
                    </span>
                    <span className="text-sm text-gray-600">
                      Prioridade: {rule.priority}
                    </span>
                  </div>
                  
                  {rule.discount_config.max_discount_amount && (
                    <div className="text-sm text-gray-600">
                      Máximo: {formatCurrency(rule.discount_config.max_discount_amount)}
                    </div>
                  )}
                </div>

                {/* Conditions */}
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Condições ({rule.conditions.length})
                  </div>
                  <div className="space-y-1">
                    {rule.conditions.slice(0, 2).map((condition, index) => (
                      <div key={index} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                        {CONDITION_TYPE_OPTIONS.find(opt => opt.value === condition.condition_type)?.label} {condition.operator} {String(condition.value)}
                      </div>
                    ))}
                    {rule.conditions.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{rule.conditions.length - 2} mais condições
                      </div>
                    )}
                  </div>
                </div>

                {/* Usage Stats */}
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center justify-between">
                    <span>Usos:</span>
                    <span className="font-medium">{rule.current_uses}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Válida até:</span>
                    <span className="font-medium">
                      {rule.valid_until ? formatDate(rule.valid_until) : 'Indefinido'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleToggleRule(rule.id)}
                    className={`flex-1 px-3 py-2 text-sm rounded-md font-medium ${
                      rule.is_active 
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {rule.is_active ? 'Desativar' : 'Ativar'}
                  </button>
                  
                  <button
                    onClick={() => {/* Navigate to rule analytics */}}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                  >
                    Relatório
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredRules.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <PercentBadgeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma regra de desconto encontrada
          </h3>
          <p className="text-gray-600 mb-4">
            Comece criando regras automáticas para melhorar as vendas.
          </p>
          <button
            onClick={handleCreatePresetRules}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Criar Regras Predefinidas
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {editingRule ? 'Editar Regra de Desconto' : 'Nova Regra de Desconto'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome da Regra *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.rule_name}
                      onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
                      placeholder="Ex: Desconto Assinante Premium"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo da Regra *
                    </label>
                    <select
                      required
                      value={formData.rule_type}
                      onChange={(e) => setFormData({ ...formData, rule_type: e.target.value as DiscountRuleType })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {DISCOUNT_RULE_TYPE_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prioridade (1-10) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="10"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 5 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Desconto *
                    </label>
                    <select
                      required
                      value={formData.discount_config.discount_type}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        discount_config: { 
                          ...formData.discount_config, 
                          discount_type: e.target.value as DiscountType 
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {DISCOUNT_TYPE_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor do Desconto *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step={formData.discount_config.discount_type === 'percentage' ? '0.1' : '0.01'}
                      max={formData.discount_config.discount_type === 'percentage' ? '100' : undefined}
                      value={formData.discount_config.value}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        discount_config: { 
                          ...formData.discount_config, 
                          value: parseFloat(e.target.value) || 0 
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor Máximo do Desconto
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.discount_config.max_discount_amount || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        discount_config: { 
                          ...formData.discount_config, 
                          max_discount_amount: e.target.value ? parseFloat(e.target.value) : undefined
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor Mínimo do Caso
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.discount_config.min_case_value || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        discount_config: { 
                          ...formData.discount_config, 
                          min_case_value: e.target.value ? parseFloat(e.target.value) : undefined
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data de Início *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.valid_from}
                      onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data de Fim
                    </label>
                    <input
                      type="date"
                      value={formData.valid_until || ''}
                      onChange={(e) => setFormData({ ...formData, valid_until: e.target.value || undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Limite de Usos
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.max_uses || ''}
                      onChange={(e) => setFormData({ ...formData, max_uses: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Regra ativa</span>
                    </label>
                  </div>
                </div>

                {/* Conditions Section */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Condições ({formData.conditions.length})
                    </h3>
                    <button
                      type="button"
                      onClick={addCondition}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                    >
                      Adicionar Condição
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.conditions.map((condition, index) => (
                      <div key={index} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 p-4 bg-gray-50 rounded-lg">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Campo
                          </label>
                          <select
                            value={condition.condition_type}
                            onChange={(e) => updateCondition(index, 'condition_type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {CONDITION_TYPE_OPTIONS.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Operador
                          </label>
                          <select
                            value={condition.operator}
                            onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {CONDITION_OPERATOR_OPTIONS.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Valor
                          </label>
                          <input
                            type="text"
                            value={String(condition.value)}
                            onChange={(e) => updateCondition(index, 'value', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => removeCondition(index)}
                            className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    ))}
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
                    disabled={createRuleMutation.isPending || updateRuleMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {(createRuleMutation.isPending || updateRuleMutation.isPending) ? 'Salvando...' : editingRule ? 'Atualizar' : 'Criar Regra'}
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