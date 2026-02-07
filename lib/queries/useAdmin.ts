'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '@/components/providers'
import type { User, UserUpdate, ActivityLog, PipelineStage, PipelineStageInsert, PipelineStageUpdate } from '@/types/database'

interface UsersFilters {
  user_type?: string
  status?: string
}

interface ActivityLogsFilters {
  entity_type?: string
  user_id?: string
}

export function useUsers(lawFirmId: string | null | undefined, filters?: UsersFilters) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: ['admin', 'users', lawFirmId, filters],
    queryFn: async () => {
      let query = supabase
        .from('users')
        .select('*')
        .eq('law_firm_id', lawFirmId!)
        .order('created_at', { ascending: false })

      if (filters?.user_type) {
        query = query.eq('user_type', filters.user_type)
      }

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      const { data, error } = await query

      if (error) throw error
      return data as User[]
    },
    enabled: !!lawFirmId,
  })
}

interface CreateUserPayload {
  email: string
  password: string
  first_name: string
  last_name: string
  user_type: string
  oab_number?: string | null
  position?: string | null
  phone?: string | null
  law_firm_id?: string | null
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateUserPayload) => {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao criar usuario')
      return json.data as User
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UserUpdate }) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao atualizar usuario')
      return json.data as User
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}

export function useDeactivateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao desativar usuario')
      return json.data as User
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}

export function useActivityLogs(lawFirmId: string | null | undefined, filters?: ActivityLogsFilters) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: ['admin', 'activity-logs', lawFirmId, filters],
    queryFn: async () => {
      let query = supabase
        .from('activity_logs')
        .select('*, users!activity_logs_user_id_fkey(id, full_name)')
        .eq('law_firm_id', lawFirmId!)
        .order('created_at', { ascending: false })
        .limit(100)

      if (filters?.entity_type) {
        query = query.eq('entity_type', filters.entity_type)
      }

      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id)
      }

      const { data, error } = await query

      if (error) throw error
      return data as ActivityLog[]
    },
    enabled: !!lawFirmId,
  })
}

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

export function useCreatePipelineStage() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (stage: PipelineStageInsert) => {
      const { data, error } = await supabase
        .from('pipeline_stages')
        .insert(stage)
        .select()
        .single()

      if (error) throw error
      return data as PipelineStage
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] })
    },
  })
}

export function useUpdatePipelineStage() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: PipelineStageUpdate }) => {
      const { data, error } = await supabase
        .from('pipeline_stages')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as PipelineStage
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] })
    },
  })
}

export function useDeletePipelineStage() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('pipeline_stages')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] })
    },
  })
}
