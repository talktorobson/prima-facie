'use client'

import { AlertCircle } from 'lucide-react'

interface ErrorCardProps {
  error: string
}

export function ErrorCard({ error }: ErrorCardProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs">
      <div className="flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
        <p className="text-red-700">{error}</p>
      </div>
    </div>
  )
}
