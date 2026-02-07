import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Politica de Privacidade</h1>

      <div className="prose prose-gray max-w-none space-y-6 text-sm text-gray-700">
        <p>
          Ultima atualizacao: Janeiro de 2025
        </p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">1. Introducao</h2>
        <p>
          Esta Politica de Privacidade descreve como a plataforma Prima Facie coleta, utiliza, armazena
          e protege os dados pessoais dos usuarios, em conformidade com a Lei Geral de Protecao de
          Dados (LGPD - Lei n. 13.709/2018).
        </p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">2. Dados Coletados</h2>
        <p>Coletamos os seguintes tipos de dados:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Dados cadastrais: nome completo, email, telefone, CPF/CNPJ</li>
          <li>Dados profissionais: OAB, escritorio, cargo</li>
          <li>Dados de uso: logs de acesso, acoes realizadas na plataforma</li>
          <li>Dados de comunicacao: mensagens trocadas dentro da plataforma</li>
        </ul>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">3. Finalidade do Tratamento</h2>
        <p>Os dados pessoais sao tratados para as seguintes finalidades:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Prestacao dos servicos contratados</li>
          <li>Comunicacao com o usuario</li>
          <li>Melhoria continua da plataforma</li>
          <li>Cumprimento de obrigacoes legais e regulatorias</li>
          <li>Seguranca e prevencao a fraudes</li>
        </ul>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">4. Compartilhamento de Dados</h2>
        <p>
          Os dados pessoais nao serao compartilhados com terceiros, exceto quando necessario para
          a prestacao dos servicos (como processadores de pagamento), por determinacao legal ou
          judicial, ou com consentimento expresso do titular.
        </p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">5. Armazenamento e Seguranca</h2>
        <p>
          Os dados sao armazenados em servidores seguros com criptografia em transito e em repouso.
          Implementamos medidas tecnicas e organizacionais para proteger os dados contra acesso
          nao autorizado, destruicao ou alteracao.
        </p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">6. Direitos do Titular</h2>
        <p>O titular dos dados tem direito a:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Confirmar a existencia de tratamento</li>
          <li>Acessar seus dados</li>
          <li>Corrigir dados incompletos ou inexatos</li>
          <li>Solicitar a eliminacao de dados desnecessarios</li>
          <li>Revogar o consentimento a qualquer momento</li>
          <li>Solicitar a portabilidade dos dados</li>
        </ul>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">7. Retencao de Dados</h2>
        <p>
          Os dados pessoais serao mantidos pelo periodo necessario para o cumprimento das finalidades
          descritas nesta politica, ou conforme exigido pela legislacao aplicavel.
        </p>

        <h2 className="text-lg font-semibold text-gray-900 mt-8">8. Contato</h2>
        <p>
          Para exercer seus direitos ou esclarecer duvidas sobre esta Politica de Privacidade,
          entre em contato pelo email: financeiro@davilareisadvogados.com.br
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
