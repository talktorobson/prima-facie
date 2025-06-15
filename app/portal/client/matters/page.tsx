'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  DocumentTextIcon,
  ClockIcon,
  CalendarIcon,
  UserIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'

// Mock data for client matters
const mockClientMatters = [
  {
    id: '1',
    matter_number: 'PROC-2024-001',
    title: 'Ação Trabalhista - Rescisão Indevida',
    status: 'ativo',
    area_juridica: 'trabalhista',
    created_date: '2024-01-10',
    last_update: '2024-01-20',
    next_hearing: '2024-02-15',
    assigned_lawyer: 'Dra. Maria Silva Santos',
    priority: 'alta',
    client_summary: 'Processo em andamento. Aguardando resposta da empresa ré. Última petição protocolada em 20/01/2024.',
    estimated_duration: '6 meses',
    case_value: 50000.00,
    progress_percentage: 35,
    recent_updates: [
      {
        date: '2024-01-20',
        title: 'Petição inicial protocolada',
        description: 'Petição inicial foi protocolada no TRT-2'
      },
      {
        date: '2024-01-18',
        title: 'Audiência agendada',
        description: 'Audiência de conciliação marcada para 15/02/2024'
      }
    ],
    documents_count: 8,
    accessible_documents: 6
  },
  {
    id: '2',
    matter_number: 'PROC-2024-012',
    title: 'Revisão Contratual - Compra e Venda',
    status: 'aguardando_documentos',
    area_juridica: 'civil',
    created_date: '2024-01-15',
    last_update: '2024-01-18',
    next_hearing: null,
    assigned_lawyer: 'Dr. João Santos Oliveira',
    priority: 'media',
    client_summary: 'Necessário envio de documentos complementares para prosseguimento. Prazo até 25/01/2024.',
    estimated_duration: '3 meses',
    case_value: 25000.00,
    progress_percentage: 15,
    recent_updates: [
      {
        date: '2024-01-18',
        title: 'Solicitação de documentos',
        description: 'Dr. João solicitou documentos complementares'
      }
    ],
    documents_count: 3,
    accessible_documents: 3
  },
  {
    id: '3',
    matter_number: 'PROC-2023-089',
    title: 'Inventário - Sucessão',
    status: 'finalizado',
    area_juridica: 'familia',
    created_date: '2023-08-10',
    last_update: '2023-12-20',
    next_hearing: null,
    assigned_lawyer: 'Dra. Maria Silva Santos',
    priority: 'baixa',
    client_summary: 'Processo finalizado com sucesso. Partilha de bens concluída.',
    estimated_duration: '4 meses',
    case_value: 15000.00,
    progress_percentage: 100,
    recent_updates: [
      {
        date: '2023-12-20',
        title: 'Processo finalizado',
        description: 'Inventário concluído com partilha de bens'
      }
    ],
    documents_count: 15,
    accessible_documents: 12
  }
]

const statusOptions = [
  { value: '', label: 'Todos os Status' },
  { value: 'ativo', label: 'Ativo' },
  { value: 'aguardando_documentos', label: 'Aguardando Documentos' },
  { value: 'suspenso', label: 'Suspenso' },
  { value: 'finalizado', label: 'Finalizado' }
]

const areaOptions = [
  { value: '', label: 'Todas as Áreas' },
  { value: 'trabalhista', label: 'Trabalhista' },
  { value: 'civil', label: 'Civil' },
  { value: 'familia', label: 'Família' },
  { value: 'empresarial', label: 'Empresarial' }
]

const getStatusColor = (status: string) => {
  const colors = {
    ativo: 'text-green-700 bg-green-50 ring-green-600/20',
    aguardando_documentos: 'text-yellow-700 bg-yellow-50 ring-yellow-600/20',
    suspenso: 'text-red-700 bg-red-50 ring-red-600/20',
    finalizado: 'text-gray-700 bg-gray-50 ring-gray-600/20'
  }
  return colors[status as keyof typeof colors] || colors.ativo
}

