'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '@/components/providers'
import type { LawFirm, MatterType, LawFirmUpdate, MatterTypeInsert, MatterTypeUpdate } from '@/types/database'

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
