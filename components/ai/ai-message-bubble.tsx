'use client'

import { cn } from '@/lib/utils/cn'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { AIToolCard } from './ai-tool-card'
import type { AIMessage } from '@/types/database'
import { useState } from 'react'

const SOURCE_LABELS: Record<string, string> = {
  chat_ghost: 'via Chat',
  client_portal: 'via Portal do Cliente',
  proactive: 'Notificacao Automatica',
}

interface AIMessageBubbleProps {
  message: AIMessage
  onFeedback?: (messageId: string, rating: 'positive' | 'negative') => void
}

export function AIMessageBubble({ message, onFeedback }: AIMessageBubbleProps) {
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null)
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'

  const handleFeedback = (rating: 'positive' | 'negative') => {
    setFeedback(rating)
    onFeedback?.(message.id, rating)
  }

  const sourceLabel = message.source_type && message.source_type !== 'widget'
    ? SOURCE_LABELS[message.source_type]
    : null

  return (
    <div className={cn('flex gap-3 px-4 py-2', isUser ? 'justify-end' : 'justify-start')}>
      {/* Avatar for assistant */}
      {isAssistant && (
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-xs font-bold text-primary">EVA</span>
        </div>
      )}

      <div className={cn('max-w-[85%] space-y-2')}>
        {/* Source label for non-widget messages */}
        {sourceLabel && (
          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">
            {sourceLabel}
          </span>
        )}

        {/* Message content */}
        {message.content && (
          <div
            className={cn(
              'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
              isUser
                ? 'bg-primary text-white rounded-tr-sm'
                : 'bg-gray-100 text-gray-900 rounded-tl-sm'
            )}
          >
            {/* Simple markdown-ish rendering */}
            {message.content.split('\n').map((line, i) => (
              <p key={i} className={cn(i > 0 && 'mt-1.5')}>
                {renderInlineMarkdown(line)}
              </p>
            ))}
          </div>
        )}

        {/* Tool results */}
        {message.tool_results?.map((result, i) => (
          <AIToolCard key={i} toolResult={result as Record<string, unknown>} />
        ))}

        {/* Feedback buttons for assistant messages */}
        {isAssistant && onFeedback && (
          <div className="flex items-center gap-1 ml-1">
            <button
              onClick={() => handleFeedback('positive')}
              className={cn(
                'p-1 rounded hover:bg-gray-100 transition-colors',
                feedback === 'positive' ? 'text-green-600' : 'text-gray-400'
              )}
              title="Resposta útil"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => handleFeedback('negative')}
              className={cn(
                'p-1 rounded hover:bg-gray-100 transition-colors',
                feedback === 'negative' ? 'text-red-500' : 'text-gray-400'
              )}
              title="Resposta não útil"
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Avatar for user */}
      {isUser && (
        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-xs font-medium text-gray-600">Eu</span>
        </div>
      )}
    </div>
  )
}

function renderInlineMarkdown(text: string): React.ReactNode {
  // Bold: **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    return part
  })
}
