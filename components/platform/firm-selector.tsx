'use client'

import { useAuthContext } from '@/lib/providers/auth-provider'
import { useFirmContext } from '@/lib/providers/firm-context'
import { usePlatformFirms } from '@/lib/queries/usePlatform'
import { Building2, LogOut, Shield } from 'lucide-react'

export function FirmSelector() {
  const { profile } = useAuthContext()
  const { selectedFirmId, selectedFirm, selectFirm, clearFirm } = useFirmContext()
  const { data: firms } = usePlatformFirms()

  if (profile?.user_type !== 'super_admin') return null

  // Active firm banner
  if (selectedFirmId) {
    return (
      <div className="mx-3 mb-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="h-4 w-4 text-amber-600 flex-shrink-0" />
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
            Modo Suporte
          </span>
        </div>
        <p className="text-sm font-medium text-amber-900 truncate">
          {selectedFirm?.name ?? 'Carregando...'}
        </p>
        <button
          onClick={clearFirm}
          className="mt-2 flex items-center gap-1.5 text-xs font-medium text-amber-700 hover:text-amber-900 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sair do escritório
        </button>
      </div>
    )
  }

  // Firm picker dropdown
  return (
    <div className="mx-3 mb-2">
      <label className="block text-xs font-medium text-gray-500 mb-1">
        Selecionar Escritório
      </label>
      <select
        className="w-full text-sm border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
        value=""
        onChange={(e) => {
          const firmId = e.target.value
          if (!firmId) return
          const firm = firms?.find((f) => f.id === firmId)
          selectFirm(firmId, firm ? { ...firm } as any : undefined)
        }}
      >
        <option value="">-- Escolha --</option>
        {firms?.map((firm) => (
          <option key={firm.id} value={firm.id}>
            {firm.name}
          </option>
        ))}
      </select>
    </div>
  )
}
