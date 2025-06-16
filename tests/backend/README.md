# Prima Facie Backend API Test Suite

This comprehensive test suite covers all aspects of the Prima Facie Legal-as-a-Service platform backend API, including invoicing, time tracking, financial management, Brazilian compliance, and payment processing.

## Test Structure

```
tests/backend/
├── api/                           # API endpoint tests
│   ├── authentication.test.ts    # Auth & authorization tests
│   ├── brazilian-compliance.test.ts # CPF/CNPJ validation, tax calc
│   ├── error-handling-validation.test.ts # Input validation & errors
│   ├── financial-management.test.ts # Bills, vendors, payments
│   ├── invoices.test.ts          # Invoice CRUD & workflow
│   ├── payment-processing.test.ts # PIX, cards, bank transfers
│   └── time-tracking.test.ts     # Time entries & timer features
├── integration/                   # Integration tests
│   └── supabase-integration.test.ts # Database & real-time tests
├── utils/                        # Test utilities
│   ├── api-client.ts            # HTTP client for API testing
│   └── test-helpers.ts          # Common test utilities
├── test-config.ts               # Test configuration
└── README.md                    # This file
```

## Test Categories

### 1. Invoice Management Tests (`invoices.test.ts`)
- **CRUD Operations**: Create, read, update, delete invoices
- **Invoice Types**: Subscription, case billing, time-based, payment plans
- **Workflow**: Send invoices, record payments, status transitions
- **Generation**: Automated invoice generation from templates
- **Validation**: Business rules, data integrity, constraints

### 2. Time Tracking Tests (`time-tracking.test.ts`)
- **Time Entries**: CRUD operations for time tracking
- **Timer Functionality**: Start, pause, resume, stop timers
- **Billing Integration**: Billable hours, rate calculations
- **Templates**: Time entry templates and reuse
- **Dashboard**: Time tracking analytics and reporting

### 3. Financial Management Tests (`financial-management.test.ts`)
- **Vendor Management**: CRUD for vendors and suppliers
- **Bills (AP)**: Accounts payable, approval workflows
- **Payments**: Bill payments, partial payments, tracking
- **Reporting**: Cash flow, aging reports, budget analysis
- **Alerts**: Overdue notifications, budget warnings

### 4. Authentication & Authorization Tests (`authentication.test.ts`)
- **User Authentication**: Login, logout, token refresh
- **Role-Based Access**: Admin, lawyer, assistant permissions
- **Session Management**: Concurrent sessions, timeouts
- **Security**: Rate limiting, input validation, audit logs
- **Profile Management**: User profiles, password changes

### 5. Brazilian Compliance Tests (`brazilian-compliance.test.ts`)
- **CPF Validation**: Format, check digits, blacklist
- **CNPJ Validation**: Format, check digits, duplicates
- **Tax Calculations**: ICMS, ISS, PIS/COFINS, Simples Nacional
- **Address Validation**: CEP, state codes, ViaCEP integration
- **Legal Documents**: OAB validation, case classifications

### 6. Payment Processing Tests (`payment-processing.test.ts`)
- **PIX Payments**: QR codes, all key types, confirmations
- **Credit Cards**: Processing, installments, 3DS, tokenization
- **Bank Transfers**: TED, DOC, validation, instructions
- **Gateway Integration**: Multiple gateways, failover, webhooks
- **Security**: Fraud detection, velocity checks, validation

### 7. Error Handling Tests (`error-handling-validation.test.ts`)
- **Input Validation**: Data types, formats, constraints
- **HTTP Errors**: 4xx client errors, 5xx server errors
- **Business Logic**: Domain-specific validation rules
- **Edge Cases**: Boundary testing, null values, unicode
- **Concurrent Access**: Race conditions, data consistency

### 8. Supabase Integration Tests (`supabase-integration.test.ts`)
- **Database Operations**: CRUD, transactions, constraints
- **RLS Policies**: Row-level security enforcement
- **Real-time Features**: Live updates, presence tracking
- **Performance**: Query optimization, indexing
- **Functions & Triggers**: Business logic enforcement

## Running Tests

### Prerequisites

1. **Node.js Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   ```bash
   # Copy and configure environment variables
   cp .env.example .env.test
   ```

3. **Test Database**:
   ```bash
   # Set up test database (if using separate instance)
   npm run setup:test-db
   ```

### Running All Tests

```bash
# Run complete test suite
npm run test:backend

# Run with coverage
npm run test:backend:coverage

# Run in watch mode
npm run test:backend:watch
```

### Running Specific Test Suites

```bash
# Invoice management tests
npm test tests/backend/api/invoices.test.ts

# Authentication tests
npm test tests/backend/api/authentication.test.ts

# Brazilian compliance tests
npm test tests/backend/api/brazilian-compliance.test.ts

# Integration tests
npm test tests/backend/integration/

# All API tests
npm test tests/backend/api/
```

### Running Tests by Pattern

