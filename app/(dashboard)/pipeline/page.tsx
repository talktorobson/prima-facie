'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UserPlusIcon,
  ChevronDownIcon,
  UserIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase/client'
import { useAuthContext } from '@/lib/providers/auth-provider'
import { useEffectiveLawFirmId } from '@/lib/hooks/use-effective-law-firm-id'

interface Lead {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  source: string
  status: 'novo' | 'contato_inicial' | 'qualificado' | 'proposta' | 'negociacao' | 'ganho' | 'perdido'
  estimated_value?: number
  probability: number
  legal_area: string
  description: string
  created_at: string
  next_action?: string
  next_action_date?: string
  assigned_lawyer?: string
}

const statusOptions = [
  { value: '', label: 'Todos os Status' },
  { value: 'novo', label: 'Novo' },
  { value: 'contato_inicial', label: 'Contato Inicial' },
  { value: 'qualificado', label: 'Qualificado' },
  { value: 'proposta', label: 'Proposta Enviada' },
  { value: 'negociacao', label: 'Em Negociação' },
  { value: 'ganho', label: 'Ganho' },
  { value: 'perdido', label: 'Perdido' }
]

const sourceOptions = [
  { value: '', label: 'Todas as Origens' },
  { value: 'website', label: 'Site' },
  { value: 'referral', label: 'Indicação' },
  { value: 'google', label: 'Google' },
  { value: 'social_media', label: 'Redes Sociais' },
  { value: 'evento', label: 'Evento' },
  { value: 'cold_call', label: 'Cold Call' },
  { value: 'outros', label: 'Outros' }
]

const legalAreaOptions = [
  { value: '', label: 'Todas as Áreas' },
  { value: 'Civil', label: 'Civil' },
  { value: 'Criminal', label: 'Criminal' },
  { value: 'Trabalhista', label: 'Trabalhista' },
  { value: 'Empresarial', label: 'Empresarial' },
  { value: 'Tributário', label: 'Tributário' },
  { value: 'Previdenciário', label: 'Previdenciário' },
  { value: 'Família', label: 'Família' },
  { value: 'Consumidor', label: 'Consumidor' }
]

