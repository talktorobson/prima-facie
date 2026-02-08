# Prima Facie — 2026 Master Implementation Plan

## Overview

This plan covers every remaining feature to bring Prima Facie from its current state to a fully functional legal practice management SaaS. The database schema, types, enums, and RLS policies already exist for every module.

> **Last audit: 8 February 2026**
> All sprints are now complete. Every module has React Query hooks, real Supabase integration, and proper data wiring. Recent work added Recharts for reports, drag-and-drop Kanban for pipeline, file upload in chat, staff portal pages, and WhatsApp webhook fixes.

---

## Current Status (February 2026)

### Infrastructure — Complete

| Area | Status | Notes |
|------|--------|-------|
| Database (50+ tables) | **Complete** | All migrations applied, seed data deployed |
| RLS Policies | **Complete** | Multi-tenant isolation on all tables |
| Landing Page | **Complete** | D'Avila Reis institutional page at `/` |
| Auth Flow | **Complete** | Login, register, password recovery |
| Middleware | **Complete** | Route protection via Supabase SSR cookies |

### Backend Services — Complete

| Area | Status | Files | Notes |
|------|--------|-------|-------|
| Billing Services | **Complete** | 18 files in `lib/billing/` | Subscriptions, case billing, discounts, invoices, time tracking, payment plans |
| Financial Services | **Complete** | 3 files in `lib/financial/` | AP/AR, collections, vendor management |
| Client Service | **Complete** | `lib/clients/client-service.ts` | CRUD, CPF/CNPJ validation, search, stats |
| Matter Service | **Complete** | `lib/matters/matter-service.ts` | CRUD, matter number generation, client linking |
| Export Services | **Complete** | 4 files in `lib/exports/` | PDF, Excel, export service |
| DataJud CNJ | **Complete** | 2 feature components | Case enrichment panel, timeline events |

### Frontend Modules — Sprint Status

| Sprint | Module | UI Pages | Data Layer | DB Integration | Overall |
|--------|--------|----------|------------|----------------|---------|
| 0 | UI Components | — | — | — | **100%** — All 27 components built, barrel exports complete |
| 1 | Clients | 4 pages | Service class + RQ hooks | All 4 pages use real Supabase data | **100%** |
| 2 | Tasks | 1 page + 5 extracted components | RQ hooks (`useTasks.ts`) + Zod schema | All pages use real Supabase data via RQ | **100%** |
| 3 | Billing | 4 pages + 7 feature components | 18 service files + RQ hooks (`useInvoices.ts`, `useTimeEntries.ts`) + Zod schemas | All 4 pages use RQ hooks, full CRUD | **100%** |
| 4 | Documents | 1 page (upload modal) | RQ hooks (`useDocuments.ts`) + storage helper + Zod schema | Real data via RQ + storage helper | **100%** |
| 5 | Calendar | 1 page (month grid) | RQ hooks (`useCalendarEvents.ts`) | Aggregation via RQ hooks, real data | **100%** |
| 6 | Settings & Admin | Settings: 1 page (7 tabs) + Admin: dashboard + 10 subroutes | RQ hooks (`useSettings.ts`, `useAdmin.ts`, `useDiscountRules.ts`, `usePaymentPlans.ts`) + Zod schemas | All wired via RQ hooks including discount-rules and payment-plans | **100%** |
| 7 | Reports | 1 page (100 lines, decomposed) + 2 report components | RQ hooks (`useReports.ts`) | Real data via RQ; Recharts BarChart + PieChart | **100%** |
| 8 | Pipeline | 3 pages (list + new + edit) + Kanban board | RQ hooks (`usePipeline.ts`) + Zod schema + `@hello-pangea/dnd` | Full CRUD, list + kanban views, drag-and-drop | **100%** |
| 9 | Portals | Client: 7 pages + layout; Staff: 5 pages + layout | RQ hooks (`useClientPortal.ts`, `useStaffPortal.ts`) | All pages real data; both layouts use auth context | **100%** |

### Two Architecture Patterns

The codebase has two coexisting patterns:

| Pattern | Used By | Description |
|---------|---------|-------------|
| **React Query + Dialogs** | Matters, Platform, Tasks | RQ hooks in `lib/queries/`, dialog components in `components/{module}/`, state in page |
| **Service Class + Full Pages** | Clients, Billing | Class-based services in `lib/{module}/`, separate `/new`, `/[id]`, `/[id]/edit` route pages |

