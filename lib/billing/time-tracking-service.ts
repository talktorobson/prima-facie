// =====================================================
// PHASE 8.6: TIME TRACKING SERVICE
// =====================================================

import { createClient } from '@/lib/supabase/client'
import type {
  TimeEntry,
  TimeEntryFormData,
  TimeEntryTemplate,
  TimeEntryTemplateFormData,
  LawyerBillingRate,
  LawyerBillingRateFormData,
  SubscriptionTimeAllocation,
  DailyTimeSummary,
  ActiveTimeSession,
  TimeTrackingDashboard,
  TimeTrackingFilters,
  TimeTrackingMetrics,
  TimerControls,
  TimeBasedBillingCalculation,
  BillingRateType,
  TimeEntryType,
  TimeEntryStatus
} from './time-tracking-types'

class TimeTrackingService {
  private supabase = createClient()

  // ===== TIME ENTRIES =====

  async createTimeEntry(data: TimeEntryFormData): Promise<TimeEntry> {
    const { data: result, error } = await this.supabase
      .from('time_entries')
      .insert([{
        ...data,
        entry_date: data.start_time ? new Date(data.start_time).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        duration_minutes: data.duration_minutes || this.calculateDuration(data.start_time, data.end_time),
        break_minutes: data.break_minutes || 0
      }])
      .select(`
        *,
        matter:matters(id, title, client_name),
        client_subscription:client_subscriptions(id, plan_name, client_name),
        user:users(id, full_name, email)
      `)
      .single()

    if (error) throw error
    return result
  }

