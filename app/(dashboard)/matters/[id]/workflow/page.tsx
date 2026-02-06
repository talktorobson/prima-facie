'use client'

import { useState, useEffect } from 'react'
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

// Mock matter data
const mockMatter = {
  id: '1',
  matter_number: '2024/001',
  title: 'Ação Trabalhista - Rescisão Indevida',
  status: 'ativo',
  priority: 'alta',
  client_name: 'João Silva Santos',
  responsible_lawyer: 'Maria Silva Santos'
}

// Status workflow definition
const statusWorkflow = {
  novo: {
    label: 'Novo',
    color: 'blue',
    next: ['analise', 'cancelado'],
    description: 'Processo recém-criado, aguardando análise inicial'
  },
  analise: {
    label: 'Em Análise',
    color: 'yellow',
    next: ['ativo', 'aguardando_documentos', 'cancelado'],
    description: 'Processo em análise técnica e jurídica'
  },
  ativo: {
    label: 'Ativo',
    color: 'green',
    next: ['suspenso', 'aguardando_cliente', 'finalizado'],
    description: 'Processo em andamento normal'
  },
  suspenso: {
    label: 'Suspenso',
    color: 'gray',
    next: ['ativo', 'arquivado'],
    description: 'Processo temporariamente suspenso'
  },
  aguardando_cliente: {
    label: 'Aguardando Cliente',
    color: 'orange',
    next: ['ativo', 'suspenso', 'cancelado'],
    description: 'Aguardando resposta ou ação do cliente'
  },
  aguardando_documentos: {
    label: 'Aguardando Documentos',
    color: 'purple',
    next: ['analise', 'ativo', 'cancelado'],
    description: 'Aguardando documentação necessária'
  },
  finalizado: {
    label: 'Finalizado',
    color: 'emerald',
    next: ['arquivado'],
    description: 'Processo concluído com sucesso'
  },
  arquivado: {
    label: 'Arquivado',
    color: 'slate',
    next: [],
    description: 'Processo arquivado, sem ações pendentes'
  },
  cancelado: {
    label: 'Cancelado',
    color: 'red',
    next: ['arquivado'],
    description: 'Processo cancelado antes da conclusão'
  }
}

// Mock workflow history
const mockWorkflowHistory = [
  {
    id: '1',
    from_status: null,
    to_status: 'novo',
    changed_by: 'Sistema',
    changed_at: '2024-01-15T10:00:00',
    reason: 'Processo criado no sistema',
    notes: null
  },
  {
    id: '2',
    from_status: 'novo',
    to_status: 'analise',
    changed_by: 'Maria Silva Santos',
    changed_at: '2024-01-15T14:30:00',
    reason: 'Documentação inicial recebida',
    notes: 'Cliente forneceu contrato de trabalho e últimos holerites'
  },
  {
    id: '3',
    from_status: 'analise',
    to_status: 'ativo',
    changed_by: 'Maria Silva Santos',
    changed_at: '2024-01-16T09:15:00',
    reason: 'Análise concluída, processo viável',
    notes: 'Petição inicial preparada e protocolada'
  }
]

// Mock team members for assignment
const mockTeamMembers = [
  { id: '1', name: 'Maria Silva Santos', role: 'Advogada Sênior', oab: 'OAB/SP 123456' },
  { id: '2', name: 'João Santos Oliveira', role: 'Advogado Pleno', oab: 'OAB/SP 654321' },
  { id: '3', name: 'Carlos Mendes Lima', role: 'Advogado Júnior', oab: 'OAB/SP 789012' },
  { id: '4', name: 'Ana Paula Costa', role: 'Paralegal', oab: null }
]

