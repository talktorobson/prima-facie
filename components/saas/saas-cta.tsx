import Link from 'next/link'
import ScrollReveal from '@/components/landing/scroll-reveal'

export default function SaasCta() {
  return (
    <section className="relative bg-saas-bg py-24 overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-saas-violet/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-saas-cyan/8 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <ScrollReveal className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-saas-heading mb-4">
            Pronto para modernizar seu escritorio?
          </h2>
          <p className="text-saas-muted text-lg mb-8">
            Comece agora com 14 dias gratis. Sem cartao de credito.
          </p>
          <Link
            href="/register"
            className="inline-block px-10 py-4 rounded-lg bg-gradient-to-r from-saas-violet to-saas-cyan text-white font-medium text-base hover:opacity-90 transition-opacity"
          >
            Comecar Teste Gratuito
          </Link>
        </ScrollReveal>
      </div>
    </section>
  )
}
