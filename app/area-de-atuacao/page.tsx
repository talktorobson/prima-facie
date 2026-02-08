import type { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, ArrowRight } from 'lucide-react'
import PublicPageShell from '@/components/landing/public-page-shell'
import ScrollReveal from '@/components/landing/scroll-reveal'

export const metadata: Metadata = {
  title: "Área de Atuação Geográfica | D'Avila Reis Advogados",
  description:
    'O escritório D\'Avila Reis Advogados atua a partir de Cerquilho/SP, no eixo Sorocaba-Campinas-Piracicaba, com cobertura estadual em São Paulo e nacional via correspondentes.',
}

const cities = [
  'Cerquilho',
  'Tatui',
  'Tiete',
  'Indaiatuba',
  'Itu',
  'Boituva',
  'Porto Feliz',
]

export default function AreaDeAtuacaoPage() {
  return (
    <PublicPageShell>
      <main>
        {/* Hero banner */}
        <section className="bg-landing-ivory py-20 border-b border-landing-mist">
          <div className="container mx-auto px-6 text-center">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-landing-ink mb-4">
              Area de Atuacao Geografica
            </h1>
            <div className="w-12 h-[2px] bg-landing-gold mx-auto" />
          </div>
        </section>

        {/* Main content */}
        <section className="py-20 bg-landing-ivory">
          <div className="container mx-auto px-6 max-w-4xl">
            <ScrollReveal>
              <div className="flex items-center gap-3 mb-8">
                <MapPin className="h-6 w-6 text-landing-gold flex-shrink-0" />
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-landing-ink">
                  Sede em Cerquilho/SP
                </h2>
              </div>
              <div className="w-12 h-[2px] bg-landing-gold mb-8" />
            </ScrollReveal>

            <ScrollReveal>
              <div className="space-y-6 mb-16">
                <p className="text-landing-stone leading-relaxed text-lg">
                  O escritório D&apos;Avila Reis Advogados está sediado em Cerquilho, no interior
                  de São Paulo, posicionado estrategicamente no eixo Sorocaba-Campinas-Piracicaba.
                  Essa localização permite atendimento agil e presencial a empresas e empresários
                  de uma das regiões mais dinâmicas do estado.
                </p>
                <p className="text-landing-stone leading-relaxed text-lg">
                  Nosso escritório está localizado na Av. Dr. Vinicio Gagliardi, 675, Centro,
                  Cerquilho/SP, com facil acesso pelas rodovias que conectam as principais cidades
                  da regiao.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Cities grid */}
        <section className="py-20 bg-landing-charcoal">
          <div className="container mx-auto px-6 max-w-4xl">
            <ScrollReveal>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-white text-center mb-4 gold-line mx-auto inline-block w-full">
                Cidades Atendidas
              </h2>
              <p className="text-gray-400 text-center mb-16 text-lg">
                Atendimento presencial e consultivo nas principais cidades do eixo
                Sorocaba-Campinas-Piracicaba
              </p>
            </ScrollReveal>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {cities.map((city, index) => (
                <ScrollReveal key={city} delay={`${index * 60}ms`}>
                  <div className="border border-white/10 p-6 text-center hover:-translate-y-1 transition-transform">
                    <MapPin className="h-5 w-5 text-landing-gold mx-auto mb-3" />
                    <p className="text-white font-medium">{city}</p>
                    <p className="text-xs text-gray-500 mt-1">SP</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* State-wide and national coverage */}
        <section className="py-20 bg-landing-ivory">
          <div className="container mx-auto px-6 max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <ScrollReveal>
                <div className="bg-white border border-landing-mist p-8">
                  <h3 className="text-xl font-serif font-semibold text-landing-ink mb-4">
                    Cobertura Estadual
                  </h3>
                  <p className="text-landing-stone leading-relaxed">
                    Alem do atendimento presencial na regiao de Cerquilho, o escritório atua em
                    todo o estado de São Paulo, com acompanhamento processual nas varas do
                    trabalho, tribunais regionais e instancias superiores. A inscricao dos socios
                    tambem em Minas Gerais e Parana amplia o alcance de atuacao direta.
                  </p>
                </div>
              </ScrollReveal>
              <ScrollReveal delay="100ms">
                <div className="bg-white border border-landing-mist p-8">
                  <h3 className="text-xl font-serif font-semibold text-landing-ink mb-4">
                    Atuação Nacional
                  </h3>
                  <p className="text-landing-stone leading-relaxed">
                    Para demandas em outros estados, o escritório conta com uma rede consolidada
                    de advogados correspondentes, garantindo representação em todo o território
                    nacional sem perda de qualidade ou controle sobre a estratégia processual.
                    A coordenacao centralizada assegura que cada caso seja tratado com o mesmo
                    padrao de excelencia.
                  </p>
                </div>
              </ScrollReveal>
            </div>

            <ScrollReveal delay="200ms">
              <div className="mt-8 bg-white border border-landing-mist p-8">
                <h3 className="text-xl font-serif font-semibold text-landing-ink mb-4">
                  Atuação Internacional
                </h3>
                <p className="text-landing-stone leading-relaxed">
                  Com a inscricao da Dra. Larissa D&apos;Avila Reis na Ordem dos Advogados de
                  Portugal, o escritório também atende demandas com dimensão transfronteiriça,
                  especialmente em questões empresariais e contratuais envolvendo Brasil e
                  Europa.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-landing-mist/40">
          <div className="container mx-auto px-6 text-center max-w-2xl">
            <ScrollReveal>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-landing-ink mb-4">
                Sua empresa está na nossa região?
              </h2>
              <p className="text-landing-stone mb-8">
                Entre em contato e agende uma conversa com nossos especialistas.
              </p>
              <Link
                href="/contato"
                className="inline-flex items-center gap-2 px-8 py-4 bg-landing-gold text-white text-sm font-medium tracking-wide hover:bg-landing-gold-light transition-colors"
              >
                Entrar em contato
                <ArrowRight className="h-4 w-4" />
              </Link>
            </ScrollReveal>
          </div>
        </section>
      </main>
    </PublicPageShell>
  )
}
