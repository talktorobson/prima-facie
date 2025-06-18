'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeftIcon,
  DocumentTextIcon,
  CalendarIcon,
  UserIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon,
  PaperClipIcon,
  EyeIcon,
  ArrowDownTrayIcon as DownloadIcon,
  XMarkIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline'

// Mock data for matter details
const getMockMatterDetail = (id: string) => {
  const matters = {
    '1': {
      id: '1',
      matter_number: 'PROC-2024-001',
      title: 'Ação Trabalhista - Rescisão Indevida',
      status: 'ativo',
      area_juridica: 'trabalhista',
      created_date: '2024-01-10',
      last_update: '2024-01-20',
      next_hearing: '2024-02-15',
      assigned_lawyer: {
        name: 'Dra. Maria Silva Santos',
        email: 'maria.santos@davilareislaw.com',
        phone: '(11) 3456-7890',
        oab: 'OAB/SP 123.456'
      },
      priority: 'alta',
      client_summary: 'Ação trabalhista movida contra a empresa XYZ Ltda devido à rescisão indevida do contrato de trabalho. O processo busca o pagamento de verbas rescisórias, multa do FGTS, aviso prévio indenizado e danos morais.',
      estimated_duration: '6 meses',
      case_value: 50000.00,
      progress_percentage: 35,
      process_number: '1234567-89.2024.5.02.0001',
      court: 'TRT-2 - Tribunal Regional do Trabalho da 2ª Região',
      vara: '15ª Vara do Trabalho de São Paulo',
      timeline: [
        {
          id: '1',
          date: '2024-01-20',
          title: 'Petição inicial protocolada',
          description: 'Petição inicial foi protocolada no TRT-2 com todos os documentos necessários.',
          type: 'document',
          visible_to_client: true,
          lawyer_notes: 'Aguardando distribuição do processo'
        },
        {
          id: '2',
          date: '2024-01-18',
          title: 'Audiência agendada',
          description: 'Audiência de conciliação marcada para 15/02/2024 às 14:00h na 15ª Vara do Trabalho.',
          type: 'hearing',
          visible_to_client: true,
          lawyer_notes: 'Cliente deve comparecer com documentos de identificação'
        },
        {
          id: '3',
          date: '2024-01-15',
          title: 'Documentos coletados',
          description: 'Todos os documentos necessários foram coletados e organizados.',
          type: 'document',
          visible_to_client: true,
          lawyer_notes: ''
        },
        {
          id: '4',
          date: '2024-01-10',
          title: 'Processo criado',
          description: 'Processo iniciado após consulta inicial com o cliente.',
          type: 'status',
          visible_to_client: true,
          lawyer_notes: 'Primeira reunião realizada'
        }
      ],
      documents: [
        {
          id: '1',
          title: 'Petição Inicial',
          description: 'Petição inicial da ação trabalhista',
          file_name: 'peticao_inicial.pdf',
          file_size: '2.5 MB',
          upload_date: '2024-01-20',
          category: 'peticao',
          visible_to_client: true,
          url: '#'
        },
        {
          id: '2',
          title: 'Contrato de Trabalho',
          description: 'Cópia do contrato de trabalho assinado',
          file_name: 'contrato_trabalho.pdf',
          file_size: '1.2 MB',
          upload_date: '2024-01-15',
          category: 'documento',
          visible_to_client: true,
          url: '#'
        },
        {
          id: '3',
          title: 'Carteira de Trabalho',
          description: 'Digitalização da carteira de trabalho',
          file_name: 'carteira_trabalho.pdf',
          file_size: '3.1 MB',
          upload_date: '2024-01-15',
          category: 'documento',
          visible_to_client: true,
          url: '#'
        },
        {
          id: '4',
          title: 'Comprovantes de Pagamento',
          description: 'Últimos 6 holerites',
          file_name: 'holerites.pdf',
          file_size: '4.8 MB',
          upload_date: '2024-01-15',
          category: 'documento',
          visible_to_client: true,
          url: '#'
        },
        {
          id: '5',
          title: 'Termo de Rescisão',
          description: 'Documento de rescisão fornecido pela empresa',
          file_name: 'termo_rescisao.pdf',
          file_size: '800 KB',
          upload_date: '2024-01-12',
          category: 'documento',
          visible_to_client: true,
          url: '#'
        },
        {
          id: '6',
          title: 'Estratégia Processual',
          description: 'Documento interno com estratégia do caso',
          file_name: 'estrategia_interna.pdf',
          file_size: '1.5 MB',
          upload_date: '2024-01-18',
          category: 'interno',
          visible_to_client: false,
          url: '#'
        }
      ],
      next_steps: [
        {
          title: 'Audiência de Conciliação',
          description: 'Comparecer à audiência marcada para 15/02/2024',
          due_date: '2024-02-15',
          priority: 'alta'
        },
        {
          title: 'Aguardar Manifestação da Ré',
          description: 'Empresa tem prazo de 15 dias para se manifestar',
          due_date: '2024-02-05',
          priority: 'media'
        }
      ]
    },
    '2': {
      id: '2',
      matter_number: 'PROC-2024-012',
      title: 'Revisão Contratual - Compra e Venda',
      status: 'aguardando_documentos',
      area_juridica: 'civil',
      created_date: '2024-01-15',
      last_update: '2024-01-18',
      next_hearing: null,
      assigned_lawyer: {
        name: 'Dr. João Santos Oliveira',
        email: 'joao.oliveira@davilareislaw.com',
        phone: '(11) 3456-7891',
        oab: 'OAB/SP 234.567'
      },
      priority: 'media',
      client_summary: 'Revisão de contrato de compra e venda de imóvel. Análise de cláusulas e adequação às normas vigentes.',
      estimated_duration: '3 meses',
      case_value: 25000.00,
      progress_percentage: 15,
      process_number: null,
      court: null,
      vara: null,
      timeline: [
        {
          id: '1',
          date: '2024-01-18',
          title: 'Solicitação de documentos',
          description: 'Dr. João solicitou documentos complementares para análise completa.',
          type: 'document',
          visible_to_client: true,
          lawyer_notes: 'Prazo até 25/01/2024'
        },
        {
          id: '2',
          date: '2024-01-15',
          title: 'Consulta inicial',
          description: 'Primeira reunião para entendimento do caso.',
          type: 'meeting',
          visible_to_client: true,
          lawyer_notes: 'Cliente apresentou minuta do contrato'
        }
      ],
      documents: [
        {
          id: '1',
          title: 'Minuta de Contrato',
          description: 'Primeira versão do contrato de compra e venda',
          file_name: 'minuta_contrato.pdf',
          file_size: '1.8 MB',
          upload_date: '2024-01-15',
          category: 'contrato',
          visible_to_client: true,
          url: '#'
        },
        {
          id: '2',
          title: 'Certidão do Imóvel',
          description: 'Certidão de matrícula do imóvel',
          file_name: 'certidao_imovel.pdf',
          file_size: '2.2 MB',
          upload_date: '2024-01-16',
          category: 'documento',
          visible_to_client: true,
          url: '#'
        }
      ],
      next_steps: [
        {
          title: 'Envio de Documentos Pendentes',
          description: 'Enviar documentos solicitados pelo advogado',
          due_date: '2024-01-25',
          priority: 'alta'
        }
      ]
    }
  }
  
  return matters[id as keyof typeof matters] || null
}

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

