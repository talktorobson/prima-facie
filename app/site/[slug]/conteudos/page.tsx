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

  // Also fetch published articles for this firm
  const { data: articles } = await supabase
    .from('articles')
    .select('*')
    .eq('law_firm_id', firm.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return { firm, content: content as unknown as WebsiteContent, articles: articles || [] }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const data = await getData(params.slug)
  if (!data) return { title: 'Conteudos' }
  return {
    title: `Conteudos - ${data.content.seo?.title || data.firm.name}`,
    description: `Artigos e conteudos de ${data.firm.name}`,
  }
}

export default async function ConteudosPage({ params }: PageProps) {
  const data = await getData(params.slug)
  if (!data) notFound()

  const { content, articles } = data
  const preview = content.content_preview

  // Use DB articles if available, fallback to content_preview articles
  const displayArticles = articles.length > 0
    ? articles.map((a: Record<string, unknown>) => ({
        title: a.title as string,
        excerpt: (a.excerpt as string) || (a.content as string)?.substring(0, 200) || '',
        category: (a.category as string) || 'Geral',
      }))
    : preview?.articles || []

  return (
    <WebsitePageShell content={content} slug={params.slug}>
      <section className="pt-20 py-24 bg-website-bg">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-website-ink mb-4">
              {preview?.section_title || 'Conteudos'}
            </h1>
            <div className="w-12 h-[2px] bg-website-accent mx-auto" />
          </div>

          {displayArticles.length === 0 ? (
            <p className="text-center text-website-stone">Nenhum conteudo publicado ainda.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {displayArticles.map((article: { title: string; excerpt: string; category: string }) => (
                <div
                  key={article.title}
                  className="border border-website-mist p-8 rounded hover:-translate-y-1 transition-transform h-full flex flex-col"
                >
                  <span className="inline-block text-xs uppercase tracking-[0.15em] text-website-accent font-medium mb-4">
                    {article.category}
                  </span>
                  <h2 className="text-lg font-serif font-semibold text-website-ink mb-3 leading-snug">
                    {article.title}
                  </h2>
                  <p className="text-website-stone leading-relaxed text-sm flex-1">
                    {article.excerpt}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      <WebsiteCtaFinalSection data={content.cta_final} slug={params.slug} />
    </WebsitePageShell>
  )
}
