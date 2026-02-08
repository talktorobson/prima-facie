import Link from 'next/link'
import ScrollReveal from '@/components/landing/scroll-reveal'

const founder = {
  name: 'Dra. Larissa D\'Avila Reis',
  title: 'Sócia Fundadora',
  oab: 'OAB/SP · OAB/MG · OAB/PR · Ordem dos Advogados de Portugal',
  bio: 'Sócia fundadora com inscrição ativa na OAB/SP, OAB/MG, OAB/PR e na Ordem dos Advogados de Portugal (OAP). Experiência em direito empresarial com dimensão transfronteiriça entre Brasil e Europa.',
}

export default function Founders() {
  return (
    <section className="py-24 bg-landing-charcoal">
      <div className="container mx-auto px-6">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white gold-line mx-auto inline-block">
              Quem Somos
            </h2>
          </div>
        </ScrollReveal>

        <div className="max-w-xl mx-auto">
          <ScrollReveal>
            <div className="border border-white/10 p-8 md:p-10">
              <h3 className="text-2xl font-serif font-bold text-white mb-1">
                {founder.name}
              </h3>
              <p className="text-landing-gold text-sm font-medium tracking-wide uppercase mb-2">
                {founder.title}
              </p>
              <p className="text-xs text-gray-500 tracking-wide mb-6">
                {founder.oab}
              </p>
              <div className="w-10 h-[1px] bg-landing-gold mb-6" />
              <p className="text-gray-400 leading-relaxed">
                {founder.bio}
              </p>
            </div>
          </ScrollReveal>
        </div>

        <ScrollReveal delay="300ms">
          <div className="text-center mt-14">
            <Link
              href="/equipe"
              className="inline-flex items-center justify-center px-8 py-4 border border-white/40 text-white font-medium text-base tracking-wide hover:bg-white/10 transition-colors"
            >
              Conhecer a equipe
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
