/**
 * seed-billing.mjs — Invoices, line items, case types, subscription plans,
 * client subscriptions, discount rules, payment plans, installments
 */

import {
  FIRM_A_ID, FIRM_B_ID,
  dateOnly, daysAgo,
  upsertRows, log,
} from './_shared.mjs';

export async function seed(supabase, ctx) {
  const mod = 'seed-billing';
  let total = 0;

  try {
    const A = ctx.firmAUsers;
    const B = ctx.firmBUsers;

    // ------------------------------------------------------------------
    // 1. Invoices (Firm A: 6, Firm B: 4)
    // NOTE: Do NOT set outstanding_amount — it's GENERATED (total_amount - paid_amount)
    // ------------------------------------------------------------------
    const invoices = [
      // Firm A
      { id: 'a7000001-0001-4001-8001-a70000010001', law_firm_id: FIRM_A_ID, contact_id: 'cf000001-0004-4001-8001-cf0000010004', matter_id: 'a0000001-0001-4001-8001-a00000010001', invoice_number: 'DR-FAT-2025-001', title: 'Honorários - Cobrança Horizonte (parcela 1)', issue_date: dateOnly(-45), due_date: dateOnly(-15), subtotal: 2625.00, tax_amount: 0, total_amount: 2625.00, paid_amount: 2625.00, paid_date: dateOnly(-12), status: 'paid', payment_method: 'pix', created_by: A.admin },
      { id: 'a7000001-0002-4001-8001-a70000010002', law_firm_id: FIRM_A_ID, contact_id: 'cf000001-0004-4001-8001-cf0000010004', matter_id: 'a0000001-0001-4001-8001-a00000010001', invoice_number: 'DR-FAT-2025-002', title: 'Honorários - Cobrança Horizonte (parcela 2)', issue_date: dateOnly(-15), due_date: dateOnly(15), subtotal: 1575.00, tax_amount: 0, total_amount: 1575.00, paid_amount: 0, status: 'sent', created_by: A.admin },
      { id: 'a7000001-0003-4001-8001-a70000010003', law_firm_id: FIRM_A_ID, contact_id: 'cf000001-0002-4001-8001-cf0000010002', matter_id: 'a0000001-0002-4001-8001-a00000010002', invoice_number: 'DR-FAT-2025-003', title: 'Honorários - Reclamação Trabalhista Ferreira', issue_date: dateOnly(-10), due_date: dateOnly(20), subtotal: 750.00, tax_amount: 0, total_amount: 750.00, paid_amount: 0, status: 'sent', created_by: A.admin },
      { id: 'a7000001-0004-4001-8001-a70000010004', law_firm_id: FIRM_A_ID, contact_id: 'cf000001-0003-4001-8001-cf0000010003', matter_id: 'a0000001-0003-4001-8001-a00000010003', invoice_number: 'DR-FAT-2025-004', title: 'Honorários - Defesa Criminal Almeida', issue_date: dateOnly(-5), due_date: dateOnly(25), subtotal: 12500.00, tax_amount: 0, total_amount: 12500.00, paid_amount: 5000.00, status: 'sent', payment_method: 'bank_transfer', created_by: A.admin },
      { id: 'a7000001-0005-4001-8001-a70000010005', law_firm_id: FIRM_A_ID, contact_id: 'cf000001-0006-4001-8001-cf0000010006', matter_id: 'a0000001-0005-4001-8001-a00000010005', invoice_number: 'DR-FAT-2024-005', title: 'Honorários - Indenização Sabor & Arte (final)', issue_date: dateOnly(-60), due_date: dateOnly(-30), subtotal: 3500.00, tax_amount: 0, total_amount: 3500.00, paid_amount: 3500.00, paid_date: dateOnly(-28), status: 'paid', payment_method: 'bank_transfer', created_by: A.admin },
      { id: 'a7000001-0006-4001-8001-a70000010006', law_firm_id: FIRM_A_ID, contact_id: 'cf000001-0005-4001-8001-cf0000010005', matter_id: 'a0000001-0004-4001-8001-a00000010004', invoice_number: 'DR-FAT-2025-006', title: 'Honorários - Previdenciário Lima', issue_date: dateOnly(-30), due_date: dateOnly(-5), subtotal: 840.00, tax_amount: 0, total_amount: 840.00, paid_amount: 0, status: 'overdue', created_by: A.admin },

      // Firm B
      { id: 'babababa-0001-0001-0001-babababababa', law_firm_id: FIRM_B_ID, contact_id: 'b5b5b5b5-0001-0001-0001-b5b5b5b5b5b5', matter_id: 'b6b6b6b6-0001-0001-0001-b6b6b6b6b6b6', invoice_number: 'SS-FAT-2026-001', title: 'Honorários - Usucapião Mendes', issue_date: dateOnly(-20), due_date: dateOnly(10), subtotal: 1400.00, tax_amount: 0, total_amount: 1400.00, paid_amount: 0, status: 'sent', created_by: B.admin },
      { id: 'a7000002-0002-4001-8001-a70000020002', law_firm_id: FIRM_B_ID, contact_id: 'b5b5b5b5-0002-0002-0002-b5b5b5b5b5b5', matter_id: 'b6b6b6b6-0002-0002-0002-b6b6b6b6b6b6', invoice_number: 'SS-FAT-2026-002', title: 'Honorários - Incorporação Tech Solutions (entrada)', issue_date: dateOnly(-15), due_date: dateOnly(-5), subtotal: 17500.00, tax_amount: 0, total_amount: 17500.00, paid_amount: 17500.00, paid_date: dateOnly(-3), status: 'paid', payment_method: 'pix', created_by: B.admin },
      { id: 'a7000002-0003-4001-8001-a70000020003', law_firm_id: FIRM_B_ID, contact_id: 'ce000001-0005-4001-8001-ce0000010005', matter_id: 'b0000001-0003-4001-8001-b00000010003', invoice_number: 'SS-FAT-2026-003', title: 'Honorários - Defesa Fiscal Imobiliária Carioca', issue_date: dateOnly(-3), due_date: dateOnly(27), subtotal: 4500.00, tax_amount: 0, total_amount: 4500.00, paid_amount: 0, status: 'draft', created_by: B.admin },
      { id: 'a7000002-0004-4001-8001-a70000020004', law_firm_id: FIRM_B_ID, contact_id: 'ce000001-0003-4001-8001-ce0000010003', matter_id: 'b0000001-0004-4001-8001-b00000010004', invoice_number: 'SS-FAT-2025-004', title: 'Honorários - Locação Ribeiro (final)', issue_date: dateOnly(-50), due_date: dateOnly(-20), subtotal: 8000.00, tax_amount: 0, total_amount: 8000.00, paid_amount: 8000.00, paid_date: dateOnly(-18), status: 'paid', payment_method: 'bank_transfer', created_by: B.admin },
    ];
    let r = await upsertRows(supabase, 'invoices', invoices);
    if (r.error) throw new Error(`invoices: ${r.error.message}`);
    total += r.count;
    log(`invoices: ${r.count} rows`);

    // ------------------------------------------------------------------
    // 2. Invoice Line Items (2 per invoice)
    // NOTE: Do NOT set amount — it's GENERATED (quantity * rate)
    // ------------------------------------------------------------------
    const lineItems = [
      // Firm A Invoice 1 (paid)
      { id: 'a8000001-0001-4001-8001-a80000010001', invoice_id: 'a7000001-0001-4001-8001-a70000010001', description: 'Pesquisa jurisprudencial - 3h', quantity: 3.0, rate: 350.00, item_type: 'time', service_date: dateOnly(-50) },
      { id: 'a8000001-0002-4001-8001-a80000010002', invoice_id: 'a7000001-0001-4001-8001-a70000010001', description: 'Redação de petição inicial - 4.5h', quantity: 4.5, rate: 350.00, item_type: 'time', service_date: dateOnly(-47) },
      // Firm A Invoice 2 (sent)
      { id: 'a8000001-0003-4001-8001-a80000010003', invoice_id: 'a7000001-0002-4001-8001-a70000010002', description: 'Protocolo e acompanhamento processual - 3h', quantity: 3.0, rate: 350.00, item_type: 'time', service_date: dateOnly(-20) },
      { id: 'a8000001-0004-4001-8001-a80000010004', invoice_id: 'a7000001-0002-4001-8001-a70000010002', description: 'Custas judiciais', quantity: 1.0, rate: 525.00, item_type: 'expense', service_date: dateOnly(-18) },
      // Firm A Invoice 3 (sent)
      { id: 'a8000001-0005-4001-8001-a80000010005', invoice_id: 'a7000001-0003-4001-8001-a70000010003', description: 'Reunião com cliente - 1.5h', quantity: 1.5, rate: 300.00, item_type: 'time', service_date: dateOnly(-12) },
      { id: 'a8000001-0006-4001-8001-a80000010006', invoice_id: 'a7000001-0003-4001-8001-a70000010003', description: 'Cópias e autenticações', quantity: 1.0, rate: 300.00, item_type: 'expense', service_date: dateOnly(-11) },
      // Firm A Invoice 4 (partial)
      { id: 'a8000001-0007-4001-8001-a80000010007', invoice_id: 'a7000001-0004-4001-8001-a70000010004', description: 'Honorários advocatícios - parcela fixa', quantity: 1.0, rate: 12500.00, item_type: 'fee', service_date: dateOnly(-8) },
      { id: 'a8000001-0008-4001-8001-a80000010008', invoice_id: 'a7000001-0004-4001-8001-a70000010004', description: '(Desconto por pagamento à vista)', quantity: 0, rate: 0, item_type: 'other' },
      // Firm A Invoice 5 (paid, closed case)
      { id: 'a8000001-0009-4001-8001-a80000010009', invoice_id: 'a7000001-0005-4001-8001-a70000010005', description: 'Honorários finais - encerramento do caso', quantity: 10.0, rate: 350.00, item_type: 'time', service_date: dateOnly(-65) },
      { id: 'a8000001-0010-4001-8001-a80000010010', invoice_id: 'a7000001-0005-4001-8001-a70000010005', description: '(Desconto - caso encerrado)', quantity: 0, rate: 0, item_type: 'other' },
      // Firm A Invoice 6 (overdue)
      { id: 'a8000001-0011-4001-8001-a80000010011', invoice_id: 'a7000001-0006-4001-8001-a70000010006', description: 'Análise de CNIS - 2h', quantity: 2.0, rate: 280.00, item_type: 'time', service_date: dateOnly(-35) },
      { id: 'a8000001-0012-4001-8001-a80000010012', invoice_id: 'a7000001-0006-4001-8001-a70000010006', description: 'Requerimento ao INSS - 1h', quantity: 1.0, rate: 280.00, item_type: 'time', service_date: dateOnly(-32) },

      // Firm B Invoice 1 (sent)
      { id: 'a8000002-0001-4001-8001-a80000020001', invoice_id: 'babababa-0001-0001-0001-babababababa', description: 'Pesquisa sobre usucapião - 3.5h', quantity: 3.5, rate: 400.00, item_type: 'time', service_date: dateOnly(-25) },
      { id: 'a8000002-0002-4001-8001-a80000020002', invoice_id: 'babababa-0001-0001-0001-babababababa', description: '(Valor a complementar)', quantity: 0, rate: 0, item_type: 'other' },
      // Firm B Invoice 2 (paid)
      { id: 'a8000002-0003-4001-8001-a80000020003', invoice_id: 'a7000002-0002-4001-8001-a70000020002', description: 'Entrada - Incorporação Societária', quantity: 1.0, rate: 17500.00, item_type: 'fee', service_date: dateOnly(-18) },
      { id: 'a8000002-0004-4001-8001-a80000020004', invoice_id: 'a7000002-0002-4001-8001-a70000020002', description: '(Sem despesas adicionais)', quantity: 0, rate: 0, item_type: 'other' },
      // Firm B Invoice 3 (draft)
      { id: 'a8000002-0005-4001-8001-a80000020005', invoice_id: 'a7000002-0003-4001-8001-a70000020003', description: 'Análise de auto de infração - 4h', quantity: 4.0, rate: 450.00, item_type: 'time', service_date: dateOnly(-8) },
      { id: 'a8000002-0006-4001-8001-a80000020006', invoice_id: 'a7000002-0003-4001-8001-a70000020003', description: 'Pesquisa de precedentes - 2.5h', quantity: 2.5, rate: 450.00, item_type: 'time', service_date: dateOnly(-5) },
      // Firm B Invoice 4 (paid, closed case)
      { id: 'a8000002-0007-4001-8001-a80000020007', invoice_id: 'a7000002-0004-4001-8001-a70000020004', description: 'Honorários - Contrato de Locação (flat fee)', quantity: 1.0, rate: 8000.00, item_type: 'fee', service_date: dateOnly(-55) },
      { id: 'a8000002-0008-4001-8001-a80000020008', invoice_id: 'a7000002-0004-4001-8001-a70000020004', description: '(Taxa de registro)', quantity: 0, rate: 0, item_type: 'other' },
    ];
    r = await upsertRows(supabase, 'invoice_line_items', lineItems);
    if (r.error) throw new Error(`invoice_line_items: ${r.error.message}`);
    total += r.count;
    log(`invoice_line_items: ${r.count} rows`);

    // ------------------------------------------------------------------
    // 3. Case Types (Firm A: 4, Firm B: 3)
    // ------------------------------------------------------------------
    const caseTypes = [
      { id: 'a9000001-0001-4001-8001-a90000010001', law_firm_id: FIRM_A_ID, name: 'Processo Civil - Cobrança', legal_area: 'civil', complexity_level: 'medium', estimated_duration_months: 12, minimum_fee: 5000.00, default_hourly_rate: 350.00, billing_methods: ['hourly'], is_active: true },
      { id: 'a9000001-0002-4001-8001-a90000010002', law_firm_id: FIRM_A_ID, name: 'Reclamação Trabalhista', legal_area: 'labor', complexity_level: 'medium', estimated_duration_months: 8, minimum_fee: 3000.00, default_contingency_percentage: 20.00, billing_methods: ['contingency'], is_active: true },
      { id: 'a9000001-0003-4001-8001-a90000010003', law_firm_id: FIRM_A_ID, name: 'Defesa Criminal', legal_area: 'criminal', complexity_level: 'high', estimated_duration_months: 18, minimum_fee: 15000.00, default_flat_fee: 25000.00, billing_methods: ['flat_fee'], is_active: true },
      { id: 'a9000001-0004-4001-8001-a90000010004', law_firm_id: FIRM_A_ID, name: 'Benefício Previdenciário', legal_area: 'social_security', complexity_level: 'low', estimated_duration_months: 6, minimum_fee: 2000.00, default_hourly_rate: 280.00, billing_methods: ['hourly'], is_active: true },
      { id: 'a9000002-0001-4001-8001-a90000020001', law_firm_id: FIRM_B_ID, name: 'Ação de Usucapião', legal_area: 'real_estate', complexity_level: 'high', estimated_duration_months: 24, minimum_fee: 8000.00, default_hourly_rate: 400.00, billing_methods: ['hourly'], is_active: true },
      { id: 'a9000002-0002-4001-8001-a90000020002', law_firm_id: FIRM_B_ID, name: 'Incorporação Societária', legal_area: 'corporate', complexity_level: 'high', estimated_duration_months: 6, minimum_fee: 30000.00, default_flat_fee: 35000.00, billing_methods: ['flat_fee'], is_active: true },
      { id: 'a9000002-0003-4001-8001-a90000020003', law_firm_id: FIRM_B_ID, name: 'Defesa Fiscal', legal_area: 'tax', complexity_level: 'high', estimated_duration_months: 12, minimum_fee: 10000.00, default_hourly_rate: 450.00, billing_methods: ['hourly'], is_active: true },
    ];
    r = await upsertRows(supabase, 'case_types', caseTypes);
    if (r.error) throw new Error(`case_types: ${r.error.message}`);
    total += r.count;
    log(`case_types: ${r.count} rows`);

    // ------------------------------------------------------------------
    // 4. Subscription Plans (Firm A: 3, Firm B: 2)
    // ------------------------------------------------------------------
    const subPlans = [
      { id: 'aa000001-0001-4001-8001-aa0000010001', law_firm_id: FIRM_A_ID, name: 'Básico', description: 'Plano básico com 10h/mês de assessoria', price_monthly: 2500.00, price_yearly: 27000.00, max_hours_per_month: 10, is_active: true, sort_order: 1 },
      { id: 'aa000001-0002-4001-8001-aa0000010002', law_firm_id: FIRM_A_ID, name: 'Profissional', description: 'Plano profissional com 25h/mês e suporte prioritário', price_monthly: 5500.00, price_yearly: 60000.00, max_hours_per_month: 25, is_active: true, sort_order: 2 },
      { id: 'aa000001-0003-4001-8001-aa0000010003', law_firm_id: FIRM_A_ID, name: 'Enterprise', description: 'Plano enterprise com horas ilimitadas', price_monthly: 12000.00, price_yearly: 132000.00, max_hours_per_month: 100, is_active: true, sort_order: 3 },
      { id: 'aa000002-0001-4001-8001-aa0000020001', law_firm_id: FIRM_B_ID, name: 'Standard', description: 'Plano padrão com 15h/mês', price_monthly: 3000.00, price_yearly: 33000.00, max_hours_per_month: 15, is_active: true, sort_order: 1 },
      { id: 'aa000002-0002-4001-8001-aa0000020002', law_firm_id: FIRM_B_ID, name: 'Premium', description: 'Plano premium com 30h/mês e suporte dedicado', price_monthly: 7000.00, price_yearly: 78000.00, max_hours_per_month: 30, is_active: true, sort_order: 2 },
    ];
    r = await upsertRows(supabase, 'subscription_plans', subPlans);
    if (r.error) throw new Error(`subscription_plans: ${r.error.message}`);
    total += r.count;
    log(`subscription_plans: ${r.count} rows`);

    // ------------------------------------------------------------------
    // 5. Client Subscriptions (Firm A: 2, Firm B: 1)
    // ------------------------------------------------------------------
    const clientSubs = [
      { id: 'ab000001-0001-4001-8001-ab0000010001', law_firm_id: FIRM_A_ID, contact_id: 'cf000001-0004-4001-8001-cf0000010004', subscription_plan_id: 'aa000001-0002-4001-8001-aa0000010002', status: 'active', billing_cycle: 'monthly', auto_renew: true, start_date: dateOnly(-90), next_billing_date: dateOnly(0), monthly_price: 5500.00 },
      { id: 'ab000001-0002-4001-8001-ab0000010002', law_firm_id: FIRM_A_ID, contact_id: 'cf000001-0006-4001-8001-cf0000010006', subscription_plan_id: 'aa000001-0001-4001-8001-aa0000010001', status: 'active', billing_cycle: 'monthly', auto_renew: true, start_date: dateOnly(-60), next_billing_date: dateOnly(0), monthly_price: 2500.00 },
      { id: 'ab000002-0001-4001-8001-ab0000020001', law_firm_id: FIRM_B_ID, contact_id: 'b5b5b5b5-0002-0002-0002-b5b5b5b5b5b5', subscription_plan_id: 'aa000002-0002-4001-8001-aa0000020002', status: 'active', billing_cycle: 'monthly', auto_renew: true, start_date: dateOnly(-45), next_billing_date: dateOnly(15), monthly_price: 7000.00 },
    ];
    r = await upsertRows(supabase, 'client_subscriptions', clientSubs);
    if (r.error) throw new Error(`client_subscriptions: ${r.error.message}`);
    total += r.count;
    log(`client_subscriptions: ${r.count} rows`);

    // ------------------------------------------------------------------
    // 6. Discount Rules (Firm A: 2, Firm B: 1)
    // ------------------------------------------------------------------
    const discountRules = [
      { id: 'ac000001-0001-4001-8001-ac0000010001', law_firm_id: FIRM_A_ID, name: 'Desconto Cliente Premium', rule_type: 'subscription_discount', discount_type: 'percentage', discount_value: 10, applies_to: 'subscription', description: 'Desconto de 10% para clientes com plano Profissional ou superior', is_active: true, auto_apply: true, priority: 1, start_date: dateOnly(-90) },
      { id: 'ac000001-0002-4001-8001-ac0000010002', law_firm_id: FIRM_A_ID, name: 'Desconto Volume', rule_type: 'volume_discount', discount_type: 'percentage', discount_value: 5, applies_to: 'all', description: 'Desconto de 5% para faturas acima de R$10.000', is_active: true, auto_apply: false, priority: 2, minimum_monthly_billing: 10000, start_date: dateOnly(-60) },
      { id: 'ac000002-0001-4001-8001-ac0000020001', law_firm_id: FIRM_B_ID, name: 'Desconto Fidelidade', rule_type: 'loyalty_discount', discount_type: 'percentage', discount_value: 8, applies_to: 'all', description: 'Desconto de 8% para clientes ativos há mais de 6 meses', is_active: true, auto_apply: true, priority: 1, minimum_subscription_months: 6, start_date: dateOnly(-30) },
    ];
    r = await upsertRows(supabase, 'discount_rules', discountRules);
    if (r.error) throw new Error(`discount_rules: ${r.error.message}`);
    total += r.count;
    log(`discount_rules: ${r.count} rows`);

    // ------------------------------------------------------------------
    // 7. Payment Plans (Firm A: 2, Firm B: 1)
    // ------------------------------------------------------------------
    const paymentPlans = [
      { id: 'ad000001-0001-4001-8001-ad0000010001', law_firm_id: FIRM_A_ID, matter_id: 'a0000001-0003-4001-8001-a00000010003', client_id: 'cf000001-0003-4001-8001-cf0000010003', plan_name: 'Parcelamento - Defesa Criminal Almeida', total_amount: 25000.00, installment_count: 5, installment_amount: 5000.00, down_payment: 5000.00, payment_frequency: 'monthly', start_date: dateOnly(-30), status: 'active', late_fee_percentage: 2.0, grace_period_days: 5 },
      { id: 'ad000001-0002-4001-8001-ad0000010002', law_firm_id: FIRM_A_ID, matter_id: 'a0000001-0004-4001-8001-a00000010004', client_id: 'cf000001-0005-4001-8001-cf0000010005', plan_name: 'Parcelamento - Previdenciário Lima', total_amount: 6000.00, installment_count: 3, installment_amount: 2000.00, payment_frequency: 'monthly', start_date: dateOnly(-60), status: 'active', late_fee_percentage: 2.0, grace_period_days: 5 },
      { id: 'ad000002-0001-4001-8001-ad0000020001', law_firm_id: FIRM_B_ID, matter_id: 'b6b6b6b6-0002-0002-0002-b6b6b6b6b6b6', client_id: 'b5b5b5b5-0002-0002-0002-b5b5b5b5b5b5', plan_name: 'Parcelamento - Incorporação Tech Solutions', total_amount: 35000.00, installment_count: 3, installment_amount: 11666.67, down_payment: 17500.00, payment_frequency: 'monthly', start_date: dateOnly(-15), status: 'active', late_fee_percentage: 2.0, grace_period_days: 5 },
    ];
    r = await upsertRows(supabase, 'payment_plans', paymentPlans);
    if (r.error) throw new Error(`payment_plans: ${r.error.message}`);
    total += r.count;
    log(`payment_plans: ${r.count} rows`);

    // ------------------------------------------------------------------
    // 8. Payment Installments (Firm A: 6, Firm B: 3)
    // ------------------------------------------------------------------
    const installments = [
      // Plan A1 — 3 installments (paid, pending, overdue)
      { id: 'ae000001-0001-4001-8001-ae0000010001', payment_plan_id: 'ad000001-0001-4001-8001-ad0000010001', law_firm_id: FIRM_A_ID, installment_number: 1, due_date: dateOnly(-30), amount: 5000.00, paid_amount: 5000.00, paid_date: dateOnly(-28), status: 'paid', payment_method: 'bank_transfer' },
      { id: 'ae000001-0002-4001-8001-ae0000010002', payment_plan_id: 'ad000001-0001-4001-8001-ad0000010001', law_firm_id: FIRM_A_ID, installment_number: 2, due_date: dateOnly(0), amount: 5000.00, paid_amount: 0, status: 'pending' },
      { id: 'ae000001-0003-4001-8001-ae0000010003', payment_plan_id: 'ad000001-0001-4001-8001-ad0000010001', law_firm_id: FIRM_A_ID, installment_number: 3, due_date: dateOnly(30), amount: 5000.00, paid_amount: 0, status: 'pending' },
      // Plan A2 — 3 installments (paid, overdue, pending)
      { id: 'ae000001-0004-4001-8001-ae0000010004', payment_plan_id: 'ad000001-0002-4001-8001-ad0000010002', law_firm_id: FIRM_A_ID, installment_number: 1, due_date: dateOnly(-60), amount: 2000.00, paid_amount: 2000.00, paid_date: dateOnly(-58), status: 'paid', payment_method: 'pix' },
      { id: 'ae000001-0005-4001-8001-ae0000010005', payment_plan_id: 'ad000001-0002-4001-8001-ad0000010002', law_firm_id: FIRM_A_ID, installment_number: 2, due_date: dateOnly(-30), amount: 2000.00, paid_amount: 0, status: 'overdue', late_fee_applied: 40.00 },
      { id: 'ae000001-0006-4001-8001-ae0000010006', payment_plan_id: 'ad000001-0002-4001-8001-ad0000010002', law_firm_id: FIRM_A_ID, installment_number: 3, due_date: dateOnly(0), amount: 2000.00, paid_amount: 0, status: 'pending' },
      // Plan B1 — 3 installments
      { id: 'ae000002-0001-4001-8001-ae0000020001', payment_plan_id: 'ad000002-0001-4001-8001-ad0000020001', law_firm_id: FIRM_B_ID, installment_number: 1, due_date: dateOnly(-15), amount: 11666.67, paid_amount: 11666.67, paid_date: dateOnly(-13), status: 'paid', payment_method: 'pix' },
      { id: 'ae000002-0002-4001-8001-ae0000020002', payment_plan_id: 'ad000002-0001-4001-8001-ad0000020001', law_firm_id: FIRM_B_ID, installment_number: 2, due_date: dateOnly(15), amount: 11666.67, paid_amount: 0, status: 'pending' },
      { id: 'ae000002-0003-4001-8001-ae0000020003', payment_plan_id: 'ad000002-0001-4001-8001-ad0000020001', law_firm_id: FIRM_B_ID, installment_number: 3, due_date: dateOnly(45), amount: 11666.67, paid_amount: 0, status: 'pending' },
    ];
    r = await upsertRows(supabase, 'payment_installments', installments);
    if (r.error) throw new Error(`payment_installments: ${r.error.message}`);
    total += r.count;
    log(`payment_installments: ${r.count} rows`);

    return { module: mod, success: true, count: total };
  } catch (err) {
    return { module: mod, success: false, count: total, error: err.message };
  }
}
