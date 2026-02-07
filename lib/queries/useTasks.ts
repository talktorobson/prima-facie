'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '@/components/providers'
import type { Task, TaskInsert, TaskUpdate } from '@/types/database'

interface TaskFilters {
  status?: string
  priority?: string
  assigned_to?: string
}

export function useTasks(lawFirmId: string | null | undefined, filters?: TaskFilters) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['tasks', lawFirmId, filters],
    queryFn: async () => {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          matter:matters(id, title),
          assigned_user:users!tasks_assigned_to_fkey(id, full_name)
        `)
        .eq('law_firm_id', lawFirmId!)
        .order('created_at', { ascending: false })

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority)
      }
      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to)
      }

      const { data, error } = await query
      if (error) throw error
      return data as Task[]
    },
    enabled: !!lawFirmId,
  })
}

export function useTask(id?: string) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['tasks', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          matter:matters(id, title),
          assigned_user:users!tasks_assigned_to_fkey(id, full_name)
        `)
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as Task
    },
    enabled: !!id,
  })
}

export function useCreateTask() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (task: TaskInsert) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert(task)
        .select()
        .single()
      if (error) throw error
      return data as Task
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useUpdateTask() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TaskUpdate }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Task
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['tasks', data.id] })
    },
  })
}

export function useDeleteTask() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useToggleTaskStatus() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Task['status'] }) => {
      const updates: TaskUpdate = { status }

      if (status === 'completed') {
        updates.completed_date = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Task
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
