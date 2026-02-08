'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import type { WebsiteHeader } from './types'

interface Props {
  data: WebsiteHeader
  slug: string
  variant?: 'transparent' | 'solid'
}

export default function WebsiteHeaderSection({ data, slug, variant = 'solid' }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const isTransparent = variant === 'transparent'
  const base = `/site/${slug}`

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const showSolidBg = isTransparent && scrolled
  const textDark = !isTransparent || scrolled

  function resolveHref(href: string) {
    if (href.startsWith('http') || href.startsWith('/login') || href.startsWith('/portal')) return href
    return `${base}${href}`
  }

  return (
    <header
      className={`w-full z-40 transition-all duration-300 ${
        isTransparent
          ? `absolute top-0 left-0 right-0 ${showSolidBg ? 'bg-white/95 backdrop-blur-sm shadow-sm' : ''}`
          : 'sticky top-0 bg-website-bg border-b border-website-mist'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 py-5 flex justify-between items-center">
        <Link href={base} className="flex items-center gap-3">
          {data.logo_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={data.logo_url}
              alt={data.firm_name}
              className="h-10 md:h-12 w-auto object-contain"
            />
          ) : (
            <span
              className={`text-2xl md:text-3xl font-serif font-bold tracking-tight transition-colors duration-300 ${
                textDark ? 'text-website-ink' : 'text-white'
              }`}
            >
              {data.firm_name}
            </span>
          )}
          {data.firm_suffix && (
            <span
              className={`hidden sm:inline text-xs uppercase tracking-[0.2em] transition-colors duration-300 ${
                textDark ? 'text-website-stone' : 'text-white/60'
              }`}
            >
              {data.firm_suffix}
            </span>
          )}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {data.nav_links.map((link) => (
            <Link
              key={link.href}
              href={resolveHref(link.href)}
              className={`text-sm tracking-wide transition-colors duration-300 ${
                textDark
                  ? 'text-website-stone hover:text-website-ink'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
          {data.cta_text && (
            <Link
              href={resolveHref('/contato')}
              className="text-sm font-medium px-5 py-2.5 border transition-colors tracking-wide bg-website-accent border-website-accent text-white hover:opacity-90"
            >
              {data.cta_text}
            </Link>
          )}
          {data.cta_secondary_text && (
            <Link
              href={data.cta_secondary_href || '/login'}
              target="_blank"
              className={`text-sm font-medium px-5 py-2.5 border transition-colors duration-300 tracking-wide ${
                textDark
                  ? 'border-website-ink text-website-ink hover:bg-website-ink hover:text-white'
                  : 'border-white/40 text-white hover:bg-white/10'
              }`}
            >
              {data.cta_secondary_text}
            </Link>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className={`md:hidden p-2 transition-colors duration-300 ${textDark ? 'text-website-ink' : 'text-white'}`}
          aria-label="Menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-website-bg border-t border-website-mist">
          <nav role="navigation" aria-label="Menu principal" className="container mx-auto px-4 sm:px-6 py-6 flex flex-col gap-4">
            {data.nav_links.map((link) => (
              <Link
                key={link.href}
                href={resolveHref(link.href)}
                onClick={() => setMobileOpen(false)}
                className="text-website-ink text-base py-2 border-b border-website-mist/50"
              >
                {link.label}
              </Link>
            ))}
            {data.cta_text && (
              <Link
                href={resolveHref('/contato')}
                onClick={() => setMobileOpen(false)}
                className="text-center text-sm font-medium px-5 py-3 bg-website-accent text-white mt-2"
              >
                {data.cta_text}
              </Link>
            )}
            {data.cta_secondary_text && (
              <Link
                href={data.cta_secondary_href || '/login'}
                target="_blank"
                onClick={() => setMobileOpen(false)}
                className="text-center text-sm font-medium px-5 py-3 border border-website-ink text-website-ink"
              >
                {data.cta_secondary_text}
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
