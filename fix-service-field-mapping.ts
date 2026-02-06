/**
 * ============================================================================
 * PRIMA FACIE - SERVICE LAYER FIELD MAPPING FIXES
 * ============================================================================
 * Purpose: Fix TypeScript service layer to work with corrected database schema
 * Must be applied AFTER running fix-database-schema-mapping.sql
 * ============================================================================
 */

// ============================================================================
// SECTION 1: FIELD MAPPING UTILITIES
// ============================================================================

/**
 * Maps Portuguese frontend client status to English database values
 */
export function mapClientStatus(frontendStatus: string): string {
  const statusMap: Record<string, string> = {
    'ativo': 'active',
    'inativo': 'inactive', 
    'prospecto': 'prospect'
  }
  return statusMap[frontendStatus] || 'prospect'
}

/**
 * Maps Portuguese frontend contact type to English database values
 */
export function mapContactType(frontendType: string): string {
  const typeMap: Record<string, string> = {
    'pessoa_fisica': 'individual',
    'pessoa_juridica': 'company'
  }
  return typeMap[frontendType] || 'individual'
}

/**
 * Maps Portuguese frontend matter status to English database values
 */
export function mapMatterStatus(frontendStatus: string): string {
  const statusMap: Record<string, string> = {
    'novo': 'active',
    'analise': 'on_hold',
    'ativo': 'active',
    'suspenso': 'on_hold',
    'aguardando_cliente': 'on_hold',
    'aguardando_documentos': 'on_hold',
    'finalizado': 'closed'
  }
  return statusMap[frontendStatus] || 'active'
}

/**
 * Maps Portuguese frontend matter priority to English database values
 */
export function mapMatterPriority(frontendPriority: string): string {
  const priorityMap: Record<string, string> = {
    'baixa': 'low',
    'media': 'medium',
    'alta': 'high',
    'urgente': 'urgent'
  }
  return priorityMap[frontendPriority] || 'medium'
}

/**
 * Maps English database values back to Portuguese for frontend display
 */
export function mapStatusToPortuguese(dbStatus: string): string {
  const statusMap: Record<string, string> = {
    'active': 'Ativo',
    'inactive': 'Inativo',
    'prospect': 'Prospecto',
    'former': 'Ex-cliente',
    'closed': 'Finalizado',
    'on_hold': 'Suspenso',
    'settled': 'Acordo',
    'dismissed': 'Arquivado'
  }
  return statusMap[dbStatus] || dbStatus
}

/**
 * Maps English database contact type back to Portuguese for frontend display
 */
export function mapTypeToPortuguese(dbType: string): string {
  const typeMap: Record<string, string> = {
    'individual': 'Pessoa Física',
    'company': 'Pessoa Jurídica',
    'lead': 'Lead',
    'vendor': 'Fornecedor',
    'court': 'Tribunal'
  }
  return typeMap[dbType] || dbType
}

/**
 * Maps English database priority back to Portuguese for frontend display
 */
export function mapPriorityToPortuguese(dbPriority: string): string {
  const priorityMap: Record<string, string> = {
    'low': 'Baixa',
    'medium': 'Média', 
    'high': 'Alta',
    'urgent': 'Urgente'
  }
  return priorityMap[dbPriority] || dbPriority
}

// ============================================================================
// SECTION 2: UPDATED TYPE DEFINITIONS
// ============================================================================

/**
 * Updated Client form data interface
 */
export interface ClientFormData {
  name: string
  type: 'pessoa_fisica' | 'pessoa_juridica'
  cpf?: string
  cnpj?: string
  status: 'ativo' | 'inativo' | 'prospecto'
  email?: string
  phone?: string
  address?: string
  legal_name?: string // For companies
  trade_name?: string // For companies
  portal_enabled?: boolean
}

/**
 * Updated Matter form data interface
 */
export interface MatterFormData {
  title: string
  description?: string
  status: 'novo' | 'analise' | 'ativo' | 'suspenso' | 'aguardando_cliente' | 'aguardando_documentos' | 'finalizado'
  priority: 'baixa' | 'media' | 'alta' | 'urgente'
  client_id: string
  area_juridica?: string
  processo_numero?: string
  vara_tribunal?: string
  comarca?: string
  case_value?: number
  probability_success?: number
  next_action?: string
}

/**
 * Database-ready client data interface
 */
