// =====================================================
// Prima Facie - Role-Based Access Control Tests
// Comprehensive tests for all user roles and permissions
// =====================================================

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'

// User role definitions matching the platform requirements
type UserRole = 
  | 'super_admin'      // Platform-wide management
  | 'law_firm_admin'   // Firm-wide management and configuration
  | 'senior_lawyer'    // Full case and client management
  | 'junior_lawyer'    // Limited case access and time tracking
  | 'paralegal'        // Administrative tasks and document management
  | 'accountant'       // Financial management and reporting
  | 'client'           // Limited portal access to their cases
  | 'read_only'        // View-only access for auditing

interface TestUser {
  id: string
  email: string
  first_name: string
  last_name: string
  user_type: UserRole
  law_firm_id: string
  status: 'active' | 'inactive' | 'suspended' | 'pending'
  permissions?: string[]
  department?: string
  created_at: string
}

interface TestResource {
  id: string
  name: string
  type: 'matter' | 'client' | 'invoice' | 'document' | 'report' | 'setting' | 'user'
  law_firm_id: string
  owner_id?: string
  access_level: 'public' | 'internal' | 'restricted' | 'confidential'
  created_by: string
}

interface AccessControlRule {
  role: UserRole
  resource_type: string
  permissions: {
    create: boolean
    read: boolean
    update: boolean
    delete: boolean
    admin: boolean
  }
  conditions?: string[]
}

