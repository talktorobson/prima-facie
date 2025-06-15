// =====================================================
// Prima Facie - Role-based Access Control Components
// UI components for protecting elements based on user roles
// =====================================================

'use client'

import { useAuthContext } from '@/lib/providers/auth-provider'
import { ReactNode } from 'react'

interface RoleGuardProps {
  children: ReactNode
  allowedRoles: string[]
  fallback?: ReactNode
  requireAll?: boolean
}

/**
 * Conditional component that shows children only if user has required roles
 */
export function RoleGuard({ children, allowedRoles, fallback = null, requireAll = false }: RoleGuardProps) {
  const { profile } = useAuthContext()

  if (!profile) {
    return <>{fallback}</>
  }

  const hasAccess = requireAll 
    ? allowedRoles.every(role => profile.user_type === role)
    : allowedRoles.includes(profile.user_type)

  return hasAccess ? <>{children}</> : <>{fallback}</>
}

/**
 * Admin-only content
 */
export function AdminOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['admin']} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

/**
 * Staff-only content (admin, lawyer, staff)
 */
export function StaffOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['admin', 'lawyer', 'staff']} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

/**
 * Lawyer-only content
 */
export function LawyerOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['admin', 'lawyer']} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

/**
 * Client-only content
 */
export function ClientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['client']} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

/**
 * Authenticated users only
 */
export function AuthenticatedOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const { user } = useAuthContext()
  
  return user ? <>{children}</> : <>{fallback}</>
}

/**
 * Unauthenticated users only (guests)
 */
export function GuestOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const { user } = useAuthContext()
  
  return !user ? <>{children}</> : <>{fallback}</>
}