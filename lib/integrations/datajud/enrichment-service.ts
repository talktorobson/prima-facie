// =====================================================
// DataJud Case Enrichment Service
// Comprehensive case data enrichment and synchronization
// =====================================================

import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'
import { getDataJudApi, DataJudProcesso, DataJudMovement } from './api'

type SupabaseClient = ReturnType<typeof createClient<Database>>

export interface EnrichmentOptions {
  force_update?: boolean
  include_timeline?: boolean
  include_participants?: boolean
  include_legal_subjects?: boolean
  confidence_threshold?: number
}

export interface EnrichmentResult {
  success: boolean
  case_id: string
  enriched_fields: string[]
  conflicts: Array<{
    field: string
    existing_value: any
    datajud_value: any
    action_taken: 'keep_existing' | 'update_with_datajud' | 'flag_for_review'
  }>
  confidence_score: number
  timeline_events_added: number
  participants_added: number
  legal_subjects_added: number
  errors: string[]
}

export interface DataConflict {
  field_name: string
  existing_value: any
  datajud_value: any
  conflict_type: 'value_mismatch' | 'format_difference' | 'missing_data'
  resolution_strategy: 'manual_review' | 'prefer_existing' | 'prefer_datajud' | 'merge'
  confidence_impact: number
}

class DataJudEnrichmentService {
  private supabase: SupabaseClient
  private dataJudApi: ReturnType<typeof getDataJudApi>

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient
    this.dataJudApi = getDataJudApi()
  }

  /**
   * Enrich a single case with DataJud data
   */
  async enrichCase(
    caseId: string, 
    lawFirmId: string, 
    options: EnrichmentOptions = {}
  ): Promise<EnrichmentResult> {
    const result: EnrichmentResult = {
      success: false,
      case_id: caseId,
      enriched_fields: [],
      conflicts: [],
      confidence_score: 0,
      timeline_events_added: 0,
      participants_added: 0,
      legal_subjects_added: 0,
      errors: []
    }

    try {
      // Get existing case data
      const { data: existingCase, error: caseError } = await this.supabase
        .from('matters')
        .select('*')
        .eq('id', caseId)
        .eq('law_firm_id', lawFirmId)
        .single()

      if (caseError || !existingCase) {
        result.errors.push('Case not found or access denied')
        return result
      }

      // Check if enrichment already exists (unless forced)
      if (!options.force_update) {
        const { data: existingEnrichment } = await this.supabase
          .from('datajud_case_details')
          .select('*')
          .eq('matter_id', caseId)
          .eq('law_firm_id', lawFirmId)
          .single()

        if (existingEnrichment && existingEnrichment.enrichment_status === 'completed') {
          // Return existing data unless forced update
          result.success = true
          result.confidence_score = Number(existingEnrichment.enrichment_confidence) || 0
          return result
        }
      }

      // Search DataJud for case information
      const processNumber = existingCase.process_number
      if (!processNumber) {
        result.errors.push('No process number available for DataJud search')
        return result
      }

      const dataJudProcesses = await this.dataJudApi.searchByProcessNumber(processNumber)
      
      if (!dataJudProcesses || dataJudProcesses.length === 0) {
        result.errors.push('No matching process found in DataJud')
        return result
      }

      // Use the first matching process (most relevant)
      const dataJudProcess = dataJudProcesses[0]

      // Enrich case details
      const enrichmentData = await this.enrichCaseDetails(
        caseId, 
        lawFirmId, 
        existingCase, 
        dataJudProcess,
        options
      )

      result.enriched_fields = enrichmentData.enriched_fields
      result.conflicts = enrichmentData.conflicts
      result.confidence_score = enrichmentData.confidence_score

      // Enrich timeline if requested
      if (options.include_timeline !== false) {
        const timelineResult = await this.enrichTimeline(
          enrichmentData.datajud_case_detail_id,
          lawFirmId,
          dataJudProcess
        )
        result.timeline_events_added = timelineResult.events_added
        if (timelineResult.errors.length > 0) {
          result.errors.push(...timelineResult.errors)
        }
      }

      // Enrich participants if requested
      if (options.include_participants !== false && dataJudProcess.participantes) {
        const participantsResult = await this.enrichParticipants(
          enrichmentData.datajud_case_detail_id,
          lawFirmId,
          dataJudProcess.participantes
        )
        result.participants_added = participantsResult.participants_added
        if (participantsResult.errors.length > 0) {
          result.errors.push(...participantsResult.errors)
        }
      }

      // Enrich legal subjects if requested
      if (options.include_legal_subjects !== false && dataJudProcess.assuntos) {
        const subjectsResult = await this.enrichLegalSubjects(
          enrichmentData.datajud_case_detail_id,
          lawFirmId,
          dataJudProcess.assuntos
        )
        result.legal_subjects_added = subjectsResult.subjects_added
        if (subjectsResult.errors.length > 0) {
          result.errors.push(...subjectsResult.errors)
        }
      }

      // Update enrichment status
      await this.supabase
        .from('datajud_case_details')
        .update({
          enrichment_status: result.errors.length === 0 ? 'completed' : 'partial',
          last_enrichment_at: new Date().toISOString()
        })
        .eq('id', enrichmentData.datajud_case_detail_id)

      result.success = result.errors.length === 0

      return result

    } catch (error) {
      console.error('Error enriching case:', error)
      result.errors.push(`Enrichment failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return result
    }
  }

  /**
   * Enrich core case details
   */
  private async enrichCaseDetails(
    caseId: string,
    lawFirmId: string,
    existingCase: any,
    dataJudProcess: DataJudProcesso,
    options: EnrichmentOptions
  ) {
    const enrichedFields: string[] = []
    const conflicts: DataConflict[] = []
    let confidenceScore = 0.5 // Base confidence

    // Prepare enrichment data
    const enrichmentData = {
      law_firm_id: lawFirmId,
      matter_id: caseId,
      datajud_case_id: dataJudProcess.id,
      numero_processo_cnj: dataJudProcess.numeroProcesso,
      tribunal_alias: dataJudProcess.tribunal,
      court_instance: dataJudProcess.grau,
      court_code: dataJudProcess.orgaoJulgador.codigo,
      court_name: dataJudProcess.orgaoJulgador.nome,
      court_municipality_ibge: dataJudProcess.orgaoJulgador.codigoMunicipioIBGE || null,
      court_municipality: dataJudProcess.orgaoJulgador.municipio || null,
      court_state: dataJudProcess.orgaoJulgador.uf || null,
      court_competence: dataJudProcess.orgaoJulgador.competencia || null,
      process_class_code: dataJudProcess.classe.codigo,
      process_class_name: dataJudProcess.classe.nome,
      process_format_code: dataJudProcess.formato.codigo,
      process_format_name: dataJudProcess.formato.nome,
      court_system_code: dataJudProcess.sistema.codigo,
      court_system_name: dataJudProcess.sistema.nome,
      filing_date: dataJudProcess.dataAjuizamento ? new Date(dataJudProcess.dataAjuizamento).toISOString() : null,
      last_update_date: dataJudProcess.dataUltimaAtualizacao ? new Date(dataJudProcess.dataUltimaAtualizacao).toISOString() : null,
      case_value: dataJudProcess.valorCausa || null,
      is_confidential: dataJudProcess.segredoJustica || false,
      enrichment_status: 'completed',
      enrichment_confidence: 0.85, // Will be calculated
      last_enrichment_at: new Date().toISOString()
    }

    // Check for conflicts with existing case data
    const caseFieldMappings = [
      { existing: 'court_name', datajud: 'court_name', field: 'court_name' },
      { existing: 'court_city', datajud: 'court_municipality', field: 'court_municipality' },
      { existing: 'court_state', datajud: 'court_state', field: 'court_state' }
    ]

    for (const mapping of caseFieldMappings) {
      const existingValue = existingCase[mapping.existing]
      const dataJudValue = enrichmentData[mapping.datajud as keyof typeof enrichmentData]

      if (existingValue && dataJudValue && existingValue !== dataJudValue) {
        conflicts.push({
          field_name: mapping.field,
          existing_value: existingValue,
          datajud_value: dataJudValue,
          conflict_type: 'value_mismatch',
          resolution_strategy: 'prefer_datajud', // DataJud is authoritative for court info
          confidence_impact: -0.1
        })
      }
    }

    // Calculate confidence score based on data quality
    confidenceScore += dataJudProcess.orgaoJulgador.nome ? 0.1 : 0
    confidenceScore += dataJudProcess.classe.nome ? 0.1 : 0
    confidenceScore += dataJudProcess.assuntos?.length > 0 ? 0.1 : 0
    confidenceScore += dataJudProcess.participantes?.length > 0 ? 0.1 : 0
    confidenceScore += dataJudProcess.dataAjuizamento ? 0.1 : 0

    // Apply conflict penalties
    confidenceScore -= conflicts.length * 0.05
    confidenceScore = Math.max(0.0, Math.min(1.0, confidenceScore))

    enrichmentData.enrichment_confidence = confidenceScore

    // Store conflicts as JSONB
    const dataConflicts = conflicts.length > 0 ? { conflicts } : null

    // Upsert DataJud case details
    const { data: caseDetail, error } = await this.supabase
      .from('datajud_case_details')
      .upsert({
        ...enrichmentData,
        data_conflicts: dataConflicts
      }, {
        onConflict: 'law_firm_id,matter_id'
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to store case enrichment: ${error.message}`)
    }

    // Update the original case with non-conflicting data
    const caseUpdates: any = {}
    if (!existingCase.court_name && enrichmentData.court_name) {
      caseUpdates.court_name = enrichmentData.court_name
      enrichedFields.push('court_name')
    }
    if (!existingCase.court_city && enrichmentData.court_municipality) {
      caseUpdates.court_city = enrichmentData.court_municipality
      enrichedFields.push('court_city')
    }
    if (!existingCase.court_state && enrichmentData.court_state) {
      caseUpdates.court_state = enrichmentData.court_state
      enrichedFields.push('court_state')
    }

    if (Object.keys(caseUpdates).length > 0) {
      await this.supabase
        .from('matters')
        .update(caseUpdates)
        .eq('id', caseId)
    }

    return {
      datajud_case_detail_id: caseDetail.id,
      enriched_fields: enrichedFields,
      conflicts: conflicts.map(c => ({
        field: c.field_name,
        existing_value: c.existing_value,
        datajud_value: c.datajud_value,
        action_taken: c.resolution_strategy === 'prefer_datajud' ? 'update_with_datajud' : 'keep_existing'
      })),
      confidence_score: confidenceScore
    }
  }

  /**
   * Enrich timeline events
   */
  private async enrichTimeline(
    caseDetailId: string,
    lawFirmId: string,
    dataJudProcess: DataJudProcesso
  ) {
    const result = {
      events_added: 0,
      errors: [] as string[]
    }

    try {
      if (!dataJudProcess.movimentos || dataJudProcess.movimentos.length === 0) {
        // Try to fetch movements separately
        const movements = await this.dataJudApi.getProcessMovements(dataJudProcess.id)
        if (movements.length === 0) {
          return result
        }
        dataJudProcess.movimentos = movements
      }

      // Get existing events to avoid duplicates
      const { data: existingEvents } = await this.supabase
        .from('datajud_timeline_events')
        .select('movement_id')
        .eq('datajud_case_detail_id', caseDetailId)

      const existingMovementIds = new Set(existingEvents?.map(e => e.movement_id) || [])

      // Process movements
      for (const movement of dataJudProcess.movimentos) {
        if (existingMovementIds.has(movement.id)) {
          continue // Skip existing events
        }

        const eventData = {
          law_firm_id: lawFirmId,
          datajud_case_detail_id: caseDetailId,
          movement_id: movement.id,
          movement_code: movement.codigo,
          movement_name: movement.nome,
          movement_complement: movement.complemento || null,
          event_datetime: new Date(movement.dataHora).toISOString(),
          responsible_type_code: movement.tipoResponsavelMovimento?.codigo || null,
          responsible_type_name: movement.tipoResponsavelMovimento?.nome || null,
          responsible_code: movement.responsavelMovimento?.codigo || null,
          responsible_name: movement.responsavelMovimento?.nome || null,
          event_category: this.categorizeEvent(movement),
          priority_level: this.prioritizeEvent(movement),
          is_relevant: this.isEventRelevant(movement),
          is_visible_client: this.isEventVisibleToClient(movement),
          is_visible_timeline: true
        }

        const { error } = await this.supabase
          .from('datajud_timeline_events')
          .insert(eventData)

        if (error) {
          result.errors.push(`Failed to insert timeline event ${movement.id}: ${error.message}`)
        } else {
          result.events_added++
        }
      }

    } catch (error) {
      result.errors.push(`Timeline enrichment failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return result
  }

  /**
   * Enrich case participants
   */
  private async enrichParticipants(
    caseDetailId: string,
    lawFirmId: string,
    participants: any[]
  ) {
    const result = {
      participants_added: 0,
      errors: [] as string[]
    }

    try {
      for (const participant of participants) {
        // Try to match with existing contacts
        const matchedContact = await this.findMatchingContact(
          lawFirmId,
          participant.pessoa.nome,
          participant.pessoa.cpfCnpj
        )

        const participantData = {
          law_firm_id: lawFirmId,
          datajud_case_detail_id: caseDetailId,
          participant_name: participant.pessoa.nome,
          participant_cpf_cnpj: participant.pessoa.cpfCnpj || null,
          participant_type: participant.pessoa.tipo,
          case_role: participant.polo,
          participation_type: participant.participacao || null,
          matched_contact_id: matchedContact?.id || null,
          match_confidence: matchedContact?.confidence || null
        }

        const { error } = await this.supabase
          .from('datajud_case_participants')
          .upsert(participantData, {
            onConflict: 'datajud_case_detail_id,participant_name,case_role'
          })

        if (error) {
          result.errors.push(`Failed to insert participant ${participant.pessoa.nome}: ${error.message}`)
        } else {
          result.participants_added++
        }
      }
    } catch (error) {
      result.errors.push(`Participants enrichment failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return result
  }

  /**
   * Enrich legal subjects
   */
  private async enrichLegalSubjects(
    caseDetailId: string,
    lawFirmId: string,
    subjects: any[]
  ) {
    const result = {
      subjects_added: 0,
      errors: [] as string[]
    }

    try {
      for (const subject of subjects) {
        const subjectData = {
          law_firm_id: lawFirmId,
          datajud_case_detail_id: caseDetailId,
          subject_code: subject.codigo,
          subject_name: subject.nome,
          is_primary_subject: subject.principal || false
        }

        const { error } = await this.supabase
          .from('datajud_legal_subjects')
          .upsert(subjectData, {
            onConflict: 'datajud_case_detail_id,subject_code'
          })

        if (error) {
          result.errors.push(`Failed to insert legal subject ${subject.nome}: ${error.message}`)
        } else {
          result.subjects_added++
        }
      }
    } catch (error) {
      result.errors.push(`Legal subjects enrichment failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return result
  }

  /**
   * Categorize timeline events
   */
  private categorizeEvent(movement: DataJudMovement): string {
    const movementName = movement.nome.toLowerCase()
    
    if (movementName.includes('sentença') || movementName.includes('decisão')) {
      return 'decision'
    }
    if (movementName.includes('audiência') || movementName.includes('sessão')) {
      return 'hearing'
    }
    if (movementName.includes('petição') || movementName.includes('manifestação')) {
      return 'filing'
    }
    if (movementName.includes('recurso') || movementName.includes('apelação')) {
      return 'appeal'
    }
    if (movementName.includes('citação') || movementName.includes('intimação')) {
      return 'notification'
    }
    
    return 'general'
  }

  /**
   * Prioritize timeline events
   */
  private prioritizeEvent(movement: DataJudMovement): 'low' | 'normal' | 'high' | 'critical' {
    const movementName = movement.nome.toLowerCase()
    
    if (movementName.includes('sentença') || movementName.includes('acórdão')) {
      return 'critical'
    }
    if (movementName.includes('decisão') || movementName.includes('despacho')) {
      return 'high'
    }
    if (movementName.includes('audiência') || movementName.includes('prazo')) {
      return 'high'
    }
    if (movementName.includes('petição') || movementName.includes('recurso')) {
      return 'normal'
    }
    
    return 'low'
  }

  /**
   * Determine if event is relevant for display
   */
  private isEventRelevant(movement: DataJudMovement): boolean {
    const irrelevantKeywords = ['juntada', 'conclusão', 'remessa', 'vista']
    const movementName = movement.nome.toLowerCase()
    
    return !irrelevantKeywords.some(keyword => movementName.includes(keyword))
  }

  /**
   * Determine if event should be visible to clients
   */
  private isEventVisibleToClient(movement: DataJudMovement): boolean {
    const sensitiveKeywords = ['segredo', 'sigiloso', 'reservado']
    const movementName = movement.nome.toLowerCase()
    
    return !sensitiveKeywords.some(keyword => movementName.includes(keyword))
  }

  /**
   * Find matching contact in the database
   */
  private async findMatchingContact(
    lawFirmId: string,
    participantName: string,
    cpfCnpj?: string
  ): Promise<{ id: string; confidence: number } | null> {
    try {
      let query = this.supabase
        .from('contacts')
        .select('id, full_name, cpf, cnpj')
        .eq('law_firm_id', lawFirmId)

      // Exact CPF/CNPJ match has highest confidence
      if (cpfCnpj) {
        const { data: exactMatch } = await query
          .or(`cpf.eq.${cpfCnpj},cnpj.eq.${cpfCnpj}`)
          .limit(1)
          .single()

        if (exactMatch) {
          return { id: exactMatch.id, confidence: 0.95 }
        }
      }

      // Name similarity match
      const { data: nameMatches } = await query
        .ilike('full_name', `%${participantName}%`)
        .limit(5)

      if (nameMatches && nameMatches.length > 0) {
        // Simple name matching - could be enhanced with fuzzy matching
        const exactNameMatch = nameMatches.find(contact => 
          contact.full_name?.toLowerCase() === participantName.toLowerCase()
        )

        if (exactNameMatch) {
          return { id: exactNameMatch.id, confidence: 0.85 }
        }

        // Return first partial match with lower confidence
        return { id: nameMatches[0].id, confidence: 0.65 }
      }

      return null
    } catch (error) {
      console.error('Error finding matching contact:', error)
      return null
    }
  }

  /**
   * Get enrichment summary for a law firm
   */
  async getEnrichmentSummary(lawFirmId: string) {
    try {
      const { data: summary } = await this.supabase
        .from('datajud_case_details')
        .select('enrichment_status, enrichment_confidence, last_enrichment_at')
        .eq('law_firm_id', lawFirmId)

      const totalCases = summary?.length || 0
      const completedCases = summary?.filter(s => s.enrichment_status === 'completed').length || 0
      const avgConfidence = summary?.reduce((acc, s) => acc + Number(s.enrichment_confidence || 0), 0) / totalCases || 0

      return {
        total_cases: totalCases,
        completed_enrichments: completedCases,
        pending_enrichments: totalCases - completedCases,
        average_confidence: avgConfidence,
        completion_rate: totalCases > 0 ? (completedCases / totalCases) * 100 : 0
      }
    } catch (error) {
      console.error('Error getting enrichment summary:', error)
      return null
    }
  }
}

// Export service instance creator
export const createEnrichmentService = (supabaseClient: SupabaseClient) => {
  return new DataJudEnrichmentService(supabaseClient)
}

export default DataJudEnrichmentService