export interface ClientDbData {
  law_firm_id: string
  contact_type: 'individual' | 'company'
  client_status: 'prospect' | 'active' | 'inactive' | 'former'
  client_number: string
  full_name: string
  cpf?: string | null
  cnpj?: string | null
  email?: string
  phone?: string
  address?: string
  legal_name?: string
  trade_name?: string
  portal_enabled: boolean
  created_at: string
  updated_at: string
}

/**
 * Database-ready matter data interface
 */
export interface MatterDbData {
  law_firm_id: string
  title: string
  description?: string
  status: 'active' | 'closed' | 'on_hold' | 'settled' | 'dismissed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  area_juridica?: string
  process_number?: string
  court_name?: string
  court_city?: string
  case_value?: number
  probability_success?: number
  next_action?: string
  created_at: string
  updated_at: string
}

// ============================================================================
// SECTION 3: UPDATED CLIENT SERVICE METHODS
// ============================================================================

/**
 * Transforms frontend client form data to database-ready format
 */
export function transformClientFormToDb(
  lawFirmId: string,
  clientData: ClientFormData,
  clientNumber?: string
): ClientDbData {
  return {
    law_firm_id: lawFirmId,
    contact_type: mapContactType(clientData.type),
    client_status: mapClientStatus(clientData.status),
    client_number: clientNumber || generateClientNumber(),
    full_name: clientData.name,
    cpf: clientData.type === 'pessoa_fisica' ? clientData.cpf || null : null,
    cnpj: clientData.type === 'pessoa_juridica' ? clientData.cnpj || null : null,
    email: clientData.email,
    phone: clientData.phone,
    address: clientData.address,
    legal_name: clientData.legal_name,
    trade_name: clientData.trade_name,
    portal_enabled: clientData.portal_enabled || false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

/**
 * Transforms database client data to frontend display format
 */
export function transformClientDbToDisplay(dbClient: any) {
  return {
    ...dbClient,
    type_display: mapTypeToPortuguese(dbClient.contact_type),
    status_display: mapStatusToPortuguese(dbClient.client_status),
    document_number: dbClient.cpf || dbClient.cnpj,
    document_type: dbClient.cpf ? 'CPF' : 'CNPJ'
  }
}

// ============================================================================
// SECTION 4: UPDATED MATTER SERVICE METHODS
// ============================================================================

/**
 * Transforms frontend matter form data to database-ready format
 */
export function transformMatterFormToDb(
  lawFirmId: string,
  matterData: MatterFormData
): MatterDbData {
  return {
    law_firm_id: lawFirmId,
    title: matterData.title,
    description: matterData.description,
    status: mapMatterStatus(matterData.status),
    priority: mapMatterPriority(matterData.priority),
    area_juridica: matterData.area_juridica,
    process_number: matterData.processo_numero,
    court_name: matterData.vara_tribunal,
    court_city: matterData.comarca,
    case_value: matterData.case_value,
    probability_success: matterData.probability_success,
    next_action: matterData.next_action,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

/**
 * Transforms database matter data to frontend display format
 */
export function transformMatterDbToDisplay(dbMatter: any) {
  return {
    ...dbMatter,
    status_display: mapStatusToPortuguese(dbMatter.status),
    priority_display: mapPriorityToPortuguese(dbMatter.priority),
    case_value_formatted: dbMatter.case_value 
      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dbMatter.case_value)
      : null,
    probability_display: dbMatter.probability_success 
      ? `${dbMatter.probability_success}%`
      : null
  }
}

// ============================================================================
// SECTION 5: CLIENT NUMBER GENERATION
// ============================================================================

/**
 * Generates a unique client number (format: CLI-YYYY-NNNN)
 */
function generateClientNumber(): string {
  const year = new Date().getFullYear()
  const randomNum = Math.floor(Math.random() * 9999) + 1
  return `CLI-${year}-${randomNum.toString().padStart(4, '0')}`
}

// ============================================================================
// SECTION 6: VALIDATION HELPERS
// ============================================================================

/**
 * Validates client form data before submission
 */
export function validateClientFormData(data: ClientFormData): string[] {
  const errors: string[] = []

  if (!data.name?.trim()) {
    errors.push('Nome é obrigatório')
  }

  if (data.type === 'pessoa_fisica' && !data.cpf) {
    errors.push('CPF é obrigatório para pessoa física')
  }

  if (data.type === 'pessoa_juridica' && !data.cnpj) {
    errors.push('CNPJ é obrigatório para pessoa jurídica')
  }

  if (!['ativo', 'inativo', 'prospecto'].includes(data.status)) {
    errors.push('Status inválido')
  }

  return errors
}

/**
 * Validates matter form data before submission
 */
export function validateMatterFormData(data: MatterFormData): string[] {
  const errors: string[] = []

  if (!data.title?.trim()) {
    errors.push('Título é obrigatório')
  }

  if (!data.client_id) {
    errors.push('Cliente é obrigatório')
  }

  if (!['novo', 'analise', 'ativo', 'suspenso', 'aguardando_cliente', 'aguardando_documentos', 'finalizado'].includes(data.status)) {
    errors.push('Status inválido')
  }

  if (!['baixa', 'media', 'alta', 'urgente'].includes(data.priority)) {
    errors.push('Prioridade inválida')
  }

  if (data.case_value && data.case_value < 0) {
    errors.push('Valor do caso não pode ser negativo')
  }

  if (data.probability_success && (data.probability_success < 0 || data.probability_success > 100)) {
    errors.push('Probabilidade de sucesso deve estar entre 0 e 100')
  }

  return errors
}

// ============================================================================
// SECTION 7: SUPABASE QUERY HELPERS
// ============================================================================

/**
 * Supabase query to get clients with Portuguese labels
 */
export const getClientsWithLabelsQuery = `
  SELECT 
    c.*,
    CASE c.contact_type
      WHEN 'individual' THEN 'Pessoa Física'
      WHEN 'company' THEN 'Pessoa Jurídica'
      ELSE c.contact_type
    END as type_display,
    CASE c.client_status
      WHEN 'prospect' THEN 'Prospecto'
      WHEN 'active' THEN 'Ativo'
      WHEN 'inactive' THEN 'Inativo'
      WHEN 'former' THEN 'Ex-cliente'
      ELSE c.client_status
    END as status_display
  FROM contacts c
  WHERE c.contact_type IN ('individual', 'company')
  ORDER BY c.created_at DESC
`

/**
 * Supabase query to get matters with Portuguese labels
 */
export const getMattersWithLabelsQuery = `
  SELECT 
    m.*,
    CASE m.status
      WHEN 'active' THEN 'Ativo'
      WHEN 'closed' THEN 'Finalizado'
      WHEN 'on_hold' THEN 'Suspenso'
      WHEN 'settled' THEN 'Acordo'
      WHEN 'dismissed' THEN 'Arquivado'
      ELSE m.status
    END as status_display,
    CASE m.priority
      WHEN 'low' THEN 'Baixa'
      WHEN 'medium' THEN 'Média'
      WHEN 'high' THEN 'Alta'
      WHEN 'urgent' THEN 'Urgente'
      ELSE m.priority
    END as priority_display
  FROM matters m
  ORDER BY m.created_at DESC
`

// ============================================================================
// EXPORT ALL UTILITIES
// ============================================================================

export {
  // Mapping functions
  mapClientStatus,
  mapContactType, 
  mapMatterStatus,
  mapMatterPriority,
  mapStatusToPortuguese,
  mapTypeToPortuguese,
  mapPriorityToPortuguese,
  
  // Transform functions
  transformClientFormToDb,
  transformClientDbToDisplay,
  transformMatterFormToDb,
  transformMatterDbToDisplay,
  
  // Validation functions
  validateClientFormData,
  validateMatterFormData,
  
  // Query helpers
  getClientsWithLabelsQuery,
  getMattersWithLabelsQuery
}

/**
 * ============================================================================
 * IMPLEMENTATION INSTRUCTIONS
 * ============================================================================
 * 
 * 1. First, execute fix-database-schema-mapping.sql in your Supabase database
 * 
 * 2. Update /lib/clients/client-service.ts to import and use:
 *    - transformClientFormToDb()
 *    - transformClientDbToDisplay()
 *    - validateClientFormData()
 * 
 * 3. Update /lib/matters/matter-service.ts to import and use:
 *    - transformMatterFormToDb()
 *    - transformMatterDbToDisplay()
 *    - validateMatterFormData()
 * 
 * 4. Update form components to use validation helpers
 * 
 * 5. Test form submissions to ensure fields map correctly
 * 
 * 6. Update TypeScript interfaces in the codebase to match new definitions
 * 
 * ============================================================================
 */