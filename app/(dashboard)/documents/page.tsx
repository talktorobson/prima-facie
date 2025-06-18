'use client'

import { useState, useEffect } from 'react'
import { useAuthContext } from '@/lib/providers/auth-provider'
import { StaffOnly } from '@/components/auth/role-guard'
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  ChevronDownIcon,
  FolderIcon,
  UserIcon,
  CalendarIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
  DocumentArrowUpIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface Document {
  id: string
  name: string
  description?: string
  file_type: string
  file_size: number
  status: 'active' | 'archived' | 'pending_review' | 'confidential'
  category: 'contract' | 'petition' | 'court_filing' | 'evidence' | 'correspondence' | 'internal' | 'client_document' | 'other'
  client_id?: string
  client_name?: string
  matter_id?: string
  matter_title?: string
  uploaded_by: string
  uploaded_at: string
  updated_at: string
  download_url?: string
  preview_url?: string
  version: number
  is_template: boolean
  tags: string[]
}

const statusOptions = [
  { value: '', label: 'Todos os Status' },
  { value: 'active', label: 'Ativo' },
  { value: 'archived', label: 'Arquivado' },
  { value: 'pending_review', label: 'Pendente de Revisão' },
  { value: 'confidential', label: 'Confidencial' }
]

const categoryOptions = [
  { value: '', label: 'Todas as Categorias' },
  { value: 'contract', label: 'Contratos' },
  { value: 'petition', label: 'Petições' },
  { value: 'court_filing', label: 'Protocolos Judiciais' },
  { value: 'evidence', label: 'Provas/Evidências' },
  { value: 'correspondence', label: 'Correspondências' },
  { value: 'internal', label: 'Documentos Internos' },
  { value: 'client_document', label: 'Documentos do Cliente' },
  { value: 'other', label: 'Outros' }
]

const fileTypeIcons = {
  'pdf': DocumentIcon,
  'doc': DocumentTextIcon,
  'docx': DocumentTextIcon,
  'jpg': DocumentIcon,
  'jpeg': DocumentIcon,
  'png': DocumentIcon,
  'xlsx': DocumentIcon,
  'xls': DocumentIcon,
  'ppt': DocumentIcon,
  'pptx': DocumentIcon,
  'txt': DocumentTextIcon,
  'default': DocumentIcon
}

