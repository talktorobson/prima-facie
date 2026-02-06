-- =============================================
-- PRIMA FACIE SEED DATA - STEP 4: FINANCIAL MANAGEMENT
-- Vendors, bills, payments, and financial data
-- =============================================

BEGIN;

-- =============================================
-- SEED MESSAGES (Chat functionality)
-- =============================================

INSERT INTO messages (id, law_firm_id, matter_id, contact_id, content, message_type, sender_type, 
                     receiver_type, status, created_at) VALUES

-- Messages for active matters
('f1a1b1c1-c1a1-1111-1111-111111111001', '123e4567-e89b-12d3-a456-426614174000', '55555555-5555-5555-5555-555555555001', '33333333-3333-3333-3333-333333333001', 'Olá Carlos, estamos iniciando a análise do seu caso trabalhista. Em breve enviaremos o cronograma de ações.', 'text', 'user', 'contact', 'delivered', '2024-01-16 10:30:00'),

('f1a1b1c1-1111-1111-1111-111111111002', '123e4567-e89b-12d3-a456-426614174000', '55555555-5555-5555-5555-555555555001', '33333333-3333-3333-3333-333333333001', 'Perfeito! Estou aguardando. Quando vocês acham que teremos a primeira audiência?', 'text', 'contact', 'user', 'read', '2024-01-16 11:45:00'),

('f1a1b1c1-1111-1111-1111-111111111003', '123e4567-e89b-12d3-a456-426614174000', '55555555-5555-5555-5555-555555555001', '33333333-3333-3333-3333-333333333001', 'A audiência inicial está marcada para 15 de abril. Já enviaremos a notificação oficial.', 'text', 'user', 'contact', 'delivered', '2024-01-17 09:15:00'),

('f1a1b1c1-1111-1111-1111-111111111004', '123e4567-e89b-12d3-a456-426614174000', '55555555-5555-5555-5555-555555555002', '33333333-3333-3333-3333-333333333002', 'Mariana, o processo de divórcio foi homologado! Parabéns pelo novo começo.', 'text', 'user', 'contact', 'read', '2024-02-18 14:20:00'),

('f1a1b1c1-1111-1111-1111-111111111005', '123e4567-e89b-12d3-a456-426614174000', '55555555-5555-5555-5555-555555555002', '33333333-3333-3333-3333-333333333002', 'Muito obrigada! Vocês foram excepcionais durante todo o processo. Recomendarei para todos!', 'text', 'contact', 'user', 'read', '2024-02-18 15:30:00'),

('f2a2b2c2-2222-2222-2222-222222222001', '234e4567-e89b-12d3-a456-426614174001', '66666666-6666-6666-6666-666666666001', '44444444-4444-4444-4444-444444444001', 'Bom dia! O plano de reestruturação societária está na fase final de elaboração. Agendaremos apresentação para próxima semana.', 'text', 'user', 'contact', 'delivered', '2024-01-28 09:00:00'),

('f2a2b2c2-2222-2222-2222-222222222002', '234e4567-e89b-12d3-a456-426614174001', '66666666-6666-6666-6666-666666666002', '44444444-4444-4444-4444-444444444002', 'Fernando, conseguimos uma redução significativa no auto de infração. Recurso protocolado no TRF.', 'text', 'user', 'contact', 'delivered', '2024-02-26 16:45:00');

-- =============================================
-- SEED PIPELINE STAGES
-- =============================================

INSERT INTO pipeline_stages (id, law_firm_id, name, description, color, stage_type, sort_order, is_active) VALUES

-- Dávila Reis pipeline stages
('f3a3b3c3-1111-1111-1111-111111111001', '123e4567-e89b-12d3-a456-426614174000', 'Primeiro Contato', 'Cliente entrou em contato pela primeira vez', '#3B82F6', 'intake', 1, true),

('f3a3b3c3-1111-1111-1111-111111111002', '123e4567-e89b-12d3-a456-426614174000', 'Consulta Agendada', 'Consulta inicial agendada com o cliente', '#F59E0B', 'intake', 2, true),

('f3a3b3c3-1111-1111-1111-111111111003', '123e4567-e89b-12d3-a456-426614174000', 'Proposta Enviada', 'Proposta de honorários enviada ao cliente', '#8B5CF6', 'intake', 3, true),

