'use client'

import { useState, useMemo, useCallback } from 'react'
import { useAuthContext } from '@/lib/providers/auth-provider'
import { useSupabase } from '@/components/providers'
import { StaffOnly } from '@/components/auth/role-guard'
import { useDocuments, useUploadDocument, useDeleteDocument } from '@/lib/queries/useDocuments'
import { getSignedUrl } from '@/lib/supabase/storage'
import { useToast } from '@/components/ui/toast-provider'
import type { Document } from '@/types/database'
import {
  MagnifyingGlassIcon, FunnelIcon, DocumentIcon, EyeIcon, ArrowDownTrayIcon,
  TrashIcon, XMarkIcon, ChevronDownIcon, FolderIcon, CalendarIcon,
  DocumentTextIcon, CloudArrowUpIcon, CheckCircleIcon, ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

type DocumentWithJoin = Document & { matters?: { id: string; title: string } | null }

const ACCESS_LEVELS = [
  { value: '', label: 'Todos os Status' },
  { value: 'public', label: 'Publico' },
  { value: 'internal', label: 'Interno' },
  { value: 'restricted', label: 'Restrito' },
  { value: 'confidential', label: 'Confidencial' },
]

const CATEGORIES = [
  { value: '', label: 'Todas as Categorias' },
  { value: 'contract', label: 'Contratos' },
  { value: 'petition', label: 'Peticoes' },
  { value: 'court_filing', label: 'Protocolos Judiciais' },
  { value: 'evidence', label: 'Provas/Evidencias' },
  { value: 'correspondence', label: 'Correspondencias' },
  { value: 'internal', label: 'Documentos Internos' },
  { value: 'client_document', label: 'Documentos do Cliente' },
  { value: 'other', label: 'Outros' },
]

const BADGE_CONFIG: Record<string, { style: string; label: string; icon: typeof DocumentIcon }> = {
  public: { style: 'bg-green-100 text-green-800', label: 'Publico', icon: CheckCircleIcon },
  internal: { style: 'bg-blue-100 text-blue-800', label: 'Interno', icon: FolderIcon },
  restricted: { style: 'bg-yellow-100 text-yellow-800', label: 'Restrito', icon: ClockIcon },
  confidential: { style: 'bg-red-100 text-red-800', label: 'Confidencial', icon: DocumentIcon },
}

function formatFileSize(bytes: number): string {
  if (!bytes) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatDate(d: string): string { return new Date(d).toLocaleDateString('pt-BR') }

function getCategoryLabel(cat: string): string {
  return CATEGORIES.find((c) => c.value === cat)?.label ?? cat
}

function AccessBadge({ level }: { level: string | undefined }) {
  const cfg = BADGE_CONFIG[level ?? 'internal'] ?? BADGE_CONFIG.internal
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.style}`}>
      <Icon className="w-3 h-3 mr-1" />{cfg.label}
    </span>
  )
}

function getFileIcon(ft: string | undefined) {
  if (!ft) return DocumentIcon
  const n = ft.split('/').pop()?.toLowerCase() ?? ''
  return n.includes('pdf') || n.includes('doc') || n.includes('text') ? DocumentTextIcon : DocumentIcon
}

const BTN = 'inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-offset-2'

export default function DocumentsPage() {
  const { profile } = useAuthContext()
  const supabase = useSupabase()
  const toast = useToast()
  const { data: documents = [], isLoading } = useDocuments()
  const uploadMut = useUploadDocument()
  const deleteMut = useDeleteDocument()

  const [searchTerm, setSearchTerm] = useState('')
  const [accessFilter, setAccessFilter] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [preview, setPreview] = useState<Document | null>(null)
  const [file, setFile] = useState<File | null>(null)

  const filtered = useMemo(() => {
    let list = documents
    if (searchTerm) {
      const t = searchTerm.toLowerCase()
      list = list.filter((d) =>
        d.name.toLowerCase().includes(t) || d.description?.toLowerCase().includes(t) ||
        d.category?.toLowerCase().includes(t) || d.tags?.some((tag) => tag.toLowerCase().includes(t)))
    }
    if (accessFilter) list = list.filter((d) => d.access_level === accessFilter)
    if (catFilter) list = list.filter((d) => d.category === catFilter)
    return list
  }, [documents, searchTerm, accessFilter, catFilter])

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return {
      total: documents.length,
      active: documents.filter((d) => d.access_level === 'public' || d.access_level === 'internal').length,
      restricted: documents.filter((d) => d.access_level === 'restricted').length,
      confidential: documents.filter((d) => d.is_confidential || d.access_level === 'confidential').length,
      today: documents.filter((d) => d.created_at?.split('T')[0] === today).length,
      size: documents.reduce((s, d) => s + (d.file_size ?? 0), 0),
    }
  }, [documents])

  const handleDownload = useCallback(async (doc: Document) => {
    if (!doc.storage_path) { toast.error('Caminho do arquivo nao encontrado.'); return }
    try {
      window.open(await getSignedUrl(supabase, 'documents', doc.storage_path), '_blank')
    } catch { toast.error('Erro ao gerar link de download.') }
  }, [supabase, toast])

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return
    try { await deleteMut.mutateAsync(id); toast.success('Documento excluido com sucesso.') }
    catch { toast.error('Erro ao excluir documento.') }
  }, [deleteMut, toast])

  const handleUpload = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!file) { toast.error('Selecione um arquivo.'); return }
    if (!profile?.law_firm_id) { toast.error('Escritorio nao identificado.'); return }
    const fd = new FormData(e.currentTarget)
    const name = (fd.get('name') as string) || file.name
    const description = (fd.get('description') as string) || undefined
    const category = (fd.get('category') as string) || undefined
    const al = (fd.get('access_level') as string) || 'internal'
    const tags = ((fd.get('tags') as string) || '').split(',').map((t) => t.trim()).filter(Boolean)
    try {
      await uploadMut.mutateAsync({
        file,
        metadata: {
          law_firm_id: profile.law_firm_id, name, description, category,
          access_level: al as 'public' | 'internal' | 'restricted' | 'confidential',
          is_confidential: al === 'confidential',
          tags: tags.length ? tags : undefined,
        },
      })
      toast.success('Documento enviado com sucesso!')
      setShowUpload(false); setFile(null)
    } catch { toast.error('Erro ao enviar documento.') }
  }, [file, profile, uploadMut, toast])

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  )

  const openUpload = () => { setFile(null); setShowUpload(true) }

  return (
    <StaffOnly fallback={
      <div className="min-h-64 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Acesso Restrito</h3>
          <p className="text-gray-600">Voce nao tem permissao para acessar esta area.</p>
        </div>
      </div>
    }>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
            <p className="mt-2 text-gray-600">Gerencie documentos e arquivos do escritorio</p>
          </div>
          <button onClick={openUpload} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90">
            <CloudArrowUpIcon className="-ml-1 mr-2 h-5 w-5" />Enviar Documento
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {([
            ['Total', stats.total, DocumentIcon, 'text-gray-600'],
            ['Ativos', stats.active, CheckCircleIcon, 'text-green-600'],
            ['Restritos', stats.restricted, ClockIcon, 'text-yellow-600'],
            ['Confidenciais', stats.confidential, DocumentIcon, 'text-red-600'],
            ['Hoje', stats.today, CloudArrowUpIcon, 'text-blue-600'],
            ['Tamanho Total', formatFileSize(stats.size), FolderIcon, 'text-purple-600'],
          ] as const).map(([label, value, Icon, color]) => (
            <div key={label} className="bg-white shadow rounded-lg p-4">
              <div className="flex items-center">
                <Icon className={`h-6 w-6 ${color}`} />
                <div className="ml-3">
                  <dt className="text-sm font-medium text-gray-500 truncate">{label}</dt>
                  <dd className="text-lg font-medium text-gray-900">{value}</dd>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input type="text" className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md sm:text-sm focus:ring-primary focus:border-primary" placeholder="Buscar por nome, descricao, categoria, tags..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <FunnelIcon className="-ml-1 mr-2 h-5 w-5" />Filtros
              <ChevronDownIcon className={`ml-2 h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="access-filter" className="block text-sm font-medium text-gray-700">Nivel de Acesso</label>
                  <select id="access-filter" className="mt-1 block w-full border border-gray-300 rounded-md sm:text-sm focus:ring-primary focus:border-primary py-2 pl-3 pr-10" value={accessFilter} onChange={(e) => setAccessFilter(e.target.value)}>
                    {ACCESS_LEVELS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="cat-filter" className="block text-sm font-medium text-gray-700">Categoria</label>
                  <select id="cat-filter" className="mt-1 block w-full border border-gray-300 rounded-md sm:text-sm focus:ring-primary focus:border-primary py-2 pl-3 pr-10" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
                    {CATEGORIES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              {(searchTerm || accessFilter || catFilter) && (
                <button onClick={() => { setSearchTerm(''); setAccessFilter(''); setCatFilter('') }} className="mt-4 text-sm text-primary hover:text-primary/80">Limpar todos os filtros</button>
              )}
            </div>
          )}
        </div>

        <div className="text-sm text-gray-700">Mostrando {filtered.length} de {documents.length} documentos</div>

        {/* Documents List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filtered.map((doc) => {
              const FileIcon = getFileIcon(doc.file_type)
              const matter = (doc as DocumentWithJoin).matters
              return (
                <li key={doc.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <FileIcon className="h-8 w-8 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-lg font-medium text-gray-900 truncate">{doc.name}</p>
                          <AccessBadge level={doc.access_level} />
                        </div>
                        {doc.description && <p className="mt-1 text-sm text-gray-700">{doc.description}</p>}
                        <div className="mt-2 flex flex-wrap text-sm text-gray-500 gap-x-4 gap-y-1">
                          {matter?.title && <span>Caso: {matter.title}</span>}
                          {doc.category && <span>Categoria: {getCategoryLabel(doc.category)}</span>}
                          {doc.file_type && <span>Tipo: {doc.file_type.split('/').pop()?.toUpperCase()}</span>}
                          {doc.file_size != null && <span>{formatFileSize(doc.file_size)}</span>}
                        </div>
                        <div className="mt-1 flex flex-wrap text-sm text-gray-500 gap-x-4 gap-y-1">
                          <span className="flex items-center"><CalendarIcon className="w-4 h-4 mr-1" />Enviado: {formatDate(doc.created_at)}</span>
                          {doc.version && <span>Versao: {doc.version}</span>}
                          {doc.tags && doc.tags.length > 0 && <span>Tags: {doc.tags.join(', ')}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="ml-5 flex-shrink-0 flex items-center space-x-2">
                      <button onClick={() => setPreview(doc)} className={`${BTN} text-gray-700 hover:bg-gray-50 focus:ring-primary`} title="Visualizar"><EyeIcon className="h-4 w-4" /></button>
                      <button onClick={() => handleDownload(doc)} className={`${BTN} text-gray-700 hover:bg-gray-50 focus:ring-primary`} title="Download"><ArrowDownTrayIcon className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(doc.id)} disabled={deleteMut.isPending} className={`${BTN} text-red-700 hover:bg-red-50 focus:ring-red-500 disabled:opacity-50`} title="Excluir"><TrashIcon className="h-4 w-4" /></button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum documento encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">{searchTerm || accessFilter || catFilter ? 'Tente ajustar os filtros de busca.' : 'Comece enviando seu primeiro documento.'}</p>
              {!searchTerm && !accessFilter && !catFilter && (
                <button onClick={openUpload} className="mt-6 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90">
                  <CloudArrowUpIcon className="-ml-1 mr-2 h-5 w-5" />Enviar Documento
                </button>
              )}
            </div>
          )}
        </div>

        {/* Upload Modal */}
        {showUpload && (
          <div className="fixed inset-0 bg-gray-600/50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-gray-900">Enviar Novo Documento</h3>
                <button onClick={() => setShowUpload(false)} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleUpload}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Arquivo *</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <label htmlFor="file-upload" className="mt-2 block cursor-pointer">
                        <span className="text-primary font-medium">Clique para enviar</span>
                        <span className="text-gray-500"> ou arraste e solte</span>
                        <input id="file-upload" type="file" className="sr-only" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls,.ppt,.pptx,.txt,.zip" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                      </label>
                      {file ? <p className="text-sm text-green-600 mt-1">{file.name} ({formatFileSize(file.size)})</p> : <p className="text-sm text-gray-500">PDF, DOC, DOCX, JPG, PNG, XLS, PPT, TXT, ZIP ate 50MB</p>}
                    </div>
                  </div>
                  {uploadMut.isPending && <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-primary h-2 rounded-full animate-pulse w-3/4" /></div>}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Documento</label>
                    <input type="text" name="name" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary" placeholder="Nome personalizado para o documento" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descricao</label>
                    <textarea name="description" rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary" placeholder="Breve descricao do documento..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nivel de Acesso</label>
                      <select name="access_level" defaultValue="internal" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary">
                        {ACCESS_LEVELS.slice(1).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                      <select name="category" defaultValue="other" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary">
                        {CATEGORIES.slice(1).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                    <input type="text" name="tags" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary" placeholder="palavras-chave, contrato, peticao (separadas por virgula)" />
                  </div>
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button type="button" onClick={() => setShowUpload(false)} disabled={uploadMut.isPending} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancelar</button>
                    <button type="submit" disabled={uploadMut.isPending} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50">{uploadMut.isPending ? 'Enviando...' : 'Enviar'}</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {preview && (
          <div className="fixed inset-0 bg-gray-600/50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-[800px] shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-gray-900">Visualizar Documento</h3>
                <button onClick={() => setPreview(null)} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="w-6 h-6" /></button>
              </div>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900">{preview.name}</h4>
                  {preview.description && <p className="text-gray-600 mt-1">{preview.description}</p>}
                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                    {preview.file_type && <span>Tipo: {preview.file_type.split('/').pop()?.toUpperCase()}</span>}
                    {preview.file_size != null && <span>Tamanho: {formatFileSize(preview.file_size)}</span>}
                    {preview.version && <span>Versao: {preview.version}</span>}
                    {preview.access_level && <span>Acesso: {ACCESS_LEVELS.find((o) => o.value === preview.access_level)?.label ?? preview.access_level}</span>}
                  </div>
                  {preview.tags && preview.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {preview.tags.map((tag) => <span key={tag} className="px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700">{tag}</span>)}
                    </div>
                  )}
                </div>
                <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <DocumentIcon className="mx-auto h-16 w-16 text-gray-400" />
                    <p className="mt-2 text-gray-500">Visualizacao nao disponivel para este tipo de arquivo</p>
                    <p className="text-sm text-gray-400">Use o botao de download para abrir o arquivo</p>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button onClick={() => handleDownload(preview)} className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <ArrowDownTrayIcon className="w-4 h-4 mr-2" />Download
                  </button>
                  <button onClick={() => setPreview(null)} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90">Fechar</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </StaffOnly>
  )
}
