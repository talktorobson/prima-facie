'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import type { WebsiteTopbar } from './types'

interface Props {
  data: WebsiteTopbar
}

export default function WebsiteTopbarSection({ data }: Props) {
  const [visible, setVisible] = useState(true)

  if (!data.enabled || !visible) return null

  return (
    <div className="w-full h-9 bg-website-ink flex items-center justify-center px-4 relative z-50">
      <p className="text-xs text-white/80 tracking-wide text-center">
        {data.text}
      </p>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
        aria-label="Fechar"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
