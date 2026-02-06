// =====================================================
// Prima Facie - Permission Matrix Tests
// Comprehensive permission testing for all features by role
// =====================================================

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'

// Feature definitions for the legal platform
type FeatureModule = 
  | 'invoice_management'
  | 'time_tracking' 
  | 'financial_data'
  | 'client_data'
  | 'case_management'
  | 'document_management'
  | 'reporting_analytics'
  | 'system_configuration'
  | 'user_management'
  | 'billing_configuration'
  | 'legal_workflow'
  | 'communication'
  | 'audit_logs'
  | 'data_export'

type Permission = 'create' | 'read' | 'update' | 'delete' | 'admin' | 'export' | 'approve' | 'configure'

type UserRole = 
  | 'super_admin'
  | 'law_firm_admin' 
  | 'senior_lawyer'
  | 'junior_lawyer'
  | 'paralegal'
  | 'accountant'
  | 'client'
  | 'read_only'

interface PermissionRule {
  role: UserRole
  feature: FeatureModule
  permissions: Record<Permission, boolean>
  conditions?: string[]
  restrictions?: string[]
}

interface FeatureAction {
  feature: FeatureModule
  action: Permission
  description: string
  requires_approval?: boolean
  sensitive?: boolean
  audit_required?: boolean
}

