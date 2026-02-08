import Link from 'next/link'
import ScrollReveal from '@/components/landing/scroll-reveal'

export default function CtaFinal() {
  return (
    <section className="py-24 bg-landing-ink">
      <div className="container mx-auto px-6">
        <ScrollReveal>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white leading-tight mb-6">
              Você representa uma empresa e precisa de apoio jurídico?
            </h2>
            <div className="w-12 h-[2px] bg-landing-gold mx-auto mb-8" />
            <p className="text-lg text-gray-400 leading-relaxed mb-10">
              Envie as informações essenciais para triagem.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contato"
                className="inline-flex items-center justify-center px-8 py-4 bg-landing-gold text-white font-medium text-base tracking-wide hover:bg-landing-gold-light transition-colors"
              >
                Solicitar contato (sou empresa)
              </Link>
              <Link
                href="/login"
                target="_blank"
                className="inline-flex items-center justify-center px-8 py-4 border border-white/40 text-white font-medium text-base tracking-wide hover:bg-white/10 transition-colors"
              >
                Portal do Cliente
              </Link>
            </div>
            <p className="text-xs text-gray-500 mt-6">
              Responderemos em até 24 horas úteis (triagem).
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