export default function MatterWorkflowPage() {
  const params = useParams()
  const router = useRouter()
  const [matter, setMatter] = useState(mockMatter)
  const [workflowHistory, setWorkflowHistory] = useState(mockWorkflowHistory)
  const [currentStatus, setCurrentStatus] = useState(mockMatter.status)
  const [showStatusChange, setShowStatusChange] = useState(false)
  const [showAssignment, setShowAssignment] = useState(false)
  const [selectedNewStatus, setSelectedNewStatus] = useState('')
  const [statusChangeReason, setStatusChangeReason] = useState('')
  const [statusChangeNotes, setStatusChangeNotes] = useState('')
  const [selectedTeamMember, setSelectedTeamMember] = useState('')
  const [assignmentReason, setAssignmentReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const getCurrentStatusInfo = () => statusWorkflow[currentStatus as keyof typeof statusWorkflow]
  
  const getStatusColor = (status: string) => {
    const info = statusWorkflow[status as keyof typeof statusWorkflow]
    return info?.color || 'gray'
  }

  const getStatusBadge = (status: string) => {
    const info = statusWorkflow[status as keyof typeof statusWorkflow]
    const colorMap = {
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
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorMap[info?.color as keyof typeof colorMap] || colorMap.gray}`}>
        {info?.label || status}
      </span>
    )
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const handleStatusChange = async () => {
    if (!selectedNewStatus || !statusChangeReason.trim()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Add to history
      const newHistoryEntry = {
        id: (workflowHistory.length + 1).toString(),
        from_status: currentStatus,
        to_status: selectedNewStatus,
        changed_by: 'Usuário Atual', // In real app, get from auth
        changed_at: new Date().toISOString(),
        reason: statusChangeReason,
        notes: statusChangeNotes || null
      }

      setWorkflowHistory(prev => [...prev, newHistoryEntry])
      setCurrentStatus(selectedNewStatus)
      setMatter(prev => ({ ...prev, status: selectedNewStatus }))

      // Reset form
      setShowStatusChange(false)
      setSelectedNewStatus('')
      setStatusChangeReason('')
      setStatusChangeNotes('')

      console.log('Status changed:', { from: currentStatus, to: selectedNewStatus, reason: statusChangeReason })

    } catch (error) {
      console.error('Error changing status:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAssignment = async () => {
    if (!selectedTeamMember || !assignmentReason.trim()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      const member = mockTeamMembers.find(m => m.id === selectedTeamMember)
      
      // Update matter assignment
      setMatter(prev => ({ ...prev, responsible_lawyer: member?.name || prev.responsible_lawyer }))

      // Add to history as assignment change
      const newHistoryEntry = {
        id: (workflowHistory.length + 1).toString(),
        from_status: currentStatus,
        to_status: currentStatus,
        changed_by: 'Usuário Atual',
        changed_at: new Date().toISOString(),
        reason: `Processo reatribuído para ${member?.name}`,
        notes: assignmentReason
      }

      setWorkflowHistory(prev => [...prev, newHistoryEntry])

      // Reset form
      setShowAssignment(false)
      setSelectedTeamMember('')
      setAssignmentReason('')

      console.log('Assignment changed:', { to: member?.name, reason: assignmentReason })

    } catch (error) {
      console.error('Error changing assignment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href={`/matters/${params.id}`}
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
            <dd className="mt-1 text-sm text-gray-900">{matter.responsible_lawyer}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Cliente</dt>
            <dd className="mt-1 text-sm text-gray-900">{matter.client_name}</dd>
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
          {getCurrentStatusInfo()?.next.map((nextStatus) => {
            const statusInfo = statusWorkflow[nextStatus as keyof typeof statusWorkflow]
            return (
              <div key={nextStatus} className="flex items-center space-x-2">
                <ArrowRightIcon className="h-4 w-4 text-gray-400" />
                {getStatusBadge(nextStatus)}
              </div>
            )
          })}
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
                      <span className={`bg-white h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white border-2 border-${getStatusColor(entry.to_status)}-500`}>
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
      </div>

      {/* Status Change Modal */}
      {showStatusChange && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
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
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
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
                  <div className="mt-1 text-sm text-gray-900">{matter.responsible_lawyer}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Novo Responsável *</label>
                  <select
                    value={selectedTeamMember}
                    onChange={(e) => setSelectedTeamMember(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  >
                    <option value="">Selecione um membro da equipe</option>
                    {mockTeamMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} - {member.role} {member.oab && `(${member.oab})`}
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