// Comprehensive permission matrix for the legal platform
const PERMISSION_MATRIX: PermissionRule[] = [
  // SUPER ADMIN - Platform-wide management
  {
    role: 'super_admin',
    feature: 'invoice_management',
    permissions: { create: true, read: true, update: true, delete: true, admin: true, export: true, approve: true, configure: true }
  },
  {
    role: 'super_admin',
    feature: 'time_tracking',
    permissions: { create: true, read: true, update: true, delete: true, admin: true, export: true, approve: true, configure: true }
  },
  {
    role: 'super_admin',
    feature: 'financial_data',
    permissions: { create: true, read: true, update: true, delete: true, admin: true, export: true, approve: true, configure: true }
  },
  {
    role: 'super_admin',
    feature: 'client_data',
    permissions: { create: true, read: true, update: true, delete: true, admin: true, export: true, approve: true, configure: true }
  },
  {
    role: 'super_admin',
    feature: 'case_management',
    permissions: { create: true, read: true, update: true, delete: true, admin: true, export: true, approve: true, configure: true }
  },
  {
    role: 'super_admin',
    feature: 'document_management',
    permissions: { create: true, read: true, update: true, delete: true, admin: true, export: true, approve: true, configure: true }
  },
  {
    role: 'super_admin',
    feature: 'reporting_analytics',
    permissions: { create: true, read: true, update: true, delete: true, admin: true, export: true, approve: true, configure: true }
  },
  {
    role: 'super_admin',
    feature: 'system_configuration',
    permissions: { create: true, read: true, update: true, delete: true, admin: true, export: true, approve: true, configure: true }
  },
  {
    role: 'super_admin',
    feature: 'user_management',
    permissions: { create: true, read: true, update: true, delete: true, admin: true, export: true, approve: true, configure: true }
  },

  // LAW FIRM ADMIN - Firm-wide management and configuration
  {
    role: 'law_firm_admin',
    feature: 'invoice_management',
    permissions: { create: true, read: true, update: true, delete: true, admin: true, export: true, approve: true, configure: true },
    conditions: ['same_law_firm']
  },
  {
    role: 'law_firm_admin',
    feature: 'time_tracking',
    permissions: { create: true, read: true, update: true, delete: true, admin: true, export: true, approve: true, configure: true },
    conditions: ['same_law_firm']
  },
  {
    role: 'law_firm_admin',
    feature: 'financial_data',
    permissions: { create: true, read: true, update: true, delete: true, admin: true, export: true, approve: true, configure: true },
    conditions: ['same_law_firm']
  },
  {
    role: 'law_firm_admin',
    feature: 'client_data',
    permissions: { create: true, read: true, update: true, delete: true, admin: true, export: true, approve: true, configure: true },
    conditions: ['same_law_firm']
  },
  {
    role: 'law_firm_admin',
    feature: 'case_management',
    permissions: { create: true, read: true, update: true, delete: true, admin: true, export: true, approve: true, configure: true },
    conditions: ['same_law_firm']
  },
  {
    role: 'law_firm_admin',
    feature: 'document_management',
    permissions: { create: true, read: true, update: true, delete: true, admin: true, export: true, approve: true, configure: true },
    conditions: ['same_law_firm', 'access_level_check']
  },
  {
    role: 'law_firm_admin',
    feature: 'reporting_analytics',
    permissions: { create: true, read: true, update: true, delete: true, admin: true, export: true, approve: true, configure: true },
    conditions: ['same_law_firm']
  },
  {
    role: 'law_firm_admin',
    feature: 'system_configuration',
    permissions: { create: true, read: true, update: true, delete: true, admin: true, export: false, approve: true, configure: true },
    conditions: ['same_law_firm']
  },
  {
    role: 'law_firm_admin',
    feature: 'user_management',
    permissions: { create: true, read: true, update: true, delete: true, admin: true, export: true, approve: true, configure: true },
    conditions: ['same_law_firm']
  },

  // SENIOR LAWYER - Full case and client management
  {
    role: 'senior_lawyer',
    feature: 'invoice_management',
    permissions: { create: true, read: true, update: true, delete: false, admin: false, export: true, approve: true, configure: false },
    conditions: ['same_law_firm', 'own_cases_or_assigned']
  },
  {
    role: 'senior_lawyer',
    feature: 'time_tracking',
    permissions: { create: true, read: true, update: true, delete: true, admin: false, export: true, approve: false, configure: false },
    conditions: ['same_law_firm']
  },
  {
    role: 'senior_lawyer',
    feature: 'financial_data',
    permissions: { create: false, read: true, update: false, delete: false, admin: false, export: true, approve: false, configure: false },
    conditions: ['same_law_firm', 'own_cases_only']
  },
  {
    role: 'senior_lawyer',
    feature: 'client_data',
    permissions: { create: true, read: true, update: true, delete: false, admin: false, export: true, approve: false, configure: false },
    conditions: ['same_law_firm']
  },
  {
    role: 'senior_lawyer',
    feature: 'case_management',
    permissions: { create: true, read: true, update: true, delete: false, admin: false, export: true, approve: true, configure: false },
    conditions: ['same_law_firm']
  },
  {
    role: 'senior_lawyer',
    feature: 'document_management',
    permissions: { create: true, read: true, update: true, delete: true, admin: false, export: true, approve: true, configure: false },
    conditions: ['same_law_firm', 'case_access', 'access_level_check']
  },
  {
    role: 'senior_lawyer',
    feature: 'reporting_analytics',
    permissions: { create: false, read: true, update: false, delete: false, admin: false, export: true, approve: false, configure: false },
    conditions: ['same_law_firm', 'own_data_only']
  },
  {
    role: 'senior_lawyer',
    feature: 'user_management',
    permissions: { create: false, read: true, update: false, delete: false, admin: false, export: false, approve: false, configure: false },
    conditions: ['same_law_firm', 'basic_info_only']
  },

  // JUNIOR LAWYER - Limited case access and time tracking
  {
    role: 'junior_lawyer',
    feature: 'invoice_management',
    permissions: { create: false, read: true, update: false, delete: false, admin: false, export: false, approve: false, configure: false },
    conditions: ['same_law_firm', 'assigned_cases_only']
  },
  {
    role: 'junior_lawyer',
    feature: 'time_tracking',
    permissions: { create: true, read: true, update: true, delete: true, admin: false, export: false, approve: false, configure: false },
    conditions: ['same_law_firm', 'own_entries_only']
  },
  {
    role: 'junior_lawyer',
    feature: 'financial_data',
    permissions: { create: false, read: false, update: false, delete: false, admin: false, export: false, approve: false, configure: false }
  },
  {
    role: 'junior_lawyer',
    feature: 'client_data',
    permissions: { create: false, read: true, update: false, delete: false, admin: false, export: false, approve: false, configure: false },
    conditions: ['same_law_firm', 'assigned_cases_only']
  },
  {
    role: 'junior_lawyer',
    feature: 'case_management',
    permissions: { create: false, read: true, update: true, delete: false, admin: false, export: false, approve: false, configure: false },
    conditions: ['same_law_firm', 'assigned_only']
  },
  {
    role: 'junior_lawyer',
    feature: 'document_management',
    permissions: { create: true, read: true, update: true, delete: false, admin: false, export: false, approve: false, configure: false },
    conditions: ['same_law_firm', 'assigned_cases_only', 'non_confidential']
  },
  {
    role: 'junior_lawyer',
    feature: 'reporting_analytics',
    permissions: { create: false, read: true, update: false, delete: false, admin: false, export: false, approve: false, configure: false },
    conditions: ['same_law_firm', 'time_tracking_reports_only']
  },

  // PARALEGAL - Administrative tasks and document management
  {
    role: 'paralegal',
    feature: 'invoice_management',
    permissions: { create: false, read: true, update: false, delete: false, admin: false, export: false, approve: false, configure: false },
    conditions: ['same_law_firm', 'assigned_cases_only']
  },
  {
    role: 'paralegal',
    feature: 'time_tracking',
    permissions: { create: true, read: true, update: true, delete: false, admin: false, export: false, approve: false, configure: false },
    conditions: ['same_law_firm', 'own_entries_only']
  },
  {
    role: 'paralegal',
    feature: 'client_data',
    permissions: { create: true, read: true, update: true, delete: false, admin: false, export: false, approve: false, configure: false },
    conditions: ['same_law_firm']
  },
  {
    role: 'paralegal',
    feature: 'case_management',
    permissions: { create: false, read: true, update: true, delete: false, admin: false, export: false, approve: false, configure: false },
    conditions: ['same_law_firm', 'assigned_only']
  },
  {
    role: 'paralegal',
    feature: 'document_management',
    permissions: { create: true, read: true, update: true, delete: false, admin: false, export: false, approve: false, configure: false },
    conditions: ['same_law_firm', 'assigned_cases_only', 'non_confidential']
  },
  {
    role: 'paralegal',
    feature: 'reporting_analytics',
    permissions: { create: false, read: true, update: false, delete: false, admin: false, export: false, approve: false, configure: false },
    conditions: ['same_law_firm', 'administrative_reports_only']
  },

  // ACCOUNTANT - Financial management and reporting
  {
    role: 'accountant',
    feature: 'invoice_management',
    permissions: { create: true, read: true, update: true, delete: false, admin: false, export: true, approve: true, configure: false },
    conditions: ['same_law_firm']
  },
  {
    role: 'accountant',
    feature: 'time_tracking',
    permissions: { create: false, read: true, update: false, delete: false, admin: false, export: true, approve: false, configure: false },
    conditions: ['same_law_firm', 'billing_purposes_only']
  },
  {
    role: 'accountant',
    feature: 'financial_data',
    permissions: { create: true, read: true, update: true, delete: false, admin: false, export: true, approve: true, configure: false },
    conditions: ['same_law_firm']
  },
  {
    role: 'accountant',
    feature: 'client_data',
    permissions: { create: false, read: true, update: true, delete: false, admin: false, export: false, approve: false, configure: false },
    conditions: ['same_law_firm', 'billing_info_only']
  },
  {
    role: 'accountant',
    feature: 'case_management',
    permissions: { create: false, read: true, update: false, delete: false, admin: false, export: false, approve: false, configure: false },
    conditions: ['same_law_firm', 'financial_aspects_only']
  },
  {
    role: 'accountant',
    feature: 'document_management',
    permissions: { create: false, read: false, update: false, delete: false, admin: false, export: false, approve: false, configure: false }
  },
  {
    role: 'accountant',
    feature: 'reporting_analytics',
    permissions: { create: true, read: true, update: true, delete: false, admin: false, export: true, approve: false, configure: false },
    conditions: ['same_law_firm', 'financial_reports_only']
  },

  // CLIENT - Limited portal access to their cases
  {
    role: 'client',
    feature: 'invoice_management',
    permissions: { create: false, read: true, update: false, delete: false, admin: false, export: false, approve: false, configure: false },
    conditions: ['own_invoices_only']
  },
  {
    role: 'client',
    feature: 'time_tracking',
    permissions: { create: false, read: true, update: false, delete: false, admin: false, export: false, approve: false, configure: false },
    conditions: ['own_cases_only', 'billable_entries_only']
  },
  {
    role: 'client',
    feature: 'client_data',
    permissions: { create: false, read: true, update: true, delete: false, admin: false, export: false, approve: false, configure: false },
    conditions: ['own_profile_only']
  },
  {
    role: 'client',
    feature: 'case_management',
    permissions: { create: false, read: true, update: false, delete: false, admin: false, export: false, approve: false, configure: false },
    conditions: ['own_cases_only', 'basic_info_only']
  },
  {
    role: 'client',
    feature: 'document_management',
    permissions: { create: false, read: true, update: false, delete: false, admin: false, export: false, approve: false, configure: false },
    conditions: ['own_cases_only', 'client_accessible_only']
  },
  {
    role: 'client',
    feature: 'communication',
    permissions: { create: true, read: true, update: false, delete: false, admin: false, export: false, approve: false, configure: false },
    conditions: ['own_conversations_only']
  },

  // READ-ONLY - View-only access for auditing
  {
    role: 'read_only',
    feature: 'invoice_management',
    permissions: { create: false, read: true, update: false, delete: false, admin: false, export: true, approve: false, configure: false },
    conditions: ['same_law_firm', 'audit_purpose_only']
  },
  {
    role: 'read_only',
    feature: 'time_tracking',
    permissions: { create: false, read: true, update: false, delete: false, admin: false, export: true, approve: false, configure: false },
    conditions: ['same_law_firm', 'audit_purpose_only']
  },
  {
    role: 'read_only',
    feature: 'financial_data',
    permissions: { create: false, read: true, update: false, delete: false, admin: false, export: true, approve: false, configure: false },
    conditions: ['same_law_firm', 'audit_purpose_only']
  },
  {
    role: 'read_only',
    feature: 'client_data',
    permissions: { create: false, read: true, update: false, delete: false, admin: false, export: true, approve: false, configure: false },
    conditions: ['same_law_firm', 'audit_purpose_only']
  },
  {
    role: 'read_only',
    feature: 'case_management',
    permissions: { create: false, read: true, update: false, delete: false, admin: false, export: true, approve: false, configure: false },
    conditions: ['same_law_firm', 'audit_purpose_only']
  },
  {
    role: 'read_only',
    feature: 'document_management',
    permissions: { create: false, read: true, update: false, delete: false, admin: false, export: true, approve: false, configure: false },
    conditions: ['same_law_firm', 'audit_purpose_only']
  },
  {
    role: 'read_only',
    feature: 'reporting_analytics',
    permissions: { create: false, read: true, update: false, delete: false, admin: false, export: true, approve: false, configure: false },
    conditions: ['same_law_firm', 'audit_purpose_only']
  },
  {
    role: 'read_only',
    feature: 'audit_logs',
    permissions: { create: false, read: true, update: false, delete: false, admin: false, export: true, approve: false, configure: false },
    conditions: ['same_law_firm', 'audit_purpose_only']
  }
]

