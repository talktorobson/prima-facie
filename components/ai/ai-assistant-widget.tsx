'use client'

import { Bot } from 'lucide-react'
import { useAIAssistantStore } from '@/lib/stores/ai-assistant-store'
import { usePageContext } from '@/lib/ai/hooks/use-page-context'
import { useAuthContext } from '@/lib/providers/auth-provider'
import { AIChatPanel } from './ai-chat-panel'
import { cn } from '@/lib/utils/cn'

const ALLOWED_ROLES = ['super_admin', 'admin', 'lawyer', 'staff']

export function AIAssistantWidget() {
  const { isOpen, toggle } = useAIAssistantStore()
  const { profile } = useAuthContext()

  // Hook to track page context
  usePageContext()

  // Only show for allowed roles
  if (!profile || !ALLOWED_ROLES.includes(profile.user_type)) {
    return null
  }

  return (
    <>
      {/* Chat panel */}
      <div
        className={cn(
          'fixed bottom-20 right-4 z-50 w-[380px] h-[600px] max-h-[80vh]',
          'rounded-2xl shadow-2xl border border-gray-200 overflow-hidden',
          'transition-all duration-300 ease-out',
          isOpen
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
        )}
      >
        <AIChatPanel />
      </div>

      {/* FAB */}
      <button
        onClick={toggle}
        className={cn(
          'fixed bottom-4 right-4 z-50',
          'flex h-14 w-14 items-center justify-center',
          'rounded-full shadow-lg transition-all duration-200',
          'hover:scale-105 active:scale-95',
          isOpen
            ? 'bg-gray-700 text-white'
            : 'bg-primary text-white hover:bg-primary/90'
        )}
        title={isOpen ? 'Fechar EVA' : 'Abrir EVA'}
      >
        {isOpen ? (
          <span className="text-lg font-bold">×</span>
        ) : (
          <Bot className="h-6 w-6" />
        )}
      </button>
    </>
  )
}
