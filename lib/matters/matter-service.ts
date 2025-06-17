// =====================================================
// MATTER SERVICE LAYER
// Database operations for legal matter management
// =====================================================

import { createClient } from '@/lib/supabase/client'

export interface Matter {
  id: string
  law_firm_id: string
  matter_type_id: string
  matter_number: string
  title: string
  description?: string
  court_name?: string
  court_city?: string
  court_state?: string
  process_number?: string
  opposing_party?: string
  status: 'active' | 'on_hold' | 'closed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  opened_date: string
  closed_date?: string
  billing_method: 'hourly' | 'flat_fee' | 'contingency' | 'hybrid'
  hourly_rate?: number
  flat_fee?: number
  contingency_percentage?: number
  minimum_fee?: number
  total_billed: number
  total_paid: number
  outstanding_balance: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface MatterFormData {
  matter_type_id: string
  title: string
  description?: string
  court_name?: string
  court_city?: string
  court_state?: string
  process_number?: string
  opposing_party?: string
  status: 'active' | 'on_hold' | 'closed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  opened_date: string
  billing_method: 'hourly' | 'flat_fee' | 'contingency' | 'hybrid'
  hourly_rate?: number
  flat_fee?: number
  contingency_percentage?: number
  minimum_fee?: number
  notes?: string
}

export interface MatterStats {
  total_matters: number
  active_matters: number
  on_hold_matters: number
  closed_matters: number
  cancelled_matters: number
  total_billed: number
  total_paid: number
  outstanding_balance: number
}

export class MatterService {
  private supabase = createClient()

  /**
   * Get all matters for a law firm
   */
  async getMatters(lawFirmId: string): Promise<Matter[]> {
    try {
      const { data, error } = await this.supabase
        .from('matters')
        .select(`
          *,
          matter_types(name),
          matter_contacts(
            contacts(name, cpf_cnpj)
          )
        `)
        .eq('law_firm_id', lawFirmId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching matters:', error)
        throw new Error('Failed to fetch matters')
      }

      return data || []
    } catch (error) {
      console.error('Error fetching matters:', error)
      throw error
    }
  }

  /**
   * Get a single matter by ID
   */
  async getMatter(matterId: string): Promise<Matter | null> {
    try {
      const { data, error } = await this.supabase
        .from('matters')
        .select(`
          *,
          matter_types(name),
          matter_contacts(
            contacts(name, cpf_cnpj, email, phone)
          ),
          time_entries(
            id,
            description,
            hours_worked,
            hourly_rate,
            total_amount,
            work_date,
            is_billable,
            is_billed
          ),
          tasks(
            id,
            title,
            description,
            status,
            priority,
            due_date
          )
        `)
        .eq('id', matterId)
        .single()

      if (error && error.code !== 'PGRST116') { // Not found is OK
        console.error('Error fetching matter:', error)
        throw new Error('Failed to fetch matter')
      }

      return data || null
    } catch (error) {
      console.error('Error fetching matter:', error)
      throw error
    }
  }

