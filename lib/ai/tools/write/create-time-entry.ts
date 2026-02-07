import { tool } from 'ai'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'

export const createTimeEntry = (supabase: SupabaseClient, lawFirmId: string, userId: string) =>
  tool({
    description: 'Registra horas trabalhadas em um processo. Retorna dados para confirmação.',
    inputSchema: z.object({
      matterId: z.string().uuid().describe('ID do processo vinculado'),
      description: z.string().min(3).describe('Descrição do trabalho realizado'),
      hoursWorked: z.number().min(0.1).max(24).describe('Horas trabalhadas (ex: 1.5 para 1h30)'),
      workDate: z.string().optional().describe('Data do trabalho no formato YYYY-MM-DD (padrão: hoje)'),
      isBillable: z.boolean().default(true).describe('Se as horas são faturáveis'),
    }),
    execute: async ({ matterId, description, hoursWorked, workDate, isBillable }) => {
      // Verify the matter exists
      const { data: matter, error } = await supabase
        .from('matters')
        .select('id, title, hourly_rate')
        .eq('id', matterId)
        .eq('law_firm_id', lawFirmId)
        .single()

      if (error || !matter) {
        return { error: 'Processo não encontrado ou sem permissão.' }
      }

      const date = workDate || new Date().toISOString().split('T')[0]
      const hourlyRate = matter.hourly_rate || 0
      const totalAmount = hoursWorked * hourlyRate

      return {
        requiresConfirmation: true,
        action: 'create_time_entry',
        data: {
          matter_id: matterId,
          user_id: userId,
          description,
          hours_worked: hoursWorked,
          work_date: date,
          is_billable: isBillable,
          hourly_rate: hourlyRate,
          total_amount: totalAmount,
          law_firm_id: lawFirmId,
          created_by: userId,
        },
        displayMessage: `Registrar **${hoursWorked}h** no processo "**${matter.title}**" — ${description}${totalAmount ? ` (R$ ${totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})` : ''}`,
      }
    },
  })
