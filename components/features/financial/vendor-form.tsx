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
  VendorFormData, 
  VENDOR_TYPE_OPTIONS,
  BRAZILIAN_STATES 
} from '@/lib/financial/types'

interface VendorFormProps {
  initialData?: Partial<VendorFormData>
  onSubmit: (data: VendorFormData) => void
  onCancel: () => void
  isLoading?: boolean
  mode: 'create' | 'edit'
}

export function VendorForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  mode
}: VendorFormProps) {
  const [formData, setFormData] = useState<VendorFormData>({
    vendor_type: initialData?.vendor_type || 'supplier',
    name: initialData?.name || '',
    legal_name: initialData?.legal_name || '',
    cnpj: initialData?.cnpj || '',
    cpf: initialData?.cpf || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    website: initialData?.website || '',
    address_street: initialData?.address_street || '',
    address_number: initialData?.address_number || '',
    address_complement: initialData?.address_complement || '',
    address_neighborhood: initialData?.address_neighborhood || '',
    address_city: initialData?.address_city || '',
    address_state: initialData?.address_state || '',
    address_postal_code: initialData?.address_postal_code || '',
    bank_name: initialData?.bank_name || '',
    bank_branch: initialData?.bank_branch || '',
    bank_account: initialData?.bank_account || '',
    bank_account_type: initialData?.bank_account_type || 'checking',
    pix_key: initialData?.pix_key || '',
    payment_terms: initialData?.payment_terms || 30,
    tax_rate: initialData?.tax_rate || 0,
    is_recurring: initialData?.is_recurring || false,
    notes: initialData?.notes || ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório'
    }

    if (!formData.vendor_type) {
      newErrors.vendor_type = 'Tipo de fornecedor é obrigatório'
    }

    // Validate CNPJ or CPF
    if (formData.cnpj && !isValidCNPJ(formData.cnpj)) {
      newErrors.cnpj = 'CNPJ inválido'
    }

    if (formData.cpf && !isValidCPF(formData.cpf)) {
      newErrors.cpf = 'CPF inválido'
    }

    if (!formData.cnpj && !formData.cpf) {
      newErrors.cnpj = 'CNPJ ou CPF é obrigatório'
    }

    if (formData.email && !isValidEmail(formData.email)) {
      newErrors.email = 'E-mail inválido'
    }

    if (formData.payment_terms && formData.payment_terms < 0) {
      newErrors.payment_terms = 'Prazo de pagamento deve ser positivo'
    }

    if (formData.tax_rate && (formData.tax_rate < 0 || formData.tax_rate > 100)) {
      newErrors.tax_rate = 'Taxa deve estar entre 0 e 100%'
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

  const updateField = (field: keyof VendorFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const isValidCNPJ = (cnpj: string): boolean => {
    const cleanCNPJ = cnpj.replace(/[^\d]/g, '')
    return cleanCNPJ.length === 14 // Simplified validation
  }

  const isValidCPF = (cpf: string): boolean => {
    const cleanCPF = cpf.replace(/[^\d]/g, '')
    return cleanCPF.length === 11 // Simplified validation
  }

  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const formatCNPJ = (value: string) => {
    const clean = value.replace(/[^\d]/g, '')
    return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
  }

  const formatCPF = (value: string) => {
    const clean = value.replace(/[^\d]/g, '')
    return clean.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
  }

  const getVendorTypeDescription = (): string => {
    switch (formData.vendor_type) {
      case 'supplier':
        return 'Empresa que fornece produtos ou materiais'
      case 'contractor':
        return 'Profissional que presta serviços pontuais'
      case 'service_provider':
        return 'Empresa que presta serviços contínuos'
      case 'utility':
        return 'Concessionária de serviços públicos'
      case 'government':
        return 'Órgão público ou entidade governamental'
      default:
        return 'Outros tipos de fornecedores'
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {mode === 'create' ? 'Novo Fornecedor' : 'Editar Fornecedor'}
          </h1>
          <p className="text-gray-600">
            {mode === 'create' 
              ? 'Cadastre um novo fornecedor ou prestador de serviços'
              : 'Atualize as informações do fornecedor'
            }
          </p>
        </div>
        {formData.is_recurring && (
          <Badge variant="default">Fornecedor Recorrente</Badge>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>
              Dados principais do fornecedor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendor_type">Tipo de Fornecedor*</Label>
                <Select
                  value={formData.vendor_type}
                  onValueChange={(value) => updateField('vendor_type', value)}
                >
                  <SelectTrigger className={errors.vendor_type ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {VENDOR_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">{getVendorTypeDescription()}</p>
                {errors.vendor_type && (
                  <p className="text-sm text-red-600">{errors.vendor_type}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nome Fantasia*</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className={errors.name ? 'border-red-500' : ''}
                  placeholder="Ex: Papelaria Central"
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="legal_name">Razão Social</Label>
              <Input
                id="legal_name"
                value={formData.legal_name}
                onChange={(e) => updateField('legal_name', e.target.value)}
                placeholder="Ex: Papelaria Central Ltda"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => {
                    const formatted = formatCNPJ(e.target.value)
                    updateField('cnpj', formatted)
                  }}
                  className={errors.cnpj ? 'border-red-500' : ''}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                />
                {errors.cnpj && (
                  <p className="text-sm text-red-600">{errors.cnpj}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF (para pessoa física)</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => {
                    const formatted = formatCPF(e.target.value)
                    updateField('cpf', formatted)
                  }}
                  className={errors.cpf ? 'border-red-500' : ''}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
                {errors.cpf && (
                  <p className="text-sm text-red-600">{errors.cpf}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informações de Contato</CardTitle>
            <CardDescription>
              Dados para comunicação com o fornecedor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className={errors.email ? 'border-red-500' : ''}
                  placeholder="contato@empresa.com.br"
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="(11) 9999-9999"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => updateField('website', e.target.value)}
                placeholder="https://www.empresa.com.br"
              />
            </div>
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle>Endereço</CardTitle>
            <CardDescription>
              Endereço completo do fornecedor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
              <div className="col-span-2 md:col-span-3 space-y-2">
                <Label htmlFor="address_street">Logradouro</Label>
                <Input
                  id="address_street"
                  value={formData.address_street}
                  onChange={(e) => updateField('address_street', e.target.value)}
                  placeholder="Rua das Flores"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address_number">Número</Label>
                <Input
                  id="address_number"
                  value={formData.address_number}
                  onChange={(e) => updateField('address_number', e.target.value)}
                  placeholder="123"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address_complement">Complemento</Label>
                <Input
                  id="address_complement"
                  value={formData.address_complement}
                  onChange={(e) => updateField('address_complement', e.target.value)}
                  placeholder="Sala 101"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address_neighborhood">Bairro</Label>
                <Input
                  id="address_neighborhood"
                  value={formData.address_neighborhood}
                  onChange={(e) => updateField('address_neighborhood', e.target.value)}
                  placeholder="Centro"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address_city">Cidade</Label>
                <Input
                  id="address_city"
                  value={formData.address_city}
                  onChange={(e) => updateField('address_city', e.target.value)}
                  placeholder="São Paulo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address_state">Estado</Label>
                <Select
                  value={formData.address_state}
                  onValueChange={(value) => updateField('address_state', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRAZILIAN_STATES.map((state) => (
                      <SelectItem key={state.value} value={state.value}>
                        {state.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address_postal_code">CEP</Label>
                <Input
                  id="address_postal_code"
                  value={formData.address_postal_code}
                  onChange={(e) => updateField('address_postal_code', e.target.value)}
                  placeholder="00000-000"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Banking Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Bancárias</CardTitle>
            <CardDescription>
              Dados para pagamentos ao fornecedor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank_name">Banco</Label>
                <Input
                  id="bank_name"
                  value={formData.bank_name}
                  onChange={(e) => updateField('bank_name', e.target.value)}
                  placeholder="Banco do Brasil"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_branch">Agência</Label>
                <Input
                  id="bank_branch"
                  value={formData.bank_branch}
                  onChange={(e) => updateField('bank_branch', e.target.value)}
                  placeholder="1234"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank_account">Conta</Label>
                <Input
                  id="bank_account"
                  value={formData.bank_account}
                  onChange={(e) => updateField('bank_account', e.target.value)}
                  placeholder="12345-6"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_account_type">Tipo de Conta</Label>
                <Select
                  value={formData.bank_account_type}
                  onValueChange={(value) => updateField('bank_account_type', value as 'checking' | 'savings')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checking">Conta Corrente</SelectItem>
                    <SelectItem value="savings">Conta Poupança</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pix_key">Chave PIX</Label>
              <Input
                id="pix_key"
                value={formData.pix_key}
                onChange={(e) => updateField('pix_key', e.target.value)}
                placeholder="E-mail, telefone, CPF/CNPJ ou chave aleatória"
              />
              <p className="text-sm text-gray-500">Facilita pagamentos instantâneos via PIX</p>
            </div>
          </CardContent>
        </Card>

        {/* Business Terms */}
        <Card>
          <CardHeader>
            <CardTitle>Termos Comerciais</CardTitle>
            <CardDescription>
              Condições de pagamento e informações fiscais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment_terms">Prazo de Pagamento (dias)</Label>
                <Input
                  id="payment_terms"
                  type="number"
                  min="0"
                  value={formData.payment_terms || ''}
                  onChange={(e) => updateField('payment_terms', e.target.value ? parseInt(e.target.value) : undefined)}
                  className={errors.payment_terms ? 'border-red-500' : ''}
                  placeholder="30"
                />
                {errors.payment_terms && (
                  <p className="text-sm text-red-600">{errors.payment_terms}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax_rate">Taxa de Retenção (%)</Label>
                <Input
                  id="tax_rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.tax_rate || ''}
                  onChange={(e) => updateField('tax_rate', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className={errors.tax_rate ? 'border-red-500' : ''}
                  placeholder="0.00"
                />
                {errors.tax_rate && (
                  <p className="text-sm text-red-600">{errors.tax_rate}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_recurring"
                checked={formData.is_recurring}
                onChange={(e) => updateField('is_recurring', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <Label htmlFor="is_recurring">Fornecedor com pagamentos recorrentes</Label>
            </div>
            <p className="text-sm text-gray-500 ml-6">
              Marque esta opção para fornecedores com faturas mensais ou regulares
            </p>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Informações adicionais sobre o fornecedor..."
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
            {isLoading ? 'Salvando...' : (mode === 'create' ? 'Cadastrar Fornecedor' : 'Salvar Alterações')}
          </Button>
        </div>
      </form>
    </div>
  )
}