  /**
   * Create a new matter
   */
  async createMatter(lawFirmId: string, matterData: MatterFormData): Promise<Matter> {
    try {
      // Generate matter number
      const matterNumber = await this.generateMatterNumber(lawFirmId)
      
      const { data: newMatter, error } = await this.supabase
        .from('matters')
        .insert({
          law_firm_id: lawFirmId,
          matter_number: matterNumber,
          ...matterData,
          total_billed: 0,
          total_paid: 0,
          outstanding_balance: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error || !newMatter) {
        console.error('Error creating matter:', error)
        throw new Error('Failed to create matter')
      }

      return newMatter
    } catch (error) {
      console.error('Error creating matter:', error)
      throw error
    }
  }

  /**
   * Update an existing matter
   */
  async updateMatter(matterId: string, matterData: Partial<MatterFormData>): Promise<Matter> {
    try {
      const { data: updatedMatter, error } = await this.supabase
        .from('matters')
        .update({
          ...matterData,
          updated_at: new Date().toISOString()
        })
        .eq('id', matterId)
        .select()
        .single()

      if (error || !updatedMatter) {
        console.error('Error updating matter:', error)
        throw new Error('Failed to update matter')
      }

      return updatedMatter
    } catch (error) {
      console.error('Error updating matter:', error)
      throw error
    }
  }

  /**
   * Delete a matter (soft delete)
   */
  async deleteMatter(matterId: string): Promise<void> {
    try {
      // Check if matter has time entries or invoices
      const { data: timeEntries } = await this.supabase
        .from('time_entries')
        .select('id')
        .eq('matter_id', matterId)
        .limit(1)

      if (timeEntries && timeEntries.length > 0) {
        throw new Error('Cannot delete matter with time entries')
      }

      // Update status to cancelled instead of deleting
      const { error } = await this.supabase
        .from('matters')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', matterId)

      if (error) {
        console.error('Error deleting matter:', error)
        throw new Error('Failed to delete matter')
      }
    } catch (error) {
      console.error('Error deleting matter:', error)
      throw error
    }
  }

  /**
   * Get matter statistics
   */
  async getMatterStats(lawFirmId: string): Promise<MatterStats> {
    try {
      const { data, error } = await this.supabase
        .from('matter_stats_view')
        .select('*')
        .eq('law_firm_id', lawFirmId)
        .single()

      if (error) {
        console.error('Error getting matter stats:', error)
        throw new Error('Failed to get matter statistics')
      }

      return data
    } catch (error) {
      console.error('Error getting matter stats:', error)
      throw error
    }
  }

  /**
   * Search matters
   */
  async searchMatters(lawFirmId: string, searchTerm: string): Promise<Matter[]> {
    try {
      const { data, error } = await this.supabase
        .from('matters')
        .select('*')
        .eq('law_firm_id', lawFirmId)
        .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,matter_number.ilike.%${searchTerm}%,process_number.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error searching matters:', error)
        throw new Error('Failed to search matters')
      }

      return data || []
    } catch (error) {
      console.error('Error searching matters:', error)
      throw error
    }
  }

  /**
   * Generate next matter number
   */
  private async generateMatterNumber(lawFirmId: string): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .from('matters')
        .select('matter_number')
        .eq('law_firm_id', lawFirmId)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) {
        console.error('Error generating matter number:', error)
        throw new Error('Failed to generate matter number')
      }

      const currentYear = new Date().getFullYear()
      let nextNumber = 1

      if (data && data.length > 0 && data[0].matter_number) {
        const lastNumber = data[0].matter_number
        const match = lastNumber.match(/MAT-(\d{4})-(\d{4})/)
        
        if (match && parseInt(match[1]) === currentYear) {
          nextNumber = parseInt(match[2]) + 1
        }
      }

      return `MAT-${currentYear}-${nextNumber.toString().padStart(4, '0')}`
    } catch (error) {
      console.error('Error generating matter number:', error)
      // Fallback to timestamp-based number
      return `MAT-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`
    }
  }

  /**
   * Link client to matter
   */
  async linkClientToMatter(matterId: string, clientId: string, role: string = 'client'): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('matter_contacts')
        .insert({
          matter_id: matterId,
          contact_id: clientId,
          role: role,
          created_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error linking client to matter:', error)
        throw new Error('Failed to link client to matter')
      }
    } catch (error) {
      console.error('Error linking client to matter:', error)
      throw error
    }
  }

  /**
   * Update matter billing totals
   */
  async updateMatterBilling(matterId: string): Promise<void> {
    try {
      // This will be updated by database triggers in production
      const { error } = await this.supabase.rpc('update_matter_billing_totals', {
        matter_id: matterId
      })

      if (error) {
        console.error('Error updating matter billing:', error)
      }
    } catch (error) {
      console.error('Error updating matter billing:', error)
    }
  }
}

// Export singleton instance
export const matterService = new MatterService()