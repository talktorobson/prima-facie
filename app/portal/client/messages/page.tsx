'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useMyMessages } from '@/lib/queries/useClientPortal'
import { useSupabase } from '@/components/providers'
import { useAuthContext } from '@/lib/providers/auth-provider'
import { useToast } from '@/components/ui/toast-provider'
import { useQueryClient } from '@tanstack/react-query'
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface MessageRow {
  id: string
  content: string
  message_type: string | null
  sender_type: string | null
  status: string | null
  created_at: string
  read_at: string | null
}

export default function ClientMessagesPage() {
  const { data: messages, isLoading } = useMyMessages()
  const { profile } = useAuthContext()
  const supabase = useSupabase()
  const toast = useToast()
  const queryClient = useQueryClient()

  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [isEvaMode, setIsEvaMode] = useState(false)
  const [isEvaProcessing, setIsEvaProcessing] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const messageList = (messages ?? []) as MessageRow[]
  const reversedMessages = useMemo(() => [...messageList].reverse(), [messageList])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messageList.length])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newMessage.trim()
    if (!trimmed || !profile?.id) return

    setSending(true)
    try {
      // Get client's contact record
      const { data: contact } = await supabase
        .from('contacts')
        .select('id, law_firm_id')
        .eq('user_id', profile.id)
        .single()

      if (!contact) {
        toast.error('Perfil de contato nao encontrado.')
        return
      }

      // Always save the client's question as a regular message
      const { error: msgError } = await supabase.from('messages').insert({
        content: trimmed,
        contact_id: contact.id,
        law_firm_id: contact.law_firm_id,
        sender_type: 'contact',
        message_type: 'text',
        status: 'sent',
      })

      if (msgError) throw msgError

      setNewMessage('')
      queryClient.invalidateQueries({ queryKey: ['portal', 'my-messages'] })

      if (isEvaMode) {
        // EVA Q&A flow — server inserts the response message via admin client
        setIsEvaProcessing(true)
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 30_000)
        try {
          const response = await fetch('/api/ai/client-qa', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: trimmed }),
            signal: controller.signal,
          })

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}))
            throw new Error(errData.error || 'Erro ao processar')
          }

          // Server already inserted the response into messages table
          queryClient.invalidateQueries({ queryKey: ['portal', 'my-messages'] })
        } catch (err) {
          const msg = err instanceof Error
            ? (err.name === 'AbortError' ? 'Tempo limite excedido' : err.message)
            : 'Erro desconhecido'
          toast.error(`EVA nao conseguiu processar: ${msg}`)
        } finally {
          clearTimeout(timeout)
          setIsEvaProcessing(false)
          setIsEvaMode(false)
        }
      } else {
        toast.success('Mensagem enviada!')
      }
    } catch {
      toast.error('Erro ao enviar mensagem. Tente novamente.')
    } finally {
      setSending(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-gray-600">Carregando mensagens...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mensagens</h1>
        <p className="mt-1 text-gray-600">
          Comunique-se com seu advogado responsavel.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg flex flex-col" style={{ height: '600px' }}>
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messageList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma mensagem
              </h3>
              <p className="text-sm text-gray-500 max-w-sm">
                Envie uma mensagem abaixo para iniciar a conversa com seu advogado.
              </p>
            </div>
          ) : (
            <>
              {reversedMessages.map((msg) => {
                const isClientMsg = msg.sender_type === 'contact'
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isClientMsg ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-lg px-4 py-3 ${
                        isClientMsg
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isClientMsg ? 'text-white/70' : 'text-gray-400'
                        }`}
                      >
                        {formatDateTime(msg.created_at)}
                        {msg.read_at && !isClientMsg && ' - Lida'}
                      </p>
                    </div>
                  </div>
                )
              })}

              {/* EVA processing indicator */}
              {isEvaProcessing && (
                <div className="flex justify-start">
                  <div className="max-w-[75%] rounded-lg px-4 py-3 bg-primary/5 border border-primary/20">
                    <div className="flex items-center space-x-2">
                      <SparklesIcon className="h-4 w-4 text-primary animate-pulse" />
                      <p className="text-sm text-primary font-medium">EVA esta buscando informacoes...</p>
                    </div>
                    <div className="flex space-x-1 mt-2">
                      <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Send form */}
        <form
          onSubmit={handleSend}
          className="border-t border-gray-200 p-4 flex items-end gap-3"
        >
          <button
            type="button"
            onClick={() => setIsEvaMode(!isEvaMode)}
            disabled={sending || isEvaProcessing}
            className={`flex-shrink-0 p-2 rounded-md transition-colors ${
              isEvaMode
                ? 'bg-primary text-white'
                : 'text-gray-400 hover:text-primary hover:bg-primary/10'
            } disabled:opacity-50`}
            title={isEvaMode ? 'Modo EVA ativo - clique para desativar' : 'Perguntar a EVA'}
            aria-label={isEvaMode ? 'Desativar modo EVA' : 'Ativar modo EVA'}
          >
            <SparklesIcon className="h-5 w-5" />
          </button>

          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={isEvaMode ? 'Pergunte a EVA sobre seus processos...' : 'Digite sua mensagem...'}
            rows={2}
            disabled={isEvaProcessing}
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-sm resize-none disabled:opacity-50 disabled:bg-gray-50"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend(e)
              }
            }}
          />
          <button
            type="submit"
            disabled={sending || isEvaProcessing || !newMessage.trim()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 disabled:opacity-50"
            aria-label="Enviar mensagem"
          >
            {sending || isEvaProcessing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <PaperAirplaneIcon className="h-5 w-5" />
            )}
          </button>
        </form>

        {/* EVA mode indicator */}
        {isEvaMode && !isEvaProcessing && (
          <div className="px-4 pb-3 -mt-1">
            <p className="text-xs text-primary flex items-center gap-1">
              <SparklesIcon className="h-3 w-3" />
              Modo EVA ativo — sua proxima mensagem sera respondida pela assistente de IA.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
