'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  DocumentTextIcon,
  CalendarIcon,
  UserIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

// Mock data for development
const mockMatters = [
  {
    id: '1',
    matter_number: '2024/001',
    title: 'Ação Trabalhista - Rescisão Indevida',
    client_name: 'João Silva Santos',
    area_juridica: 'Trabalhista',
    status: 'ativo',
    priority: 'alta',
    responsible_lawyer: 'Maria Silva Santos',
    opened_date: '2024-01-15',
    next_hearing_date: '2024-02-20T14:00:00',
    case_value: 25000.00,
    processo_numero: '5001234-20.2024.5.02.0001'
  },
  {
    id: '2',
    matter_number: '2024/002',
    title: 'Divórcio Consensual',
    client_name: 'Ana Costa Pereira',
    area_juridica: 'Família',
    status: 'analise',
    priority: 'media',
    responsible_lawyer: 'João Santos Oliveira',
    opened_date: '2024-01-20',
    case_value: 0,
    processo_numero: null
  },
  {
    id: '3',
    matter_number: '2024/003',
    title: 'Consultoria Empresarial - Contrato de Sociedade',
    client_name: 'Empresa ABC Ltda',
    area_juridica: 'Empresarial',
    status: 'finalizado',
    priority: 'baixa',
    responsible_lawyer: 'Maria Silva Santos',
    opened_date: '2023-12-10',
    closed_date: '2024-01-10',
    case_value: 50000.00
  },
  {
    id: '4',
    matter_number: '2024/004',
    title: 'Ação de Cobrança',
    client_name: 'Pedro Rodrigues',
    area_juridica: 'Civil',
    status: 'aguardando_cliente',
    priority: 'urgente',
    responsible_lawyer: 'João Santos Oliveira',
    opened_date: '2024-01-25',
    next_hearing_date: '2024-02-15T10:30:00',
    case_value: 15000.00,
    processo_numero: '1001234-20.2024.8.26.0001'
  }
]

