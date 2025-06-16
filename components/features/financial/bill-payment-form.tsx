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
  BillPaymentFormData,
  Bill,
  PAYMENT_METHOD_OPTIONS
} from '@/lib/financial/types'

interface BillPaymentFormProps {
  bill: Bill
  initialData?: Partial<BillPaymentFormData>
  onSubmit: (data: BillPaymentFormData) => void
  onCancel: () => void
  isLoading?: boolean
  mode: 'create' | 'edit'
}

export function BillPaymentForm({
  bill,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  mode
}: BillPaymentFormProps) {
  const [formData, setFormData] = useState<BillPaymentFormData>({
    bill_id: bill.id,
    payment_date: initialData?.payment_date || new Date().toISOString().split('T')[0],
    amount: initialData?.amount || bill.balance_due,
    payment_method: initialData?.payment_method || 'pix',
    transaction_reference: initialData?.transaction_reference || '',
    bank_account_used: initialData?.bank_account_used || '',
    proof_document_url: initialData?.proof_document_url || '',
    processing_notes: initialData?.processing_notes || ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.payment_date) {
      newErrors.payment_date = 'Data do pagamento é obrigatória'
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Valor deve ser maior que zero'
    }

    if (formData.amount > bill.balance_due) {
      newErrors.amount = 'Valor não pode ser maior que o saldo devedor'
    }

    if (!formData.payment_method) {
      newErrors.payment_method = 'Método de pagamento é obrigatório'
    }

    if (formData.payment_date > new Date().toISOString().split('T')[0]) {
      newErrors.payment_date = 'Data do pagamento não pode ser futura'
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

  const updateField = (field: keyof BillPaymentFormData, value: any) => {
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

  const getPaymentMethodDescription = (): string => {
    switch (formData.payment_method) {
      case 'pix':
        return 'Transferência instantânea via PIX'
      case 'bank_transfer':
        return 'Transferência bancária tradicional (TED/DOC)'
      case 'credit_card':
        return 'Pagamento com cartão de crédito'
      case 'debit_card':
        return 'Pagamento com cartão de débito'
      case 'check':
        return 'Pagamento com cheque'
      case 'cash':
        return 'Pagamento em dinheiro'
      default:
        return 'Outro método de pagamento'
    }
  }

  const isPartialPayment = formData.amount < bill.balance_due
  const remainingBalance = bill.balance_due - formData.amount

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {mode === 'create' ? 'Registrar Pagamento' : 'Editar Pagamento'}
          </h1>
          <p className="text-gray-600">
            {mode === 'create' 
              ? 'Registre um pagamento para esta fatura'
              : 'Atualize as informações do pagamento'
            }
          </p>
        </div>
        <div className="flex space-x-2">
          {isPartialPayment && (
            <Badge variant="secondary">Pagamento Parcial</Badge>
          )}
          {!isPartialPayment && formData.amount === bill.balance_due && (
            <Badge variant="default">Pagamento Total</Badge>
          )}
        </div>
      </div>

      {/* Bill Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Fatura</CardTitle>
          <CardDescription>
            Informações da fatura que será paga
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Fornecedor</p>
              <p className="text-sm text-gray-600">{bill.vendor?.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Número da Fatura</p>
              <p className="text-sm text-gray-600">{bill.bill_number}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Data de Vencimento</p>
              <p className="text-sm text-gray-600">
                {new Date(bill.due_date).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Status</p>
              <Badge variant={bill.payment_status === 'overdue' ? 'destructive' : 'secondary'}>
                {bill.payment_status === 'pending' && 'Pendente'}
                {bill.payment_status === 'partial' && 'Pago Parcialmente'}
                {bill.payment_status === 'paid' && 'Pago'}
                {bill.payment_status === 'overdue' && 'Em Atraso'}
                {bill.payment_status === 'cancelled' && 'Cancelado'}
              </Badge>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Valor Total</p>
              <p className="text-lg font-semibold">{formatCurrency(bill.total_amount)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Já Pago</p>
              <p className="text-lg font-semibold text-green-600">{formatCurrency(bill.amount_paid)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Saldo Devedor</p>
              <p className="text-lg font-semibold text-red-600">{formatCurrency(bill.balance_due)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Payment Details */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Pagamento</CardTitle>
            <CardDescription>
              Informações sobre o pagamento a ser registrado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment_date">Data do Pagamento*</Label>
                <Input
                  id="payment_date"
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => updateField('payment_date', e.target.value)}
                  className={errors.payment_date ? 'border-red-500' : ''}
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.payment_date && (
                  <p className="text-sm text-red-600">{errors.payment_date}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Valor do Pagamento*</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={bill.balance_due}
                    value={formData.amount || ''}
                    onChange={(e) => updateField('amount', e.target.value ? parseFloat(e.target.value) : 0)}
                    className={`pl-10 ${errors.amount ? 'border-red-500' : ''}`}
                    placeholder="0.00"
                  />
                </div>
                {errors.amount && (
                  <p className="text-sm text-red-600">{errors.amount}</p>
                )}
                <p className="text-sm text-gray-500">
                  Máximo: {formatCurrency(bill.balance_due)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method">Método de Pagamento*</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) => updateField('payment_method', value)}
              >
                <SelectTrigger className={errors.payment_method ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Selecione o método" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHOD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">{getPaymentMethodDescription()}</p>
              {errors.payment_method && (
                <p className="text-sm text-red-600">{errors.payment_method}</p>
              )}
            </div>

            {/* Payment calculation preview */}
            {formData.amount > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                <h4 className="font-medium text-blue-900">Resumo do Pagamento</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Valor do pagamento:</span>
                    <p className="font-semibold">{formatCurrency(formData.amount)}</p>
                  </div>
                  <div>
                    <span className="text-blue-700">Saldo após pagamento:</span>
                    <p className="font-semibold">
                      {remainingBalance > 0 
                        ? formatCurrency(remainingBalance)
                        : 'Quitado'
                      }
                    </p>
                  </div>
                </div>
                {isPartialPayment && (
                  <p className="text-sm text-blue-700">
                    Este será um pagamento parcial. A fatura permanecerá em aberto.
                  </p>
                )}
                {!isPartialPayment && (
                  <p className="text-sm text-green-700">
                    Este pagamento quitará totalmente a fatura.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction Details */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da Transação</CardTitle>
            <CardDescription>
              Informações adicionais sobre a transação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="transaction_reference">Referência/ID da Transação</Label>
                <Input
                  id="transaction_reference"
                  value={formData.transaction_reference}
                  onChange={(e) => updateField('transaction_reference', e.target.value)}
                  placeholder="Ex: PIX-2025-01-12345, TED-67890"
                />
                <p className="text-sm text-gray-500">
                  Número de controle ou ID fornecido pelo banco
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_account_used">Conta Utilizada</Label>
                <Input
                  id="bank_account_used"
                  value={formData.bank_account_used}
                  onChange={(e) => updateField('bank_account_used', e.target.value)}
                  placeholder="Ex: Banco do Brasil - Ag 1234 CC 56789-0"
                />
                <p className="text-sm text-gray-500">
                  Conta bancária de onde saiu o pagamento
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="proof_document_url">Comprovante de Pagamento</Label>
              <Input
                id="proof_document_url"
                value={formData.proof_document_url}
                onChange={(e) => updateField('proof_document_url', e.target.value)}
                placeholder="https://... ou caminho do arquivo"
              />
              <p className="text-sm text-gray-500">
                URL ou caminho para o comprovante digitalizado
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="processing_notes">Observações</Label>
              <Textarea
                id="processing_notes"
                value={formData.processing_notes}
                onChange={(e) => updateField('processing_notes', e.target.value)}
                placeholder="Informações adicionais sobre o pagamento..."
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
            {isLoading ? 'Registrando...' : (mode === 'create' ? 'Registrar Pagamento' : 'Salvar Alterações')}
          </Button>
        </div>
      </form>
    </div>
  )
}