import Link from 'next/link'
import ScrollReveal from '@/components/landing/scroll-reveal'

export default function SaasHero() {
  return (
    <section className="relative min-h-screen bg-saas-bg saas-grid overflow-hidden flex items-center pt-20">
      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-saas-violet/10 blur-[120px] animate-glow-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-saas-cyan/8 blur-[100px] animate-glow-pulse pointer-events-none" style={{ animationDelay: '1.5s' }} />

      <div className="container mx-auto px-6 py-20 relative z-10">
        <ScrollReveal className="text-center max-w-4xl mx-auto">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-saas-border bg-saas-surface/50 mb-8">
            <span className="w-2 h-2 rounded-full bg-saas-cyan animate-glow-pulse" />
            <span className="text-xs font-mono text-saas-muted uppercase tracking-wider">
              Gestao Juridica Inteligente
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-display font-bold text-saas-heading leading-[1.1] mb-6">
            A plataforma que{' '}
            <span className="saas-gradient-text">transforma</span>{' '}
            escritorios de advocacia
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-saas-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            Gerencie processos, clientes, faturamento, documentos e equipe em um unico sistema.
            Construido com tecnologia moderna para escritorios brasileiros.
          </p>

          {/* Dual CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/register"
              className="px-8 py-4 rounded-lg bg-gradient-to-r from-saas-violet to-saas-cyan text-white font-medium text-base hover:opacity-90 transition-opacity"
            >
              Comecar Teste Gratuito
            </Link>
            <a
              href="#funcionalidades"
              className="px-8 py-4 rounded-lg border border-saas-border text-saas-text font-medium text-base hover:bg-saas-surface transition-colors"
            >
              Ver Funcionalidades
            </a>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap justify-center gap-8 text-sm font-mono text-saas-muted">
            <span>12 modulos</span>
            <span className="text-saas-border">|</span>
            <span>57 telas</span>
            <span className="text-saas-border">|</span>
            <span>100% brasileiro</span>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
