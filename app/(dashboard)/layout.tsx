import { Sidebar } from '@/components/layout/sidebar'
import { MobileMenu } from '@/components/layout/mobile-menu'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <MobileMenu />

      <main className="lg:pl-64">
        <div className="px-4 sm:px-6 lg:px-8 py-8 lg:py-8 pt-20 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  )
}