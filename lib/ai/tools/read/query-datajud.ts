import { tool } from 'ai'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'

export const queryDatajud = (supabase: SupabaseClient, lawFirmId: string) =>
  tool({
    description: 'Busca casos do DataJud (CNJ) enriquecidos que estão vinculados aos processos do escritório.',
    inputSchema: z.object({
      processNumber: z.string().optional().describe('Número do processo CNJ para buscar'),
      matterId: z.string().uuid().optional().describe('ID do processo interno para buscar dados DataJud'),
      limit: z.number().min(1).max(10).default(5).describe('Número máximo de resultados'),
    }),
    execute: async ({ processNumber, matterId, limit }) => {
      let query = supabase
        .from('datajud_case_details')
        .select('id, matter_id, process_number, court_name, judge_name, case_class, case_subject, last_movement_date, status')
        .eq('law_firm_id', lawFirmId)
        .order('last_movement_date', { ascending: false })
        .limit(limit)

      if (processNumber) query = query.ilike('process_number', `%${processNumber}%`)
      if (matterId) query = query.eq('matter_id', matterId)

      const { data, error } = await query

      if (error) return { error: `Erro ao buscar dados DataJud: ${error.message}` }
      if (!data?.length) return { message: 'Nenhum caso DataJud encontrado.', results: [] }

      return {
        message: `${data.length} caso(s) DataJud encontrado(s).`,
        results: data,
      }
    },
  })
