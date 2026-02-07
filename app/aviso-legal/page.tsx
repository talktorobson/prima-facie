import type { Metadata } from 'next'
import PublicPageShell from '@/components/landing/public-page-shell'
import ScrollReveal from '@/components/landing/scroll-reveal'

export const metadata: Metadata = {
  title: "Aviso Legal | D'Avila Reis Advogados",
  description:
    'Aviso legal do escritorio D\'Avila Reis Advogados: informacoes sobre a natureza do conteudo, responsabilidade, propriedade intelectual e legislacao aplicavel.',
}

const sections = [
  {
    title: '1. Natureza do Conteudo',
    paragraphs: [
      'O conteudo disponibilizado neste site tem carater exclusivamente informativo e educacional, nao constituindo consultoria juridica, parecer legal ou recomendacao profissional de qualquer natureza.',
      'As informacoes apresentadas refletem o entendimento do escritorio D\'Avila Reis Advogados sobre os temas abordados na data de sua publicacao, podendo nao estar atualizadas em relacao a eventuais alteracoes legislativas, jurisprudenciais ou regulatorias posteriores.',
      'Para orientacao juridica especifica sobre qualquer questao, recomendamos a consulta direta com um advogado qualificado que possa analisar as particularidades do seu caso.',
    ],
  },
  {
    title: '2. Responsabilidade',
    paragraphs: [
      'O escritorio D\'Avila Reis Advogados nao se responsabiliza por decisoes tomadas com base nas informacoes contidas neste site sem a devida consulta profissional previa. O acesso ao site e a leitura de seu conteudo nao estabelecem relacao advogado-cliente entre o visitante e o escritorio.',
      'Embora nos esforcemos para manter as informacoes atualizadas e precisas, nao garantimos a completude, exatidao ou atualidade de todo o conteudo disponibilizado. O escritorio reserva-se o direito de alterar, corrigir ou remover conteudo a qualquer momento, sem aviso previo.',
      'Este site pode conter links para sites de terceiros. O escritorio nao se responsabiliza pelo conteudo, politicas de privacidade ou praticas de sites externos, e a inclusao de links nao implica endosso ou recomendacao.',
    ],
  },
  {
    title: '3. Propriedade Intelectual',
    paragraphs: [
      'Todo o conteudo deste site — incluindo textos, imagens, logotipos, marcas, design, layout e demais elementos visuais e editoriais — e protegido pela legislacao brasileira de direitos autorais (Lei n. 9.610/1998) e de propriedade industrial (Lei n. 9.279/1996).',
      'A reproducao, distribuicao, modificacao ou utilizacao do conteudo deste site, no todo ou em parte, sem autorizacao previa e expressa do escritorio D\'Avila Reis Advogados, e expressamente proibida e sujeita as sancoes previstas em lei.',
      'E permitida a citacao de trechos para fins jornalisticos, academicos ou educacionais, desde que acompanhada da devida atribuicao de autoria e indicacao da fonte.',
    ],
  },
  {
    title: '4. Lei Aplicavel e Foro',
    paragraphs: [
      'Este site, seu conteudo e as relacoes dele decorrentes sao regidos pela legislacao da Republica Federativa do Brasil.',
      'Fica eleito o foro da comarca de Cerquilho, Estado de Sao Paulo, para dirimir quaisquer questoes decorrentes do uso deste site, com renuncia expressa a qualquer outro, por mais privilegiado que seja.',
    ],
  },
  {
    title: '5. Contato',
    paragraphs: [
      'Em caso de duvidas sobre este aviso legal ou sobre qualquer conteudo disponibilizado neste site, entre em contato com o escritorio:',
    ],
    contact: {
      name: 'D\'Avila Reis Advogados',
      email: 'financeiro@davilareisadvogados.com.br',
      phone: '(15) 3384-4013',
      address: 'Av. Dr. Vinicio Gagliardi, 675, Centro, Cerquilho/SP — CEP 18520-091',
    },
  },
]

export default function AvisoLegalPage() {
  return (
    <PublicPageShell>
      <main>
        {/* Hero banner */}
        <section className="bg-landing-ivory py-20 border-b border-landing-mist">
          <div className="container mx-auto px-6 text-center">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-landing-ink mb-4">
              Aviso Legal
            </h1>
            <div className="w-12 h-[2px] bg-landing-gold mx-auto mb-6" />
            <p className="text-landing-stone text-sm">
              Ultima atualizacao: Fevereiro de 2026
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
                    {section.paragraphs.map((paragraph, index) => (
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
