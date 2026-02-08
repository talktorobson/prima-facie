import { tool } from 'ai'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'

export const queryTasks = (supabase: SupabaseClient, lawFirmId: string) =>
  tool({
    description: 'Busca tarefas do escritório por status, prioridade, responsável ou prazo. Use para listar tarefas pendentes, atrasadas ou de um processo específico.',
    inputSchema: z.object({
      search: z.string().optional().describe('Texto para buscar no título da tarefa'),
      status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional().describe('Status da tarefa'),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().describe('Prioridade da tarefa'),
      matterId: z.string().uuid().optional().describe('ID do processo para filtrar tarefas'),
      overdue: z.boolean().optional().describe('Se true, retorna apenas tarefas com prazo vencido'),
      limit: z.number().min(1).max(20).default(10).describe('Número máximo de resultados'),
    }),
    execute: async ({ search, status, priority, matterId, overdue, limit }) => {
      let query = supabase
        .from('tasks')
        .select('id, title, description, status, priority, task_type, due_date, assigned_to, matter_id, is_billable')
        .eq('law_firm_id', lawFirmId)
        .order('due_date', { ascending: true, nullsFirst: false })
        .limit(limit)

      if (search) query = query.ilike('title', `%${search}%`)
      if (status) query = query.eq('status', status)
      if (priority) query = query.eq('priority', priority)
      if (matterId) query = query.eq('matter_id', matterId)
      if (overdue) {
        query = query
          .lt('due_date', new Date().toISOString())
          .neq('status', 'completed')
          .neq('status', 'cancelled')
      }

      const { data, error } = await query

      if (error) return { error: `Erro ao buscar tarefas: ${error.message}` }
      if (!data?.length) return { message: 'Nenhuma tarefa encontrada com os filtros informados.', results: [] }

      return {
        message: `${data.length} tarefa(s) encontrada(s).`,
        results: data,
      }
    },
  })
