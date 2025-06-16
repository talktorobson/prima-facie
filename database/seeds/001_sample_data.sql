-- =====================================================
-- Prima Facie - Sample Data for Development
-- Creates realistic test data for all entities
-- =====================================================

-- Temporarily disable RLS for seeding
SET row_security = off;

-- =====================================================
-- 1. LAW FIRMS
-- =====================================================
INSERT INTO law_firms (
    id,
    name,
    legal_name,
    cnpj,
    oab_number,
    email,
    phone,
    website,
    address_street,
    address_number,
    address_complement,
    address_neighborhood,
    address_city,
    address_state,
    address_zipcode,
    primary_color,
    secondary_color,
    plan_type,
    subscription_active
) VALUES 
(
    '123e4567-e89b-12d3-a456-426614174000',
    'Dávila Reis Advocacia',
    'Dávila Reis Advocacia Ltda',
    '12.345.678/0001-90',
    'OAB/SP 123456',
    'contato@davilareisadv.com.br',
    '(11) 3456-7890',
    'https://davilareisadv.com.br',
    'Rua das Palmeiras',
    '1234',
    'Conjunto 567',
    'Vila Olímpia',
    'São Paulo',
    'SP',
    '04578-000',
    '#0066CC',
    '#64748B',
    'professional',
    true
),
(
    '223e4567-e89b-12d3-a456-426614174001',
    'Silva & Associados',
    'Silva & Associados Sociedade de Advogados',
    '98.765.432/0001-10',
    'OAB/RJ 654321',
    'contato@silvaassociados.com.br',
    '(21) 2345-6789',
    'https://silvaassociados.com.br',
    'Avenida Atlântica',
    '567',
    'Sala 1203',
    'Copacabana',
    'Rio de Janeiro',
    'RJ',
    '22021-000',
    '#DC2626',
    '#475569',
    'basic',
    true
);

-- =====================================================
-- 2. MATTER TYPES
-- =====================================================
INSERT INTO matter_types (
    id,
    law_firm_id,
    name,
    description,
    color,
    default_hourly_rate,
    default_flat_fee,
    required_documents,
    default_tasks,
    is_active,
    sort_order
) VALUES 
(
    '323e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    'Direito Civil',
    'Casos relacionados a direito civil, contratos e responsabilidade civil',
    '#10B981',
    350.00,
    5000.00,
    '["Contrato", "Documentos pessoais", "Comprovante de residência"]',
    '["Análise inicial", "Elaboração de petição", "Acompanhamento processual"]',
    true,
    1
),
(
    '423e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    'Direito Trabalhista',
    'Questões trabalhistas, rescisões e direitos do trabalhador',
    '#F59E0B',
    300.00,
    3500.00,
    '["CTPS", "Contrato de trabalho", "Recibos de pagamento"]',
    '["Análise da rescisão", "Cálculo de verbas", "Entrada com reclamatória"]',
    true,
    2
),
(
    '523e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    'Direito Previdenciário',
    'Benefícios previdenciários e aposentadorias',
    '#8B5CF6',
    280.00,
    4000.00,
    '["Documentos pessoais", "CNIS", "Atestados médicos"]',
    '["Análise de contribuições", "Pedido administrativo", "Recurso judicial"]',
    true,
    3
),
(
    '623e4567-e89b-12d3-a456-426614174000',
    '223e4567-e89b-12d3-a456-426614174001',
    'Direito Empresarial',
    'Constituição de empresas e contratos comerciais',
    '#3B82F6',
    450.00,
    8000.00,
    '["Contrato social", "Documentos dos sócios", "Viabilidade do nome"]',
    '["Elaboração de contrato social", "Registro na Junta Comercial", "Obtenção de CNPJ"]',
    true,
    1
);

