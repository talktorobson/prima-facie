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
  BuildingOfficeIcon,
  PhoneIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

// Mock data for development
const mockClients = [
  {
    id: '1',
    client_number: 'CLI-2024-001',
    name: 'João Silva Santos',
    type: 'pessoa_fisica',
    cpf: '123.456.789-00',
    cnpj: null,
    email: 'joao.silva@email.com',
    phone: '(11) 9 8765-4321',
    status: 'ativo',
    client_since: '2024-01-15',
    relationship_manager: 'Maria Silva Santos',
    total_matters: 2,
    active_matters: 1,
    address_city: 'São Paulo',
    address_state: 'SP',
    last_contact_date: '2024-01-20',
    portal_enabled: true
  },
  {
    id: '2',
    client_number: 'CLI-2024-002',
    name: 'Ana Costa Pereira',
    type: 'pessoa_fisica',
    cpf: '987.654.321-00',
    cnpj: null,
    email: 'ana.costa@email.com',
    phone: '(11) 9 1234-5678',
    status: 'ativo',
    client_since: '2024-01-20',
    relationship_manager: 'João Santos Oliveira',
    total_matters: 1,
    active_matters: 1,
    address_city: 'São Paulo',
    address_state: 'SP',
    last_contact_date: '2024-01-22',
    portal_enabled: false
  },
  {
    id: '3',
    client_number: 'CLI-2024-003',
    name: 'Empresa ABC Ltda',
    type: 'pessoa_juridica',
    cpf: null,
    cnpj: '12.345.678/0001-90',
    email: 'contato@empresaabc.com.br',
    phone: '(11) 3456-7890',
    status: 'ativo',
    client_since: '2023-12-10',
    relationship_manager: 'Maria Silva Santos',
    total_matters: 3,
    active_matters: 2,
    address_city: 'São Paulo',
    address_state: 'SP',
    last_contact_date: '2024-01-18',
    portal_enabled: true
  },
  {
    id: '4',
    client_number: 'CLI-2024-004',
    name: 'Pedro Rodrigues Oliveira',
    type: 'pessoa_fisica',
    cpf: '456.789.123-00',
    cnpj: null,
    email: 'pedro.rodrigues@email.com',
    phone: '(11) 9 5555-4444',
    status: 'potencial',
    client_since: '2024-01-25',
    relationship_manager: 'Carlos Mendes Lima',
    total_matters: 1,
    active_matters: 0,
    address_city: 'Santos',
    address_state: 'SP',
    last_contact_date: '2024-01-25',
    portal_enabled: false
  },
  {
    id: '5',
    client_number: 'CLI-2023-045',
    name: 'Tech Solutions S.A.',
    type: 'pessoa_juridica',
    cpf: null,
    cnpj: '98.765.432/0001-10',
    email: 'juridico@techsolutions.com.br',
    phone: '(11) 2222-3333',
    status: 'inativo',
    client_since: '2023-08-15',
    relationship_manager: 'João Santos Oliveira',
    total_matters: 5,
    active_matters: 0,
    address_city: 'São Paulo',
    address_state: 'SP',
    last_contact_date: '2023-12-20',
    portal_enabled: false
  }
]

const statusOptions = [
  { value: '', label: 'Todos os Status' },
  { value: 'ativo', label: 'Ativo' },
  { value: 'inativo', label: 'Inativo' },
  { value: 'suspenso', label: 'Suspenso' },
  { value: 'potencial', label: 'Potencial' },
  { value: 'ex_cliente', label: 'Ex-Cliente' }
]

const typeOptions = [
  { value: '', label: 'Todos os Tipos' },
  { value: 'pessoa_fisica', label: 'Pessoa Física' },
  { value: 'pessoa_juridica', label: 'Pessoa Jurídica' }
]

const relationshipManagerOptions = [
  { value: '', label: 'Todos os Responsáveis' },
  { value: 'Maria Silva Santos', label: 'Maria Silva Santos' },
  { value: 'João Santos Oliveira', label: 'João Santos Oliveira' },
  { value: 'Carlos Mendes Lima', label: 'Carlos Mendes Lima' }
]

