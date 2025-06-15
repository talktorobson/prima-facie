'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeftIcon,
  UserIcon,
  PencilIcon,
  DocumentTextIcon,
  CalendarIcon,
  PlusIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

// Mock client data (enhanced from Phase 6)
const getMockClientDetail = (id: string) => {
  const clients = {
    '1': {
      id: '1',
      client_number: 'CLI-2024-001',
      name: 'João Silva Santos',
      type: 'pessoa_fisica',
      cpf: '123.456.789-00',
      cnpj: null,
      email: 'joao.silva@email.com',
      phone: '(11) 3456-7890',
      mobile: '(11) 9 8765-4321',
      whatsapp: '(11) 9 8765-4321',
      birth_date: '1985-06-15',
      status: 'ativo',
      created_at: '2024-01-15',
      address: {
        street: 'Rua das Flores',
        number: '123',
        complement: 'Apto 45',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zipcode: '01234-567'
      },
      portal_access: true,
      relationship_manager: 'Dra. Maria Silva Santos'
    },
    '2': {
      id: '2',
      client_number: 'CLI-2024-002',
      name: 'Ana Costa Pereira',
      type: 'pessoa_fisica',
      cpf: '987.654.321-00',
      cnpj: null,
      email: 'ana.costa@email.com',
      phone: '(11) 3456-7891',
      mobile: '(11) 9 1234-5678',
      whatsapp: '(11) 9 1234-5678',
      birth_date: '1990-03-22',
      status: 'ativo',
      created_at: '2024-01-18',
      address: {
        street: 'Av. Paulista',
        number: '1000',
        complement: 'Conjunto 25',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        zipcode: '01310-100'
      },
      portal_access: false,
      relationship_manager: 'Dr. João Santos Oliveira'
    },
    '3': {
      id: '3',
      client_number: 'CLI-2024-003',
      name: 'Empresa ABC Ltda',
      type: 'pessoa_juridica',
      cpf: null,
      cnpj: '12.345.678/0001-90',
      email: 'contato@empresaabc.com.br',
      phone: '(11) 3456-7890',
      mobile: null,
      whatsapp: '(11) 9 8888-7777',
      birth_date: null,
      status: 'ativo',
      created_at: '2024-01-20',
      address: {
        street: 'Rua Comercial',
        number: '500',
        complement: 'Andar 5',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zipcode: '01234-000'
      },
      portal_access: true,
      relationship_manager: 'Dr. Carlos Mendes Lima'
    }
  }
  
  return clients[id as keyof typeof clients] || null
}

// Mock matters linked to this client
const getClientMatters = (clientId: string) => {
  const allMatters = [
    {
      id: '1',
      matter_number: 'PROC-2024-001',
      title: 'Ação Trabalhista - Rescisão Indevida',
      status: 'ativo',
      area_juridica: 'trabalhista',
      client_id: '1',
      created_date: '2024-01-10',
      last_update: '2024-01-20',
      next_hearing: '2024-02-15',
      assigned_lawyer: 'Dra. Maria Silva Santos',
      priority: 'alta',
      case_value: 50000.00,
      progress_percentage: 35
    },
    {
      id: '2',
      matter_number: 'PROC-2024-012',
      title: 'Revisão Contratual - Compra e Venda',
      status: 'aguardando_documentos',
      area_juridica: 'civil',
      client_id: '2',
      created_date: '2024-01-15',
      last_update: '2024-01-18',
      next_hearing: null,
      assigned_lawyer: 'Dr. João Santos Oliveira',
      priority: 'media',
      case_value: 25000.00,
      progress_percentage: 15
    },
    {
      id: '3',
      matter_number: 'PROC-2024-018',
      title: 'Consultoria Empresarial - Compliance',
      status: 'ativo',
      area_juridica: 'empresarial',
      client_id: '3',
      created_date: '2024-01-22',
      last_update: '2024-01-25',
      next_hearing: null,
      assigned_lawyer: 'Dr. Carlos Mendes Lima',
      priority: 'media',
      case_value: 75000.00,
      progress_percentage: 60
    },
    {
      id: '4',
      matter_number: 'PROC-2024-025',
      title: 'Defesa em Processo Administrativo',
      status: 'suspenso',
      area_juridica: 'administrativo',
      client_id: '1',
      created_date: '2024-01-25',
      last_update: '2024-01-26',
      next_hearing: '2024-03-10',
      assigned_lawyer: 'Dra. Maria Silva Santos',
      priority: 'baixa',
      case_value: 15000.00,
      progress_percentage: 5
    }
  ]
  
  return allMatters.filter(matter => matter.client_id === clientId)
}

const getStatusColor = (status: string) => {
  const colors = {
    ativo: 'text-green-700 bg-green-50 ring-green-600/20',
    potencial: 'text-blue-700 bg-blue-50 ring-blue-600/20',
    inativo: 'text-gray-700 bg-gray-50 ring-gray-600/20',
    suspenso: 'text-red-700 bg-red-50 ring-red-600/20',
    aguardando_documentos: 'text-yellow-700 bg-yellow-50 ring-yellow-600/20'
  }
  return colors[status as keyof typeof colors] || colors.ativo
}

const getStatusLabel = (status: string) => {
  const labels = {
    ativo: 'Ativo',
    potencial: 'Potencial',
    inativo: 'Inativo',
    suspenso: 'Suspenso',
    aguardando_documentos: 'Aguardando Documentos'
  }
  return labels[status as keyof typeof labels] || status
}

const getPriorityIcon = (priority: string) => {
  if (priority === 'alta') {
    return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
  }
  if (priority === 'media') {
    return <ClockIcon className="h-4 w-4 text-yellow-500" />
  }
  return <CheckCircleIcon className="h-4 w-4 text-green-500" />
}

