-- =============================================
-- PRIMA FACIE SEED DATA - STEP 1: CORE TABLES
-- Create realistic test data for better UX
-- =============================================

-- Get law firm IDs for reference
-- Law Firm 1: Dávila Reis Advocacia (123e4567-e89b-12d3-a456-426614174000)
-- Law Firm 2: Silva & Associados (234e4567-e89b-12d3-a456-426614174001)

BEGIN;

-- =============================================
-- SEED MATTER TYPES
-- =============================================

INSERT INTO matter_types (id, law_firm_id, name, description, color, icon, default_hourly_rate, default_flat_fee, is_active, sort_order) VALUES
-- Dávila Reis Advocacia matter types
('11111111-1111-1111-1111-111111111001', '123e4567-e89b-12d3-a456-426614174000', 'Ação Trabalhista', 'Processos relacionados a direitos trabalhistas', '#059669', 'briefcase', 300.00, 2500.00, true, 1),
('11111111-1111-1111-1111-111111111002', '123e4567-e89b-12d3-a456-426614174000', 'Revisão de Contrato', 'Análise e revisão de contratos empresariais', '#3B82F6', 'file-text', 400.00, 1500.00, true, 2),
('11111111-1111-1111-1111-111111111003', '123e4567-e89b-12d3-a456-426614174000', 'Defesa Criminal', 'Defesa em processos criminais', '#EF4444', 'shield', 500.00, 5000.00, true, 3),
('11111111-1111-1111-1111-111111111004', '123e4567-e89b-12d3-a456-426614174000', 'Divórcio Consensual', 'Processos de divórcio por mútuo acordo', '#8B5CF6', 'heart', 250.00, 1800.00, true, 4),
('11111111-1111-1111-1111-111111111005', '123e4567-e89b-12d3-a456-426614174000', 'Cobrança Judicial', 'Ações de cobrança e execução', '#F59E0B', 'dollar-sign', 350.00, 2000.00, true, 5),

-- Silva & Associados matter types
('22222222-2222-2222-2222-222222222001', '234e4567-e89b-12d3-a456-426614174001', 'Consultoria Empresarial', 'Consultoria jurídica para empresas', '#10B981', 'building', 450.00, 3000.00, true, 1),
('22222222-2222-2222-2222-222222222002', '234e4567-e89b-12d3-a456-426614174001', 'Direito Tributário', 'Questões tributárias e fiscais', '#6366F1', 'calculator', 500.00, 4000.00, true, 2),
('22222222-2222-2222-2222-222222222003', '234e4567-e89b-12d3-a456-426614174001', 'Propriedade Intelectual', 'Registro de marcas e patentes', '#EC4899', 'lightbulb', 400.00, 2500.00, true, 3);

-- =============================================
-- SEED CONTACTS (CLIENTS)
-- =============================================

INSERT INTO contacts (id, law_firm_id, contact_type, first_name, last_name, full_name, cpf, email, phone, mobile, 
                     address_street, address_number, address_neighborhood, address_city, address_state, address_zipcode, 
                     client_status, preferred_communication, notes, total_billed, total_paid, outstanding_balance) VALUES

-- Dávila Reis Advocacia clients (Individual clients)
('33333333-3333-3333-3333-333333333001', '123e4567-e89b-12d3-a456-426614174000', 'individual', 'Carlos', 'Eduardo Silva', 'Carlos Eduardo Silva', '123.456.789-01', 'carlos.silva@email.com', '(11) 98765-4321', '(11) 98765-4321', 'Rua das Flores', '123', 'Vila Madalena', 'São Paulo', 'SP', '05423-001', 'active', 'whatsapp', 'Cliente desde 2022, casos trabalhistas', 4500.00, 3200.00, 1300.00),

('33333333-3333-3333-3333-333333333002', '123e4567-e89b-12d3-a456-426614174000', 'individual', 'Mariana', 'Santos Oliveira', 'Mariana Santos Oliveira', '987.654.321-02', 'mariana.santos@email.com', '(11) 94567-8901', '(11) 94567-8901', 'Avenida Paulista', '1500', 'Bela Vista', 'São Paulo', 'SP', '01310-200', 'active', 'email', 'Processo de divórcio em andamento', 2800.00, 2800.00, 0.00),

