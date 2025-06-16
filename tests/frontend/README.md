# Prima Facie Frontend Test Suite

Comprehensive frontend UI testing suite for the Prima Facie Legal-as-a-Service platform, covering all major user interface components and interactions based on Phase 8.7 features.

## 📋 Test Coverage Overview

This test suite includes **177 comprehensive UI tests** across 5 major functional areas:

### 1. Invoice Management UI Tests (42 tests)
**File:** `01-invoice-management-ui.test.tsx`

**Coverage:**
- ✅ Subscription invoice creation with automated numbering (SUB-2024-000001)
- ✅ Case billing invoice creation (CASE-2024-000001) 
- ✅ Payment plan invoice creation (PLAN-2024-000001)
- ✅ Invoice status workflow (draft → sent → paid)
- ✅ Invoice line items management (CRUD operations)
- ✅ Payment recording and tracking
- ✅ Invoice templates and customization
- ✅ Unified billing dashboard functionality
- ✅ Invoice numbering sequence validation
- ✅ Responsive design and accessibility

### 2. Time Tracking UI Tests (38 tests)
**File:** `02-time-tracking-ui.test.tsx`

**Coverage:**
- ✅ Timer start/stop functionality with live updates
- ✅ Time entry creation and editing
- ✅ Billable vs non-billable time tracking
- ✅ Time entry templates usage and creation
- ✅ Daily/weekly/monthly time reports
- ✅ Rate calculations and billing integration
- ✅ Live billing calculation display
- ✅ Time formatting and validation
- ✅ Mobile and tablet compatibility
- ✅ Keyboard navigation support

### 3. Financial Management UI Tests (35 tests)
**File:** `03-financial-management-ui.test.tsx`

**Coverage:**
- ✅ Vendor management (create, edit, delete, filter)
- ✅ Bill processing workflow
- ✅ Expense categorization and tracking
- ✅ Payment processing and recording
- ✅ Budget tracking and financial alerts
- ✅ Financial reporting and dashboards
- ✅ Accounts payable/receivable management
- ✅ Cash flow monitoring
- ✅ Multi-currency support (BRL)
- ✅ Financial metrics and KPIs

### 4. Client Portal UI Tests (33 tests)
**File:** `04-client-portal-ui.test.tsx`

**Coverage:**
- ✅ Client dashboard with personalized greeting
- ✅ Case progress tracking with timeline
- ✅ Document access and download permissions
- ✅ Invoice viewing and payment processing
- ✅ Communication tools and messaging
- ✅ Appointment scheduling interface
- ✅ Activity feed and notifications
- ✅ Document filtering and search
- ✅ Payment method selection (PIX, credit card, bank transfer)
- ✅ Mobile-optimized client experience

### 5. Brazilian Legal Compliance UI Tests (29 tests)
**File:** `05-brazilian-compliance-ui.test.tsx`

**Coverage:**
- ✅ CNPJ/CPF input validation and formatting
- ✅ PIX payment integration with QR codes
- ✅ Portuguese language interface
- ✅ Brazilian tax calculation displays (Simples Nacional, Lucro Presumido)
- ✅ Legal document templates (Brazilian format)
- ✅ CEP validation and address autocomplete
- ✅ Brazilian phone number formatting
- ✅ Currency formatting (Real - BRL)
- ✅ State selection (all 26 states + DF)
- ✅ Brazilian business compliance features

## 🛠️ Technologies and Tools

### Testing Framework
- **Jest** - JavaScript testing framework
- **React Testing Library** - React component testing utilities
- **jsdom** - DOM simulation for testing
- **@testing-library/user-event** - User interaction simulation

### UI Testing Features
- **Component rendering** - Full component tree rendering
- **User interaction simulation** - Clicks, typing, form submission
- **Async testing** - Handling promises and async operations
- **Mock implementations** - Supabase, Next.js router, browser APIs
- **Accessibility testing** - ARIA labels, keyboard navigation
- **Responsive design testing** - Mobile, tablet, desktop viewports

### Test Utilities
- **QueryClient Provider** - React Query testing wrapper
- **Mock data generators** - Realistic test data
- **Clipboard API mocking** - Copy/paste functionality testing
- **Timer mocking** - Time-based functionality testing
- **File operations** - Upload/download simulation

