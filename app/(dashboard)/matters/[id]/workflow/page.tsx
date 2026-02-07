'use client'

import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserIcon,
  DocumentTextIcon,
  CalendarIcon,
  PlusIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'
import { useEffectiveLawFirmId } from '@/lib/hooks/use-effective-law-firm-id'
import { useMatter, useUpdateMatter } from '@/lib/queries/useMatters'
import { useUsers, useActivityLogs } from '@/lib/queries/useAdmin'

// Status workflow definition
const statusWorkflow = {
  active: {
    label: 'Ativo',
    color: 'green',
    next: ['on_hold', 'settled', 'closed', 'dismissed'],
    description: 'Processo em andamento normal'
  },
  on_hold: {
    label: 'Suspenso',
    color: 'yellow',
    next: ['active', 'closed', 'dismissed'],
    description: 'Processo temporariamente suspenso'
  },
  settled: {
    label: 'Acordo',
    color: 'emerald',
    next: ['closed'],
    description: 'Processo encerrado por acordo entre as partes'
  },
  closed: {
    label: 'Encerrado',
    color: 'slate',
    next: [],
    description: 'Processo encerrado, sem ações pendentes'
  },
  dismissed: {
    label: 'Arquivado',
    color: 'red',
    next: ['active'],
    description: 'Processo arquivado'
  }
}

