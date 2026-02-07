import type { Metadata } from 'next'
import PublicPageShell from '@/components/landing/public-page-shell'
import ScrollReveal from '@/components/landing/scroll-reveal'

export const metadata: Metadata = {
  title: "Equipe | D'Avila Reis Advogados",
  description:
    'Conheca a sócia fundadora do escritório D\'Avila Reis Advogados: Dra. Larissa D\'Avila Reis, com atuação em São Paulo, Minas Gerais e Portugal.',
}

const founders = [
  {
    initials: 'LDR',
    name: "Dra. Larissa D'Avila Reis",
    title: 'Sócia Fundadora',
    oab: 'OAB/SP \u00b7 OAB/MG \u00b7 Ordem dos Advogados de Portugal',
    bio: [
      'A Dra. Larissa D\'Avila Reis traz ao escritório uma dimensão única: a atuação multijurisdicional. Mais de 12 anos de experiência jurídica (1500+ processos) e inscrita em 2 estados brasileiros \u2014 Sao Paulo e Minas Gerais \u2014 e tambem na Ordem dos Advogados de Portugal, sua formacao permite ao escritorio atender demandas com alcance interestadual e transfronteiriço.',
      'Sua experiência internacional amplia a capacidade do escritório em casos que envolvem operações empresariais entre Brasil e Europa, contratos internacionais e questões trabalhistas. Essa versatilidade e especialmente valiosa para clientes com operações em diferentes estados ou com relacoes comerciais internacionais.',
      'A Dra. Larissa atua diretamente na area trabalhista (preventivo e contencioso), na area de contratos empresariais e na recuperacao de creditos, trazendo uma abordagem pragmatica e orientada a resultados.',
    ],
  },
]

export default function EquipePage() {
  return (
    <PublicPageShell>
      <main>
        {/* Hero banner */}
        <section className="bg-landing-ivory py-20 border-b border-landing-mist">
          <div className="container mx-auto px-6 text-center">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-landing-ink mb-4">
              Nossa Equipe
            </h1>
            <div className="w-12 h-[2px] bg-landing-gold mx-auto mb-6" />
            <p className="text-landing-stone text-lg max-w-2xl mx-auto">
              Profissionais dedicados a protecao do seu patrimonio e dos seus negocios.
            </p>
          </div>
        </section>

        {/* Founders */}
        <section className="py-20 bg-landing-charcoal">
          <div className="container mx-auto px-6 max-w-5xl">
            <ScrollReveal>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-white text-center mb-16 gold-line mx-auto inline-block w-full">
                Socios Fundadores
              </h2>
            </ScrollReveal>

            <div className="space-y-12">
              {founders.map((founder, index) => (
                <ScrollReveal key={founder.name} delay={`${index * 150}ms`}>
                  <div className="border border-white/10 p-8 md:p-12">
                    <div className="flex flex-col md:flex-row gap-8 mb-8">
                      <div className="flex-shrink-0 text-center md:text-left">
                        <div className="w-24 h-24 bg-landing-ink rounded-full mx-auto md:mx-0 flex items-center justify-center">
                          <span className="text-white font-serif font-bold text-xl">
                            {founder.initials}
                          </span>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-2xl font-serif font-bold text-white mb-1">
                          {founder.name}
                        </h3>
                        <p className="text-landing-gold text-sm font-medium tracking-wide uppercase mb-2">
                          {founder.title}
                        </p>
                        <p className="text-xs text-gray-500 tracking-wide">{founder.oab}</p>
                      </div>
                    </div>

                    <div className="w-12 h-[1px] bg-landing-gold mb-8" />

                    <div className="space-y-4">
                      {founder.bio.map((paragraph, pIndex) => (
                        <p key={pIndex} className="text-gray-400 leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Team Philosophy */}
        <section className="py-20 bg-landing-ivory">
          <div className="container mx-auto px-6 max-w-3xl text-center">
            <ScrollReveal>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-landing-ink mb-6">
                Filosofia da Equipe
              </h2>
              <div className="w-12 h-[2px] bg-landing-gold mx-auto mb-12" />
            </ScrollReveal>

            <ScrollReveal delay="100ms">
              <div className="space-y-6 text-left">
                <p className="text-landing-stone leading-relaxed text-lg">
                  No D&apos;Avila Reis Advogados, acreditamos que a excelência jurídica nasce da
                  combinação entre conhecimento técnico aprofundado e compreensão genuina dos
                  desafios que nossos clientes enfrentam no dia a dia de seus negócios.
                </p>
                <p className="text-landing-stone leading-relaxed text-lg">
                  Nossa equipe opera com um modelo de atendimento próximo e personalizado, onde cada
                  cliente tem acesso direto à sócia responsável pelo seu caso. Não acreditamos
                  em advocacia de volume — preferimos manter uma carteira de clientes que nos
                  permita oferecer atenção dedicada e estratégias sob medida.
                </p>
                <p className="text-landing-stone leading-relaxed text-lg">
                  A complementaridade da equipe — a experiência contenciosa da Dra. Larissa — cria uma sinergia que permite ao
                  escritório abordar cada desafio jurídico sob multiplas perspectivas, entregando
                  soluções mais completas e eficazes.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>
    </PublicPageShell>
  )
}