export default function ClientsPage() {
  const [clients, setClients] = useState(mockClients)
  const [filteredClients, setFilteredClients] = useState(mockClients)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [managerFilter, setManagerFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Filter and search logic
  useEffect(() => {
    let filtered = clients

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.client_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.cpf && client.cpf.includes(searchTerm)) ||
        (client.cnpj && client.cnpj.includes(searchTerm))
      )
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(client => client.status === statusFilter)
    }

    // Type filter
    if (typeFilter) {
      filtered = filtered.filter(client => client.type === typeFilter)
    }

    // Manager filter
    if (managerFilter) {
      filtered = filtered.filter(client => client.relationship_manager === managerFilter)
    }

    setFilteredClients(filtered)
    setCurrentPage(1) // Reset to first page when filtering
  }, [searchTerm, statusFilter, typeFilter, managerFilter, clients])

  // Pagination
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentClients = filteredClients.slice(startIndex, endIndex)

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      ativo: 'bg-green-100 text-green-800',
      inativo: 'bg-gray-100 text-gray-800',
      suspenso: 'bg-red-100 text-red-800',
      potencial: 'bg-blue-100 text-blue-800',
      ex_cliente: 'bg-slate-100 text-slate-800'
    }

    const statusLabels = {
      ativo: 'Ativo',
      inativo: 'Inativo',
      suspenso: 'Suspenso',
      potencial: 'Potencial',
      ex_cliente: 'Ex-Cliente'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status as keyof typeof statusLabels] || status}
      </span>
    )
  }

  const getTypeIcon = (type: string) => {
    return type === 'pessoa_fisica' ? (
      <UserIcon className="h-4 w-4 text-blue-600" />
    ) : (
      <BuildingOfficeIcon className="h-4 w-4 text-purple-600" />
    )
  }

  const getTypeLabel = (type: string) => {
    return type === 'pessoa_fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatDocument = (client: any) => {
    return client.type === 'pessoa_fisica' ? client.cpf : client.cnpj
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="mt-2 text-gray-600">
            Gerencie todos os clientes do escritório
          </p>
        </div>
        <Link
          href="/clients/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Novo Cliente
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total de Clientes
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {clients.length}
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
                <DocumentTextIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Clientes Ativos
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {clients.filter(c => c.status === 'ativo').length}
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
                <CalendarIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Potenciais
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {clients.filter(c => c.status === 'potencial').length}
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
                <PhoneIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Portal Ativo
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {clients.filter(c => c.portal_enabled).length}
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
                  placeholder="Buscar por nome, e-mail, CPF/CNPJ..."
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
                  <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700">
                    Tipo
                  </label>
                  <select
                    id="type-filter"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    {typeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="manager-filter" className="block text-sm font-medium text-gray-700">
                    Responsável
                  </label>
                  <select
                    id="manager-filter"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                    value={managerFilter}
                    onChange={(e) => setManagerFilter(e.target.value)}
                  >
                    {relationshipManagerOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Clear Filters */}
              {(searchTerm || statusFilter || typeFilter || managerFilter) && (
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setStatusFilter('')
                      setTypeFilter('')
                      setManagerFilter('')
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
        Mostrando {startIndex + 1}-{Math.min(endIndex, filteredClients.length)} de {filteredClients.length} clientes
      </div>

      {/* Clients Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {currentClients.map((client) => (
            <li key={client.id}>
              <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          {getTypeIcon(client.type)}
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium text-primary truncate">
                                {client.client_number}
                              </p>
                              {getStatusBadge(client.status)}
                              {client.portal_enabled && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  Portal
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-lg font-medium text-gray-900 truncate">
                              {client.name}
                            </p>
                            <div className="mt-1 flex items-center text-sm text-gray-500 space-x-4">
                              <span>{getTypeLabel(client.type)}</span>
                              <span>•</span>
                              <span>{formatDocument(client)}</span>
                              <span>•</span>
                              <span>{client.email}</span>
                            </div>
                            <div className="mt-1 flex items-center text-sm text-gray-500 space-x-4">
                              <span>Responsável: {client.relationship_manager}</span>
                              <span>•</span>
                              <span>Cliente desde: {formatDate(client.client_since)}</span>
                              <span>•</span>
                              <span>{client.address_city}/{client.address_state}</span>
                            </div>
                            <div className="mt-1 flex items-center text-sm text-gray-500 space-x-4">
                              <span>Processos: {client.active_matters} ativos de {client.total_matters} total</span>
                              <span>•</span>
                              <span>Último contato: {formatDate(client.last_contact_date)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="ml-5 flex-shrink-0 flex space-x-2">
                    <Link
                      href={`/clients/${client.id}`}
                      className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                      title="Ver detalhes"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`/clients/${client.id}/edit`}
                      className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                      title="Editar cliente"
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
        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Nenhum cliente encontrado
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter || typeFilter || managerFilter
                ? 'Tente ajustar os filtros de busca.'
                : 'Comece criando um novo cliente.'}
            </p>
            {!searchTerm && !statusFilter && !typeFilter && !managerFilter && (
              <div className="mt-6">
                <Link
                  href="/clients/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                  Novo Cliente
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
                  <span className="font-medium">{Math.min(endIndex, filteredClients.length)}</span> de{' '}
                  <span className="font-medium">{filteredClients.length}</span> resultados
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