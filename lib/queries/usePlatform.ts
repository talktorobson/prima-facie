'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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

// =====================================================
// FIRM MUTATIONS
// =====================================================

interface CreateFirmData {
  name: string
  email: string
  legal_name?: string
  cnpj?: string
  oab_number?: string
  phone?: string
  plan_type?: string
}

export function useCreateFirm() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateFirmData) => {
      const res = await fetch('/api/platform/firms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao criar escritorio')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform'] })
    },
  })
}

export function useUpdateFirm() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, unknown> }) => {
      const res = await fetch(`/api/platform/firms/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao atualizar escritorio')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform'] })
    },
  })
}

// =====================================================
// USER MUTATIONS
// =====================================================

interface CreatePlatformUserData {
  email: string
  password: string
  first_name: string
  last_name: string
  user_type: string
  law_firm_id: string
  oab_number?: string
  position?: string
  phone?: string
}

export function useCreatePlatformUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreatePlatformUserData) => {
      const res = await fetch('/api/platform/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao criar usuario')
      }
      return res.json()
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['platform', 'firms', variables.law_firm_id, 'users'] })
    },
  })
}

export function useUpdatePlatformUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, unknown> }) => {
      const res = await fetch(`/api/platform/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao atualizar usuario')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform'] })
    },
  })
}

export function useDeactivatePlatformUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/platform/users/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao desativar usuario')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform'] })
    },
  })
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/platform/users/${id}/reset-password`, {
        method: 'POST',
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao resetar senha')
      }
      return res.json()
    },
  })
}
