import type { SupabaseClient } from '@supabase/supabase-js'
import type { ToolSet } from 'ai'
import { queryMatters } from './read/query-matters'
import { queryClients } from './read/query-clients'
import { queryTasks } from './read/query-tasks'
import { queryDocuments } from './read/query-documents'
import { queryInvoices } from './read/query-invoices'
import { queryCalendar } from './read/query-calendar'
import { queryDatajud } from './read/query-datajud'
import { firmDashboardStats } from './read/firm-stats'
import { matterSummary } from './read/matter-summary'
import { createTask } from './write/create-task'
import { updateTaskStatus } from './write/update-task'
import { createTimeEntry } from './write/create-time-entry'
import { createCalendarEvent } from './write/create-calendar-event'
import { updateMatterStatus } from './write/update-matter'

interface ToolContext {
  supabase: SupabaseClient
  lawFirmId: string
  userId: string
  userRole: string
}

export function getReadTools(ctx: ToolContext): ToolSet {
  const { supabase, lawFirmId } = ctx
  return {
    query_matters: queryMatters(supabase, lawFirmId),
    query_clients: queryClients(supabase, lawFirmId),
    query_tasks: queryTasks(supabase, lawFirmId),
    query_documents: queryDocuments(supabase, lawFirmId),
    query_invoices: queryInvoices(supabase, lawFirmId),
    query_calendar: queryCalendar(supabase, lawFirmId),
    query_datajud: queryDatajud(supabase, lawFirmId),
    firm_dashboard_stats: firmDashboardStats(supabase, lawFirmId),
    matter_summary: matterSummary(supabase, lawFirmId),
  }
}

export function getWriteTools(ctx: ToolContext): ToolSet {
  const { supabase, lawFirmId, userId } = ctx
  return {
    create_task: createTask(supabase, lawFirmId, userId),
    update_task_status: updateTaskStatus(supabase, lawFirmId),
    create_time_entry: createTimeEntry(supabase, lawFirmId, userId),
    create_calendar_event: createCalendarEvent(supabase, lawFirmId, userId),
    update_matter_status: updateMatterStatus(supabase, lawFirmId),
  }
}

export function getAllTools(ctx: ToolContext): ToolSet {
  const readTools = getReadTools(ctx)
  // Staff only gets read tools
  if (ctx.userRole === 'staff') return readTools
  return { ...readTools, ...getWriteTools(ctx) }
}
