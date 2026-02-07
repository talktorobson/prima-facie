import ScrollReveal from '@/components/landing/scroll-reveal'

const founders = [
  {
    name: 'Dr. Ruy D\'Avila Reis',
    title: 'Socio Fundador',
    oab: 'OAB/SP',
    bio: 'Especialista em direito empresarial e trabalhista preventivo com mais de duas decadas de atuacao. Dedicado a protecao patrimonial de empresarios e a construcao de estrategias juridicas que antecipam riscos antes que se tornem litigios.',
  },
  {
    name: 'Dra. Larissa D\'Avila Reis',
    title: 'Socia Fundadora',
    oab: 'OAB/SP · OAB/MG · OAB/PR · Ordem dos Advogados de Portugal',
    bio: 'Advogada com atuacao multijurisdicional, inscrita em tres estados brasileiros e em Portugal. Sua experiencia internacional amplia a capacidade do escritorio em casos com dimensao transfronteiriça e operacoes empresariais entre Brasil e Europa.',
  },
]

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {founders.map((founder, index) => (
            <ScrollReveal key={founder.name} delay={`${index * 150}ms`}>
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
          ))}
        </div>
      </div>
    </section>
  )
}
