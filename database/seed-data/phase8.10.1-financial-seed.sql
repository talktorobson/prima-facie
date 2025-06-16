-- Phase 8.10.1: Financial Management Seed Data
-- Sample data for testing the AP/AR system

-- Get the test law firm ID (assuming it exists from previous phases)
DO $$
DECLARE
    test_firm_id UUID;
    admin_user_id UUID;
BEGIN
    -- Get test law firm
    SELECT id INTO test_firm_id FROM law_firms WHERE name = 'Dávila & Reis Advogados' LIMIT 1;
    
    -- Get admin user
    SELECT id INTO admin_user_id FROM users WHERE law_firm_id = test_firm_id AND role = 'admin' LIMIT 1;
    
    -- ====================================
    -- EXPENSE CATEGORIES
    -- ====================================
    
    -- Operational expenses
    INSERT INTO expense_categories (id, law_firm_id, code, name, category_type, is_billable_default, budget_monthly, budget_yearly) VALUES
    ('a1000000-0000-0000-0000-000000000001', test_firm_id, 'OP001', 'Aluguel e Condomínio', 'operational', false, 15000.00, 180000.00),
    ('a1000000-0000-0000-0000-000000000002', test_firm_id, 'OP002', 'Energia Elétrica', 'operational', false, 2000.00, 24000.00),
    ('a1000000-0000-0000-0000-000000000003', test_firm_id, 'OP003', 'Água e Esgoto', 'operational', false, 500.00, 6000.00),
    ('a1000000-0000-0000-0000-000000000004', test_firm_id, 'OP004', 'Internet e Telefonia', 'operational', false, 1500.00, 18000.00),
    ('a1000000-0000-0000-0000-000000000005', test_firm_id, 'OP005', 'Material de Escritório', 'operational', false, 1000.00, 12000.00);
    
    -- Legal expenses (billable to clients)
    INSERT INTO expense_categories (id, law_firm_id, code, name, category_type, is_billable_default, budget_monthly, budget_yearly) VALUES
    ('a1000000-0000-0000-0000-000000000006', test_firm_id, 'LG001', 'Custas Judiciais', 'legal', true, 5000.00, 60000.00),
    ('a1000000-0000-0000-0000-000000000007', test_firm_id, 'LG002', 'Taxas e Emolumentos', 'legal', true, 3000.00, 36000.00),
    ('a1000000-0000-0000-0000-000000000008', test_firm_id, 'LG003', 'Perícias e Laudos', 'legal', true, 10000.00, 120000.00),
    ('a1000000-0000-0000-0000-000000000009', test_firm_id, 'LG004', 'Diligências e Deslocamentos', 'legal', true, 2000.00, 24000.00),
    ('a1000000-0000-0000-0000-000000000010', test_firm_id, 'LG005', 'Cópias e Autenticações', 'legal', true, 500.00, 6000.00);
    
    -- Administrative expenses
    INSERT INTO expense_categories (id, law_firm_id, code, name, category_type, is_billable_default, budget_monthly, budget_yearly) VALUES
    ('a1000000-0000-0000-0000-000000000011', test_firm_id, 'AD001', 'Folha de Pagamento', 'administrative', false, 80000.00, 960000.00),
    ('a1000000-0000-0000-0000-000000000012', test_firm_id, 'AD002', 'Benefícios e Encargos', 'administrative', false, 30000.00, 360000.00),
    ('a1000000-0000-0000-0000-000000000013', test_firm_id, 'AD003', 'Contabilidade', 'administrative', false, 3500.00, 42000.00),
    ('a1000000-0000-0000-0000-000000000014', test_firm_id, 'AD004', 'Seguros', 'administrative', false, 2500.00, 30000.00),
    ('a1000000-0000-0000-0000-000000000015', test_firm_id, 'AD005', 'Treinamentos e Capacitação', 'administrative', false, 5000.00, 60000.00);
    
    -- Technology expenses
    INSERT INTO expense_categories (id, law_firm_id, code, name, category_type, is_billable_default, budget_monthly, budget_yearly) VALUES
    ('a1000000-0000-0000-0000-000000000016', test_firm_id, 'TI001', 'Software e Licenças', 'technology', false, 4000.00, 48000.00),
    ('a1000000-0000-0000-0000-000000000017', test_firm_id, 'TI002', 'Equipamentos de Informática', 'technology', false, 3000.00, 36000.00),
    ('a1000000-0000-0000-0000-000000000018', test_firm_id, 'TI003', 'Manutenção de TI', 'technology', false, 2000.00, 24000.00),
    ('a1000000-0000-0000-0000-000000000019', test_firm_id, 'TI004', 'Cloud e Armazenamento', 'technology', false, 1500.00, 18000.00);
    
    -- Marketing expenses
    INSERT INTO expense_categories (id, law_firm_id, code, name, category_type, is_billable_default, budget_monthly, budget_yearly) VALUES
    ('a1000000-0000-0000-0000-000000000020', test_firm_id, 'MK001', 'Marketing Digital', 'marketing', false, 5000.00, 60000.00),
    ('a1000000-0000-0000-0000-000000000021', test_firm_id, 'MK002', 'Eventos e Networking', 'marketing', false, 3000.00, 36000.00),
    ('a1000000-0000-0000-0000-000000000022', test_firm_id, 'MK003', 'Material Promocional', 'marketing', false, 2000.00, 24000.00);
    
    -- ====================================
    -- VENDORS
    -- ====================================
    
    -- Utility companies
    INSERT INTO vendors (id, law_firm_id, vendor_type, name, legal_name, cnpj, email, phone, payment_terms, is_recurring, created_by) VALUES
    ('b1000000-0000-0000-0000-000000000001', test_firm_id, 'utility', 'Copel Energia', 'Companhia Paranaense de Energia', '76.483.817/0001-20', 'contato@copel.com', '0800-510-0116', 10, true, admin_user_id),
    ('b1000000-0000-0000-0000-000000000002', test_firm_id, 'utility', 'Sanepar', 'Companhia de Saneamento do Paraná', '76.484.013/0001-45', 'atendimento@sanepar.com.br', '0800-200-0115', 10, true, admin_user_id),
    ('b1000000-0000-0000-0000-000000000003', test_firm_id, 'service_provider', 'Vivo Empresas', 'Telefônica Brasil S.A.', '02.558.157/0001-62', 'empresas@vivo.com.br', '1058', 30, true, admin_user_id);
    
    -- Service providers
    INSERT INTO vendors (id, law_firm_id, vendor_type, name, legal_name, cnpj, email, phone, payment_terms, pix_key, created_by) VALUES
    ('b1000000-0000-0000-0000-000000000004', test_firm_id, 'service_provider', 'ContaMax Contabilidade', 'ContaMax Serviços Contábeis Ltda', '12.345.678/0001-90', 'contato@contamax.com.br', '(41) 3333-4444', 30, 'contato@contamax.com.br', admin_user_id),
    ('b1000000-0000-0000-0000-000000000005', test_firm_id, 'service_provider', 'TechSoft Solutions', 'TechSoft Tecnologia Ltda', '23.456.789/0001-01', 'suporte@techsoft.com.br', '(11) 4444-5555', 30, '23.456.789/0001-01', admin_user_id),
    ('b1000000-0000-0000-0000-000000000006', test_firm_id, 'contractor', 'Dr. João Silva - Perito', NULL, '123.456.789-00', 'joao.silva@peritos.com.br', '(41) 98765-4321', 15, '123.456.789-00', admin_user_id);
    
    -- Suppliers
    INSERT INTO vendors (id, law_firm_id, vendor_type, name, legal_name, cnpj, email, phone, bank_name, bank_branch, bank_account, bank_account_type, created_by) VALUES
    ('b1000000-0000-0000-0000-000000000007', test_firm_id, 'supplier', 'Papelaria Central', 'Papelaria Central Ltda', '34.567.890/0001-12', 'vendas@papelariacentral.com.br', '(41) 3222-1111', 'Banco do Brasil', '1234', '12345-6', 'checking', admin_user_id),
    ('b1000000-0000-0000-0000-000000000008', test_firm_id, 'supplier', 'Móveis Corporate', 'Móveis para Escritório Corporate Ltda', '45.678.901/0001-23', 'comercial@moveiscorporate.com.br', '(41) 3555-6666', 'Bradesco', '5678', '67890-1', 'checking', admin_user_id);
    
    -- Government
    INSERT INTO vendors (id, law_firm_id, vendor_type, name, legal_name, cnpj, website, payment_terms, created_by) VALUES
    ('b1000000-0000-0000-0000-000000000009', test_firm_id, 'government', 'Tribunal de Justiça do Paraná', 'Poder Judiciário do Estado do Paraná', '77.821.841/0001-94', 'https://www.tjpr.jus.br', 0, admin_user_id),
    ('b1000000-0000-0000-0000-000000000010', test_firm_id, 'government', 'Receita Federal', 'Secretaria da Receita Federal do Brasil', '00.394.460/0001-41', 'https://www.gov.br/receitafederal', 0, admin_user_id);
    
    -- ====================================
    -- BILLS (ACCOUNTS PAYABLE)
    -- ====================================
    
    -- Current month bills
    INSERT INTO bills (id, law_firm_id, vendor_id, expense_category_id, bill_number, bill_date, due_date, subtotal, tax_amount, total_amount, bill_type, approval_status, created_by) VALUES
    -- Rent (approved and paid)
    ('c1000000-0000-0000-0000-000000000001', test_firm_id, 'b1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000001', 'ALG-2025-01-001', CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE - INTERVAL '10 days', 15000.00, 0, 15000.00, 'recurring', 'approved', admin_user_id),
    -- Electricity (approved, pending payment)
    ('c1000000-0000-0000-0000-000000000002', test_firm_id, 'b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', 'COPEL-2025-01-12345', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '5 days', 1850.00, 150.00, 2000.00, 'recurring', 'approved', admin_user_id),
    -- Internet (pending approval)
    ('c1000000-0000-0000-0000-000000000003', test_firm_id, 'b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000004', 'VIVO-2025-01-67890', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '25 days', 1500.00, 0, 1500.00, 'recurring', 'pending', admin_user_id),
    -- Court fees (billable to client)
    ('c1000000-0000-0000-0000-000000000004', test_firm_id, 'b1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000006', 'TJPR-2025-01-54321', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE, 850.00, 0, 850.00, 'one_time', 'approved', admin_user_id),
    -- Expert witness fee (billable)
    ('c1000000-0000-0000-0000-000000000005', test_firm_id, 'b1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000008', 'PERITO-2025-01-001', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '5 days', 5000.00, 0, 5000.00, 'one_time', 'approved', admin_user_id);
    
    -- Overdue bills
    INSERT INTO bills (id, law_firm_id, vendor_id, expense_category_id, bill_number, bill_date, due_date, subtotal, tax_amount, total_amount, bill_type, payment_status, approval_status, created_by) VALUES
    ('c1000000-0000-0000-0000-000000000006', test_firm_id, 'b1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000005', 'PC-2024-12-234', CURRENT_DATE - INTERVAL '45 days', CURRENT_DATE - INTERVAL '15 days', 1200.00, 0, 1200.00, 'one_time', 'overdue', 'approved', admin_user_id),
    ('c1000000-0000-0000-0000-000000000007', test_firm_id, 'b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000016', 'TS-2024-12-789', CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE - INTERVAL '30 days', 4000.00, 0, 4000.00, 'recurring', 'overdue', 'approved', admin_user_id);
    
    -- Installment example (office furniture in 3x)
    INSERT INTO bills (id, law_firm_id, vendor_id, expense_category_id, bill_number, bill_date, due_date, subtotal, tax_amount, total_amount, bill_type, installment_number, installment_total, approval_status, created_by) VALUES
    ('c1000000-0000-0000-0000-000000000008', test_firm_id, 'b1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000017', 'MC-2024-11-456-1/3', CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE - INTERVAL '30 days', 5000.00, 0, 5000.00, 'installment', 1, 3, 'approved', admin_user_id),
    ('c1000000-0000-0000-0000-000000000009', test_firm_id, 'b1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000017', 'MC-2024-11-456-2/3', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, 5000.00, 0, 5000.00, 'installment', 2, 3, 'approved', admin_user_id),
    ('c1000000-0000-0000-0000-000000000010', test_firm_id, 'b1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000017', 'MC-2024-11-456-3/3', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 5000.00, 0, 5000.00, 'installment', 3, 3, 'approved', admin_user_id);
    
    -- ====================================
    -- BILL PAYMENTS
    -- ====================================
    
    -- Payment for rent
    INSERT INTO bill_payments (bill_id, payment_date, amount, payment_method, transaction_reference, processed_by) VALUES
    ('c1000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '12 days', 15000.00, 'bank_transfer', 'TED-2025-01-12345', admin_user_id);
    
    -- Payment for first installment
    INSERT INTO bill_payments (bill_id, payment_date, amount, payment_method, transaction_reference, processed_by) VALUES
    ('c1000000-0000-0000-0000-000000000008', CURRENT_DATE - INTERVAL '28 days', 5000.00, 'pix', 'PIX-2024-12-67890', admin_user_id);
    
    -- Partial payment for overdue bill
    INSERT INTO bill_payments (bill_id, payment_date, amount, payment_method, transaction_reference, processed_by) VALUES
    ('c1000000-0000-0000-0000-000000000006', CURRENT_DATE - INTERVAL '5 days', 500.00, 'pix', 'PIX-2025-01-11111', admin_user_id);
    
    -- ====================================
    -- FINANCIAL ALERTS
    -- ====================================
    
    -- Alert for upcoming due dates
    INSERT INTO financial_alerts (law_firm_id, alert_type, entity_type, entity_id, title, message, severity, trigger_date) VALUES
    (test_firm_id, 'payment_due', 'bill', 'c1000000-0000-0000-0000-000000000002', 'Conta de Energia Elétrica vence em 5 dias', 'A conta COPEL-2025-01-12345 no valor de R$ 2.000,00 vence em 5 dias.', 'warning', CURRENT_DATE),
    (test_firm_id, 'payment_due', 'bill', 'c1000000-0000-0000-0000-000000000009', 'Parcela 2/3 Móveis vence hoje', 'A parcela MC-2024-11-456-2/3 no valor de R$ 5.000,00 vence hoje.', 'critical', CURRENT_DATE);
    
    -- Alert for overdue bills
    INSERT INTO financial_alerts (law_firm_id, alert_type, entity_type, entity_id, title, message, severity, trigger_date) VALUES
    (test_firm_id, 'payment_overdue', 'bill', 'c1000000-0000-0000-0000-000000000006', 'Material de Escritório - 15 dias em atraso', 'A conta PC-2024-12-234 está 15 dias em atraso. Saldo devedor: R$ 700,00', 'critical', CURRENT_DATE),
    (test_firm_id, 'payment_overdue', 'bill', 'c1000000-0000-0000-0000-000000000007', 'Software e Licenças - 30 dias em atraso', 'A conta TS-2024-12-789 está 30 dias em atraso. Valor total: R$ 4.000,00', 'critical', CURRENT_DATE);
    
    -- Budget alerts
    INSERT INTO financial_alerts (law_firm_id, alert_type, title, message, severity, trigger_date) VALUES
    (test_firm_id, 'budget_exceeded', 'Orçamento de Perícias excedido', 'A categoria "Perícias e Laudos" ultrapassou 80% do orçamento mensal (R$ 8.000 de R$ 10.000)', 'warning', CURRENT_DATE);
    
    -- ====================================
    -- SAMPLE AR DATA (if invoices exist)
    -- ====================================
    
    -- Note: Payment collections and reminders would be created for existing invoices
    -- from the billing system. Here's an example structure:
    
    /*
    -- Sample collection tracking (requires existing invoice)
    INSERT INTO payment_collections (invoice_id, client_id, collection_status, days_overdue, reminder_count) 
    SELECT 
        i.id,
        i.client_id,
        CASE 
            WHEN CURRENT_DATE - i.due_date <= 0 THEN 'current'
            WHEN CURRENT_DATE - i.due_date <= 30 THEN 'overdue_30'
            WHEN CURRENT_DATE - i.due_date <= 60 THEN 'overdue_60'
            ELSE 'overdue_90'
        END,
        GREATEST(0, CURRENT_DATE - i.due_date),
        0
    FROM invoices i
    WHERE i.status != 'paid'
    AND i.law_firm_id = test_firm_id;
    */
    
END $$;

-- Update bill payment statuses based on payments
UPDATE bills SET 
    payment_status = 'paid',
    amount_paid = total_amount
WHERE id = 'c1000000-0000-0000-0000-000000000001';

UPDATE bills SET 
    payment_status = 'paid',
    amount_paid = total_amount
WHERE id = 'c1000000-0000-0000-0000-000000000008';

UPDATE bills SET 
    payment_status = 'partial',
    amount_paid = 500.00
WHERE id = 'c1000000-0000-0000-0000-000000000006';