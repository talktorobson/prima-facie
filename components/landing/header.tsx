'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

interface HeaderProps {
  variant?: 'transparent' | 'solid'
}

const navLinks = [
  { href: '/atuacao', label: 'Atuacao' },
  { href: '/conteudos', label: 'Conteudos' },
  { href: '/equipe', label: 'Equipe' },
  { href: '/sobre', label: 'Sobre' },
  { href: '/contato', label: 'Contato' },
]

export default function Header({ variant = 'solid' }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const isTransparent = variant === 'transparent'

  return (
    <header
      className={`w-full z-40 ${
        isTransparent
          ? 'absolute top-0 left-0 right-0'
          : 'sticky top-0 bg-landing-ivory border-b border-landing-mist'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 py-5 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3">
          <span
            className={`text-2xl md:text-3xl font-serif font-bold tracking-tight ${
              isTransparent ? 'text-white' : 'text-landing-ink'
            }`}
          >
            D&apos;Avila Reis
          </span>
          <span
            className={`hidden sm:inline text-xs uppercase tracking-[0.2em] ${
              isTransparent ? 'text-white/60' : 'text-landing-stone'
            }`}
          >
            Advogados
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm tracking-wide transition-colors ${
                isTransparent
                  ? 'text-white/80 hover:text-white'
                  : 'text-landing-stone hover:text-landing-ink'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/contato"
            className="text-sm font-medium px-5 py-2.5 border transition-colors tracking-wide
              bg-landing-gold border-landing-gold text-white hover:bg-landing-gold-light"
          >
            Agendar reuniao inicial
          </Link>
          <Link
            href="/login"
            target="_blank"
            className={`text-sm font-medium px-5 py-2.5 border transition-colors tracking-wide ${
              isTransparent
                ? 'border-white/40 text-white hover:bg-white/10'
                : 'border-landing-ink text-landing-ink hover:bg-landing-ink hover:text-white'
            }`}
          >
            Portal do Cliente
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className={`md:hidden p-2 ${isTransparent ? 'text-white' : 'text-landing-ink'}`}
          aria-label="Menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-landing-ivory border-t border-landing-mist">
          <nav className="container mx-auto px-4 sm:px-6 py-6 flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-landing-ink text-base py-2 border-b border-landing-mist/50"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/contato"
              onClick={() => setMobileOpen(false)}
              className="text-center text-sm font-medium px-5 py-3 bg-landing-gold text-white mt-2"
            >
              Agendar reuniao inicial
            </Link>
            <Link
              href="/login"
              target="_blank"
              onClick={() => setMobileOpen(false)}
              className="text-center text-sm font-medium px-5 py-3 border border-landing-ink text-landing-ink"
            >
              Portal do Cliente
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
