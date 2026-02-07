# Prima Facie — 2026 Master Implementation Plan

## Overview

This plan covers every remaining feature to bring Prima Facie from its current state to a fully functional legal practice management SaaS. The database schema, types, enums, and RLS policies already exist for every module. The remaining work is **frontend only** — building React Query hooks, CRUD dialogs, and pages for each module.

Each feature follows the proven **Matters pattern**: React Query hooks + dialog-based CRUD + Zod validation + Portuguese localization.

## Current Status (February 2026)

| Area | Status | Notes |
|------|--------|-------|
| Database (50+ tables) | **Complete** | All migrations applied, seed data deployed |
| RLS Policies | **Complete** | Multi-tenant isolation on all tables |
| Landing Page | **Complete** | D'Avila Reis institutional page at `/` |
| Auth Flow | **Complete** | Login, register, password recovery |
| Matters CRUD | **Complete** | Full CRUD with dialogs and React Query |
| Billing Backend | **Complete** | Services, Stripe integration, dual invoices |
| DataJud CNJ | **Complete** | Case enrichment, timeline, court sync |
| Financial Backend | **Complete** | AP/AR services, vendor management |
| Sprints 0-9 (Frontend) | **Not Started** | All frontend CRUD modules below |

The sprints below represent **frontend implementation work**. The backend (database, services, API routes) is already production-ready.

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

**Goal**: Build reusable components needed across multiple modules. These don't exist yet.

### Components to Build

| Component | Used By | Priority |
|-----------|---------|----------|
| **Badge** | Clients, Tasks, Billing, Matters (status/priority pills) | High |
| **Textarea** | Clients, Tasks, Documents, Billing (description fields) | High |
| **Tabs** | Settings, Admin, Reports, Portals (tabbed layouts) | High |
| **Toast/Alert** | All modules (success/error feedback) | High |
| **Pagination** | Clients, Billing, Documents, Tasks (large lists) | High |
| **DatePicker** | Tasks, Calendar, Billing (date fields) | High |
| **Checkbox** | Tasks (bulk actions, completion toggle) | Medium |
| **DropdownMenu** | All modules (row action menus) | Medium |
| **EmptyState** | All modules (no-data placeholder) | Medium |
| **SkeletonLoader** | All modules (loading states) | Medium |
| **FileUpload** | Documents (drag-drop upload) | Medium |
| **SearchInput** | Clients, Matters, Documents (filter/search bar) | Medium |

### File Structure
```
components/ui/
├── badge.tsx
├── textarea.tsx
├── tabs.tsx
├── toast.tsx
├── pagination.tsx
├── date-picker.tsx
├── checkbox.tsx
├── dropdown-menu.tsx
├── empty-state.tsx
├── skeleton.tsx
├── file-upload.tsx
├── search-input.tsx
└── index.ts          # Update barrel exports
```

### Implementation Notes
- Follow existing patterns: `forwardRef`, `cn()` utility, variant props via `cva` or manual maps
- All components must support `className` override via `cn()`
- Badge needs variants for every status enum (active, closed, overdue, paid, etc.)
- Toast should use a context provider (add to `providers.tsx`)
- DatePicker can wrap a simple native input[type=date] initially, upgrade later
- Pagination should accept `page`, `totalPages`, `onPageChange` props

---

## Sprint 1 — Clients Module

**Goal**: Full CRUD for contacts/clients — the core entity most other modules reference.

### Database Support (already exists)
- **Table**: `contacts` (individual + company)
- **Junction**: `matter_contacts` (link to matters)
- **Enums**: `contact_type`, `client_status`, `preferred_communication`
- **RLS**: `contacts_staff_access`, `contacts_client_self_access`

### Deliverables

#### 1.1 React Query Hooks — `lib/queries/useContacts.ts`
```
useContacts()           — list all contacts (with pagination/filter)
useContact(id)          — single contact with related matters
useCreateContact()      — create mutation
useUpdateContact()      — update mutation
useDeleteContact()      — delete mutation
```

