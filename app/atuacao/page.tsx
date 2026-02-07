import type { Metadata } from 'next'
import Link from 'next/link'
import { Scale, Shield, FileText, Banknote, ArrowRight } from 'lucide-react'
import PublicPageShell from '@/components/landing/public-page-shell'
import ScrollReveal from '@/components/landing/scroll-reveal'

export const metadata: Metadata = {
  title: "Áreas de Atuação | D'Avila Reis Advogados",
  description:
    'Direito trabalhista empresarial, consultoria preventiva, contratos empresariais e cobrança de créditos. Conheca as áreas de atuação do escritório D\'Avila Reis.',
}

const areas = [
  {
    icon: Scale,
    title: 'Direito Trabalhista Empresarial (Patronal)',
    paragraphs: [
      'O escritório D\'Avila Reis Advogados é referência na defesa do empregador em todas as fases do processo trabalhista. Atuamos desde a fase inicial de reclamações trabalhistas, passando por audiências, recursos ordinários e de revista, até a fase de execução, sempre com estratégia processual personalizada para cada caso.',
      'Nossa equipe possui ampla experiência em blindagem patrimonial dos sócios, protegendo o patrimônio pessoal de empresários contra desconsiderações da personalidade jurídica e redirecionamentos de execução. Desenvolvemos teses defensivas solidas e atuamos com agilidade para reverter decisões desfavoráveis.',
      'Além da atuação contenciosa, realizamos a gestão completa do passivo trabalhista da empresa, elaborando relatórios de risco, acompanhando prazos processuais e orientando a tomada de decisão com base em dados concretos e jurimetria.',
    ],
    bg: 'bg-landing-ivory',
    textColor: 'text-landing-ink',
    descColor: 'text-landing-stone',
    iconColor: 'text-landing-gold',
    lineColor: 'bg-landing-gold',
  },
  {
    icon: Shield,
    title: 'Consultoria Preventiva Trabalhista',
    paragraphs: [
      'A melhor forma de vencer um litígio e evitar-lo. Nossa consultoria preventiva trabalhista atua diretamente na identificação e correção de vulnerabilidades jurídicas antes que se transformem em processos. Realizamos auditorias trabalhistas completas, analisando contratos, folha de pagamento, jornada, benefícios e rotinas de RH.',
      'Elaboramos e revisamos políticas internas, regulamentos empresariais, códigos de conduta e manuais de procedimentos, garantindo que a empresa esteja em conformidade com a legislação vigente e as convencões coletivas aplicáveis. Nosso trabalho de compliance trabalhista reduz significativamente a exposição a riscos.',
      'Oferecemos também treinamento de gestores e líderes, capacitando-os para tomar decisões no dia a dia que estejam alinhadas com as melhores praticas jurídicas, evitando situações que possam gerar passivos trabalhistas futuros.',
    ],
    bg: 'bg-landing-charcoal',
    textColor: 'text-white',
    descColor: 'text-gray-400',
    iconColor: 'text-landing-gold',
    lineColor: 'bg-landing-gold',
  },
  {
    icon: FileText,
    title: 'Contratos Empresariais',
    paragraphs: [
      'A segurança jurídica de uma empresa começa pela qualidade de seus contratos. O escritório D\'Avila Reis Advogados atua na elaboração, revisão e negociação de contratos comerciais, societários e de prestação de serviços, garantindo que cada cláusula proteja adequadamente os interesses de nossos clientes.',
      'Assessoramos empresas na estruturação de contratos de parceria, distribuição, franquia, fornecimento, locação comercial e prestação de serviços, sempre com atenção às particularidades de cada setor e modelo de negócio. Nossos contratos são redigidos para prevenir conflitos e, quando necessário, fornecer base sólida para a defesa dos interesses da empresa.',
      'Além da elaboração, acompanhamos a execução contratual, orientando sobre aditivos, rescisões, distrato e gestão de inadimplência, com foco na preservação do relacionamento comercial e na proteção patrimonial.',
    ],
    bg: 'bg-landing-ivory',
    textColor: 'text-landing-ink',
    descColor: 'text-landing-stone',
    iconColor: 'text-landing-gold',
    lineColor: 'bg-landing-gold',
  },
  {
    icon: Banknote,
    title: 'Cobrança e Recuperação de Crédito',
    paragraphs: [
      'Créditos em atraso comprometem o fluxo de caixa e a saúde financeira da empresa. O escritório D\'Avila Reis Advogados oferece um serviço completo de cobrança extrajudicial e judicial, atuando de forma ágil e estratégica para a recuperação de valores devidos.',
      'Na fase extrajudicial, realizamos notificações formais, negociações diretas e mediação de conflitos, buscando a composição amigável antes do litígio. Quando necessário, ingressamos com ações de cobrança, execuções de título extrajudicial, ações monitorias e execuções de duplicatas, sempre com foco na celeridade e na efetividade da recuperação.',
      'Nossa atuação abrange tambem a pesquisa patrimonial dos devedores, a solicitação de medidas constritivas e o acompanhamento integral da execução até a satisfação do crédito, mantendo o cliente informado em cada etapa do processo.'
    ],
    bg: 'bg-landing-charcoal',
    textColor: 'text-white',
    descColor: 'text-gray-400',
    iconColor: 'text-landing-gold',
    lineColor: 'bg-landing-gold',
  },
]

