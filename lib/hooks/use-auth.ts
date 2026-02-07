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
  isSuperAdmin: () => boolean
}

export interface SignUpData {
  first_name: string
  last_name: string
  law_firm_id?: string
  user_type: 'admin' | 'lawyer' | 'staff' | 'client' | 'super_admin'
  oab_number?: string
  position?: string
}

export function useAuth(): AuthState & AuthActions {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const [supabase] = useState(() => createClient())

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

  const isSuperAdmin = () => profile?.user_type === 'super_admin'

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

  // Effect 1: Listen for auth state changes (lightweight — no Supabase queries).
  // The onAuthStateChange callback runs while the Supabase auth Web Lock is held.
  // Any Supabase data query inside it would call getSession() internally, which
  // tries to acquire the same lock — causing a permanent deadlock. So we ONLY
  // update React state here and let Effect 2 handle profile fetching.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
          setUser(session.user)
          setLoading(false)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          setLoading(false)
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(session.user)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Effect 2: Fetch user profile when auth user changes.
  // This runs OUTSIDE the auth lock, so Supabase queries work normally.
  useEffect(() => {
    if (!user) {
      setProfile(null)
      return
    }

    let cancelled = false
    fetchUserProfile(user).then((userProfile) => {
      if (!cancelled) {
        setProfile(userProfile)
      }
    })

    return () => {
      cancelled = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

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
    isSuperAdmin,
  }
}
