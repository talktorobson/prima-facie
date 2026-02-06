'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeftIcon,
  UserIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

// Mock data - in real app this would come from API
const mockMatter = {
  id: '1',
  matter_number: '2024/001',
  title: 'Ação Trabalhista - Rescisão Indevida',
  description: 'Processo trabalhista referente à rescisão indevida do contrato de trabalho do cliente João Silva Santos. O cliente foi demitido sem justa causa após 5 anos de trabalho na empresa XYZ Ltda.',
  matter_type_id: '1',
  area_juridica: 'Trabalhista',
  
  // Legal Information
  processo_numero: '5001234-20.2024.5.02.0001',
  vara_tribunal: '1ª Vara do Trabalho de São Paulo',
  comarca: 'São Paulo',
  
  // Client Information
  client_id: '1',
  client_name: 'João Silva Santos',
  client_cpf_cnpj: '123.456.789-00',
  
  // Case Details
  opposing_party: 'XYZ Empresa Ltda',
  opposing_party_lawyer: 'José Advocacia & Associados',
  case_value: 25000.00,
  
  // Dates
  opened_date: '2024-01-15',
  statute_limitations: '2026-01-15',
  next_hearing_date: '2024-02-20T14:00:00',
  
  // Status & Workflow
  status: 'ativo',
  priority: 'alta',
  probability_success: 75,
  
  // Assignment
  responsible_lawyer_id: '1',
  
  // Financial
  hourly_rate: 300.00,
  fixed_fee: null,
  retainer_amount: 5000.00,
  billing_method: 'hourly',
  
  // Notes
  internal_notes: 'Cliente relatou que foi demitido logo após solicitar férias. Possível retaliação.',
  next_action: 'Aguardar resposta da empresa à petição inicial. Prazo até 15/02/2024.'
}

// Reuse the same mock data from new matter page
const mockClients = [
  { id: '1', name: 'João Silva Santos', email: 'joao@email.com' },
  { id: '2', name: 'Ana Costa Pereira', email: 'ana@email.com' },
  { id: '3', name: 'Pedro Rodrigues', email: 'pedro@email.com' },
  { id: '4', name: 'Empresa ABC Ltda', email: 'contato@abc.com.br' }
]

const mockLawyers = [
  { id: '1', name: 'Maria Silva Santos', oab: 'OAB/SP 123456' },
  { id: '2', name: 'João Santos Oliveira', oab: 'OAB/SP 654321' },
  { id: '3', name: 'Carlos Mendes Lima', oab: 'OAB/SP 789012' }
]

const mockMatterTypes = [
  { id: '1', name: 'Ação Trabalhista', area: 'Trabalhista', hourly_rate: 300.00 },
  { id: '2', name: 'Ação Civil', area: 'Civil', hourly_rate: 250.00 },
  { id: '3', name: 'Consultoria Empresarial', area: 'Empresarial', hourly_rate: 400.00 },
  { id: '4', name: 'Direito de Família', area: 'Família', hourly_rate: 280.00 }
]

const statusOptions = [
  { value: 'novo', label: 'Novo' },
  { value: 'analise', label: 'Em Análise' },
  { value: 'ativo', label: 'Ativo' },
  { value: 'suspenso', label: 'Suspenso' },
  { value: 'aguardando_cliente', label: 'Aguardando Cliente' },
  { value: 'aguardando_documentos', label: 'Aguardando Documentos' },
  { value: 'finalizado', label: 'Finalizado' },
  { value: 'arquivado', label: 'Arquivado' },
  { value: 'cancelado', label: 'Cancelado' }
]

const priorityOptions = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'media', label: 'Média' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' }
]

const areaJuridicaOptions = [
  'Civil', 'Criminal', 'Trabalhista', 'Empresarial', 'Tributário',
  'Previdenciário', 'Família', 'Consumidor', 'Ambiental', 'Administrativo'
]

const billingMethodOptions = [
  { value: 'hourly', label: 'Por Hora' },
  { value: 'fixed', label: 'Valor Fixo' },
  { value: 'contingency', label: 'Êxito' },
  { value: 'retainer', label: 'Honorários Antecipados' }
]

