'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeftIcon,
  UserIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  TrashIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import { useEffectiveLawFirmId } from '@/lib/hooks/use-effective-law-firm-id'
import { useMatter, useUpdateMatter, useDeleteMatter } from '@/lib/queries/useMatters'
import { useUsers } from '@/lib/queries/useAdmin'
import { useMatterTypes } from '@/lib/queries/useSettings'
import { useSupabase } from '@/components/providers'
import { resolveCourtEndpoint } from '@/lib/integrations/datajud/api'

const statusOptions = [
  { value: 'active', label: 'Ativo' },
  { value: 'on_hold', label: 'Suspenso' },
  { value: 'settled', label: 'Acordo' },
  { value: 'closed', label: 'Encerrado' },
  { value: 'dismissed', label: 'Arquivado' }
]

const priorityOptions = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' }
]

const areaJuridicaOptions = [
  'Civil', 'Criminal', 'Trabalhista', 'Empresarial', 'Tributário',
  'Previdenciário', 'Família', 'Consumidor', 'Ambiental', 'Administrativo'
]

const billingMethodOptions = [
  { value: 'hourly', label: 'Por Hora' },
  { value: 'flat_fee', label: 'Valor Fixo' },
  { value: 'contingency', label: 'Êxito' },
  { value: 'pro_bono', label: 'Pro Bono' }
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

export default function EditMatterPage() {
  const params = useParams()
  const router = useRouter()
  const effectiveLawFirmId = useEffectiveLawFirmId()
  const matterId = params.id as string
  const supabase = useSupabase()

  const { data: matter, isLoading: matterLoading } = useMatter(matterId)
  const updateMatter = useUpdateMatter()
  const deleteMatter = useDeleteMatter()
  const { data: lawyers = [] } = useUsers(effectiveLawFirmId, { user_type: 'lawyer' })
  const { data: matterTypes = [] } = useMatterTypes()
  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, full_name, contact_type, email, phone, cpf, cnpj')
        .order('full_name')
      if (error) throw error
      return data
    },
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    matter_type_id: '',
    area_juridica: '',
    process_number: '',
    court_name: '',
    court_city: '',
    client_id: '',
    client_name: '',
    client_cpf_cnpj: '',
    opposing_party: '',
    case_value: '',
    opened_date: '',
    statute_of_limitations: '',
    next_court_date: '',
    status: 'active',
    priority: 'medium',
    responsible_lawyer_id: '',
    hourly_rate: '',
    flat_fee: '',
    billing_method: 'hourly',
    notes: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [datajudPreview, setDatajudPreview] = useState<DataJudPreview | null>(null)
  const [isLookingUp, setIsLookingUp] = useState(false)

  const tribunal = getTribunalFromCnj(formData.process_number)
  const isCnjValid = CNJ_REGEX.test(formData.process_number)
  const cnjDigits = formData.process_number.replace(/\D/g, '')
  const showCnjWarning = cnjDigits.length > 0 && cnjDigits.length < 20

  const handleCnjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCnj(e.target.value)
    setFormData(prev => ({ ...prev, process_number: formatted }))
    setDatajudPreview(null)
    if (errors.process_number) {
      setErrors(prev => ({ ...prev, process_number: '' }))
    }
  }

  const handleDatajudLookup = async () => {
    if (!isCnjValid) return
    setIsLookingUp(true)
    setDatajudPreview(null)
    try {
      const res = await fetch(`/api/datajud/lookup?processNumber=${encodeURIComponent(formData.process_number)}`)
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
      court_name: datajudPreview.courtName || prev.court_name,
      court_city: datajudPreview.municipality
        ? `${datajudPreview.municipality}${datajudPreview.state ? ` - ${datajudPreview.state}` : ''}`
        : prev.court_city,
      case_value: datajudPreview.caseValue ? datajudPreview.caseValue.toString() : prev.case_value,
    }))
  }

  // Populate form when matter data arrives
  useEffect(() => {
    if (!matter) return
    setFormData({
      title: matter.title || '',
      description: matter.description || '',
      matter_type_id: matter.matter_type_id || '',
      area_juridica: (matter.custom_fields as Record<string, string>)?.area_juridica || '',
      process_number: matter.process_number ? formatCnj(matter.process_number) : '',
      court_name: matter.court_name || '',
      court_city: matter.court_city || '',
      client_id: (matter as Record<string, unknown>).contacts?.[0]?.contact?.id || '',
      client_name: (matter as Record<string, unknown>).contacts?.[0]?.contact?.full_name || '',
      client_cpf_cnpj: (matter as Record<string, unknown>).contacts?.[0]?.contact?.cpf || (matter as Record<string, unknown>).contacts?.[0]?.contact?.cnpj || '',
      opposing_party: matter.opposing_party || '',
      case_value: matter.flat_fee?.toString() || '',
      opened_date: matter.opened_date || '',
      statute_of_limitations: matter.statute_of_limitations || '',
      next_court_date: matter.next_court_date ? matter.next_court_date.slice(0, 16) : '',
      status: matter.status || 'active',
      priority: matter.priority || 'medium',
      responsible_lawyer_id: matter.responsible_lawyer_id || '',
      hourly_rate: matter.hourly_rate?.toString() || '',
      flat_fee: matter.flat_fee?.toString() || '',
      billing_method: matter.billing_method || 'hourly',
      notes: matter.notes || '',
    })
  }, [matter])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

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
      hourly_rate: selectedType?.default_hourly_rate?.toString() || prev.hourly_rate
    }))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) newErrors.title = 'Título é obrigatório'
    if (!formData.responsible_lawyer_id) {
      newErrors.responsible_lawyer_id = 'Advogado responsável é obrigatório'
    }

    if (formData.process_number && !CNJ_REGEX.test(formData.process_number)) {
      newErrors.process_number = 'Formato CNJ inválido. Use: NNNNNNN-NN.NNNN.N.NN.NNNN'
    }

    if (formData.case_value && isNaN(parseFloat(formData.case_value))) {
      newErrors.case_value = 'Valor deve ser numérico'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      await updateMatter.mutateAsync({
        id: matterId,
        updates: {
          title: formData.title,
          description: formData.description || undefined,
          matter_type_id: formData.matter_type_id || undefined,
          process_number: formData.process_number || undefined,
          court_name: formData.court_name || undefined,
          court_city: formData.court_city || undefined,
          opposing_party: formData.opposing_party || undefined,
          opened_date: formData.opened_date || undefined,
          statute_of_limitations: formData.statute_of_limitations || undefined,
          next_court_date: formData.next_court_date || undefined,
          status: formData.status as 'active' | 'closed' | 'on_hold' | 'settled' | 'dismissed',
          priority: formData.priority as 'low' | 'medium' | 'high' | 'urgent',
          responsible_lawyer_id: formData.responsible_lawyer_id || undefined,
          hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : undefined,
          flat_fee: formData.flat_fee ? parseFloat(formData.flat_fee) : undefined,
          billing_method: formData.billing_method as 'hourly' | 'flat_fee' | 'contingency' | 'pro_bono',
          notes: formData.notes || undefined,
          custom_fields: formData.area_juridica ? { area_juridica: formData.area_juridica } : undefined,
        }
      })

      router.push(`/matters/${matterId}?updated=true`)
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
      await deleteMatter.mutateAsync(matterId)
      router.push('/matters?deleted=true')
    } catch (error) {
      console.error('Error deleting matter:', error)
      setErrors({ delete: 'Erro ao excluir processo. Tente novamente.' })
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (matterLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-primary mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-500">Carregando processo...</p>
        </div>
      </div>
    )
  }

  if (!matter) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-500">Processo não encontrado.</p>
          <Link href="/matters" className="text-primary hover:underline mt-2 inline-block">
            Voltar para lista
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href={`/matters/${matterId}`}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Voltar para Detalhes
          </Link>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Editar Processo - {matter.matter_number}
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
                {matterTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="area_juridica" className="block text-sm font-medium text-gray-700">
                Área Jurídica
              </label>
              <select
                id="area_juridica"
                name="area_juridica"
                value={formData.area_juridica}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="">Selecione a área</option>
                {areaJuridicaOptions.map((area) => (
                  <option key={area} value={area}>
                    {area}
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
              <label htmlFor="process_number" className="block text-sm font-medium text-gray-700">
                Número do Processo (CNJ)
              </label>
              <div className="mt-1 flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    id="process_number"
                    name="process_number"
                    value={formData.process_number}
                    onChange={handleCnjChange}
                    className={`block w-full border rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${
                      errors.process_number ? 'border-red-300' : showCnjWarning ? 'border-yellow-300' : 'border-gray-300'
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
              {errors.process_number && <p className="mt-1 text-sm text-red-600">{errors.process_number}</p>}
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
              <label htmlFor="court_name" className="block text-sm font-medium text-gray-700">
                Vara/Tribunal
              </label>
              <input
                type="text"
                id="court_name"
                name="court_name"
                value={formData.court_name}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                placeholder="Ex: 1ª Vara do Trabalho de São Paulo"
              />
            </div>

            <div>
              <label htmlFor="court_city" className="block text-sm font-medium text-gray-700">
                Comarca
              </label>
              <input
                type="text"
                id="court_city"
                name="court_city"
                value={formData.court_city}
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
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.full_name} {contact.email ? `- ${contact.email}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="client_name" className="block text-sm font-medium text-gray-700">
                Nome do Cliente
              </label>
              <input
                type="text"
                id="client_name"
                name="client_name"
                value={formData.client_name}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                placeholder="Nome completo do cliente"
                readOnly
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
              <label htmlFor="statute_of_limitations" className="block text-sm font-medium text-gray-700">
                Prazo Prescricional
              </label>
              <input
                type="date"
                id="statute_of_limitations"
                name="statute_of_limitations"
                value={formData.statute_of_limitations}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label htmlFor="next_court_date" className="block text-sm font-medium text-gray-700">
                Próxima Audiência
              </label>
              <input
                type="datetime-local"
                id="next_court_date"
                name="next_court_date"
                value={formData.next_court_date}
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
              <label htmlFor="flat_fee" className="block text-sm font-medium text-gray-700">
                Valor Fixo
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">R$</span>
                </div>
                <input
                  type="number"
                  id="flat_fee"
                  name="flat_fee"
                  value={formData.flat_fee}
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

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notas Internas
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              value={formData.notes}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              placeholder="Observações internas sobre o processo..."
            />
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
                href={`/matters/${matterId}`}
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
          <div className="relative top-20 p-5 border w-full sm:w-96 mx-4 sm:mx-auto shadow-lg rounded-md bg-white">
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