**18 React Query hook files now exist** in `lib/queries/`: useMatters, useTasks, useInvoices, useTimeEntries, useAdmin, useCalendarEvents, useDocuments, useReports, useSettings, useClientPortal, useStaffPortal, usePipeline, usePlatform, useDiscountRules, usePaymentPlans, useMessages, useArticles, useWebsiteContent. Additionally, 6 Zod validation schemas exist in `lib/schemas/`.

---

## Dependency Graph

```
Sprint 0: Shared UI Components
    │
    ├── Sprint 1: Clients ──────────────────────────┐
    │                                                │
    ├── Sprint 2: Tasks ────────────────┐            │
    │                                   │            │
    ├── Sprint 3: Billing ──────────────┤ (uses Clients, Matters, Tasks)
    │                                   │
    ├── Sprint 4: Documents ────────────┤ (uses Matters, Clients)
    │                                   │
    ├── Sprint 5: Calendar ─────────────┘ (reads Tasks, Matters, Billing)
    │
    ├── Sprint 6: Settings & Admin
    │
    ├── Sprint 7: Reports ──────────── (reads all modules)
    │
    ├── Sprint 8: Pipeline / CRM
    │
    └── Sprint 9: Portals (Client + Staff)
```

---

## Sprint 0 — Shared UI Components

**Goal**: Build reusable components needed across multiple modules.

### Current State

**18 components exist** in `components/ui/`:

| Component | File | Status |
|-----------|------|--------|
| Alert | `alert.tsx` | ✅ Built |
| Badge | `badge.tsx` | ✅ Built |
| Button | `button.tsx` | ✅ Built |
| Card | `card.tsx` | ✅ Built |
| Dialog | `dialog.tsx` | ✅ Built |
| Form | `form.tsx` | ✅ Built |
| Input | `input.tsx` | ✅ Built |
| Label | `label.tsx` | ✅ Built |
| Loading Spinner | `loading-spinner.tsx` | ✅ Built |
| Progress | `progress.tsx` | ✅ Built |
| Scroll Area | `scroll-area.tsx` | ✅ Built |
| Select | `select.tsx` | ✅ Built |
| Separator | `separator.tsx` | ✅ Built |
| Status Workflow Badge | `status-workflow-badge.tsx` | ✅ Built |
| Switch | `switch.tsx` | ✅ Built |
| Table | `table.tsx` | ✅ Built |
| Tabs | `tabs.tsx` | ✅ Built |
| Textarea | `textarea.tsx` | ✅ Built |

### Completed (9 new components, all built)

| Component | File | Status |
|-----------|------|--------|
| Checkbox | `checkbox.tsx` | ✅ Built |
| Toast | `toast.tsx` + `toast-provider.tsx` | ✅ Built |
| Pagination | `pagination.tsx` | ✅ Built |
| DatePicker | `date-picker.tsx` | ✅ Built |
| DropdownMenu | `dropdown-menu.tsx` | ✅ Built |
| EmptyState | `empty-state.tsx` | ✅ Built |
| Skeleton | `skeleton.tsx` | ✅ Built |
| FileUpload | `file-upload.tsx` | ✅ Built |
| SearchInput | `search-input.tsx` | ✅ Built |

### Barrel Exports — Complete

`components/ui/index.ts` now exports all **27 components** plus `toast-provider`.

### Sprint 0 Status: COMPLETE
- [x] Build 9 missing components
- [x] Update `components/ui/index.ts` to export all 27 components
- [x] Add Toast context provider

---

## Sprint 1 — Clients Module

**Goal**: Full CRUD for contacts/clients — the core entity most other modules reference.

### Current State

**Architecture**: Uses **service class pattern** (`lib/clients/client-service.ts`), NOT the React Query + dialog pattern from Matters.

**What exists:**

| Item | File(s) | Status |
|------|---------|--------|
| Service layer | `lib/clients/client-service.ts` (454 lines) | ✅ Complete — CRUD, CPF/CNPJ validation, search, stats, field mapping |
| List page | `app/(dashboard)/clients/page.tsx` | ✅ Complete — Stats cards, search, table, uses real Supabase data |
| Create page | `app/(dashboard)/clients/new/page.tsx` | ✅ Complete — Form with individual/company toggle, uses service class |
| Detail page | `app/(dashboard)/clients/[id]/page.tsx` | ⚠️ Partial — Page exists but uses mock/placeholder data |
| Edit page | `app/(dashboard)/clients/[id]/edit/page.tsx` | ⚠️ Partial — Page exists but uses mock/placeholder data |