const getStatusLabel = (status: string) => {
  const labels = {
    ativo: 'Ativo',
    aguardando_documentos: 'Aguardando Documentos',
    suspenso: 'Suspenso',
    finalizado: 'Finalizado'
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

const getAreaLabel = (area: string) => {
  const labels = {
    trabalhista: 'Trabalhista',
    civil: 'Civil',
    familia: 'Família',
    empresarial: 'Empresarial'
  }
  return labels[area as keyof typeof labels] || area
}

export default function ClientMattersPage() {
  const [matters, setMatters] = useState(mockClientMatters)
  const [filteredMatters, setFilteredMatters] = useState(mockClientMatters)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [areaFilter, setAreaFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setIsLoading(false), 1000)
  }, [])

  useEffect(() => {
    let filtered = matters

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(matter =>
        matter.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        matter.matter_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        matter.assigned_lawyer.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(matter => matter.status === statusFilter)
    }

    // Area filter
    if (areaFilter) {
      filtered = filtered.filter(matter => matter.area_juridica === areaFilter)
    }

    setFilteredMatters(filtered)
  }, [searchTerm, statusFilter, areaFilter, matters])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando seus processos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Meus Processos</h1>
        <p className="mt-2 text-gray-600">
          Acompanhe o andamento de todos os seus casos jurídicos
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total de Processos
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {matters.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Processos Ativos
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {matters.filter(m => m.status === 'ativo').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Aguardando Ação
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {matters.filter(m => m.status === 'aguardando_documentos').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Próximas Audiências
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {matters.filter(m => m.next_hearing).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                  placeholder="Buscar por título, número ou advogado..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <FunnelIcon className="-ml-1 mr-2 h-5 w-5" />
              Filtros
              <ChevronDownIcon className={`ml-2 h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    id="status-filter"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="area-filter" className="block text-sm font-medium text-gray-700">
                    Área Jurídica
                  </label>
                  <select
                    id="area-filter"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                    value={areaFilter}
                    onChange={(e) => setAreaFilter(e.target.value)}
                  >
                    {areaOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Clear Filters */}
              {(searchTerm || statusFilter || areaFilter) && (
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setStatusFilter('')
                      setAreaFilter('')
                    }}
                    className="text-sm text-primary hover:text-primary/80"
                  >
                    Limpar todos os filtros
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-700">
        Mostrando {filteredMatters.length} de {matters.length} processos
      </div>

      {/* Matters List */}
      <div className="space-y-4">
        {filteredMatters.map((matter) => (
          <div key={matter.id} className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {matter.title}
                      </h3>
                      {getPriorityIcon(matter.priority)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(matter.status)}`}>
                        {getStatusLabel(matter.status)}
                      </span>
                      <Link
                        href={`/portal/client/matters/${matter.id}`}
                        className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                        title="Ver detalhes"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <DocumentTextIcon className="h-4 w-4 mr-2" />
                      {matter.matter_number}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <UserIcon className="h-4 w-4 mr-2" />
                      {matter.assigned_lawyer}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {matter.next_hearing ? formatDate(matter.next_hearing) : 'Sem audiência'}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <ClockIcon className="h-4 w-4 mr-2" />
                      {formatDate(matter.last_update)}
                    </div>
                  </div>

                  {/* Summary */}
                  <p className="text-sm text-gray-600 mb-4">
                    {matter.client_summary}
                  </p>

                  {/* Progress and Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
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
                    <div className="text-sm">
                      <span className="text-gray-500">Área: </span>
                      <span className="font-medium">{getAreaLabel(matter.area_juridica)}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Documentos: </span>
                      <span className="font-medium">{matter.accessible_documents}/{matter.documents_count}</span>
                    </div>
                  </div>

                  {/* Recent Updates */}
                  {matter.recent_updates.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Últimas Atualizações</h4>
                      <div className="space-y-2">
                        {matter.recent_updates.slice(0, 2).map((update, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <div className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{update.title}</p>
                              <p className="text-xs text-gray-500">{update.description} - {formatDate(update.date)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {filteredMatters.length === 0 && (
          <div className="text-center py-12 bg-white shadow rounded-lg">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Nenhum processo encontrado
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter || areaFilter
                ? 'Tente ajustar os filtros de busca.'
                : 'Você não possui processos ativos no momento.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}