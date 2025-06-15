// =====================================================
// Prima Facie - User Profile Component
// Display user information and auth controls
// =====================================================

'use client'

import { useAuthContext } from '@/lib/providers/auth-provider'
import { UserWithRelations } from '@/types/database'
import { ChevronDownIcon, LogOutIcon, SettingsIcon, UserIcon } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface UserProfileProps {
  compact?: boolean
  showDropdown?: boolean
}

export function UserProfile({ compact = false, showDropdown = true }: UserProfileProps) {
  const { profile, signOut, loading } = useAuthContext()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
        {!compact && <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>}
      </div>
    )
  }

  if (!profile) {
    return null
  }

  const handleSignOut = async () => {
    await signOut()
    setIsOpen(false)
  }

  const getUserTypeLabel = (userType: string) => {
    const labels = {
      admin: 'Administrador',
      lawyer: 'Advogado',
      staff: 'Staff',
      client: 'Cliente'
    }
    return labels[userType as keyof typeof labels] || userType
  }

  const getUserInitials = (profile: UserWithRelations) => {
    return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
  }

  const getUserBadgeColor = (userType: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      lawyer: 'bg-blue-100 text-blue-800', 
      staff: 'bg-green-100 text-green-800',
      client: 'bg-gray-100 text-gray-800'
    }
    return colors[userType as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
          {getUserInitials(profile)}
        </div>
        <span className="text-sm font-medium text-gray-700 truncate">
          {profile.first_name}
        </span>
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => showDropdown && setIsOpen(!isOpen)}
        className="flex items-center space-x-3 text-left w-full px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
        disabled={!showDropdown}
      >
        {/* Avatar */}
        <div className="flex-shrink-0">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name || ''}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-medium">
              {getUserInitials(profile)}
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium text-gray-900 truncate">
              {profile.full_name}
            </p>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getUserBadgeColor(profile.user_type)}`}>
              {getUserTypeLabel(profile.user_type)}
            </span>
          </div>
          <p className="text-xs text-gray-500 truncate">
            {profile.email}
          </p>
          {profile.law_firm && (
            <p className="text-xs text-gray-400 truncate">
              {profile.law_firm.name}
            </p>
          )}
        </div>

        {/* Dropdown Arrow */}
        {showDropdown && (
          <ChevronDownIcon 
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          />
        )}
      </button>

      {/* Dropdown Menu */}
      {showDropdown && isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          {/* Profile Info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-medium">
                {getUserInitials(profile)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {profile.full_name}
                </p>
                <p className="text-xs text-gray-500">
                  {profile.email}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getUserBadgeColor(profile.user_type)}`}>
                    {getUserTypeLabel(profile.user_type)}
                  </span>
                  {profile.oab_number && (
                    <span className="text-xs text-gray-400">
                      {profile.oab_number}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              <UserIcon className="w-4 h-4 mr-3" />
              Meu Perfil
            </button>
            <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              <SettingsIcon className="w-4 h-4 mr-3" />
              Configurações
            </button>
          </div>

          <div className="border-t border-gray-100 py-1">
            <button 
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
            >
              <LogOutIcon className="w-4 h-4 mr-3" />
              Sair
            </button>
          </div>
        </div>
      )}
    </div>
  )
}