const getTimelineIcon = (type: string) => {
  const icons = {
    document: DocumentTextIcon,
    hearing: CalendarIcon,
    meeting: UserIcon,
    status: CheckCircleIcon
  }
  const IconComponent = icons[type as keyof typeof icons] || DocumentTextIcon
  return <IconComponent className="h-5 w-5 text-white" />
}

const getTimelineColor = (type: string) => {
  const colors = {
    document: 'bg-blue-500',
    hearing: 'bg-green-500',
    meeting: 'bg-purple-500',
    status: 'bg-gray-500'
  }
  return colors[type as keyof typeof colors] || 'bg-blue-500'
}

export default function ClientMatterDetailPage() {
  const params = useParams()
  const matterId = params.id as string
  
  const [isLoading, setIsLoading] = useState(true)
  const [matter, setMatter] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  useEffect(() => {
    // Load matter data
    const matterData = getMockMatterDetail(matterId)
    if (matterData) {
      setMatter(matterData)
    }
    setTimeout(() => setIsLoading(false), 1000)
  }, [matterId])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    
    setIsUploading(true)
    setUploadProgress(0)
    
    try {
      // Simulate upload progress
      const uploadInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(uploadInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)
      
      // Simulate upload completion
      setTimeout(() => {
        setUploadProgress(100)
        setTimeout(() => {
          setIsUploading(false)
          setUploadProgress(0)
          setShowUploadModal(false)
          alert('Documento enviado com sucesso! Aguarde análise da equipe jurídica.')
          // TODO: Refresh documents list or add to matter.documents
        }, 500)
      }, 2000)
    } catch (error) {
      console.error('Upload error:', error)
      setIsUploading(false)
      setUploadProgress(0)
      alert('Erro ao enviar documento. Tente novamente.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando detalhes do processo...</p>
        </div>
      </div>
    )
  }

  if (!matter) {
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          Processo não encontrado
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          O processo solicitado não existe ou você não tem permissão para visualizá-lo.
        </p>
        <div className="mt-6">
          <Link
            href="/portal/client/matters"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
          >
            Voltar aos Processos
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
              href="/portal/client/matters"
              className="text-gray-400 hover:text-gray-600"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </Link>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{matter.title}</h1>
                  <p className="text-sm text-gray-500">{matter.matter_number}</p>
                </div>
                <div className="flex items-center space-x-3">
                  {getPriorityIcon(matter.priority)}
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(matter.status)}`}>
                    {getStatusLabel(matter.status)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <p className="text-gray-600 mb-4">{matter.client_summary}</p>

          {/* Quick Info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center text-sm text-gray-600">
              <UserIcon className="h-4 w-4 mr-2" />
              {matter.assigned_lawyer.name}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <CalendarIcon className="h-4 w-4 mr-2" />
              {matter.next_hearing ? `Audiência: ${formatDate(matter.next_hearing)}` : 'Sem audiência agendada'}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <ClockIcon className="h-4 w-4 mr-2" />
              Atualizado: {formatDate(matter.last_update)}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <DocumentTextIcon className="h-4 w-4 mr-2" />
              {matter.documents.filter(d => d.visible_to_client).length} documentos
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progresso do Processo</span>
              <span>{matter.progress_percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full"
                style={{ width: `${matter.progress_percentage}%` }}
              ></div>
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
              Visão Geral
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'timeline'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Cronologia
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'documents'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Documentos
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'contact'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Contato
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Case Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Detalhes do Processo</h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Número do Processo</dt>
                      <dd className="text-sm text-gray-900">{matter.process_number || 'Ainda não distribuído'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Tribunal</dt>
                      <dd className="text-sm text-gray-900">{matter.court || 'A definir'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Vara</dt>
                      <dd className="text-sm text-gray-900">{matter.vara || 'A definir'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Valor da Causa</dt>
                      <dd className="text-sm text-gray-900">{formatCurrency(matter.case_value)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Duração Estimada</dt>
                      <dd className="text-sm text-gray-900">{matter.estimated_duration}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Próximas Etapas</h3>
                  <div className="space-y-3">
                    {matter.next_steps.map((step: any, index: number) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-gray-900">{step.title}</h4>
                          {getPriorityIcon(step.priority)}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                        <p className="text-xs text-gray-500">Prazo: {formatDate(step.due_date)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-6">Cronologia do Processo</h3>
              <div className="flow-root">
                <ul className="-mb-8">
                  {matter.timeline.map((event: any, index: number) => (
                    <li key={event.id}>
                      <div className="relative pb-8">
                        {index !== matter.timeline.length - 1 && (
                          <span
                            className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden="true"
                          />
                        )}
                        <div className="relative flex items-start space-x-3">
                          <div className={`relative px-1 h-10 w-10 rounded-full flex items-center justify-center ${getTimelineColor(event.type)}`}>
                            {getTimelineIcon(event.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div>
                              <div className="text-sm">
                                <span className="font-medium text-gray-900">{event.title}</span>
                              </div>
                              <p className="mt-1 text-sm text-gray-600">{event.description}</p>
                              {event.lawyer_notes && (
                                <p className="mt-1 text-xs text-gray-500 italic">
                                  Observação: {event.lawyer_notes}
                                </p>
                              )}
                              <p className="mt-2 text-xs text-gray-500">{formatDate(event.date)}</p>
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
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <PaperClipIcon className="-ml-1 mr-2 h-5 w-5" />
                  Enviar Documento
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {matter.documents
                  .filter((doc: any) => doc.visible_to_client)
                  .map((document: any) => (
                    <div key={document.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <PaperClipIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <h4 className="text-sm font-medium text-gray-900">{document.title}</h4>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            className="text-gray-400 hover:text-gray-600"
                            title="Visualizar"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            className="text-gray-400 hover:text-gray-600"
                            title="Download"
                          >
                            <DownloadIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{document.description}</p>
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>Arquivo: {document.file_name}</p>
                        <p>Tamanho: {document.file_size}</p>
                        <p>Upload: {formatDate(document.upload_date)}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Contact Tab */}
          {activeTab === 'contact' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-6">Informações de Contato</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Advogado Responsável</h4>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <UserIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{matter.assigned_lawyer.name}</p>
                        <p className="text-xs text-gray-500">{matter.assigned_lawyer.oab}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <p className="text-sm text-gray-900">{matter.assigned_lawyer.email}</p>
                    </div>
                    <div className="flex items-center">
                      <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <p className="text-sm text-gray-900">{matter.assigned_lawyer.phone}</p>
                    </div>
                  </div>
                  <div className="mt-6">
                    <Link
                      href="/portal/client/messages"
                      className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                      <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                      Enviar Mensagem
                    </Link>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Escritório</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Dávila Reis Advocacia</p>
                      <p className="text-xs text-gray-500">Especialistas em Direito Trabalhista e Civil</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Rua Augusta, 123 - Sala 456</p>
                      <p className="text-sm text-gray-600">Consolação, São Paulo - SP</p>
                      <p className="text-sm text-gray-600">CEP: 01305-000</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tel: (11) 3456-7890</p>
                      <p className="text-sm text-gray-600">contato@davilareislaw.com</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Document Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[500px] shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium text-gray-900">Enviar Documento</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleFileUpload}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Arquivo *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-2">
                      <label htmlFor="client-file-upload" className="cursor-pointer">
                        <span className="text-primary font-medium">Clique para enviar</span>
                        <span className="text-gray-500"> ou arraste e solte</span>
                        <input
                          id="client-file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                          required
                        />
                      </label>
                    </div>
                    <p className="text-sm text-gray-500">
                      PDF, DOC, DOCX, JPG, PNG, TXT até 10MB
                    </p>
                  </div>
                </div>

                {isUploading && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição do Documento
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Descreva brevemente o conteúdo ou relevância do documento..."
                    required
                  />
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Importante:</strong> Todos os documentos enviados serão analisados pela equipe jurídica. 
                    Você receberá uma notificação quando o documento for processado e disponibilizado no processo.
                  </p>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    disabled={isUploading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50"
                    disabled={isUploading}
                  >
                    {isUploading ? 'Enviando...' : 'Enviar Documento'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}