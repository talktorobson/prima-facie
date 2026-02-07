import { getIcon } from './icon-map'
import type { WebsiteCredentials } from './types'

interface Props {
  data: WebsiteCredentials
}

export default function WebsiteCredentialsSection({ data }: Props) {
  return (
    <section className="py-24 bg-website-bg border-t border-website-mist">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-website-ink">
            {data.section_title}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {data.items.map((item) => {
            const Icon = getIcon(item.icon)
            return (
              <div
                key={item.label}
                className="bg-website-charcoal p-8 text-center hover:scale-[1.02] transition-transform"
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
            )
          })}
        </div>
      </div>
    </section>
  )
}
