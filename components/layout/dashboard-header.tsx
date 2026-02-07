// =====================================================
// Prima Facie - Dashboard Header Component
// Top navigation bar for dashboard
// =====================================================

'use client'

import { UserProfile } from '@/components/auth/user-profile'
import { SearchIcon } from 'lucide-react'
import { useAuthContext } from '@/lib/providers/auth-provider'
import NotificationPanel from '@/components/notifications/notification-panel'

export function DashboardHeader() {
  const { profile } = useAuthContext()

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16">
        {/* Search */}
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar casos, clientes, documentos..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          {profile?.auth_user_id ? (
            <NotificationPanel userId={profile.auth_user_id} />
          ) : (
            <div className="p-2 text-gray-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            </div>
          )}

          {/* User Profile */}
          <UserProfile />
        </div>
      </div>
    </header>
  )
}