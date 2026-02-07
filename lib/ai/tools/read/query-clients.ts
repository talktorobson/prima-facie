import { tool } from 'ai'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'

export const queryClients = (supabase: SupabaseClient, lawFirmId: string) =>
  tool({
    description: 'Busca clientes (contatos) do escritório por nome, CPF, CNPJ, email ou status. Use para encontrar clientes específicos ou listar clientes ativos.',
    inputSchema: z.object({
      search: z.string().optional().describe('Texto para buscar no nome, email, CPF ou CNPJ'),
      contactType: z.enum(['individual', 'company']).optional().describe('Tipo de contato: pessoa física ou jurídica'),
      clientStatus: z.enum(['prospect', 'active', 'inactive', 'former']).optional().describe('Status do cliente'),
      limit: z.number().min(1).max(20).default(10).describe('Número máximo de resultados'),
    }),
    execute: async ({ search, contactType, clientStatus, limit }) => {
      let query = supabase
        .from('contacts')
        .select('id, full_name, company_name, contact_type, email, phone, mobile, cpf, cnpj, client_status')
        .eq('law_firm_id', lawFirmId)
        .order('updated_at', { ascending: false })
        .limit(limit)

      if (search) {
        query = query.or(`full_name.ilike.%${search}%,company_name.ilike.%${search}%,email.ilike.%${search}%,cpf.ilike.%${search}%,cnpj.ilike.%${search}%`)
      }
      if (contactType) query = query.eq('contact_type', contactType)
      if (clientStatus) query = query.eq('client_status', clientStatus)

      const { data, error } = await query

      if (error) return { error: `Erro ao buscar clientes: ${error.message}` }
      if (!data?.length) return { message: 'Nenhum cliente encontrado com os filtros informados.', results: [] }

      return {
        message: `${data.length} cliente(s) encontrado(s).`,
        results: data,
      }
    },
  })
