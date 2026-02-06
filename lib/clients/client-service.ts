// =====================================================
// CLIENT SERVICE LAYER
// Database operations for client management
// =====================================================

import { createClient } from '@/lib/supabase/client'

// Field mapping utilities
function mapClientStatus(frontendStatus: string): string {
  const statusMap: Record<string, string> = {
    'ativo': 'active',
    'inativo': 'inactive', 
    'prospecto': 'prospect'
  }
  return statusMap[frontendStatus] || 'prospect'
}

function mapContactType(frontendType: string): string {
  const typeMap: Record<string, string> = {
    'pessoa_fisica': 'individual',
    'pessoa_juridica': 'company'
  }
  return typeMap[frontendType] || 'individual'
}

function mapStatusToPortuguese(dbStatus: string): string {
  const statusMap: Record<string, string> = {
    'active': 'ativo',
    'inactive': 'inativo',
    'prospect': 'prospecto',
    'former': 'inativo'
  }
  return statusMap[dbStatus] || dbStatus
}

function mapTypeToPortuguese(dbType: string): string {
  const typeMap: Record<string, string> = {
    'individual': 'pessoa_fisica',
    'company': 'pessoa_juridica'
  }
  return typeMap[dbType] || dbType
}

export interface Client {
  id: string
  law_firm_id: string
  client_number: string
  name: string
  type: 'pessoa_fisica' | 'pessoa_juridica'
  cpf?: string
  cnpj?: string
  email: string
  phone?: string
  mobile?: string
  status: 'ativo' | 'inativo' | 'prospecto'
  client_since: string
  address_street?: string
  address_number?: string
  address_city?: string
  address_state?: string
  address_zipcode?: string
  notes?: string
  portal_enabled: boolean
  created_at: string
  updated_at: string
}

export interface ClientFormData {
  name: string
  type: 'pessoa_fisica' | 'pessoa_juridica'
  cpf?: string
  cnpj?: string
  email: string
  phone?: string
  mobile?: string
  status: 'ativo' | 'inativo' | 'prospecto'
  address_street?: string
  address_number?: string
  address_city?: string
  address_state?: string
  address_zipcode?: string
  notes?: string
  portal_enabled: boolean
}

export interface ClientStats {
  total_clients: number
  active_clients: number
  inactive_clients: number
  prospects: number
  total_matters: number
  active_matters: number
}

export class ClientService {
  private supabase = createClient()