**Supabase query for list:**
```sql
contacts.*, matter_contacts(matter:matters(id, title, status))
ORDER BY created_at DESC
```

#### 1.2 Components — `components/clients/`
```
components/clients/
├── create-client-dialog.tsx    # Individual + Company form (tabs or toggle)
├── edit-client-dialog.tsx      # Pre-populated edit form
├── delete-client-dialog.tsx    # Confirmation with active matters warning
└── client-details-card.tsx     # Expanded view with financial summary
```

#### 1.3 Zod Schema
```typescript
const contactSchema = z.object({
  contact_type: z.enum(['individual', 'company']),
  // Individual fields
  first_name: z.string().min(2).optional(),
  last_name: z.string().min(2).optional(),
  cpf: z.string().optional(),
  // Company fields
  company_name: z.string().optional(),
  cnpj: z.string().optional(),
  // Shared fields
  email: z.string().email().optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  status: z.enum(['prospect', 'active', 'inactive', 'former']),
  preferred_communication: z.enum(['email', 'phone', 'whatsapp', 'mail']),
  // Address
  address_street: z.string().optional(),
  address_city: z.string().optional(),
  address_state: z.string().optional(),
  address_zipcode: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
}).refine(...)  // Conditional: require first_name/last_name for individual, company_name for company
```

#### 1.4 Page — `app/(dashboard)/clients/page.tsx`
- Stats cards: total clients, active, prospects, companies
- Search/filter bar (by name, status, type)
- Table with columns: Name, Type, Status, Email, Phone, Matters count, Actions
- Badge component for status
- Create/Edit/Delete dialogs
- Pagination

### UI Components Needed from Sprint 0
Badge, Textarea, Pagination, SearchInput, Tabs (for individual/company toggle in create form)

---

## Sprint 2 — Tasks Module

**Goal**: Task management with matter linking, assignment, priority, and billing integration.

### Database Support (already exists)
- **Table**: `tasks`
- **Related**: `time_entries` (hours logged against tasks)
- **Enums**: `task_type`, `task_priority`, `task_status`
- **RLS**: `tasks_staff_access`, `tasks_assigned_access`

### Deliverables

#### 2.1 React Query Hooks — `lib/queries/useTasks.ts`
```
useTasks(filters?)      — list with optional filters (status, priority, assigned_to, matter_id)
useTask(id)             — single task with matter + assignee details
useCreateTask()         — create mutation
useUpdateTask()         — update mutation
useDeleteTask()         — delete mutation
useToggleTaskStatus()   — quick toggle complete/pending
```

#### 2.2 Components — `components/tasks/`
```
components/tasks/
├── create-task-dialog.tsx       # Form with matter picker, assignee, priority, dates
├── edit-task-dialog.tsx         # Pre-populated edit
├── delete-task-dialog.tsx       # Confirmation
└── task-status-toggle.tsx       # Quick checkbox toggle for completion
```

#### 2.3 Zod Schema
```typescript
const taskSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  task_type: z.enum(['general', 'deadline', 'court_date', 'client_meeting', 'document_review']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
  due_date: z.string().optional(),        // ISO date
  reminder_date: z.string().optional(),
  matter_id: z.string().uuid().optional(),
  assigned_to: z.string().uuid().optional(),
  is_billable: z.boolean().default(false),
  estimated_hours: z.number().min(0).optional(),
})
```

#### 2.4 Page — `app/(dashboard)/tasks/page.tsx`
- Stats cards: pending, in progress, overdue, completed this week
- Filter bar: status, priority, assigned to, matter
- Table with columns: Title, Type, Priority (badge), Status (badge), Due Date, Matter, Assigned To, Actions
- Color-coded priority badges (urgent=red, high=orange, medium=yellow, low=gray)
- Overdue highlight (red text for past due_date)
- Quick status toggle checkbox per row

### UI Components Needed from Sprint 0
Badge, DatePicker, Checkbox, Pagination, SearchInput

---

## Sprint 3 — Billing Module

**Goal**: Invoice management and time entry tracking. Depends on Clients and Matters.

