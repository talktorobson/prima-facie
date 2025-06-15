'use client'

import { 
  CheckIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { CheckCheckIcon } from '@heroicons/react/24/solid'

interface MessageStatusIndicatorProps {
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
  whatsappStatus?: string
  isWhatsApp?: boolean
  showTooltip?: boolean
  size?: 'sm' | 'md'
}

const getStatusInfo = (
  status: MessageStatusIndicatorProps['status'],
  whatsappStatus?: string,
  isWhatsApp?: boolean
) => {
  if (isWhatsApp && whatsappStatus) {
    switch (whatsappStatus) {
      case 'sent':
        return {
          icon: CheckIcon,
          color: 'text-gray-400',
          tooltip: 'Mensagem enviada'
        }
      case 'delivered':
        return {
          icon: CheckCheckIcon,
          color: 'text-gray-400',
          tooltip: 'Mensagem entregue'
        }
      case 'read':
        return {
          icon: CheckCheckIcon,
          color: 'text-blue-500',
          tooltip: 'Mensagem lida'
        }
      case 'failed':
        return {
          icon: ExclamationTriangleIcon,
          color: 'text-red-500',
          tooltip: 'Falha no envio'
        }
      default:
        return {
          icon: ClockIcon,
          color: 'text-gray-300',
          tooltip: 'Enviando...'
        }
    }
  }

  // Regular message status
  switch (status) {
    case 'sending':
      return {
        icon: ClockIcon,
        color: 'text-gray-300',
        tooltip: 'Enviando mensagem...'
      }
    case 'sent':
      return {
        icon: CheckIcon,
        color: 'text-gray-400',
        tooltip: 'Mensagem enviada'
      }
    case 'delivered':
      return {
        icon: CheckCheckIcon,
        color: 'text-gray-400',
        tooltip: 'Mensagem entregue'
      }
    case 'read':
      return {
        icon: CheckCheckIcon,
        color: 'text-blue-500',
        tooltip: 'Mensagem lida'
      }
    case 'failed':
      return {
        icon: ExclamationTriangleIcon,
        color: 'text-red-500',
        tooltip: 'Falha no envio - clique para tentar novamente'
      }
    default:
      return {
        icon: ClockIcon,
        color: 'text-gray-300',
        tooltip: 'Status desconhecido'
      }
  }
}

export default function MessageStatusIndicator({
  status,
  whatsappStatus,
  isWhatsApp = false,
  showTooltip = true,
  size = 'sm'
}: MessageStatusIndicatorProps) {
  const statusInfo = getStatusInfo(status, whatsappStatus, isWhatsApp)
  const IconComponent = statusInfo.icon
  
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'

  const indicator = (
    <div className="flex items-center justify-end">
      <IconComponent className={`${iconSize} ${statusInfo.color}`} />
      {isWhatsApp && (
        <span className="ml-1 text-xs text-gray-500">📱</span>
      )}
    </div>
  )

  if (showTooltip) {
    return (
      <div className="relative group">
        {indicator}
        <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
          {statusInfo.tooltip}
          <div className="absolute top-full right-2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-800"></div>
        </div>
      </div>
    )
  }

  return indicator
}

// Utility component for bulk message status
export function BulkMessageStatus({ 
  totalMessages, 
  readCount, 
  deliveredCount, 
  sentCount,
  failedCount = 0
}: {
  totalMessages: number
  readCount: number
  deliveredCount: number
  sentCount: number
  failedCount?: number
}) {
  const pendingCount = totalMessages - readCount - deliveredCount - sentCount - failedCount

  return (
    <div className="flex items-center space-x-4 text-xs text-gray-500">
      {failedCount > 0 && (
        <div className="flex items-center space-x-1 text-red-500">
          <ExclamationTriangleIcon className="h-3 w-3" />
          <span>{failedCount} falharam</span>
        </div>
      )}
      
      {readCount > 0 && (
        <div className="flex items-center space-x-1 text-blue-500">
          <CheckCheckIcon className="h-3 w-3" />
          <span>{readCount} lidas</span>
        </div>
      )}
      
      {deliveredCount > 0 && (
        <div className="flex items-center space-x-1">
          <CheckCheckIcon className="h-3 w-3" />
          <span>{deliveredCount} entregues</span>
        </div>
      )}
      
      {sentCount > 0 && (
        <div className="flex items-center space-x-1">
          <CheckIcon className="h-3 w-3" />
          <span>{sentCount} enviadas</span>
        </div>
      )}
      
      {pendingCount > 0 && (
        <div className="flex items-center space-x-1">
          <ClockIcon className="h-3 w-3" />
          <span>{pendingCount} pendentes</span>
        </div>
      )}
    </div>
  )
}

// Hook for real-time status updates
export function useMessageStatus(messageId: string) {
  // In a real implementation, this would subscribe to real-time updates
  // For now, we'll return mock data
  return {
    status: 'delivered' as const,
    whatsappStatus: 'delivered',
    isWhatsApp: false,
    updatedAt: new Date().toISOString()
  }
}