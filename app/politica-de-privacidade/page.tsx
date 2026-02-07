import type { Metadata } from 'next'
import PublicPageShell from '@/components/landing/public-page-shell'
import ScrollReveal from '@/components/landing/scroll-reveal'

export const metadata: Metadata = {
  title: "Política de Privacidade | D'Avila Reis Advogados",
  description:
    'Política de privacidade do escritório D\'Avila Reis Advogados, em conformidade com a Lei Geral de Protecao de Dados (LGPD).',
}

const sections = [
  {
    title: '1. Introdução',
    content: [
      'O escritório D\'Avila Reis Advogados, inscrito no CNPJ sob o numero XX.XXX.XXX/0001-XX, com sede na Av. Dr. Vinicio Gagliardi, 675, Centro, Cerquilho/SP, CEP 18520-091, esta comprometido com a protecao da privacidade e dos dados pessoais de seus clientes, visitantes e usuarios de seus servicos digitais.',
      'Esta Politica de Privacidade descreve como coletamos, utilizamos, armazenamos e protegemos suas informacoes pessoais, em conformidade com a Lei Geral de Protecao de Dados (Lei n. 13.709/2018 — LGPD) e demais normas aplicaveis.',
    ],
  },
  {
    title: '2. Dados Coletados',
    content: [
      'Podemos coletar os seguintes dados pessoais:',
    ],
    list: [
      'Dados de identificação: nome completo, CPF, RG, CNPJ, endereço, telefone, e-mail',
      'Dados profissionais: cargo, empresa, área de atuação',
      'Dados de navegação: endereço IP, tipo de navegador, páginas acessadas, tempo de visita, cookies',
      'Dados fornecidos por formularios: informacoes inseridas voluntariamente nos formularios de contato ou solicitacao de servicos',
      'Dados processuais: numeros de processos, informacoes de partes e andamentos, quando necessarios para a prestacao de servicos juridicos',
    ],
  },
  {
    title: '3. Finalidade do Tratamento',
    content: [
      'Os dados pessoais coletados sao utilizados para as seguintes finalidades:',
    ],
    list: [
      'Prestação de serviços jurídicos e atendimento ao cliente',
      'Comunicação sobre andamento de processos e demandas',
      'Envio de informativos jurídicos e conteúdos relevantes (mediante consentimento)',
      'Cumprimento de obrigações legais e regulatórias',
      'Melhoria da experiência de navegação em nosso site',
      'Análise estatística e aprimoramento de nossos serviços',
      'Gestão de relacionamento com clientes e prospectos',
    ],
  },
  {
    title: '4. Compartilhamento de Dados',
    content: [
      'Os dados pessoais podem ser compartilhados com:',
    ],
    list: [
      'Orgãos do Poder Judiciário, quando necessário para a prestação de serviços jurídicos',
      'Orgãos públicos, em cumprimento de obrigações legais',
      'Prestadores de serviços essenciais (hospedagem, e-mail, ferramentas de gestão), mediante contratos que garantam a proteção adequada dos dados',
      'Advogados correspondentes, quando necessário para a atuação em outras jurisdicoes',
    ],
    afterContent: [
      'Em nenhuma hipótese comercializamos dados pessoais de nossos clientes ou visitantes.',
    ],
  },
  {
    title: '5. Retencao dos Dados',
    content: [
      'Os dados pessoais serao mantidos pelo periodo necessario ao cumprimento de suas finalidades, observados os prazos legais de prescricao e obrigacoes regulatorias. Dados relacionados a prestacao de servicos juridicos serao retidos pelo prazo minimo de 5 (cinco) anos apos o encerramento da relacao contratual, salvo obrigacao legal que exija retencao por periodo superior.',
      'Dados de navegacao e cookies sao retidos conforme especificado na Politica de Cookies.',
    ],
  },
  {
    title: '6. Direitos do Titular',
    content: [
      'Em conformidade com a LGPD, você tem direito a:',
    ],
    list: [
      'Confirmação da existência de tratamento de seus dados pessoais',
      'Acesso aos seus dados pessoais',
      'Correção de dados incompletos, inexatos ou desatualizados',
      'Anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos',
      'Portabilidade dos dados a outro fornecedor de serviço',
      'Eliminação dos dados tratados com base no consentimento',
      'Informação sobre entidades públicas e privadas com as quais seus dados foram compartilhados',
      'Informação sobre a possibilidade de não fornecer o consentimento e suas consequências',
      'Revogação do consentimento',
    ],
    afterContent: [
      'Para exercer seus direitos, entre em contato com nosso Encarregado de Dados (DPO) pelos canais indicados ao final desta politica.',
    ],
  },
  {
    title: '7. Cookies',
    content: [
      'Nosso site utiliza cookies para melhorar a experiência de navegação. Para informações detalhadas sobre os tipos de cookies utilizados e como gerenciar, consulte nossa Politica de Cookies.',
    ],
  },
  {
    title: '8. Segurança dos Dados',
    content: [
      'Adotamos medidas tecnicas e organizacionais apropriadas para proteger os dados pessoais contra acesso nao autorizado, perda, alteracao ou destruicao. Nossos sistemas utilizam criptografia, controles de acesso e monitoramento continuo para garantir a integridade e confidencialidade das informacoes.',
    ],
  },
  {
    title: '9. Alterações nesta Politica',
    content: [
      'Esta Política de Privacidade pode ser atualizada periodicamente para refletir mudanças em nossas praticas ou em requisitos legais. A versão mais recente estará sempre disponível nesta página, com indicação da data da última atualização.',
    ],
  },
  {
    title: '10. Contato do DPO (Encarregado de Dados)',
    content: [
      'Para questões relacionadas a proteção de dados pessoais, exercício de direitos ou dúvidas sobre esta política, entre em contato:',
    ],
    contact: {
      name: 'D\'Avila Reis Advogados — Encarregado de Dados',
      email: 'financeiro@davilareisadvogados.com.br',
      phone: '(15) 3384-4013',
      address: 'Av. Dr. Vinicio Gagliardi, 675, Centro, Cerquilho/SP — CEP 18520-091',
    },
  },
]

