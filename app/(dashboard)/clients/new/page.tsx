'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/use-auth'
import { useAuthContext } from '@/lib/providers/auth-provider'
import { useEffectiveLawFirmId } from '@/lib/hooks/use-effective-law-firm-id'
import { clientService, ClientFormData } from '@/lib/clients/client-service'
import { useMatterTypes } from '@/lib/queries/useSettings'
import { useUsers } from '@/lib/queries/useAdmin'
import { 
  ArrowLeftIcon,
  UserIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  MapPinIcon,
  PhoneIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

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

export default function NewClientPage() {
  const router = useRouter()
  const { profile } = useAuth()
  const { profile: authProfile } = useAuthContext()
  const effectiveLawFirmId = useEffectiveLawFirmId()
  const { data: matterTypes } = useMatterTypes()
  const { data: lawyers } = useUsers(effectiveLawFirmId, { user_type: 'lawyer' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    // Basic Information
    type: 'pessoa_fisica', // Default to pessoa física
    name: '',
    legal_name: '',
    trade_name: '',
    client_type_id: '',
    status: 'ativo',
    
    // Brazilian Documentation
    cpf: '',
    cnpj: '',
    rg: '',
    ie: '',
    im: '',
    
    // Contact Information
    email: '',
    phone: '',
    mobile: '',
    whatsapp: '',
    website: '',
    
    // Address Information
    address_street: '',
    address_number: '',
    address_complement: '',
    address_neighborhood: '',
    address_city: '',
    address_state: 'SP',
    address_zipcode: '',
    
    // Professional Information (for companies)
    industry: '',
    company_size: '',
    annual_revenue: '',
    
    // Personal Information (for individuals)
    birth_date: '',
    marital_status: '',
    profession: '',
    nationality: 'Brasileira',
    
    // Emergency Contact
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    
    // Portal Access
    portal_enabled: false,
    
    // Client Relationship
    source: '',
    referred_by: '',
    relationship_manager_id: '',
    
    // Financial Information
    credit_limit: '',
    payment_terms: '30',
    preferred_payment_method: 'pix',
    billing_address_same_as_main: true,
    
    // Billing Address (if different)
    billing_street: '',
    billing_number: '',
    billing_complement: '',
    billing_neighborhood: '',
    billing_city: '',
    billing_state: 'SP',
    billing_zipcode: '',
    
    // Notes
    notes: '',
    internal_notes: ''
  })

  const [errors, setErrors] = useState({})

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleClientTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const typeId = e.target.value
    setFormData(prev => ({
      ...prev,
      client_type_id: typeId
    }))
  }

  const handlePersonTypeChange = (e) => {
    const personType = e.target.value
    setFormData(prev => ({
      ...prev,
      type: personType,
      // Clear opposite type fields
      ...(personType === 'pessoa_fisica' ? {
        legal_name: '',
        trade_name: '',
        cnpj: '',
        ie: '',
        im: '',
        industry: '',
        company_size: '',
        annual_revenue: ''
      } : {
        cpf: '',
        rg: '',
        birth_date: '',
        marital_status: '',
        profession: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        emergency_contact_relationship: ''
      })
    }))
  }

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
  }

  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
  }

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4,5})(\d{4})/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1')
  }

  const formatZipCode = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{3})\d+?$/, '$1')
  }

  const handleFormattedInputChange = (e, formatter) => {
    const { name, value } = e.target
    const formattedValue = formatter(value)
    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }))
  }

  const validateForm = () => {
    const newErrors = {}

    // Required fields
    if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório'
    if (!formData.email.trim()) newErrors.email = 'E-mail é obrigatório'
    if (!formData.relationship_manager_id) newErrors.relationship_manager_id = 'Responsável é obrigatório'

    // Type-specific validation
    if (formData.type === 'pessoa_fisica') {
      if (!formData.cpf.trim()) newErrors.cpf = 'CPF é obrigatório'
    } else {
      if (!formData.cnpj.trim()) newErrors.cnpj = 'CNPJ é obrigatório'
      if (!formData.legal_name.trim()) newErrors.legal_name = 'Razão social é obrigatória'
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'E-mail inválido'
    }

    // Numeric validations
    if (formData.credit_limit && isNaN(parseFloat(formData.credit_limit))) {
      newErrors.credit_limit = 'Limite de crédito deve ser numérico'
    }
    if (formData.annual_revenue && isNaN(parseFloat(formData.annual_revenue))) {
      newErrors.annual_revenue = 'Faturamento deve ser numérico'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    if (!effectiveLawFirmId) {
      setErrors({ submit: 'Erro: Escritório não identificado' })
      return
    }

    setIsSubmitting(true)

    try {
      // Prepare client data for database
      const clientData: ClientFormData = {
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
        clientData.cpf = formData.cpf.trim()
      } else {
        clientData.cnpj = formData.cnpj.trim()
      }

      // Create client in database
      const newClient = await clientService.createClient(effectiveLawFirmId!, clientData)
      
      // Redirect to clients list with success message
      router.push('/clients?created=true')
      
    } catch (error) {
      console.error('Error creating client:', error)
      setErrors({ submit: 'Erro ao criar cliente. Tente novamente.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/clients"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Voltar para Clientes
          </Link>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Novo Cliente</h1>
        <p className="mt-2 text-gray-600">
          Cadastre um novo cliente no sistema
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-6">
            <UserIcon className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-lg font-medium text-gray-900">Informações Básicas</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Tipo de Pessoa *
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="pessoa_fisica"
                    checked={formData.type === 'pessoa_fisica'}
                    onChange={handlePersonTypeChange}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Pessoa Física</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="pessoa_juridica"
                    checked={formData.type === 'pessoa_juridica'}
                    onChange={handlePersonTypeChange}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Pessoa Jurídica</span>
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                {formData.type === 'pessoa_fisica' ? 'Nome Completo *' : 'Nome Fantasia *'}
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder={formData.type === 'pessoa_fisica' ? 'Ex: João Silva Santos' : 'Ex: Tech Solutions'}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {formData.type === 'pessoa_juridica' && (
              <div>
                <label htmlFor="legal_name" className="block text-sm font-medium text-gray-700">
                  Razão Social *
                </label>
                <input
                  type="text"
                  id="legal_name"
                  name="legal_name"
                  value={formData.legal_name}
                  onChange={handleInputChange}
                  className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${
                    errors.legal_name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Ex: Tech Solutions Ltda"
                />
                {errors.legal_name && <p className="mt-1 text-sm text-red-600">{errors.legal_name}</p>}
              </div>
            )}

            <div>
              <label htmlFor="client_type_id" className="block text-sm font-medium text-gray-700">
                Categoria de Cliente
              </label>
              <select
                id="client_type_id"
                name="client_type_id"
                value={formData.client_type_id}
                onChange={handleClientTypeChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="">Selecione uma categoria</option>
                {(matterTypes || []).map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
              </select>
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
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
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

        {/* Documentation Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-6">
            <DocumentTextIcon className="h-6 w-6 text-green-600 mr-3" />
            <h2 className="text-lg font-medium text-gray-900">Documentação</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {formData.type === 'pessoa_fisica' ? (
              <>
                <div>
                  <label htmlFor="cpf" className="block text-sm font-medium text-gray-700">
                    CPF *
                  </label>
                  <input
                    type="text"
                    id="cpf"
                    name="cpf"
                    value={formData.cpf}
                    onChange={(e) => handleFormattedInputChange(e, formatCPF)}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${
                      errors.cpf ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="000.000.000-00"
                    maxLength={14}
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
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    placeholder="Ex: 12.345.678-9"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700">
                    CNPJ *
                  </label>
                  <input
                    type="text"
                    id="cnpj"
                    name="cnpj"
                    value={formData.cnpj}
                    onChange={(e) => handleFormattedInputChange(e, formatCNPJ)}
                    className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${
                      errors.cnpj ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
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
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    placeholder="Ex: 123.456.789.012"
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
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    placeholder="Ex: 12345678"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-6">
            <PhoneIcon className="h-6 w-6 text-purple-600 mr-3" />
            <h2 className="text-lg font-medium text-gray-900">Informações de Contato</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-mail *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="email@exemplo.com"
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
                onChange={(e) => handleFormattedInputChange(e, formatPhone)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
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
                onChange={(e) => handleFormattedInputChange(e, formatPhone)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
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
                onChange={(e) => handleFormattedInputChange(e, formatPhone)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
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
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  placeholder="https://www.exemplo.com.br"
                />
              </div>
            )}
          </div>
        </div>

        {/* Address Information Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-6">
            <MapPinIcon className="h-6 w-6 text-orange-600 mr-3" />
            <h2 className="text-lg font-medium text-gray-900">Endereço</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="address_zipcode" className="block text-sm font-medium text-gray-700">
                CEP
              </label>
              <input
                type="text"
                id="address_zipcode"
                name="address_zipcode"
                value={formData.address_zipcode}
                onChange={(e) => handleFormattedInputChange(e, formatZipCode)}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                placeholder="00000-000"
                maxLength={9}
              />
            </div>

            <div>
              <label htmlFor="address_street" className="block text-sm font-medium text-gray-700">
                Logradouro
              </label>
              <input
                type="text"
                id="address_street"
                name="address_street"
                value={formData.address_street}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                placeholder="Ex: Rua das Flores"
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
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                placeholder="Ex: 123"
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
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                placeholder="Ex: Apto 45"
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
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                placeholder="Ex: Centro"
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
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                placeholder="Ex: São Paulo"
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
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                {brazilianStates.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Type-specific sections */}
        {formData.type === 'pessoa_fisica' ? (
          // Personal Information Section
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-6">
              <UserIcon className="h-6 w-6 text-indigo-600 mr-3" />
              <h2 className="text-lg font-medium text-gray-900">Informações Pessoais</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
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
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
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
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  placeholder="Ex: Engenheiro"
                />
              </div>

              <div>
                <label htmlFor="nationality" className="block text-sm font-medium text-gray-700">
                  Nacionalidade
                </label>
                <input
                  type="text"
                  id="nationality"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  placeholder="Ex: Brasileira"
                />
              </div>

              <div className="md:col-span-2">
                <h3 className="text-md font-medium text-gray-900 mb-4">Contato de Emergência</h3>
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
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      placeholder="Ex: Maria Silva"
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
                      onChange={(e) => handleFormattedInputChange(e, formatPhone)}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      placeholder="(11) 9 8765-4321"
                    />
                  </div>
                  <div>
                    <label htmlFor="emergency_contact_relationship" className="block text-sm font-medium text-gray-700">
                      Parentesco
                    </label>
                    <input
                      type="text"
                      id="emergency_contact_relationship"
                      name="emergency_contact_relationship"
                      value={formData.emergency_contact_relationship}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      placeholder="Ex: Cônjuge"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Professional Information Section
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-6">
              <BuildingOfficeIcon className="h-6 w-6 text-indigo-600 mr-3" />
              <h2 className="text-lg font-medium text-gray-900">Informações Empresariais</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
                  Ramo de Atividade
                </label>
                <input
                  type="text"
                  id="industry"
                  name="industry"
                  value={formData.industry}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  placeholder="Ex: Tecnologia"
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
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                >
                  <option value="">Selecione</option>
                  <option value="mei">MEI</option>
                  <option value="micro">Microempresa</option>
                  <option value="pequena">Pequena</option>
                  <option value="media">Média</option>
                  <option value="grande">Grande</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="annual_revenue" className="block text-sm font-medium text-gray-700">
                  Faturamento Anual
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">R$</span>
                  </div>
                  <input
                    type="number"
                    id="annual_revenue"
                    name="annual_revenue"
                    value={formData.annual_revenue}
                    onChange={handleInputChange}
                    className={`block w-full pl-10 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${
                      errors.annual_revenue ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="0,00"
                    step="0.01"
                  />
                </div>
                {errors.annual_revenue && <p className="mt-1 text-sm text-red-600">{errors.annual_revenue}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Relationship & Financial Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-6">
            <CurrencyDollarIcon className="h-6 w-6 text-yellow-600 mr-3" />
            <h2 className="text-lg font-medium text-gray-900">Relacionamento e Financeiro</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="relationship_manager_id" className="block text-sm font-medium text-gray-700">
                Responsável no Escritório *
              </label>
              <select
                id="relationship_manager_id"
                name="relationship_manager_id"
                value={formData.relationship_manager_id}
                onChange={handleInputChange}
                className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${
                  errors.relationship_manager_id ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Selecione o responsável</option>
                {(lawyers || []).map((lawyer) => (
                  <option key={lawyer.id} value={lawyer.id}>
                    {lawyer.full_name}{lawyer.position ? ` - ${lawyer.position}` : ''}
                  </option>
                ))}
              </select>
              {errors.relationship_manager_id && <p className="mt-1 text-sm text-red-600">{errors.relationship_manager_id}</p>}
            </div>

            <div>
              <label htmlFor="source" className="block text-sm font-medium text-gray-700">
                Como nos Conheceu
              </label>
              <select
                id="source"
                name="source"
                value={formData.source}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="">Selecione</option>
                <option value="google">Google</option>
                <option value="indicacao">Indicação</option>
                <option value="redes_sociais">Redes Sociais</option>
                <option value="site">Site</option>
                <option value="outros">Outros</option>
              </select>
            </div>

            <div>
              <label htmlFor="referred_by" className="block text-sm font-medium text-gray-700">
                Indicado Por
              </label>
              <input
                type="text"
                id="referred_by"
                name="referred_by"
                value={formData.referred_by}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                placeholder="Nome de quem indicou"
              />
            </div>

            <div>
              <label htmlFor="preferred_payment_method" className="block text-sm font-medium text-gray-700">
                Forma de Pagamento Preferida
              </label>
              <select
                id="preferred_payment_method"
                name="preferred_payment_method"
                value={formData.preferred_payment_method}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
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
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">R$</span>
                </div>
                <input
                  type="number"
                  id="credit_limit"
                  name="credit_limit"
                  value={formData.credit_limit}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${
                    errors.credit_limit ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0,00"
                  step="0.01"
                />
              </div>
              {errors.credit_limit && <p className="mt-1 text-sm text-red-600">{errors.credit_limit}</p>}
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
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                placeholder="30"
                min="1"
              />
            </div>
          </div>
        </div>

        {/* Portal Access Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-6">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-3" />
            <h2 className="text-lg font-medium text-gray-900">Acesso ao Portal</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                id="portal_enabled"
                name="portal_enabled"
                type="checkbox"
                checked={formData.portal_enabled}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="portal_enabled" className="ml-2 block text-sm text-gray-900">
                Habilitar acesso ao portal do cliente
              </label>
            </div>
            <p className="text-sm text-gray-500">
              O cliente poderá acessar o portal para acompanhar seus processos e documentos.
            </p>
          </div>
        </div>

        {/* Notes Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Observações</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notas do Cliente
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                value={formData.notes}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                placeholder="Observações visíveis ao cliente..."
              />
            </div>

            <div>
              <label htmlFor="internal_notes" className="block text-sm font-medium text-gray-700">
                Notas Internas
              </label>
              <textarea
                id="internal_notes"
                name="internal_notes"
                rows={4}
                value={formData.internal_notes}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                placeholder="Observações internas (não visíveis ao cliente)..."
              />
            </div>
          </div>
        </div>

        {/* Submit Section */}
        <div className="bg-white shadow rounded-lg p-6">
          {errors.submit && (
            <div className="mb-4 p-4 border border-red-300 rounded-md bg-red-50">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <Link
              href="/clients"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
                isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-primary hover:bg-primary/90'
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Criando...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="-ml-1 mr-2 h-4 w-4" />
                  Criar Cliente
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}