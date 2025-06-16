'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  CaseBillingMethodFormData,
  CaseType,
  CaseBillingCalculationResult,
  BILLING_METHOD_OPTIONS 
} from '@/lib/billing/case-billing-types'
import { caseBillingService } from '@/lib/billing/case-billing-service'

interface CaseBillingFormProps {
  matterId: string
  caseTypes: CaseType[]
  initialData?: Partial<CaseBillingMethodFormData>
  onSubmit: (data: CaseBillingMethodFormData) => void
  onCancel: () => void
  onCalculate?: (result: CaseBillingCalculationResult) => void
  isLoading?: boolean
  mode: 'create' | 'edit'
}

export function CaseBillingForm({
  matterId,
  caseTypes,
  initialData,
  onSubmit,
  onCancel,
  onCalculate,
  isLoading = false,
  mode
}: CaseBillingFormProps) {
  const [formData, setFormData] = useState<CaseBillingMethodFormData>({
    matter_id: matterId,
    case_type_id: initialData?.case_type_id,
    billing_type: initialData?.billing_type || 'hourly',
    hourly_rate: initialData?.hourly_rate,
    percentage_rate: initialData?.percentage_rate,
    fixed_amount: initialData?.fixed_amount,
    success_fee_percentage: initialData?.success_fee_percentage || 0,
    success_fee_applies_to: initialData?.success_fee_applies_to || 'recovered',
    minimum_fee_source: initialData?.minimum_fee_source || 'case_type'
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedCaseType, setSelectedCaseType] = useState<CaseType | null>(null)
  const [calculationResult, setCalculationResult] = useState<CaseBillingCalculationResult | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  // Update selected case type when case_type_id changes
  useEffect(() => {
    if (formData.case_type_id) {
      const caseType = caseTypes.find(ct => ct.id === formData.case_type_id)
      setSelectedCaseType(caseType || null)
      
      // Auto-fill default values from case type
      if (caseType && mode === 'create') {
        setFormData(prev => ({
          ...prev,
          billing_type: caseType.default_billing_method,
          hourly_rate: caseType.default_hourly_rate,
          percentage_rate: caseType.default_percentage_rate,
          success_fee_percentage: caseType.default_success_fee_rate || 0
        }))
      }
    } else {
      setSelectedCaseType(null)
    }
  }, [formData.case_type_id, caseTypes, mode])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.billing_type) {
      newErrors.billing_type = 'Tipo de cobrança é obrigatório'
    }

    switch (formData.billing_type) {
      case 'hourly':
        if (!formData.hourly_rate || formData.hourly_rate <= 0) {
          newErrors.hourly_rate = 'Taxa horária deve ser maior que zero'
        }
        break
      case 'percentage':
        if (!formData.percentage_rate || formData.percentage_rate <= 0 || formData.percentage_rate > 100) {
          newErrors.percentage_rate = 'Taxa percentual deve estar entre 0 e 100%'
        }
        break
      case 'fixed':
        if (!formData.fixed_amount || formData.fixed_amount <= 0) {
          newErrors.fixed_amount = 'Valor fixo deve ser maior que zero'
        }
        break
    }

    if (formData.success_fee_percentage < 0 || formData.success_fee_percentage > 100) {
      newErrors.success_fee_percentage = 'Taxa de êxito deve estar entre 0 e 100%'
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

  const updateField = (field: keyof CaseBillingMethodFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
    
    // Clear calculation when billing parameters change
    if (['billing_type', 'hourly_rate', 'percentage_rate', 'fixed_amount', 'success_fee_percentage'].includes(field)) {
      setCalculationResult(null)
    }
  }

  const handleCalculate = async () => {
    if (!validateForm()) return

    setIsCalculating(true)
    try {
      // Mock calculation for demo - in real implementation, this would call the API
      const mockCalculation: CaseBillingCalculationResult = {
        matter_id: matterId,
        billing_method: formData.billing_type,
        base_amount: calculateBaseAmount(),
        minimum_fee_applied: false,
        minimum_fee_amount: getMinimumFee(),
        success_fee_eligible: formData.success_fee_percentage > 0,
        success_fee_amount: calculateSuccessFee(),
        discount_eligible: false,
        original_total: 0,
        discount_amount: 0,
        subtotal: 0,
        total_amount: 0,
        calculation_breakdown: {
          base_calculation: {
            method: formData.billing_type,
            calculated_amount: calculateBaseAmount()
          },
          minimum_fee_check: {
            required_minimum: getMinimumFee(),
            calculated_amount: calculateBaseAmount(),
            minimum_applied: calculateBaseAmount() < getMinimumFee(),
            final_base_amount: Math.max(calculateBaseAmount(), getMinimumFee())
          }
        },
        is_valid: true,
        validation_errors: [],
        warnings: []
      }

      mockCalculation.subtotal = mockCalculation.calculation_breakdown.minimum_fee_check.final_base_amount + mockCalculation.success_fee_amount
      mockCalculation.original_total = mockCalculation.subtotal
      mockCalculation.total_amount = mockCalculation.subtotal

      setCalculationResult(mockCalculation)
      onCalculate?.(mockCalculation)
    } catch (error) {
      console.error('Error calculating billing:', error)
    } finally {
      setIsCalculating(false)
    }
  }

  const calculateBaseAmount = (): number => {
    switch (formData.billing_type) {
      case 'hourly':
        return (formData.hourly_rate || 0) * 40 // Default 40 hours
      case 'percentage':
        return 50000 * ((formData.percentage_rate || 0) / 100) // Mock case value
      case 'fixed':
        return formData.fixed_amount || 0
      default:
        return 0
    }
  }

  const calculateSuccessFee = (): number => {
    if (formData.success_fee_percentage <= 0) return 0
    const baseAmount = calculateBaseAmount()
    return baseAmount * (formData.success_fee_percentage / 100)
  }

  const getMinimumFee = (): number => {
    if (!selectedCaseType) return 0
    
    switch (formData.billing_type) {
      case 'hourly':
        return selectedCaseType.minimum_fee_hourly
      case 'percentage':
        return selectedCaseType.minimum_fee_percentage
      case 'fixed':
        return selectedCaseType.minimum_fee_fixed
      default:
        return 0
    }
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {mode === 'create' ? 'Nova Configuração de Cobrança' : 'Editar Configuração de Cobrança'}
          </h1>
          <p className="text-gray-600">
            Configure os parâmetros de cobrança para este caso
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Case Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Tipo de Caso</CardTitle>
            <CardDescription>
              Selecione o tipo de caso para carregar configurações padrão
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="case_type_id">Tipo de Caso</Label>
              <Select
                value={formData.case_type_id || ''}
                onValueChange={(value) => updateField('case_type_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de caso" />
                </SelectTrigger>
                <SelectContent>
                  {caseTypes.map((caseType) => (
                    <SelectItem key={caseType.id} value={caseType.id}>
                      {caseType.name} ({caseType.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCaseType && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">{selectedCaseType.category}</Badge>
                  <span className="text-sm text-gray-600">
                    Multiplicador: {selectedCaseType.complexity_multiplier}x
                  </span>
                </div>
                {selectedCaseType.estimated_hours_range && (
                  <p className="text-sm text-gray-600">
                    Horas estimadas: {selectedCaseType.estimated_hours_range}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Billing Method */}
        <Card>
          <CardHeader>
            <CardTitle>Método de Cobrança</CardTitle>
            <CardDescription>
              Configure o tipo e valores da cobrança
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="billing_type">Tipo de Cobrança*</Label>
              <Select
                value={formData.billing_type}
                onValueChange={(value) => updateField('billing_type', value)}
              >
                <SelectTrigger className={errors.billing_type ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Selecione o tipo de cobrança" />
                </SelectTrigger>
                <SelectContent>
                  {BILLING_METHOD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.billing_type && (
                <p className="text-sm text-red-600">{errors.billing_type}</p>
              )}
            </div>

            {/* Billing Type Specific Fields */}
            {formData.billing_type === 'hourly' && (
              <div className="space-y-2">
                <Label htmlFor="hourly_rate">Taxa Horária*</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                  <Input
                    id="hourly_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.hourly_rate || ''}
                    onChange={(e) => updateField('hourly_rate', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className={`pl-10 ${errors.hourly_rate ? 'border-red-500' : ''}`}
                    placeholder="300.00"
                  />
                </div>
                {errors.hourly_rate && (
                  <p className="text-sm text-red-600">{errors.hourly_rate}</p>
                )}
                {selectedCaseType && (
                  <p className="text-sm text-gray-500">
                    Valor mínimo: {formatCurrency(selectedCaseType.minimum_fee_hourly)}
                  </p>
                )}
              </div>
            )}

            {formData.billing_type === 'percentage' && (
              <div className="space-y-2">
                <Label htmlFor="percentage_rate">Taxa Percentual*</Label>
                <div className="relative">
                  <Input
                    id="percentage_rate"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.percentage_rate || ''}
                    onChange={(e) => updateField('percentage_rate', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className={errors.percentage_rate ? 'border-red-500' : ''}
                    placeholder="20.0"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                </div>
                {errors.percentage_rate && (
                  <p className="text-sm text-red-600">{errors.percentage_rate}</p>
                )}
                {selectedCaseType && (
                  <p className="text-sm text-gray-500">
                    Valor mínimo: {formatCurrency(selectedCaseType.minimum_fee_percentage)}
                  </p>
                )}
              </div>
            )}

            {formData.billing_type === 'fixed' && (
              <div className="space-y-2">
                <Label htmlFor="fixed_amount">Valor Fixo*</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                  <Input
                    id="fixed_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.fixed_amount || ''}
                    onChange={(e) => updateField('fixed_amount', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className={`pl-10 ${errors.fixed_amount ? 'border-red-500' : ''}`}
                    placeholder="25000.00"
                  />
                </div>
                {errors.fixed_amount && (
                  <p className="text-sm text-red-600">{errors.fixed_amount}</p>
                )}
                {selectedCaseType && (
                  <p className="text-sm text-gray-500">
                    Valor mínimo: {formatCurrency(selectedCaseType.minimum_fee_fixed)}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Success Fee Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Taxa de Êxito</CardTitle>
            <CardDescription>
              Configure a taxa de êxito baseada no resultado do caso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="success_fee_percentage">Taxa de Êxito (%)</Label>
                <div className="relative">
                  <Input
                    id="success_fee_percentage"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.success_fee_percentage}
                    onChange={(e) => updateField('success_fee_percentage', parseFloat(e.target.value) || 0)}
                    className={errors.success_fee_percentage ? 'border-red-500' : ''}
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                </div>
                {errors.success_fee_percentage && (
                  <p className="text-sm text-red-600">{errors.success_fee_percentage}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="success_fee_applies_to">Aplicada Sobre</Label>
                <Select
                  value={formData.success_fee_applies_to}
                  onValueChange={(value) => updateField('success_fee_applies_to', value as 'recovered' | 'total')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recovered">Valor Recuperado</SelectItem>
                    <SelectItem value="total">Valor Total do Caso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calculation Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Prévia do Cálculo</CardTitle>
            <CardDescription>
              Visualize os valores antes de confirmar a configuração
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCalculate}
              disabled={isCalculating}
              className="w-full"
            >
              {isCalculating ? 'Calculando...' : 'Calcular Valores'}
            </Button>

            {calculationResult && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <h4 className="font-medium text-gray-900">Resultado do Cálculo</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Valor Base:</span>
                    <p className="font-medium">{formatCurrency(calculationResult.base_amount)}</p>
                  </div>
                  {calculationResult.success_fee_amount > 0 && (
                    <div>
                      <span className="text-gray-600">Taxa de Êxito:</span>
                      <p className="font-medium">{formatCurrency(calculationResult.success_fee_amount)}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">Valor Mínimo:</span>
                    <p className="font-medium">{formatCurrency(calculationResult.minimum_fee_amount)}</p>
                  </div>
                  <div className="col-span-2">
                    <Separator className="my-2" />
                    <div className="flex justify-between items-center">
                      <span className="text-gray-900 font-medium">Total:</span>
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency(calculationResult.total_amount)}
                      </span>
                    </div>
                  </div>
                </div>
                {calculationResult.minimum_fee_applied && (
                  <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                    ⚠️ Valor mínimo aplicado
                  </div>
                )}
              </div>
            )}
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
            {isLoading ? 'Salvando...' : (mode === 'create' ? 'Criar Configuração' : 'Salvar Alterações')}
          </Button>
        </div>
      </form>
    </div>
  )
}