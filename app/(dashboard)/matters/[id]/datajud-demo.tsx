'use client'

// Demo page showing DataJud integration in matter detail
// This demonstrates how DataJud components should be integrated

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
  DatabaseIcon,
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

export default function MatterDetailWithDataJudDemo() {
  const params = useParams()
  const [matter, setMatter] = useState(mockMatter)
  const [activeTab, setActiveTab] = useState('overview')
  const [enrichmentLoading, setEnrichmentLoading] = useState(false)
  const [showDataJudDemo, setShowDataJudDemo] = useState(false)

  const handleEnrichCase = async () => {
    setEnrichmentLoading(true)
    try {
      // This would call the actual DataJud API
      console.log('Starting DataJud enrichment for case:', matter.id)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Show success message
      alert('DataJud enrichment completed successfully! Check the DataJud tab for results.')
      setActiveTab('datajud')
    } catch (error) {
      console.error('Enrichment failed:', error)
      alert('DataJud enrichment failed. Please try again.')
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      ativo: 'bg-green-100 text-green-800',
      suspenso: 'bg-gray-100 text-gray-800',
      finalizado: 'bg-emerald-100 text-emerald-800'
    }

    const statusLabels = {
      ativo: 'Ativo',
      suspenso: 'Suspenso', 
      finalizado: 'Finalizado'
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

  return (
    <div className="space-y-6">
      {/* Demo Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <GlobeAltIcon className="h-5 w-5 text-blue-600 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-blue-900">DataJud Integration Demo</h3>
            <p className="text-sm text-blue-700 mt-1">
              Esta é uma demonstração de como os componentes DataJud seriam integrados na página de detalhes do processo.
              Clique em "Mostrar Integração DataJud" para ver os componentes funcionais.
            </p>
            <button
              onClick={() => setShowDataJudDemo(!showDataJudDemo)}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {showDataJudDemo ? 'Ocultar' : 'Mostrar'} Integração DataJud
            </button>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/matters"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Voltar para Processos
          </Link>
        </div>
        <div className="flex items-center space-x-3">
          {/* DataJud Enrichment Button */}
          <button
            onClick={handleEnrichCase}
            disabled={enrichmentLoading}
            className="inline-flex items-center px-3 py-2 border border-indigo-300 shadow-sm text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <DatabaseIcon className="h-4 w-4 mr-2" />
            {enrichmentLoading ? 'Enriquecendo...' : 'Enriquecer com DataJud'}
          </button>
          
          <Link
            href={`/matters/${matter.id}/edit`}
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
              <dt className="text-sm font-medium text-gray-500">Área Jurídica</dt>
              <dd className="mt-1 text-sm text-gray-900">{matter.area_juridica}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Responsável</dt>
              <dd className="mt-1 text-sm text-gray-900">{matter.responsible_lawyer}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Valor da Causa</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatCurrency(matter.case_value)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'overview', name: 'Visão Geral', icon: DocumentTextIcon },
              { id: 'timeline', name: 'Cronologia', icon: ClockIcon },
              { id: 'datajud', name: 'DataJud CNJ', icon: DatabaseIcon },
              { id: 'documents', name: 'Documentos', icon: DocumentTextIcon },
              { id: 'financial', name: 'Financeiro', icon: CurrencyDollarIcon }
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
                  {tab.id === 'datajud' && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      NOVO
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {matter.description && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Descrição</h3>
                  <p className="text-gray-700">{matter.description}</p>
                </div>
              )}

              {/* Key Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Legal Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-orange-600" />
                    Informações Jurídicas
                  </h4>
                  <dl className="space-y-2">
                    {matter.process_number && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Processo Nº</dt>
                        <dd className="text-sm text-gray-900 font-mono">{matter.process_number}</dd>
                      </div>
                    )}
                    {matter.vara_tribunal && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Vara/Tribunal</dt>
                        <dd className="text-sm text-gray-900">{matter.vara_tribunal}</dd>
                      </div>
                    )}
                    {matter.comarca && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Comarca</dt>
                        <dd className="text-sm text-gray-900">{matter.comarca}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Dates */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                    <CalendarIcon className="h-5 w-5 mr-2 text-purple-600" />
                    Datas Importantes
                  </h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Abertura</dt>
                      <dd className="text-sm text-gray-900">{formatDate(matter.opened_date)}</dd>
                    </div>
                    {matter.next_hearing_date && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Próxima Audiência</dt>
                        <dd className="text-sm text-orange-600 font-medium">
                          {formatDateTime(matter.next_hearing_date)}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            </div>
          )}

          {/* Timeline Tab - Enhanced with DataJud */}
          {activeTab === 'timeline' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Cronologia do Processo</h3>
              </div>

              {/* DataJud Integration Notice */}
              {showDataJudDemo && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-indigo-900 mb-2">Timeline Integrada DataJud</h4>
                  <p className="text-sm text-indigo-700">
                    Esta timeline combina eventos manuais do sistema com movimentações oficiais do DataJud CNJ.
                    Eventos com baixa relevância podem ser filtrados.
                  </p>
                </div>
              )}

              {/* DataJud Timeline Component */}
              {showDataJudDemo && (
                <DataJudTimelineEvents
                  caseId={matter.id}
                  showClientView={false}
                  maxHeight="500px"
                  onEventToggle={(eventId, field, value) => {
                    console.log('Event toggled:', { eventId, field, value })
                  }}
                />
              )}

              {!showDataJudDemo && (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <DatabaseIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    Timeline padrão do sistema. Ative o demo DataJud para ver a timeline integrada.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* DataJud Tab */}
          {activeTab === 'datajud' && (
            <div className="space-y-6">
              {showDataJudDemo ? (
                <DataJudEnrichmentPanel
                  caseId={matter.id}
                  caseTitle={matter.title}
                  processNumber={matter.process_number}
                  onEnrichmentComplete={(result) => {
                    console.log('Enrichment completed:', result)
                    // In real app, refresh matter data
                  }}
                />
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <DatabaseIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Enriquecimento DataJud CNJ</h3>
                  <p className="text-gray-500 mb-4">
                    Ative o demo para ver como funciona o enriquecimento de casos com dados oficiais do DataJud.
                  </p>
                  <button
                    onClick={() => setShowDataJudDemo(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Ativar Demo DataJud
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="text-center py-8">
              <DocumentTextIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Documentos do processo</p>
            </div>
          )}

          {/* Financial Tab */}
          {activeTab === 'financial' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Informações Financeiras</h3>

              {/* Financial Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ClockIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-blue-900">Horas Trabalhadas</p>
                      <p className="text-lg font-semibold text-blue-900">{matter.total_time_logged}h</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-green-900">Total Faturado</p>
                      <p className="text-lg font-semibold text-green-900">{formatCurrency(matter.total_billed)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CurrencyDollarIcon className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-orange-900">Valor da Causa</p>
                      <p className="text-lg font-semibold text-orange-900">{formatCurrency(matter.case_value)}</p>
                    </div>
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