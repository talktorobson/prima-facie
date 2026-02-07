'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/toast-provider'
import { useSupabase } from '@/components/providers'
import { contactSchema, type ContactFormData } from '@/lib/clients/client-schemas'
import {
  ArrowLeftIcon,
  UserIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  PhoneIcon,
  MapPinIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import type { Contact } from '@/types/database'

const brazilianStates = [
  '', 'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

const statusOptions = [
  { value: 'prospect', label: 'Prospecto' },
  { value: 'active', label: 'Ativo' },
  { value: 'inactive', label: 'Inativo' },
  { value: 'former', label: 'Antigo' },
]

const communicationOptions = [
  { value: '', label: 'Selecione' },
  { value: 'email', label: 'E-mail' },
  { value: 'phone', label: 'Telefone' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'mail', label: 'Correio' },
]

function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14)
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, '($1) $2 $3-$4')
  }
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  return value
}

function formatCEP(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  return digits.replace(/(\d{5})(\d{3})/, '$1-$2')
}

function mapContactToFormData(contact: Contact): ContactFormData {
  const base = {
    contact_type: contact.contact_type,
    email: contact.email || '',
    phone: contact.phone || '',
    mobile: contact.mobile || '',
    address_street: contact.address_street || '',
    address_number: contact.address_number || '',
    address_complement: contact.address_complement || '',
    address_neighborhood: contact.address_neighborhood || '',
    address_city: contact.address_city || '',
    address_state: contact.address_state || '',
    address_zipcode: contact.address_zipcode || '',
    client_status: contact.client_status || 'prospect',
    preferred_communication: contact.preferred_communication || undefined,
    notes: contact.notes || '',
  }

  if (contact.contact_type === 'individual') {
    return {
      ...base,
      contact_type: 'individual' as const,
      first_name: contact.first_name || '',
      last_name: contact.last_name || '',
      cpf: contact.cpf || '',
      rg: contact.rg || '',
      birth_date: contact.birth_date || '',
      marital_status: contact.marital_status || '',
      profession: contact.profession || '',
      company_name: contact.company_name || '',
      cnpj: '',
    }
  }

  return {
    ...base,
    contact_type: 'company' as const,
    company_name: contact.company_name || '',
    cnpj: contact.cnpj || '',
    first_name: contact.first_name || '',
    last_name: contact.last_name || '',
    cpf: '',
    rg: '',
    birth_date: '',
    marital_status: '',
    profession: '',
  }
}

