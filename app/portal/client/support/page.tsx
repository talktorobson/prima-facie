'use client'

import Link from 'next/link'
import { useAuthContext } from '@/lib/providers/auth-provider'
import { useSupabase } from '@/components/providers'
import { useQuery } from '@tanstack/react-query'
import {
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline'

const faqs = [
  {
    question: 'Como acompanho meu processo?',
    answer: 'Acesse "Meus Processos" no menu lateral para ver o status atualizado de todos os seus casos. Clique em um processo para ver detalhes e movimentacoes.',
  },
  {
    question: 'Como envio documentos ao meu advogado?',
    answer: 'Dentro da pagina de detalhes do processo, utilize a area de upload de documentos para enviar arquivos diretamente ao seu advogado.',
  },
  {
    question: 'Como faco para pagar uma fatura?',
    answer: 'Acesse a secao "Financeiro" no menu lateral. La voce encontra todas as suas faturas pendentes e pode realizar o pagamento.',
  },
  {
    question: 'Como altero meus dados cadastrais?',
    answer: 'Va em "Configuracoes" no menu lateral para atualizar seus dados pessoais, telefone e preferencias de notificacao.',
  },
]

export default function ClientSupportPage() {
  const { profile } = useAuthContext()
  const supabase = useSupabase()

  const lawFirmId = (profile as unknown as Record<string, string>)?.law_firm_id
  const { data: lawFirm } = useQuery({
    queryKey: ['law-firm-support', lawFirmId],
    queryFn: async () => {
      if (!lawFirmId) return null
      const { data } = await supabase
        .from('law_firms')
        .select('name, email, phone, address_street, address_city, address_state')
        .eq('id', lawFirmId)
        .single()
      return data
    },
    enabled: !!lawFirmId,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Suporte</h1>
        <p className="mt-1 text-sm text-gray-600">
          Entre em contato com seu escritorio ou consulte as perguntas frequentes
        </p>
      </div>

      {/* Law Firm Contact */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Contato do Escritorio
        </h2>
        {lawFirm ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-900">{lawFirm.name}</p>
            {lawFirm.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <PhoneIcon className="h-4 w-4 text-gray-400" />
                <span>{lawFirm.phone}</span>
              </div>
            )}
            {lawFirm.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                <a href={`mailto:${lawFirm.email}`} className="text-primary hover:underline">
                  {lawFirm.email}
                </a>
              </div>
            )}
            {(lawFirm.address_street || lawFirm.address_city) && (
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <MapPinIcon className="h-4 w-4 text-gray-400 mt-0.5" />
                <span>
                  {[lawFirm.address_street, lawFirm.address_city, lawFirm.address_state]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Informacoes de contato nao disponiveis.</p>
        )}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Link
            href="/portal/client/messages"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 text-sm font-medium"
          >
            <ChatBubbleLeftRightIcon className="h-4 w-4" />
            Enviar Mensagem
          </Link>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <QuestionMarkCircleIcon className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Perguntas Frequentes</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {faqs.map((faq, index) => (
            <div key={index} className="py-4 first:pt-0 last:pb-0">
              <h3 className="text-sm font-medium text-gray-900">{faq.question}</h3>
              <p className="mt-1 text-sm text-gray-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
