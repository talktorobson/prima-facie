import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Termos de Uso</h1>

      <div className="prose prose-gray max-w-none space-y-6 text-sm text-gray-700">
        <p>
          Ultima atualizacao: Janeiro de 2025
        </p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">1. Aceitacao dos Termos</h2>
        <p>
          Ao acessar e utilizar a plataforma Prima Facie (&quot;Plataforma&quot;), voce concorda em ficar vinculado
          a estes Termos de Uso. Caso nao concorde com algum dos termos, nao utilize a Plataforma.
        </p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">2. Descricao do Servico</h2>
        <p>
          A Plataforma e um sistema de gestao para escritorios de advocacia que oferece funcionalidades
          de gerenciamento de processos, clientes, documentos, faturamento e comunicacao. O acesso e
          fornecido mediante assinatura conforme o plano escolhido.
        </p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">3. Cadastro e Conta</h2>
        <p>
          Para utilizar a Plataforma, e necessario criar uma conta com informacoes verdadeiras e atualizadas.
          Voce e responsavel por manter a confidencialidade de suas credenciais de acesso e por todas
          as atividades realizadas em sua conta.
        </p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">4. Uso Adequado</h2>
        <p>
          O usuario compromete-se a utilizar a Plataforma de acordo com a legislacao vigente, nao
          utilizando o servico para fins ilicitos ou que possam causar danos a terceiros.
        </p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">5. Protecao de Dados</h2>
        <p>
          Todos os dados inseridos na Plataforma sao tratados de acordo com a Lei Geral de Protecao
          de Dados (LGPD - Lei n. 13.709/2018). Consulte nossa{' '}
          <Link href="/privacy" className="text-primary hover:underline">Politica de Privacidade</Link>{' '}
          para mais detalhes.
        </p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">6. Propriedade Intelectual</h2>
        <p>
          Todo o conteudo da Plataforma, incluindo software, design, textos e logos, sao de propriedade
          exclusiva da Prima Facie. E vedada a reproducao, distribuicao ou modificacao sem autorizacao previa.
        </p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">7. Limitacao de Responsabilidade</h2>
        <p>
          A Plataforma e fornecida &quot;como esta&quot;. Nao nos responsabilizamos por interrupcoes
          temporarias, perda de dados causada por fatores externos, ou decisoes tomadas com base
          em informacoes exibidas na Plataforma.
        </p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">8. Alteracoes nos Termos</h2>
        <p>
          Reservamo-nos o direito de alterar estes Termos a qualquer momento. As alteracoes serao
          comunicadas aos usuarios por email ou notificacao na Plataforma.
        </p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">9. Foro</h2>
        <p>
          Fica eleito o foro da comarca de Cerquilho/SP para dirimir quaisquer controversias
          decorrentes destes Termos.
        </p>
      </div>

      <div className="mt-10">
        <Link href="/register" className="text-primary hover:underline text-sm">
          Voltar para cadastro
        </Link>
      </div>
    </div>
  )
}