-- =====================================================
-- 3. USERS (Staff)
-- =====================================================
INSERT INTO users (
    id,
    law_firm_id,
    auth_user_id,
    email,
    first_name,
    last_name,
    oab_number,
    position,
    department,
    phone,
    mobile,
    user_type,
    role,
    status,
    timezone,
    language
) VALUES 
-- Dávila Reis Advocacia Staff
(
    '723e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    NULL, -- Will be populated when Supabase auth is integrated
    'robson@davilareisadv.com.br',
    'Robson',
    'Dávila Reis',
    'OAB/SP 123456',
    'Sócio Fundador',
    'Direção',
    '(11) 99999-0001',
    '(11) 99999-0001',
    'admin',
    'managing_partner',
    'active',
    'America/Sao_Paulo',
    'pt-BR'
),
(
    '823e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    NULL,
    'maria.silva@davilareisadv.com.br',
    'Maria',
    'Silva',
    'OAB/SP 234567',
    'Advogada Sênior',
    'Cível',
    '(11) 99999-0002',
    '(11) 99999-0002',
    'lawyer',
    'senior_associate',
    'active',
    'America/Sao_Paulo',
    'pt-BR'
),
(
    '923e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    NULL,
    'carlos.santos@davilareisadv.com.br',
    'Carlos',
    'Santos',
    'OAB/SP 345678',
    'Advogado Júnior',
    'Trabalhista',
    '(11) 99999-0003',
    '(11) 99999-0003',
    'lawyer',
    'associate',
    'active',
    'America/Sao_Paulo',
    'pt-BR'
),
(
    'a23e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    NULL,
    'ana.costa@davilareisadv.com.br',
    'Ana',
    'Costa',
    NULL,
    'Secretária Jurídica',
    'Administrativo',
    '(11) 99999-0004',
    '(11) 99999-0004',
    'staff',
    'secretary',
    'active',
    'America/Sao_Paulo',
    'pt-BR'
),
-- Silva & Associados Staff
(
    'b23e4567-e89b-12d3-a456-426614174000',
    '223e4567-e89b-12d3-a456-426614174001',
    NULL,
    'joao.silva@silvaassociados.com.br',
    'João',
    'Silva',
    'OAB/RJ 654321',
    'Sócio Fundador',
    'Direção',
    '(21) 99999-0001',
    '(21) 99999-0001',
    'admin',
    'managing_partner',
    'active',
    'America/Sao_Paulo',
    'pt-BR'
);

-- =====================================================
-- 4. CONTACTS (Clients)
-- =====================================================
INSERT INTO contacts (
    id,
    law_firm_id,
    contact_type,
    first_name,
    last_name,
    full_name,
    cpf,
    rg,
    birth_date,
    marital_status,
    profession,
    email,
    phone,
    mobile,
    address_street,
    address_number,
    address_neighborhood,
    address_city,
    address_state,
    address_zipcode,
    client_status,
    source,
    preferred_communication,
    notes,
    tags
) VALUES 
(
    'c23e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    'individual',
    'João',
    'Oliveira',
    'João Oliveira',
    '123.456.789-00',
    'MG-12.345.678',
    '1985-03-15',
    'casado',
    'Engenheiro',
    'joao.oliveira@email.com',
    '(11) 3456-7890',
    '(11) 99876-5432',
    'Rua das Flores',
    '123',
    'Centro',
    'São Paulo',
    'SP',
    '01234-567',
    'active',
    'indicação',
    'whatsapp',
    'Cliente desde 2023. Muito pontual nos pagamentos.',
    '["cliente_vip", "pontual"]'
),
(
    'd23e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    'individual',
    'Maria',
    'Fernandes',
    'Maria Fernandes',
    '987.654.321-00',
    'SP-98.765.432',
    '1978-08-22',
    'divorciada',
    'Professora',
    'maria.fernandes@email.com',
    '(11) 2345-6789',
    '(11) 98765-4321',
    'Avenida Paulista',
    '567',
    'Bela Vista',
    'São Paulo',
    'SP',
    '01311-000',
    'active',
    'google',
    'email',
    'Caso de direito trabalhista. Demissão sem justa causa.',
    '["trabalhista", "prioritario"]'
),
(
    'e23e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    'company',
    NULL,
    NULL,
    'TechCorp Soluções Ltda',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'contato@techcorp.com.br',
    '(11) 4567-8901',
    NULL,
    'Rua da Tecnologia',
    '789',
    'Vila Olímpia',
    'São Paulo',
    'SP',
    '04578-000',
    'prospect',
    'website',
    'email',
    'Empresa de tecnologia interessada em consultoria jurídica.',
    '["empresa", "tecnologia", "prospect"]'
),
(
    'f23e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174000',
    'individual',
    'Pedro',
    'Santos',
    'Pedro Santos',
    '456.789.123-00',
    'RJ-45.678.912',
    '1965-12-10',
    'casado',
    'Aposentado',
    'pedro.santos@email.com',
    '(11) 5678-9012',
    '(11) 97654-3210',
    'Rua do Trabalhador',
    '456',
    'Vila Industrial',
    'São Paulo',
    'SP',
    '03456-789',
    'active',
    'indicação',
    'phone',
    'Aposentado buscando revisão de benefício previdenciário.',
    '["previdenciario", "aposentado"]'
);

