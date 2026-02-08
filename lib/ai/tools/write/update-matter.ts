import { tool } from 'ai'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'

export const updateMatterStatus = (supabase: SupabaseClient, lawFirmId: string) =>
  tool({
    description: 'Atualiza o status de um processo. Retorna dados para confirmação.',
    inputSchema: z.object({
      matterId: z.string().uuid().describe('ID do processo a ser atualizado'),
      status: z.enum(['active', 'closed', 'on_hold', 'settled', 'dismissed']).describe('Novo status do processo'),
    }),
    execute: async ({ matterId, status }) => {
      const { data: matter, error } = await supabase
        .from('matters')
        .select('id, title, status')
        .eq('id', matterId)
        .eq('law_firm_id', lawFirmId)
        .single()

      if (error || !matter) {
        return { error: 'Processo não encontrado ou sem permissão.' }
      }

      const statusLabels: Record<string, string> = {
        active: 'Ativo',
        closed: 'Encerrado',
        on_hold: 'Suspenso',
        settled: 'Acordo',
        dismissed: 'Arquivado',
      }

      return {
        requiresConfirmation: true,
        action: 'update_matter_status',
        entityId: matterId,
        data: {
          status,
          ...(status === 'closed' ? { closed_date: new Date().toISOString() } : {}),
        },
        displayMessage: `Alterar status do processo "**${matter.title}**" de ${statusLabels[matter.status || 'active']} para **${statusLabels[status]}**`,
      }
    },
  })