('33333333-3333-3333-3333-333333333003', '123e4567-e89b-12d3-a456-426614174000', 'individual', 'Roberto', 'Costa Lima', 'Roberto Costa Lima', '456.789.123-03', 'roberto.lima@email.com', '(11) 91234-5678', '(11) 91234-5678', 'Rua Augusta', '800', 'Consolação', 'São Paulo', 'SP', '01305-100', 'prospect', 'phone', 'Interessado em defesa criminal', 0.00, 0.00, 0.00),

('33333333-3333-3333-3333-333333333004', '123e4567-e89b-12d3-a456-426614174000', 'individual', 'Ana', 'Paula Ferreira', 'Ana Paula Ferreira', '789.123.456-04', 'ana.ferreira@email.com', '(11) 99876-5432', '(11) 99876-5432', 'Rua Oscar Freire', '456', 'Jardins', 'São Paulo', 'SP', '01426-001', 'active', 'whatsapp', 'Cobrança de empresa em andamento', 3200.00, 1600.00, 1600.00),

-- Company clients
('33333333-3333-3333-3333-333333333005', '123e4567-e89b-12d3-a456-426614174000', 'company', null, null, 'TechStart Soluções LTDA', null, 'contato@techstart.com.br', '(11) 3456-7890', '(11) 99999-8888', 'Rua dos Três Irmãos', '1200', 'Vila Progredior', 'São Paulo', 'SP', '05615-001', 'active', 'email', 'Startup de tecnologia, contratos diversos', 8500.00, 6000.00, 2500.00),

-- Silva & Associados clients
('44444444-4444-4444-4444-444444444001', '234e4567-e89b-12d3-a456-426614174001', 'company', null, null, 'Indústria Brasileira SA', null, 'juridico@industriabr.com.br', '(11) 2345-6789', '(11) 98888-7777', 'Avenida das Nações Unidas', '4500', 'Vila Olímpia', 'São Paulo', 'SP', '04578-000', 'active', 'email', 'Grande cliente industrial, múltiplos casos', 25000.00, 20000.00, 5000.00),

('44444444-4444-4444-4444-444444444002', '234e4567-e89b-12d3-a456-426614174001', 'individual', 'Fernando', 'Rodrigues Almeida', 'Fernando Rodrigues Almeida', '321.654.987-05', 'fernando.almeida@email.com', '(11) 97777-6666', '(11) 97777-6666', 'Rua Pamplona', '789', 'Jardim Paulista', 'São Paulo', 'SP', '01405-001', 'active', 'phone', 'Empresário, questões tributárias', 12000.00, 8000.00, 4000.00),

('44444444-4444-4444-4444-444444444003', '234e4567-e89b-12d3-a456-426614174001', 'company', null, null, 'Inovação Digital LTDA', null, 'legal@inovacaodigital.com', '(11) 3654-9870', '(11) 96666-5555', 'Rua Funchal', '263', 'Vila Olímpia', 'São Paulo', 'SP', '04551-060', 'prospect', 'email', 'Empresa de software, propriedade intelectual', 0.00, 0.00, 0.00);

-- Add company details for company contacts
UPDATE contacts SET 
    company_name = full_name,
    cnpj = CASE 
        WHEN id = '33333333-3333-3333-3333-333333333005' THEN '12.345.678/0001-95'
        WHEN id = '44444444-4444-4444-4444-444444444001' THEN '98.765.432/0001-10'
        WHEN id = '44444444-4444-4444-4444-444444444003' THEN '11.222.333/0001-44'
        ELSE cnpj
    END,
    company_type = CASE 
        WHEN id = '33333333-3333-3333-3333-333333333005' THEN 'LTDA'
        WHEN id = '44444444-4444-4444-4444-444444444001' THEN 'SA'
        WHEN id = '44444444-4444-4444-4444-444444444003' THEN 'LTDA'
        ELSE company_type
    END
WHERE contact_type = 'company';

