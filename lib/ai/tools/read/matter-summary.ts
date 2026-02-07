import { tool } from 'ai'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'

export const matterSummary = (supabase: SupabaseClient, lawFirmId: string) =>
  tool({
    description: 'Obtém resumo completo de um processo específico, incluindo contatos vinculados, tarefas, documentos e faturas.',
    inputSchema: z.object({
      matterId: z.string().uuid().describe('ID do processo para obter o resumo completo'),
    }),
    execute: async ({ matterId }) => {
      const [matterRes, tasksRes, docsRes, invoicesRes, contactsRes] = await Promise.all([
        supabase
          .from('matters')
          .select('*')
          .eq('id', matterId)
          .eq('law_firm_id', lawFirmId)
          .single(),
        supabase
          .from('tasks')
          .select('id, title, status, priority, due_date')
          .eq('matter_id', matterId)
          .eq('law_firm_id', lawFirmId)
          .order('due_date', { ascending: true })
          .limit(10),
        supabase
          .from('documents')
          .select('id, name, file_type, category, created_at')
          .eq('matter_id', matterId)
          .eq('law_firm_id', lawFirmId)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('invoices')
          .select('id, invoice_number, status, total_amount, due_date')
          .eq('matter_id', matterId)
          .eq('law_firm_id', lawFirmId)
          .order('due_date', { ascending: false })
          .limit(5),
        supabase
          .from('matter_contacts')
          .select('contact_id, relationship_type, contacts(full_name, company_name, contact_type, email)')
          .eq('matter_id', matterId)
          .limit(10),
      ])

      if (matterRes.error || !matterRes.data) {
        return { error: 'Processo não encontrado ou sem permissão de acesso.' }
      }

      const matter = matterRes.data
      const pendingTasks = tasksRes.data?.filter((t) => t.status !== 'completed' && t.status !== 'cancelled').length ?? 0
      const totalInvoiced = invoicesRes.data?.reduce((sum, i) => sum + (i.total_amount || 0), 0) ?? 0

      return {
        message: `Resumo do processo "${matter.title}" carregado.`,
        matter: {
          id: matter.id,
          title: matter.title,
          matterNumber: matter.matter_number,
          status: matter.status,
          priority: matter.priority,
          billingMethod: matter.billing_method,
          courtName: matter.court_name,
          processNumber: matter.process_number,
          openedDate: matter.opened_date,
          nextCourtDate: matter.next_court_date,
        },
        contacts: contactsRes.data ?? [],
        tasks: {
          total: tasksRes.data?.length ?? 0,
          pending: pendingTasks,
          items: tasksRes.data ?? [],
        },
        documents: {
          total: docsRes.data?.length ?? 0,
          items: docsRes.data ?? [],
        },
        invoices: {
          total: invoicesRes.data?.length ?? 0,
          totalAmount: totalInvoiced,
          items: invoicesRes.data ?? [],
        },
      }
    },
  })
