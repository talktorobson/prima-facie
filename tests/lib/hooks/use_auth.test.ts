import { renderHook, act } from '@testing-library/react'
import { useAuth } from '@/lib/hooks/use_auth'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Mock Supabase client
jest.mock('@supabase/auth-helpers-nextjs')

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(),
    signOut: jest.fn(),
  },
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(createClientComponentClient as jest.Mock).mockReturnValue(mockSupabase)
})

describe('useAuth hook', () => {
  it('should initialize with loading state', () => {
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
    mockSupabase.auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } })

    const { result } = renderHook(() => useAuth())

    expect(result.current.loading).toBe(true)
    expect(result.current.user).toBe(null)
    expect(result.current.session).toBe(null)
  })

  it('should set user and session when authenticated', async () => {
    const mockUser = { id: '123', email: 'test@example.com' }
    const mockSession = { user: mockUser, access_token: 'token' }

    mockSupabase.auth.getSession.mockResolvedValue({ 
      data: { session: mockSession }, 
      error: null 
    })
    mockSupabase.auth.onAuthStateChange.mockReturnValue({ 
      data: { subscription: { unsubscribe: jest.fn() } } 
    })

    const { result } = renderHook(() => useAuth())

    // Wait for the effect to run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.user).toEqual(mockUser)
    expect(result.current.session).toEqual(mockSession)
  })

  it('should handle sign out', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
    mockSupabase.auth.onAuthStateChange.mockReturnValue({ 
      data: { subscription: { unsubscribe: jest.fn() } } 
    })
    mockSupabase.auth.signOut.mockResolvedValue({ error: null })

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.signOut()
    })

    expect(mockSupabase.auth.signOut).toHaveBeenCalled()
  })

  it('should handle auth state changes', () => {
    let authStateCallback: any

    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
    mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
      authStateCallback = callback
      return { data: { subscription: { unsubscribe: jest.fn() } } }
    })

    const { result } = renderHook(() => useAuth())

    const mockUser = { id: '123', email: 'test@example.com' }
    const mockSession = { user: mockUser, access_token: 'token' }

    act(() => {
      authStateCallback('SIGNED_IN', mockSession)
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.session).toEqual(mockSession)
    expect(result.current.loading).toBe(false)
  })

  it('should clean up subscription on unmount', () => {
    const mockUnsubscribe = jest.fn()
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
    mockSupabase.auth.onAuthStateChange.mockReturnValue({ 
      data: { subscription: { unsubscribe: mockUnsubscribe } } 
    })

    const { unmount } = renderHook(() => useAuth())

    unmount()

    expect(mockUnsubscribe).toHaveBeenCalled()
  })
}