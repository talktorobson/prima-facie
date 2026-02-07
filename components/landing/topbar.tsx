'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

export default function Topbar() {
  const [visible, setVisible] = useState(true)

  if (!visible) return null

  return (
    <div className="w-full h-9 bg-landing-ink flex items-center justify-center px-4 relative z-50">
      <p className="text-xs text-white/80 tracking-wide text-center">
        Atuação exclusiva para empresas e empresários. Conteúdo informativo.
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
