'use client'

import { useState, useMemo } from 'react'
import { useAuthContext } from '@/lib/providers/auth-provider'
import { useEffectiveLawFirmId } from '@/lib/hooks/use-effective-law-firm-id'
import { useInvoices, useCreateInvoice, useDeleteInvoice, useUpdateInvoiceStatus } from '@/lib/queries/useInvoices'
import { useMatters } from '@/lib/queries/useMatters'
import { useToast } from '@/components/ui/toast-provider'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { invoiceSchema, type InvoiceFormData } from '@/lib/schemas/invoice-schema'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus, Search, Trash2, FileText, RefreshCw, ChevronDown } from 'lucide-react'
import type { Invoice } from '@/types/database'

type InvoiceStatus = Invoice['status']

const fmt = (amount: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)

const statusColor = (s: string) => {
  if (s === 'paid') return 'bg-green-100 text-green-800'
  if (s === 'overdue') return 'bg-red-100 text-red-800'
  if (s === 'cancelled') return 'bg-gray-100 text-gray-800'
  return 'bg-yellow-100 text-yellow-800'
}

const statusLabel: Record<string, string> = {
  paid: 'Pago', draft: 'Rascunho', sent: 'Enviado', viewed: 'Visualizado', overdue: 'Vencido', cancelled: 'Cancelado',
}

const statusOptions = [
  { value: '', label: 'Todos os status' }, { value: 'draft', label: 'Rascunho' },
  { value: 'sent', label: 'Enviado' }, { value: 'viewed', label: 'Visualizado' },
  { value: 'paid', label: 'Pago' }, { value: 'overdue', label: 'Vencido' },
  { value: 'cancelled', label: 'Cancelado' },
]

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary'

