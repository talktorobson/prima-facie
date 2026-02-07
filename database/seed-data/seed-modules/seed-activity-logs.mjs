/**
 * seed-activity-logs.mjs — Audit trail covering all entity types.
 * Runs last since it references entities from all other modules.
 */

import {
  FIRM_A_ID, FIRM_B_ID,
  daysAgo,
  replaceRows, log,
} from './_shared.mjs';

export async function seed(supabase, ctx) {
  const mod = 'seed-activity-logs';
  let total = 0;

  try {
    const A = ctx.firmAUsers;
    const B = ctx.firmBUsers;

    // ------------------------------------------------------------------
    // Activity Logs (Firm A: 15, Firm B: 10)
    // Delete and recreate for fresh data each run.
    // ------------------------------------------------------------------
    const logs = [
      // Firm A — diverse actions
      { id: 'bd000001-0001-4001-8001-bd0000010001', law_firm_id: FIRM_A_ID, user_id: A.admin, action: 'login', entity_type: 'user', entity_id: A.admin, description: 'Robson Dávila Reis fez login no sistema.', created_at: daysAgo(14) },
      { id: 'bd000001-0002-4001-8001-bd0000010002', law_firm_id: FIRM_A_ID, user_id: A.admin, action: 'created', entity_type: 'matter', entity_id: 'a0000001-0001-4001-8001-a00000010001', description: 'Processo DR-2025-001 criado: Ação de Cobrança - Horizonte.', created_at: daysAgo(13) },
      { id: 'bd000001-0003-4001-8001-bd0000010003', law_firm_id: FIRM_A_ID, user_id: A.lawyer, action: 'created', entity_type: 'document', entity_id: 'a3000001-0001-4001-8001-a30000010001', description: 'Documento "Petição Inicial - Cobrança Horizonte" enviado.', created_at: daysAgo(12) },
      { id: 'bd000001-0004-4001-8001-bd0000010004', law_firm_id: FIRM_A_ID, user_id: A.staff, action: 'completed', entity_type: 'task', entity_id: 'a1000001-0002-4001-8001-a10000010002', description: 'Tarefa "Protocolar petição no tribunal" concluída.', created_at: daysAgo(6) },
      { id: 'bd000001-0005-4001-8001-bd0000010005', law_firm_id: FIRM_A_ID, user_id: A.admin, action: 'sent', entity_type: 'invoice', entity_id: 'a7000001-0001-4001-8001-a70000010001', description: 'Fatura DR-FAT-2025-001 enviada para Construtora Horizonte.', created_at: daysAgo(10) },
      { id: 'bd000001-0006-4001-8001-bd0000010006', law_firm_id: FIRM_A_ID, user_id: A.admin, action: 'paid', entity_type: 'invoice', entity_id: 'a7000001-0001-4001-8001-a70000010001', description: 'Fatura DR-FAT-2025-001 paga via PIX (R$ 2.625,00).', created_at: daysAgo(8) },
      { id: 'bd000001-0007-4001-8001-bd0000010007', law_firm_id: FIRM_A_ID, user_id: A.lawyer, action: 'updated', entity_type: 'matter', entity_id: 'a0000001-0003-4001-8001-a00000010003', description: 'Processo DR-2025-003 atualizado: prioridade alterada para urgente.', old_values: JSON.stringify({ priority: 'high' }), new_values: JSON.stringify({ priority: 'urgent' }), created_at: daysAgo(7) },
      { id: 'bd000001-0008-4001-8001-bd0000010008', law_firm_id: FIRM_A_ID, user_id: A.admin, action: 'created', entity_type: 'contact', entity_id: 'cf000001-0005-4001-8001-cf0000010005', description: 'Contato "Fernanda Lima" cadastrado como prospect.', created_at: daysAgo(5) },
      { id: 'bd000001-0009-4001-8001-bd0000010009', law_firm_id: FIRM_A_ID, user_id: A.lawyer, action: 'login', entity_type: 'user', entity_id: A.lawyer, description: 'Maria Silva fez login no sistema.', created_at: daysAgo(4) },
      { id: 'bd000001-0010-4001-8001-bd0000010010', law_firm_id: FIRM_A_ID, user_id: A.staff, action: 'created', entity_type: 'document', entity_id: 'a3000001-0005-4001-8001-a30000010005', description: 'Documento "CNIS - Fernanda Lima" enviado.', created_at: daysAgo(3) },
      { id: 'bd000001-0011-4001-8001-bd0000010011', law_firm_id: FIRM_A_ID, user_id: A.admin, action: 'sent', entity_type: 'invoice', entity_id: 'a7000001-0004-4001-8001-a70000010004', description: 'Fatura DR-FAT-2025-004 enviada para Ricardo Almeida.', created_at: daysAgo(3) },
      { id: 'bd000001-0012-4001-8001-bd0000010012', law_firm_id: FIRM_A_ID, user_id: A.admin, action: 'partial_payment', entity_type: 'invoice', entity_id: 'a7000001-0004-4001-8001-a70000010004', description: 'Pagamento parcial de R$ 5.000,00 recebido na fatura DR-FAT-2025-004.', created_at: daysAgo(2) },
      { id: 'bd000001-0013-4001-8001-bd0000010013', law_firm_id: FIRM_A_ID, user_id: A.lawyer, action: 'updated', entity_type: 'matter', entity_id: 'a0000001-0005-4001-8001-a00000010005', description: 'Processo DR-2024-005 encerrado: caso resolvido com acordo.', old_values: JSON.stringify({ status: 'active' }), new_values: JSON.stringify({ status: 'closed' }), created_at: daysAgo(1) },
      { id: 'bd000001-0014-4001-8001-bd0000010014', law_firm_id: FIRM_A_ID, user_id: A.admin, action: 'approved', entity_type: 'bill', entity_id: 'b3000001-0002-4001-8001-b30000010002', description: 'Conta de contabilidade aprovada para pagamento (R$ 2.500,00).', created_at: daysAgo(1) },
      { id: 'bd000001-0015-4001-8001-bd0000010015', law_firm_id: FIRM_A_ID, user_id: A.staff, action: 'login', entity_type: 'user', entity_id: A.staff, description: 'Ana Costa fez login no sistema.', created_at: daysAgo(0) },

      // Firm B — 10 logs
      { id: 'bd000002-0001-4001-8001-bd0000020001', law_firm_id: FIRM_B_ID, user_id: B.admin, action: 'login', entity_type: 'user', entity_id: B.admin, description: 'Mariana Silva fez login no sistema.', created_at: daysAgo(10) },
      { id: 'bd000002-0002-4001-8001-bd0000020002', law_firm_id: FIRM_B_ID, user_id: B.admin, action: 'created', entity_type: 'matter', entity_id: 'b0000001-0003-4001-8001-b00000010003', description: 'Processo SS-2026-003 criado: Defesa Fiscal - Imobiliária Carioca.', created_at: daysAgo(9) },
      { id: 'bd000002-0003-4001-8001-bd0000020003', law_firm_id: FIRM_B_ID, user_id: B.lawyer, action: 'created', entity_type: 'document', entity_id: 'a3000002-0004-4001-8001-a30000020004', description: 'Documento "Auto de Infração - Receita Federal" enviado.', created_at: daysAgo(8) },
      { id: 'bd000002-0004-4001-8001-bd0000020004', law_firm_id: FIRM_B_ID, user_id: B.staff, action: 'completed', entity_type: 'task', entity_id: 'b8b8b8b8-0001-0001-0001-b8b8b8b8b8b8', description: 'Tarefa "Levantar matrícula do imóvel" concluída.', created_at: daysAgo(4) },
      { id: 'bd000002-0005-4001-8001-bd0000020005', law_firm_id: FIRM_B_ID, user_id: B.admin, action: 'sent', entity_type: 'invoice', entity_id: 'babababa-0001-0001-0001-babababababa', description: 'Fatura SS-FAT-2026-001 enviada para Carlos Mendes.', created_at: daysAgo(7) },
      { id: 'bd000002-0006-4001-8001-bd0000020006', law_firm_id: FIRM_B_ID, user_id: B.admin, action: 'paid', entity_type: 'invoice', entity_id: 'a7000002-0002-4001-8001-a70000020002', description: 'Fatura SS-FAT-2026-002 paga via PIX (R$ 17.500,00).', created_at: daysAgo(3) },
      { id: 'bd000002-0007-4001-8001-bd0000020007', law_firm_id: FIRM_B_ID, user_id: B.lawyer, action: 'login', entity_type: 'user', entity_id: B.lawyer, description: 'Rafael Santos fez login no sistema.', created_at: daysAgo(2) },
      { id: 'bd000002-0008-4001-8001-bd0000020008', law_firm_id: FIRM_B_ID, user_id: B.lawyer, action: 'updated', entity_type: 'matter', entity_id: 'b0000001-0004-4001-8001-b00000010004', description: 'Processo SS-2025-004 encerrado: contrato finalizado.', old_values: JSON.stringify({ status: 'active' }), new_values: JSON.stringify({ status: 'closed' }), created_at: daysAgo(2) },
      { id: 'bd000002-0009-4001-8001-bd0000020009', law_firm_id: FIRM_B_ID, user_id: B.staff, action: 'created', entity_type: 'document', entity_id: 'a3000002-0002-4001-8001-a30000020002', description: 'Documento "Comprovante de Posse" enviado.', created_at: daysAgo(1) },
      { id: 'bd000002-0010-4001-8001-bd0000020010', law_firm_id: FIRM_B_ID, user_id: B.admin, action: 'login', entity_type: 'user', entity_id: B.admin, description: 'Mariana Silva fez login no sistema.', created_at: daysAgo(0) },
    ];

    const r = await replaceRows(supabase, 'activity_logs', 'law_firm_id', [FIRM_A_ID, FIRM_B_ID], logs);
    if (r.error) throw new Error(`activity_logs: ${r.error.message}`);
    total += r.count;
    log(`activity_logs: ${r.count} rows`);

    return { module: mod, success: true, count: total };
  } catch (err) {
    return { module: mod, success: false, count: total, error: err.message };
  }
}