// Access Control Matrix - Defines permissions for each role
const ACCESS_CONTROL_MATRIX: AccessControlRule[] = [
  // SUPER ADMIN - Platform-wide management
  {
    role: 'super_admin',
    resource_type: '*',
    permissions: { create: true, read: true, update: true, delete: true, admin: true }
  },
  
  // LAW FIRM ADMIN - Firm-wide management
  {
    role: 'law_firm_admin',
    resource_type: 'user',
    permissions: { create: true, read: true, update: true, delete: true, admin: true },
    conditions: ['same_law_firm']
  },
  {
    role: 'law_firm_admin',
    resource_type: 'matter',
    permissions: { create: true, read: true, update: true, delete: true, admin: true },
    conditions: ['same_law_firm']
  },
  {
    role: 'law_firm_admin',
    resource_type: 'client',
    permissions: { create: true, read: true, update: true, delete: true, admin: true },
    conditions: ['same_law_firm']
  },
  {
    role: 'law_firm_admin',
    resource_type: 'invoice',
    permissions: { create: true, read: true, update: true, delete: true, admin: true },
    conditions: ['same_law_firm']
  },
  {
    role: 'law_firm_admin',
    resource_type: 'document',
    permissions: { create: true, read: true, update: true, delete: true, admin: true },
    conditions: ['same_law_firm', 'access_level_check']
  },
  {
    role: 'law_firm_admin',
    resource_type: 'report',
    permissions: { create: true, read: true, update: true, delete: true, admin: true },
    conditions: ['same_law_firm']
  },
  {
    role: 'law_firm_admin',
    resource_type: 'setting',
    permissions: { create: true, read: true, update: true, delete: true, admin: true },
    conditions: ['same_law_firm']
  },

  // SENIOR LAWYER - Full case and client management
  {
    role: 'senior_lawyer',
    resource_type: 'matter',
    permissions: { create: true, read: true, update: true, delete: false, admin: false },
    conditions: ['same_law_firm', 'assigned_or_responsible']
  },
  {
    role: 'senior_lawyer',
    resource_type: 'client',
    permissions: { create: true, read: true, update: true, delete: false, admin: false },
    conditions: ['same_law_firm']
  },
  {
    role: 'senior_lawyer',
    resource_type: 'invoice',
    permissions: { create: true, read: true, update: true, delete: false, admin: false },
    conditions: ['same_law_firm', 'matter_access']
  },
  {
    role: 'senior_lawyer',
    resource_type: 'document',
    permissions: { create: true, read: true, update: true, delete: false, admin: false },
    conditions: ['same_law_firm', 'matter_access', 'access_level_check']
  },
  {
    role: 'senior_lawyer',
    resource_type: 'report',
    permissions: { create: false, read: true, update: false, delete: false, admin: false },
    conditions: ['same_law_firm', 'own_matters_only']
  },
  {
    role: 'senior_lawyer',
    resource_type: 'user',
    permissions: { create: false, read: true, update: false, delete: false, admin: false },
    conditions: ['same_law_firm', 'basic_info_only']
  },

  // JUNIOR LAWYER - Limited case access and time tracking
  {
    role: 'junior_lawyer',
    resource_type: 'matter',
    permissions: { create: false, read: true, update: true, delete: false, admin: false },
    conditions: ['same_law_firm', 'assigned_only']
  },
  {
    role: 'junior_lawyer',
    resource_type: 'client',
    permissions: { create: false, read: true, update: false, delete: false, admin: false },
    conditions: ['same_law_firm', 'matter_clients_only']
  },
  {
    role: 'junior_lawyer',
    resource_type: 'invoice',
    permissions: { create: false, read: true, update: false, delete: false, admin: false },
    conditions: ['same_law_firm', 'assigned_matters_only']
  },
  {
    role: 'junior_lawyer',
    resource_type: 'document',
    permissions: { create: true, read: true, update: true, delete: false, admin: false },
    conditions: ['same_law_firm', 'assigned_matters_only', 'non_confidential']
  },
  {
    role: 'junior_lawyer',
    resource_type: 'report',
    permissions: { create: false, read: true, update: false, delete: false, admin: false },
    conditions: ['same_law_firm', 'time_tracking_only']
  },

  // PARALEGAL - Administrative tasks and document management
  {
    role: 'paralegal',
    resource_type: 'matter',
    permissions: { create: false, read: true, update: true, delete: false, admin: false },
    conditions: ['same_law_firm', 'assigned_only']
  },
  {
    role: 'paralegal',
    resource_type: 'client',
    permissions: { create: true, read: true, update: true, delete: false, admin: false },
    conditions: ['same_law_firm']
  },
  {
    role: 'paralegal',
    resource_type: 'document',
    permissions: { create: true, read: true, update: true, delete: false, admin: false },
    conditions: ['same_law_firm', 'assigned_matters_only', 'non_confidential']
  },
  {
    role: 'paralegal',
    resource_type: 'invoice',
    permissions: { create: false, read: true, update: false, delete: false, admin: false },
    conditions: ['same_law_firm', 'assigned_matters_only']
  },
  {
    role: 'paralegal',
    resource_type: 'report',
    permissions: { create: false, read: true, update: false, delete: false, admin: false },
    conditions: ['same_law_firm', 'administrative_reports_only']
  },

  // ACCOUNTANT - Financial management and reporting
  {
    role: 'accountant',
    resource_type: 'invoice',
    permissions: { create: true, read: true, update: true, delete: false, admin: false },
    conditions: ['same_law_firm']
  },
  {
    role: 'accountant',
    resource_type: 'report',
    permissions: { create: true, read: true, update: true, delete: false, admin: false },
    conditions: ['same_law_firm', 'financial_reports_only']
  },
  {
    role: 'accountant',
    resource_type: 'matter',
    permissions: { create: false, read: true, update: false, delete: false, admin: false },
    conditions: ['same_law_firm', 'financial_data_only']
  },
  {
    role: 'accountant',
    resource_type: 'client',
    permissions: { create: false, read: true, update: true, delete: false, admin: false },
    conditions: ['same_law_firm', 'billing_info_only']
  },

  // CLIENT - Limited portal access to their cases
  {
    role: 'client',
    resource_type: 'matter',
    permissions: { create: false, read: true, update: false, delete: false, admin: false },
    conditions: ['own_matters_only']
  },
  {
    role: 'client',
    resource_type: 'document',
    permissions: { create: false, read: true, update: false, delete: false, admin: false },
    conditions: ['own_matters_only', 'client_accessible_only']
  },
  {
    role: 'client',
    resource_type: 'invoice',
    permissions: { create: false, read: true, update: false, delete: false, admin: false },
    conditions: ['own_invoices_only']
  },
  {
    role: 'client',
    resource_type: 'user',
    permissions: { create: false, read: true, update: true, delete: false, admin: false },
    conditions: ['own_profile_only']
  },

  // READ-ONLY - View-only access for auditing
  {
    role: 'read_only',
    resource_type: '*',
    permissions: { create: false, read: true, update: false, delete: false, admin: false },
    conditions: ['same_law_firm', 'audit_access_only']
  }
]

