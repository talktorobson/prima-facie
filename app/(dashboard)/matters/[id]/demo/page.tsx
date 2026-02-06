'use client'

// DataJud Integration Demo Page
// Access via: /matters/[id]/demo

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeftIcon,
  PencilIcon,
  DocumentTextIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CircleStackIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'

// Import DataJud components
import { DataJudEnrichmentPanel } from '@/components/features/datajud/enrichment-panel'
import { DataJudTimelineEvents } from '@/components/features/datajud/timeline-events'

// Mock data with DataJud-compatible fields
const mockMatter = {
  id: '1',
  matter_number: '2024/001',
  title: 'Ação Trabalhista - Rescisão Indevida',
  description: 'Processo trabalhista referente à rescisão indevida do contrato de trabalho do cliente João Silva Santos.',
  area_juridica: 'Trabalhista',
  status: 'ativo',
  priority: 'alta',
  
  // DataJud-compatible fields
  process_number: '5001234-20.2024.5.02.0001',
  vara_tribunal: '1ª Vara do Trabalho de São Paulo',
  comarca: 'São Paulo',
  
  // Client Information
  client_name: 'João Silva Santos',
  client_cpf_cnpj: '123.456.789-00',
  
  // Dates
  opened_date: '2024-01-15',
  next_hearing_date: '2024-02-20T14:00:00',
  
  // Assignment
  responsible_lawyer: 'Maria Silva Santos',
  
  // Financial
  case_value: 25000.00,
  total_time_logged: 15.5,
  total_billed: 4650.00
}

