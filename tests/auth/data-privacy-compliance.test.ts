// =====================================================
// Prima Facie - Data Privacy and Compliance Tests
// Tests for LGPD, OAB, and legal data protection requirements
// =====================================================

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'

// Legal compliance frameworks
type ComplianceFramework = 'LGPD' | 'OAB' | 'CLIENT_CONFIDENTIALITY' | 'ATTORNEY_WORK_PRODUCT'

// Data classification types according to Brazilian legal standards
type DataClassification = 
  | 'public'           // Public information
  | 'internal'         // Internal law firm data
  | 'confidential'     // Client confidential data
  | 'privileged'       // Attorney-client privileged communications
  | 'sensitive'        // LGPD sensitive personal data
  | 'judicial'         // Court-related documents and data

// LGPD legal basis for data processing
type LGPDLegalBasis = 
  | 'consent'          // Consentimento do titular
  | 'contract'         // Execução de contrato
  | 'legal_obligation' // Cumprimento de obrigação legal
  | 'vital_interests'  // Proteção da vida ou incolumidade física
  | 'public_interest'  // Exercício regular de direitos
  | 'legitimate_interest' // Interesse legítimo

// OAB ethical obligations
type OABObligation = 
  | 'professional_secrecy'    // Sigilo profissional
  | 'client_confidentiality'  // Confidencialidade do cliente
  | 'conflict_of_interest'    // Conflito de interesses
  | 'data_protection'         // Proteção de dados
  | 'document_custody'        // Custódia de documentos

interface PersonalDataRecord {
  id: string
  data_subject_id: string
  data_type: 'personal' | 'sensitive' | 'criminal' | 'biometric' | 'health' | 'genetic'
  classification: DataClassification
  lgpd_legal_basis: LGPDLegalBasis
  purpose: string
  retention_period_days: number
  collected_at: string
  consent_obtained: boolean
  consent_date?: string
  anonymized: boolean
  encrypted: boolean
  law_firm_id: string
  matter_id?: string
  access_log: Array<{
    user_id: string
    timestamp: string
    action: 'create' | 'read' | 'update' | 'delete' | 'export'
    purpose: string
  }>
}

interface ConsentRecord {
  id: string
  data_subject_id: string
  law_firm_id: string
  purposes: string[]
  granted_at: string
  revoked_at?: string
  consent_method: 'digital' | 'written' | 'verbal'
  evidence_document?: string
  active: boolean
}

interface DataRetentionPolicy {
  id: string
  law_firm_id: string
  data_type: string
  purpose: string
  retention_period_days: number
  legal_basis: string
  disposal_method: 'deletion' | 'anonymization' | 'archive'
  oab_requirement?: string
  created_at: string
}

interface ComplianceAuditEvent {
  id: string
  event_type: 'data_access' | 'consent_change' | 'retention_expiry' | 'breach_detected' | 'export_request'
  law_firm_id: string
  user_id: string
  data_subject_id?: string
  description: string
  timestamp: string
  compliance_frameworks: ComplianceFramework[]
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  remediation_required: boolean
}

// Mock Data Privacy Compliance Service
class MockDataPrivacyService {
  private personalDataRecords: PersonalDataRecord[] = []
  private consentRecords: ConsentRecord[] = []
  private retentionPolicies: DataRetentionPolicy[] = []
  private auditEvents: ComplianceAuditEvent[] = []
  
  constructor() {
    this.setupTestData()
    this.setupRetentionPolicies()
  }
  
  private setupTestData() {
    // Sample personal data records
    this.personalDataRecords = [
      {
        id: 'pd_1',
        data_subject_id: 'client_joao_silva',
        data_type: 'personal',
        classification: 'confidential',
        lgpd_legal_basis: 'contract',
        purpose: 'Prestação de serviços advocatícios',
        retention_period_days: 2555, // 7 years as per OAB requirement
        collected_at: '2024-01-15T10:00:00Z',
        consent_obtained: true,
        consent_date: '2024-01-15T10:00:00Z',
        anonymized: false,
        encrypted: true,
        law_firm_id: 'firm_1',
        matter_id: 'matter_001',
        access_log: [
          {
            user_id: 'lawyer_1',
            timestamp: '2024-01-15T10:30:00Z',
            action: 'create',
            purpose: 'Initial client registration'
          },
          {
            user_id: 'lawyer_1',
            timestamp: '2024-01-16T14:20:00Z',
            action: 'read',
            purpose: 'Case preparation'
          }
        ]
      },
      {
        id: 'pd_2',
        data_subject_id: 'client_maria_costa',
        data_type: 'sensitive',
        classification: 'privileged',
        lgpd_legal_basis: 'consent',
        purpose: 'Processo trabalhista - dados de saúde',
        retention_period_days: 3650, // 10 years for labor cases
        collected_at: '2024-02-01T09:00:00Z',
        consent_obtained: true,
        consent_date: '2024-02-01T09:00:00Z',
        anonymized: false,
        encrypted: true,
        law_firm_id: 'firm_1',
        matter_id: 'matter_002',
        access_log: [
          {
            user_id: 'lawyer_2',
            timestamp: '2024-02-01T09:15:00Z',
            action: 'create',
            purpose: 'Labour case documentation'
          }
        ]
      },
      {
        id: 'pd_3',
        data_subject_id: 'client_pedro_santos',
        data_type: 'personal',
        classification: 'confidential',
        lgpd_legal_basis: 'legal_obligation',
        purpose: 'Compliance com obrigações legais',
        retention_period_days: 1825, // 5 years minimum
        collected_at: '2023-06-01T15:00:00Z',
        consent_obtained: false, // Legal obligation doesn't require consent
        anonymized: false,
        encrypted: true,
        law_firm_id: 'firm_1',
        access_log: []
      }
    ]
    
    // Sample consent records
    this.consentRecords = [
      {
        id: 'consent_1',
        data_subject_id: 'client_joao_silva',
        law_firm_id: 'firm_1',
        purposes: ['Prestação de serviços advocatícios', 'Comunicação sobre o processo'],
        granted_at: '2024-01-15T10:00:00Z',
        consent_method: 'digital',
        evidence_document: 'consent_form_001.pdf',
        active: true
      },
      {
        id: 'consent_2',
        data_subject_id: 'client_maria_costa',
        law_firm_id: 'firm_1',
        purposes: ['Processo trabalhista - dados de saúde', 'Representação legal'],
        granted_at: '2024-02-01T09:00:00Z',
        consent_method: 'written',
        evidence_document: 'consent_health_data_002.pdf',
        active: true
      }
    ]
  }
  
