-- =============================================
-- DATAJUD CNJ INTEGRATION SEED DATA - SAFE VERSION
-- Standalone SQL for direct database seeding
-- Updated: 2026-02-07 — Matches real DataJud public API format
-- =============================================

-- Uses Dávila Reis Advocacia (123e4567-e89b-12d3-a456-426614174000)
-- Movement IDs use composite format: "{codigo}_{dataHora}"
--   (matches what the enrichment service generates from real API responses)
-- All field names match the CNJ Elasticsearch _source object

BEGIN;

-- =============================================
-- DATAJUD CASE DETAILS
-- Enriched case information from CNJ public API
-- =============================================

INSERT INTO datajud_case_details (
  id, law_firm_id, matter_id, datajud_case_id, numero_processo_cnj, tribunal_alias,
  court_instance, court_code, court_name, court_municipality_ibge, court_municipality, court_state, court_competence,
  process_class_code, process_class_name, process_format_code, process_format_name,
  court_system_code, court_system_name, filing_date, last_update_date, case_value, is_confidential,
  enrichment_confidence, enrichment_status, last_enrichment_at, data_conflicts
) VALUES

-- Case 1: Labor Case — Carlos Silva vs Empresa XYZ (TRT2)
-- CNJ 1234567-89.2024.5.02.0001 → segment 5, court 02 → trt2
('88888888-8888-8888-8888-888888888001', '123e4567-e89b-12d3-a456-426614174000', '55555555-5555-5555-5555-555555555001',
 'ES_TRT2_0001', '1234567-89.2024.5.02.0001', 'TRT2',
 1, 1, '2ª Vara do Trabalho de São Paulo', 3550308, 'São Paulo', 'SP', 'Trabalhista',
 1116, 'Reclamação Trabalhista - Rito Ordinário', 2, 'Eletrônico',
 101, 'PJe - Processo Judicial Eletrônico', '2024-01-15 09:30:00-03', '2024-03-18 14:22:00-03', 45000.00, false,
 0.92, 'completed', '2024-06-20 08:15:00-03', null),

-- Case 2: Family Case — Mariana Santos Divorce (TJSP)
-- CNJ 9876543-21.2024.8.26.0100 → segment 8, court 26 → tjsp
('88888888-8888-8888-8888-888888888002', '123e4567-e89b-12d3-a456-426614174000', '55555555-5555-5555-5555-555555555002',
 'ES_TJSP_0002', '9876543-21.2024.8.26.0100', 'TJSP',
 1, 100, '1ª Vara de Família e Sucessões - Foro Central', 3550308, 'São Paulo', 'SP', 'Família',
 275, 'Divórcio Consensual', 2, 'Eletrônico',
 102, 'SAJ - Sistema de Automação da Justiça', '2024-02-01 10:15:00-03', '2024-02-28 16:45:00-03', 0.00, false,
 0.88, 'completed', '2024-06-20 08:15:00-03', null),

-- Case 3: Criminal Case — Roberto Lima Defense (TJSP)
-- CNJ 5555666-77.2024.8.26.0001 → segment 8, court 26 → tjsp
-- Includes data conflict for demo (court_name mismatch → lower confidence)
('88888888-8888-8888-8888-888888888003', '123e4567-e89b-12d3-a456-426614174000', '55555555-5555-5555-5555-555555555003',
 'ES_TJSP_0003', '5555666-77.2024.8.26.0001', 'TJSP',
 1, 1, '3ª Vara Criminal do Foro Central', 3550308, 'São Paulo', 'SP', 'Criminal',
 283, 'Ação Penal - Procedimento Ordinário', 2, 'Eletrônico',
 102, 'SAJ - Sistema de Automação da Justiça', '2024-03-10 11:20:00-03', '2024-03-19 09:15:00-03', 0.00, true,
 0.78, 'completed', '2024-06-19 14:30:00-03',
 '{"conflicts": [{"field_name": "court_name", "existing_value": "3ª Vara Criminal - SP", "datajud_value": "3ª Vara Criminal do Foro Central", "conflict_type": "value_mismatch", "resolution_strategy": "prefer_datajud", "confidence_impact": -0.1}]}'),

