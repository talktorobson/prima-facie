'use client'

import * as React from "react"
import { X, CheckCircle2, XCircle, Info, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

export type ToastVariant = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  message: string
  variant: ToastVariant
  action?: { label: string; onClick: () => void }
}

interface ToastProps extends Toast {
  onClose: (id: string) => void
}

const variantStyles: Record<ToastVariant, string> = {
  success: 'bg-green-50 text-green-900 border-green-200',
  error: 'bg-red-50 text-red-900 border-red-200',
  info: 'bg-blue-50 text-blue-900 border-blue-200',
  warning: 'bg-yellow-50 text-yellow-900 border-yellow-200',
}

const variantIcons: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-green-600" />,
  error: <XCircle className="h-5 w-5 text-red-600" />,
  info: <Info className="h-5 w-5 text-blue-600" />,
  warning: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
}

export function ToastComponent({ id, message, variant, action, onClose }: ToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id)
    }, action ? 8000 : 5000)

    return () => clearTimeout(timer)
  }, [id, onClose, action])

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "flex items-center gap-3 rounded-lg border p-4 shadow-lg",
        "animate-in slide-in-from-right-full duration-300",
        "min-w-[300px] max-w-md",
        variantStyles[variant]
      )}
    >
      <div className="flex-shrink-0">
        {variantIcons[variant]}
      </div>
      <p className="flex-1 text-sm font-medium">{message}</p>
      {action && (
        <button
          onClick={() => { action.onClick(); onClose(id) }}
          className="flex-shrink-0 text-sm font-medium underline underline-offset-2 hover:no-underline"
        >
          {action.label}
        </button>
      )}
      <button
        onClick={() => onClose(id)}
        className="flex-shrink-0 rounded-md p-1 hover:bg-black/5 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