  async updateTimeEntry(id: string, data: Partial<TimeEntryFormData>): Promise<TimeEntry> {
    const updateData: any = { ...data }
    
    // Recalculate duration if times changed
    if (data.start_time || data.end_time) {
      updateData.duration_minutes = this.calculateDuration(data.start_time, data.end_time)
    }

    const { data: result, error } = await this.supabase
      .from('time_entries')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        matter:matters(id, title, client_name),
        client_subscription:client_subscriptions(id, plan_name, client_name),
        user:users(id, full_name, email)
      `)
      .single()

    if (error) throw error
    return result
  }

  async getTimeEntries(filters: TimeTrackingFilters = {}): Promise<TimeEntry[]> {
    let query = this.supabase
      .from('time_entries')
      .select(`
        *,
        matter:matters(id, title, client_name),
        client_subscription:client_subscriptions(id, plan_name, client_name),
        user:users(id, full_name, email)
      `)

    // Apply filters
    if (filters.user_id) query = query.eq('user_id', filters.user_id)
    if (filters.entry_type) query = query.eq('entry_type', filters.entry_type)
    if (filters.entry_status) query = query.eq('entry_status', filters.entry_status)
    if (filters.matter_id) query = query.eq('matter_id', filters.matter_id)
    if (filters.client_subscription_id) query = query.eq('client_subscription_id', filters.client_subscription_id)
    if (filters.start_date) query = query.gte('entry_date', filters.start_date)
    if (filters.end_date) query = query.lte('entry_date', filters.end_date)
    if (filters.is_billable !== undefined) query = query.eq('is_billable', filters.is_billable)
    if (filters.min_duration) query = query.gte('duration_minutes', filters.min_duration)
    if (filters.max_duration) query = query.lte('duration_minutes', filters.max_duration)

    query = query.order('start_time', { ascending: false })

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  async getTimeEntry(id: string): Promise<TimeEntry> {
    const { data, error } = await this.supabase
      .from('time_entries')
      .select(`
        *,
        matter:matters(id, title, client_name),
        client_subscription:client_subscriptions(id, plan_name, client_name),
        user:users(id, full_name, email)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async deleteTimeEntry(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('time_entries')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  async approveTimeEntry(id: string, approvalNotes?: string): Promise<TimeEntry> {
    const { data, error } = await this.supabase
      .from('time_entries')
      .update({
        entry_status: 'approved',
        approved_at: new Date().toISOString(),
        approval_notes: approvalNotes
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async rejectTimeEntry(id: string, rejectionReason: string): Promise<TimeEntry> {
    const { data, error } = await this.supabase
      .from('time_entries')
      .update({
        entry_status: 'rejected',
        rejected_reason: rejectionReason
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // ===== TIME ENTRY TEMPLATES =====

  async createTimeEntryTemplate(data: TimeEntryTemplateFormData): Promise<TimeEntryTemplate> {
    const { data: result, error } = await this.supabase
      .from('time_entry_templates')
      .insert([data])
      .select()
      .single()

    if (error) throw error
    return result
  }

  async getTimeEntryTemplates(userId?: string, includeShared = true): Promise<TimeEntryTemplate[]> {
    let query = this.supabase
      .from('time_entry_templates')
      .select('*')
      .eq('is_active', true)

    if (userId) {
      if (includeShared) {
        query = query.or(`user_id.eq.${userId},is_shared.eq.true`)
      } else {
        query = query.eq('user_id', userId)
      }
    }

    query = query.order('usage_count', { ascending: false })

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  async useTemplate(templateId: string, customData?: Partial<TimeEntryFormData>): Promise<TimeEntryFormData> {
    const { data: template, error } = await this.supabase
      .from('time_entry_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (error) throw error

    // Update usage count
    await this.supabase
      .from('time_entry_templates')
      .update({
        usage_count: template.usage_count + 1,
        last_used_at: new Date().toISOString()
      })
      .eq('id', templateId)

    // Return template data as form data
    const templateData: TimeEntryFormData = {
      entry_type: template.default_entry_type,
      task_category: template.default_task_category,
      activity_description: template.default_activity_description,
      duration_minutes: template.default_duration_minutes,
      is_billable: template.default_is_billable,
      billable_rate: template.default_billable_rate,
      location: template.default_location,
      ...customData
    }

    return templateData
  }

  // ===== BILLING RATES =====

  async createBillingRate(data: LawyerBillingRateFormData): Promise<LawyerBillingRate> {
    const { data: result, error } = await this.supabase
      .from('lawyer_billing_rates')
      .insert([data])
      .select()
      .single()

    if (error) throw error
    return result
  }

  async getBillingRates(userId: string, rateType?: BillingRateType): Promise<LawyerBillingRate[]> {
    let query = this.supabase
      .from('lawyer_billing_rates')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (rateType) {
      query = query.eq('rate_type', rateType)
    }

    query = query.order('effective_from', { ascending: false })

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  async getEffectiveBillingRate(
    userId: string,
    date: string = new Date().toISOString(),
    context?: {
      matter_id?: string
      client_id?: string
      case_type_id?: string
      subscription_plan_id?: string
    }
  ): Promise<LawyerBillingRate | null> {
    let query = this.supabase
      .from('lawyer_billing_rates')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .lte('effective_from', date)
      .or(`effective_until.is.null,effective_until.gte.${date}`)

    // Apply context-specific filters in order of priority
    if (context?.matter_id) {
      query = query.eq('matter_id', context.matter_id)
    } else if (context?.client_id) {
      query = query.eq('client_id', context.client_id)
    } else if (context?.case_type_id) {
      query = query.eq('case_type_id', context.case_type_id)
    } else if (context?.subscription_plan_id) {
      query = query.eq('subscription_plan_id', context.subscription_plan_id)
    } else {
      query = query.eq('rate_type', 'standard')
    }

    query = query.order('effective_from', { ascending: false }).limit(1)

    const { data, error } = await query
    if (error) throw error
    return data?.[0] || null
  }

  // ===== SUBSCRIPTION TIME ALLOCATION =====

  async getSubscriptionTimeAllocation(
    subscriptionId: string,
    month: string
  ): Promise<SubscriptionTimeAllocation | null> {
    const { data, error } = await this.supabase
      .from('subscription_time_allocations')
      .select(`
        *,
        client_subscription:client_subscriptions(id, plan_name, client_name)
      `)
      .eq('client_subscription_id', subscriptionId)
      .eq('allocation_month', month)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async createSubscriptionTimeAllocation(
    subscriptionId: string,
    month: string,
    allocatedMinutes: number
  ): Promise<SubscriptionTimeAllocation> {
    const { data, error } = await this.supabase
      .from('subscription_time_allocations')
      .insert([{
        client_subscription_id: subscriptionId,
        allocation_month: month,
        total_minutes_allocated: allocatedMinutes
      }])
      .select(`
        *,
        client_subscription:client_subscriptions(id, plan_name, client_name)
      `)
      .single()

    if (error) throw error
    return data
  }

  // ===== DAILY SUMMARIES =====

  async getDailySummaries(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<DailyTimeSummary[]> {
    const { data, error } = await this.supabase
      .from('daily_time_summaries')
      .select(`
        *,
        user:users(id, full_name, email)
      `)
      .eq('user_id', userId)
      .gte('summary_date', startDate)
      .lte('summary_date', endDate)
      .order('summary_date', { ascending: false })

    if (error) throw error
    return data || []
  }

  async getTeamDailySummaries(
    lawFirmId: string,
    date: string
  ): Promise<DailyTimeSummary[]> {
    const { data, error } = await this.supabase
      .from('daily_time_summaries')
      .select(`
        *,
        user:users(id, full_name, email)
      `)
      .eq('law_firm_id', lawFirmId)
      .eq('summary_date', date)
      .order('total_minutes', { ascending: false })

    if (error) throw error
    return data || []
  }

  // ===== TIMER FUNCTIONALITY =====

  async startTimer(userId: string, entryData: Partial<TimeEntryFormData>): Promise<string> {
    // First, stop any existing active sessions
    await this.stopActiveTimers(userId)

    const { data, error } = await this.supabase
      .from('active_time_sessions')
      .insert([{
        user_id: userId,
        session_name: entryData.activity_description?.substring(0, 100),
        entry_type: entryData.entry_type || 'case_work',
        matter_id: entryData.matter_id,
        client_subscription_id: entryData.client_subscription_id,
        task_category: entryData.task_category,
        activity_description: entryData.activity_description,
        started_at: new Date().toISOString(),
        last_heartbeat: new Date().toISOString()
      }])
      .select('id')
      .single()

    if (error) throw error
    return data.id
  }

  async pauseTimer(sessionId: string): Promise<void> {
    const { error } = await this.supabase
      .from('active_time_sessions')
      .update({
        is_paused: true,
        paused_at: new Date().toISOString()
      })
      .eq('id', sessionId)

    if (error) throw error
  }

  async resumeTimer(sessionId: string): Promise<void> {
    // Calculate pause duration and add to total
    const { data: session, error: fetchError } = await this.supabase
      .from('active_time_sessions')
      .select('paused_at, pause_duration_minutes')
      .eq('id', sessionId)
      .single()

    if (fetchError) throw fetchError

    const pauseDuration = session.paused_at 
      ? Math.round((new Date().getTime() - new Date(session.paused_at).getTime()) / 60000)
      : 0

    const { error } = await this.supabase
      .from('active_time_sessions')
      .update({
        is_paused: false,
        paused_at: null,
        pause_duration_minutes: (session.pause_duration_minutes || 0) + pauseDuration,
        last_heartbeat: new Date().toISOString()
      })
      .eq('id', sessionId)

    if (error) throw error
  }

  async stopTimer(sessionId: string, saveEntry = true): Promise<TimeEntry | null> {
    const { data: session, error: fetchError } = await this.supabase
      .from('active_time_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (fetchError) throw fetchError

    const endTime = new Date()
    const startTime = new Date(session.started_at)
    const totalMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000)
    const effectiveMinutes = Math.max(0, totalMinutes - (session.pause_duration_minutes || 0))

    let timeEntry: TimeEntry | null = null

    if (saveEntry && effectiveMinutes > 0) {
      // Get effective billing rate
      const billingRate = await this.getEffectiveBillingRate(session.user_id, session.started_at, {
        matter_id: session.matter_id,
        client_subscription_id: session.client_subscription_id
      })

      const entryData: TimeEntryFormData = {
        entry_type: session.entry_type,
        matter_id: session.matter_id,
        client_subscription_id: session.client_subscription_id,
        task_category: session.task_category,
        activity_description: session.activity_description || 'Timer entry',
        start_time: session.started_at,
        end_time: endTime.toISOString(),
        duration_minutes: totalMinutes,
        break_minutes: session.pause_duration_minutes || 0,
        is_billable: true,
        billable_rate: billingRate?.hourly_rate,
        billing_rate_source: billingRate ? 'user_default' : 'custom'
      }

      timeEntry = await this.createTimeEntry(entryData)
    }

    // Delete the active session
    await this.supabase
      .from('active_time_sessions')
      .delete()
      .eq('id', sessionId)

    return timeEntry
  }

  async getCurrentSession(userId: string): Promise<ActiveTimeSession | null> {
    const { data, error } = await this.supabase
      .from('active_time_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async updateHeartbeat(sessionId: string): Promise<void> {
    const { error } = await this.supabase
      .from('active_time_sessions')
      .update({
        last_heartbeat: new Date().toISOString()
      })
      .eq('id', sessionId)

    if (error) throw error
  }

  private async stopActiveTimers(userId: string): Promise<void> {
    const { data: activeSessions } = await this.supabase
      .from('active_time_sessions')
      .select('id')
      .eq('user_id', userId)

    if (activeSessions && activeSessions.length > 0) {
      for (const session of activeSessions) {
        await this.stopTimer(session.id, false)
      }
    }
  }

  // ===== DASHBOARD DATA =====

  async getTimeTrackingDashboard(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<TimeTrackingDashboard> {
    // Get current period summary
    const { data: currentPeriodData } = await this.supabase
      .from('time_entries')
      .select('effective_minutes, billable_amount, is_billable')
      .eq('user_id', userId)
      .gte('entry_date', startDate)
      .lte('entry_date', endDate)

    const totalMinutes = currentPeriodData?.reduce((sum, entry) => sum + entry.effective_minutes, 0) || 0
    const billableMinutes = currentPeriodData?.filter(e => e.is_billable).reduce((sum, entry) => sum + entry.effective_minutes, 0) || 0
    const totalRevenue = currentPeriodData?.reduce((sum, entry) => sum + entry.billable_amount, 0) || 0

    // Get active session
    const activeSession = await this.getCurrentSession(userId)

    // Get recent entries
    const recentEntries = await this.getTimeEntries({
      user_id: userId,
      start_date: startDate,
      end_date: endDate
    })

    // Get daily breakdown (last 7 days)
    const dailySummaries = await this.getDailySummaries(userId, startDate, endDate)
    
    return {
      law_firm_id: '', // Will be populated by calling code
      user_id: userId,
      date_range: { start_date: startDate, end_date: endDate },
      current_period: {
        total_hours: totalMinutes / 60,
        billable_hours: billableMinutes / 60,
        utilization_rate: totalMinutes > 0 ? (billableMinutes / totalMinutes) * 100 : 0,
        total_revenue: totalRevenue
      },
      active_session: activeSession,
      recent_entries: recentEntries.slice(0, 10),
      daily_breakdown: dailySummaries.map(summary => ({
        date: summary.summary_date,
        total_minutes: summary.total_minutes,
        billable_minutes: summary.billable_minutes,
        entries_count: summary.total_entries
      })),
      top_activities: [], // Would need additional query
      client_breakdown: [], // Would need additional query
      subscription_summary: undefined // Would need additional query
    }
  }

  // ===== BILLING INTEGRATION =====

  async calculateTimeBasedBilling(
    timeEntries: TimeEntry[],
    matterId?: string,
    subscriptionId?: string
  ): Promise<TimeBasedBillingCalculation> {
    const billableEntries = timeEntries.filter(entry => entry.is_billable)
    
    const totalBillableHours = billableEntries.reduce((sum, entry) => 
      sum + (entry.effective_minutes / 60), 0
    )
    
    const totalBillableAmount = billableEntries.reduce((sum, entry) => 
      sum + entry.billable_amount, 0
    )

    // Group by rate for breakdown
    const rateGroups = billableEntries.reduce((groups, entry) => {
      const rate = entry.billable_rate || 0
      if (!groups[rate]) {
        groups[rate] = { rate, hours: 0, amount: 0, description: `Taxa R$ ${rate}/hora` }
      }
      groups[rate].hours += entry.effective_minutes / 60
      groups[rate].amount += entry.billable_amount
      return groups
    }, {} as Record<number, any>)

    return {
      matter_id: matterId,
      client_subscription_id: subscriptionId,
      time_entries: timeEntries,
      total_billable_hours: totalBillableHours,
      total_billable_amount: totalBillableAmount,
      rate_breakdown: Object.values(rateGroups),
      subtotal: totalBillableAmount,
      total_amount: totalBillableAmount
    }
  }

  // ===== METRICS AND ANALYTICS =====

  async getTimeTrackingMetrics(
    filters: TimeTrackingFilters
  ): Promise<TimeTrackingMetrics> {
    const entries = await this.getTimeEntries(filters)
    
    const totalEntries = entries.length
    const totalMinutes = entries.reduce((sum, entry) => sum + entry.effective_minutes, 0)
    const billableEntries = entries.filter(entry => entry.is_billable)
    const billableMinutes = billableEntries.reduce((sum, entry) => sum + entry.effective_minutes, 0)
    const nonBillableMinutes = totalMinutes - billableMinutes
    const totalAmount = billableEntries.reduce((sum, entry) => sum + entry.billable_amount, 0)
    
    return {
      total_entries: totalEntries,
      total_hours: totalMinutes / 60,
      billable_hours: billableMinutes / 60,
      non_billable_hours: nonBillableMinutes / 60,
      total_amount: totalAmount,
      average_hourly_rate: billableMinutes > 0 ? (totalAmount / (billableMinutes / 60)) : 0,
      utilization_rate: totalMinutes > 0 ? (billableMinutes / totalMinutes) * 100 : 0,
      productivity_score: this.calculateProductivityScore(entries)
    }
  }

  // ===== UTILITY METHODS =====

  private calculateDuration(startTime?: string, endTime?: string): number {
    if (!startTime || !endTime) return 0
    
    const start = new Date(startTime)
    const end = new Date(endTime)
    
    return Math.round((end.getTime() - start.getTime()) / 60000)
  }

  private calculateProductivityScore(entries: TimeEntry[]): number {
    // Simple productivity score based on various factors
    const avgEntryDuration = entries.length > 0 
      ? entries.reduce((sum, entry) => sum + entry.effective_minutes, 0) / entries.length 
      : 0
    
    const billableRatio = entries.length > 0 
      ? entries.filter(entry => entry.is_billable).length / entries.length 
      : 0
    
    // Score: 0-100 based on average entry duration (ideal ~60-120 min) and billable ratio
    const durationScore = Math.min(100, Math.max(0, (avgEntryDuration - 30) / 90 * 100))
    const billableScore = billableRatio * 100
    
    return Math.round((durationScore + billableScore) / 2)
  }

  // Timer controls object
  getTimerControls(): TimerControls {
    return {
      start: this.startTimer.bind(this),
      pause: this.pauseTimer.bind(this),
      resume: this.resumeTimer.bind(this),
      stop: this.stopTimer.bind(this),
      get_current_session: this.getCurrentSession.bind(this),
      update_heartbeat: this.updateHeartbeat.bind(this)
    }
  }
}

// Export singleton instance
export const timeTrackingService = new TimeTrackingService()
export default timeTrackingService