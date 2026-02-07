import Link from 'next/link'
import type { WebsiteFooter } from './types'

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
          <div>
            <h3 className="text-2xl font-serif font-bold mb-3">{data.firm_name}</h3>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">{data.tagline}</p>
          </div>

          {/* Quick links */}
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

          {/* Contact info */}
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
                {data.social_links.map((social) => (
                  <a
                    key={social.platform}
                    href={social.url}
                    aria-label={social.platform}
                    className="inline-flex items-center justify-center w-9 h-9 border border-gray-600 text-gray-400 hover:text-white hover:border-white transition-colors"
                  >
                    {social.platform === 'linkedin' && (
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                      </svg>
                    )}
                    {social.platform === 'instagram' && (
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                      </svg>
                    )}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">
            &copy; {data.copyright_text}
          </p>
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
        </div>
      </div>
    </footer>
  )
}