('f3a3b3c3-1111-1111-1111-111111111004', '123e4567-e89b-12d3-a456-426614174000', 'Cliente Assinado', 'Contrato assinado, cliente oficializado', '#10B981', 'onboarding', 4, true),

('f3a3b3c3-1111-1111-1111-111111111005', '123e4567-e89b-12d3-a456-426614174000', 'Não Contratou', 'Cliente optou por não contratar os serviços', '#EF4444', 'not_hired', 5, true),

-- Silva & Associados pipeline stages
('f5a5b5c5-2222-2222-2222-222222222001', '234e4567-e89b-12d3-a456-426614174001', 'Lead Qualificado', 'Lead empresarial qualificado para atendimento', '#059669', 'intake', 1, true),

('f5a5b5c5-2222-2222-2222-222222222002', '234e4567-e89b-12d3-a456-426614174001', 'Reunião Comercial', 'Reunião comercial agendada com decisor', '#DC2626', 'intake', 2, true),

('f5a5b5c5-2222-2222-2222-222222222003', '234e4567-e89b-12d3-a456-426614174001', 'Proposta Técnica', 'Proposta técnica e comercial em elaboração', '#7C3AED', 'intake', 3, true),

('f5a5b5c5-2222-2222-2222-222222222004', '234e4567-e89b-12d3-a456-426614174001', 'Cliente Corporativo', 'Cliente corporativo convertido', '#059669', 'onboarding', 4, true);

-- =============================================
-- SEED PIPELINE CARDS
-- =============================================

INSERT INTO pipeline_cards (id, law_firm_id, pipeline_stage_id, contact_id, matter_type_id, title, description,
                           estimated_value, probability, expected_close_date, source, notes) VALUES

-- Dávila Reis pipeline cards
('f6a6b6c6-1111-1111-1111-111111111001', '123e4567-e89b-12d3-a456-426614174000', 'f3a3b3c3-1111-1111-1111-111111111001', null, '11111111-1111-1111-1111-111111111001', 'Potencial cliente trabalhista', 'Funcionário demitido procurando assessoria para reclamatória', 3500.00, 70, '2024-04-15', 'Indicação', 'Cliente com bom caso, empresa grande'),

('f6a6b6c6-1111-1111-1111-111111111002', '123e4567-e89b-12d3-a456-426614174000', 'f3a3b3c3-1111-1111-1111-111111111002', null, '11111111-1111-1111-1111-111111111004', 'Casal para divórcio', 'Casal com patrimônio significativo, divórcio litigioso', 8000.00, 85, '2024-04-20', 'Site', 'Requer mediação, patrimônio complexo'),

('f6a6b6c6-1111-1111-1111-111111111003', '123e4567-e89b-12d3-a456-426614174000', 'f3a3b3c3-1111-1111-1111-111111111003', null, '11111111-1111-1111-1111-111111111003', 'Defesa criminal urgente', 'Empresário acusado de crime financeiro', 15000.00, 60, '2024-03-30', 'Telefone', 'Caso complexo, cliente com recursos'),

-- Silva & Associados pipeline cards
('f8a8b8c8-2222-2222-2222-222222222001', '234e4567-e89b-12d3-a456-426614174001', 'f5a5b5c5-2222-2222-2222-222222222001', null, '22222222-2222-2222-2222-222222222002', 'Multinacional - Compliance', 'Empresa multinacional precisando de compliance tributário', 50000.00, 80, '2024-04-30', 'LinkedIn', 'Grande oportunidade, projeto anual'),

('f8a8b8c8-2222-2222-2222-222222222002', '234e4567-e89b-12d3-a456-426614174001', 'f5a5b5c5-2222-2222-2222-222222222002', null, '22222222-2222-2222-2222-222222222003', 'Startup - Propriedade Intelectual', 'Startup de tecnologia com várias invenções para proteger', 25000.00, 75, '2024-04-10', 'Evento', 'Startup promissora, múltiplos registros');

-- =============================================
-- SEED ACTIVITY LOGS
-- =============================================

INSERT INTO activity_logs (id, law_firm_id, action, entity_type, entity_id, description, created_at) VALUES

