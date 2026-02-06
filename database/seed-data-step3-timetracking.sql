-- =============================================
-- PRIMA FACIE SEED DATA - STEP 3: TIME TRACKING & INVOICES
-- Time entries, invoices, and related data
-- =============================================

BEGIN;

-- =============================================
-- SEED TIME ENTRIES
-- =============================================

INSERT INTO time_entries (id, law_firm_id, matter_id, user_id, description, hours_worked, 
                         work_date, hourly_rate, total_amount, is_billable, is_billed) VALUES

-- Time entries for Dávila Reis Advocacia
('aaaa1111-1111-1111-1111-111111111001', '123e4567-e89b-12d3-a456-426614174000', '55555555-5555-5555-5555-555555555001', '456789ab-cdef-1234-5678-9abcdef01234', 'Análise inicial do caso trabalhista - reunião com cliente', 2.5, '2024-01-16', 300.00, 750.00, true, true),

('aaaa1111-1111-1111-1111-111111111002', '123e4567-e89b-12d3-a456-426614174000', '55555555-5555-5555-5555-555555555001', '456789ab-cdef-1234-5678-9abcdef01234', 'Elaboração da petição inicial trabalhista', 4.0, '2024-01-18', 300.00, 1200.00, true, true),

('aaaa1111-1111-1111-1111-111111111003', '123e4567-e89b-12d3-a456-426614174000', '55555555-5555-5555-5555-555555555001', '456789ab-cdef-1234-5678-9abcdef01234', 'Protocolo da petição e acompanhamento', 1.0, '2024-01-20', 300.00, 300.00, true, true),

('aaaa1111-1111-1111-1111-111111111004', '123e4567-e89b-12d3-a456-426614174000', '55555555-5555-5555-5555-555555555002', '456789ab-cdef-1234-5678-9abcdef01234', 'Reunião com casal para divórcio consensual', 1.5, '2024-02-02', 250.00, 375.00, true, true),

('aaaa1111-1111-1111-1111-111111111005', '123e4567-e89b-12d3-a456-426614174000', '55555555-5555-5555-5555-555555555002', '789012cd-ef34-5678-9abc-def012345678', 'Elaboração da petição de divórcio', 3.0, '2024-02-05', 250.00, 750.00, true, true),

('aaaa1111-1111-1111-1111-111111111006', '123e4567-e89b-12d3-a456-426614174000', '55555555-5555-5555-5555-555555555002', '456789ab-cdef-1234-5678-9abcdef01234', 'Audiência de ratificação do acordo', 2.0, '2024-02-15', 250.00, 500.00, true, true),

('aaaa1111-1111-1111-1111-111111111007', '123e4567-e89b-12d3-a456-426614174000', '55555555-5555-5555-5555-555555555003', '456789ab-cdef-1234-5678-9abcdef01234', 'Estudo do caso criminal - análise de provas', 3.5, '2024-03-12', 500.00, 1750.00, true, false),

('aaaa1111-1111-1111-1111-111111111008', '123e4567-e89b-12d3-a456-426614174000', '55555555-5555-5555-5555-555555555004', '789012cd-ef34-5678-9abc-def012345678', 'Elaboração da ação de cobrança', 2.0, '2024-02-22', 350.00, 700.00, true, true),

('aaaa1111-1111-1111-1111-111111111009', '123e4567-e89b-12d3-a456-426614174000', '55555555-5555-5555-5555-555555555005', '789012cd-ef34-5678-9abc-def012345678', 'Revisão de contratos - análise de cláusulas', 4.0, '2024-03-05', 400.00, 1600.00, true, true),

('aaaa1111-1111-1111-1111-111111111010', '123e4567-e89b-12d3-a456-426614174000', '55555555-5555-5555-5555-555555555005', '456789ab-cdef-1234-5678-9abcdef01234', 'Reunião para aprovação dos contratos revisados', 1.0, '2024-03-08', 400.00, 400.00, true, false),

