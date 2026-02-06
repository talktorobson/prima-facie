'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  CaseOutcomeFormData, 
  CASE_OUTCOME_TYPE_OPTIONS 
} from '@/lib/billing/case-billing-types'

interface CaseOutcomeFormProps {
  matterId: string
  initialData?: Partial<CaseOutcomeFormData>
  onSubmit: (data: CaseOutcomeFormData) => void
  onCancel: () => void
  isLoading?: boolean
  mode: 'create' | 'edit'
}

export function CaseOutcomeForm({
  matterId,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  mode
}: CaseOutcomeFormProps) {
  const [formData, setFormData] = useState<CaseOutcomeFormData>({
    matter_id: matterId,
    outcome_type: initialData?.outcome_type || 'settlement',
    outcome_subtype: initialData?.outcome_subtype || '',
    total_value_claimed: initialData?.total_value_claimed || 0,
    effective_value_redeemed: initialData?.effective_value_redeemed || 0,
    settlement_amount: initialData?.settlement_amount || 0,
    court_award_amount: initialData?.court_award_amount || 0,
    success_achieved: initialData?.success_achieved ?? false,
    success_percentage: initialData?.success_percentage || 0,
    outcome_date: initialData?.outcome_date || new Date().toISOString().split('T')[0],
    final_payment_received_date: initialData?.final_payment_received_date || '',
    court_decision_reference: initialData?.court_decision_reference || '',
    settlement_agreement_reference: initialData?.settlement_agreement_reference || '',
    notes: initialData?.notes || ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.outcome_date) {
      newErrors.outcome_date = 'Data do resultado é obrigatória'
    }

    if (formData.success_percentage && (formData.success_percentage < 0 || formData.success_percentage > 100)) {
      newErrors.success_percentage = 'Percentual de êxito deve estar entre 0 e 100%'
    }

    if (formData.total_value_claimed && formData.total_value_claimed < 0) {
      newErrors.total_value_claimed = 'Valor reclamado deve ser positivo'
    }

    if (formData.effective_value_redeemed && formData.effective_value_redeemed < 0) {
      newErrors.effective_value_redeemed = 'Valor efetivamente recuperado deve ser positivo'
    }

    if (formData.settlement_amount && formData.settlement_amount < 0) {
      newErrors.settlement_amount = 'Valor do acordo deve ser positivo'
    }

    if (formData.court_award_amount && formData.court_award_amount < 0) {
      newErrors.court_award_amount = 'Valor da decisão judicial deve ser positivo'
    }

    // Validate that success_achieved is consistent with success_percentage
    if (formData.success_achieved && formData.success_percentage === 0) {
      newErrors.success_percentage = 'Informe o percentual de êxito quando houver sucesso'
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

  const updateField = (field: keyof CaseOutcomeFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }

    // Auto-calculate success percentage when values change
    if (field === 'total_value_claimed' || field === 'effective_value_redeemed') {
      const totalClaimed = field === 'total_value_claimed' ? value : formData.total_value_claimed
      const effectiveRedeemed = field === 'effective_value_redeemed' ? value : formData.effective_value_redeemed
      
      if (totalClaimed && effectiveRedeemed && totalClaimed > 0) {
        const percentage = (effectiveRedeemed / totalClaimed) * 100
        setFormData(prev => ({ 
          ...prev, 
          [field]: value,
          success_percentage: Math.round(percentage * 10) / 10,
          success_achieved: percentage > 0
        }))
        return
      }
    }

    // Auto-update success_achieved based on outcome_type
    if (field === 'outcome_type') {
      const isSuccessful = ['settlement', 'court_victory', 'partial_victory'].includes(value)
      setFormData(prev => ({ 
        ...prev, 
        [field]: value,
        success_achieved: isSuccessful
      }))
      return
    }
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  const calculateSuccessFee = (): number => {
    const successFeeRate = 15 // Default 15% - should come from billing method
    const baseAmount = formData.effective_value_redeemed || 0
    return baseAmount * (successFeeRate / 100)
  }

  const getOutcomeDescription = (): string => {
    switch (formData.outcome_type) {
      case 'settlement':
        return 'Acordo extrajudicial ou judicial'
      case 'court_victory':
        return 'Vitória completa na decisão judicial'
      case 'partial_victory':
        return 'Vitória parcial na decisão judicial'
      case 'loss':
        return 'Derrota na ação judicial'
      case 'dismissed':
        return 'Ação arquivada ou extinta'
      default:
        return ''
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {mode === 'create' ? 'Registrar Resultado do Caso' : 'Editar Resultado do Caso'}
          </h1>
          <p className="text-gray-600">
            Registre o resultado final do caso para cálculo de taxas de êxito
          </p>
        </div>
        <Badge variant={formData.success_achieved ? 'default' : 'secondary'}>
          {formData.success_achieved ? 'Bem-sucedido' : 'Sem êxito'}
        </Badge>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Outcome Classification */}
        <Card>
          <CardHeader>
            <CardTitle>Classificação do Resultado</CardTitle>
            <CardDescription>
              Defina o tipo de resultado obtido no caso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="outcome_type">Tipo de Resultado*</Label>
                <Select
                  value={formData.outcome_type}
                  onValueChange={(value) => updateField('outcome_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de resultado" />
                  </SelectTrigger>
                  <SelectContent>
                    {CASE_OUTCOME_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">{getOutcomeDescription()}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="outcome_subtype">Subtipo (Opcional)</Label>
                <Input
                  id="outcome_subtype"
                  value={formData.outcome_subtype}
                  onChange={(e) => updateField('outcome_subtype', e.target.value)}
                  placeholder="Ex: Acordo monetário, Liminar deferida"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="outcome_date">Data do Resultado*</Label>
              <Input
                id="outcome_date"
                type="date"
                value={formData.outcome_date}
                onChange={(e) => updateField('outcome_date', e.target.value)}
                className={errors.outcome_date ? 'border-red-500' : ''}
              />
              {errors.outcome_date && (
                <p className="text-sm text-red-600">{errors.outcome_date}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Financial Results */}
        <Card>
          <CardHeader>
            <CardTitle>Resultados Financeiros</CardTitle>
            <CardDescription>
              Informe os valores relacionados ao resultado do caso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="total_value_claimed">Valor Total Reclamado</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                  <Input
                    id="total_value_claimed"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.total_value_claimed || ''}
                    onChange={(e) => updateField('total_value_claimed', e.target.value ? parseFloat(e.target.value) : 0)}
                    className={`pl-10 ${errors.total_value_claimed ? 'border-red-500' : ''}`}
                    placeholder="100000.00"
                  />
                </div>
                {errors.total_value_claimed && (
                  <p className="text-sm text-red-600">{errors.total_value_claimed}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="effective_value_redeemed">Valor Efetivamente Recuperado</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                  <Input
                    id="effective_value_redeemed"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.effective_value_redeemed || ''}
                    onChange={(e) => updateField('effective_value_redeemed', e.target.value ? parseFloat(e.target.value) : 0)}
                    className={`pl-10 ${errors.effective_value_redeemed ? 'border-red-500' : ''}`}
                    placeholder="75000.00"
                  />
                </div>
                {errors.effective_value_redeemed && (
                  <p className="text-sm text-red-600">{errors.effective_value_redeemed}</p>
                )}
              </div>
            </div>

            {formData.outcome_type === 'settlement' && (
              <div className="space-y-2">
                <Label htmlFor="settlement_amount">Valor do Acordo</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                  <Input
                    id="settlement_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.settlement_amount || ''}
                    onChange={(e) => updateField('settlement_amount', e.target.value ? parseFloat(e.target.value) : 0)}
                    className={`pl-10 ${errors.settlement_amount ? 'border-red-500' : ''}`}
                    placeholder="75000.00"
                  />
                </div>
                {errors.settlement_amount && (
                  <p className="text-sm text-red-600">{errors.settlement_amount}</p>
                )}
              </div>
            )}

            {['court_victory', 'partial_victory'].includes(formData.outcome_type) && (
              <div className="space-y-2">
                <Label htmlFor="court_award_amount">Valor da Decisão Judicial</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                  <Input
                    id="court_award_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.court_award_amount || ''}
                    onChange={(e) => updateField('court_award_amount', e.target.value ? parseFloat(e.target.value) : 0)}
                    className={`pl-10 ${errors.court_award_amount ? 'border-red-500' : ''}`}
                    placeholder="80000.00"
                  />
                </div>
                {errors.court_award_amount && (
                  <p className="text-sm text-red-600">{errors.court_award_amount}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Success Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Métricas de Êxito</CardTitle>
            <CardDescription>
              Avaliação do sucesso obtido no caso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="success_achieved"
                checked={formData.success_achieved}
                onChange={(e) => updateField('success_achieved', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <Label htmlFor="success_achieved">Êxito obtido no caso</Label>
            </div>

            {formData.success_achieved && (
              <div className="space-y-2">
                <Label htmlFor="success_percentage">Percentual de Êxito (%)</Label>
                <div className="relative">
                  <Input
                    id="success_percentage"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.success_percentage || ''}
                    onChange={(e) => updateField('success_percentage', e.target.value ? parseFloat(e.target.value) : 0)}
                    className={errors.success_percentage ? 'border-red-500' : ''}
                    placeholder="75.0"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                </div>
                {errors.success_percentage && (
                  <p className="text-sm text-red-600">{errors.success_percentage}</p>
                )}
                
                {formData.success_percentage > 0 && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <h4 className="font-medium text-green-800">Taxa de Êxito Estimada</h4>
                    <p className="text-sm text-green-700">
                      {formatCurrency(calculateSuccessFee())} (15% sobre valor recuperado)
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Adicionais</CardTitle>
            <CardDescription>
              Documentação e observações sobre o resultado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="court_decision_reference">Referência da Decisão Judicial</Label>
                <Input
                  id="court_decision_reference"
                  value={formData.court_decision_reference}
                  onChange={(e) => updateField('court_decision_reference', e.target.value)}
                  placeholder="Ex: Processo nº 1234567-89.2023.8.26.0100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="settlement_agreement_reference">Referência do Acordo</Label>
                <Input
                  id="settlement_agreement_reference"
                  value={formData.settlement_agreement_reference}
                  onChange={(e) => updateField('settlement_agreement_reference', e.target.value)}
                  placeholder="Ex: Termo de Acordo - Processo nº 1234567"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="final_payment_received_date">Data do Recebimento Final</Label>
              <Input
                id="final_payment_received_date"
                type="date"
                value={formData.final_payment_received_date}
                onChange={(e) => updateField('final_payment_received_date', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Descreva detalhes importantes sobre o resultado do caso..."
                rows={4}
              />
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
            {isLoading ? 'Salvando...' : (mode === 'create' ? 'Registrar Resultado' : 'Salvar Alterações')}
          </Button>
        </div>
      </form>
    </div>
  )
}