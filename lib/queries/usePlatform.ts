'use client'

import { useQuery } from '@tanstack/react-query'
import { useSupabase } from '@/components/providers'
import type { PlatformLawFirmStats, LawFirm, User } from '@/types/database'

export function usePlatformFirms() {
  const supabase = useSupabase()

  return useQuery({
    queryKey: ['platform', 'firms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_law_firm_stats')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as PlatformLawFirmStats[]
    },
  })
}

export function usePlatformFirmDetail(id: string) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: ['platform', 'firms', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('law_firms')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as LawFirm
    },
    enabled: !!id,
  })
}

export function usePlatformFirmUsers(firmId: string) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: ['platform', 'firms', firmId, 'users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('law_firm_id', firmId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as User[]
    },
    enabled: !!firmId,
  })
}

export function usePlatformStats() {
  const supabase = useSupabase()

  return useQuery({
    queryKey: ['platform', 'stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_law_firm_stats')
        .select('*')

      if (error) throw error

      const firms = data as PlatformLawFirmStats[]
      return {
        totalFirms: firms.length,
        totalUsers: firms.reduce((sum, f) => sum + f.user_count, 0),
        totalMatters: firms.reduce((sum, f) => sum + f.matter_count, 0),
        totalRevenue: firms.reduce((sum, f) => sum + f.total_revenue, 0),
      }
    },
  })
}