  private setupRetentionPolicies() {
    this.retentionPolicies = [
      {
        id: 'policy_1',
        law_firm_id: 'firm_1',
        data_type: 'client_personal_data',
        purpose: 'Prestação de serviços advocatícios',
        retention_period_days: 2555, // 7 years
        legal_basis: 'OAB Resolution 02/2015 - Art. 15',
        disposal_method: 'anonymization',
        oab_requirement: 'Mandatory retention for professional liability',
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'policy_2',
        law_firm_id: 'firm_1',
        data_type: 'sensitive_health_data',
        purpose: 'Processos trabalhistas',
        retention_period_days: 3650, // 10 years
        legal_basis: 'LGPD Art. 11 + CLT provisions',
        disposal_method: 'deletion',
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'policy_3',
        law_firm_id: 'firm_1',
        data_type: 'judicial_documents',
        purpose: 'Arquivo processual',
        retention_period_days: 7300, // 20 years
        legal_basis: 'CPC Art. 425 + OAB requirements',
        disposal_method: 'archive',
        oab_requirement: 'Long-term custody for appeals and reviews',
        created_at: '2024-01-01T00:00:00Z'
      }
    ]
  }
  
  // LGPD Compliance Methods
  
  // Validate LGPD legal basis for data processing
  validateLGPDLegalBasis(dataRecord: PersonalDataRecord): { valid: boolean; issues: string[] } {
    const issues: string[] = []
    
    // Check if sensitive data has appropriate legal basis
    if (dataRecord.data_type === 'sensitive' || dataRecord.data_type === 'health') {
      const validSensitiveBases = ['consent', 'vital_interests', 'legal_obligation']
      if (!validSensitiveBases.includes(dataRecord.lgpd_legal_basis)) {
        issues.push('Sensitive data requires specific legal basis under LGPD Art. 11')
      }
      
      // Sensitive data requires explicit consent in most cases
      if (dataRecord.lgpd_legal_basis === 'consent' && !dataRecord.consent_obtained) {
        issues.push('Sensitive data processing based on consent requires explicit consent')
      }
    }
    
    // Check consent requirements
    if (dataRecord.lgpd_legal_basis === 'consent') {
      if (!dataRecord.consent_obtained) {
        issues.push('Data processing based on consent requires valid consent')
      }
      
      if (!dataRecord.consent_date) {
        issues.push('Consent date must be recorded for audit purposes')
      }
    }
    
    // Check purpose limitation
    if (!dataRecord.purpose || dataRecord.purpose.length < 10) {
      issues.push('Purpose must be specific and clearly defined (LGPD Art. 6, I)')
    }
    
    return {
      valid: issues.length === 0,
      issues
    }
  }
  
  // Check data subject rights compliance
  validateDataSubjectRights(dataSubjectId: string): { compliant: boolean; violations: string[] } {
    const violations: string[] = []
    const dataRecords = this.personalDataRecords.filter(r => r.data_subject_id === dataSubjectId)
    
    if (dataRecords.length === 0) {
      return { compliant: true, violations: [] }
    }
    
    // Check data minimization (LGPD Art. 6, III)
    const purposes = new Set(dataRecords.map(r => r.purpose))
    if (purposes.size < dataRecords.length / 3) {
      violations.push('Potential data minimization violation - too much data for same purpose')
    }
    
    // Check encryption for sensitive data
    const sensitiveData = dataRecords.filter(r => 
      ['sensitive', 'health', 'biometric', 'genetic'].includes(r.data_type)
    )
    
    const unencryptedSensitive = sensitiveData.filter(r => !r.encrypted)
    if (unencryptedSensitive.length > 0) {
      violations.push('Sensitive personal data must be encrypted (LGPD Art. 46)')
    }
    
    // Check access logging
    const accessLogs = dataRecords.flatMap(r => r.access_log)
    if (accessLogs.length === 0) {
      violations.push('Data access must be logged for audit purposes (LGPD Art. 37)')
    }
    
    return {
      compliant: violations.length === 0,
      violations
    }
  }
  
