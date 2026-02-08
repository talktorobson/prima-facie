'use client'

import { memo } from 'react'
import {
  PaperClipIcon,
  UserIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'
import { formatMessageTime } from '@/lib/supabase/realtime'
import type { Message } from '@/types/database'
import type { TypingIndicator } from '@/lib/supabase/realtime'
import MessageStatusIndicator from './message-status-indicator'

export interface MessageBubbleProps {
  message: Message & { sender?: { id: string; first_name: string; last_name: string; full_name?: string } }
  isFromCurrentUser: boolean
  showAvatar?: boolean
  showTime?: boolean
}

export const MessageBubble = memo(({ message, isFromCurrentUser, showAvatar = true, showTime = true }: MessageBubbleProps) => {
  const senderName = message.sender?.full_name || message.sender?.first_name || (isFromCurrentUser ? 'Voce' : 'Usuario')

  const renderMessageContent = () => {
    switch (message.message_type) {
      case 'file': {
        const attachment = (message as unknown as Record<string, unknown>).attachments as { name: string; size: number; type: string; url: string }[] | undefined
        const fileInfo = attachment?.[0]
        const formatSize = (bytes: number) => {
          if (bytes < 1024) return `${bytes} B`
          if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
          return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
        }
        const mimeType = fileInfo?.type || ''
        const fileName = fileInfo?.name || message.content || 'Documento'
        const fileUrl = fileInfo?.url || '#'

        if (mimeType.startsWith('image/')) {
          return (
            <div>
              <img
                src={fileUrl}
                alt={fileName}
                className="max-h-64 rounded-lg cursor-pointer"
                loading="lazy"
                onClick={() => window.open(fileUrl)}
                onError={(e) => {
                  const target = e.currentTarget
                  const fallback = document.createElement('a')
                  fallback.href = fileUrl
                  fallback.target = '_blank'
                  fallback.rel = 'noopener noreferrer'
                  fallback.className = 'flex items-center space-x-2 p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors'
                  fallback.innerHTML = `<span class="text-sm text-primary">${fileName}</span>`
                  target.replaceWith(fallback)
                }}
              />
              <p className="text-xs text-gray-500 mt-1">{fileName}</p>
            </div>
          )
        }

        if (mimeType === 'application/pdf') {
          return (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors border border-red-100"
            >
              <DocumentTextIcon className="h-8 w-8 text-red-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{fileName}</p>
                {fileInfo?.size && <p className="text-xs text-gray-500">{formatSize(fileInfo.size)}</p>}
                <p className="text-xs text-red-500 mt-0.5">PDF</p>
              </div>
            </a>
          )
        }

        return (
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
          >
            <PaperClipIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{fileName}</p>
              {fileInfo?.size && <p className="text-xs text-gray-500">{formatSize(fileInfo.size)}</p>}
            </div>
          </a>
        )
      }
      case 'system':
        return (
          <p className="text-sm italic text-gray-600 text-center">
            {message.content}
          </p>
        )
      default:
        return <p className="text-sm whitespace-pre-wrap">{message.content}</p>
    }
  }

  if (message.message_type === 'system') {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-gray-100 rounded-full px-3 py-1">
          {renderMessageContent()}
        </div>
      </div>
    )
  }

  return (
    <div className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex max-w-xs lg:max-w-md ${isFromCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {showAvatar && !isFromCurrentUser && (
          <div className="flex-shrink-0 mr-2">
            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
              <UserIcon className="h-5 w-5 text-gray-600" />
            </div>
          </div>
        )}

        <div className={`${isFromCurrentUser ? 'mr-2' : 'ml-2'}`}>
          {!isFromCurrentUser && showAvatar && (
            <p className="text-xs text-gray-500 mb-1">{senderName}</p>
          )}

          <div
            className={`rounded-lg px-3 py-2 ${
              isFromCurrentUser
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-900'
            }`}
          >
            {message.parent_message_id && (
              <div className="border-l-2 border-gray-300 pl-2 mb-2 opacity-75">
                <p className="text-xs">Respondendo a mensagem</p>
              </div>
            )}

            {renderMessageContent()}

            <div className={`flex items-center justify-end mt-1 space-x-1 ${
              isFromCurrentUser ? 'text-white/70' : 'text-gray-500'
            }`}>
              {showTime && (
                <span className="text-xs">{formatMessageTime(message.created_at)}</span>
              )}
              {isFromCurrentUser && (
                <MessageStatusIndicator
                  status={(message.status as 'sent' | 'delivered' | 'read' | 'failed') || 'sent'}
                  showTooltip={true}
                  size="sm"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}, (prev, next) => (
  prev.message.id === next.message.id &&
  prev.message.status === next.message.status &&
  prev.showAvatar === next.showAvatar &&
  prev.showTime === next.showTime
))
MessageBubble.displayName = 'MessageBubble'

export const TypingIndicatorComponent = ({ typing }: { typing: TypingIndicator[] }) => {
  if (typing.length === 0) return null

  return (
    <div className="flex justify-start mb-4">
      <div className="flex max-w-xs">
        <div className="flex-shrink-0 mr-2">
          <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
            <UserIcon className="h-5 w-5 text-gray-600" />
          </div>
        </div>
        <div className="ml-2">
          <p className="text-xs text-gray-500 mb-1">
            {typing.map(t => t.user_name).join(', ')} esta digitando...
          </p>
          <div className="bg-gray-100 rounded-lg px-3 py-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
