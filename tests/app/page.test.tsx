import { redirect } from 'next/navigation'
import HomePage from '@/app/page'

// Mock Next.js redirect
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}))

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should redirect to /login', () => {
    HomePage()
    
    expect(redirect).toHaveBeenCalledWith('/login')
  })

  it('should call redirect only once', () => {
    HomePage()
    
    expect(redirect).toHaveBeenCalledTimes(1)
  })
})