-- Update company information for TechCorp
UPDATE contacts 
SET 
    company_name = 'TechCorp Soluções Ltda',
    cnpj = '12.345.678/0001-99',
    company_type = 'Ltda'
WHERE id = 'e23e4567-e89b-12d3-a456-426614174000';

-- =====================================================
-- 5. MATTERS
-- =====================================================
INSERT INTO matters (
    id,
    law_firm_id,
    matter_type_id,
    matter_number,
    title,
    description,
    court_name,
    court_city,
    court_state,
    process_number,
    opposing_party,
    status,
    priority,
    opened_date,
    next_court_date,
    billing_method,
    hourly_rate,
    responsible_lawyer_id,
    assigned_staff,
    notes,
    tags
) VALUES 
(
    '123e4567-e89b-12d3-a456-426614174100',
    '123e4567-e89b-12d3-a456-426614174000',
    '323e4567-e89b-12d3-a456-426614174000', -- Direito Civil
    'MAT-2024-001',
    'Indenização por Danos Morais - João Oliveira',
    'Ação de indenização por danos morais decorrente de acidente de trânsito',
    '1ª Vara Cível Central',
    'São Paulo',
    'SP',
    '1234567-12.2024.8.26.0100',
    'Empresa XYZ Transportes Ltda',
    'active',
    'high',
    '2024-01-15',
    '2024-02-20 14:00:00-03',
    'hourly',
    350.00,
    '823e4567-e89b-12d3-a456-426614174000', -- Maria Silva
    '["a23e4567-e89b-12d3-a456-426614174000"]', -- Ana Costa
    'Cliente sofreu danos morais e materiais em acidente. Empresa nega responsabilidade.',
    '["acidente", "transito", "indenizacao"]'
),
(
    '223e4567-e89b-12d3-a456-426614174100',
    '123e4567-e89b-12d3-a456-426614174000',
    '423e4567-e89b-12d3-a456-426614174000', -- Direito Trabalhista
    'MAT-2024-002',
    'Reclamatória Trabalhista - Maria Fernandes',
    'Reclamatória trabalhista por demissão sem justa causa e verbas rescisórias',
    '2ª Vara do Trabalho de São Paulo',
    'São Paulo',
    'SP',
    '0001234-56.2024.5.02.0001',
    'Empresa ABC Comércio Ltda',
    'active',
    'medium',
    '2024-01-22',
    '2024-03-10 09:30:00-03',
    'contingency',
    NULL,
    '923e4567-e89b-12d3-a456-426614174000', -- Carlos Santos
    '["a23e4567-e89b-12d3-a456-426614174000"]',
    'Funcionária demitida sem justa causa. Empresa não pagou todas as verbas.',
    '["trabalhista", "demissao", "verbas_rescisórias"]'
),
(
    '323e4567-e89b-12d3-a456-426614174100',
    '123e4567-e89b-12d3-a456-426614174000',
    '523e4567-e89b-12d3-a456-426614174000', -- Direito Previdenciário
    'MAT-2024-003',
    'Revisão de Aposentadoria - Pedro Santos',
    'Pedido de revisão de aposentadoria para inclusão de período não computado',
    NULL,
    NULL,
    NULL,
    NULL,
    'INSS',
    'active',
    'low',
    '2024-02-01',
    NULL,
    'flat_fee',
    4000.00,
    '823e4567-e89b-12d3-a456-426614174000', -- Maria Silva
    '[]',
    'Aposentado quer incluir período rural não computado pelo INSS.',
    '["previdenciario", "revisao", "aposentadoria"]'
),
(
    '423e4567-e89b-12d3-a456-426614174100',
    '123e4567-e89b-12d3-a456-426614174000',
    '323e4567-e89b-12d3-a456-426614174000', -- Direito Civil
    'MAT-2024-004',
    'Consultoria Jurídica - TechCorp',
    'Análise de contratos e consultoria jurídica empresarial',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'active',
    'medium',
    '2024-02-05',
    NULL,
    'hourly',
    400.00,
    '723e4567-e89b-12d3-a456-426614174000', -- Robson Dávila Reis
    '["823e4567-e89b-12d3-a456-426614174000"]',
    'Empresa de tecnologia precisa de revisão de contratos com fornecedores.',
    '["consultoria", "contratos", "empresarial"]'
);