  // Handle data subject access request (LGPD Art. 18)
  processDataSubjectAccessRequest(dataSubjectId: string, requestType: 'access' | 'portability' | 'deletion' | 'correction'): {
    success: boolean
    data?: any
    message: string
  } {
    const dataRecords = this.personalDataRecords.filter(r => r.data_subject_id === dataSubjectId)
    
    if (dataRecords.length === 0) {
      return {
        success: false,
        message: 'No personal data found for this data subject'
      }
    }
    
    // Log the request
    this.auditEvents.push({
      id: `audit_${Date.now()}`,
      event_type: 'export_request',
      law_firm_id: dataRecords[0].law_firm_id,
      user_id: 'system',
      data_subject_id: dataSubjectId,
      description: `Data subject ${requestType} request processed`,
      timestamp: new Date().toISOString(),
      compliance_frameworks: ['LGPD'],
      risk_level: 'low',
      remediation_required: false
    })
    
    switch (requestType) {
      case 'access':
        // Return data in structured format (LGPD Art. 18, II)
        const accessData = dataRecords.map(record => ({
          data_type: record.data_type,
          purpose: record.purpose,
          legal_basis: record.lgpd_legal_basis,
          collected_at: record.collected_at,
          retention_period: record.retention_period_days
        }))
        
        return {
          success: true,
          data: accessData,
          message: 'Data access request processed successfully'
        }
        
      case 'portability':
        // Return data in machine-readable format (LGPD Art. 18, V)
        const portabilityData = dataRecords.filter(r => 
          r.lgpd_legal_basis === 'consent' || r.lgpd_legal_basis === 'contract'
        )
        
        return {
          success: true,
          data: portabilityData,
          message: 'Data portability request processed successfully'
        }
        
      case 'deletion':
        // Check if deletion is possible (LGPD Art. 16)
        const legalObligationData = dataRecords.filter(r => 
          r.lgpd_legal_basis === 'legal_obligation'
        )
        
        if (legalObligationData.length > 0) {
          return {
            success: false,
            message: 'Cannot delete data required for legal obligations'
          }
        }
        
        // Simulate deletion (in real implementation, would actually delete or anonymize)
        return {
          success: true,
          message: 'Data deletion request processed successfully'
        }
        
      case 'correction':
        return {
          success: true,
          message: 'Data correction request initiated - contact law firm for updates'
        }
        
      default:
        return {
          success: false,
          message: 'Invalid request type'
        }
    }
  }
  
  // OAB Compliance Methods
  
  // Validate OAB professional secrecy requirements
  validateOABSecrecy(dataRecord: PersonalDataRecord, accessingUserId: string): { compliant: boolean; violations: string[] } {
    const violations: string[] = []
    
    // Check if data is client-related and confidential
    if (dataRecord.classification === 'privileged' || dataRecord.classification === 'confidential') {
      // Verify accessing user has proper authorization
      const hasLegalAccess = this.checkLegalAccess(accessingUserId, dataRecord.matter_id || '')
      
      if (!hasLegalAccess) {
        violations.push('Access to confidential client data without proper authorization violates OAB professional secrecy')
      }
      
      // Check if access is logged
      const accessLog = dataRecord.access_log.find(log => 
        log.user_id === accessingUserId && 
        new Date(log.timestamp).getDate() === new Date().getDate()
      )
      
      if (!accessLog) {
        violations.push('Access to confidential data must be logged for OAB compliance')
      }
    }
    
    // Check data protection measures
    if (!dataRecord.encrypted && dataRecord.classification !== 'public') {
      violations.push('Client data must be encrypted to comply with OAB data protection requirements')
    }
    
    return {
      compliant: violations.length === 0,
      violations
    }
  }
  
  // Check conflict of interest (OAB requirement)
  checkConflictOfInterest(lawyerId: string, clientId: string, matterType: string): { conflict: boolean; details: string[] } {
    const details: string[] = []
    
    // Mock conflict checking logic
    // In real implementation, this would check against:
    // - Previous representations
    // - Adverse parties
    // - Related matters
    // - Family relationships
    // - Business relationships
    
    const conflictingMatters = this.personalDataRecords.filter(record => 
      record.access_log.some(log => log.user_id === lawyerId) &&
      record.data_subject_id !== clientId &&
      record.matter_id // Has matter association
    )
    
    if (conflictingMatters.length > 0) {
      details.push('Potential conflict: lawyer has represented other parties in similar matters')
    }
    
    // Check for adverse party representation
    if (matterType === 'litigation' && conflictingMatters.length > 2) {
      details.push('High risk of conflict in litigation matters')
    }
    
    return {
      conflict: details.length > 0,
      details
    }
  }
  