### Database Support (already exists)
- **Tables**: `invoices`, `invoice_line_items`, `time_entries`
- **Enums**: `invoice_status`, `line_item_type`, `billing_method`
- **RLS**: `invoices_staff_access`, `invoices_client_access`, `invoice_line_items_*`

### Deliverables

#### 3.1 React Query Hooks

**`lib/queries/useInvoices.ts`**
```
useInvoices(filters?)         — list with status/client/matter filters
useInvoice(id)                — single with line items, contact, matter
useCreateInvoice()            — create with line items
useUpdateInvoice()            — update header
useDeleteInvoice()            — delete (draft only)
useUpdateInvoiceStatus()      — status transition (draft→sent→paid)
```

**`lib/queries/useTimeEntries.ts`**
```
useTimeEntries(filters?)      — list with date range/user/matter filters
useCreateTimeEntry()          — log time
useUpdateTimeEntry()          — edit entry
useDeleteTimeEntry()          — delete entry
useUnbilledTimeEntries()      — unbilled entries for invoice creation
```

#### 3.2 Components — `components/billing/`
```
components/billing/
├── create-invoice-dialog.tsx        # Multi-step: header → line items → review
├── edit-invoice-dialog.tsx          # Edit header fields
├── delete-invoice-dialog.tsx        # Only for draft invoices
├── invoice-status-badge.tsx         # Color-coded status
├── invoice-line-item-form.tsx       # Reusable line item row (add/edit/remove)
├── time-entry-dialog.tsx            # Log time entry form
└── time-entry-list.tsx              # Filterable time entry table
```

#### 3.3 Zod Schemas
```typescript
const invoiceSchema = z.object({
  title: z.string().min(3),
  contact_id: z.string().uuid(),
  matter_id: z.string().uuid().optional(),
  issue_date: z.string(),
  due_date: z.string(),
  tax_rate: z.number().min(0).max(100).default(0),
  payment_terms: z.string().optional(),
  notes: z.string().optional(),
})

const lineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().min(0.01),
  rate: z.number().min(0),
  item_type: z.enum(['time', 'expense', 'fee', 'other']),
  service_date: z.string().optional(),
  time_entry_id: z.string().uuid().optional(),
})

const timeEntrySchema = z.object({
  matter_id: z.string().uuid(),
  task_id: z.string().uuid().optional(),
  work_date: z.string(),
  hours: z.number().min(0.1).max(24),
  description: z.string().min(3),
  hourly_rate: z.number().min(0),
  is_billable: z.boolean().default(true),
})
```

#### 3.4 Page — `app/(dashboard)/billing/page.tsx`
- **Tabs**: Faturas (Invoices) | Horas (Time Entries)
- **Invoice tab**:
  - Stats: total revenue, outstanding, overdue, paid this month
  - Table: Invoice #, Client, Matter, Amount, Status (badge), Due Date, Actions
  - Status filter (draft, sent, overdue, paid)
- **Time entries tab**:
  - Stats: hours this week, billable %, unbilled amount
  - Table: Date, Matter, Task, Hours, Rate, Total, Billable?, Actions
  - Quick "Log Time" button

### UI Components Needed from Sprint 0
Badge, Tabs, DatePicker, Pagination, Toast (for status transitions)

---

## Sprint 4 — Documents Module

**Goal**: Document management with file upload, versioning, and access control.

### Database Support (already exists)
- **Table**: `documents`
- **Enums**: `document_access_level`
- **RLS**: `documents_staff_access`, `documents_client_matter_access`, `documents_client_own_access`

### Deliverables

#### 4.1 React Query Hooks — `lib/queries/useDocuments.ts`
```
useDocuments(filters?)     — list with matter/type/category filters
useDocument(id)            — single with version history
useUploadDocument()        — upload to Supabase Storage + create record
useUpdateDocument()        — update metadata
useDeleteDocument()        — delete record + storage file
useDocumentVersions(id)    — version chain via parent_document_id
```

#### 4.2 Supabase Storage Integration — `lib/supabase/storage.ts`
```typescript
uploadFile(file, path)           — upload to storage bucket
downloadFile(path)               — get signed URL
deleteFile(path)                 — remove from storage
getPublicUrl(path)               — public URL generation
```