export default function MatterWorkflowPage() {
  const params = useParams()
  const router = useRouter()
  const effectiveLawFirmId = useEffectiveLawFirmId()
  const matterId = params.id as string

  const { data: matter, isLoading: matterLoading } = useMatter(matterId)
  const updateMatter = useUpdateMatter()
  const { data: users = [] } = useUsers(effectiveLawFirmId)
  const { data: activityLogs = [] } = useActivityLogs(effectiveLawFirmId, { entity_type: 'matter' })

  const [showStatusChange, setShowStatusChange] = useState(false)
  const [showAssignment, setShowAssignment] = useState(false)
  const [selectedNewStatus, setSelectedNewStatus] = useState('')
  const [statusChangeReason, setStatusChangeReason] = useState('')
  const [statusChangeNotes, setStatusChangeNotes] = useState('')
  const [selectedTeamMember, setSelectedTeamMember] = useState('')
  const [assignmentReason, setAssignmentReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const currentStatus = matter?.status || 'active'
  const clientName = (matter as Record<string, unknown>)?.contacts?.[0]?.contact?.full_name || '-'
  const responsibleLawyer = (matter as Record<string, unknown>)?.assigned_lawyer?.full_name || '-'

  // Filter activity logs for this matter
  const workflowHistory = useMemo(() => {
    return activityLogs
      .filter(log => log.entity_id === matterId)
      .map(log => ({
        id: log.id,
        from_status: (log.old_values as Record<string, string>)?.status || null,
        to_status: (log.new_values as Record<string, string>)?.status || log.action,
        changed_by: (log as Record<string, unknown>).users?.full_name || 'Sistema',
        changed_at: log.created_at,
        reason: log.description || log.action,
        notes: null as string | null
      }))
  }, [activityLogs, matterId])

  const getCurrentStatusInfo = () => statusWorkflow[currentStatus as keyof typeof statusWorkflow]

  const getStatusColor = (status: string) => {
    const info = statusWorkflow[status as keyof typeof statusWorkflow]
    return info?.color || 'gray'
  }

  const getStatusBadge = (status: string) => {
    const info = statusWorkflow[status as keyof typeof statusWorkflow]
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      green: 'bg-green-100 text-green-800',
      gray: 'bg-gray-100 text-gray-800',
      orange: 'bg-orange-100 text-orange-800',
      purple: 'bg-purple-100 text-purple-800',
      emerald: 'bg-emerald-100 text-emerald-800',
      slate: 'bg-slate-100 text-slate-800',
      red: 'bg-red-100 text-red-800'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorMap[info?.color || 'gray']}`}>
        {info?.label || status}
      </span>
    )
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const handleStatusChange = async () => {
    if (!selectedNewStatus || !statusChangeReason.trim()) return

    setIsSubmitting(true)

    try {
      await updateMatter.mutateAsync({
        id: matterId,
        updates: {
          status: selectedNewStatus as 'active' | 'closed' | 'on_hold' | 'settled' | 'dismissed',
        }
      })

      setShowStatusChange(false)
      setSelectedNewStatus('')
      setStatusChangeReason('')
      setStatusChangeNotes('')
    } catch (error) {
      console.error('Error changing status:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAssignment = async () => {
    if (!selectedTeamMember || !assignmentReason.trim()) return

    setIsSubmitting(true)

    try {
      await updateMatter.mutateAsync({
        id: matterId,
        updates: {
          responsible_lawyer_id: selectedTeamMember,
        }
      })

      setShowAssignment(false)
      setSelectedTeamMember('')
      setAssignmentReason('')
    } catch (error) {
      console.error('Error changing assignment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (matterLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-primary mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-500">Carregando workflow...</p>
        </div>
      </div>
    )
  }

  if (!matter) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-500">Processo não encontrado.</p>
          <Link href="/matters" className="text-primary hover:underline mt-2 inline-block">
            Voltar para lista
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href={`/matters/${matterId}`}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Voltar para Detalhes
          </Link>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Workflow do Processo - {matter.matter_number}
        </h1>
        <p className="mt-2 text-gray-600">{matter.title}</p>
      </div>

      {/* Current Status Card */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Status Atual</h2>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowStatusChange(true)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <ArrowRightIcon className="h-4 w-4 mr-2" />
              Alterar Status
            </button>
            <button
              onClick={() => setShowAssignment(true)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <UserIcon className="h-4 w-4 mr-2" />
              Reatribuir
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <dt className="text-sm font-medium text-gray-500">Status</dt>
            <dd className="mt-1">
              {getStatusBadge(currentStatus)}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Responsável</dt>
            <dd className="mt-1 text-sm text-gray-900">{responsibleLawyer}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Cliente</dt>
            <dd className="mt-1 text-sm text-gray-900">{clientName}</dd>
          </div>
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-700">
            <strong>Descrição:</strong> {getCurrentStatusInfo()?.description}
          </p>
        </div>
      </div>

      {/* Status Workflow Diagram */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Fluxo de Status Disponíveis</h2>

        <div className="flex flex-wrap gap-4 mb-6">
          {getCurrentStatusInfo()?.next.map((nextStatus) => (
            <div key={nextStatus} className="flex items-center space-x-2">
              <ArrowRightIcon className="h-4 w-4 text-gray-400" />
              {getStatusBadge(nextStatus)}
            </div>
          ))}
          {getCurrentStatusInfo()?.next.length === 0 && (
            <p className="text-sm text-gray-500">Nenhuma transição disponível para este status.</p>
          )}
        </div>

        {/* All Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(statusWorkflow).map(([status, info]) => (
            <div
              key={status}
              className={`p-3 rounded-lg border-2 ${
                status === currentStatus
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                {getStatusBadge(status)}
                {status === currentStatus && (
                  <CheckCircleIcon className="h-4 w-4 text-primary" />
                )}
              </div>
              <p className="text-xs text-gray-600">{info.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Workflow History */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Histórico de Mudanças</h2>

        {workflowHistory.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhuma alteração registrada para este processo.</p>
        ) : (
          <div className="flow-root">
            <ul className="-mb-8">
              {workflowHistory.map((entry, entryIdx) => (
                <li key={entry.id}>
                  <div className="relative pb-8">
                    {entryIdx !== workflowHistory.length - 1 ? (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="bg-white h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white border-2 border-gray-300">
                          {entry.from_status === null ? (
                            <PlusIcon className="h-4 w-4 text-gray-500" />
                          ) : entry.from_status === entry.to_status ? (
                            <UserIcon className="h-4 w-4 text-blue-500" />
                          ) : (
                            <ArrowRightIcon className="h-4 w-4 text-green-500" />
                          )}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5">
                        <div className="flex justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              {entry.from_status && entry.from_status !== entry.to_status && (
                                <>
                                  {getStatusBadge(entry.from_status)}
                                  <ArrowRightIcon className="h-3 w-3 text-gray-400" />
                                </>
                              )}
                              {getStatusBadge(entry.to_status)}
                            </div>
                            <p className="mt-1 text-sm text-gray-900 font-medium">{entry.reason}</p>
                            {entry.notes && (
                              <p className="mt-1 text-sm text-gray-500">{entry.notes}</p>
                            )}
                          </div>
                          <div className="text-right text-sm text-gray-500 whitespace-nowrap">
                            <time dateTime={entry.changed_at}>{formatDateTime(entry.changed_at)}</time>
                            <p className="text-xs text-gray-400">{entry.changed_by}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Status Change Modal */}
      {showStatusChange && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full sm:w-96 mx-4 sm:mx-auto shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Alterar Status</h3>
                <button
                  onClick={() => setShowStatusChange(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Fechar</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status Atual</label>
                  <div className="mt-1">{getStatusBadge(currentStatus)}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Novo Status *</label>
                  <select
                    value={selectedNewStatus}
                    onChange={(e) => setSelectedNewStatus(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  >
                    <option value="">Selecione o novo status</option>
                    {getCurrentStatusInfo()?.next.map((status) => (
                      <option key={status} value={status}>
                        {statusWorkflow[status as keyof typeof statusWorkflow]?.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Motivo da Mudança *</label>
                  <input
                    type="text"
                    value={statusChangeReason}
                    onChange={(e) => setStatusChangeReason(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    placeholder="Ex: Documentação recebida"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Observações</label>
                  <textarea
                    value={statusChangeNotes}
                    onChange={(e) => setStatusChangeNotes(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    placeholder="Observações adicionais (opcional)"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowStatusChange(false)}
                  className="px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-md hover:bg-gray-600"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleStatusChange}
                  disabled={!selectedNewStatus || !statusChangeReason.trim() || isSubmitting}
                  className={`px-4 py-2 text-white text-sm font-medium rounded-md ${
                    !selectedNewStatus || !statusChangeReason.trim() || isSubmitting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-primary hover:bg-primary/90'
                  }`}
                >
                  {isSubmitting ? 'Alterando...' : 'Alterar Status'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full sm:w-96 mx-4 sm:mx-auto shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Reatribuir Processo</h3>
                <button
                  onClick={() => setShowAssignment(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Fechar</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Responsável Atual</label>
                  <div className="mt-1 text-sm text-gray-900">{responsibleLawyer}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Novo Responsável *</label>
                  <select
                    value={selectedTeamMember}
                    onChange={(e) => setSelectedTeamMember(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  >
                    <option value="">Selecione um membro da equipe</option>
                    {users.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.full_name} - {member.user_type} {member.oab_number ? `(${member.oab_number})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Motivo da Reatribuição *</label>
                  <textarea
                    value={assignmentReason}
                    onChange={(e) => setAssignmentReason(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    placeholder="Ex: Redistribuição de carga de trabalho"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAssignment(false)}
                  className="px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-md hover:bg-gray-600"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAssignment}
                  disabled={!selectedTeamMember || !assignmentReason.trim() || isSubmitting}
                  className={`px-4 py-2 text-white text-sm font-medium rounded-md ${
                    !selectedTeamMember || !assignmentReason.trim() || isSubmitting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-primary hover:bg-primary/90'
                  }`}
                >
                  {isSubmitting ? 'Reatribuindo...' : 'Reatribuir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
