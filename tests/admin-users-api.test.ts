/**
 * API route tests for admin user management
 * Tests create, update, deactivate, reset-password, and security checks
 * @jest-environment node
 */

// Mock Next.js modules
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
  })),
}))

// Mock Zod schema to avoid import resolution issues
jest.mock('@/lib/schemas/settings-schemas', () => {
  const { z } = require('zod')
  const userManagementSchema = z.object({
    email: z.string().email(),
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    user_type: z.enum(['admin', 'lawyer', 'staff', 'client']),
    oab_number: z.string().optional(),
    position: z.string().optional(),
    phone: z.string().optional(),
    status: z.enum(['active', 'inactive', 'suspended', 'pending']).optional(),
  })
  const userCreateSchema = userManagementSchema.extend({
    password: z.string().min(8, 'Senha deve ter no minimo 8 caracteres'),
    password_confirmation: z.string().optional(),
  }).refine(
    (data: { password: string; password_confirmation?: string }) =>
      !data.password_confirmation || data.password === data.password_confirmation,
    { message: 'As senhas nao coincidem', path: ['password_confirmation'] }
  )
  return { userManagementSchema, userCreateSchema }
})

import { NextResponse } from 'next/server'

const mockVerifyAdmin = jest.fn()
jest.mock('@/lib/supabase/verify-admin', () => ({
  verifyAdmin: () => mockVerifyAdmin(),
}))

const mockCreateUser = jest.fn()
const mockDeleteUser = jest.fn()
const mockGenerateLink = jest.fn()
const mockInsert = jest.fn()
const mockUpdate = jest.fn()
const mockSelectChain = jest.fn()
const mockEq = jest.fn()
const mockSingle = jest.fn()
const mockFrom = jest.fn()

jest.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    auth: {
      admin: {
        createUser: mockCreateUser,
        deleteUser: mockDeleteUser,
        generateLink: mockGenerateLink,
      },
    },
    from: mockFrom,
  }),
}))

// Valid UUIDs for tests
const VALID_UUID_1 = '00000000-0000-0000-0000-000000000001'
const VALID_UUID_2 = '00000000-0000-0000-0000-000000000002'
const VALID_UUID_ADMIN = '11111111-1111-1111-1111-111111111111'
const VALID_UUID_OTHER = '22222222-2222-2222-2222-222222222222'

// Helper to build a chainable mock
function setupInsertChain(data: unknown, error: unknown = null) {
  mockFrom.mockReturnValue({ insert: mockInsert })
  mockInsert.mockReturnValue({ select: mockSelectChain })
  mockSelectChain.mockReturnValue({ single: mockSingle })
  mockSingle.mockResolvedValue({ data, error })
}

function setupSelectThenUpdateChain(
  selectData: unknown,
  selectError: unknown,
  updateData: unknown,
  updateError: unknown = null
) {
  let callCount = 0
  mockFrom.mockImplementation(() => {
    callCount++
    if (callCount === 1) {
      return {
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: selectData, error: selectError }),
          }),
        }),
      }
    }
    return {
      update: (updates: unknown) => ({
        eq: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: updateData ?? { ...selectData, ...updates as Record<string, unknown> }, error: updateError }),
          }),
        }),
      }),
    }
  })
}

function setupSelectThenCountThenUpdateChain(
  selectData: unknown,
  countValue: number,
  updateData: unknown,
) {
  let callCount = 0
  mockFrom.mockImplementation(() => {
    callCount++
    if (callCount === 1) {
      return {
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: selectData, error: null }),
          }),
        }),
      }
    }
    if (callCount === 2) {
      return {
        select: () => ({
          eq: () => ({
            eq: () => ({
              eq: () => Promise.resolve({ count: countValue }),
            }),
          }),
        }),
      }
    }
    return {
      update: () => ({
        eq: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: updateData, error: null }),
          }),
        }),
      }),
    }
  })
}

