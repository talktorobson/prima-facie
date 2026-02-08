'use client'

import Link from 'next/link'
import type { WebsiteMethodology } from './types'
import WebsiteScrollReveal from './website-scroll-reveal'

interface Props {
  data: WebsiteMethodology
  slug: string
}

export default function WebsiteMethodologySection({ data, slug }: Props) {
  const base = `/site/${slug}`

  return (
    <section className="py-24 bg-website-bg">
      <div className="container mx-auto px-4 sm:px-6">
        <WebsiteScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-website-ink">
              {data.section_title}
            </h2>
          </div>
        </WebsiteScrollReveal>

        {/* Mobile: grid layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 max-w-5xl mx-auto md:hidden">
          {data.steps.map((step, index) => (
            <WebsiteScrollReveal key={step.number} delay={index * 150}>
              <div className="text-center">
                <span className="text-4xl font-serif font-bold text-website-accent mb-4 block">
                  {step.number}
                </span>
                <h3 className="text-xl font-serif font-semibold text-website-ink mb-3">
                  {step.title}
                </h3>
                <p className="text-website-stone leading-relaxed">{step.description}</p>
              </div>
            </WebsiteScrollReveal>
          ))}
        </div>

        {/* Desktop: timeline layout */}
        <div className="hidden md:block max-w-3xl mx-auto">
          <div className="relative pl-16 before:absolute before:left-6 before:top-0 before:h-full before:w-0.5 before:bg-website-accent/20">
            {data.steps.map((step, index) => (
              <WebsiteScrollReveal key={step.number} delay={index * 150}>
                <div className="relative mb-12 last:mb-0">
                  <div className="absolute -left-16 top-0 w-12 h-12 rounded-full bg-website-accent/10 flex items-center justify-center hover:bg-website-accent/20 transition-colors">
                    <span className="text-lg font-serif font-bold text-website-accent">{step.number}</span>
                  </div>
                  <h3 className="text-xl font-serif font-semibold text-website-ink mb-3">
                    {step.title}
                  </h3>
                  <p className="text-website-stone leading-relaxed">{step.description}</p>
                </div>
              </WebsiteScrollReveal>
            ))}
          </div>
        </div>

        {data.cta_text && (
          <WebsiteScrollReveal delay={data.steps.length * 150}>
            <div className="text-center mt-14">
              <Link
                href={`${base}${data.cta_href || '/contato'}`}
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
