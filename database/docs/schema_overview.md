# Prima Facie - Database Schema Overview

## Arquitetura Multi-Tenant

O Prima Facie utiliza uma arquitetura **multi-tenant compartilhada** onde todas as law firms compartilham as mesmas tabelas, mas os dados são isolados através de Row Level Security (RLS) do PostgreSQL.

### Vantagens desta Abordagem:
- **Economia de recursos**: Uma única instância do banco para todos os clientes
- **Facilidade de manutenção**: Updates de schema aplicados uma vez
- **Backup centralizado**: Estratégia única de backup
- **Escalabilidade**: Adição de novos clientes sem provisioning adicional

### Isolamento de Dados:
- **RLS (Row Level Security)**: Garante que cada law firm veja apenas seus dados
- **Índices otimizados**: Todas as consultas incluem `law_firm_id`
- **Funções de segurança**: Helpers para verificar permissões do usuário atual

---

## Entidades Principais

### 1. **LAW_FIRMS** - Escritórios de Advocacia
**Propósito**: Entidade base para multi-tenancy

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único do escritório |
| `name` | VARCHAR(255) | Nome fantasia do escritório |
| `legal_name` | VARCHAR(255) | Razão social |
| `cnpj` | VARCHAR(18) | CNPJ único |
| `oab_number` | VARCHAR(50) | Número da OAB |
| `primary_color` | VARCHAR(7) | Cor primária para personalização |
| `plan_type` | VARCHAR(50) | Plano de assinatura |

**Relacionamentos**: 
- 1:N com todas as outras entidades do sistema

---

### 2. **USERS** - Usuários do Sistema
**Propósito**: Staff dos escritórios e clientes

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `law_firm_id` | UUID | FK para law_firms |
| `auth_user_id` | UUID | Link para auth.users (Supabase) |
| `user_type` | ENUM | admin, lawyer, staff, client |
| `email` | VARCHAR(255) | Email único por escritório |
| `first_name` | VARCHAR(100) | Nome |
| `last_name` | VARCHAR(100) | Sobrenome |
| `oab_number` | VARCHAR(50) | OAB (para advogados) |

**Relacionamentos**:
- N:1 com law_firms
- 1:1 com auth.users (Supabase)
- 1:N com matters (responsável)
- 1:N com time_entries

---

### 3. **CONTACTS** - Clientes e Prospects
**Propósito**: Informações de contato de clientes

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `contact_type` | ENUM | individual, company |
| `client_status` | ENUM | prospect, active, inactive, former |
| `cpf` | VARCHAR(14) | CPF (pessoa física) |
| `cnpj` | VARCHAR(18) | CNPJ (pessoa jurídica) |
| `preferred_communication` | ENUM | email, phone, whatsapp, mail |

**Relacionamentos**:
- N:1 com law_firms
- 1:1 com users (opcional, quando cliente vira usuário)
- N:N com matters (através de matter_contacts)

---

### 4. **MATTERS** - Casos/Processos Jurídicos
**Propósito**: Cases jurídicos e processos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `matter_number` | VARCHAR(50) | Número único do caso |
| `status` | ENUM | active, closed, on_hold, settled, dismissed |
| `billing_method` | ENUM | hourly, flat_fee, contingency, pro_bono |
| `process_number` | VARCHAR(50) | Número do processo no tribunal |
| `responsible_lawyer_id` | UUID | Advogado responsável |

**Relacionamentos**:
- N:1 com law_firms
- N:1 com matter_types
- N:1 com users (responsible_lawyer)
- N:N com contacts (através de matter_contacts)
- 1:N com tasks, time_entries, documents

---

### 5. **TIME_ENTRIES** - Lançamentos de Tempo
**Propósito**: Controle de horas para faturamento

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `hours_worked` | DECIMAL(5,2) | Horas trabalhadas |
| `hourly_rate` | DECIMAL(10,2) | Valor por hora |
| `total_amount` | DECIMAL(10,2) | Valor total (calculado) |
| `is_billable` | BOOLEAN | Se é faturável |
| `is_billed` | BOOLEAN | Se já foi faturado |

**Relacionamentos**:
- N:1 com matters, users, law_firms
- 1:1 com invoice_line_items (quando faturado)

---

### 6. **INVOICES** - Faturas
**Propósito**: Faturamento de clientes

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `invoice_number` | VARCHAR(50) | Número único da fatura |
| `status` | ENUM | draft, sent, viewed, paid, overdue, cancelled |
| `total_amount` | DECIMAL(10,2) | Valor total |
| `outstanding_amount` | DECIMAL(10,2) | Valor em aberto (calculado) |

