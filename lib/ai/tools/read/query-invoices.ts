import { tool } from 'ai'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'

export const queryInvoices = (supabase: SupabaseClient, lawFirmId: string) =>
  tool({
    description: 'Busca faturas do escritório por status, cliente ou período. Use para encontrar faturas em aberto, vencidas ou resumo financeiro.',
    inputSchema: z.object({
      status: z.enum(['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled']).optional().describe('Status da fatura'),
      contactId: z.string().uuid().optional().describe('ID do cliente para filtrar faturas'),
      matterId: z.string().uuid().optional().describe('ID do processo para filtrar faturas'),
      limit: z.number().min(1).max(20).default(10).describe('Número máximo de resultados'),
    }),
    execute: async ({ status, contactId, matterId, limit }) => {
      let query = supabase
        .from('invoices')
        .select('id, invoice_number, title, status, total_amount, paid_amount, outstanding_amount, due_date, issue_date, contact_id, matter_id')
        .eq('law_firm_id', lawFirmId)
        .order('due_date', { ascending: false })
        .limit(limit)

      if (status) query = query.eq('status', status)
      if (contactId) query = query.eq('contact_id', contactId)
      if (matterId) query = query.eq('matter_id', matterId)

      const { data, error } = await query

      if (error) return { error: `Erro ao buscar faturas: ${error.message}` }
      if (!data?.length) return { message: 'Nenhuma fatura encontrada.', results: [] }

      const totalAmount = data.reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
      const totalOutstanding = data.reduce((sum, inv) => sum + (inv.outstanding_amount || 0), 0)

      return {
        message: `${data.length} fatura(s) encontrada(s). Total: R$ ${totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Em aberto: R$ ${totalOutstanding.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
        results: data,
        summary: { totalAmount, totalOutstanding, count: data.length },
      }
    },
  })