export default function PoliticaDePrivacidadePage() {
  return (
    <PublicPageShell>
      <main>
        {/* Hero banner */}
        <section className="bg-landing-ivory py-20 border-b border-landing-mist">
          <div className="container mx-auto px-6 text-center">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-landing-ink mb-4">
              Politica de Privacidade
            </h1>
            <div className="w-12 h-[2px] bg-landing-gold mx-auto mb-6" />
            <p className="text-landing-stone text-sm">
              Última atualização: Fevereiro de 2026
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="py-20 bg-landing-ivory">
          <div className="container mx-auto px-6 max-w-3xl">
            <div className="space-y-12">
              {sections.map((section) => (
                <ScrollReveal key={section.title}>
                  <div>
                    <h2 className="text-xl md:text-2xl font-serif font-semibold text-landing-ink mb-4">
                      {section.title}
                    </h2>
                    {section.content.map((paragraph, index) => (
                      <p
                        key={index}
                        className="text-landing-stone leading-relaxed mb-4"
                      >
                        {paragraph}
                      </p>
                    ))}
                    {section.list && (
                      <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
                        {section.list.map((item, index) => (
                          <li key={index} className="text-landing-stone leading-relaxed">
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                    {section.afterContent?.map((paragraph, index) => (
                      <p
                        key={index}
                        className="text-landing-stone leading-relaxed mb-4"
                      >
                        {paragraph}
                      </p>
                    ))}
                    {section.contact && (
                      <div className="bg-white border border-landing-mist p-6 mt-4">
                        <p className="text-landing-ink font-medium mb-2">
                          {section.contact.name}
                        </p>
                        <p className="text-landing-stone text-sm">
                          E-mail: {section.contact.email}
                        </p>
                        <p className="text-landing-stone text-sm">
                          Telefone: {section.contact.phone}
                        </p>
                        <p className="text-landing-stone text-sm">
                          Endereco: {section.contact.address}
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      </main>
    </PublicPageShell>
  )
}
