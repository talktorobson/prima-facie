import Link from 'next/link'
import type { WebsiteHero } from './types'

interface Props {
  data: WebsiteHero
  slug: string
}

export default function WebsiteHeroSection({ data, slug }: Props) {
  const base = `/site/${slug}`

  function resolveHref(href: string) {
    if (href.startsWith('http') || href.startsWith('/login') || href.startsWith('/portal')) return href
    return `${base}${href}`
  }

  return (
    <section className="relative min-h-screen bg-website-bg">
      <div className="container mx-auto px-4 sm:px-6 pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[70vh]">
          {/* Left: text */}
          <div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-website-ink leading-[1.1] mb-6">
              {data.headline_lines.map((line, i) => (
                <span key={i} className={i > 0 ? 'block' : undefined}>{line} </span>
              ))}
              {data.headline_gold_lines.map((line, i) => (
                <span key={i} className="block text-website-accent">{line}</span>
              ))}
            </h1>

            <div className="w-16 h-[2px] bg-website-accent mb-8" />

            <p className="text-lg md:text-xl text-website-stone leading-relaxed max-w-lg mb-10">
              {data.subheadline}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
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
                  href={resolveHref(data.cta_secondary_href || '/contato')}
                  {...(data.cta_secondary_href?.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="inline-flex items-center justify-center px-8 py-4 border border-website-ink text-website-ink font-medium text-base tracking-wide hover:bg-website-ink hover:text-white transition-colors"
                >
                  {data.cta_secondary_text}
                </Link>
              )}
              {data.cta_tertiary_text && (
                <Link
                  href={resolveHref(data.cta_tertiary_href || '/login')}
                  className="inline-flex items-center justify-center px-8 py-4 text-website-ink font-medium text-base tracking-wide hover:text-website-accent transition-colors"
                >
                  {data.cta_tertiary_text}
                </Link>
              )}
            </div>

            {data.microcopy && (
              <p className="text-xs text-website-stone mt-4">{data.microcopy}</p>
            )}
          </div>

          {/* Right: office images */}
          <div className="hidden lg:block relative">
            {data.office_images && data.office_images.length > 0 ? (
              data.office_images.length === 1 ? (
                <div className="aspect-[3/4] relative overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={data.office_images[0]} alt="Escritorio" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-website-ink/10" />
                </div>
              ) : (
                <div className="grid gap-3" style={{ gridTemplateRows: data.office_images.length === 2 ? '1fr 1fr' : '1fr 1fr' }}>
                  <div className="aspect-[16/9] relative overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={data.office_images[0]} alt="Escritorio 1" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-website-ink/10" />
                  </div>
                  <div className={`grid gap-3 ${data.office_images.length === 3 ? 'grid-cols-2' : ''}`}>
                    {data.office_images.slice(1).map((img, i) => (
                      <div key={i} className="aspect-[16/9] relative overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img} alt={`Escritorio ${i + 2}`} className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-website-ink/10" />
                      </div>
                    ))}
                  </div>
                </div>
              )
            ) : (
              <div className="aspect-[3/4] relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.hero_image_url || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80&auto=format&fit=crop'}
                  alt="Escritorio"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-website-ink/10" />
              </div>
            )}
          </div>
        </div>

        {/* Stats row */}
        {data.stats.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-20 pt-12 border-t border-website-mist">
            {data.stats.map((stat) => (
              <div key={stat.label} className="text-center sm:text-left">
                <div className="text-4xl md:text-5xl font-serif font-bold text-website-ink mb-2">
                  {stat.number}
                </div>
                <div className="text-xs uppercase tracking-[0.2em] text-website-stone">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
