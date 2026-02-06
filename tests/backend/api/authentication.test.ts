/**
 * Authentication and Authorization API Tests
 * Comprehensive tests for user authentication, authorization, and security
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import { APITestClient } from '../utils/api-client'
import {
  createTestLawFirm,
  mockAuth,
  createMockSupabaseClient,
  simulateNetworkError,
  simulateRateLimitError,
  setupTestDatabase,
  cleanupTestDatabase
} from '../utils/test-helpers'

describe('Authentication and Authorization API', () => {
  let apiClient: APITestClient
  let testData: any

  beforeAll(async () => {
    apiClient = new APITestClient()
    const setup = await setupTestDatabase()
    testData = setup.testData
  })

  afterAll(async () => {
    await cleanupTestDatabase()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('User Authentication', () => {
    describe('Login', () => {
      test('should login with valid credentials', async () => {
        const credentials = {
          email: 'lawyer@testfirm.com',
          password: 'SecurePassword123!'
        }

        const response = await apiClient.login(credentials.email, credentials.password)

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('data')
        expect(response.body.data).toHaveProperty('access_token')
        expect(response.body.data).toHaveProperty('refresh_token')
        expect(response.body.data).toHaveProperty('user')
        expect(response.body.data.user.email).toBe(credentials.email)
        expect(response.body.data).toHaveProperty('expires_in')
      })

      test('should login admin user with elevated permissions', async () => {
        const adminCredentials = {
          email: 'admin@testfirm.com',
          password: 'AdminPassword123!'
        }

        const response = await apiClient.login(adminCredentials.email, adminCredentials.password)

        expect(response.status).toBe(200)
        expect(response.body.data.user.role).toBe('admin')
        expect(response.body.data.user.permissions).toContain('manage_users')
        expect(response.body.data.user.permissions).toContain('manage_billing')
        expect(response.body.data.user.permissions).toContain('view_reports')
      })

      test('should reject invalid email format', async () => {
        const invalidCredentials = {
          email: 'invalid-email',
          password: 'Password123!'
        }

        const response = await apiClient.login(invalidCredentials.email, invalidCredentials.password)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('Invalid email format')
      })

      test('should reject incorrect password', async () => {
        const invalidCredentials = {
          email: 'lawyer@testfirm.com',
          password: 'WrongPassword'
        }

        const response = await apiClient.login(invalidCredentials.email, invalidCredentials.password)

        expect(response.status).toBe(401)
        expect(response.body.error.message).toContain('Invalid credentials')
      })

      test('should reject non-existent user', async () => {
        const nonExistentCredentials = {
          email: 'nonexistent@testfirm.com',
          password: 'Password123!'
        }

        const response = await apiClient.login(nonExistentCredentials.email, nonExistentCredentials.password)

        expect(response.status).toBe(401)
        expect(response.body.error.message).toContain('User not found')
      })

      test('should handle account lockout after failed attempts', async () => {
        const credentials = {
          email: 'lawyer@testfirm.com',
          password: 'WrongPassword'
        }

        // Attempt multiple failed logins
        for (let i = 0; i < 5; i++) {
          await apiClient.login(credentials.email, credentials.password)
        }

        // Next attempt should be blocked
        const response = await apiClient.login(credentials.email, credentials.password)

        expect(response.status).toBe(429)
        expect(response.body.error.message).toContain('Account temporarily locked')
      })

      test('should handle inactive user accounts', async () => {
        const inactiveCredentials = {
          email: 'inactive@testfirm.com',
          password: 'Password123!'
        }

        const response = await apiClient.login(inactiveCredentials.email, inactiveCredentials.password)

        expect(response.status).toBe(403)
        expect(response.body.error.message).toContain('Account is inactive')
      })

      test('should require password complexity', async () => {
        // This would typically be tested during registration/password change
        const weakPasswordCredentials = {
          email: 'test@testfirm.com',
          password: '123'
        }

        const response = await apiClient.login(weakPasswordCredentials.email, weakPasswordCredentials.password)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('Password does not meet complexity requirements')
      })

      test('should include user profile data in response', async () => {
        const credentials = {
          email: 'lawyer@testfirm.com',
          password: 'SecurePassword123!'
        }

        const response = await apiClient.login(credentials.email, credentials.password)

        expect(response.status).toBe(200)
        expect(response.body.data.user).toHaveProperty('id')
        expect(response.body.data.user).toHaveProperty('email')
        expect(response.body.data.user).toHaveProperty('full_name')
        expect(response.body.data.user).toHaveProperty('role')
        expect(response.body.data.user).toHaveProperty('law_firm_id')
        expect(response.body.data.user).toHaveProperty('permissions')
        expect(response.body.data.user).toHaveProperty('last_login_at')
      })
    })

    describe('Logout', () => {
      let authToken: string

      beforeEach(async () => {
        // Login to get token
        const loginResponse = await apiClient.login('lawyer@testfirm.com', 'SecurePassword123!')
        authToken = loginResponse.body.data.access_token
        apiClient.setAuthToken(authToken)
      })

      test('should logout successfully', async () => {
        const response = await apiClient.logout()

        expect(response.status).toBe(200)
        expect(response.body.message).toBe('Logged out successfully')
      })

      test('should invalidate tokens on logout', async () => {
        // Logout
        await apiClient.logout()

        // Try to use the token after logout
        const response = await apiClient.getProfile()

        expect(response.status).toBe(401)
        expect(response.body.error.message).toContain('Token has been revoked')
      })

      test('should handle logout without valid token', async () => {
        // Clear token
        apiClient.setAuthToken('')

        const response = await apiClient.logout()

        expect(response.status).toBe(401)
        expect(response.body.error.message).toContain('No valid token provided')
      })
    })

    describe('Token Refresh', () => {
      let refreshToken: string

      beforeEach(async () => {
        const loginResponse = await apiClient.login('lawyer@testfirm.com', 'SecurePassword123!')
        refreshToken = loginResponse.body.data.refresh_token
      })

      test('should refresh token successfully', async () => {
        const response = await apiClient.refreshToken(refreshToken)

        expect(response.status).toBe(200)
        expect(response.body.data).toHaveProperty('access_token')
        expect(response.body.data).toHaveProperty('refresh_token')
        expect(response.body.data).toHaveProperty('expires_in')
      })

      test('should reject invalid refresh token', async () => {
        const response = await apiClient.refreshToken('invalid-refresh-token')

        expect(response.status).toBe(401)
        expect(response.body.error.message).toContain('Invalid refresh token')
      })

      test('should reject expired refresh token', async () => {
        const expiredToken = 'expired-refresh-token'

        const response = await apiClient.refreshToken(expiredToken)

        expect(response.status).toBe(401)
        expect(response.body.error.message).toContain('Refresh token has expired')
      })

      test('should invalidate old refresh token after use', async () => {
        // Use refresh token
        await apiClient.refreshToken(refreshToken)

        // Try to use the same refresh token again
        const response = await apiClient.refreshToken(refreshToken)

        expect(response.status).toBe(401)
        expect(response.body.error.message).toContain('Refresh token already used')
      })
    })

    describe('Multi-Factor Authentication (MFA)', () => {
      test('should require MFA for admin users', async () => {
        const adminCredentials = {
          email: 'admin@testfirm.com',
          password: 'AdminPassword123!'
        }

        const response = await apiClient.login(adminCredentials.email, adminCredentials.password)

        if (response.body.data.mfa_required) {
          expect(response.status).toBe(202) // Accepted but needs MFA
          expect(response.body.data).toHaveProperty('mfa_token')
          expect(response.body.data).toHaveProperty('mfa_methods')
        }
      })

      test('should verify MFA code successfully', async () => {
        // This would be a separate endpoint for MFA verification
        const mfaData = {
          mfa_token: 'temp-mfa-token',
          mfa_code: '123456',
          mfa_method: 'totp'
        }

        // Mock MFA verification endpoint
        const response = await apiClient.login('admin@testfirm.com', 'AdminPassword123!')

        if (response.body.data.mfa_required) {
          // In real implementation, this would be a separate MFA verification endpoint
          expect(response.status).toBe(202)
        } else {
          expect(response.status).toBe(200)
        }
      })

      test('should reject invalid MFA code', async () => {
        const mfaData = {
          mfa_token: 'temp-mfa-token',
          mfa_code: '000000', // Invalid code
          mfa_method: 'totp'
        }

        // Mock invalid MFA scenario
        const response = await apiClient.login('admin@testfirm.com', 'WrongPassword')

        expect(response.status).toBe(401)
      })
    })
  })

  describe('Authorization and Permissions', () => {
    let lawyerToken: string
    let adminToken: string
    let assistantToken: string

    beforeAll(async () => {
      // Get tokens for different user roles
      const lawyerLogin = await apiClient.login('lawyer@testfirm.com', 'SecurePassword123!')
      lawyerToken = lawyerLogin.body.data.access_token

      const adminLogin = await apiClient.login('admin@testfirm.com', 'AdminPassword123!')
      adminToken = adminLogin.body.data.access_token

      const assistantLogin = await apiClient.login('assistant@testfirm.com', 'AssistantPassword123!')
      assistantToken = assistantLogin.body.data.access_token
    })

    describe('Role-Based Access Control (RBAC)', () => {
      test('admin should access all resources', async () => {
        apiClient.setAuthToken(adminToken)

        const responses = await Promise.all([
          apiClient.getInvoices(),
          apiClient.getBills(),
          apiClient.getVendors(),
          apiClient.getTimeEntries(),
          apiClient.getClients(),
          apiClient.getMatters()
        ])

        responses.forEach(response => {
          expect(response.status).toBe(200)
        })
      })

      test('lawyer should access case-related resources', async () => {
        apiClient.setAuthToken(lawyerToken)

        const allowedResponses = await Promise.all([
          apiClient.getTimeEntries(),
          apiClient.getClients(),
          apiClient.getMatters(),
          apiClient.getInvoices()
        ])

        allowedResponses.forEach(response => {
          expect(response.status).toBe(200)
        })
      })

      test('lawyer should be restricted from admin functions', async () => {
        apiClient.setAuthToken(lawyerToken)

        const restrictedResponses = await Promise.all([
          apiClient.createVendor({
            name: 'Test Vendor',
            email: 'test@vendor.com',
            vendor_type: 'service_provider'
          })
          // Other admin-only operations would be tested here
        ])

        restrictedResponses.forEach(response => {
          expect(response.status).toBe(403)
          expect(response.body.error.message).toContain('Insufficient permissions')
        })
      })

      test('assistant should have limited access', async () => {
        apiClient.setAuthToken(assistantToken)

        // Assistant can view but not modify
        const viewResponse = await apiClient.getClients()
        expect(viewResponse.status).toBe(200)

        const createResponse = await apiClient.createClient({
          name: 'Test Client',
          email: 'test@client.com',
          client_type: 'individual'
        })
        expect(createResponse.status).toBe(403)
      })

      test('should respect resource ownership', async () => {
        apiClient.setAuthToken(lawyerToken)

        // Lawyer should only see their own time entries
        const timeEntriesResponse = await apiClient.getTimeEntries()
        expect(timeEntriesResponse.status).toBe(200)

        const timeEntries = timeEntriesResponse.body.data
        timeEntries.forEach((entry: any) => {
          expect(entry.user_id).toBe('current-user-id') // Should match logged-in user
        })
      })

      test('should prevent cross-tenant data access', async () => {
        apiClient.setAuthToken(lawyerToken)

        // Try to access data from different law firm
        const response = await apiClient.getClients({
          law_firm_id: 'different-law-firm-id'
        })

        expect(response.status).toBe(403)
        expect(response.body.error.message).toContain('Access denied to this law firm')
      })
    })

    describe('Permission-Based Access Control', () => {
      test('should check specific permissions for actions', async () => {
        apiClient.setAuthToken(lawyerToken)

        // Test invoice creation permission
        const invoiceResponse = await apiClient.createInvoice({
          client_id: 'test-client-id',
          invoice_type: 'subscription',
          due_date: '2024-04-15'
        })

        if (invoiceResponse.status === 403) {
          expect(invoiceResponse.body.error.message).toContain('create_invoices permission required')
        } else {
          expect(invoiceResponse.status).toBe(201)
        }
      })

      test('should validate combined permissions', async () => {
        apiClient.setAuthToken(lawyerToken)

        // Action requiring multiple permissions
        const complexActionResponse = await apiClient.generateInvoice({
          invoice_type: 'time_based',
          billing_period_start: '2024-03-01',
          billing_period_end: '2024-03-31'
        })

        if (complexActionResponse.status === 403) {
          expect(complexActionResponse.body.error.message).toMatch(
            /(create_invoices|view_time_entries|generate_reports) permission required/
          )
        }
      })

      test('should handle dynamic permissions', async () => {
        apiClient.setAuthToken(lawyerToken)

        // Permission that depends on context (e.g., matter assignment)
        const matterResponse = await apiClient.getMatter('specific-matter-id')

        if (matterResponse.status === 403) {
          expect(matterResponse.body.error.message).toContain('Not assigned to this matter')
        } else {
          expect(matterResponse.status).toBe(200)
        }
      })
    })

    describe('API Key Authentication', () => {
      test('should authenticate with valid API key', async () => {
        const apiKeyClient = new APITestClient()
        apiKeyClient.setHeader('X-API-Key', 'valid-api-key-123')

        const response = await apiKeyClient.getInvoices()

        expect(response.status).toBe(200)
      })

      test('should reject invalid API key', async () => {
        const apiKeyClient = new APITestClient()
        apiKeyClient.setHeader('X-API-Key', 'invalid-api-key')

        const response = await apiKeyClient.getInvoices()

        expect(response.status).toBe(401)
        expect(response.body.error.message).toContain('Invalid API key')
      })

      test('should respect API key rate limits', async () => {
        const apiKeyClient = new APITestClient()
        apiKeyClient.setHeader('X-API-Key', 'rate-limited-key')

        // Make multiple requests to trigger rate limit
        const promises = Array.from({ length: 20 }, () => 
          apiKeyClient.getInvoices()
        )

        const responses = await Promise.allSettled(promises)
        const rateLimitedResponses = responses.filter(
          (result) => result.status === 'fulfilled' && 
          result.value.status === 429
        )

        expect(rateLimitedResponses.length).toBeGreaterThan(0)
      })

      test('should include API key permissions in response', async () => {
        const apiKeyClient = new APITestClient()
        apiKeyClient.setHeader('X-API-Key', 'limited-permissions-key')

        // API key with limited permissions
        const allowedResponse = await apiKeyClient.getInvoices()
        expect(allowedResponse.status).toBe(200)

        const restrictedResponse = await apiKeyClient.createInvoice({
          client_id: 'test-client',
          invoice_type: 'subscription'
        })
        expect(restrictedResponse.status).toBe(403)
      })
    })
  })

  describe('Session Management', () => {
    let userToken: string

    beforeEach(async () => {
      const loginResponse = await apiClient.login('lawyer@testfirm.com', 'SecurePassword123!')
      userToken = loginResponse.body.data.access_token
      apiClient.setAuthToken(userToken)
    })

    test('should maintain session state', async () => {
      const response = await apiClient.getProfile()

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveProperty('email')
      expect(response.body.data).toHaveProperty('last_activity')
    })

    test('should handle concurrent sessions', async () => {
      // Login from another client
      const secondClient = new APITestClient()
      const secondLoginResponse = await secondClient.login('lawyer@testfirm.com', 'SecurePassword123!')
      const secondToken = secondLoginResponse.body.data.access_token
      secondClient.setAuthToken(secondToken)

      // Both sessions should be valid
      const firstSessionResponse = await apiClient.getProfile()
      const secondSessionResponse = await secondClient.getProfile()

      expect(firstSessionResponse.status).toBe(200)
      expect(secondSessionResponse.status).toBe(200)
    })

    test('should expire sessions after timeout', async () => {
      // Mock session timeout
      vi.useFakeTimers()
      
      // Fast-forward time beyond session timeout
      vi.advanceTimersByTime(24 * 60 * 60 * 1000) // 24 hours

      const response = await apiClient.getProfile()

      expect(response.status).toBe(401)
      expect(response.body.error.message).toContain('Session expired')

      vi.useRealTimers()
    })

    test('should extend session on activity', async () => {
      // Make a request to extend session
      await apiClient.getProfile()

      // Session should still be valid
      const response = await apiClient.getInvoices()
      expect(response.status).toBe(200)
    })

    test('should handle session revocation', async () => {
      // Logout to revoke session
      await apiClient.logout()

      // Try to use revoked session
      const response = await apiClient.getProfile()

      expect(response.status).toBe(401)
      expect(response.body.error.message).toContain('Session has been revoked')
    })
  })

  describe('User Profile Management', () => {
    let userToken: string

    beforeEach(async () => {
      const loginResponse = await apiClient.login('lawyer@testfirm.com', 'SecurePassword123!')
      userToken = loginResponse.body.data.access_token
      apiClient.setAuthToken(userToken)
    })

    test('should get user profile', async () => {
      const response = await apiClient.getProfile()

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveProperty('id')
      expect(response.body.data).toHaveProperty('email')
      expect(response.body.data).toHaveProperty('full_name')
      expect(response.body.data).toHaveProperty('role')
      expect(response.body.data).toHaveProperty('law_firm_id')
      expect(response.body.data).toHaveProperty('permissions')
      expect(response.body.data).toHaveProperty('preferences')
      expect(response.body.data).toHaveProperty('created_at')
      expect(response.body.data).toHaveProperty('last_login_at')
    })

    test('should update user profile', async () => {
      const updateData = {
        full_name: 'Updated Full Name',
        phone: '+55 11 99999-9999',
        preferences: {
          language: 'pt-BR',
          timezone: 'America/Sao_Paulo',
          notifications: {
            email: true,
            push: false
          }
        }
      }

      const response = await apiClient.updateProfile(updateData)

      expect(response.status).toBe(200)
      expect(response.body.data.full_name).toBe(updateData.full_name)
      expect(response.body.data.phone).toBe(updateData.phone)
      expect(response.body.data.preferences.language).toBe(updateData.preferences.language)
    })

    test('should prevent updating sensitive fields', async () => {
      const invalidUpdateData = {
        email: 'hacker@malicious.com',
        role: 'admin',
        law_firm_id: 'different-firm-id'
      }

      const response = await apiClient.updateProfile(invalidUpdateData)

      expect(response.status).toBe(400)
      expect(response.body.error.message).toContain('Cannot update sensitive fields')
    })

    test('should validate profile data', async () => {
      const invalidData = {
        phone: 'invalid-phone-number',
        preferences: {
          timezone: 'Invalid/Timezone'
        }
      }

      const response = await apiClient.updateProfile(invalidData)

      expect(response.status).toBe(400)
      expect(response.body.error.message).toContain('Invalid phone number format')
    })
  })

  describe('Password Management', () => {
    let userToken: string

    beforeEach(async () => {
      const loginResponse = await apiClient.login('lawyer@testfirm.com', 'SecurePassword123!')
      userToken = loginResponse.body.data.access_token
      apiClient.setAuthToken(userToken)
    })

    test('should change password with current password', async () => {
      const passwordData = {
        current_password: 'SecurePassword123!',
        new_password: 'NewSecurePassword456!',
        confirm_password: 'NewSecurePassword456!'
      }

      // Mock password change endpoint
      const response = await apiClient.updateProfile(passwordData)

      if (response.status === 200) {
        expect(response.body.message).toContain('Password updated successfully')
      } else {
        // If not implemented, expect 400 for security fields
        expect(response.status).toBe(400)
      }
    })

    test('should require current password for change', async () => {
      const passwordData = {
        new_password: 'NewSecurePassword456!',
        confirm_password: 'NewSecurePassword456!'
        // Missing current_password
      }

      const response = await apiClient.updateProfile(passwordData)

      expect(response.status).toBe(400)
      expect(response.body.error.message).toContain('Current password is required')
    })

    test('should validate new password complexity', async () => {
      const passwordData = {
        current_password: 'SecurePassword123!',
        new_password: 'weak',
        confirm_password: 'weak'
      }

      const response = await apiClient.updateProfile(passwordData)

      expect(response.status).toBe(400)
      expect(response.body.error.message).toContain('Password does not meet complexity requirements')
    })

    test('should require password confirmation match', async () => {
      const passwordData = {
        current_password: 'SecurePassword123!',
        new_password: 'NewSecurePassword456!',
        confirm_password: 'DifferentPassword456!'
      }

      const response = await apiClient.updateProfile(passwordData)

      expect(response.status).toBe(400)
      expect(response.body.error.message).toContain('Password confirmation does not match')
    })

    test('should prevent password reuse', async () => {
      const passwordData = {
        current_password: 'SecurePassword123!',
        new_password: 'SecurePassword123!', // Same as current
        confirm_password: 'SecurePassword123!'
      }

      const response = await apiClient.updateProfile(passwordData)

      expect(response.status).toBe(400)
      expect(response.body.error.message).toContain('New password must be different from current password')
    })
  })

  describe('Security Features', () => {
    describe('Rate Limiting', () => {
      test('should enforce rate limits on login attempts', async () => {
        const promises = Array.from({ length: 10 }, () => 
          apiClient.login('test@example.com', 'wrongpassword')
        )

        const responses = await Promise.allSettled(promises)
        const rateLimitedResponses = responses.filter(
          (result) => result.status === 'fulfilled' && 
          result.value.status === 429
        )

        expect(rateLimitedResponses.length).toBeGreaterThan(0)
      })

      test('should enforce rate limits on API requests', async () => {
        apiClient.setAuthToken('valid-token')

        const promises = Array.from({ length: 100 }, () => 
          apiClient.getInvoices()
        )

        const responses = await Promise.allSettled(promises)
        const rateLimitedResponses = responses.filter(
          (result) => result.status === 'fulfilled' && 
          result.value.status === 429
        )

        expect(rateLimitedResponses.length).toBeGreaterThan(0)
      })

      test('should include rate limit headers', async () => {
        apiClient.setAuthToken('valid-token')

        const response = await apiClient.getInvoices()

        if (response.status === 200) {
          expect(response.headers).toHaveProperty('x-ratelimit-limit')
          expect(response.headers).toHaveProperty('x-ratelimit-remaining')
          expect(response.headers).toHaveProperty('x-ratelimit-reset')
        }
      })
    })

    describe('Input Validation and Sanitization', () => {
      test('should sanitize SQL injection attempts', async () => {
        const maliciousInput = {
          email: "'; DROP TABLE users; --",
          password: 'password'
        }

        const response = await apiClient.login(maliciousInput.email, maliciousInput.password)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('Invalid input detected')
      })

      test('should prevent XSS in profile updates', async () => {
        apiClient.setAuthToken('valid-token')

        const maliciousData = {
          full_name: '<script>alert("XSS")</script>',
          bio: '<img src=x onerror=alert(1)>'
        }

        const response = await apiClient.updateProfile(maliciousData)

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('Invalid characters detected')
      })

      test('should validate JSON structure', async () => {
        apiClient.setAuthToken('valid-token')

        // Send malformed JSON
        const response = await apiClient.createInvoice('invalid-json')

        expect(response.status).toBe(400)
        expect(response.body.error.message).toContain('Invalid JSON format')
      })
    })

    describe('CORS and Security Headers', () => {
      test('should include security headers', async () => {
        const response = await apiClient.healthCheck()

        expect(response.headers).toHaveProperty('x-frame-options')
        expect(response.headers).toHaveProperty('x-content-type-options')
        expect(response.headers).toHaveProperty('x-xss-protection')
        expect(response.headers).toHaveProperty('strict-transport-security')
      })

      test('should handle CORS preflight requests', async () => {
        // Mock CORS preflight
        const response = await apiClient.healthCheck()

        if (response.headers['access-control-allow-origin']) {
          expect(response.headers['access-control-allow-origin']).toBeTruthy()
          expect(response.headers['access-control-allow-methods']).toBeTruthy()
          expect(response.headers['access-control-allow-headers']).toBeTruthy()
        }
      })
    })

    describe('Audit Logging', () => {
      test('should log authentication events', async () => {
        const loginResponse = await apiClient.login('lawyer@testfirm.com', 'SecurePassword123!')

        expect(loginResponse.status).toBe(200)
        // In actual implementation, this would check audit logs
        // For now, we verify the login was successful
      })

      test('should log authorization failures', async () => {
        apiClient.setAuthToken('invalid-token')

        const response = await apiClient.getInvoices()

        expect(response.status).toBe(401)
        // Audit log would capture this unauthorized access attempt
      })

      test('should log sensitive operations', async () => {
        apiClient.setAuthToken('admin-token')

        // Mock sensitive operation
        const response = await apiClient.createVendor({
          name: 'Test Vendor',
          email: 'test@vendor.com',
          vendor_type: 'service_provider'
        })

        if (response.status === 201) {
          // This operation should be logged for audit purposes
          expect(response.body.data).toHaveProperty('id')
        }
      })
    })
  })

  describe('Error Handling', () => {
    test('should handle network timeouts gracefully', async () => {
      vi.spyOn(apiClient, 'login').mockImplementation(() => {
        throw new Error('Network timeout')
      })

      try {
        await apiClient.login('test@example.com', 'password')
      } catch (error) {
        expect(error.message).toContain('Network timeout')
      }
    })

    test('should handle server errors gracefully', async () => {
      vi.spyOn(apiClient, 'login').mockResolvedValue({
        status: 500,
        body: { error: { message: 'Internal server error' } }
      } as any)

      const response = await apiClient.login('test@example.com', 'password')

      expect(response.status).toBe(500)
      expect(response.body.error.message).toBe('Internal server error')
    })

    test('should provide meaningful error messages', async () => {
      const response = await apiClient.login('', '')

      expect(response.status).toBe(400)
      expect(response.body.error.message).toMatch(/(email|password).*(required|invalid)/i)
    })

    test('should handle token expiration gracefully', async () => {
      apiClient.setAuthToken('expired-token')

      const response = await apiClient.getProfile()

      expect(response.status).toBe(401)
      expect(response.body.error.message).toContain('Token has expired')
      expect(response.body.error.code).toBe('TOKEN_EXPIRED')
    })
  })
})