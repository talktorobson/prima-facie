-- =============================================
-- DATAJUD CNJ INTEGRATION SEED DATA - SAFE VERSION (FIXED)
-- Comprehensive test data for DataJud functionality
-- Generated: 2025-06-20 - UUID and Priority Level FIXED
-- =============================================

-- This version uses only Dávila Reis Advocacia (123e4567-e89b-12d3-a456-426614174000)
-- ✅ FIXED: Proper 36-character UUID format
-- ✅ FIXED: Priority levels use valid values (low, normal, high, critical)

BEGIN;

-- =============================================
-- DATAJUD CASE DETAILS
-- Enriched case information from CNJ database
-- =============================================

INSERT INTO datajud_case_details (
  id, law_firm_id, matter_id, datajud_case_id, numero_processo_cnj, tribunal_alias,
  court_instance, court_code, court_name, court_municipality_ibge, court_municipality, court_state, court_competence,
  process_class_code, process_class_name, process_format_code, process_format_name, 
  court_system_code, court_system_name, filing_date, last_update_date, case_value, is_confidential,
  enrichment_confidence, enrichment_status
) VALUES

-- Case 1: Labor Case - Carlos Silva vs Empresa XYZ
('88888888-8888-8888-8888-888888888001', '123e4567-e89b-12d3-a456-426614174000', '55555555-5555-5555-5555-555555555001', 
 'TRT2_1234567892024502001', '1234567-89.2024.5.02.0001', 'TRT2',
 1, 2, '2ª Vara do Trabalho de São Paulo', 3550308, 'São Paulo', 'SP', 'Trabalhista',
 186, 'Reclamação Trabalhista', 2, 'Eletrônico', 
 101, 'PJe - Processo Judicial Eletrônico', '2024-01-15 09:30:00-03', '2024-03-18 14:22:00-03', 45000.00, false,
 0.92, 'completed'),

-- Case 2: Family Case - Mariana Santos Divorce
('88888888-8888-8888-8888-888888888002', '123e4567-e89b-12d3-a456-426614174000', '55555555-5555-5555-5555-555555555002',
 'TJSP_9876543212024826100', '9876543-21.2024.8.26.0100', 'TJSP',
 1, 1100, '1ª Vara de Família e Sucessões - Foro Central', 3550308, 'São Paulo', 'SP', 'Família',
 275, 'Divórcio Consensual', 2, 'Eletrônico',
 102, 'SAJ - Sistema de Automação da Justiça', '2024-02-01 10:15:00-03', '2024-02-28 16:45:00-03', 0.00, false,
 0.88, 'completed'),

-- Case 3: Criminal Case - Roberto Lima Defense
('88888888-8888-8888-8888-888888888003', '123e4567-e89b-12d3-a456-426614174000', '55555555-5555-5555-5555-555555555003',
 'TJSP_5555666772024826001', '5555666-77.2024.8.26.0001', 'TJSP',
 1, 1301, '3ª Vara Criminal - Foro Central', 3550308, 'São Paulo', 'SP', 'Criminal',
 283, 'Ação Penal', 2, 'Eletrônico',
 102, 'SAJ - Sistema de Automação da Justiça', '2024-03-10 11:20:00-03', '2024-03-19 09:15:00-03', 0.00, false,
 0.85, 'completed'),

-- Case 4: Civil Collection - Ana Paula vs Prestadora ABC
('88888888-8888-8888-8888-888888888004', '123e4567-e89b-12d3-a456-426614174000', '55555555-5555-5555-5555-555555555004',
 'TJSP_7777888992024826100', '7777888-99.2024.8.26.0100', 'TJSP',
 1, 1501, '15ª Vara Cível - Foro Central', 3550308, 'São Paulo', 'SP', 'Cível',
 39, 'Procedimento Comum Cível', 2, 'Eletrônico',
 102, 'SAJ - Sistema de Automação da Justiça', '2024-02-20 14:45:00-03', '2024-03-15 11:30:00-03', 32000.00, false,
 0.90, 'completed'),

-- Case 5: Tax Case - Federal Case for Dávila Reis
('88888888-8888-8888-8888-888888888005', '123e4567-e89b-12d3-a456-426614174000', '55555555-5555-5555-5555-555555555005',
 'TRF3_0001234562024403610', '0001234-56.2024.4.03.6100', 'TRF3',
 2, 3610, '6ª Vara Federal Cível - São Paulo', 3550308, 'São Paulo', 'SP', 'Federal',
 120, 'Mandado de Segurança', 2, 'Eletrônico',
 103, 'eProc - Sistema de Processo Eletrônico Federal', '2024-02-15 08:00:00-03', '2024-03-20 17:20:00-03', 150000.00, false,
 0.95, 'completed')

ON CONFLICT (law_firm_id, datajud_case_id) DO NOTHING;

