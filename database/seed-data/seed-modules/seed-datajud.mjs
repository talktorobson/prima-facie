/**
 * seed-datajud.mjs — DataJud CNJ integration tables:
 * case_details, legal_subjects, participants, timeline_events, sync_log
 */

import {
  FIRM_A_ID, FIRM_B_ID,
  dateOnly, daysAgo,
  upsertRows, log,
} from './_shared.mjs';

export async function seed(supabase, ctx) {
  const mod = 'seed-datajud';
  let total = 0;

  try {
    const A = ctx.firmAUsers;
    const B = ctx.firmBUsers;

    // ------------------------------------------------------------------
    // 1. DataJud Case Details (Firm A: 3, Firm B: 2)
    // ------------------------------------------------------------------
    const caseDetails = [
      // Firm A — linked to matters from seed-core
      {
        id: 'b8000001-0001-4001-8001-b80000010001', law_firm_id: FIRM_A_ID,
        matter_id: 'a0000001-0001-4001-8001-a00000010001',
        datajud_case_id: 'DATAJUD-SP-2025-001',
        numero_processo_cnj: '1234567-89.2025.8.26.0100',
        tribunal_alias: 'TJSP', court_instance: 1,
        court_name: '5ª Vara Cível do Foro Central', court_municipality: 'São Paulo',
        court_state: 'SP', court_competence: 'Cível',
        process_class_code: 7, process_class_name: 'Procedimento Comum Cível',
        filing_date: dateOnly(-120), last_update_date: dateOnly(-3),
        case_value: 150000.00, is_confidential: false,
        enrichment_confidence: 0.92, enrichment_status: 'enriched',
        created_by: A.admin,
      },
      {
        id: 'b8000001-0002-4001-8001-b80000010002', law_firm_id: FIRM_A_ID,
        matter_id: 'a0000001-0002-4001-8001-a00000010002',
        datajud_case_id: 'DATAJUD-SP-2025-002',
        numero_processo_cnj: '9876543-21.2025.5.02.0001',
        tribunal_alias: 'TRT2', court_instance: 1,
        court_name: '2ª Vara do Trabalho de São Paulo', court_municipality: 'São Paulo',
        court_state: 'SP', court_competence: 'Trabalhista',
        process_class_code: 1116, process_class_name: 'Reclamação Trabalhista',
        filing_date: dateOnly(-90), last_update_date: dateOnly(-7),
        case_value: 85000.00, is_confidential: false,
        enrichment_confidence: 0.88, enrichment_status: 'enriched',
        created_by: A.admin,
      },
      {
        id: 'b8000001-0003-4001-8001-b80000010003', law_firm_id: FIRM_A_ID,
        matter_id: 'a0000001-0003-4001-8001-a00000010003',
        datajud_case_id: 'DATAJUD-SP-2025-003',
        numero_processo_cnj: '5555666-77.2025.8.26.0001',
        tribunal_alias: 'TJSP', court_instance: 1,
        court_name: '3ª Vara Criminal do Foro Central', court_municipality: 'São Paulo',
        court_state: 'SP', court_competence: 'Criminal',
        process_class_code: 283, process_class_name: 'Ação Penal - Procedimento Ordinário',
        filing_date: dateOnly(-60), last_update_date: dateOnly(-5),
        case_value: 0, is_confidential: true,
        enrichment_confidence: 0.85, enrichment_status: 'enriched',
        created_by: A.admin,
      },
      // Firm B — linked to matters from seed-core
      {
        id: 'b8000002-0001-4001-8001-b80000020001', law_firm_id: FIRM_B_ID,
        matter_id: 'b6b6b6b6-0001-0001-0001-b6b6b6b6b6b6',
        datajud_case_id: 'DATAJUD-RJ-2026-001',
        numero_processo_cnj: '1111222-33.2026.8.19.0001',
        tribunal_alias: 'TJRJ', court_instance: 1,
        court_name: '4ª Vara Cível do Foro Central', court_municipality: 'Rio de Janeiro',
        court_state: 'RJ', court_competence: 'Cível',
        process_class_code: 7, process_class_name: 'Procedimento Comum Cível',
        filing_date: dateOnly(-90), last_update_date: dateOnly(-5),
        case_value: 320000.00, is_confidential: false,
        enrichment_confidence: 0.90, enrichment_status: 'enriched',
        created_by: B.admin,
      },
      {
        id: 'b8000002-0002-4001-8001-b80000020002', law_firm_id: FIRM_B_ID,
        matter_id: 'b0000001-0003-4001-8001-b00000010003',
        datajud_case_id: 'DATAJUD-RJ-2026-002',
        numero_processo_cnj: '3333444-55.2026.4.02.5101',
        tribunal_alias: 'TRF2', court_instance: 1,
        court_name: 'Vara Federal Fiscal do Rio de Janeiro', court_municipality: 'Rio de Janeiro',
        court_state: 'RJ', court_competence: 'Tributária',
        process_class_code: 120, process_class_name: 'Mandado de Segurança Cível',
        filing_date: dateOnly(-30), last_update_date: dateOnly(-2),
        case_value: 450000.00, is_confidential: false,
        enrichment_confidence: 0.93, enrichment_status: 'enriched',
        created_by: B.admin,
      },
    ];
    let r = await upsertRows(supabase, 'datajud_case_details', caseDetails);
    if (r.error) throw new Error(`datajud_case_details: ${r.error.message}`);
    total += r.count;
    log(`datajud_case_details: ${r.count} rows`);

    // ------------------------------------------------------------------
    // 2. Legal Subjects (Firm A: 6, Firm B: 4)
    // ------------------------------------------------------------------
    const legalSubjects = [
      // Case A1 — Cível
      { id: 'b9000001-0001-4001-8001-b90000010001', law_firm_id: FIRM_A_ID, datajud_case_detail_id: 'b8000001-0001-4001-8001-b80000010001', subject_code: 9985, subject_name: 'Prestação de Serviços', is_primary_subject: true },
      { id: 'b9000001-0002-4001-8001-b90000010002', law_firm_id: FIRM_A_ID, datajud_case_detail_id: 'b8000001-0001-4001-8001-b80000010001', subject_code: 6220, subject_name: 'Inadimplemento', is_primary_subject: false },
      // Case A2 — Trabalhista
      { id: 'b9000001-0003-4001-8001-b90000010003', law_firm_id: FIRM_A_ID, datajud_case_detail_id: 'b8000001-0002-4001-8001-b80000010002', subject_code: 2034, subject_name: 'Verbas Rescisórias', is_primary_subject: true },
      { id: 'b9000001-0004-4001-8001-b90000010004', law_firm_id: FIRM_A_ID, datajud_case_detail_id: 'b8000001-0002-4001-8001-b80000010002', subject_code: 2547, subject_name: 'Horas Extras', is_primary_subject: false },
      // Case A3 — Criminal
      { id: 'b9000001-0005-4001-8001-b90000010005', law_firm_id: FIRM_A_ID, datajud_case_detail_id: 'b8000001-0003-4001-8001-b80000010003', subject_code: 3399, subject_name: 'Estelionato', is_primary_subject: true },
      { id: 'b9000001-0006-4001-8001-b90000010006', law_firm_id: FIRM_A_ID, datajud_case_detail_id: 'b8000001-0003-4001-8001-b80000010003', subject_code: 3536, subject_name: 'Crimes contra o patrimônio', is_primary_subject: false },
      // Case B1 — Usucapião
      { id: 'b9000002-0001-4001-8001-b90000020001', law_firm_id: FIRM_B_ID, datajud_case_detail_id: 'b8000002-0001-4001-8001-b80000020001', subject_code: 10432, subject_name: 'Usucapião Extraordinária', is_primary_subject: true },
      { id: 'b9000002-0002-4001-8001-b90000020002', law_firm_id: FIRM_B_ID, datajud_case_detail_id: 'b8000002-0001-4001-8001-b80000020001', subject_code: 10433, subject_name: 'Direitos Reais sobre Imóveis', is_primary_subject: false },
      // Case B2 — Tributário
      { id: 'b9000002-0003-4001-8001-b90000020003', law_firm_id: FIRM_B_ID, datajud_case_detail_id: 'b8000002-0002-4001-8001-b80000020002', subject_code: 7770, subject_name: 'IRPJ/CSLL', is_primary_subject: true },
      { id: 'b9000002-0004-4001-8001-b90000020004', law_firm_id: FIRM_B_ID, datajud_case_detail_id: 'b8000002-0002-4001-8001-b80000020002', subject_code: 7778, subject_name: 'Auto de Infração', is_primary_subject: false },
    ];
    r = await upsertRows(supabase, 'datajud_legal_subjects', legalSubjects);
    if (r.error) throw new Error(`datajud_legal_subjects: ${r.error.message}`);
    total += r.count;
    log(`datajud_legal_subjects: ${r.count} rows`);

    // ------------------------------------------------------------------
    // 3. Case Participants (Firm A: 6, Firm B: 4)
    // ------------------------------------------------------------------
    const participants = [
      // Case A1 — Cobrança
      { id: 'ba000001-0001-4001-8001-ba0000010001', law_firm_id: FIRM_A_ID, datajud_case_detail_id: 'b8000001-0001-4001-8001-b80000010001', participant_name: 'Construtora Horizonte Ltda', participant_cpf_cnpj: '44.555.666/0001-77', participant_type: 'J', case_role: 'ativo', participation_type: 'Autor', matched_contact_id: 'cf000001-0004-4001-8001-cf0000010004', match_confidence: 0.95 },
      { id: 'ba000001-0002-4001-8001-ba0000010002', law_firm_id: FIRM_A_ID, datajud_case_detail_id: 'b8000001-0001-4001-8001-b80000010001', participant_name: 'XYZ Empreendimentos S.A.', participant_cpf_cnpj: '88.999.000/0001-22', participant_type: 'J', case_role: 'passivo', participation_type: 'Réu' },
      // Case A2 — Trabalhista
      { id: 'ba000001-0003-4001-8001-ba0000010003', law_firm_id: FIRM_A_ID, datajud_case_detail_id: 'b8000001-0002-4001-8001-b80000010002', participant_name: 'Juliana Ferreira da Silva', participant_cpf_cnpj: '234.567.890-11', participant_type: 'F', case_role: 'ativo', participation_type: 'Reclamante', matched_contact_id: 'cf000001-0002-4001-8001-cf0000010002', match_confidence: 0.97 },
      { id: 'ba000001-0004-4001-8001-ba0000010004', law_firm_id: FIRM_A_ID, datajud_case_detail_id: 'b8000001-0002-4001-8001-b80000010002', participant_name: 'Empresa ABC Serviços Ltda', participant_type: 'J', case_role: 'passivo', participation_type: 'Reclamada' },
      // Case A3 — Criminal
      { id: 'ba000001-0005-4001-8001-ba0000010005', law_firm_id: FIRM_A_ID, datajud_case_detail_id: 'b8000001-0003-4001-8001-b80000010003', participant_name: 'Ministério Público do Estado de São Paulo', participant_type: 'J', case_role: 'ativo', participation_type: 'Autor' },
      { id: 'ba000001-0006-4001-8001-ba0000010006', law_firm_id: FIRM_A_ID, datajud_case_detail_id: 'b8000001-0003-4001-8001-b80000010003', participant_name: 'Ricardo de Almeida', participant_cpf_cnpj: '345.678.901-22', participant_type: 'F', case_role: 'passivo', participation_type: 'Réu', matched_contact_id: 'cf000001-0003-4001-8001-cf0000010003', match_confidence: 0.98 },
      // Case B1 — Usucapião
      { id: 'ba000002-0001-4001-8001-ba0000020001', law_firm_id: FIRM_B_ID, datajud_case_detail_id: 'b8000002-0001-4001-8001-b80000020001', participant_name: 'Carlos Mendes da Silva', participant_cpf_cnpj: '987.654.321-00', participant_type: 'F', case_role: 'ativo', participation_type: 'Requerente', matched_contact_id: 'b5b5b5b5-0001-0001-0001-b5b5b5b5b5b5', match_confidence: 0.96 },
      { id: 'ba000002-0002-4001-8001-ba0000020002', law_firm_id: FIRM_B_ID, datajud_case_detail_id: 'b8000002-0001-4001-8001-b80000020001', participant_name: 'Herdeiros de João da Silva', participant_type: 'F', case_role: 'passivo', participation_type: 'Requerido' },
      // Case B2 — Tributário
      { id: 'ba000002-0003-4001-8001-ba0000020003', law_firm_id: FIRM_B_ID, datajud_case_detail_id: 'b8000002-0002-4001-8001-b80000020002', participant_name: 'Imobiliária Carioca Ltda', participant_cpf_cnpj: '22.333.444/0001-55', participant_type: 'J', case_role: 'ativo', participation_type: 'Impetrante', matched_contact_id: 'ce000001-0005-4001-8001-ce0000010005', match_confidence: 0.94 },
      { id: 'ba000002-0004-4001-8001-ba0000020004', law_firm_id: FIRM_B_ID, datajud_case_detail_id: 'b8000002-0002-4001-8001-b80000020002', participant_name: 'Delegado da Receita Federal do Brasil', participant_type: 'J', case_role: 'passivo', participation_type: 'Impetrado' },
    ];
    r = await upsertRows(supabase, 'datajud_case_participants', participants);
    if (r.error) throw new Error(`datajud_case_participants: ${r.error.message}`);
    total += r.count;
    log(`datajud_case_participants: ${r.count} rows`);

    // ------------------------------------------------------------------
    // 4. Timeline Events (Firm A: 9, Firm B: 6)
    // ------------------------------------------------------------------
    const events = [
      // Case A1 — 3 events
      { id: 'bb000001-0001-4001-8001-bb0000010001', law_firm_id: FIRM_A_ID, datajud_case_detail_id: 'b8000001-0001-4001-8001-b80000010001', movement_id: 'MOV-A1-001', movement_code: 26, movement_name: 'Distribuição', event_datetime: daysAgo(120), event_category: 'filing', priority_level: 'normal', is_relevant: true, is_visible_timeline: true },
      { id: 'bb000001-0002-4001-8001-bb0000010002', law_firm_id: FIRM_A_ID, datajud_case_detail_id: 'b8000001-0001-4001-8001-b80000010001', movement_id: 'MOV-A1-002', movement_code: 12, movement_name: 'Citação', movement_complement: 'Citação via oficial de justiça', event_datetime: daysAgo(90), event_category: 'notification', priority_level: 'high', is_relevant: true, is_visible_timeline: true },
      { id: 'bb000001-0003-4001-8001-bb0000010003', law_firm_id: FIRM_A_ID, datajud_case_detail_id: 'b8000001-0001-4001-8001-b80000010001', movement_id: 'MOV-A1-003', movement_code: 970, movement_name: 'Audiência Designada', movement_complement: 'Audiência de conciliação designada', event_datetime: daysAgo(3), event_category: 'hearing', priority_level: 'high', is_relevant: true, is_visible_timeline: true },
      // Case A2 — 3 events
      { id: 'bb000001-0004-4001-8001-bb0000010004', law_firm_id: FIRM_A_ID, datajud_case_detail_id: 'b8000001-0002-4001-8001-b80000010002', movement_id: 'MOV-A2-001', movement_code: 26, movement_name: 'Distribuição', event_datetime: daysAgo(90), event_category: 'filing', priority_level: 'normal', is_relevant: true, is_visible_timeline: true },
      { id: 'bb000001-0005-4001-8001-bb0000010005', law_firm_id: FIRM_A_ID, datajud_case_detail_id: 'b8000001-0002-4001-8001-b80000010002', movement_id: 'MOV-A2-002', movement_code: 12, movement_name: 'Notificação', movement_complement: 'Notificação da reclamada', event_datetime: daysAgo(60), event_category: 'notification', priority_level: 'normal', is_relevant: true, is_visible_timeline: true },
      { id: 'bb000001-0006-4001-8001-bb0000010006', law_firm_id: FIRM_A_ID, datajud_case_detail_id: 'b8000001-0002-4001-8001-b80000010002', movement_id: 'MOV-A2-003', movement_code: 970, movement_name: 'Audiência Realizada', movement_complement: 'Audiência inaugural realizada sem acordo', event_datetime: daysAgo(7), event_category: 'hearing', priority_level: 'high', is_relevant: true, is_visible_timeline: true },
      // Case A3 — 3 events
      { id: 'bb000001-0007-4001-8001-bb0000010007', law_firm_id: FIRM_A_ID, datajud_case_detail_id: 'b8000001-0003-4001-8001-b80000010003', movement_id: 'MOV-A3-001', movement_code: 26, movement_name: 'Recebimento da Denúncia', event_datetime: daysAgo(60), event_category: 'filing', priority_level: 'critical', is_relevant: true, is_visible_timeline: true },
      { id: 'bb000001-0008-4001-8001-bb0000010008', law_firm_id: FIRM_A_ID, datajud_case_detail_id: 'b8000001-0003-4001-8001-b80000010003', movement_id: 'MOV-A3-002', movement_code: 12, movement_name: 'Citação do Réu', movement_complement: 'Citação pessoal do acusado', event_datetime: daysAgo(45), event_category: 'notification', priority_level: 'high', is_relevant: true, is_visible_timeline: true },
      { id: 'bb000001-0009-4001-8001-bb0000010009', law_firm_id: FIRM_A_ID, datajud_case_detail_id: 'b8000001-0003-4001-8001-b80000010003', movement_id: 'MOV-A3-003', movement_code: 385, movement_name: 'Resposta à Acusação Apresentada', event_datetime: daysAgo(5), event_category: 'decision', priority_level: 'normal', is_relevant: true, is_visible_timeline: true },
      // Case B1 — 3 events
      { id: 'bb000002-0001-4001-8001-bb0000020001', law_firm_id: FIRM_B_ID, datajud_case_detail_id: 'b8000002-0001-4001-8001-b80000020001', movement_id: 'MOV-B1-001', movement_code: 26, movement_name: 'Distribuição', event_datetime: daysAgo(90), event_category: 'filing', priority_level: 'normal', is_relevant: true, is_visible_timeline: true },
      { id: 'bb000002-0002-4001-8001-bb0000020002', law_firm_id: FIRM_B_ID, datajud_case_detail_id: 'b8000002-0001-4001-8001-b80000020001', movement_id: 'MOV-B1-002', movement_code: 12, movement_name: 'Edital de Citação', movement_complement: 'Citação por edital dos réus desconhecidos', event_datetime: daysAgo(60), event_category: 'notification', priority_level: 'high', is_relevant: true, is_visible_timeline: true },
      { id: 'bb000002-0003-4001-8001-bb0000020003', law_firm_id: FIRM_B_ID, datajud_case_detail_id: 'b8000002-0001-4001-8001-b80000020001', movement_id: 'MOV-B1-003', movement_code: 581, movement_name: 'Perícia Designada', movement_complement: 'Perícia técnica no imóvel designada', event_datetime: daysAgo(5), event_category: 'review', priority_level: 'high', is_relevant: true, is_visible_timeline: true },
      // Case B2 — 3 events
      { id: 'bb000002-0004-4001-8001-bb0000020004', law_firm_id: FIRM_B_ID, datajud_case_detail_id: 'b8000002-0002-4001-8001-b80000020002', movement_id: 'MOV-B2-001', movement_code: 26, movement_name: 'Distribuição', event_datetime: daysAgo(30), event_category: 'filing', priority_level: 'normal', is_relevant: true, is_visible_timeline: true },
      { id: 'bb000002-0005-4001-8001-bb0000020005', law_firm_id: FIRM_B_ID, datajud_case_detail_id: 'b8000002-0002-4001-8001-b80000020002', movement_id: 'MOV-B2-002', movement_code: 36, movement_name: 'Liminar Concedida', movement_complement: 'Suspensão da exigibilidade do crédito tributário', event_datetime: daysAgo(20), event_category: 'decision', priority_level: 'critical', is_relevant: true, is_visible_timeline: true },
      { id: 'bb000002-0006-4001-8001-bb0000020006', law_firm_id: FIRM_B_ID, datajud_case_detail_id: 'b8000002-0002-4001-8001-b80000020002', movement_id: 'MOV-B2-003', movement_code: 12, movement_name: 'Notificação da Autoridade', movement_complement: 'Delegado da Receita Federal notificado', event_datetime: daysAgo(2), event_category: 'notification', priority_level: 'normal', is_relevant: true, is_visible_timeline: true },
    ];
    r = await upsertRows(supabase, 'datajud_timeline_events', events);
    if (r.error) throw new Error(`datajud_timeline_events: ${r.error.message}`);
    total += r.count;
    log(`datajud_timeline_events: ${r.count} rows`);

    // ------------------------------------------------------------------
    // 5. Sync Log (Firm A: 2, Firm B: 1)
    // ------------------------------------------------------------------
    const syncLogs = [
      { id: 'bc000001-0001-4001-8001-bc0000010001', law_firm_id: FIRM_A_ID, sync_type: 'full', sync_status: 'completed', total_cases_processed: 3, successful_cases: 3, failed_cases: 0, started_at: daysAgo(7), completed_at: daysAgo(7), duration_seconds: 45, summary: 'Sincronização completa: 3 processos enriquecidos com sucesso.', api_calls_made: 9, rate_limit_hits: 0, initiated_by: A.admin },
      { id: 'bc000001-0002-4001-8001-bc0000010002', law_firm_id: FIRM_A_ID, sync_type: 'incremental', sync_status: 'completed', total_cases_processed: 3, successful_cases: 2, failed_cases: 1, started_at: daysAgo(1), completed_at: daysAgo(1), duration_seconds: 22, summary: 'Sincronização incremental: 2 atualizações, 1 caso sem novidades.', api_calls_made: 6, rate_limit_hits: 0, initiated_by: A.admin },
      { id: 'bc000002-0001-4001-8001-bc0000020001', law_firm_id: FIRM_B_ID, sync_type: 'full', sync_status: 'completed', total_cases_processed: 2, successful_cases: 2, failed_cases: 0, started_at: daysAgo(3), completed_at: daysAgo(3), duration_seconds: 28, summary: 'Sincronização completa: 2 processos enriquecidos.', api_calls_made: 6, rate_limit_hits: 0, initiated_by: B.admin },
    ];
    r = await upsertRows(supabase, 'datajud_sync_log', syncLogs);
    if (r.error) throw new Error(`datajud_sync_log: ${r.error.message}`);
    total += r.count;
    log(`datajud_sync_log: ${r.count} rows`);

    return { module: mod, success: true, count: total };
  } catch (err) {
    return { module: mod, success: false, count: total, error: err.message };
  }
}