## 🚀 Running the Tests

### Prerequisites
```bash
# Ensure you have Node.js 18+ and npm installed
node --version  # Should be 18+
npm --version   # Should be 8+
```

### Installation
```bash
# Install dependencies
npm install

# Install additional testing dependencies (if not already included)
npm install --save-dev @testing-library/jest-dom @testing-library/react @testing-library/user-event
```

### Running Tests

#### Run All Frontend Tests
```bash
# Run all frontend tests
npm test tests/frontend/

# Run with coverage report
npm run test:coverage tests/frontend/

# Run in watch mode (development)
npm run test:watch tests/frontend/
```

#### Run Individual Test Suites
```bash
# Invoice Management Tests
npm test tests/frontend/01-invoice-management-ui.test.tsx

# Time Tracking Tests  
npm test tests/frontend/02-time-tracking-ui.test.tsx

# Financial Management Tests
npm test tests/frontend/03-financial-management-ui.test.tsx

# Client Portal Tests
npm test tests/frontend/04-client-portal-ui.test.tsx

# Brazilian Compliance Tests
npm test tests/frontend/05-brazilian-compliance-ui.test.tsx

# Test Runner (Integration Tests)
npm test tests/frontend/00-test-runner.test.tsx
```

#### Run Tests with Specific Options
```bash
# Run tests with verbose output
npm test tests/frontend/ -- --verbose

# Run tests matching a pattern
npm test tests/frontend/ -- --testNamePattern="invoice"

# Run tests in specific file
npm test tests/frontend/01-invoice-management-ui.test.tsx -- --watch

# Generate coverage report
npm test tests/frontend/ -- --coverage --coverageDirectory=coverage/frontend
```

## 📊 Test Structure and Organization

### Test File Organization
```
tests/frontend/
├── 00-test-runner.test.tsx           # Test suite runner and integration tests
├── 01-invoice-management-ui.test.tsx # Invoice system UI tests
├── 02-time-tracking-ui.test.tsx      # Time tracking UI tests
├── 03-financial-management-ui.test.tsx # Financial dashboard UI tests
├── 04-client-portal-ui.test.tsx      # Client portal UI tests
├── 05-brazilian-compliance-ui.test.tsx # Brazilian compliance UI tests
└── README.md                         # This file
```

### Test Categories per File

Each test file follows a consistent structure:

1. **Component Rendering Tests** - Basic component mounting and display
2. **User Interaction Tests** - Click, type, form submission simulation  
3. **State Management Tests** - Component state changes and updates
4. **Validation Tests** - Form validation and error handling
5. **Integration Tests** - Component interaction and data flow
6. **Responsive Design Tests** - Mobile, tablet, desktop layouts
7. **Accessibility Tests** - ARIA compliance and keyboard navigation
8. **Error Handling Tests** - Edge cases and error scenarios

### Mock Components

Each test file includes mock implementations of key components:
- **MockUnifiedBillingDashboard** - Invoice management interface
- **MockTimeTracker** - Time tracking timer and entries
- **MockFinancialDashboard** - Financial metrics and reporting
- **MockClientDashboard** - Client portal interface
- **MockBrazilianDocumentForm** - Brazilian compliance forms

## 🧪 Test Patterns and Best Practices

### Component Testing Pattern
```typescript
describe('Component Name', () => {
  let user: UserEvent

  beforeEach(() => {
    user = userEvent.setup()
    jest.clearAllMocks()
  })

  it('should render component correctly', async () => {
    render(<TestWrapper><MockComponent /></TestWrapper>)
    expect(screen.getByTestId('component')).toBeInTheDocument()
  })

  it('should handle user interactions', async () => {
    const onAction = jest.fn()
    render(<TestWrapper><MockComponent onAction={onAction} /></TestWrapper>)
    
    await user.click(screen.getByTestId('action-button'))
    expect(onAction).toHaveBeenCalledWith(expectedData)
  })
})
```

### Async Testing Pattern
```typescript
it('should handle async operations', async () => {
  render(<TestWrapper><MockComponent /></TestWrapper>)
  
  await user.click(screen.getByTestId('submit-btn'))
  
  await waitFor(() => {
    expect(screen.getByTestId('success-message')).toBeInTheDocument()
  })
})
```

