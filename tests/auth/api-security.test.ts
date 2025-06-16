// =====================================================
// Prima Facie - API Security Tests
// Comprehensive API endpoint security and authorization tests
// =====================================================

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'

// Mock HTTP request and response interfaces
interface MockRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url: string
  headers: Record<string, string>
  body?: any
  query?: Record<string, string>
  params?: Record<string, string>
  ip?: string
  user_agent?: string
  timestamp: number
}

interface MockResponse {
  status: number
  headers: Record<string, string>
  body?: any
  sent: boolean
}

interface APIEndpoint {
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  auth_required: boolean
  roles_allowed: string[]
  rate_limit?: {
    requests_per_minute: number
    requests_per_hour: number
  }
  cors_enabled: boolean
  sensitive: boolean
  audit_required: boolean
}

interface RateLimitRule {
  endpoint: string
  method: string
  role: string
  requests_per_minute: number
  requests_per_hour: number
  burst_limit: number
}

interface SecurityHeaders {
  'X-Frame-Options': string
  'X-Content-Type-Options': string
  'X-XSS-Protection': string
  'Strict-Transport-Security': string
  'Content-Security-Policy': string
  'Referrer-Policy': string
  'Permissions-Policy': string
}

// API endpoint definitions for the legal platform
const API_ENDPOINTS: APIEndpoint[] = [
  // Authentication endpoints
  { path: '/api/auth/login', method: 'POST', auth_required: false, roles_allowed: ['*'], cors_enabled: true, sensitive: true, audit_required: true },
  { path: '/api/auth/logout', method: 'POST', auth_required: true, roles_allowed: ['*'], cors_enabled: true, sensitive: false, audit_required: true },
  { path: '/api/auth/register', method: 'POST', auth_required: false, roles_allowed: ['*'], cors_enabled: true, sensitive: true, audit_required: true },
  { path: '/api/auth/refresh', method: 'POST', auth_required: true, roles_allowed: ['*'], cors_enabled: true, sensitive: true, audit_required: true },
  { path: '/api/auth/reset-password', method: 'POST', auth_required: false, roles_allowed: ['*'], cors_enabled: true, sensitive: true, audit_required: true },
  
  // User management endpoints
  { path: '/api/users', method: 'GET', auth_required: true, roles_allowed: ['super_admin', 'law_firm_admin'], cors_enabled: false, sensitive: false, audit_required: true },
  { path: '/api/users', method: 'POST', auth_required: true, roles_allowed: ['super_admin', 'law_firm_admin'], cors_enabled: false, sensitive: true, audit_required: true },
  { path: '/api/users/:id', method: 'GET', auth_required: true, roles_allowed: ['super_admin', 'law_firm_admin', 'senior_lawyer'], cors_enabled: false, sensitive: false, audit_required: false },
  { path: '/api/users/:id', method: 'PUT', auth_required: true, roles_allowed: ['super_admin', 'law_firm_admin'], cors_enabled: false, sensitive: true, audit_required: true },
  { path: '/api/users/:id', method: 'DELETE', auth_required: true, roles_allowed: ['super_admin', 'law_firm_admin'], cors_enabled: false, sensitive: true, audit_required: true },
  
  // Client management endpoints
  { path: '/api/clients', method: 'GET', auth_required: true, roles_allowed: ['super_admin', 'law_firm_admin', 'senior_lawyer', 'paralegal'], cors_enabled: false, sensitive: false, audit_required: false },
  { path: '/api/clients', method: 'POST', auth_required: true, roles_allowed: ['super_admin', 'law_firm_admin', 'senior_lawyer', 'paralegal'], cors_enabled: false, sensitive: true, audit_required: true },
  { path: '/api/clients/:id', method: 'GET', auth_required: true, roles_allowed: ['super_admin', 'law_firm_admin', 'senior_lawyer', 'junior_lawyer', 'paralegal', 'client'], cors_enabled: false, sensitive: false, audit_required: false },
  { path: '/api/clients/:id', method: 'PUT', auth_required: true, roles_allowed: ['super_admin', 'law_firm_admin', 'senior_lawyer', 'paralegal'], cors_enabled: false, sensitive: true, audit_required: true },
  
  // Matter management endpoints
  { path: '/api/matters', method: 'GET', auth_required: true, roles_allowed: ['super_admin', 'law_firm_admin', 'senior_lawyer', 'junior_lawyer', 'paralegal'], cors_enabled: false, sensitive: false, audit_required: false },
  { path: '/api/matters', method: 'POST', auth_required: true, roles_allowed: ['super_admin', 'law_firm_admin', 'senior_lawyer'], cors_enabled: false, sensitive: true, audit_required: true },
  { path: '/api/matters/:id', method: 'GET', auth_required: true, roles_allowed: ['super_admin', 'law_firm_admin', 'senior_lawyer', 'junior_lawyer', 'paralegal', 'client'], cors_enabled: false, sensitive: false, audit_required: false },
  { path: '/api/matters/:id', method: 'PUT', auth_required: true, roles_allowed: ['super_admin', 'law_firm_admin', 'senior_lawyer', 'junior_lawyer'], cors_enabled: false, sensitive: true, audit_required: true },
  { path: '/api/matters/:id', method: 'DELETE', auth_required: true, roles_allowed: ['super_admin', 'law_firm_admin'], cors_enabled: false, sensitive: true, audit_required: true },
  
  // Invoice management endpoints
  { path: '/api/invoices', method: 'GET', auth_required: true, roles_allowed: ['super_admin', 'law_firm_admin', 'senior_lawyer', 'accountant'], cors_enabled: false, sensitive: true, audit_required: false },
  { path: '/api/invoices', method: 'POST', auth_required: true, roles_allowed: ['super_admin', 'law_firm_admin', 'senior_lawyer', 'accountant'], cors_enabled: false, sensitive: true, audit_required: true },
  { path: '/api/invoices/:id', method: 'GET', auth_required: true, roles_allowed: ['super_admin', 'law_firm_admin', 'senior_lawyer', 'accountant', 'client'], cors_enabled: false, sensitive: true, audit_required: false },
  { path: '/api/invoices/:id', method: 'PUT', auth_required: true, roles_allowed: ['super_admin', 'law_firm_admin', 'senior_lawyer', 'accountant'], cors_enabled: false, sensitive: true, audit_required: true },
  { path: '/api/invoices/:id/approve', method: 'POST', auth_required: true, roles_allowed: ['super_admin', 'law_firm_admin', 'senior_lawyer', 'accountant'], cors_enabled: false, sensitive: true, audit_required: true },
  
  // Financial data endpoints
  { path: '/api/financial/reports', method: 'GET', auth_required: true, roles_allowed: ['super_admin', 'law_firm_admin', 'senior_lawyer', 'accountant'], cors_enabled: false, sensitive: true, audit_required: true },
  { path: '/api/financial/export', method: 'POST', auth_required: true, roles_allowed: ['super_admin', 'law_firm_admin', 'accountant'], cors_enabled: false, sensitive: true, audit_required: true, rate_limit: { requests_per_minute: 5, requests_per_hour: 20 } },
  
  // Document management endpoints
  { path: '/api/documents', method: 'GET', auth_required: true, roles_allowed: ['super_admin', 'law_firm_admin', 'senior_lawyer', 'junior_lawyer', 'paralegal'], cors_enabled: false, sensitive: false, audit_required: false },
  { path: '/api/documents', method: 'POST', auth_required: true, roles_allowed: ['super_admin', 'law_firm_admin', 'senior_lawyer', 'junior_lawyer', 'paralegal'], cors_enabled: false, sensitive: true, audit_required: true },
  { path: '/api/documents/:id', method: 'GET', auth_required: true, roles_allowed: ['super_admin', 'law_firm_admin', 'senior_lawyer', 'junior_lawyer', 'paralegal', 'client'], cors_enabled: false, sensitive: true, audit_required: false },
  { path: '/api/documents/:id', method: 'DELETE', auth_required: true, roles_allowed: ['super_admin', 'law_firm_admin', 'senior_lawyer'], cors_enabled: false, sensitive: true, audit_required: true },
  
  // Time tracking endpoints
  { path: '/api/time-entries', method: 'GET', auth_required: true, roles_allowed: ['super_admin', 'law_firm_admin', 'senior_lawyer', 'junior_lawyer', 'paralegal'], cors_enabled: false, sensitive: false, audit_required: false },
  { path: '/api/time-entries', method: 'POST', auth_required: true, roles_allowed: ['super_admin', 'law_firm_admin', 'senior_lawyer', 'junior_lawyer', 'paralegal'], cors_enabled: false, sensitive: false, audit_required: true },
  { path: '/api/time-entries/:id', method: 'PUT', auth_required: true, roles_allowed: ['super_admin', 'law_firm_admin', 'senior_lawyer', 'junior_lawyer', 'paralegal'], cors_enabled: false, sensitive: false, audit_required: true },
  
  // System configuration endpoints
  { path: '/api/config/law-firm', method: 'GET', auth_required: true, roles_allowed: ['super_admin', 'law_firm_admin'], cors_enabled: false, sensitive: true, audit_required: false },
  { path: '/api/config/law-firm', method: 'PUT', auth_required: true, roles_allowed: ['super_admin', 'law_firm_admin'], cors_enabled: false, sensitive: true, audit_required: true },
  
  // Webhook endpoints
  { path: '/api/webhooks/whatsapp', method: 'POST', auth_required: false, roles_allowed: ['*'], cors_enabled: false, sensitive: false, audit_required: true }
]

