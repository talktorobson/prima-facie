'use client'

import { create } from 'zustand'
import type { AIMessage } from '@/types/database'

interface PageContext {
  route: string
  entityId?: string
  entityType?: string
}

interface AIAssistantState {
  isOpen: boolean
  conversationId: string | null
  messages: AIMessage[]
  isLoading: boolean
  error: string | null
  pageContext: PageContext
  showHistory: boolean

  toggle: () => void
  open: () => void
  close: () => void
  setConversationId: (id: string | null) => void
  setMessages: (messages: AIMessage[]) => void
  addMessage: (message: AIMessage) => void
  setIsLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setPageContext: (ctx: PageContext) => void
  setShowHistory: (show: boolean) => void
  clearConversation: () => void
  sendMessage: (content: string) => Promise<void>
}

export const useAIAssistantStore = create<AIAssistantState>((set, get) => ({
  isOpen: false,
  conversationId: null,
  messages: [],
  isLoading: false,
  error: null,
  pageContext: { route: '/' },
  showHistory: false,

  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  setConversationId: (id) => set({ conversationId: id }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((s) => ({ messages: [...s.messages, message] })),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setPageContext: (ctx) => set({ pageContext: ctx }),
  setShowHistory: (show) => set({ showHistory: show }),

  clearConversation: () => set({
    conversationId: null,
    messages: [],
    error: null,
  }),

  sendMessage: async (content: string) => {
    const state = get()
    if (state.isLoading || !content.trim()) return

    set({ isLoading: true, error: null })

    // Add user message optimistically
    const userMessage: AIMessage = {
      id: crypto.randomUUID(),
      conversation_id: state.conversationId || '',
      law_firm_id: null,
      role: 'user',
      content,
      tokens_input: 0,
      tokens_output: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    set((s) => ({ messages: [...s.messages, userMessage] }))

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          conversationId: state.conversationId,
          pageContext: state.pageContext,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao enviar mensagem')
      }

      const data = await res.json()

      // Update conversation ID if new
      if (!state.conversationId && data.conversationId) {
        set({ conversationId: data.conversationId })
      }

      // Add assistant response
      const assistantMessage: AIMessage = {
        id: data.message?.id || crypto.randomUUID(),
        conversation_id: data.conversationId || state.conversationId || '',
        law_firm_id: null,
        role: 'assistant',
        content: data.message?.content || '',
        tool_calls: data.message?.toolCalls,
        tool_results: data.message?.toolResults,
        tokens_input: data.message?.tokensInput || 0,
        tokens_output: data.message?.tokensOutput || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      set((s) => ({ messages: [...s.messages, assistantMessage] }))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro inesperado'
      set({ error: errorMessage })
    } finally {
      set({ isLoading: false })
    }
  },
}))
