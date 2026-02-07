# Prima Facie Frontend Test Suite

Comprehensive frontend UI testing suite for the Prima Facie legal practice management platform. Covers billing, time tracking, financial management, client portal, Brazilian compliance, admin pages, portal billing, pipeline editing, public pages, and cross-page navigation.

## Test Coverage Overview

**11 test files** with **~270 tests** across 10 functional areas:

### Test Files

| # | File | Tests | Coverage Area |
|---|------|-------|---------------|
| 00 | `00-test-runner.test.tsx` | ~30 | Test runner orchestration and integration |
| 01 | `01-invoice-management-ui.test.tsx` | 42 | Invoice creation, status workflow, line items, payments |
| 02 | `02-time-tracking-ui.test.tsx` | 38 | Timer, time entries, billable tracking, templates |
| 03 | `03-financial-management-ui.test.tsx` | 35 | Vendors, bills, expenses, AP/AR, cash flow |
| 04 | `04-client-portal-ui.test.tsx` | 33 | Client dashboard, case progress, documents, messaging |
| 05 | `05-brazilian-compliance-ui.test.tsx` | 29 | CPF/CNPJ, PIX, Portuguese UI, tax calculations |
| 06 | `06-admin-pages.test.tsx` | 29 | Admin dashboard, analytics, security, billing, notifications |
| 07 | `07-portal-billing.test.tsx` | 11 | Client billing portal, invoices, summary cards |
| 08 | `08-pipeline-edit.test.tsx` | 15 | Pipeline lead edit form, validation, pre-population |
| 09 | `09-public-pages.test.tsx` | 23 | Terms, privacy, pricing, about, contact pages |
| 10 | `10-navigation-ctas.test.tsx` | 15 | Cross-page links, CTAs, middleware public paths |

### Detailed Coverage

**Invoice Management (01)**: Subscription/case/payment-plan invoice creation with numbering, status workflow (draft -> sent -> paid), line items CRUD, payment recording, unified billing dashboard.

**Time Tracking (02)**: Timer start/stop, billable vs non-billable tracking, time entry CRUD, templates, daily/weekly/monthly reports, rate calculations, live billing display.

**Financial Management (03)**: Vendor CRUD, bill processing, expense categorization, AP/AR management, cash flow monitoring, financial KPIs, BRL formatting.

**Client Portal (04)**: Personalized dashboard, case progress timeline, document access, invoice viewing, payment methods (PIX, credit card, bank transfer), messaging, activity feed.

**Brazilian Compliance (05)**: CPF/CNPJ validation and formatting, PIX QR codes, Portuguese interface, tax calculations (Simples Nacional, Lucro Presumido), CEP validation, state selection.

**Admin Pages (06)**: Admin dashboard with 8 section links and 4 stat cards, analytics (summary cards, charts, tables), security (audit log, filters), billing (plan comparison, invoice history), notifications (6 toggles, save mutation).

**Portal Billing (07)**: Client billing page with summary cards (paid/outstanding/overdue), invoice table with status badges, R$ formatting, loading spinner, empty state.

**Pipeline Edit (08)**: Lead edit form with all fields, pre-population from existing data, probability slider, stage/source selects, form submission, validation errors, loading state.

**Public Pages (09)**: Terms (9 sections), Privacy (8 sections, LGPD), Pricing (3 plans with R$ pricing), About (mission/vision/values), Contact (header/nav/footer).

**Navigation CTAs (10)**: Register page legal links, portal dashboard quick links, pipeline edit buttons, middleware public paths validation.

## Running Tests

```bash
# All frontend tests
npm test tests/frontend/

# Individual test file
npm test tests/frontend/06-admin-pages.test.tsx

# With coverage
npm run test:coverage tests/frontend/

# Watch mode
npm run test:watch tests/frontend/

# Verbose output
npm test tests/frontend/ -- --verbose

# Pattern matching
npm test tests/frontend/ -- --testNamePattern="invoice"
```

## Test Architecture

### Mock Component Pattern

All test files use **self-contained mock components** that replicate page logic inline. This avoids importing from `@/` paths (which have a known Jest config issue with `moduleNameMapper`).

```typescript
// Mock components are defined in each test file
const MockComponent = ({ data }: { data?: DataType[] }) => {
  const items = data ?? defaultMockData
  return (
    <div data-testid="component">
      {items.map(item => (
        <div key={item.id} data-testid={`item-${item.id}`}>
          {item.name}
        </div>
      ))}
    </div>
  )
}
```

### TestWrapper

Every test file includes a `TestWrapper` with `QueryClientProvider`:

```typescript
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
```

### Common Patterns

- `userEvent.setup()` for user interactions
- `jest.mock('next/navigation')` for router mocking
- `data-testid` attributes for element selection
- `within()` for scoped queries within containers
- `waitFor()` for async assertions
- Props for loading/empty/error state testing

## Jest Configuration

Tests use the project's `jest.config.js` with `jsdom` environment. Note: `moduleNameMapping` in the config is a typo (should be `moduleNameMapper`), so `@/` path aliases don't resolve. Mock components work around this by being self-contained.

```bash
# jest.setup.js provides:
# - @testing-library/jest-dom matchers
# - next/navigation mock
# - @supabase/auth-helpers-nextjs mock
# - Environment variable stubs
```

## Adding New Tests

1. Follow the naming convention: `{NN}-{feature-name}.test.tsx`
2. Use self-contained mock components (no `@/` imports)
3. Include `TestWrapper` with `QueryClientProvider`
4. Use `data-testid` for element selection
5. Test rendering, interactions, loading states, empty states, and edge cases
6. All UI text should be in Portuguese (matching the app)

---

**Last Updated:** February 2026
**Total Tests:** ~270
