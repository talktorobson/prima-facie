'use client'

import { useEffect, useRef } from 'react'
import { AIMessageBubble } from './ai-message-bubble'
import { AITypingIndicator } from './ai-typing-indicator'
import type { AIMessage } from '@/types/database'

interface AIMessageListProps {
  messages: AIMessage[]
  isLoading: boolean
  onFeedback?: (messageId: string, rating: 'positive' | 'negative') => void
}

export function AIMessageList({ messages, isLoading, onFeedback }: AIMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <div>
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-primary">EVA</span>
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">Olá! Sou a EVA</h3>
          <p className="text-xs text-gray-500 max-w-[240px]">
            Sua assistente de IA para gestão jurídica. Como posso ajudar?
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto py-3">
      {messages.map((msg) => (
        <AIMessageBubble
          key={msg.id}
          message={msg}
          onFeedback={onFeedback}
        />
      ))}
      {isLoading && <AITypingIndicator />}
      <div ref={bottomRef} />
    </div>
  )
}
