import { tool } from 'ai'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'

export const createTask = (_supabase: SupabaseClient, lawFirmId: string, userId: string) =>
  tool({
    description: 'Cria uma nova tarefa. Sempre retorna os dados para confirmação do usuário antes de executar.',
    inputSchema: z.object({
      title: z.string().min(3).describe('Título da tarefa'),
      description: z.string().optional().describe('Descrição detalhada da tarefa'),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium').describe('Prioridade da tarefa'),
      taskType: z.enum(['general', 'deadline', 'court_date', 'client_meeting', 'document_review']).default('general').describe('Tipo da tarefa'),
      dueDate: z.string().optional().describe('Data de vencimento no formato YYYY-MM-DD'),
      matterId: z.string().uuid().optional().describe('ID do processo vinculado'),
      assignedTo: z.string().uuid().optional().describe('ID do usuário responsável'),
      isBillable: z.boolean().default(false).describe('Se a tarefa é faturável'),
    }),
    execute: async ({ title, description, priority, taskType, dueDate, matterId, assignedTo, isBillable }) => {
      return {
        requiresConfirmation: true,
        action: 'create_task',
        data: {
          title,
          description,
          priority,
          task_type: taskType,
          due_date: dueDate,
          matter_id: matterId,
          assigned_to: assignedTo || userId,
          is_billable: isBillable,
          law_firm_id: lawFirmId,
          status: 'pending',
          created_by: userId,
        },
        displayMessage: `Criar tarefa: **${title}** (Prioridade: ${priority})${dueDate ? ` — Prazo: ${new Date(dueDate).toLocaleDateString('pt-BR')}` : ''}`,
      }
    },
  })
