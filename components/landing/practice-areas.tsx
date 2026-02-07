import Link from 'next/link'
import { Scale, Shield, FileText, Gavel, ArrowRight } from 'lucide-react'
import ScrollReveal from '@/components/landing/scroll-reveal'

const areas = [
  {
    icon: Scale,
    title: 'Direito Trabalhista Empresarial (Patronal)',
    description:
      'Defesa completa do empregador em reclamacoes trabalhistas. Audiencias, recursos, execucao. Estrategia para reduzir passivo e proteger patrimonio dos socios.',
  },
  {
    icon: Shield,
    title: 'Consultoria Preventiva Trabalhista',
    description:
      'Auditorias trabalhistas, elaboracao de politicas internas, treinamento de gestores e adequacao de contratos para evitar acoes judiciais.',
  },
  {
    icon: FileText,
    title: 'Contratos Empresariais',
    description:
      'Elaboracao, revisao e negociacao de contratos comerciais, de prestacao de servicos, societarios e de locacao. Protecao juridica para operacoes do dia a dia.',
  },
  {
    icon: Gavel,
    title: 'Cobranca e Recuperacao de Credito',
    description:
      'Cobranca extrajudicial e judicial de titulos, duplicatas e contratos inadimplidos. Execucoes fiscais e acoes monitorias com foco em resultado.',
  },
]

export default function PracticeAreas() {
  return (
    <section id="servicos" className="py-24 bg-landing-charcoal">
      <div className="container mx-auto px-6">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-white gold-line mx-auto inline-block">
              Areas de Atuacao
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
              Ver detalhes da atuacao
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
