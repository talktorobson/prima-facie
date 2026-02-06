'use client'

import { AdminOnly } from '@/components/auth/role-guard'
import { ArrowLeftIcon, CogIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function SystemSettingsPage() {
  return (
    <AdminOnly>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link 
            href="/admin"
            className="flex items-center text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-1" />
            Voltar
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configurações do Sistema</h1>
            <p className="text-gray-600">Preferências gerais, notificações e integrações</p>
          </div>
        </div>

        {/* Coming Soon */}
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <CogIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Em Desenvolvimento</h3>
          <p className="text-gray-600 mb-6">
            As configurações do sistema serão implementadas nas próximas fases do projeto.
          </p>
          <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
            📋 Planejado para Fase 5+
          </div>
        </div>
      </div>
    </AdminOnly>
  )
}