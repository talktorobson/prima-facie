# CLAUDE.md - Prima Facie Project

Inherits: `personal/CLAUDE.md`

## Project Overview
Prima Facie is a Next.js 14 legal practice management SaaS (Sistema de Gestao para Escritorios de Advocacia) with TypeScript, Tailwind CSS, Supabase (PostgreSQL + Auth + RLS + Storage), and TanStack Query. UI is localized in Portuguese (pt-BR).

## Project Structure
```
prima-facie/
├── app/                        # Next.js 14 App Router (75 pages)
│   ├── (auth)/                # Authentication routes group
│   │   ├── login/             # Login page
│   │   ├── register/         # Registration page
│   │   ├── forgot-password/  # Password recovery
│   │   ├── privacy/          # Privacy policy page
│   │   ├── terms/            # Terms of use page
│   │   └── layout.tsx        # Auth layout wrapper
│   ├── (dashboard)/          # Protected dashboard routes
│   │   ├── admin/            # Admin panel (dashboard + 10 subroutes)
│   │   │   ├── analytics/    # Admin analytics dashboard
│   │   │   ├── billing/      # Admin subscription billing
│   │   │   ├── branding/     # Firm branding settings
│   │   │   ├── chat-topics/  # Chat topic management
│   │   │   ├── discount-rules/ # Discount rule engine
│   │   │   ├── law-firm/     # Law firm settings
│   │   │   ├── notifications/ # Notification preferences
│   │   │   ├── payment-plans/ # Payment plan configuration
│   │   │   ├── security/     # Security audit log
│   │   │   ├── settings/     # Admin system settings
│   │   │   ├── subscription-plans/ # Plan management
│   │   │   └── users/        # User management
│   │   ├── billing/          # Billing module (4 pages)
│   │   │   ├── invoices/     # Invoice management
│   │   │   ├── time-tracking/ # Time entry tracking
│   │   │   └── financial-dashboard/ # AP/AR dashboard
│   │   ├── calendar/         # Calendar scheduling
│   │   ├── clients/          # Client management (list, new, detail, edit)
│   │   ├── dashboard/        # Main dashboard
│   │   ├── documents/        # Document management
│   │   ├── matters/          # Legal matters (list, new, detail, edit, workflow, demo)
│   │   ├── messages/         # Chat/messaging
│   │   ├── pipeline/         # Sales pipeline (list, new, edit)
│   │   ├── platform/         # Super admin multi-firm view
│   │   ├── reports/          # Reports & analytics
│   │   ├── settings/         # User/firm settings
│   │   ├── tasks/            # Task management
│   │   └── layout.tsx        # Dashboard layout with sidebar
│   ├── portal/               # Portal access
│   │   ├── client/           # Client portal (dashboard, matters, messages, billing, profile)
│   │   ├── staff/            # Staff portal (dashboard, matters, tasks, messages, time-entry)
│   │   └── layout.tsx        # Portal layout wrapper
│   ├── about/                # Public about page
│   ├── contact/              # Public contact page
│   ├── pricing/              # Public pricing page
│   ├── layout.tsx            # Root layout (Inter font, Providers)
│   └── page.tsx              # Landing page (D'Avila Reis)
├── components/                # 131 component files
│   ├── ui/                   # 27 reusable UI components + barrel exports
│   ├── layout/               # Sidebar, mobile menu, dashboard header
│   ├── auth/                 # Role guards, user profile
│   ├── matters/              # Create/edit/delete matter dialogs
│   ├── tasks/                # Task dialogs, item, stats components
│   ├── chat/                 # Chat interface, conversation list, modals
│   ├── reports/              # Report tabs and shared utilities (Recharts)
│   ├── pipeline/             # Kanban board + card components
│   ├── notifications/        # Notification panel
│   ├── landing/              # Landing page sections (hero, services, team, etc.)
│   ├── features/
│   │   ├── billing/          # Time tracking, case billing, payment forms
│   │   ├── financial/        # AP/AR, collections, vendor management
│   │   ├── datajud/          # CNJ case enrichment, timeline events
│   │   └── exports/          # Export button component
│   └── providers.tsx         # React Query + Supabase context
├── lib/                       # 70+ service and utility files
│   ├── supabase/             # Client, server, storage, realtime
│   ├── hooks/                # use-auth.ts (main), useAuth.ts (legacy)
│   ├── providers/            # Auth context provider
│   ├── queries/              # 18 React Query hook files
│   ├── schemas/              # 6 Zod validation schema files
│   ├── billing/              # 18 billing service files
│   ├── financial/            # 3 financial service files
│   ├── clients/              # Client service + schemas
│   ├── matters/              # Matter service
│   ├── exports/              # PDF, Excel, export service
│   ├── stripe/               # Stripe config + server
│   ├── notifications/        # Email + chat notification services
│   ├── whatsapp/             # WhatsApp Business API
│   ├── integrations/datajud/ # DataJud CNJ integration (4 files)
│   └── utils/                # cn.ts (classname merger)
├── types/
│   ├── index.ts              # Base types (User, ApiResponse, etc.)
│   └── database.ts           # Full database schema types (14+ entities, 19+ enums)
├── database/
│   ├── migrations/           # Single consolidated init + archive
│   │   ├── 000_init.sql      # All-in-one schema (54 tables, RLS, indexes)
│   │   └── archive/          # 13 original migration files (historical)
│   ├── seed-data/            # Seed SQL scripts (5 steps)
│   └── docs/                 # Schema overview documentation
├── tests/                    # 30 passing test suites (542 tests)
│   ├── frontend/             # 11 UI component test files
│   ├── backend/              # 8 API test files
│   ├── auth/                 # 8 auth/security test files
│   ├── database/             # 9 database test files
│   ├── ops/                  # 10 operations test files
│   └── (16 more test files)  # Phase 8, integration, foundation tests
├── middleware.ts             # Route protection (247 lines, role-based)
├── next.config.js            # Next.js config
├── tailwind.config.ts        # Custom theme (primary/secondary palettes)
├── tsconfig.json             # Strict TS config with path aliases
├── jest.config.js            # Jest config (jsdom, coverage)
└── jest.setup.js             # Test mocks (Next.js router, Supabase)
```

