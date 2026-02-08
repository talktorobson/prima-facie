'use client'

import { getIcon } from './icon-map'
import WebsiteScrollReveal from './website-scroll-reveal'
import type { WebsiteCredentials } from './types'

interface Props {
  data: WebsiteCredentials
}

export default function WebsiteCredentialsSection({ data }: Props) {
  return (
    <section className="py-24 bg-website-bg border-t border-website-mist">
      <div className="container mx-auto px-4 sm:px-6">
        <WebsiteScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-website-ink">
              {data.section_title}
            </h2>
          </div>
        </WebsiteScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {data.items.map((item, index) => {
            const Icon = getIcon(item.icon)
            return (
              <WebsiteScrollReveal key={item.label} delay={index * 100}>
                <div
                  className="bg-website-charcoal p-8 text-center hover:scale-105 hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-12 h-12 mx-auto mb-5 flex items-center justify-center">
                    <Icon className="h-7 w-7 text-website-accent" />
                  </div>
                  <div className="text-3xl md:text-4xl font-serif font-bold text-white mb-2">
                    {item.metric}
                  </div>
                  <div className="w-8 h-[1px] bg-website-accent mx-auto mb-3" />
                  <div className="text-xs uppercase tracking-[0.15em] text-gray-400">
                    {item.label}
                  </div>
                </div>
              </WebsiteScrollReveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
