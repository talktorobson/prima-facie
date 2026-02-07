/**
 * Unit tests for verifyAdmin() helper
 * Tests authentication, role checks, and firm scoping
 * @jest-environment node
 */

// Mock Next.js server modules before imports
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
  })),
}))

const mockGetSession = jest.fn()
const mockFrom = jest.fn()
const mockSelect = jest.fn()
const mockEq = jest.fn()
const mockSingle = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    auth: { getSession: mockGetSession },
    from: mockFrom,
  }),
}))

import { verifyAdmin } from '@/lib/supabase/verify-admin'

function setupChain(data: unknown, error: unknown = null) {
  mockFrom.mockReturnValue({ select: mockSelect })
  mockSelect.mockReturnValue({ eq: mockEq })
  mockEq.mockReturnValue({ single: mockSingle })
  mockSingle.mockResolvedValue({ data, error })
}

describe('verifyAdmin', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 when session is missing', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null })

    const result = await verifyAdmin()
    expect(result).toHaveProperty('error')
    expect((result as { error: { status: number } }).error.status).toBe(401)
  })

  it('returns 401 when session has error', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null }, error: new Error('expired') })

    const result = await verifyAdmin()
    expect(result).toHaveProperty('error')
    expect((result as { error: { status: number } }).error.status).toBe(401)
  })

  it('returns 403 when profile not found', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'auth-1' } } },
      error: null,
    })
    setupChain(null, { message: 'not found' })

    const result = await verifyAdmin()
    expect(result).toHaveProperty('error')
    expect((result as { error: { status: number } }).error.status).toBe(403)
  })

  it('returns 403 for non-admin user types', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'auth-1' } } },
      error: null,
    })
    setupChain({ id: 'u1', user_type: 'lawyer', law_firm_id: 'firm-1' })

    const result = await verifyAdmin()
    expect(result).toHaveProperty('error')
    expect((result as { error: { status: number } }).error.status).toBe(403)
  })

  it('returns 403 for staff user type', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'auth-1' } } },
      error: null,
    })
    setupChain({ id: 'u1', user_type: 'staff', law_firm_id: 'firm-1' })

    const result = await verifyAdmin()
    expect(result).toHaveProperty('error')
    expect((result as { error: { status: number } }).error.status).toBe(403)
  })

  it('returns 403 for admin without law_firm_id', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'auth-1' } } },
      error: null,
    })
    setupChain({ id: 'u1', user_type: 'admin', law_firm_id: null })

    const result = await verifyAdmin()
    expect(result).toHaveProperty('error')
    expect((result as { error: { status: number } }).error.status).toBe(403)
  })

  it('succeeds for admin with law_firm_id', async () => {
    const session = { user: { id: 'auth-1' } }
    mockGetSession.mockResolvedValue({ data: { session }, error: null })
    setupChain({ id: 'u1', user_type: 'admin', law_firm_id: 'firm-1' })

    const result = await verifyAdmin()
    expect(result).not.toHaveProperty('error')
    expect(result).toHaveProperty('profile')
    expect(result).toHaveProperty('session')
    expect((result as { profile: { user_type: string } }).profile.user_type).toBe('admin')
  })

  it('succeeds for super_admin (even without law_firm_id)', async () => {
    const session = { user: { id: 'auth-sa' } }
    mockGetSession.mockResolvedValue({ data: { session }, error: null })
    setupChain({ id: 'sa1', user_type: 'super_admin', law_firm_id: null })

    const result = await verifyAdmin()
    expect(result).not.toHaveProperty('error')
    expect(result).toHaveProperty('profile')
    expect((result as { profile: { user_type: string } }).profile.user_type).toBe('super_admin')
  })

  it('succeeds for super_admin with law_firm_id', async () => {
    const session = { user: { id: 'auth-sa' } }
    mockGetSession.mockResolvedValue({ data: { session }, error: null })
    setupChain({ id: 'sa1', user_type: 'super_admin', law_firm_id: 'firm-x' })

    const result = await verifyAdmin()
    expect(result).not.toHaveProperty('error')
    expect(result).toHaveProperty('profile')
  })
})