// Feature actions that require testing
const FEATURE_ACTIONS: FeatureAction[] = [
  // Invoice Management
  { feature: 'invoice_management', action: 'create', description: 'Create new invoice', audit_required: true },
  { feature: 'invoice_management', action: 'read', description: 'View invoice details' },
  { feature: 'invoice_management', action: 'update', description: 'Modify invoice', audit_required: true },
  { feature: 'invoice_management', action: 'delete', description: 'Delete invoice', sensitive: true, audit_required: true },
  { feature: 'invoice_management', action: 'approve', description: 'Approve invoice for payment', requires_approval: true },
  { feature: 'invoice_management', action: 'export', description: 'Export invoice data', audit_required: true },

  // Time Tracking
  { feature: 'time_tracking', action: 'create', description: 'Log time entry' },
  { feature: 'time_tracking', action: 'read', description: 'View time entries' },
  { feature: 'time_tracking', action: 'update', description: 'Modify time entry', audit_required: true },
  { feature: 'time_tracking', action: 'delete', description: 'Delete time entry', audit_required: true },
  { feature: 'time_tracking', action: 'approve', description: 'Approve time for billing', requires_approval: true },

  // Financial Data
  { feature: 'financial_data', action: 'read', description: 'View financial reports', sensitive: true },
  { feature: 'financial_data', action: 'create', description: 'Create financial entries', sensitive: true, audit_required: true },
  { feature: 'financial_data', action: 'update', description: 'Modify financial data', sensitive: true, audit_required: true },
  { feature: 'financial_data', action: 'export', description: 'Export financial data', sensitive: true, audit_required: true },

  // Client Data
  { feature: 'client_data', action: 'create', description: 'Add new client', audit_required: true },
  { feature: 'client_data', action: 'read', description: 'View client information' },
  { feature: 'client_data', action: 'update', description: 'Modify client data', audit_required: true },
  { feature: 'client_data', action: 'delete', description: 'Delete client record', sensitive: true, audit_required: true },

  // Case Management
  { feature: 'case_management', action: 'create', description: 'Create new case', audit_required: true },
  { feature: 'case_management', action: 'read', description: 'View case details' },
  { feature: 'case_management', action: 'update', description: 'Modify case information', audit_required: true },
  { feature: 'case_management', action: 'delete', description: 'Delete case', sensitive: true, audit_required: true },

  // Document Management
  { feature: 'document_management', action: 'create', description: 'Upload new document', audit_required: true },
  { feature: 'document_management', action: 'read', description: 'View document' },
  { feature: 'document_management', action: 'update', description: 'Modify document', audit_required: true },
  { feature: 'document_management', action: 'delete', description: 'Delete document', sensitive: true, audit_required: true },

  // System Configuration
  { feature: 'system_configuration', action: 'read', description: 'View system settings' },
  { feature: 'system_configuration', action: 'update', description: 'Modify system configuration', sensitive: true, audit_required: true },
  { feature: 'system_configuration', action: 'configure', description: 'Configure system features', sensitive: true, audit_required: true },

  // User Management
  { feature: 'user_management', action: 'create', description: 'Create new user', audit_required: true },
  { feature: 'user_management', action: 'read', description: 'View user information' },
  { feature: 'user_management', action: 'update', description: 'Modify user data', audit_required: true },
  { feature: 'user_management', action: 'delete', description: 'Delete user account', sensitive: true, audit_required: true },

  // Reporting & Analytics
  { feature: 'reporting_analytics', action: 'read', description: 'View reports and analytics' },
  { feature: 'reporting_analytics', action: 'create', description: 'Create custom reports', audit_required: true },
  { feature: 'reporting_analytics', action: 'export', description: 'Export report data', audit_required: true }
]