-- Update contingency percentage for trabalhista case
UPDATE matters 
SET contingency_percentage = 30.00
WHERE id = '223e4567-e89b-12d3-a456-426614174100';

-- =====================================================
-- 6. MATTER_CONTACTS (Associate clients with matters)
-- =====================================================
INSERT INTO matter_contacts (
    matter_id,
    contact_id,
    relationship_type,
    is_primary
) VALUES 
(
    '123e4567-e89b-12d3-a456-426614174100', -- Indenização João
    'c23e4567-e89b-12d3-a456-426614174000', -- João Oliveira
    'client',
    true
),
(
    '223e4567-e89b-12d3-a456-426614174100', -- Trabalhista Maria
    'd23e4567-e89b-12d3-a456-426614174000', -- Maria Fernandes
    'client',
    true
),
(
    '323e4567-e89b-12d3-a456-426614174100', -- Previdenciário Pedro
    'f23e4567-e89b-12d3-a456-426614174000', -- Pedro Santos
    'client',
    true
),
(
    '423e4567-e89b-12d3-a456-426614174100', -- Consultoria TechCorp
    'e23e4567-e89b-12d3-a456-426614174000', -- TechCorp
    'client',
    true
);

-- =====================================================
-- 7. TASKS
-- =====================================================
INSERT INTO tasks (
    id,
    law_firm_id,
    matter_id,
    title,
    description,
    task_type,
    priority,
    status,
    due_date,
    assigned_to,
    is_billable,
    estimated_hours
) VALUES 
(
    '123e4567-e89b-12d3-a456-426614174200',
    '123e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174100',
    'Preparar contestação',
    'Elaborar peça de contestação para a ação de indenização',
    'document_review',
    'high',
    'in_progress',
    '2024-02-15 17:00:00-03',
    '823e4567-e89b-12d3-a456-426614174000', -- Maria Silva
    true,
    4.0
),
(
    '223e4567-e89b-12d3-a456-426614174200',
    '123e4567-e89b-12d3-a456-426614174000',
    '223e4567-e89b-12d3-a456-426614174100',
    'Audiência inicial',
    'Participar da audiência inicial na Vara do Trabalho',
    'court_date',
    'high',
    'pending',
    '2024-03-10 09:30:00-03',
    '923e4567-e89b-12d3-a456-426614174000', -- Carlos Santos
    true,
    2.0
),
(
    '323e4567-e89b-12d3-a456-426614174200',
    '123e4567-e89b-12d3-a456-426614174000',
    '323e4567-e89b-12d3-a456-426614174100',
    'Solicitar CNIS atualizado',
    'Pedir ao cliente CNIS atualizado para análise do período rural',
    'general',
    'medium',
    'pending',
    '2024-02-20 12:00:00-03',
    '823e4567-e89b-12d3-a456-426614174000', -- Maria Silva
    false,
    0.5
),
(
    '423e4567-e89b-12d3-a456-426614174200',
    '123e4567-e89b-12d3-a456-426614174000',
    '423e4567-e89b-12d3-a456-426614174100',
    'Revisar contratos de fornecedores',
    'Analisar 5 contratos de fornecedores da TechCorp',
    'document_review',
    'medium',
    'pending',
    '2024-02-25 18:00:00-03',
    '723e4567-e89b-12d3-a456-426614174000', -- Robson
    true,
    6.0
),
(
    '523e4567-e89b-12d3-a456-426614174200',
    '123e4567-e89b-12d3-a456-426614174000',
    NULL, -- Tarefa geral do escritório
    'Reunião de equipe mensal',
    'Reunião mensal para alinhamento de casos e estratégias',
    'general',
    'low',
    'pending',
    '2024-02-28 16:00:00-03',
    NULL, -- Todos participam
    false,
    1.0
);

