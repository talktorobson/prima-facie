'use client'

import { useMemo } from 'react'
import { XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { useEvaHistory, type EvaHistoryItem } from '@/lib/queries/useEvaHistory'
import { formatMessageTime } from '@/lib/supabase/realtime'

interface EvaHistoryPanelProps {
  conversationId: string
  onUseResponse: (content: string) => void
  onClose: () => void
}

function groupByDate(items: EvaHistoryItem[]): Map<string, EvaHistoryItem[]> {
  const groups = new Map<string, EvaHistoryItem[]>()
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const toLabel = (dateStr: string): string => {
    const date = new Date(dateStr)
    if (date.toDateString() === today.toDateString()) return 'Hoje'
    if (date.toDateString() === yesterday.toDateString()) return 'Ontem'
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  for (const item of items) {
    const label = toLabel(item.created_at)
    const group = groups.get(label)
    if (group) {
      group.push(item)
    } else {
      groups.set(label, [item])
    }
  }

  return groups
}

export default function EvaHistoryPanel({ conversationId, onUseResponse, onClose }: EvaHistoryPanelProps) {
  const { data: history = [], isLoading } = useEvaHistory(conversationId)
  const grouped = useMemo(() => groupByDate(history), [history])

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-white border-l border-gray-200 shadow-lg z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-5 w-5 text-primary" />
          <h3 className="font-medium text-gray-900">Historico da EVA</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 rounded"
          aria-label="Fechar painel"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8">
            <SparklesIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Nenhuma interacao com a EVA ainda</p>
          </div>
        ) : (
          Array.from(grouped.entries()).map(([label, items]) => (
            <div key={label} className="mb-4">
              <h4 className="text-xs font-medium text-gray-400 uppercase mb-2">{label}</h4>
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-gray-50 rounded-lg p-3 border border-gray-100"
                  >
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {item.content || 'Sem conteudo'}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">
                        {formatMessageTime(item.created_at)}
                      </span>
                      <button
                        onClick={() => item.content && onUseResponse(item.content)}
                        className="text-xs text-primary hover:text-primary/80 font-medium"
                      >
                        Usar esta resposta
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
