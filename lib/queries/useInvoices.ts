'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '@/components/providers'
import type { Invoice, InvoiceInsert, InvoiceUpdate } from '@/types/database'

interface InvoiceFilters {
  status?: string
  contact_id?: string
  matter_id?: string
}

interface InvoiceWithRelations extends Invoice {
  contacts?: {
    id: string
    full_name?: string
    company_name?: string
  }
  matters?: {
    id: string
    title: string
  }
  invoice_line_items?: Array<{
    id: string
    invoice_id: string
    description: string
    quantity?: number
    rate?: number
    amount?: number
    item_type?: 'time' | 'expense' | 'fee' | 'other'
    time_entry_id?: string
    service_date?: string
  }>
}

export function useInvoices(lawFirmId: string | null | undefined, filters?: InvoiceFilters) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: ['invoices', lawFirmId, filters],
    queryFn: async () => {
      let query = supabase
        .from('invoices')
        .select(`
          *,
          contacts(id, full_name, company_name),
          matters(id, title)
        `)
        .eq('law_firm_id', lawFirmId!)
        .order('created_at', { ascending: false })

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.contact_id) {
        query = query.eq('contact_id', filters.contact_id)
      }
      if (filters?.matter_id) {
        query = query.eq('matter_id', filters.matter_id)
      }

      const { data, error } = await query

      if (error) throw error
      return data as InvoiceWithRelations[]
    },
    enabled: !!lawFirmId,
  })
}

export function useInvoice(id?: string) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: ['invoices', id],
    queryFn: async () => {
      if (!id) throw new Error('Invoice ID is required')

      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          contacts(id, full_name, company_name),
          matters(id, title),
          invoice_line_items(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data as InvoiceWithRelations
    },
    enabled: !!id,
  })
}

export function useCreateInvoice() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (invoice: InvoiceInsert) => {
      const { data, error } = await supabase
        .from('invoices')
        .insert(invoice)
        .select()
        .single()

      if (error) throw error
      return data as Invoice
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}

export function useUpdateInvoice() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: InvoiceUpdate }) => {
      const { data, error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Invoice
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoices', data.id] })
    },
  })
}

export function useDeleteInvoice() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('invoices').delete().eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}

export function useUpdateInvoiceStatus() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Invoice['status'] }) => {
      const updates: InvoiceUpdate = { status }

      if (status === 'paid') {
        updates.paid_date = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Invoice
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}