('f9a9b9c9-1111-1111-1111-111111111001', '123e4567-e89b-12d3-a456-426614174000', 'CREATE', 'matter', '55555555-5555-5555-5555-555555555001', 'Nova ação trabalhista criada para Carlos Eduardo Silva', '2024-01-15 09:30:00'),

('f9a9b9c9-1111-1111-1111-111111111002', '123e4567-e89b-12d3-a456-426614174000', 'UPDATE', 'matter', '55555555-5555-5555-5555-555555555002', 'Status do divórcio atualizado para "fechado" - processo concluído', '2024-02-18 14:15:00'),

('f9a9b9c9-1111-1111-1111-111111111003', '123e4567-e89b-12d3-a456-426614174000', 'CREATE', 'invoice', 'f4a4b4c4-1111-1111-1111-111111111001', 'Fatura INV-2024-001 criada para Carlos Eduardo Silva', '2024-01-25 11:00:00'),

('f9a9b9c9-1111-1111-1111-111111111004', '123e4567-e89b-12d3-a456-426614174000', 'PAYMENT', 'invoice', 'f4a4b4c4-1111-1111-1111-111111111001', 'Pagamento de R$ 2.250,00 recebido via PIX', '2024-02-10 15:20:00'),

('fa1afa1a-2222-2222-2222-222222222001', '234e4567-e89b-12d3-a456-426614174001', 'CREATE', 'matter', '66666666-6666-6666-6666-666666666001', 'Novo projeto de reestruturação societária para Indústria Brasileira SA', '2024-01-10 08:45:00'),

('fa1afa1a-2222-2222-2222-222222222002', '234e4567-e89b-12d3-a456-426614174001', 'CREATE', 'invoice', 'f7a7b7c7-2222-2222-2222-222222222001', 'Fatura INV-2024-001 criada para Indústria Brasileira SA', '2024-01-30 16:30:00'),

('fa1afa1a-2222-2222-2222-222222222003', '234e4567-e89b-12d3-a456-426614174001', 'UPDATE', 'matter', '66666666-6666-6666-6666-666666666002', 'Recurso protocolado no TRF para Fernando Rodrigues Almeida', '2024-02-25 10:00:00');

-- =============================================
-- SEED DOCUMENTS (if table exists)
-- =============================================

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'documents') THEN
        
        INSERT INTO documents (id, law_firm_id, matter_id, contact_id, name, description, file_type, 
                              file_size, document_type, category, is_confidential, access_level) VALUES
        
        ('f8a8b8c8-1111-1111-1111-111111111001', '123e4567-e89b-12d3-a456-426614174000', '55555555-5555-5555-5555-555555555001', '33333333-3333-3333-3333-333333333001', 'Petição Inicial - Ação Trabalhista', 'Petição inicial da reclamação trabalhista de Carlos Eduardo Silva', 'PDF', 2048576, 'Petição', 'Processual', true, 'internal'),
        
        ('f8a8b8c8-1111-1111-1111-111111111002', '123e4567-e89b-12d3-a456-426614174000', '55555555-5555-5555-5555-555555555001', '33333333-3333-3333-3333-333333333001', 'CTPS - Carlos Silva', 'Carteira de Trabalho digitalizada do cliente', 'PDF', 1536000, 'Documento Pessoal', 'Trabalhista', true, 'confidential'),
        
        ('f8a8b8c8-1111-1111-1111-111111111003', '123e4567-e89b-12d3-a456-426614174000', '55555555-5555-5555-5555-555555555002', '33333333-3333-3333-3333-333333333002', 'Certidão de Casamento', 'Certidão de casamento para processo de divórcio', 'PDF', 1024000, 'Certidão', 'Família', false, 'internal'),
        
        ('f8a8b8c8-1111-1111-1111-111111111004', '123e4567-e89b-12d3-a456-426614174000', '55555555-5555-5555-5555-555555555002', '33333333-3333-3333-3333-333333333002', 'Acordo de Partilha', 'Acordo de partilha de bens do casal', 'PDF', 1792000, 'Acordo', 'Família', true, 'internal'),
        
        ('f9a9b9c9-2222-2222-2222-222222222001', '234e4567-e89b-12d3-a456-426614174001', '66666666-6666-6666-6666-666666666001', '44444444-4444-4444-4444-444444444001', 'Contrato Social Atual', 'Contrato social vigente da Indústria Brasileira SA', 'PDF', 3072000, 'Contrato Social', 'Societário', true, 'confidential'),
        
        ('f9a9b9c9-2222-2222-2222-222222222002', '234e4567-e89b-12d3-a456-426614174001', '66666666-6666-6666-6666-666666666001', '44444444-4444-4444-4444-444444444001', 'Demonstrações Financeiras', 'Balanço patrimonial e DRE dos últimos 3 anos', 'Excel', 5120000, 'Financeiro', 'Contabilidade', true, 'confidential'),
        
        ('f9a9b9c9-2222-2222-2222-222222222003', '234e4567-e89b-12d3-a456-426614174001', '66666666-6666-6666-6666-666666666002', '44444444-4444-4444-4444-444444444002', 'Auto de Infração RFB', 'Auto de infração da Receita Federal', 'PDF', 2560000, 'Auto de Infração', 'Tributário', true, 'restricted');

        RAISE NOTICE 'Documents inserted successfully';
    ELSE
        RAISE NOTICE 'Documents table does not exist, skipping...';
    END IF;