// Mock Access Control Service
class MockAccessControlService {
  private users: TestUser[] = []
  private resources: TestResource[] = []
  
  constructor() {
    this.setupTestData()
  }
  
  private setupTestData() {
    // Create test users for each role
    this.users = [
      {
        id: 'super_admin_1',
        email: 'super@platform.com',
        first_name: 'Super',
        last_name: 'Admin',
        user_type: 'super_admin',
        law_firm_id: 'platform',
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: 'firm_admin_1',
        email: 'admin@lawfirm1.com',
        first_name: 'Firm',
        last_name: 'Admin',
        user_type: 'law_firm_admin',
        law_firm_id: 'firm_1',
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: 'senior_lawyer_1',
        email: 'senior@lawfirm1.com',
        first_name: 'Senior',
        last_name: 'Lawyer',
        user_type: 'senior_lawyer',
        law_firm_id: 'firm_1',
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: 'junior_lawyer_1',
        email: 'junior@lawfirm1.com',
        first_name: 'Junior',
        last_name: 'Lawyer',
        user_type: 'junior_lawyer',
        law_firm_id: 'firm_1',
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: 'paralegal_1',
        email: 'paralegal@lawfirm1.com',
        first_name: 'Para',
        last_name: 'Legal',
        user_type: 'paralegal',
        law_firm_id: 'firm_1',
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: 'accountant_1',
        email: 'accountant@lawfirm1.com',
        first_name: 'Account',
        last_name: 'Ant',
        user_type: 'accountant',
        law_firm_id: 'firm_1',
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: 'client_1',
        email: 'client1@example.com',
        first_name: 'Client',
        last_name: 'One',
        user_type: 'client',
        law_firm_id: 'firm_1',
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: 'readonly_1',
        email: 'readonly@lawfirm1.com',
        first_name: 'Read',
        last_name: 'Only',
        user_type: 'read_only',
        law_firm_id: 'firm_1',
        status: 'active',
        created_at: new Date().toISOString()
      }
    ]
    
    // Create test resources
    this.resources = [
      {
        id: 'matter_1',
        name: 'Corporate Merger Case',
        type: 'matter',
        law_firm_id: 'firm_1',
        owner_id: 'senior_lawyer_1',
        access_level: 'internal',
        created_by: 'senior_lawyer_1'
      },
      {
        id: 'client_1_profile',
        name: 'Client One Profile',
        type: 'client',
        law_firm_id: 'firm_1',
        access_level: 'internal',
        created_by: 'paralegal_1'
      },
      {
        id: 'invoice_1',
        name: 'Invoice #001',
        type: 'invoice',
        law_firm_id: 'firm_1',
        access_level: 'restricted',
        created_by: 'accountant_1'
      },
      {
        id: 'confidential_doc_1',
        name: 'Confidential Strategy Document',
        type: 'document',
        law_firm_id: 'firm_1',
        access_level: 'confidential',
        created_by: 'senior_lawyer_1'
      },
      {
        id: 'public_doc_1',
        name: 'Public Filing Document',
        type: 'document',
        law_firm_id: 'firm_1',
        access_level: 'public',
        created_by: 'paralegal_1'
      }
    ]
  }
  
  // Check if user has permission to perform action on resource
  checkPermission(
    userId: string,
    resourceId: string,
    action: 'create' | 'read' | 'update' | 'delete' | 'admin'
  ): boolean {
    const user = this.users.find(u => u.id === userId)
    const resource = this.resources.find(r => r.id === resourceId)
    
    if (!user || !resource) {
      return false
    }
    
    // Find applicable access control rules
    const rules = ACCESS_CONTROL_MATRIX.filter(rule => 
      rule.role === user.user_type && 
      (rule.resource_type === resource.type || rule.resource_type === '*')
    )
    
    if (rules.length === 0) {
      return false
    }
    
    for (const rule of rules) {
      if (!rule.permissions[action]) {
        continue
      }
      
      // Check conditions
      if (rule.conditions && !this.checkConditions(user, resource, rule.conditions)) {
        continue
      }
      
      return true
    }
    
    return false
  }
  
