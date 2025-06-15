'use client'

import { useState, useEffect } from 'react'
import { 
  BellIcon,
  XMarkIcon,
  CheckIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'
import { 
  chatNotificationService,
  ChatNotification,
  getNotificationIcon,
  getNotificationColor,
  formatNotificationTime
} from '@/lib/notifications/chat-notifications'

interface NotificationPanelProps {
  userId: string
  isClient?: boolean
  className?: string
}

interface NotificationItemProps {
  notification: ChatNotification
  onClick: (notification: ChatNotification) => void
  onMarkAsRead: (notificationId: string) => void
}

const NotificationItem = ({ notification, onClick, onMarkAsRead }: NotificationItemProps) => {
  const handleClick = () => {
    onClick(notification)
    if (!notification.is_read) {
      onMarkAsRead(notification.id)
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
        !notification.is_read ? 'bg-blue-50 border-blue-200' : ''
      }`}
    >
      <div className="flex items-start space-x-3">
        {/* Notification Icon */}
        <div className="flex-shrink-0 mt-1">
          <span className="text-lg">
            {getNotificationIcon(notification.notification_type)}
          </span>
        </div>

        {/* Notification Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className={`text-sm font-medium truncate ${
              !notification.is_read ? 'text-gray-900' : 'text-gray-700'
            }`}>
              {notification.title}
            </h4>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                {formatNotificationTime(notification.created_at)}
              </span>
              {!notification.is_read && (
                <div className="w-2 h-2 bg-blue-600 rounded-full" />
              )}
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {notification.content}
          </p>
          
          {/* Sent Via Indicators */}
          {notification.sent_via && notification.sent_via.length > 0 && (
            <div className="flex items-center space-x-2 mt-2">
              <span className="text-xs text-gray-400">Enviado via:</span>
              {notification.sent_via.map((channel) => (
                <span
                  key={channel}
                  className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600"
                >
                  {channel === 'email' && '📧'}
                  {channel === 'push' && '🔔'}
                  {channel === 'whatsapp' && '📱'}
                  {channel}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Mark as Read Button */}
        {!notification.is_read && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onMarkAsRead(notification.id)
            }}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-100"
            title="Marcar como lida"
          >
            <CheckIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

export default function NotificationPanel({ userId, isClient = false, className = '' }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<ChatNotification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Load notifications
  const loadNotifications = async () => {
    setIsLoading(true)
    try {
      const unreadNotifications = await chatNotificationService.getUnreadNotifications(userId, isClient)
      setNotifications(unreadNotifications)
      setUnreadCount(unreadNotifications.length)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Load notifications on mount and when userId changes
  useEffect(() => {
    if (userId) {
      loadNotifications()
    }
  }, [userId, isClient])

  // Auto-refresh notifications every 30 seconds
  useEffect(() => {
    if (userId) {
      const interval = setInterval(loadNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [userId, isClient])

  const handleNotificationClick = (notification: ChatNotification) => {
    // In a real app, navigate to the conversation
    console.log('Navigate to conversation:', notification.conversation_id)
    setIsOpen(false)
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await chatNotificationService.markNotificationAsRead(notificationId)
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await chatNotificationService.markAllNotificationsAsRead(userId, isClient)
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      )
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const togglePanel = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      loadNotifications() // Refresh when opening
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell Button */}
      <button
        onClick={togglePanel}
        className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
        title="Notificações"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ChatBubbleLeftRightIcon className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium text-gray-900">Notificações</h3>
                {unreadCount > 0 && (
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Marcar todas como lidas
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Carregando notificações...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <BellIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma notificação
                </h4>
                <p className="text-gray-500">
                  Você está em dia! Não há notificações pendentes.
                </p>
              </div>
            ) : (
              <div>
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={handleNotificationClick}
                    onMarkAsRead={handleMarkAsRead}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button 
                onClick={() => {
                  // In real app, navigate to full notifications page
                  console.log('Navigate to all notifications')
                  setIsOpen(false)
                }}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Ver todas as notificações
              </button>
            </div>
          )}
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}