export default function EditMatterPage() {
  const params = useParams()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  // Initialize form with existing matter data
  const [formData, setFormData] = useState({
    title: mockMatter.title,
    description: mockMatter.description,
    matter_type_id: mockMatter.matter_type_id,
    area_juridica: mockMatter.area_juridica,
    
    // Legal Information
    processo_numero: mockMatter.processo_numero,
    vara_tribunal: mockMatter.vara_tribunal,
    comarca: mockMatter.comarca,
    
    // Client Information
    client_id: mockMatter.client_id,
    client_name: mockMatter.client_name,
    client_cpf_cnpj: mockMatter.client_cpf_cnpj,
    
    // Case Details
    opposing_party: mockMatter.opposing_party,
    opposing_party_lawyer: mockMatter.opposing_party_lawyer,
    case_value: mockMatter.case_value.toString(),
    
    // Dates
    opened_date: mockMatter.opened_date,
    statute_limitations: mockMatter.statute_limitations,
    next_hearing_date: mockMatter.next_hearing_date,
    
    // Status & Workflow
    status: mockMatter.status,
    priority: mockMatter.priority,
    probability_success: mockMatter.probability_success?.toString() || '',
    
    // Assignment
    responsible_lawyer_id: mockMatter.responsible_lawyer_id,
    
    // Financial
    hourly_rate: mockMatter.hourly_rate?.toString() || '',
    fixed_fee: mockMatter.fixed_fee?.toString() || '',
    retainer_amount: mockMatter.retainer_amount?.toString() || '',
    billing_method: mockMatter.billing_method,
    
    // Notes
    internal_notes: mockMatter.internal_notes,
    next_action: mockMatter.next_action
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    // In real app, fetch matter data by ID
    console.log('Loading matter for edit:', params.id)
  }, [params.id])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleMatterTypeChange = (e) => {
    const typeId = e.target.value
    const selectedType = mockMatterTypes.find(type => type.id === typeId)
    
    setFormData(prev => ({
      ...prev,
      matter_type_id: typeId,
      area_juridica: selectedType?.area || '',
      hourly_rate: selectedType?.hourly_rate?.toString() || ''
    }))
  }

  const validateForm = () => {
    const newErrors = {}

    // Required fields
    if (!formData.title.trim()) newErrors.title = 'Título é obrigatório'
    if (!formData.area_juridica) newErrors.area_juridica = 'Área jurídica é obrigatória'
    if (!formData.client_id && !formData.client_name.trim()) {
      newErrors.client_name = 'Cliente é obrigatório'
    }
    if (!formData.responsible_lawyer_id) {
      newErrors.responsible_lawyer_id = 'Advogado responsável é obrigatório'
    }

    // Validate dates
    if (formData.statute_limitations && formData.statute_limitations < formData.opened_date) {
      newErrors.statute_limitations = 'Data de prescrição deve ser posterior à data de abertura'
    }

    // Validate values
    if (formData.case_value && isNaN(parseFloat(formData.case_value))) {
      newErrors.case_value = 'Valor deve ser numérico'
    }
    if (formData.probability_success && (formData.probability_success < 0 || formData.probability_success > 100)) {
      newErrors.probability_success = 'Probabilidade deve estar entre 0 e 100'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Mock submission - in real app, this would call the API
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      console.log('Updating matter with data:', formData)
      
      // Redirect to matter detail with success message
      router.push(`/matters/${params.id}?updated=true`)
      
    } catch (error) {
      console.error('Error updating matter:', error)
      setErrors({ submit: 'Erro ao atualizar processo. Tente novamente.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      // Mock deletion - in real app, this would call the API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log('Deleting matter:', params.id)
      
      // Redirect to matters list with success message
      router.push('/matters?deleted=true')
      
    } catch (error) {
      console.error('Error deleting matter:', error)
      setErrors({ delete: 'Erro ao excluir processo. Tente novamente.' })
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href={`/matters/${params.id}`}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Voltar para Detalhes
          </Link>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Editar Processo - {mockMatter.matter_number}
        </h1>
        <p className="mt-2 text-gray-600">
          Atualize as informações do processo jurídico
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-6">
            <DocumentTextIcon className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-lg font-medium text-gray-900">Informações Básicas</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Título do Processo *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ex: Ação Trabalhista - Rescisão Indevida"
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
            </div>

            <div>
              <label htmlFor="matter_type_id" className="block text-sm font-medium text-gray-700">
                Tipo de Processo
              </label>
              <select
                id="matter_type_id"
                name="matter_type_id"
                value={formData.matter_type_id}
                onChange={handleMatterTypeChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="">Selecione um tipo</option>
                {mockMatterTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} - {type.area}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="area_juridica" className="block text-sm font-medium text-gray-700">
                Área Jurídica *
              </label>
              <select
                id="area_juridica"
                name="area_juridica"
                value={formData.area_juridica}
                onChange={handleInputChange}
                className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${
                  errors.area_juridica ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Selecione a área</option>
                {areaJuridicaOptions.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
              {errors.area_juridica && <p className="mt-1 text-sm text-red-600">{errors.area_juridica}</p>}
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

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                Prioridade
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Descrição
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                placeholder="Descrição detalhada do processo..."
              />
            </div>
          </div>
        </div>

        {/* Legal Information Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-6">
            <ExclamationTriangleIcon className="h-6 w-6 text-orange-600 mr-3" />
            <h2 className="text-lg font-medium text-gray-900">Informações Jurídicas</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="processo_numero" className="block text-sm font-medium text-gray-700">
                Número do Processo
              </label>
              <input
                type="text"
                id="processo_numero"
                name="processo_numero"
                value={formData.processo_numero}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                placeholder="Ex: 5001234-20.2024.5.02.0001"
              />
            </div>

            <div>
              <label htmlFor="vara_tribunal" className="block text-sm font-medium text-gray-700">
                Vara/Tribunal
              </label>
              <input
                type="text"
                id="vara_tribunal"
                name="vara_tribunal"
                value={formData.vara_tribunal}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                placeholder="Ex: 1ª Vara do Trabalho de São Paulo"
              />
            </div>

            <div>
              <label htmlFor="comarca" className="block text-sm font-medium text-gray-700">
                Comarca
              </label>
              <input
                type="text"
                id="comarca"
                name="comarca"
                value={formData.comarca}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                placeholder="Ex: São Paulo"
              />
            </div>

            <div>
              <label htmlFor="case_value" className="block text-sm font-medium text-gray-700">
                Valor da Causa
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">R$</span>
                </div>
                <input
                  type="number"
                  id="case_value"
                  name="case_value"
                  value={formData.case_value}
                  onChange={handleInputChange}
                  className={`block w-full pl-10 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${
                    errors.case_value ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0,00"
                  step="0.01"
                />
              </div>
              {errors.case_value && <p className="mt-1 text-sm text-red-600">{errors.case_value}</p>}
            </div>

            <div>
              <label htmlFor="opposing_party" className="block text-sm font-medium text-gray-700">
                Parte Contrária
              </label>
              <input
                type="text"
                id="opposing_party"
                name="opposing_party"
                value={formData.opposing_party}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                placeholder="Nome da parte contrária"
              />
            </div>

            <div>
              <label htmlFor="opposing_party_lawyer" className="block text-sm font-medium text-gray-700">
                Advogado da Parte Contrária
              </label>
              <input
                type="text"
                id="opposing_party_lawyer"
                name="opposing_party_lawyer"
                value={formData.opposing_party_lawyer}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                placeholder="Nome do advogado da parte contrária"
              />
            </div>

            <div>
              <label htmlFor="probability_success" className="block text-sm font-medium text-gray-700">
                Probabilidade de Êxito (%)
              </label>
              <input
                type="number"
                id="probability_success"
                name="probability_success"
                value={formData.probability_success}
                onChange={handleInputChange}
                className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${
                  errors.probability_success ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0-100"
                min="0"
                max="100"
              />
              {errors.probability_success && <p className="mt-1 text-sm text-red-600">{errors.probability_success}</p>}
            </div>
          </div>
        </div>

        {/* Client Information Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-6">
            <UserIcon className="h-6 w-6 text-green-600 mr-3" />
            <h2 className="text-lg font-medium text-gray-900">Informações do Cliente</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="client_id" className="block text-sm font-medium text-gray-700">
                Cliente Cadastrado
              </label>
              <select
                id="client_id"
                name="client_id"
                value={formData.client_id}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="">Selecione um cliente existente</option>
                {mockClients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} - {client.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="client_name" className="block text-sm font-medium text-gray-700">
                Nome do Cliente *
              </label>
              <input
                type="text"
                id="client_name"
                name="client_name"
                value={formData.client_name}
                onChange={handleInputChange}
                className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${
                  errors.client_name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Nome completo do cliente"
              />
              {errors.client_name && <p className="mt-1 text-sm text-red-600">{errors.client_name}</p>}
            </div>

            <div>
              <label htmlFor="client_cpf_cnpj" className="block text-sm font-medium text-gray-700">
                CPF/CNPJ do Cliente
              </label>
              <input
                type="text"
                id="client_cpf_cnpj"
                name="client_cpf_cnpj"
                value={formData.client_cpf_cnpj}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
              />
            </div>
          </div>
        </div>

        {/* Dates Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-6">
            <CalendarIcon className="h-6 w-6 text-purple-600 mr-3" />
            <h2 className="text-lg font-medium text-gray-900">Datas Importantes</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="opened_date" className="block text-sm font-medium text-gray-700">
                Data de Abertura
              </label>
              <input
                type="date"
                id="opened_date"
                name="opened_date"
                value={formData.opened_date}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label htmlFor="statute_limitations" className="block text-sm font-medium text-gray-700">
                Prazo Prescricional
              </label>
              <input
                type="date"
                id="statute_limitations"
                name="statute_limitations"
                value={formData.statute_limitations}
                onChange={handleInputChange}
                className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${
                  errors.statute_limitations ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.statute_limitations && <p className="mt-1 text-sm text-red-600">{errors.statute_limitations}</p>}
            </div>

            <div>
              <label htmlFor="next_hearing_date" className="block text-sm font-medium text-gray-700">
                Próxima Audiência
              </label>
              <input
                type="datetime-local"
                id="next_hearing_date"
                name="next_hearing_date"
                value={formData.next_hearing_date}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Assignment Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-6">
            <UserIcon className="h-6 w-6 text-indigo-600 mr-3" />
            <h2 className="text-lg font-medium text-gray-900">Atribuição</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            <div>
              <label htmlFor="responsible_lawyer_id" className="block text-sm font-medium text-gray-700">
                Advogado Responsável *
              </label>
              <select
                id="responsible_lawyer_id"
                name="responsible_lawyer_id"
                value={formData.responsible_lawyer_id}
                onChange={handleInputChange}
                className={`mt-1 block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${
                  errors.responsible_lawyer_id ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Selecione o advogado responsável</option>
                {mockLawyers.map((lawyer) => (
                  <option key={lawyer.id} value={lawyer.id}>
                    {lawyer.name} - {lawyer.oab}
                  </option>
                ))}
              </select>
              {errors.responsible_lawyer_id && <p className="mt-1 text-sm text-red-600">{errors.responsible_lawyer_id}</p>}
            </div>
          </div>
        </div>

        {/* Financial Information Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-6">
            <CurrencyDollarIcon className="h-6 w-6 text-yellow-600 mr-3" />
            <h2 className="text-lg font-medium text-gray-900">Informações Financeiras</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="billing_method" className="block text-sm font-medium text-gray-700">
                Método de Cobrança
              </label>
              <select
                id="billing_method"
                name="billing_method"
                value={formData.billing_method}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                {billingMethodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="hourly_rate" className="block text-sm font-medium text-gray-700">
                Valor por Hora
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">R$</span>
                </div>
                <input
                  type="number"
                  id="hourly_rate"
                  name="hourly_rate"
                  value={formData.hourly_rate}
                  onChange={handleInputChange}
                  className="block w-full pl-10 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  placeholder="0,00"
                  step="0.01"
                />
              </div>
            </div>

            <div>
              <label htmlFor="fixed_fee" className="block text-sm font-medium text-gray-700">
                Valor Fixo
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">R$</span>
                </div>
                <input
                  type="number"
                  id="fixed_fee"
                  name="fixed_fee"
                  value={formData.fixed_fee}
                  onChange={handleInputChange}
                  className="block w-full pl-10 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  placeholder="0,00"
                  step="0.01"
                />
              </div>
            </div>

            <div>
              <label htmlFor="retainer_amount" className="block text-sm font-medium text-gray-700">
                Honorários Antecipados
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">R$</span>
                </div>
                <input
                  type="number"
                  id="retainer_amount"
                  name="retainer_amount"
                  value={formData.retainer_amount}
                  onChange={handleInputChange}
                  className="block w-full pl-10 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  placeholder="0,00"
                  step="0.01"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Observações</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                placeholder="Observações internas sobre o processo..."
              />
            </div>

            <div>
              <label htmlFor="next_action" className="block text-sm font-medium text-gray-700">
                Próxima Ação
              </label>
              <textarea
                id="next_action"
                name="next_action"
                rows={4}
                value={formData.next_action}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                placeholder="Descreva a próxima ação a ser tomada..."
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

          {errors.delete && (
            <div className="mb-4 p-4 border border-red-300 rounded-md bg-red-50">
              <p className="text-sm text-red-600">{errors.delete}</p>
            </div>
          )}

          <div className="flex justify-between">
            <div>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Excluir Processo
              </button>
            </div>

            <div className="flex space-x-4">
              <Link
                href={`/matters/${params.id}`}
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
          </div>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Confirmar Exclusão</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Tem certeza que deseja excluir este processo? Esta ação não pode ser desfeita.
                  Todos os dados relacionados serão perdidos permanentemente.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className={`px-4 py-2 text-white text-base font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-300 ${
                      isDeleting
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}