-- =============================================
-- PRIMA FACIE DEFAULT DATA SEEDING
-- =============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- EXPENSE CATEGORIES (Brazilian Legal Context)
-- =============================================

INSERT INTO expense_categories (id, law_firm_id, category_name, category_code, description, default_tax_treatment, requires_receipt, is_active, is_billable_to_clients) VALUES
-- Generate a sample law firm ID for seeding
(uuid_generate_v4(), uuid_generate_v4(), 'Escritório e Administração', 'OFFICE', 'Despesas gerais de escritório, material de consumo, limpeza', 'deductible', true, true, false),
(uuid_generate_v4(), uuid_generate_v4(), 'Tecnologia e Software', 'TECH', 'Software jurídico, licenças, hardware, serviços de TI', 'deductible', true, true, false),
(uuid_generate_v4(), uuid_generate_v4(), 'Marketing e Publicidade', 'MARKETING', 'Site, publicidade digital, material gráfico, eventos', 'deductible', true, true, false),
(uuid_generate_v4(), uuid_generate_v4(), 'Recursos Humanos', 'HR', 'Salários, benefícios, treinamentos, recrutamento', 'deductible', true, true, false),
(uuid_generate_v4(), uuid_generate_v4(), 'Capacitação Jurídica', 'TRAINING', 'Cursos, congressos, livros, educação continuada', 'deductible', true, true, false),
(uuid_generate_v4(), uuid_generate_v4(), 'Viagens e Deslocamentos', 'TRAVEL', 'Viagens a clientes, audiências, combustível', 'deductible', true, true, true),
(uuid_generate_v4(), uuid_generate_v4(), 'Consultoria Externa', 'CONSULTING', 'Consultoria jurídica, contábil, especializada', 'deductible', true, true, true),
(uuid_generate_v4(), uuid_generate_v4(), 'Taxas e Impostos', 'TAXES', 'Taxa OAB, impostos, taxas governamentais', 'tax', true, true, false),
(uuid_generate_v4(), uuid_generate_v4(), 'Custas Processuais', 'COURT_FEES', 'Custas judiciais, cartório, perícias', 'billable', true, true, true),
(uuid_generate_v4(), uuid_generate_v4(), 'Telecomunicações', 'TELECOM', 'Internet, telefone, celular corporativo', 'deductible', true, true, false),
(uuid_generate_v4(), uuid_generate_v4(), 'Aluguel e Condomínio', 'RENT', 'Aluguel do escritório, condomínio, IPTU', 'deductible', true, true, false),
(uuid_generate_v4(), uuid_generate_v4(), 'Seguros', 'INSURANCE', 'Seguro responsabilidade civil, escritório, equipamentos', 'deductible', true, true, false)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- INVOICE TEMPLATES (Brazilian Legal Context)
-- =============================================

INSERT INTO invoice_templates (id, law_firm_id, template_name, template_type, subject_template, description_template, terms_and_conditions, default_payment_terms, default_due_days, is_active, is_default) VALUES
(uuid_generate_v4(), uuid_generate_v4(), 'Assinatura Mensal Padrão', 'subscription', 
'Fatura de Assinatura - {month}/{year}', 
'Serviços jurídicos por assinatura referente ao período de {billing_period_start} a {billing_period_end}',
'Pagamento até o vencimento. Juros de 1% ao mês após o vencimento. Protesto após 10 dias.', 
'30_days', 30, true, true),

(uuid_generate_v4(), uuid_generate_v4(), 'Honorários por Caso', 'case_billing',
'Honorários Advocatícios - Processo {case_number}',
'Honorários advocatícios referente aos serviços prestados no processo {case_number}',
'Pagamento até o vencimento. Juros de 1% ao mês após o vencimento. Sujeito a protesto.',
'15_days', 15, true, true),

(uuid_generate_v4(), uuid_generate_v4(), 'Prestação de Plano de Pagamento', 'payment_plan',
'Parcela {installment_number}/{total_installments} - {case_description}',
'Parcela referente ao plano de pagamento acordado para os honorários do processo',
'Vencimento improrrogável. Juros de 1% ao mês e multa de 2% após o vencimento.',
'immediate', 0, true, true),

