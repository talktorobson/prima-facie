/**
 * seed-core.mjs — Law firms, matter types, contacts, matters, matter_contacts
 *
 * Expects ctx.firmAUsers and ctx.firmBClientUserId from orchestrator.
 */

import {
  FIRM_A_ID, FIRM_B_ID,
  dateOnly, daysFromNow,
  upsertRows, log,
} from './_shared.mjs';

export async function seed(supabase, ctx) {
  const mod = 'seed-core';
  let total = 0;

  try {
    const A = ctx.firmAUsers; // { admin, lawyer, lawyer2, staff }
    const B = ctx.firmBUsers; // { admin, lawyer, staff }
    const firmAClientUserId = ctx.firmAClientUserId;
    const firmBClientUserId = ctx.firmBClientUserId;

    // ------------------------------------------------------------------
    // 1. Law Firms (upsert — they should already exist from migrations)
    // ------------------------------------------------------------------
    const lawFirms = [
      {
        id: FIRM_A_ID,
        name: 'Dávila Reis Advocacia',
        legal_name: 'Dávila Reis Advocacia S/S',
        cnpj: '12.345.678/0001-90',
        oab_number: 'OAB/SP 12345',
        email: 'contato@davilareisadv.com.br',
        phone: '(11) 3456-7890',
        address_street: 'Avenida Paulista',
        address_number: '1000',
        address_complement: 'Sala 2010',
        address_neighborhood: 'Bela Vista',
        address_city: 'São Paulo',
        address_state: 'SP',
        address_zipcode: '01310-100',
        plan_type: 'enterprise',
        subscription_active: true,
        primary_color: '#1E40AF',
        secondary_color: '#3B82F6',
      },
      {
        id: FIRM_B_ID,
        name: 'Silva & Santos Advogados',
        legal_name: 'Silva & Santos Advogados Associados S/S',
        cnpj: '98.765.432/0001-10',
        oab_number: 'OAB/RJ 54321',
        email: 'contato@silvasantos.adv.br',
        phone: '(21) 3456-7890',
        address_street: 'Rua do Ouvidor',
        address_number: '150',
        address_neighborhood: 'Centro',
        address_city: 'Rio de Janeiro',
        address_state: 'RJ',
        address_zipcode: '20040-030',
        plan_type: 'professional',
        subscription_active: true,
        primary_color: '#047857',
        secondary_color: '#10B981',
      },
    ];
    let r = await upsertRows(supabase, 'law_firms', lawFirms);
    if (r.error) throw new Error(`law_firms: ${r.error.message}`);
    total += r.count;
    log(`law_firms: ${r.count} rows`);

    // ------------------------------------------------------------------
    // 2. Matter Types
    // ------------------------------------------------------------------
    const matterTypes = [
      // Firm A — 4 types
      { id: 'aaaa0001-0001-4001-8001-aaaa00010001', law_firm_id: FIRM_A_ID, name: 'Direito Civil', description: 'Ações cíveis, cobranças, indenizações', color: '#3B82F6', default_hourly_rate: 350.00, is_active: true, sort_order: 1 },
      { id: 'aaaa0001-0002-4001-8001-aaaa00010002', law_firm_id: FIRM_A_ID, name: 'Direito Trabalhista', description: 'Reclamações trabalhistas, acordos', color: '#EF4444', default_hourly_rate: 300.00, is_active: true, sort_order: 2 },
      { id: 'aaaa0001-0003-4001-8001-aaaa00010003', law_firm_id: FIRM_A_ID, name: 'Direito Criminal', description: 'Defesa criminal, habeas corpus', color: '#F59E0B', default_hourly_rate: 400.00, is_active: true, sort_order: 3 },
      { id: 'aaaa0001-0004-4001-8001-aaaa00010004', law_firm_id: FIRM_A_ID, name: 'Direito Previdenciário', description: 'Aposentadoria, benefícios INSS', color: '#8B5CF6', default_hourly_rate: 280.00, is_active: true, sort_order: 4 },
      // Firm B — 3 types (2 existing + 1 new)
      { id: 'b4b4b4b4-0001-0001-0001-b4b4b4b4b4b4', law_firm_id: FIRM_B_ID, name: 'Direito Imobiliário', description: 'Questões imobiliárias e registros', color: '#06B6D4', default_hourly_rate: 400.00, is_active: true, sort_order: 1 },
      { id: 'b4b4b4b4-0002-0002-0002-b4b4b4b4b4b4', law_firm_id: FIRM_B_ID, name: 'Direito Societário', description: 'Constituição e reorganização de empresas', color: '#D946EF', default_hourly_rate: 500.00, is_active: true, sort_order: 2 },
      { id: 'bbbb0001-0003-4001-8001-bbbb00010003', law_firm_id: FIRM_B_ID, name: 'Direito Tributário', description: 'Planejamento tributário, defesa fiscal', color: '#F97316', default_hourly_rate: 450.00, is_active: true, sort_order: 3 },
    ];
    r = await upsertRows(supabase, 'matter_types', matterTypes);
    if (r.error) throw new Error(`matter_types: ${r.error.message}`);
    total += r.count;
    log(`matter_types: ${r.count} rows`);

    // ------------------------------------------------------------------
    // 3. Contacts
    // ------------------------------------------------------------------
    const contacts = [
      // Firm A — 6 contacts (1 linked to client user)
      { id: 'cf000001-0001-4001-8001-cf0000010001', law_firm_id: FIRM_A_ID, contact_type: 'individual', first_name: 'Pedro', last_name: 'Oliveira', full_name: 'Pedro Oliveira', cpf: '123.456.789-00', email: 'pedro.oliveira@email.com', phone: '(11) 99999-1111', client_status: 'active', user_id: firmAClientUserId, source: 'indicacao' },
      { id: 'cf000001-0002-4001-8001-cf0000010002', law_firm_id: FIRM_A_ID, contact_type: 'individual', first_name: 'Juliana', last_name: 'Ferreira', full_name: 'Juliana Ferreira', cpf: '234.567.890-11', email: 'juliana.ferreira@email.com', phone: '(11) 99999-2222', client_status: 'active', source: 'site' },
      { id: 'cf000001-0003-4001-8001-cf0000010003', law_firm_id: FIRM_A_ID, contact_type: 'individual', first_name: 'Ricardo', last_name: 'Almeida', full_name: 'Ricardo Almeida', cpf: '345.678.901-22', email: 'ricardo.almeida@email.com', phone: '(11) 99999-3333', client_status: 'active', source: 'indicacao' },
      { id: 'cf000001-0004-4001-8001-cf0000010004', law_firm_id: FIRM_A_ID, contact_type: 'company', company_name: 'Construtora Horizonte Ltda', cnpj: '44.555.666/0001-77', email: 'juridico@horizonte.com.br', phone: '(11) 3333-4444', client_status: 'active', source: 'evento' },
      { id: 'cf000001-0005-4001-8001-cf0000010005', law_firm_id: FIRM_A_ID, contact_type: 'individual', first_name: 'Fernanda', last_name: 'Lima', full_name: 'Fernanda Lima', cpf: '456.789.012-33', email: 'fernanda.lima@email.com', phone: '(11) 99999-5555', client_status: 'prospect', source: 'site' },
      { id: 'cf000001-0006-4001-8001-cf0000010006', law_firm_id: FIRM_A_ID, contact_type: 'company', company_name: 'Restaurante Sabor & Arte', cnpj: '55.666.777/0001-88', email: 'contato@saborarte.com.br', phone: '(11) 4444-5555', client_status: 'active', source: 'indicacao' },
      // Firm B — 5 contacts (1 linked to client user)
      { id: 'b5b5b5b5-0001-0001-0001-b5b5b5b5b5b5', law_firm_id: FIRM_B_ID, contact_type: 'individual', first_name: 'Carlos', last_name: 'Mendes', full_name: 'Carlos Mendes', cpf: '987.654.321-00', email: 'carlos.mendes@email.com', phone: '(21) 91234-5678', client_status: 'active', user_id: firmBClientUserId },
      { id: 'b5b5b5b5-0002-0002-0002-b5b5b5b5b5b5', law_firm_id: FIRM_B_ID, contact_type: 'company', company_name: 'Tech Solutions Ltda', cnpj: '11.222.333/0001-44', email: 'contato@techsolutions.com.br', phone: '(21) 3333-4444', client_status: 'active' },
      { id: 'ce000001-0003-4001-8001-ce0000010003', law_firm_id: FIRM_B_ID, contact_type: 'individual', first_name: 'Luciana', last_name: 'Ribeiro', full_name: 'Luciana Ribeiro', cpf: '876.543.210-99', email: 'luciana.ribeiro@email.com', phone: '(21) 98765-4321', client_status: 'active', source: 'indicacao' },
      { id: 'ce000001-0004-4001-8001-ce0000010004', law_firm_id: FIRM_B_ID, contact_type: 'individual', first_name: 'André', last_name: 'Costa', full_name: 'André Costa', cpf: '765.432.109-88', email: 'andre.costa@email.com', phone: '(21) 99876-5432', client_status: 'prospect', source: 'site' },
      { id: 'ce000001-0005-4001-8001-ce0000010005', law_firm_id: FIRM_B_ID, contact_type: 'company', company_name: 'Imobiliária Carioca', cnpj: '22.333.444/0001-55', email: 'juridico@imobcarioca.com.br', phone: '(21) 2222-3333', client_status: 'active', source: 'evento' },
    ];
    r = await upsertRows(supabase, 'contacts', contacts);
    if (r.error) throw new Error(`contacts: ${r.error.message}`);
    total += r.count;
    log(`contacts: ${r.count} rows`);

    // ------------------------------------------------------------------
    // 4. Matters
    // ------------------------------------------------------------------
    const matters = [
      // Firm A — 6 matters (3+ with next_court_date for calendar)
      {
        id: 'a0000001-0001-4001-8001-a00000010001', law_firm_id: FIRM_A_ID,
        matter_type_id: 'aaaa0001-0001-4001-8001-aaaa00010001',
        matter_number: 'DR-2025-001', title: 'Ação de Cobrança - Horizonte',
        description: 'Cobrança de valores devidos por contrato de prestação de serviços',
        court_name: '5ª Vara Cível - SP', court_city: 'São Paulo', court_state: 'SP',
        process_number: '1234567-89.2025.8.26.0100',
        status: 'active', priority: 'high', billing_method: 'hourly', hourly_rate: 350.00,
        responsible_lawyer_id: A.lawyer, created_by: A.admin,
        opened_date: dateOnly(-120), next_court_date: dateOnly(14),
      },
      {
        id: 'a0000001-0002-4001-8001-a00000010002', law_firm_id: FIRM_A_ID,
        matter_type_id: 'aaaa0001-0002-4001-8001-aaaa00010002',
        matter_number: 'DR-2025-002', title: 'Reclamação Trabalhista - Ferreira vs ABC',
        description: 'Reclamação trabalhista por verbas rescisórias não pagas',
        court_name: '2ª Vara do Trabalho - SP', court_city: 'São Paulo', court_state: 'SP',
        process_number: '9876543-21.2025.5.02.0001',
        status: 'active', priority: 'medium', billing_method: 'contingency', contingency_percentage: 20.00,
        responsible_lawyer_id: A.lawyer, created_by: A.admin,
        opened_date: dateOnly(-90), next_court_date: dateOnly(21),
      },
      {
        id: 'a0000001-0003-4001-8001-a00000010003', law_firm_id: FIRM_A_ID,
        matter_type_id: 'aaaa0001-0003-4001-8001-aaaa00010003',
        matter_number: 'DR-2025-003', title: 'Defesa Criminal - Almeida',
        description: 'Defesa em processo criminal por estelionato',
        court_name: '3ª Vara Criminal - SP', court_city: 'São Paulo', court_state: 'SP',
        process_number: '5555666-77.2025.8.26.0001',
        status: 'active', priority: 'urgent', billing_method: 'flat_fee', flat_fee: 25000.00,
        responsible_lawyer_id: A.lawyer2 || A.lawyer, created_by: A.admin,
        opened_date: dateOnly(-60), next_court_date: dateOnly(7),
      },
      {
        id: 'a0000001-0004-4001-8001-a00000010004', law_firm_id: FIRM_A_ID,
        matter_type_id: 'aaaa0001-0004-4001-8001-aaaa00010004',
        matter_number: 'DR-2025-004', title: 'Aposentadoria por Tempo - Lima',
        description: 'Pedido de aposentadoria por tempo de contribuição junto ao INSS',
        court_name: 'Vara Federal Previdenciária', court_city: 'São Paulo', court_state: 'SP',
        status: 'active', priority: 'medium', billing_method: 'hourly', hourly_rate: 280.00,
        responsible_lawyer_id: A.lawyer, created_by: A.admin,
        opened_date: dateOnly(-180), next_court_date: dateOnly(35),
      },
      {
        id: 'a0000001-0005-4001-8001-a00000010005', law_firm_id: FIRM_A_ID,
        matter_type_id: 'aaaa0001-0001-4001-8001-aaaa00010001',
        matter_number: 'DR-2024-005', title: 'Indenização - Sabor & Arte vs Fornecedor',
        description: 'Ação de indenização por entrega de produtos defeituosos',
        status: 'closed', priority: 'low', billing_method: 'hourly', hourly_rate: 350.00,
        responsible_lawyer_id: A.lawyer, created_by: A.admin,
        opened_date: dateOnly(-365), closed_date: dateOnly(-30),
        total_billed: 8500.00, total_paid: 8500.00,
      },
      {
        id: 'a0000001-0006-4001-8001-a00000010006', law_firm_id: FIRM_A_ID,
        matter_type_id: 'aaaa0001-0002-4001-8001-aaaa00010002',
        matter_number: 'DR-2025-006', title: 'Acordo Trabalhista - Oliveira',
        description: 'Negociação de acordo trabalhista extrajudicial',
        status: 'on_hold', priority: 'low', billing_method: 'hourly', hourly_rate: 300.00,
        responsible_lawyer_id: A.lawyer2 || A.lawyer, created_by: A.admin,
        opened_date: dateOnly(-45),
      },
      // Firm B — 4 matters (3 with next_court_date)
      {
        id: 'b6b6b6b6-0001-0001-0001-b6b6b6b6b6b6', law_firm_id: FIRM_B_ID,
        matter_type_id: 'b4b4b4b4-0001-0001-0001-b4b4b4b4b4b4',
        matter_number: 'SS-2026-001', title: 'Usucapião Extraordinário - Mendes',
        description: 'Ação de usucapião extraordinário de imóvel residencial',
        court_name: '4ª Vara Cível - RJ', court_city: 'Rio de Janeiro', court_state: 'RJ',
        process_number: '1111222-33.2026.8.19.0001',
        status: 'active', priority: 'high', billing_method: 'hourly', hourly_rate: 400.00,
        responsible_lawyer_id: B.lawyer, created_by: B.admin,
        opened_date: dateOnly(-90), next_court_date: dateOnly(10),
      },
      {
        id: 'b6b6b6b6-0002-0002-0002-b6b6b6b6b6b6', law_firm_id: FIRM_B_ID,
        matter_type_id: 'b4b4b4b4-0002-0002-0002-b4b4b4b4b4b4',
        matter_number: 'SS-2026-002', title: 'Incorporação Societária - Tech Solutions',
        description: 'Assessoria na incorporação societária da empresa',
        status: 'active', priority: 'medium', billing_method: 'flat_fee', flat_fee: 35000.00,
        responsible_lawyer_id: B.lawyer, created_by: B.admin,
        opened_date: dateOnly(-60), next_court_date: dateOnly(28),
      },
      {
        id: 'b0000001-0003-4001-8001-b00000010003', law_firm_id: FIRM_B_ID,
        matter_type_id: 'bbbb0001-0003-4001-8001-bbbb00010003',
        matter_number: 'SS-2026-003', title: 'Defesa Fiscal - Imobiliária Carioca',
        description: 'Defesa em auto de infração da Receita Federal',
        court_name: 'Vara Federal Fiscal - RJ', court_city: 'Rio de Janeiro', court_state: 'RJ',
        status: 'active', priority: 'high', billing_method: 'hourly', hourly_rate: 450.00,
        responsible_lawyer_id: B.lawyer, created_by: B.admin,
        opened_date: dateOnly(-30), next_court_date: dateOnly(18),
      },
      {
        id: 'b0000001-0004-4001-8001-b00000010004', law_firm_id: FIRM_B_ID,
        matter_type_id: 'b4b4b4b4-0001-0001-0001-b4b4b4b4b4b4',
        matter_number: 'SS-2025-004', title: 'Contrato de Locação - Ribeiro',
        description: 'Revisão e negociação de contrato de locação comercial',
        status: 'closed', priority: 'low', billing_method: 'flat_fee', flat_fee: 8000.00,
        responsible_lawyer_id: B.lawyer, created_by: B.admin,
        opened_date: dateOnly(-200), closed_date: dateOnly(-45),
        total_billed: 8000.00, total_paid: 8000.00,
      },
    ];
    r = await upsertRows(supabase, 'matters', matters);
    if (r.error) throw new Error(`matters: ${r.error.message}`);
    total += r.count;
    log(`matters: ${r.count} rows`);

    // ------------------------------------------------------------------
    // 5. Matter Contacts
    // ------------------------------------------------------------------
    const matterContacts = [
      // Firm A
      { id: 'c0000001-0001-4001-8001-c00000010001', matter_id: 'a0000001-0001-4001-8001-a00000010001', contact_id: 'cf000001-0004-4001-8001-cf0000010004', law_firm_id: FIRM_A_ID, relationship_type: 'client', is_primary: true },
      { id: 'c0000001-0002-4001-8001-c00000010002', matter_id: 'a0000001-0002-4001-8001-a00000010002', contact_id: 'cf000001-0002-4001-8001-cf0000010002', law_firm_id: FIRM_A_ID, relationship_type: 'client', is_primary: true },
      { id: 'c0000001-0003-4001-8001-c00000010003', matter_id: 'a0000001-0003-4001-8001-a00000010003', contact_id: 'cf000001-0003-4001-8001-cf0000010003', law_firm_id: FIRM_A_ID, relationship_type: 'client', is_primary: true },
      { id: 'c0000001-0004-4001-8001-c00000010004', matter_id: 'a0000001-0004-4001-8001-a00000010004', contact_id: 'cf000001-0005-4001-8001-cf0000010005', law_firm_id: FIRM_A_ID, relationship_type: 'client', is_primary: true },
      { id: 'c0000001-0005-4001-8001-c00000010005', matter_id: 'a0000001-0005-4001-8001-a00000010005', contact_id: 'cf000001-0006-4001-8001-cf0000010006', law_firm_id: FIRM_A_ID, relationship_type: 'client', is_primary: true },
      { id: 'c0000001-0006-4001-8001-c00000010006', matter_id: 'a0000001-0006-4001-8001-a00000010006', contact_id: 'cf000001-0001-4001-8001-cf0000010001', law_firm_id: FIRM_A_ID, relationship_type: 'client', is_primary: true },
      // Firm B
      { id: 'b7b7b7b7-0001-0001-0001-b7b7b7b7b7b7', matter_id: 'b6b6b6b6-0001-0001-0001-b6b6b6b6b6b6', contact_id: 'b5b5b5b5-0001-0001-0001-b5b5b5b5b5b5', law_firm_id: FIRM_B_ID, relationship_type: 'client', is_primary: true },
      { id: 'b7b7b7b7-0002-0002-0002-b7b7b7b7b7b7', matter_id: 'b6b6b6b6-0002-0002-0002-b6b6b6b6b6b6', contact_id: 'b5b5b5b5-0002-0002-0002-b5b5b5b5b5b5', law_firm_id: FIRM_B_ID, relationship_type: 'client', is_primary: true },
      { id: 'c0000002-0003-4001-8001-c00000020003', matter_id: 'b0000001-0003-4001-8001-b00000010003', contact_id: 'ce000001-0005-4001-8001-ce0000010005', law_firm_id: FIRM_B_ID, relationship_type: 'client', is_primary: true },
      { id: 'c0000002-0004-4001-8001-c00000020004', matter_id: 'b0000001-0004-4001-8001-b00000010004', contact_id: 'ce000001-0003-4001-8001-ce0000010003', law_firm_id: FIRM_B_ID, relationship_type: 'client', is_primary: true },
    ];
    r = await upsertRows(supabase, 'matter_contacts', matterContacts);
    if (r.error) throw new Error(`matter_contacts: ${r.error.message}`);
    total += r.count;
    log(`matter_contacts: ${r.count} rows`);

    return { module: mod, success: true, count: total };
  } catch (err) {
    return { module: mod, success: false, count: total, error: err.message };
  }
}
