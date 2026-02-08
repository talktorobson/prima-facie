'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { WebsiteTopbar } from './types'

interface Props {
  data: WebsiteTopbar
}

export default function WebsiteTopbarSection({ data }: Props) {
  const [visible, setVisible] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const key = 'ws-topbar-dismissed'
    if (sessionStorage.getItem(key)) setVisible(false)
  }, [])

  if (!data.enabled || !visible) return null

  function handleDismiss() {
    setDismissed(true)
    sessionStorage.setItem('ws-topbar-dismissed', '1')
    setTimeout(() => setVisible(false), 300)
  }

  return (
    <div
      className={`w-full h-9 bg-website-ink flex items-center justify-center px-4 relative z-50 transition-all duration-300 ${
        dismissed ? '-translate-y-full opacity-0' : ''
      }`}
    >
      <p className="text-xs text-white/80 tracking-wide text-center">
        {data.text}
      </p>
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
        aria-label="Fechar"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
