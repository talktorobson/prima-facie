import { tool } from 'ai'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'

export const updateTaskStatus = (supabase: SupabaseClient, lawFirmId: string) =>
  tool({
    description: 'Atualiza o status de uma tarefa existente. Retorna dados para confirmação.',
    inputSchema: z.object({
      taskId: z.string().uuid().describe('ID da tarefa a ser atualizada'),
      status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).describe('Novo status da tarefa'),
    }),
    execute: async ({ taskId, status }) => {
      // Verify the task exists and belongs to the firm
      const { data: task, error } = await supabase
        .from('tasks')
        .select('id, title, status')
        .eq('id', taskId)
        .eq('law_firm_id', lawFirmId)
        .single()

      if (error || !task) {
        return { error: 'Tarefa não encontrada ou sem permissão.' }
      }

      const statusLabels: Record<string, string> = {
        pending: 'Pendente',
        in_progress: 'Em andamento',
        completed: 'Concluída',
        cancelled: 'Cancelada',
      }

      return {
        requiresConfirmation: true,
        action: 'update_task_status',
        entityId: taskId,
        data: {
          status,
          ...(status === 'completed' ? { completed_date: new Date().toISOString() } : {}),
        },
        displayMessage: `Alterar status da tarefa "**${task.title}**" de ${statusLabels[task.status || 'pending']} para **${statusLabels[status]}**`,
      }
    },
  })
