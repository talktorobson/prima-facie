import type { Metadata } from 'next'
import PublicPageShell from '@/components/landing/public-page-shell'
import ScrollReveal from '@/components/landing/scroll-reveal'

export const metadata: Metadata = {
  title: "Sobre o Escritório | D'Avila Reis Advogados",
  description:
    'Conheça o escritório D\'Avila Reis Advogados: mais de 20 anos de experiência em direito empresarial e trabalhista preventivo, protegendo empresários em todo o Brasil.',
}

const values = [
  {
    number: '01',
    title: 'Ética e Transparência',
    description:
      'Atuação pautada na integridade profissional e na transparência absoluta com nossos clientes. Cada decisão estratégica é compartilhada e justificada.',
  },
  {
    number: '02',
    title: 'Excelência Técnica',
    description:
      'Atualização constante e qualidade incomparável nos serviços jurídicos prestados. Investimos continuamente em formação e especialização.',
  },
  {
    number: '03',
    title: 'Compromisso com o Cliente',
    description:
      'Dedicação total à proteção dos interesses e do patrimônio de cada cliente. Tratamos cada caso como se fosse o nosso próprio.',
  },
  {
    number: '04',
    title: 'Inovação',
    description:
      'Uso de tecnologia de ponta para otimizar a prática jurídica e entregar resultados superiores. Ferramentas modernas a serviço da advocacia tradicional.',
  },
]

export default function SobrePage() {
  return (
    <PublicPageShell>
      <main>
        {/* Hero banner */}
        <section className="bg-landing-ivory py-20 border-b border-landing-mist">
          <div className="container mx-auto px-6 text-center">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-landing-ink mb-4">
              Sobre o Escritório
            </h1>
            <div className="w-12 h-[2px] bg-landing-gold mx-auto" />
          </div>
        </section>

        {/* Mission / Vision */}
        <section className="py-20 bg-landing-ivory">
          <div className="container mx-auto px-6 max-w-5xl">
            <ScrollReveal>
              <p className="text-lg md:text-xl text-landing-stone leading-relaxed max-w-3xl mx-auto text-center mb-16">
                O escritório D&apos;Avila Reis Advogados atua há mais de 20 anos na defesa de
                empresários e empresas em todo o território nacional, com foco em direito empresarial
                e trabalhista preventivo. Nossa abordagem combina experiência consolidada com
                ferramentas modernas para proteger o que nossos clientes construíram ao longo de
                suas trajetórias.
              </p>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <ScrollReveal>
                <div className="bg-white border border-landing-mist p-8">
                  <h3 className="text-xl font-serif font-semibold text-landing-ink mb-4">
                    Nossa Missão
                  </h3>
                  <p className="text-landing-stone leading-relaxed">
                    Proteger o patrimônio e os interesses de nossos clientes através de estratégias
                    jurídicas preventivas e defesa especializada, garantindo segurança e
                    tranquilidade para que possam focar no crescimento de seus negócios.
                  </p>
                </div>
              </ScrollReveal>
              <ScrollReveal delay="100ms">
                <div className="bg-white border border-landing-mist p-8">
                  <h3 className="text-xl font-serif font-semibold text-landing-ink mb-4">
                    Nossa Visão
                  </h3>
                  <p className="text-landing-stone leading-relaxed">
                    Ser referência nacional em advocacia empresarial preventiva, reconhecidos pela
                    excelência técnica, inovação tecnológica e relacionamento próximo com nossos
                    clientes.
                  </p>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 bg-landing-charcoal">
          <div className="container mx-auto px-6 max-w-5xl">
            <ScrollReveal>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-white text-center mb-16 gold-line mx-auto inline-block w-full">
                Nossos Valores
              </h2>
            </ScrollReveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {values.map((value, index) => (
                <ScrollReveal key={value.number} delay={`${index * 100}ms`}>
                  <div className="flex gap-5">
                    <span className="text-3xl font-serif font-bold text-landing-gold flex-shrink-0">
                      {value.number}
                    </span>
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">{value.title}</h4>
                      <p className="text-gray-400 leading-relaxed">{value.description}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* History / Founder */}
        <section className="py-20 bg-landing-ivory">
          <div className="container mx-auto px-6 max-w-4xl">
            <ScrollReveal>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-landing-ink text-center mb-6">
                Nossa História
              </h2>
              <div className="w-12 h-[2px] bg-landing-gold mx-auto mb-12" />
            </ScrollReveal>

            <ScrollReveal>
              <div className="max-w-3xl mx-auto space-y-6">
                <p className="text-landing-stone leading-relaxed text-lg">
                  Fundado em Cerquilho, no interior de São Paulo, o escritório D&apos;Avila Reis
                  Advogados nasceu da vocação de seus sócios para a defesa de empresários e
                  empresas. Desde sua criação, o escritório construiu uma trajetória sólida no eixo
                  Sorocaba-Campinas-Piracicaba, expandindo sua atuação para todo o estado de São
                  Paulo e, posteriormente, para o território nacional.
                </p>
                <p className="text-landing-stone leading-relaxed text-lg">
                  Ao longo de mais de duas décadas, o escritório consolidou-se como referência em
                  direito trabalhista empresarial e consultoria preventiva, atendendo empresas de
                  diversos portes e segmentos. A combinação entre experiência prática e visão
                  estratégica permitiu a construção de relacionamentos duradouros com clientes que
                  confiam no escritório para proteger seus negócios e seu patrimônio.
                </p>
                <p className="text-landing-stone leading-relaxed text-lg">
                  Hoje, com inscrição em múltiplos estados brasileiros e em Portugal, o D&apos;Avila
                  Reis Advogados oferece uma atuação ampla e multijurisdicional, sempre mantendo o
                  compromisso com a proximidade e o atendimento personalizado que marcam sua
                  história.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay="100ms">
              <div className="mt-16 flex justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-landing-charcoal rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-white font-serif font-bold text-xl">LDR</span>
                  </div>
                  <h3 className="text-lg font-serif font-semibold text-landing-ink">
                    Dra. Larissa D&apos;Avila Reis
                  </h3>
                  <p className="text-landing-gold text-sm font-medium">Sócia Fundadora</p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>
    </PublicPageShell>
  )
}
