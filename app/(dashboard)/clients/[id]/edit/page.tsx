'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/use-auth'
import { clientService, Client, ClientFormData } from '@/lib/clients/client-service'
import { 
  ArrowLeftIcon,
  UserIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  MapPinIcon,
  PhoneIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

// Mock data for development
const mockClientTypes = [
  { id: '1', name: 'Pessoa Física', code: 'PF', category: 'pessoa_fisica', default_hourly_rate: 250.00 },
  { id: '2', name: 'Pessoa Jurídica', code: 'PJ', category: 'pessoa_juridica', default_hourly_rate: 400.00 },
  { id: '3', name: 'Cliente VIP', code: 'VIP', category: 'pessoa_fisica', default_hourly_rate: 350.00 },
  { id: '4', name: 'Corporativo', code: 'CORP', category: 'pessoa_juridica', default_hourly_rate: 500.00 }
]

const mockRelationshipManagers = [
  { id: '1', name: 'Maria Silva Santos', role: 'Advogada Sênior' },
  { id: '2', name: 'João Santos Oliveira', role: 'Advogado Pleno' },
  { id: '3', name: 'Carlos Mendes Lima', role: 'Advogado Júnior' }
]

const brazilianStates = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

const statusOptions = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'potencial', label: 'Potencial' },
  { value: 'inativo', label: 'Inativo' },
  { value: 'suspenso', label: 'Suspenso' }
]

const maritalStatusOptions = [
  { value: 'solteiro', label: 'Solteiro(a)' },
  { value: 'casado', label: 'Casado(a)' },
  { value: 'divorciado', label: 'Divorciado(a)' },
  { value: 'viuvo', label: 'Viúvo(a)' },
  { value: 'uniao_estavel', label: 'União Estável' }
]

const paymentMethodOptions = [
  { value: 'pix', label: 'PIX' },
  { value: 'ted', label: 'TED' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'cartao', label: 'Cartão' },
  { value: 'dinheiro', label: 'Dinheiro' }
]

// Mock client data for editing
const getMockClient = (id: string) => {
  const clients = {
    '1': {
      id: '1',
      client_number: 'CLI-2024-001',
      type: 'pessoa_fisica',
      name: 'João Silva Santos',
      legal_name: '',
      trade_name: '',
      client_type_id: '1',
      status: 'ativo',
      cpf: '123.456.789-00',
      cnpj: '',
      rg: '12.345.678-9',
      ie: '',
      im: '',
      email: 'joao.silva@email.com',
      phone: '(11) 3456-7890',
      mobile: '(11) 9 8765-4321',
      whatsapp: '(11) 9 8765-4321',
      website: '',
      address_street: 'Rua das Flores',
      address_number: '123',
      address_complement: 'Apto 45',
      address_neighborhood: 'Centro',
      address_city: 'São Paulo',
      address_state: 'SP',
      address_zipcode: '01234-567',
      industry: '',
      company_size: '',
      annual_revenue: '',
      birth_date: '1985-06-15',
      marital_status: 'casado',
      profession: 'Engenheiro',
      nationality: 'Brasileira',
      emergency_contact_name: 'Maria Silva Santos',
      emergency_contact_phone: '(11) 9 1234-5678',
      emergency_contact_relationship: 'Esposa',
      portal_enabled: true,
      source: 'Indicação',
      referred_by: 'Dr. Carlos Mendes',
      relationship_manager_id: '1',
      credit_limit: 10000.00,
      payment_terms: 30,
      preferred_payment_method: 'pix',
      billing_address_same_as_main: true,
      billing_street: '',
      billing_number: '',
      billing_complement: '',
      billing_neighborhood: '',
      billing_city: '',
      billing_state: 'SP',
      billing_zipcode: '',
      client_since: '2024-01-15',
      notes: 'Cliente pontual e organizado',
      internal_notes: 'Preferência por atendimento matinal'
    },
    '3': {
      id: '3',
      client_number: 'CLI-2024-003',
      type: 'pessoa_juridica',
      name: 'Empresa ABC Ltda',
      legal_name: 'ABC Comércio e Serviços Ltda',
      trade_name: 'ABC Store',
      client_type_id: '2',
      status: 'ativo',
      cpf: '',
      cnpj: '12.345.678/0001-90',
      rg: '',
      ie: '123.456.789',
      im: '987654321',
      email: 'contato@empresaabc.com.br',
      phone: '(11) 3456-7890',
      mobile: '(11) 9 8765-4321',
      whatsapp: '(11) 9 8765-4321',
      website: 'www.empresaabc.com.br',
      address_street: 'Avenida Paulista',
      address_number: '1000',
      address_complement: 'Sala 1001',
      address_neighborhood: 'Bela Vista',
      address_city: 'São Paulo',
      address_state: 'SP',
      address_zipcode: '01310-100',
      industry: 'Comércio Varejista',
      company_size: 'Média',
      annual_revenue: 5000000.00,
      birth_date: '',
      marital_status: '',
      profession: '',
      nationality: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      emergency_contact_relationship: '',
      portal_enabled: true,
      source: 'Website',
      referred_by: '',
      relationship_manager_id: '1',
      credit_limit: 50000.00,
      payment_terms: 30,
      preferred_payment_method: 'boleto',
      billing_address_same_as_main: true,
      billing_street: '',
      billing_number: '',
      billing_complement: '',
      billing_neighborhood: '',
      billing_city: '',
      billing_state: 'SP',
      billing_zipcode: '',
      client_since: '2023-12-10',
      notes: 'Empresa em crescimento acelerado',
      internal_notes: 'Potencial para contrato anual'
    }
  }
  
  return clients[id as keyof typeof clients] || null
}

