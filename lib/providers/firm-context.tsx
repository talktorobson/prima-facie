'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/lib/providers/auth-provider'
import { usePlatformFirmDetail } from '@/lib/queries/usePlatform'
import type { LawFirm } from '@/types/database'

interface FirmContextType {
  selectedFirmId: string | null
  selectedFirm: LawFirm | null
  selectFirm: (id: string, firm?: LawFirm) => void
  clearFirm: () => void
}

const FirmContext = createContext<FirmContextType | undefined>(undefined)

const STORAGE_KEY = 'prima_facie_selected_firm_id'

export function FirmContextProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuthContext()
  const router = useRouter()
  const isSuperAdmin = profile?.user_type === 'super_admin'

  const [selectedFirmId, setSelectedFirmId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    if (!isSuperAdmin) return null
    return localStorage.getItem(STORAGE_KEY)
  })

  const [selectedFirm, setSelectedFirm] = useState<LawFirm | null>(null)

  // Lazy-fetch firm details when restoring from localStorage
  const { data: fetchedFirm } = usePlatformFirmDetail(
    isSuperAdmin && selectedFirmId && !selectedFirm ? selectedFirmId : ''
  )

  useEffect(() => {
    if (fetchedFirm && !selectedFirm) {
      setSelectedFirm(fetchedFirm)
    }
  }, [fetchedFirm, selectedFirm])

  // Re-read localStorage when profile changes (e.g., on login)
  useEffect(() => {
    if (isSuperAdmin && typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored && stored !== selectedFirmId) {
        setSelectedFirmId(stored)
        setSelectedFirm(null)
      }
    } else {
      setSelectedFirmId(null)
      setSelectedFirm(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin])

  const selectFirm = useCallback((id: string, firm?: LawFirm) => {
    setSelectedFirmId(id)
    setSelectedFirm(firm ?? null)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, id)
    }
  }, [])

  const clearFirm = useCallback(() => {
    setSelectedFirmId(null)
    setSelectedFirm(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
    router.push('/platform')
  }, [router])

  return (
    <FirmContext.Provider value={{ selectedFirmId, selectedFirm, selectFirm, clearFirm }}>
      {children}
    </FirmContext.Provider>
  )
}

export function useFirmContext() {
  const context = useContext(FirmContext)
  if (context === undefined) {
    throw new Error('useFirmContext must be used within a FirmContextProvider')
  }
  return context
}