-- =============================================
-- SEED MATTERS (LEGAL CASES)
-- =============================================

INSERT INTO matters (id, law_firm_id, matter_type_id, matter_number, title, description, 
                    court_name, court_city, court_state, process_number, opposing_party,
                    status, priority, opened_date, billing_method, hourly_rate, flat_fee, 
                    total_billed, total_paid, outstanding_balance, responsible_lawyer_id, notes) VALUES

-- Dávila Reis Advocacia cases
('55555555-5555-5555-5555-555555555001', '123e4567-e89b-12d3-a456-426614174000', '11111111-1111-1111-1111-111111111001', 'LAB-2024-001', 'Ação Trabalhista - Carlos Silva vs Empresa XYZ', 'Reclamação trabalhista por verbas rescisórias não pagas', '2ª Vara do Trabalho de São Paulo', 'São Paulo', 'SP', '1234567-89.2024.5.02.0001', 'Empresa XYZ LTDA', 'active', 'high', '2024-01-15', 'contingency', null, null, 4500.00, 3200.00, 1300.00, null, 'Caso com boa chance de acordo'),

('55555555-5555-5555-5555-555555555002', '123e4567-e89b-12d3-a456-426614174000', '11111111-1111-1111-1111-111111111004', 'FAM-2024-002', 'Divórcio Consensual - Mariana Santos', 'Processo de divórcio consensual com partilha de bens', '1ª Vara de Família e Sucessões', 'São Paulo', 'SP', '9876543-21.2024.8.26.0100', null, 'closed', 'medium', '2024-02-01', 'flat_fee', null, 1800.00, 2800.00, 2800.00, 0.00, 'Processo finalizado com sucesso'),

('55555555-5555-5555-5555-555555555003', '123e4567-e89b-12d3-a456-426614174000', '11111111-1111-1111-1111-111111111003', 'CRIM-2024-003', 'Defesa Criminal - Roberto Lima', 'Defesa em processo criminal por crime contra a honra', '3ª Vara Criminal de São Paulo', 'São Paulo', 'SP', '5555666-77.2024.8.26.0001', 'Ministério Público', 'active', 'urgent', '2024-03-10', 'flat_fee', null, 5000.00, 0.00, 0.00, 0.00, 'Aguardando audiência inicial'),

('55555555-5555-5555-5555-555555555004', '123e4567-e89b-12d3-a456-426614174000', '11111111-1111-1111-1111-111111111005', 'COB-2024-004', 'Cobrança - Ana Paula vs Prestadora ABC', 'Ação de cobrança por serviços não pagos', '15ª Vara Cível de São Paulo', 'São Paulo', 'SP', '7777888-99.2024.8.26.0100', 'Prestadora ABC LTDA', 'active', 'medium', '2024-02-20', 'contingency', null, null, 3200.00, 1600.00, 1600.00, null, 'Em fase de citação do réu'),

('55555555-5555-5555-5555-555555555005', '123e4567-e89b-12d3-a456-426614174000', '11111111-1111-1111-1111-111111111002', 'CONT-2024-005', 'Revisão Contrato - TechStart', 'Revisão de contratos de prestação de serviços', null, null, null, null, null, 'active', 'low', '2024-03-01', 'hourly', 400.00, null, 2400.00, 1800.00, 600.00, null, 'Contratos em análise'),

-- Silva & Associados cases
('66666666-6666-6666-6666-666666666001', '234e4567-e89b-12d3-a456-426614174001', '22222222-2222-2222-2222-222222222001', 'EMP-2024-001', 'Consultoria Empresarial - Indústria Brasileira', 'Consultoria para reestruturação societária', null, null, null, null, null, 'active', 'high', '2024-01-10', 'hourly', 450.00, null, 18000.00, 15000.00, 3000.00, null, 'Projeto de grande porte em andamento'),

