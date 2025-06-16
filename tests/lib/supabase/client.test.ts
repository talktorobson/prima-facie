import { createClient } from '@/lib/supabase/client'

// Mock the environment variables
const mockEnv = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
}

// Override process.env for this test
Object.assign(process.env, mockEnv)

describe('Supabase Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create a Supabase client', () => {
    const client = createClient()
    expect(client).toBeDefined()
    expect(typeof client).toBe('object')
  })

  it('should have auth methods', () => {
    const client = createClient()
    expect(client.auth).toBeDefined()
    expect(client.auth.signInWithPassword).toBeDefined()
    expect(client.auth.signUp).toBeDefined()
    expect(client.auth.signOut).toBeDefined()
  })

  it('should have database methods', () => {
    const client = createClient()
    expect(client.from).toBeDefined()
    expect(typeof client.from).toBe('function')
  })

  it('should throw error if environment variables are missing', () => {
    const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    expect(() => {
      jest.resetModules()
      require('@/lib/supabase/client')
    }).toThrow()

    // Restore environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey
  })
})
