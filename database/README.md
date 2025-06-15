# Prima Facie - Database

Este diretório contém toda a estrutura e documentação do banco de dados PostgreSQL do Prima Facie.

## 📁 Estrutura de Arquivos

```
database/
├── migrations/           # Scripts SQL de migração
│   ├── 001_initial_schema.sql
│   └── 002_row_level_security.sql
├── seeds/               # Dados de exemplo para desenvolvimento
│   └── 001_sample_data.sql
├── docs/                # Documentação detalhada
│   └── schema_overview.md
└── README.md           # Este arquivo
```

## 🚀 Como Usar

### 1. **Setup Inicial no Supabase**

1. Acesse seu projeto no [Supabase Dashboard](https://app.supabase.com)
2. Vá para **SQL Editor**
3. Execute os scripts na ordem:

```sql
-- 1. Criar schema inicial
\i database/migrations/001_initial_schema.sql

-- 2. Configurar segurança RLS
\i database/migrations/002_row_level_security.sql

-- 3. (Opcional) Adicionar dados de exemplo
\i database/seeds/001_sample_data.sql
```

### 2. **Configuração Local (se usando PostgreSQL local)**

```bash
# Conectar ao banco
psql -U postgres -d prima_facie

# Executar migrations
\i database/migrations/001_initial_schema.sql
\i database/migrations/002_row_level_security.sql

# Inserir dados de teste
\i database/seeds/001_sample_data.sql
```

## 📊 Schema Overview

### **Arquitetura Multi-Tenant**
- **Isolamento por `law_firm_id`** em todas as tabelas
- **Row Level Security (RLS)** para segurança automática
- **Índices otimizados** para consultas multi-tenant

### **Entidades Principais**

| Tabela | Propósito | Relacionamentos |
|--------|-----------|-----------------|
| `law_firms` | Escritórios (base multi-tenant) | 1:N com todas as outras |
| `users` | Staff e clientes | N:1 com law_firms |
| `contacts` | Clientes e prospects | N:1 com law_firms |
| `matters` | Casos jurídicos | N:1 com law_firms, users |
| `time_entries` | Controle de horas | N:1 com matters, users |
| `invoices` | Faturamento | N:1 com contacts |
| `messages` | Sistema de chat | N:1 com matters, contacts |
| `pipeline_cards` | Kanban de captação | N:1 com pipeline_stages |

### **Features Avançadas**
- ✅ **Campos calculados** automaticamente (totais, saldos)
- ✅ **Triggers** para `updated_at` automático
- ✅ **Auditoria completa** via `activity_logs`
- ✅ **Suporte a JSONB** para flexibilidade
- ✅ **Enums** para consistência de dados

## 🔒 Segurança (RLS)

### **Políticas Implementadas**

**Isolamento por Law Firm:**
```sql
-- Exemplo: Usuários só veem dados de seu escritório
CREATE POLICY "law_firm_isolation" ON matters
  FOR ALL USING (law_firm_id = auth.current_user_law_firm_id());
```

**Controle de Acesso por Papel:**
```sql
-- Staff pode gerenciar, clientes só visualizam
CREATE POLICY "matters_staff_access" ON matters
  FOR ALL USING (
    law_firm_id = auth.current_user_law_firm_id() AND
    auth.current_user_is_staff()
  );
```

### **Funções de Segurança**
- `auth.current_user_law_firm_id()` - Retorna law_firm do usuário atual
- `auth.current_user_is_admin()` - Verifica se é admin
- `auth.current_user_is_staff()` - Verifica se é staff (admin/lawyer/staff)

## 📝 Dados de Exemplo

O arquivo `001_sample_data.sql` inclui:

### **Escritórios**
- **Dávila Reis Advocacia** (São Paulo)
- **Silva & Associados** (Rio de Janeiro)

### **Usuários de Teste**
- Robson Dávila Reis (Admin/Sócio)
- Maria Silva (Advogada Sênior)
- Carlos Santos (Advogado Júnior)
- Ana Costa (Secretária)

### **Casos Realistas**
- Indenização por danos morais
- Reclamatória trabalhista
- Revisão de aposentadoria
- Consultoria empresarial

### **Dados Completos**
- ✅ 4 matters ativos
- ✅ 4 clientes/contacts
- ✅ 5 tasks distribuídas
- ✅ 5 time entries para faturamento
- ✅ Pipeline cards em diferentes estágios
- ✅ Documentos com metadados

## 🛠 Manutenção

### **Backup**
```sql
-- Backup completo
pg_dump prima_facie > backup_$(date +%Y%m%d).sql

-- Backup por law firm
pg_dump --where="law_firm_id='uuid-here'" prima_facie > backup_firm.sql
```

### **Monitoramento**
```sql
-- Verificar performance de queries
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY total_time DESC LIMIT 10;

-- Verificar tamanho das tabelas
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### **Limpeza**
```sql
-- Limpar logs antigos (> 1 ano)
DELETE FROM activity_logs 
WHERE created_at < now() - interval '1 year';

-- Verificar órfãos
SELECT * FROM time_entries 
WHERE matter_id NOT IN (SELECT id FROM matters);
```

## 🧪 Testes

### **Validação de RLS**
```sql
-- Testar isolamento entre law firms
SET row_security = off;
SELECT law_firm_id, count(*) FROM matters GROUP BY law_firm_id;
SET row_security = on;
```

### **Testes de Performance**
```sql
-- Testar query complexa
EXPLAIN ANALYZE
SELECT m.title, c.full_name, SUM(te.hours_worked)
FROM matters m
JOIN matter_contacts mc ON m.id = mc.matter_id
JOIN contacts c ON mc.contact_id = c.id
JOIN time_entries te ON m.id = te.matter_id
WHERE m.law_firm_id = 'law-firm-uuid'
GROUP BY m.id, c.id;
```

## 🔄 Migrations Futuras

### **Planejadas para Fase 3**
- Templates de documentos
- Workflow automation
- Integração com calendário
- Relatórios avançados

### **Estrutura de Versionamento**
```
003_document_templates.sql
004_workflow_automation.sql
005_calendar_integration.sql
006_advanced_reporting.sql
```

## 📞 Suporte

Para dúvidas sobre o schema:
1. Consulte `docs/schema_overview.md` para detalhes técnicos
2. Verifique os comentários nos arquivos SQL
3. Analise os dados de exemplo em `seeds/`

## ⚠️ Notas Importantes

1. **Sempre execute migrations em ordem sequencial**
2. **Faça backup antes de aplicar mudanças**
3. **Teste RLS policies em ambiente de desenvolvimento**
4. **Monitore performance após mudanças de schema**
5. **Mantenha dados de seed atualizados com schema**