-- Case 4: Civil Collection — Ana Paula vs Prestadora ABC (TJSP)
-- CNJ 7777888-99.2024.8.26.0100 → segment 8, court 26 → tjsp
('88888888-8888-8888-8888-888888888004', '123e4567-e89b-12d3-a456-426614174000', '55555555-5555-5555-5555-555555555004',
 'ES_TJSP_0004', '7777888-99.2024.8.26.0100', 'TJSP',
 1, 100, '15ª Vara Cível - Foro Central', 3550308, 'São Paulo', 'SP', 'Cível',
 7, 'Procedimento Comum Cível', 2, 'Eletrônico',
 102, 'SAJ - Sistema de Automação da Justiça', '2024-02-20 14:45:00-03', '2024-03-15 11:30:00-03', 32000.00, false,
 0.90, 'completed', '2024-06-20 08:15:00-03', null),

-- Case 5: Tax MS — Federal (TRF3)
-- CNJ 0001234-56.2024.4.03.6100 → segment 4, court 03 → trf3
('88888888-8888-8888-8888-888888888005', '123e4567-e89b-12d3-a456-426614174000', '55555555-5555-5555-5555-555555555005',
 'ES_TRF3_0005', '0001234-56.2024.4.03.6100', 'TRF3',
 1, 6100, '6ª Vara Federal Cível - São Paulo', 3550308, 'São Paulo', 'SP', 'Federal',
 120, 'Mandado de Segurança Cível', 2, 'Eletrônico',
 103, 'eProc - Processo Eletrônico Federal', '2024-02-15 08:00:00-03', '2024-03-20 17:20:00-03', 150000.00, false,
 0.95, 'completed', '2024-06-20 08:15:00-03', null)

ON CONFLICT (law_firm_id, datajud_case_id) DO NOTHING;

-- =============================================
-- DATAJUD LEGAL SUBJECTS
-- Legal subjects associated with each case
-- =============================================

INSERT INTO datajud_legal_subjects (
  id, law_firm_id, datajud_case_detail_id, subject_code, subject_name, is_primary_subject
) VALUES

