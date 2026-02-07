'use client'

import { useState, useMemo } from 'react'
import { useAuthContext } from '@/lib/providers/auth-provider'
import {
  useTimeEntries, useCreateTimeEntry, useUpdateTimeEntry, useDeleteTimeEntry,
} from '@/lib/queries/useTimeEntries'
import { useMatters } from '@/lib/queries/useMatters'
import { useToast } from '@/components/ui/toast-provider'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { timeEntrySchema, type TimeEntryFormData } from '@/lib/schemas/time-entry-schema'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Clock, Plus, Trash2, Pencil, RefreshCw, Search } from 'lucide-react'
import type { Matter } from '@/types/database'

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary'

function TimeEntryFormFields({ form, matters }: { form: UseFormReturn<TimeEntryFormData>; matters: Matter[] | undefined }) {
  const { register, formState: { errors } } = form
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Processo *</label>
        <select {...register('matter_id')} className={inputCls}>
          <option value="">Selecione um processo</option>
          {matters?.map((m) => (
            <option key={m.id} value={m.id}>{m.title} ({m.matter_number})</option>
          ))}
        </select>
        {errors.matter_id && <p className="mt-1 text-sm text-red-600">{errors.matter_id.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
        <textarea {...register('description')} rows={3} className={inputCls} placeholder="Descreva a atividade realizada" />
        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data do Trabalho</label>
          <input {...register('work_date')} type="date" className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Horas Trabalhadas *</label>
          <input {...register('hours_worked')} type="number" step="0.1" min="0.1" className={inputCls} />
          {errors.hours_worked && <p className="mt-1 text-sm text-red-600">{errors.hours_worked.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Taxa Horária (R$)</label>
          <input {...register('hourly_rate')} type="number" step="0.01" min="0" className={inputCls} placeholder="0,00" />
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input {...register('is_billable')} type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
            <span className="text-sm font-medium text-gray-700">Faturável</span>
          </label>
        </div>
      </div>
    </>
  )
}

export default function TimeTrackingPage() {
  const { profile } = useAuthContext()
  const toast = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [billableFilter, setBillableFilter] = useState<'all' | 'billable' | 'non-billable'>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingEntry, setEditingEntry] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const filters = useMemo(() => {
    if (billableFilter === 'billable') return { is_billable: true }
    if (billableFilter === 'non-billable') return { is_billable: false }
    return undefined
  }, [billableFilter])

  const { data: timeEntries, isLoading, error, refetch } = useTimeEntries(filters)
  const { data: matters } = useMatters()
  const createMut = useCreateTimeEntry()
  const updateMut = useUpdateTimeEntry()
  const deleteMut = useDeleteTimeEntry()

  const createForm = useForm<TimeEntryFormData>({
    resolver: zodResolver(timeEntrySchema),
    defaultValues: { work_date: new Date().toISOString().split('T')[0], is_billable: true, hours_worked: 1 },
  })
  const editForm = useForm<TimeEntryFormData>({ resolver: zodResolver(timeEntrySchema) })

  const filteredEntries = useMemo(() => {
    if (!timeEntries) return []
    if (!searchTerm) return timeEntries
    const term = searchTerm.toLowerCase()
    return timeEntries.filter((te) =>
      te.description.toLowerCase().includes(term) ||
      (te.matters?.title || '').toLowerCase().includes(term) ||
      (te.users?.full_name || '').toLowerCase().includes(term)
    )
  }, [timeEntries, searchTerm])

  const stats = useMemo(() => {
    if (!timeEntries) return { totalHours: 0, billableHours: 0, totalAmount: 0 }
    const now = new Date()
    const som = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisMonth = timeEntries.filter((te) => {
      const d = te.work_date ? new Date(te.work_date) : new Date(te.created_at)
      return d >= som
    })
    const billable = thisMonth.filter((te) => te.is_billable !== false)
    return {
      totalHours: Math.round(thisMonth.reduce((s, te) => s + (te.hours_worked || 0), 0) * 10) / 10,
      billableHours: Math.round(billable.reduce((s, te) => s + (te.hours_worked || 0), 0) * 10) / 10,
      totalAmount: billable.reduce((s, te) => s + (te.total_amount || (te.hours_worked || 0) * (te.hourly_rate || 0)), 0),
    }
  }, [timeEntries])

  const onCreateEntry = async (data: TimeEntryFormData) => {
    if (!profile?.law_firm_id || !profile?.id) { toast.error('Perfil não encontrado'); return }
    try {
      await createMut.mutateAsync({ ...data, law_firm_id: profile.law_firm_id, user_id: profile.id })
      toast.success('Lançamento criado com sucesso')
      setShowCreateDialog(false)
      createForm.reset({ work_date: new Date().toISOString().split('T')[0], is_billable: true, hours_worked: 1, matter_id: '', description: '' })
    } catch { toast.error('Erro ao criar lançamento') }
  }

  const openEditDialog = (entryId: string) => {
    const entry = timeEntries?.find((e) => e.id === entryId)
    if (!entry) return
    editForm.reset({
      matter_id: entry.matter_id, description: entry.description, hours_worked: entry.hours_worked,
      work_date: entry.work_date || '', hourly_rate: entry.hourly_rate || undefined, is_billable: entry.is_billable !== false,
    })
    setEditingEntry(entryId)
  }

  const onUpdateEntry = async (data: TimeEntryFormData) => {
    if (!editingEntry) return
    try {
      await updateMut.mutateAsync({ id: editingEntry, updates: data })
      toast.success('Lançamento atualizado com sucesso')
      setEditingEntry(null)
    } catch { toast.error('Erro ao atualizar lançamento') }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteMut.mutateAsync(id)
      toast.success('Lançamento excluído com sucesso')
      setDeleteConfirmId(null)
    } catch { toast.error('Erro ao excluir lançamento') }
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          Erro ao carregar lançamentos de tempo. Tente novamente.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Controle de Tempo</h1>
          <p className="text-gray-600 mt-1">Registre e gerencie horas trabalhadas</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Lançamento
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Horas Totais (Mês)', value: `${stats.totalHours}h`, color: 'text-blue-600' },
          { label: 'Horas Faturáveis (Mês)', value: `${stats.billableHours}h`, color: 'text-green-600' },
          { label: 'Valor Estimado (Mês)', value: formatCurrency(stats.totalAmount), color: 'text-purple-600' },
        ].map((card) => (
          <div key={card.label} className="bg-white p-5 rounded-lg shadow">
            <div className="flex items-center">
              <Clock className={`h-6 w-6 ${card.color}`} />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Buscar por descrição, processo ou responsável..." value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} className={`pl-10 pr-4 py-2 ${inputCls}`} />
        </div>
        <select value={billableFilter} onChange={(e) => setBillableFilter(e.target.value as typeof billableFilter)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary">
          <option value="all">Todos os tipos</option>
          <option value="billable">Faturável</option>
          <option value="non-billable">Não faturável</option>
        </select>
      </div>

      {/* Time Entries Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Nenhum lançamento encontrado</p>
            <button onClick={() => setShowCreateDialog(true)} className="mt-2 text-sm text-primary hover:text-primary/80">
              Registrar primeiro lançamento
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Data', 'Processo', 'Descrição', 'Horas', 'Taxa', 'Faturável', 'Ações'].map((h, i) => (
                    <th key={h} className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${i === 6 ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.work_date ? new Date(entry.work_date).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.matters?.title || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{entry.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{entry.hours_worked}h</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.hourly_rate ? formatCurrency(entry.hourly_rate) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${entry.is_billable !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {entry.is_billable !== false ? 'Sim' : 'Não'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button onClick={() => openEditDialog(entry.id)} className="text-blue-600 hover:text-blue-800" title="Editar">
                        <Pencil className="h-4 w-4 inline" />
                      </button>
                      <button onClick={() => setDeleteConfirmId(entry.id)} className="text-red-600 hover:text-red-800" title="Excluir">
                        <Trash2 className="h-4 w-4 inline" />
                      </button>
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
          <DialogHeader><DialogTitle>Novo Lançamento de Tempo</DialogTitle></DialogHeader>
          <form onSubmit={createForm.handleSubmit(onCreateEntry)} className="p-6 pt-0 space-y-4">
            <TimeEntryFormFields form={createForm} matters={matters} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMut.isPending}>{createMut.isPending ? 'Salvando...' : 'Salvar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editingEntry !== null} onOpenChange={(open) => { if (!open) setEditingEntry(null) }}>
        <DialogContent onClose={() => setEditingEntry(null)}>
          <DialogHeader><DialogTitle>Editar Lançamento</DialogTitle></DialogHeader>
          <form onSubmit={editForm.handleSubmit(onUpdateEntry)} className="p-6 pt-0 space-y-4">
            <TimeEntryFormFields form={editForm} matters={matters} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingEntry(null)}>Cancelar</Button>
              <Button type="submit" disabled={updateMut.isPending}>{updateMut.isPending ? 'Salvando...' : 'Salvar Alterações'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null) }}>
        <DialogContent onClose={() => setDeleteConfirmId(null)}>
          <DialogHeader><DialogTitle>Excluir Lançamento</DialogTitle></DialogHeader>
          <div className="p-6 pt-0">
            <p className="text-sm text-gray-600">Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)} disabled={deleteMut.isPending}>
              {deleteMut.isPending ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