-- Time entries for Silva & Associados
('bbbb2222-2222-2222-2222-222222222001', '234e4567-e89b-12d3-a456-426614174001', '66666666-6666-6666-6666-666666666001', '345678bc-def1-2345-6789-abcdef123456', 'Reunião inicial - reestruturação societária', 3.0, '2024-01-12', 450.00, 1350.00, true, true),

('bbbb2222-2222-2222-2222-222222222002', '234e4567-e89b-12d3-a456-426614174001', '66666666-6666-6666-6666-666666666001', '345678bc-def1-2345-6789-abcdef123456', 'Análise da estrutura societária atual', 6.0, '2024-01-15', 450.00, 2700.00, true, true),

('bbbb2222-2222-2222-2222-222222222003', '234e4567-e89b-12d3-a456-426614174001', '66666666-6666-6666-6666-666666666001', '567890de-f123-4567-89ab-cdef12345678', 'Elaboração do plano de reestruturação', 8.0, '2024-01-20', 450.00, 3600.00, true, true),

('bbbb2222-2222-2222-2222-222222222004', '234e4567-e89b-12d3-a456-426614174001', '66666666-6666-6666-6666-666666666001', '345678bc-def1-2345-6789-abcdef123456', 'Reunião com contadores e diretoria', 2.5, '2024-01-25', 450.00, 1125.00, true, true),

('bbbb2222-2222-2222-2222-222222222005', '234e4567-e89b-12d3-a456-426614174001', '66666666-6666-6666-6666-666666666002', '345678bc-def1-2345-6789-abcdef123456', 'Análise do auto de infração da Receita', 4.0, '2024-02-16', 500.00, 2000.00, true, true),

('bbbb2222-2222-2222-2222-222222222006', '234e4567-e89b-12d3-a456-426614174001', '66666666-6666-6666-6666-666666666002', '567890de-f123-4567-89ab-cdef12345678', 'Elaboração da defesa tributária', 6.0, '2024-02-20', 500.00, 3000.00, true, true),

('bbbb2222-2222-2222-2222-222222222007', '234e4567-e89b-12d3-a456-426614174001', '66666666-6666-6666-6666-666666666002', '345678bc-def1-2345-6789-abcdef123456', 'Protocolo do recurso no TRF', 1.0, '2024-02-25', 500.00, 500.00, true, true),

('bbbb2222-2222-2222-2222-222222222008', '234e4567-e89b-12d3-a456-426614174001', '66666666-6666-6666-6666-666666666003', '567890de-f123-4567-89ab-cdef12345678', 'Consulta inicial - registro de marca', 1.5, '2024-03-16', 400.00, 600.00, true, false);

-- =============================================
-- SEED INVOICES
-- =============================================

INSERT INTO invoices (id, law_firm_id, contact_id, matter_id, invoice_number, title, description,
                     issue_date, due_date, sent_date, paid_date, subtotal, tax_amount, total_amount, 
                     paid_amount, outstanding_amount, status, currency, notes) VALUES

-- Invoices for Dávila Reis Advocacia
('cccc1111-1111-1111-1111-111111111001', '123e4567-e89b-12d3-a456-426614174000', '33333333-3333-3333-3333-333333333001', '55555555-5555-5555-5555-555555555001', 'INV-2024-001', 'Honorários - Ação Trabalhista', 'Cobrança de honorários pela ação trabalhista em andamento', '2024-01-25', '2024-02-24', '2024-01-25', '2024-02-10', 2250.00, 0.00, 2250.00, 2250.00, 0.00, 'paid', 'BRL', 'Pagamento recebido via PIX'),

('cccc1111-1111-1111-1111-111111111002', '123e4567-e89b-12d3-a456-426614174000', '33333333-3333-3333-3333-333333333002', '55555555-5555-5555-5555-555555555002', 'INV-2024-002', 'Honorários - Divórcio Consensual', 'Cobrança pelos serviços de divórcio consensual', '2024-02-10', '2024-03-12', '2024-02-10', '2024-02-20', 1625.00, 162.50, 1787.50, 1787.50, 0.00, 'paid', 'BRL', 'Processo finalizado com sucesso'),

