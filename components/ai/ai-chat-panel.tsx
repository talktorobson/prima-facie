'use client'

import { X, MessageSquarePlus } from 'lucide-react'
import { useAIAssistantStore } from '@/lib/stores/ai-assistant-store'
import { AIMessageList } from './ai-message-list'
import { AIInputBar } from './ai-input-bar'
import { AISuggestionChips } from './ai-suggestion-chips'

export function AIChatPanel() {
  const {
    messages,
    isLoading,
    error,
    pageContext,
    close,
    sendMessage,
    clearConversation,
  } = useAIAssistantStore()

  const handleFeedback = async (messageId: string, rating: 'positive' | 'negative') => {
    try {
      await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, rating }),
      })
    } catch {
      // Silently fail — feedback is non-critical
    }
  }

  const handleSuggestion = (text: string) => {
    sendMessage(text)
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">EVA</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">EVA</h3>
            <p className="text-[10px] text-gray-500">Assistente de IA</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearConversation}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            title="Nova conversa"
          >
            <MessageSquarePlus className="h-4 w-4" />
          </button>
          <button
            onClick={close}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            title="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Suggestion chips (shown when empty) */}
      {messages.length === 0 && (
        <AISuggestionChips
          route={pageContext.route}
          onSelect={handleSuggestion}
          disabled={isLoading}
        />
      )}

      {/* Messages */}
      <AIMessageList
        messages={messages}
        isLoading={isLoading}
        onFeedback={handleFeedback}
      />

      {/* Error bar */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* Input */}
      <AIInputBar onSend={sendMessage} disabled={isLoading} />
    </div>
  )
}