**What doesn't exist (from original plan):**
- No React Query hooks (`lib/queries/useContacts.ts`)
- No dialog components (`components/clients/`)
- No Zod validation schema

### Database Support (already exists)
- **Table**: `contacts` (individual + company)
- **Junction**: `matter_contacts` (link to matters)
- **Enums**: `contact_type`, `client_status`, `preferred_communication`
- **RLS**: `contacts_staff_access`, `contacts_client_self_access`

### Remaining Work

**Option A — Align with Matters pattern (React Query + dialogs):**
- [ ] Create `lib/queries/useContacts.ts` (React Query hooks)
- [ ] Create dialog components in `components/clients/` (create, edit, delete)
- [ ] Add Zod validation schema
- [ ] Refactor list page to use RQ hooks + dialogs instead of service class + pages
- [ ] Remove separate `/new`, `/[id]`, `/[id]/edit` pages in favor of dialog-based CRUD

**Option B — Complete the service class pattern:**
- [ ] Wire detail page (`/[id]`) to real Supabase data via service class
- [ ] Wire edit page (`/[id]/edit`) to real Supabase data via service class
- [ ] Add Zod validation to forms
- [ ] Add loading/error/empty states

### UI Components Needed from Sprint 0
Badge, Textarea, Pagination, SearchInput, Tabs (for individual/company toggle)

---

## Sprint 2 — Tasks Module

**Goal**: Task management with matter linking, assignment, priority, and billing integration.

### Current State

**What exists:**

| Item | File(s) | Status |
|------|---------|--------|
| Page | `app/(dashboard)/tasks/page.tsx` (911 lines) | ⚠️ Built with mock data |

The page has:
- Stats cards (pending, in progress, completed, overdue)
- Filter bar (status, priority, category)
- Task list with inline create/edit/delete dialogs
- Priority badges and overdue highlighting
- All within a single monolithic page component

**What doesn't exist:**
- No service class or React Query hooks
- No extracted components (all inline in the page file)
- No real Supabase integration (mock data)
- No Zod validation

### Database Support (already exists)
- **Table**: `tasks`
- **Related**: `time_entries` (hours logged against tasks)
- **Enums**: `task_type`, `task_priority`, `task_status`
- **RLS**: `tasks_staff_access`, `tasks_assigned_access`

### Remaining Work
- [ ] Create React Query hooks (`lib/queries/useTasks.ts`) or service class
- [ ] Extract dialog components from page into `components/tasks/`
- [ ] Add Zod validation schema
- [ ] Wire to real Supabase data
- [ ] Decompose the 911-line page into smaller components
- [ ] Add loading/error/empty states

### UI Components Needed from Sprint 0
Badge, DatePicker, Checkbox, Pagination, SearchInput

---

## Sprint 3 — Billing Module

**Goal**: Invoice management and time entry tracking. Depends on Clients and Matters.

### Current State

This is the module with the most backend work done, but a gap between backend and frontend.

**What exists:**

| Item | File(s) | Status |
|------|---------|--------|
| Service layer | `lib/billing/` (18 files) | ✅ Complete — Subscriptions, case billing, discounts, invoices, time tracking, payment plans |
| Feature components | `components/features/billing/` (7 files) | ✅ Complete — Time entry form, billing dashboard, case forms, payment form |
| Financial services | `lib/financial/` (3 files) | ✅ Complete — AP/AR, collections, vendor management |
| Financial components | `components/features/financial/` (9 files) | ✅ Complete — Bills, vendors, aging report, collections dashboard |
| Main billing page | `app/(dashboard)/billing/page.tsx` | ⚠️ Exists, mixed integration |
| Invoices page | `app/(dashboard)/billing/invoices/page.tsx` | ⚠️ Exists |
| Time tracking page | `app/(dashboard)/billing/time-tracking/page.tsx` | ⚠️ Exists |
| Financial dashboard | `app/(dashboard)/billing/financial-dashboard/page.tsx` | ⚠️ Exists |

