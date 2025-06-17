-- =============================================
-- PRIMA FACIE SEED DATA - STEP 2: BILLING SYSTEM
-- Subscription plans, case types, and billing configurations
-- =============================================

BEGIN;

-- =============================================
-- SEED SUBSCRIPTION PLANS (if table exists)
-- =============================================

-- Note: These INSERT statements will only work if the billing tables have been created
-- If they don't exist, these will be skipped

DO $$
BEGIN
    -- Check if subscription_plans table exists before inserting
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'subscription_plans') THEN
        
        INSERT INTO subscription_plans (id, law_firm_id, plan_name, plan_type, description, 
                                       monthly_fee, yearly_fee, setup_fee, max_monthly_hours, 
                                       max_document_reviews, support_level, billing_interval, 
                                       trial_period_days, is_active, is_featured, sort_order) VALUES
        
        -- Dávila Reis Advocacia Plans
        ('aaaa1111-1111-1111-1111-111111111001', '123e4567-e89b-12d3-a456-426614174000', 'Trabalhista Básico', 'labor', 'Consultoria básica em direito trabalhista para pequenas empresas', 890.00, 9990.00, 0.00, 10, 5, 'email', 'monthly', 7, true, false, 1),
        
        ('aaaa1111-1111-1111-1111-111111111002', '123e4567-e89b-12d3-a456-426614174000', 'Trabalhista Premium', 'labor', 'Consultoria completa em direito trabalhista com suporte prioritário', 1890.00, 19990.00, 500.00, 25, 15, 'priority', 'monthly', 14, true, true, 2),
        
        ('aaaa1111-1111-1111-1111-111111111003', '123e4567-e89b-12d3-a456-426614174000', 'Empresarial Executivo', 'corporate', 'Consultoria jurídica completa para médias e grandes empresas', 3500.00, 39000.00, 1000.00, 50, 30, '24_7', 'monthly', 30, true, true, 3),
        
        -- Silva & Associados Plans  
        ('bbbb2222-2222-2222-2222-222222222001', '234e4567-e89b-12d3-a456-426614174001', 'Tributário Starter', 'corporate', 'Consultoria tributária para startups e pequenas empresas', 1200.00, 13200.00, 300.00, 15, 10, 'phone', 'monthly', 15, true, false, 1),
        
        ('bbbb2222-2222-2222-2222-222222222002', '234e4567-e89b-12d3-a456-426614174001', 'Empresarial Completo', 'corporate', 'Assessoria jurídica completa para empresas estabelecidas', 4500.00, 48000.00, 2000.00, 80, 50, '24_7', 'monthly', 30, true, true, 2),
        
        ('bbbb2222-2222-2222-2222-222222222003', '234e4567-e89b-12d3-a456-426614174001', 'Propriedade Intelectual Pro', 'corporate', 'Proteção completa de propriedade intelectual', 2800.00, 29000.00, 800.00, 30, 25, 'priority', 'monthly', 21, true, true, 3);

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
        
        INSERT INTO case_types (id, law_firm_id, name, code, category, 
                               minimum_fee_hourly, minimum_fee_percentage, minimum_fee_fixed,
                               default_billing_method, default_hourly_rate, default_percentage_rate, 
                               default_success_fee_rate, complexity_multiplier, estimated_hours_range, is_active) VALUES
        
        -- Dávila Reis Case Types
        ('cccc1111-1111-1111-1111-111111111001', '123e4567-e89b-12d3-a456-426614174000', 'Ação Trabalhista Simples', 'LAB_SIM', 'labor', 1500.00, 2500.00, 2000.00, 'percentage', 300.00, 20.0, 15.0, 1.0, '20-40 horas', true),
        
        ('cccc1111-1111-1111-1111-111111111002', '123e4567-e89b-12d3-a456-426614174000', 'Ação Trabalhista Complexa', 'LAB_COM', 'labor', 3000.00, 5000.00, 4000.00, 'percentage', 350.00, 25.0, 20.0, 1.5, '60-120 horas', true),
        
        ('cccc1111-1111-1111-1111-111111111003', '123e4567-e89b-12d3-a456-426614174000', 'Revisão Contratual', 'CONT_REV', 'corporate', 800.00, 1200.00, 1000.00, 'hourly', 400.00, 10.0, 10.0, 0.8, '5-15 horas', true),
        
        ('cccc1111-1111-1111-1111-111111111004', '123e4567-e89b-12d3-a456-426614174000', 'Defesa Criminal', 'CRIM_DEF', 'criminal', 2500.00, 4000.00, 3500.00, 'fixed', 500.00, 30.0, 15.0, 1.8, '40-100 horas', true),
        
        ('cccc1111-1111-1111-1111-111111111005', '123e4567-e89b-12d3-a456-426614174000', 'Divórcio Consensual', 'FAM_DIV', 'family', 600.00, 1000.00, 800.00, 'fixed', 250.00, 8.0, 5.0, 0.6, '8-20 horas', true),
        
        -- Silva & Associados Case Types
        ('dddd2222-2222-2222-2222-222222222001', '234e4567-e89b-12d3-a456-426614174001', 'Consultoria Tributária', 'TRIB_CON', 'tax', 2000.00, 3500.00, 2800.00, 'hourly', 500.00, 18.0, 12.0, 1.3, '15-40 horas', true),
        
        ('dddd2222-2222-2222-2222-222222222002', '234e4567-e89b-12d3-a456-426614174001', 'Defesa Fiscal Complexa', 'FISC_DEF', 'tax', 5000.00, 8000.00, 6500.00, 'percentage', 600.00, 25.0, 20.0, 2.0, '80-200 horas', true),
        
        ('dddd2222-2222-2222-2222-222222222003', '234e4567-e89b-12d3-a456-426614174001', 'Registro de Marca', 'PI_MARCA', 'intellectual_property', 1200.00, 1800.00, 1500.00, 'fixed', 400.00, 12.0, 8.0, 0.9, '10-25 horas', true),
        
        ('dddd2222-2222-2222-2222-222222222004', '234e4567-e89b-12d3-a456-426614174001', 'Reestruturação Societária', 'CORP_REST', 'corporate', 8000.00, 12000.00, 10000.00, 'hourly', 550.00, 15.0, 10.0, 2.2, '100-300 horas', true);

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
        
        INSERT INTO client_subscriptions (id, client_id, subscription_plan_id, status, billing_cycle, 
                                         auto_renew, start_date, current_period_start, current_period_end, 
                                         next_billing_date, monthly_fee, current_fee, notes) VALUES
        
        -- Active subscriptions
        ('eeee1111-1111-1111-1111-111111111001', '33333333-3333-3333-3333-333333333005', 'aaaa1111-1111-1111-1111-111111111002', 'active', 'monthly', true, '2024-01-01', '2024-03-01', '2024-03-31', '2024-04-01', 1890.00, 1890.00, 'Cliente fidelizado, pagamento em dia'),
        
        ('eeee1111-1111-1111-1111-111111111002', '44444444-4444-4444-4444-444444444001', 'bbbb2222-2222-2222-2222-222222222002', 'active', 'monthly', true, '2024-01-15', '2024-03-15', '2024-04-14', '2024-04-15', 4500.00, 4500.00, 'Grande cliente, contrato anual renovado'),
        
        ('eeee1111-1111-1111-1111-111111111003', '44444444-4444-4444-4444-444444444002', 'bbbb2222-2222-2222-2222-222222222001', 'active', 'monthly', true, '2024-02-01', '2024-03-01', '2024-03-31', '2024-04-01', 1200.00, 1200.00, 'Empresário individual, consultoria tributária'),
        
        -- Trial subscription
        ('eeee1111-1111-1111-1111-111111111004', '44444444-4444-4444-4444-444444444003', 'bbbb2222-2222-2222-2222-222222222003', 'trial', 'monthly', true, '2024-03-10', '2024-03-10', '2024-04-09', '2024-04-10', 2800.00, 0.00, 'Período de teste, empresa de software');

        RAISE NOTICE 'Client subscriptions inserted successfully';
    ELSE
        RAISE NOTICE 'Client subscriptions table does not exist, skipping...';
    END IF;