export default function DataJudIntegrationDemo() {
  const params = useParams()
  const [matter, setMatter] = useState(mockMatter)
  const [activeTab, setActiveTab] = useState('datajud')
  const [enrichmentLoading, setEnrichmentLoading] = useState(false)

  const handleEnrichCase = async () => {
    setEnrichmentLoading(true)
    try {
      console.log('Starting DataJud enrichment for case:', matter.id)
      
      // Test the actual API endpoint
      const response = await fetch('/api/datajud/enrich-case', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          case_id: matter.id,
          process_number: matter.process_number,
          options: {
            force_update: true,
            include_timeline: true,
            include_participants: true,
            include_legal_subjects: true
          }
        })
      })

      const result = await response.json()
      
      if (result.success) {
        alert('DataJud enrichment completed successfully! Check the results below.')
      } else {
        alert(`DataJud enrichment failed: ${result.errors?.join(', ') || result.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Enrichment failed:', error)
      alert('DataJud enrichment failed. Please check the console for details.')
    } finally {
      setEnrichmentLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getStatusBadge = (status: string) => {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Ativo
      </span>
    )
  }

  const getPriorityBadge = (priority: string) => {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-600">
        Alta
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Demo Notice */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <div className="flex items-start">
          <GlobeAltIcon className="h-6 w-6 text-indigo-600 mr-3 mt-1" />
          <div>
            <h3 className="text-lg font-medium text-indigo-900">🔍 DataJud Integration Demo</h3>
            <p className="text-sm text-indigo-700 mt-2">
              Esta página demonstra a integração completa dos componentes DataJud com a interface de gestão de processos.
              Teste todas as funcionalidades abaixo:
            </p>
            <ul className="text-sm text-indigo-700 mt-2 space-y-1">
              <li>• <strong>Enriquecimento de Casos:</strong> Clique no botão "Enriquecer com DataJud" para testar a API</li>
              <li>• <strong>Painel de Enriquecimento:</strong> Explore as abas Visão Geral, Timeline, Participantes e Conflitos</li>
              <li>• <strong>Timeline de Eventos:</strong> Veja como eventos do DataJud seriam integrados</li>
              <li>• <strong>Integração UI:</strong> Observe como os componentes se integram ao design existente</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href={`/matters/${params.id}`}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Voltar para Processo Original
          </Link>
        </div>
        <div className="flex items-center space-x-3">
          {/* DataJud Enrichment Button */}
          <button
            onClick={handleEnrichCase}
            disabled={enrichmentLoading}
            className="inline-flex items-center px-4 py-2 border border-indigo-300 shadow-sm text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <CircleStackIcon className="h-4 w-4 mr-2" />
            {enrichmentLoading ? 'Enriquecendo...' : 'Enriquecer com DataJud'}
          </button>
          
          <Link
            href={`/matters/${params.id}/edit`}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Editar
          </Link>
        </div>
      </div>

      {/* Matter Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900">{matter.matter_number}</h1>
                {getPriorityBadge(matter.priority)}
                {getStatusBadge(matter.status)}
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-600">
                  DEMO DATAJUD
                </span>
              </div>
              <h2 className="mt-1 text-lg text-gray-600">{matter.title}</h2>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="px-6 py-4">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Cliente</dt>
              <dd className="mt-1 text-sm text-gray-900">{matter.client_name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Processo CNJ</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">{matter.process_number}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Vara/Tribunal</dt>
              <dd className="mt-1 text-sm text-gray-900">{matter.vara_tribunal}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Valor da Causa</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatCurrency(matter.case_value)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* DataJud Components Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'datajud', name: 'Painel DataJud', icon: CircleStackIcon },
              { id: 'timeline', name: 'Timeline Integrada', icon: ClockIcon },
              { id: 'api-test', name: 'Teste de APIs', icon: GlobeAltIcon }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* DataJud Enrichment Panel */}
          {activeTab === 'datajud' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900">Painel de Enriquecimento DataJud</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Interface completa para gerenciar enriquecimento de casos com dados oficiais do CNJ
                </p>
              </div>
              
              <DataJudEnrichmentPanel
                caseId={matter.id}
                caseTitle={matter.title}
                processNumber={matter.process_number}
                onEnrichmentComplete={(result) => {
                  console.log('Enrichment completed:', result)
                  alert('Enriquecimento concluído! Veja os detalhes no console.')
                }}
              />
            </div>
          )}

          {/* Timeline Integration */}
          {activeTab === 'timeline' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900">Timeline Integrada DataJud</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Eventos processuais sincronizados com o sistema DataJud CNJ
                </p>
              </div>
              
              <DataJudTimelineEvents
                caseId={matter.id}
                showClientView={false}
                maxHeight="600px"
                onEventToggle={(eventId, field, value) => {
                  console.log('Event toggled:', { eventId, field, value })
                  alert(`Evento ${eventId} atualizado: ${field} = ${value}`)
                }}
              />
            </div>
          )}

          {/* API Testing */}
          {activeTab === 'api-test' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Teste de APIs DataJud</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Teste os endpoints da API DataJud diretamente
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Health Check</h4>
                  <p className="text-sm text-gray-500 mb-3">Verifica o status da API DataJud</p>
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/datajud/health-check')
                        const data = await response.json()
                        alert('Health Check: ' + JSON.stringify(data, null, 2))
                      } catch (error) {
                        alert('Erro: ' + error)
                      }
                    }}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Testar Health Check
                  </button>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Enrichment Stats</h4>
                  <p className="text-sm text-gray-500 mb-3">Estatísticas de enriquecimento</p>
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/datajud/enrichment-stats')
                        const data = await response.json()
                        alert('Stats: ' + JSON.stringify(data, null, 2))
                      } catch (error) {
                        alert('Erro: ' + error)
                      }
                    }}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Testar Stats
                  </button>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Case Enrichment</h4>
                  <p className="text-sm text-gray-500 mb-3">Dados de enriquecimento do caso</p>
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/datajud/case-enrichment/${matter.id}`)
                        const data = await response.json()
                        alert('Case Data: ' + JSON.stringify(data, null, 2))
                      } catch (error) {
                        alert('Erro: ' + error)
                      }
                    }}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Testar Case Data
                  </button>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Timeline Events</h4>
                  <p className="text-sm text-gray-500 mb-3">Eventos da timeline do caso</p>
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/datajud/timeline-events/${matter.id}`)
                        const data = await response.json()
                        alert('Timeline: ' + JSON.stringify(data, null, 2))
                      } catch (error) {
                        alert('Erro: ' + error)
                      }
                    }}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Testar Timeline
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}