const statusOptions = [
  { value: '', label: 'Todos os Status' },
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

const areaOptions = [
  { value: '', label: 'Todas as Áreas' },
  { value: 'Civil', label: 'Civil' },
  { value: 'Criminal', label: 'Criminal' },
  { value: 'Trabalhista', label: 'Trabalhista' },
  { value: 'Empresarial', label: 'Empresarial' },
  { value: 'Tributário', label: 'Tributário' },
  { value: 'Previdenciário', label: 'Previdenciário' },
  { value: 'Família', label: 'Família' },
  { value: 'Consumidor', label: 'Consumidor' },
  { value: 'Ambiental', label: 'Ambiental' },
  { value: 'Administrativo', label: 'Administrativo' }
]

const priorityOptions = [
  { value: '', label: 'Todas as Prioridades' },
  { value: 'baixa', label: 'Baixa' },
  { value: 'media', label: 'Média' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' }
]

export default function MattersPage() {
  const [matters, setMatters] = useState(mockMatters)
  const [filteredMatters, setFilteredMatters] = useState(mockMatters)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [areaFilter, setAreaFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Filter and search logic
  useEffect(() => {
    let filtered = matters

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(matter =>
        matter.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        matter.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        matter.matter_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (matter.processo_numero && matter.processo_numero.toLowerCase().includes(searchTerm.toLowerCase()))
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

    // Priority filter
    if (priorityFilter) {
      filtered = filtered.filter(matter => matter.priority === priorityFilter)
    }

    setFilteredMatters(filtered)
    setCurrentPage(1) // Reset to first page when filtering
  }, [searchTerm, statusFilter, areaFilter, priorityFilter, matters])

  // Pagination
  const totalPages = Math.ceil(filteredMatters.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentMatters = filteredMatters.slice(startIndex, endIndex)

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      novo: 'bg-blue-100 text-blue-800',
      analise: 'bg-yellow-100 text-yellow-800',
      ativo: 'bg-green-100 text-green-800',
      suspenso: 'bg-gray-100 text-gray-800',
      aguardando_cliente: 'bg-orange-100 text-orange-800',
      aguardando_documentos: 'bg-purple-100 text-purple-800',
      finalizado: 'bg-emerald-100 text-emerald-800',
      arquivado: 'bg-slate-100 text-slate-800',
      cancelado: 'bg-red-100 text-red-800'
    }

    const statusLabels = {
      novo: 'Novo',
      analise: 'Em Análise',
      ativo: 'Ativo',
      suspenso: 'Suspenso',
      aguardando_cliente: 'Aguardando Cliente',
      aguardando_documentos: 'Aguardando Docs',
      finalizado: 'Finalizado',
      arquivado: 'Arquivado',
      cancelado: 'Cancelado'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status as keyof typeof statusLabels] || status}
      </span>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const priorityStyles = {
      baixa: 'bg-gray-100 text-gray-600',
      media: 'bg-blue-100 text-blue-600',
      alta: 'bg-orange-100 text-orange-600',
      urgente: 'bg-red-100 text-red-600'
    }

    const priorityLabels = {
      baixa: 'Baixa',
      media: 'Média',
      alta: 'Alta',
      urgente: 'Urgente'
    }

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${priorityStyles[priority as keyof typeof priorityStyles] || 'bg-gray-100 text-gray-600'}`}>
        {priorityLabels[priority as keyof typeof priorityLabels] || priority}
      </span>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Processos</h1>
          <p className="mt-2 text-gray-600">
            Gerencie todos os processos jurídicos do escritório
          </p>
        </div>
        <Link
          href="/matters/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Novo Processo
        </Link>
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
                <CalendarIcon className="h-6 w-6 text-green-600" />
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
                <UserIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Aguardando Ação
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {matters.filter(m => m.status === 'aguardando_cliente' || m.status === 'aguardando_documentos').length}
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
                <DocumentTextIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Finalizados (Este Mês)
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {matters.filter(m => m.status === 'finalizado').length}
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
                  placeholder="Buscar por título, cliente, número do processo..."
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

                <div>
                  <label htmlFor="priority-filter" className="block text-sm font-medium text-gray-700">
                    Prioridade
                  </label>
                  <select
                    id="priority-filter"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                  >
                    {priorityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Clear Filters */}
              {(searchTerm || statusFilter || areaFilter || priorityFilter) && (
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setStatusFilter('')
                      setAreaFilter('')
                      setPriorityFilter('')
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
        Mostrando {startIndex + 1}-{Math.min(endIndex, filteredMatters.length)} de {filteredMatters.length} processos
      </div>

      {/* Matters Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {currentMatters.map((matter) => (
            <li key={matter.id}>
              <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-primary truncate">
                            {matter.matter_number}
                          </p>
                          {getPriorityBadge(matter.priority)}
                          {getStatusBadge(matter.status)}
                        </div>
                        <p className="mt-1 text-lg font-medium text-gray-900 truncate">
                          {matter.title}
                        </p>
                        <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                          <span>Cliente: {matter.client_name}</span>
                          <span>•</span>
                          <span>Área: {matter.area_juridica}</span>
                          <span>•</span>
                          <span>Responsável: {matter.responsible_lawyer}</span>
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500 space-x-4">
                          <span>Aberto em: {formatDate(matter.opened_date)}</span>
                          {matter.processo_numero && (
                            <>
                              <span>•</span>
                              <span>Processo: {matter.processo_numero}</span>
                            </>
                          )}
                          {matter.case_value > 0 && (
                            <>
                              <span>•</span>
                              <span>Valor: {formatCurrency(matter.case_value)}</span>
                            </>
                          )}
                        </div>
                        {matter.next_hearing_date && (
                          <div className="mt-1 flex items-center text-sm text-orange-600">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            Próxima audiência: {formatDateTime(matter.next_hearing_date)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="ml-5 flex-shrink-0 flex space-x-2">
                    <Link
                      href={`/matters/${matter.id}`}
                      className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`/matters/${matter.id}/edit`}
                      className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Empty State */}
        {filteredMatters.length === 0 && (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Nenhum processo encontrado
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter || areaFilter || priorityFilter
                ? 'Tente ajustar os filtros de busca.'
                : 'Comece criando um novo processo.'}
            </p>
            {!searchTerm && !statusFilter && !areaFilter && !priorityFilter && (
              <div className="mt-6">
                <Link
                  href="/matters/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                  Novo Processo
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próximo
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando <span className="font-medium">{startIndex + 1}</span> até{' '}
                  <span className="font-medium">{Math.min(endIndex, filteredMatters.length)}</span> de{' '}
                  <span className="font-medium">{filteredMatters.length}</span> resultados
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-primary border-primary text-white'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}