-- =====================================================
-- 8. TIME ENTRIES
-- =====================================================
INSERT INTO time_entries (
    id,
    law_firm_id,
    matter_id,
    user_id,
    task_id,
    description,
    hours_worked,
    work_date,
    start_time,
    end_time,
    hourly_rate,
    is_billable
) VALUES 
(
    '123e4567-e89b-12d3-a456-426614174300',
    '123e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174100',
    '823e4567-e89b-12d3-a456-426614174000', -- Maria Silva
    '123e4567-e89b-12d3-a456-426614174200',
    'Análise inicial do caso e levantamento de documentos',
    2.5,
    '2024-01-16',
    '09:00',
    '11:30',
    350.00,
    true
),
(
    '223e4567-e89b-12d3-a456-426614174300',
    '123e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174100',
    '823e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174200',
    'Pesquisa de jurisprudência e elaboração de estratégia',
    3.0,
    '2024-01-17',
    '14:00',
    '17:00',
    350.00,
    true
),
(
    '323e4567-e89b-12d3-a456-426614174300',
    '123e4567-e89b-12d3-a456-426614174000',
    '223e4567-e89b-12d3-a456-426614174100',
    '923e4567-e89b-12d3-a456-426614174000', -- Carlos Santos
    NULL,
    'Reunião com cliente para coleta de documentos trabalhistas',
    1.5,
    '2024-01-23',
    '10:00',
    '11:30',
    300.00,
    true
),
(
    '423e4567-e89b-12d3-a456-426614174300',
    '123e4567-e89b-12d3-a456-426614174000',
    '323e4567-e89b-12d3-a456-426614174100',
    '823e4567-e89b-12d3-a456-426614174000',
    NULL,
    'Análise de documentos previdenciários e CNIS do cliente',
    2.0,
    '2024-02-02',
    '09:00',
    '11:00',
    280.00,
    true
),
(
    '523e4567-e89b-12d3-a456-426614174300',
    '123e4567-e89b-12d3-a456-426614174000',
    '423e4567-e89b-12d3-a456-426614174100',
    '723e4567-e89b-12d3-a456-426614174000', -- Robson
    NULL,
    'Reunião inicial com TechCorp - levantamento de necessidades',
    1.0,
    '2024-02-06',
    '15:00',
    '16:00',
    400.00,
    true
);

