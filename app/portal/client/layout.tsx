'use client'

import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HomeIcon,
  DocumentTextIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { useAuthContext } from '@/lib/providers/auth-provider'

interface ClientPortalLayoutProps {
  children: ReactNode
}

const navigation = [
  {
    name: 'Início',
    href: '/portal/client/dashboard',
    icon: HomeIcon,
    description: 'Visão geral dos seus processos'
  },
  {
    name: 'Meus Processos',
    href: '/portal/client/matters',
    icon: DocumentTextIcon,
    description: 'Acompanhe seus casos jurídicos'
  },
  {
    name: 'Meu Perfil',
    href: '/portal/client/profile',
    icon: UserIcon,
    description: 'Dados pessoais e preferências'
  },
  {
    name: 'Comunicação',
    href: '/portal/client/messages',
    icon: ChatBubbleLeftRightIcon,
    description: 'Mensagens e atualizações'
  },
  {
    name: 'Financeiro',
    href: '/portal/client/billing',
    icon: CurrencyDollarIcon,
    description: 'Faturas e pagamentos'
  }
]

interface NavContentProps {
  onNavigate?: () => void
  displayName: string
  clientNumber: string
  onSignOut: () => void
}

function NavContent({ onNavigate, displayName, clientNumber, onSignOut }: NavContentProps) {
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <>
      {/* Logo and Client Info */}
      <div className="flex h-16 shrink-0 items-center border-b border-gray-200 px-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">PF</span>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">Prima Facie</p>
            <p className="text-xs text-gray-500">Portal do Cliente</p>
          </div>
        </div>
      </div>

      {/* Client Information */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {initials || 'CL'}
              </span>
            </div>
          </div>
          <div className="ml-3 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {displayName}
            </p>
            {clientNumber && (
              <p className="text-xs text-gray-500 truncate">
                {clientNumber}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col px-3 py-4">
        <ul role="list" className="flex flex-1 flex-col gap-y-1">
          {navigation.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                onClick={onNavigate}
                className="group flex gap-x-3 rounded-md p-3 text-sm leading-6 font-semibold text-gray-700 hover:text-primary hover:bg-primary/5 transition-colors"
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <div className="flex flex-col">
                  <span>{item.name}</span>
                  <span className="text-xs text-gray-500 font-normal">
                    {item.description}
                  </span>
                </div>
              </Link>
            </li>
          ))}

          {/* Separator */}
          <li className="mt-auto">
            <div className="border-t border-gray-200 pt-4">
              <Link
                href="/portal/client/settings"
                onClick={onNavigate}
                className="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700 hover:text-primary hover:bg-primary/5 transition-colors"
              >
                <Cog6ToothIcon className="h-5 w-5 shrink-0" />
                Configurações
              </Link>
              <button
                type="button"
                onClick={() => {
                  onNavigate?.()
                  onSignOut()
                }}
                className="w-full group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700 hover:text-primary hover:bg-primary/5 transition-colors"
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

export default function ClientPortalLayout({ children }: ClientPortalLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { profile, signOut } = useAuthContext()
  const pathname = usePathname()

  const currentSection = navigation.find(
    item => pathname === item.href || pathname?.startsWith(`${item.href}/`)
  )

  const displayName = profile?.full_name ?? 'Cliente'
  // client_number is not on User type but may exist on the DB row for client users
  const clientNumber = ((profile as unknown as Record<string, unknown>)?.client_number as string) ?? ''

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:flex lg:w-64 lg:flex-col bg-white shadow-lg">
        <NavContent displayName={displayName} clientNumber={clientNumber} onSignOut={signOut} />
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
          {currentSection && (
            <>
              <span className="text-gray-300 text-sm ml-2">/</span>
              <span className="text-sm text-gray-600 truncate ml-1">{currentSection.name}</span>
            </>
          )}
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
            <NavContent onNavigate={() => setMobileMenuOpen(false)} displayName={displayName} clientNumber={clientNumber} onSignOut={signOut} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 hidden lg:flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>

            {/* Right side - Client actions */}
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              {/* Notifications */}
              <button
                type="button"
                className="relative rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <span className="sr-only">Ver notificações</span>
                <ChatBubbleLeftRightIcon className="h-6 w-6" />
                {/* Notification dot */}
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
              </button>

              {/* Support */}
              <Link
                href="/portal/client/support"
                className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Suporte
              </Link>
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
