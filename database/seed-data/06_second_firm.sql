-- =====================================================
-- SEED DATA: Second Law Firm for Multi-Tenant Testing
-- Silva & Santos Advogados Associados
-- =====================================================
-- Purpose: Enables cross-tenant isolation testing.
-- Firm B data should NEVER appear when logged in as Firm A.

-- 1. Create second law firm
INSERT INTO law_firms (id, name, legal_name, cnpj, oab_number, email, phone,
  address_street, address_number, address_city, address_state, address_zipcode,
  plan_type, subscription_active)
VALUES (
  'b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0',
  'Silva & Santos Advogados',
  'Silva & Santos Advogados Associados S/S',
  '98.765.432/0001-10',
  'OAB/RJ 54321',
  'contato@silvasantos.adv.br',
  '(21) 3456-7890',
  'Rua do Ouvidor',
  '150',
  'Rio de Janeiro',
  'RJ',
  '20040-030',
  'professional',
  true
);

-- 2. Create users for Firm B
-- Admin
INSERT INTO users (id, law_firm_id, email, first_name, last_name, user_type, status)
VALUES (
  'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1',
  'b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0',
  'admin@silvasantos.adv.br',
  'Mariana',
  'Silva',
  'admin',
  'active'
);

-- Lawyer
INSERT INTO users (id, law_firm_id, email, first_name, last_name, user_type, oab_number, status)
VALUES (
  'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2',
  'b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0',
  'rafael@silvasantos.adv.br',
  'Rafael',
  'Santos',
  'lawyer',
  'OAB/RJ 98765',
  'active'
);

-- Staff
INSERT INTO users (id, law_firm_id, email, first_name, last_name, user_type, status)
VALUES (
  'b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3',
  'b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0',
  'assistente@silvasantos.adv.br',
  'Fernanda',
  'Oliveira',
  'staff',
  'active'
);

-- 3. Create matter types for Firm B
INSERT INTO matter_types (id, law_firm_id, name, description, default_hourly_rate, is_active)
VALUES
  ('b4b4b4b4-0001-0001-0001-b4b4b4b4b4b4', 'b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0',
   'Direito Imobiliário', 'Questões imobiliárias e registros', 400.00, true),
  ('b4b4b4b4-0002-0002-0002-b4b4b4b4b4b4', 'b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0',
   'Direito Societário', 'Constituição e reorganização de empresas', 500.00, true);

-- 4. Create contacts (clients) for Firm B
INSERT INTO contacts (id, law_firm_id, contact_type, first_name, last_name, full_name, cpf, email, phone, client_status)
VALUES
  ('b5b5b5b5-0001-0001-0001-b5b5b5b5b5b5', 'b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0',
   'individual', 'Carlos', 'Mendes', 'Carlos Mendes', '987.654.321-00',
   'carlos.mendes@email.com', '(21) 91234-5678', 'active'),
  ('b5b5b5b5-0002-0002-0002-b5b5b5b5b5b5', 'b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0',
   'company', NULL, NULL, NULL, NULL,
   'contato@techsolutions.com.br', '(21) 3333-4444', 'active');

UPDATE contacts SET company_name = 'Tech Solutions Ltda', cnpj = '11.222.333/0001-44'
WHERE id = 'b5b5b5b5-0002-0002-0002-b5b5b5b5b5b5';

-- 5. Create matters for Firm B
INSERT INTO matters (id, law_firm_id, matter_type_id, matter_number, title, description,
  status, priority, billing_method, hourly_rate, responsible_lawyer_id)