export default function InvoicesPage() {
  const { profile } = useAuthContext()
  const effectiveLawFirmId = useEffectiveLawFirmId()
  const toast = useToast()
  const [statusFilter, setStatusFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [statusMenuId, setStatusMenuId] = useState<string | null>(null)

  const { data: invoices, isLoading, error, refetch } = useInvoices(effectiveLawFirmId, statusFilter ? { status: statusFilter } : undefined)
  const { data: matters } = useMatters(effectiveLawFirmId)
  const createMut = useCreateInvoice()
  const deleteMut = useDeleteInvoice()
  const statusMut = useUpdateInvoiceStatus()

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: { status: 'draft', issue_date: new Date().toISOString().split('T')[0] },
  })

  const filtered = useMemo(() => {
    if (!invoices) return []
    if (!searchTerm) return invoices
    const t = searchTerm.toLowerCase()
    return invoices.filter((i) =>
      i.invoice_number.toLowerCase().includes(t) ||
      (i.contacts?.full_name || '').toLowerCase().includes(t) ||
      (i.contacts?.company_name || '').toLowerCase().includes(t) ||
      (i.title || '').toLowerCase().includes(t)
    )
  }, [invoices, searchTerm])

  const onCreate = async (data: InvoiceFormData) => {
    if (!effectiveLawFirmId) { toast.error('Escritório não encontrado'); return }
    try {
      await createMut.mutateAsync({ ...data, law_firm_id: effectiveLawFirmId, status: data.status || 'draft' })
      toast.success('Fatura criada com sucesso')
      setShowCreateDialog(false)
      reset()
    } catch { toast.error('Erro ao criar fatura') }
  }

  const onDelete = async (id: string) => {
    try {
      await deleteMut.mutateAsync(id)
      toast.success('Fatura excluída com sucesso')
      setDeleteConfirmId(null)
    } catch { toast.error('Erro ao excluir fatura') }
  }

  const onStatusChange = async (id: string, s: InvoiceStatus) => {
    try {
      await statusMut.mutateAsync({ id, status: s })
      toast.success('Status atualizado com sucesso')
      setStatusMenuId(null)
    } catch { toast.error('Erro ao atualizar status') }
  }

  if (error) {
    return (
      <div className="p-6"><div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">Erro ao carregar faturas. Tente novamente.</div></div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Faturas</h1>
          <p className="text-gray-600 mt-1">Gerencie as faturas do escritório</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Atualizar
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" /> Nova Fatura
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Buscar por número, cliente ou título..." value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} className={`pl-10 pr-4 py-2 ${inputCls}`} />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary">
          {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Nenhuma fatura encontrada</p>
            <button onClick={() => setShowCreateDialog(true)} className="mt-2 text-sm text-primary hover:text-primary/80">Criar primeira fatura</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Fatura', 'Cliente', 'Processo', 'Valor', 'Status', 'Vencimento', ''].map((h, i) => (
                    <th key={h || 'act'} className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${i === 6 ? 'text-right' : 'text-left'}`}>{h || 'Ações'}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{inv.invoice_number}</div>
                      {inv.title && <div className="text-sm text-gray-500">{inv.title}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{inv.contacts?.full_name || inv.contacts?.company_name || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{inv.matters?.title || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{fmt(inv.total_amount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="relative">
                        <button onClick={() => setStatusMenuId(statusMenuId === inv.id ? null : inv.id)}
                          className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${statusColor(inv.status || 'draft')}`}>
                          {statusLabel[inv.status || 'draft'] || inv.status}
                          <ChevronDown className="ml-1 h-3 w-3" />
                        </button>
                        {statusMenuId === inv.id && (
                          <div className="absolute z-10 mt-1 w-36 bg-white border border-gray-200 rounded-md shadow-lg">
                            {statusOptions.filter((s) => s.value && s.value !== inv.status).map((s) => (
                              <button key={s.value} onClick={() => onStatusChange(inv.id, s.value as InvoiceStatus)}
                                className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">{s.label}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm ${inv.status === 'overdue' ? 'text-red-600 font-medium' : 'text-gray-900'}`}>{new Date(inv.due_date).toLocaleDateString('pt-BR')}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => setDeleteConfirmId(inv.id)} className="text-red-600 hover:text-red-800" title="Excluir"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent onClose={() => setShowCreateDialog(false)}>
          <DialogHeader><DialogTitle>Nova Fatura</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onCreate)} className="p-6 pt-0 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número da Fatura *</label>
              <input {...register('invoice_number')} className={inputCls} placeholder="INV-2025-001" />
              {errors.invoice_number && <p className="mt-1 text-sm text-red-600">{errors.invoice_number.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID do Cliente *</label>
              <input {...register('contact_id')} className={inputCls} placeholder="ID do contato" />
              {errors.contact_id && <p className="mt-1 text-sm text-red-600">{errors.contact_id.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Processo</label>
              <select {...register('matter_id')} className={inputCls}>
                <option value="">Nenhum</option>
                {matters?.map((m) => <option key={m.id} value={m.id}>{m.title} ({m.matter_number})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <input {...register('title')} className={inputCls} placeholder="Título da fatura" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor Total *</label>
                <input {...register('total_amount')} type="number" step="0.01" min="0" className={inputCls} placeholder="0,00" />
                {errors.total_amount && <p className="mt-1 text-sm text-red-600">{errors.total_amount.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Vencimento *</label>
                <input {...register('due_date')} type="date" className={inputCls} />
                {errors.due_date && <p className="mt-1 text-sm text-red-600">{errors.due_date.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Emissão</label>
                <input {...register('issue_date')} type="date" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select {...register('status')} className={inputCls}>
                  <option value="draft">Rascunho</option>
                  <option value="sent">Enviado</option>
                  <option value="paid">Pago</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea {...register('description')} rows={2} className={inputCls} placeholder="Descrição da fatura" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
              <textarea {...register('notes')} rows={2} className={inputCls} placeholder="Observações internas" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setShowCreateDialog(false); reset() }}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting || createMut.isPending}>{createMut.isPending ? 'Criando...' : 'Criar Fatura'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null) }}>
        <DialogContent onClose={() => setDeleteConfirmId(null)}>
          <DialogHeader><DialogTitle>Excluir Fatura</DialogTitle></DialogHeader>
          <div className="p-6 pt-0">
            <p className="text-sm text-gray-600">Tem certeza que deseja excluir esta fatura? Esta ação não pode ser desfeita.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteConfirmId && onDelete(deleteConfirmId)} disabled={deleteMut.isPending}>
              {deleteMut.isPending ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