-- Labor Case Legal Subjects
('99999999-9999-9999-9999-999999999001', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888001', 2034, 'Verbas Rescisórias', true),
('99999999-9999-9999-9999-999999999002', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888001', 2547, 'Horas Extras', false),
('99999999-9999-9999-9999-999999999003', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888001', 1045, 'Adicional de Insalubridade', false),

-- Family Case Legal Subjects
('99999999-9999-9999-9999-999999999004', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888002', 5845, 'Divórcio Consensual', true),
('99999999-9999-9999-9999-999999999005', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888002', 5847, 'Partilha de Bens', false),

-- Criminal Case Legal Subjects
('99999999-9999-9999-9999-999999999006', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888003', 3399, 'Estelionato', true),
('99999999-9999-9999-9999-999999999007', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888003', 3536, 'Crimes contra o Patrimônio', false),

-- Civil Collection Legal Subjects
('99999999-9999-9999-9999-999999999008', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888004', 9985, 'Prestação de Serviços', true),
('99999999-9999-9999-9999-999999999009', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888004', 6220, 'Inadimplemento', false),

-- Tax Case Legal Subjects
('99999999-9999-9999-9999-999999999010', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888005', 7770, 'IRPJ/CSLL', true),
('99999999-9999-9999-9999-999999999011', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888005', 6130, 'Multa Tributária', false),
('99999999-9999-9999-9999-999999999012', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888005', 7778, 'Auto de Infração', false)

ON CONFLICT (datajud_case_detail_id, subject_code) DO NOTHING;

-- =============================================
-- DATAJUD CASE PARTICIPANTS
-- Parties involved in each case
-- =============================================

INSERT INTO datajud_case_participants (
  id, law_firm_id, datajud_case_detail_id, participant_name, participant_cpf_cnpj, participant_type,
  case_role, participation_type, matched_contact_id, match_confidence
) VALUES

-- Labor Case Participants
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888001',
 'Carlos Eduardo Silva', '123.456.789-01', 'F', 'ativo', 'Reclamante', '33333333-3333-3333-3333-333333333001', 0.98),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaac', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888001',
 'Empresa XYZ LTDA', '45.678.901/0001-23', 'J', 'passivo', 'Reclamada', null, null),

-- Family Case Participants
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaad', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888002',
 'Mariana Santos Oliveira', '987.654.321-02', 'F', 'ativo', 'Requerente', '33333333-3333-3333-3333-333333333002', 0.97),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaae', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888002',
 'João Carlos Oliveira', '111.222.333-44', 'F', 'passivo', 'Requerido', null, null),

-- Criminal Case Participants
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaf', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888003',
 'Roberto Costa Lima', '456.789.123-03', 'F', 'passivo', 'Réu', '33333333-3333-3333-3333-333333333003', 0.96),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa0', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888003',
 'Ministério Público do Estado de São Paulo', null, 'J', 'ativo', 'Autor', null, null),

-- Civil Collection Participants
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888004',
 'Ana Paula Ferreira', '789.123.456-04', 'F', 'ativo', 'Autora', '33333333-3333-3333-3333-333333333004', 0.99),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888004',
 'Prestadora ABC LTDA', '77.888.999/0001-55', 'J', 'passivo', 'Ré', null, null),

-- Tax Case Participants
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888005',
 'Fernando Rodrigues Almeida', '321.654.987-05', 'F', 'ativo', 'Impetrante', null, 0.95),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888005',
 'Fazenda Nacional', null, 'J', 'passivo', 'Impetrada', null, null)

ON CONFLICT DO NOTHING;

-- =============================================
-- DATAJUD TIMELINE EVENTS
-- Court movements and case progress events
-- movement_id uses composite format: "{codigo}_{dataHora}"
-- =============================================

INSERT INTO datajud_timeline_events (
  id, law_firm_id, datajud_case_detail_id, movement_id, movement_code, movement_name, movement_complement,
  event_datetime, responsible_type_code, responsible_type_name, responsible_code, responsible_name,
  event_category, priority_level, is_relevant, is_visible_client, is_visible_timeline, custom_description
) VALUES

-- Labor Case Timeline Events (TRT2)
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888001',
 '26_2024-01-15T09:30:00-03:00', 26, 'Distribuição', 'Reclamação trabalhista distribuída por sorteio',
 '2024-01-15 09:30:00-03', 1, 'Servidor', 1001, 'Sistema PJe', 'filing', 'high', true, true, true, 'Processo iniciado e distribuído'),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888001',
 '193_2024-01-16T10:15:00-03:00', 193, 'Juntada de Petição', 'Petição inicial juntada aos autos',
 '2024-01-16 10:15:00-03', 1, 'Servidor', 1002, 'Maria Santos', 'filing', 'normal', true, true, true, 'Petição inicial protocolizada'),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888001',
 '1079_2024-01-22T14:20:00-03:00', 1079, 'Expedição de Notificação', 'Notificação postal à parte ré',
 '2024-01-22 14:20:00-03', 2, 'Magistrado', 2001, 'Dr. João Silva', 'notification', 'high', true, true, true, 'Empresa XYZ notificada'),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888001',
 '11009_2024-02-10T11:45:00-03:00', 11009, 'Audiência Designada', 'Audiência inaugural designada para 15/04/2024',
 '2024-02-10 11:45:00-03', 2, 'Magistrado', 2001, 'Dr. João Silva', 'hearing', 'critical', true, true, true, 'Audiência marcada para 15/04/2024'),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb0', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888001',
 '970_2024-03-18T14:22:00-03:00', 970, 'Audiência Realizada', 'Audiência de conciliação realizada — sem acordo entre as partes',
 '2024-03-18 14:22:00-03', 2, 'Magistrado', 2001, 'Dr. João Silva', 'hearing', 'critical', true, true, true, 'Audiência de conciliação — sem acordo'),