END $$;

-- =============================================
-- SEED CASE BILLING METHODS (if table exists)
-- =============================================

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'case_billing_methods') THEN
        
        INSERT INTO case_billing_methods (id, matter_id, case_type_id, billing_type, 
                                         hourly_rate, percentage_rate, fixed_amount, 
                                         success_fee_percentage, success_fee_applies_to, 
                                         minimum_fee, minimum_fee_source, 
                                         has_subscription_discount, discount_percentage, status) VALUES
        
        -- Billing for active matters
        ('ffff1111-1111-1111-1111-111111111001', '55555555-5555-5555-5555-555555555001', 'cccc1111-1111-1111-1111-111111111001', 'percentage', null, 20.0, null, 15.0, 'recovered', 2500.00, 'case_type', false, 0.0, 'approved'),
        
        ('ffff1111-1111-1111-1111-111111111002', '55555555-5555-5555-5555-555555555002', 'cccc1111-1111-1111-1111-111111111005', 'fixed', null, null, 1800.00, 5.0, 'total', 800.00, 'case_type', false, 0.0, 'approved'),
        
        ('ffff1111-1111-1111-1111-111111111003', '55555555-5555-5555-5555-555555555003', 'cccc1111-1111-1111-1111-111111111004', 'fixed', null, null, 5000.00, 15.0, 'recovered', 3500.00, 'case_type', false, 0.0, 'approved'),
        
        ('ffff1111-1111-1111-1111-111111111004', '55555555-5555-5555-5555-555555555004', 'cccc1111-1111-1111-1111-111111111001', 'percentage', null, 25.0, null, 20.0, 'recovered', 2500.00, 'case_type', false, 0.0, 'approved'),
        
        ('ffff1111-1111-1111-1111-111111111005', '55555555-5555-5555-5555-555555555005', 'cccc1111-1111-1111-1111-111111111003', 'hourly', 400.00, null, null, 10.0, 'total', 1000.00, 'case_type', true, 15.0, 'approved'),
        
        ('ffff2222-2222-2222-2222-222222222001', '66666666-6666-6666-6666-666666666001', 'dddd2222-2222-2222-2222-222222222004', 'hourly', 550.00, null, null, 10.0, 'total', 10000.00, 'case_type', true, 10.0, 'approved'),
        
        ('ffff2222-2222-2222-2222-222222222002', '66666666-6666-6666-6666-666666666002', 'dddd2222-2222-2222-2222-222222222002', 'percentage', null, 25.0, null, 20.0, 'recovered', 8000.00, 'case_type', false, 0.0, 'approved'),
        
        ('ffff2222-2222-2222-2222-222222222003', '66666666-6666-6666-6666-666666666003', 'dddd2222-2222-2222-2222-222222222003', 'fixed', null, null, 2500.00, 8.0, 'total', 1500.00, 'case_type', false, 0.0, 'draft');

        RAISE NOTICE 'Case billing methods inserted successfully';
    ELSE
        RAISE NOTICE 'Case billing methods table does not exist, skipping...';
    END IF;