**Storage path convention**: `{law_firm_id}/{matter_id}/{document_id}/{filename}`

#### 4.3 Components — `components/documents/`
```
components/documents/
├── upload-document-dialog.tsx     # File upload + metadata form
├── edit-document-dialog.tsx       # Edit metadata (name, category, access level)
├── delete-document-dialog.tsx     # Confirmation
├── document-preview.tsx           # Preview/download link
└── document-version-list.tsx      # Version history panel
```

#### 4.4 Zod Schema
```typescript
const documentSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  document_type: z.string(),         // contract, evidence, correspondence, etc.
  category: z.string().optional(),
  access_level: z.enum(['public', 'internal', 'restricted', 'confidential']),
  matter_id: z.string().uuid().optional(),
  contact_id: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
})
```

#### 4.5 Page — `app/(dashboard)/documents/page.tsx`
- Stats: total documents, by access level, recent uploads
- Filter: matter, document type, category, access level
- Table: Name, Type, Matter, Access Level (badge), Size, Uploaded By, Date, Actions
- Upload button (opens file picker dialog)
- Download/preview actions per row

### UI Components Needed from Sprint 0
Badge, FileUpload, SearchInput, Pagination, DropdownMenu

---

## Sprint 5 — Calendar Module

**Goal**: Aggregated calendar view pulling dates from tasks, matters, and invoices. No new tables needed — this is a read-only aggregation layer.

### Data Sources
| Source | Date Fields | Event Type |
|--------|-------------|------------|
| `tasks` | `due_date`, `reminder_date` | Deadlines, court dates, meetings |
| `matters` | `next_court_date`, `opened_date`, `closed_date` | Court hearings, milestones |
| `invoices` | `due_date`, `issue_date` | Payment deadlines |
| `pipeline_cards` | `next_follow_up_date` | Follow-ups (post-Sprint 8) |

### Deliverables

#### 5.1 React Query Hooks — `lib/queries/useCalendarEvents.ts`
```
useCalendarEvents(dateRange, filters?)  — aggregated events from all sources
```

This hook fetches from multiple tables and normalizes into a unified `CalendarEvent` type:
```typescript
interface CalendarEvent {
  id: string
  title: string
  date: string
  type: 'task' | 'court_date' | 'invoice_due' | 'follow_up' | 'milestone'
  source_table: string
  source_id: string
  color: string          // Derived from type
  matter_id?: string
  matter_title?: string
  priority?: string
}
```

#### 5.2 Components — `components/calendar/`
```
components/calendar/
├── calendar-grid.tsx            # Monthly grid view
├── calendar-day-cell.tsx        # Single day with event dots
├── calendar-event-list.tsx      # Day detail: list of events
├── calendar-header.tsx          # Month navigation + view toggles
└── event-detail-popover.tsx     # Click event to see details / navigate to source
```

#### 5.3 Page — `app/(dashboard)/calendar/page.tsx`
- Monthly grid view (default)
- Color-coded event dots by type
- Click day to see event list
- Click event to navigate to source (matter, task, invoice)
- Month navigation (prev/next)
- Filter by event type, matter, assigned user

### UI Components Needed from Sprint 0
Badge, DatePicker (for month navigation)

### Implementation Note
No CRUD dialogs — events are managed in their source modules (Tasks, Matters, Billing). Calendar is view-only with navigation links.

---

## Sprint 6 — Settings & Admin

**Goal**: Firm configuration (Settings) and user management (Admin) share infrastructure.

### 6A. Settings — `app/(dashboard)/settings/page.tsx`

#### Tabs Layout
1. **Escritório** (Firm) — Name, CNPJ, OAB, address, contact, logo, colors
2. **Tipos de Processo** (Matter Types) — CRUD list of practice areas with default rates
3. **Equipe** (Team) — Read-only team roster (admin manages in Admin panel)
4. **Assinatura** (Subscription) — Plan info, features, trial status

