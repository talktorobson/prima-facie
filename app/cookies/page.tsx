import type { Metadata } from 'next'
import PublicPageShell from '@/components/landing/public-page-shell'
import ScrollReveal from '@/components/landing/scroll-reveal'

export const metadata: Metadata = {
  title: "Politica de Cookies | D'Avila Reis Advogados",
  description:
    'Saiba como o site do escritorio D\'Avila Reis Advogados utiliza cookies e como voce pode gerencia-los.',
}

const cookieTypes = [
  {
    name: 'Cookies Essenciais',
    description:
      'Sao necessarios para o funcionamento basico do site. Permitem a navegacao entre paginas e o acesso a areas seguras. Sem esses cookies, o site nao funciona corretamente.',
    examples: 'Sessao de autenticacao, preferencias de idioma, token CSRF.',
    duration: 'Sessao do navegador ou ate 24 horas.',
  },
  {
    name: 'Cookies de Desempenho',
    description:
      'Coletam informacoes sobre como os visitantes utilizam o site, como as paginas mais acessadas e mensagens de erro. Esses cookies nao identificam o visitante individualmente e sao usados exclusivamente para melhorar o funcionamento do site.',
    examples: 'Google Analytics (_ga, _gid).',
    duration: 'Ate 2 anos.',
  },
  {
    name: 'Cookies de Funcionalidade',
    description:
      'Permitem que o site lembre escolhas feitas pelo visitante, como tamanho de fonte, regiao ou preferencias de exibicao, proporcionando uma experiencia mais personalizada.',
    examples: 'Preferencia de tema (claro/escuro), configuracoes de formulario.',
    duration: 'Ate 1 ano.',
  },
]

export default function CookiesPage() {
  return (
    <PublicPageShell>
      <main>
        {/* Hero banner */}
        <section className="bg-landing-ivory py-20 border-b border-landing-mist">
          <div className="container mx-auto px-6 text-center">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-landing-ink mb-4">
              Politica de Cookies
            </h1>
            <div className="w-12 h-[2px] bg-landing-gold mx-auto mb-6" />
            <p className="text-landing-stone text-sm">
              Ultima atualizacao: Fevereiro de 2026
            </p>
          </div>
        </section>

        {/* O que sao cookies */}
        <section className="py-20 bg-landing-ivory">
          <div className="container mx-auto px-6 max-w-3xl">
            <ScrollReveal>
              <h2 className="text-xl md:text-2xl font-serif font-semibold text-landing-ink mb-4">
                O que sao cookies?
              </h2>
              <p className="text-landing-stone leading-relaxed mb-4">
                Cookies sao pequenos arquivos de texto que sao armazenados no seu dispositivo
                (computador, tablet ou smartphone) quando voce visita um site. Eles sao amplamente
                utilizados para fazer sites funcionarem de forma mais eficiente, bem como para
                fornecer informacoes aos proprietarios do site.
              </p>
              <p className="text-landing-stone leading-relaxed">
                O site do escritorio D&apos;Avila Reis Advogados utiliza cookies para melhorar sua
                experiencia de navegacao, analisar o trafego do site e personalizar o conteudo
                exibido. Esta politica explica quais cookies utilizamos e como voce pode
                gerencia-los.
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* Cookies utilizados */}
        <section className="py-20 bg-landing-charcoal">
          <div className="container mx-auto px-6 max-w-3xl">
            <ScrollReveal>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-white text-center mb-16 gold-line mx-auto inline-block w-full">
                Cookies Utilizados
              </h2>
            </ScrollReveal>

            <div className="space-y-6">
              {cookieTypes.map((cookie, index) => (
                <ScrollReveal key={cookie.name} delay={`${index * 100}ms`}>
                  <div className="border border-white/10 p-8">
                    <h3 className="text-lg font-serif font-semibold text-white mb-4">
                      {cookie.name}
                    </h3>
                    <p className="text-gray-400 leading-relaxed mb-4">{cookie.description}</p>
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-500">
                        <span className="text-landing-gold font-medium">Exemplos:</span>{' '}
                        {cookie.examples}
                      </p>
                      <p className="text-gray-500">
                        <span className="text-landing-gold font-medium">Duracao:</span>{' '}
                        {cookie.duration}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Como gerenciar cookies */}
        <section className="py-20 bg-landing-ivory">
          <div className="container mx-auto px-6 max-w-3xl">
            <ScrollReveal>
              <h2 className="text-xl md:text-2xl font-serif font-semibold text-landing-ink mb-4">
                Como gerenciar cookies
              </h2>
              <div className="space-y-4">
                <p className="text-landing-stone leading-relaxed">
                  Voce pode controlar e gerenciar cookies de diversas formas. A maioria dos
                  navegadores permite que voce:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li className="text-landing-stone leading-relaxed">
                    Visualize quais cookies estao armazenados e exclua-os individualmente
                  </li>
                  <li className="text-landing-stone leading-relaxed">
                    Bloqueie cookies de terceiros
                  </li>
                  <li className="text-landing-stone leading-relaxed">
                    Bloqueie todos os cookies de sites especificos
                  </li>
                  <li className="text-landing-stone leading-relaxed">
                    Bloqueie a instalacao de qualquer cookie
                  </li>
                  <li className="text-landing-stone leading-relaxed">
                    Exclua todos os cookies ao fechar o navegador
                  </li>
                </ul>
                <p className="text-landing-stone leading-relaxed">
                  Para gerenciar cookies no seu navegador, acesse as configuracoes de privacidade
                  ou seguranca. Cada navegador possui um processo diferente — consulte a
                  documentacao do seu navegador para instrucoes especificas.
                </p>
                <p className="text-landing-stone leading-relaxed">
                  <strong className="text-landing-ink">Atencao:</strong> a desativacao de cookies
                  essenciais pode comprometer o funcionamento do site e impedir o acesso a
                  determinadas funcionalidades.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Contato */}
        <section className="py-16 bg-landing-mist/40">
          <div className="container mx-auto px-6 max-w-3xl">
            <ScrollReveal>
              <h2 className="text-xl md:text-2xl font-serif font-semibold text-landing-ink mb-4">
                Contato
              </h2>
              <p className="text-landing-stone leading-relaxed mb-6">
                Em caso de duvidas sobre o uso de cookies em nosso site, entre em contato:
              </p>
              <div className="bg-white border border-landing-mist p-6">
                <p className="text-landing-ink font-medium mb-2">
                  D&apos;Avila Reis Advogados
                </p>
                <p className="text-landing-stone text-sm">
                  E-mail: financeiro@davilareisadvogados.com.br
                </p>
                <p className="text-landing-stone text-sm">Telefone: (15) 3384-4013</p>
                <p className="text-landing-stone text-sm">
                  Av. Dr. Vinicio Gagliardi, 675, Centro, Cerquilho/SP — CEP 18520-091
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>
    </PublicPageShell>
  )
}
