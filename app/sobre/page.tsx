import type { Metadata } from 'next'
import PublicPageShell from '@/components/landing/public-page-shell'
import ScrollReveal from '@/components/landing/scroll-reveal'

export const metadata: Metadata = {
  title: "Sobre o Escritorio | D'Avila Reis Advogados",
  description:
    'Conheca o escritorio D\'Avila Reis Advogados: mais de 20 anos de experiencia em direito empresarial e trabalhista preventivo, protegendo empresarios em todo o Brasil.',
}

const values = [
  {
    number: '01',
    title: 'Etica e Transparencia',
    description:
      'Atuacao pautada na integridade profissional e na transparencia absoluta com nossos clientes. Cada decisao estrategica e compartilhada e justificada.',
  },
  {
    number: '02',
    title: 'Excelencia Tecnica',
    description:
      'Atualizacao constante e qualidade incomparavel nos servicos juridicos prestados. Investimos continuamente em formacao e especializacao.',
  },
  {
    number: '03',
    title: 'Compromisso com o Cliente',
    description:
      'Dedicacao total a protecao dos interesses e do patrimonio de cada cliente. Tratamos cada caso como se fosse o nosso proprio.',
  },
  {
    number: '04',
    title: 'Inovacao',
    description:
      'Uso de tecnologia de ponta para otimizar a pratica juridica e entregar resultados superiores. Ferramentas modernas a servico da advocacia tradicional.',
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
              Sobre o Escritorio
            </h1>
            <div className="w-12 h-[2px] bg-landing-gold mx-auto" />
          </div>
        </section>

        {/* Mission / Vision */}
        <section className="py-20 bg-landing-ivory">
          <div className="container mx-auto px-6 max-w-5xl">
            <ScrollReveal>
              <p className="text-lg md:text-xl text-landing-stone leading-relaxed max-w-3xl mx-auto text-center mb-16">
                O escritorio D&apos;Avila Reis Advogados atua ha mais de 20 anos na defesa de
                empresarios e empresas em todo o territorio nacional, com foco em direito empresarial
                e trabalhista preventivo. Nossa abordagem combina experiencia consolidada com
                ferramentas modernas para proteger o que nossos clientes construiram ao longo de
                suas trajetorias.
              </p>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <ScrollReveal>
                <div className="bg-white border border-landing-mist p-8">
                  <h3 className="text-xl font-serif font-semibold text-landing-ink mb-4">
                    Nossa Missao
                  </h3>
                  <p className="text-landing-stone leading-relaxed">
                    Proteger o patrimonio e os interesses de nossos clientes atraves de estrategias
                    juridicas preventivas e defesa especializada, garantindo seguranca e
                    tranquilidade para que possam focar no crescimento de seus negocios.
                  </p>
                </div>
              </ScrollReveal>
              <ScrollReveal delay="100ms">
                <div className="bg-white border border-landing-mist p-8">
                  <h3 className="text-xl font-serif font-semibold text-landing-ink mb-4">
                    Nossa Visao
                  </h3>
                  <p className="text-landing-stone leading-relaxed">
                    Ser referencia nacional em advocacia empresarial preventiva, reconhecidos pela
                    excelencia tecnica, inovacao tecnologica e relacionamento proximo com nossos
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
                Nossa Historia
              </h2>
              <div className="w-12 h-[2px] bg-landing-gold mx-auto mb-12" />
            </ScrollReveal>

            <ScrollReveal>
              <div className="max-w-3xl mx-auto space-y-6">
                <p className="text-landing-stone leading-relaxed text-lg">
                  Fundado em Cerquilho, no interior de Sao Paulo, o escritorio D&apos;Avila Reis
                  Advogados nasceu da vocacao de seus socios para a defesa de empresarios e
                  empresas. Desde sua criacao, o escritorio construiu uma trajetoria solida no eixo
                  Sorocaba-Campinas-Piracicaba, expandindo sua atuacao para todo o estado de Sao
                  Paulo e, posteriormente, para o territorio nacional.
                </p>
                <p className="text-landing-stone leading-relaxed text-lg">
                  Ao longo de mais de duas decadas, o escritorio consolidou-se como referencia em
                  direito trabalhista empresarial e consultoria preventiva, atendendo empresas de
                  diversos portes e segmentos. A combinacao entre experiencia pratica e visao
                  estrategica permitiu a construcao de relacionamentos duradouros com clientes que
                  confiam no escritorio para proteger seus negocios e seu patrimonio.
                </p>
                <p className="text-landing-stone leading-relaxed text-lg">
                  Hoje, com inscricao em multiplos estados brasileiros e em Portugal, o D&apos;Avila
                  Reis Advogados oferece uma atuacao ampla e multijurisdicional, sempre mantendo o
                  compromisso com a proximidade e o atendimento personalizado que marcam sua
                  historia.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay="100ms">
              <div className="mt-16 flex flex-col md:flex-row items-center gap-8 justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-landing-charcoal rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-white font-serif font-bold text-xl">RDR</span>
                  </div>
                  <h3 className="text-lg font-serif font-semibold text-landing-ink">
                    Dr. Ruy D&apos;Avila Reis
                  </h3>
                  <p className="text-landing-gold text-sm font-medium">Socio-Fundador</p>
                </div>
                <div className="text-center">
                  <div className="w-24 h-24 bg-landing-charcoal rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-white font-serif font-bold text-xl">LDR</span>
                  </div>
                  <h3 className="text-lg font-serif font-semibold text-landing-ink">
                    Dra. Larissa D&apos;Avila Reis
                  </h3>
                  <p className="text-landing-gold text-sm font-medium">Socia-Fundadora</p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>
    </PublicPageShell>
  )
}
