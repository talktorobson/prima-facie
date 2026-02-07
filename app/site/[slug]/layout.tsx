import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { WebsiteContent } from '@/types/website'
import type { Metadata } from 'next'

export const revalidate = 300

interface LayoutProps {
  children: React.ReactNode
  params: { slug: string }
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

  return {
    firm,
    content: content as unknown as WebsiteContent,
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const data = await getWebsiteData(params.slug)
  if (!data) return { title: 'Site nao encontrado' }

  const seo = data.content.seo || {}
  return {
    title: seo.title || data.firm.name,
    description: seo.description || '',
    openGraph: {
      title: seo.title || data.firm.name,
      description: seo.description || '',
      ...(seo.og_image_url ? { images: [{ url: seo.og_image_url }] } : {}),
    },
  }
}

export default async function SiteLayout({ children, params }: LayoutProps) {
  const data = await getWebsiteData(params.slug)
  if (!data) notFound()

  // Pass data to children via a wrapper that injects props
  // We use a data attribute approach since Next.js App Router doesn't have layout-to-page prop passing
  return (
    <div data-firm-slug={params.slug} data-firm-id={data.firm.id}>
      {children}
    </div>
  )
}