## Technology Stack
- **Framework**: Next.js 14.1.0 with App Router
- **Language**: TypeScript 5.3.3 (strict mode)
- **Styling**: Tailwind CSS 3.4.1
- **Authentication**: Supabase Auth with SSR (`@supabase/ssr`)
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **State Management**: Zustand 4.4.7
- **Data Fetching**: TanStack Query (React Query) 5.17.9
- **Forms & Validation**: React Hook Form 7.58.0 + Zod 3.22.4
- **Icons**: Lucide React 0.309.0
- **Date Handling**: date-fns 3.2.0
- **CSS Utilities**: clsx 2.1.1 + tailwind-merge 3.3.1
- **Charts**: Recharts 3.7.0
- **Drag & Drop**: @hello-pangea/dnd 18.0.1
- **PDF**: jsPDF 2.5.1 + jsPDF-AutoTable 3.8.2
- **Excel**: XLSX 0.18.5
- **Payments**: Stripe 18.2.1
- **HTTP**: Axios 1.10.0
- **Email**: Nodemailer 7.0.3

## Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Check code with ESLint
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run test:ops` - Run operations tests
- `npm run test:database` - Run database tests
- `npm run test:all` - Run all test suites
- `npm run format` - Format code with Prettier
- `npm run typecheck` - Type check without compiling

## Key Features

### Implemented
- Multi-tenant architecture with law firm isolation (50+ database tables, RLS)
- Role-based access control (super_admin, admin, lawyer, staff, client)
- Landing page (D'Avila Reis institutional page at `/`)
- Full CRUD for legal matters (create, edit, delete, workflow, demo views)
- Client management (list, create, detail, edit) with CPF/CNPJ validation
- Billing module (invoices, time tracking, financial dashboard)
- Task management with priority, status, and assignment
- Document management with upload and storage integration
- Calendar scheduling with event types
- Reports with Recharts (BarChart, PieChart) and export (PDF/Excel)
- Sales pipeline with list + Kanban board (drag-and-drop via @hello-pangea/dnd)
- Admin panel (10 subroutes: analytics, security, billing, notifications, users, etc.)
- Settings page (7 tabs: firm, account, notifications, security, billing, integrations, appearance)
- Client portal (dashboard, matters, messages, billing, profile) with auth-wired layout
- Staff portal (dashboard, matter detail, tasks, messages, time entry) with sidebar layout
- Super admin platform view (multi-firm management)
- Chat/messaging with file upload (Supabase Storage), EVA AI ghost-write, real-time subscriptions
- Authentication flow (login, register, forgot password)
- Route protection middleware with role-based access
- 27 production UI components with barrel exports
- Desktop sidebar (12 items) + responsive mobile menu
- React Query data layer with 18 hook files
- 6 Zod validation schemas
- 18 billing service files (subscriptions, case billing, discounts, time tracking, payment plans)
- Financial services (AP/AR, collections, vendor management)
- Export system (PDF, Excel)
- DataJud CNJ integration (case enrichment, timeline events)
- WhatsApp integration (webhook aligned with real DB schema, auto-reply, media handling)
- Email notification service
- Stripe payment integration
- 30 passing test suites (542 tests)
- Portuguese localization throughout the UI

### Integration Status
All frontend modules are wired to real Supabase data via React Query hooks. All 10 sprints (0-9) are 100% complete. See `2026-master-plan.md` for detailed per-module status.

## Authentication Flow
- `middleware.ts` handles route protection using Supabase SSR cookies (247 lines)
- **Public paths**: `/`, `/pricing`, `/about`, `/contact`
- **Auth paths**: `/login`, `/register`, `/forgot-password`, `/reset-password`, `/privacy`, `/terms`
- **Dashboard paths**: `/dashboard`, `/matters`, `/clients`, `/billing`, `/calendar`, `/tasks`, `/documents`, `/reports`, `/settings`, `/messages`, `/pipeline`
- **Admin paths**: `/admin/*` (admin role required)
- **Platform paths**: `/platform/*` (super_admin role required)
- **Portal paths**: `/portal/client/*`, `/portal/staff/*`
- Unauthenticated users redirected to `/login` with `redirectedFrom` param
- Role-based route filtering (super_admin, admin, lawyer, staff, client)

## Database Schema
Single consolidated file: `database/migrations/000_init.sql` (2,348 lines, 54 tables). Original 13 migration files archived in `database/migrations/archive/`.

### Schema Sections (in dependency order)
1. **Extensions** — uuid-ossp, pgcrypto
2. **Helper Functions** — 6 functions in `public` schema (Supabase-safe)
3. **Core Tables (15)** — law_firms, users, matter_types, contacts, matters, matter_contacts, tasks, time_entries, documents, invoices, invoice_line_items, messages, pipeline_stages, pipeline_cards, activity_logs
4. **Billing Tables (9)** — subscription_plans, case_types, case_billing_methods, discount_rules, payment_plans, payment_installments, client_subscriptions, billing_settings, billing_audit_log
5. **DataJud Tables (5)** — datajud_cases, datajud_movements, datajud_subjects, datajud_parties, datajud_documents
6. **Time Tracking (7)** — time_entry_categories, timer_sessions, time_entry_approvals, time_entry_adjustments, overtime_rules, time_reports, time_report_entries
7. **Invoice System (9)** — case_invoices, case_invoice_line_items, invoice_templates, invoice_template_items, recurring_invoices, credit_notes, credit_note_items, invoice_numbering, invoice_email_log
8. **Financial Mgmt (6)** — vendors, bills, expense_categories, bill_payments, payment_collections, payment_reminders, financial_alerts
9. **Content Hub (3)** — articles, contact_submissions, newsletter_subscribers
10. **RLS + Policies** — Staff, client, super_admin bypass, service_role bypass
11. **Indexes, Triggers, Views** — All indexes, updated_at triggers, platform_law_firm_stats view

### Key Design Decisions
- All helper functions use `public.*` schema (Supabase blocks `auth.*` custom functions)
- All client FKs reference `contacts(id)` (no `clients` table)
- Multi-tenant isolation via `law_firm_id` on all tables + RLS policies
- `super_admin` has `law_firm_id = NULL` with bypass policies
- 5 child tables have direct `law_firm_id`: matter_contacts, bill_payments, payment_reminders, payment_installments, payment_collections

## React Query Hooks
All in `lib/queries/` (18 files):
- `useMatters.ts` - Matter CRUD
- `useTasks.ts` - Task management
- `useInvoices.ts` - Invoice queries
- `useTimeEntries.ts` - Time entry queries
- `useAdmin.ts` - Admin dashboard
- `useCalendarEvents.ts` - Calendar events
- `useDocuments.ts` - Document queries
- `useReports.ts` - Report generation
- `useSettings.ts` - Settings queries
- `useClientPortal.ts` - Client portal
- `useStaffPortal.ts` - Staff portal
- `usePipeline.ts` - Sales pipeline
- `usePlatform.ts` - Super admin platform
- `useDiscountRules.ts` - Discount rule CRUD + toggle + presets
- `usePaymentPlans.ts` - Payment plan CRUD + activate + cancel
- `useMessages.ts` - Chat messages
- `useArticles.ts` - Content hub articles
- `useWebsiteContent.ts` - Website CMS content

## UI Components (27 in `components/ui/`)
Alert, Badge, Button, Card, Checkbox, DatePicker, Dialog, DropdownMenu, EmptyState, FileUpload, Form, Input, Label, LoadingSpinner, Pagination, Progress, ScrollArea, SearchInput, Select, Separator, Skeleton, StatusWorkflowBadge, Switch, Table, Tabs, Textarea, Toast (+ToastProvider)

All exported via barrel file `components/ui/index.ts`.

## Sidebar Navigation (12 items)
1. Plataforma (`/platform`) - super_admin only
2. Visao Geral (`/admin`) - admin only
3. Processos (`/matters`)
4. Clientes (`/clients`)
5. Faturamento (`/billing`)
6. Calendario (`/calendar`)
7. Documentos (`/documents`)
8. Tarefas (`/tasks`)
9. Relatorios (`/reports`)
10. Pipeline (`/pipeline`)
11. Mensagens (`/messages`)
12. Configuracoes (`/settings`)

## TypeScript Path Aliases
- `@/*` -> `./*`
- `@/components/*` -> `./components/*`
- `@/lib/*` -> `./lib/*`
- `@/styles/*` -> `./styles/*`
- `@/types/*` -> `./types/*`
- `@/utils/*` -> `./lib/utils/*`
- `@/hooks/*` -> `./lib/hooks/*`

## Development Guidelines
- Keep components simple and focused
- Use Server Components by default, Client Components when needed
- Implement proper error boundaries
- Follow Next.js 14 best practices
- Use TypeScript strict mode
- Maintain consistent code style with ESLint and Prettier
- All UI text in Portuguese
- React Query + Dialogs pattern for CRUD modules (see `2026-master-plan.md`)
- Auth context: `useAuthContext()` from `@/lib/providers/auth-provider`
- Supabase client: `useSupabase()` from `@/components/providers`
- Profile type: `UserWithRelations` (includes `law_firm?: LawFirm`)
- super_admin has `law_firm_id = NULL` — guard pages that assume non-null

## Known Issues
- `jest.config.js` has `moduleNameMapping` (typo, should be `moduleNameMapper`) — `@/` path aliases don't resolve in tests. Tests use self-contained mock components as workaround.
- Supabase Web Lock deadlock: NEVER make `.from().select()` inside `onAuthStateChange` callback. See `lib/hooks/use-auth.ts` for correct two-effect pattern.

## Environment Variables
Copy `.env.local.example` to `.env.local` and configure:

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

**App Configuration:**
- `NEXT_PUBLIC_APP_URL` (default: http://localhost:3000)
- `NEXT_PUBLIC_APP_NAME` (default: Prima Facie)
- `NEXT_PUBLIC_STORAGE_BUCKET` (default: documents)

**Integrations:**
- `DATAJUD_API_KEY` - CNJ DataJud public API key (get from https://datajud-wiki.cnj.jus.br/api-publica/acesso)

**Optional:**
- `EMAIL_FROM`, `EMAIL_SMTP_HOST`, `EMAIL_SMTP_PORT`, `EMAIL_SMTP_USER`, `EMAIL_SMTP_PASS` - Email/SMTP
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` - Google Analytics
- `NEXT_PUBLIC_SENTRY_DSN` - Error tracking
- Stripe keys (see `.env.local.example`)

## Version History
- **v4.1.0 (2026-02-08): All Sprints Complete**
  - 75 page routes, 131 components, 18 RQ hook files
  - Recharts (BarChart + PieChart) in reports
  - Pipeline Kanban board with @hello-pangea/dnd drag-and-drop
  - Chat file upload via Supabase Storage + EVA AI ghost-write
  - Staff portal: layout + 4 sub-pages (matter detail, tasks, messages, time entry)
  - Client portal layout wired to real auth context
  - Discount rules + payment plans migrated to React Query
  - WhatsApp webhook aligned with real DB schema
  - Dead code cleanup across admin pages
  - 30 test suites (542 tests) all passing

- **v4.0.0 (2026-02): Full Platform Build-Out**
  - 57 page routes across dashboard, admin, portal, and public areas
  - 27 UI components with barrel exports
  - 13 React Query hook files for all modules
  - 6 Zod validation schemas
  - 18 billing service files + 3 financial service files
  - DataJud CNJ integration
  - Export system (PDF + Excel)
  - Stripe payment integration
  - WhatsApp + email notification infrastructure
  - Client and staff portals
  - Super admin multi-firm platform view
  - Sales pipeline with lead management
  - Landing page (D'Avila Reis)

- **v3.0.0 (2025-01): Full CRUD & UI Components**
  - Complete Matter CRUD (create, edit, delete dialogs)
  - 7 production UI components
  - React Query data layer with optimistic updates
  - Desktop sidebar + responsive mobile menu
  - React Hook Form + Zod validation
  - Authentication UI (Login, Register, Forgot Password)

- **v2.0.0 (2025-01): Database Schema**
  - 14-table multi-tenant PostgreSQL schema
  - Row Level Security policies
  - Seed data with sample firms, users, matters, tasks
  - Comprehensive TypeScript types

- **v1.0.0 (2025-01): Foundation Setup**
  - Next.js 14 with App Router and TypeScript
  - Supabase integration for authentication
  - Tailwind CSS with custom theme
  - Middleware for route protection
  - Portuguese UI/UX implementation

## Current Status
- Infrastructure (DB, Auth, Middleware, Landing): Complete
- Backend Services (Billing, Financial, Clients, Matters, Exports): Complete
- UI Components (27/27): Complete
- React Query Hooks (18 files): Complete
- Frontend Pages (75 routes): All wired to real Supabase data
- Tests: 30 suites, 542 tests passing
- All 10 sprints (0-9) are 100% complete
- See `2026-master-plan.md` for detailed per-sprint status
