'use client'

import { useState, useRef, useEffect } from 'react'
import { useMyMessages } from '@/lib/queries/useClientPortal'
import { useSupabase } from '@/components/providers'
import { useAuthContext } from '@/lib/providers/auth-provider'
import { useToast } from '@/components/ui/toast-provider'
import { useQueryClient } from '@tanstack/react-query'
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
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
  const bottomRef = useRef<HTMLDivElement>(null)

  const messageList = (messages ?? []) as MessageRow[]

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

      const { error } = await supabase.from('messages').insert({
        content: trimmed,
        contact_id: contact.id,
        law_firm_id: contact.law_firm_id,
        sender_type: 'contact',
        message_type: 'text',
        status: 'sent',
      })

      if (error) throw error

      setNewMessage('')
      queryClient.invalidateQueries({ queryKey: ['portal', 'my-messages'] })
      toast.success('Mensagem enviada!')
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
              {[...messageList].reverse().map((msg) => {
                const isClient = msg.sender_type === 'contact'
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-lg px-4 py-3 ${
                        isClient
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isClient ? 'text-white/70' : 'text-gray-400'
                        }`}
                      >
                        {formatDateTime(msg.created_at)}
                        {msg.read_at && !isClient && ' - Lida'}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Send form */}
        <form
          onSubmit={handleSend}
          className="border-t border-gray-200 p-4 flex items-end gap-3"
        >
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            rows={2}
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-sm resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend(e)
              }
            }}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 disabled:opacity-50"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <PaperAirplaneIcon className="h-5 w-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
