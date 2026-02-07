'use client'

import { useQuery } from '@tanstack/react-query'
import { useSupabase } from '@/components/providers'

interface CalendarEvent {
  id: string
  title: string
  date: string
  type: 'task' | 'court_date' | 'invoice_due'
  color: string
  source_table: string
  source_id: string
  matter_id?: string
  matter_title?: string
}

export function useCalendarEvents(lawFirmId: string | null | undefined, year: number, month: number) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: ['calendar', lawFirmId, year, month],
    queryFn: async () => {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`
      const endYear = month + 1 > 12 ? year + 1 : year

      const adjustedEndDate = `${endYear}-${String(month + 1 > 12 ? 1 : month + 1).padStart(2, '0')}-01`

      // Fetch tasks with due dates in range
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, title, due_date, matter_id, matters(id, title)')
        .eq('law_firm_id', lawFirmId!)
        .gte('due_date', startDate)
        .lt('due_date', adjustedEndDate)
        .not('due_date', 'is', null)

      // Fetch matters with next_court_date in range
      const { data: matters } = await supabase
        .from('matters')
        .select('id, title, next_court_date')
        .eq('law_firm_id', lawFirmId!)
        .gte('next_court_date', startDate)
        .lt('next_court_date', adjustedEndDate)
        .not('next_court_date', 'is', null)

      // Fetch invoices with due_date in range
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, invoice_number, due_date, total_amount, matter_id, matters(id, title)')
        .eq('law_firm_id', lawFirmId!)
        .gte('due_date', startDate)
        .lt('due_date', adjustedEndDate)

      const events: CalendarEvent[] = []

      // Map tasks
      tasks?.forEach((task: Record<string, unknown>) => {
        events.push({
          id: `task-${task.id}`,
          title: task.title as string,
          date: task.due_date as string,
          type: 'task',
          color: 'bg-blue-500',
          source_table: 'tasks',
          source_id: task.id as string,
          matter_id: task.matter_id as string | undefined,
          matter_title: (task.matters as Record<string, unknown>)?.title as string | undefined,
        })
      })

      // Map court dates
      matters?.forEach((matter: Record<string, unknown>) => {
        events.push({
          id: `court-${matter.id}`,
          title: `Audiência: ${matter.title}`,
          date: matter.next_court_date as string,
          type: 'court_date',
          color: 'bg-red-500',
          source_table: 'matters',
          source_id: matter.id as string,
          matter_id: matter.id as string,
          matter_title: matter.title as string,
        })
      })

      // Map invoice due dates
      invoices?.forEach((invoice: Record<string, unknown>) => {
        events.push({
          id: `invoice-${invoice.id}`,
          title: `Fatura ${invoice.invoice_number}: R$ ${(invoice.total_amount as number)?.toFixed(2)}`,
          date: invoice.due_date as string,
          type: 'invoice_due',
          color: 'bg-orange-500',
          source_table: 'invoices',
          source_id: invoice.id as string,
          matter_id: invoice.matter_id as string | undefined,
          matter_title: (invoice.matters as Record<string, unknown>)?.title as string | undefined,
        })
      })

      return events
    },
    enabled: !!lawFirmId,
  })
}

export type { CalendarEvent }
