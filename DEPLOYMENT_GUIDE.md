# Prima Facie - Guia de Deploy em Produção
**Legal-as-a-Service Platform - Pronta para Produção**

---

## 🚀 **Status de Produção**

✅ **PRONTO PARA DEPLOY**: Todas as integrações completas  
📅 **Data de Conclusão**: 16 de Junho de 2025  
🎯 **Fase**: 8 - 100% Completa

---

## 📋 **Pré-requisitos para Deploy**

### **1. Contas de Serviços Externos**
- ✅ **Supabase**: Conta e projeto configurado
- ✅ **Stripe**: Conta com chaves de produção (PIX habilitado)
- ✅ **Email Provider**: SMTP configurado (Gmail, SendGrid, etc.)
- ✅ **Vercel**: Conta para deploy (ou outro provedor)

### **2. Configurações Necessárias**
- ✅ **Domain**: Domínio customizado configurado
- ✅ **SSL**: Certificado SSL ativo
- ✅ **DNS**: Configuração de DNS para o domínio

---

## 🔧 **Configuração de Ambiente de Produção**

### **1. Variáveis de Ambiente (.env.production)**

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui

# App Configuration
NEXT_PUBLIC_APP_URL=https://seudominio.com.br
NEXT_PUBLIC_APP_NAME="Seu Escritório de Advocacia"

# Stripe Configuration (PRODUÇÃO)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_sua_chave_publica_stripe
STRIPE_SECRET_KEY=sk_live_sua_chave_secreta_stripe
STRIPE_WEBHOOK_SECRET=whsec_sua_chave_webhook_stripe

# Email Configuration
EMAIL_FROM=noreply@seudominio.com.br
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=seu-email@gmail.com
EMAIL_SMTP_PASS=sua_senha_de_app_especifica

# Storage Configuration
NEXT_PUBLIC_STORAGE_BUCKET=documentos

# Production
NODE_ENV=production
```

### **2. Configuração do Supabase**

#### **A. Execute as Migrações de Database**
```sql
-- 1. Schema principal
\i database/migrations/001_initial_schema.sql

-- 2. Políticas de segurança
\i database/migrations/002_row_level_security.sql

-- 3. Políticas de billing
\i database/migrations/003_billing_rls_policies.sql

-- 4. Dados iniciais
\i database/SEED_DEFAULT_DATA.sql
```

#### **B. Configure Row Level Security**
```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE law_firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- (todas as outras tabelas já estão configuradas)
```

#### **C. Configure Storage Buckets**
```sql
-- Criar bucket para documentos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documentos', 'documentos', false);

-- Política de acesso aos documentos
CREATE POLICY "Acesso aos documentos por law firm" ON storage.objects
FOR ALL USING (bucket_id = 'documentos' AND 
  (storage.foldername(name))[1] = auth.current_user_law_firm_id()::text);
```

### **3. Configuração do Stripe**

#### **A. Webhook Endpoints**
Configure no dashboard do Stripe:
```
URL: https://seudominio.com.br/api/stripe/webhook
Eventos: customer.subscription.*, invoice.*, payment_intent.*
```

#### **B. Produtos e Preços**
```javascript
// Criar produtos de assinatura via API ou dashboard
// Os produtos serão criados automaticamente pelo sistema
// quando você criar planos de assinatura na interface
```

### **4. Configuração de Email**

#### **A. Gmail (Recomendado para teste)**
1. Ativar autenticação de 2 fatores
2. Gerar senha de app específica
3. Usar a senha de app na variável `EMAIL_SMTP_PASS`

#### **B. SendGrid (Recomendado para produção)**
```bash
EMAIL_SMTP_HOST=smtp.sendgrid.net
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=apikey
EMAIL_SMTP_PASS=sua_api_key_sendgrid
```

---

## 🌐 **Deploy na Vercel**

### **1. Preparação do Projeto**
```bash
# Verificar build local
npm run build

# Verificar tipos
npm run typecheck

# Executar testes
npm test
```

### **2. Deploy via CLI**
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy de produção
vercel --prod
```

### **3. Configuração na Vercel**
1. **Environment Variables**: Adicionar todas as variáveis de produção
2. **Custom Domain**: Configurar domínio personalizado
3. **Edge Functions**: Configuradas automaticamente
4. **Analytics**: Habilitar se necessário

---

## 🔒 **Configurações de Segurança**

### **1. Headers de Segurança (next.config.js)**
```javascript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}
```

