import PublicPageShell from '@/components/landing/public-page-shell'
import ScrollReveal from '@/components/landing/scroll-reveal'

const values = [
  {
    number: '01',
    title: 'Etica e Transparencia',
    description:
      'Atuacao pautada na integridade profissional e na transparencia absoluta com nossos clientes.',
  },
  {
    number: '02',
    title: 'Excelencia Tecnica',
    description:
      'Atualizacao constante e qualidade incomparavel nos servicos juridicos prestados.',
  },
  {
    number: '03',
    title: 'Inovacao',
    description:
      'Uso de tecnologia de ponta para otimizar a pratica juridica e entregar resultados superiores.',
  },
  {
    number: '04',
    title: 'Compromisso com o Cliente',
    description:
      'Dedicacao total a protecao dos interesses e do patrimonio de cada cliente.',
  },
]

export default function AboutPage() {
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
                e trabalhista preventivo.
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
                    juridicas preventivas e defesa especializada, garantindo seguranca e tranquilidade
                    para que possam focar no crescimento de seus negocios.
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

        {/* Founder */}
        <section className="py-20 bg-landing-ivory">
          <div className="container mx-auto px-6 max-w-3xl">
            <ScrollReveal>
              <div className="text-center">
                <div className="w-24 h-24 bg-landing-charcoal rounded-full mx-auto mb-6 flex items-center justify-center">
                  <span className="text-white font-serif font-bold text-xl">DR</span>
                </div>
                <h3 className="text-2xl font-serif font-semibold text-landing-ink mb-2">
                  Dr. D&apos;Avila Reis
                </h3>
                <p className="text-landing-gold font-medium mb-4">Socio-Fundador</p>
                <p className="text-landing-stone leading-relaxed max-w-lg mx-auto">
                  Mais de 20 anos de experiencia em direito trabalhista empresarial. Especialista em
                  defesa de empresarios e blindagem patrimonial, com atuacao em todo o territorio
                  nacional.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>
    </PublicPageShell>
  )
}