const adminProfile = { id: VALID_UUID_ADMIN, user_type: 'admin', law_firm_id: 'firm-1' }
const superAdminProfile = { id: 'sa-1', user_type: 'super_admin', law_firm_id: null }

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/admin/users', () => {
  beforeEach(() => jest.clearAllMocks())

  const getHandler = async () => {
    const mod = await import('@/app/api/admin/users/route')
    return mod.POST
  }

  it('returns 401 when not authenticated', async () => {
    mockVerifyAdmin.mockResolvedValue({
      error: NextResponse.json({ error: 'Nao autenticado' }, { status: 401 }),
    })
    const POST = await getHandler()
    const res = await POST(makeRequest({}) as never)
    expect(res.status).toBe(401)
  })

  it('returns 400 on malformed JSON', async () => {
    mockVerifyAdmin.mockResolvedValue({ profile: adminProfile, session: {} })
    const POST = await getHandler()
    const req = new Request('http://localhost/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json{{{',
    })
    const res = await POST(req as never)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('JSON')
  })

  it('returns 400 when required fields missing', async () => {
    mockVerifyAdmin.mockResolvedValue({ profile: adminProfile, session: {} })
    const POST = await getHandler()
    const res = await POST(makeRequest({ email: 'test@test.com' }) as never)
    expect(res.status).toBe(400)
  })

  it('returns 400 when password too short', async () => {
    mockVerifyAdmin.mockResolvedValue({ profile: adminProfile, session: {} })
    const POST = await getHandler()
    const res = await POST(
      makeRequest({
        email: 'test@test.com',
        password: '1234567',
        first_name: 'Test',
        last_name: 'User',
        user_type: 'staff',
      }) as never
    )
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('8 caracteres')
  })

  it('returns 400 when trying to create super_admin (Zod rejects invalid enum)', async () => {
    mockVerifyAdmin.mockResolvedValue({ profile: adminProfile, session: {} })
    const POST = await getHandler()
    const res = await POST(
      makeRequest({
        email: 'evil@test.com',
        password: 'password123',
        first_name: 'Evil',
        last_name: 'User',
        user_type: 'super_admin',
      }) as never
    )
    expect(res.status).toBe(400)
  })

  it('uses admin law_firm_id, ignoring body law_firm_id', async () => {
    mockVerifyAdmin.mockResolvedValue({ profile: adminProfile, session: {} })
    mockCreateUser.mockResolvedValue({ data: { user: { id: 'auth-new' } }, error: null })
    setupInsertChain({ id: 'new-user', law_firm_id: 'firm-1' })

    const POST = await getHandler()
    await POST(
      makeRequest({
        email: 'test@test.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User',
        user_type: 'staff',
        law_firm_id: 'other-firm',
      }) as never
    )

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ law_firm_id: 'firm-1' })
    )
  })

  it('requires law_firm_id in body for super_admin caller', async () => {
    mockVerifyAdmin.mockResolvedValue({ profile: superAdminProfile, session: {} })
    const POST = await getHandler()
    const res = await POST(
      makeRequest({
        email: 'test@test.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User',
        user_type: 'staff',
      }) as never
    )
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('law_firm_id')
  })

  it('returns 404 when super_admin provides non-existent firm', async () => {
    mockVerifyAdmin.mockResolvedValue({ profile: superAdminProfile, session: {} })
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: { message: 'not found' } }),
        }),
      }),
    })

    const POST = await getHandler()
    const res = await POST(
      makeRequest({
        email: 'test@test.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User',
        user_type: 'staff',
        law_firm_id: 'nonexistent-firm',
      }) as never
    )
    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toContain('Escritorio')
  })

  it('creates user successfully with auth + profile', async () => {
    mockVerifyAdmin.mockResolvedValue({ profile: adminProfile, session: {} })
    mockCreateUser.mockResolvedValue({ data: { user: { id: 'auth-new' } }, error: null })

    const newUser = {
      id: 'profile-new',
      auth_user_id: 'auth-new',
      email: 'new@test.com',
      first_name: 'New',
      last_name: 'User',
      user_type: 'staff',
      law_firm_id: 'firm-1',
      status: 'active',
    }
    setupInsertChain(newUser)

    const POST = await getHandler()
    const res = await POST(
      makeRequest({
        email: 'new@test.com',
        password: 'password123',
        first_name: 'New',
        last_name: 'User',
        user_type: 'staff',
      }) as never
    )

    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.data.email).toBe('new@test.com')
    expect(mockCreateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'new@test.com',
        password: 'password123',
        email_confirm: true,
      })
    )
  })

  it('rolls back auth user if profile insert fails', async () => {
    mockVerifyAdmin.mockResolvedValue({ profile: adminProfile, session: {} })
    mockCreateUser.mockResolvedValue({ data: { user: { id: 'auth-rollback' } }, error: null })
    mockDeleteUser.mockResolvedValue({ error: null })
    setupInsertChain(null, { message: 'duplicate email' })

    const POST = await getHandler()
    const res = await POST(
      makeRequest({
        email: 'dup@test.com',
        password: 'password123',
        first_name: 'Dup',
        last_name: 'User',
        user_type: 'staff',
      }) as never
    )

    expect(res.status).toBe(500)
    expect(mockDeleteUser).toHaveBeenCalledWith('auth-rollback')
  })
})