**Relacionamentos**:
- N:1 com law_firms, contacts
- 1:N com invoice_line_items

---

### 7. **MESSAGES** - Sistema de Chat
**Propósito**: Comunicação entre staff e clientes

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `message_type` | ENUM | text, file, system, whatsapp |
| `external_platform` | VARCHAR(20) | whatsapp, email, etc. |
| `status` | ENUM | sent, delivered, read, failed |

**Relacionamentos**:
- N:1 com law_firms
- N:1 com matters, contacts (opcional)
- N:1 com users (sender/receiver)

---

### 8. **PIPELINE_STAGES** e **PIPELINE_CARDS**
**Propósito**: Kanban para captação de clientes

**Pipeline Stages**:
- Estágios customizáveis por escritório
- Tipos: intake, onboarding, not_hired

**Pipeline Cards**:
- Prospects em diferentes estágios
- Estimativa de valor e probabilidade
- Tracking de follow-ups

---

## Recursos Avançados

### 🔒 **Segurança (RLS)**
```sql
-- Exemplo de política RLS
CREATE POLICY "law_firm_isolation" ON matters
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id()
  );
```

### 📊 **Campos Calculados**
```sql
-- Exemplo de campo gerado automaticamente
outstanding_amount DECIMAL(10,2) GENERATED ALWAYS AS 
  (total_amount - paid_amount) STORED
```

### 🕒 **Auditoria Automática**
- Trigger `update_updated_at_column()` em todas as tabelas
- Tabela `activity_logs` para auditoria completa
- Tracking automático de mudanças

### 📈 **Índices Otimizados**
```sql
-- Índices compostos para multi-tenancy
CREATE INDEX idx_matters_law_firm_status 
  ON matters(law_firm_id, status);

CREATE INDEX idx_time_entries_matter_billable 
  ON time_entries(matter_id, is_billable, is_billed);
```

---

## Integrações Externas

### **Supabase Auth**
- Tabela `auth.users` gerenciada pelo Supabase
- Link através de `users.auth_user_id`
- Políticas RLS baseadas em `auth.uid()`

### **Google Drive**
- Metadados em `documents.storage_path`
- ID externo em `documents.external_id`
- Estrutura: `law_firm_id/matter_id/document_id/`

### **WhatsApp Business API**
- IDs externos em `messages.external_message_id`
- Status de entrega sincronizado

---

## Considerações de Performance

### **Particionamento (Futuro)**
```sql
-- Particionamento por law_firm_id para grandes volumes
CREATE TABLE time_entries_partitioned (
  LIKE time_entries INCLUDING ALL
) PARTITION BY HASH (law_firm_id);
```

### **Materialized Views**
```sql
-- Views materializadas para relatórios
CREATE MATERIALIZED VIEW matter_billing_summary AS
SELECT 
  matter_id,
  SUM(hours_worked) as total_hours,
  SUM(total_amount) as total_billed
FROM time_entries 
WHERE is_billable = true
GROUP BY matter_id;
```

### **Índices Especializados**
- GIN indexes para campos JSONB (tags, custom_fields)
- Índices parciais para status ativos
- Índices compostos para consultas complexas

---

## Migração e Versionamento

### **Estratégia de Migrations**
1. `001_initial_schema.sql` - Schema base
2. `002_row_level_security.sql` - Políticas RLS
3. `003_additional_features.sql` - Features futuras

### **Seeds de Desenvolvimento**
- `001_sample_data.sql` - Dados realistas para teste
- Dois escritórios com dados completos
- Cenários de uso diversos

### **Backup Strategy**
```sql
-- Backup por law firm
pg_dump --table=law_firms --table=users --table=matters 
  --where="law_firm_id='123e4567-e89b-12d3-a456-426614174000'"
```

---

## Próximos Passos

### **Fase 3 - Features Avançadas**
- [ ] Templates de documentos
- [ ] Workflow automation
- [ ] Integração calendário
- [ ] Relatórios avançados

### **Otimizações**
- [ ] Query performance tuning
- [ ] Connection pooling
- [ ] Read replicas para relatórios
- [ ] Caching strategy

### **Compliance**
- [ ] LGPD compliance tools
- [ ] Audit trail completo
- [ ] Data retention policies
- [ ] Encryption at rest