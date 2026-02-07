/**
 * seed-operations.mjs — Tasks, time_entries, documents, messages, pipeline
 */

import {
  FIRM_A_ID, FIRM_B_ID,
  dateOnly, daysAgo, daysFromNow, timestampAt,
  upsertRows, replaceRows, log,
} from './_shared.mjs';

export async function seed(supabase, ctx) {
  const mod = 'seed-operations';
  let total = 0;

  try {
    const A = ctx.firmAUsers;
    const B = ctx.firmBUsers;

    // ------------------------------------------------------------------
    // 1. Tasks (Firm A: 10, Firm B: 6)
    // ------------------------------------------------------------------
    const tasks = [
      // Firm A — mix of statuses and due dates
      { id: 'a1000001-0001-4001-8001-a10000010001', law_firm_id: FIRM_A_ID, matter_id: 'a0000001-0001-4001-8001-a00000010001', title: 'Preparar petição inicial', description: 'Redigir petição inicial da ação de cobrança', task_type: 'deadline', priority: 'high', status: 'completed', due_date: daysAgo(10), completed_date: daysAgo(8), assigned_to: A.lawyer, is_billable: true, estimated_hours: 4.0, created_by: A.admin },
      { id: 'a1000001-0002-4001-8001-a10000010002', law_firm_id: FIRM_A_ID, matter_id: 'a0000001-0001-4001-8001-a00000010001', title: 'Protocolar petição no tribunal', description: 'Protocolar via PJe a petição inicial', task_type: 'deadline', priority: 'high', status: 'completed', due_date: daysAgo(7), completed_date: daysAgo(6), assigned_to: A.staff, is_billable: false, estimated_hours: 1.0, created_by: A.lawyer },
      { id: 'a1000001-0003-4001-8001-a10000010003', law_firm_id: FIRM_A_ID, matter_id: 'a0000001-0002-4001-8001-a00000010002', title: 'Reunião com cliente Ferreira', description: 'Reunião para discutir estratégia da reclamação trabalhista', task_type: 'client_meeting', priority: 'medium', status: 'in_progress', due_date: daysFromNow(2), assigned_to: A.lawyer, is_billable: true, estimated_hours: 2.0, created_by: A.admin },
      { id: 'a1000001-0004-4001-8001-a10000010004', law_firm_id: FIRM_A_ID, matter_id: 'a0000001-0003-4001-8001-a00000010003', title: 'Analisar provas da defesa', description: 'Revisar documentos e provas do processo criminal', task_type: 'document_review', priority: 'urgent', status: 'in_progress', due_date: daysFromNow(5), assigned_to: A.lawyer2 || A.lawyer, is_billable: true, estimated_hours: 6.0, created_by: A.admin },
      { id: 'a1000001-0005-4001-8001-a10000010005', law_firm_id: FIRM_A_ID, matter_id: 'a0000001-0003-4001-8001-a00000010003', title: 'Preparar alegações finais', description: 'Redigir alegações finais para audiência', task_type: 'deadline', priority: 'urgent', status: 'in_progress', due_date: daysFromNow(6), assigned_to: A.lawyer2 || A.lawyer, is_billable: true, estimated_hours: 8.0, created_by: A.admin },
      { id: 'a1000001-0006-4001-8001-a10000010006', law_firm_id: FIRM_A_ID, matter_id: 'a0000001-0004-4001-8001-a00000010004', title: 'Solicitar documentos ao INSS', description: 'Requerer CNIS e carta de concessão', task_type: 'general', priority: 'medium', status: 'pending', due_date: daysFromNow(10), assigned_to: A.staff, is_billable: false, estimated_hours: 2.0, created_by: A.lawyer },
      { id: 'a1000001-0007-4001-8001-a10000010007', law_firm_id: FIRM_A_ID, matter_id: 'a0000001-0001-4001-8001-a00000010001', title: 'Audiência de conciliação', description: 'Comparecer à audiência de conciliação no Fórum', task_type: 'court_date', priority: 'high', status: 'pending', due_date: daysFromNow(14), assigned_to: A.lawyer, is_billable: true, estimated_hours: 3.0, created_by: A.admin },
      { id: 'a1000001-0008-4001-8001-a10000010008', law_firm_id: FIRM_A_ID, matter_id: 'a0000001-0002-4001-8001-a00000010002', title: 'Atualizar cálculos trabalhistas', description: 'Atualizar planilha de cálculos com juros e correção', task_type: 'general', priority: 'medium', status: 'pending', due_date: daysFromNow(20), assigned_to: A.staff, is_billable: true, estimated_hours: 3.0, created_by: A.lawyer },
      // Overdue tasks
      { id: 'a1000001-0009-4001-8001-a10000010009', law_firm_id: FIRM_A_ID, matter_id: 'a0000001-0004-4001-8001-a00000010004', title: 'Entregar procuração ao INSS', description: 'Procuração com firma reconhecida para representação', task_type: 'deadline', priority: 'high', status: 'pending', due_date: daysAgo(3), assigned_to: A.staff, is_billable: false, estimated_hours: 1.0, created_by: A.lawyer },
      { id: 'a1000001-0010-4001-8001-a10000010010', law_firm_id: FIRM_A_ID, matter_id: 'a0000001-0006-4001-8001-a00000010006', title: 'Contatar parte adversa para acordo', description: 'Ligar para advogado da parte adversa propondo acordo', task_type: 'general', priority: 'low', status: 'pending', due_date: daysAgo(5), assigned_to: A.lawyer2 || A.lawyer, is_billable: false, estimated_hours: 1.0, created_by: A.admin },

      // Firm B — 6 tasks
      { id: 'b8b8b8b8-0001-0001-0001-b8b8b8b8b8b8', law_firm_id: FIRM_B_ID, matter_id: 'b6b6b6b6-0001-0001-0001-b6b6b6b6b6b6', title: 'Levantar matrícula do imóvel', description: 'Solicitar certidão de matrícula atualizada no RGI', task_type: 'general', priority: 'high', status: 'completed', due_date: daysAgo(5), completed_date: daysAgo(4), assigned_to: B.staff, is_billable: false, estimated_hours: 2.0, created_by: B.lawyer },
      { id: 'b8b8b8b8-0002-0002-0002-b8b8b8b8b8b8', law_firm_id: FIRM_B_ID, matter_id: 'b6b6b6b6-0002-0002-0002-b6b6b6b6b6b6', title: 'Preparar contrato social', description: 'Redigir minuta do novo contrato social pós-incorporação', task_type: 'document_review', priority: 'medium', status: 'in_progress', due_date: daysFromNow(8), assigned_to: B.lawyer, is_billable: true, estimated_hours: 5.0, created_by: B.admin },
      { id: 'b1000001-0003-4001-8001-b10000010003', law_firm_id: FIRM_B_ID, matter_id: 'b0000001-0003-4001-8001-b00000010003', title: 'Analisar auto de infração', description: 'Revisar detalhes do auto de infração da Receita', task_type: 'document_review', priority: 'urgent', status: 'in_progress', due_date: daysFromNow(3), assigned_to: B.lawyer, is_billable: true, estimated_hours: 4.0, created_by: B.admin },
      { id: 'b1000001-0004-4001-8001-b10000010004', law_firm_id: FIRM_B_ID, matter_id: 'b6b6b6b6-0001-0001-0001-b6b6b6b6b6b6', title: 'Audiência de instrução', description: 'Comparecer à audiência de instrução no TJ-RJ', task_type: 'court_date', priority: 'high', status: 'pending', due_date: daysFromNow(10), assigned_to: B.lawyer, is_billable: true, estimated_hours: 3.0, created_by: B.admin },
      { id: 'b1000001-0005-4001-8001-b10000010005', law_firm_id: FIRM_B_ID, matter_id: 'b0000001-0003-4001-8001-b00000010003', title: 'Preparar impugnação fiscal', description: 'Redigir impugnação ao auto de infração', task_type: 'deadline', priority: 'high', status: 'pending', due_date: daysFromNow(15), assigned_to: B.lawyer, is_billable: true, estimated_hours: 6.0, created_by: B.admin },
      // Overdue
      { id: 'b1000001-0006-4001-8001-b10000010006', law_firm_id: FIRM_B_ID, matter_id: 'b6b6b6b6-0002-0002-0002-b6b6b6b6b6b6', title: 'Enviar documentos para Junta Comercial', description: 'Protocolar alteração contratual na JUCERJA', task_type: 'deadline', priority: 'medium', status: 'pending', due_date: daysAgo(2), assigned_to: B.staff, is_billable: false, estimated_hours: 1.5, created_by: B.lawyer },
    ];
    let r = await upsertRows(supabase, 'tasks', tasks);
    if (r.error) throw new Error(`tasks: ${r.error.message}`);
    total += r.count;
    log(`tasks: ${r.count} rows`);

    // ------------------------------------------------------------------
    // 2. Time Entries (Firm A: 10, Firm B: 6)
    // ------------------------------------------------------------------
    const timeEntries = [
      // Firm A
      { id: 'a2000001-0001-4001-8001-a20000010001', law_firm_id: FIRM_A_ID, matter_id: 'a0000001-0001-4001-8001-a00000010001', user_id: A.lawyer, description: 'Pesquisa jurisprudencial sobre cobrança', hours_worked: 3.0, work_date: dateOnly(-15), hourly_rate: 350.00, is_billable: true },
      { id: 'a2000001-0002-4001-8001-a20000010002', law_firm_id: FIRM_A_ID, matter_id: 'a0000001-0001-4001-8001-a00000010001', user_id: A.lawyer, description: 'Redação da petição inicial', hours_worked: 4.5, work_date: dateOnly(-12), hourly_rate: 350.00, is_billable: true },
      { id: 'a2000001-0003-4001-8001-a20000010003', law_firm_id: FIRM_A_ID, matter_id: 'a0000001-0002-4001-8001-a00000010002', user_id: A.lawyer, description: 'Reunião com Juliana Ferreira', hours_worked: 1.5, work_date: dateOnly(-10), hourly_rate: 300.00, is_billable: true },
      { id: 'a2000001-0004-4001-8001-a20000010004', law_firm_id: FIRM_A_ID, matter_id: 'a0000001-0002-4001-8001-a00000010002', user_id: A.staff, description: 'Organização de documentos trabalhistas', hours_worked: 2.0, work_date: dateOnly(-8), hourly_rate: 150.00, is_billable: false },
      { id: 'a2000001-0005-4001-8001-a20000010005', law_firm_id: FIRM_A_ID, matter_id: 'a0000001-0003-4001-8001-a00000010003', user_id: A.lawyer2 || A.lawyer, description: 'Análise do inquérito policial', hours_worked: 5.0, work_date: dateOnly(-7), hourly_rate: 400.00, is_billable: true },
      { id: 'a2000001-0006-4001-8001-a20000010006', law_firm_id: FIRM_A_ID, matter_id: 'a0000001-0003-4001-8001-a00000010003', user_id: A.lawyer2 || A.lawyer, description: 'Preparação de memoriais', hours_worked: 3.5, work_date: dateOnly(-5), hourly_rate: 400.00, is_billable: true },
      { id: 'a2000001-0007-4001-8001-a20000010007', law_firm_id: FIRM_A_ID, matter_id: 'a0000001-0004-4001-8001-a00000010004', user_id: A.lawyer, description: 'Análise de CNIS e tempo de contribuição', hours_worked: 2.0, work_date: dateOnly(-4), hourly_rate: 280.00, is_billable: true },
      { id: 'a2000001-0008-4001-8001-a20000010008', law_firm_id: FIRM_A_ID, matter_id: 'a0000001-0001-4001-8001-a00000010001', user_id: A.staff, description: 'Protocolo eletrônico via PJe', hours_worked: 0.5, work_date: dateOnly(-6), hourly_rate: 150.00, is_billable: false },
      { id: 'a2000001-0009-4001-8001-a20000010009', law_firm_id: FIRM_A_ID, matter_id: 'a0000001-0006-4001-8001-a00000010006', user_id: A.lawyer2 || A.lawyer, description: 'Ligações para parte adversa', hours_worked: 1.0, work_date: dateOnly(-3), hourly_rate: 300.00, is_billable: false },
      { id: 'a2000001-0010-4001-8001-a20000010010', law_firm_id: FIRM_A_ID, matter_id: 'a0000001-0004-4001-8001-a00000010004', user_id: A.staff, description: 'Digitalização de documentos INSS', hours_worked: 1.5, work_date: dateOnly(-2), hourly_rate: 150.00, is_billable: false },
      // Firm B
      { id: 'b9b9b9b9-0001-0001-0001-b9b9b9b9b9b9', law_firm_id: FIRM_B_ID, matter_id: 'b6b6b6b6-0001-0001-0001-b6b6b6b6b6b6', user_id: B.lawyer, description: 'Pesquisa jurisprudencial sobre usucapião extraordinário', hours_worked: 3.5, work_date: dateOnly(-14), hourly_rate: 400.00, is_billable: true },
      { id: 'b9b9b9b9-0002-0002-0002-b9b9b9b9b9b9', law_firm_id: FIRM_B_ID, matter_id: 'b6b6b6b6-0002-0002-0002-b6b6b6b6b6b6', user_id: B.lawyer, description: 'Reunião com sócios sobre incorporação', hours_worked: 2.0, work_date: dateOnly(-10), hourly_rate: 500.00, is_billable: true },
      { id: 'a2000002-0003-4001-8001-a20000020003', law_firm_id: FIRM_B_ID, matter_id: 'b0000001-0003-4001-8001-b00000010003', user_id: B.lawyer, description: 'Análise do auto de infração fiscal', hours_worked: 4.0, work_date: dateOnly(-7), hourly_rate: 450.00, is_billable: true },
      { id: 'a2000002-0004-4001-8001-a20000020004', law_firm_id: FIRM_B_ID, matter_id: 'b6b6b6b6-0001-0001-0001-b6b6b6b6b6b6', user_id: B.staff, description: 'Solicitação de certidão no cartório', hours_worked: 1.5, work_date: dateOnly(-5), hourly_rate: 200.00, is_billable: false },
      { id: 'a2000002-0005-4001-8001-a20000020005', law_firm_id: FIRM_B_ID, matter_id: 'b6b6b6b6-0002-0002-0002-b6b6b6b6b6b6', user_id: B.lawyer, description: 'Redação de minuta contratual', hours_worked: 3.0, work_date: dateOnly(-3), hourly_rate: 500.00, is_billable: true },
      { id: 'a2000002-0006-4001-8001-a20000020006', law_firm_id: FIRM_B_ID, matter_id: 'b0000001-0003-4001-8001-b00000010003', user_id: B.lawyer, description: 'Pesquisa sobre precedentes fiscais', hours_worked: 2.5, work_date: dateOnly(-1), hourly_rate: 450.00, is_billable: true },
    ];
    r = await upsertRows(supabase, 'time_entries', timeEntries);
    if (r.error) throw new Error(`time_entries: ${r.error.message}`);
    total += r.count;
    log(`time_entries: ${r.count} rows`);

    // ------------------------------------------------------------------
    // 3. Documents (Firm A: 6, Firm B: 5)
    // ------------------------------------------------------------------
    const documents = [
      // Firm A
      { id: 'a3000001-0001-4001-8001-a30000010001', law_firm_id: FIRM_A_ID, matter_id: 'a0000001-0001-4001-8001-a00000010001', name: 'Petição Inicial - Cobrança Horizonte', description: 'Petição inicial protocolada no PJe', document_type: 'petition', category: 'peticoes', access_level: 'internal', file_type: 'pdf', file_size: 245000, created_by: A.lawyer },
      { id: 'a3000001-0002-4001-8001-a30000010002', law_firm_id: FIRM_A_ID, matter_id: 'a0000001-0001-4001-8001-a00000010001', name: 'Contrato de Prestação de Serviços', description: 'Contrato original entre as partes', document_type: 'contract', category: 'contratos', access_level: 'confidential', file_type: 'pdf', file_size: 180000, created_by: A.lawyer },
      { id: 'a3000001-0003-4001-8001-a30000010003', law_firm_id: FIRM_A_ID, matter_id: 'a0000001-0002-4001-8001-a00000010002', name: 'Carteira de Trabalho - Ferreira', description: 'Cópia digitalizada da CTPS', document_type: 'evidence', category: 'documentos_pessoais', access_level: 'restricted', file_type: 'pdf', file_size: 520000, created_by: A.staff },
      { id: 'a3000001-0004-4001-8001-a30000010004', law_firm_id: FIRM_A_ID, matter_id: 'a0000001-0003-4001-8001-a00000010003', name: 'Boletim de Ocorrência', description: 'BO registrado na delegacia', document_type: 'evidence', category: 'provas', access_level: 'confidential', file_type: 'pdf', file_size: 95000, created_by: A.lawyer2 || A.lawyer },
      { id: 'a3000001-0005-4001-8001-a30000010005', law_firm_id: FIRM_A_ID, matter_id: 'a0000001-0004-4001-8001-a00000010004', name: 'CNIS - Fernanda Lima', description: 'Cadastro Nacional de Informações Sociais', document_type: 'official', category: 'documentos_oficiais', access_level: 'internal', file_type: 'pdf', file_size: 340000, created_by: A.staff },
      { id: 'a3000001-0006-4001-8001-a30000010006', law_firm_id: FIRM_A_ID, name: 'Modelo de Procuração', description: 'Template padrão de procuração do escritório', document_type: 'template', category: 'modelos', access_level: 'public', file_type: 'docx', file_size: 45000, created_by: A.admin },
      // Firm B
      { id: 'bcbcbcbc-0001-0001-0001-bcbcbcbcbcbc', law_firm_id: FIRM_B_ID, matter_id: 'b6b6b6b6-0001-0001-0001-b6b6b6b6b6b6', name: 'Certidão de Matrícula Atualizada', description: 'Matrícula do imóvel objeto da ação de usucapião', document_type: 'evidence', category: 'documentos_imovel', access_level: 'internal', file_type: 'pdf', file_size: 120000, created_by: B.staff },
      { id: 'a3000002-0002-4001-8001-a30000020002', law_firm_id: FIRM_B_ID, matter_id: 'b6b6b6b6-0001-0001-0001-b6b6b6b6b6b6', name: 'Comprovante de Posse', description: 'Declaração de vizinhos atestando posse mansa', document_type: 'evidence', category: 'provas', access_level: 'internal', file_type: 'pdf', file_size: 85000, created_by: B.lawyer },
      { id: 'a3000002-0003-4001-8001-a30000020003', law_firm_id: FIRM_B_ID, matter_id: 'b6b6b6b6-0002-0002-0002-b6b6b6b6b6b6', name: 'Contrato Social - Tech Solutions', description: 'Contrato social atual da empresa', document_type: 'contract', category: 'contratos', access_level: 'confidential', file_type: 'pdf', file_size: 290000, created_by: B.lawyer },
      { id: 'a3000002-0004-4001-8001-a30000020004', law_firm_id: FIRM_B_ID, matter_id: 'b0000001-0003-4001-8001-b00000010003', name: 'Auto de Infração - Receita Federal', description: 'Cópia do auto de infração lavrado', document_type: 'official', category: 'documentos_oficiais', access_level: 'restricted', file_type: 'pdf', file_size: 410000, created_by: B.lawyer },
      { id: 'a3000002-0005-4001-8001-a30000020005', law_firm_id: FIRM_B_ID, name: 'Modelo de Contrato de Honorários', description: 'Template padrão do escritório', document_type: 'template', category: 'modelos', access_level: 'public', file_type: 'docx', file_size: 52000, created_by: B.admin },
    ];
    r = await upsertRows(supabase, 'documents', documents);
    if (r.error) throw new Error(`documents: ${r.error.message}`);
    total += r.count;
    log(`documents: ${r.count} rows`);

    // ------------------------------------------------------------------
    // 4. Messages (delete + insert for fresh data)
    //    Firm A: 15 msgs across 3 conversations, Firm B: 10 across 2 convos
    // ------------------------------------------------------------------
    const threadA1 = 'aaaaaaaa-0001-4001-8001-000000000a01';
    const threadA2 = 'aaaaaaaa-0002-4001-8001-000000000a02';
    const threadA3 = 'aaaaaaaa-0003-4001-8001-000000000a03';
    const threadB1 = 'bbbbbbbb-0001-4001-8001-000000000b01';
    const threadB2 = 'bbbbbbbb-0002-4001-8001-000000000b02';

    const messages = [
      // Thread A1 — lawyer + staff discussing Cobrança case (5 msgs)
      { id: 'a4000001-0001-4001-8001-a40000010001', law_firm_id: FIRM_A_ID, matter_id: 'a0000001-0001-4001-8001-a00000010001', sender_id: A.lawyer, receiver_id: A.staff, content: 'Ana, preciso que protocole a petição inicial no PJe hoje.', message_type: 'text', sender_type: 'user', receiver_type: 'user', status: 'read', read_at: daysAgo(12), thread_id: threadA1, created_at: daysAgo(13) },
      { id: 'a4000001-0002-4001-8001-a40000010002', law_firm_id: FIRM_A_ID, matter_id: 'a0000001-0001-4001-8001-a00000010001', sender_id: A.staff, receiver_id: A.lawyer, content: 'Pode deixar, Dra. Maria. Vou protocolar assim que receber o PDF final.', message_type: 'text', sender_type: 'user', receiver_type: 'user', status: 'read', read_at: daysAgo(12), thread_id: threadA1, created_at: daysAgo(13, -1) },
      { id: 'a4000001-0003-4001-8001-a40000010003', law_firm_id: FIRM_A_ID, matter_id: 'a0000001-0001-4001-8001-a00000010001', sender_id: A.lawyer, receiver_id: A.staff, content: 'Acabei de enviar. Confirme quando protocolar, por favor.', message_type: 'text', sender_type: 'user', receiver_type: 'user', status: 'read', read_at: daysAgo(11), thread_id: threadA1, created_at: daysAgo(12) },
      { id: 'a4000001-0004-4001-8001-a40000010004', law_firm_id: FIRM_A_ID, matter_id: 'a0000001-0001-4001-8001-a00000010001', sender_id: A.staff, receiver_id: A.lawyer, content: 'Protocolado com sucesso! Número do protocolo: 2025.0001234-5', message_type: 'text', sender_type: 'user', receiver_type: 'user', status: 'read', read_at: daysAgo(11), thread_id: threadA1, created_at: daysAgo(11) },
      { id: 'a4000001-0005-4001-8001-a40000010005', law_firm_id: FIRM_A_ID, matter_id: 'a0000001-0001-4001-8001-a00000010001', sender_id: A.lawyer, receiver_id: A.staff, content: 'Excelente, obrigada! Agora vamos aguardar a citação.', message_type: 'text', sender_type: 'user', receiver_type: 'user', status: 'read', read_at: daysAgo(10), thread_id: threadA1, created_at: daysAgo(11, -1) },

      // Thread A2 — admin + lawyer discussing general matters (5 msgs)
      { id: 'a4000001-0006-4001-8001-a40000010006', law_firm_id: FIRM_A_ID, sender_id: A.admin, receiver_id: A.lawyer, content: 'Maria, como está o andamento dos processos desta semana?', message_type: 'text', sender_type: 'user', receiver_type: 'user', status: 'read', read_at: daysAgo(5), thread_id: threadA2, created_at: daysAgo(6) },
      { id: 'a4000001-0007-4001-8001-a40000010007', law_firm_id: FIRM_A_ID, sender_id: A.lawyer, receiver_id: A.admin, content: 'Robson, temos 3 audiências marcadas. A mais urgente é a do caso criminal do Almeida.', message_type: 'text', sender_type: 'user', receiver_type: 'user', status: 'read', read_at: daysAgo(5), thread_id: threadA2, created_at: daysAgo(6, -1) },
      { id: 'a4000001-0008-4001-8001-a40000010008', law_firm_id: FIRM_A_ID, sender_id: A.admin, receiver_id: A.lawyer, content: 'Entendido. Vamos priorizar as alegações finais. Precisa de apoio?', message_type: 'text', sender_type: 'user', receiver_type: 'user', status: 'read', read_at: daysAgo(4), thread_id: threadA2, created_at: daysAgo(5) },
      { id: 'a4000001-0009-4001-8001-a40000010009', law_firm_id: FIRM_A_ID, sender_id: A.lawyer, receiver_id: A.admin, content: 'O Carlos Santos já está trabalhando nisso. Deve terminar até sexta.', message_type: 'text', sender_type: 'user', receiver_type: 'user', status: 'read', read_at: daysAgo(4), thread_id: threadA2, created_at: daysAgo(5, -1) },
      { id: 'a4000001-0010-4001-8001-a40000010010', law_firm_id: FIRM_A_ID, sender_id: A.admin, receiver_id: A.lawyer, content: 'Perfeito. Me avise se precisar de algo.', message_type: 'text', sender_type: 'user', receiver_type: 'user', status: 'delivered', thread_id: threadA2, created_at: daysAgo(4) },

      // Thread A3 — recent msgs with unread (5 msgs)
      { id: 'a4000001-0011-4001-8001-a40000010011', law_firm_id: FIRM_A_ID, matter_id: 'a0000001-0003-4001-8001-a00000010003', sender_id: A.lawyer2 || A.lawyer, receiver_id: A.admin, content: 'Dr. Robson, encontrei um precedente favorável para o caso Almeida.', message_type: 'text', sender_type: 'user', receiver_type: 'user', status: 'read', read_at: daysAgo(1), thread_id: threadA3, created_at: daysAgo(2) },
      { id: 'a4000001-0012-4001-8001-a40000010012', law_firm_id: FIRM_A_ID, matter_id: 'a0000001-0003-4001-8001-a00000010003', sender_id: A.admin, receiver_id: A.lawyer2 || A.lawyer, content: 'Ótimo! Pode incluir nas alegações finais.', message_type: 'text', sender_type: 'user', receiver_type: 'user', status: 'read', read_at: daysAgo(1), thread_id: threadA3, created_at: daysAgo(2, -1) },
      { id: 'a4000001-0013-4001-8001-a40000010013', law_firm_id: FIRM_A_ID, matter_id: 'a0000001-0003-4001-8001-a00000010003', sender_id: A.lawyer2 || A.lawyer, receiver_id: A.admin, content: 'Já incluí. Vou enviar o rascunho para sua revisão.', message_type: 'text', sender_type: 'user', receiver_type: 'user', status: 'sent', thread_id: threadA3, created_at: daysAgo(1) },
      { id: 'a4000001-0014-4001-8001-a40000010014', law_firm_id: FIRM_A_ID, matter_id: 'a0000001-0003-4001-8001-a00000010003', sender_id: A.lawyer2 || A.lawyer, receiver_id: A.admin, content: 'Segue o documento em anexo para análise.', message_type: 'file', sender_type: 'user', receiver_type: 'user', status: 'sent', attachments: JSON.stringify([{ name: 'alegacoes-finais-v2.pdf', size: 320000, type: 'application/pdf' }]), thread_id: threadA3, created_at: daysAgo(0, 10) },
      { id: 'a4000001-0015-4001-8001-a40000010015', law_firm_id: FIRM_A_ID, sender_id: null, receiver_id: null, content: 'Lembrete: audiência do caso Cobrança Horizonte em 2 semanas.', message_type: 'system', sender_type: 'system', status: 'sent', thread_id: threadA3, created_at: daysAgo(0, 8) },

      // Thread B1 — Firm B lawyer + admin (6 msgs)
      { id: 'a4000002-0001-4001-8001-a40000020001', law_firm_id: FIRM_B_ID, matter_id: 'b6b6b6b6-0001-0001-0001-b6b6b6b6b6b6', sender_id: B.lawyer, receiver_id: B.admin, content: 'Mariana, consegui a certidão de matrícula atualizada do imóvel.', message_type: 'text', sender_type: 'user', receiver_type: 'user', status: 'read', read_at: daysAgo(3), thread_id: threadB1, created_at: daysAgo(4) },
      { id: 'a4000002-0002-4001-8001-a40000020002', law_firm_id: FIRM_B_ID, matter_id: 'b6b6b6b6-0001-0001-0001-b6b6b6b6b6b6', sender_id: B.admin, receiver_id: B.lawyer, content: 'Ótimo, Rafael! Podemos avançar com a petição de usucapião.', message_type: 'text', sender_type: 'user', receiver_type: 'user', status: 'read', read_at: daysAgo(3), thread_id: threadB1, created_at: daysAgo(4, -1) },
      { id: 'a4000002-0003-4001-8001-a40000020003', law_firm_id: FIRM_B_ID, matter_id: 'b6b6b6b6-0001-0001-0001-b6b6b6b6b6b6', sender_id: B.lawyer, receiver_id: B.admin, content: 'Vou começar a redigir amanhã. Precisamos ouvir os vizinhos também.', message_type: 'text', sender_type: 'user', receiver_type: 'user', status: 'read', read_at: daysAgo(2), thread_id: threadB1, created_at: daysAgo(3) },
      { id: 'a4000002-0004-4001-8001-a40000020004', law_firm_id: FIRM_B_ID, matter_id: 'b6b6b6b6-0001-0001-0001-b6b6b6b6b6b6', sender_id: B.admin, receiver_id: B.lawyer, content: 'A Fernanda pode agendar as oitivas. Vou pedir a ela.', message_type: 'text', sender_type: 'user', receiver_type: 'user', status: 'read', read_at: daysAgo(2), thread_id: threadB1, created_at: daysAgo(3, -1) },
      { id: 'a4000002-0005-4001-8001-a40000020005', law_firm_id: FIRM_B_ID, matter_id: 'b6b6b6b6-0001-0001-0001-b6b6b6b6b6b6', sender_id: B.staff, receiver_id: B.lawyer, content: 'Rafael, agendei visitas aos vizinhos para quinta e sexta.', message_type: 'text', sender_type: 'user', receiver_type: 'user', status: 'sent', thread_id: threadB1, created_at: daysAgo(1) },
      { id: 'a4000002-0006-4001-8001-a40000020006', law_firm_id: FIRM_B_ID, matter_id: 'b6b6b6b6-0001-0001-0001-b6b6b6b6b6b6', sender_id: B.lawyer, receiver_id: B.staff, content: 'Perfeito, Fernanda! Vou preparar o roteiro de perguntas.', message_type: 'text', sender_type: 'user', receiver_type: 'user', status: 'sent', thread_id: threadB1, created_at: daysAgo(1, -1) },

      // Thread B2 — Firm B about tax case (4 msgs)
      { id: 'a4000002-0007-4001-8001-a40000020007', law_firm_id: FIRM_B_ID, matter_id: 'b0000001-0003-4001-8001-b00000010003', sender_id: B.lawyer, receiver_id: B.admin, content: 'O auto de infração da Imobiliária Carioca é de R$ 450.000. Prazo curto.', message_type: 'text', sender_type: 'user', receiver_type: 'user', status: 'read', read_at: daysAgo(1), thread_id: threadB2, created_at: daysAgo(2) },
      { id: 'a4000002-0008-4001-8001-a40000020008', law_firm_id: FIRM_B_ID, matter_id: 'b0000001-0003-4001-8001-b00000010003', sender_id: B.admin, receiver_id: B.lawyer, content: 'Valor alto. Qual é a nossa estratégia de defesa?', message_type: 'text', sender_type: 'user', receiver_type: 'user', status: 'read', read_at: daysAgo(1), thread_id: threadB2, created_at: daysAgo(2, -1) },
      { id: 'a4000002-0009-4001-8001-a40000020009', law_firm_id: FIRM_B_ID, matter_id: 'b0000001-0003-4001-8001-b00000010003', sender_id: B.lawyer, receiver_id: B.admin, content: 'Vou questionar a base de cálculo. Há inconsistências nos valores apurados.', message_type: 'text', sender_type: 'user', receiver_type: 'user', status: 'sent', thread_id: threadB2, created_at: daysAgo(1) },
      { id: 'a4000002-0010-4001-8001-a40000020010', law_firm_id: FIRM_B_ID, matter_id: 'b0000001-0003-4001-8001-b00000010003', sender_id: B.admin, receiver_id: B.lawyer, content: 'Priorize isso. Informe o cliente sobre os próximos passos.', message_type: 'text', sender_type: 'user', receiver_type: 'user', status: 'sent', thread_id: threadB2, created_at: daysAgo(0, 14) },
    ];
    r = await replaceRows(supabase, 'messages', 'law_firm_id', [FIRM_A_ID, FIRM_B_ID], messages);
    if (r.error) throw new Error(`messages: ${r.error.message}`);
    total += r.count;
    log(`messages: ${r.count} rows`);

    // ------------------------------------------------------------------
    // 5. Pipeline Stages (Firm A: 5, Firm B: 4)
    // ------------------------------------------------------------------
    const pipelineStages = [
      // Firm A
      { id: 'a5000001-0001-4001-8001-a50000010001', law_firm_id: FIRM_A_ID, name: 'Consulta Inicial', description: 'Primeira consulta com potencial cliente', color: '#3B82F6', stage_type: 'intake', sort_order: 1, is_active: true, created_by: A.admin },
      { id: 'a5000001-0002-4001-8001-a50000010002', law_firm_id: FIRM_A_ID, name: 'Análise do Caso', description: 'Avaliação da viabilidade jurídica', color: '#8B5CF6', stage_type: 'intake', sort_order: 2, is_active: true, created_by: A.admin },
      { id: 'a5000001-0003-4001-8001-a50000010003', law_firm_id: FIRM_A_ID, name: 'Proposta de Honorários', description: 'Proposta enviada ao cliente', color: '#F59E0B', stage_type: 'intake', sort_order: 3, is_active: true, created_by: A.admin },
      { id: 'a5000001-0004-4001-8001-a50000010004', law_firm_id: FIRM_A_ID, name: 'Contratado', description: 'Cliente contratou o escritório', color: '#10B981', stage_type: 'onboarding', sort_order: 4, is_active: true, is_final_stage: false, created_by: A.admin },
      { id: 'a5000001-0005-4001-8001-a50000010005', law_firm_id: FIRM_A_ID, name: 'Não Contratou', description: 'Cliente optou por não contratar', color: '#EF4444', stage_type: 'not_hired', sort_order: 5, is_active: true, is_final_stage: true, created_by: A.admin },
      // Firm B
      { id: 'bdbdbdbd-0001-0001-0001-bdbdbdbdbdbd', law_firm_id: FIRM_B_ID, name: 'Consulta Inicial', description: 'Primeira consulta com o potencial cliente', color: '#3B82F6', stage_type: 'intake', sort_order: 1, is_active: true, created_by: B.admin },
      { id: 'bdbdbdbd-0002-0002-0002-bdbdbdbdbdbd', law_firm_id: FIRM_B_ID, name: 'Proposta Enviada', description: 'Proposta de honorários enviada', color: '#F59E0B', stage_type: 'intake', sort_order: 2, is_active: true, created_by: B.admin },
      { id: 'bdbdbdbd-0003-0003-0003-bdbdbdbdbdbd', law_firm_id: FIRM_B_ID, name: 'Contratado', description: 'Cliente contratou o escritório', color: '#10B981', stage_type: 'onboarding', sort_order: 3, is_active: true, created_by: B.admin },
      { id: 'a5000002-0004-4001-8001-a50000020004', law_firm_id: FIRM_B_ID, name: 'Não Contratou', description: 'Prospect não fechou', color: '#EF4444', stage_type: 'not_hired', sort_order: 4, is_active: true, is_final_stage: true, created_by: B.admin },
    ];
    r = await upsertRows(supabase, 'pipeline_stages', pipelineStages);
    if (r.error) throw new Error(`pipeline_stages: ${r.error.message}`);
    total += r.count;
    log(`pipeline_stages: ${r.count} rows`);

    // ------------------------------------------------------------------
    // 6. Pipeline Cards (Firm A: 4, Firm B: 3)
    // ------------------------------------------------------------------
    const pipelineCards = [
      // Firm A
      { id: 'a6000001-0001-4001-8001-a60000010001', law_firm_id: FIRM_A_ID, pipeline_stage_id: 'a5000001-0001-4001-8001-a50000010001', title: 'Consulta Inicial - Roberto Nunes', description: 'Empresário busca assessoria em direito tributário', estimated_value: 15000.00, probability: 30, expected_close_date: dateOnly(30), assigned_to: A.lawyer, contact_id: 'cf000001-0005-4001-8001-cf0000010005', source: 'indicacao', created_by: A.admin },
      { id: 'a6000001-0002-4001-8001-a60000010002', law_firm_id: FIRM_A_ID, pipeline_stage_id: 'a5000001-0002-4001-8001-a50000010002', title: 'Caso Trabalhista - Empresa ABC', description: 'Defesa trabalhista para empresa de médio porte', estimated_value: 25000.00, probability: 50, expected_close_date: dateOnly(21), assigned_to: A.lawyer, source: 'site', created_by: A.admin },
      { id: 'a6000001-0003-4001-8001-a60000010003', law_firm_id: FIRM_A_ID, pipeline_stage_id: 'a5000001-0003-4001-8001-a50000010003', title: 'Revisão Contratual - Tech Startup', description: 'Revisão de contratos com investidores', estimated_value: 12000.00, probability: 70, expected_close_date: dateOnly(14), assigned_to: A.lawyer2 || A.lawyer, source: 'evento', created_by: A.admin },
      { id: 'a6000001-0004-4001-8001-a60000010004', law_firm_id: FIRM_A_ID, pipeline_stage_id: 'a5000001-0004-4001-8001-a50000010004', title: 'Defesa Criminal - Silva Jr', description: 'Caso de estelionato — já contratou', estimated_value: 30000.00, probability: 100, expected_close_date: dateOnly(0), assigned_to: A.lawyer2 || A.lawyer, source: 'indicacao', created_by: A.admin },
      // Firm B
      { id: 'a6000002-0001-4001-8001-a60000020001', law_firm_id: FIRM_B_ID, pipeline_stage_id: 'bdbdbdbd-0001-0001-0001-bdbdbdbdbdbd', title: 'Consulta - Grupo Imobiliário ABC', description: 'Grande incorporadora busca assessoria', estimated_value: 50000.00, probability: 40, expected_close_date: dateOnly(45), assigned_to: B.lawyer, source: 'indicacao', created_by: B.admin },
      { id: 'a6000002-0002-4001-8001-a60000020002', law_firm_id: FIRM_B_ID, pipeline_stage_id: 'bdbdbdbd-0002-0002-0002-bdbdbdbdbdbd', title: 'Planejamento Tributário - Clínica Saúde', description: 'Reestruturação fiscal para clínica médica', estimated_value: 20000.00, probability: 60, expected_close_date: dateOnly(20), assigned_to: B.lawyer, source: 'site', created_by: B.admin },
      { id: 'a6000002-0003-4001-8001-a60000020003', law_firm_id: FIRM_B_ID, pipeline_stage_id: 'bdbdbdbd-0003-0003-0003-bdbdbdbdbdbd', title: 'Registro de Imóvel - Família Santos', description: 'Regularização fundiária completa', estimated_value: 8000.00, probability: 100, expected_close_date: dateOnly(7), assigned_to: B.lawyer, source: 'indicacao', created_by: B.admin },
    ];
    r = await upsertRows(supabase, 'pipeline_cards', pipelineCards);
    if (r.error) throw new Error(`pipeline_cards: ${r.error.message}`);
    total += r.count;
    log(`pipeline_cards: ${r.count} rows`);

    return { module: mod, success: true, count: total };
  } catch (err) {
    return { module: mod, success: false, count: total, error: err.message };
  }
}

// Helper: daysAgo with hour offset for ordering messages
function daysAgoH(days, hoursBefore = 0) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(d.getHours() - hoursBefore);
  return d.toISOString();
}