('cccc1111-1111-1111-1111-111111111003', '123e4567-e89b-12d3-a456-426614174000', '33333333-3333-3333-3333-333333333004', '55555555-5555-5555-5555-555555555004', 'INV-2024-003', 'Honorários - Ação de Cobrança', 'Primeira parcela dos honorários da ação de cobrança', '2024-02-28', '2024-03-30', '2024-02-28', null, 1400.00, 140.00, 1540.00, 800.00, 740.00, 'sent', 'BRL', 'Pagamento parcial recebido'),

('cccc1111-1111-1111-1111-111111111004', '123e4567-e89b-12d3-a456-426614174000', '33333333-3333-3333-3333-333333333005', '55555555-5555-5555-5555-555555555005', 'INV-2024-004', 'Honorários - Revisão Contratual', 'Serviços de revisão e análise de contratos', '2024-03-10', '2024-04-09', '2024-03-10', null, 2000.00, 200.00, 2200.00, 0.00, 2200.00, 'sent', 'BRL', 'Aguardando pagamento'),

-- Invoices for Silva & Associados  
('dddd2222-2222-2222-2222-222222222001', '234e4567-e89b-12d3-a456-426614174001', '44444444-4444-4444-4444-444444444001', '66666666-6666-6666-6666-666666666001', 'SA-INV-2024-001', 'Consultoria - Reestruturação Societária', 'Primeira etapa da consultoria para reestruturação', '2024-01-30', '2024-02-29', '2024-01-30', '2024-02-15', 8775.00, 877.50, 9652.50, 9652.50, 0.00, 'paid', 'BRL', 'Grande projeto em andamento'),

('dddd2222-2222-2222-2222-222222222002', '234e4567-e89b-12d3-a456-426614174001', '44444444-4444-4444-4444-444444444001', '66666666-6666-6666-6666-666666666001', 'SA-INV-2024-002', 'Consultoria - Reestruturação Fase 2', 'Segunda etapa do projeto de reestruturação societária', '2024-02-28', '2024-03-30', '2024-02-28', null, 5500.00, 550.00, 6050.00, 6050.00, 0.00, 'paid', 'BRL', 'Pagamento antecipado pelo cliente'),

('dddd2222-2222-2222-2222-222222222003', '234e4567-e89b-12d3-a456-426614174001', '44444444-4444-4444-4444-444444444002', '66666666-6666-6666-6666-666666666002', 'SA-INV-2024-003', 'Defesa Tributária - TRF', 'Honorários pela defesa no Tribunal Regional Federal', '2024-03-01', '2024-03-31', '2024-03-01', null, 5500.00, 550.00, 6050.00, 3000.00, 3050.00, 'sent', 'BRL', 'Pagamento em duas parcelas acordado');

-- =============================================
-- SEED INVOICE LINE ITEMS
-- =============================================

INSERT INTO invoice_line_items (id, invoice_id, time_entry_id, description, quantity, rate, amount, item_type, service_date) VALUES

-- Line items for invoice INV-2024-001 (Ação Trabalhista)
('eeee1111-1111-1111-1111-111111111001', 'cccc1111-1111-1111-1111-111111111001', 'aaaa1111-1111-1111-1111-111111111001', 'Análise inicial do caso trabalhista - reunião com cliente', 2.5, 300.00, 750.00, 'time', '2024-01-16'),

('eeee1111-1111-1111-1111-111111111002', 'cccc1111-1111-1111-1111-111111111001', 'aaaa1111-1111-1111-1111-111111111002', 'Elaboração da petição inicial trabalhista', 4.0, 300.00, 1200.00, 'time', '2024-01-18'),

('eeee1111-1111-1111-1111-111111111003', 'cccc1111-1111-1111-1111-111111111001', 'aaaa1111-1111-1111-1111-111111111003', 'Protocolo da petição e acompanhamento', 1.0, 300.00, 300.00, 'time', '2024-01-20'),

-- Line items for invoice INV-2024-002 (Divórcio)
('eeee1111-1111-1111-1111-111111111004', 'cccc1111-1111-1111-1111-111111111002', 'aaaa1111-1111-1111-1111-111111111004', 'Reunião com casal para divórcio consensual', 1.5, 250.00, 375.00, 'time', '2024-02-02'),

