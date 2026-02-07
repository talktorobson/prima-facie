'use client'

import { useQuery } from '@tanstack/react-query'
import { useSupabase } from '@/components/providers'

interface Article {
  id: string
  law_firm_id: string | null
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  category: 'alerta' | 'guia' | 'artigo'
  topic: 'trabalhista' | 'empresarial' | 'cobranca' | null
  published: boolean
  published_at: string | null
  author_id: string | null
  created_at: string
  updated_at: string
}

interface ArticleFilters {
  category?: string
  topic?: string
}

export function useArticles(filters?: ArticleFilters) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: ['articles', filters],
    queryFn: async () => {
      let query = supabase
        .from('articles')
        .select('*')
        .eq('published', true)
        .order('published_at', { ascending: false })

      if (filters?.category) {
        query = query.eq('category', filters.category)
      }
      if (filters?.topic) {
        query = query.eq('topic', filters.topic)
      }

      const { data, error } = await query
      if (error) throw error
      return data as Article[]
    },
  })
}

export function useArticle(slug: string) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: ['articles', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .single()

      if (error) throw error
      return data as Article
    },
    enabled: !!slug,
  })
}

export type { Article, ArticleFilters }
