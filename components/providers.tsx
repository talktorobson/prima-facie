'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createContext, useContext, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { AuthProvider } from '@/lib/providers/auth-provider'
import { ToastProvider } from '@/components/ui/toast-provider'
import ClientOnly from './client-only'

const SupabaseContext = createContext<SupabaseClient | undefined>(undefined)

export function useSupabase() {
  const context = useContext(SupabaseContext)
  if (!context) {
    throw new Error('useSupabase must be used within SupabaseProvider')
  }
  return context
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }))

  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  )

  return (
    <SupabaseContext.Provider value={supabase}>
      <QueryClientProvider client={queryClient}>
        <ClientOnly fallback={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        }>
          <AuthProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </AuthProvider>
        </ClientOnly>
      </QueryClientProvider>
    </SupabaseContext.Provider>
  )
}