export default function EditClientPage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string
  const { profile } = useAuth()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  
  const [formData, setFormData] = useState<Client | null>(null)

  useEffect(() => {
    const loadClient = async () => {
      if (!clientId) {
        router.push('/clients')
        return
      }
      
      try {
        setIsLoading(true)
        const client = await clientService.getClient(clientId)
        
        if (client) {
          setFormData(client)
        } else {
          router.push('/clients')
        }
      } catch (error) {
        console.error('Error loading client:', error)
        setErrors({ load: 'Erro ao carregar dados do cliente' })
        router.push('/clients')
      } finally {
        setIsLoading(false)
      }
    }

    loadClient()
  }, [clientId, router])

  if (isLoading || !formData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dados do cliente...</p>
        </div>
      </div>
    )
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }))
  }

  const handleTypeChange = (newType: string) => {
    setFormData(prev => ({
      ...prev,
      type: newType,
      // Clear fields that don't apply to the new type
      ...(newType === 'pessoa_fisica' 
        ? { cnpj: '', ie: '', im: '', legal_name: '', trade_name: '', industry: '', company_size: '', annual_revenue: '' }
        : { cpf: '', rg: '', birth_date: '', marital_status: '', profession: '', emergency_contact_name: '', emergency_contact_phone: '', emergency_contact_relationship: '' }
      )
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Basic validation
    if (!formData.name?.trim()) {
      newErrors.name = 'Nome é obrigatório'
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'E-mail é obrigatório'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'E-mail inválido'
    }

    if (!formData.client_type_id) {
      newErrors.client_type_id = 'Tipo de cliente é obrigatório'
    }

    // Type-specific validation
    if (formData.type === 'pessoa_fisica') {
      if (!formData.cpf?.trim()) {
        newErrors.cpf = 'CPF é obrigatório para pessoa física'
      }
    } else if (formData.type === 'pessoa_juridica') {
      if (!formData.cnpj?.trim()) {
        newErrors.cnpj = 'CNPJ é obrigatório para pessoa jurídica'
      }
      if (!formData.legal_name?.trim()) {
        newErrors.legal_name = 'Razão social é obrigatória para pessoa jurídica'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Prepare client data for database
      const updateData: Partial<ClientFormData> = {
        name: formData.name.trim(),
        type: formData.type,
        email: formData.email.trim(),
        phone: formData.phone || undefined,
        mobile: formData.mobile || undefined,
        status: formData.status,
        address_street: formData.address_street || undefined,
        address_number: formData.address_number || undefined,
        address_city: formData.address_city || undefined,
        address_state: formData.address_state || undefined,
        address_zipcode: formData.address_zipcode || undefined,
        notes: formData.notes || undefined,
        portal_enabled: formData.portal_enabled
      }

      // Add type-specific fields
      if (formData.type === 'pessoa_fisica') {
        updateData.cpf = formData.cpf?.trim()
      } else {
        updateData.cnpj = formData.cnpj?.trim()
      }

      // Update client in database
      await clientService.updateClient(clientId, updateData)
      
      router.push(`/clients/${clientId}`)
    } catch (error) {
      console.error('Error updating client:', error)
      setErrors({ submit: 'Erro ao atualizar cliente. Tente novamente.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      // Delete client from database (soft delete)
      await clientService.deleteClient(clientId)
      
      router.push('/clients')
    } catch (error) {
      console.error('Error deleting client:', error)
      setErrors({ delete: 'Erro ao excluir cliente. Tente novamente.' })
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  // Document formatting functions
  const formatCPF = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  const formatCNPJ = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, '($1) $2 $3-$4')
    } else if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    }
    return value
  }

  const formatCEP = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2')
  }

  const formatCurrency = (value: string) => {
    const number = parseFloat(value.replace(/[^\d]/g, '')) / 100
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(number || 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-3">
            <Link
              href={`/clients/${clientId}`}
              className="text-gray-400 hover:text-gray-600"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Editar Cliente</h1>
              <p className="mt-1 text-gray-600">
                {formData.client_number} - {formData.name}
              </p>
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <TrashIcon className="-ml-1 mr-2 h-4 w-4" />
            Excluir
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <UserIcon className="h-5 w-5 mr-2 text-blue-600" />
              Informações Básicas
            </h3>
          </div>
          <div className="px-6 py-4 space-y-4">
            {/* Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Cliente
              </label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => handleTypeChange('pessoa_fisica')}
                  className={`flex-1 p-4 border-2 rounded-lg text-center transition-colors ${
                    formData.type === 'pessoa_fisica'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <UserIcon className="h-6 w-6 mx-auto mb-2" />
                  <div className="font-medium">Pessoa Física</div>
                  <div className="text-sm text-gray-500">Indivíduo/CPF</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('pessoa_juridica')}
                  className={`flex-1 p-4 border-2 rounded-lg text-center transition-colors ${
                    formData.type === 'pessoa_juridica'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <BuildingOfficeIcon className="h-6 w-6 mx-auto mb-2" />
                  <div className="font-medium">Pessoa Jurídica</div>
                  <div className="text-sm text-gray-500">Empresa/CNPJ</div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  {formData.type === 'pessoa_fisica' ? 'Nome Completo' : 'Nome da Empresa'}*
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${
                    errors.name ? 'border-red-300' : ''
                  }`}
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              {formData.type === 'pessoa_juridica' && (
                <div>
                  <label htmlFor="legal_name" className="block text-sm font-medium text-gray-700">
                    Razão Social*
                  </label>
                  <input
                    type="text"
                    id="legal_name"
                    name="legal_name"
                    value={formData.legal_name}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${
                      errors.legal_name ? 'border-red-300' : ''
                    }`}
                  />
                  {errors.legal_name && <p className="mt-1 text-sm text-red-600">{errors.legal_name}</p>}
                </div>
              )}

              {formData.type === 'pessoa_juridica' && (
                <div>
                  <label htmlFor="trade_name" className="block text-sm font-medium text-gray-700">
                    Nome Fantasia
                  </label>
                  <input
                    type="text"
                    id="trade_name"
                    name="trade_name"
                    value={formData.trade_name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
              )}

              <div>
                <label htmlFor="client_type_id" className="block text-sm font-medium text-gray-700">
                  Categoria*
                </label>
                <select
                  id="client_type_id"
                  name="client_type_id"
                  value={formData.client_type_id}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${
                    errors.client_type_id ? 'border-red-300' : ''
                  }`}
                >
                  <option value="">Selecione o tipo</option>
                  {mockClientTypes
                    .filter(type => type.category === formData.type)
                    .map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name} - R$ {type.default_hourly_rate.toFixed(2)}/h
                      </option>
                    ))}
                </select>
                {errors.client_type_id && <p className="mt-1 text-sm text-red-600">{errors.client_type_id}</p>}
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Documentation */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <DocumentTextIcon className="h-5 w-5 mr-2 text-green-600" />
              Documentação
            </h3>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.type === 'pessoa_fisica' ? (
                <>
                  <div>
                    <label htmlFor="cpf" className="block text-sm font-medium text-gray-700">
                      CPF*
                    </label>
                    <input
                      type="text"
                      id="cpf"
                      name="cpf"
                      value={formData.cpf}
                      onChange={(e) => {
                        const formatted = formatCPF(e.target.value)
                        setFormData(prev => ({ ...prev, cpf: formatted }))
                      }}
                      maxLength={14}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${
                        errors.cpf ? 'border-red-300' : ''
                      }`}
                      placeholder="000.000.000-00"
                    />
                    {errors.cpf && <p className="mt-1 text-sm text-red-600">{errors.cpf}</p>}
                  </div>

                  <div>
                    <label htmlFor="rg" className="block text-sm font-medium text-gray-700">
                      RG
                    </label>
                    <input
                      type="text"
                      id="rg"
                      name="rg"
                      value={formData.rg}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      placeholder="12.345.678-9"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700">
                      CNPJ*
                    </label>
                    <input
                      type="text"
                      id="cnpj"
                      name="cnpj"
                      value={formData.cnpj}
                      onChange={(e) => {
                        const formatted = formatCNPJ(e.target.value)
                        setFormData(prev => ({ ...prev, cnpj: formatted }))
                      }}
                      maxLength={18}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${
                        errors.cnpj ? 'border-red-300' : ''
                      }`}
                      placeholder="00.000.000/0000-00"
                    />
                    {errors.cnpj && <p className="mt-1 text-sm text-red-600">{errors.cnpj}</p>}
                  </div>

                  <div>
                    <label htmlFor="ie" className="block text-sm font-medium text-gray-700">
                      Inscrição Estadual
                    </label>
                    <input
                      type="text"
                      id="ie"
                      name="ie"
                      value={formData.ie}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="im" className="block text-sm font-medium text-gray-700">
                      Inscrição Municipal
                    </label>
                    <input
                      type="text"
                      id="im"
                      name="im"
                      value={formData.im}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <PhoneIcon className="h-5 w-5 mr-2 text-purple-600" />
              Informações de Contato
            </h3>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  E-mail*
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${
                    errors.email ? 'border-red-300' : ''
                  }`}
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Telefone
                </label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => {
                    const formatted = formatPhone(e.target.value)
                    setFormData(prev => ({ ...prev, phone: formatted }))
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  placeholder="(11) 3456-7890"
                />
              </div>

              <div>
                <label htmlFor="mobile" className="block text-sm font-medium text-gray-700">
                  Celular
                </label>
                <input
                  type="text"
                  id="mobile"
                  name="mobile"
                  value={formData.mobile}
                  onChange={(e) => {
                    const formatted = formatPhone(e.target.value)
                    setFormData(prev => ({ ...prev, mobile: formatted }))
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  placeholder="(11) 9 8765-4321"
                />
              </div>

              <div>
                <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700">
                  WhatsApp
                </label>
                <input
                  type="text"
                  id="whatsapp"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={(e) => {
                    const formatted = formatPhone(e.target.value)
                    setFormData(prev => ({ ...prev, whatsapp: formatted }))
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  placeholder="(11) 9 8765-4321"
                />
              </div>

              {formData.type === 'pessoa_juridica' && (
                <div className="md:col-span-2">
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                    Website
                  </label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    placeholder="https://www.empresa.com.br"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <MapPinIcon className="h-5 w-5 mr-2 text-red-600" />
              Endereço
            </h3>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="address_street" className="block text-sm font-medium text-gray-700">
                  Logradouro
                </label>
                <input
                  type="text"
                  id="address_street"
                  name="address_street"
                  value={formData.address_street}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  placeholder="Rua, Avenida, etc."
                />
              </div>

              <div>
                <label htmlFor="address_number" className="block text-sm font-medium text-gray-700">
                  Número
                </label>
                <input
                  type="text"
                  id="address_number"
                  name="address_number"
                  value={formData.address_number}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="address_complement" className="block text-sm font-medium text-gray-700">
                  Complemento
                </label>
                <input
                  type="text"
                  id="address_complement"
                  name="address_complement"
                  value={formData.address_complement}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  placeholder="Apto, Sala, etc."
                />
              </div>

              <div>
                <label htmlFor="address_neighborhood" className="block text-sm font-medium text-gray-700">
                  Bairro
                </label>
                <input
                  type="text"
                  id="address_neighborhood"
                  name="address_neighborhood"
                  value={formData.address_neighborhood}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="address_city" className="block text-sm font-medium text-gray-700">
                  Cidade
                </label>
                <input
                  type="text"
                  id="address_city"
                  name="address_city"
                  value={formData.address_city}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="address_state" className="block text-sm font-medium text-gray-700">
                  Estado
                </label>
                <select
                  id="address_state"
                  name="address_state"
                  value={formData.address_state}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                >
                  {brazilianStates.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="address_zipcode" className="block text-sm font-medium text-gray-700">
                  CEP
                </label>
                <input
                  type="text"
                  id="address_zipcode"
                  name="address_zipcode"
                  value={formData.address_zipcode}
                  onChange={(e) => {
                    const formatted = formatCEP(e.target.value)
                    setFormData(prev => ({ ...prev, address_zipcode: formatted }))
                  }}
                  maxLength={9}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  placeholder="00000-000"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Personal/Business Information */}
        {formData.type === 'pessoa_fisica' ? (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <UserIcon className="h-5 w-5 mr-2 text-indigo-600" />
                Informações Pessoais
              </h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    id="birth_date"
                    name="birth_date"
                    value={formData.birth_date}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="marital_status" className="block text-sm font-medium text-gray-700">
                    Estado Civil
                  </label>
                  <select
                    id="marital_status"
                    name="marital_status"
                    value={formData.marital_status}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  >
                    <option value="">Selecione</option>
                    {maritalStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="profession" className="block text-sm font-medium text-gray-700">
                    Profissão
                  </label>
                  <input
                    type="text"
                    id="profession"
                    name="profession"
                    value={formData.profession}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">Contato de Emergência</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="emergency_contact_name" className="block text-sm font-medium text-gray-700">
                      Nome
                    </label>
                    <input
                      type="text"
                      id="emergency_contact_name"
                      name="emergency_contact_name"
                      value={formData.emergency_contact_name}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="emergency_contact_phone" className="block text-sm font-medium text-gray-700">
                      Telefone
                    </label>
                    <input
                      type="text"
                      id="emergency_contact_phone"
                      name="emergency_contact_phone"
                      value={formData.emergency_contact_phone}
                      onChange={(e) => {
                        const formatted = formatPhone(e.target.value)
                        setFormData(prev => ({ ...prev, emergency_contact_phone: formatted }))
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      placeholder="(11) 9 1234-5678"
                    />
                  </div>

                  <div>
                    <label htmlFor="emergency_contact_relationship" className="block text-sm font-medium text-gray-700">
                      Relacionamento
                    </label>
                    <input
                      type="text"
                      id="emergency_contact_relationship"
                      name="emergency_contact_relationship"
                      value={formData.emergency_contact_relationship}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      placeholder="Cônjuge, Filho, etc."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <BuildingOfficeIcon className="h-5 w-5 mr-2 text-indigo-600" />
                Informações Empresariais
              </h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
                    Setor
                  </label>
                  <input
                    type="text"
                    id="industry"
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    placeholder="Tecnologia, Comércio, etc."
                  />
                </div>

                <div>
                  <label htmlFor="company_size" className="block text-sm font-medium text-gray-700">
                    Porte da Empresa
                  </label>
                  <select
                    id="company_size"
                    name="company_size"
                    value={formData.company_size}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  >
                    <option value="">Selecione</option>
                    <option value="MEI">MEI</option>
                    <option value="Microempresa">Microempresa</option>
                    <option value="Pequena">Pequena</option>
                    <option value="Média">Média</option>
                    <option value="Grande">Grande</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="annual_revenue" className="block text-sm font-medium text-gray-700">
                    Faturamento Anual
                  </label>
                  <input
                    type="text"
                    id="annual_revenue"
                    name="annual_revenue"
                    value={formData.annual_revenue ? formatCurrency(formData.annual_revenue.toString()) : ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d]/g, '')
                      setFormData(prev => ({ ...prev, annual_revenue: value ? parseFloat(value) / 100 : '' }))
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    placeholder="R$ 0,00"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Financial Information */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <CurrencyDollarIcon className="h-5 w-5 mr-2 text-yellow-600" />
              Informações Financeiras
            </h3>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="relationship_manager_id" className="block text-sm font-medium text-gray-700">
                  Responsável pela Conta
                </label>
                <select
                  id="relationship_manager_id"
                  name="relationship_manager_id"
                  value={formData.relationship_manager_id}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                >
                  <option value="">Selecione um responsável</option>
                  {mockRelationshipManagers.map((manager) => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name} - {manager.role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="preferred_payment_method" className="block text-sm font-medium text-gray-700">
                  Método de Pagamento Preferido
                </label>
                <select
                  id="preferred_payment_method"
                  name="preferred_payment_method"
                  value={formData.preferred_payment_method}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                >
                  <option value="">Selecione</option>
                  {paymentMethodOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="credit_limit" className="block text-sm font-medium text-gray-700">
                  Limite de Crédito
                </label>
                <input
                  type="text"
                  id="credit_limit"
                  name="credit_limit"
                  value={formData.credit_limit ? formatCurrency(formData.credit_limit.toString()) : ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d]/g, '')
                    setFormData(prev => ({ ...prev, credit_limit: value ? parseFloat(value) / 100 : '' }))
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  placeholder="R$ 0,00"
                />
              </div>

              <div>
                <label htmlFor="payment_terms" className="block text-sm font-medium text-gray-700">
                  Prazo de Pagamento (dias)
                </label>
                <input
                  type="number"
                  id="payment_terms"
                  name="payment_terms"
                  value={formData.payment_terms}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  min="1"
                  max="365"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="source" className="block text-sm font-medium text-gray-700">
                  Como nos conheceu
                </label>
                <input
                  type="text"
                  id="source"
                  name="source"
                  value={formData.source}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  placeholder="Google, Indicação, etc."
                />
              </div>

              <div>
                <label htmlFor="referred_by" className="block text-sm font-medium text-gray-700">
                  Indicado por
                </label>
                <input
                  type="text"
                  id="referred_by"
                  name="referred_by"
                  value={formData.referred_by}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Portal Access */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <CheckCircleIcon className="h-5 w-5 mr-2 text-green-600" />
              Acesso ao Portal
            </h3>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div className="flex items-center">
              <input
                id="portal_enabled"
                name="portal_enabled"
                type="checkbox"
                checked={formData.portal_enabled}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="portal_enabled" className="ml-2 block text-sm text-gray-900">
                Habilitar acesso ao portal do cliente
              </label>
            </div>
            <p className="text-sm text-gray-500">
              Quando habilitado, o cliente poderá acessar o portal para visualizar seus casos, documentos e faturas.
            </p>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Observações</h3>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notas Gerais
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                placeholder="Informações adicionais sobre o cliente..."
              />
            </div>

            <div>
              <label htmlFor="internal_notes" className="block text-sm font-medium text-gray-700">
                Notas Internas
                <span className="text-xs text-gray-500 ml-1">(não visível para o cliente)</span>
              </label>
              <textarea
                id="internal_notes"
                name="internal_notes"
                rows={3}
                value={formData.internal_notes}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                placeholder="Informações internas sobre o cliente..."
              />
            </div>
          </div>
        </div>

        {/* Error Display */}
        {(errors.submit || errors.delete) && (
          <div className="bg-red-50 border border-red-300 rounded-md p-4">
            <p className="text-sm text-red-600">
              {errors.submit || errors.delete}
            </p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-3">
          <Link
            href={`/clients/${clientId}`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </>
            ) : (
              <>
                <CheckCircleIcon className="-ml-1 mr-2 h-4 w-4" />
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-600" />
              <h3 className="text-lg font-medium text-gray-900 mt-4">Confirmar Exclusão</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.
                </p>
                <p className="text-sm font-medium text-gray-900 mt-2">
                  {formData.name} ({formData.client_number})
                </p>
              </div>
              <div className="flex justify-center space-x-3 mt-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  disabled={isDeleting}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? 'Excluindo...' : 'Excluir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}