'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '@/components/providers'
import type { TimeEntry, TimeEntryInsert, TimeEntryUpdate } from '@/types/database'

interface TimeEntryFilters {
  matter_id?: string
  user_id?: string
  is_billable?: boolean
}

interface TimeEntryWithRelations extends TimeEntry {
  matters?: {
    id: string
    title: string
  }
  users?: {
    id: string
    full_name?: string
  }
}

export function useTimeEntries(lawFirmId: string | null | undefined, filters?: TimeEntryFilters) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: ['time-entries', lawFirmId, filters],
    queryFn: async () => {
      let query = supabase
        .from('time_entries')
        .select(`
          *,
          matters(id, title),
          users!time_entries_user_id_fkey(id, full_name)
        `)
        .eq('law_firm_id', lawFirmId!)
        .order('work_date', { ascending: false })

      if (filters?.matter_id) {
        query = query.eq('matter_id', filters.matter_id)
      }
      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id)
      }
      if (filters?.is_billable !== undefined) {
        query = query.eq('is_billable', filters.is_billable)
      }

      const { data, error } = await query

      if (error) throw error
      return data as TimeEntryWithRelations[]
    },
    enabled: !!lawFirmId,
  })
}

export function useCreateTimeEntry() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (timeEntry: TimeEntryInsert) => {
      const { data, error } = await supabase
        .from('time_entries')
        .insert(timeEntry)
        .select()
        .single()

      if (error) throw error
      return data as TimeEntry
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] })
    },
  })
}

export function useUpdateTimeEntry() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TimeEntryUpdate }) => {
      const { data, error } = await supabase
        .from('time_entries')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as TimeEntry
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] })
    },
  })
}

export function useDeleteTimeEntry() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('time_entries').delete().eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] })
    },
  })
}
