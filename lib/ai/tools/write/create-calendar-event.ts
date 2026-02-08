import { tool } from 'ai'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'

export const createCalendarEvent = (_supabase: SupabaseClient, lawFirmId: string, userId: string) =>
  tool({
    description: 'Cria um evento no calendário (tarefa do tipo court_date ou client_meeting). Retorna dados para confirmação.',
    inputSchema: z.object({
      title: z.string().min(3).describe('Título do evento'),
      description: z.string().optional().describe('Descrição do evento'),
      eventType: z.enum(['court_date', 'client_meeting', 'deadline', 'general']).describe('Tipo do evento'),
      date: z.string().describe('Data do evento no formato YYYY-MM-DD'),
      matterId: z.string().uuid().optional().describe('ID do processo vinculado'),
    }),
    execute: async ({ title, description, eventType, date, matterId }) => {
      const taskType = eventType === 'deadline' ? 'deadline' as const : eventType === 'general' ? 'general' as const : eventType

      return {
        requiresConfirmation: true,
        action: 'create_calendar_event',
        data: {
          title,
          description,
          task_type: taskType,
          due_date: date,
          matter_id: matterId,
          assigned_to: userId,
          law_firm_id: lawFirmId,
          status: 'pending',
          priority: 'medium',
          created_by: userId,
        },
        displayMessage: `Agendar **${title}** para ${new Date(date).toLocaleDateString('pt-BR')}`,
      }
    },
  })