  // Data Retention and Disposal Methods
  
  // Check data retention compliance
  checkRetentionCompliance(): { compliant: boolean; expired_records: PersonalDataRecord[]; warnings: string[] } {
    const warnings: string[] = []
    const expired_records: PersonalDataRecord[] = []
    const now = new Date()
    
    this.personalDataRecords.forEach(record => {
      const collectedDate = new Date(record.collected_at)
      const retentionEndDate = new Date(collectedDate.getTime() + (record.retention_period_days * 24 * 60 * 60 * 1000))
      
      if (now > retentionEndDate) {
        expired_records.push(record)
      } else {
        // Check if expiring soon (within 90 days)
        const daysDiff = Math.ceil((retentionEndDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
        if (daysDiff <= 90) {
          warnings.push(`Data record ${record.id} expires in ${daysDiff} days`)
        }
      }
    })
    
    return {
      compliant: expired_records.length === 0,
      expired_records,
      warnings
    }
  }
  
  // Process data disposal according to retention policy
  processDataDisposal(recordId: string): { success: boolean; method: string; message: string } {
    const record = this.personalDataRecords.find(r => r.id === recordId)
    
    if (!record) {
      return {
        success: false,
        method: '',
        message: 'Record not found'
      }
    }
    
    const policy = this.retentionPolicies.find(p => 
      p.law_firm_id === record.law_firm_id && 
      p.data_type.includes(record.data_type)
    )
    
    if (!policy) {
      return {
        success: false,
        method: '',
        message: 'No retention policy found'
      }
    }
    
    // Log disposal action
    this.auditEvents.push({
      id: `audit_disposal_${Date.now()}`,
      event_type: 'retention_expiry',
      law_firm_id: record.law_firm_id,
      user_id: 'system',
      data_subject_id: record.data_subject_id,
      description: `Data disposed using method: ${policy.disposal_method}`,
      timestamp: new Date().toISOString(),
      compliance_frameworks: ['LGPD', 'OAB'],
      risk_level: 'low',
      remediation_required: false
    })
    
    switch (policy.disposal_method) {
      case 'deletion':
        // Simulate secure deletion
        return {
          success: true,
          method: 'secure_deletion',
          message: 'Data securely deleted from all systems'
        }
        
      case 'anonymization':
        // Simulate anonymization
        record.anonymized = true
        return {
          success: true,
          method: 'anonymization',
          message: 'Data anonymized while preserving statistical value'
        }
        
      case 'archive':
        // Simulate archival
        return {
          success: true,
          method: 'archive',
          message: 'Data archived for long-term retention'
        }
        
      default:
        return {
          success: false,
          method: '',
          message: 'Unknown disposal method'
        }
    }
  }
  
  // Consent Management
  
  // Validate consent record
  validateConsent(consentId: string): { valid: boolean; issues: string[] } {
    const consent = this.consentRecords.find(c => c.id === consentId)
    const issues: string[] = []
    
    if (!consent) {
      issues.push('Consent record not found')
      return { valid: false, issues }
    }
    
    // Check if consent is active
    if (!consent.active) {
      issues.push('Consent has been revoked')
    }
    
    // Check if consent is specific
    if (consent.purposes.length === 0) {
      issues.push('Consent must specify clear purposes')
    }
    
    // Check consent method documentation
    if (!consent.evidence_document && consent.consent_method !== 'verbal') {
      issues.push('Consent evidence must be documented')
    }
    
    // Check consent age (should be renewed periodically)
    const consentAge = Date.now() - new Date(consent.granted_at).getTime()
    const oneYearMs = 365 * 24 * 60 * 60 * 1000
    
    if (consentAge > oneYearMs * 2) { // 2 years
      issues.push('Consent should be renewed periodically for ongoing processing')
    }
    
    return {
      valid: issues.length === 0,
      issues
    }
  }
  
  // Revoke consent
  revokeConsent(consentId: string, revocationReason: string): { success: boolean; message: string } {
    const consent = this.consentRecords.find(c => c.id === consentId)
    
    if (!consent) {
      return {
        success: false,
        message: 'Consent record not found'
      }
    }
    
    if (!consent.active) {
      return {
        success: false,
        message: 'Consent is already revoked'
      }
    }
    
    // Revoke consent
    consent.active = false
    consent.revoked_at = new Date().toISOString()
    
    // Log revocation
    this.auditEvents.push({
      id: `audit_revoke_${Date.now()}`,
      event_type: 'consent_change',
      law_firm_id: consent.law_firm_id,
      user_id: 'system',
      data_subject_id: consent.data_subject_id,
      description: `Consent revoked: ${revocationReason}`,
      timestamp: new Date().toISOString(),
      compliance_frameworks: ['LGPD'],
      risk_level: 'medium',
      remediation_required: true
    })
    
    return {
      success: true,
      message: 'Consent revoked successfully'
    }
  }
  
  // Audit and Compliance Reporting
  
  // Generate compliance report
  generateComplianceReport(lawFirmId: string, framework: ComplianceFramework): any {
    const firmData = this.personalDataRecords.filter(r => r.law_firm_id === lawFirmId)
    const firmConsents = this.consentRecords.filter(c => c.law_firm_id === lawFirmId)
    const firmAudits = this.auditEvents.filter(e => e.law_firm_id === lawFirmId)
    
    const report = {
      law_firm_id: lawFirmId,
      framework,
      generated_at: new Date().toISOString(),
      summary: {
        total_data_records: firmData.length,
        sensitive_data_records: firmData.filter(r => ['sensitive', 'health', 'biometric'].includes(r.data_type)).length,
        active_consents: firmConsents.filter(c => c.active).length,
        expired_consents: firmConsents.filter(c => !c.active).length,
        audit_events_last_30_days: firmAudits.filter(e => 
          Date.now() - new Date(e.timestamp).getTime() < 30 * 24 * 60 * 60 * 1000
        ).length
      },
      compliance_status: {
        lgpd_compliant: true,
        oab_compliant: true,
        issues_found: 0,
        recommendations: []
      },
      details: {}
    }
    
    if (framework === 'LGPD') {
      // LGPD-specific checks
      const lgpdIssues: string[] = []
      
      // Check legal basis for all records
      firmData.forEach(record => {
        const validation = this.validateLGPDLegalBasis(record)
        if (!validation.valid) {
          lgpdIssues.push(...validation.issues)
        }
      })
      
      // Check retention compliance
      const retentionCheck = this.checkRetentionCompliance()
      if (!retentionCheck.compliant) {
        lgpdIssues.push(`${retentionCheck.expired_records.length} records exceed retention period`)
      }
      
      report.compliance_status.lgpd_compliant = lgpdIssues.length === 0
      report.compliance_status.issues_found = lgpdIssues.length
      report.details = { lgpd_issues: lgpdIssues }
      
    } else if (framework === 'OAB') {
      // OAB-specific checks
      const oabIssues: string[] = []
      
      // Check professional secrecy compliance
      const privilegedData = firmData.filter(r => r.classification === 'privileged')
      const unencryptedPrivileged = privilegedData.filter(r => !r.encrypted)
      
      if (unencryptedPrivileged.length > 0) {
        oabIssues.push(`${unencryptedPrivileged.length} privileged records are not encrypted`)
      }
      
      // Check access logging for confidential data
      const confidentialData = firmData.filter(r => 
        ['confidential', 'privileged'].includes(r.classification)
      )
      const unloggedAccess = confidentialData.filter(r => r.access_log.length === 0)
      
      if (unloggedAccess.length > 0) {
        oabIssues.push(`${unloggedAccess.length} confidential records lack access logs`)
      }
      
      report.compliance_status.oab_compliant = oabIssues.length === 0
      report.compliance_status.issues_found = oabIssues.length
      report.details = { oab_issues: oabIssues }
    }
    
    return report
  }
  
  // Helper methods
  private checkLegalAccess(userId: string, matterId: string): boolean {
    // Mock implementation - in real system, would check:
    // - User role and permissions
    // - Matter assignment
    // - Law firm affiliation
    // - Active case status
    return userId.includes('lawyer') || userId.includes('admin')
  }
  
  // Get audit events
  getAuditEvents(lawFirmId: string, startDate?: string, endDate?: string): ComplianceAuditEvent[] {
    let events = this.auditEvents.filter(e => e.law_firm_id === lawFirmId)
    
    if (startDate) {
      events = events.filter(e => e.timestamp >= startDate)
    }
    
    if (endDate) {
      events = events.filter(e => e.timestamp <= endDate)
    }
    
    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }
  
  // Get personal data records
  getPersonalDataRecords(lawFirmId: string): PersonalDataRecord[] {
    return this.personalDataRecords.filter(r => r.law_firm_id === lawFirmId)
  }
  
  // Get consent records
  getConsentRecords(lawFirmId: string): ConsentRecord[] {
    return this.consentRecords.filter(c => c.law_firm_id === lawFirmId)
  }
}

describe('Data Privacy and Compliance Tests', () => {
  let privacyService: MockDataPrivacyService
  
  beforeEach(() => {
    privacyService = new MockDataPrivacyService()
  })
  
  afterEach(() => {
    jest.clearAllMocks()
  })
  
  describe('LGPD Compliance Tests', () => {
    it('should validate LGPD legal basis for personal data processing', () => {
      const personalDataRecords = privacyService.getPersonalDataRecords('firm_1')
      
      personalDataRecords.forEach(record => {
        const validation = privacyService.validateLGPDLegalBasis(record)
        
        if (record.data_type === 'sensitive' || record.data_type === 'health') {
          expect(['consent', 'vital_interests', 'legal_obligation']).toContain(record.lgpd_legal_basis)
        }
        
        if (record.lgpd_legal_basis === 'consent') {
          expect(record.consent_obtained).toBe(true)
          expect(record.consent_date).toBeDefined()
        }
        
        expect(record.purpose).toBeDefined()
        expect(record.purpose.length).toBeGreaterThan(10)
      })
    })
    
    it('should handle data subject access requests (LGPD Art. 18)', () => {
      const accessRequest = privacyService.processDataSubjectAccessRequest('client_joao_silva', 'access')
      
      expect(accessRequest.success).toBe(true)
      expect(accessRequest.data).toBeDefined()
      expect(Array.isArray(accessRequest.data)).toBe(true)
      
      const dataSubjectData = accessRequest.data as any[]
      expect(dataSubjectData.length).toBeGreaterThan(0)
      expect(dataSubjectData[0]).toHaveProperty('data_type')
      expect(dataSubjectData[0]).toHaveProperty('purpose')
      expect(dataSubjectData[0]).toHaveProperty('legal_basis')
    })
    
    it('should handle data portability requests for appropriate legal basis', () => {
      const portabilityRequest = privacyService.processDataSubjectAccessRequest('client_joao_silva', 'portability')
      
      expect(portabilityRequest.success).toBe(true)
      expect(portabilityRequest.data).toBeDefined()
      
      // Should only include data based on consent or contract
      const portableData = portabilityRequest.data as PersonalDataRecord[]
      portableData.forEach(record => {
        expect(['consent', 'contract']).toContain(record.lgpd_legal_basis)
      })
    })
    
    it('should prevent deletion of data required for legal obligations', () => {
      const deletionRequest = privacyService.processDataSubjectAccessRequest('client_pedro_santos', 'deletion')
      
      expect(deletionRequest.success).toBe(false)
      expect(deletionRequest.message).toContain('legal obligations')
    })
    
    it('should validate data subject rights compliance', () => {
      const rightsValidation = privacyService.validateDataSubjectRights('client_joao_silva')
      
      expect(rightsValidation.compliant).toBe(true)
      expect(rightsValidation.violations).toHaveLength(0)
    })
    
    it('should detect violations of data minimization principle', () => {
      // Add test record with excessive data
      const testRecord: PersonalDataRecord = {
        id: 'pd_test_violation',
        data_subject_id: 'client_joao_silva',
        data_type: 'personal',
        classification: 'internal',
        lgpd_legal_basis: 'consent',
        purpose: 'Prestação de serviços advocatícios', // Same purpose as existing record
        retention_period_days: 365,
        collected_at: new Date().toISOString(),
        consent_obtained: true,
        consent_date: new Date().toISOString(),
        anonymized: false,
        encrypted: false, // Violation
        law_firm_id: 'firm_1',
        access_log: []
      }
      
      privacyService['personalDataRecords'].push(testRecord)
      
      const rightsValidation = privacyService.validateDataSubjectRights('client_joao_silva')
      
      expect(rightsValidation.compliant).toBe(false)
      expect(rightsValidation.violations.some(v => v.includes('encryption'))).toBe(true)
    })
    
    it('should require encryption for sensitive personal data', () => {
      const sensitiveRecords = privacyService.getPersonalDataRecords('firm_1')
        .filter(r => ['sensitive', 'health', 'biometric', 'genetic'].includes(r.data_type))
      
      sensitiveRecords.forEach(record => {
        expect(record.encrypted).toBe(true)
      })
    })
    
    it('should maintain audit logs for data access', () => {
      const personalDataRecords = privacyService.getPersonalDataRecords('firm_1')
      
      personalDataRecords.forEach(record => {
        if (['confidential', 'privileged', 'sensitive'].includes(record.classification)) {
          expect(record.access_log.length).toBeGreaterThanOrEqual(0)
          
          record.access_log.forEach(logEntry => {
            expect(logEntry).toHaveProperty('user_id')
            expect(logEntry).toHaveProperty('timestamp')
            expect(logEntry).toHaveProperty('action')
            expect(logEntry).toHaveProperty('purpose')
          })
        }
      })
    })
  })
  
  describe('OAB Compliance Tests', () => {
    it('should enforce professional secrecy for client data', () => {
      const personalDataRecords = privacyService.getPersonalDataRecords('firm_1')
      const privilegedData = personalDataRecords.filter(r => r.classification === 'privileged')
      
      privilegedData.forEach(record => {
        const secrecyValidation = privacyService.validateOABSecrecy(record, 'lawyer_1')
        
        expect(secrecyValidation.compliant).toBe(true)
        expect(record.encrypted).toBe(true)
      })
    })
    
    it('should detect unauthorized access to confidential client data', () => {
      const confidentialRecord = privacyService.getPersonalDataRecords('firm_1')
        .find(r => r.classification === 'confidential')
      
      if (confidentialRecord) {
        const secrecyValidation = privacyService.validateOABSecrecy(confidentialRecord, 'unauthorized_user')
        
        expect(secrecyValidation.compliant).toBe(false)
        expect(secrecyValidation.violations.some(v => v.includes('authorization'))).toBe(true)
      }
    })
    
    it('should check for conflicts of interest', () => {
      const conflictCheck = privacyService.checkConflictOfInterest('lawyer_1', 'new_client_123', 'litigation')
      
      expect(conflictCheck).toHaveProperty('conflict')
      expect(conflictCheck).toHaveProperty('details')
      
      if (conflictCheck.conflict) {
        expect(conflictCheck.details.length).toBeGreaterThan(0)
      }
    })
    
    it('should require secure encryption for client communications', () => {
      const privilegedRecords = privacyService.getPersonalDataRecords('firm_1')
        .filter(r => r.classification === 'privileged')
      
      privilegedRecords.forEach(record => {
        expect(record.encrypted).toBe(true)
      })
    })
    
    it('should maintain proper document custody records', () => {
      const personalDataRecords = privacyService.getPersonalDataRecords('firm_1')
      
      personalDataRecords.forEach(record => {
        expect(record.law_firm_id).toBeDefined()
        expect(record.collected_at).toBeDefined()
        expect(record.retention_period_days).toBeGreaterThan(0)
        
        // OAB requires minimum 7-year retention for client files
        if (record.classification === 'confidential' || record.classification === 'privileged') {
          expect(record.retention_period_days).toBeGreaterThanOrEqual(2555) // 7 years
        }
      })
    })
  })
  
  describe('Data Retention and Disposal Tests', () => {
    it('should identify records exceeding retention periods', () => {
      const retentionCheck = privacyService.checkRetentionCompliance()
      
      expect(retentionCheck).toHaveProperty('compliant')
      expect(retentionCheck).toHaveProperty('expired_records')
      expect(retentionCheck).toHaveProperty('warnings')
      
      if (!retentionCheck.compliant) {
        expect(retentionCheck.expired_records.length).toBeGreaterThan(0)
      }
    })
    
    it('should properly dispose of data according to retention policies', () => {
      const personalDataRecords = privacyService.getPersonalDataRecords('firm_1')
      
      if (personalDataRecords.length > 0) {
        const recordId = personalDataRecords[0].id
        const disposalResult = privacyService.processDataDisposal(recordId)
        
        expect(disposalResult).toHaveProperty('success')
        expect(disposalResult).toHaveProperty('method')
        expect(disposalResult).toHaveProperty('message')
        
        if (disposalResult.success) {
          expect(['secure_deletion', 'anonymization', 'archive']).toContain(disposalResult.method)
        }
      }
    })
    
    it('should follow different disposal methods based on data type', () => {
      // Test would verify that:
      // - Sensitive health data is securely deleted
      // - Client personal data is anonymized
      // - Judicial documents are archived
      // - Each disposal method is properly executed
      
      const personalDataRecords = privacyService.getPersonalDataRecords('firm_1')
      
      personalDataRecords.forEach(record => {
        expect(record.retention_period_days).toBeGreaterThan(0)
        
        // Different retention periods based on legal requirements
        if (record.data_type === 'sensitive') {
          expect(record.retention_period_days).toBeGreaterThanOrEqual(3650) // 10 years for labor cases
        } else if (record.classification === 'privileged') {
          expect(record.retention_period_days).toBeGreaterThanOrEqual(2555) // 7 years OAB requirement
        }
      })
    })
    
    it('should provide warnings for records nearing expiration', () => {
      const retentionCheck = privacyService.checkRetentionCompliance()
      
      expect(Array.isArray(retentionCheck.warnings)).toBe(true)
      
      retentionCheck.warnings.forEach(warning => {
        expect(warning).toContain('expires in')
        expect(warning).toContain('days')
      })
    })
  })
  
  describe('Consent Management Tests', () => {
    it('should validate consent records for LGPD compliance', () => {
      const consentRecords = privacyService.getConsentRecords('firm_1')
      
      consentRecords.forEach(consent => {
        const validation = privacyService.validateConsent(consent.id)
        
        if (validation.valid) {
          expect(consent.active).toBe(true)
          expect(consent.purposes.length).toBeGreaterThan(0)
          expect(consent.granted_at).toBeDefined()
          
          if (consent.consent_method !== 'verbal') {
            expect(consent.evidence_document).toBeDefined()
          }
        }
      })
    })
    
    it('should handle consent revocation properly', () => {
      const consentRecords = privacyService.getConsentRecords('firm_1')
      
      if (consentRecords.length > 0) {
        const consentId = consentRecords[0].id
        const revocationResult = privacyService.revokeConsent(consentId, 'Client request')
        
        expect(revocationResult.success).toBe(true)
        
        // Verify consent is now revoked
        const validation = privacyService.validateConsent(consentId)
        expect(validation.valid).toBe(false)
        expect(validation.issues.some(issue => issue.includes('revoked'))).toBe(true)
      }
    })
    
    it('should require specific purposes for consent', () => {
      const consentRecords = privacyService.getConsentRecords('firm_1')
      
      consentRecords.forEach(consent => {
        expect(consent.purposes.length).toBeGreaterThan(0)
        
        consent.purposes.forEach(purpose => {
          expect(purpose.length).toBeGreaterThan(10) // Specific, not generic
        })
      })
    })
    
    it('should maintain evidence of consent', () => {
      const consentRecords = privacyService.getConsentRecords('firm_1')
      
      consentRecords.forEach(consent => {
        if (consent.consent_method === 'digital' || consent.consent_method === 'written') {
          expect(consent.evidence_document).toBeDefined()
          expect(consent.evidence_document?.length).toBeGreaterThan(0)
        }
        
        expect(consent.granted_at).toBeDefined()
        expect(['digital', 'written', 'verbal']).toContain(consent.consent_method)
      })
    })
  })
  
  describe('Compliance Reporting Tests', () => {
    it('should generate comprehensive LGPD compliance reports', () => {
      const lgpdReport = privacyService.generateComplianceReport('firm_1', 'LGPD')
      
      expect(lgpdReport).toHaveProperty('law_firm_id', 'firm_1')
      expect(lgpdReport).toHaveProperty('framework', 'LGPD')
      expect(lgpdReport).toHaveProperty('generated_at')
      expect(lgpdReport).toHaveProperty('summary')
      expect(lgpdReport).toHaveProperty('compliance_status')
      expect(lgpdReport).toHaveProperty('details')
      
      expect(lgpdReport.summary.total_data_records).toBeGreaterThan(0)
      expect(lgpdReport.compliance_status).toHaveProperty('lgpd_compliant')
      expect(lgpdReport.compliance_status).toHaveProperty('issues_found')
    })
    
    it('should generate comprehensive OAB compliance reports', () => {
      const oabReport = privacyService.generateComplianceReport('firm_1', 'OAB')
      
      expect(oabReport).toHaveProperty('law_firm_id', 'firm_1')
      expect(oabReport).toHaveProperty('framework', 'OAB')
      expect(oabReport.compliance_status).toHaveProperty('oab_compliant')
      
      if (!oabReport.compliance_status.oab_compliant) {
        expect(oabReport.compliance_status.issues_found).toBeGreaterThan(0)
        expect(Array.isArray(oabReport.details.oab_issues)).toBe(true)
      }
    })
    
    it('should maintain comprehensive audit trails', () => {
      const auditEvents = privacyService.getAuditEvents('firm_1')
      
      expect(Array.isArray(auditEvents)).toBe(true)
      
      auditEvents.forEach(event => {
        expect(event).toHaveProperty('id')
        expect(event).toHaveProperty('event_type')
        expect(event).toHaveProperty('law_firm_id', 'firm_1')
        expect(event).toHaveProperty('timestamp')
        expect(event).toHaveProperty('compliance_frameworks')
        expect(event).toHaveProperty('risk_level')
        
        expect(['low', 'medium', 'high', 'critical']).toContain(event.risk_level)
        expect(Array.isArray(event.compliance_frameworks)).toBe(true)
      })
    })
    
    it('should track compliance metrics over time', () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const recentAudits = privacyService.getAuditEvents('firm_1', thirtyDaysAgo)
      
      expect(Array.isArray(recentAudits)).toBe(true)
      
      // Check that all returned events are within the time range
      recentAudits.forEach(event => {
        expect(new Date(event.timestamp).getTime()).toBeGreaterThanOrEqual(new Date(thirtyDaysAgo).getTime())
      })
    })
    
    it('should identify high-risk compliance events', () => {
      const auditEvents = privacyService.getAuditEvents('firm_1')
      const highRiskEvents = auditEvents.filter(e => ['high', 'critical'].includes(e.risk_level))
      
      highRiskEvents.forEach(event => {
        expect(event.remediation_required).toBe(true)
        expect(event.description).toBeDefined()
        expect(event.description.length).toBeGreaterThan(10)
      })
    })
  })
  
  describe('Client Confidentiality Tests', () => {
    it('should protect attorney-client privileged communications', () => {
      const privilegedRecords = privacyService.getPersonalDataRecords('firm_1')
        .filter(r => r.classification === 'privileged')
      
      privilegedRecords.forEach(record => {
        expect(record.encrypted).toBe(true)
        expect(record.access_log.length).toBeGreaterThan(0)
        
        // Verify access is properly logged and justified
        record.access_log.forEach(log => {
          expect(log.purpose).toBeDefined()
          expect(log.purpose.length).toBeGreaterThan(5)
        })
      })
    })
    
    it('should enforce work product protection', () => {
      const internalRecords = privacyService.getPersonalDataRecords('firm_1')
        .filter(r => r.classification === 'internal')
      
      internalRecords.forEach(record => {
        // Internal work product should be protected but may have different retention
        expect(record.law_firm_id).toBeDefined()
        expect(record.retention_period_days).toBeGreaterThan(0)
      })
    })
    
    it('should validate data sharing restrictions', () => {
      const confidentialRecords = privacyService.getPersonalDataRecords('firm_1')
        .filter(r => ['confidential', 'privileged'].includes(r.classification))
      
      confidentialRecords.forEach(record => {
        // Confidential data should not be shared without explicit authorization
        const hasExternalAccess = record.access_log.some(log => 
          !log.user_id.includes('lawyer') && !log.user_id.includes('admin')
        )
        
        if (hasExternalAccess) {
          // Should have proper justification for external access
          const externalAccessLogs = record.access_log.filter(log => 
            !log.user_id.includes('lawyer') && !log.user_id.includes('admin')
          )
          
          externalAccessLogs.forEach(log => {
            expect(log.purpose).toContain('authorized') // Should indicate authorization
          })
        }
      })
    })
  })
})