-- =====================================================
-- 9. PIPELINE STAGES
-- =====================================================
INSERT INTO pipeline_stages (
    id,
    law_firm_id,
    name,
    description,
    color,
    stage_type,
    sort_order,
    is_active
) VALUES 
-- Intake Pipeline
(
    '123e4567-e89b-12d3-a456-426614174400',
    '123e4567-e89b-12d3-a456-426614174000',
    'Novos Contatos',
    'Prospects que entraram em contato inicial',
    '#6B7280',
    'intake',
    1,
    true
),
(
    '223e4567-e89b-12d3-a456-426614174400',
    '123e4567-e89b-12d3-a456-426614174000',
    'Consulta Agendada',
    'Prospects com consulta marcada',
    '#F59E0B',
    'intake',
    2,
    true
),
(
    '323e4567-e89b-12d3-a456-426614174400',
    '123e4567-e89b-12d3-a456-426614174000',
    'Proposta Enviada',
    'Proposta de honorários enviada ao cliente',
    '#3B82F6',
    'intake',
    3,
    true
),
(
    '423e4567-e89b-12d3-a456-426614174400',
    '123e4567-e89b-12d3-a456-426614174000',
    'Contrato Assinado',
    'Cliente assinou contrato de prestação de serviços',
    '#10B981',
    'intake',
    4,
    true
),
-- Not Hired Pipeline
(
    '523e4567-e89b-12d3-a456-426614174400',
    '123e4567-e89b-12d3-a456-426614174000',
    'Preço Alto',
    'Prospects que acharam o preço alto',
    '#EF4444',
    'not_hired',
    1,
    true
),
(
    '623e4567-e89b-12d3-a456-426614174400',
    '123e4567-e89b-12d3-a456-426614174000',
    'Fora da Área',
    'Casos fora da área de atuação do escritório',
    '#F97316',
    'not_hired',
    2,
    true
),
(
    '723e4567-e89b-12d3-a456-426614174400',
    '123e4567-e89b-12d3-a456-426614174000',
    'Sem Interesse',
    'Prospects que perderam interesse',
    '#8B5CF6',
    'not_hired',
    3,
    true
);

-- =====================================================
-- 10. PIPELINE CARDS
-- =====================================================
INSERT INTO pipeline_cards (
    id,
    law_firm_id,
    pipeline_stage_id,
    contact_id,
    matter_type_id,
    title,
    description,
    estimated_value,
    probability,
    expected_close_date,
    last_contact_date,
    next_follow_up_date,
    assigned_to,
    source,
    notes,
    tags
) VALUES 
(
    '123e4567-e89b-12d3-a456-426614174500',
    '123e4567-e89b-12d3-a456-426614174000',
    '223e4567-e89b-12d3-a456-426614174400', -- Consulta Agendada
    NULL, -- Novo prospect, ainda não é contact
    '323e4567-e89b-12d3-a456-426614174000', -- Direito Civil
    'Ana Paula - Divórcio Consensual',
    'Cliente interessada em divórcio consensual, tem consulta agendada',
    3500.00,
    75.00,
    '2024-02-25',
    '2024-02-10',
    '2024-02-15',
    '823e4567-e89b-12d3-a456-426614174000', -- Maria Silva
    'google',
    'Cliente parece decidida, já tem documentos organizados',
    '["divorcio", "consensual", "alta_probabilidade"]'
),
(
    '223e4567-e89b-12d3-a456-426614174500',
    '123e4567-e89b-12d3-a456-426614174000',
    '323e4567-e89b-12d3-a456-426614174400', -- Proposta Enviada
    NULL,
    '423e4567-e89b-12d3-a456-426614174000', -- Direito Trabalhista
    'Roberto Silva - Demissão por Justa Causa',
    'Funcionário demitido por justa causa, contesta a demissão',
    8000.00,
    60.00,
    '2024-03-05',
    '2024-02-08',
    '2024-02-20',
    '923e4567-e89b-12d3-a456-426614174000', -- Carlos Santos
    'indicação',
    'Caso complexo, mas com boas chances de sucesso',
    '["trabalhista", "justa_causa", "complexo"]'
),
(
    '323e4567-e89b-12d3-a456-426614174500',
    '123e4567-e89b-12d3-a456-426614174000',
    '523e4567-e89b-12d3-a456-426614174400', -- Preço Alto (Not Hired)
    NULL,
    '323e4567-e89b-12d3-a456-426614174000', -- Direito Civil
    'Empresário - Cobrança Judicial',
    'Empresário achou o preço alto para cobrança de R$ 5.000',
    2500.00,
    0.00,
    NULL,
    '2024-02-05',
    NULL,
    '823e4567-e89b-12d3-a456-426614174000',
    'website',
    'Cliente achou muito caro cobrar 30% de um valor baixo',
    '["cobranca", "preco_alto", "valor_baixo"]'
);