(uuid_generate_v4(), uuid_generate_v4(), 'Horas Trabalhadas', 'time_based',
'Fatura por Horas - Período {period_start} a {period_end}',
'Cobrança por horas trabalhadas conforme registro de atividades em anexo',
'Pagamento em 30 dias. Discriminativo de horas em anexo.',
'30_days', 30, true, false)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- DEFAULT VENDOR CATEGORIES
-- =============================================

INSERT INTO vendors (id, law_firm_id, vendor_name, vendor_type, email, phone, vendor_status, notes) VALUES
(uuid_generate_v4(), uuid_generate_v4(), 'Tribunal de Justiça', 'service_provider', 'custas@tjsp.jus.br', '', 'active', 'Custas processuais e taxas judiciais'),
(uuid_generate_v4(), uuid_generate_v4(), 'Cartório Central', 'service_provider', 'contato@cartorio.com.br', '(11) 3333-4444', 'active', 'Serviços cartorários diversos'),
(uuid_generate_v4(), uuid_generate_v4(), 'Correios', 'service_provider', '', '3003-0100', 'active', 'Correspondências e AR'),
(uuid_generate_v4(), uuid_generate_v4(), 'Contador Jurídico', 'contractor', 'contador@escritorio.com.br', '(11) 9999-8888', 'active', 'Serviços contábeis especializados'),
(uuid_generate_v4(), uuid_generate_v4(), 'Perito Judicial', 'consultant', 'perito@laudo.com.br', '(11) 8888-7777', 'active', 'Perícias judiciais diversas')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- TIME ENTRY TEMPLATES (Brazilian Legal Tasks)
-- =============================================

INSERT INTO time_entry_templates (id, law_firm_id, template_name, description, default_entry_type, default_task_category, default_activity_description, default_duration_minutes, default_is_billable, is_active, is_shared) VALUES
(uuid_generate_v4(), uuid_generate_v4(), 'Análise de Processo', 'Análise detalhada de peças processuais', 'case_work', 'Análise Processual', 'Análise de peças processuais e documentos', 60, true, true, true),
(uuid_generate_v4(), uuid_generate_v4(), 'Elaboração de Petição', 'Redação de petições iniciais e intermediárias', 'case_work', 'Peticionamento', 'Elaboração de petição', 120, true, true, true),
(uuid_generate_v4(), uuid_generate_v4(), 'Audiência', 'Participação em audiências judiciais', 'case_work', 'Audiência', 'Participação em audiência judicial', 180, true, true, true),
(uuid_generate_v4(), uuid_generate_v4(), 'Reunião com Cliente', 'Reunião para esclarecimentos e orientações', 'case_work', 'Atendimento', 'Reunião com cliente para esclarecimentos', 60, true, true, true),
(uuid_generate_v4(), uuid_generate_v4(), 'Pesquisa Jurisprudencial', 'Pesquisa de jurisprudência e doutrina', 'case_work', 'Pesquisa', 'Pesquisa jurisprudencial e doutrinária', 90, true, true, true),
(uuid_generate_v4(), uuid_generate_v4(), 'Consulta Jurídica', 'Consulta preventiva por assinatura', 'subscription_work', 'Consultoria', 'Consulta jurídica preventiva', 30, true, true, true),
(uuid_generate_v4(), uuid_generate_v4(), 'Revisão de Contratos', 'Análise e revisão de contratos', 'subscription_work', 'Contratos', 'Revisão e análise de contrato', 90, true, true, true),
(uuid_generate_v4(), uuid_generate_v4(), 'Atividade Administrativa', 'Tarefas administrativas diversas', 'administrative', 'Administração', 'Atividade administrativa', 30, false, true, true)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- FINANCIAL ALERTS TEMPLATES
-- =============================================

INSERT INTO financial_alerts (id, law_firm_id, alert_type, alert_severity, title, message, alert_status) VALUES
(uuid_generate_v4(), uuid_generate_v4(), 'budget_exceeded', 'high', 'Orçamento Excedido', 'A categoria de despesas {category} excedeu o orçamento mensal em {percentage}%', 'active'),
(uuid_generate_v4(), uuid_generate_v4(), 'bill_due_soon', 'medium', 'Conta a Vencer', 'A conta {bill_number} do fornecedor {vendor} vence em {days} dias', 'active'),
(uuid_generate_v4(), uuid_generate_v4(), 'bill_overdue', 'critical', 'Conta em Atraso', 'A conta {bill_number} está em atraso há {days} dias', 'active')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- LAWYER BILLING RATES (Sample Data)
-- =============================================

