'use client'

import { AdminOnly } from '@/components/auth/role-guard'
import { useAuthContext } from '@/lib/providers/auth-provider'
import { useEffectiveLawFirmId } from '@/lib/hooks/use-effective-law-firm-id'
import { useUsers, useActivityLogs } from '@/lib/queries/useAdmin'
import { useLawFirm } from '@/lib/queries/useSettings'
import { useMatters } from '@/lib/queries/useMatters'
import Link from 'next/link'
import {
  BuildingOfficeIcon,
  UsersIcon,
  SwatchIcon,
  CogIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  BellIcon,
} from '@heroicons/react/24/outline'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function AdminPage() {
  const { profile } = useAuthContext()
  const effectiveLawFirmId = useEffectiveLawFirmId()
  const { data: users } = useUsers(effectiveLawFirmId)
  const { data: lawFirm } = useLawFirm(effectiveLawFirmId ?? undefined)
  const { data: matters } = useMatters(effectiveLawFirmId)
  const { data: activityLogs } = useActivityLogs(effectiveLawFirmId)

  const activeUsers = users?.filter(u => u.status === 'active').length ?? 0
  const activeMatters = matters?.filter(m => m.status === 'active').length ?? 0
  const recentLogs = (activityLogs ?? []).slice(0, 5)

  const adminSections = [
    { title: 'Configuracoes do Escritorio', description: 'Gerenciar informacoes basicas, endereco e contatos', icon: BuildingOfficeIcon, href: '/admin/law-firm', color: 'bg-blue-50 text-blue-600 border-blue-200' },
    { title: 'Gestao de Usuarios', description: 'Adicionar, editar e gerenciar usuarios do sistema', icon: UsersIcon, href: '/admin/users', color: 'bg-green-50 text-green-600 border-green-200' },
    { title: 'Personalizacao', description: 'Logo, cores, temas e identidade visual', icon: SwatchIcon, href: '/admin/branding', color: 'bg-purple-50 text-purple-600 border-purple-200' },
    { title: 'Configuracoes do Sistema', description: 'Preferencias gerais, notificacoes e integracoes', icon: CogIcon, href: '/admin/settings', color: 'bg-gray-50 text-gray-600 border-gray-200' },
    { title: 'Analiticos', description: 'Estatisticas de uso e relatorios administrativos', icon: ChartBarIcon, href: '/admin/analytics', color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
    { title: 'Seguranca', description: 'Logs de acesso, auditoria e permissoes', icon: ShieldCheckIcon, href: '/admin/security', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    { title: 'Faturamento', description: 'Plano de assinatura e historico de pagamentos', icon: CreditCardIcon, href: '/admin/billing', color: 'bg-amber-50 text-amber-600 border-amber-200' },
    { title: 'Notificacoes', description: 'Configurar alertas e comunicacoes automatizadas', icon: BellIcon, href: '/admin/notifications', color: 'bg-rose-50 text-rose-600 border-rose-200' },
  ]

  return (
    <AdminOnly>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-gray-200 pb-6">
          <h1 className="text-3xl font-bold text-gray-900">Painel Administrativo</h1>
          <p className="mt-2 text-gray-600">
            Gerencie todas as configuracoes do escritorio{lawFirm?.name ? ` ${lawFirm.name}` : ''}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <UsersIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Usuarios Ativos</p>
                <p className="text-2xl font-semibold text-gray-900">{activeUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Casos Ativos</p>
                <p className="text-2xl font-semibold text-gray-900">{activeMatters}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <CreditCardIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Plano Atual</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">
                  {lawFirm?.plan_type || 'Professional'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-8 w-8 text-emerald-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Status</p>
                <p className="text-lg font-semibold text-emerald-600">
                  {lawFirm?.subscription_active !== false ? 'Ativo' : 'Inativo'}
                </p>
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
            {recentLogs.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhuma atividade recente registrada.</p>
            ) : (
              <div className="space-y-4">
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full" />
                    <p className="text-sm text-gray-600 flex-1">
                      {log.description || `${log.action} em ${log.entity_type}`}
                    </p>
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminOnly>
  )
}
