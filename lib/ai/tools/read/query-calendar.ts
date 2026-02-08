import { tool } from 'ai'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'

export const queryCalendar = (supabase: SupabaseClient, lawFirmId: string) =>
  tool({
    description: 'Busca próximos prazos e audiências dos processos do escritório. Retorna datas de audiência e prazos de tarefas.',
    inputSchema: z.object({
      daysAhead: z.number().min(1).max(90).default(30).describe('Número de dias à frente para buscar eventos'),
      includeTaskDeadlines: z.boolean().default(true).describe('Incluir prazos de tarefas'),
    }),
    execute: async ({ daysAhead, includeTaskDeadlines }) => {
      const now = new Date()
      const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000)
      const events: Array<{ type: string; title: string; date: string; entityId: string; entityType: string }> = []

      // Court dates from matters
      const { data: matters } = await supabase
        .from('matters')
        .select('id, title, next_court_date, statute_of_limitations')
        .eq('law_firm_id', lawFirmId)
        .eq('status', 'active')
        .not('next_court_date', 'is', null)
        .gte('next_court_date', now.toISOString())
        .lte('next_court_date', futureDate.toISOString())
        .order('next_court_date', { ascending: true })

      if (matters) {
        for (const m of matters) {
          if (m.next_court_date) {
            events.push({
              type: 'audiência',
              title: m.title,
              date: m.next_court_date,
              entityId: m.id,
              entityType: 'matter',
            })
          }
        }
      }

      // Task deadlines
      if (includeTaskDeadlines) {
        const { data: tasks } = await supabase
          .from('tasks')
          .select('id, title, due_date, priority, status')
          .eq('law_firm_id', lawFirmId)
          .neq('status', 'completed')
          .neq('status', 'cancelled')
          .not('due_date', 'is', null)
          .gte('due_date', now.toISOString())
          .lte('due_date', futureDate.toISOString())
          .order('due_date', { ascending: true })
          .limit(20)

        if (tasks) {
          for (const t of tasks) {
            if (t.due_date) {
              events.push({
                type: 'prazo',
                title: t.title,
                date: t.due_date,
                entityId: t.id,
                entityType: 'task',
              })
            }
          }
        }
      }

      events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      if (!events.length) {
        return { message: `Nenhum evento encontrado nos próximos ${daysAhead} dias.`, results: [] }
      }

      return {
        message: `${events.length} evento(s) nos próximos ${daysAhead} dias.`,
        results: events,
      }
    },
  })
