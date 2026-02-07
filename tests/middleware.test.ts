import { middleware } from '@/middleware'

// Mock Supabase SSR
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  })),
}))

describe('Middleware', () => {
  it('should be a function', () => {
    expect(typeof middleware).toBe('function')
  })

  it('should export middleware function', () => {
    expect(middleware).toBeDefined()
    expect(typeof middleware).toBe('function')
  })
})

describe('Middleware config', () => {
  it('should export config with correct matcher', () => {
    const { config } = require('@/middleware')
    
    expect(config).toBeDefined()
    expect(config.matcher).toBeDefined()
    expect(Array.isArray(config.matcher)).toBe(true)
  })
})