describe('PATCH /api/admin/users/[id]', () => {
  beforeEach(() => jest.clearAllMocks())

  const getHandler = async () => {
    const mod = await import('@/app/api/admin/users/[id]/route')
    return mod.PATCH
  }

  it('returns 400 for invalid UUID', async () => {
    mockVerifyAdmin.mockResolvedValue({ profile: adminProfile, session: {} })
    const PATCH = await getHandler()
    const req = new Request('http://localhost/api/admin/users/not-a-uuid', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ first_name: 'Test' }),
    })
    const res = await PATCH(req as never, { params: { id: 'not-a-uuid' } })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('ID invalido')
  })

  it('returns 400 on malformed JSON', async () => {
    mockVerifyAdmin.mockResolvedValue({ profile: adminProfile, session: {} })
    const PATCH = await getHandler()
    const req = new Request('http://localhost/api/admin/users/' + VALID_UUID_1, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: 'bad-json',
    })
    const res = await PATCH(req as never, { params: { id: VALID_UUID_1 } })
    expect(res.status).toBe(400)
  })

  it('returns 403 when setting user_type to super_admin', async () => {
    mockVerifyAdmin.mockResolvedValue({ profile: adminProfile, session: {} })
    const PATCH = await getHandler()
    const req = new Request('http://localhost/api/admin/users/' + VALID_UUID_1, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_type: 'super_admin' }),
    })
    const res = await PATCH(req as never, { params: { id: VALID_UUID_1 } })
    expect(res.status).toBe(403)
  })

  it('returns 400 when no valid fields provided', async () => {
    mockVerifyAdmin.mockResolvedValue({ profile: adminProfile, session: {} })
    const PATCH = await getHandler()
    const req = new Request('http://localhost/api/admin/users/' + VALID_UUID_1, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'cant-change@test.com' }),
    })
    const res = await PATCH(req as never, { params: { id: VALID_UUID_1 } })
    expect(res.status).toBe(400)
  })

  it('rejects admin updating user from another firm', async () => {
    mockVerifyAdmin.mockResolvedValue({ profile: adminProfile, session: {} })
    setupSelectThenUpdateChain(
      { law_firm_id: 'other-firm' },
      null,
      null,
      null
    )

    const PATCH = await getHandler()
    const req = new Request('http://localhost/api/admin/users/' + VALID_UUID_OTHER, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ first_name: 'Hacked' }),
    })
    const res = await PATCH(req as never, { params: { id: VALID_UUID_OTHER } })
    expect(res.status).toBe(403)
  })

  it('allows admin updating user from same firm', async () => {
    mockVerifyAdmin.mockResolvedValue({ profile: adminProfile, session: {} })
    setupSelectThenUpdateChain(
      { law_firm_id: 'firm-1' },
      null,
      { id: VALID_UUID_2, first_name: 'Updated', law_firm_id: 'firm-1' }
    )

    const PATCH = await getHandler()
    const req = new Request('http://localhost/api/admin/users/' + VALID_UUID_2, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ first_name: 'Updated' }),
    })
    const res = await PATCH(req as never, { params: { id: VALID_UUID_2 } })
    expect(res.status).toBe(200)
  })
})