END $$;

-- =============================================
-- SEED VENDORS (if table exists)
-- =============================================

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'vendors') THEN
        
        INSERT INTO vendors (id, law_firm_id, vendor_type, name, cnpj, email, phone, 
                           address_street, address_number, address_city, address_state, address_zipcode,
                           preferred_payment_method, payment_terms, is_active) VALUES
        
        -- Common legal industry vendors
        ('faa1baa1-1111-1111-1111-111111111001', '123e4567-e89b-12d3-a456-426614174000', 'service_provider', 'Tribunal de Justiça de SP', '12.345.678/0001-99', 'protocolo@tjsp.jus.br', '(11) 3017-1000', 'Praça da Sé', 's/n', 'São Paulo', 'SP', '01019-900', 'bank_transfer', '30_days', true),
        
        ('faa1baa1-1111-1111-1111-111111111002', '123e4567-e89b-12d3-a456-426614174000', 'supplier', 'Papelaria Jurídica SP', '98.765.432/0001-11', 'vendas@papelariajuridica.com.br', '(11) 3256-7890', 'Rua Liberdade', '456', 'São Paulo', 'SP', '01503-000', 'pix', '15_days', true),
        
        ('faa1baa1-1111-1111-1111-111111111003', '123e4567-e89b-12d3-a456-426614174000', 'service_provider', 'Contador Silva & Cia', '11.222.333/0001-44', 'contato@contadorsilva.com.br', '(11) 3789-0123', 'Avenida São João', '1200', 'São Paulo', 'SP', '01036-100', 'bank_transfer', '30_days', true),
        
        ('faa1baa1-1111-1111-1111-111111111004', '123e4567-e89b-12d3-a456-426614174000', 'other', 'Enel Distribuição SP', '61.695.227/0001-93', 'atendimento@enel.com', '0800-727-0196', 'Rua Ática', '405', 'São Paulo', 'SP', '04194-901', 'bank_transfer', '30_days', true),
        
        -- Silva & Associados vendors
        ('fbb2cbb2-2222-2222-2222-222222222001', '234e4567-e89b-12d3-a456-426614174001', 'government', 'Receita Federal do Brasil', '33.444.555/0001-77', 'atendimento@rfb.gov.br', '146', 'Avenida Presidente Vargas', '730', 'Rio de Janeiro', 'RJ', '20071-900', 'bank_transfer', 'immediate', true),
        
        ('fbb2cbb2-2222-2222-2222-222222222002', '234e4567-e89b-12d3-a456-426614174001', 'supplier', 'Thomson Reuters Brasil', '04.932.574/0001-56', 'vendas@thomsonreuters.com.br', '(11) 3049-7800', 'Avenida das Nações Unidas', '8501', 'São Paulo', 'SP', '05425-070', 'bank_transfer', '30_days', true),
        
        ('fbb2cbb2-2222-2222-2222-222222222003', '234e4567-e89b-12d3-a456-426614174001', 'government', 'Instituto Nacional da Propriedade Industrial', '42.107.437/0001-55', 'dirpa@inpi.gov.br', '(21) 3037-3000', 'Rua Mayrink Veiga', '9', 'Rio de Janeiro', 'RJ', '20090-910', 'bank_transfer', '30_days', true);

        RAISE NOTICE 'Vendors inserted successfully';
    ELSE
        RAISE NOTICE 'Vendors table does not exist, skipping...';
    END IF;