// Rate limiting rules by role
const RATE_LIMIT_RULES: RateLimitRule[] = [
  // Super admin - highest limits
  { endpoint: '*', method: '*', role: 'super_admin', requests_per_minute: 1000, requests_per_hour: 10000, burst_limit: 100 },
  
  // Law firm admin - high limits
  { endpoint: '*', method: '*', role: 'law_firm_admin', requests_per_minute: 500, requests_per_hour: 5000, burst_limit: 50 },
  
  // Senior lawyer - moderate limits
  { endpoint: '*', method: '*', role: 'senior_lawyer', requests_per_minute: 200, requests_per_hour: 2000, burst_limit: 30 },
  
  // Junior lawyer - lower limits
  { endpoint: '*', method: '*', role: 'junior_lawyer', requests_per_minute: 100, requests_per_hour: 1000, burst_limit: 20 },
  
  // Paralegal - moderate limits
  { endpoint: '*', method: '*', role: 'paralegal', requests_per_minute: 150, requests_per_hour: 1500, burst_limit: 25 },
  
  // Accountant - moderate limits for financial operations
  { endpoint: '*', method: '*', role: 'accountant', requests_per_minute: 150, requests_per_hour: 1500, burst_limit: 25 },
  
  // Client - lowest limits
  { endpoint: '*', method: '*', role: 'client', requests_per_minute: 50, requests_per_hour: 500, burst_limit: 10 },
  
  // Read-only - export limited
  { endpoint: '*', method: '*', role: 'read_only', requests_per_minute: 100, requests_per_hour: 1000, burst_limit: 15 },
  
  // Special limits for sensitive endpoints
  { endpoint: '/api/financial/export', method: 'POST', role: '*', requests_per_minute: 5, requests_per_hour: 20, burst_limit: 2 },
  { endpoint: '/api/auth/login', method: 'POST', role: '*', requests_per_minute: 10, requests_per_hour: 100, burst_limit: 5 },
  { endpoint: '/api/auth/register', method: 'POST', role: '*', requests_per_minute: 5, requests_per_hour: 20, burst_limit: 2 }
]