('66666666-6666-6666-6666-666666666002', '234e4567-e89b-12d3-a456-426614174001', '22222222-2222-2222-2222-222222222002', 'TRIB-2024-002', 'Questão Tributária - Fernando Almeida', 'Defesa em auto de infração da Receita Federal', 'Tribunal Regional Federal 3ª Região', 'São Paulo', 'SP', '0001234-56.2024.4.03.6100', 'Fazenda Nacional', 'active', 'urgent', '2024-02-15', 'flat_fee', null, 8000.00, 12000.00, 8000.00, 4000.00, 'Recurso em segundo grau'),

('66666666-6666-6666-6666-666666666003', '234e4567-e89b-12d3-a456-426614174001', '22222222-2222-2222-2222-222222222003', 'PI-2024-003', 'Propriedade Intelectual - Inovação Digital', 'Registro de marca e software', null, null, null, null, null, 'prospect', 'medium', '2024-03-15', 'flat_fee', null, 2500.00, 0.00, 0.00, 0.00, 'Aguardando assinatura do contrato');

-- =============================================
-- SEED MATTER-CONTACT RELATIONSHIPS
-- =============================================

INSERT INTO matter_contacts (matter_id, contact_id, relationship_type, is_primary) VALUES
-- Link clients to their matters
('55555555-5555-5555-5555-555555555001', '33333333-3333-3333-3333-333333333001', 'client', true),
('55555555-5555-5555-5555-555555555002', '33333333-3333-3333-3333-333333333002', 'client', true),
('55555555-5555-5555-5555-555555555003', '33333333-3333-3333-3333-333333333003', 'client', true),
('55555555-5555-5555-5555-555555555004', '33333333-3333-3333-3333-333333333004', 'client', true),
('55555555-5555-5555-5555-555555555005', '33333333-3333-3333-3333-333333333005', 'client', true),
('66666666-6666-6666-6666-666666666001', '44444444-4444-4444-4444-444444444001', 'client', true),
('66666666-6666-6666-6666-666666666002', '44444444-4444-4444-4444-444444444002', 'client', true),
('66666666-6666-6666-6666-666666666003', '44444444-4444-4444-4444-444444444003', 'client', true);

-- =============================================
-- SEED TASKS
-- =============================================

INSERT INTO tasks (id, law_firm_id, matter_id, title, description, task_type, priority, status, 
                  due_date, assigned_to, is_billable, estimated_hours) VALUES

-- Tasks for active matters
('77777777-7777-7777-7777-777777777001', '123e4567-e89b-12d3-a456-426614174000', '55555555-5555-5555-5555-555555555001', 'Preparar petição inicial', 'Elaborar petição inicial da reclamação trabalhista', 'general', 'high', 'completed', '2024-01-20', null, true, 4.0),

('77777777-7777-7777-7777-777777777002', '123e4567-e89b-12d3-a456-426614174000', '55555555-5555-5555-5555-555555555001', 'Audiência inicial', 'Comparecer à audiência inicial', 'court_date', 'high', 'pending', '2024-04-15', null, true, 2.0),

('77777777-7777-7777-7777-777777777003', '123e4567-e89b-12d3-a456-426614174000', '55555555-5555-5555-5555-555555555003', 'Análise do processo', 'Analisar autos do processo criminal', 'document_review', 'urgent', 'in_progress', '2024-03-20', null, true, 6.0),

('77777777-7777-7777-7777-777777777004', '123e4567-e89b-12d3-a456-426614174000', '55555555-5555-5555-5555-555555555004', 'Citação do réu', 'Acompanhar citação da empresa devedora', 'general', 'medium', 'pending', '2024-04-01', null, true, 1.0),

('77777777-7777-7777-7777-777777777005', '234e4567-e89b-12d3-a456-426614174001', '66666666-6666-6666-6666-666666666001', 'Reunião com cliente', 'Reunião para definir estratégia de reestruturação', 'client_meeting', 'high', 'completed', '2024-01-15', null, true, 3.0),

('77777777-7777-7777-7777-777777777006', '234e4567-e89b-12d3-a456-426614174001', '66666666-6666-6666-6666-666666666002', 'Recurso TRF', 'Preparar recurso para o TRF', 'deadline', 'urgent', 'in_progress', '2024-03-25', null, true, 8.0);

COMMIT;

-- Success message
SELECT 'Core seed data inserted successfully!' as status;