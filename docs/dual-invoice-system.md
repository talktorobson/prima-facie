# Prima Facie - Dual Invoice System Documentation

## Overview

The Dual Invoice System is a comprehensive billing solution designed specifically for Brazilian law firms, supporting three distinct invoice types within a unified management interface. The system handles subscription billing, case billing, and payment plan invoices with full automation and Brazilian legal compliance.

## Architecture

### Database Schema

The system uses 9 core database tables to manage all invoice types:

- **`invoices`** - Central invoice registry with unified status management
- **`invoice_line_items`** - Detailed line items with source tracking
- **`subscription_invoices`** - Subscription-specific details and usage tracking
- **`case_invoices`** - Case billing details with multiple billing methods
- **`payment_plan_invoices`** - Installment management and scheduling
- **`time_based_invoices`** - Time tracking aggregation
- **`invoice_payments`** - Payment tracking and allocation
- **`invoice_templates`** - Templates and automation rules
- **`invoice_generation_logs`** - Audit logging for batch operations

### Service Layer

#### 1. Subscription Invoice Service (`subscription-invoice-service.ts`)

**Features:**
- Automated monthly/quarterly/yearly billing cycles
- Real-time usage tracking with configurable service inclusions
- Overage calculations with customizable rates per service type
- Proration handling for mid-period subscription changes
- Batch generation for multiple clients

**Key Methods:**
```typescript
// Generate single subscription invoice
generateSubscriptionInvoice(request: SubscriptionInvoiceGenerationRequest): Promise<InvoiceGenerationResult>

// Batch generation for multiple subscriptions
generateBatchSubscriptionInvoices(lawFirmId: string, billingPeriodStart: string, billingPeriodEnd: string): Promise<BatchInvoiceGenerationResult>

// Calculate service usage and overage charges
calculateSubscriptionUsage(clientSubscriptionId: string, billingPeriodStart: string, billingPeriodEnd: string): Promise<UsageData>
```

**Usage Tracking:**
- Legal consultation sessions
- Document reviews
- Contract analyses
- Legal research hours
- Custom service types with time-based calculations

#### 2. Case Invoice Service (`case-invoice-service.ts`)

**Billing Methods:**
- **Hourly**: Time-based billing with configurable rates
- **Fixed**: Flat fee for case completion
- **Percentage**: Contingency billing based on recovery amount
- **Hybrid**: Combination of hourly and percentage billing

**Features:**
- Integration with time tracking system
- Case outcome integration for success fees
- Discount engine integration
- Minimum fee enforcement
- Expense tracking and reimbursement

**Key Methods:**
```typescript
// Generate case invoice with multiple billing methods
generateCaseInvoice(request: CaseInvoiceGenerationRequest): Promise<InvoiceGenerationResult>

// Batch generation for multiple cases
generateBatchCaseInvoices(lawFirmId: string, matterIds: string[]): Promise<BatchInvoiceGenerationResult>

// Calculate amounts based on billing method
calculateCaseInvoiceAmounts(matter: any, caseBilling: any, billingData: any): Promise<CalculationResult>
```

#### 3. Payment Plan Invoice Service (`payment-plan-invoice-service.ts`)

**Features:**
- Automated installment generation
- Flexible scheduling (weekly, monthly, quarterly)
- Late fee calculations with grace periods
- Overdue processing with automated reminders
- Batch processing capabilities

**Key Methods:**
```typescript
// Generate single installment invoice
generatePaymentPlanInvoice(request: PaymentPlanInvoiceGenerationRequest): Promise<InvoiceGenerationResult>

// Generate all remaining installments
generateAllRemainingInstallments(lawFirmId: string, paymentPlanId: string): Promise<BatchInvoiceGenerationResult>

// Process overdue installments with late fees
generateOverdueInstallments(lawFirmId: string, gracePeriodDays: number): Promise<BatchInvoiceGenerationResult>
```

### Frontend Components

#### 1. Unified Billing Dashboard (`unified-billing-dashboard.tsx`)

**Features:**
- Single interface for all invoice types
- Advanced filtering by status, type, and date range
- Real-time search across invoice details
- Export capabilities (Excel/PDF)
- Revenue analytics and insights

**Views:**
- **All Invoices**: Complete invoice listing with filters
- **Subscriptions**: Subscription-specific analytics and status
- **Payment Plans**: Progress tracking and completion monitoring
- **Analytics**: Revenue distribution and financial insights

#### 2. Invoice Management Page (`invoices/page.tsx`)

**Features:**
- Quick statistics dashboard
- Revenue breakdown by invoice type
- Automation status monitoring
- Invoice creation workflows

## Invoice Types

### 1. Subscription Invoices

**Purpose**: Recurring billing for subscription-based legal services

**Key Features:**
- Automated generation based on billing cycles
- Service usage tracking with overage calculations
- Proration for mid-period changes
- Integration with service inclusion management

**Invoice Number Format**: `SUB-YYYY-XXXXXX`

**Line Items:**
- Base subscription fee (with proration if applicable)
- Service overage charges
- Adjustments and credits

### 2. Case Invoices

**Purpose**: Billing for individual legal cases/matters

**Billing Methods:**

**Hourly Billing:**
- Time-based charges using lawyer billing rates
- Integration with time tracking system
- Minimum fee enforcement

**Fixed Fee Billing:**
- Predetermined case amount
- Milestone-based billing options
- Success criteria integration

**Percentage Billing (Contingency):**
- Fee based on case outcome/recovery amount
- Success fee additions
- No-win, no-fee scenarios

**Hybrid Billing:**
- Combination of hourly and percentage
- Complex fee structures
- Multiple fee components

**Invoice Number Format**: `CASE-YYYY-XXXXXX`

