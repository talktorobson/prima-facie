'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeftIcon,
  PencilIcon,
  DocumentTextIcon,
  CalendarIcon,
  UserIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  PlusIcon,
  EyeIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

// Mock data - in real app this would come from API
const mockMatter = {
  id: '1',
  matter_number: '2024/001',
  title: 'Ação Trabalhista - Rescisão Indevida',
  description: 'Processo trabalhista referente à rescisão indevida do contrato de trabalho do cliente João Silva Santos. O cliente foi demitido sem justa causa após 5 anos de trabalho na empresa XYZ Ltda.',
  area_juridica: 'Trabalhista',
  status: 'ativo',
  priority: 'alta',
  
  // Legal Information
  processo_numero: '5001234-20.2024.5.02.0001',
  vara_tribunal: '1ª Vara do Trabalho de São Paulo',
  comarca: 'São Paulo',
  
  // Client Information
  client_id: '1',
  client_name: 'João Silva Santos',
  client_cpf_cnpj: '123.456.789-00',
  
  // Case Details
  opposing_party: 'XYZ Empresa Ltda',
  opposing_party_lawyer: 'José Advocacia & Associados',
  case_value: 25000.00,
  
  // Dates
  opened_date: '2024-01-15',
  statute_limitations: '2026-01-15',
  next_hearing_date: '2024-02-20T14:00:00',
  closed_date: null,
  
  // Assignment
  responsible_lawyer_id: '1',
  responsible_lawyer: 'Maria Silva Santos',
  
  // Financial
  hourly_rate: 300.00,
  fixed_fee: null,
  retainer_amount: 5000.00,
  billing_method: 'hourly',
  
  // Notes
  internal_notes: 'Cliente relatou que foi demitido logo após solicitar férias. Possível retaliação.',
  next_action: 'Aguardar resposta da empresa à petição inicial. Prazo até 15/02/2024.',
  
  // Metadata
  created_at: '2024-01-15T10:00:00',
  updated_at: '2024-01-20T15:30:00',
  
  // Additional calculated fields
  days_open: 10,
  total_time_logged: 15.5,
  total_billed: 4650.00
}

const mockEvents = [
  {
    id: '1',
    title: 'Petição Inicial Protocolada',
    description: 'Protocolo da petição inicial na 1ª Vara do Trabalho',
    event_type: 'peticao',
    event_date: '2024-01-15T09:00:00',
    status: 'concluido',
    created_by: 'Maria Silva Santos'
  },
  {
    id: '2',
    title: 'Audiência de Conciliação',
    description: 'Audiência de conciliação agendada',
    event_type: 'audiencia',
    event_date: '2024-02-20T14:00:00',
    status: 'agendado',
    court_location: '1ª Vara do Trabalho - São Paulo',
    reminder_date: '2024-02-19T10:00:00'
  },
  {
    id: '3',
    title: 'Resposta da Empresa',
    description: 'Prazo para resposta da empresa à petição',
    event_type: 'prazo',
    event_date: '2024-02-15T17:00:00',
    status: 'agendado'
  }
]

const mockDocuments = [
  {
    id: '1',
    title: 'Petição Inicial',
    description: 'Petição inicial do processo trabalhista',
    document_type: 'peticao',
    file_name: 'peticao_inicial_joao_silva.pdf',
    file_size: 1024000,
    created_at: '2024-01-15T09:00:00',
    uploaded_by: 'Maria Silva Santos',
    visible_to_client: true
  },
  {
    id: '2',
    title: 'Contrato de Trabalho',
    description: 'Cópia do contrato de trabalho do cliente',
    document_type: 'documento_pessoal',
    file_name: 'contrato_trabalho_joao.pdf',
    file_size: 512000,
    created_at: '2024-01-15T08:30:00',
    uploaded_by: 'Maria Silva Santos',
    visible_to_client: false
  },
  {
    id: '3',
    title: 'Holerites',
    description: 'Últimos 6 meses de holerites',
    document_type: 'comprovante',
    file_name: 'holerites_joao_6meses.pdf',
    file_size: 2048000,
    created_at: '2024-01-15T08:45:00',
    uploaded_by: 'Maria Silva Santos',
    visible_to_client: false
  }
]

