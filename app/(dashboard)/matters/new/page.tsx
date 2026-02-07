'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  UserIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'
import { useSupabase } from '@/components/providers'
import { useEffectiveLawFirmId } from '@/lib/hooks/use-effective-law-firm-id'
import { useUsers } from '@/lib/queries/useAdmin'
import { useMatterTypes } from '@/lib/queries/useSettings'
import { useCreateMatter } from '@/lib/queries/useMatters'
import { resolveCourtEndpoint } from '@/lib/integrations/datajud/api'

const brazilianStates = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

const statusOptions = [
  { value: 'novo', label: 'Novo' },
  { value: 'analise', label: 'Em Análise' },
  { value: 'ativo', label: 'Ativo' },
  { value: 'suspenso', label: 'Suspenso' },
  { value: 'aguardando_cliente', label: 'Aguardando Cliente' },
  { value: 'aguardando_documentos', label: 'Aguardando Documentos' }
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

const CNJ_REGEX = /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/

function formatCnj(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 20)
  const d = digits
  if (d.length <= 7) return d
  if (d.length <= 9) return `${d.slice(0, 7)}-${d.slice(7)}`
  if (d.length <= 13) return `${d.slice(0, 7)}-${d.slice(7, 9)}.${d.slice(9)}`
  if (d.length <= 14) return `${d.slice(0, 7)}-${d.slice(7, 9)}.${d.slice(9, 13)}.${d.slice(13)}`
  if (d.length <= 16) return `${d.slice(0, 7)}-${d.slice(7, 9)}.${d.slice(9, 13)}.${d.slice(13, 14)}.${d.slice(14)}`
  return `${d.slice(0, 7)}-${d.slice(7, 9)}.${d.slice(9, 13)}.${d.slice(13, 14)}.${d.slice(14, 16)}.${d.slice(16)}`
}

function getTribunalFromCnj(cnj: string): string | null {
  const digits = cnj.replace(/\D/g, '')
  if (digits.length !== 20) return null
  try {
    return resolveCourtEndpoint(cnj).toUpperCase()
  } catch {
    return null
  }
}

interface DataJudPreview {
  found: boolean
  tribunal?: string
  courtName?: string
  municipality?: string
  state?: string
  className?: string
  filingDate?: string | null
  caseValue?: number | null
  subjects?: string[]
  movementCount?: number
  participantCount?: number
}

