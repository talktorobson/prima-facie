// =====================================================
// Prima Facie - Dashboard Sidebar Component
// Navigation sidebar for dashboard
// =====================================================

'use client'

import { useAuthContext } from '@/lib/providers/auth-provider'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Scale,
  LayoutDashboardIcon,
  FolderIcon,
  UsersIcon,
  DollarSignIcon,
  CalendarIcon,
  CheckSquareIcon,
  FileTextIcon,
  BarChart3Icon,
  SettingsIcon,
  MessageSquareIcon,
  UserPlusIcon,
  ShieldIcon
} from 'lucide-react'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  roles?: string[]
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboardIcon,
  },
  {
    name: 'Casos',
    href: '/matters',
    icon: FolderIcon,
    roles: ['admin', 'lawyer', 'staff']
  },
  {
    name: 'Clientes',
    href: '/clients',
    icon: UsersIcon,
    roles: ['admin', 'lawyer', 'staff']
  },
  {
    name: 'Pipeline',
    href: '/pipeline',
    icon: UserPlusIcon,
    roles: ['admin', 'lawyer', 'staff']
  },
  {
    name: 'Financeiro',
    href: '/billing',
    icon: DollarSignIcon,
    roles: ['admin', 'lawyer']
  },
  {
    name: 'Calendário',
    href: '/calendar',
    icon: CalendarIcon,
  },
  {
    name: 'Tarefas',
    href: '/tasks',
    icon: CheckSquareIcon,
  },
  {
    name: 'Documentos',
    href: '/documents',
    icon: FileTextIcon,
  },
  {
    name: 'Chat',
    href: '/chat',
    icon: MessageSquareIcon,
  },
  {
    name: 'Relatórios',
    href: '/reports',
    icon: BarChart3Icon,
    roles: ['admin', 'lawyer']
  },
  {
    name: 'Configurações',
    href: '/settings',
    icon: SettingsIcon,
  },
  {
    name: 'Admin',
    href: '/admin',
    icon: ShieldIcon,
    roles: ['admin']
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const { profile } = useAuthContext()

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const canAccessItem = (item: NavItem) => {
    if (!item.roles) return true
    return profile?.user_type && item.roles.includes(profile.user_type)
  }

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center px-6 py-4 border-b border-gray-200">
        <Scale className="w-8 h-8 text-primary" />
        <div className="ml-3">
          <h1 className="text-xl font-bold text-gray-900">Prima Facie</h1>
          {profile?.law_firm && (
            <p className="text-xs text-gray-500 truncate">
              {profile.law_firm.name}
            </p>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => {
          if (!canAccessItem(item)) return null

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                isActive(item.href)
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 w-5 h-5',
                  isActive(item.href)
                    ? 'text-white'
                    : 'text-gray-400 group-hover:text-gray-500'
                )}
              />
              {item.name}
              {item.badge && (
                <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Law Firm Info */}
      {profile?.law_firm && (
        <div className="border-t border-gray-200 p-4">
          <div className="text-xs text-gray-500 space-y-1">
            <div>
              <span className="font-medium">Plano:</span>{' '}
              <span className="capitalize">{profile.law_firm.plan_type}</span>
            </div>
            {profile.law_firm.subscription_active && (
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span>Ativo</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}