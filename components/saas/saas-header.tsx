'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

const navLinks = [
  { href: '#funcionalidades', label: 'Funcionalidades' },
  { href: '#plataforma', label: 'Plataforma' },
  { href: '#precos', label: 'Precos' },
]

export default function SaasHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-saas-bg/80 backdrop-blur-md border-b border-saas-border">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/saas" className="text-xl font-display font-bold text-saas-heading">
          Prima Facie
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-saas-muted hover:text-saas-text transition-colors"
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/register"
            className="text-sm font-medium px-5 py-2.5 rounded-lg bg-gradient-to-r from-saas-violet to-saas-cyan text-white hover:opacity-90 transition-opacity"
          >
            Comecar Gratis
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-saas-text"
          aria-label="Menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-saas-surface border-t border-saas-border">
          <nav className="container mx-auto px-6 py-6 flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-saas-text text-base py-2 border-b border-saas-border/50"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/register"
              onClick={() => setMobileOpen(false)}
              className="text-center text-sm font-medium px-5 py-3 rounded-lg bg-gradient-to-r from-saas-violet to-saas-cyan text-white mt-2"
            >
              Comecar Gratis
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
