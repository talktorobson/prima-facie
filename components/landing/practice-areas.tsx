import { Scale, Shield, FileText, Gavel, ArrowRight } from 'lucide-react'
import ScrollReveal from '@/components/landing/scroll-reveal'

const areas = [
  {
    icon: Scale,
    title: 'Direito Trabalhista Empresarial',
    description:
      'Defesa especializada em reclamacoes trabalhistas, auditorias preventivas e estrategias para reducao de passivos. Protecao do patrimonio pessoal dos socios.',
  },
  {
    icon: Shield,
    title: 'Consultoria Preventiva',
    description:
      'Analise de riscos juridicos, elaboracao de politicas internas, treinamento de equipes e compliance trabalhista para evitar litigios antes que acontecam.',
  },
  {
    icon: FileText,
    title: 'Compliance & Governanca',
    description:
      'Implementacao de programas de integridade, adequacao a LGPD, politicas anticorrupcao e governanca corporativa alinhada as melhores praticas do mercado.',
  },
  {
    icon: Gavel,
    title: 'Contencioso Estrategico',
    description:
      'Representacao judicial em causas complexas com foco em resultados. Estrategia processual personalizada para cada caso, da primeira instancia aos tribunais superiores.',
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
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
