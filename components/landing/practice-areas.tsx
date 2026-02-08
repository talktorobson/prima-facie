import Link from 'next/link'
import { Scale, Shield, FileText, Gavel, ArrowRight } from 'lucide-react'
import ScrollReveal from '@/components/landing/scroll-reveal'

const areas = [
  {
    icon: Scale,
    title: 'Direito Trabalhista Empresarial (Patronal)',
    description:
      'Defesa completa do empregador em reclamações trabalhistas. Audiências, recursos, execução. Estratégia para reduzir passivo e proteger patrimônio dos sócios.',
  },
  {
    icon: Shield,
    title: 'Consultoria Preventiva Trabalhista',
    description:
      'Auditorias trabalhistas, elaboração de políticas internas, treinamento de gestores e adequação de contratos para evitar ações judiciais.',
  },
  {
    icon: FileText,
    title: 'Contratos Empresariais',
    description:
      'Elaboração, revisão e negociação de contratos comerciais, de prestação de serviços, societários e de locação. Proteção jurídica para operações do dia a dia.',
  },
  {
    icon: Gavel,
    title: 'Cobrança e Recuperação de Crédito',
    description:
      'Cobrança extrajudicial e judicial de títulos, duplicatas e contratos inadimplidos. Execuções fiscais e ações monitórias com foco em resultado.',
  },
]

export default function PracticeAreas() {
  return (
    <section id="servicos" className="py-24 bg-landing-charcoal">
      <div className="container mx-auto px-4 sm:px-6">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white gold-line mx-auto inline-block">
              Áreas de Atuação
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {areas.map((area, index) => (
            <ScrollReveal key={area.title} delay={`${index * 100}ms`}>
              <Link href="/atuacao" className="block">
                <div className="border border-white/10 p-8 md:p-10 hover:-translate-y-1 transition-transform group">
                  <div className="flex items-center gap-4 mb-6">
                    <area.icon className="h-6 w-6 text-landing-gold flex-shrink-0" />
                    <h3 className="text-xl md:text-2xl font-serif font-semibold text-white">
                      {area.title}
                    </h3>
                  </div>
                  <p className="text-gray-400 leading-relaxed mb-6">
                    {area.description}
                  </p>
                  <div className="flex items-center gap-2 text-landing-gold text-sm font-medium group-hover:gap-3 transition-all">
                    Saiba mais
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay="400ms">
          <div className="text-center mt-14">
            <Link
              href="/atuacao"
              className="inline-flex items-center justify-center px-8 py-4 bg-landing-gold text-white font-medium text-base tracking-wide hover:bg-landing-gold-light transition-colors"
            >
              Ver detalhes da atuação
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
