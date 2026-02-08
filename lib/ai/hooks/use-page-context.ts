'use client'

import { useEffect } from 'react'
import { usePathname, useParams } from 'next/navigation'
import { useAIAssistantStore } from '@/lib/stores/ai-assistant-store'

const CONTEXT_MAP: Record<string, string> = {
  '/matters': 'matters',
  '/clients': 'clients',
  '/tasks': 'tasks',
  '/billing': 'billing',
  '/calendar': 'calendar',
  '/documents': 'documents',
  '/reports': 'reports',
  '/pipeline': 'pipeline',
  '/messages': 'messages',
  '/settings': 'settings',
  '/admin': 'admin',
  '/platform': 'platform',
  '/dashboard': 'dashboard',
}

const ENTITY_ROUTES: Record<string, string> = {
  '/matters/': 'matter',
  '/clients/': 'client',
  '/tasks/': 'task',
  '/billing/invoices/': 'invoice',
  '/pipeline/': 'pipeline_card',
}

export function usePageContext() {
  const pathname = usePathname()
  const params = useParams()
  const setPageContext = useAIAssistantStore((s) => s.setPageContext)

  useEffect(() => {
    if (!pathname) return

    // Check for entity-level routes first (e.g. /matters/[id])
    for (const [prefix, entityType] of Object.entries(ENTITY_ROUTES)) {
      if (pathname.startsWith(prefix)) {
        const id = params?.id as string | undefined
        if (id && id !== 'new') {
          setPageContext({ route: pathname, entityType, entityId: id })
          return
        }
      }
    }

    // Fall back to section-level routes
    for (const [prefix] of Object.entries(CONTEXT_MAP)) {
      if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
        setPageContext({ route: pathname })
        return
      }
    }

    setPageContext({ route: pathname })
  }, [pathname, params, setPageContext])
}
