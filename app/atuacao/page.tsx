import type { Metadata } from 'next'
import Link from 'next/link'
import { Scale, Shield, FileText, Banknote, ArrowRight } from 'lucide-react'
import PublicPageShell from '@/components/landing/public-page-shell'
import ScrollReveal from '@/components/landing/scroll-reveal'

export const metadata: Metadata = {
  title: "Areas de Atuacao | D'Avila Reis Advogados",
  description:
    'Direito trabalhista empresarial, consultoria preventiva, contratos empresariais e cobranca de creditos. Conheca as areas de atuacao do escritorio D\'Avila Reis.',
}

const areas = [
  {
    icon: Scale,
    title: 'Direito Trabalhista Empresarial (Patronal)',
    paragraphs: [
      'O escritorio D\'Avila Reis Advogados e referencia na defesa do empregador em todas as fases do processo trabalhista. Atuamos desde a fase inicial de reclamacoes trabalhistas, passando por audiencias, recursos ordinarios e de revista, ate a fase de execucao, sempre com estrategia processual personalizada para cada caso.',
      'Nossa equipe possui ampla experiencia em blindagem patrimonial dos socios, protegendo o patrimonio pessoal de empresarios contra desconsideracoes da personalidade juridica e redirecionamentos de execucao. Desenvolvemos teses defensivas solidas e atuamos com agilidade para reverter decisoes desfavoraveis.',
      'Alem da atuacao contenciosa, realizamos a gestao completa do passivo trabalhista da empresa, elaborando relatorios de risco, acompanhando prazos processuais e orientando a tomada de decisao com base em dados concretos e jurimetria.',
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
      'A melhor forma de vencer um litigio e evita-lo. Nossa consultoria preventiva trabalhista atua diretamente na identificacao e correcao de vulnerabilidades juridicas antes que se transformem em processos. Realizamos auditorias trabalhistas completas, analisando contratos, folha de pagamento, jornada, beneficios e rotinas de RH.',
      'Elaboramos e revisamos politicas internas, regulamentos empresariais, codigos de conduta e manuais de procedimentos, garantindo que a empresa esteja em conformidade com a legislacao vigente e as convencoes coletivas aplicaveis. Nosso trabalho de compliance trabalhista reduz significativamente a exposicao a riscos.',
      'Oferecemos tambem treinamento de gestores e lideres, capacitando-os para tomar decisoes no dia a dia que estejam alinhadas com as melhores praticas juridicas, evitando situacoes que possam gerar passivos trabalhistas futuros.',
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
      'A seguranca juridica de uma empresa comeca pela qualidade de seus contratos. O escritorio D\'Avila Reis Advogados atua na elaboracao, revisao e negociacao de contratos comerciais, societarios e de prestacao de servicos, garantindo que cada clausula proteja adequadamente os interesses de nossos clientes.',
      'Assessoramos empresas na estruturacao de contratos de parceria, distribuicao, franquia, fornecimento, locacao comercial e prestacao de servicos, sempre com atencao as particularidades de cada setor e modelo de negocio. Nossos contratos sao redigidos para prevenir conflitos e, quando necessario, fornecer base solida para a defesa dos interesses da empresa.',
      'Alem da elaboracao, acompanhamos a execucao contratual, orientando sobre aditivos, rescisoes, distrato e gestao de inadimplencia, com foco na preservacao do relacionamento comercial e na protecao patrimonial.',
    ],
    bg: 'bg-landing-ivory',
    textColor: 'text-landing-ink',
    descColor: 'text-landing-stone',
    iconColor: 'text-landing-gold',
    lineColor: 'bg-landing-gold',
  },
  {
    icon: Banknote,
    title: 'Cobranca e Recuperacao de Credito',
    paragraphs: [
      'Creditos em atraso comprometem o fluxo de caixa e a saude financeira da empresa. O escritorio D\'Avila Reis Advogados oferece um servico completo de cobranca extrajudicial e judicial, atuando de forma agil e estrategica para a recuperacao de valores devidos.',
      'Na fase extrajudicial, realizamos notificacoes formais, negociacoes diretas e mediacao de conflitos, buscando a composicao amigavel antes do litigo. Quando necessario, ingressamos com acoes de cobranca, execucoes de titulo extrajudicial, acoes monitorias e execucoes de duplicatas, sempre com foco na celeridade e na efetividade da recuperacao.',
      'Nossa atuacao abrange tambem a pesquisa patrimonial dos devedores, a solicitacao de medidas constritivas e o acompanhamento integral da execucao ate a satisfacao do credito, mantendo o cliente informado em cada etapa do processo.',
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
              Areas de Atuacao
            </h1>
            <div className="w-12 h-[2px] bg-landing-gold mx-auto mb-6" />
            <p className="text-landing-stone text-lg max-w-2xl mx-auto">
              Atuacao especializada em direito empresarial e trabalhista, com foco na protecao
              patrimonial e na prevencao de litigios.
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
                Precisa de orientacao juridica?
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
