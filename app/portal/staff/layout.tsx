'use client'

import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { useAuthContext } from '@/lib/providers/auth-provider'

interface StaffPortalLayoutProps {
  children: ReactNode
}

const roleLabels: Record<string, string> = {
  lawyer: 'Advogado(a)',
  staff: 'Colaborador(a)',
  admin: 'Administrador(a)',
  super_admin: 'Super Admin',
}

const navigation = [
  {
    name: 'Inicio',
    href: '/portal/staff',
    icon: HomeIcon,
    exact: true,
  },
  {
    name: 'Minhas Tarefas',
    href: '/portal/staff/tasks',
    icon: ClipboardDocumentListIcon,
    exact: false,
  },
  {
    name: 'Registro de Horas',
    href: '/portal/staff/time-entry',
    icon: ClockIcon,
    exact: false,
  },
  {
    name: 'Mensagens',
    href: '/portal/staff/messages',
    icon: ChatBubbleLeftRightIcon,
    exact: false,
  },
]

interface NavContentProps {
  onNavigate?: () => void
  displayName: string
  roleLabel: string
  initials: string
  pathname: string
  onSignOut: () => void
}

function NavContent({ onNavigate, displayName, roleLabel, initials, pathname, onSignOut }: NavContentProps) {
  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Logo and Portal Info */}
      <div className="flex h-16 shrink-0 items-center border-b border-gray-200 px-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">PF</span>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">Prima Facie</p>
            <p className="text-xs text-gray-500">Portal do Colaborador</p>
          </div>
        </div>
      </div>

      {/* Staff Information */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {initials || 'CO'}
              </span>
            </div>
          </div>
          <div className="ml-3 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {displayName}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {roleLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col px-3 py-4">
        <ul role="list" className="flex flex-1 flex-col gap-y-1">
          {navigation.map((item) => {
            const active = isActive(item.href, item.exact)
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={`group flex gap-x-3 rounded-md p-3 text-sm leading-6 font-semibold transition-colors ${
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-700 hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              </li>
            )
          })}

          {/* Separator and Sign Out */}
          <li className="mt-auto">
            <div className="border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={() => {
                  onNavigate?.()
                  onSignOut()
                }}
                className="w-full group flex gap-x-3 rounded-md p-3 text-sm leading-6 font-semibold text-gray-700 hover:text-primary hover:bg-primary/5 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 shrink-0" />
                Sair
              </button>
            </div>
          </li>
        </ul>
      </nav>
    </>
  )
}

export default function StaffPortalLayout({ children }: StaffPortalLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { profile, signOut } = useAuthContext()

  const displayName = profile?.full_name ?? 'Colaborador'
  const roleLabel = roleLabels[profile?.user_type ?? ''] ?? 'Colaborador(a)'
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:flex lg:w-64 lg:flex-col bg-white shadow-lg">
        <NavContent
          displayName={displayName}
          roleLabel={roleLabel}
          initials={initials}
          pathname={pathname}
          onSignOut={signOut}
        />
      </div>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center h-16 border-b border-gray-200 bg-white px-4 shadow-sm lg:hidden">
        <button
          type="button"
          className="-m-2.5 p-2.5 text-gray-700"
          onClick={() => setMobileMenuOpen(true)}
        >
          <span className="sr-only">Abrir menu</span>
          <Bars3Icon className="h-6 w-6" />
        </button>
        <div className="ml-4 flex items-center">
          <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-white">PF</span>
          </div>
          <span className="ml-2 text-sm font-medium text-gray-900">Prima Facie</span>
        </div>
      </div>

      {/* Mobile slide-out drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
            <div className="absolute right-2 top-2">
              <button
                type="button"
                className="p-2 text-gray-500 hover:text-gray-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">Fechar menu</span>
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <NavContent
              onNavigate={() => setMobileMenuOpen(false)}
              displayName={displayName}
              roleLabel={roleLabel}
              initials={initials}
              pathname={pathname}
              onSignOut={signOut}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Desktop top bar */}
        <div className="sticky top-0 z-40 hidden lg:flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-white">{initials}</span>
                </div>
                <span className="ml-2 text-sm text-gray-700">{displayName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
