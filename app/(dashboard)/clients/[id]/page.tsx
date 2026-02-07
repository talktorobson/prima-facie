'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/toast-provider'
import { useSupabase } from '@/components/providers'
import {
  ArrowLeftIcon,
  UserIcon,
  PencilIcon,
  DocumentTextIcon,
  PlusIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CheckCircleIcon,
  TrashIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import type { Contact, Matter } from '@/types/database'

interface MatterContactRow {
  matters: Pick<Matter, 'id' | 'matter_number' | 'title' | 'status' | 'opened_date' | 'billing_method' | 'total_billed' | 'total_paid'>
}

interface ClientWithMatters extends Contact {
  matter_contacts?: MatterContactRow[]
}

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: 'Ativo', className: 'text-green-700 bg-green-50 ring-green-600/20' },
  prospect: { label: 'Prospecto', className: 'text-blue-700 bg-blue-50 ring-blue-600/20' },
  inactive: { label: 'Inativo', className: 'text-gray-700 bg-gray-50 ring-gray-600/20' },
  former: { label: 'Antigo', className: 'text-yellow-700 bg-yellow-50 ring-yellow-600/20' },
}

const matterStatusConfig: Record<string, { label: string; className: string }> = {
  active: { label: 'Ativo', className: 'text-green-700 bg-green-50 ring-green-600/20' },
  closed: { label: 'Encerrado', className: 'text-gray-700 bg-gray-50 ring-gray-600/20' },
  on_hold: { label: 'Suspenso', className: 'text-yellow-700 bg-yellow-50 ring-yellow-600/20' },
  settled: { label: 'Acordo', className: 'text-blue-700 bg-blue-50 ring-blue-600/20' },
  dismissed: { label: 'Arquivado', className: 'text-red-700 bg-red-50 ring-red-600/20' },
}

function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('pt-BR')
}

function formatCurrency(amount: number | undefined | null): string {
  if (amount == null) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)
}

function getClientDisplayName(client: ClientWithMatters): string {
  if (client.contact_type === 'company') return client.company_name || client.full_name || '-'
  return client.full_name || [client.first_name, client.last_name].filter(Boolean).join(' ') || '-'
}

