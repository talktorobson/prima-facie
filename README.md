# Prima Facie - Sistema de Gestão para Escritórios de Advocacia

Prima Facie é uma plataforma Legal-as-a-Service (LaaS) moderna e completa para gestão de escritórios de advocacia brasileiros, combinando gestão tradicional com serviços de consultoria baseados em assinatura, criando um modelo híbrido de receita que inclui assinaturas recorrentes, cobrança por casos e taxas de sucesso baseadas em performance.

## 🚀 Início Rápido

```bash
# Clone o repositório
git clone https://github.com/talktorobson/prima-facie.git
cd prima-facie

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.local.example .env.local
# Edite .env.local com suas credenciais do Supabase

# Execute o servidor de desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 14, React 18, TypeScript
- **Estilização**: Tailwind CSS, Radix UI, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Deploy**: Vercel
- **Gerenciamento de Estado**: Zustand
- **Requisições**: TanStack Query
- **Pagamentos**: Stripe (PIX, Cartões, Boleto)
- **Email**: Nodemailer (SMTP)
- **Formulários**: React Hook Form
- **Documentos**: jsPDF, XLSX (geração PDF/Excel)
- **Comunicação**: WhatsApp Business API
- **Segurança**: Row Level Security (RLS), Multi-tenant

## 📁 Estrutura do Projeto

```
prima-facie/
├── app/                    # App directory (Next.js 14)
│   ├── (auth)/            # Páginas de autenticação
│   ├── (dashboard)/       # Dashboard principal
│   │   ├── billing/       # Sistema de faturamento
│   │   │   ├── invoices/  # Sistema dual de faturas
│   │   │   ├── time-tracking/ # Controle de tempo
│   │   │   └── financial-dashboard/ # Dashboard financeiro
│   │   ├── matters/       # Gestão de casos
│   │   └── clients/       # Gestão de clientes
│   └── portal/            # Portais cliente/staff
├── components/            # Componentes React
│   ├── ui/               # Componentes de UI
│   ├── layout/           # Componentes de layout
│   └── features/         # Componentes de features
│       ├── billing/      # Componentes de faturamento
│       ├── financial/    # Componentes financeiros
│       └── exports/      # Componentes de exportação
├── lib/                   # Utilitários e configurações
│   ├── supabase/         # Cliente Supabase
│   ├── billing/          # Serviços de faturamento
│   ├── financial/        # Serviços financeiros
│   ├── exports/          # Utilitários de exportação
│   ├── utils/            # Funções utilitárias
│   └── hooks/            # Custom hooks
├── database/             # Migrations e schemas
├── tests/                # Testes automatizados
├── public/               # Assets estáticos
├── styles/               # Estilos globais
└── types/                # TypeScript types
```

## 🔧 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria a build de produção
- `npm start` - Inicia o servidor de produção
- `npm run lint` - Executa o linter
- `npm test` - Executa os testes
- `npm run format` - Formata o código

## 🔐 Configuração do Supabase

1. Crie uma conta no [Supabase](https://supabase.com)
2. Crie um novo projeto
3. Copie as credenciais do projeto
4. Adicione as credenciais ao arquivo `.env.local`

## ⚡ Principais Funcionalidades

### 🏢 Gestão de Escritório
- **Gestão de Casos**: Sistema completo para acompanhamento de processos e demandas jurídicas
- **Gestão de Clientes**: CRM especializado com suporte a CPF/CNPJ e validação brasileira
- **Controle de Tempo**: Sistema avançado de time tracking com timer em tempo real e cálculo automático de faturamento
- **Chat em Tempo Real**: Comunicação interna com integração WhatsApp Business

### 💰 Sistema Híbrido de Faturamento (100% Completo) ✅
- **Faturas de Assinatura**: Cobrança recorrente para serviços de consultoria com controle de uso e sobretaxa ✅
- **Faturas de Casos**: Múltiplas modalidades (por hora, valor fixo, percentual, híbrido) com integração ao controle de tempo ✅
- **Planos de Pagamento**: Parcelamento automático com controle de vencimentos e taxas de atraso ✅
- **Dashboard Unificado**: Visão centralizada de todas as faturas com filtros avançados e analytics ✅
- **Sistema de Descontos**: Engine inteligente para cross-selling com automação de descontos ✅
- **Analytics de Receita**: MRR, CLV e análise de profitabilidade por cliente ✅
- **Stripe Integration**: Processamento completo de pagamentos com suporte brasileiro (PIX, cartões) ✅
- **Webhooks Automatizados**: Tratamento em tempo real de eventos de pagamento ✅

### 📊 Gestão Financeira Completa
- **Contas a Pagar**: Sistema completo de gestão de fornecedores, aprovação de despesas e fluxo de pagamentos ✅
- **Contas a Receber**: Controle de cobranças, relatórios de aging e automação de lembretes ✅
- **Exportação Profissional**: Geração de relatórios em Excel e PDF com identidade visual do escritório ✅
- **Analytics Financeiros**: Dashboards em tempo real com KPIs e métricas de performance ✅
- **Cobrança Automatizada**: Sistema inteligente de lembretes e controle de inadimplência ✅

### 🇧🇷 Conformidade Brasileira
- **Validação CPF/CNPJ**: Integração com APIs de validação e formatação automática ✅
- **PIX Integration**: Suporte completo ao sistema de pagamentos instantâneos brasileiro ✅
- **Interface em Português**: UI/UX completamente localizada para o mercado brasileiro ✅
- **Formatação BRL**: Formatação adequada de moeda e documentos fiscais ✅

### 🎉 Integração Completa (100% Pronto para Produção) ✅
- **Stripe Integration**: Processamento completo de pagamentos recorrentes e únicos com suporte ao PIX ✅
- **Webhooks**: Tratamento automático de eventos de pagamento em tempo real ✅
- **Database Produção**: Substituição completa dos dados mock por integração real com Supabase ✅
- **Segurança Multi-tenant**: Políticas de Row Level Security para isolamento completo de dados ✅
- **Notificações por Email**: Sistema automatizado de emails profissionais em português ✅
- **Testes Abrangentes**: 300+ testes cobrindo toda funcionalidade crítica ✅

## 📝 Documentação

- **[Documentação Completa](CLAUDE.md)** - Documentação técnica detalhada do projeto
- **[Sistema Dual de Faturas](DUAL-INVOICE-SYSTEM.md)** - Documentação específica do sistema de faturamento
- **[Roadmap](prima-facie-roadmap.md)** - Plano de desenvolvimento e fases do projeto

## 🤝 Contribuindo

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença ISC. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Autor

**Robson Benevenuto D'Avila Reis**

---

Feito com ❤️ para escritórios de advocacia brasileiros