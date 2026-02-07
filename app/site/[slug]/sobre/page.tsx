import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { WebsiteContent } from '@/types/website'
import WebsitePageShell from '@/components/website/website-page-shell'
import WebsiteFoundersSection from '@/components/website/website-founders'
import WebsitePhilosophySection from '@/components/website/website-philosophy'
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
  if (!data) return { title: 'Sobre' }
  return {
    title: `Sobre - ${data.content.seo?.title || data.firm.name}`,
    description: data.content.seo?.description,
  }
}

export default async function SobrePage({ params }: PageProps) {
  const data = await getData(params.slug)
  if (!data) notFound()

  const { content } = data

  return (
    <WebsitePageShell content={content} slug={params.slug}>
      <div className="pt-20">
        <WebsiteFoundersSection data={content.founders} slug={params.slug} />
        <WebsitePhilosophySection data={content.philosophy} />
        <WebsiteCtaFinalSection data={content.cta_final} slug={params.slug} />
      </div>
    </WebsitePageShell>
  )
}
