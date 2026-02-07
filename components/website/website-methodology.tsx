import Link from 'next/link'
import type { WebsiteMethodology } from './types'

interface Props {
  data: WebsiteMethodology
  slug: string
}

export default function WebsiteMethodologySection({ data, slug }: Props) {
  const base = `/site/${slug}`

  return (
    <section className="py-24 bg-website-bg">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-website-ink">
            {data.section_title}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 max-w-5xl mx-auto">
          {data.steps.map((step) => (
            <div key={step.number} className="text-center md:text-left">
              <span className="text-4xl font-serif font-bold text-website-accent mb-4 block">
                {step.number}
              </span>
              <h3 className="text-xl font-serif font-semibold text-website-ink mb-3">
                {step.title}
              </h3>
              <p className="text-website-stone leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>

        {data.cta_text && (
          <div className="text-center mt-14">
            <Link
              href={`${base}${data.cta_href || '/contato'}`}
              className="inline-flex items-center justify-center px-8 py-4 bg-website-accent text-white font-medium text-base tracking-wide hover:opacity-90 transition-opacity"
            >
              {data.cta_text}
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
