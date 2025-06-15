// =====================================================
// Prima Facie - Auth Context Provider
// Global authentication state management
// =====================================================

'use client'

import { useAuth, AuthState, AuthActions } from '@/lib/hooks/use-auth'
import { createContext, useContext, ReactNode } from 'react'

type AuthContextType = AuthState & AuthActions

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth()

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  
  return context
}