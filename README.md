# Prima Facie - Sistema de Gestao para Escritorios de Advocacia

**STATUS: 98% PRODUCAO READY**

Prima Facie e uma plataforma Legal-as-a-Service (LaaS) moderna e completa para gestao de escritorios de advocacia brasileiros. Combina gestao tradicional com servicos de consultoria baseados em assinatura, criando um modelo hibrido de receita que inclui assinaturas recorrentes, cobranca por casos e taxas de sucesso baseadas em performance.

- Sistema totalmente integrado com banco de dados em producao
- Todos os servicos mock substituidos por integracao real com Supabase
- Interface frontend conectada com queries de banco de dados em tempo real
- Integracao DataJud CNJ com dados reais de processos brasileiros
- Sistema de mensagens e chat em tempo real totalmente funcional
- Landing page institucional D'Avila Reis Advocacia
- Build de producao funcional e pronto para deployment

## Inicio Rapido

```bash
# Clone o repositorio
git clone https://github.com/talktorobson/prima-facie.git
cd prima-facie

# Execute o script de setup
./setup.sh
# Edite .env.local com suas credenciais do Supabase

# Execute o servidor de desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## Stack Tecnologico

- **Frontend**: Next.js 14, React 18, TypeScript
- **Estilizacao**: Tailwind CSS, Radix UI, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Deploy**: Vercel
- **Gerenciamento de Estado**: Zustand
- **Requisicoes**: TanStack Query
- **Pagamentos**: Stripe (PIX, Cartoes, Boleto)
- **Email**: Nodemailer (SMTP)
- **Formularios**: React Hook Form + Zod
- **Documentos**: jsPDF, XLSX (geracao PDF/Excel)
- **Comunicacao**: WhatsApp Business API, Sistema de mensagens em tempo real
- **Integracao Juridica**: DataJud CNJ (Conselho Nacional de Justica)
- **Seguranca**: Row Level Security (RLS), Multi-tenant, Autenticacao Supabase

## Estrutura do Projeto

```
prima-facie/
├── app/                       # App directory (Next.js 14)
│   ├── (auth)/               # Paginas de autenticacao
│   ├── (dashboard)/          # Dashboard principal
│   │   ├── billing/          # Sistema de faturamento
│   │   │   ├── invoices/     # Sistema dual de faturas
│   │   │   ├── time-tracking/# Controle de tempo
│   │   │   └── financial-dashboard/ # Dashboard financeiro
│   │   ├── matters/          # Gestao de casos
│   │   └── clients/          # Gestao de clientes
│   ├── portal/               # Portais cliente/staff
│   └── page.tsx              # Landing page institucional
├── components/
│   ├── ui/                   # Componentes de UI reutilizaveis
│   ├── layout/               # Sidebar, mobile menu
│   ├── landing/              # Landing page (hero, services, team, contact, footer)
│   └── features/             # Componentes de features
│       ├── billing/          # Componentes de faturamento
│       ├── financial/        # Componentes financeiros
│       └── exports/          # Componentes de exportacao
├── lib/                       # Utilitarios e configuracoes
│   ├── supabase/             # Cliente Supabase (browser + server)
│   ├── billing/              # Servicos de faturamento
│   ├── financial/            # Servicos financeiros
│   ├── exports/              # Utilitarios de exportacao
│   ├── utils/                # Funcoes utilitarias
│   └── hooks/                # Custom hooks
├── database/                  # Migrations, seeds e documentacao
├── docs/                      # Documentacao tecnica
├── tests/                     # Testes automatizados
├── public/                    # Assets estaticos
├── styles/                    # Estilos globais
└── types/                     # TypeScript types
```

## Landing Page

A rota raiz (`/`) exibe a landing page institucional do escritorio D'Avila Reis Advocacia, construida com 6 componentes dedicados:

| Componente | Descricao |
|------------|-----------|
| `hero.tsx` | Banner principal com CTA |
| `services.tsx` | Areas de atuacao do escritorio |
| `risk-section.tsx` | Secao de gestao de riscos |
| `team.tsx` | Equipe de advogados |
| `contact.tsx` | Formulario de contato |
| `footer.tsx` | Rodape com informacoes legais |

## Scripts Disponiveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria a build de producao
- `npm start` - Inicia o servidor de producao
- `npm run lint` - Executa o linter
- `npm test` - Executa os testes
- `npm run format` - Formata o codigo
- `npm run typecheck` - Verificacao de tipos sem compilar

## Configuracao do Supabase

1. Crie uma conta no [Supabase](https://supabase.com)
2. Crie um novo projeto
3. Copie as credenciais do projeto
4. Adicione as credenciais ao arquivo `.env.local`

## Principais Funcionalidades

### Gestao de Escritorio
- **Gestao de Casos**: Sistema completo para acompanhamento de processos e demandas juridicas
- **Gestao de Clientes**: CRM especializado com suporte a CPF/CNPJ e validacao brasileira
- **Controle de Tempo**: Time tracking com timer em tempo real e calculo automatico de faturamento
- **Chat em Tempo Real**: Comunicacao interna com integracao WhatsApp Business
- **Integracao DataJud CNJ**: Sincronizacao automatica com base de dados do Conselho Nacional de Justica

### Sistema DataJud CNJ (100% Completo)
- Enriquecimento de casos com dados oficiais de processos brasileiros
- Timeline de movimentacoes processuais em tempo real
- Suporte a multiplas instancias (TRT, TJSP, TRF e demais tribunais)
- Matching inteligente de partes e clientes cadastrados
- Confidence scoring e logs de sincronizacao

### Sistema Hibrido de Faturamento (100% Completo)
- Faturas de assinatura recorrente e faturas por caso
- Multiplas modalidades: por hora, valor fixo, percentual, hibrido
- Planos de pagamento com parcelamento automatico
- Dashboard unificado com analytics de receita
- Integracao Stripe com suporte brasileiro (PIX, cartoes)

### Gestao Financeira
- Contas a pagar e receber com workflow de aprovacao
- Exportacao profissional em Excel e PDF
- Analytics financeiros em tempo real com KPIs

### Conformidade Brasileira
- Validacao CPF/CNPJ com formatacao automatica
- PIX integration e formatacao BRL
- Interface 100% em portugues

## Banco de Dados

### Schema Completo (50+ Tabelas)
- **Nucleo Legal**: Casos, clientes, contratos, documentos
- **Faturamento**: Assinaturas, faturas, planos de pagamento
- **DataJud**: Enriquecimento de casos, timeline, participantes
- **Financeiro**: Contas a pagar/receber, fornecedores, despesas
- **Comunicacao**: Mensagens, notificacoes, chat em tempo real
- **Controle de Tempo**: Apontamentos, aprovacoes, calculos de faturamento
- **Seguranca**: Row Level Security com isolamento multi-tenant

### Dados de Producao
- 2 Escritorios: Davila Reis Advocacia & Silva & Associados
- 8 Clientes com CPF e CNPJ validados
- 8 Casos juridicos: trabalhista, familia, criminal, civel, tributario
- 5 Casos DataJud enriquecidos com dados CNJ reais
- 18 Apontamentos com calculo automatico
- Sistema financeiro AP/AR completo com fornecedores e faturas

## Documentacao

| Documento | Descricao |
|-----------|-----------|
| [DataJud CNJ Integration](docs/datajud-integration.md) | Guia de integracao com API DataJud do CNJ |
| [Sistema Dual de Faturas](docs/dual-invoice-system.md) | Documentacao do sistema hibrido de faturamento |
| [Bug Inventory](docs/bug-inventory.md) | Inventario de bugs conhecidos e status |
| [Database](database/README.md) | Schema, migrations e seed data |
| [Schema Overview](database/docs/schema_overview.md) | Visao geral do schema do banco |
| [DataJud Seed Data](database/seed-data/README-DATAJUD-SEED-DATA.md) | Dados de teste DataJud CNJ |
| [Deployment Guide](DEPLOYMENT_GUIDE.md) | Guia completo de deploy |
| [2026 Master Plan](2026-master-plan.md) | Plano de implementacao por sprints |

## Contribuindo

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudancas (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licenca

Este projeto esta sob a licenca ISC. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## Autor

**Robson Benevenuto D'Avila Reis**

---

Feito para escritorios de advocacia brasileiros
