'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '@/components/providers'
import { useAuthContext } from '@/lib/providers/auth-provider'

export function useMyAssignedMatters() {
  const supabase = useSupabase()
  const { profile } = useAuthContext()

  return useQuery({
    queryKey: ['portal', 'staff', 'my-matters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('matters')
        .select('id, title, matter_number, status, priority, next_court_date, matter_type:matter_types(name)')
        .eq('responsible_lawyer_id', profile!.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!profile?.id,
  })
}

export function useMyTasks() {
  const supabase = useSupabase()
  const { profile } = useAuthContext()

  return useQuery({
    queryKey: ['portal', 'staff', 'my-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, status, priority, due_date, matter_id, matters(id, title)')
        .eq('assigned_to', profile!.id)
        .in('status', ['pending', 'in_progress'])
        .order('due_date', { ascending: true })

      if (error) throw error
      return data || []
    },
    enabled: !!profile?.id,
  })
}

export function useMyTimeEntries(dateRange?: { start: string; end: string }) {
  const supabase = useSupabase()
  const { profile } = useAuthContext()

  return useQuery({
    queryKey: ['portal', 'staff', 'my-time-entries', dateRange],
    queryFn: async () => {
      let query = supabase
        .from('time_entries')
        .select('id, description, hours_worked, work_date, is_billable, matter_id, matters(id, title)')
        .eq('user_id', profile!.id)
        .order('work_date', { ascending: false })

      if (dateRange?.start) query = query.gte('work_date', dateRange.start)
      if (dateRange?.end) query = query.lte('work_date', dateRange.end)

      const { data, error } = await query
      if (error) throw error
      return data || []
    },
    enabled: !!profile?.id,
  })
}

export function useQuickLogTime() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()
  const { profile } = useAuthContext()

  return useMutation({
    mutationFn: async (entry: { matter_id: string; description: string; hours_worked: number; work_date?: string; is_billable?: boolean }) => {
      const { data, error } = await supabase
        .from('time_entries')
        .insert({
          ...entry,
          user_id: profile!.id,
          law_firm_id: profile!.law_firm_id,
          work_date: entry.work_date || new Date().toISOString().split('T')[0],
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'staff', 'my-time-entries'] })
      queryClient.invalidateQueries({ queryKey: ['time-entries'] })
    },
  })
}
