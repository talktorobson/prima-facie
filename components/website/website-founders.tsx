import Link from 'next/link'
import type { WebsiteFounders } from './types'

interface Props {
  data: WebsiteFounders
  slug: string
}

export default function WebsiteFoundersSection({ data, slug }: Props) {
  const base = `/site/${slug}`

  return (
    <section className="py-24 bg-website-charcoal">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white">
            {data.section_title}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {data.members.map((member) => (
            <div key={member.name} className="border border-white/10 p-8 md:p-10 text-center">
              {member.photo_url && (
                <div className="w-28 h-28 rounded-full overflow-hidden mx-auto mb-5 border-2 border-website-accent/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={member.photo_url} alt={member.name} className="w-full h-full object-cover" />
                </div>
              )}
              <h3 className="text-2xl font-serif font-bold text-white mb-1">
                {member.name}
              </h3>
              <p className="text-website-accent text-sm font-medium tracking-wide uppercase mb-2">
                {member.title}
              </p>
              <p className="text-xs text-gray-500 tracking-wide mb-6">{member.oab}</p>
              <div className="w-10 h-[1px] bg-website-accent mx-auto mb-6" />
              <p className="text-gray-400 leading-relaxed text-left">{member.bio}</p>
            </div>
          ))}
        </div>

        {data.cta_text && (
          <div className="text-center mt-14">
            <Link
              href={`${base}${data.cta_href || '/equipe'}`}
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
