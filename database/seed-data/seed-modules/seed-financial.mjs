/**
 * seed-financial.mjs — Vendors, expense categories, bills, bill payments,
 * financial alerts, payment collections, payment reminders
 */

import {
  FIRM_A_ID, FIRM_B_ID,
  dateOnly, daysAgo, daysFromNow,
  upsertRows, log,
} from './_shared.mjs';

export async function seed(supabase, ctx) {
  const mod = 'seed-financial';
  let total = 0;

  try {
    const A = ctx.firmAUsers;
    const B = ctx.firmBUsers;

    // ------------------------------------------------------------------
    // 1. Vendors (Firm A: 5, Firm B: 4)
    // ------------------------------------------------------------------
    const vendors = [
      // Firm A
      { id: 'af000001-0001-4001-8001-af0000010001', law_firm_id: FIRM_A_ID, vendor_type: 'government', name: 'Tribunal de Justiça de São Paulo', legal_name: 'TJSP', cnpj: '50.484.055/0001-05', email: 'custas@tjsp.jus.br', phone: '(11) 2171-6000', payment_terms: 0, is_active: true, created_by: A.admin },
      { id: 'af000001-0002-4001-8001-af0000010002', law_firm_id: FIRM_A_ID, vendor_type: 'service_provider', name: 'ContaFácil Contabilidade', legal_name: 'ContaFácil Serviços Contábeis Ltda', cnpj: '33.444.555/0001-66', email: 'contato@contafacil.com.br', phone: '(11) 3333-5555', payment_terms: 30, pix_key: 'contato@contafacil.com.br', is_active: true, created_by: A.admin },
      { id: 'af000001-0003-4001-8001-af0000010003', law_firm_id: FIRM_A_ID, vendor_type: 'supplier', name: 'Enel São Paulo', legal_name: 'Enel Distribuição São Paulo S.A.', cnpj: '61.695.227/0001-93', email: 'atendimento@enel.com', phone: '0800 72 72 120', payment_terms: 30, is_active: true, created_by: A.admin },
      { id: 'af000001-0004-4001-8001-af0000010004', law_firm_id: FIRM_A_ID, vendor_type: 'service_provider', name: 'Dr. Paulo Mendes - Perito Contábil', cpf: '111.222.333-44', email: 'paulo.perito@email.com', phone: '(11) 98765-1234', payment_terms: 15, is_active: true, created_by: A.admin },
      { id: 'af000001-0005-4001-8001-af0000010005', law_firm_id: FIRM_A_ID, vendor_type: 'supplier', name: 'Papelaria Business', cnpj: '77.888.999/0001-11', email: 'vendas@papelariabus.com.br', phone: '(11) 4444-6666', payment_terms: 30, is_active: true, created_by: A.admin },
      // Firm B
      { id: 'af000002-0001-4001-8001-af0000020001', law_firm_id: FIRM_B_ID, vendor_type: 'government', name: 'Tribunal de Justiça do Rio de Janeiro', legal_name: 'TJRJ', cnpj: '28.538.734/0001-48', email: 'custas@tjrj.jus.br', phone: '(21) 3133-3000', payment_terms: 0, is_active: true, created_by: B.admin },
      { id: 'af000002-0002-4001-8001-af0000020002', law_firm_id: FIRM_B_ID, vendor_type: 'government', name: 'Receita Federal do Brasil', legal_name: 'Secretaria Especial da Receita Federal', cnpj: '00.394.460/0001-41', email: 'atendimento@receita.fazenda.gov.br', payment_terms: 0, is_active: true, created_by: B.admin },
      { id: 'af000002-0003-4001-8001-af0000020003', law_firm_id: FIRM_B_ID, vendor_type: 'supplier', name: 'Light S.A.', legal_name: 'Light Serviços de Eletricidade S.A.', cnpj: '60.444.437/0001-46', email: 'contato@light.com.br', phone: '0800 021 0196', payment_terms: 30, is_active: true, created_by: B.admin },
      { id: 'af000002-0004-4001-8001-af0000020004', law_firm_id: FIRM_B_ID, vendor_type: 'service_provider', name: 'Dra. Ana Fiscal - Perita Tributária', cpf: '444.555.666-77', email: 'ana.fiscal@email.com', phone: '(21) 99876-5432', payment_terms: 15, is_active: true, created_by: B.admin },
    ];
    let r = await upsertRows(supabase, 'vendors', vendors);
    if (r.error) throw new Error(`vendors: ${r.error.message}`);
    total += r.count;
    log(`vendors: ${r.count} rows`);

    // ------------------------------------------------------------------
    // 2. Expense Categories (Firm A: 8, Firm B: 6)
    // ------------------------------------------------------------------
    const expCats = [
      // Firm A
      { id: 'b2000001-0001-4001-8001-b20000010001', law_firm_id: FIRM_A_ID, code: 'OP001', name: 'Aluguel', category_type: 'operational', is_billable_default: false, tax_deductible: true, budget_monthly: 12000.00, is_active: true },
      { id: 'b2000001-0002-4001-8001-b20000010002', law_firm_id: FIRM_A_ID, code: 'OP002', name: 'Energia Elétrica', category_type: 'operational', is_billable_default: false, tax_deductible: true, budget_monthly: 1500.00, is_active: true },
      { id: 'b2000001-0003-4001-8001-b20000010003', law_firm_id: FIRM_A_ID, code: 'LG001', name: 'Custas Judiciais', category_type: 'legal', is_billable_default: true, tax_deductible: true, budget_monthly: 5000.00, is_active: true },
      { id: 'b2000001-0004-4001-8001-b20000010004', law_firm_id: FIRM_A_ID, code: 'LG002', name: 'Perícias e Honorários Periciais', category_type: 'legal', is_billable_default: true, tax_deductible: true, budget_monthly: 3000.00, is_active: true },
      { id: 'b2000001-0005-4001-8001-b20000010005', law_firm_id: FIRM_A_ID, code: 'AD001', name: 'Contabilidade', category_type: 'administrative', is_billable_default: false, tax_deductible: true, budget_monthly: 2500.00, is_active: true },
      { id: 'b2000001-0006-4001-8001-b20000010006', law_firm_id: FIRM_A_ID, code: 'AD002', name: 'Material de Escritório', category_type: 'administrative', is_billable_default: false, tax_deductible: true, budget_monthly: 800.00, is_active: true },
      { id: 'b2000001-0007-4001-8001-b20000010007', law_firm_id: FIRM_A_ID, code: 'TK001', name: 'Software e Tecnologia', category_type: 'technology', is_billable_default: false, tax_deductible: true, budget_monthly: 2000.00, is_active: true },
      { id: 'b2000001-0008-4001-8001-b20000010008', law_firm_id: FIRM_A_ID, code: 'MK001', name: 'Marketing e Publicidade', category_type: 'marketing', is_billable_default: false, tax_deductible: true, budget_monthly: 3000.00, is_active: true },
      // Firm B
      { id: 'b2000002-0001-4001-8001-b20000020001', law_firm_id: FIRM_B_ID, code: 'OP001', name: 'Aluguel', category_type: 'operational', is_billable_default: false, tax_deductible: true, budget_monthly: 8000.00, is_active: true },
      { id: 'b2000002-0002-4001-8001-b20000020002', law_firm_id: FIRM_B_ID, code: 'OP002', name: 'Energia Elétrica', category_type: 'operational', is_billable_default: false, tax_deductible: true, budget_monthly: 1200.00, is_active: true },
      { id: 'b2000002-0003-4001-8001-b20000020003', law_firm_id: FIRM_B_ID, code: 'LG001', name: 'Custas Judiciais', category_type: 'legal', is_billable_default: true, tax_deductible: true, budget_monthly: 4000.00, is_active: true },
      { id: 'b2000002-0004-4001-8001-b20000020004', law_firm_id: FIRM_B_ID, code: 'LG002', name: 'Perícias', category_type: 'legal', is_billable_default: true, tax_deductible: true, budget_monthly: 2000.00, is_active: true },
      { id: 'b2000002-0005-4001-8001-b20000020005', law_firm_id: FIRM_B_ID, code: 'AD001', name: 'Contabilidade', category_type: 'administrative', is_billable_default: false, tax_deductible: true, budget_monthly: 2000.00, is_active: true },
      { id: 'b2000002-0006-4001-8001-b20000020006', law_firm_id: FIRM_B_ID, code: 'TK001', name: 'Software e Tecnologia', category_type: 'technology', is_billable_default: false, tax_deductible: true, budget_monthly: 1500.00, is_active: true },
    ];
    r = await upsertRows(supabase, 'expense_categories', expCats);
    if (r.error) throw new Error(`expense_categories: ${r.error.message}`);
    total += r.count;
    log(`expense_categories: ${r.count} rows`);

    // ------------------------------------------------------------------
    // 3. Bills (Firm A: 5, Firm B: 4)
    // ------------------------------------------------------------------
    const bills = [
      // Firm A
      { id: 'b3000001-0001-4001-8001-b30000010001', law_firm_id: FIRM_A_ID, vendor_id: 'af000001-0003-4001-8001-af0000010003', bill_number: 'ENEL-2025-001', title: 'Energia elétrica - Janeiro', bill_date: dateOnly(-35), due_date: dateOnly(-5), amount: 1350.00, tax_amount: 0, total_amount: 1350.00, paid_amount: 1350.00, outstanding_amount: 0, status: 'paid', category: 'operational', payment_method: 'bank_transfer', payment_date: dateOnly(-4), is_billable: false, description: 'Conta de energia elétrica - Janeiro', created_by: A.staff },
      { id: 'b3000001-0002-4001-8001-b30000010002', law_firm_id: FIRM_A_ID, vendor_id: 'af000001-0002-4001-8001-af0000010002', bill_number: 'CTB-2025-001', title: 'Honorários contábeis - Fevereiro', bill_date: dateOnly(-10), due_date: dateOnly(20), amount: 2500.00, tax_amount: 0, total_amount: 2500.00, paid_amount: 0, outstanding_amount: 2500.00, status: 'pending', category: 'administrative', description: 'Honorários contábeis - Fevereiro', created_by: A.staff },
      { id: 'b3000001-0003-4001-8001-b30000010003', law_firm_id: FIRM_A_ID, vendor_id: 'af000001-0001-4001-8001-af0000010001', bill_number: 'TJSP-2025-001', title: 'Custas judiciais - Cobrança Horizonte', bill_date: dateOnly(-20), due_date: dateOnly(-10), amount: 850.00, tax_amount: 0, total_amount: 850.00, paid_amount: 0, outstanding_amount: 850.00, status: 'overdue', category: 'legal', matter_id: 'a0000001-0001-4001-8001-a00000010001', is_billable: true, is_reimbursable: true, description: 'Custas judiciais - Cobrança Horizonte', created_by: A.lawyer },
      { id: 'b3000001-0004-4001-8001-b30000010004', law_firm_id: FIRM_A_ID, vendor_id: 'af000001-0004-4001-8001-af0000010004', bill_number: 'PER-2025-001', title: 'Perícia contábil - Defesa Criminal Almeida', bill_date: dateOnly(-7), due_date: dateOnly(8), amount: 4500.00, tax_amount: 0, total_amount: 4500.00, paid_amount: 2000.00, outstanding_amount: 2500.00, status: 'approved', category: 'legal', matter_id: 'a0000001-0003-4001-8001-a00000010003', is_billable: true, is_reimbursable: true, description: 'Perícia contábil - Defesa Criminal Almeida', created_by: A.lawyer },
      { id: 'b3000001-0005-4001-8001-b30000010005', law_firm_id: FIRM_A_ID, vendor_id: 'af000001-0005-4001-8001-af0000010005', bill_number: 'PAP-2025-001', title: 'Material de escritório - Fevereiro', bill_date: dateOnly(-5), due_date: dateOnly(25), amount: 650.00, tax_amount: 0, total_amount: 650.00, paid_amount: 0, outstanding_amount: 650.00, status: 'pending', category: 'administrative', description: 'Material de escritório - Fevereiro', created_by: A.staff },
      // Firm B
      { id: 'b3000002-0001-4001-8001-b30000020001', law_firm_id: FIRM_B_ID, vendor_id: 'af000002-0003-4001-8001-af0000020003', bill_number: 'LIGHT-2026-001', title: 'Conta de energia - Janeiro', bill_date: dateOnly(-30), due_date: dateOnly(0), amount: 980.00, tax_amount: 0, total_amount: 980.00, paid_amount: 980.00, outstanding_amount: 0, status: 'paid', category: 'operational', payment_method: 'pix', payment_date: dateOnly(-1), description: 'Conta de energia - Janeiro', created_by: B.staff },
      { id: 'b3000002-0002-4001-8001-b30000020002', law_firm_id: FIRM_B_ID, vendor_id: 'af000002-0001-4001-8001-af0000020001', bill_number: 'TJRJ-2026-001', title: 'Custas judiciais - Usucapião Mendes', bill_date: dateOnly(-15), due_date: dateOnly(-5), amount: 1200.00, tax_amount: 0, total_amount: 1200.00, paid_amount: 0, outstanding_amount: 1200.00, status: 'overdue', category: 'legal', matter_id: 'b6b6b6b6-0001-0001-0001-b6b6b6b6b6b6', is_billable: true, is_reimbursable: true, description: 'Custas judiciais - Usucapião Mendes', created_by: B.lawyer },
      { id: 'b3000002-0003-4001-8001-b30000020003', law_firm_id: FIRM_B_ID, vendor_id: 'af000002-0004-4001-8001-af0000020004', bill_number: 'PER-2026-001', title: 'Perícia tributária - Defesa Fiscal', bill_date: dateOnly(-5), due_date: dateOnly(10), amount: 3500.00, tax_amount: 0, total_amount: 3500.00, paid_amount: 0, outstanding_amount: 3500.00, status: 'pending', category: 'legal', matter_id: 'b0000001-0003-4001-8001-b00000010003', is_billable: true, is_reimbursable: true, description: 'Perícia tributária - Defesa Fiscal', created_by: B.lawyer },
      { id: 'b3000002-0004-4001-8001-b30000020004', law_firm_id: FIRM_B_ID, vendor_id: 'af000002-0002-4001-8001-af0000020002', bill_number: 'RF-2026-001', title: 'Emolumentos - Receita Federal', bill_date: dateOnly(-10), due_date: dateOnly(20), amount: 2800.00, tax_amount: 0, total_amount: 2800.00, paid_amount: 0, outstanding_amount: 2800.00, status: 'pending', category: 'legal', description: 'Emolumentos - Receita Federal', created_by: B.lawyer },
    ];
    r = await upsertRows(supabase, 'bills', bills);
    if (r.error) throw new Error(`bills: ${r.error.message}`);
    total += r.count;
    log(`bills: ${r.count} rows`);

    // ------------------------------------------------------------------
    // 4. Bill Payments (Firm A: 3, Firm B: 2)
    // ------------------------------------------------------------------
    const billPayments = [
      // Firm A
      { id: 'b4000001-0001-4001-8001-b40000010001', bill_id: 'b3000001-0001-4001-8001-b30000010001', law_firm_id: FIRM_A_ID, payment_date: dateOnly(-4), amount: 1350.00, payment_method: 'bank_transfer', transaction_reference: 'TED-2025-00123', processed_by: A.staff, created_by: A.staff },
      { id: 'b4000001-0002-4001-8001-b40000010002', bill_id: 'b3000001-0004-4001-8001-b30000010004', law_firm_id: FIRM_A_ID, payment_date: dateOnly(-5), amount: 2000.00, payment_method: 'pix', transaction_reference: 'PIX-2025-00456', processed_by: A.staff, created_by: A.staff },
      { id: 'b4000001-0003-4001-8001-b40000010003', bill_id: 'b3000001-0004-4001-8001-b30000010004', law_firm_id: FIRM_A_ID, payment_date: dateOnly(-2), amount: 0, payment_method: 'pix', transaction_reference: 'PIX-2025-00789', processing_notes: 'Parcela restante agendada', processed_by: A.staff, created_by: A.staff },
      // Firm B
      { id: 'b4000002-0001-4001-8001-b40000020001', bill_id: 'b3000002-0001-4001-8001-b30000020001', law_firm_id: FIRM_B_ID, payment_date: dateOnly(-1), amount: 980.00, payment_method: 'pix', transaction_reference: 'PIX-2026-00111', processed_by: B.staff, created_by: B.staff },
      { id: 'b4000002-0002-4001-8001-b40000020002', bill_id: 'b3000002-0002-4001-8001-b30000020002', law_firm_id: FIRM_B_ID, payment_date: dateOnly(0), amount: 0, payment_method: 'bank_transfer', processing_notes: 'Pagamento em processamento', processed_by: B.staff, created_by: B.staff },
    ];
    r = await upsertRows(supabase, 'bill_payments', billPayments);
    if (r.error) throw new Error(`bill_payments: ${r.error.message}`);
    total += r.count;
    log(`bill_payments: ${r.count} rows`);

    // ------------------------------------------------------------------
    // 5. Financial Alerts (Firm A: 3, Firm B: 2)
    // ------------------------------------------------------------------
    const alerts = [
      { id: 'b5000001-0001-4001-8001-b50000010001', law_firm_id: FIRM_A_ID, alert_type: 'payment_overdue', entity_type: 'bill', entity_id: 'b3000001-0003-4001-8001-b30000010003', title: 'Custas judiciais vencidas', message: 'Custas do TJSP para o caso Cobrança Horizonte estão vencidas há 10 dias.', severity: 'critical', trigger_date: dateOnly(-10), is_active: true, action_required: 'Efetuar pagamento das custas judiciais' },
      { id: 'b5000001-0002-4001-8001-b50000010002', law_firm_id: FIRM_A_ID, alert_type: 'payment_due', entity_type: 'bill', entity_id: 'b3000001-0002-4001-8001-b30000010002', title: 'Contabilidade vence em 20 dias', message: 'Honorários contábeis mensais vencem em breve.', severity: 'warning', trigger_date: dateOnly(15), days_before_due: 5, is_active: true },
      { id: 'b5000001-0003-4001-8001-b50000010003', law_firm_id: FIRM_A_ID, alert_type: 'payment_due', entity_type: 'invoice', entity_id: 'a7000001-0006-4001-8001-a70000010006', title: 'Fatura vencida - Lima', message: 'Fatura do caso previdenciário Lima está vencida.', severity: 'critical', trigger_date: dateOnly(-5), is_active: true, action_required: 'Cobrar cliente e emitir segundo boleto' },
      { id: 'b5000002-0001-4001-8001-b50000020001', law_firm_id: FIRM_B_ID, alert_type: 'payment_overdue', entity_type: 'bill', entity_id: 'b3000002-0002-4001-8001-b30000020002', title: 'Custas TJRJ vencidas', message: 'Custas judiciais do caso Usucapião Mendes estão vencidas.', severity: 'critical', trigger_date: dateOnly(-5), is_active: true, action_required: 'Efetuar pagamento urgente das custas' },
      { id: 'b5000002-0002-4001-8001-b50000020002', law_firm_id: FIRM_B_ID, alert_type: 'payment_due', entity_type: 'bill', entity_id: 'b3000002-0003-4001-8001-b30000020003', title: 'Perícia tributária vence em breve', message: 'Pagamento da perícia tributária vence em 10 dias.', severity: 'warning', trigger_date: dateOnly(5), days_before_due: 5, is_active: true },
    ];
    r = await upsertRows(supabase, 'financial_alerts', alerts);
    if (r.error) throw new Error(`financial_alerts: ${r.error.message}`);
    total += r.count;
    log(`financial_alerts: ${r.count} rows`);

    // ------------------------------------------------------------------
    // 6. Payment Collections (Firm A: 2, Firm B: 1)
    // ------------------------------------------------------------------
    const collections = [
      { id: 'b6000001-0001-4001-8001-b60000010001', invoice_id: 'a7000001-0006-4001-8001-a70000010006', client_id: 'cf000001-0005-4001-8001-cf0000010005', law_firm_id: FIRM_A_ID, collection_status: 'overdue_30', days_overdue: 5, last_reminder_sent: daysAgo(2), reminder_count: 1, collection_notes: 'Cliente informou que pagará até sexta-feira.' },
      { id: 'b6000001-0002-4001-8001-b60000010002', invoice_id: 'a7000001-0004-4001-8001-a70000010004', client_id: 'cf000001-0003-4001-8001-cf0000010003', law_firm_id: FIRM_A_ID, collection_status: 'current', days_overdue: 0, reminder_count: 0, collection_notes: 'Parcela 2 vence em breve. Acompanhar.' },
      { id: 'b6000002-0001-4001-8001-b60000020001', invoice_id: 'babababa-0001-0001-0001-babababababa', client_id: 'b5b5b5b5-0001-0001-0001-b5b5b5b5b5b5', law_firm_id: FIRM_B_ID, collection_status: 'current', days_overdue: 0, reminder_count: 0, collection_notes: 'Fatura enviada. Aguardando pagamento.' },
    ];
    r = await upsertRows(supabase, 'payment_collections', collections);
    if (r.error) throw new Error(`payment_collections: ${r.error.message}`);
    total += r.count;
    log(`payment_collections: ${r.count} rows`);

    // ------------------------------------------------------------------
    // 7. Payment Reminders (Firm A: 2, Firm B: 1)
    // ------------------------------------------------------------------
    const reminders = [
      { id: 'b7000001-0001-4001-8001-b70000010001', invoice_id: 'a7000001-0006-4001-8001-a70000010006', client_id: 'cf000001-0005-4001-8001-cf0000010005', law_firm_id: FIRM_A_ID, reminder_type: 'first_overdue', scheduled_date: daysAgo(3), sent_date: daysAgo(2), send_method: 'email', recipient_email: 'fernanda.lima@email.com', subject: 'Lembrete: Fatura DR-FAT-2025-006 vencida', message_body: 'Prezada Fernanda, lembramos que a fatura DR-FAT-2025-006 encontra-se vencida desde ' + dateOnly(-5) + '. Pedimos a gentileza de efetuar o pagamento o mais breve possível.', status: 'sent', created_by: A.staff },
      { id: 'b7000001-0002-4001-8001-b70000010002', invoice_id: 'a7000001-0002-4001-8001-a70000010002', client_id: 'cf000001-0004-4001-8001-cf0000010004', law_firm_id: FIRM_A_ID, reminder_type: 'friendly', scheduled_date: daysFromNow(10), send_method: 'email', recipient_email: 'juridico@horizonte.com.br', subject: 'Lembrete: Fatura DR-FAT-2025-002 vence em breve', message_body: 'Prezados, informamos que a fatura DR-FAT-2025-002 no valor de R$ 1.575,00 vence em ' + dateOnly(15) + '.', status: 'scheduled', created_by: A.staff },
      { id: 'b7000002-0001-4001-8001-b70000020001', invoice_id: 'babababa-0001-0001-0001-babababababa', client_id: 'b5b5b5b5-0001-0001-0001-b5b5b5b5b5b5', law_firm_id: FIRM_B_ID, reminder_type: 'friendly', scheduled_date: daysFromNow(5), send_method: 'email', recipient_email: 'carlos.mendes@email.com', subject: 'Lembrete: Fatura SS-FAT-2026-001 vence em breve', message_body: 'Prezado Carlos, informamos que a fatura SS-FAT-2026-001 no valor de R$ 1.400,00 vence em ' + dateOnly(10) + '.', status: 'scheduled', created_by: B.staff },
    ];
    r = await upsertRows(supabase, 'payment_reminders', reminders);
    if (r.error) throw new Error(`payment_reminders: ${r.error.message}`);
    total += r.count;
    log(`payment_reminders: ${r.count} rows`);

    return { module: mod, success: true, count: total };
  } catch (err) {
    return { module: mod, success: false, count: total, error: err.message };
  }
}
