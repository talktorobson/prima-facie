'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  BillFormData,
  Vendor,
  ExpenseCategory,
  BillType
} from '@/lib/financial/types'

interface BillFormProps {
  vendors: Vendor[]
  expenseCategories: ExpenseCategory[]
  matters?: any[] // Matter type from existing system
  initialData?: Partial<BillFormData>
  onSubmit: (data: BillFormData) => void
  onCancel: () => void
  isLoading?: boolean
  mode: 'create' | 'edit'
}

export function BillForm({
  vendors,
  expenseCategories,
  matters = [],
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  mode
}: BillFormProps) {
  const [formData, setFormData] = useState<BillFormData>({
    vendor_id: initialData?.vendor_id || '',
    expense_category_id: initialData?.expense_category_id || '',
    matter_id: initialData?.matter_id || '',
    bill_number: initialData?.bill_number || '',
    bill_date: initialData?.bill_date || new Date().toISOString().split('T')[0],
    due_date: initialData?.due_date || '',
    payment_terms: initialData?.payment_terms || 30,
    subtotal: initialData?.subtotal || 0,
    tax_amount: initialData?.tax_amount || 0,
    discount_amount: initialData?.discount_amount || 0,
    bill_type: initialData?.bill_type || 'one_time',
    recurrence_frequency: initialData?.recurrence_frequency,
    installment_number: initialData?.installment_number,
    installment_total: initialData?.installment_total,
    description: initialData?.description || '',
    notes: initialData?.notes || '',
    is_billable_to_client: initialData?.is_billable_to_client || false,
    document_url: initialData?.document_url || ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null)
  const [calculatedTotal, setCalculatedTotal] = useState(0)

  // Update selected vendor when vendor_id changes
  useEffect(() => {
    if (formData.vendor_id) {
      const vendor = vendors.find(v => v.id === formData.vendor_id)
      setSelectedVendor(vendor || null)
      
      // Auto-set payment terms from vendor
      if (vendor && mode === 'create') {
        setFormData(prev => ({
          ...prev,
          payment_terms: vendor.payment_terms || 30
        }))
      }
    } else {
      setSelectedVendor(null)
    }
  }, [formData.vendor_id, vendors, mode])

  // Update selected category when expense_category_id changes
  useEffect(() => {
    if (formData.expense_category_id) {
      const category = expenseCategories.find(c => c.id === formData.expense_category_id)
      setSelectedCategory(category || null)
      
      // Auto-set billable flag from category
      if (category && mode === 'create') {
        setFormData(prev => ({
          ...prev,
          is_billable_to_client: category.is_billable_default
        }))
      }
    } else {
      setSelectedCategory(null)
    }
  }, [formData.expense_category_id, expenseCategories, mode])

  // Calculate total when amounts change
  useEffect(() => {
    const total = formData.subtotal + formData.tax_amount - formData.discount_amount
    setCalculatedTotal(Math.max(0, total))
  }, [formData.subtotal, formData.tax_amount, formData.discount_amount])

  // Auto-calculate due date when bill_date or payment_terms change
  useEffect(() => {
    if (formData.bill_date && formData.payment_terms) {
      const billDate = new Date(formData.bill_date)
      billDate.setDate(billDate.getDate() + formData.payment_terms)
      const dueDate = billDate.toISOString().split('T')[0]
      
      if (dueDate !== formData.due_date) {
        setFormData(prev => ({ ...prev, due_date: dueDate }))
      }
    }
  }, [formData.bill_date, formData.payment_terms])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.vendor_id) {
      newErrors.vendor_id = 'Fornecedor é obrigatório'
    }

    if (!formData.expense_category_id) {
      newErrors.expense_category_id = 'Categoria de despesa é obrigatória'
    }

    if (!formData.bill_number.trim()) {
      newErrors.bill_number = 'Número da fatura é obrigatório'
    }

    if (!formData.bill_date) {
      newErrors.bill_date = 'Data da fatura é obrigatória'
    }

    if (!formData.due_date) {
      newErrors.due_date = 'Data de vencimento é obrigatória'
    }

    if (formData.bill_date && formData.due_date && formData.due_date < formData.bill_date) {
      newErrors.due_date = 'Data de vencimento deve ser posterior à data da fatura'
    }

    if (formData.subtotal <= 0) {
      newErrors.subtotal = 'Valor deve ser maior que zero'
    }

    if (formData.tax_amount < 0) {
      newErrors.tax_amount = 'Valor do imposto deve ser positivo'
    }

    if (formData.discount_amount < 0) {
      newErrors.discount_amount = 'Valor do desconto deve ser positivo'
    }

    if (formData.discount_amount > formData.subtotal + formData.tax_amount) {
      newErrors.discount_amount = 'Desconto não pode ser maior que subtotal + impostos'
    }

    if (formData.bill_type === 'installment') {
      if (!formData.installment_number || formData.installment_number < 1) {
        newErrors.installment_number = 'Número da parcela é obrigatório'
      }
      if (!formData.installment_total || formData.installment_total < 1) {
        newErrors.installment_total = 'Total de parcelas é obrigatório'
      }
      if (formData.installment_number && formData.installment_total && 
          formData.installment_number > formData.installment_total) {
        newErrors.installment_number = 'Número da parcela não pode ser maior que o total'
      }
    }

    if (formData.bill_type === 'recurring' && !formData.recurrence_frequency) {
      newErrors.recurrence_frequency = 'Frequência de recorrência é obrigatória'
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

  const updateField = (field: keyof BillFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  const getBillTypeDescription = (): string => {
    switch (formData.bill_type) {
      case 'one_time':
        return 'Pagamento único, sem recorrência'
      case 'recurring':
        return 'Fatura que se repete em intervalos regulares'
      case 'installment':
        return 'Pagamento dividido em parcelas'
      default:
        return ''
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {mode === 'create' ? 'Nova Fatura' : 'Editar Fatura'}
          </h1>
          <p className="text-gray-600">
            {mode === 'create' 
              ? 'Registre uma nova fatura a pagar'
              : 'Atualize as informações da fatura'
            }
          </p>
        </div>
        <div className="flex space-x-2">
          {formData.is_billable_to_client && (
            <Badge variant="default">Cobrável ao Cliente</Badge>
          )}
          {formData.bill_type === 'recurring' && (
            <Badge variant="secondary">Recorrente</Badge>
          )}
          {formData.bill_type === 'installment' && (
            <Badge variant="secondary">
              Parcela {formData.installment_number}/{formData.installment_total}
            </Badge>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vendor and Category Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Fornecedor e Categoria</CardTitle>
            <CardDescription>
              Selecione o fornecedor e a categoria da despesa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendor_id">Fornecedor*</Label>
                <Select
                  value={formData.vendor_id}
                  onValueChange={(value) => updateField('vendor_id', value)}
                >
                  <SelectTrigger className={errors.vendor_id ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecione o fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name} {vendor.cnpj && `- ${vendor.cnpj}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.vendor_id && (
                  <p className="text-sm text-red-600">{errors.vendor_id}</p>
                )}
                {selectedVendor && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium">{selectedVendor.name}</p>
                    <p className="text-sm text-gray-600">
                      Prazo: {selectedVendor.payment_terms} dias
                      {selectedVendor.email && ` • ${selectedVendor.email}`}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="expense_category_id">Categoria*</Label>
                <Select
                  value={formData.expense_category_id}
                  onValueChange={(value) => updateField('expense_category_id', value)}
                >
                  <SelectTrigger className={errors.expense_category_id ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.code} - {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.expense_category_id && (
                  <p className="text-sm text-red-600">{errors.expense_category_id}</p>
                )}
                {selectedCategory && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium">{selectedCategory.name}</p>
                    <p className="text-sm text-gray-600">
                      Tipo: {selectedCategory.category_type}
                      {selectedCategory.is_billable_default && ' • Cobrável por padrão'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {matters.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="matter_id">Caso (Opcional)</Label>
                <Select
                  value={formData.matter_id}
                  onValueChange={(value) => updateField('matter_id', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um caso para vincular a despesa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum caso vinculado</SelectItem>
                    {matters.map((matter) => (
                      <SelectItem key={matter.id} value={matter.id}>
                        {matter.title} - {matter.client?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  Vincule a despesa a um caso específico para controle de custos
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bill Details */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da Fatura</CardTitle>
            <CardDescription>
              Informações básicas da fatura
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bill_number">Número da Fatura*</Label>
                <Input
                  id="bill_number"
                  value={formData.bill_number}
                  onChange={(e) => updateField('bill_number', e.target.value)}
                  className={errors.bill_number ? 'border-red-500' : ''}
                  placeholder="Ex: NF-2025-001"
                />
                {errors.bill_number && (
                  <p className="text-sm text-red-600">{errors.bill_number}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bill_type">Tipo de Fatura*</Label>
                <Select
                  value={formData.bill_type}
                  onValueChange={(value) => updateField('bill_type', value as BillType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_time">Pagamento Único</SelectItem>
                    <SelectItem value="recurring">Recorrente</SelectItem>
                    <SelectItem value="installment">Parcelado</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">{getBillTypeDescription()}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bill_date">Data da Fatura*</Label>
                <Input
                  id="bill_date"
                  type="date"
                  value={formData.bill_date}
                  onChange={(e) => updateField('bill_date', e.target.value)}
                  className={errors.bill_date ? 'border-red-500' : ''}
                />
                {errors.bill_date && (
                  <p className="text-sm text-red-600">{errors.bill_date}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_terms">Prazo (dias)</Label>
                <Input
                  id="payment_terms"
                  type="number"
                  min="0"
                  value={formData.payment_terms || ''}
                  onChange={(e) => updateField('payment_terms', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="30"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">Vencimento*</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => updateField('due_date', e.target.value)}
                  className={errors.due_date ? 'border-red-500' : ''}
                />
                {errors.due_date && (
                  <p className="text-sm text-red-600">{errors.due_date}</p>
                )}
              </div>
            </div>

            {/* Recurrence Settings */}
            {formData.bill_type === 'recurring' && (
              <div className="space-y-2">
                <Label htmlFor="recurrence_frequency">Frequência de Recorrência*</Label>
                <Select
                  value={formData.recurrence_frequency}
                  onValueChange={(value) => updateField('recurrence_frequency', value)}
                >
                  <SelectTrigger className={errors.recurrence_frequency ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecione a frequência" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="quarterly">Trimestral</SelectItem>
                    <SelectItem value="semi_annual">Semestral</SelectItem>
                    <SelectItem value="annual">Anual</SelectItem>
                  </SelectContent>
                </Select>
                {errors.recurrence_frequency && (
                  <p className="text-sm text-red-600">{errors.recurrence_frequency}</p>
                )}
              </div>
            )}

            {/* Installment Settings */}
            {formData.bill_type === 'installment' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="installment_number">Número da Parcela*</Label>
                  <Input
                    id="installment_number"
                    type="number"
                    min="1"
                    value={formData.installment_number || ''}
                    onChange={(e) => updateField('installment_number', e.target.value ? parseInt(e.target.value) : undefined)}
                    className={errors.installment_number ? 'border-red-500' : ''}
                    placeholder="1"
                  />
                  {errors.installment_number && (
                    <p className="text-sm text-red-600">{errors.installment_number}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="installment_total">Total de Parcelas*</Label>
                  <Input
                    id="installment_total"
                    type="number"
                    min="1"
                    value={formData.installment_total || ''}
                    onChange={(e) => updateField('installment_total', e.target.value ? parseInt(e.target.value) : undefined)}
                    className={errors.installment_total ? 'border-red-500' : ''}
                    placeholder="3"
                  />
                  {errors.installment_total && (
                    <p className="text-sm text-red-600">{errors.installment_total}</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Details */}
        <Card>
          <CardHeader>
            <CardTitle>Valores Financeiros</CardTitle>
            <CardDescription>
              Detalhamento dos valores da fatura
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subtotal">Subtotal*</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                  <Input
                    id="subtotal"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.subtotal || ''}
                    onChange={(e) => updateField('subtotal', e.target.value ? parseFloat(e.target.value) : 0)}
                    className={`pl-10 ${errors.subtotal ? 'border-red-500' : ''}`}
                    placeholder="1000.00"
                  />
                </div>
                {errors.subtotal && (
                  <p className="text-sm text-red-600">{errors.subtotal}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax_amount">Impostos</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                  <Input
                    id="tax_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.tax_amount || ''}
                    onChange={(e) => updateField('tax_amount', e.target.value ? parseFloat(e.target.value) : 0)}
                    className={`pl-10 ${errors.tax_amount ? 'border-red-500' : ''}`}
                    placeholder="0.00"
                  />
                </div>
                {errors.tax_amount && (
                  <p className="text-sm text-red-600">{errors.tax_amount}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount_amount">Desconto</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                  <Input
                    id="discount_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.discount_amount || ''}
                    onChange={(e) => updateField('discount_amount', e.target.value ? parseFloat(e.target.value) : 0)}
                    className={`pl-10 ${errors.discount_amount ? 'border-red-500' : ''}`}
                    placeholder="0.00"
                  />
                </div>
                {errors.discount_amount && (
                  <p className="text-sm text-red-600">{errors.discount_amount}</p>
                )}
              </div>
            </div>

            <Separator />

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-900">Total da Fatura:</span>
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(calculatedTotal)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Adicionais</CardTitle>
            <CardDescription>
              Descrição e configurações extras
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Breve descrição da fatura"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="document_url">URL do Documento</Label>
              <Input
                id="document_url"
                value={formData.document_url}
                onChange={(e) => updateField('document_url', e.target.value)}
                placeholder="https://..."
              />
              <p className="text-sm text-gray-500">
                Link para a fatura digitalizada ou documento comprobatório
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_billable_to_client"
                checked={formData.is_billable_to_client}
                onChange={(e) => updateField('is_billable_to_client', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <Label htmlFor="is_billable_to_client">Repassar custo ao cliente</Label>
            </div>
            <p className="text-sm text-gray-500 ml-6">
              Marque se esta despesa deve ser cobrada do cliente
            </p>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Informações adicionais sobre a fatura..."
                rows={3}
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
            {isLoading ? 'Salvando...' : (mode === 'create' ? 'Criar Fatura' : 'Salvar Alterações')}
          </Button>
        </div>
      </form>
    </div>
  )
}