'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import {
  Scale,
  LayoutDashboard,
  Briefcase,
  Users,
  DollarSign,
  Calendar,
  FileText,
  CheckSquare,
  BarChart3,
  Settings,
  LogOut,
  Globe,
  Kanban,
  MessageSquare
} from 'lucide-react'
import { useAuthContext } from '@/lib/providers/auth-provider'
import { useEffectiveLawFirmId } from '@/lib/hooks/use-effective-law-firm-id'
import { useNewProspectsCount } from '@/lib/queries/usePipeline'
import { FirmSelector } from '@/components/platform/firm-selector'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  roles?: string[]
}

const navigation: NavItem[] = [
  { name: 'Plataforma', href: '/platform', icon: Globe, roles: ['super_admin'] },
  { name: 'Visão Geral', href: '/admin', icon: LayoutDashboard },
  { name: 'Processos', href: '/matters', icon: Briefcase },
  { name: 'Clientes', href: '/clients', icon: Users },
  { name: 'Faturamento', href: '/billing', icon: DollarSign },
  { name: 'Calendário', href: '/calendar', icon: Calendar },
  { name: 'Documentos', href: '/documents', icon: FileText },
  { name: 'Tarefas', href: '/tasks', icon: CheckSquare },
  { name: 'Relatórios', href: '/reports', icon: BarChart3 },
  { name: 'Pipeline', href: '/pipeline', icon: Kanban },
  { name: 'Mensagens', href: '/messages', icon: MessageSquare },
  { name: 'Configurações', href: '/settings', icon: Settings },
]

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Administrador',
  lawyer: 'Advogado',
  staff: 'Equipe',
  client: 'Cliente',
}

export function Sidebar() {
  const pathname = usePathname()
  const { profile, signOut } = useAuthContext()
  const router = useRouter()
  const effectiveLawFirmId = useEffectiveLawFirmId()
  const { data: prospectCount } = useNewProspectsCount(effectiveLawFirmId)

  const handleSignOut = async () => {
    await signOut()
    router.refresh()
  }

  const userType = profile?.user_type || ''
  const filteredNavigation = navigation
    .filter(item => !item.roles || item.roles.includes(userType))
    .map(item =>
      item.href === '/pipeline' && prospectCount && prospectCount > 0
        ? { ...item, badge: prospectCount }
        : item
    )

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
      <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 px-6 border-b border-gray-200">
          <Scale className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold text-gray-900">Prima Facie</span>
        </div>

        {/* Firm Selector (super_admin only) */}
        <FirmSelector />

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {filteredNavigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="flex-1">{item.name}</span>
                {item.badge && (
                  <span className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                    isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                  )}>
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User Profile & Sign Out */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {profile?.first_name?.charAt(0).toUpperCase() || profile?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {profile?.full_name || profile?.email}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {roleLabels[profile?.user_type || ''] || 'Usuário'}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </div>
  )
}
