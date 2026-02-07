import { tool } from 'ai'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'

export const firmDashboardStats = (supabase: SupabaseClient, lawFirmId: string) =>
  tool({
    description: 'Obtém estatísticas gerais do escritório: total de processos, clientes, tarefas pendentes, faturas em aberto e receita.',
    inputSchema: z.object({}),
    execute: async () => {
      const [matters, contacts, tasks, invoices] = await Promise.all([
        supabase
          .from('matters')
          .select('id, status', { count: 'exact' })
          .eq('law_firm_id', lawFirmId),
        supabase
          .from('contacts')
          .select('id', { count: 'exact' })
          .eq('law_firm_id', lawFirmId),
        supabase
          .from('tasks')
          .select('id, status', { count: 'exact' })
          .eq('law_firm_id', lawFirmId)
          .in('status', ['pending', 'in_progress']),
        supabase
          .from('invoices')
          .select('id, status, total_amount, outstanding_amount')
          .eq('law_firm_id', lawFirmId),
      ])

      const totalMatters = matters.count ?? 0
      const activeMatters = matters.data?.filter((m) => m.status === 'active').length ?? 0
      const totalClients = contacts.count ?? 0
      const pendingTasks = tasks.count ?? 0

      const invoiceData = invoices.data ?? []
      const overdueInvoices = invoiceData.filter((i) => i.status === 'overdue').length
      const totalRevenue = invoiceData
        .filter((i) => i.status === 'paid')
        .reduce((sum, i) => sum + (i.total_amount || 0), 0)
      const totalOutstanding = invoiceData
        .reduce((sum, i) => sum + (i.outstanding_amount || 0), 0)

      return {
        message: 'Estatísticas do escritório carregadas.',
        stats: {
          totalMatters,
          activeMatters,
          totalClients,
          pendingTasks,
          overdueInvoices,
          totalRevenue,
          totalOutstanding,
        },
      }
    },
  })