export default function NewMatterPage() {
  const router = useRouter()
  const supabase = useSupabase()
  const effectiveLawFirmId = useEffectiveLawFirmId()
  const createMatter = useCreateMatter()

  // Fetch contacts from Supabase
  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, full_name, contact_type, email, phone, cpf_cnpj')
        .order('full_name')
      if (error) throw error
      return data
    },
  })

  // Fetch lawyers
  const { data: lawyers = [] } = useUsers(effectiveLawFirmId, { user_type: 'lawyer' })

  // Fetch matter types
  const { data: matterTypes = [] } = useMatterTypes()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    // Basic Information
    title: '',
    description: '',
    matter_type_id: '',
    area_juridica: '',

    // Legal Information
    processo_numero: '',
    vara_tribunal: '',
    comarca: '',

    // Client Information
    client_id: '',
    client_name: '',
    client_cpf_cnpj: '',

    // Case Details
    opposing_party: '',
    opposing_party_lawyer: '',
    case_value: '',

    // Dates
    opened_date: new Date().toISOString().split('T')[0],
    statute_limitations: '',
    next_hearing_date: '',

    // Status & Workflow
    status: 'novo',
    priority: 'media',
    probability_success: '',

    // Assignment
    responsible_lawyer_id: '',

    // Financial
    hourly_rate: '',
    fixed_fee: '',
    retainer_amount: '',
    billing_method: 'hourly',

    // Notes
    internal_notes: '',
    next_action: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedClient, setSelectedClient] = useState<Record<string, unknown> | null>(null)
  const [datajudPreview, setDatajudPreview] = useState<DataJudPreview | null>(null)
  const [isLookingUp, setIsLookingUp] = useState(false)

  const tribunal = getTribunalFromCnj(formData.processo_numero)
  const isCnjValid = CNJ_REGEX.test(formData.processo_numero)
  const cnjDigits = formData.processo_numero.replace(/\D/g, '')
  const showCnjWarning = cnjDigits.length > 0 && cnjDigits.length < 20

  const handleCnjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCnj(e.target.value)
    setFormData(prev => ({ ...prev, processo_numero: formatted }))
    setDatajudPreview(null)
    if (errors.processo_numero) {
      setErrors(prev => ({ ...prev, processo_numero: '' }))
    }
  }

  const handleDatajudLookup = async () => {
    if (!isCnjValid) return
    setIsLookingUp(true)
    setDatajudPreview(null)
    try {
      const res = await fetch(`/api/datajud/lookup?processNumber=${encodeURIComponent(formData.processo_numero)}`)
      const data: DataJudPreview = await res.json()
      setDatajudPreview(data)
    } catch {
      setDatajudPreview({ found: false })
    } finally {
      setIsLookingUp(false)
    }
  }

  const handleApplyPreview = () => {
    if (!datajudPreview || !datajudPreview.found) return
    setFormData(prev => ({
      ...prev,
      vara_tribunal: datajudPreview.courtName || prev.vara_tribunal,
      comarca: datajudPreview.municipality
        ? `${datajudPreview.municipality}${datajudPreview.state ? ` - ${datajudPreview.state}` : ''}`
        : prev.comarca,
      case_value: datajudPreview.caseValue ? datajudPreview.caseValue.toString() : prev.case_value,
    }))
  }

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

  const handleMatterTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const typeId = e.target.value
    const selectedType = matterTypes.find(type => type.id === typeId)

    setFormData(prev => ({
      ...prev,
      matter_type_id: typeId,
      area_juridica: selectedType?.name || '',
      hourly_rate: selectedType?.default_hourly_rate?.toString() || ''
    }))
  }

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clientId = e.target.value
    const client = contacts.find((c: Record<string, unknown>) => c.id === clientId)

    if (client) {
      setSelectedClient(client)
      setFormData(prev => ({
        ...prev,
        client_id: clientId,
        client_name: (client.full_name as string) || '',
        client_cpf_cnpj: (client.cpf_cnpj as string) || ''
      }))
    } else {
      setSelectedClient(null)
      setFormData(prev => ({
        ...prev,
        client_id: '',
        client_name: '',
        client_cpf_cnpj: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Required fields
    if (!formData.title.trim()) newErrors.title = 'Título é obrigatório'
    if (!formData.area_juridica) newErrors.area_juridica = 'Área jurídica é obrigatória'
    if (!formData.client_id && !formData.client_name.trim()) {
      newErrors.client_id = 'Cliente é obrigatório'
    }
    if (!formData.responsible_lawyer_id) {
      newErrors.responsible_lawyer_id = 'Advogado responsável é obrigatório'
    }

    // Validate CNJ format if provided
    if (formData.processo_numero && !CNJ_REGEX.test(formData.processo_numero)) {
      newErrors.processo_numero = 'Formato CNJ inválido. Use: NNNNNNN-NN.NNNN.N.NN.NNNN'
    }

    // Validate dates
    if (formData.statute_limitations && formData.statute_limitations < formData.opened_date) {
      newErrors.statute_limitations = 'Data de prescrição deve ser posterior à data de abertura'
    }

    // Validate values
    if (formData.case_value && isNaN(parseFloat(formData.case_value))) {
      newErrors.case_value = 'Valor deve ser numérico'
    }
    if (formData.probability_success && (Number(formData.probability_success) < 0 || Number(formData.probability_success) > 100)) {
      newErrors.probability_success = 'Probabilidade deve estar entre 0 e 100'
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
      const result = await createMatter.mutateAsync({
        title: formData.title,
        description: formData.description || undefined,
        status: formData.status,
        priority: formData.priority,
        matter_type_id: formData.matter_type_id || undefined,
        assigned_lawyer_id: formData.responsible_lawyer_id || undefined,
        case_value: formData.case_value ? parseFloat(formData.case_value) : undefined,
        billing_method: formData.billing_method,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : undefined,
        fixed_fee: formData.fixed_fee ? parseFloat(formData.fixed_fee) : undefined,
        retainer_amount: formData.retainer_amount ? parseFloat(formData.retainer_amount) : undefined,
        process_number: formData.processo_numero || undefined,
        court_name: formData.vara_tribunal || undefined,
        jurisdiction: formData.comarca || undefined,
        opposing_party: formData.opposing_party || undefined,
        opposing_party_lawyer: formData.opposing_party_lawyer || undefined,
        opened_date: formData.opened_date || undefined,
        statute_of_limitations: formData.statute_limitations || undefined,
        next_hearing_date: formData.next_hearing_date || undefined,
        internal_notes: formData.internal_notes || undefined,
      } as Record<string, unknown>)

      // Fire-and-forget DataJud enrichment if CNJ was provided
      if (formData.processo_numero && isCnjValid && result?.id) {
        fetch('/api/datajud/enrich-case', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            case_id: result.id,
            process_number: formData.processo_numero,
          }),
        }).catch(() => {})
      }

      router.push('/matters?created=true')
    } catch (error) {
      console.error('Error creating matter:', error)
      setErrors({ submit: 'Erro ao criar processo. Tente novamente.' })
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
            href="/matters"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Voltar para Processos
          </Link>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Novo Processo</h1>
        <p className="mt-2 text-gray-600">
          Cadastre um novo processo jurídico no sistema
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
                {matterTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
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
            <div className="md:col-span-2">
              <label htmlFor="processo_numero" className="block text-sm font-medium text-gray-700">
                Número do Processo (CNJ)
              </label>
              <div className="mt-1 flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    id="processo_numero"
                    name="processo_numero"
                    value={formData.processo_numero}
                    onChange={handleCnjChange}
                    className={`block w-full border rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${
                      errors.processo_numero ? 'border-red-300' : showCnjWarning ? 'border-yellow-300' : 'border-gray-300'
                    }`}
                    placeholder="NNNNNNN-NN.NNNN.N.NN.NNNN"
                    maxLength={25}
                  />
                </div>
                {tribunal && (
                  <span className="inline-flex items-center px-2.5 py-1.5 rounded-md text-xs font-bold bg-blue-100 text-blue-800 whitespace-nowrap">
                    {tribunal}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleDatajudLookup}
                  disabled={!isCnjValid || isLookingUp}
                  className={`inline-flex items-center px-3 py-2 border text-sm font-medium rounded-md whitespace-nowrap ${
                    isCnjValid && !isLookingUp
                      ? 'border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100'
                      : 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                  }`}
                >
                  {isLookingUp ? (
                    <svg className="animate-spin h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <MagnifyingGlassIcon className="h-4 w-4 mr-1.5" />
                  )}
                  Consultar DataJud
                </button>
              </div>
              {errors.processo_numero && <p className="mt-1 text-sm text-red-600">{errors.processo_numero}</p>}
              {showCnjWarning && <p className="mt-1 text-sm text-yellow-600">Formato incompleto. Esperado: 20 dígitos</p>}
              {tribunal === null && cnjDigits.length === 20 && (
                <p className="mt-1 text-sm text-yellow-600">Tribunal desconhecido para este número</p>
              )}

              {/* DataJud Preview Card */}
              {datajudPreview && (
                <div className="mt-3 border rounded-lg p-4 bg-gray-50">
                  {datajudPreview.found ? (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-900">Dados do DataJud</h4>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleApplyPreview}
                            className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded bg-green-100 text-green-800 hover:bg-green-200"
                          >
                            Preencher campos
                          </button>
                          <button
                            type="button"
                            onClick={() => setDatajudPreview(null)}
                            className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded bg-gray-200 text-gray-600 hover:bg-gray-300"
                          >
                            Fechar
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        {datajudPreview.courtName && (
                          <div>
                            <span className="text-gray-500 text-xs">Vara/Tribunal</span>
                            <p className="font-medium">{datajudPreview.courtName}</p>
                          </div>
                        )}
                        {datajudPreview.municipality && (
                          <div>
                            <span className="text-gray-500 text-xs">Comarca</span>
                            <p className="font-medium">{datajudPreview.municipality}{datajudPreview.state ? ` - ${datajudPreview.state}` : ''}</p>
                          </div>
                        )}
                        {datajudPreview.className && (
                          <div>
                            <span className="text-gray-500 text-xs">Classe</span>
                            <p className="font-medium">{datajudPreview.className}</p>
                          </div>
                        )}
                        {datajudPreview.subjects && datajudPreview.subjects.length > 0 && (
                          <div className="col-span-2 md:col-span-3">
                            <span className="text-gray-500 text-xs">Assuntos</span>
                            <p className="font-medium">{datajudPreview.subjects.join(', ')}</p>
                          </div>
                        )}
                        {datajudPreview.filingDate && (
                          <div>
                            <span className="text-gray-500 text-xs">Data de Ajuizamento</span>
                            <p className="font-medium">{new Date(datajudPreview.filingDate).toLocaleDateString('pt-BR')}</p>
                          </div>
                        )}
                        {datajudPreview.caseValue != null && (
                          <div>
                            <span className="text-gray-500 text-xs">Valor da Causa</span>
                            <p className="font-medium">R$ {datajudPreview.caseValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500 text-xs">Movimentações</span>
                          <p className="font-medium">{datajudPreview.movementCount ?? 0}</p>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs">Participantes</span>
                          <p className="font-medium">{datajudPreview.participantCount ?? 0}</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">Processo não encontrado no DataJud.</p>
                      <button
                        type="button"
                        onClick={() => setDatajudPreview(null)}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        Fechar
                      </button>
                    </div>
                  )}
                </div>
              )}
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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <UserIcon className="h-6 w-6 text-green-600 mr-3" />
              <h2 className="text-lg font-medium text-gray-900">Informações do Cliente</h2>
            </div>
            <Link
              href="/clients/new"
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-primary bg-primary/10 hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              + Novo Cliente
            </Link>
          </div>

          <div className="space-y-6">
            {/* Client Selection */}
            <div>
              <label htmlFor="client_id" className="block text-sm font-medium text-gray-700 mb-2">
                Cliente *
              </label>
              <select
                id="client_id"
                name="client_id"
                value={formData.client_id}
                onChange={handleClientChange}
                className={`block w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${
                  errors.client_id ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Selecione um cliente</option>
                {contacts.map((client: Record<string, unknown>) => (
                  <option key={client.id as string} value={client.id as string}>
                    {client.full_name as string} {client.cpf_cnpj ? `(${client.cpf_cnpj})` : ''}
                  </option>
                ))}
              </select>
              {errors.client_id && <p className="mt-1 text-sm text-red-600">{errors.client_id}</p>}
            </div>

            {/* Selected Client Details */}
            {selectedClient && (
              <div className="bg-gray-50 rounded-lg p-4 border">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Detalhes do Cliente Selecionado</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Tipo:</span>
                    <p className="font-medium">
                      {(selectedClient.contact_type as string) === 'individual' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                    </p>
                  </div>
                  {selectedClient.cpf_cnpj && (
                    <div>
                      <span className="text-gray-500">CPF/CNPJ:</span>
                      <p className="font-medium">{selectedClient.cpf_cnpj as string}</p>
                    </div>
                  )}
                  {selectedClient.email && (
                    <div>
                      <span className="text-gray-500">E-mail:</span>
                      <p className="font-medium">{selectedClient.email as string}</p>
                    </div>
                  )}
                  {selectedClient.phone && (
                    <div>
                      <span className="text-gray-500">Telefone:</span>
                      <p className="font-medium">{selectedClient.phone as string}</p>
                    </div>
                  )}
                  <div className="md:col-span-1">
                    <Link
                      href={`/clients/${selectedClient.id}`}
                      className="text-primary hover:text-primary/80 text-xs font-medium"
                    >
                      Ver perfil completo →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Manual Client Input (fallback) */}
            {!formData.client_id && (
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-4">
                  Se o cliente não estiver cadastrado, preencha as informações abaixo:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      CPF/CNPJ
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
            )}
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
                {lawyers.map((lawyer) => (
                  <option key={lawyer.id} value={lawyer.id}>
                    {lawyer.full_name} {lawyer.oab_number ? `- ${lawyer.oab_number}` : ''}
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

          <div className="flex justify-end space-x-4">
            <Link
              href="/matters"
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
                  Criar Processo
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
