'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '@/components/providers'
import type { User, UserInsert, UserUpdate, ActivityLog, PipelineStage, PipelineStageInsert, PipelineStageUpdate } from '@/types/database'

interface UsersFilters {
  user_type?: string
  status?: string
}

interface ActivityLogsFilters {
  entity_type?: string
  user_id?: string
}

export function useUsers(filters?: UsersFilters) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: ['admin', 'users', filters],
    queryFn: async () => {
      let query = supabase
        .from('users')
        .select('*')
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
  })
}

export function useCreateUser() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (user: UserInsert) => {
      const { data, error } = await supabase
        .from('users')
        .insert(user)
        .select()
        .single()

      if (error) throw error
      return data as User
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}

export function useUpdateUser() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UserUpdate }) => {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as User
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}

export function useDeactivateUser() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('users')
        .update({ status: 'inactive' })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as User
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}

export function useActivityLogs(filters?: ActivityLogsFilters) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: ['admin', 'activity-logs', filters],
    queryFn: async () => {
      let query = supabase
        .from('activity_logs')
        .select('*, users!activity_logs_user_id_fkey(id, full_name)')
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
