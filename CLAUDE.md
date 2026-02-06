# CLAUDE.md - Prima Facie Project

## Project Overview
Prima Facie is a Next.js 14 application for legal practice management (Sistema de Gestão para Escritórios de Advocacia) with TypeScript, Tailwind CSS, Supabase authentication, and a comprehensive dashboard. The UI is localized in Portuguese.

## Project Structure
```
prima-facie/
├── app/                       # Next.js 14 App Router
│   ├── (auth)/               # Authentication routes group
│   │   ├── login/            # Login page
│   │   ├── register/         # Registration page
│   │   ├── forgot-password/  # Password recovery
│   │   └── layout.tsx        # Auth layout wrapper
│   ├── (dashboard)/          # Protected dashboard routes
│   │   ├── admin/            # Admin panel
│   │   ├── matters/          # Legal matters/cases (full CRUD)
│   │   ├── clients/          # Client management (placeholder)
│   │   ├── billing/          # Financial/billing (placeholder)
│   │   ├── calendar/         # Calendar/scheduling (placeholder)
│   │   ├── tasks/            # Task management (placeholder)
│   │   ├── documents/        # Document management (placeholder)
│   │   ├── reports/          # Reports/analytics (placeholder)
│   │   ├── settings/         # System settings (placeholder)
│   │   └── layout.tsx        # Dashboard layout with sidebar
│   ├── portal/               # Portal access
│   │   ├── client/           # Client portal
│   │   ├── staff/            # Staff portal
│   │   └── layout.tsx        # Portal layout wrapper
│   ├── layout.tsx            # Root layout (Inter font, Providers)
│   └── page.tsx              # Root redirect to /login
├── components/
│   ├── ui/                   # Reusable UI components
│   │   ├── button.tsx        # Variants: primary/secondary/outline/ghost/danger
│   │   ├── input.tsx         # Labels, errors, helper text, validation
│   │   ├── card.tsx          # Card, CardHeader, CardTitle, CardContent
│   │   ├── table.tsx         # Full table system with hover states
│   │   ├── form.tsx          # React Hook Form integration
│   │   ├── dialog.tsx        # Modal with backdrop, scroll lock, escape
│   │   ├── select.tsx        # Custom dropdown with keyboard navigation
│   │   └── index.ts          # Barrel exports
│   ├── layout/
│   │   ├── sidebar.tsx       # Fixed desktop sidebar (64px, 9 menu items)
│   │   └── mobile-menu.tsx   # Hamburger slide-out drawer (<1024px)
│   ├── matters/              # Matter-specific components
│   │   ├── create-matter-dialog.tsx
│   │   ├── edit-matter-dialog.tsx
│   │   └── delete-matter-dialog.tsx
│   └── providers.tsx         # React Query + Supabase context
├── lib/
│   ├── supabase/
│   │   ├── client.ts         # Browser Supabase client
│   │   └── server.ts         # Server Supabase client
│   ├── hooks/
│   │   └── useAuth.ts        # Auth state hook
│   ├── queries/
│   │   └── useMatters.ts     # React Query hooks for matters CRUD
│   └── utils/
│       └── cn.ts             # clsx + tailwind-merge utility
├── types/
│   ├── index.ts              # Base types (User, ApiResponse, etc.)
│   └── database.ts           # Full database schema types (14 entities, 19 enums)
├── database/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql    # 14-table multi-tenant schema
│   │   └── 002_row_level_security.sql # RLS policies for all tables
│   ├── seeds/
│   │   └── 001_sample_data.sql       # Sample firms, users, matters, tasks
│   ├── docs/
│   │   └── schema_overview.md
│   └── README.md
├── styles/
│   └── globals.css           # Tailwind CSS setup
├── tests/                    # 12 test files
├── middleware.ts             # Route protection with Supabase SSR
├── next.config.js            # Next.js config (strict mode, SWC, server actions)
├── tailwind.config.ts        # Custom theme (primary/secondary palettes, animations)
├── tsconfig.json             # Strict TS config with path aliases
├── jest.config.js            # Jest config (jsdom, coverage)
├── jest.setup.js             # Test mocks (Next.js router, Supabase)
├── postcss.config.js         # PostCSS (Tailwind + Autoprefixer)
├── .eslintrc.json            # ESLint (strict, no-any, explicit returns)
├── .prettierrc               # Prettier (single quotes, 100 width, semicolons)
├── package.json              # Dependencies and scripts
├── setup.sh                  # Project setup script
├── .env.local.example        # Environment variables template
└── .gitignore
```

## Technology Stack
- **Framework**: Next.js 14.1.0 with App Router
- **Language**: TypeScript 5.3.3 (strict mode)
- **Styling**: Tailwind CSS 3.4.1
- **Authentication**: Supabase Auth with SSR (`@supabase/ssr`)
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **State Management**: Zustand 4.4.7
- **Data Fetching**: TanStack Query (React Query) 5.17.9
- **Forms & Validation**: React Hook Form 7.49.3 + Zod 3.22.4
- **Icons**: Lucide React 0.309.0
- **Date Handling**: date-fns 3.2.0
- **CSS Utilities**: clsx 2.1.1 + tailwind-merge 3.3.1

## Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Check code with ESLint
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run format` - Format code with Prettier
- `npm run typecheck` - Type check without compiling

## Key Features

### Implemented
- Multi-tenant architecture with law firm isolation
- Role-based access control (Admin, Staff, Client)
- Full CRUD for legal matters (create, read, update, delete with dialogs)
- Authentication flow (login, register, forgot password)
- Route protection middleware with Supabase SSR cookies
- 7 production UI components (Button, Input, Card, Table, Form, Dialog, Select)
- Desktop sidebar + responsive mobile menu navigation
- React Query data layer with optimistic updates and cache invalidation
- Comprehensive database schema (14 tables) with RLS policies
- Portuguese localization throughout the UI
- 12 test suites

### Not Yet Implemented
- Client management page (placeholder exists)
- Billing/invoice management (placeholder exists)
- Calendar integration (placeholder exists)
- Task management page (placeholder exists)
- Document management (placeholder exists)
- Reports and analytics (placeholder exists)
- Settings page (placeholder exists)
- Portal access controls (placeholder exists)

## Authentication Flow
- `middleware.ts` handles route protection using Supabase SSR cookies
- **Protected paths**: /admin, /matters, /clients, /billing, /calendar, /tasks, /documents, /reports, /settings
- **Auth paths**: /login, /register, /forgot-password
- **Portal paths**: /portal/client, /portal/staff
- Unauthenticated users redirected to /login with `redirectedFrom` param
- Authenticated users on auth pages redirected to /matters

## Database Schema
Located in `database/migrations/`. 14 tables with UUID primary keys, timestamps, soft deletes, and JSONB fields:

1. **law_firms** - Multi-tenant base (subscription, branding)
2. **users** - Staff and clients (linked to Supabase Auth)
3. **matter_types** - Matter categories with default rates
4. **contacts** - Clients and prospects (individual/company)
5. **matters** - Legal cases (process info, billing, assignments)
6. **matter_contacts** - Matter-Contact N:N relationship
7. **tasks** - Task management with billing integration
8. **time_entries** - Hour tracking for billing
9. **documents** - Document storage with versioning and access levels
10. **invoices** - Billing with payment tracking
11. **invoice_line_items** - Invoice detail lines
12. **messages** - Chat system with external platform support
13. **pipeline_stages** - Customizable sales pipeline stages
14. **pipeline_cards** - Pipeline prospects with forecasting
15. **activity_logs** - Audit trail

RLS policies enforce law firm isolation and role-based data access.

## TypeScript Path Aliases
- `@/*` → `./*`
- `@/components/*` → `./components/*`
- `@/lib/*` → `./lib/*`
- `@/styles/*` → `./styles/*`
- `@/types/*` → `./types/*`
- `@/utils/*` → `./lib/utils/*`
- `@/hooks/*` → `./lib/hooks/*`

## Development Guidelines
- Use snake_case for naming conventions
- Keep components simple and focused
- Use Server Components by default, Client Components when needed
- Implement proper error boundaries
- Follow Next.js 14 best practices
- Use TypeScript strict mode
- Maintain consistent code style with ESLint and Prettier
- All UI text in Portuguese

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

**Optional:**
- `EMAIL_FROM`, `EMAIL_SMTP_HOST`, `EMAIL_SMTP_PORT`, `EMAIL_SMTP_USER`, `EMAIL_SMTP_PASS` - Email/SMTP
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` - Google Analytics
- `NEXT_PUBLIC_SENTRY_DSN` - Error tracking

## Version History
- **v3.0.0 (2025-01): Full CRUD & UI Components**
  - Complete Matter CRUD (create, edit, delete dialogs)
  - 7 production UI components (Button, Input, Card, Table, Form, Dialog, Select)
  - React Query data layer with optimistic updates
  - Desktop sidebar + responsive mobile menu
  - React Hook Form + Zod validation
  - Authentication UI (Login, Register, Forgot Password)

- **v2.0.0-phase2 (2025-01): Database Schema**
  - 14-table multi-tenant PostgreSQL schema
  - Row Level Security policies for all tables
  - Seed data with sample firms, users, matters, tasks
  - Comprehensive TypeScript types for all entities (19 enums, 14+ types)
  - Schema documentation

- **v1.0.0-phase1 (2025-01-15): Foundation Setup**
  - Next.js 14 with App Router and TypeScript
  - Supabase integration for authentication
  - Tailwind CSS with custom theme
  - Complete project structure with all routes
  - Unit test suite with Jest and React Testing Library
  - Middleware for route protection
  - Portuguese UI/UX implementation

## Current Status
- Phase 1 (Foundation): Complete
- Phase 2 (Database Schema): Complete
- Phase 3 (UI Components & CRUD): Complete for Matters
- **Next**: Extend CRUD to remaining modules (Clients, Billing, Tasks, Documents, Calendar, Reports, Settings)
