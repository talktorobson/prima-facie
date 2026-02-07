import type { Metadata } from 'next'
import PublicPageShell from '@/components/landing/public-page-shell'
import ScrollReveal from '@/components/landing/scroll-reveal'

export const metadata: Metadata = {
  title: "Equipe | D'Avila Reis Advogados",
  description:
    'Conheca os socios fundadores do escritorio D\'Avila Reis Advogados: Dr. Ruy D\'Avila Reis e Dra. Larissa D\'Avila Reis, com atuacao em Sao Paulo, Minas Gerais, Parana e Portugal.',
}

const founders = [
  {
    initials: 'RDR',
    name: "Dr. Ruy D'Avila Reis",
    title: 'Socio Fundador',
    oab: 'OAB/SP',
    bio: [
      'Com mais de 20 anos de experiencia em direito trabalhista empresarial, o Dr. Ruy D\'Avila Reis e a forca motriz do escritorio. Sua trajetoria profissional foi construida na defesa de empresarios e empresas, com especial dedicacao ao contencioso trabalhista patronal e a blindagem patrimonial dos socios.',
      'Ao longo de sua carreira, atuou em milhares de reclamacoes trabalhistas, desenvolvendo teses defensivas inovadoras e construindo uma reputacao solida junto a Justica do Trabalho. Sua abordagem combina profundo conhecimento tecnico com visao estrategica do negocio do cliente, garantindo que as decisoes juridicas estejam alinhadas aos objetivos empresariais.',
      'Alem da atuacao contenciosa, o Dr. Ruy lidera os servicos de consultoria preventiva do escritorio, realizando auditorias trabalhistas e elaborando politicas internas que reduzem significativamente a exposicao das empresas a riscos juridicos.',
    ],
  },
  {
    initials: 'LDR',
    name: "Dra. Larissa D'Avila Reis",
    title: 'Socia Fundadora',
    oab: 'OAB/SP \u00b7 OAB/MG \u00b7 OAB/PR \u00b7 Ordem dos Advogados de Portugal',
    bio: [
      'A Dra. Larissa D\'Avila Reis traz ao escritorio uma dimensao unica: a atuacao multijurisdicional. Inscrita em tres estados brasileiros \u2014 Sao Paulo, Minas Gerais e Parana \u2014 e tambem na Ordem dos Advogados de Portugal, sua formacao permite ao escritorio atender demandas com alcance interestadual e transfronteirico.',
      'Sua experiencia internacional amplia a capacidade do escritorio em casos que envolvem operacoes empresariais entre Brasil e Europa, contratos internacionais e questoes trabalhistas com elementos de conexao em multiplas jurisdicoes. Essa versatilidade e especialmente valiosa para clientes com operacoes em diferentes estados ou com relacoes comerciais internacionais.',
      'A Dra. Larissa atua diretamente na area de contratos empresariais e na recuperacao de creditos, trazendo uma abordagem pragmatica e orientada a resultados que complementa a expertise contenciosa do escritorio.',
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
                  No D&apos;Avila Reis Advogados, acreditamos que a excelencia juridica nasce da
                  combinacao entre conhecimento tecnico aprofundado e compreensao genuina dos
                  desafios que nossos clientes enfrentam no dia a dia de seus negocios.
                </p>
                <p className="text-landing-stone leading-relaxed text-lg">
                  Nossa equipe opera com um modelo de atendimento proximo e personalizado, onde cada
                  cliente tem acesso direto aos socios responsaveis pelo seu caso. Nao acreditamos
                  em advocacia de volume — preferimos manter uma carteira de clientes que nos
                  permita oferecer atencao dedicada e estrategias sob medida.
                </p>
                <p className="text-landing-stone leading-relaxed text-lg">
                  A complementaridade entre os socios — a experiencia contenciosa do Dr. Ruy e a
                  atuacao multijurisdicional da Dra. Larissa — cria uma sinergia que permite ao
                  escritorio abordar cada desafio juridico sob multiplas perspectivas, entregando
                  solucoes mais completas e eficazes.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>
    </PublicPageShell>
  )
}
