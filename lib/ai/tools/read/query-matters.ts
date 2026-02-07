import { tool } from 'ai'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'

export const queryMatters = (supabase: SupabaseClient, lawFirmId: string) =>
  tool({
    description: 'Busca processos/casos do escritório por título, status, tipo ou advogado responsável. Use para listar processos ativos, filtrar por status, ou buscar um processo específico.',
    inputSchema: z.object({
      search: z.string().optional().describe('Texto para buscar no título ou número do processo'),
      status: z.enum(['active', 'closed', 'on_hold', 'settled', 'dismissed']).optional().describe('Filtrar por status'),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().describe('Filtrar por prioridade'),
      limit: z.number().min(1).max(20).default(10).describe('Número máximo de resultados'),
    }),
    execute: async ({ search, status, priority, limit }) => {
      let query = supabase
        .from('matters')
        .select('id, title, matter_number, status, priority, billing_method, court_name, process_number, opened_date, next_court_date, responsible_lawyer_id')
        .eq('law_firm_id', lawFirmId)
        .order('updated_at', { ascending: false })
        .limit(limit)

      if (search) {
        query = query.or(`title.ilike.%${search}%,matter_number.ilike.%${search}%,process_number.ilike.%${search}%`)
      }
      if (status) query = query.eq('status', status)
      if (priority) query = query.eq('priority', priority)

      const { data, error } = await query

      if (error) return { error: `Erro ao buscar processos: ${error.message}` }
      if (!data?.length) return { message: 'Nenhum processo encontrado com os filtros informados.', results: [] }

      return {
        message: `${data.length} processo(s) encontrado(s).`,
        results: data,
      }
    },
  })