// Required security headers
const REQUIRED_SECURITY_HEADERS: SecurityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:; frame-ancestors 'none'",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
}

// Mock API Security Service
class MockAPISecurityService {
  private requestLog: MockRequest[] = []
  private blockedIPs: Set<string> = new Set()
  private apiKeys: Map<string, { role: string; law_firm_id: string; active: boolean }> = new Map()
  private rateLimitStore: Map<string, { count: number; reset_time: number; burst_count: number }> = new Map()
  
  constructor() {
    this.setupAPIKeys()
  }
  
  private setupAPIKeys() {
    // Setup test API keys
    this.apiKeys.set('api_key_super_admin', { role: 'super_admin', law_firm_id: 'platform', active: true })
    this.apiKeys.set('api_key_firm_admin', { role: 'law_firm_admin', law_firm_id: 'firm_1', active: true })
    this.apiKeys.set('api_key_lawyer', { role: 'senior_lawyer', law_firm_id: 'firm_1', active: true })
    this.apiKeys.set('api_key_client', { role: 'client', law_firm_id: 'firm_1', active: true })
    this.apiKeys.set('api_key_revoked', { role: 'client', law_firm_id: 'firm_1', active: false })
  }
  
  // Authenticate request
  authenticateRequest(request: MockRequest): { authenticated: boolean; user?: any; error?: string } {
    const authHeader = request.headers['authorization']
    const apiKeyHeader = request.headers['x-api-key']
    
    // Check for blocked IP
    if (request.ip && this.blockedIPs.has(request.ip)) {
      return { authenticated: false, error: 'IP address blocked' }
    }
    
    // API Key authentication
    if (apiKeyHeader) {
      const apiKeyData = this.apiKeys.get(apiKeyHeader)
      
      if (!apiKeyData) {
        return { authenticated: false, error: 'Invalid API key' }
      }
      
      if (!apiKeyData.active) {
        return { authenticated: false, error: 'API key revoked' }
      }
      
      return {
        authenticated: true,
        user: {
          id: `user_${apiKeyData.role}`,
          role: apiKeyData.role,
          law_firm_id: apiKeyData.law_firm_id
        }
      }
    }
    
    // Bearer token authentication
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      
      // Mock JWT validation
      if (token === 'valid_token_admin') {
        return { authenticated: true, user: { id: 'admin_1', role: 'law_firm_admin', law_firm_id: 'firm_1' } }
      }
      
      if (token === 'valid_token_lawyer') {
        return { authenticated: true, user: { id: 'lawyer_1', role: 'senior_lawyer', law_firm_id: 'firm_1' } }
      }
      
      if (token === 'valid_token_client') {
        return { authenticated: true, user: { id: 'client_1', role: 'client', law_firm_id: 'firm_1' } }
      }
      
      if (token === 'expired_token') {
        return { authenticated: false, error: 'Token expired' }
      }
      
      if (token === 'invalid_token') {
        return { authenticated: false, error: 'Invalid token' }
      }
      
      return { authenticated: false, error: 'Invalid token format' }
    }
    
