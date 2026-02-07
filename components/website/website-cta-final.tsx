import Link from 'next/link'
import type { WebsiteCtaFinal } from './types'

interface Props {
  data: WebsiteCtaFinal
  slug: string
}

export default function WebsiteCtaFinalSection({ data, slug }: Props) {
  const base = `/site/${slug}`

  function resolveHref(href: string) {
    if (href.startsWith('http') || href.startsWith('/login') || href.startsWith('/portal')) return href
    return `${base}${href}`
  }

  return (
    <section className="py-24 bg-website-ink">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white leading-tight mb-6">
            {data.headline}
          </h2>
          <div className="w-12 h-[2px] bg-website-accent mx-auto mb-8" />
          <p className="text-lg text-gray-400 leading-relaxed mb-10">{data.subtitle}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {data.cta_primary_text && (
              <Link
                href={resolveHref(data.cta_primary_href || '/contato')}
                className="inline-flex items-center justify-center px-8 py-4 bg-website-accent text-white font-medium text-base tracking-wide hover:opacity-90 transition-opacity"
              >
                {data.cta_primary_text}
              </Link>
            )}
            {data.cta_secondary_text && (
              <Link
                href={resolveHref(data.cta_secondary_href || '/login')}
                target="_blank"
                className="inline-flex items-center justify-center px-8 py-4 border border-white/40 text-white font-medium text-base tracking-wide hover:bg-white/10 transition-colors"
              >
                {data.cta_secondary_text}
              </Link>
            )}
          </div>
          {data.disclaimer && (
            <p className="text-xs text-gray-500 mt-6">{data.disclaimer}</p>
          )}
        </div>
      </div>
    </section>
  )
}
