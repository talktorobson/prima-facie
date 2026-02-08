import Link from 'next/link'
import ScrollReveal from '@/components/landing/scroll-reveal'

const steps = [
  {
    number: '01',
    title: 'Triagem e direcionamento',
    description: 'Você preenche o formulário de contato. Avaliamos a demanda e identificamos a área jurídica adequada.',
  },
  {
    number: '02',
    title: 'Plano de ação',
    description: 'Reunião inicial para entender o caso em profundidade. Apresentamos estratégia, prazos e honorários.',
  },
  {
    number: '03',
    title: 'Execução e acompanhamento',
    description: 'Equipe dedicada conduz o caso com relatórios periódicos. Você acompanha tudo pelo Portal do Cliente.',
  },
]

export default function Methodology() {
  return (
    <section className="py-24 bg-landing-ivory">
      <div className="container mx-auto px-4 sm:px-6">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-landing-ink gold-line mx-auto inline-block">
              Método de trabalho
            </h2>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <ScrollReveal key={step.number} delay={`${index * 150}ms`}>
              <div className="text-center md:text-left">
                <span className="text-4xl font-serif font-bold text-landing-gold mb-4 block">
                  {step.number}
                </span>
                <h3 className="text-xl font-serif font-semibold text-landing-ink mb-3">
                  {step.title}
                </h3>
                <p className="text-landing-stone leading-relaxed">
                  {step.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay="300ms">
          <div className="text-center mt-14">
            <Link
              href="/contato"
              className="inline-flex items-center justify-center px-8 py-4 bg-landing-gold text-white font-medium text-base tracking-wide hover:bg-landing-gold-light transition-colors"
            >
              Solicitar triagem do caso
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
