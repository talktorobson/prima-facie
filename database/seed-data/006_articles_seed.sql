-- Seed data for articles table
-- Uses the first law firm from the initial seed (D'Avila Reis)
-- Assumes law_firms table already has data from previous seeds

-- 2 Alertas
INSERT INTO articles (law_firm_id, title, slug, excerpt, content, category, topic, published, published_at)
SELECT
  lf.id,
  'Alerta: Novas Regras Trabalhistas para 2026',
  'novas-regras-trabalhistas-2026',
  'O governo publicou novas normas que impactam diretamente as relacoes de trabalho. Saiba o que muda para sua empresa.',
  E'## Novas Regras Trabalhistas para 2026\n\nO governo federal publicou em janeiro de 2026 uma serie de alteracoes na legislacao trabalhista que entram em vigor a partir de marco. As mudancas afetam principalmente:\n\n### Jornada de Trabalho\n- Nova regulamentacao do teletrabalho hibrido\n- Registro eletronico de ponto obrigatorio para empresas com mais de 20 funcionarios\n\n### Beneficios\n- Atualizacao do vale-transporte para incluir aplicativos de mobilidade\n- Novas regras para plano de saude empresarial\n\n### Rescisao\n- Prazo para pagamento de verbas rescisorias reduzido para 5 dias uteis\n- Obrigatoriedade de homologacao sindical para empresas com mais de 100 funcionarios\n\n**Recomendacao:** Revise seus contratos de trabalho e politicas internas para garantir conformidade com as novas regras.',
  'alerta',
  'trabalhista',
  true,
  now() - interval '3 days'
FROM law_firms lf
WHERE lf.cnpj IS NOT NULL
LIMIT 1;

INSERT INTO articles (law_firm_id, title, slug, excerpt, content, category, topic, published, published_at)
SELECT
  lf.id,
  'Alerta: Mudancas na Lei de Recuperacao Judicial',
  'mudancas-recuperacao-judicial-2026',
  'Alteracoes significativas na lei de recuperacao judicial entram em vigor. Veja como proteger os creditos da sua empresa.',
  E'## Mudancas na Lei de Recuperacao Judicial\n\nA Lei 14.112/2020, que reformou a Lei de Recuperacao Judicial e Falencias, recebeu novas regulamentacoes que afetam credores e devedores.\n\n### Principais Mudancas\n- Novo prazo para habilitacao de creditos: 30 dias apos publicacao do edital\n- Possibilidade de venda antecipada de ativos em recuperacao\n- Mediacao obrigatoria antes do pedido de falencia para dividas ate R$ 500 mil\n\n### Impacto para Credores\nEmpresas que possuem creditos a receber de empresas em dificuldades financeiras devem ficar atentas aos novos prazos e procedimentos.\n\n### O Que Fazer\n1. Revise sua carteira de clientes inadimplentes\n2. Documente todos os creditos com evidencias robustas\n3. Consulte um advogado especializado em cobranca empresarial\n\n**Entre em contato** para uma analise personalizada da sua situacao.',
  'alerta',
  'cobranca',
  true,
  now() - interval '7 days'
FROM law_firms lf
WHERE lf.cnpj IS NOT NULL
LIMIT 1;

-- 2 Guias
INSERT INTO articles (law_firm_id, title, slug, excerpt, content, category, topic, published, published_at)
SELECT
  lf.id,
  'Guia Completo: Como Prevenir Acoes Trabalhistas',
  'guia-prevenir-acoes-trabalhistas',
  'Um guia pratico com 10 medidas essenciais para reduzir o risco de processos trabalhistas na sua empresa.',
  E'## Guia: Como Prevenir Acoes Trabalhistas\n\nProcessos trabalhistas representam um dos maiores custos para empresas brasileiras. Neste guia, apresentamos 10 medidas praticas para minimizar riscos.\n\n### 1. Contrato de Trabalho Bem Elaborado\nUtilize contratos claros, com descricao detalhada de funcoes, jornada e beneficios.\n\n### 2. Registro de Ponto\nMantenha controle rigoroso de jornada, incluindo horas extras e intervalos.\n\n### 3. Politica de Assedio\nImplemente canal de denuncias e treinamentos periodicos.\n\n### 4. Documentacao de Advertencias\nRegistre formalmente qualquer medida disciplinar.\n\n### 5. Exames Medicos\nRealize admissionais, periodicos e demissionais sem excecao.\n\n### 6. CIPA e Seguranca\nMantenha a CIPA ativa e treinamentos de seguranca em dia.\n\n### 7. Pagamento em Dia\nNunca atrase salarios, ferias ou 13o.\n\n### 8. Equiparacao Salarial\nGaranta salarios equivalentes para funcoes identicas.\n\n### 9. Rescisao Correta\nSiga rigorosamente os prazos e calculos de rescisao.\n\n### 10. Consultoria Preventiva\nMantenha um advogado trabalhista como consultor permanente.',
  'guia',
  'trabalhista',
  true,
  now() - interval '14 days'
FROM law_firms lf
WHERE lf.cnpj IS NOT NULL
LIMIT 1;

INSERT INTO articles (law_firm_id, title, slug, excerpt, content, category, topic, published, published_at)
SELECT
  lf.id,
  'Guia: Constituicao de Holding Familiar para Protecao Patrimonial',
  'guia-holding-familiar-protecao-patrimonial',
  'Entenda como uma holding familiar pode proteger o patrimonio da sua familia e otimizar a carga tributaria.',
  E'## Holding Familiar: Protecao Patrimonial\n\nA constituicao de uma holding familiar e uma das estrategias mais eficazes para protecao patrimonial e planejamento sucessorio.\n\n### O Que e uma Holding Familiar?\nE uma empresa criada para concentrar o patrimonio de uma familia, separando bens pessoais da atividade empresarial.\n\n### Vantagens\n- **Protecao patrimonial**: Blindagem contra riscos empresariais\n- **Planejamento sucessorio**: Evita inventario e reduz custos\n- **Economia tributaria**: Aliquotas mais favoraveis sobre rendimentos\n- **Gestao centralizada**: Facilita administracao dos bens\n\n### Quando Constituir?\n- Patrimonio familiar acima de R$ 2 milhoes\n- Familia com multiplas fontes de renda\n- Socios em empresas de risco\n- Planejamento de sucessao empresarial\n\n### Etapas\n1. Levantamento patrimonial completo\n2. Analise tributaria comparativa\n3. Elaboracao do contrato social\n4. Integralizacao dos bens\n5. Clausulas de protecao (inalienabilidade, impenhorabilidade)\n\n**Agende uma consulta** para avaliar se a holding e a melhor estrategia para sua familia.',
  'guia',
  'empresarial',
  true,
  now() - interval '21 days'
FROM law_firms lf
WHERE lf.cnpj IS NOT NULL
LIMIT 1;

-- 2 Artigos
INSERT INTO articles (law_firm_id, title, slug, excerpt, content, category, topic, published, published_at)
SELECT
  lf.id,
  'A Importancia da Compliance Trabalhista para PMEs',
  'compliance-trabalhista-pmes',
  'Por que pequenas e medias empresas devem investir em programas de compliance trabalhista e como implementar.',
  E'## Compliance Trabalhista para PMEs\n\nMuitas pequenas e medias empresas acreditam que compliance e algo exclusivo de grandes corporacoes. Esse e um erro que pode custar caro.\n\n### O Cenario Atual\nSegundo o TST, o Brasil registrou mais de 3 milhoes de processos trabalhistas em 2025. PMEs respondem por cerca de 60% dessas acoes.\n\n### O Que e Compliance Trabalhista?\nE o conjunto de praticas e procedimentos que garantem o cumprimento da legislacao trabalhista pela empresa.\n\n### Beneficios para PMEs\n- Reducao de passivos trabalhistas em ate 70%\n- Melhoria no clima organizacional\n- Atracao e retencao de talentos\n- Credibilidade perante parceiros e clientes\n\n### Como Implementar\n1. **Diagnostico**: Auditoria das praticas atuais\n2. **Politicas**: Criacao de manuais e codigos de conduta\n3. **Treinamento**: Capacitacao de gestores e equipe de RH\n4. **Monitoramento**: Auditoria periodica e canal de denuncias\n5. **Correcao**: Ajuste continuo de processos\n\n### Custo x Investimento\nO investimento em compliance e significativamente menor que o custo de um unico processo trabalhista, que pode chegar a R$ 50 mil em media.\n\nInvista em prevencao. **Fale conosco** para um diagnostico gratuito.',
  'artigo',
  'trabalhista',
  true,
  now() - interval '30 days'
FROM law_firms lf
WHERE lf.cnpj IS NOT NULL
LIMIT 1;

INSERT INTO articles (law_firm_id, title, slug, excerpt, content, category, topic, published, published_at)
SELECT
  lf.id,
  'Cobranca Empresarial: Estrategias Juridicas para Recuperar Creditos',
  'cobranca-empresarial-estrategias-juridicas',
  'Conhera as principais ferramentas juridicas disponiveis para empresas que precisam recuperar creditos de forma eficiente.',
  E'## Cobranca Empresarial: Estrategias Juridicas\n\nA inadimplencia e um dos maiores desafios para empresas brasileiras. Conhecer as ferramentas juridicas disponiveis e essencial para uma recuperacao eficiente de creditos.\n\n### Fase Extrajudicial\n- **Notificacao formal**: Primeiro passo para constituir o devedor em mora\n- **Negociacao**: Proposta de parcelamento com garantias\n- **Protesto de titulos**: Inclusao em cartorio e orgaos de protecao ao credito\n\n### Fase Judicial\n- **Acao de cobranca**: Para dividas sem titulo executivo\n- **Acao de execucao**: Para titulos executivos (duplicatas, cheques, notas promissorias)\n- **Acao monitoria**: Para documentos sem forca executiva\n\n### Ferramentas de Garantia\n- Penhora online (SISBAJUD)\n- Penhora de imoveis e veiculos\n- Desconsideracao da personalidade juridica\n\n### Prescricao: Atencao aos Prazos\n- Cheques: 6 meses\n- Duplicatas: 3 anos\n- Contratos: 5 anos (regra geral)\n- Titulos executivos judiciais: 5 anos\n\n### Dicas Praticas\n1. Nao deixe a divida envelhecer — quanto antes agir, maior a chance de recuperacao\n2. Documente toda a relacao comercial\n3. Utilize contratos com clausulas de garantia\n4. Considere seguro de credito para grandes operacoes\n\n**Consulte nossa equipe** para definir a melhor estrategia de cobranca para sua empresa.',
  'artigo',
  'cobranca',
  true,
  now() - interval '45 days'
FROM law_firms lf
WHERE lf.cnpj IS NOT NULL
LIMIT 1;
