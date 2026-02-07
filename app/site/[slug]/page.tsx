import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { WebsiteContent } from '@/types/website'

import WebsiteThemeProvider from '@/components/website/website-theme-provider'
import WebsiteTopbarSection from '@/components/website/website-topbar'
import WebsiteHeaderSection from '@/components/website/website-header'
import WebsiteHeroSection from '@/components/website/website-hero'
import WebsiteCredentialsSection from '@/components/website/website-credentials'
import WebsitePracticeAreasSection from '@/components/website/website-practice-areas'
import WebsitePhilosophySection from '@/components/website/website-philosophy'
import WebsiteMethodologySection from '@/components/website/website-methodology'
import WebsiteContentPreviewSection from '@/components/website/website-content-preview'
import WebsiteCoverageRegionSection from '@/components/website/website-coverage-region'
import WebsiteFoundersSection from '@/components/website/website-founders'
import WebsiteCtaFinalSection from '@/components/website/website-cta-final'
import WebsiteFooterSection from '@/components/website/website-footer'

export const revalidate = 300

interface PageProps {
  params: { slug: string }
}

const sectionComponents: Record<string, React.ComponentType<{ data: unknown; slug: string }>> = {
  hero: WebsiteHeroSection as unknown as React.ComponentType<{ data: unknown; slug: string }>,
  credentials: WebsiteCredentialsSection as unknown as React.ComponentType<{ data: unknown; slug: string }>,
  practice_areas: WebsitePracticeAreasSection as unknown as React.ComponentType<{ data: unknown; slug: string }>,
  philosophy: WebsitePhilosophySection as unknown as React.ComponentType<{ data: unknown; slug: string }>,
  methodology: WebsiteMethodologySection as unknown as React.ComponentType<{ data: unknown; slug: string }>,
  content_preview: WebsiteContentPreviewSection as unknown as React.ComponentType<{ data: unknown; slug: string }>,
  coverage_region: WebsiteCoverageRegionSection as unknown as React.ComponentType<{ data: unknown; slug: string }>,
  founders: WebsiteFoundersSection as unknown as React.ComponentType<{ data: unknown; slug: string }>,
  cta_final: WebsiteCtaFinalSection as unknown as React.ComponentType<{ data: unknown; slug: string }>,
}

async function getWebsiteData(slug: string) {
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

export default async function SiteHomePage({ params }: PageProps) {
  const data = await getWebsiteData(params.slug)
  if (!data) notFound()

  const { content } = data
  const slug = params.slug

  const visibleSections = (content.section_order || []).filter(
    (key: string) => !(content.hidden_sections || []).includes(key)
  )

  return (
    <WebsiteThemeProvider theme={content.theme}>
      {/* Topbar + Header rendered outside section_order since they're structural */}
      <WebsiteTopbarSection data={content.topbar} />
      <WebsiteHeaderSection data={content.header} slug={slug} variant="transparent" />

      {/* Dynamic sections in order */}
      {visibleSections.map((sectionKey: string) => {
        // Skip topbar/header/footer — handled separately
        if (['topbar', 'header', 'footer'].includes(sectionKey)) return null

        const Component = sectionComponents[sectionKey]
        if (!Component) return null

        const sectionData = content[sectionKey as keyof WebsiteContent]
        if (!sectionData || typeof sectionData !== 'object') return null

        return <Component key={sectionKey} data={sectionData} slug={slug} />
      })}

      <WebsiteFooterSection data={content.footer} slug={slug} />
    </WebsiteThemeProvider>
  )
}