export default function PipelinePage() {
  const { profile } = useAuthContext()
  const effectiveLawFirmId = useEffectiveLawFirmId()
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [areaFilter, setAreaFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Pipeline stats
  const [stats, setStats] = useState({
    totalLeads: 0,
    newLeads: 0,
    qualified: 0,
    inNegotiation: 0,
    wonThisMonth: 0,
    totalValue: 0,
    conversionRate: 0
  })

  useEffect(() => {
    fetchLeads()
  }, [profile])

  useEffect(() => {
    filterLeads()
  }, [searchTerm, statusFilter, sourceFilter, areaFilter, leads])

  const fetchLeads = async () => {
    if (!effectiveLawFirmId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // For now, we'll use sample data since the leads table might not exist yet
      // In a real implementation, this would be a Supabase query
      const sampleLeads: Lead[] = [
        {
          id: '1',
          name: 'Maria Santos Silva',
          email: 'maria.santos@email.com',
          phone: '(11) 9 8765-4321',
          company: 'Empresa ABC Ltda',
          source: 'website',
          status: 'novo',
          estimated_value: 25000,
          probability: 20,
          legal_area: 'Trabalhista',
          description: 'Consulta sobre rescisão trabalhista indevida',
          created_at: new Date().toISOString(),
          next_action: 'Ligar para agendar consulta',
          next_action_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          assigned_lawyer: 'João Advogado'
        },
        {
          id: '2',
          name: 'Carlos Oliveira',
          email: 'carlos@empresa.com',
          phone: '(11) 9 1234-5678',
          company: 'Tech Solutions',
          source: 'referral',
          status: 'qualificado',
          estimated_value: 50000,
          probability: 60,
          legal_area: 'Empresarial',
          description: 'Revisão de contratos de parceria',
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          next_action: 'Enviar proposta comercial',
          next_action_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          assigned_lawyer: 'Maria Advogada'
        },
        {
          id: '3',
          name: 'Ana Paula Costa',
          email: 'ana.costa@email.com',
          phone: '(11) 9 9876-5432',
          source: 'google',
          status: 'proposta',
          estimated_value: 15000,
          probability: 75,
          legal_area: 'Família',
          description: 'Processo de divórcio consensual',
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          next_action: 'Aguardar resposta da proposta',
          next_action_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          assigned_lawyer: 'Pedro Advogado'
        }
      ]

      setLeads(sampleLeads)
      calculateStats(sampleLeads)
    } catch (error) {
      console.error('Error fetching leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (leadsData: Lead[]) => {
    const stats = {
      totalLeads: leadsData.length,
      newLeads: leadsData.filter(l => l.status === 'novo').length,
      qualified: leadsData.filter(l => l.status === 'qualificado').length,
      inNegotiation: leadsData.filter(l => ['proposta', 'negociacao'].includes(l.status)).length,
      wonThisMonth: leadsData.filter(l => l.status === 'ganho').length,
      totalValue: leadsData.reduce((sum, l) => sum + (l.estimated_value || 0), 0),
      conversionRate: leadsData.length > 0 ? (leadsData.filter(l => l.status === 'ganho').length / leadsData.length) * 100 : 0
    }
    setStats(stats)
  }

  const filterLeads = () => {
    let filtered = leads

    if (searchTerm) {
      filtered = filtered.filter(lead =>
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter) {
      filtered = filtered.filter(lead => lead.status === statusFilter)
    }

    if (sourceFilter) {
      filtered = filtered.filter(lead => lead.source === sourceFilter)
    }

    if (areaFilter) {
      filtered = filtered.filter(lead => lead.legal_area === areaFilter)
    }

    setFilteredLeads(filtered)
  }

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      novo: 'bg-blue-100 text-blue-800',
      contato_inicial: 'bg-yellow-100 text-yellow-800',
      qualificado: 'bg-green-100 text-green-800',
      proposta: 'bg-purple-100 text-purple-800',
      negociacao: 'bg-orange-100 text-orange-800',
      ganho: 'bg-emerald-100 text-emerald-800',
      perdido: 'bg-red-100 text-red-800'
    }

    const statusLabels = {
      novo: 'Novo',
      contato_inicial: 'Contato Inicial',
      qualificado: 'Qualificado',
      proposta: 'Proposta',
      negociacao: 'Negociação',
      ganho: 'Ganho',
      perdido: 'Perdido'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status as keyof typeof statusLabels] || status}
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

  const handleCreateLead = () => {
    router.push('/pipeline/new')
  }

  const handleConvertToClient = (leadId: string) => {
    // TODO: Implement conversion to client
    console.log('Converting lead to client:', leadId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pipeline de Vendas</h1>
          <p className="mt-2 text-gray-600">
            Gerencie leads e oportunidades comerciais
          </p>
        </div>
        <button
          onClick={handleCreateLead}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Novo Lead
        </button>
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
                    Total de Leads
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalLeads}
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
                <UserPlusIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Qualificados
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.qualified}
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
                <CurrencyDollarIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Valor Total
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(stats.totalValue)}
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
                    Em Negociação
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.inNegotiation}
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
                  placeholder="Buscar por nome, email, empresa..."
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
                  <label htmlFor="source-filter" className="block text-sm font-medium text-gray-700">
                    Origem
                  </label>
                  <select
                    id="source-filter"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                  >
                    {sourceOptions.map((option) => (
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
                    {legalAreaOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Clear Filters */}
              {(searchTerm || statusFilter || sourceFilter || areaFilter) && (
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setStatusFilter('')
                      setSourceFilter('')
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
        Mostrando {filteredLeads.length} de {leads.length} leads
      </div>

      {/* Leads List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredLeads.map((lead) => (
            <li key={lead.id}>
              <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-lg font-medium text-gray-900 truncate">
                            {lead.name}
                          </p>
                          {getStatusBadge(lead.status)}
                          {lead.company && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              <BuildingOfficeIcon className="w-3 h-3 mr-1" />
                              {lead.company}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                          <span className="flex items-center">
                            <EnvelopeIcon className="w-4 h-4 mr-1" />
                            {lead.email}
                          </span>
                          {lead.phone && (
                            <span className="flex items-center">
                              <PhoneIcon className="w-4 h-4 mr-1" />
                              {lead.phone}
                            </span>
                          )}
                          <span>Área: {lead.legal_area}</span>
                          <span>Origem: {lead.source}</span>
                        </div>
                        <div className="mt-1 text-sm text-gray-900">
                          {lead.description}
                        </div>
                        {lead.estimated_value && (
                          <div className="mt-1 flex items-center text-sm text-green-600">
                            <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                            Valor estimado: {formatCurrency(lead.estimated_value)} 
                            <span className="ml-2 text-gray-500">
                              ({lead.probability}% probabilidade)
                            </span>
                          </div>
                        )}
                        {lead.next_action && (
                          <div className="mt-1 flex items-center text-sm text-orange-600">
                            <CalendarIcon className="w-4 h-4 mr-1" />
                            Próxima ação: {lead.next_action}
                            {lead.next_action_date && (
                              <span className="ml-1">
                                ({formatDate(lead.next_action_date)})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="ml-5 flex-shrink-0 flex space-x-2">
                    <button
                      onClick={() => console.log('View lead:', lead.id)}
                      className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => console.log('Edit lead:', lead.id)}
                      className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    {lead.status === 'qualificado' && (
                      <button
                        onClick={() => handleConvertToClient(lead.id)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <UserPlusIcon className="h-4 w-4 mr-1" />
                        Converter
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Empty State */}
        {filteredLeads.length === 0 && (
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Nenhum lead encontrado
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter || sourceFilter || areaFilter
                ? 'Tente ajustar os filtros de busca.'
                : 'Comece criando um novo lead.'}
            </p>
            {!searchTerm && !statusFilter && !sourceFilter && !areaFilter && (
              <div className="mt-6">
                <button
                  onClick={handleCreateLead}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                  Novo Lead
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}