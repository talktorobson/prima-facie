import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { WebsiteContent } from '@/types/website'
import WebsitePageShell from '@/components/website/website-page-shell'
import WebsiteCtaFinalSection from '@/components/website/website-cta-final'
import type { Metadata } from 'next'

export const revalidate = 300

interface PageProps {
  params: { slug: string }
}

async function getData(slug: string) {
  const supabase = createClient()
  const { data: firm } = await supabase
    .from('law_firms')
    .select('id, name, slug, website_published')
    .eq('slug', slug)
    .eq('website_published', true)
    .single()
  if (!firm) return null

  const { data: content } = await supabase
    .from('website_content')
    .select('*')
    .eq('law_firm_id', firm.id)
    .eq('is_published', true)
    .single()
  if (!content) return null

  return { firm, content: content as unknown as WebsiteContent }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const data = await getData(params.slug)
  if (!data) return { title: 'Equipe' }
  return {
    title: `Equipe - ${data.content.seo?.title || data.firm.name}`,
    description: `Conhea a equipe de ${data.firm.name}`,
  }
}

export default async function EquipePage({ params }: PageProps) {
  const data = await getData(params.slug)
  if (!data) notFound()

  const { content } = data
  const founders = content.founders

  return (
    <WebsitePageShell content={content} slug={params.slug}>
      <section className="pt-20 py-24 bg-website-bg">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-website-ink mb-4">
              {founders?.section_title || 'Nossa Equipe'}
            </h1>
            <div className="w-12 h-[2px] bg-website-accent mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {founders?.members?.map((member) => (
              <div
                key={member.name}
                className="border border-website-mist p-8 md:p-10 rounded text-center"
              >
                {member.photo_url && (
                  <div className="w-28 h-28 rounded-full overflow-hidden mx-auto mb-5 border-2 border-website-accent/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={member.photo_url} alt={member.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <h2 className="text-2xl font-serif font-bold text-website-ink mb-1">
                  {member.name}
                </h2>
                <p className="text-website-accent text-sm font-medium tracking-wide uppercase mb-2">
                  {member.title}
                </p>
                <p className="text-xs text-website-stone tracking-wide mb-6">
                  {member.oab}
                </p>
                <div className="w-10 h-[1px] bg-website-accent mx-auto mb-6" />
                <p className="text-website-stone leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <WebsiteCtaFinalSection data={content.cta_final} slug={params.slug} />
    </WebsitePageShell>
  )
}