export default function EditClientPage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string
  const toast = useToast()
  const queryClient = useQueryClient()
  const supabase = useSupabase()

  const { data: client, isLoading, error: fetchError } = useQuery({
    queryKey: ['clients', clientId],
    queryFn: async (): Promise<Contact | null> => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', clientId)
        .in('contact_type', ['individual', 'company'])
        .single()

      if (error && error.code !== 'PGRST116') {
        throw new Error('Falha ao buscar cliente')
      }
      return (data as Contact) ?? null
    },
    enabled: !!clientId,
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      contact_type: 'individual',
      first_name: '',
      last_name: '',
      email: '',
    },
  })

  useEffect(() => {
    if (client) {
      const formData = mapContactToFormData(client)
      reset(formData)
    }
  }, [client, reset])

  const contactType = watch('contact_type')

  const updateMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      const payload: Record<string, unknown> = {
        contact_type: data.contact_type,
        email: data.email || null,
        phone: data.phone || null,
        mobile: data.mobile || null,
        address_street: data.address_street || null,
        address_number: data.address_number || null,
        address_complement: data.address_complement || null,
        address_neighborhood: data.address_neighborhood || null,
        address_city: data.address_city || null,
        address_state: data.address_state || null,
        address_zipcode: data.address_zipcode || null,
        client_status: data.client_status || 'prospect',
        preferred_communication: data.preferred_communication || null,
        notes: data.notes || null,
        updated_at: new Date().toISOString(),
      }

      if (data.contact_type === 'individual') {
        payload.first_name = data.first_name
        payload.last_name = data.last_name
        payload.full_name = `${data.first_name} ${data.last_name}`.trim()
        payload.cpf = data.cpf || null
        payload.rg = data.rg || null
        payload.birth_date = data.birth_date || null
        payload.marital_status = data.marital_status || null
        payload.profession = data.profession || null
        payload.cnpj = null
        payload.company_name = data.company_name || null
      } else {
        payload.company_name = data.company_name
        payload.full_name = data.company_name
        payload.cnpj = data.cnpj || null
        payload.first_name = data.first_name || null
        payload.last_name = data.last_name || null
        payload.cpf = null
        payload.rg = null
        payload.birth_date = null
        payload.marital_status = null
        payload.profession = null
      }

      const { error } = await supabase
        .from('contacts')
        .update(payload)
        .eq('id', clientId)

      if (error) throw new Error('Falha ao atualizar cliente')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Cliente atualizado com sucesso')
      router.push(`/clients/${clientId}`)
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao atualizar cliente')
    },
  })

  const onSubmit = (data: ContactFormData) => {
    updateMutation.mutate(data)
  }

  const handleTypeChange = (newType: 'individual' | 'company') => {
    setValue('contact_type', newType, { shouldValidate: true })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-gray-600">Carregando dados do cliente...</p>
        </div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Erro ao carregar cliente</h3>
        <p className="mt-1 text-sm text-gray-500">Nao foi possivel carregar os dados do cliente.</p>
        <div className="mt-6">
          <Link
            href="/clients"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
          >
            Voltar aos Clientes
          </Link>
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Cliente nao encontrado</h3>
        <p className="mt-1 text-sm text-gray-500">O cliente solicitado nao existe ou foi removido.</p>
        <div className="mt-6">
          <Link
            href="/clients"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
          >
            Voltar aos Clientes
          </Link>
        </div>
      </div>
    )
  }

  const displayName = client.contact_type === 'company'
    ? client.company_name || client.full_name || '-'
    : client.full_name || [client.first_name, client.last_name].filter(Boolean).join(' ') || '-'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-3">
          <Link href={`/clients/${clientId}`} className="text-gray-400 hover:text-gray-600">
            <ArrowLeftIcon className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar Cliente</h1>
            <p className="mt-1 text-gray-600">{displayName}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Type Selection */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <UserIcon className="h-5 w-5 mr-2 text-blue-600" />
              Tipo de Cliente
            </h3>
          </div>
          <div className="px-6 py-4">
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => handleTypeChange('individual')}
                className={`flex-1 p-4 border-2 rounded-lg text-center transition-colors ${
                  contactType === 'individual'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <UserIcon className="h-6 w-6 mx-auto mb-2" />
                <div className="font-medium">Pessoa Fisica</div>
                <div className="text-sm text-gray-500">Individuo / CPF</div>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('company')}
                className={`flex-1 p-4 border-2 rounded-lg text-center transition-colors ${
                  contactType === 'company'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <BuildingOfficeIcon className="h-6 w-6 mx-auto mb-2" />
                <div className="font-medium">Pessoa Juridica</div>
                <div className="text-sm text-gray-500">Empresa / CNPJ</div>
              </button>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <UserIcon className="h-5 w-5 mr-2 text-blue-600" />
              Informacoes Basicas
            </h3>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contactType === 'individual' ? (
                <>
                  <div>
                    <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                      Nome *
                    </label>
                    <input
                      type="text"
                      id="first_name"
                      {...register('first_name')}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${
                        errors.first_name ? 'border-red-300' : ''
                      }`}
                    />
                    {errors.first_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                      Sobrenome *
                    </label>
                    <input
                      type="text"
                      id="last_name"
                      {...register('last_name')}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${
                        errors.last_name ? 'border-red-300' : ''
                      }`}
                    />
                    {errors.last_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="md:col-span-2">
                  <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
                    Razao Social *
                  </label>
                  <input
                    type="text"
                    id="company_name"
                    {...register('company_name')}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${
                      errors.company_name ? 'border-red-300' : ''
                    }`}
                  />
                  {errors.company_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.company_name.message}</p>
                  )}
                </div>
              )}

              <div>
                <label htmlFor="client_status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="client_status"
                  {...register('client_status')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
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
              Documentacao
            </h3>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contactType === 'individual' ? (
                <>
                  <div>
                    <label htmlFor="cpf" className="block text-sm font-medium text-gray-700">CPF</label>
                    <input
                      type="text"
                      id="cpf"
                      {...register('cpf', {
                        onChange: (e) => {
                          const formatted = formatCPF(e.target.value)
                          setValue('cpf', formatted)
                        },
                      })}
                      maxLength={14}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${
                        errors.cpf ? 'border-red-300' : ''
                      }`}
                      placeholder="000.000.000-00"
                    />
                    {errors.cpf && <p className="mt-1 text-sm text-red-600">{errors.cpf.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="rg" className="block text-sm font-medium text-gray-700">RG</label>
                    <input
                      type="text"
                      id="rg"
                      {...register('rg')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      placeholder="12.345.678-9"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700">CNPJ</label>
                  <input
                    type="text"
                    id="cnpj"
                    {...register('cnpj', {
                      onChange: (e) => {
                        const formatted = formatCNPJ(e.target.value)
                        setValue('cnpj', formatted)
                      },
                    })}
                    maxLength={18}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${
                      errors.cnpj ? 'border-red-300' : ''
                    }`}
                    placeholder="00.000.000/0000-00"
                  />
                  {errors.cnpj && <p className="mt-1 text-sm text-red-600">{errors.cnpj.message}</p>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <PhoneIcon className="h-5 w-5 mr-2 text-purple-600" />
              Informacoes de Contato
            </h3>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-mail</label>
                <input
                  type="email"
                  id="email"
                  {...register('email')}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${
                    errors.email ? 'border-red-300' : ''
                  }`}
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Telefone</label>
                <input
                  type="text"
                  id="phone"
                  {...register('phone', {
                    onChange: (e) => {
                      const formatted = formatPhone(e.target.value)
                      setValue('phone', formatted)
                    },
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  placeholder="(11) 3456-7890"
                />
              </div>
              <div>
                <label htmlFor="mobile" className="block text-sm font-medium text-gray-700">Celular</label>
                <input
                  type="text"
                  id="mobile"
                  {...register('mobile', {
                    onChange: (e) => {
                      const formatted = formatPhone(e.target.value)
                      setValue('mobile', formatted)
                    },
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  placeholder="(11) 9 8765-4321"
                />
              </div>
              <div>
                <label htmlFor="preferred_communication" className="block text-sm font-medium text-gray-700">
                  Comunicacao Preferida
                </label>
                <select
                  id="preferred_communication"
                  {...register('preferred_communication')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                >
                  {communicationOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Info (Individual only) */}
        {contactType === 'individual' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <UserIcon className="h-5 w-5 mr-2 text-indigo-600" />
                Informacoes Pessoais
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
                    {...register('birth_date')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="marital_status" className="block text-sm font-medium text-gray-700">
                    Estado Civil
                  </label>
                  <select
                    id="marital_status"
                    {...register('marital_status')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  >
                    <option value="">Selecione</option>
                    <option value="solteiro">Solteiro(a)</option>
                    <option value="casado">Casado(a)</option>
                    <option value="divorciado">Divorciado(a)</option>
                    <option value="viuvo">Viuvo(a)</option>
                    <option value="uniao_estavel">Uniao Estavel</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="profession" className="block text-sm font-medium text-gray-700">
                    Profissao
                  </label>
                  <input
                    type="text"
                    id="profession"
                    {...register('profession')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Address */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <MapPinIcon className="h-5 w-5 mr-2 text-red-600" />
              Endereco
            </h3>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="sm:col-span-2 lg:col-span-2">
                <label htmlFor="address_street" className="block text-sm font-medium text-gray-700">
                  Logradouro
                </label>
                <input
                  type="text"
                  id="address_street"
                  {...register('address_street')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  placeholder="Rua, Avenida, etc."
                />
              </div>
              <div>
                <label htmlFor="address_number" className="block text-sm font-medium text-gray-700">
                  Numero
                </label>
                <input
                  type="text"
                  id="address_number"
                  {...register('address_number')}
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
                  {...register('address_complement')}
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
                  {...register('address_neighborhood')}
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
                  {...register('address_city')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="address_state" className="block text-sm font-medium text-gray-700">
                  Estado
                </label>
                <select
                  id="address_state"
                  {...register('address_state')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                >
                  {brazilianStates.map((state) => (
                    <option key={state || '__empty'} value={state}>
                      {state || 'Selecione'}
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
                  {...register('address_zipcode', {
                    onChange: (e) => {
                      const formatted = formatCEP(e.target.value)
                      setValue('address_zipcode', formatted)
                    },
                  })}
                  maxLength={9}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  placeholder="00000-000"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Observacoes</h3>
          </div>
          <div className="px-6 py-4">
            <textarea
              id="notes"
              {...register('notes')}
              rows={4}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              placeholder="Informacoes adicionais sobre o cliente..."
            />
          </div>
        </div>

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
            disabled={updateMutation.isPending}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <CheckCircleIcon className="-ml-1 mr-2 h-4 w-4" />
                Salvar Alteracoes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