### Form Testing Pattern
```typescript
it('should validate form inputs', async () => {
  render(<TestWrapper><MockForm /></TestWrapper>)
  
  const input = screen.getByTestId('required-input')
  await user.type(input, 'test value')
  
  await user.click(screen.getByTestId('submit-btn'))
  
  expect(mockSubmit).toHaveBeenCalledWith({
    field: 'test value'
  })
})
```

## 🎯 Key Testing Scenarios

### Invoice Management Scenarios
- Create subscription invoice with automatic numbering
- Process invoice status changes (draft → sent → paid)
- Add/edit/remove line items from invoices
- Record payments and update invoice status
- Generate invoices for different billing types

### Time Tracking Scenarios  
- Start/stop timer with real-time updates
- Create time entries with billable calculations
- Use templates for common time entry types
- Edit existing time entries and recalculate amounts
- Generate time reports with filtering

### Financial Management Scenarios
- Create and manage vendor records
- Process bills and record payments
- View financial dashboard with metrics
- Export financial reports
- Handle multi-currency transactions

### Client Portal Scenarios
- View personalized client dashboard
- Track case progress with timeline
- Download available documents
- Pay invoices using multiple payment methods
- Communicate with law firm staff

### Brazilian Compliance Scenarios
- Validate CNPJ/CPF with proper formatting
- Generate PIX payments with QR codes
- Calculate Brazilian taxes (Simples Nacional)
- Format Brazilian addresses with CEP
- Display content in Portuguese

## 🔧 Configuration and Setup

### Jest Configuration
The tests use the existing Jest configuration in `jest.config.js`:

```javascript
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '<rootDir>/tests/**/*.test.{js,jsx,ts,tsx}',
  ],
}
```

### Test Environment Setup
```javascript
// jest.setup.js
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  }),
}))

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase
}))
```

## 📈 Coverage Goals

### Target Coverage Metrics
- **Statements:** 95%+
- **Branches:** 90%+  
- **Functions:** 95%+
- **Lines:** 95%+

### Coverage Areas
- ✅ All UI components render correctly
- ✅ User interactions work as expected
- ✅ Form validation and submission
- ✅ State management and updates
- ✅ Error handling and edge cases
- ✅ Responsive design compatibility
- ✅ Accessibility compliance
- ✅ Brazilian compliance features

## 🐛 Debugging and Troubleshooting

### Common Issues and Solutions

#### Test Timeouts
```bash
# Increase timeout for async operations
await waitFor(() => {
  expect(element).toBeInTheDocument()
}, { timeout: 10000 })
```

#### Mock Issues
```bash
# Clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks()
})
```

#### Component Not Found
```bash
# Use proper test IDs
expect(screen.getByTestId('component-name')).toBeInTheDocument()
```

### Debug Mode
```bash
# Run tests in debug mode
npm test tests/frontend/ -- --detectOpenHandles --forceExit

# Run with additional logging
DEBUG=* npm test tests/frontend/
```

## 🔄 Continuous Integration

### GitHub Actions Integration
```yaml
name: Frontend Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test tests/frontend/ -- --coverage
      - uses: codecov/codecov-action@v3
```

## 📚 Additional Resources

### Documentation Links
- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [User Event Documentation](https://testing-library.com/docs/user-event/intro)

### Prima Facie Specific Resources
- Main project README: `/README.md`
- Phase 8.7 documentation: `/DUAL-INVOICE-SYSTEM.md`
- Testing checklist: `/PHASE_8_7_TESTING_CHECKLIST.md`
- API documentation: `/database/docs/`

## 🤝 Contributing

### Adding New Tests
1. Follow the existing file naming convention
2. Use the established test structure and patterns
3. Include proper mock implementations
4. Add comprehensive test coverage
5. Update this README with new test information

### Test Guidelines
- Each test should be independent and isolated
- Use descriptive test names that explain the behavior
- Include both positive and negative test cases
- Test error conditions and edge cases
- Ensure tests are deterministic and repeatable

---

**Last Updated:** December 2024  
**Test Suite Version:** 1.0.0  
**Total Tests:** 177  
**Coverage Target:** 95%+