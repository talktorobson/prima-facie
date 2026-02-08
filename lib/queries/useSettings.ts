'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '@/components/providers'
import { useAuthContext } from '@/lib/providers/auth-provider'
import type { LawFirm, MatterType, LawFirmUpdate, MatterTypeInsert, MatterTypeUpdate, User } from '@/types/database'

export function useLawFirm(lawFirmId?: string) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: ['settings', 'law-firm'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('law_firms')
        .select('*')
        .eq('id', lawFirmId!)
        .single()

      if (error) throw error
      return data as LawFirm
    },
    enabled: !!lawFirmId,
  })
}

export function useUpdateLawFirm() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: LawFirmUpdate }) => {
      const { data, error } = await supabase
        .from('law_firms')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as LawFirm
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'law-firm'] })
    },
  })
}

export function useMatterTypes() {
  const supabase = useSupabase()

  return useQuery({
    queryKey: ['settings', 'matter-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matter_types')
        .select('*')
        .order('sort_order', { ascending: true })

      if (error) throw error
      return data as MatterType[]
    },
  })
}

export function useCreateMatterType() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (matterType: MatterTypeInsert) => {
      const { data, error } = await supabase
        .from('matter_types')
        .insert(matterType)
        .select()
        .single()

      if (error) throw error
      return data as MatterType
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'matter-types'] })
    },
  })
}

export function useUpdateMatterType() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: MatterTypeUpdate }) => {
      const { data, error } = await supabase
        .from('matter_types')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as MatterType
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'matter-types'] })
    },
  })
}

export function useDeleteMatterType() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('matter_types')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'matter-types'] })
    },
  })
}

export function useUserPreferences() {
  const supabase = useSupabase()
  const { profile } = useAuthContext()

  return useQuery({
    queryKey: ['settings', 'user-preferences', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('permissions')
        .eq('id', profile!.id)
        .single()

      if (error) throw error
      return (data?.permissions ?? {}) as Record<string, unknown>
    },
    enabled: !!profile?.id,
  })
}

export function useUpdateUserPreferences() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()
  const { profile } = useAuthContext()

  return useMutation({
    mutationFn: async (preferences: Record<string, unknown>) => {
      // Merge with existing permissions
      const { data: current } = await supabase
        .from('users')
        .select('permissions')
        .eq('id', profile!.id)
        .single()

      const merged = { ...(current?.permissions as Record<string, unknown> ?? {}), ...preferences }

      const { data, error } = await supabase
        .from('users')
        .update({ permissions: merged })
        .eq('id', profile!.id)
        .select()
        .single()

      if (error) throw error
      return data as User
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'user-preferences'] })
    },
  })
}

export function useFirmFeatures(lawFirmId?: string) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: ['settings', 'firm-features', lawFirmId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('law_firms')
        .select('features')
        .eq('id', lawFirmId!)
        .single()

      if (error) throw error
      return (data?.features ?? {}) as Record<string, unknown>
    },
    enabled: !!lawFirmId,
  })
}

export function useUpdateFirmFeatures() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, features }: { id: string; features: Record<string, unknown> }) => {
      // Merge with existing features
      const { data: current } = await supabase
        .from('law_firms')
        .select('features')
        .eq('id', id)
        .single()

      const merged = { ...(current?.features as Record<string, unknown> ?? {}), ...features }

      const { data, error } = await supabase
        .from('law_firms')
        .update({ features: merged })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as LawFirm
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'firm-features'] })
      queryClient.invalidateQueries({ queryKey: ['settings', 'law-firm'] })
    },
  })
}