-- =============================================
-- DATAJUD LEGAL SUBJECTS
-- Legal subjects associated with each case
-- =============================================

INSERT INTO datajud_legal_subjects (
  id, law_firm_id, datajud_case_detail_id, subject_code, subject_name, is_primary_subject
) VALUES

-- Labor Case Legal Subjects
('99999999-9999-9999-9999-999999999001', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888001', 1218, 'Verbas Rescisórias', true),
('99999999-9999-9999-9999-999999999002', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888001', 1045, 'Horas Extras', false),
('99999999-9999-9999-9999-999999999003', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888001', 1134, 'Adicional de Insalubridade', false),

-- Family Case Legal Subjects
('99999999-9999-9999-9999-999999999004', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888002', 5845, 'Divórcio Consensual', true),
('99999999-9999-9999-9999-999999999005', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888002', 5847, 'Partilha de Bens', false),

-- Criminal Case Legal Subjects
('99999999-9999-9999-9999-999999999006', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888003', 9626, 'Crimes contra a Honra', true),
('99999999-9999-9999-9999-999999999007', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888003', 9614, 'Injúria', false),

-- Civil Collection Legal Subjects
('99999999-9999-9999-9999-999999999008', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888004', 1406, 'Inadimplemento', true),
('99999999-9999-9999-9999-999999999009', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888004', 1388, 'Cobrança de Aluguéis', false),

-- Tax Case Legal Subjects
('99999999-9999-9999-9999-999999999010', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888005', 6104, 'Imposto sobre a Renda - IR', true),
('99999999-9999-9999-9999-999999999011', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888005', 6130, 'Multa Tributária', false),
('99999999-9999-9999-9999-999999999012', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888005', 6127, 'Lançamento Tributário', false)

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
-- =============================================

INSERT INTO datajud_timeline_events (
  id, law_firm_id, datajud_case_detail_id, movement_id, movement_code, movement_name, movement_complement,
  event_datetime, responsible_type_code, responsible_type_name, responsible_code, responsible_name,
  event_category, priority_level, is_relevant, is_visible_client, custom_description
) VALUES

-- Labor Case Timeline Events
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888001',
 'MOV_001_2024', 26, 'Distribuição', 'Processo distribuído por sorteio',
 '2024-01-15 09:30:00-03', 1, 'Servidor', 1001, 'Sistema PJe', 'filing', 'high', true, true, 'Processo iniciado e distribuído'),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888001',
 'MOV_002_2024', 193, 'Juntada de Petição', 'Petição inicial juntada aos autos',
 '2024-01-16 10:15:00-03', 1, 'Servidor', 1002, 'Maria Santos', 'filing', 'normal', true, true, 'Petição inicial protocolizada'),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888001',
 'MOV_003_2024', 1079, 'Expedição de Notificação', 'Notificação postal à parte ré',
 '2024-01-22 14:20:00-03', 2, 'Juiz', 2001, 'Dr. João Silva', 'notification', 'high', true, true, 'Empresa XYZ notificada'),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888001',
 'MOV_004_2024', 11009, 'Audiência Designada', 'Audiência inicial designada para 15/04/2024',
 '2024-02-10 11:45:00-03', 2, 'Juiz', 2001, 'Dr. João Silva', 'hearing', 'critical', true, true, 'Audiência marcada para 15/04/2024'),

-- Family Case Timeline Events  
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888002',
 'MOV_005_2024', 26, 'Distribuição', 'Processo distribuído',
 '2024-02-01 10:15:00-03', 1, 'Servidor', 1100, 'Sistema SAJ', 'filing', 'normal', true, true, 'Divórcio consensual distribuído'),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb6', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888002',
 'MOV_006_2024', 123, 'Decisão Interlocutória', 'Homologado acordo de divórcio',
 '2024-02-20 16:30:00-03', 2, 'Juiz', 1101, 'Dra. Ana Costa', 'decision', 'high', true, true, 'Divórcio homologado pelo juiz'),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb7', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888002',
 'MOV_007_2024', 162, 'Trânsito em Julgado', 'Processo transitado em julgado',
 '2024-02-28 16:45:00-03', 1, 'Servidor', 1102, 'José Oliveira', 'closure', 'high', true, true, 'Processo finalizado - divórcio concedido'),

-- Criminal Case Timeline Events
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb8', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888003',
 'MOV_008_2024', 26, 'Distribuição', 'Ação penal distribuída',
 '2024-03-10 11:20:00-03', 1, 'Servidor', 1301, 'Sistema SAJ', 'filing', 'high', true, false, 'Processo criminal iniciado'),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb9', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888003',
 'MOV_009_2024', 1079, 'Citação do Réu', 'Citação para apresentar defesa',
 '2024-03-19 09:15:00-03', 2, 'Juiz', 1302, 'Dr. Carlos Lima', 'notification', 'critical', true, false, 'Roberto citado para defesa'),

-- Civil Collection Timeline Events
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb10', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888004',
 'MOV_010_2024', 26, 'Distribuição', 'Ação de cobrança distribuída',
 '2024-02-20 14:45:00-03', 1, 'Servidor', 1501, 'Sistema SAJ', 'filing', 'normal', true, true, 'Cobrança de R$ 32.000 iniciada'),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb11', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888004',
 'MOV_011_2024', 44, 'Expedição de Mandado', 'Mandado de citação expedido',
 '2024-03-05 09:30:00-03', 1, 'Servidor', 1502, 'Pedro Santos', 'notification', 'high', true, true, 'Mandado de citação para Prestadora ABC'),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb12', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888004',
 'MOV_012_2024', 1079, 'Citação Positiva', 'Ré citada com êxito',
 '2024-03-15 11:30:00-03', 3, 'Oficial', 3001, 'Oficial de Justiça', 'notification', 'high', true, true, 'Prestadora ABC citada com sucesso'),

