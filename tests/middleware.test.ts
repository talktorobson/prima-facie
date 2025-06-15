import { NextRequest, NextResponse } from 'next/server'
import { middleware } from '@/middleware'

// Mock NextResponse
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    redirect: jest.fn(),
    next: jest.fn(),
  },
}))

// Mock Supabase middleware
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createMiddlewareClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(),
    },
  })),
}))

describe('Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(NextResponse.redirect as jest.Mock).mockReturnValue('redirect-response')
    ;(NextResponse.next as jest.Mock).mockReturnValue('next-response')
  })

  it('should be a function', () => {
    expect(typeof middleware).toBe('function')
  })

  it('should accept NextRequest parameter', () => {
    const mockRequest = new NextRequest('http://localhost:3000/test')
    
    // The middleware function should not throw when called with a request
    expect(() => {
      middleware(mockRequest)
    }).not.toThrow()
  })

  // Note: More comprehensive tests would require mocking the Supabase session
  // and testing various authentication scenarios, but this requires the actual
  // middleware implementation to be more testable
})

describe('Middleware config', () => {
  it('should export config with correct matcher', () => {
    const { config } = require('@/middleware')
    
    expect(config).toBeDefined()
    expect(config.matcher).toBeDefined()
    expect(Array.isArray(config.matcher)).toBe(true)
  })
})