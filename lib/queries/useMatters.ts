'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '@/components/providers'
import type { Matter, MatterInsert, MatterUpdate } from '@/types/database'

export function useMatters(lawFirmId?: string | null) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: ['matters', lawFirmId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matters')
        .select(`
          *,
          matter_type:matter_types(*),
          assigned_lawyer:users!matters_assigned_lawyer_id_fkey(id, full_name, email)
        `)
        .eq('law_firm_id', lawFirmId!)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Matter[]
    },
    enabled: !!lawFirmId,
  })
}

export function useMatter(id: string) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: ['matters', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matters')
        .select(`
          *,
          matter_type:matter_types(*),
          assigned_lawyer:users!matters_assigned_lawyer_id_fkey(*),
          contacts:matter_contacts(contact:contacts(*))
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Matter
    },
    enabled: !!id,
  })
}

export function useCreateMatter() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (matter: MatterInsert) => {
      const { data, error } = await supabase
        .from('matters')
        .insert(matter)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matters'] })
    },
  })
}

export function useUpdateMatter() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: MatterUpdate }) => {
      const { data, error } = await supabase
        .from('matters')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['matters'] })
      queryClient.invalidateQueries({ queryKey: ['matters', data.id] })
    },
  })
}

export function useDeleteMatter() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('matters')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matters'] })
    },
  })
}
