'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getIcon } from './icon-map'
import WebsiteScrollReveal from './website-scroll-reveal'
import type { WebsitePracticeAreas } from './types'

interface Props {
  data: WebsitePracticeAreas
  slug: string
}

export default function WebsitePracticeAreasSection({ data, slug }: Props) {
  const base = `/site/${slug}`

  return (
    <section className="py-24 bg-website-charcoal">
      <div className="container mx-auto px-4 sm:px-6">
        <WebsiteScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white">
              {data.section_title}
            </h2>
          </div>
        </WebsiteScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {data.items.map((area, index) => {
            const Icon = getIcon(area.icon)
            return (
              <WebsiteScrollReveal key={area.title} delay={index * 100}>
                <Link href={`${base}/atuacao`} className="block">
                  <div className="border border-white/10 p-8 md:p-10 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 group">
                    <div className="flex items-center gap-4 mb-6">
                      <Icon className="h-6 w-6 text-website-accent flex-shrink-0" />
                      <h3 className="text-xl md:text-2xl font-serif font-semibold text-white">
                        {area.title}
                      </h3>
                    </div>
                    <p className="text-gray-400 leading-relaxed mb-6">{area.description}</p>
                    <div className="flex items-center gap-2 text-website-accent text-sm font-medium group-hover:gap-3 transition-all">
                      Saiba mais
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              </WebsiteScrollReveal>
            )
          })}
        </div>

        {data.cta_text && (
          <WebsiteScrollReveal delay={400}>
            <div className="text-center mt-14">
              <Link
                href={`${base}${data.cta_href || '/atuacao'}`}
                className="inline-flex items-center justify-center px-8 py-4 bg-website-accent text-white font-medium text-base tracking-wide hover:opacity-90 transition-opacity"
              >
                {data.cta_text}
              </Link>
            </div>
          </WebsiteScrollReveal>
        )}
      </div>
    </section>
  )
}