VALUES
  ('b6b6b6b6-0001-0001-0001-b6b6b6b6b6b6', 'b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0',
   'b4b4b4b4-0001-0001-0001-b4b4b4b4b4b4', 'SS-2026-001',
   'Usucapião Extraordinário - Mendes',
   'Ação de usucapião extraordinário de imóvel residencial',
   'active', 'high', 'hourly', 400.00, 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2'),
  ('b6b6b6b6-0002-0002-0002-b6b6b6b6b6b6', 'b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0',
   'b4b4b4b4-0002-0002-0002-b4b4b4b4b4b4', 'SS-2026-002',
   'Incorporação Societária - Tech Solutions',
   'Assessoria na incorporação societária da empresa',
   'active', 'medium', 'flat_fee', NULL, 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2');

-- 6. Create matter-contact relationships
INSERT INTO matter_contacts (id, matter_id, contact_id, law_firm_id, relationship_type, is_primary)
VALUES
  ('b7b7b7b7-0001-0001-0001-b7b7b7b7b7b7',
   'b6b6b6b6-0001-0001-0001-b6b6b6b6b6b6',
   'b5b5b5b5-0001-0001-0001-b5b5b5b5b5b5',
   'b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0',
   'client', true),
  ('b7b7b7b7-0002-0002-0002-b7b7b7b7b7b7',
   'b6b6b6b6-0002-0002-0002-b6b6b6b6b6b6',
   'b5b5b5b5-0002-0002-0002-b5b5b5b5b5b5',
   'b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0',
   'client', true);

-- 7. Create tasks for Firm B
INSERT INTO tasks (id, law_firm_id, matter_id, title, description, task_type, priority, status, due_date, assigned_to)
VALUES
  ('b8b8b8b8-0001-0001-0001-b8b8b8b8b8b8', 'b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0',
   'b6b6b6b6-0001-0001-0001-b6b6b6b6b6b6',
   'Levantar matrícula do imóvel',
   'Solicitar certidão de matrícula atualizada no RGI',
   'general', 'high', 'pending',
   '2026-03-15T00:00:00Z', 'b3b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b3b3'),
  ('b8b8b8b8-0002-0002-0002-b8b8b8b8b8b8', 'b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0',
   'b6b6b6b6-0002-0002-0002-b6b6b6b6b6b6',
   'Preparar contrato social',
   'Redigir minuta do novo contrato social pós-incorporação',
   'document_review', 'medium', 'in_progress',
   '2026-03-20T00:00:00Z', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2');

-- 8. Create time entries for Firm B
INSERT INTO time_entries (id, law_firm_id, matter_id, user_id, description, hours_worked, work_date, hourly_rate, is_billable)
VALUES
  ('b9b9b9b9-0001-0001-0001-b9b9b9b9b9b9', 'b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0',
   'b6b6b6b6-0001-0001-0001-b6b6b6b6b6b6', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2',
   'Pesquisa jurisprudencial sobre usucapião extraordinário', 3.5, '2026-02-03', 400.00, true),
  ('b9b9b9b9-0002-0002-0002-b9b9b9b9b9b9', 'b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0',
   'b6b6b6b6-0002-0002-0002-b6b6b6b6b6b6', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2',
   'Reunião com sócios sobre incorporação', 2.0, '2026-02-04', 500.00, true);

-- 9. Create invoices for Firm B
INSERT INTO invoices (id, law_firm_id, contact_id, matter_id, invoice_number, title,
  issue_date, due_date, subtotal, total_amount, status)
VALUES
  ('babababa-0001-0001-0001-babababababa', 'b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0',
   'b5b5b5b5-0001-0001-0001-b5b5b5b5b5b5',
   'b6b6b6b6-0001-0001-0001-b6b6b6b6b6b6',
   'SS-FAT-2026-001', 'Honorários - Usucapião Mendes',
   '2026-02-01', '2026-03-01', 1400.00, 1400.00, 'sent');

-- 10. Create documents for Firm B
INSERT INTO documents (id, law_firm_id, matter_id, name, description, document_type, category, access_level)
VALUES
  ('bcbcbcbc-0001-0001-0001-bcbcbcbcbcbc', 'b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0',
   'b6b6b6b6-0001-0001-0001-b6b6b6b6b6b6',
   'Certidão de Matrícula Atualizada',
   'Matrícula do imóvel objeto da ação de usucapião',
   'evidence', 'documentos_imovel', 'internal');

-- 11. Create pipeline stages for Firm B
INSERT INTO pipeline_stages (id, law_firm_id, name, description, color, stage_type, sort_order, is_active)
VALUES
  ('bdbdbdbd-0001-0001-0001-bdbdbdbdbdbd', 'b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0',
   'Consulta Inicial', 'Primeira consulta com o potencial cliente', '#3B82F6', 'intake', 1, true),
  ('bdbdbdbd-0002-0002-0002-bdbdbdbdbdbd', 'b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0',
   'Proposta Enviada', 'Proposta de honorários enviada', '#F59E0B', 'intake', 2, true),
  ('bdbdbdbd-0003-0003-0003-bdbdbdbdbdbd', 'b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0',
   'Contratado', 'Cliente contratou o escritório', '#10B981', 'intake', 3, true);

-- 12. Create activity logs for Firm B
INSERT INTO activity_logs (id, law_firm_id, action, entity_type, entity_id, user_id, description)
VALUES
  ('bebebebe-0001-0001-0001-bebebebebebe', 'b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0',
   'created', 'matter', 'b6b6b6b6-0001-0001-0001-b6b6b6b6b6b6',
   'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2',
   'Processo SS-2026-001 criado: Usucapião Extraordinário - Mendes');
