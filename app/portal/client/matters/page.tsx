'use client'

import { useState, useMemo } from 'react'
import { useMyMatters } from '@/lib/queries/useClientPortal'
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  UserIcon,
} from '@heroicons/react/24/outline'

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('pt-BR')

const statusLabels: Record<string, string> = {
  active: 'Ativo',
  closed: 'Encerrado',
  on_hold: 'Suspenso',
  settled: 'Acordo',
  dismissed: 'Arquivado',
}

const statusColors: Record<string, string> = {
  active: 'bg-green-50 text-green-700 ring-green-600/20',
  closed: 'bg-gray-50 text-gray-700 ring-gray-600/20',
  on_hold: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20',
  settled: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  dismissed: 'bg-gray-50 text-gray-600 ring-gray-500/20',
}

interface MatterRow {
  id: string
  title: string
  matter_number: string
  status: string
  priority: string
  next_court_date: string | null
  opened_date: string | null
  matter_type: { name: string } | null
  responsible_lawyer: { full_name: string } | null
}

export default function ClientMattersPage() {
  const { data: matters, isLoading } = useMyMatters()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const matterList = (matters ?? []) as MatterRow[]

  const filteredMatters = useMemo(() => {
    let result = matterList
    if (searchTerm) {
      const lower = searchTerm.toLowerCase()
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(lower) ||
          m.matter_number.toLowerCase().includes(lower) ||
          (m.responsible_lawyer?.full_name ?? '').toLowerCase().includes(lower)
      )
    }
    if (statusFilter) {
      result = result.filter((m) => m.status === statusFilter)
    }
    return result
  }, [matterList, searchTerm, statusFilter])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-gray-600">Carregando seus processos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Meus Processos</h1>
        <p className="mt-1 text-gray-600">
          Acompanhe o andamento de todos os seus casos juridicos.
        </p>
      </div>

      {/* Search & filter */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por titulo, numero ou advogado..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full sm:w-48 rounded-md border-gray-300 text-sm focus:ring-primary focus:border-primary"
          >
            <option value="">Todos os Status</option>
            <option value="active">Ativo</option>
            <option value="on_hold">Suspenso</option>
            <option value="settled">Acordo</option>
            <option value="closed">Encerrado</option>
            <option value="dismissed">Arquivado</option>
          </select>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        {filteredMatters.length} de {matterList.length} processos
      </p>

      {/* Matters list */}
      {filteredMatters.length === 0 ? (
        <div className="text-center py-12 bg-white shadow rounded-lg">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Nenhum processo encontrado
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter
              ? 'Tente ajustar os filtros de busca.'
              : 'Voce nao possui processos no momento.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMatters.map((matter) => (
            <div
              key={matter.id}
              className="bg-white shadow rounded-lg p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-base font-medium text-gray-900">{matter.title}</h3>
                <span
                  className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ml-3 flex-shrink-0 ${
                    statusColors[matter.status] ?? statusColors.active
                  }`}
                >
                  {statusLabels[matter.status] ?? matter.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-500">
                <div className="flex items-center">
                  <DocumentTextIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                  {matter.matter_number}
                </div>
                <div className="flex items-center">
                  <UserIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                  {matter.responsible_lawyer?.full_name ?? 'Sem advogado'}
                </div>
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                  {matter.next_court_date
                    ? `Audiencia: ${formatDate(matter.next_court_date)}`
                    : 'Sem audiencia'}
                </div>
                {matter.matter_type && (
                  <div className="text-xs text-gray-400">
                    Tipo: {matter.matter_type.name}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
