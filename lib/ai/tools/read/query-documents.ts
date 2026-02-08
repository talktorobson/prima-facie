import { tool } from 'ai'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'

export const queryDocuments = (supabase: SupabaseClient, lawFirmId: string) =>
  tool({
    description: 'Busca documentos do escritório por nome, tipo, categoria ou processo vinculado.',
    inputSchema: z.object({
      search: z.string().optional().describe('Texto para buscar no nome do documento'),
      matterId: z.string().uuid().optional().describe('ID do processo para filtrar documentos'),
      category: z.string().optional().describe('Categoria do documento'),
      limit: z.number().min(1).max(20).default(10).describe('Número máximo de resultados'),
    }),
    execute: async ({ search, matterId, category, limit }) => {
      let query = supabase
        .from('documents')
        .select('id, name, description, file_type, file_size, document_type, category, access_level, matter_id, created_at')
        .eq('law_firm_id', lawFirmId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (search) query = query.ilike('name', `%${search}%`)
      if (matterId) query = query.eq('matter_id', matterId)
      if (category) query = query.eq('category', category)

      const { data, error } = await query

      if (error) return { error: `Erro ao buscar documentos: ${error.message}` }
      if (!data?.length) return { message: 'Nenhum documento encontrado.', results: [] }

      return {
        message: `${data.length} documento(s) encontrado(s).`,
        results: data,
      }
    },
  })
