'use client'

import { usePathname } from 'next/navigation'
import { AdminSubNav } from '@/components/layout/admin-sub-nav'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isAdminRoot = pathname === '/admin'

  return (
    <div>
      {!isAdminRoot && <AdminSubNav />}
      {children}
    </div>
  )
}
