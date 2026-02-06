'use client'

import { AdminOnly } from '@/components/auth/role-guard'
import { useAuthContext } from '@/lib/providers/auth-provider'
import Link from 'next/link'
import { 
  BuildingOfficeIcon,
  UsersIcon,
  SwatchIcon,
  CogIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  BellIcon
} from '@heroicons/react/24/outline'

export default function AdminPage() {
  const { profile } = useAuthContext()

  const adminSections = [
    {
      title: 'Configurações do Escritório',
      description: 'Gerenciar informações básicas, endereço e contatos',
      icon: BuildingOfficeIcon,
      href: '/admin/law-firm',
      color: 'bg-blue-50 text-blue-600 border-blue-200'
    },
    {
      title: 'Gestão de Usuários',
      description: 'Adicionar, editar e gerenciar usuários do sistema',
      icon: UsersIcon,
      href: '/admin/users',
      color: 'bg-green-50 text-green-600 border-green-200'
    },
    {
      title: 'Personalização',
      description: 'Logo, cores, temas e identidade visual',
      icon: SwatchIcon,
      href: '/admin/branding',
      color: 'bg-purple-50 text-purple-600 border-purple-200'
    },
    {
      title: 'Configurações do Sistema',
      description: 'Preferências gerais, notificações e integrações',
      icon: CogIcon,
      href: '/admin/settings',
      color: 'bg-gray-50 text-gray-600 border-gray-200'
    },
    {
      title: 'Relatórios e Analytics',
      description: 'Estatísticas de uso e relatórios administrativos',
      icon: ChartBarIcon,
      href: '/admin/analytics',
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200'
    },
    {
      title: 'Segurança',
      description: 'Logs de acesso, permissões e auditoria',
      icon: ShieldCheckIcon,
      href: '/admin/security',
      color: 'bg-red-50 text-red-600 border-red-200'
    },
    {
      title: 'Planos e Cobrança',
      description: 'Gerenciar plano atual e histórico de pagamentos',
      icon: CreditCardIcon,
      href: '/admin/billing',
      color: 'bg-yellow-50 text-yellow-600 border-yellow-200'
    },
    {
      title: 'Notificações',
      description: 'Configurar alertas e comunicações automáticas',
      icon: BellIcon,
      href: '/admin/notifications',
      color: 'bg-orange-50 text-orange-600 border-orange-200'
    }
  ]

  return (
    <AdminOnly>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-gray-200 pb-6">
          <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
          <p className="mt-2 text-gray-600">
            Gerencie todas as configurações do escritório {profile?.law_firm?.name}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <UsersIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Usuários Ativos</p>
                <p className="text-2xl font-semibold text-gray-900">--</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Casos Ativos</p>
                <p className="text-2xl font-semibold text-gray-900">--</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <CreditCardIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Plano Atual</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">
                  {profile?.law_firm?.plan_type || 'Professional'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-8 w-8 text-emerald-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Status</p>
                <p className="text-lg font-semibold text-emerald-600">Ativo</p>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminSections.map((section) => {
            const Icon = section.icon
            return (
              <Link
                key={section.href}
                href={section.href}
                className="group relative bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 hover:border-gray-300"
              >
                <div className="flex items-start">
                  <div className={`flex-shrink-0 p-3 rounded-lg border-2 ${section.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary">
                      {section.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-600">
                      {section.description}
                    </p>
                  </div>
                </div>
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </Link>
            )
          })}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Atividade Recente</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-green-400 rounded-full"></div>
                <p className="text-sm text-gray-600">
                  Sistema de autenticação configurado com sucesso
                </p>
                <span className="text-xs text-gray-400">Agora</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full"></div>
                <p className="text-sm text-gray-600">
                  Database configurado e pronto para uso
                </p>
                <span className="text-xs text-gray-400">2 min atrás</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-purple-400 rounded-full"></div>
                <p className="text-sm text-gray-600">
                  Painel administrativo criado
                </p>
                <span className="text-xs text-gray-400">5 min atrás</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminOnly>
  )
}