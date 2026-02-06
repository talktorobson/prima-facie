'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  CaseTypeFormData, 
  BILLING_METHOD_OPTIONS, 
  CASE_CATEGORY_OPTIONS 
} from '@/lib/billing/case-billing-types'

interface CaseTypeFormProps {
  initialData?: Partial<CaseTypeFormData>
  onSubmit: (data: CaseTypeFormData) => void
  onCancel: () => void
  isLoading?: boolean
  mode: 'create' | 'edit'
}

export function CaseTypeForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  mode
}: CaseTypeFormProps) {
  const [formData, setFormData] = useState<CaseTypeFormData>({
    name: initialData?.name || '',
    code: initialData?.code || '',
    category: initialData?.category || 'labor',
    minimum_fee_hourly: initialData?.minimum_fee_hourly || 1000.00,
    minimum_fee_percentage: initialData?.minimum_fee_percentage || 1500.00,
    minimum_fee_fixed: initialData?.minimum_fee_fixed || 1200.00,
    default_billing_method: initialData?.default_billing_method || 'hourly',
    default_hourly_rate: initialData?.default_hourly_rate || 300.00,
    default_percentage_rate: initialData?.default_percentage_rate || 15.0,
    default_success_fee_rate: initialData?.default_success_fee_rate || 15.0,
    complexity_multiplier: initialData?.complexity_multiplier || 1.0,
    estimated_hours_range: initialData?.estimated_hours_range || '',
    is_active: initialData?.is_active ?? true
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name || formData.name.length < 3) {
      newErrors.name = 'Nome deve ter pelo menos 3 caracteres'
    }

    if (!formData.code || formData.code.length < 2) {
      newErrors.code = 'Código deve ter pelo menos 2 caracteres'
    }

    if (formData.complexity_multiplier <= 0) {
      newErrors.complexity_multiplier = 'Multiplicador deve ser maior que zero'
    }

    if (formData.default_hourly_rate && formData.default_hourly_rate < 0) {
      newErrors.default_hourly_rate = 'Taxa horária deve ser positiva'
    }

    if (formData.default_percentage_rate && (formData.default_percentage_rate < 0 || formData.default_percentage_rate > 100)) {
      newErrors.default_percentage_rate = 'Taxa percentual deve estar entre 0 e 100%'
    }

    if (formData.default_success_fee_rate && (formData.default_success_fee_rate < 0 || formData.default_success_fee_rate > 100)) {
      newErrors.default_success_fee_rate = 'Taxa de êxito deve estar entre 0 e 100%'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const updateField = (field: keyof CaseTypeFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {mode === 'create' ? 'Novo Tipo de Caso' : 'Editar Tipo de Caso'}
          </h1>
          <p className="text-gray-600">
            Configure os parâmetros de cobrança para este tipo de caso
          </p>
        </div>
        <Badge variant={formData.is_active ? 'default' : 'secondary'}>
          {formData.is_active ? 'Ativo' : 'Inativo'}
        </Badge>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>
              Dados fundamentais do tipo de caso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Tipo de Caso*</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Ex: Ação Trabalhista"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Código*</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => updateField('code', e.target.value.toUpperCase())}
                  placeholder="Ex: LAB_ACT"
                  className={errors.code ? 'border-red-500' : ''}
                />
                {errors.code && (
                  <p className="text-sm text-red-600">{errors.code}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => updateField('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {CASE_CATEGORY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="complexity_multiplier">Multiplicador de Complexidade</Label>
                <Input
                  id="complexity_multiplier"
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="5.0"
                  value={formData.complexity_multiplier}
                  onChange={(e) => updateField('complexity_multiplier', parseFloat(e.target.value))}
                  className={errors.complexity_multiplier ? 'border-red-500' : ''}
                />
                {errors.complexity_multiplier && (
                  <p className="text-sm text-red-600">{errors.complexity_multiplier}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_hours_range">Faixa de Horas Estimadas</Label>
              <Input
                id="estimated_hours_range"
                value={formData.estimated_hours_range}
                onChange={(e) => updateField('estimated_hours_range', e.target.value)}
                placeholder="Ex: 40-80 horas"
              />
            </div>
          </CardContent>
        </Card>

        {/* Minimum Fees */}
        <Card>
          <CardHeader>
            <CardTitle>Valores Mínimos</CardTitle>
            <CardDescription>
              Configure os valores mínimos para cada tipo de cobrança
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minimum_fee_hourly">Mínimo - Cobrança por Hora</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                  <Input
                    id="minimum_fee_hourly"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.minimum_fee_hourly}
                    onChange={(e) => updateField('minimum_fee_hourly', parseFloat(e.target.value))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimum_fee_percentage">Mínimo - Cobrança Percentual</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                  <Input
                    id="minimum_fee_percentage"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.minimum_fee_percentage}
                    onChange={(e) => updateField('minimum_fee_percentage', parseFloat(e.target.value))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimum_fee_fixed">Mínimo - Valor Fixo</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                  <Input
                    id="minimum_fee_fixed"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.minimum_fee_fixed}
                    onChange={(e) => updateField('minimum_fee_fixed', parseFloat(e.target.value))}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Default Billing Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Configuração Padrão de Cobrança</CardTitle>
            <CardDescription>
              Valores padrão que serão sugeridos ao criar uma cobrança
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="default_billing_method">Método de Cobrança Padrão</Label>
              <Select
                value={formData.default_billing_method}
                onValueChange={(value) => updateField('default_billing_method', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o método padrão" />
                </SelectTrigger>
                <SelectContent>
                  {BILLING_METHOD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="default_hourly_rate">Taxa Horária Padrão</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                  <Input
                    id="default_hourly_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.default_hourly_rate || ''}
                    onChange={(e) => updateField('default_hourly_rate', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className={`pl-10 ${errors.default_hourly_rate ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.default_hourly_rate && (
                  <p className="text-sm text-red-600">{errors.default_hourly_rate}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="default_percentage_rate">Taxa Percentual Padrão</Label>
                <div className="relative">
                  <Input
                    id="default_percentage_rate"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.default_percentage_rate || ''}
                    onChange={(e) => updateField('default_percentage_rate', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className={errors.default_percentage_rate ? 'border-red-500' : ''}
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                </div>
                {errors.default_percentage_rate && (
                  <p className="text-sm text-red-600">{errors.default_percentage_rate}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="default_success_fee_rate">Taxa de Êxito Padrão</Label>
                <div className="relative">
                  <Input
                    id="default_success_fee_rate"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.default_success_fee_rate || ''}
                    onChange={(e) => updateField('default_success_fee_rate', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className={errors.default_success_fee_rate ? 'border-red-500' : ''}
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                </div>
                {errors.default_success_fee_rate && (
                  <p className="text-sm text-red-600">{errors.default_success_fee_rate}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => updateField('is_active', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <Label htmlFor="is_active">Tipo de caso ativo</Label>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Salvando...' : (mode === 'create' ? 'Criar Tipo de Caso' : 'Salvar Alterações')}
          </Button>
        </div>
      </form>
    </div>
  )
}