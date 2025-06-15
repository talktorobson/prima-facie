// =====================================================
// Prima Facie - Client-side Authentication Hook
// React hooks for auth state management
// =====================================================

'use client'

import { createClient } from '@/lib/supabase/client'
import { UserWithRelations } from '@/types/database'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { mockAuth } from '@/lib/auth-mock'

// Toggle for mock authentication (set to true for testing without Supabase)
const USE_MOCK_AUTH = typeof window !== 'undefined' && process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true'

export interface AuthState {
  user: User | null
  profile: UserWithRelations | null
  loading: boolean
  error: string | null
}

export interface AuthActions {
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, userData: SignUpData) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error?: string }>
  refreshProfile: () => Promise<void>
}

export interface SignUpData {
  first_name: string
  last_name: string
  law_firm_id: string
  user_type: 'admin' | 'lawyer' | 'staff' | 'client'
  oab_number?: string
  position?: string
}

export function useAuth(): AuthState & AuthActions {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  // =====================================================
  // PROFILE MANAGEMENT
  // =====================================================

  const fetchUserProfile = async (auth_user: User) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          law_firm:law_firms(*)
        `)
        .eq('auth_user_id', auth_user.id)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return null
      }

      return data as UserWithRelations
    } catch (err) {
      console.error('Error fetching profile:', err)
      return null
    }
  }

  const refreshProfile = async () => {
    if (!user) return
    
    const userProfile = await fetchUserProfile(user)
    setProfile(userProfile)
  }

  // =====================================================
  // AUTHENTICATION ACTIONS
  // =====================================================

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)

      if (USE_MOCK_AUTH) {
        const result = await mockAuth.signIn(email, password)
        if ('error' in result && result.error) {
          setError(result.error)
          return { error: result.error }
        }
        if ('user' in result && result.user) {
          setUser({ id: result.user.id, email: result.user.email } as User)
          setProfile(result.user as UserWithRelations)
        }
        return {}
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError('Email ou senha inválidos')
        return { error: signInError.message }
      }

      // Profile will be loaded by auth state change listener
      return {}
    } catch (err) {
      const errorMessage = 'Erro ao fazer login'
      setError(errorMessage)
      return { error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, userData: SignUpData) => {
    try {
      setLoading(true)
      setError(null)

      if (USE_MOCK_AUTH) {
        const result = await mockAuth.signUp(email, password, userData)
        if ('error' in result && result.error) {
          setError(result.error)
          return { error: result.error }
        }
        if ('user' in result && result.user) {
          setUser({ id: result.user.id, email: result.user.email } as User)
          setProfile(result.user as UserWithRelations)
        }
        return {}
      }

      // Sign up user in auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: userData.first_name,
            last_name: userData.last_name,
          }
        }
      })

      if (signUpError) {
        setError('Erro ao criar conta')
        return { error: signUpError.message }
      }

      if (!authData.user) {
        setError('Erro ao criar usuário')
        return { error: 'User creation failed' }
      }

      // Create user profile in our database
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          auth_user_id: authData.user.id,
          email,
          ...userData
        })

      if (profileError) {
        setError('Erro ao criar perfil do usuário')
        return { error: profileError.message }
      }

      return {}
    } catch (err) {
      const errorMessage = 'Erro ao criar conta'
      setError(errorMessage)
      return { error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      
      if (USE_MOCK_AUTH) {
        await mockAuth.signOut()
        setUser(null)
        setProfile(null)
        router.push('/login')
        return
      }
      
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      router.push('/login')
    } catch (err) {
      console.error('Error signing out:', err)
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      setError(null)

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) {
        setError('Erro ao enviar email de recuperação')
        return { error: error.message }
      }

      return {}
    } catch (err) {
      const errorMessage = 'Erro ao enviar email de recuperação'
      setError(errorMessage)
      return { error: errorMessage }
    }
  }

  // =====================================================
  // AUTH STATE LISTENER
  // =====================================================

  useEffect(() => {
    let mounted = true

    // Get initial session
    const getInitialSession = async () => {
      if (USE_MOCK_AUTH) {
        // Wait for client-side hydration to complete
        await new Promise(resolve => setTimeout(resolve, 0))
        
        const session = mockAuth.getSession()
        if (mounted) {
          if (session.user) {
            setUser({ id: session.user.id, email: session.user.email } as User)
            setProfile(session.user as UserWithRelations)
          }
          setLoading(false)
        }
        return
      }
      
      const { data: { session } } = await supabase.auth.getSession()
      
      if (mounted) {
        if (session?.user) {
          setUser(session.user)
          const userProfile = await fetchUserProfile(session.user)
          if (mounted) {
            setProfile(userProfile)
          }
        }
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        console.log('Auth state changed:', event, session?.user?.email)

        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          const userProfile = await fetchUserProfile(session.user)
          if (mounted) {
            setProfile(userProfile)
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(session.user)
          // Profile should remain the same, but we can refresh if needed
        }

        if (mounted) {
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  return {
    user,
    profile,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshProfile,
  }
}