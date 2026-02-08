'use client'

import { Sidebar } from '@/components/layout/sidebar'
import { MobileMenu } from '@/components/layout/mobile-menu'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { useAuthContext } from '@/lib/providers/auth-provider'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { FirmContextGuard } from '@/components/platform/firm-context-guard'
import { AIAssistantWidget } from '@/components/ai/ai-assistant-widget'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { loading } = useAuthContext()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <MobileMenu />

      <main className="lg:pl-64">
        <div className="hidden lg:block">
          <DashboardHeader />
        </div>
        <div className="px-4 sm:px-6 lg:px-8 py-8 lg:py-8 pt-20 lg:pt-8">
          <FirmContextGuard>
            {children}
          </FirmContextGuard>
        </div>
      </main>

      <AIAssistantWidget />
    </div>
  )
}
