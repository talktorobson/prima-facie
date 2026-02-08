'use client'

import Link from 'next/link'
import { Linkedin, Instagram, Facebook, Twitter, Youtube, ArrowUp } from 'lucide-react'
import type { WebsiteFooter } from './types'
import WebsiteScrollReveal from './website-scroll-reveal'

const socialIcons: Record<string, React.FC<{ className?: string }>> = {
  linkedin: Linkedin,
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  youtube: Youtube,
}

interface Props {
  data: WebsiteFooter
  slug: string
}

export default function WebsiteFooterSection({ data, slug }: Props) {
  const base = `/site/${slug}`

  function resolveHref(href: string) {
    if (href.startsWith('http') || href.startsWith('/login') || href.startsWith('/portal')) return href
    return `${base}${href}`
  }

  return (
    <footer className="bg-website-ink text-white">
      <div className="h-[1px] bg-website-accent/30" />
      <div className="container mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-12">
          {/* Firm name + tagline */}
          <WebsiteScrollReveal>
            <div>
              <h3 className="text-2xl font-serif font-bold mb-3">{data.firm_name}</h3>
              <p className="text-sm text-gray-400 leading-relaxed max-w-xs">{data.tagline}</p>
            </div>
          </WebsiteScrollReveal>

          {/* Quick links */}
          <WebsiteScrollReveal delay={150}>
            <div>
              <h4 className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-5">
                Navegacao
              </h4>
              <ul className="space-y-3">
                {data.nav_links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={resolveHref(link.href)}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </WebsiteScrollReveal>

          {/* Contact info */}
          <WebsiteScrollReveal delay={300}>
            <div>
              <h4 className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-5">
                Contato
              </h4>
              <div className="space-y-3 text-sm text-gray-400">
                {data.contact_phone && <p>{data.contact_phone}</p>}
                {data.contact_email && <p>{data.contact_email}</p>}
                {data.contact_address && (
                  <p>
                    {data.contact_address.split('\n').map((line, i) => (
                      <span key={i}>
                        {line}
                        {i < data.contact_address.split('\n').length - 1 && <br />}
                      </span>
                    ))}
                  </p>
                )}
              </div>

              {/* Social links */}
              {data.social_links.length > 0 && (
                <div className="mt-6 flex gap-3">
                  {data.social_links.map((social) => {
                    const Icon = socialIcons[social.platform]
                    return (
                      <a
                        key={social.platform}
                        href={social.url}
                        aria-label={social.platform}
                        className="inline-flex items-center justify-center w-9 h-9 border border-gray-600 text-gray-400 hover:text-white hover:border-white transition-colors"
                      >
                        {Icon ? <Icon className="h-4 w-4" /> : <span className="text-xs">{social.platform}</span>}
                      </a>
                    )
                  })}
                </div>
              )}
            </div>
          </WebsiteScrollReveal>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">
            &copy; {data.copyright_text}
          </p>
          <div className="flex items-center gap-4">
            {data.legal_links.length > 0 && (
              <div className="flex items-center gap-4 text-xs text-gray-500">
                {data.legal_links.map((link, i) => (
                  <span key={link.href}>
                    {i > 0 && <span className="mr-4">|</span>}
                    <Link href={resolveHref(link.href)} className="hover:text-gray-300 transition-colors">
                      {link.label}
                    </Link>
                  </span>
                ))}
              </div>
            )}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors"
            >
              <ArrowUp className="h-3.5 w-3.5" />
              Voltar ao topo
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