INSERT INTO lawyer_billing_rates (id, law_firm_id, user_id, rate_type, hourly_rate, service_type, effective_from, is_active, notes) VALUES
(uuid_generate_v4(), uuid_generate_v4(), uuid_generate_v4(), 'standard', 300.00, 'Consultoria Geral', CURRENT_DATE, true, 'Taxa padrão para consultoria jurídica'),
(uuid_generate_v4(), uuid_generate_v4(), uuid_generate_v4(), 'service_specific', 450.00, 'Processo Judicial', CURRENT_DATE, true, 'Taxa para atuação em processos judiciais'),
(uuid_generate_v4(), uuid_generate_v4(), uuid_generate_v4(), 'service_specific', 250.00, 'Revisão de Contratos', CURRENT_DATE, true, 'Taxa para revisão e elaboração de contratos'),
(uuid_generate_v4(), uuid_generate_v4(), uuid_generate_v4(), 'service_specific', 350.00, 'Consultoria Especializada', CURRENT_DATE, true, 'Taxa para consultoria em área específica')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- BUDGET PERIODS (Current Year)
-- =============================================

INSERT INTO budget_periods (id, law_firm_id, period_name, period_type, start_date, end_date, total_budget, period_status) VALUES
(uuid_generate_v4(), uuid_generate_v4(), 'Orçamento Anual 2024', 'annual', '2024-01-01', '2024-12-31', 250000.00, 'active'),
(uuid_generate_v4(), uuid_generate_v4(), 'Q1 2024', 'quarterly', '2024-01-01', '2024-03-31', 62500.00, 'closed'),
(uuid_generate_v4(), uuid_generate_v4(), 'Q2 2024', 'quarterly', '2024-04-01', '2024-06-30', 62500.00, 'closed'),
(uuid_generate_v4(), uuid_generate_v4(), 'Q3 2024', 'quarterly', '2024-07-01', '2024-09-30', 62500.00, 'closed'),
(uuid_generate_v4(), uuid_generate_v4(), 'Q4 2024', 'quarterly', '2024-10-01', '2024-12-31', 62500.00, 'active')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- RECURRING BILL TEMPLATES
-- =============================================

INSERT INTO recurring_bill_templates (id, law_firm_id, vendor_id, template_name, description, recurrence_pattern, recurrence_day, estimated_amount, payment_terms, auto_generate, is_active, next_generation_date) VALUES
(uuid_generate_v4(), uuid_generate_v4(), (SELECT id FROM vendors WHERE vendor_name = 'Contador Jurídico' LIMIT 1), 'Honorários Contabilidade Mensal', 'Honorários mensais do contador', 'monthly', 5, 2500.00, '15_days', false, true, '2024-01-05'),
(uuid_generate_v4(), uuid_generate_v4(), (SELECT id FROM vendors WHERE vendor_name = 'Tribunal de Justiça' LIMIT 1), 'Taxa OAB Trimestral', 'Taxa trimestral da OAB', 'quarterly', 15, 450.00, '30_days', false, true, '2024-01-15')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Count inserted records
SELECT 
    'expense_categories' as table_name, 
    COUNT(*) as records_inserted 
FROM expense_categories
UNION ALL
SELECT 
    'invoice_templates' as table_name, 
    COUNT(*) as records_inserted 
FROM invoice_templates
UNION ALL
SELECT 
    'vendors' as table_name, 
    COUNT(*) as records_inserted 
FROM vendors
UNION ALL
SELECT 
    'time_entry_templates' as table_name, 
    COUNT(*) as records_inserted 
FROM time_entry_templates
UNION ALL
SELECT 
    'lawyer_billing_rates' as table_name, 
    COUNT(*) as records_inserted 
FROM lawyer_billing_rates
UNION ALL
SELECT 
    'budget_periods' as table_name, 
    COUNT(*) as records_inserted 
FROM budget_periods
UNION ALL
SELECT 
    'recurring_bill_templates' as table_name, 
    COUNT(*) as records_inserted 
FROM recurring_bill_templates;

-- Summary
SELECT 'Default data seeded successfully' as status;