-- Tax Case Timeline Events
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb13', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888005',
 'MOV_013_2024', 26, 'Distribuição', 'Mandado de segurança distribuído',
 '2024-02-15 08:00:00-03', 1, 'Servidor', 3610, 'Sistema eProc', 'filing', 'high', true, true, 'MS contra auto de infração'),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb14', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888005',
 'MOV_014_2024', 193, 'Petição Inicial', 'Petição inicial do MS',
 '2024-02-16 09:20:00-03', 1, 'Servidor', 3611, 'Ana Silva', 'filing', 'normal', true, true, 'Pedido de liminar protocolado'),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb15', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888005',
 'MOV_015_2024', 25, 'Conclusão para Decisão', 'Autos conclusos para análise de liminar',
 '2024-03-01 14:10:00-03', 1, 'Servidor', 3612, 'Roberto Costa', 'review', 'high', true, true, 'Processo concluso para decisão liminar'),

('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb16', '123e4567-e89b-12d3-a456-426614174000', '88888888-8888-8888-8888-888888888005',
 'MOV_016_2024', 3, 'Despacho', 'Liminar deferida parcialmente',
 '2024-03-20 17:20:00-03', 2, 'Juiz', 3613, 'Dr. Fernando Alves', 'decision', 'critical', true, true, 'Liminar concedida - suspensão da exigibilidade')

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
 '2024-03-21 08:00:00-03', '2024-03-21 08:15:23-03', 923,
 '{"enriched_cases": 5, "timeline_events_added": 16, "participants_matched": 4, "legal_subjects_added": 12, "confidence_avg": 0.90}',
 60, 0),

-- Recent incremental sync
('cccccccc-cccc-cccc-cccc-ccccccccccc2', '123e4567-e89b-12d3-a456-426614174000', 'incremental', 'completed', null, 5, 5, 0,
 '2024-06-20 06:00:00-03', '2024-06-20 06:08:15-03', 495,
 '{"new_timeline_events": 16, "updated_cases": 5, "no_changes": 0, "total_api_calls": 35}',
 35, 0),

-- Manual sync for specific case
('cccccccc-cccc-cccc-cccc-ccccccccccc3', '123e4567-e89b-12d3-a456-426614174000', 'case_specific', 'completed', 
 '55555555-5555-5555-5555-555555555005', 1, 1, 0,
 '2024-06-19 15:20:00-03', '2024-06-19 15:25:30-03', 330,
 '{"enriched_cases": 1, "timeline_events_added": 4, "participants_matched": 1, "legal_subjects_added": 3, "confidence": 0.95}',
 15, 0)

ON CONFLICT DO NOTHING;

COMMIT;

-- =============================================
-- NOTE: ENRICHMENT CONFIDENCE CALCULATION
-- =============================================

-- Enrichment confidence scores are set directly in INSERT statements
-- to avoid trigger conflicts. Manual recalculation can be done later if needed:
-- UPDATE datajud_case_details SET enrichment_confidence = calculate_enrichment_confidence(id);

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Verify seed data insertion
SELECT 
  'DataJud Seed Data Summary (Safe Version)' as summary,
  (SELECT COUNT(*) FROM datajud_case_details) as case_details,
  (SELECT COUNT(*) FROM datajud_legal_subjects) as legal_subjects,
  (SELECT COUNT(*) FROM datajud_case_participants) as participants,
  (SELECT COUNT(*) FROM datajud_timeline_events) as timeline_events,
  (SELECT COUNT(*) FROM datajud_sync_log) as sync_logs;

-- Success message
SELECT '🎉 DataJud seed data (safe version - UUID FIXED) inserted successfully! 🎉' as status,
       'All 5 cases under Dávila Reis Advocacia - Ready for testing!' as next_step;