// Mock Permission Service
class MockPermissionService {
  private permissionMatrix: PermissionRule[]
  
  constructor() {
    this.permissionMatrix = PERMISSION_MATRIX
  }
  
  // Check if role has permission for feature action
  hasPermission(role: UserRole, feature: FeatureModule, action: Permission): boolean {
    const rules = this.permissionMatrix.filter(rule => 
      rule.role === role && rule.feature === feature
    )
    
    if (rules.length === 0) {
      return false // No rules defined = no access
    }
    
    return rules.some(rule => rule.permissions[action] === true)
  }
  
  // Get all permissions for a role and feature
  getPermissions(role: UserRole, feature: FeatureModule): Record<Permission, boolean> | null {
    const rule = this.permissionMatrix.find(rule => 
      rule.role === role && rule.feature === feature
    )
    
    return rule ? rule.permissions : null
  }
  
  // Get conditions for a permission
  getConditions(role: UserRole, feature: FeatureModule): string[] {
    const rule = this.permissionMatrix.find(rule => 
      rule.role === role && rule.feature === feature
    )
    
    return rule?.conditions || []
  }
  
  // Get all features accessible by role
  getAccessibleFeatures(role: UserRole): FeatureModule[] {
    const accessibleFeatures = new Set<FeatureModule>()
    
    this.permissionMatrix
      .filter(rule => rule.role === role)
      .forEach(rule => {
        // Check if role has any permission for this feature
        const hasAnyPermission = Object.values(rule.permissions).some(permission => permission)
        if (hasAnyPermission) {
          accessibleFeatures.add(rule.feature)
        }
      })
    
    return Array.from(accessibleFeatures)
  }
  
