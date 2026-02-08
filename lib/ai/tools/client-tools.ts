import { tool } from 'ai'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ToolSet } from 'ai'

/**
 * Client-scoped read-only tools.
 * These tools only return data for the specified contact (client).
 * No write tools, no firm-wide queries.
 */

// Cache matter IDs per request to avoid redundant queries across tools
async function getClientMatterIds(
  supabase: SupabaseClient,
  lawFirmId: string,
  contactId: string,
  cache: { matterIds?: string[] },
): Promise<string[]> {
  if (cache.matterIds) return cache.matterIds
  const { data: matterLinks } = await supabase
    .from('matter_contacts')
    .select('matter_id')
    .eq('contact_id', contactId)
    .eq('law_firm_id', lawFirmId)
  cache.matterIds = matterLinks?.map((ml) => ml.matter_id) ?? []
  return cache.matterIds
}

const queryMyMatters = (supabase: SupabaseClient, lawFirmId: string, contactId: string, matterIdCache: { matterIds?: string[] }) =>
  tool({
    description: 'Busca os processos do cliente. Retorna apenas processos vinculados a este cliente.',
    inputSchema: z.object({
      search: z.string().optional().describe('Texto para buscar no titulo do processo'),
      status: z.enum(['active', 'closed', 'on_hold', 'settled', 'dismissed']).optional().describe('Status do processo'),
      limit: z.number().min(1).max(10).default(5).describe('Numero maximo de resultados'),
    }),
    execute: async ({ search, status, limit }) => {
      const matterIds = await getClientMatterIds(supabase, lawFirmId, contactId, matterIdCache)

      if (!matterIds.length) {
        return { message: 'Nenhum processo encontrado para este cliente.', results: [] }
      }

      let query = supabase
        .from('matters')
        .select('id, title, matter_number, status, priority, court_name, process_number, opened_date, next_court_date')
        .eq('law_firm_id', lawFirmId)
        .in('id', matterIds)
        .order('updated_at', { ascending: false })
        .limit(limit)

      if (search) query = query.or(`title.ilike.%${search}%,matter_number.ilike.%${search}%`)
      if (status) query = query.eq('status', status)

      const { data, error } = await query

      if (error) return { error: `Erro ao buscar processos: ${error.message}` }
      if (!data?.length) return { message: 'Nenhum processo encontrado com os filtros informados.', results: [] }

      return {
        message: `${data.length} processo(s) encontrado(s).`,
        results: data,
      }
    },
  })

const queryMyTasks = (supabase: SupabaseClient, lawFirmId: string, contactId: string, matterIdCache: { matterIds?: string[] }) =>
  tool({
    description: 'Busca tarefas dos processos do cliente. Retorna apenas tarefas vinculadas aos processos deste cliente.',
    inputSchema: z.object({
      status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional().describe('Status da tarefa'),
      limit: z.number().min(1).max(10).default(5).describe('Numero maximo de resultados'),
    }),
    execute: async ({ status, limit }) => {
      const matterIds = await getClientMatterIds(supabase, lawFirmId, contactId, matterIdCache)

      if (!matterIds.length) {
        return { message: 'Nenhuma tarefa encontrada.', results: [] }
      }

      let query = supabase
        .from('tasks')
        .select('id, title, status, priority, due_date, task_type')
        .eq('law_firm_id', lawFirmId)
        .in('matter_id', matterIds)
        .order('due_date', { ascending: true, nullsFirst: false })
        .limit(limit)

      if (status) query = query.eq('status', status)

      const { data, error } = await query

      if (error) return { error: `Erro ao buscar tarefas: ${error.message}` }
      if (!data?.length) return { message: 'Nenhuma tarefa encontrada.', results: [] }

      return {
        message: `${data.length} tarefa(s) encontrada(s).`,
        results: data,
      }
    },
  })

const queryMyInvoices = (supabase: SupabaseClient, lawFirmId: string, contactId: string) =>
  tool({
    description: 'Busca faturas do cliente. Retorna apenas faturas deste cliente.',
    inputSchema: z.object({
      status: z.enum(['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled']).optional().describe('Status da fatura'),
      limit: z.number().min(1).max(10).default(5).describe('Numero maximo de resultados'),
    }),
    execute: async ({ status, limit }) => {
      let query = supabase
        .from('invoices')
        .select('id, invoice_number, title, status, total_amount, paid_amount, outstanding_amount, due_date, issue_date')
        .eq('law_firm_id', lawFirmId)
        .eq('contact_id', contactId)
        .order('due_date', { ascending: false })
        .limit(limit)

      if (status) query = query.eq('status', status)

      const { data, error } = await query

      if (error) return { error: `Erro ao buscar faturas: ${error.message}` }
      if (!data?.length) return { message: 'Nenhuma fatura encontrada.', results: [] }

      const totalAmount = data.reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
      const totalOutstanding = data.reduce((sum, inv) => sum + (inv.outstanding_amount || 0), 0)

      return {
        message: `${data.length} fatura(s). Total: R$ ${totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Em aberto: R$ ${totalOutstanding.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
        results: data,
        summary: { totalAmount, totalOutstanding, count: data.length },
      }
    },
  })

const queryMyDocuments = (supabase: SupabaseClient, lawFirmId: string, contactId: string, matterIdCache: { matterIds?: string[] }) =>
  tool({
    description: 'Busca documentos dos processos do cliente. Retorna apenas documentos vinculados aos processos deste cliente.',
    inputSchema: z.object({
      search: z.string().optional().describe('Texto para buscar no nome do documento'),
      limit: z.number().min(1).max(10).default(5).describe('Numero maximo de resultados'),
    }),
    execute: async ({ search, limit }) => {
      const matterIds = await getClientMatterIds(supabase, lawFirmId, contactId, matterIdCache)

      if (!matterIds.length) {
        return { message: 'Nenhum documento encontrado.', results: [] }
      }

      let query = supabase
        .from('documents')
        .select('id, name, description, file_type, category, created_at')
        .eq('law_firm_id', lawFirmId)
        .in('matter_id', matterIds)
        .eq('access_level', 'client')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (search) query = query.ilike('name', `%${search}%`)

      const { data, error } = await query

      if (error) return { error: `Erro ao buscar documentos: ${error.message}` }
      if (!data?.length) return { message: 'Nenhum documento encontrado.', results: [] }

      return {
        message: `${data.length} documento(s) encontrado(s).`,
        results: data,
      }
    },
  })

export function getClientTools(supabase: SupabaseClient, lawFirmId: string, contactId: string): ToolSet {
  const matterIdCache: { matterIds?: string[] } = {}
  return {
    query_my_matters: queryMyMatters(supabase, lawFirmId, contactId, matterIdCache),
    query_my_tasks: queryMyTasks(supabase, lawFirmId, contactId, matterIdCache),
    query_my_invoices: queryMyInvoices(supabase, lawFirmId, contactId),
    query_my_documents: queryMyDocuments(supabase, lawFirmId, contactId, matterIdCache),
  }
}
