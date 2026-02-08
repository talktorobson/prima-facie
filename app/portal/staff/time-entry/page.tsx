'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  useMyTimeEntries,
  useMyAssignedMatters,
  useQuickLogTime,
} from '@/lib/queries/useStaffPortal'
import { useToast } from '@/components/ui/toast-provider'
import { useSupabase } from '@/components/providers'
import {
  ClockIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CalendarIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline'

interface TimeEntryRow {
  id: string
  description: string
  hours_worked: number
  work_date: string
  is_billable: boolean
  matter_id: string
  matters: { id: string; title: string } | null
}

interface MatterRow {
  id: string
  title: string
  matter_number: string
  status: string
}

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('pt-BR')

function getWeekRange() {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return { start: monday.toISOString().split('T')[0], end: sunday.toISOString().split('T')[0] }
}

function getMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }
}

function getLastMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const end = new Date(now.getFullYear(), now.getMonth(), 0)
  return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }
}

type RangePreset = 'week' | 'month' | 'last_month'

const presetRanges: Record<RangePreset, () => { start: string; end: string }> = {
  week: getWeekRange,
  month: getMonthRange,
  last_month: getLastMonthRange,
}

export default function StaffTimeEntryPage() {
  const toast = useToast()
  const supabase = useSupabase()
  const queryClient = useQueryClient()
  const quickLog = useQuickLogTime()

  const [rangePreset, setRangePreset] = useState<RangePreset>('week')
  const dateRange = presetRanges[rangePreset]()

  const { data: timeEntries, isLoading: entriesLoading } = useMyTimeEntries(dateRange)
  const { data: matters, isLoading: mattersLoading } = useMyAssignedMatters()

  const entryList = (timeEntries ?? []) as unknown as TimeEntryRow[]
  const matterList = (matters ?? []) as unknown as MatterRow[]

  // Quick log form
  const [formMatterId, setFormMatterId] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0])
  const [formHours, setFormHours] = useState('')
  const [formBillable, setFormBillable] = useState(true)

  // Edit dialog
  const [editEntry, setEditEntry] = useState<TimeEntryRow | null>(null)
  const [editDescription, setEditDescription] = useState('')
  const [editHours, setEditHours] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editBillable, setEditBillable] = useState(true)
  const [editSaving, setEditSaving] = useState(false)

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const isLoading = entriesLoading || mattersLoading

  // Summary stats
  const totalHours = entryList.reduce((sum, e) => sum + e.hours_worked, 0)
  const billableHours = entryList
    .filter((e) => e.is_billable)
    .reduce((sum, e) => sum + e.hours_worked, 0)
  const entryCount = entryList.length

  const handleQuickLog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formMatterId || !formHours || !formDescription) {
      toast.warning('Preencha todos os campos.')
      return
    }
    try {
      await quickLog.mutateAsync({
        matter_id: formMatterId,
        hours_worked: parseFloat(formHours),
        description: formDescription,
        work_date: formDate,
        is_billable: formBillable,
      })
      toast.success('Horas registradas com sucesso!')
      setFormMatterId('')
      setFormDescription('')
      setFormHours('')
      setFormDate(new Date().toISOString().split('T')[0])
      setFormBillable(true)
    } catch {
      toast.error('Erro ao registrar horas. Tente novamente.')
    }
  }

  const openEdit = (entry: TimeEntryRow) => {
    setEditEntry(entry)
    setEditDescription(entry.description)
    setEditHours(entry.hours_worked.toString())
    setEditDate(entry.work_date)
    setEditBillable(entry.is_billable)
  }

  const handleEditSave = async () => {
    if (!editEntry) return
    setEditSaving(true)
    try {
      const { error } = await supabase
        .from('time_entries')
        .update({
          description: editDescription,
          hours_worked: parseFloat(editHours),
          work_date: editDate,
          is_billable: editBillable,
        })
        .eq('id', editEntry.id)

      if (error) throw error

      queryClient.invalidateQueries({ queryKey: ['portal', 'staff', 'my-time-entries'] })
      toast.success('Entrada atualizada com sucesso!')
      setEditEntry(null)
    } catch {
      toast.error('Erro ao atualizar entrada. Tente novamente.')
    } finally {
      setEditSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      const { error } = await supabase
        .from('time_entries')
        .delete()
        .eq('id', deleteId)

      if (error) throw error

      queryClient.invalidateQueries({ queryKey: ['portal', 'staff', 'my-time-entries'] })
      toast.success('Entrada removida.')
      setDeleteId(null)
    } catch {
      toast.error('Erro ao remover entrada. Tente novamente.')
    } finally {
      setDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-gray-600">Carregando registros de horas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Registro de Horas</h1>
        <p className="mt-1 text-gray-600">Registre e acompanhe suas horas trabalhadas.</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white shadow rounded-lg p-4 flex items-center">
          <ClockIcon className="h-6 w-6 text-blue-600 flex-shrink-0" />
          <div className="ml-3">
            <p className="text-xs font-medium text-gray-500">Total de Horas</p>
            <p className="text-lg font-semibold text-gray-900">{totalHours.toFixed(1)}h</p>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-4 flex items-center">
          <CurrencyDollarIcon className="h-6 w-6 text-green-600 flex-shrink-0" />
          <div className="ml-3">
            <p className="text-xs font-medium text-gray-500">Horas Faturaveis</p>
            <p className="text-lg font-semibold text-gray-900">{billableHours.toFixed(1)}h</p>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-4 flex items-center">
          <CalendarIcon className="h-6 w-6 text-purple-600 flex-shrink-0" />
          <div className="ml-3">
            <p className="text-xs font-medium text-gray-500">Entradas</p>
            <p className="text-lg font-semibold text-gray-900">{entryCount}</p>
          </div>
        </div>
      </div>

      {/* Date range presets */}
      <div className="flex gap-2">
        {([
          ['week', 'Esta Semana'],
          ['month', 'Este Mes'],
          ['last_month', 'Ultimo Mes'],
        ] as [RangePreset, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setRangePreset(key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              rangePreset === key
                ? 'bg-primary text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick log form */}
        <div className="bg-white shadow rounded-lg lg:col-span-1">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center">
            <PlusIcon className="h-5 w-5 text-primary mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Novo Registro</h3>
          </div>
          <form onSubmit={handleQuickLog} className="p-6 space-y-4">
            <div>
              <label htmlFor="te-matter" className="block text-sm font-medium text-gray-700">
                Processo
              </label>
              <select
                id="te-matter"
                value={formMatterId}
                onChange={(e) => setFormMatterId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              >
                <option value="">Selecione um processo</option>
                {matterList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.matter_number} - {m.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="te-desc" className="block text-sm font-medium text-gray-700">
                Descricao
              </label>
              <textarea
                id="te-desc"
                rows={2}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Descreva a atividade realizada..."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="te-date" className="block text-sm font-medium text-gray-700">
                  Data
                </label>
                <input
                  id="te-date"
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="te-hours" className="block text-sm font-medium text-gray-700">
                  Horas
                </label>
                <input
                  id="te-hours"
                  type="number"
                  step="0.25"
                  min="0.25"
                  max="24"
                  value={formHours}
                  onChange={(e) => setFormHours(e.target.value)}
                  placeholder="Ex: 1.5"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
            </div>
            <div className="flex items-center">
              <input
                id="te-billable"
                type="checkbox"
                checked={formBillable}
                onChange={(e) => setFormBillable(e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="te-billable" className="ml-2 text-sm text-gray-700">
                Faturavel
              </label>
            </div>
            <button
              type="submit"
              disabled={quickLog.isPending}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 disabled:opacity-50"
            >
              {quickLog.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Salvando...
                </>
              ) : (
                'Registrar Horas'
              )}
            </button>
          </form>
        </div>

        {/* History table */}
        <div className="bg-white shadow rounded-lg lg:col-span-2">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Historico</h3>
          </div>
          <div className="p-6">
            {entryList.length === 0 ? (
              <div className="text-center py-8">
                <ClockIcon className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">
                  Nenhum registro de horas neste periodo.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Data
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Processo
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Descricao
                      </th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Horas
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Faturavel
                      </th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Acoes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {entryList.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-3 py-3 text-sm text-gray-700 whitespace-nowrap">
                          {formatDate(entry.work_date)}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-700 truncate max-w-[150px]">
                          {entry.matters?.title ?? '-'}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-700 truncate max-w-[200px]">
                          {entry.description}
                        </td>
                        <td className="px-3 py-3 text-sm text-gray-900 font-medium text-right whitespace-nowrap">
                          {entry.hours_worked.toFixed(2)}h
                        </td>
                        <td className="px-3 py-3 text-center">
                          {entry.is_billable ? (
                            <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                              Sim
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-500">
                              Nao
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => openEdit(entry)}
                            className="p-1 text-gray-400 hover:text-primary"
                            title="Editar"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(entry.id)}
                            className="p-1 text-gray-400 hover:text-red-600 ml-1"
                            title="Remover"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit dialog */}
      {editEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setEditEntry(null)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Editar Registro</h3>
              <button
                onClick={() => setEditEntry(null)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Descricao</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Data</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Horas</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0.25"
                    max="24"
                    value={editHours}
                    onChange={(e) => setEditHours(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={editBillable}
                  onChange={(e) => setEditBillable(e.target.checked)}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">Faturavel</label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setEditEntry(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEditSave}
                  disabled={editSaving}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {editSaving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm dialog */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Confirmar Exclusao</h3>
            <p className="text-sm text-gray-600 mb-4">
              Tem certeza que deseja remover este registro de horas? Esta acao nao pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Removendo...' : 'Remover'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