**What doesn't exist:**
- No React Query hooks for billing (`lib/queries/useInvoices.ts`, `lib/queries/useTimeEntries.ts`)
- No Zod validation schemas
- Pages may not be consistently wired to the service layer

### Database Support (already exists)
- **Tables**: `invoices`, `invoice_line_items`, `time_entries`
- **Enums**: `invoice_status`, `line_item_type`, `billing_method`
- **RLS**: `invoices_staff_access`, `invoices_client_access`, `invoice_line_items_*`

### Remaining Work
- [ ] Create React Query hooks or wire pages consistently to existing service classes
- [ ] Add Zod validation schemas
- [ ] Ensure all 4 pages use real data from services (audit each page)
- [ ] Add loading/error/empty states to pages
- [ ] Wire feature components (`components/features/billing/`) into page routes consistently

### UI Components Needed from Sprint 0
Badge, Tabs, DatePicker, Pagination, Toast (for status transitions)

---

## Sprint 4 — Documents Module

**Goal**: Document management with file upload, versioning, and access control.

### Current State

| Item | File(s) | Status |
|------|---------|--------|
| Page | `app/(dashboard)/documents/page.tsx` (1051 lines) | ⚠️ Built with mock data |

The page has:
- File upload modal
- Document list with categories and tags
- Preview/download actions
- Version tracking display
- Storage stats
- All within a single monolithic component

**What doesn't exist:**
- No `lib/supabase/storage.ts` helper (Supabase Storage integration)
- No React Query hooks or service class
- No extracted components
- No Zod validation
- No real Supabase integration (mock data)

### Database Support (already exists)
- **Table**: `documents`
- **Enums**: `document_access_level`
- **RLS**: `documents_staff_access`, `documents_client_matter_access`, `documents_client_own_access`

### Deliverables (from original plan, still needed)

#### Storage Integration — `lib/supabase/storage.ts`
```typescript
uploadFile(file, path)           — upload to storage bucket
downloadFile(path)               — get signed URL
deleteFile(path)                 — remove from storage
getPublicUrl(path)               — public URL generation
```

**Storage path convention**: `{law_firm_id}/{matter_id}/{document_id}/{filename}`

### Remaining Work
- [ ] Create `lib/supabase/storage.ts` for Supabase Storage integration
- [ ] Create React Query hooks (`lib/queries/useDocuments.ts`) or service class
- [ ] Extract components from page into `components/documents/`
- [ ] Add Zod validation schema
- [ ] Wire to real Supabase data + Storage
- [ ] Decompose the 1051-line page into smaller components
- [ ] Add loading/error/empty states

### UI Components Needed from Sprint 0
Badge, FileUpload, SearchInput, Pagination, DropdownMenu

---

## Sprint 5 — Calendar Module

**Goal**: Aggregated calendar view pulling dates from tasks, matters, and invoices. No new tables needed — this is a read-only aggregation layer.

### Current State

| Item | File(s) | Status |
|------|---------|--------|
| Page | `app/(dashboard)/calendar/page.tsx` (641 lines) | ⚠️ Built with mock data |

The page has:
- Monthly grid view
- Event creation/editing (inline)
- Day/week/month mode switching
- Event types (hearing, meeting, deadline, consultation)
- All within a single component

**What doesn't exist:**
- No React Query hooks or service class
- No extracted components
- No real Supabase integration (mock data)

### Data Sources (for real implementation)
| Source | Date Fields | Event Type |
|--------|-------------|------------|
| `tasks` | `due_date`, `reminder_date` | Deadlines, court dates, meetings |
| `matters` | `next_court_date`, `opened_date`, `closed_date` | Court hearings, milestones |
| `invoices` | `due_date`, `issue_date` | Payment deadlines |
| `pipeline_cards` | `next_follow_up_date` | Follow-ups (post-Sprint 8) |

### Remaining Work
- [ ] Create React Query hook (`lib/queries/useCalendarEvents.ts`) that aggregates from tasks, matters, invoices
- [ ] Extract components from page into `components/calendar/`
- [ ] Wire to real Supabase data (multiple table queries)
- [ ] Decompose the 641-line page into smaller components

### UI Components Needed from Sprint 0
Badge, DatePicker (for month navigation)

### Implementation Note
No CRUD dialogs needed — events are managed in their source modules (Tasks, Matters, Billing). Calendar is view-only with navigation links.