function getClientDocument(client: ClientWithMatters): { label: string; value: string } {
  if (client.contact_type === 'company') {
    return { label: 'CNPJ', value: client.cnpj || '-' }
  }
  return { label: 'CPF', value: client.cpf || '-' }
}

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string
  const toast = useToast()
  const queryClient = useQueryClient()
  const supabase = useSupabase()

  const [activeTab, setActiveTab] = useState('overview')
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const { data: client, isLoading, error } = useQuery({
    queryKey: ['clients', clientId],
    queryFn: async (): Promise<ClientWithMatters | null> => {
      const { data, error: fetchErr } = await supabase
        .from('contacts')
        .select(`
          *,
          matter_contacts(
            matters(
              id,
              matter_number,
              title,
              status,
              opened_date,
              billing_method,
              total_billed,
              total_paid
            )
          )
        `)
        .eq('id', clientId)
        .in('contact_type', ['individual', 'company'])
        .single()

      if (fetchErr && fetchErr.code !== 'PGRST116') {
        throw new Error('Falha ao buscar cliente')
      }
      return (data as ClientWithMatters) ?? null
    },
    enabled: !!clientId,
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { data: activeMattersData } = await supabase
        .from('matter_contacts')
        .select('matters!inner(id)')
        .eq('contact_id', clientId)
        .eq('matters.status', 'active')

      if (activeMattersData && activeMattersData.length > 0) {
        throw new Error('Nao e possivel excluir cliente com processos ativos')
      }

      const { error: delErr } = await supabase
        .from('contacts')
        .update({ client_status: 'inactive', updated_at: new Date().toISOString() })
        .eq('id', clientId)

      if (delErr) throw new Error('Falha ao excluir cliente')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Cliente excluido com sucesso')
      router.push('/clients')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao excluir cliente')
      setShowDeleteModal(false)
    },
  })

  const matters = client?.matter_contacts
    ?.map((mc: MatterContactRow) => mc.matters)
    .filter(Boolean) ?? []

  const activeMatters = matters.filter((m) => m.status === 'active')
  const totalBilled = matters.reduce((sum, m) => sum + (m.total_billed ?? 0), 0)

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

  if (error) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Erro ao carregar cliente</h3>
        <p className="mt-1 text-sm text-gray-500">
          Ocorreu um erro ao buscar os dados do cliente. Tente novamente.
        </p>
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
        <p className="mt-1 text-sm text-gray-500">
          O cliente solicitado nao existe ou foi removido.
        </p>
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

  const displayName = getClientDisplayName(client)
  const doc = getClientDocument(client)
  const statusInfo = statusConfig[client.client_status ?? 'prospect'] ?? statusConfig.prospect

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4">
          <div className="flex items-center space-x-3 mb-4">
            <Link href="/clients" className="text-gray-400 hover:text-gray-600">
              <ArrowLeftIcon className="h-6 w-6" />
            </Link>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3">
                    <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
                    {client.contact_type === 'individual' ? (
                      <UserIcon className="h-6 w-6 text-blue-500" />
                    ) : (
                      <BuildingOfficeIcon className="h-6 w-6 text-purple-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {client.contact_type === 'individual' ? 'Pessoa Fisica' : 'Pessoa Juridica'}
                    {' '} -- Cliente desde {formatDate(client.created_at)}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusInfo.className}`}>
                    {statusInfo.label}
                  </span>
                  <Link
                    href={`/clients/${client.id}/edit`}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Editar
                  </Link>
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-900">{matters.length}</p>
                  <p className="text-xs text-blue-700">Processos</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-900">{activeMatters.length}</p>
                  <p className="text-xs text-green-700">Ativos</p>
                </div>
              </div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center">
                <DocumentTextIcon className="h-5 w-5 text-orange-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-orange-900">{formatCurrency(totalBilled)}</p>
                  <p className="text-xs text-orange-700">Total Faturado</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <UserIcon className="h-4 w-4 inline mr-2" />
              Visao Geral
            </button>
            <button
              onClick={() => setActiveTab('matters')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'matters'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <DocumentTextIcon className="h-4 w-4 inline mr-2" />
              Processos ({matters.length})
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'contact'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <PhoneIcon className="h-4 w-4 inline mr-2" />
              Contato
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {client.contact_type === 'individual' ? 'Informacoes Pessoais' : 'Informacoes da Empresa'}
                  </h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Tipo</dt>
                      <dd className="text-sm text-gray-900">
                        {client.contact_type === 'individual' ? 'Pessoa Fisica' : 'Pessoa Juridica'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">{doc.label}</dt>
                      <dd className="text-sm text-gray-900">{doc.value}</dd>
                    </div>
                    {client.email && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">E-mail</dt>
                        <dd className="text-sm text-gray-900">{client.email}</dd>
                      </div>
                    )}
                    {client.phone && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Telefone</dt>
                        <dd className="text-sm text-gray-900">{client.phone}</dd>
                      </div>
                    )}
                    {client.mobile && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Celular</dt>
                        <dd className="text-sm text-gray-900">{client.mobile}</dd>
                      </div>
                    )}
                    {client.profession && client.contact_type === 'individual' && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Profissao</dt>
                        <dd className="text-sm text-gray-900">{client.profession}</dd>
                      </div>
                    )}
                    {client.notes && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Observacoes</dt>
                        <dd className="text-sm text-gray-900 whitespace-pre-wrap">{client.notes}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Endereco</h3>
                  {client.address_street ? (
                    <div className="text-sm text-gray-900 space-y-1">
                      <p>
                        {client.address_street}
                        {client.address_number ? `, ${client.address_number}` : ''}
                      </p>
                      {client.address_complement && <p>{client.address_complement}</p>}
                      {client.address_neighborhood && <p>{client.address_neighborhood}</p>}
                      <p>
                        {[client.address_city, client.address_state].filter(Boolean).join(' - ')}
                      </p>
                      {client.address_zipcode && <p>CEP: {client.address_zipcode}</p>}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Nenhum endereco cadastrado</p>
                  )}

                  {client.preferred_communication && (
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Comunicacao preferida</h4>
                      <p className="text-sm text-gray-600 capitalize">{client.preferred_communication}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Matters Tab */}
          {activeTab === 'matters' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Processos do Cliente</h3>
                <Link
                  href={`/matters/new?client_id=${client.id}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Novo Processo
                </Link>
              </div>

              {matters.length === 0 ? (
                <div className="text-center py-12">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Nenhum processo encontrado
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Este cliente ainda nao possui processos cadastrados.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Numero</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Titulo</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Data Abertura</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Faturado</th>
                        <th className="relative py-3.5 pl-3 pr-4" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {matters.map((matter) => {
                        const mStatus = matterStatusConfig[matter.status ?? 'active'] ?? matterStatusConfig.active
                        return (
                          <tr key={matter.id} className="hover:bg-gray-50">
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                              {matter.matter_number}
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-900">{matter.title}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                              <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${mStatus.className}`}>
                                {mStatus.label}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {formatDate(matter.opened_date)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                              {formatCurrency(matter.total_billed)}
                            </td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                              <Link
                                href={`/matters/${matter.id}`}
                                className="text-primary hover:text-primary/80"
                              >
                                Ver detalhes
                              </Link>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Contact Tab */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Informacoes de Contato</h4>
                  <div className="space-y-3">
                    {client.email && (
                      <div className="flex items-center">
                        <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{client.email}</p>
                          <p className="text-xs text-gray-500">E-mail principal</p>
                        </div>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center">
                        <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{client.phone}</p>
                          <p className="text-xs text-gray-500">Telefone</p>
                        </div>
                      </div>
                    )}
                    {client.mobile && (
                      <div className="flex items-center">
                        <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{client.mobile}</p>
                          <p className="text-xs text-gray-500">Celular</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Endereco</h4>
                  <div className="space-y-3">
                    {client.address_street ? (
                      <div className="flex items-start">
                        <MapPinIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {client.address_street}
                            {client.address_number ? `, ${client.address_number}` : ''}
                          </p>
                          <p className="text-xs text-gray-500">
                            {[client.address_city, client.address_state].filter(Boolean).join(' - ')}
                            {client.address_zipcode ? ` - CEP: ${client.address_zipcode}` : ''}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Nenhum endereco cadastrado</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full sm:w-96 mx-4 sm:mx-auto shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-600" />
              <h3 className="text-lg font-medium text-gray-900 mt-4">Confirmar Exclusao</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Tem certeza que deseja excluir este cliente? O cliente sera marcado como inativo.
                </p>
                <p className="text-sm font-medium text-gray-900 mt-2">{displayName}</p>
              </div>
              <div className="flex justify-center space-x-3 mt-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  disabled={deleteMutation.isPending}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