  // Check if action requires approval
  requiresApproval(feature: FeatureModule, action: Permission): boolean {
    const featureAction = FEATURE_ACTIONS.find(fa => 
      fa.feature === feature && fa.action === action
    )
    
    return featureAction?.requires_approval || false
  }
  
  // Check if action is sensitive
  isSensitiveAction(feature: FeatureModule, action: Permission): boolean {
    const featureAction = FEATURE_ACTIONS.find(fa => 
      fa.feature === feature && fa.action === action
    )
    
    return featureAction?.sensitive || false
  }
  
  // Check if action requires audit logging
  requiresAuditLogging(feature: FeatureModule, action: Permission): boolean {
    const featureAction = FEATURE_ACTIONS.find(fa => 
      fa.feature === feature && fa.action === action
    )
    
    return featureAction?.audit_required || false
  }
  
  // Get permission summary for role
  getPermissionSummary(role: UserRole): Record<FeatureModule, Record<Permission, boolean>> {
    const summary: Record<string, Record<Permission, boolean>> = {}
    
    this.permissionMatrix
      .filter(rule => rule.role === role)
      .forEach(rule => {
        summary[rule.feature] = rule.permissions
      })
    
    return summary as Record<FeatureModule, Record<Permission, boolean>>
  }
  
  // Validate permission matrix consistency
  validatePermissionMatrix(): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    // Check for duplicate rules
    const ruleKeys = this.permissionMatrix.map(rule => `${rule.role}:${rule.feature}`)
    const duplicates = ruleKeys.filter((key, index) => ruleKeys.indexOf(key) !== index)
    
    if (duplicates.length > 0) {
      errors.push(`Duplicate permission rules found: ${duplicates.join(', ')}`)
    }
    
    // Check for missing critical permissions
    const criticalFeatures: FeatureModule[] = ['invoice_management', 'client_data', 'case_management']
    const roles: UserRole[] = ['law_firm_admin', 'senior_lawyer', 'junior_lawyer']
    
    roles.forEach(role => {
      criticalFeatures.forEach(feature => {
        const hasRule = this.permissionMatrix.some(rule => 
          rule.role === role && rule.feature === feature
        )
        
        if (!hasRule) {
          errors.push(`Missing permission rule for ${role}:${feature}`)
        }
      })
    })
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
}

