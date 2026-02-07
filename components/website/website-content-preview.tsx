'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { WebsiteContentPreview } from './types'

interface Props {
  data: WebsiteContentPreview
  slug: string
}

export default function WebsiteContentPreviewSection({ data, slug }: Props) {
  const [email, setEmail] = useState('')
  const base = `/site/${slug}`

  return (
    <section className="py-24 bg-website-charcoal">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white">
            {data.section_title}
          </h2>
        </div>

        {/* Article cards */}
        {data.show_articles && data.articles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
            {data.articles.map((article) => (
              <div
                key={article.title}
                className="border border-white/10 p-8 hover:-translate-y-1 transition-transform group h-full flex flex-col"
              >
                <span className="inline-block text-xs uppercase tracking-[0.15em] text-website-accent font-medium mb-4">
                  {article.category}
                </span>
                <h3 className="text-lg font-serif font-semibold text-white mb-3 leading-snug">
                  {article.title}
                </h3>
                <p className="text-gray-400 leading-relaxed text-sm flex-1">
                  {article.excerpt}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Newsletter */}
        {data.newsletter_enabled && data.newsletter && (
          <div className="max-w-xl mx-auto text-center">
            <h3 className="text-xl font-serif font-semibold text-white mb-4">
              {data.newsletter.heading}
            </h3>
            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={data.newsletter.placeholder}
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:border-website-accent transition-colors"
              />
              <button
                type="button"
                className="px-6 py-3 bg-website-accent text-white font-medium text-sm tracking-wide hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                {data.newsletter.button_text}
              </button>
            </div>
            <p className="text-xs text-gray-500">{data.newsletter.disclaimer}</p>
          </div>
        )}

        {data.cta_text && (
          <div className="text-center mt-14">
            <Link
              href={`${base}${data.cta_href || '/conteudos'}`}
              className="inline-flex items-center justify-center px-8 py-4 border border-white/40 text-white font-medium text-base tracking-wide hover:bg-white/10 transition-colors"
            >
              {data.cta_text}
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