**Line Items:**
- Base billing charges (hourly/fixed/percentage)
- Success fees
- Case expenses and reimbursements
- Discount applications
- Minimum fee adjustments

### 3. Payment Plan Invoices

**Purpose**: Installment billing for cases split into multiple payments

**Key Features:**
- Automated scheduling based on frequency
- Late fee calculations with grace periods
- Progress tracking and completion monitoring
- Integration with case billing

**Invoice Number Format**: `PLAN-YYYY-XXXXXX`

**Line Items:**
- Installment amount
- Late fees (if applicable)
- Payment plan adjustments

## Brazilian Legal Compliance

### Document Standards
- **CNPJ/CPF Integration**: Proper client identification
- **PIX Payment Support**: Brazilian instant payment system
- **Portuguese UI/UX**: Complete localization
- **BRL Currency Formatting**: Brazilian real formatting
- **Tax Compliance**: VAT and service tax handling

### Legal Requirements
- Professional invoice numbering sequences
- Mandatory client information fields
- Service description requirements
- Payment terms and conditions
- Legal disclaimers and terms

## Automation Features

### Scheduled Generation
- Monthly subscription invoice generation
- Payment plan installment scheduling
- Overdue invoice processing
- Batch generation capabilities

### Smart Calculations
- Usage tracking with overage detection
- Proration calculations for partial periods
- Late fee calculations with configurable rates
- Discount engine integration

### Workflow Management
- Invoice approval workflows
- Automated status updates
- Payment tracking and allocation
- Collection management integration

## Export Capabilities

### Excel Export
- Multi-sheet workbooks with detailed breakdowns
- Brazilian currency formatting
- Comprehensive invoice listings
- Payment history and analytics

### PDF Export
- Professional invoice layouts
- Firm branding and logos
- Portuguese content and formatting
- Legal compliance elements

## Integration Points

### Time Tracking System
- Automatic time entry integration
- Billing rate calculations
- Subscription vs case time allocation
- Productivity analytics

### Financial Management
- Accounts receivable integration
- Payment collection workflows
- Aging report generation
- Cash flow monitoring

### Discount Engine
- Subscription-based discounts
- Case billing incentives
- Cross-selling opportunities
- Dynamic pricing rules

## API Reference

### Core Types

```typescript
// Main invoice interface
interface Invoice {
  id: string
  invoice_number: string
  invoice_type: 'subscription' | 'case_billing' | 'payment_plan'
  invoice_status: InvoiceStatus
  total_amount: number
  client_id: string
  // ... additional fields
}

// Invoice generation request
interface InvoiceGenerationRequest {
  law_firm_id: string
  invoice_type: InvoiceType
  // ... type-specific fields
}

// Generation result
interface InvoiceGenerationResult {
  success: boolean
  invoice?: Invoice
  error?: string
  warnings?: string[]
}
```

### Service Methods

```typescript
// Subscription invoice generation
const result = await subscriptionInvoiceService.generateSubscriptionInvoice({
  law_firm_id: 'firm-123',
  client_subscription_id: 'sub-456',
  billing_period_start: '2025-01-01',
  billing_period_end: '2025-01-31',
  auto_send: true
})

// Case invoice generation
const result = await caseInvoiceService.generateCaseInvoice({
  law_firm_id: 'firm-123',
  matter_id: 'matter-789',
  include_time_entries: true,
  billing_period_start: '2025-01-01',
  billing_period_end: '2025-01-31'
})

// Payment plan invoice generation
const result = await paymentPlanInvoiceService.generatePaymentPlanInvoice({
  law_firm_id: 'firm-123',
  payment_plan_id: 'plan-321',
  installment_number: 1,
  auto_send: true
})
```

## Error Handling

### Common Error Scenarios
- Missing subscription or case data
- Duplicate invoice prevention
- Insufficient data for calculations
- Validation failures
- Database constraints

### Error Response Format
```typescript
interface ErrorResponse {
  success: false
  error: string
  code?: string
  details?: any
}
```

## Testing Strategy

### Comprehensive Test Coverage
- Unit tests for all service methods
- Integration tests for complete workflows
- Edge case testing for business logic
- Error handling validation
- Performance testing for batch operations

### Key Test Scenarios
- Subscription invoice with overage charges
- Case invoice with hybrid billing
- Payment plan with late fees
- Batch generation with mixed results
- Proration calculations
- Discount applications

## Performance Considerations

### Database Optimization
- Proper indexing for query performance
- Row-level security for multi-tenancy
- Efficient batch processing
- Connection pooling and caching

### Scalability Features
- Async processing for large batches
- Queue management for scheduled tasks
- Horizontal scaling capabilities
- Monitoring and alerting

## Security

### Data Protection
- Row-level security (RLS) policies
- Multi-tenant data isolation
- Encrypted sensitive data
- Audit logging for all operations

### Access Control
- Role-based permissions
- Invoice approval workflows
- Payment authorization levels
- Administrative controls

## Monitoring and Analytics

### Key Metrics
- Invoice generation success rates
- Payment collection performance
- Revenue analytics by type
- System performance metrics

### Reporting Capabilities
- Real-time dashboards
- Revenue trend analysis
- Client payment behavior
- Operational efficiency metrics

## Future Enhancements

### Planned Features
- Advanced automation rules
- Machine learning for payment predictions
- Enhanced Brazilian compliance features
- Mobile application support
- Advanced analytics and reporting

### Integration Roadmap
- Stripe payment processing
- Advanced notification systems
- Document management integration
- Calendar and scheduling integration
- Third-party accounting software integration

---

## Support and Maintenance

For technical support and feature requests, please refer to the main project documentation or contact the development team.

**Last Updated**: January 16, 2025
**Version**: Phase 8.7 Complete