END $$;

-- =============================================
-- SEED EXPENSE CATEGORIES (if table exists)
-- =============================================

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'expense_categories') THEN
        
        INSERT INTO expense_categories (id, law_firm_id, category_name, description, is_tax_deductible, 
                                      requires_approval, approval_threshold, is_active) VALUES
        
        -- Dávila Reis expense categories
        ('fcc3dcc3-1111-1111-1111-111111111001', '123e4567-e89b-12d3-a456-426614174000', 'Custas Judiciais', 'Custas e taxas processuais', true, true, 1000.00, true),
        
        ('fcc3dcc3-1111-1111-1111-111111111002', '123e4567-e89b-12d3-a456-426614174000', 'Despesas com Locomoção', 'Transporte para audiências e diligências', true, false, 500.00, true),
        
        ('fcc3dcc3-1111-1111-1111-111111111003', '123e4567-e89b-12d3-a456-426614174000', 'Material de Escritório', 'Papelaria, impressão e material de expediente', true, false, 300.00, true),
        
        -- Silva & Associados expense categories  
        ('fee5aff5-2222-2222-2222-222222222001', '234e4567-e89b-12d3-a456-426614174001', 'Taxas Governamentais', 'Taxas de órgãos públicos e registros', true, true, 2000.00, true),
        
        ('fee5aff5-2222-2222-2222-222222222002', '234e4567-e89b-12d3-a456-426614174001', 'Software Jurídico', 'Licenças de software especializado', true, true, 5000.00, true);

        RAISE NOTICE 'Expense categories inserted successfully';
    ELSE
        RAISE NOTICE 'Expense categories table does not exist, skipping...';
    END IF;
END $$;

-- =============================================
-- SEED BILLS (if table exists)
-- =============================================

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'bills') THEN
        
        INSERT INTO bills (id, law_firm_id, vendor_id, bill_number, vendor_invoice_number, title,
                          amount, tax_amount, total_amount, bill_date, due_date, status, 
                          payment_method, description, category, notes) VALUES
        
        -- Dávila Reis bills
        ('fdd4edd4-1111-1111-1111-111111111001', '123e4567-e89b-12d3-a456-426614174000', 'faa1baa1-1111-1111-1111-111111111001', 'BILL-2024-001', 'TJSP-45632', 'Custas Processuais', 850.00, 0.00, 850.00, '2024-01-20', '2024-02-20', 'paid', 'bank_transfer', 'Custas da ação trabalhista de Carlos Silva', 'Custas Judiciais', 'Pago via transferência bancária'),
        
        ('fdd4edd4-1111-1111-1111-111111111002', '123e4567-e89b-12d3-a456-426614174000', 'faa1baa1-1111-1111-1111-111111111002', 'BILL-2024-002', 'PAP-7891', 'Material de Escritório', 450.00, 45.00, 495.00, '2024-02-01', '2024-02-16', 'paid', 'pix', 'Material de escritório fevereiro', 'Suprimentos', 'Pagamento via PIX'),
        
        ('fdd4edd4-1111-1111-1111-111111111003', '123e4567-e89b-12d3-a456-426614174000', 'faa1baa1-1111-1111-1111-111111111003', 'BILL-2024-003', 'CONT-2024-02', 'Serviços Contábeis', 2800.00, 280.00, 3080.00, '2024-02-28', '2024-03-30', 'pending', 'bank_transfer', 'Serviços contábeis fevereiro 2024', 'Serviços Profissionais', 'Aguardando aprovação'),
        
        ('fdd4edd4-1111-1111-1111-111111111004', '123e4567-e89b-12d3-a456-426614174000', 'faa1baa1-1111-1111-1111-111111111004', 'BILL-2024-004', 'ENEL-MAR24', 'Energia Elétrica', 680.00, 68.00, 748.00, '2024-03-05', '2024-03-20', 'approved', 'bank_transfer', 'Conta de energia elétrica março', 'Utilidades', 'Aprovado para pagamento'),
        
        -- Silva & Associados bills
        ('f2a2b2c2-2222-2222-2222-222222222001', '234e4567-e89b-12d3-a456-426614174001', 'fbb2cbb2-2222-2222-2222-222222222001', 'BILL-2024-001', 'RFB-158742', 'Taxa Judicial TRF', 1250.00, 0.00, 1250.00, '2024-02-15', '2024-02-15', 'paid', 'bank_transfer', 'Taxa de recurso TRF - Fernando Almeida', 'Taxas Governamentais', 'Pago no vencimento'),
        
        ('f2a2b2c2-2222-2222-2222-222222222002', '234e4567-e89b-12d3-a456-426614174001', 'fbb2cbb2-2222-2222-2222-222222222002', 'BILL-2024-002', 'TR-99821', 'Licença Thomson Reuters', 15000.00, 1500.00, 16500.00, '2024-03-01', '2024-03-31', 'approved', 'bank_transfer', 'Licença anual Thomson Reuters', 'Software e Tecnologia', 'Licença para pesquisa jurídica'),
        
        ('f2a2b2c2-2222-2222-2222-222222222003', '234e4567-e89b-12d3-a456-426614174001', 'fbb2cbb2-2222-2222-2222-222222222003', 'BILL-2024-003', 'INPI-7419', 'Taxa Registro INPI', 420.00, 0.00, 420.00, '2024-03-10', '2024-04-10', 'pending', 'bank_transfer', 'Taxa de registro de marca - Inovação Digital', 'Taxas Governamentais', 'Aguardando pagamento');

        RAISE NOTICE 'Bills inserted successfully';
    ELSE
        RAISE NOTICE 'Bills table does not exist, skipping...';
    END IF;
