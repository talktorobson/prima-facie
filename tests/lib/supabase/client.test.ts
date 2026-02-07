import { createClient } from '@/lib/supabase/client'

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
})