### **2. Configuração de CORS**
```javascript
// Já configurado no Supabase
// Adicionar domínio de produção nas configurações
```

### **3. Rate Limiting**
```javascript
// Implementado via middleware.ts
// Configurar limites apropriados para produção
```

---

## 📊 **Monitoramento e Logs**

### **1. Configuração de Logs**
```bash
# Vercel automaticamente coleta logs
# Acessar via dashboard da Vercel

# Para logs detalhados, integrar com:
# - Sentry (errors)
# - LogRocket (sessions)
# - Mixpanel (analytics)
```

### **2. Health Checks**
```javascript
// Endpoint de health check já configurado
// GET /api/health
```

### **3. Métricas de Performance**
- **Core Web Vitals**: Monitorado automaticamente
- **Database Performance**: Via Supabase dashboard
- **Stripe Events**: Via Stripe dashboard

---

## 🧪 **Testes de Produção**

### **1. Checklist de Deploy**
- [ ] Build de produção executado com sucesso
- [ ] Todas as variáveis de ambiente configuradas
- [ ] Database migrado e populado
- [ ] Stripe webhooks configurados e testados
- [ ] Email funcionando (envio de teste)
- [ ] SSL ativo e funcionando
- [ ] Domínio customizado configurado

### **2. Testes Funcionais**
- [ ] Registro de usuário funcionando
- [ ] Login e autenticação
- [ ] Criação de casos e clientes
- [ ] Sistema de faturamento
- [ ] Processamento de pagamentos
- [ ] Geração de relatórios
- [ ] Envio de emails

### **3. Testes de Performance**
- [ ] Tempo de carregamento < 3 segundos
- [ ] Responsividade mobile
- [ ] Funcionalidade offline básica

---

## 🚀 **Go-Live Procedure**

### **1. Preparação (1-2 dias antes)**
1. **Backup**: Fazer backup completo do ambiente de desenvolvimento
2. **Documentação**: Preparar documentação para usuários
3. **Suporte**: Configurar canais de suporte
4. **Monitoramento**: Configurar alertas de sistema

### **2. Deploy (Dia do Go-Live)**
1. **Deploy**: Executar deploy em produção
2. **Verificação**: Executar checklist completo
3. **Comunicação**: Notificar usuários sobre disponibilidade
4. **Monitoramento**: Monitorar sistema intensivamente

### **3. Pós Go-Live (Primeira semana)**
1. **Suporte**: Suporte dedicado para usuários
2. **Correções**: Correções urgentes se necessário
3. **Feedback**: Coletar feedback dos usuários
4. **Otimização**: Otimizações baseadas no uso real

---

## 📞 **Suporte e Manutenção**

### **1. Canais de Suporte**
- **Email**: suporte@seudominio.com.br
- **WhatsApp**: Integração já configurada
- **Sistema**: Tickets via plataforma

### **2. Manutenção Programada**
- **Atualizações**: Quinzenais (não-críticas)
- **Patches**: Imediatos (críticos)
- **Backup**: Diário automático

### **3. Escalabilidade**
- **Database**: Supabase escala automaticamente
- **Frontend**: Vercel Edge Network
- **Pagamentos**: Stripe suporta alto volume

---

## 🎯 **Próximos Passos Pós-Deploy**

### **1. Otimizações Futuras**
- Implementar cache Redis
- Configurar CDN para assets
- Otimizar queries de database
- Implementar search engines

### **2. Novas Features**
- App mobile nativo
- Integração com sistemas contábeis
- IA para análise de documentos
- API pública para integrações

### **3. Expansão**
- Suporte a outros países
- Múltiplas moedas
- Integração bancária direta
- Marketplace de serviços jurídicos

---

## ✅ **Status Final**

**Prima Facie está 100% pronta para produção** com todas as funcionalidades implementadas, testadas e documentadas. O sistema oferece uma plataforma completa de Legal-as-a-Service especificamente projetada para o mercado jurídico brasileiro.

**Recursos principais em produção:**
- ✅ Sistema completo de faturamento híbrido
- ✅ Processamento de pagamentos com PIX
- ✅ Gestão financeira completa (AP/AR)
- ✅ Segurança multi-tenant
- ✅ Compliance brasileiro total
- ✅ Interface profissional em português

**Pronto para atender escritórios de advocacia brasileiros imediatamente.**

---

*Guia de Deploy - Prima Facie v8.13.0 - 16 de Junho de 2025*