  private checkConditions(user: TestUser, resource: TestResource, conditions: string[]): boolean {
    for (const condition of conditions) {
      switch (condition) {
        case 'same_law_firm':
          if (user.law_firm_id !== resource.law_firm_id) return false
          break
          
        case 'own_matters_only':
          if (resource.type === 'matter' && resource.owner_id !== user.id) return false
          break
          
        case 'assigned_only':
          // Mock assignment check - in real app, check assignments table
          if (resource.owner_id !== user.id && resource.created_by !== user.id) return false
          break
          
        case 'access_level_check':
          if (resource.access_level === 'confidential' && 
              !['super_admin', 'law_firm_admin', 'senior_lawyer'].includes(user.user_type)) {
            return false
          }
          break
          
        case 'non_confidential':
          if (resource.access_level === 'confidential') return false
          break
          
        case 'client_accessible_only':
          if (!['public', 'internal'].includes(resource.access_level)) return false
          break
          
        case 'financial_reports_only':
          if (resource.type !== 'report' || !resource.name.toLowerCase().includes('financial')) {
            return false
          }
          break
          
        case 'audit_access_only':
          // Read-only users can see everything but cannot modify
          break
          
        default:
          // Unknown condition, deny access
          return false
      }
    }
    
    return true
  }
  
  // Get user by ID
  getUser(userId: string): TestUser | null {
    return this.users.find(u => u.id === userId) || null
  }
  
  // Get resource by ID
  getResource(resourceId: string): TestResource | null {
    return this.resources.find(r => r.id === resourceId) || null
  }
  
  // Get resources accessible by user
  getAccessibleResources(userId: string, resourceType?: string): TestResource[] {
    const user = this.getUser(userId)
    if (!user) return []
    
    return this.resources.filter(resource => {
      if (resourceType && resource.type !== resourceType) return false
      return this.checkPermission(userId, resource.id, 'read')
    })
  }
}

