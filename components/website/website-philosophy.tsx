import type { WebsitePhilosophy } from './types'

interface Props {
  data: WebsitePhilosophy
}

export default function WebsitePhilosophySection({ data }: Props) {
  return (
    <section className="py-24 bg-website-bg">
      <div className="container mx-auto px-6">
        {data.quote && (
          <div className="max-w-3xl mx-auto text-center mb-20">
            <blockquote className="text-2xl md:text-3xl lg:text-4xl font-serif font-semibold text-website-ink leading-snug italic">
              &ldquo;{data.quote}&rdquo;
            </blockquote>
            <div className="w-12 h-[2px] bg-website-accent mx-auto mt-8" />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto">
          {data.values.map((value) => (
            <div key={value.number} className="text-center md:text-left">
              <span className="text-4xl font-serif font-bold text-website-accent mb-4 block">
                {value.number}
              </span>
              <h3 className="text-xl font-serif font-semibold text-website-ink mb-3">
                {value.title}
              </h3>
              <p className="text-website-stone leading-relaxed">{value.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
