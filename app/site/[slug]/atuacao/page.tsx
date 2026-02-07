import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { WebsiteContent } from '@/types/website'
import WebsitePageShell from '@/components/website/website-page-shell'
import { getIcon } from '@/components/website/icon-map'
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
  if (!data) return { title: 'Areas de Atuacao' }
  return {
    title: `Areas de Atuacao - ${data.content.seo?.title || data.firm.name}`,
    description: data.content.seo?.description,
  }
}

export default async function AtuacaoPage({ params }: PageProps) {
  const data = await getData(params.slug)
  if (!data) notFound()

  const { content } = data
  const areas = content.practice_areas

  return (
    <WebsitePageShell content={content} slug={params.slug}>
      <section className="pt-20 py-24 bg-website-bg">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-website-ink mb-4">
              {areas?.section_title || 'Areas de Atuacao'}
            </h1>
            <div className="w-12 h-[2px] bg-website-accent mx-auto" />
          </div>

          <div className="space-y-8 max-w-4xl mx-auto">
            {areas?.items?.map((area) => {
              const Icon = getIcon(area.icon)
              return (
                <div
                  key={area.title}
                  className="border border-website-mist p-8 md:p-10 rounded"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-website-charcoal rounded">
                      <Icon className="h-6 w-6 text-website-accent" />
                    </div>
                    <h2 className="text-2xl font-serif font-semibold text-website-ink">
                      {area.title}
                    </h2>
                  </div>
                  <p className="text-website-stone leading-relaxed">{area.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>
      <WebsiteCtaFinalSection data={content.cta_final} slug={params.slug} />
    </WebsitePageShell>
  )
}