#### React Query Hooks — `lib/queries/useSettings.ts`
```
useLawFirm()                  — current firm details
useUpdateLawFirm()            — update firm settings
useMatterTypes()              — list matter types
useCreateMatterType()         — add practice area
useUpdateMatterType()         — edit practice area
useDeleteMatterType()         — remove practice area
```

#### Components — `components/settings/`
```
components/settings/
├── firm-settings-form.tsx          # Firm details form
├── matter-type-dialog.tsx          # Create/edit matter type
├── delete-matter-type-dialog.tsx   # Confirmation
└── subscription-card.tsx           # Plan info display
```

### 6B. Admin — `app/(dashboard)/admin/page.tsx`

#### Tabs Layout
1. **Usuários** (Users) — CRUD for team members (lawyers, staff, clients)
2. **Logs de Atividade** (Activity Logs) — Audit trail viewer
3. **Pipeline** (Pipeline Stages) — Configure intake/CRM pipeline stages

#### React Query Hooks — `lib/queries/useAdmin.ts`
```
useUsers(filters?)            — list firm users
useCreateUser()               — invite/create user
useUpdateUser()               — edit user role/status
useDeactivateUser()           — soft deactivate
useActivityLogs(filters?)     — paginated audit logs
usePipelineStages()           — list pipeline stages
useCreatePipelineStage()      — add stage
useUpdatePipelineStage()      — edit stage
useDeletePipelineStage()      — remove stage
```

#### Components — `components/admin/`
```
components/admin/
├── create-user-dialog.tsx          # Invite user form
├── edit-user-dialog.tsx            # Edit role/permissions
├── deactivate-user-dialog.tsx      # Confirmation (not delete)
├── activity-log-table.tsx          # Filterable log viewer
├── pipeline-stage-dialog.tsx       # Create/edit stage
└── delete-stage-dialog.tsx         # Confirmation
```

### Access Control
- Settings: accessible to admin and staff (read) / admin (write)
- Admin: accessible to admin only (enforce in page component + middleware)

### UI Components Needed from Sprint 0
Tabs, Badge, Pagination, Toast, SearchInput

---

## Sprint 7 — Reports Module

**Goal**: Analytics dashboards with read-only aggregated data. No CRUD — purely visualization.

### Report Categories

#### 7.1 Financial Dashboard
- Revenue this month/quarter/year (from invoices where status = 'paid')
- Outstanding receivables (invoices where status IN ('sent', 'overdue'))
- Invoice aging chart (0-30, 31-60, 61-90, 90+ days)
- Revenue by practice area (join invoices → matters → matter_types)
- Revenue by lawyer (join invoices → matters → assigned_lawyer)
- Billable vs non-billable hours (from time_entries)

#### 7.2 Matters Dashboard
- Active matters by status (pie/bar chart)
- Matters by practice area
- Matters opened vs closed per month (trend line)
- Average duration by practice area
- Matters by priority distribution

#### 7.3 Team Productivity
- Hours logged per team member per week/month
- Billable ratio per team member
- Tasks completed vs pending per team member
- Average response time (from messages, if implemented)

#### 7.4 Client Analytics
- Client acquisition over time (contacts.created_at)
- Active vs inactive clients
- Revenue per client (top 10)
- Matters per client

### Deliverables

#### React Query Hooks — `lib/queries/useReports.ts`
```
useFinancialReport(dateRange)     — revenue, outstanding, aging
useMatterReport(dateRange)        — matter stats
useTeamReport(dateRange)          — team productivity
useClientReport(dateRange)        — client metrics
```

#### Components — `components/reports/`
```
components/reports/
├── financial-dashboard.tsx         # Revenue cards + charts
├── matter-dashboard.tsx            # Matter stats + charts
├── team-dashboard.tsx              # Team productivity
├── client-dashboard.tsx            # Client analytics
├── stat-card.tsx                   # Reusable metric card (value + trend)
└── date-range-picker.tsx           # Period selector
```

#### Page — `app/(dashboard)/reports/page.tsx`
- Tabs: Financeiro | Processos | Equipe | Clientes
- Each tab renders its dashboard component
- Date range picker (this month, last month, quarter, year, custom)
- Stat cards at top, charts below