END $$;

-- =============================================
-- SEED SUBSCRIPTION PLANS (if table exists)
-- =============================================

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'subscription_plans') THEN
        
        INSERT INTO subscription_plans (id, law_firm_id, name, description, price_monthly, price_quarterly, price_yearly,
                                      billing_cycle, max_matters_per_month, max_consultations_per_month, 
                                      max_documents_per_month, max_hours_per_month, overage_rate_per_hour,
                                      overage_rate_per_matter, legal_areas, is_active, sort_order) VALUES
        
        -- Basic Plans
        ('faf1baf1-1111-1111-1111-111111111001', '123e4567-e89b-12d3-a456-426614174000', 'Plano Básico', 'Consultoria jurídica básica para pequenas empresas', 890.00, 2400.00, 9600.00, 'monthly', 2, 5, 10, 8.0, 150.00, 450.00, ARRAY['Trabalhista', 'Cível'], true, 1),
        
        ('faf1baf1-1111-1111-1111-111111111002', '123e4567-e89b-12d3-a456-426614174000', 'Plano Empresarial', 'Suporte jurídico completo para empresas em crescimento', 1800.00, 4800.00, 19200.00, 'monthly', 5, 15, 25, 20.0, 120.00, 380.00, ARRAY['Trabalhista', 'Tributário', 'Empresarial'], true, 2),
        
        ('faf1baf1-1111-1111-1111-111111111003', '123e4567-e89b-12d3-a456-426614174000', 'Plano Premium', 'Assessoria jurídica completa com atendimento prioritário', 3200.00, 8500.00, 34000.00, 'monthly', 10, 30, 50, 40.0, 100.00, 320.00, ARRAY['Trabalhista', 'Tributário', 'Empresarial', 'Família'], true, 3),
        
        -- Silva & Associados Plans
        ('fbf2cbf2-2222-2222-2222-222222222001', '234e4567-e89b-12d3-a456-426614174001', 'Consultoria Tributária', 'Especialização em direito tributário e fiscal', 2500.00, 6750.00, 27000.00, 'monthly', 3, 10, 20, 15.0, 180.00, 500.00, ARRAY['Tributário'], true, 1),
        
        ('fbf2cbf2-2222-2222-2222-222222222002', '234e4567-e89b-12d3-a456-426614174001', 'Corporate Plus', 'Suporte jurídico corporativo avançado', 4500.00, 12000.00, 48000.00, 'monthly', 8, 25, 40, 35.0, 150.00, 420.00, ARRAY['Empresarial', 'Tributário', 'Propriedade Intelectual'], true, 2),
        
        ('fbf2cbf2-2222-2222-2222-222222222003', '234e4567-e89b-12d3-a456-426614174001', 'Enterprise', 'Pacote completo para grandes corporações', 8500.00, 22500.00, 90000.00, 'monthly', 15, 50, 100, 60.0, 120.00, 350.00, ARRAY['Empresarial', 'Tributário', 'Propriedade Intelectual', 'Compliance'], true, 3);

        RAISE NOTICE 'Subscription plans inserted successfully';
    ELSE
        RAISE NOTICE 'Subscription plans table does not exist, skipping...';
    END IF;
