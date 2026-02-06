// =====================================================
// Prima Facie - Authentication Utilities
// Server-side auth helpers and user management
// =====================================================

import { createClient } from '@/lib/supabase/server'
import { User, UserWithRelations } from '@/types/database'
import { redirect } from 'next/navigation'

export interface AuthUser {
  id: string
  email: string
  user_metadata?: {
    first_name?: string
    last_name?: string
    [key: string]: any
  }
}

export interface AuthSession {
  user: AuthUser
  profile?: UserWithRelations
}

// =====================================================
// SESSION MANAGEMENT
// =====================================================

/**
 * Get current session from server
 * Returns null if user is not authenticated
 */
export async function getSession(): Promise<AuthSession | null> {
  const supabase = createClient()
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session?.user) {
      return null
    }

    // Get user profile from our database
    const profile = await getUserProfile(session.user.id)
    
    return {
      user: session.user as AuthUser,
      profile: profile || undefined
    }
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

/**
 * Get session or redirect to login
 * Use in protected pages
 */
export async function requireAuth(): Promise<AuthSession> {
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }
  
  return session
}

/**
 * Get session or redirect based on user type
 * Use for role-specific pages
 */
export async function requireRole(allowedRoles: string[]): Promise<AuthSession> {
  const session = await requireAuth()
  
  if (!session.profile || !allowedRoles.includes(session.profile.user_type)) {
    redirect('/dashboard')
  }
  
  return session
}

// =====================================================
// USER PROFILE MANAGEMENT
// =====================================================

/**
 * Get user profile by auth_user_id
 */
export async function getUserProfile(auth_user_id: string): Promise<UserWithRelations | null> {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        law_firm:law_firms(*)
      `)
      .eq('auth_user_id', auth_user_id)
      .single()
    
    if (error || !data) {
      return null
    }
    
    return data as UserWithRelations
  } catch (error) {
    console.error('Error getting user profile:', error)
    return null
  }
}

/**
 * Get user profile by user ID
 */
export async function getUserById(user_id: string): Promise<UserWithRelations | null> {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        law_firm:law_firms(*)
      `)
      .eq('id', user_id)
      .single()
    
    if (error || !data) {
      return null
    }
    
    return data as UserWithRelations
  } catch (error) {
    console.error('Error getting user by ID:', error)
    return null
  }
}

/**
 * Create user profile after auth signup
 */
export async function createUserProfile(
  auth_user_id: string,
  userData: {
    law_firm_id: string
    email: string
    first_name: string
    last_name: string
    user_type: 'admin' | 'lawyer' | 'staff' | 'client'
    oab_number?: string
    position?: string
  }
): Promise<User | null> {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .from('users')
      .insert({
        auth_user_id,
        ...userData
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating user profile:', error)
      return null
    }
    
    return data as User
  } catch (error) {
    console.error('Error creating user profile:', error)
    return null
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  user_id: string,
  updates: Partial<User>
): Promise<User | null> {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', user_id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating user profile:', error)
      return null
    }
    
    return data as User
  } catch (error) {
    console.error('Error updating user profile:', error)
    return null
  }
}

// =====================================================
// ROLE CHECKING UTILITIES
// =====================================================

/**
 * Check if user has admin role
 */
export function isAdmin(user?: UserWithRelations | null): boolean {
  return user?.user_type === 'admin'
}

/**
 * Check if user is staff (admin, lawyer, or staff)
 */
export function isStaff(user?: UserWithRelations | null): boolean {
  return user?.user_type && ['admin', 'lawyer', 'staff'].includes(user.user_type) || false
}

/**
 * Check if user is lawyer
 */
export function isLawyer(user?: UserWithRelations | null): boolean {
  return user?.user_type === 'lawyer'
}

/**
 * Check if user is client
 */
export function isClient(user?: UserWithRelations | null): boolean {
  return user?.user_type === 'client'
}

/**
 * Check if user can access admin features
 */
export function canAccessAdmin(user?: UserWithRelations | null): boolean {
  return isAdmin(user)
}

/**
 * Check if user can manage matters
 */
export function canManageMatters(user?: UserWithRelations | null): boolean {
  return isStaff(user)
}

/**
 * Check if user can manage clients
 */
export function canManageClients(user?: UserWithRelations | null): boolean {
  return isStaff(user)
}

/**
 * Check if user can view financial data
 */
export function canViewFinancials(user?: UserWithRelations | null): boolean {
  return user?.user_type && ['admin', 'lawyer'].includes(user.user_type) || false
}

// =====================================================
// LAW FIRM UTILITIES
// =====================================================

/**
 * Get current user's law firm
 */
export async function getCurrentLawFirm() {
  const session = await getSession()
  return session?.profile?.law_firm || null
}

/**
 * Check if user belongs to law firm
 */
export function belongsToLawFirm(user?: UserWithRelations | null, law_firm_id?: string): boolean {
  return user?.law_firm_id === law_firm_id
}