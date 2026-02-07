'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '@/components/providers'
import type { PipelineStage, PipelineCard, PipelineCardInsert, PipelineCardUpdate } from '@/types/database'

export function usePipelineStages() {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['pipeline-stages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pipeline_stages')
        .select('*')
        .order('sort_order', { ascending: true })
      if (error) throw error
      return data as PipelineStage[]
    },
  })
}

export function usePipelineCards(stageId?: string) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['pipeline-cards', stageId],
    queryFn: async () => {
      let query = supabase
        .from('pipeline_cards')
        .select(`
          *,
          contact:contacts(id, full_name, company_name),
          matter_type:matter_types(id, name),
          assigned_user:users!pipeline_cards_assigned_to_fkey(id, full_name)
        `)
        .order('created_at', { ascending: false })
      if (stageId) query = query.eq('pipeline_stage_id', stageId)
      const { data, error } = await query
      if (error) throw error
      return data as (PipelineCard & Record<string, unknown>)[]
    },
  })
}

export function useCreatePipelineCard() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (card: PipelineCardInsert) => {
      const { data, error } = await supabase
        .from('pipeline_cards')
        .insert(card)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-cards'] })
    },
  })
}

export function useUpdatePipelineCard() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: PipelineCardUpdate }) => {
      const { data, error } = await supabase
        .from('pipeline_cards')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-cards'] })
    },
  })
}

export function useDeletePipelineCard() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pipeline_cards').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-cards'] })
    },
  })
}

export function useMovePipelineCard() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, stageId }: { id: string; stageId: string }) => {
      const { data, error } = await supabase
        .from('pipeline_cards')
        .update({ pipeline_stage_id: stageId })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-cards'] })
    },
  })
}