describe('DELETE /api/admin/users/[id]', () => {
  beforeEach(() => jest.clearAllMocks())

  const getHandler = async () => {
    const mod = await import('@/app/api/admin/users/[id]/route')
    return mod.DELETE
  }

  it('returns 400 for invalid UUID', async () => {
    mockVerifyAdmin.mockResolvedValue({ profile: adminProfile, session: {} })
    const DELETE = await getHandler()
    const req = new Request('http://localhost/api/admin/users/bad', { method: 'DELETE' })
    const res = await DELETE(req as never, { params: { id: 'bad' } })
    expect(res.status).toBe(400)
  })

  it('prevents self-deactivation', async () => {
    mockVerifyAdmin.mockResolvedValue({ profile: adminProfile, session: {} })
    const DELETE = await getHandler()
    const req = new Request('http://localhost/api/admin/users/' + VALID_UUID_ADMIN, { method: 'DELETE' })
    const res = await DELETE(req as never, { params: { id: VALID_UUID_ADMIN } })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('proprio')
  })

  it('rejects deactivation of user from another firm', async () => {
    mockVerifyAdmin.mockResolvedValue({ profile: adminProfile, session: {} })
    setupSelectThenUpdateChain(
      { law_firm_id: 'other-firm', user_type: 'staff' },
      null,
      null
    )

    const DELETE = await getHandler()
    const req = new Request('http://localhost/api/admin/users/' + VALID_UUID_OTHER, { method: 'DELETE' })
    const res = await DELETE(req as never, { params: { id: VALID_UUID_OTHER } })
    expect(res.status).toBe(403)
  })

  it('prevents deactivating the last admin of a firm', async () => {
    mockVerifyAdmin.mockResolvedValue({ profile: adminProfile, session: {} })
    setupSelectThenCountThenUpdateChain(
      { law_firm_id: 'firm-1', user_type: 'admin' },
      1, // only 1 active admin
      null
    )

    const DELETE = await getHandler()
    const req = new Request('http://localhost/api/admin/users/' + VALID_UUID_2, { method: 'DELETE' })
    const res = await DELETE(req as never, { params: { id: VALID_UUID_2 } })
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('ultimo administrador')
  })

  it('allows deactivating admin when multiple admins exist', async () => {
    mockVerifyAdmin.mockResolvedValue({ profile: adminProfile, session: {} })
    setupSelectThenCountThenUpdateChain(
      { law_firm_id: 'firm-1', user_type: 'admin' },
      3, // 3 active admins
      { id: VALID_UUID_2, status: 'inactive' }
    )

    const DELETE = await getHandler()
    const req = new Request('http://localhost/api/admin/users/' + VALID_UUID_2, { method: 'DELETE' })
    const res = await DELETE(req as never, { params: { id: VALID_UUID_2 } })
    expect(res.status).toBe(200)
  })
})

describe('POST /api/admin/users/[id]/reset-password', () => {
  beforeEach(() => jest.clearAllMocks())

  const getHandler = async () => {
    const mod = await import('@/app/api/admin/users/[id]/reset-password/route')
    return mod.POST
  }

  it('returns 400 for invalid UUID', async () => {
    mockVerifyAdmin.mockResolvedValue({ profile: adminProfile, session: {} })
    const POST = await getHandler()
    const req = new Request('http://localhost/api/admin/users/bad/reset-password', { method: 'POST' })
    const res = await POST(req as never, { params: { id: 'bad' } })
    expect(res.status).toBe(400)
  })

  it('returns 404 when user not found', async () => {
    mockVerifyAdmin.mockResolvedValue({ profile: adminProfile, session: {} })
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: { message: 'not found' } }),
        }),
      }),
    })

    const POST = await getHandler()
    const req = new Request('http://localhost/api/admin/users/' + VALID_UUID_1 + '/reset-password', { method: 'POST' })
    const res = await POST(req as never, { params: { id: VALID_UUID_1 } })
    expect(res.status).toBe(404)
  })

  it('rejects reset for user from another firm', async () => {
    mockVerifyAdmin.mockResolvedValue({ profile: adminProfile, session: {} })
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () =>
            Promise.resolve({
              data: { email: 'other@test.com', auth_user_id: 'a1', law_firm_id: 'other-firm' },
              error: null,
            }),
        }),
      }),
    })

    const POST = await getHandler()
    const req = new Request('http://localhost/api/admin/users/' + VALID_UUID_OTHER + '/reset-password', { method: 'POST' })
    const res = await POST(req as never, { params: { id: VALID_UUID_OTHER } })
    expect(res.status).toBe(403)
  })

  it('generates recovery link for same-firm user', async () => {
    mockVerifyAdmin.mockResolvedValue({ profile: adminProfile, session: {} })
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: () =>
            Promise.resolve({
              data: { email: 'user@firm.com', auth_user_id: 'a1', law_firm_id: 'firm-1' },
              error: null,
            }),
        }),
      }),
    })
    mockGenerateLink.mockResolvedValue({ error: null })

    const POST = await getHandler()
    const req = new Request('http://localhost/api/admin/users/' + VALID_UUID_1 + '/reset-password', { method: 'POST' })
    const res = await POST(req as never, { params: { id: VALID_UUID_1 } })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.message).toContain('user@firm.com')
  })
})