### Chart Library
Add `recharts` (lightweight, React-native) for:
- Bar charts (revenue by month, matters by type)
- Line charts (trends over time)
- Pie/donut charts (status distribution)
- Area charts (cumulative revenue)

### New Dependency
```bash
npm install recharts
```

### UI Components Needed from Sprint 0
Tabs, DatePicker, Badge, SkeletonLoader

---

## Sprint 8 — Pipeline / CRM

**Goal**: Visual kanban pipeline for prospect/lead tracking.

### Database Support (already exists)
- **Tables**: `pipeline_stages`, `pipeline_cards`
- **Enums**: `pipeline_stage_type`
- **RLS**: `pipeline_stages_staff_access`, `pipeline_cards_staff_access`

### Deliverables

#### React Query Hooks — `lib/queries/usePipeline.ts`
```
usePipelineStages()              — ordered stages list
usePipelineCards(stageId?)       — cards with contact + matter info
useCreatePipelineCard()          — new prospect
useUpdatePipelineCard()          — edit / move between stages
useDeletePipelineCard()          — remove card
useMovePipelineCard()            — optimistic stage change (drag-drop)
```

#### Components — `components/pipeline/`
```
components/pipeline/
├── pipeline-board.tsx              # Kanban board container
├── pipeline-column.tsx             # Single stage column
├── pipeline-card.tsx               # Prospect card
├── create-card-dialog.tsx          # New prospect form
├── edit-card-dialog.tsx            # Edit prospect details
├── delete-card-dialog.tsx          # Confirmation
└── card-detail-panel.tsx           # Expanded card view
```

#### Page — new route `app/(dashboard)/pipeline/page.tsx`
- Horizontal kanban board (stages as columns)
- Cards show: contact name, matter type, expected value, follow-up date
- Drag-and-drop between stages (or button-based move)
- Click card for detail panel
- Filter by contact, expected value range, date

### Sidebar Update
Add "Pipeline" to `components/layout/sidebar.tsx` and `mobile-menu.tsx` navigation items.

### Middleware Update
Add `/pipeline` to protected paths in `middleware.ts`.

### New Dependency (optional)
```bash
npm install @hello-pangea/dnd    # Drag-and-drop library (maintained fork of react-beautiful-dnd)
```

---

## Sprint 9 — Portals (Client + Staff)

**Goal**: Separate authenticated experiences for clients and staff with limited scope views.

### 9A. Client Portal — `app/portal/client/page.tsx`

#### Layout — `app/portal/layout.tsx`
Replace placeholder with proper portal navigation:
- Simplified header (firm logo, client name, logout)
- No sidebar — tab-based navigation
- Responsive mobile layout

#### Tabs
1. **Meus Processos** — Matters linked via `matter_contacts`
2. **Documentos** — Documents from their matters (public/internal access_level)
3. **Faturas** — Invoices where `contact_id` matches
4. **Mensagens** — Chat thread with firm (from `messages`)
5. **Meu Perfil** — View/edit own contact info

#### React Query Hooks — `lib/queries/useClientPortal.ts`
```
useMyMatters()              — matters via matter_contacts + auth.uid
useMyDocuments()            — documents from my matters
useMyInvoices()             — invoices for my contact
useMyMessages()             — messages where participant
useMyProfile()              — own contact record
useUpdateMyProfile()        — self-update
```

#### Components — `components/portal/client/`
```
components/portal/client/
├── client-matters-list.tsx        # Read-only matter cards
├── client-documents-list.tsx      # Download-only document list
├── client-invoices-list.tsx       # Invoice status + download
├── client-messages.tsx            # Simple chat interface
└── client-profile-form.tsx        # Edit own info
```

### 9B. Staff Portal — `app/portal/staff/page.tsx`

#### Layout
- Simplified header (firm logo, staff name, link to full dashboard, logout)
- Tab-based for quick access

