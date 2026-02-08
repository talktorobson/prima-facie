'use client'

import { useState } from 'react'
import { FileText, AlertTriangle, BookOpen, Newspaper, Calendar } from 'lucide-react'
import PublicPageShell from '@/components/landing/public-page-shell'
import ScrollReveal from '@/components/landing/scroll-reveal'
import { useArticles, type Article } from '@/lib/queries/useArticles'

const categories = [
  { key: undefined, label: 'Todos', icon: Newspaper },
  { key: 'alerta', label: 'Alertas', icon: AlertTriangle },
  { key: 'guia', label: 'Guias', icon: BookOpen },
  { key: 'artigo', label: 'Artigos', icon: FileText },
] as const

const categoryBadgeColors: Record<string, string> = {
  alerta: 'bg-red-100 text-red-800',
  guia: 'bg-blue-100 text-blue-800',
  artigo: 'bg-green-100 text-green-800',
}

const categoryLabels: Record<string, string> = {
  alerta: 'Alerta',
  guia: 'Guia',
  artigo: 'Artigo',
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(dateStr))
  } catch {
    return ''
  }
}

function ArticleCard({ article }: { article: Article }) {
  return (
    <div className="bg-white border border-landing-mist/60 p-6 flex flex-col h-full hover:border-landing-gold/40 transition-colors">
      <div className="flex items-center gap-3 mb-4">
        <span
          className={`inline-block px-2.5 py-0.5 text-xs font-medium ${categoryBadgeColors[article.category] || 'bg-gray-100 text-gray-800'
            }`}
        >
          {categoryLabels[article.category] || article.category}
        </span>
        {article.topic && (
          <span className="text-xs text-landing-stone capitalize">{article.topic}</span>
        )}
      </div>

      <h3 className="text-lg font-serif font-semibold text-landing-ink mb-2 line-clamp-2">
        {article.title}
      </h3>

      {article.excerpt && (
        <p className="text-sm text-landing-stone mb-4 line-clamp-3 flex-1">
          {article.excerpt}
        </p>
      )}

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-landing-mist/40">
        <div className="flex items-center gap-1.5 text-xs text-landing-stone">
          <Calendar className="h-3.5 w-3.5" />
          {formatDate(article.published_at)}
        </div>
        <span className="text-xs font-medium text-landing-gold hover:text-landing-gold-light transition-colors cursor-pointer">
          Ler mais
        </span>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <Newspaper className="h-12 w-12 text-landing-mist mx-auto mb-4" />
      <h3 className="text-lg font-serif font-semibold text-landing-ink mb-2">
        Nenhum conteudo encontrado
      </h3>
      <p className="text-sm text-landing-stone max-w-md mx-auto">
        Estamos preparando novos conteúdos para você. Volte em breve ou inscreva-se na nossa
        newsletter para ser notificado.
      </p>
    </div>
  )
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white border border-landing-mist/60 p-6 animate-pulse">
          <div className="flex gap-3 mb-4">
            <div className="h-5 w-16 bg-landing-mist rounded" />
            <div className="h-5 w-20 bg-landing-mist/50 rounded" />
          </div>
          <div className="h-6 w-3/4 bg-landing-mist rounded mb-2" />
          <div className="space-y-2 mb-4">
            <div className="h-4 w-full bg-landing-mist/50 rounded" />
            <div className="h-4 w-5/6 bg-landing-mist/50 rounded" />
          </div>
          <div className="h-4 w-24 bg-landing-mist/30 rounded" />
        </div>
      ))}
    </div>
  )
}

export default function ConteudosPage() {
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined)
  const { data: articles, isLoading, isError } = useArticles(
    activeCategory ? { category: activeCategory } : undefined
  )

  return (
    <PublicPageShell>
      <main>
        <section className="py-24 bg-landing-mist/40">
          <div className="container mx-auto px-6">
            <ScrollReveal>
              <div className="text-center mb-16">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-landing-ink gold-line mx-auto inline-block">
                  Conteudos
                </h1>
                <p className="text-landing-stone mt-8 text-lg max-w-2xl mx-auto">
                  Alertas jurídicos, guias práticos e artigos para manter sua empresa protegida e informada.
                </p>
              </div>
            </ScrollReveal>

            {/* Category filter tabs */}
            <ScrollReveal>
              <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
                {categories.map((cat) => {
                  const isActive = activeCategory === cat.key
                  return (
                    <button
                      key={cat.label}
                      onClick={() => setActiveCategory(cat.key)}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium border transition-colors ${isActive
                          ? 'border-landing-gold bg-landing-gold text-white'
                          : 'border-landing-mist text-landing-stone hover:border-landing-gold/50 hover:text-landing-ink'
                        }`}
                    >
                      <cat.icon className="h-4 w-4" />
                      {cat.label}
                    </button>
                  )
                })}
              </div>
            </ScrollReveal>

            {/* Articles grid */}
            {isLoading ? (
              <LoadingGrid />
            ) : isError || !articles || articles.length === 0 ? (
              <EmptyState />
            ) : (
              <ScrollReveal>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                  {articles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </ScrollReveal>
            )}

            {/* Newsletter CTA */}
            <ScrollReveal>
              <div className="mt-16 max-w-xl mx-auto text-center">
                <h3 className="text-lg font-serif font-semibold text-landing-ink mb-2">
                  Receba nossos conteúdos por e-mail
                </h3>
                <p className="text-sm text-landing-stone mb-6">
                  Inscreva-se e fique por dentro de alertas jurídicos e novidades.
                </p>
                <NewsletterForm />
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>
    </PublicPageShell>
  )
}

function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return

    setStatus('loading')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error || 'Erro ao inscrever')
      }

      setStatus('success')
      setMessage('Inscrição realizada com sucesso!')
      setEmail('')
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Erro inesperado. Tente novamente.')
    }
  }

  if (status === 'success') {
    return (
      <p className="text-sm text-green-700 bg-green-50 border border-green-200 p-3">
        {message}
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="seu@email.com"
        required
        className="flex-1 px-4 py-3 bg-white border border-landing-mist text-landing-ink placeholder:text-landing-stone/50 text-sm focus:outline-none focus:border-landing-gold transition-colors"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="px-6 py-3 bg-landing-gold text-white text-sm font-medium tracking-wide hover:bg-landing-gold-light transition-colors disabled:opacity-50"
      >
        {status === 'loading' ? 'Enviando...' : 'Inscrever'}
      </button>
      {status === 'error' && (
        <p className="text-xs text-red-600 mt-1">{message}</p>
      )}
    </form>
  )
}
