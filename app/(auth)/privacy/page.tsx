import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Política de Privacidade</h1>

      <div className="prose prose-gray max-w-none space-y-6 text-sm text-gray-700">
        <p>
          Última atualização: Janeiro de 2025
        </p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">1. Introdução</h2>
        <p>
          Esta Política de Privacidade descreve como a plataforma Prima Facie coleta, utiliza, armazena
          e protege os dados pessoais dos usuários, em conformidade com a Lei Geral de Proteção de
          Dados (LGPD - Lei n. 13.709/2018).
        </p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">2. Dados Coletados</h2>
        <p>Coletamos os seguintes tipos de dados:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Dados cadastrais: nome completo, email, telefone, CPF/CNPJ</li>
          <li>Dados profissionais: OAB, escritório, cargo</li>
          <li>Dados de uso: logs de acesso, ações realizadas na plataforma</li>
          <li>Dados de comunicação: mensagens trocadas dentro da plataforma</li>
        </ul>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">3. Finalidade do Tratamento</h2>
        <p>Os dados pessoais são tratados para as seguintes finalidades:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Prestação dos serviços contratados</li>
          <li>Comunicação com o usuário</li>
          <li>Melhoria contínua da plataforma</li>
          <li>Cumprimento de obrigações legais e regulatórias</li>
          <li>Segurança e prevenção a fraudes</li>
        </ul>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">4. Compartilhamento de Dados</h2>
        <p>
          Os dados pessoais não serão compartilhados com terceiros, exceto quando necessário para
          a prestação dos serviços (como processadores de pagamento), por determinação legal ou
          judicial, ou com consentimento expresso do titular.
        </p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">5. Armazenamento e Segurança</h2>
        <p>
          Os dados são armazenados em servidores seguros com criptografia em trânsito e em repouso.
          Implementamos medidas técnicas e organizacionais para proteger os dados contra acesso
          não autorizado, destruição ou alteração.
        </p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">6. Direitos do Titular</h2>
        <p>O titular dos dados tem direito a:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Confirmar a existência de tratamento</li>
          <li>Acessar seus dados</li>
          <li>Corrigir dados incompletos ou inexatos</li>
          <li>Solicitar a eliminação de dados desnecessários</li>
          <li>Revogar o consentimento a qualquer momento</li>
          <li>Solicitar a portabilidade dos dados</li>
        </ul>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">7. Retenção de Dados</h2>
        <p>
          Os dados pessoais serão mantidos pelo período necessário para o cumprimento das finalidades
          descritas nesta política, ou conforme exigido pela legislação aplicável.
        </p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">8. Contato</h2>
        <p>
          Para exercer seus direitos ou esclarecer dúvidas sobre esta Política de Privacidade,
          entre em contato pelo email: recepcao@davilareisadvogados.com.br
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