export default function ClientDetailPage() {
  const params = useParams()
  const clientId = params.id as string
  
  const [isLoading, setIsLoading] = useState(true)
  const [client, setClient] = useState<any>(null)
  const [clientMatters, setClientMatters] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    // Load client data
    const clientData = getMockClientDetail(clientId)
    if (clientData) {
      setClient(clientData)
      setClientMatters(getClientMatters(clientId))
    }
    setTimeout(() => setIsLoading(false), 1000)
  }, [clientId])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  const calculateTotalCaseValue = () => {
    return clientMatters.reduce((total, matter) => total + matter.case_value, 0)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dados do cliente...</p>
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          Cliente não encontrado
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          O cliente solicitado não existe ou foi removido.
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4">
          <div className="flex items-center space-x-3 mb-4">
            <Link
              href="/clients"
              className="text-gray-400 hover:text-gray-600"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </Link>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3">
                    <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
                    {client.type === 'pessoa_fisica' ? (
                      <UserIcon className="h-6 w-6 text-blue-500" />
                    ) : (
                      <BuildingOfficeIcon className="h-6 w-6 text-purple-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {client.client_number} • Cliente desde {formatDate(client.created_at)}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(client.status)}`}>
                    {getStatusLabel(client.status)}
                  </span>
                  <Link
                    href={`/clients/${client.id}/edit`}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Editar
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-900">{clientMatters.length}</p>
                  <p className="text-xs text-blue-700">Processos</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-900">
                    {clientMatters.filter(m => m.status === 'ativo').length}
                  </p>
                  <p className="text-xs text-green-700">Ativos</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center">
                <CalendarIcon className="h-5 w-5 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-purple-900">
                    {clientMatters.filter(m => m.next_hearing).length}
                  </p>
                  <p className="text-xs text-purple-700">Audiências</p>
                </div>
              </div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center">
                <UserGroupIcon className="h-5 w-5 text-orange-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-orange-900">{formatCurrency(calculateTotalCaseValue())}</p>
                  <p className="text-xs text-orange-700">Valor Total</p>
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
              Visão Geral
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
              Processos ({clientMatters.length})
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
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Informações Pessoais</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Tipo</dt>
                      <dd className="text-sm text-gray-900">
                        {client.type === 'pessoa_fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">
                        {client.type === 'pessoa_fisica' ? 'CPF' : 'CNPJ'}
                      </dt>
                      <dd className="text-sm text-gray-900">
                        {client.type === 'pessoa_fisica' ? client.cpf : client.cnpj}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">E-mail</dt>
                      <dd className="text-sm text-gray-900">{client.email}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Telefone</dt>
                      <dd className="text-sm text-gray-900">{client.phone}</dd>
                    </div>
                    {client.mobile && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Celular</dt>
                        <dd className="text-sm text-gray-900">{client.mobile}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Portal do Cliente</dt>
                      <dd className="text-sm text-gray-900">
                        {client.portal_access ? (
                          <span className="text-green-600">✓ Habilitado</span>
                        ) : (
                          <span className="text-gray-500">Desabilitado</span>
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Endereço</h3>
                  <div className="text-sm text-gray-900 space-y-1">
                    <p>{client.address.street}, {client.address.number}</p>
                    {client.address.complement && <p>{client.address.complement}</p>}
                    <p>{client.address.neighborhood}</p>
                    <p>{client.address.city} - {client.address.state}</p>
                    <p>CEP: {client.address.zipcode}</p>
                  </div>

                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Responsável pela Conta</h4>
                    <p className="text-sm text-gray-600">{client.relationship_manager}</p>
                  </div>
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

              {clientMatters.length === 0 ? (
                <div className="text-center py-12">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Nenhum processo encontrado
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Este cliente ainda não possui processos cadastrados.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {clientMatters.map((matter) => (
                    <div key={matter.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900 mb-1">
                            {matter.title}
                          </h4>
                          <p className="text-sm text-gray-500">{matter.matter_number}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getPriorityIcon(matter.priority)}
                          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(matter.status)}`}>
                            {getStatusLabel(matter.status)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Área:</span>
                          <span className="text-gray-900 capitalize">{matter.area_juridica}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Advogado:</span>
                          <span className="text-gray-900">{matter.assigned_lawyer}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Valor:</span>
                          <span className="text-gray-900">{formatCurrency(matter.case_value)}</span>
                        </div>
                        {matter.next_hearing && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Próxima audiência:</span>
                            <span className="text-gray-900">{formatDate(matter.next_hearing)}</span>
                          </div>
                        )}
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Progresso</span>
                          <span>{matter.progress_percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${matter.progress_percentage}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-500">
                          Atualizado: {formatDate(matter.last_update)}
                        </p>
                        <Link
                          href={`/matters/${matter.id}`}
                          className="text-primary hover:text-primary/80 text-sm font-medium"
                        >
                          Ver detalhes →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Contact Tab */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Informações de Contato</h4>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{client.email}</p>
                        <p className="text-xs text-gray-500">E-mail principal</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{client.phone}</p>
                        <p className="text-xs text-gray-500">Telefone</p>
                      </div>
                    </div>
                    {client.mobile && (
                      <div className="flex items-center">
                        <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{client.mobile}</p>
                          <p className="text-xs text-gray-500">Celular</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center">
                      <MapPinIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {client.address.street}, {client.address.number}
                        </p>
                        <p className="text-xs text-gray-500">
                          {client.address.city} - {client.address.state}, {client.address.zipcode}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Responsável</h4>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <UserIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{client.relationship_manager}</p>
                        <p className="text-xs text-gray-500">Advogado responsável</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Link
                      href="/messages"
                      className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90"
                    >
                      Enviar Mensagem
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}