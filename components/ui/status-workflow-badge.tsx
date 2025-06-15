import React from 'react'

export interface StatusWorkflowInfo {
  label: string
  color: 'blue' | 'yellow' | 'green' | 'gray' | 'orange' | 'purple' | 'emerald' | 'slate' | 'red'
  next: string[]
  description: string
}

export interface StatusWorkflowBadgeProps {
  status: string
  statusInfo?: StatusWorkflowInfo
  className?: string
}

const colorClasses = {
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

const defaultStatusInfo: Record<string, StatusWorkflowInfo> = {
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

export const StatusWorkflowBadge: React.FC<StatusWorkflowBadgeProps> = ({
  status,
  statusInfo,
  className = ''
}) => {
  const info = statusInfo || defaultStatusInfo[status]
  const colorClass = info ? colorClasses[info.color] : colorClasses.gray

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass} ${className}`}
      title={info?.description}
    >
      {info?.label || status}
    </span>
  )
}

export default StatusWorkflowBadge