  /**
   * Get all clients for a law firm
   */
  async getClients(lawFirmId: string): Promise<Client[]> {
    try {
      const { data, error } = await this.supabase
        .from('contacts')
        .select(`
          *,
          matter_contacts!inner(
            matters(id, status)
          )
        `)
        .eq('law_firm_id', lawFirmId)
        .in('contact_type', ['individual', 'company'])
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching clients:', error)
        throw new Error('Failed to fetch clients')
      }

      return data || []
    } catch (error) {
      console.error('Error fetching clients:', error)
      throw error
    }
  }

  /**
   * Get a single client by ID
   */
  async getClient(clientId: string): Promise<Client | null> {
    try {
      const { data, error } = await this.supabase
        .from('contacts')
        .select(`
          *,
          matter_contacts(
            matters(
              id,
              matter_number,
              title,
              status,
              opened_date,
              billing_method,
              total_billed,
              total_paid
            )
          )
        `)
        .eq('id', clientId)
        .in('contact_type', ['individual', 'company'])
        .single()

      if (error && error.code !== 'PGRST116') { // Not found is OK
        console.error('Error fetching client:', error)
        throw new Error('Failed to fetch client')
      }

      return data || null
    } catch (error) {
      console.error('Error fetching client:', error)
      throw error
    }
  }

  /**
   * Create a new client
   */
  async createClient(lawFirmId: string, clientData: ClientFormData): Promise<Client> {
    try {
      // Generate client number
      const clientNumber = await this.generateClientNumber(lawFirmId)
      
      const { data: newClient, error } = await this.supabase
        .from('contacts')
        .insert({
          law_firm_id: lawFirmId,
          contact_type: mapContactType(clientData.type),
          client_status: mapClientStatus(clientData.status),
          client_number: clientNumber,
          full_name: clientData.name,
          cpf: clientData.type === 'pessoa_fisica' ? clientData.cpf || null : null,
          cnpj: clientData.type === 'pessoa_juridica' ? clientData.cnpj || null : null,
          email: clientData.email,
          phone: clientData.phone,
          mobile: clientData.mobile,
          address_street: clientData.address_street,
          address_number: clientData.address_number,
          address_city: clientData.address_city,
          address_state: clientData.address_state,
          address_zipcode: clientData.address_zipcode,
          notes: clientData.notes,
          portal_enabled: clientData.portal_enabled || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error || !newClient) {
        console.error('Error creating client:', error)
        throw new Error('Failed to create client')
      }

      return newClient
    } catch (error) {
      console.error('Error creating client:', error)
      throw error
    }
  }

  /**
   * Update an existing client
   */
  async updateClient(clientId: string, clientData: Partial<ClientFormData>): Promise<Client> {
    try {
      const updateData = {
        ...clientData,
        updated_at: new Date().toISOString()
      }

      // Handle field mapping
      if (clientData.type) {
        updateData.contact_type = mapContactType(clientData.type)
      }
      if (clientData.status) {
        updateData.client_status = mapClientStatus(clientData.status)
      }
      if (clientData.name) {
        updateData.full_name = clientData.name
      }
      if (clientData.type === 'pessoa_fisica' && clientData.cpf) {
        updateData.cpf = clientData.cpf
        updateData.cnpj = null
      } else if (clientData.type === 'pessoa_juridica' && clientData.cnpj) {
        updateData.cnpj = clientData.cnpj
        updateData.cpf = null
      }

      const { data: updatedClient, error } = await this.supabase
        .from('contacts')
        .update(updateData)
        .eq('id', clientId)
        .select()
        .single()

      if (error || !updatedClient) {
        console.error('Error updating client:', error)
        throw new Error('Failed to update client')
      }

      return updatedClient
    } catch (error) {
      console.error('Error updating client:', error)
      throw error
    }
  }

  /**
   * Delete a client (soft delete)
   */
  async deleteClient(clientId: string): Promise<void> {
    try {
      // Check if client has active matters
      const { data: activeMatters } = await this.supabase
        .from('matter_contacts')
        .select('matters!inner(id)')
        .eq('contact_id', clientId)
        .eq('matters.status', 'active')

      if (activeMatters && activeMatters.length > 0) {
        throw new Error('Cannot delete client with active matters')
      }

      // Soft delete by setting status to inactive
      const { error } = await this.supabase
        .from('contacts')
        .update({ 
          client_status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId)

      if (error) {
        console.error('Error deleting client:', error)
        throw new Error('Failed to delete client')
      }
    } catch (error) {
      console.error('Error deleting client:', error)
      throw error
    }
  }

  /**
   * Get client statistics
   */
  async getClientStats(lawFirmId: string): Promise<ClientStats> {
    try {
      const { data, error } = await this.supabase
        .from('client_stats_view')
        .select('*')
        .eq('law_firm_id', lawFirmId)
        .single()

      if (error) {
        console.error('Error getting client stats:', error)
        throw new Error('Failed to get client statistics')
      }

      return data
    } catch (error) {
      console.error('Error getting client stats:', error)
      throw error
    }
  }

  /**
   * Search clients
   */
  async searchClients(lawFirmId: string, searchTerm: string): Promise<Client[]> {
    try {
      const { data, error } = await this.supabase
        .from('contacts')
        .select('*')
        .eq('law_firm_id', lawFirmId)
        .in('contact_type', ['individual', 'company'])
        .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,cpf.ilike.%${searchTerm}%,cnpj.ilike.%${searchTerm}%`)
        .order('name')

      if (error) {
        console.error('Error searching clients:', error)
        throw new Error('Failed to search clients')
      }

      return data || []
    } catch (error) {
      console.error('Error searching clients:', error)
      throw error
    }
  }

  /**
   * Generate next client number
   */
  private async generateClientNumber(lawFirmId: string): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .from('contacts')
        .select('client_number')
        .eq('law_firm_id', lawFirmId)
        .in('contact_type', ['individual', 'company'])
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) {
        console.error('Error generating client number:', error)
        throw new Error('Failed to generate client number')
      }

      const currentYear = new Date().getFullYear()
      let nextNumber = 1

      if (data && data.length > 0 && data[0].client_number) {
        const lastNumber = data[0].client_number
        const match = lastNumber.match(/CLI-(\d{4})-(\d{3})/)
        
        if (match && parseInt(match[1]) === currentYear) {
          nextNumber = parseInt(match[2]) + 1
        }
      }

      return `CLI-${currentYear}-${nextNumber.toString().padStart(3, '0')}`
    } catch (error) {
      console.error('Error generating client number:', error)
      // Fallback to timestamp-based number
      return `CLI-${new Date().getFullYear()}-${Date.now().toString().slice(-3)}`
    }
  }

  /**
   * Validate CPF format
   */
  validateCPF(cpf: string): boolean {
    cpf = cpf.replace(/[^\d]/g, '')
    
    if (cpf.length !== 11) return false
    if (/^(\d)\1{10}$/.test(cpf)) return false

    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf[i]) * (10 - i)
    }
    let digit1 = (sum * 10) % 11
    if (digit1 === 10) digit1 = 0
    if (digit1 !== parseInt(cpf[9])) return false

    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf[i]) * (11 - i)
    }
    let digit2 = (sum * 10) % 11
    if (digit2 === 10) digit2 = 0
    if (digit2 !== parseInt(cpf[10])) return false

    return true
  }

  /**
   * Validate CNPJ format
   */
  validateCNPJ(cnpj: string): boolean {
    cnpj = cnpj.replace(/[^\d]/g, '')
    
    if (cnpj.length !== 14) return false
    if (/^(\d)\1{13}$/.test(cnpj)) return false

    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

    let sum = 0
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cnpj[i]) * weights1[i]
    }
    let digit1 = sum % 11 < 2 ? 0 : 11 - (sum % 11)
    if (digit1 !== parseInt(cnpj[12])) return false

    sum = 0
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cnpj[i]) * weights2[i]
    }
    let digit2 = sum % 11 < 2 ? 0 : 11 - (sum % 11)
    if (digit2 !== parseInt(cnpj[13])) return false

    return true
  }

  /**
   * Format CPF
   */
  formatCPF(cpf: string): string {
    cpf = cpf.replace(/[^\d]/g, '')
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  /**
   * Format CNPJ
   */
  formatCNPJ(cnpj: string): string {
    cnpj = cnpj.replace(/[^\d]/g, '')
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }
}

// Export singleton instance
export const clientService = new ClientService()