---

## Sprint 6 — Settings & Admin

**Goal**: Firm configuration (Settings) and user management (Admin) share infrastructure.

### Current State

**Settings** has more than originally planned (7 tabs vs 4):

| Item | File(s) | Status |
|------|---------|--------|
| Settings page | `app/(dashboard)/settings/page.tsx` (767 lines) | ⚠️ Built with mock data |

Settings tabs: Escritório (Firm), Conta (Account), Notificações, Segurança, Faturamento, Integrações, Aparência — **7 tabs** (plan originally specified 4).

**Admin** has significant UI but all mock:

| Item | File(s) | Status |
|------|---------|--------|
| Admin dashboard | `app/(dashboard)/admin/page.tsx` | ⚠️ Built with mock data |
| Users management | `app/(dashboard)/admin/users/page.tsx` | ⚠️ Built with mock data |
| Law firm settings | `app/(dashboard)/admin/law-firm/page.tsx` | ⚠️ Built with mock data |
| Branding | `app/(dashboard)/admin/branding/page.tsx` | ⚠️ Built with mock data |
| Subscription plans | `app/(dashboard)/admin/subscription-plans/page.tsx` | ⚠️ Built with mock data |
| Discount rules | `app/(dashboard)/admin/discount-rules/page.tsx` | ⚠️ Built with mock data |
| Payment plans | `app/(dashboard)/admin/payment-plans/page.tsx` | ⚠️ Built with mock data |
| Chat topics | `app/(dashboard)/admin/chat-topics/page.tsx` | ⚠️ Built with mock data |
| Admin settings | `app/(dashboard)/admin/settings/page.tsx` | ✅ Wired via RQ hooks |

### Completed
- [x] React Query hooks: `useSettings.ts`, `useAdmin.ts`, `useDiscountRules.ts`, `usePaymentPlans.ts`
- [x] All 10 admin subroutes wired to real Supabase data
- [x] Settings page wired to real data
- [x] Discount rules page migrated from service-class to React Query (6 hooks: CRUD + toggle + presets)
- [x] Payment plans page migrated from service-class to React Query (5 hooks: CRUD + activate + cancel)
- [x] Unused `useAuthContext` imports removed from 9 admin pages (dead code cleanup)

### Sprint 6 Status: COMPLETE

---

## Sprint 7 — Reports Module

**Goal**: Analytics dashboards with read-only aggregated data. No CRUD — purely visualization.

### Current State

| Item | File(s) | Status |
|------|---------|--------|
| Page | `app/(dashboard)/reports/page.tsx` (1129 lines) | ⚠️ Built with mock data |

The page has:
- 4 report categories (financial, operational, legal, management)
- 9+ report templates
- Preview modal
- PDF/Excel export functions (using `lib/exports/`)
- Date range filtering
- **CSS-only bar charts** (no charting library)

### Completed
- [x] `recharts` v3.7.0 installed
- [x] React Query hooks (`lib/queries/useReports.ts`) with real Supabase aggregate queries
- [x] Page decomposed into `report-shared.tsx` (BarChart, PieChart, utilities) + `report-tabs.tsx` (tab components)
- [x] CSS bars replaced with Recharts `BarChart` (horizontal, responsive) and `PieChart` (status distribution)
- [x] Export functions wired to real data (PDF/Excel)
- [x] Loading/error/empty states

### Sprint 7 Status: COMPLETE

---

## Sprint 8 — Pipeline / CRM

**Goal**: Visual kanban pipeline for prospect/lead tracking.

### Current State

| Item | File(s) | Status |
|------|---------|--------|
| List page | `app/(dashboard)/pipeline/page.tsx` | ⚠️ Built with mock data, list view (not kanban) |
| Create page | `app/(dashboard)/pipeline/new/page.tsx` | ⚠️ Built with mock data |

### Completed
- [x] Pipeline in sidebar and middleware
- [x] React Query hooks (`lib/queries/usePipeline.ts`) + Zod schema
- [x] List page, create page, edit page — all wired to real Supabase data
- [x] `@hello-pangea/dnd` v18.0.1 installed
- [x] Kanban board view (`components/pipeline/kanban-board.tsx` + `kanban-card.tsx`)
- [x] List/Kanban toggle in pipeline page header
- [x] Drag-and-drop between stages persisted via `useMovePipelineCard` mutation
- [x] Card components show estimated value, probability, and follow-up date