    return { authenticated: false, error: 'No authentication provided' }
  }
  
  // Authorize request
  authorizeRequest(request: MockRequest, user: any): { authorized: boolean; error?: string } {
    const endpoint = this.findEndpoint(request.url, request.method)
    
    if (!endpoint) {
      return { authorized: false, error: 'Endpoint not found' }
    }
    
    // Check if authentication is required
    if (endpoint.auth_required && !user) {
      return { authorized: false, error: 'Authentication required' }
    }
    
    // Check role authorization
    if (endpoint.roles_allowed.includes('*') || endpoint.roles_allowed.includes(user?.role)) {
      return { authorized: true }
    }
    
    return { authorized: false, error: 'Insufficient permissions' }
  }
  
  // Rate limiting check
  checkRateLimit(request: MockRequest, user: any): { allowed: boolean; error?: string; retry_after?: number } {
    const endpoint = this.findEndpoint(request.url, request.method)
    const userRole = user?.role || 'anonymous'
    const clientId = request.ip || 'unknown'
    
    // Find applicable rate limit rule
    const rule = this.findRateLimitRule(request.url, request.method, userRole)
    
    if (!rule) {
      return { allowed: true } // No rate limit configured
    }
    
    const key = `${clientId}:${userRole}:${request.url}:${request.method}`
    const now = Date.now()
    const minuteWindow = 60 * 1000 // 1 minute in milliseconds
    const hourWindow = 60 * 60 * 1000 // 1 hour in milliseconds
    
    let limitData = this.rateLimitStore.get(key)
    
    if (!limitData || now - limitData.reset_time > hourWindow) {
      // Reset or initialize rate limit data
      limitData = { count: 0, reset_time: now, burst_count: 0 }
      this.rateLimitStore.set(key, limitData)
    }
    
    // Check burst limit (per minute)
    if (now - limitData.reset_time < minuteWindow) {
      if (limitData.burst_count >= rule.burst_limit) {
        const retryAfter = Math.ceil((minuteWindow - (now - limitData.reset_time)) / 1000)
        return { allowed: false, error: 'Rate limit exceeded (burst)', retry_after: retryAfter }
      }
    } else {
      // Reset burst counter
      limitData.burst_count = 0
    }
    
    // Check per-hour limit
    if (limitData.count >= rule.requests_per_hour) {
      const retryAfter = Math.ceil((hourWindow - (now - limitData.reset_time)) / 1000)
      return { allowed: false, error: 'Rate limit exceeded (hourly)', retry_after: retryAfter }
    }
    
    // Increment counters
    limitData.count++
    limitData.burst_count++
    
    return { allowed: true }
  }
  
  // CORS validation
  validateCORS(request: MockRequest): { allowed: boolean; headers?: Record<string, string> } {
    const endpoint = this.findEndpoint(request.url, request.method)
    const origin = request.headers['origin']
    
    if (!endpoint) {
      return { allowed: false }
    }
    
    if (!endpoint.cors_enabled) {
      return { allowed: !origin } // No CORS if no origin header
    }
    
    // Define allowed origins for CORS
    const allowedOrigins = [
      'https://app.prima-facie.com',
      'https://silva-law.com',
      'https://costa-legal.com',
      'http://localhost:3000' // Development
    ]
    
    if (origin && !allowedOrigins.includes(origin)) {
      return { allowed: false }
    }
    
    return {
      allowed: true,
      headers: {
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
        'Access-Control-Max-Age': '86400'
      }
    }
  }
  
  // Security headers validation
  validateSecurityHeaders(response: MockResponse): { valid: boolean; missing: string[] } {
    const missing: string[] = []
    
    Object.entries(REQUIRED_SECURITY_HEADERS).forEach(([header, expectedValue]) => {
      if (!response.headers[header]) {
        missing.push(header)
      }
    })
    
    return {
      valid: missing.length === 0,
      missing
    }
  }
  
  // Process API request
  processRequest(request: MockRequest): MockResponse {
    const response: MockResponse = {
      status: 200,
      headers: { ...REQUIRED_SECURITY_HEADERS },
      sent: false
    }
    
    // Log request
    this.requestLog.push(request)
    
    // Check CORS
    const corsCheck = this.validateCORS(request)
    if (!corsCheck.allowed) {
      response.status = 403
      response.body = { error: 'CORS policy violation' }
      response.sent = true
      return response
    }
    
    if (corsCheck.headers) {
      Object.assign(response.headers, corsCheck.headers)
    }
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      response.status = 204
      response.sent = true
      return response
    }
    
    // Authenticate
    const authResult = this.authenticateRequest(request)
    
    // Find endpoint
    const endpoint = this.findEndpoint(request.url, request.method)
    if (!endpoint) {
      response.status = 404
      response.body = { error: 'Endpoint not found' }
      response.sent = true
      return response
    }
    
    // Check if auth is required
    if (endpoint.auth_required && !authResult.authenticated) {
      response.status = 401
      response.body = { error: authResult.error || 'Authentication required' }
      response.sent = true
      return response
    }
    
    // Authorize
    if (authResult.authenticated) {
      const authzResult = this.authorizeRequest(request, authResult.user)
      if (!authzResult.authorized) {
        response.status = 403
        response.body = { error: authzResult.error || 'Forbidden' }
        response.sent = true
        return response
      }
      
      // Check rate limit
      const rateLimitResult = this.checkRateLimit(request, authResult.user)
      if (!rateLimitResult.allowed) {
        response.status = 429
        response.body = { error: rateLimitResult.error }
        if (rateLimitResult.retry_after) {
          response.headers['Retry-After'] = rateLimitResult.retry_after.toString()
        }
        response.sent = true
        return response
      }
    }
    
    // Mock successful response
    response.body = { success: true, data: {} }
    response.sent = true
    return response
  }
  
  // Helper methods
  private findEndpoint(url: string, method: string): APIEndpoint | null {
    return API_ENDPOINTS.find(endpoint => {
      const pattern = endpoint.path.replace(/:[\w]+/g, '[^/]+')
      const regex = new RegExp(`^${pattern}$`)
      return regex.test(url) && endpoint.method === method
    }) || null
  }
  
  private findRateLimitRule(url: string, method: string, role: string): RateLimitRule | null {
    // Find specific rule first
    let rule = RATE_LIMIT_RULES.find(r => 
      (r.endpoint === url || r.endpoint === '*') &&
      (r.method === method || r.method === '*') &&
      r.role === role
    )
    
    // Fall back to wildcard role
    if (!rule) {
      rule = RATE_LIMIT_RULES.find(r => 
        (r.endpoint === url || r.endpoint === '*') &&
        (r.method === method || r.method === '*') &&
        r.role === '*'
      )
    }
    
    return rule || null
  }
  
  // Security monitoring
  getSecurityMetrics(): any {
    return {
      total_requests: this.requestLog.length,
      blocked_ips: this.blockedIPs.size,
      active_api_keys: Array.from(this.apiKeys.values()).filter(k => k.active).length,
      rate_limited_clients: this.rateLimitStore.size
    }
  }
  
  // Block IP address
  blockIP(ip: string): void {
    this.blockedIPs.add(ip)
  }
  
  // Revoke API key
  revokeAPIKey(apiKey: string): boolean {
    const keyData = this.apiKeys.get(apiKey)
    if (keyData) {
      keyData.active = false
      return true
    }
    return false
  }
}

