import React from 'react'
import { renderHook, act } from '@testing-library/react'

// Mock the useSupabase hook from providers
const mockGetUser = jest.fn()
const mockOnAuthStateChange = jest.fn()

jest.mock('@/components/providers', () => ({
  useSupabase: () => ({
    auth: {
      getUser: mockGetUser,
      onAuthStateChange: mockOnAuthStateChange,
    },
  }),
}))

import { useAuth } from '@/lib/hooks/useAuth'

describe('useAuth hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: null } })
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } }
    })
  })

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useAuth())

    expect(result.current.loading).toBe(true)
    expect(result.current.user).toBe(null)
  })

  it('should set user when authenticated', async () => {
    const mockUser = { id: '123', email: 'test@example.com' }
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.user).toEqual(mockUser)
  })

  it('should handle auth state changes', () => {
    let authStateCallback: any

    mockOnAuthStateChange.mockImplementation((callback: any) => {
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
  })

  it('should set user to null on sign out', () => {
    let authStateCallback: any

    mockOnAuthStateChange.mockImplementation((callback: any) => {
      authStateCallback = callback
      return { data: { subscription: { unsubscribe: jest.fn() } } }
    })

    const { result } = renderHook(() => useAuth())

    act(() => {
      authStateCallback('SIGNED_OUT', null)
    })

    expect(result.current.user).toBeNull()
  })

  it('should clean up subscription on unmount', () => {
    const mockUnsubscribe = jest.fn()
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: mockUnsubscribe } }
    })

    const { unmount } = renderHook(() => useAuth())

    unmount()

    expect(mockUnsubscribe).toHaveBeenCalled()
  })
})
