'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuthContext } from '@/lib/providers/auth-provider'
import { useFirmContext } from '@/lib/providers/firm-context'
import { Building2 } from 'lucide-react'

interface FirmContextGuardProps {
  children: React.ReactNode
}

export function FirmContextGuard({ children }: FirmContextGuardProps) {
  const { profile } = useAuthContext()
  const { selectedFirmId } = useFirmContext()
  const pathname = usePathname()

  // Skip guard for non-super-admins (they have their own law_firm_id)
  if (profile?.user_type !== 'super_admin') return <>{children}</>

  // Skip guard for platform pages (they don't need a firm context)
  if (pathname?.startsWith('/platform')) return <>{children}</>

  // Super admin without selected firm → prompt to select one
  if (!selectedFirmId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="p-4 rounded-full bg-amber-50 mb-4">
          <Building2 className="h-12 w-12 text-amber-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Selecione um Escritório
        </h2>
        <p className="text-gray-500 max-w-md mb-6">
          Para acessar as funcionalidades do painel, selecione um escritório no menu lateral
          ou acesse a página da plataforma.
        </p>
        <Link
          href="/platform"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90"
        >
          Ir para Plataforma
        </Link>
      </div>
    )
  }

  return <>{children}</>
}