('eeee1111-1111-1111-1111-111111111005', 'cccc1111-1111-1111-1111-111111111002', 'aaaa1111-1111-1111-1111-111111111005', 'Elaboração da petição de divórcio', 3.0, 250.00, 750.00, 'time', '2024-02-05'),

('eeee1111-1111-1111-1111-111111111006', 'cccc1111-1111-1111-1111-111111111002', 'aaaa1111-1111-1111-1111-111111111006', 'Audiência de ratificação do acordo', 2.0, 250.00, 500.00, 'time', '2024-02-15'),

-- Line items for invoice INV-2024-003 (Ação de Cobrança)
('eeee1111-1111-1111-1111-111111111007', 'cccc1111-1111-1111-1111-111111111003', 'aaaa1111-1111-1111-1111-111111111008', 'Elaboração da ação de cobrança', 2.0, 350.00, 700.00, 'time', '2024-02-22'),

('eeee1111-1111-1111-1111-111111111008', 'cccc1111-1111-1111-1111-111111111003', null, 'Custas judiciais', 1.0, 700.00, 700.00, 'expense', '2024-02-22'),

-- Line items for invoice INV-2024-004 (Revisão Contratual)
('eeee1111-1111-1111-1111-111111111009', 'cccc1111-1111-1111-1111-111111111004', 'aaaa1111-1111-1111-1111-111111111009', 'Revisão de contratos - análise de cláusulas', 4.0, 400.00, 1600.00, 'time', '2024-03-05'),

('eeee1111-1111-1111-1111-111111111010', 'cccc1111-1111-1111-1111-111111111004', 'aaaa1111-1111-1111-1111-111111111010', 'Reunião para aprovação dos contratos revisados', 1.0, 400.00, 400.00, 'time', '2024-03-08'),

-- Line items for Silva & Associados invoices
('ffff2222-2222-2222-2222-222222222001', 'dddd2222-2222-2222-2222-222222222001', 'bbbb2222-2222-2222-2222-222222222001', 'Reunião inicial - reestruturação societária', 3.0, 450.00, 1350.00, 'time', '2024-01-12'),

('ffff2222-2222-2222-2222-222222222002', 'dddd2222-2222-2222-2222-222222222001', 'bbbb2222-2222-2222-2222-222222222002', 'Análise da estrutura societária atual', 6.0, 450.00, 2700.00, 'time', '2024-01-15'),

('ffff2222-2222-2222-2222-222222222003', 'dddd2222-2222-2222-2222-222222222001', 'bbbb2222-2222-2222-2222-222222222003', 'Elaboração do plano de reestruturação', 8.0, 450.00, 3600.00, 'time', '2024-01-20'),

('ffff2222-2222-2222-2222-222222222004', 'dddd2222-2222-2222-2222-222222222001', 'bbbb2222-2222-2222-2222-222222222004', 'Reunião com contadores e diretoria', 2.5, 450.00, 1125.00, 'time', '2024-01-25');

-- Update invoice totals based on line items (calculated manually for consistency)
UPDATE invoices SET
    subtotal = CASE 
        WHEN id = 'cccc1111-1111-1111-1111-111111111001' THEN 2250.00
        WHEN id = 'cccc1111-1111-1111-1111-111111111002' THEN 1625.00
        WHEN id = 'cccc1111-1111-1111-1111-111111111003' THEN 1400.00
        WHEN id = 'cccc1111-1111-1111-1111-111111111004' THEN 2000.00
        WHEN id = 'dddd2222-2222-2222-2222-222222222001' THEN 8775.00
        ELSE subtotal
    END,
    outstanding_amount = total_amount - paid_amount
WHERE id IN (
    'cccc1111-1111-1111-1111-111111111001',
    'cccc1111-1111-1111-1111-111111111002', 
    'cccc1111-1111-1111-1111-111111111003',
    'cccc1111-1111-1111-1111-111111111004',
    'dddd2222-2222-2222-2222-222222222001'
);

COMMIT;

-- Success message
SELECT 'Time tracking and invoices seed data inserted successfully!' as status;