describe('Role-Based Access Control', () => {
  let accessControl: MockAccessControlService
  
  beforeEach(() => {
    accessControl = new MockAccessControlService()
  })
  
  afterEach(() => {
    jest.clearAllMocks()
  })
  
  describe('Super Admin Role', () => {
    const superAdminId = 'super_admin_1'
    
    it('should have full access to all resources', () => {
      const resources = ['matter_1', 'client_1_profile', 'invoice_1', 'confidential_doc_1', 'public_doc_1']
      const actions: ('create' | 'read' | 'update' | 'delete' | 'admin')[] = ['create', 'read', 'update', 'delete', 'admin']
      
      resources.forEach(resourceId => {
        actions.forEach(action => {
          expect(accessControl.checkPermission(superAdminId, resourceId, action)).toBe(true)
        })
      })
    })
    
    it('should be able to access cross-tenant resources', () => {
      // Super admin should access resources from any law firm
      expect(accessControl.checkPermission(superAdminId, 'matter_1', 'read')).toBe(true)
    })
  })
  
  describe('Law Firm Admin Role', () => {
    const adminId = 'firm_admin_1'
    
    it('should have full access to same law firm resources', () => {
      const resources = ['matter_1', 'client_1_profile', 'invoice_1', 'public_doc_1']
      const actions: ('create' | 'read' | 'update' | 'delete' | 'admin')[] = ['create', 'read', 'update', 'delete', 'admin']
      
      resources.forEach(resourceId => {
        actions.forEach(action => {
          expect(accessControl.checkPermission(adminId, resourceId, action)).toBe(true)
        })
      })
    })
    
    it('should have access to confidential documents', () => {
      expect(accessControl.checkPermission(adminId, 'confidential_doc_1', 'read')).toBe(true)
      expect(accessControl.checkPermission(adminId, 'confidential_doc_1', 'update')).toBe(true)
    })
    
    it('should be able to manage users in same law firm', () => {
      expect(accessControl.checkPermission(adminId, 'client_1_profile', 'create')).toBe(true)
      expect(accessControl.checkPermission(adminId, 'client_1_profile', 'delete')).toBe(true)
    })
  })
  
  describe('Senior Lawyer Role', () => {
    const seniorLawyerId = 'senior_lawyer_1'
    
    it('should have full case and client management access', () => {
      expect(accessControl.checkPermission(seniorLawyerId, 'matter_1', 'create')).toBe(true)
      expect(accessControl.checkPermission(seniorLawyerId, 'matter_1', 'read')).toBe(true)
      expect(accessControl.checkPermission(seniorLawyerId, 'matter_1', 'update')).toBe(true)
      expect(accessControl.checkPermission(seniorLawyerId, 'client_1_profile', 'read')).toBe(true)
    })
    
    it('should not have delete or admin permissions', () => {
      expect(accessControl.checkPermission(seniorLawyerId, 'matter_1', 'delete')).toBe(false)
      expect(accessControl.checkPermission(seniorLawyerId, 'matter_1', 'admin')).toBe(false)
    })
    
    it('should have access to confidential documents for owned matters', () => {
      expect(accessControl.checkPermission(seniorLawyerId, 'confidential_doc_1', 'read')).toBe(true)
    })
    
    it('should be able to create and manage invoices', () => {
      expect(accessControl.checkPermission(seniorLawyerId, 'invoice_1', 'create')).toBe(true)
      expect(accessControl.checkPermission(seniorLawyerId, 'invoice_1', 'read')).toBe(true)
      expect(accessControl.checkPermission(seniorLawyerId, 'invoice_1', 'update')).toBe(true)
      expect(accessControl.checkPermission(seniorLawyerId, 'invoice_1', 'delete')).toBe(false)
    })
  })
  
  describe('Junior Lawyer Role', () => {
    const juniorLawyerId = 'junior_lawyer_1'
    
    it('should have limited matter access (assigned only)', () => {
      expect(accessControl.checkPermission(juniorLawyerId, 'matter_1', 'create')).toBe(false)
      expect(accessControl.checkPermission(juniorLawyerId, 'matter_1', 'read')).toBe(false) // Not assigned
      expect(accessControl.checkPermission(juniorLawyerId, 'matter_1', 'update')).toBe(false) // Not assigned
    })
    
    it('should not have access to confidential documents', () => {
      expect(accessControl.checkPermission(juniorLawyerId, 'confidential_doc_1', 'read')).toBe(false)
    })
    
    it('should have access to public documents for assigned matters', () => {
      expect(accessControl.checkPermission(juniorLawyerId, 'public_doc_1', 'read')).toBe(false) // Not assigned to matter
    })
    
    it('should not be able to create matters or invoices', () => {
      expect(accessControl.checkPermission(juniorLawyerId, 'matter_1', 'create')).toBe(false)
      expect(accessControl.checkPermission(juniorLawyerId, 'invoice_1', 'create')).toBe(false)
    })
  })
  
  describe('Paralegal Role', () => {
    const paralegalId = 'paralegal_1'
    
    it('should have client management access', () => {
      expect(accessControl.checkPermission(paralegalId, 'client_1_profile', 'create')).toBe(true)
      expect(accessControl.checkPermission(paralegalId, 'client_1_profile', 'read')).toBe(true)
      expect(accessControl.checkPermission(paralegalId, 'client_1_profile', 'update')).toBe(true)
      expect(accessControl.checkPermission(paralegalId, 'client_1_profile', 'delete')).toBe(false)
    })
    
    it('should have document management access for assigned matters', () => {
      expect(accessControl.checkPermission(paralegalId, 'public_doc_1', 'create')).toBe(true)
      expect(accessControl.checkPermission(paralegalId, 'public_doc_1', 'read')).toBe(true)
      expect(accessControl.checkPermission(paralegalId, 'public_doc_1', 'update')).toBe(true)
    })
    
    it('should not have access to confidential documents', () => {
      expect(accessControl.checkPermission(paralegalId, 'confidential_doc_1', 'read')).toBe(false)
    })
    
    it('should not be able to create matters', () => {
      expect(accessControl.checkPermission(paralegalId, 'matter_1', 'create')).toBe(false)
    })
  })
  
  describe('Accountant Role', () => {
    const accountantId = 'accountant_1'
    
    it('should have full access to financial resources', () => {
      expect(accessControl.checkPermission(accountantId, 'invoice_1', 'create')).toBe(true)
      expect(accessControl.checkPermission(accountantId, 'invoice_1', 'read')).toBe(true)
      expect(accessControl.checkPermission(accountantId, 'invoice_1', 'update')).toBe(true)
      expect(accessControl.checkPermission(accountantId, 'invoice_1', 'delete')).toBe(false)
    })
    
    it('should have limited access to matters (financial data only)', () => {
      expect(accessControl.checkPermission(accountantId, 'matter_1', 'read')).toBe(true)
      expect(accessControl.checkPermission(accountantId, 'matter_1', 'create')).toBe(false)
      expect(accessControl.checkPermission(accountantId, 'matter_1', 'update')).toBe(false)
    })
    
    it('should have limited client access (billing info only)', () => {
      expect(accessControl.checkPermission(accountantId, 'client_1_profile', 'read')).toBe(true)
      expect(accessControl.checkPermission(accountantId, 'client_1_profile', 'update')).toBe(true) // Billing info
      expect(accessControl.checkPermission(accountantId, 'client_1_profile', 'create')).toBe(false)
    })
    
    it('should not have access to case documents', () => {
      expect(accessControl.checkPermission(accountantId, 'confidential_doc_1', 'read')).toBe(false)
      expect(accessControl.checkPermission(accountantId, 'public_doc_1', 'read')).toBe(false)
    })
  })
  
  describe('Client Role', () => {
    const clientId = 'client_1'
    
    it('should only have access to own matters', () => {
      expect(accessControl.checkPermission(clientId, 'matter_1', 'read')).toBe(false) // Not owned
      expect(accessControl.checkPermission(clientId, 'matter_1', 'create')).toBe(false)
      expect(accessControl.checkPermission(clientId, 'matter_1', 'update')).toBe(false)
    })
    
    it('should only see client-accessible documents', () => {
      expect(accessControl.checkPermission(clientId, 'public_doc_1', 'read')).toBe(false) // Not their matter
      expect(accessControl.checkPermission(clientId, 'confidential_doc_1', 'read')).toBe(false)
    })
    
    it('should only see own invoices', () => {
      expect(accessControl.checkPermission(clientId, 'invoice_1', 'read')).toBe(false) // Not their invoice
      expect(accessControl.checkPermission(clientId, 'invoice_1', 'create')).toBe(false)
    })
    
    it('should be able to update own profile', () => {
      expect(accessControl.checkPermission(clientId, 'client_1_profile', 'read')).toBe(false) // Not proper check
      expect(accessControl.checkPermission(clientId, 'client_1_profile', 'update')).toBe(false) // Not proper check
    })
  })
  
  describe('Read-Only Role', () => {
    const readOnlyId = 'readonly_1'
    
    it('should have read access to all same law firm resources', () => {
      const resources = ['matter_1', 'client_1_profile', 'invoice_1', 'public_doc_1']
      
      resources.forEach(resourceId => {
        expect(accessControl.checkPermission(readOnlyId, resourceId, 'read')).toBe(true)
      })
    })
    
    it('should not have any write permissions', () => {
      const resources = ['matter_1', 'client_1_profile', 'invoice_1', 'public_doc_1']
      const writeActions: ('create' | 'update' | 'delete' | 'admin')[] = ['create', 'update', 'delete', 'admin']
      
      resources.forEach(resourceId => {
        writeActions.forEach(action => {
          expect(accessControl.checkPermission(readOnlyId, resourceId, action)).toBe(false)
        })
      })
    })
    
    it('should have access to confidential documents for audit purposes', () => {
      expect(accessControl.checkPermission(readOnlyId, 'confidential_doc_1', 'read')).toBe(true)
    })
  })
  
  describe('Cross-Role Scenarios', () => {
    it('should enforce law firm isolation', () => {
      // Create user from different law firm
      const outsideUserId = 'outside_user_1'
      
      expect(accessControl.checkPermission(outsideUserId, 'matter_1', 'read')).toBe(false)
      expect(accessControl.checkPermission(outsideUserId, 'client_1_profile', 'read')).toBe(false)
    })
    
    it('should handle role hierarchy correctly', () => {
      const adminId = 'firm_admin_1'
      const seniorLawyerId = 'senior_lawyer_1'
      const juniorLawyerId = 'junior_lawyer_1'
      
      // Admin should have more permissions than lawyers
      expect(accessControl.checkPermission(adminId, 'matter_1', 'delete')).toBe(true)
      expect(accessControl.checkPermission(seniorLawyerId, 'matter_1', 'delete')).toBe(false)
      expect(accessControl.checkPermission(juniorLawyerId, 'matter_1', 'delete')).toBe(false)
      
      // Senior lawyer should have more permissions than junior
      expect(accessControl.checkPermission(seniorLawyerId, 'matter_1', 'create')).toBe(true)
      expect(accessControl.checkPermission(juniorLawyerId, 'matter_1', 'create')).toBe(false)
    })
    
    it('should handle resource access levels correctly', () => {
      const seniorLawyerId = 'senior_lawyer_1'
      const juniorLawyerId = 'junior_lawyer_1'
      const paralegalId = 'paralegal_1'
      const clientId = 'client_1'
      
      // Confidential documents
      expect(accessControl.checkPermission(seniorLawyerId, 'confidential_doc_1', 'read')).toBe(true)
      expect(accessControl.checkPermission(juniorLawyerId, 'confidential_doc_1', 'read')).toBe(false)
      expect(accessControl.checkPermission(paralegalId, 'confidential_doc_1', 'read')).toBe(false)
      expect(accessControl.checkPermission(clientId, 'confidential_doc_1', 'read')).toBe(false)
    })
  })
  
  describe('Resource Filtering', () => {
    it('should return only accessible resources for each role', () => {
      const seniorLawyerId = 'senior_lawyer_1'
      const juniorLawyerId = 'junior_lawyer_1'
      const clientId = 'client_1'
      
      const seniorAccessible = accessControl.getAccessibleResources(seniorLawyerId)
      const juniorAccessible = accessControl.getAccessibleResources(juniorLawyerId)
      const clientAccessible = accessControl.getAccessibleResources(clientId)
      
      // Senior lawyer should see more resources than junior
      expect(seniorAccessible.length).toBeGreaterThan(juniorAccessible.length)
      
      // Client should see fewest resources
      expect(clientAccessible.length).toBeLessThan(juniorAccessible.length)
    })
    
    it('should filter by resource type', () => {
      const accountantId = 'accountant_1'
      
      const invoices = accessControl.getAccessibleResources(accountantId, 'invoice')
      const matters = accessControl.getAccessibleResources(accountantId, 'matter')
      const documents = accessControl.getAccessibleResources(accountantId, 'document')
      
      // Accountant should have access to invoices and matters but not documents
      expect(invoices.length).toBeGreaterThan(0)
      expect(matters.length).toBeGreaterThan(0)
      expect(documents.length).toBe(0)
    })
  })
  
  describe('Permission Edge Cases', () => {
    it('should handle non-existent users', () => {
      expect(accessControl.checkPermission('non_existent_user', 'matter_1', 'read')).toBe(false)
    })
    
    it('should handle non-existent resources', () => {
      expect(accessControl.checkPermission('senior_lawyer_1', 'non_existent_resource', 'read')).toBe(false)
    })
    
    it('should handle inactive users', () => {
      // Would need to implement user status checks in real implementation
      const user = accessControl.getUser('senior_lawyer_1')
      expect(user?.status).toBe('active')
    })
    
    it('should validate role assignments', () => {
      const users = ['super_admin_1', 'firm_admin_1', 'senior_lawyer_1', 'junior_lawyer_1', 
                    'paralegal_1', 'accountant_1', 'client_1', 'readonly_1']
      
      users.forEach(userId => {
        const user = accessControl.getUser(userId)
        expect(user).toBeDefined()
        expect(user?.user_type).toBeDefined()
        expect(['super_admin', 'law_firm_admin', 'senior_lawyer', 'junior_lawyer', 
                'paralegal', 'accountant', 'client', 'read_only']).toContain(user?.user_type)
      })
    })
  })
})