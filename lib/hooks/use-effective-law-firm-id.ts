'use client'

import { useAuthContext } from '@/lib/providers/auth-provider'
import { useFirmContext } from '@/lib/providers/firm-context'

export function useEffectiveLawFirmId(): string | null {
  const { profile } = useAuthContext()
  const { selectedFirmId } = useFirmContext()

  if (!profile) return null
  return profile.user_type === 'super_admin' ? selectedFirmId : profile.law_firm_id
}
