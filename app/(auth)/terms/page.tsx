import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Termos de Uso</h1>

      <div className="prose prose-gray max-w-none space-y-6 text-sm text-gray-700">
        <p>
          Última atualização: Janeiro de 2025
        </p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">1. Aceitação dos Termos</h2>
        <p>
          Ao acessar e utilizar a plataforma Prima Facie (&quot;Plataforma&quot;), você concorda em ficar vinculado
          a estes Termos de Uso. Caso não concorde com algum dos termos, não utilize a Plataforma.
        </p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">2. Descrição do Serviço</h2>
        <p>
          A Plataforma é um sistema de gestão para escritórios de advocacia que oferece funcionalidades
          de gerenciamento de processos, clientes, documentos, faturamento e comunicação. O acesso é
          fornecido mediante assinatura conforme o plano escolhido.
        </p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">3. Cadastro e Conta</h2>
        <p>
          Para utilizar a Plataforma, é necessário criar uma conta com informações verdadeiras e atualizadas.
          Você é responsável por manter a confidencialidade de suas credenciais de acesso e por todas
          as atividades realizadas em sua conta.
        </p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">4. Uso Adequado</h2>
        <p>
          O usuário compromete-se a utilizar a Plataforma de acordo com a legislação vigente, não
          utilizando o serviço para fins ilícitos ou que possam causar danos a terceiros.
        </p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">5. Proteção de Dados</h2>
        <p>
          Todos os dados inseridos na Plataforma são tratados de acordo com a Lei Geral de Proteção
          de Dados (LGPD - Lei n. 13.709/2018). Consulte nossa{' '}
          <Link href="/privacy" className="text-primary hover:underline">Política de Privacidade</Link>{' '}
          para mais detalhes.
        </p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">6. Propriedade Intelectual</h2>
        <p>
          Todo o conteúdo da Plataforma, incluindo software, design, textos e logos, são de propriedade
          exclusiva da Prima Facie. É vedada a reprodução, distribuição ou modificação sem autorização prévia.
        </p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">7. Limitação de Responsabilidade</h2>
        <p>
          A Plataforma é fornecida &quot;como está&quot;. Não nos responsabilizamos por interrupções
          temporárias, perda de dados causada por fatores externos, ou decisões tomadas com base
          em informações exibidas na Plataforma.
        </p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">8. Alterações nos Termos</h2>
        <p>
          Reservamo-nos o direito de alterar estes Termos a qualquer momento. As alterações serão
          comunicadas aos usuários por email ou notificação na Plataforma.
        </p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">9. Foro</h2>
        <p>
          Fica eleito o foro da comarca de Cerquilho/SP para dirimir quaisquer controvérsias
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
