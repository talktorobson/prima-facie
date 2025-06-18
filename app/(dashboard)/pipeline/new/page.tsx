'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeftIcon,
  UserIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  PhoneIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  DocumentTextIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { useAuthContext } from '@/lib/providers/auth-provider'

interface LeadFormData {
  name: string
  email: string
  phone: string
  company: string
  source: string
  legal_area: string
  description: string
  estimated_value: string
  probability: number
  next_action: string
  next_action_date: string
  assigned_lawyer: string
}

const sourceOptions = [
  { value: 'website', label: 'Site' },
  { value: 'referral', label: 'Indicação' },
  { value: 'google', label: 'Google' },
  { value: 'social_media', label: 'Redes Sociais' },
  { value: 'evento', label: 'Evento' },
  { value: 'cold_call', label: 'Cold Call' },
  { value: 'outros', label: 'Outros' }
]

const legalAreaOptions = [
  { value: 'Civil', label: 'Civil' },
  { value: 'Criminal', label: 'Criminal' },
  { value: 'Trabalhista', label: 'Trabalhista' },
  { value: 'Empresarial', label: 'Empresarial' },
  { value: 'Tributário', label: 'Tributário' },
  { value: 'Previdenciário', label: 'Previdenciário' },
  { value: 'Família', label: 'Família' },
  { value: 'Consumidor', label: 'Consumidor' }
]

export default function NewLeadPage() {
  const { profile } = useAuthContext()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<LeadFormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    source: 'website',
    legal_area: 'Civil',
    description: '',
    estimated_value: '',
    probability: 20,
    next_action: '',
    next_action_date: '',
    assigned_lawyer: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória'
    }

    if (formData.estimated_value && isNaN(Number(formData.estimated_value))) {
      newErrors.estimated_value = 'Valor deve ser um número'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // TODO: Implement actual lead creation with Supabase
      // For now, we'll simulate the creation
      console.log('Creating lead:', formData)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Show success message
      alert('Lead criado com sucesso!')
      
      // Redirect back to pipeline
      router.push('/pipeline')
    } catch (error) {
      console.error('Error creating lead:', error)
      alert('Erro ao criar lead. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/pipeline')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/pipeline"
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-1" />
            Voltar para Pipeline
          </Link>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Novo Lead</h1>
        <p className="mt-2 text-gray-600">
          Adicione um novo lead ao pipeline de vendas
        </p>
      </div>

      {/* Form */}
      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Informações Básicas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nome *
                </label>
                <div className="mt-1 relative">
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Nome completo do lead"
                  />
                  <UserIcon className="absolute right-3 top-2 h-5 w-5 text-gray-400" />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email *
                </label>
                <div className="mt-1 relative">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="email@exemplo.com"
                  />
                  <EnvelopeIcon className="absolute right-3 top-2 h-5 w-5 text-gray-400" />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Telefone
                </label>
                <div className="mt-1 relative">
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="(11) 9 9999-9999"
                  />
                  <PhoneIcon className="absolute right-3 top-2 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                  Empresa
                </label>
                <div className="mt-1 relative">
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="Nome da empresa"
                  />
                  <BuildingOfficeIcon className="absolute right-3 top-2 h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Lead Details */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Detalhes do Lead
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="source" className="block text-sm font-medium text-gray-700">
                  Origem
                </label>
                <select
                  id="source"
                  name="source"
                  value={formData.source}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                >
                  {sourceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="legal_area" className="block text-sm font-medium text-gray-700">
                  Área Jurídica
                </label>
                <select
                  id="legal_area"
                  name="legal_area"
                  value={formData.legal_area}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                >
                  {legalAreaOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="estimated_value" className="block text-sm font-medium text-gray-700">
                  Valor Estimado (R$)
                </label>
                <div className="mt-1 relative">
                  <input
                    type="number"
                    id="estimated_value"
                    name="estimated_value"
                    value={formData.estimated_value}
                    onChange={handleInputChange}
                    className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${
                      errors.estimated_value ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="25000"
                    min="0"
                    step="100"
                  />
                  <CurrencyDollarIcon className="absolute right-3 top-2 h-5 w-5 text-gray-400" />
                </div>
                {errors.estimated_value && (
                  <p className="mt-1 text-sm text-red-600">{errors.estimated_value}</p>
                )}
              </div>

              <div>
                <label htmlFor="probability" className="block text-sm font-medium text-gray-700">
                  Probabilidade (%)
                </label>
                <input
                  type="range"
                  id="probability"
                  name="probability"
                  value={formData.probability}
                  onChange={handleInputChange}
                  className="mt-1 block w-full"
                  min="0"
                  max="100"
                  step="5"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>0%</span>
                  <span className="font-medium">{formData.probability}%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Descrição *
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Descreva a necessidade jurídica do lead..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Next Action */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Próxima Ação
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="next_action" className="block text-sm font-medium text-gray-700">
                  Ação
                </label>
                <input
                  type="text"
                  id="next_action"
                  name="next_action"
                  value={formData.next_action}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="Ex: Ligar para agendar consulta"
                />
              </div>

              <div>
                <label htmlFor="next_action_date" className="block text-sm font-medium text-gray-700">
                  Data da Ação
                </label>
                <div className="mt-1 relative">
                  <input
                    type="date"
                    id="next_action_date"
                    name="next_action_date"
                    value={formData.next_action_date}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                  />
                  <CalendarIcon className="absolute right-3 top-2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Criando...
                </>
              ) : (
                <>
                  <CheckCircleIcon className="w-4 h-4 mr-2" />
                  Criar Lead
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}