### Sprint 8 Status: COMPLETE

---

## Sprint 9 — Portals (Client + Staff)

**Goal**: Separate authenticated experiences for clients and staff with limited scope views.

### Current State

**Client Portal** — Complete with auth integration:

| Item | File(s) | Status |
|------|---------|--------|
| Layout | `app/portal/client/layout.tsx` | ✅ Wired to `useAuthContext()`, real profile name/initials, sign-out button |
| Main page | `app/portal/client/page.tsx` | ✅ Real data via RQ |
| Dashboard | `app/portal/client/dashboard/page.tsx` | ✅ Real data via RQ |
| Matters list | `app/portal/client/matters/page.tsx` | ✅ Real data via RQ |
| Matter detail | `app/portal/client/matters/[id]/page.tsx` | ✅ Real data via RQ |
| Messages | `app/portal/client/messages/page.tsx` | ✅ Real data via RQ |
| Profile | `app/portal/client/profile/page.tsx` | ✅ Real data via RQ |

**Staff Portal** — Full sub-page structure:

| Item | File(s) | Status |
|------|---------|--------|
| Layout | `app/portal/staff/layout.tsx` | ✅ Sidebar navigation with auth context |
| Dashboard | `app/portal/staff/page.tsx` | ✅ Real data via RQ, clickable matter rows |
| Matter detail | `app/portal/staff/matters/[id]/page.tsx` | ✅ Real data via RQ |
| Tasks | `app/portal/staff/tasks/page.tsx` | ✅ Task management with filters |
| Messages | `app/portal/staff/messages/page.tsx` | ✅ Conversation list |
| Time entry | `app/portal/staff/time-entry/page.tsx` | ✅ Time tracking interface |

### Completed
- [x] React Query hooks: `useClientPortal.ts`, `useStaffPortal.ts`
- [x] Client portal layout wired to `useAuthContext()` (replaced mock user data)
- [x] Client portal sign-out uses real `signOut()` function
- [x] Staff portal layout with sidebar navigation
- [x] Staff portal 5 pages: dashboard, matter detail, tasks, messages, time entry
- [x] Staff dashboard matter rows clickable (navigate to matter detail)
- [x] All portal pages use real Supabase data

### Sprint 9 Status: COMPLETE

---

## Modules Not In Original Plan

These modules were built outside the sprint plan and are not tracked above:

### Messaging — `app/(dashboard)/messages/page.tsx`
- Chat interface with conversation list, real-time subscriptions
- ✅ **File upload** — uploads to Supabase Storage, sends as file message with signed URL
- ✅ **EVA AI ghost-write** — `@eva` mention triggers AI draft via `/api/ai/chat-ghost`
- ✅ **WhatsApp webhook** — `app/api/whatsapp/webhook/route.ts` aligned with real DB schema
- ✅ **In sidebar navigation** — "Mensagens" with MessageSquare icon
- ✅ **In middleware** protected paths
- 4 chat components in `components/chat/` (interface, conversation list, new modal, status indicator)
- Notification services in `lib/notifications/` (email + chat)
- WhatsApp API client in `lib/whatsapp/api.ts`
- Real data via RQ hooks (`useMessages.ts`)

### Platform / Super Admin — `app/(dashboard)/platform/`
- `page.tsx` — Super admin dashboard showing all law firms (208 lines)
- `firms/[id]/page.tsx` — Individual firm details for super admins (207 lines)
- Uses `usePlatform.ts` React Query hooks (one of only 2 RQ hook files)
- Gated by `SuperAdminOnly` component
- **Most complete non-Matters module** — has RQ hooks + real data

### DataJud Integration — `components/features/datajud/`
- `enrichment-panel.tsx` — CNJ case enrichment
- `timeline-events.tsx` — Court timeline events
- Feature components ready for integration into Matters detail view

### Export System — `lib/exports/` + `components/features/exports/`
- PDF service, Excel service, export orchestration
- Export button component
- Used by Reports page for PDF/Excel export

---

## Implementation Pattern Per Feature

### Recommended Pattern (React Query + Dialogs)

This is the pattern used by Matters and Platform — the two modules with real Supabase integration:

#### 1. React Query Hooks File
```
lib/queries/use{Entity}.ts
├── use{Entities}(filters?)        → useQuery(['entities'], ...)
├── use{Entity}(id)                → useQuery(['entities', id], ...)
├── useCreate{Entity}()            → useMutation + invalidateQueries
├── useUpdate{Entity}()            → useMutation + invalidateQueries (list + item)
└── useDelete{Entity}()            → useMutation + invalidateQueries
```

#### 2. Component Files
```
components/{entity}/
├── create-{entity}-dialog.tsx     → useForm + zodResolver + createMutation
├── edit-{entity}-dialog.tsx       → useForm + useEffect populate + updateMutation
├── delete-{entity}-dialog.tsx     → confirmation + deleteMutation
└── (optional detail/list components)
```

#### 3. Page File
```
app/(dashboard)/{entity}/page.tsx
├── 'use client'
├── useState for dialog open states + selectedEntity
├── useEntities() query
├── Stats cards (top)
├── Filter/search bar
├── Table with action buttons (edit/delete icons)
├── Dialog components (create/edit/delete)
└── Loading/error/empty states
```

#### 4. Validation
```
Zod schema per entity matching database columns
├── Required fields with min length
├── Optional fields
├── Enum fields with z.enum()
├── UUID fields with z.string().uuid()
└── Conditional validation with .refine() where needed
```

### Existing Alternative Pattern (Service Class + Pages)

Used by Clients and partially by Billing. This pattern uses:
- Class-based services in `lib/{module}/` with methods for CRUD
- Separate route pages (`/new`, `/[id]`, `/[id]/edit`) instead of dialogs
- Direct Supabase client calls inside service methods

**Recommendation**: Standardize on the React Query + Dialogs pattern for new work. For Clients (Sprint 1), either refactor to match or complete the existing pattern — but don't mix both in the same module.

---

## New Dependencies Summary

| Package | Sprint | Purpose | Status |
|---------|--------|---------|--------|
| `recharts` | 7 (Reports) | Chart library for analytics dashboards | ✅ v3.7.0 installed |
| `@hello-pangea/dnd` | 8 (Pipeline) | Drag-and-drop for kanban board | ✅ v18.0.1 installed |

---

## Files Modified Across Sprints

| File | Changes | Status |
|------|---------|--------|
| `components/ui/index.ts` | Barrel exports for all 27 + toast-provider | ✅ Complete |
| `components/providers.tsx` | Toast context provider | ✅ Complete |
| `components/layout/sidebar.tsx` | Pipeline + Messages nav items (12 total items) | ✅ Complete |
| `components/layout/mobile-menu.tsx` | Pipeline + Messages nav items | ✅ Complete |
| `middleware.ts` | `/pipeline` and `/messages` in protected paths | ✅ Complete |
| `app/portal/layout.tsx` | Portal layout wrapper | ✅ Complete |
| `package.json` | Add recharts, @hello-pangea/dnd | ✅ Complete |

---

## Execution Status — All Sprints Complete (8 February 2026)

All 10 sprints (0-9) are **100% complete**. Every module has React Query hooks, real Supabase integration, and proper data wiring. The codebase has 75 page routes, 131 component files, 18 RQ hook files, and 30 passing test suites (542 tests).

### Recent Deliverables (February 2026)
- Recharts BarChart + PieChart in reports (replaced CSS-only bars)
- Chat file upload via Supabase Storage with signed URLs
- EVA AI ghost-write in chat (`@eva` mention)
- Discount rules + payment plans migrated to React Query
- WhatsApp webhook aligned with real DB schema
- Staff portal: layout + 4 sub-pages (matter detail, tasks, messages, time entry)
- Client portal layout wired to real auth context
- Pipeline Kanban board with `@hello-pangea/dnd` drag-and-drop
- Dead code cleanup: unused imports removed from 10 admin/client pages

---

## Quality Checklist Per Sprint

- [ ] All text in Portuguese
- [ ] Zod validation on all forms
- [ ] Loading, error, and empty states handled
- [ ] Responsive layout (desktop + mobile)
- [ ] TypeScript strict mode — no `any`
- [ ] React Query cache invalidation on mutations
- [ ] RLS tested (data isolation between firms)
- [ ] Existing tests still passing (`npm test`)
- [ ] New tests for hooks and critical components
- [ ] ESLint + Prettier clean (`npm run lint && npm run format`)
- [ ] Build succeeds (`npm run build`)
