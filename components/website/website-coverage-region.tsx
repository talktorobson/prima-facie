'use client'

import Link from 'next/link'
import { MapPin } from 'lucide-react'
import WebsiteScrollReveal from './website-scroll-reveal'
import type { WebsiteCoverageRegion } from './types'

interface Props {
  data: WebsiteCoverageRegion
  slug: string
}

export default function WebsiteCoverageRegionSection({ data, slug }: Props) {
  const base = `/site/${slug}`

  return (
    <section className="py-24 bg-website-bg">
      <div className="container mx-auto px-6">
        <WebsiteScrollReveal>
          <div className="max-w-3xl mx-auto text-center">
            <MapPin className="h-8 w-8 text-website-accent mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-website-ink mb-8">
              {data.title}
            </h2>
            <div className="w-12 h-[2px] bg-website-accent mx-auto mb-8" />
            {data.paragraphs.map((paragraph, i) => (
              <p
                key={i}
                className={`text-website-stone leading-relaxed ${
                  i === 0 ? 'text-lg mb-4' : 'mb-10'
                }`}
              >
                {paragraph}
              </p>
            ))}

            {/* Map placeholder */}
            {data.paragraphs[0] && (
              <div className="mt-8 max-w-lg mx-auto rounded-lg overflow-hidden border border-website-mist">
                <div className="h-48 bg-gradient-to-br from-website-accent/10 to-website-accent/5 flex items-center justify-center relative">
                  <MapPin className="h-12 w-12 text-website-accent/30" />
                  <div className="absolute bottom-4 left-4 right-4 text-left">
                    <p className="text-sm text-website-stone">{data.paragraphs[0]}</p>
                  </div>
                </div>
              </div>
            )}

            {data.paragraphs[0] && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.paragraphs[0])}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 text-sm text-website-accent hover:underline"
              >
                <MapPin className="h-4 w-4" />
                Como chegar
              </a>
            )}

            {data.cta_text && (
              <div className="mt-10">
                <Link
                  href={`${base}${data.cta_href || '/atuacao'}`}
                  className="inline-flex items-center justify-center px-8 py-4 border border-website-ink text-website-ink font-medium text-base tracking-wide hover:bg-website-ink hover:text-white transition-colors"
                >
                  {data.cta_text}
                </Link>
              </div>
            )}
          </div>
        </WebsiteScrollReveal>
      </div>
    </section>
  )
}
