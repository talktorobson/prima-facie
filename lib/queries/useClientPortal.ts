'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '@/components/providers'
import { useAuthContext } from '@/lib/providers/auth-provider'

export function useMyMatters() {
  const supabase = useSupabase()
  const { profile } = useAuthContext()

  return useQuery({
    queryKey: ['portal', 'my-matters'],
    queryFn: async () => {
      // Get contact record linked to this user
      const { data: contact } = await supabase
        .from('contacts')
        .select('id')
        .eq('user_id', profile!.id)
        .single()

      if (!contact) return []

      const { data, error } = await supabase
        .from('matter_contacts')
        .select(`
          matter:matters(
            id, title, matter_number, status, priority,
            next_court_date, opened_date,
            matter_type:matter_types(name),
            responsible_lawyer:users!matters_responsible_lawyer_id_fkey(full_name)
          )
        `)
        .eq('contact_id', contact.id)

      if (error) throw error
      return data?.map((mc: Record<string, unknown>) => mc.matter).filter(Boolean) || []
    },
    enabled: !!profile?.id,
  })
}

export function useMyInvoices() {
  const supabase = useSupabase()
  const { profile } = useAuthContext()

  return useQuery({
    queryKey: ['portal', 'my-invoices'],
    queryFn: async () => {
      const { data: contact } = await supabase
        .from('contacts')
        .select('id')
        .eq('user_id', profile!.id)
        .single()

      if (!contact) return []

      const { data, error } = await supabase
        .from('invoices')
        .select('id, invoice_number, title, total_amount, paid_amount, outstanding_amount, status, due_date, issue_date')
        .eq('contact_id', contact.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!profile?.id,
  })
}

export function useMyDocuments() {
  const supabase = useSupabase()
  const { profile } = useAuthContext()

  return useQuery({
    queryKey: ['portal', 'my-documents'],
    queryFn: async () => {
      const { data: contact } = await supabase
        .from('contacts')
        .select('id')
        .eq('user_id', profile!.id)
        .single()

      if (!contact) return []

      const { data, error } = await supabase
        .from('documents')
        .select('id, name, description, file_type, file_size, created_at, access_level')
        .eq('contact_id', contact.id)
        .in('access_level', ['public', 'internal'])
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!profile?.id,
  })
}

export function useMyMessages() {
  const supabase = useSupabase()
  const { profile } = useAuthContext()

  return useQuery({
    queryKey: ['portal', 'my-messages'],
    queryFn: async () => {
      const { data: contact } = await supabase
        .from('contacts')
        .select('id')
        .eq('user_id', profile!.id)
        .single()

      if (!contact) return []

      const { data, error } = await supabase
        .from('messages')
        .select('id, content, message_type, sender_type, status, created_at, read_at')
        .eq('contact_id', contact.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!profile?.id,
  })
}

export function useMyProfile() {
  const supabase = useSupabase()
  const { profile } = useAuthContext()

  return useQuery({
    queryKey: ['portal', 'my-profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', profile!.id)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!profile?.id,
  })
}

export function useUpdateMyProfile() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()
  const { profile } = useAuthContext()

  return useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('user_id', profile!.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'my-profile'] })
    },
  })
}
