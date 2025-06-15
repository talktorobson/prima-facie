import { ReactNode } from 'react'
import Link from 'next/link'
import { 
  HomeIcon,
  DocumentTextIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  CurrencyDollarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'

interface ClientPortalLayoutProps {
  children: ReactNode
}

// Mock client data (in real app, this would come from auth context)
const mockClientUser = {
  id: '1',
  name: 'João Silva Santos',
  email: 'joao.silva@email.com',
  client_number: 'CLI-2024-001',
  avatar: null
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

const secondaryNavigation = [
  {
    name: 'Configurações',
    href: '/portal/client/settings',
    icon: Cog6ToothIcon
  },
  {
    name: 'Sair',
    href: '/login',
    icon: ArrowRightOnRectangleIcon
  }
]

export default function ClientPortalLayout({ children }: ClientPortalLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
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
                  {mockClientUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </span>
              </div>
            </div>
            <div className="ml-3 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {mockClientUser.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {mockClientUser.client_number}
              </p>
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
                {secondaryNavigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-700 hover:text-primary hover:bg-primary/5 transition-colors"
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {item.name}
                  </Link>
                ))}
              </div>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
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