describe('API Security Tests', () => {
  let apiSecurity: MockAPISecurityService
  
  beforeEach(() => {
    apiSecurity = new MockAPISecurityService()
  })
  
  afterEach(() => {
    jest.clearAllMocks()
  })
  
  describe('Authentication Tests', () => {
    it('should authenticate valid Bearer token', () => {
      const request: MockRequest = {
        method: 'GET',
        url: '/api/users',
        headers: { 'authorization': 'Bearer valid_token_admin' },
        timestamp: Date.now()
      }
      
      const result = apiSecurity.authenticateRequest(request)
      
      expect(result.authenticated).toBe(true)
      expect(result.user?.role).toBe('law_firm_admin')
    })
    
    it('should reject invalid Bearer token', () => {
      const request: MockRequest = {
        method: 'GET',
        url: '/api/users',
        headers: { 'authorization': 'Bearer invalid_token' },
        timestamp: Date.now()
      }
      
      const result = apiSecurity.authenticateRequest(request)
      
      expect(result.authenticated).toBe(false)
      expect(result.error).toBe('Invalid token')
    })
    
    it('should reject expired token', () => {
      const request: MockRequest = {
        method: 'GET',
        url: '/api/users',
        headers: { 'authorization': 'Bearer expired_token' },
        timestamp: Date.now()
      }
      
      const result = apiSecurity.authenticateRequest(request)
      
      expect(result.authenticated).toBe(false)
      expect(result.error).toBe('Token expired')
    })
    
    it('should authenticate valid API key', () => {
      const request: MockRequest = {
        method: 'GET',
        url: '/api/users',
        headers: { 'x-api-key': 'api_key_super_admin' },
        timestamp: Date.now()
      }
      
      const result = apiSecurity.authenticateRequest(request)
      
      expect(result.authenticated).toBe(true)
      expect(result.user?.role).toBe('super_admin')
    })
    
    it('should reject revoked API key', () => {
      const request: MockRequest = {
        method: 'GET',
        url: '/api/users',
        headers: { 'x-api-key': 'api_key_revoked' },
        timestamp: Date.now()
      }
      
      const result = apiSecurity.authenticateRequest(request)
      
      expect(result.authenticated).toBe(false)
      expect(result.error).toBe('API key revoked')
    })
    
    it('should reject requests from blocked IPs', () => {
      const maliciousIP = '192.0.2.100'
      apiSecurity.blockIP(maliciousIP)
      
      const request: MockRequest = {
        method: 'GET',
        url: '/api/users',
        headers: { 'authorization': 'Bearer valid_token_admin' },
        ip: maliciousIP,
        timestamp: Date.now()
      }
      
      const result = apiSecurity.authenticateRequest(request)
      
      expect(result.authenticated).toBe(false)
      expect(result.error).toBe('IP address blocked')
    })
  })
  
  describe('Authorization Tests', () => {
    it('should authorize super admin for all endpoints', () => {
      const user = { id: 'super_1', role: 'super_admin', law_firm_id: 'platform' }
      const request: MockRequest = {
        method: 'DELETE',
        url: '/api/users/123',
        headers: {},
        timestamp: Date.now()
      }
      
      const result = apiSecurity.authorizeRequest(request, user)
      
      expect(result.authorized).toBe(true)
    })
    
    it('should authorize law firm admin for firm management', () => {
      const user = { id: 'admin_1', role: 'law_firm_admin', law_firm_id: 'firm_1' }
      const request: MockRequest = {
        method: 'POST',
        url: '/api/users',
        headers: {},
        timestamp: Date.now()
      }
      
      const result = apiSecurity.authorizeRequest(request, user)
      
      expect(result.authorized).toBe(true)
    })
    
    it('should deny client access to admin endpoints', () => {
      const user = { id: 'client_1', role: 'client', law_firm_id: 'firm_1' }
      const request: MockRequest = {
        method: 'GET',
        url: '/api/users',
        headers: {},
        timestamp: Date.now()
      }
      
      const result = apiSecurity.authorizeRequest(request, user)
      
      expect(result.authorized).toBe(false)
      expect(result.error).toBe('Insufficient permissions')
    })
    
    it('should allow client access to own data endpoints', () => {
      const user = { id: 'client_1', role: 'client', law_firm_id: 'firm_1' }
      const request: MockRequest = {
        method: 'GET',
        url: '/api/clients/123',
        headers: {},
        timestamp: Date.now()
      }
      
      const result = apiSecurity.authorizeRequest(request, user)
      
      expect(result.authorized).toBe(true)
    })
    
    it('should require authentication for protected endpoints', () => {
      const request: MockRequest = {
        method: 'GET',
        url: '/api/users',
        headers: {},
        timestamp: Date.now()
      }
      
      const result = apiSecurity.authorizeRequest(request, null)
      
      expect(result.authorized).toBe(false)
      expect(result.error).toBe('Authentication required')
    })
    
    it('should allow public access to public endpoints', () => {
      const request: MockRequest = {
        method: 'POST',
        url: '/api/auth/login',
        headers: {},
        timestamp: Date.now()
      }
      
      const result = apiSecurity.authorizeRequest(request, null)
      
      expect(result.authorized).toBe(true)
    })
  })
  
  describe('Rate Limiting Tests', () => {
    it('should enforce rate limits for different user roles', () => {
      const clientUser = { id: 'client_1', role: 'client', law_firm_id: 'firm_1' }
      const request: MockRequest = {
        method: 'GET',
        url: '/api/matters',
        headers: {},
        ip: '192.0.2.1',
        timestamp: Date.now()
      }
      
      // Should allow initial requests
      let result = apiSecurity.checkRateLimit(request, clientUser)
      expect(result.allowed).toBe(true)
      
      // Simulate many requests to trigger rate limit
      for (let i = 0; i < 55; i++) {
        apiSecurity.checkRateLimit(request, clientUser)
      }
      
      // Should now be rate limited
      result = apiSecurity.checkRateLimit(request, clientUser)
      expect(result.allowed).toBe(false)
      expect(result.error).toContain('Rate limit exceeded')
    })
    
    it('should have higher rate limits for privileged users', () => {
      const adminUser = { id: 'admin_1', role: 'law_firm_admin', law_firm_id: 'firm_1' }
      const clientUser = { id: 'client_1', role: 'client', law_firm_id: 'firm_1' }
      
      const adminRequest: MockRequest = {
        method: 'GET',
        url: '/api/matters',
        headers: {},
        ip: '192.0.2.2',
        timestamp: Date.now()
      }
      
      const clientRequest: MockRequest = {
        method: 'GET',
        url: '/api/matters',
        headers: {},
        ip: '192.0.2.3',
        timestamp: Date.now()
      }
      
      // Admin should have higher limits
      for (let i = 0; i < 100; i++) {
        const adminResult = apiSecurity.checkRateLimit(adminRequest, adminUser)
        expect(adminResult.allowed).toBe(true)
      }
      
      // Client should hit limits sooner
      for (let i = 0; i < 55; i++) {
        apiSecurity.checkRateLimit(clientRequest, clientUser)
      }
      
      const clientResult = apiSecurity.checkRateLimit(clientRequest, clientUser)
      expect(clientResult.allowed).toBe(false)
    })
    
    it('should enforce special rate limits for sensitive endpoints', () => {
      const user = { id: 'admin_1', role: 'law_firm_admin', law_firm_id: 'firm_1' }
      const request: MockRequest = {
        method: 'POST',
        url: '/api/financial/export',
        headers: {},
        ip: '192.0.2.4',
        timestamp: Date.now()
      }
      
      // Should allow initial requests
      for (let i = 0; i < 5; i++) {
        const result = apiSecurity.checkRateLimit(request, user)
        expect(result.allowed).toBe(true)
      }
      
      // Should hit rate limit
      const result = apiSecurity.checkRateLimit(request, user)
      expect(result.allowed).toBe(false)
    })
    
    it('should provide retry-after header when rate limited', () => {
      const user = { id: 'client_1', role: 'client', law_firm_id: 'firm_1' }
      const request: MockRequest = {
        method: 'GET',
        url: '/api/matters',
        headers: {},
        ip: '192.0.2.5',
        timestamp: Date.now()
      }
      
      // Trigger rate limit
      for (let i = 0; i < 12; i++) {
        apiSecurity.checkRateLimit(request, user)
      }
      
      const result = apiSecurity.checkRateLimit(request, user)
      expect(result.allowed).toBe(false)
      expect(result.retry_after).toBeDefined()
      expect(result.retry_after).toBeGreaterThan(0)
    })
  })
  
  describe('CORS Policy Tests', () => {
    it('should allow CORS for enabled endpoints with valid origin', () => {
      const request: MockRequest = {
        method: 'POST',
        url: '/api/auth/login',
        headers: { 'origin': 'https://app.prima-facie.com' },
        timestamp: Date.now()
      }
      
      const result = apiSecurity.validateCORS(request)
      
      expect(result.allowed).toBe(true)
      expect(result.headers).toBeDefined()
      expect(result.headers?.['Access-Control-Allow-Origin']).toBe('https://app.prima-facie.com')
    })
    
    it('should block CORS for unauthorized origins', () => {
      const request: MockRequest = {
        method: 'POST',
        url: '/api/auth/login',
        headers: { 'origin': 'https://malicious-site.com' },
        timestamp: Date.now()
      }
      
      const result = apiSecurity.validateCORS(request)
      
      expect(result.allowed).toBe(false)
    })
    
    it('should block CORS for endpoints with CORS disabled', () => {
      const request: MockRequest = {
        method: 'GET',
        url: '/api/users',
        headers: { 'origin': 'https://app.prima-facie.com' },
        timestamp: Date.now()
      }
      
      const result = apiSecurity.validateCORS(request)
      
      expect(result.allowed).toBe(false)
    })
    
    it('should handle preflight OPTIONS requests', () => {
      const request: MockRequest = {
        method: 'OPTIONS',
        url: '/api/auth/login',
        headers: { 'origin': 'https://app.prima-facie.com' },
        timestamp: Date.now()
      }
      
      const response = apiSecurity.processRequest(request)
      
      expect(response.status).toBe(204)
      expect(response.headers['Access-Control-Allow-Methods']).toBeDefined()
    })
  })
  
  describe('Security Headers Tests', () => {
    it('should include all required security headers', () => {
      const response: MockResponse = {
        status: 200,
        headers: { ...REQUIRED_SECURITY_HEADERS },
        sent: true
      }
      
      const validation = apiSecurity.validateSecurityHeaders(response)
      
      expect(validation.valid).toBe(true)
      expect(validation.missing).toHaveLength(0)
    })
    
    it('should detect missing security headers', () => {
      const response: MockResponse = {
        status: 200,
        headers: {
          'X-Frame-Options': 'DENY',
          'X-Content-Type-Options': 'nosniff'
          // Missing other required headers
        },
        sent: true
      }
      
      const validation = apiSecurity.validateSecurityHeaders(response)
      
      expect(validation.valid).toBe(false)
      expect(validation.missing.length).toBeGreaterThan(0)
      expect(validation.missing).toContain('X-XSS-Protection')
      expect(validation.missing).toContain('Strict-Transport-Security')
    })
    
    it('should add security headers to all responses', () => {
      const request: MockRequest = {
        method: 'GET',
        url: '/api/auth/login',
        headers: { 'authorization': 'Bearer valid_token_admin' },
        timestamp: Date.now()
      }
      
      const response = apiSecurity.processRequest(request)
      
      expect(response.headers['X-Frame-Options']).toBe('DENY')
      expect(response.headers['X-Content-Type-Options']).toBe('nosniff')
      expect(response.headers['Content-Security-Policy']).toBeDefined()
    })
  })
  
  describe('API Key Management Tests', () => {
    it('should validate active API keys', () => {
      const request: MockRequest = {
        method: 'GET',
        url: '/api/clients',
        headers: { 'x-api-key': 'api_key_lawyer' },
        timestamp: Date.now()
      }
      
      const response = apiSecurity.processRequest(request)
      
      expect(response.status).toBe(200)
    })
    
    it('should reject revoked API keys', () => {
      const request: MockRequest = {
        method: 'GET',
        url: '/api/clients',
        headers: { 'x-api-key': 'api_key_revoked' },
        timestamp: Date.now()
      }
      
      const response = apiSecurity.processRequest(request)
      
      expect(response.status).toBe(401)
      expect(response.body?.error).toBe('API key revoked')
    })
    
    it('should allow API key revocation', () => {
      const revoked = apiSecurity.revokeAPIKey('api_key_lawyer')
      expect(revoked).toBe(true)
      
      const request: MockRequest = {
        method: 'GET',
        url: '/api/clients',
        headers: { 'x-api-key': 'api_key_lawyer' },
        timestamp: Date.now()
      }
      
      const response = apiSecurity.processRequest(request)
      expect(response.status).toBe(401)
    })
    
    it('should enforce role-based permissions for API keys', () => {
      const request: MockRequest = {
        method: 'DELETE',
        url: '/api/users/123',
        headers: { 'x-api-key': 'api_key_client' },
        timestamp: Date.now()
      }
      
      const response = apiSecurity.processRequest(request)
      
      expect(response.status).toBe(403)
      expect(response.body?.error).toBe('Insufficient permissions')
    })
  })
  
  describe('Webhook Security Tests', () => {
    it('should handle webhook endpoints without authentication', () => {
      const request: MockRequest = {
        method: 'POST',
        url: '/api/webhooks/whatsapp',
        headers: { 'content-type': 'application/json' },
        body: { message: 'test webhook' },
        timestamp: Date.now()
      }
      
      const response = apiSecurity.processRequest(request)
      
      expect(response.status).toBe(200)
    })
    
    it('should validate webhook signatures (mock)', () => {
      // In real implementation, this would validate HMAC signatures
      const request: MockRequest = {
        method: 'POST',
        url: '/api/webhooks/whatsapp',
        headers: { 
          'content-type': 'application/json',
          'x-signature': 'sha256=mock_signature'
        },
        body: { message: 'test webhook' },
        timestamp: Date.now()
      }
      
      const response = apiSecurity.processRequest(request)
      
      expect(response.status).toBe(200)
    })
  })
  
  describe('Security Monitoring Tests', () => {
    it('should track security metrics', () => {
      // Make some requests
      const requests = [
        { method: 'GET', url: '/api/users', headers: { 'authorization': 'Bearer valid_token_admin' } },
        { method: 'POST', url: '/api/auth/login', headers: {} },
        { method: 'GET', url: '/api/clients', headers: { 'x-api-key': 'api_key_client' } }
      ]
      
      requests.forEach(req => {
        apiSecurity.processRequest({
          ...req,
          timestamp: Date.now()
        } as MockRequest)
      })
      
      const metrics = apiSecurity.getSecurityMetrics()
      
      expect(metrics.total_requests).toBeGreaterThan(0)
      expect(metrics.active_api_keys).toBeGreaterThan(0)
    })
    
    it('should track blocked IPs', () => {
      apiSecurity.blockIP('192.0.2.100')
      apiSecurity.blockIP('198.51.100.50')
      
      const metrics = apiSecurity.getSecurityMetrics()
      
      expect(metrics.blocked_ips).toBe(2)
    })
    
    it('should maintain request logs for audit', () => {
      const request: MockRequest = {
        method: 'POST',
        url: '/api/matters',
        headers: { 'authorization': 'Bearer valid_token_lawyer' },
        body: { title: 'New Matter' },
        timestamp: Date.now()
      }
      
      apiSecurity.processRequest(request)
      
      const metrics = apiSecurity.getSecurityMetrics()
      expect(metrics.total_requests).toBeGreaterThan(0)
    })
  })
  
  describe('Integration Tests', () => {
    it('should handle complete request lifecycle with authentication and authorization', () => {
      const request: MockRequest = {
        method: 'GET',
        url: '/api/matters',
        headers: { 'authorization': 'Bearer valid_token_lawyer' },
        ip: '192.168.1.100',
        timestamp: Date.now()
      }
      
      const response = apiSecurity.processRequest(request)
      
      expect(response.status).toBe(200)
      expect(response.body?.success).toBe(true)
      expect(response.headers['X-Frame-Options']).toBe('DENY')
    })
    
    it('should reject unauthorized requests end-to-end', () => {
      const request: MockRequest = {
        method: 'DELETE',
        url: '/api/users/123',
        headers: { 'authorization': 'Bearer valid_token_client' },
        timestamp: Date.now()
      }
      
      const response = apiSecurity.processRequest(request)
      
      expect(response.status).toBe(403)
      expect(response.body?.error).toBe('Insufficient permissions')
    })
    
    it('should handle unauthenticated requests to protected endpoints', () => {
      const request: MockRequest = {
        method: 'GET',
        url: '/api/users',
        headers: {},
        timestamp: Date.now()
      }
      
      const response = apiSecurity.processRequest(request)
      
      expect(response.status).toBe(401)
      expect(response.body?.error).toBe('No authentication provided')
    })
  })
})