END $$;

-- =============================================
-- SEED CASE TYPES (if table exists)
-- =============================================

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'case_types') THEN
        
        INSERT INTO case_types (id, law_firm_id, name, description, legal_area, complexity_level,
                              estimated_duration_months, minimum_fee, default_hourly_rate, default_flat_fee,
                              default_contingency_percentage, success_fee_percentage, billing_methods, is_active) VALUES
        
        -- Dávila Reis case types
        ('fcafbcaf-1111-1111-1111-111111111001', '123e4567-e89b-12d3-a456-426614174000', 'Ação Trabalhista Simples', 'Reclamações trabalhistas de baixa complexidade', 'Trabalhista', 'low', 6, 1500.00, 300.00, 2500.00, 25.0, 15.0, ARRAY['hourly', 'flat_fee', 'contingency'], true),
        
        ('fcafbcaf-1111-1111-1111-111111111002', '123e4567-e89b-12d3-a456-426614174000', 'Divórcio e Família', 'Processos de família e sucessões', 'Família', 'medium', 4, 1200.00, 250.00, 1800.00, 20.0, 10.0, ARRAY['hourly', 'flat_fee'], true),
        
        ('fcafbcaf-1111-1111-1111-111111111003', '123e4567-e89b-12d3-a456-426614174000', 'Defesa Criminal', 'Defesa em processos criminais', 'Criminal', 'high', 12, 3000.00, 500.00, 5000.00, 30.0, 20.0, ARRAY['hourly', 'flat_fee'], true),
        
        ('fcafbcaf-1111-1111-1111-111111111004', '123e4567-e89b-12d3-a456-426614174000', 'Cobrança Judicial', 'Ações de cobrança e execução', 'Cível', 'medium', 8, 800.00, 350.00, 2000.00, 35.0, 25.0, ARRAY['hourly', 'flat_fee', 'contingency'], true),
        
        -- Silva & Associados case types
        ('fcafccaf-2222-2222-2222-222222222001', '234e4567-e89b-12d3-a456-426614174001', 'Consultoria Tributária Complexa', 'Questões tributárias de alta complexidade', 'Tributário', 'expert', 18, 5000.00, 500.00, 8000.00, 20.0, 15.0, ARRAY['hourly', 'flat_fee'], true),
        
        ('fcafccaf-2222-2222-2222-222222222002', '234e4567-e89b-12d3-a456-426614174001', 'Reestruturação Societária', 'Processos de fusão, cisão e incorporação', 'Empresarial', 'expert', 24, 10000.00, 450.00, 15000.00, 15.0, 10.0, ARRAY['hourly', 'flat_fee'], true),
        
        ('fcafccaf-2222-2222-2222-222222222003', '234e4567-e89b-12d3-a456-426614174001', 'Propriedade Intelectual', 'Registro de marcas, patentes e direitos autorais', 'Propriedade Intelectual', 'medium', 12, 2000.00, 400.00, 2500.00, 25.0, 15.0, ARRAY['hourly', 'flat_fee'], true),
        
        ('fcafccaf-2222-2222-2222-222222222004', '234e4567-e89b-12d3-a456-426614174001', 'Compliance Corporativo', 'Implementação de programas de compliance', 'Empresarial', 'high', 6, 8000.00, 480.00, 12000.00, 20.0, 12.0, ARRAY['hourly', 'flat_fee'], true);

        RAISE NOTICE 'Case types inserted successfully';
    ELSE
        RAISE NOTICE 'Case types table does not exist, skipping...';
    END IF;
END $$;

