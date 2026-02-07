'use client'

import { useQuery } from '@tanstack/react-query'
import { useSupabase } from '@/components/providers'

interface DateRange {
  start: string
  end: string
}

export function useFinancialReport(lawFirmId: string | null | undefined, dateRange: DateRange) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['reports', 'financial', lawFirmId, dateRange],
    queryFn: async () => {
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('id, total_amount, paid_amount, outstanding_amount, status, issue_date, due_date, paid_date')
        .eq('law_firm_id', lawFirmId!)
        .gte('issue_date', dateRange.start)
        .lte('issue_date', dateRange.end)

      if (error) throw error

      const totalBilled = invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0
      const totalPaid = invoices?.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0) || 0
      const totalOutstanding = invoices?.reduce((sum, inv) => sum + (inv.outstanding_amount || 0), 0) || 0
      const overdueCount = invoices?.filter(inv => inv.status === 'overdue').length || 0

      const byStatus: Record<string, number> = {}
      invoices?.forEach(inv => {
        const status = inv.status || 'draft'
        byStatus[status] = (byStatus[status] || 0) + (inv.total_amount || 0)
      })

      return { totalBilled, totalPaid, totalOutstanding, overdueCount, byStatus, invoices: invoices || [] }
    },
    enabled: !!lawFirmId && !!dateRange.start && !!dateRange.end,
  })
}

export function useMatterReport(lawFirmId: string | null | undefined, dateRange: DateRange) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['reports', 'matters', lawFirmId, dateRange],
    queryFn: async () => {
      const { data: matters, error } = await supabase
        .from('matters')
        .select('id, title, status, priority, matter_type_id, matter_types(name), opened_date, closed_date')
        .eq('law_firm_id', lawFirmId!)

      if (error) throw error

      const byStatus: Record<string, number> = {}
      const byType: Record<string, number> = {}
      matters?.forEach((m: Record<string, unknown>) => {
        const status = (m.status as string) || 'active'
        byStatus[status] = (byStatus[status] || 0) + 1
        const typeName = (m.matter_types as Record<string, unknown>)?.name as string || 'Sem tipo'
        byType[typeName] = (byType[typeName] || 0) + 1
      })

      const openedInRange = matters?.filter((m: Record<string, unknown>) =>
        m.opened_date && (m.opened_date as string) >= dateRange.start && (m.opened_date as string) <= dateRange.end
      ).length || 0

      const closedInRange = matters?.filter((m: Record<string, unknown>) =>
        m.closed_date && (m.closed_date as string) >= dateRange.start && (m.closed_date as string) <= dateRange.end
      ).length || 0

      return { total: matters?.length || 0, byStatus, byType, openedInRange, closedInRange }
    },
    enabled: !!lawFirmId && !!dateRange.start && !!dateRange.end,
  })
}

export function useTeamReport(lawFirmId: string | null | undefined, dateRange: DateRange) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['reports', 'team', lawFirmId, dateRange],
    queryFn: async () => {
      const { data: entries, error } = await supabase
        .from('time_entries')
        .select('id, user_id, hours_worked, is_billable, users!time_entries_user_id_fkey(id, full_name)')
        .eq('law_firm_id', lawFirmId!)
        .gte('work_date', dateRange.start)
        .lte('work_date', dateRange.end)

      if (error) throw error

      const byUser: Record<string, { name: string; totalHours: number; billableHours: number }> = {}
      entries?.forEach((entry: Record<string, unknown>) => {
        const userId = entry.user_id as string
        const user = entry.users as Record<string, unknown>
        if (!byUser[userId]) {
          byUser[userId] = { name: (user?.full_name as string) || 'Desconhecido', totalHours: 0, billableHours: 0 }
        }
        byUser[userId].totalHours += (entry.hours_worked as number) || 0
        if (entry.is_billable) byUser[userId].billableHours += (entry.hours_worked as number) || 0
      })

      return { byUser, totalEntries: entries?.length || 0 }
    },
    enabled: !!lawFirmId && !!dateRange.start && !!dateRange.end,
  })
}

export function useClientReport(lawFirmId: string | null | undefined, dateRange: DateRange) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['reports', 'clients', lawFirmId, dateRange],
    queryFn: async () => {
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('id, full_name, company_name, contact_type, client_status, total_billed, total_paid')
        .eq('law_firm_id', lawFirmId!)
        .order('total_billed', { ascending: false })
        .limit(20)

      if (error) throw error

      const byStatus: Record<string, number> = {}
      contacts?.forEach(c => {
        const status = c.client_status || 'prospect'
        byStatus[status] = (byStatus[status] || 0) + 1
      })

      const topClients = (contacts || []).slice(0, 10).map(c => ({
        id: c.id,
        name: c.full_name || c.company_name || 'Sem nome',
        totalBilled: c.total_billed || 0,
        totalPaid: c.total_paid || 0,
      }))

      return { total: contacts?.length || 0, byStatus, topClients }
    },
    enabled: !!lawFirmId && !!dateRange.start && !!dateRange.end,
  })
}
