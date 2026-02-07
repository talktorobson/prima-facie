'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '@/components/providers'
import type { WebsiteContent } from '@/types/website'
import type { WebsiteContentRow } from '@/types/database'

export function useWebsiteContent(lawFirmId?: string) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: ['website-content', lawFirmId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('website_content')
        .select('*')
        .eq('law_firm_id', lawFirmId!)
        .single()

      if (error) throw error
      return data as unknown as WebsiteContent
    },
    enabled: !!lawFirmId,
  })
}

export function useUpdateWebsiteSection() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      lawFirmId,
      section,
      data,
    }: {
      lawFirmId: string
      section: string
      data: Record<string, unknown>
    }) => {
      const { data: result, error } = await supabase
        .from('website_content')
        .update({ [section]: data, updated_at: new Date().toISOString() })
        .eq('law_firm_id', lawFirmId)
        .select()
        .single()

      if (error) throw error
      return result as WebsiteContentRow
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['website-content', variables.lawFirmId] })
    },
  })
}

export function usePublishWebsite() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ lawFirmId, publish }: { lawFirmId: string; publish: boolean }) => {
      const updates: Record<string, unknown> = {
        is_published: publish,
        updated_at: new Date().toISOString(),
      }
      if (publish) updates.published_at = new Date().toISOString()

      const { data, error } = await supabase
        .from('website_content')
        .update(updates)
        .eq('law_firm_id', lawFirmId)
        .select()
        .single()

      if (error) throw error
      return data as WebsiteContentRow
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['website-content', variables.lawFirmId] })
    },
  })
}

export function useCreateWebsiteContent() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      lawFirmId,
      content,
    }: {
      lawFirmId: string
      content: Record<string, unknown>
    }) => {
      const { data, error } = await supabase
        .from('website_content')
        .insert({ law_firm_id: lawFirmId, ...content })
        .select()
        .single()

      if (error) throw error
      return data as WebsiteContentRow
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['website-content', variables.lawFirmId] })
    },
  })
}

export function useUpdateLawFirmSlug() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ lawFirmId, slug }: { lawFirmId: string; slug: string }) => {
      const { data, error } = await supabase
        .from('law_firms')
        .update({ slug, website_published: true })
        .eq('id', lawFirmId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'law-firm'] })
    },
  })
}
