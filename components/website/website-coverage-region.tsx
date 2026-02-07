import Link from 'next/link'
import { MapPin } from 'lucide-react'
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
          {data.cta_text && (
            <Link
              href={`${base}${data.cta_href || '/atuacao'}`}
              className="inline-flex items-center justify-center px-8 py-4 border border-website-ink text-website-ink font-medium text-base tracking-wide hover:bg-website-ink hover:text-white transition-colors"
            >
              {data.cta_text}
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