export default function AtuacaoPage() {
  return (
    <PublicPageShell>
      <main>
        {/* Hero banner */}
        <section className="bg-landing-ivory py-20 border-b border-landing-mist">
          <div className="container mx-auto px-6 text-center">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-landing-ink mb-4">
              Áreas de Atuação
            </h1>
            <div className="w-12 h-[2px] bg-landing-gold mx-auto mb-6" />
            <p className="text-landing-stone text-lg max-w-2xl mx-auto">
              Atuação especializada em direito empresarial e trabalhista, com foco na proteção
              patrimonial e na prevenção de litígios.
            </p>
          </div>
        </section>

        {/* Area sections */}
        {areas.map((area, index) => (
          <section key={area.title} className={`py-20 ${area.bg}`}>
            <div className="container mx-auto px-6 max-w-4xl">
              <ScrollReveal>
                <div className="flex items-center gap-4 mb-8">
                  <area.icon className={`h-8 w-8 ${area.iconColor} flex-shrink-0`} />
                  <h2 className={`text-2xl md:text-3xl font-serif font-bold ${area.textColor}`}>
                    {area.title}
                  </h2>
                </div>
                <div className={`w-12 h-[2px] ${area.lineColor} mb-8`} />
              </ScrollReveal>

              <div className="space-y-6">
                {area.paragraphs.map((paragraph, pIndex) => (
                  <ScrollReveal key={pIndex} delay={`${pIndex * 80}ms`}>
                    <p className={`${area.descColor} leading-relaxed text-lg`}>{paragraph}</p>
                  </ScrollReveal>
                ))}
              </div>

              {index === areas.length - 1 && (
                <ScrollReveal delay="300ms">
                  <div className="mt-12 text-center">
                    <div className={`w-full h-[1px] ${area.lineColor}/30 mb-12`} />
                  </div>
                </ScrollReveal>
              )}
            </div>
          </section>
        ))}

        {/* CTA */}
        <section className="py-20 bg-landing-ivory">
          <div className="container mx-auto px-6 text-center max-w-2xl">
            <ScrollReveal>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-landing-ink mb-4">
                Precisa de orientação jurídica?
              </h2>
              <p className="text-landing-stone mb-8 text-lg">
                Solicite uma triagem do seu caso e descubra como podemos ajudar a proteger sua
                empresa.
              </p>
              <Link
                href="/contato"
                className="inline-flex items-center gap-2 px-8 py-4 bg-landing-gold text-white text-sm font-medium tracking-wide hover:bg-landing-gold-light transition-colors"
              >
                Solicitar triagem do caso
                <ArrowRight className="h-4 w-4" />
              </Link>
            </ScrollReveal>
          </div>
        </section>
      </main>
    </PublicPageShell>
  )
}
