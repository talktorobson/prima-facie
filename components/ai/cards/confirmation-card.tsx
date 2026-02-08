'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface ConfirmationCardProps {
  action: string
  data: Record<string, unknown>
  displayMessage: string
  entityId?: string
  toolExecutionId?: string
}

export function ConfirmationCard({
  action,
  data,
  displayMessage,
  entityId,
  toolExecutionId,
}: ConfirmationCardProps) {
  const [status, setStatus] = useState<'pending' | 'confirming' | 'confirmed' | 'rejected'>('pending')
  const [resultMessage, setResultMessage] = useState<string>('')

  const handleConfirm = async () => {
    setStatus('confirming')
    try {
      const res = await fetch('/api/ai/tools/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolExecutionId,
          approved: true,
          action,
          entityId,
          data,
        }),
      })
      const result = await res.json()
      if (res.ok) {
        setStatus('confirmed')
        setResultMessage(result.message || 'Ação executada com sucesso')
      } else {
        setStatus('pending')
        setResultMessage(result.error || 'Erro ao executar ação')
      }
    } catch {
      setStatus('pending')
      setResultMessage('Erro de conexão')
    }
  }

  const handleReject = async () => {
    setStatus('rejected')
    if (toolExecutionId) {
      await fetch('/api/ai/tools/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolExecutionId, approved: false }),
      }).catch(() => {})
    }
  }

  if (status === 'confirmed') {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-xs">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
          <p className="text-green-700">{resultMessage}</p>
        </div>
      </div>
    )
  }

  if (status === 'rejected') {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs">
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <p className="text-gray-500">Ação cancelada</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs">
      <p className="text-amber-800 mb-2.5">
        {renderInlineMarkdown(displayMessage)}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={handleConfirm}
          disabled={status === 'confirming'}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
            'bg-primary text-white hover:bg-primary/90 disabled:opacity-50'
          )}
        >
          {status === 'confirming' ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <CheckCircle className="h-3 w-3" />
          )}
          Confirmar
        </button>
        <button
          onClick={handleReject}
          disabled={status === 'confirming'}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <XCircle className="h-3 w-3" />
          Cancelar
        </button>
      </div>
    </div>
  )
}

function renderInlineMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    return part
  })
}