END $$;

-- =============================================
-- SEED DISCOUNT RULES (if table exists)
-- =============================================

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'discount_rules') THEN
        
        INSERT INTO discount_rules (id, law_firm_id, rule_name, rule_type, discount_type, 
                                   discount_percentage, min_case_value, min_subscription_months,
                                   max_uses_per_client, current_uses, is_active, is_stackable, description) VALUES
        
        -- Subscription-based discounts
        ('gggg1111-1111-1111-1111-111111111001', '123e4567-e89b-12d3-a456-426614174000', 'Desconto Assinante Premium', 'subscription_discount', 'percentage', 15.0, 1000.00, 6, 5, 2, true, false, 'Desconto para clientes com assinatura Premium ativa há pelo menos 6 meses'),
        
        ('gggg1111-1111-1111-1111-111111111002', '123e4567-e89b-12d3-a456-426614174000', 'Desconto Fidelidade', 'loyalty_discount', 'percentage', 10.0, 500.00, 12, 10, 5, true, true, 'Desconto de fidelidade para clientes há mais de 1 ano'),
        
        ('gggg2222-2222-2222-2222-222222222001', '234e4567-e89b-12d3-a456-426614174001', 'Desconto Volume Empresarial', 'volume_discount', 'percentage', 20.0, 10000.00, 3, 3, 1, true, false, 'Desconto especial para casos de alto valor (acima de R$ 10.000)'),
        
        ('gggg2222-2222-2222-2222-222222222002', '234e4567-e89b-12d3-a456-426614174001', 'Promo Startup', 'promotional', 'percentage', 25.0, 1000.00, 1, 2, 1, true, false, 'Promoção especial para startups novos clientes');

        RAISE NOTICE 'Discount rules inserted successfully';
    ELSE
        RAISE NOTICE 'Discount rules table does not exist, skipping...';
    END IF;
END $$;

COMMIT;

-- Success message
SELECT 'Billing system seed data inserted successfully!' as status;