export default function MatterDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [matter, setMatter] = useState(mockMatter)
  const [events, setEvents] = useState(mockEvents)
  const [documents, setDocuments] = useState(mockDocuments)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)

  // Simulate data loading
  useEffect(() => {
    // In real app, fetch matter data by ID
    // const matterId = params.id
    console.log('Loading matter:', params.id)
  }, [params.id])

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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getEventIcon = (eventType: string) => {
    const icons = {
      audiencia: CalendarIcon,
      prazo: ClockIcon,
      peticao: DocumentTextIcon,
      despacho: ExclamationTriangleIcon,
      sentenca: CheckCircleIcon,
      recurso: ArrowLeftIcon,
      reuniao: UserIcon,
      ligacao: UserIcon,
      email: UserIcon,
      documento: DocumentTextIcon,
      outro: DocumentTextIcon
    }
    
    const IconComponent = icons[eventType as keyof typeof icons] || DocumentTextIcon
    return <IconComponent className="h-4 w-4" />
  }

  const getEventStatusColor = (status: string) => {
    const colors = {
      agendado: 'text-blue-600',
      em_andamento: 'text-yellow-600',
      concluido: 'text-green-600',
      cancelado: 'text-red-600',
      adiado: 'text-orange-600'
    }
    return colors[status as keyof typeof colors] || 'text-gray-600'
  }

  return (
    <div className="space-y-6">
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
          <Link
            href={`/matters/${matter.id}/workflow`}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <ClockIcon className="h-4 w-4 mr-2" />
            Workflow
          </Link>
          <Link
            href={`/matters/${matter.id}/edit`}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
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
                      ? 'border-primary text-primary'
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
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Description */}
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
                    {matter.processo_numero && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Processo Nº</dt>
                        <dd className="text-sm text-gray-900">{matter.processo_numero}</dd>
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
                    {matter.opposing_party && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Parte Contrária</dt>
                        <dd className="text-sm text-gray-900">{matter.opposing_party}</dd>
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
                    {matter.statute_limitations && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Prescrição</dt>
                        <dd className="text-sm text-gray-900">{formatDate(matter.statute_limitations)}</dd>
                      </div>
                    )}
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

              {/* Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {matter.internal_notes && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Notas Internas</h4>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                      <p className="text-sm text-gray-700">{matter.internal_notes}</p>
                    </div>
                  </div>
                )}

                {matter.next_action && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Próxima Ação</h4>
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                      <p className="text-sm text-gray-700">{matter.next_action}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Cronologia do Processo</h3>
                <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Novo Evento
                </button>
              </div>

              <div className="flow-root">
                <ul className="-mb-8">
                  {events.map((event, eventIdx) => (
                    <li key={event.id}>
                      <div className="relative pb-8">
                        {eventIdx !== events.length - 1 ? (
                          <span
                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden="true"
                          />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className={`bg-white h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${getEventStatusColor(event.status)}`}>
                              {getEventIcon(event.event_type)}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-900 font-medium">{event.title}</p>
                              <p className="text-sm text-gray-500">{event.description}</p>
                              {event.court_location && (
                                <p className="text-xs text-gray-400 mt-1">Local: {event.court_location}</p>
                              )}
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              <time dateTime={event.event_date}>{formatDateTime(event.event_date)}</time>
                              <div className={`text-xs ${getEventStatusColor(event.status)}`}>
                                {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Documentos do Processo</h3>
                <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Upload Documento
                </button>
              </div>

              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {documents.map((document) => (
                    <li key={document.id}>
                      <div className="px-4 py-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <DocumentTextIcon className="h-8 w-8 text-gray-400" />
                            </div>
                            <div className="ml-4">
                              <div className="flex items-center">
                                <p className="text-sm font-medium text-gray-900">{document.title}</p>
                                {document.visible_to_client && (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                    Visível ao Cliente
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500">{document.description}</p>
                              <div className="mt-1 text-xs text-gray-400">
                                {document.file_name} • {formatFileSize(document.file_size)} • 
                                Enviado em {formatDateTime(document.created_at)} por {document.uploaded_by}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button className="text-gray-400 hover:text-gray-600">
                              <EyeIcon className="h-5 w-5" />
                            </button>
                            <button className="text-gray-400 hover:text-red-600">
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
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

              {/* Billing Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-md font-medium text-gray-900 mb-3">Configuração de Cobrança</h4>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Método de Cobrança</dt>
                    <dd className="text-sm text-gray-900">
                      {matter.billing_method === 'hourly' && 'Por Hora'}
                      {matter.billing_method === 'fixed' && 'Valor Fixo'}
                      {matter.billing_method === 'contingency' && 'Êxito'}
                      {matter.billing_method === 'retainer' && 'Honorários Antecipados'}
                    </dd>
                  </div>
                  {matter.hourly_rate && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Valor por Hora</dt>
                      <dd className="text-sm text-gray-900">{formatCurrency(matter.hourly_rate)}</dd>
                    </div>
                  )}
                  {matter.fixed_fee && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Valor Fixo</dt>
                      <dd className="text-sm text-gray-900">{formatCurrency(matter.fixed_fee)}</dd>
                    </div>
                  )}
                  {matter.retainer_amount && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Honorários Antecipados</dt>
                      <dd className="text-sm text-gray-900">{formatCurrency(matter.retainer_amount)}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}