-- =====================================================
-- 11. DOCUMENTS (Sample document references)
-- =====================================================
INSERT INTO documents (
    id,
    law_firm_id,
    matter_id,
    contact_id,
    name,
    description,
    file_type,
    file_size,
    storage_provider,
    storage_path,
    document_type,
    category,
    is_confidential,
    access_level,
    version,
    tags
) VALUES 
(
    '123e4567-e89b-12d3-a456-426614174600',
    '123e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174100',
    'c23e4567-e89b-12d3-a456-426614174000',
    'Boletim de Ocorrência - Acidente',
    'Boletim de ocorrência do acidente de trânsito',
    'pdf',
    245760, -- ~240KB
    'google_drive',
    '/matters/MAT-2024-001/evidence/bo_acidente.pdf',
    'evidence',
    'documentos_caso',
    false,
    'internal',
    '1.0',
    '["bo", "acidente", "evidencia"]'
),
(
    '223e4567-e89b-12d3-a456-426614174600',
    '123e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174100',
    'c23e4567-e89b-12d3-a456-426614174000',
    'Laudo Médico',
    'Laudo médico detalhando lesões do acidente',
    'pdf',
    189440, -- ~185KB
    'google_drive',
    '/matters/MAT-2024-001/evidence/laudo_medico.pdf',
    'evidence',
    'documentos_medicos',
    true,
    'confidential',
    '1.0',
    '["laudo", "medico", "lesoes"]'
),
(
    '323e4567-e89b-12d3-a456-426614174600',
    '123e4567-e89b-12d3-a456-426614174000',
    '223e4567-e89b-12d3-a456-426614174100',
    'd23e4567-e89b-12d3-a456-426614174000',
    'CTPS - Maria Fernandes',
    'Carteira de Trabalho digitalizada da cliente',
    'pdf',
    356352, -- ~348KB
    'google_drive',
    '/matters/MAT-2024-002/documents/ctps_maria.pdf',
    'personal_document',
    'documentos_trabalhista',
    true,
    'confidential',
    '1.0',
    '["ctps", "trabalhista", "documento_pessoal"]'
),
(
    '423e4567-e89b-12d3-a456-426614174600',
    '123e4567-e89b-12d3-a456-426614174000',
    '323e4567-e89b-12d3-a456-426614174100',
    'f23e4567-e89b-12d3-a456-426614174000',
    'CNIS - Pedro Santos',
    'Cadastro Nacional de Informações Sociais',
    'pdf',
    412688, -- ~403KB
    'google_drive',
    '/matters/MAT-2024-003/documents/cnis_pedro.pdf',
    'government_document',
    'documentos_previdenciarios',
    true,
    'confidential',
    '1.0',
    '["cnis", "previdenciario", "inss"]'
);

-- Re-enable RLS
SET row_security = on;

-- =====================================================
-- COMMENTS AND FINAL NOTES
-- =====================================================

COMMENT ON SCHEMA public IS 'Prima Facie sample data includes realistic scenarios for Brazilian law firm operations';

-- Sample data includes:
-- - 2 law firms (Dávila Reis Advocacia and Silva & Associados)
-- - 5 staff members across both firms
-- - 4 clients with different case types
-- - 4 active legal matters covering different practice areas
-- - Various tasks, time entries, and pipeline cards
-- - Document references for each matter type
-- - Realistic Brazilian legal context (court names, case numbers, etc.)

-- This seed data provides a solid foundation for:
-- - Testing multi-tenant isolation
-- - Demonstrating different user roles and permissions
-- - Showcasing various case types and workflows
-- - Testing billing and time tracking features
-- - Validating client intake pipeline functionality