-- =============================================
-- SEED CLIENT SUBSCRIPTIONS (if table exists)
-- =============================================

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'client_subscriptions') THEN
        
        INSERT INTO client_subscriptions (id, law_firm_id, contact_id, subscription_plan_id, status, start_date,
                                        billing_cycle, monthly_price, next_billing_date, last_billing_date,
                                        usage_current_period, discount_percentage, auto_renew) VALUES
        
        -- Active subscriptions
        ('fdffbdff-1111-1111-1111-111111111001', '123e4567-e89b-12d3-a456-426614174000', '33333333-3333-3333-3333-333333333005', 'faf1baf1-1111-1111-1111-111111111002', 'active', '2024-01-01', 'monthly', 1800.00, '2024-04-01', '2024-03-01', '{"matters": 2, "consultations": 8, "documents": 15, "hours": 12.5}', 0.0, true),
        
        ('fdffbdff-1111-1111-1111-111111111002', '123e4567-e89b-12d3-a456-426614174000', '33333333-3333-3333-3333-333333333001', 'faf1baf1-1111-1111-1111-111111111001', 'trial', '2024-03-01', 'monthly', 890.00, '2024-04-01', null, '{"matters": 1, "consultations": 3, "documents": 5, "hours": 4.0}', 0.0, true),
        
        ('fdffcdff-2222-2222-2222-222222222001', '234e4567-e89b-12d3-a456-426614174001', '44444444-4444-4444-4444-444444444001', 'fbf2cbf2-2222-2222-2222-222222222002', 'active', '2023-12-01', 'monthly', 4500.00, '2024-04-01', '2024-03-01', '{"matters": 5, "consultations": 18, "documents": 25, "hours": 28.0}', 5.0, true),
        
        ('fdffcdff-2222-2222-2222-222222222002', '234e4567-e89b-12d3-a456-426614174001', '44444444-4444-4444-4444-444444444002', 'fbf2cbf2-2222-2222-2222-222222222001', 'active', '2024-02-01', 'monthly', 2500.00, '2024-04-01', '2024-03-01', '{"matters": 2, "consultations": 6, "documents": 12, "hours": 10.5}', 0.0, true);

        RAISE NOTICE 'Client subscriptions inserted successfully';
    ELSE
        RAISE NOTICE 'Client subscriptions table does not exist, skipping...';
    END IF;
END $$;

-- =============================================
-- SEED DISCOUNT RULES (if table exists)
-- =============================================

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'discount_rules') THEN
        
        INSERT INTO discount_rules (id, law_firm_id, name, description, rule_type, discount_type, discount_value,
                                  applies_to, minimum_subscription_months, minimum_case_value, auto_apply, is_active, priority) VALUES
        
        -- Dávila Reis discount rules
        ('fedfbedf-1111-1111-1111-111111111001', '123e4567-e89b-12d3-a456-426614174000', 'Desconto Assinante Premium', 'Desconto para clientes com plano premium em casos adicionais', 'subscription_discount', 'percentage', 15.0, 'case_billing', 6, 1000.00, true, true, 1),
        
        ('fedfbedf-1111-1111-1111-111111111002', '123e4567-e89b-12d3-a456-426614174000', 'Desconto Volume Alto', 'Desconto para casos acima de R$ 10.000', 'volume_discount', 'percentage', 10.0, 'case_billing', null, 10000.00, true, true, 2),
        
        -- Silva & Associados discount rules
        ('fedfcedf-2222-2222-2222-222222222001', '234e4567-e89b-12d3-a456-426614174001', 'Cliente Corporativo Fiel', 'Desconto para clientes corporativos com mais de 12 meses', 'loyalty_discount', 'percentage', 12.0, 'all', 12, 5000.00, true, true, 1),
        
        ('fedfcedf-2222-2222-2222-222222222002', '234e4567-e89b-12d3-a456-426614174001', 'Desconto Múltiplos Casos', 'Desconto para clientes com múltiplos casos simultâneos', 'volume_discount', 'fixed_amount', 500.00, 'case_billing', null, 3000.00, false, true, 3);

        RAISE NOTICE 'Discount rules inserted successfully';
    ELSE
        RAISE NOTICE 'Discount rules table does not exist, skipping...';
    END IF;
END $$;

COMMIT;

-- Success message
SELECT 'Financial and supporting data inserted successfully!' as status;