```bash
# Run all invoice-related tests
npm test -- --testNamePattern="invoice"

# Run all authentication tests
npm test -- --testNamePattern="auth"

# Run error handling tests
npm test -- --testNamePattern="error|validation"
```

## Test Configuration

The test suite uses comprehensive configuration in `test-config.ts`:

- **Environment Settings**: API URLs, database connections
- **Test Data**: Predefined entities for consistent testing
- **Authentication**: Test users with different permission levels
- **Performance Thresholds**: Response time and throughput limits
- **Brazilian Data**: Valid CPF/CNPJ numbers, bank codes
- **Payment Methods**: Test credit cards, PIX keys

## Test Data Management

### Test Isolation
- Each test suite uses isolated test data
- Database is cleaned between test runs
- Transactions are rolled back after tests

### Seeding Test Data
```typescript
// Tests automatically seed required data
const setup = await setupTestDatabase()
const testData = setup.testData

// Access predefined test entities
const testClient = testData.client
const testMatter = testData.matter
```

### Cleanup
```typescript
// Automatic cleanup after all tests
afterAll(async () => {
  await cleanupTestDatabase()
})
```

## Mock Services

The test suite includes mocks for external services:

### Payment Gateways
```typescript
// Mock payment gateway responses
nock('https://api.paymentgateway.com')
  .post('/v1/transactions')
  .reply(200, { status: 'approved' })
```

### Brazilian Services
```typescript
// Mock ViaCEP address lookup
nock('https://viacep.com.br')
  .get('/ws/01310100/json/')
  .reply(200, { logradouro: 'Avenida Paulista' })
```

## Performance Testing

### Load Testing
```bash
# Run performance tests
npm run test:load

# Test specific endpoints under load
npm test -- --testNamePattern="performance|load"
```

### Metrics Tracked
- API response times
- Database query performance
- Concurrent request handling
- Memory usage
- Error rates under load

## Security Testing

### Input Validation
- SQL injection attempts
- XSS payload filtering
- CSRF token validation
- Rate limiting enforcement

### Authentication Security
- Token expiration handling
- Session hijacking prevention
- Permission boundary testing
- Audit trail verification

## Brazilian Legal Requirements

### CPF/CNPJ Validation
```typescript
// Test valid CPF format and check digits
await apiClient.validateCPF('123.456.789-09')

// Test CNPJ business registration validation
await apiClient.validateCNPJ('12.345.678/0001-95')
```

### Tax Calculations
```typescript
// Test Brazilian tax calculations
await apiClient.calculateTaxes({
  amount: 1000.00,
  tax_type: 'iss',
  city: 'São Paulo'
})
```

## Error Handling Patterns

### Validation Errors (400)
```typescript
expect(response.status).toBe(400)
expect(response.body.error.validation_errors).toContain({
  field: 'email',
  message: 'Invalid email format'
})
```

### Business Logic Errors (422)
```typescript
expect(response.status).toBe(422)
expect(response.body.error.message).toContain('Cannot modify sent invoice')
```

### Server Errors (5xx)
```typescript
expect(response.status).toBe(503)
expect(response.body.error.code).toBe('SERVICE_UNAVAILABLE')
```

## Continuous Integration

### GitHub Actions
```yaml
name: Backend API Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm run test:backend:coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v1
```

## Debugging Tests

### Verbose Output
```bash
# Run tests with detailed output
npm test -- --verbose

# Debug specific test
npm test -- --testNamePattern="should create invoice" --verbose
```

### Test Debugging
```typescript
// Add debug logging in tests
console.log('Request data:', requestData)
console.log('Response:', response.body)

// Use debugger
debugger; // Will break in Node debugger
```

## Contributing

### Adding New Tests

1. **Create Test File**: Follow naming convention `*.test.ts`
2. **Use Test Helpers**: Import utilities from `test-helpers.ts`
3. **Follow Patterns**: Use existing tests as templates
4. **Add Configuration**: Update `test-config.ts` if needed
5. **Document**: Add test description to this README

### Test Best Practices

- **Descriptive Names**: Use clear, descriptive test names
- **Arrange-Act-Assert**: Structure tests clearly
- **Test Isolation**: Each test should be independent
- **Mock External Services**: Don't rely on external APIs
- **Clean Up**: Ensure proper cleanup after tests

### Code Coverage

Maintain high code coverage:
- **Statements**: > 90%
- **Branches**: > 85%
- **Functions**: > 90%
- **Lines**: > 90%

```bash
# Generate coverage report
npm run test:coverage

# View coverage in browser
open coverage/lcov-report/index.html
```

## Troubleshooting

### Common Issues

1. **Database Connection**: Ensure test database is running
2. **Environment Variables**: Check `.env.test` configuration
3. **Port Conflicts**: Make sure test ports are available
4. **Memory Issues**: Increase Node.js memory if needed

### Getting Help

1. Check test output for specific error messages
2. Review test configuration in `test-config.ts`
3. Examine mock setup in individual test files
4. Check GitHub Issues for known problems

## License

This test suite is part of the Prima Facie project and follows the same license terms.