describe('Permission Matrix Tests', () => {
  let permissionService: MockPermissionService
  
  beforeEach(() => {
    permissionService = new MockPermissionService()
  })
  
  afterEach(() => {
    jest.clearAllMocks()
  })
  
  describe('Super Admin Permissions', () => {
    const role: UserRole = 'super_admin'
    
    it('should have full access to all features', () => {
      const features: FeatureModule[] = [
        'invoice_management', 'time_tracking', 'financial_data', 'client_data',
        'case_management', 'document_management', 'reporting_analytics',
        'system_configuration', 'user_management'
      ]
      
      features.forEach(feature => {
        expect(permissionService.hasPermission(role, feature, 'create')).toBe(true)
        expect(permissionService.hasPermission(role, feature, 'read')).toBe(true)
        expect(permissionService.hasPermission(role, feature, 'update')).toBe(true)
        expect(permissionService.hasPermission(role, feature, 'delete')).toBe(true)
        expect(permissionService.hasPermission(role, feature, 'admin')).toBe(true)
      })
    })
    
    it('should have configuration and approval permissions', () => {
      expect(permissionService.hasPermission(role, 'system_configuration', 'configure')).toBe(true)
      expect(permissionService.hasPermission(role, 'invoice_management', 'approve')).toBe(true)
      expect(permissionService.hasPermission(role, 'financial_data', 'export')).toBe(true)
    })
  })
  
  describe('Law Firm Admin Permissions', () => {
    const role: UserRole = 'law_firm_admin'
    
    it('should have full access to firm management features', () => {
      const features: FeatureModule[] = [
        'invoice_management', 'time_tracking', 'financial_data', 'client_data',
        'case_management', 'user_management'
      ]
      
      features.forEach(feature => {
        expect(permissionService.hasPermission(role, feature, 'create')).toBe(true)
        expect(permissionService.hasPermission(role, feature, 'read')).toBe(true)
        expect(permissionService.hasPermission(role, feature, 'update')).toBe(true)
        expect(permissionService.hasPermission(role, feature, 'delete')).toBe(true)
        expect(permissionService.hasPermission(role, feature, 'admin')).toBe(true)
      })
    })
    
    it('should have appropriate conditions for firm isolation', () => {
      const conditions = permissionService.getConditions(role, 'invoice_management')
      expect(conditions).toContain('same_law_firm')
    })
    
    it('should have system configuration access but not global exports', () => {
      expect(permissionService.hasPermission(role, 'system_configuration', 'configure')).toBe(true)
      expect(permissionService.hasPermission(role, 'system_configuration', 'export')).toBe(false)
    })
  })
  
  describe('Senior Lawyer Permissions', () => {
    const role: UserRole = 'senior_lawyer'
    
    it('should have full case and client management access', () => {
      expect(permissionService.hasPermission(role, 'case_management', 'create')).toBe(true)
      expect(permissionService.hasPermission(role, 'case_management', 'read')).toBe(true)
      expect(permissionService.hasPermission(role, 'case_management', 'update')).toBe(true)
      
      expect(permissionService.hasPermission(role, 'client_data', 'create')).toBe(true)
      expect(permissionService.hasPermission(role, 'client_data', 'read')).toBe(true)
      expect(permissionService.hasPermission(role, 'client_data', 'update')).toBe(true)
    })
    
    it('should have invoice management but not deletion rights', () => {
      expect(permissionService.hasPermission(role, 'invoice_management', 'create')).toBe(true)
      expect(permissionService.hasPermission(role, 'invoice_management', 'read')).toBe(true)
      expect(permissionService.hasPermission(role, 'invoice_management', 'update')).toBe(true)
      expect(permissionService.hasPermission(role, 'invoice_management', 'delete')).toBe(false)
    })
    
    it('should have limited financial data access', () => {
      expect(permissionService.hasPermission(role, 'financial_data', 'read')).toBe(true)
      expect(permissionService.hasPermission(role, 'financial_data', 'create')).toBe(false)
      expect(permissionService.hasPermission(role, 'financial_data', 'update')).toBe(false)
    })
    
    it('should not have admin or system configuration access', () => {
      expect(permissionService.hasPermission(role, 'case_management', 'admin')).toBe(false)
      expect(permissionService.hasPermission(role, 'system_configuration', 'configure')).toBe(false)
    })
  })
  
  describe('Junior Lawyer Permissions', () => {
    const role: UserRole = 'junior_lawyer'
    
    it('should have limited case access (assigned only)', () => {
      expect(permissionService.hasPermission(role, 'case_management', 'create')).toBe(false)
      expect(permissionService.hasPermission(role, 'case_management', 'read')).toBe(true)
      expect(permissionService.hasPermission(role, 'case_management', 'update')).toBe(true)
      
      const conditions = permissionService.getConditions(role, 'case_management')
      expect(conditions).toContain('assigned_only')
    })
    
    it('should have full time tracking access for own entries', () => {
      expect(permissionService.hasPermission(role, 'time_tracking', 'create')).toBe(true)
      expect(permissionService.hasPermission(role, 'time_tracking', 'read')).toBe(true)
      expect(permissionService.hasPermission(role, 'time_tracking', 'update')).toBe(true)
      expect(permissionService.hasPermission(role, 'time_tracking', 'delete')).toBe(true)
      
      const conditions = permissionService.getConditions(role, 'time_tracking')
      expect(conditions).toContain('own_entries_only')
    })
    
    it('should not have financial data access', () => {
      expect(permissionService.hasPermission(role, 'financial_data', 'read')).toBe(false)
      expect(permissionService.hasPermission(role, 'financial_data', 'create')).toBe(false)
    })
    
    it('should have limited document access (non-confidential)', () => {
      expect(permissionService.hasPermission(role, 'document_management', 'read')).toBe(true)
      expect(permissionService.hasPermission(role, 'document_management', 'create')).toBe(true)
      
      const conditions = permissionService.getConditions(role, 'document_management')
      expect(conditions).toContain('non_confidential')
    })
  })
  
  describe('Paralegal Permissions', () => {
    const role: UserRole = 'paralegal'
    
    it('should have client data management access', () => {
      expect(permissionService.hasPermission(role, 'client_data', 'create')).toBe(true)
      expect(permissionService.hasPermission(role, 'client_data', 'read')).toBe(true)
      expect(permissionService.hasPermission(role, 'client_data', 'update')).toBe(true)
      expect(permissionService.hasPermission(role, 'client_data', 'delete')).toBe(false)
    })
    
    it('should have document management for assigned cases', () => {
      expect(permissionService.hasPermission(role, 'document_management', 'create')).toBe(true)
      expect(permissionService.hasPermission(role, 'document_management', 'read')).toBe(true)
      expect(permissionService.hasPermission(role, 'document_management', 'update')).toBe(true)
      
      const conditions = permissionService.getConditions(role, 'document_management')
      expect(conditions).toContain('assigned_cases_only')
      expect(conditions).toContain('non_confidential')
    })
    
    it('should not have case creation or financial access', () => {
      expect(permissionService.hasPermission(role, 'case_management', 'create')).toBe(false)
      expect(permissionService.hasPermission(role, 'financial_data', 'read')).toBe(false)
    })
  })
  
  describe('Accountant Permissions', () => {
    const role: UserRole = 'accountant'
    
    it('should have full invoice management access', () => {
      expect(permissionService.hasPermission(role, 'invoice_management', 'create')).toBe(true)
      expect(permissionService.hasPermission(role, 'invoice_management', 'read')).toBe(true)
      expect(permissionService.hasPermission(role, 'invoice_management', 'update')).toBe(true)
      expect(permissionService.hasPermission(role, 'invoice_management', 'approve')).toBe(true)
      expect(permissionService.hasPermission(role, 'invoice_management', 'export')).toBe(true)
    })
    
    it('should have comprehensive financial data access', () => {
      expect(permissionService.hasPermission(role, 'financial_data', 'create')).toBe(true)
      expect(permissionService.hasPermission(role, 'financial_data', 'read')).toBe(true)
      expect(permissionService.hasPermission(role, 'financial_data', 'update')).toBe(true)
      expect(permissionService.hasPermission(role, 'financial_data', 'export')).toBe(true)
    })
    
    it('should have limited client data access (billing info only)', () => {
      expect(permissionService.hasPermission(role, 'client_data', 'read')).toBe(true)
      expect(permissionService.hasPermission(role, 'client_data', 'update')).toBe(true)
      expect(permissionService.hasPermission(role, 'client_data', 'create')).toBe(false)
      
      const conditions = permissionService.getConditions(role, 'client_data')
      expect(conditions).toContain('billing_info_only')
    })
    
    it('should not have document or case management access', () => {
      expect(permissionService.hasPermission(role, 'document_management', 'read')).toBe(false)
      expect(permissionService.hasPermission(role, 'case_management', 'create')).toBe(false)
      expect(permissionService.hasPermission(role, 'case_management', 'update')).toBe(false)
    })
    
    it('should have financial reporting capabilities', () => {
      expect(permissionService.hasPermission(role, 'reporting_analytics', 'create')).toBe(true)
      expect(permissionService.hasPermission(role, 'reporting_analytics', 'read')).toBe(true)
      expect(permissionService.hasPermission(role, 'reporting_analytics', 'export')).toBe(true)
      
      const conditions = permissionService.getConditions(role, 'reporting_analytics')
      expect(conditions).toContain('financial_reports_only')
    })
  })
  
  describe('Client Permissions', () => {
    const role: UserRole = 'client'
    
    it('should have limited access to own data only', () => {
      expect(permissionService.hasPermission(role, 'invoice_management', 'read')).toBe(true)
      expect(permissionService.hasPermission(role, 'invoice_management', 'create')).toBe(false)
      expect(permissionService.hasPermission(role, 'invoice_management', 'update')).toBe(false)
      
      const conditions = permissionService.getConditions(role, 'invoice_management')
      expect(conditions).toContain('own_invoices_only')
    })
    
    it('should have read-only access to own cases', () => {
      expect(permissionService.hasPermission(role, 'case_management', 'read')).toBe(true)
      expect(permissionService.hasPermission(role, 'case_management', 'create')).toBe(false)
      expect(permissionService.hasPermission(role, 'case_management', 'update')).toBe(false)
      
      const conditions = permissionService.getConditions(role, 'case_management')
      expect(conditions).toContain('own_cases_only')
    })
    
    it('should be able to update own profile', () => {
      expect(permissionService.hasPermission(role, 'client_data', 'read')).toBe(true)
      expect(permissionService.hasPermission(role, 'client_data', 'update')).toBe(true)
      
      const conditions = permissionService.getConditions(role, 'client_data')
      expect(conditions).toContain('own_profile_only')
    })
    
    it('should have communication access', () => {
      expect(permissionService.hasPermission(role, 'communication', 'create')).toBe(true)
      expect(permissionService.hasPermission(role, 'communication', 'read')).toBe(true)
    })
    
    it('should not have any administrative access', () => {
      expect(permissionService.hasPermission(role, 'user_management', 'read')).toBe(false)
      expect(permissionService.hasPermission(role, 'system_configuration', 'read')).toBe(false)
      expect(permissionService.hasPermission(role, 'financial_data', 'read')).toBe(false)
    })
  })
  
  describe('Read-Only Role Permissions', () => {
    const role: UserRole = 'read_only'
    
    it('should have read access to all features for auditing', () => {
      const features: FeatureModule[] = [
        'invoice_management', 'time_tracking', 'financial_data', 'client_data',
        'case_management', 'document_management', 'reporting_analytics'
      ]
      
      features.forEach(feature => {
        expect(permissionService.hasPermission(role, feature, 'read')).toBe(true)
        
        const conditions = permissionService.getConditions(role, feature)
        expect(conditions).toContain('audit_purpose_only')
      })
    })
    
    it('should have export capabilities for audit reports', () => {
      expect(permissionService.hasPermission(role, 'invoice_management', 'export')).toBe(true)
      expect(permissionService.hasPermission(role, 'financial_data', 'export')).toBe(true)
      expect(permissionService.hasPermission(role, 'reporting_analytics', 'export')).toBe(true)
    })
    
    it('should not have any write permissions', () => {
      const writeActions: Permission[] = ['create', 'update', 'delete', 'configure', 'approve']
      const features: FeatureModule[] = [
        'invoice_management', 'time_tracking', 'financial_data', 'client_data',
        'case_management', 'document_management'
      ]
      
      features.forEach(feature => {
        writeActions.forEach(action => {
          expect(permissionService.hasPermission(role, feature, action)).toBe(false)
        })
      })
    })
    
    it('should have access to audit logs', () => {
      expect(permissionService.hasPermission(role, 'audit_logs', 'read')).toBe(true)
      expect(permissionService.hasPermission(role, 'audit_logs', 'export')).toBe(true)
    })
  })
  
  describe('Feature-Specific Permission Tests', () => {
    it('should identify sensitive actions correctly', () => {
      expect(permissionService.isSensitiveAction('financial_data', 'read')).toBe(true)
      expect(permissionService.isSensitiveAction('client_data', 'delete')).toBe(true)
      expect(permissionService.isSensitiveAction('system_configuration', 'update')).toBe(true)
      expect(permissionService.isSensitiveAction('time_tracking', 'create')).toBe(false)
    })
    
    it('should identify actions requiring approval', () => {
      expect(permissionService.requiresApproval('invoice_management', 'approve')).toBe(true)
      expect(permissionService.requiresApproval('time_tracking', 'approve')).toBe(true)
      expect(permissionService.requiresApproval('client_data', 'create')).toBe(false)
    })
    
    it('should identify actions requiring audit logging', () => {
      expect(permissionService.requiresAuditLogging('invoice_management', 'create')).toBe(true)
      expect(permissionService.requiresAuditLogging('client_data', 'update')).toBe(true)
      expect(permissionService.requiresAuditLogging('financial_data', 'export')).toBe(true)
      expect(permissionService.requiresAuditLogging('time_tracking', 'read')).toBe(false)
    })
  })
  
  describe('Permission Matrix Validation', () => {
    it('should have a valid permission matrix', () => {
      const validation = permissionService.validatePermissionMatrix()
      
      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })
    
    it('should provide accessible features for each role', () => {
      const roles: UserRole[] = [
        'super_admin', 'law_firm_admin', 'senior_lawyer', 'junior_lawyer',
        'paralegal', 'accountant', 'client', 'read_only'
      ]
      
      roles.forEach(role => {
        const accessibleFeatures = permissionService.getAccessibleFeatures(role)
        expect(accessibleFeatures.length).toBeGreaterThan(0)
        
        // Super admin should have access to most features
        if (role === 'super_admin') {
          expect(accessibleFeatures.length).toBeGreaterThanOrEqual(8)
        }
        
        // Client should have limited access
        if (role === 'client') {
          expect(accessibleFeatures.length).toBeLessThanOrEqual(5)
        }
      })
    })
    
    it('should provide complete permission summaries', () => {
      const roles: UserRole[] = ['law_firm_admin', 'senior_lawyer', 'accountant', 'client']
      
      roles.forEach(role => {
        const summary = permissionService.getPermissionSummary(role)
        expect(Object.keys(summary).length).toBeGreaterThan(0)
        
        // Each feature should have all permission types defined
        Object.values(summary).forEach(permissions => {
          expect(permissions).toHaveProperty('create')
          expect(permissions).toHaveProperty('read')
          expect(permissions).toHaveProperty('update')
          expect(permissions).toHaveProperty('delete')
        })
      })
    })
  })
  
  describe('Cross-Role Permission Validation', () => {
    it('should enforce proper permission hierarchy', () => {
      // Law firm admin should have more permissions than senior lawyer
      const adminFeatures = permissionService.getAccessibleFeatures('law_firm_admin')
      const seniorLawyerFeatures = permissionService.getAccessibleFeatures('senior_lawyer')
      
      expect(adminFeatures.length).toBeGreaterThanOrEqual(seniorLawyerFeatures.length)
      
      // Senior lawyer should have more permissions than junior lawyer
      const juniorLawyerFeatures = permissionService.getAccessibleFeatures('junior_lawyer')
      expect(seniorLawyerFeatures.length).toBeGreaterThanOrEqual(juniorLawyerFeatures.length)
    })
    
    it('should validate role-specific restrictions', () => {
      // Accountant should not have case management creation rights
      expect(permissionService.hasPermission('accountant', 'case_management', 'create')).toBe(false)
      
      // Junior lawyer should not have financial data access
      expect(permissionService.hasPermission('junior_lawyer', 'financial_data', 'read')).toBe(false)
      
      // Client should not have administrative access
      expect(permissionService.hasPermission('client', 'user_management', 'read')).toBe(false)
      
      // Read-only should not have write access
      expect(permissionService.hasPermission('read_only', 'invoice_management', 'create')).toBe(false)
    })
  })
})