-- Family Case Timeline Events (TJSP)
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888002',
 '26_2024-02-01T10:15:00-03:00', 26, 'Distribuição', 'Processo distribuído',
 '2024-02-01 10:15:00-03', 1, 'Servidor', 1100, 'Sistema SAJ', 'filing', 'normal', true, true, true, 'Divórcio consensual distribuído'),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb6', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888002',
 '123_2024-02-20T16:30:00-03:00', 123, 'Decisão Interlocutória', 'Homologado acordo de divórcio',
 '2024-02-20 16:30:00-03', 2, 'Magistrado', 1101, 'Dra. Ana Costa', 'decision', 'high', true, true, true, 'Divórcio homologado pelo juiz'),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb7', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888002',
 '162_2024-02-28T16:45:00-03:00', 162, 'Trânsito em Julgado', 'Processo transitado em julgado',
 '2024-02-28 16:45:00-03', 1, 'Servidor', 1102, 'José Oliveira', 'closure', 'high', true, true, true, 'Processo finalizado — divórcio concedido'),

-- Criminal Case Timeline Events (TJSP)
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb8', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888003',
 '385_2024-03-10T11:20:00-03:00', 385, 'Recebimento da Denúncia', 'Denúncia do Ministério Público recebida pelo juízo',
 '2024-03-10 11:20:00-03', 2, 'Magistrado', 1301, 'Dr. Carlos Lima', 'decision', 'critical', true, false, true, 'Denúncia recebida — réu citado para resposta'),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb9', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888003',
 '12_2024-03-15T09:00:00-03:00', 12, 'Citação do Réu', 'Citação pessoal do acusado para apresentar defesa',
 '2024-03-15 09:00:00-03', 3, 'Oficial de Justiça', null, null, 'notification', 'high', true, false, true, null),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb10', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888003',
 '193_2024-03-18T16:30:00-03:00', 193, 'Resposta à Acusação', 'Resposta à acusação apresentada pela defesa',
 '2024-03-18 16:30:00-03', 1, 'Servidor', null, null, 'filing', 'normal', true, false, true, null),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb11', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888003',
 '25_2024-03-19T09:15:00-03:00', 25, 'Conclusão para Decisão', 'Autos conclusos ao juiz para absolvição sumária ou designação de audiência',
 '2024-03-19 09:15:00-03', 1, 'Servidor', null, null, 'general', 'high', true, false, true, 'Processo concluso — aguardando decisão do juiz'),

-- Civil Collection Timeline Events (TJSP)
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb12', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888004',
 '26_2024-02-20T14:45:00-03:00', 26, 'Distribuição', 'Ação de cobrança distribuída',
 '2024-02-20 14:45:00-03', 1, 'Servidor', 1501, 'Sistema SAJ', 'filing', 'normal', true, true, true, 'Cobrança de R$ 32.000 iniciada'),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb13', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888004',
 '12_2024-03-05T09:30:00-03:00', 12, 'Citação', 'Citação positiva via oficial de justiça',
 '2024-03-05 09:30:00-03', 3, 'Oficial de Justiça', 3001, 'Oficial de Justiça', 'notification', 'high', true, true, true, 'Mandado de citação para Prestadora ABC'),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb14', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888004',
 '193_2024-03-10T10:00:00-03:00', 193, 'Juntada de Contestação', 'Contestação da ré juntada aos autos',
 '2024-03-10 10:00:00-03', 1, 'Servidor', 1502, 'Pedro Santos', 'filing', 'normal', true, true, true, null),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb15', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888004',
 '3_2024-03-15T11:30:00-03:00', 3, 'Despacho', 'Designada audiência de conciliação para 15/05/2024',
 '2024-03-15 11:30:00-03', 2, 'Magistrado', 1503, 'Dr. Paulo Mendes', 'decision', 'high', true, true, true, 'Juiz designou audiência de conciliação'),