export default function DocumentsPage() {
  const { profile } = useAuthContext()
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  // Document stats
  const [stats, setStats] = useState({
    totalDocuments: 0,
    activeDocuments: 0,
    pendingReview: 0,
    confidentialDocs: 0,
    recentUploads: 0,
    totalSize: 0
  })

  useEffect(() => {
    fetchDocuments()
  }, [profile])

  useEffect(() => {
    filterDocuments()
  }, [searchTerm, statusFilter, categoryFilter, documents])

  const fetchDocuments = async () => {
    if (!profile?.law_firm_id) return

    try {
      setLoading(true)
      
      // Sample documents for demonstration
      const sampleDocuments: Document[] = [
        {
          id: '1',
          name: 'Contrato de Prestação de Serviços - ABC Ltda.pdf',
          description: 'Contrato de prestação de serviços jurídicos para a empresa ABC',
          file_type: 'pdf',
          file_size: 2548976, // ~2.5MB
          status: 'active',
          category: 'contract',
          client_name: 'Empresa ABC Ltda',
          matter_title: 'Revisão Contratual',
          uploaded_by: 'Maria Advogada',
          uploaded_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          version: 1,
          is_template: false,
          tags: ['contrato', 'prestação de serviços', 'empresarial']
        },
        {
          id: '2',
          name: 'Petição Inicial - Ação Trabalhista João Silva.pdf',
          description: 'Petição inicial para ação de rescisão trabalhista indevida',
          file_type: 'pdf',
          file_size: 1892450, // ~1.9MB
          status: 'pending_review',
          category: 'petition',
          client_name: 'João Silva Santos',
          matter_title: 'Rescisão Trabalhista Indevida',
          uploaded_by: 'Pedro Advogado',
          uploaded_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          version: 2,
          is_template: false,
          tags: ['petição inicial', 'trabalhista', 'rescisão']
        },
        {
          id: '3',
          name: 'Evidências Fotográficas - Acidente.zip',
          description: 'Fotos do local do acidente e danos materiais',
          file_type: 'zip',
          file_size: 15728640, // ~15MB
          status: 'confidential',
          category: 'evidence',
          client_name: 'Ana Costa Pereira',
          matter_title: 'Indenização por Danos Morais',
          uploaded_by: 'João Advogado',
          uploaded_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          version: 1,
          is_template: false,
          tags: ['evidências', 'fotos', 'acidente', 'confidencial']
        },
        {
          id: '4',
          name: 'Template - Procuração Ad Judicia.docx',
          description: 'Template padrão para procuração judicial',
          file_type: 'docx',
          file_size: 45120, // ~45KB
          status: 'active',
          category: 'internal',
          uploaded_by: 'Sistema',
          uploaded_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          version: 3,
          is_template: true,
          tags: ['template', 'procuração', 'judicial']
        },
        {
          id: '5',
          name: 'Correspondência - Notificação Extrajudicial.pdf',
          description: 'Notificação extrajudicial enviada ao devedor',
          file_type: 'pdf',
          file_size: 892540, // ~890KB
          status: 'archived',
          category: 'correspondence',
          client_name: 'Carlos Oliveira',
          matter_title: 'Cobrança de Dívida',
          uploaded_by: 'Maria Advogada',
          uploaded_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          version: 1,
          is_template: false,
          tags: ['notificação', 'extrajudicial', 'cobrança']
        },
        {
          id: '6',
          name: 'Laudo Pericial - Danos Estruturais.pdf',
          description: 'Laudo técnico sobre danos estruturais no imóvel',
          file_type: 'pdf',
          file_size: 5247890, // ~5.2MB
          status: 'active',
          category: 'evidence',
          client_name: 'Construtora Delta',
          matter_title: 'Ação de Responsabilidade Civil',
          uploaded_by: 'Perito Técnico',
          uploaded_at: new Date().toISOString(), // Today
          updated_at: new Date().toISOString(),
          version: 1,
          is_template: false,
          tags: ['laudo', 'perícia', 'danos', 'estrutural']
        }
      ]

      setDocuments(sampleDocuments)
      calculateStats(sampleDocuments)
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (documentsData: Document[]) => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    
    const stats = {
      totalDocuments: documentsData.length,
      activeDocuments: documentsData.filter(d => d.status === 'active').length,
      pendingReview: documentsData.filter(d => d.status === 'pending_review').length,
      confidentialDocs: documentsData.filter(d => d.status === 'confidential').length,
      recentUploads: documentsData.filter(d => 
        d.uploaded_at.split('T')[0] === today
      ).length,
      totalSize: documentsData.reduce((sum, d) => sum + d.file_size, 0)
    }
    setStats(stats)
  }

  const filterDocuments = () => {
    let filtered = documents

    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.matter_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    if (statusFilter) {
      filtered = filtered.filter(doc => doc.status === statusFilter)
    }

    if (categoryFilter) {
      filtered = filtered.filter(doc => doc.category === categoryFilter)
    }

    setFilteredDocuments(filtered)
  }

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      active: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-800',
      pending_review: 'bg-yellow-100 text-yellow-800',
      confidential: 'bg-red-100 text-red-800'
    }

    const statusLabels = {
      active: 'Ativo',
      archived: 'Arquivado',
      pending_review: 'Pendente Revisão',
      confidential: 'Confidencial'
    }

    const statusIcons = {
      active: CheckCircleIcon,
      archived: FolderIcon,
      pending_review: ClockIcon,
      confidential: DocumentIcon
    }

    const Icon = statusIcons[status as keyof typeof statusIcons] || DocumentIcon

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800'}`}>
        <Icon className="w-3 h-3 mr-1" />
        {statusLabels[status as keyof typeof statusLabels] || status}
      </span>
    )
  }

  const getCategoryLabel = (category: string) => {
    const categoryLabels = {
      contract: 'Contratos',
      petition: 'Petições',
      court_filing: 'Protocolos Judiciais',
      evidence: 'Provas/Evidências',
      correspondence: 'Correspondências',
      internal: 'Documentos Internos',
      client_document: 'Documentos do Cliente',
      other: 'Outros'
    }
    return categoryLabels[category as keyof typeof categoryLabels] || category
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatTotalSize = (totalBytes: number) => {
    return formatFileSize(totalBytes)
  }

  const getFileIcon = (fileType: string) => {
    const Icon = fileTypeIcons[fileType as keyof typeof fileTypeIcons] || fileTypeIcons.default
    return Icon
  }

  const handleUpload = () => {
    setShowUploadModal(true)
  }

  const handlePreview = (document: Document) => {
    setSelectedDocument(document)
    setShowPreviewModal(true)
  }

  const handleDownload = (document: Document) => {
    // TODO: Implement actual download
    console.log('Downloading document:', document.name)
    alert(`Download iniciado: ${document.name}`)
  }

  const handleEdit = (document: Document) => {
    setSelectedDocument(document)
    setShowUploadModal(true)
  }

  const handleDelete = (documentId: string) => {
    if (confirm('Tem certeza que deseja excluir este documento?')) {
      setDocuments(prev => prev.filter(doc => doc.id !== documentId))
      console.log('Document deleted:', documentId)
    }
  }

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    
    setIsUploading(true)
    setUploadProgress(0)
    
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
        alert('Documento enviado com sucesso!')
        // TODO: Refresh documents list
      }, 500)
    }, 2500)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <StaffOnly 
      fallback={
        <div className="min-h-64 flex items-center justify-center">
          <div className="text-center">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Acesso Restrito</h3>
            <p className="text-gray-600">Você não tem permissão para acessar esta área.</p>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
          <p className="mt-2 text-gray-600">
            Gerencie documentos e arquivos do escritório
          </p>
        </div>
        <button
          onClick={handleUpload}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <CloudArrowUpIcon className="-ml-1 mr-2 h-5 w-5" />
          Enviar Documento
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentIcon className="h-6 w-6 text-gray-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalDocuments}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Ativos
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.activeDocuments}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pendentes
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.pendingReview}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Confidenciais
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.confidentialDocs}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CloudArrowUpIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Hoje
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.recentUploads}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FolderIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tamanho Total
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatTotalSize(stats.totalSize)}
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
                  placeholder="Buscar por nome, descrição, cliente, tags..."
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
                  <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700">
                    Categoria
                  </label>
                  <select
                    id="category-filter"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Clear Filters */}
              {(searchTerm || statusFilter || categoryFilter) && (
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setStatusFilter('')
                      setCategoryFilter('')
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
        Mostrando {filteredDocuments.length} de {documents.length} documentos
      </div>

      {/* Documents List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredDocuments.map((document) => {
            const FileIcon = getFileIcon(document.file_type)
            return (
              <li key={document.id}>
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <FileIcon className="h-8 w-8 text-gray-400" />
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <p className="text-lg font-medium text-gray-900 truncate">
                                  {document.name}
                                </p>
                                {getStatusBadge(document.status)}
                                {document.is_template && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    Template
                                  </span>
                                )}
                              </div>
                              
                              {document.description && (
                                <div className="mt-1 text-sm text-gray-700">
                                  {document.description}
                                </div>
                              )}
                              
                              <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                                {document.client_name && (
                                  <span className="flex items-center">
                                    <UserIcon className="w-4 h-4 mr-1" />
                                    {document.client_name}
                                  </span>
                                )}
                                {document.matter_title && (
                                  <span>Caso: {document.matter_title}</span>
                                )}
                                <span>Categoria: {getCategoryLabel(document.category)}</span>
                                <span>Tipo: {document.file_type.toUpperCase()}</span>
                                <span>{formatFileSize(document.file_size)}</span>
                              </div>
                              
                              <div className="mt-1 flex items-center text-sm text-gray-500 space-x-4">
                                <span className="flex items-center">
                                  <CalendarIcon className="w-4 h-4 mr-1" />
                                  Enviado: {formatDate(document.uploaded_at)}
                                </span>
                                <span>Por: {document.uploaded_by}</span>
                                <span>Versão: {document.version}</span>
                                {document.tags.length > 0 && (
                                  <span>Tags: {document.tags.join(', ')}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="ml-5 flex-shrink-0 flex items-center space-x-2">
                      <button
                        onClick={() => handlePreview(document)}
                        className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDownload(document)}
                        className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleEdit(document)}
                        className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDelete(document.id)}
                        className="inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>

        {/* Empty State */}
        {filteredDocuments.length === 0 && (
          <div className="text-center py-12">
            <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Nenhum documento encontrado
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter || categoryFilter
                ? 'Tente ajustar os filtros de busca.'
                : 'Comece enviando seu primeiro documento.'}
            </p>
            {!searchTerm && !statusFilter && !categoryFilter && (
              <div className="mt-6">
                <button
                  onClick={handleUpload}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <CloudArrowUpIcon className="-ml-1 mr-2 h-5 w-5" />
                  Enviar Documento
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedDocument ? 'Editar Documento' : 'Enviar Novo Documento'}
              </h3>
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
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="text-primary font-medium">Clique para enviar</span>
                        <span className="text-gray-500"> ou arraste e solte</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls,.ppt,.pptx,.txt,.zip"
                        />
                      </label>
                    </div>
                    <p className="text-sm text-gray-500">
                      PDF, DOC, DOCX, JPG, PNG, XLS, PPT, TXT, ZIP até 50MB
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
                    Nome do Documento
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={selectedDocument?.name}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Nome personalizado para o documento"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    name="description"
                    defaultValue={selectedDocument?.description}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Breve descrição do documento..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      defaultValue={selectedDocument?.status || 'active'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="active">Ativo</option>
                      <option value="pending_review">Pendente de Revisão</option>
                      <option value="confidential">Confidencial</option>
                      <option value="archived">Arquivado</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoria
                    </label>
                    <select
                      name="category"
                      defaultValue={selectedDocument?.category || 'other'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {categoryOptions.slice(1).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  <input
                    type="text"
                    name="tags"
                    defaultValue={selectedDocument?.tags.join(', ')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="palavras-chave, contrato, petição (separadas por vírgula)"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_template"
                    name="is_template"
                    defaultChecked={selectedDocument?.is_template}
                    className="mr-2"
                  />
                  <label htmlFor="is_template" className="text-sm text-gray-700">
                    Marcar como template
                  </label>
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
                    {isUploading ? 'Enviando...' : selectedDocument ? 'Atualizar' : 'Enviar'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedDocument && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-[800px] shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Visualizar Documento
              </h3>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900">{selectedDocument.name}</h4>
                {selectedDocument.description && (
                  <p className="text-gray-600 mt-1">{selectedDocument.description}</p>
                )}
                <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                  <span>Tipo: {selectedDocument.file_type.toUpperCase()}</span>
                  <span>Tamanho: {formatFileSize(selectedDocument.file_size)}</span>
                  <span>Versão: {selectedDocument.version}</span>
                </div>
              </div>
              
              <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <DocumentIcon className="mx-auto h-16 w-16 text-gray-400" />
                  <p className="mt-2 text-gray-500">
                    Visualização não disponível para este tipo de arquivo
                  </p>
                  <p className="text-sm text-gray-400">
                    Use o botão de download para abrir o arquivo
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => handleDownload(selectedDocument)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                  Download
                </button>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </StaffOnly>
  )
}