'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

const adminSections = [
  { title: 'Escritório', href: '/admin/law-firm' },
  { title: 'Usuários', href: '/admin/users' },
  { title: 'Personalização', href: '/admin/branding' },
  { title: 'Configurações', href: '/admin/settings' },
  { title: 'Analíticos', href: '/admin/analytics' },
  { title: 'Segurança', href: '/admin/security' },
  { title: 'Faturamento', href: '/admin/billing' },
  { title: 'Notificações', href: '/admin/notifications' },
  { title: 'Tópicos de Chat', href: '/admin/chat-topics' },
  { title: 'Descontos', href: '/admin/discount-rules' },
  { title: 'Planos de Pagamento', href: '/admin/payment-plans' },
  { title: 'Planos de Assinatura', href: '/admin/subscription-plans' },
]

export function AdminSubNav() {
  const pathname = usePathname()

  return (
    <nav className="border-b border-gray-200 bg-white" aria-label="Admin sections">
      <div className="overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <div className="flex gap-1 px-4 py-2 min-w-max">
          {adminSections.map((section) => {
            const isActive = pathname === section.href || pathname?.startsWith(`${section.href}/`)

            return (
              <Link
                key={section.href}
                href={section.href}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                {section.title}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