-- Tax Case Timeline Events (TRF3)
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb16', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888005',
 '26_2024-02-15T08:00:00-03:00', 26, 'Distribuição', 'Mandado de segurança distribuído',
 '2024-02-15 08:00:00-03', 1, 'Servidor', 3610, 'Sistema eProc', 'filing', 'high', true, true, true, 'MS contra auto de infração distribuído'),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb17', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888005',
 '193_2024-02-16T09:20:00-03:00', 193, 'Juntada de Petição Inicial', 'Petição inicial do MS com pedido de liminar',
 '2024-02-16 09:20:00-03', 1, 'Servidor', 3611, 'Ana Silva', 'filing', 'normal', true, true, true, 'Pedido de liminar protocolado'),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb18', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888005',
 '25_2024-03-01T14:10:00-03:00', 25, 'Conclusão para Decisão', 'Autos conclusos para análise de liminar',
 '2024-03-01 14:10:00-03', 1, 'Servidor', 3612, 'Roberto Costa', 'general', 'high', true, true, true, 'Processo concluso para decisão liminar'),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb19', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888005',
 '3_2024-03-20T17:20:00-03:00', 3, 'Despacho / Decisão', 'LIMINAR DEFERIDA — Suspensa a exigibilidade do crédito tributário (art. 151, IV, CTN)',
 '2024-03-20 17:20:00-03', 2, 'Magistrado', 3613, 'Dr. Fernando Alves', 'decision', 'critical', true, true, true, 'LIMINAR CONCEDIDA — crédito tributário suspenso'),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb20', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888005',
 '1079_2024-03-22T10:00:00-03:00', 1079, 'Notificação da Autoridade Coatora', 'Fazenda Nacional notificada para prestar informações em 10 dias',
 '2024-03-22 10:00:00-03', 1, 'Servidor', null, null, 'notification', 'normal', true, true, true, null)

ON CONFLICT (datajud_case_detail_id, movement_id) DO NOTHING;

-- =============================================
-- DATAJUD SYNC LOG
-- Track synchronization activities
-- =============================================

INSERT INTO datajud_sync_log (
  id, law_firm_id, sync_type, sync_status, matter_id, total_cases_processed, successful_cases, failed_cases,
  started_at, completed_at, duration_seconds, summary, api_calls_made, rate_limit_hits
) VALUES

-- Initial full sync for Dávila Reis Advocacia
('cccccccc-cccc-cccc-cccc-ccccccccccc1', '123e4567-e89b-12d3-a456-426614174000', 'full', 'completed', null, 5, 5, 0,
 '2024-06-20 02:00:00-03', '2024-06-20 02:00:38-03', 38,
 '{"cases_enriched": 5, "timeline_events_added": 21, "participants_added": 10, "legal_subjects_added": 12, "conflicts_detected": 1}',
 5, 0),

-- Incremental sync (next day)
('cccccccc-cccc-cccc-cccc-ccccccccccc2', '123e4567-e89b-12d3-a456-426614174000', 'incremental', 'completed', null, 5, 4, 0,
 '2024-06-21 06:00:00-03', '2024-06-21 06:00:18-03', 18,
 '{"cases_enriched": 4, "timeline_events_added": 3, "participants_added": 0, "legal_subjects_added": 0, "conflicts_detected": 0}',
 5, 0),

-- Manual sync for tax case
('cccccccc-cccc-cccc-cccc-ccccccccccc3', '123e4567-e89b-12d3-a456-426614174000', 'case_specific', 'completed',
 '55555555-5555-5555-5555-555555555005', 1, 1, 0,
 '2024-06-21 15:20:00-03', '2024-06-21 15:20:08-03', 8,
 '{"cases_enriched": 1, "timeline_events_added": 1, "participants_added": 0, "legal_subjects_added": 0, "conflicts_detected": 0}',
 1, 0)

ON CONFLICT DO NOTHING;

COMMIT;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

SELECT
  'DataJud Seed Data Summary' as summary,
  (SELECT COUNT(*) FROM datajud_case_details) as case_details,
  (SELECT COUNT(*) FROM datajud_legal_subjects) as legal_subjects,
  (SELECT COUNT(*) FROM datajud_case_participants) as participants,
  (SELECT COUNT(*) FROM datajud_timeline_events) as timeline_events,
  (SELECT COUNT(*) FROM datajud_sync_log) as sync_logs;
