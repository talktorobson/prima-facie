'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '@/components/providers'
import type { Document, DocumentInsert, DocumentUpdate } from '@/types/database'

interface DocumentsFilters {
  matter_id?: string
  category?: string
  access_level?: string
}

export function useDocuments(filters?: DocumentsFilters) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: ['documents', filters],
    queryFn: async () => {
      let query = supabase
        .from('documents')
        .select('*, matters(id, title)')
        .order('created_at', { ascending: false })

      if (filters?.matter_id) {
        query = query.eq('matter_id', filters.matter_id)
      }

      if (filters?.category) {
        query = query.eq('category', filters.category)
      }

      if (filters?.access_level) {
        query = query.eq('access_level', filters.access_level)
      }

      const { data, error } = await query

      if (error) throw error
      return data as Document[]
    },
  })
}

export function useDocument(id?: string) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: ['documents', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('*, matters(id, title)')
        .eq('id', id!)
        .single()

      if (error) throw error
      return data as Document
    },
    enabled: !!id,
  })
}

export function useUploadDocument() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ file, metadata }: { file: File; metadata: DocumentInsert }) => {
      const filePath = `${metadata.law_firm_id}/${metadata.matter_id || 'general'}/${Date.now()}_${file.name}`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data, error } = await supabase
        .from('documents')
        .insert({
          ...metadata,
          storage_path: filePath,
          file_type: file.type,
          file_size: file.size,
          storage_provider: 'supabase',
        })
        .select()
        .single()

      if (error) throw error
      return data as Document
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

export function useUpdateDocument() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: DocumentUpdate }) => {
      const { data, error } = await supabase
        .from('documents')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Document
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

export function useDeleteDocument() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: doc } = await supabase
        .from('documents')
        .select('storage_path')
        .eq('id', id)
        .single()

      if (doc?.storage_path) {
        await supabase.storage
          .from('documents')
          .remove([doc.storage_path])
      }

      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })
}

export function useDocumentUrl(path?: string) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: ['document-url', path],
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(path!, 3600)

      if (error) throw error
      return data.signedUrl
    },
    enabled: !!path,
    staleTime: 30 * 60 * 1000, // 30 minutes
  })
}