#### Tabs
1. **Meu Painel** — Dashboard: my assigned matters, my tasks today, hours this week
2. **Minhas Tarefas** — Tasks filtered to assigned_to = current user
3. **Registrar Horas** — Quick time entry form
4. **Mensagens** — Client messages

#### React Query Hooks — `lib/queries/useStaffPortal.ts`
```
useMyAssignedMatters()       — matters where assigned_lawyer = auth.uid
useMyTasks()                 — tasks where assigned_to = auth.uid
useMyTimeEntries(dateRange)  — time entries by current user
useQuickLogTime()            — simplified time entry creation
```

#### Components — `components/portal/staff/`
```
components/portal/staff/
├── staff-dashboard.tsx            # Summary cards + quick actions
├── my-tasks-list.tsx              # Filtered task list with toggle
├── quick-time-entry.tsx           # Minimal time entry form
└── my-matters-summary.tsx         # Assigned matters overview
```

### Access Control
- Client portal: `user_type = 'client'` — RLS enforces data scope
- Staff portal: `user_type IN ('admin', 'lawyer', 'staff')` — convenience view, not a restriction
- Full dashboard remains accessible to all staff roles

---

## Implementation Pattern Per Feature

Every CRUD module follows this exact pattern:

### 1. React Query Hooks File
```
lib/queries/use{Entity}.ts
├── use{Entities}(filters?)        → useQuery(['entities'], ...)
├── use{Entity}(id)                → useQuery(['entities', id], ...)
├── useCreate{Entity}()            → useMutation + invalidateQueries
├── useUpdate{Entity}()            → useMutation + invalidateQueries (list + item)
└── useDelete{Entity}()            → useMutation + invalidateQueries
```

### 2. Component Files
```
components/{entity}/
├── create-{entity}-dialog.tsx     → useForm + zodResolver + createMutation
├── edit-{entity}-dialog.tsx       → useForm + useEffect populate + updateMutation
├── delete-{entity}-dialog.tsx     → confirmation + deleteMutation
└── (optional detail/list components)
```

### 3. Page File
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

### 4. Validation
```
Zod schema per entity matching database columns
├── Required fields with min length
├── Optional fields
├── Enum fields with z.enum()
├── UUID fields with z.string().uuid()
└── Conditional validation with .refine() where needed
```

---

## New Dependencies Summary

| Package | Sprint | Purpose |
|---------|--------|---------|
| `recharts` | 7 (Reports) | Chart library for analytics dashboards |
| `@hello-pangea/dnd` | 8 (Pipeline) | Drag-and-drop for kanban board (optional) |

---

## Files Modified Across Sprints

| File | Changes |
|------|---------|
| `components/ui/index.ts` | Add barrel exports for new UI components |
| `components/providers.tsx` | Add Toast context provider |
| `components/layout/sidebar.tsx` | Add Pipeline nav item |
| `components/layout/mobile-menu.tsx` | Add Pipeline nav item |
| `middleware.ts` | Add `/pipeline` to protected paths |
| `app/portal/layout.tsx` | Replace placeholder with portal navigation |
| `package.json` | Add recharts, @hello-pangea/dnd |

---

## Execution Order Summary

| Sprint | Module | Type | Est. Files | Depends On |
|--------|--------|------|------------|------------|
| 0 | Shared UI Components | Infrastructure | ~12 | — |
| 1 | Clients | CRUD | ~6 | Sprint 0 |
| 2 | Tasks | CRUD | ~6 | Sprint 0 |
| 3 | Billing | CRUD | ~10 | Sprint 0, 1 |
| 4 | Documents | CRUD + Storage | ~8 | Sprint 0 |
| 5 | Calendar | Read-only View | ~6 | Sprint 0, 2, 3 |
| 6 | Settings & Admin | CRUD + Config | ~14 | Sprint 0 |
| 7 | Reports | Read-only View | ~8 | Sprint 0, all CRUD |
| 8 | Pipeline / CRM | CRUD + Kanban | ~9 | Sprint 0 |
| 9 | Portals | Read-only + Limited CRUD | ~12 | All previous |

**Total estimated new files: ~91**

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
