'use client'

import type { WebsitePhilosophy } from './types'
import WebsiteScrollReveal from './website-scroll-reveal'

interface Props {
  data: WebsitePhilosophy
}

export default function WebsitePhilosophySection({ data }: Props) {
  return (
    <section className="py-24 bg-website-bg">
      <div className="container mx-auto px-6">
        {data.quote && (
          <WebsiteScrollReveal>
            <div className="max-w-3xl mx-auto text-center mb-20">
              <blockquote className="text-2xl md:text-3xl lg:text-4xl font-serif font-semibold text-website-ink leading-snug italic">
                <span className="text-6xl md:text-8xl font-serif text-website-accent/20 leading-none block -mb-8">&ldquo;</span>
                {data.quote}
                <span className="text-6xl md:text-8xl font-serif text-website-accent/20 leading-none block -mt-8 text-right">&rdquo;</span>
              </blockquote>
              <div className="w-12 h-[2px] bg-website-accent mx-auto mt-8" />
            </div>
          </WebsiteScrollReveal>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto">
          {data.values.map((value, index) => (
            <WebsiteScrollReveal key={value.number} delay={index * 150}>
              <div className="text-center md:text-left">
                <span className="text-4xl font-serif font-bold text-website-accent mb-4 block">
                  {value.number}
                </span>
                <h3 className="text-xl font-serif font-semibold text-website-ink mb-3">
                  {value.title}
                </h3>
                <p className="text-website-stone leading-relaxed">{value.description}</p>
              </div>
            </WebsiteScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
