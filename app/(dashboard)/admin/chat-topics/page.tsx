'use client'

import { AdminOnly } from '@/components/auth/role-guard'
import { ArrowLeftIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function ChatTopicsPage() {
  return (
    <AdminOnly>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/admin" className="flex items-center text-gray-500 hover:text-gray-700">
            <ArrowLeftIcon className="h-5 w-5 mr-1" />
            Voltar
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Topicos de Conversa</h1>
            <p className="text-gray-600">Gerencie os topicos para organizar as conversas com clientes</p>
          </div>
        </div>

        {/* Coming Soon */}
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <ChatBubbleLeftRightIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Em breve</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            A funcionalidade de topicos de conversa esta sendo desenvolvida e estara disponivel em breve.
            Com ela, voce podera organizar e categorizar as conversas com seus clientes de forma mais eficiente.
          </p>
        </div>
      </div>
    </AdminOnly>
  )
}
