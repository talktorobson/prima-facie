# CLAUDE.md - Prima Facie Project

## Project Overview
Prima Facie is a Next.js 14 Legal-as-a-Service (LaaS) platform for modern law firm management. It combines traditional legal practice management with subscription-based consulting services, creating a hybrid revenue model that includes recurring subscriptions, case billing, and performance-based success fees. Built with TypeScript, Tailwind CSS, Supabase, and Stripe integration for comprehensive financial management.

## Project Structure
```
prima-facie/
├── app/                    # Next.js 14 App Router
│   ├── (auth)/            # Authentication routes group
│   │   ├── login/         # Login page
│   │   ├── register/      # Registration page
│   │   └── forgot-password/ # Password recovery
│   ├── (dashboard)/       # Protected dashboard routes
│   │   ├── admin/         # Admin panel
│   │   ├── matters/       # Legal matters/cases management
│   │   ├── clients/       # Client management
│   │   ├── billing/       # Financial/billing management
│   │   │   ├── accounts-payable/   # AP: Vendors, bills, expenses
│   │   │   ├── accounts-receivable/ # AR: Collections, aging reports
│   │   │   ├── case-billing/       # Case billing configuration
│   │   │   ├── subscriptions/      # Subscription management
│   │   │   ├── invoices/           # Dual invoice system (NEW)
│   │   │   ├── time-tracking/      # Time tracking dashboard
│   │   │   └── financial-dashboard/ # Financial overview & analytics
│   │   ├── calendar/      # Calendar and scheduling
│   │   ├── tasks/         # Task management
│   │   ├── documents/     # Document management
│   │   ├── reports/       # Reports and analytics
│   │   └── settings/      # System settings
│   └── portal/            # Portal access
│       ├── client/        # Client portal (includes payment access)
│       └── staff/         # Staff portal
├── components/            # Reusable components
│   ├── ui/               # UI components (Button, Input, Card, etc.)
│   ├── layout/           # Layout components
│   └── features/         # Feature-specific components
│       ├── billing/      # Billing components (case billing, time tracking, invoices)
│       ├── financial/    # AP/AR components
│       └── exports/      # Excel/PDF export components
├── lib/                  # Libraries and utilities
│   ├── supabase/         # Supabase client configuration
│   ├── billing/          # Billing services and types (case billing, time tracking, invoices)
│   ├── financial/        # AP/AR services
│   ├── exports/          # Export utilities (Excel/PDF)
│   ├── utils/            # Utility functions
│   └── hooks/            # Custom React hooks
├── styles/               # Global styles
├── public/               # Static assets (includes logo.png for PDF branding)
├── types/                # TypeScript type definitions
├── src/                  # Legacy source directory (to be migrated)
├── tests/                # Test files
├── middleware.ts         # Next.js middleware for auth
├── next.config.js        # Next.js configuration
├── tailwind.config.ts    # Tailwind CSS configuration
├── postcss.config.js     # PostCSS configuration
├── tsconfig.json         # TypeScript configuration
├── package.json          # Project dependencies
├── .env.local.example    # Environment variables example
└── .gitignore           # Git ignore patterns
```

## Technology Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth with SSR support
- **Database**: Supabase (PostgreSQL)
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Icons**: Lucide React
- **Date Handling**: date-fns

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

### Legal Practice Management
- Multi-tenant architecture support
- Role-based access control (Admin, Staff, Client)
- Legal matter/case management with Brazilian legal compliance
- Client relationship management with CPF/CNPJ support
- Real-time chat & WhatsApp Business integration
- Document storage and management
- Calendar integration and task management

### Legal-as-a-Service (LaaS) Platform
- **Subscription-based Consulting Services**
  - Recurring legal consulting plans (Labor Law, Corporate, etc.)
  - Monthly/yearly billing cycles with auto-renewal
  - Service inclusion management and consumption tracking
  
- **Hybrid Billing System**
  - Multi-modal case billing: Hourly/Percentage/Fixed rates
  - Success fees based on case outcomes
  - Minimum fee enforcement per case type
  - Cross-selling discounts for subscribers
  
- **Payment Plan Management**
  - Split case payments into N installments
  - Automated payment scheduling and collections
  - Late fee calculation and dunning management
  
- **Dual Invoice System (NEW)**
  - Subscription invoices with usage tracking and overage calculations
  - Case invoices with multi-modal billing (hourly/fixed/percentage/hybrid)
  - Payment plan invoices with automated installments and late fees
  - Unified billing dashboard with advanced filtering and analytics
  
- **Time Tracking Integration (NEW)**
  - Real-time timer with pause/resume functionality
  - Automated billing calculation from time entries
  - Hierarchical billing rates and template system
  - Subscription vs case time allocation tracking
  
- **Financial Management**
  - Complete Accounts Payable system (vendors, expenses, approvals)
  - Enhanced Accounts Receivable (collections, aging, payment tracking)
  - Real-time financial dashboard with cash flow monitoring
  - Excel/PDF export capabilities with firm branding
  
- **Revenue Analytics**
  - Monthly Recurring Revenue (MRR) tracking
  - Customer Lifetime Value (CLV) analysis
  - Case profitability and cross-selling performance
  - Financial forecasting and cash flow management

### Comprehensive Billing Architecture

#### Dual Invoice System
The system supports three distinct invoice types with unified management:

**Subscription Invoices**
- Automated monthly/quarterly/yearly billing cycles
- Real-time usage tracking with configurable service inclusions
- Overage calculations with customizable rates per service type
- Proration handling for mid-period subscription changes
- Batch generation for multiple clients with comprehensive logging

**Case Invoices**
- Multi-modal billing methods: hourly, fixed, percentage (contingency), and hybrid
- Integration with time tracking system for automated hour calculations
- Case outcome integration for percentage and success fee calculations
- Discount engine integration with subscription-based incentives
- Minimum fee enforcement per case type with automatic adjustment
- Expense tracking and reimbursable cost management

**Payment Plan Invoices**
- Automated installment generation with flexible scheduling (weekly, monthly, quarterly)
- Late fee calculations with configurable grace periods and rates
- Overdue invoice processing with automated reminder systems
- Batch processing for multiple payment plans with error handling
- Final installment handling with plan completion workflows

#### Advanced Features
- **Professional Invoice Numbering**: Type-specific prefixes with sequential numbering (SUB-2025-000001, CASE-2025-000001, PLAN-2025-000001)
- **Brazilian Legal Compliance**: CNPJ/CPF validation, PIX payment integration, Portuguese UI/UX
- **Unified Dashboard**: Single interface for all invoice types with advanced filtering, search, and export capabilities
- **Real-time Analytics**: Revenue tracking, payment analysis, completion monitoring, and KPI dashboards
- **Export Capabilities**: Professional Excel and PDF generation with firm branding and Portuguese formatting
- **Multi-tenant Architecture**: Row-level security policies ensuring complete data isolation between law firms

### Advanced Integrations
- Stripe payment processing (subscriptions + one-time payments)
- Supabase real-time features and authentication
- WhatsApp Business API for client communication
- Brazilian banking and tax compliance features
- Time tracking integration with automated billing calculation
- Comprehensive export system with firm branding

## Authentication Flow
- Middleware handles route protection
- Protected routes redirect to login if unauthenticated
- Auth routes redirect to dashboard if authenticated
- Portal routes have specific access controls

## Development Guidelines
- Use snake_case for naming conventions
- Keep components simple and focused
- Use Server Components by default, Client Components when needed
- Implement proper error boundaries
- Follow Next.js 14 best practices
- Use TypeScript strict mode
- Maintain consistent code style with ESLint and Prettier

## Environment Variables
Copy `.env.local.example` to `.env.local` and configure:
- Supabase URL and keys
- App configuration
- Email settings (optional)
- Analytics (optional)

## Testing Methodology

### 🧪 Live Pair Testing Protocol (Established Phase 6.5)
**Implemented**: Interactive E2E testing approach for phase deliveries

**Process**:
1. **Browser Automation**: Claude opens multiple browser tabs with key testing URLs
2. **Live Testing Guide**: Comprehensive E2E testing guide created for each phase
3. **Real-time Verification**: User follows systematic testing while Claude monitors
4. **Interactive Feedback**: Immediate validation of features and user experience
5. **Documentation**: Complete testing results documented for each phase

**Benefits**:
- **Real User Validation**: Actual browser testing with human interaction
- **Comprehensive Coverage**: Systematic testing of all features and edge cases
- **Quality Assurance**: Immediate detection of issues and UX problems
- **Documentation**: Complete testing trail for each phase delivery
- **Efficiency**: Parallel testing with guided workflows

**Implementation for Future Phases**:
- ✅ Browser tab automation for key testing scenarios
- ✅ Comprehensive E2E testing guides
- ✅ Real-time testing checklists
- ✅ Cross-feature integration validation
- ✅ Performance and UX verification

## Database Setup Status

### ✅ PRODUCTION DATABASE - FULLY DEPLOYED (2025-06-17)

**Database Schema: 100% Complete**
- ✅ **Core Tables**: contacts, matters, matter_types, matter_contacts, tasks, time_entries
- ✅ **Business Tables**: documents, invoices, invoice_line_items, messages, pipeline_stages, pipeline_cards, activity_logs
- ✅ **Advanced Billing**: subscription_plans, case_types, client_subscriptions, discount_rules, vendors, bills
- ✅ **Row Level Security**: All tables protected with multi-tenant RLS policies
- ✅ **Performance Indexes**: Optimized query performance across all relationships

**Seed Data: 100% Complete**
- ✅ **2 Law Firms**: Dávila Reis Advocacia & Silva & Associados (realistic Brazilian legal practices)
- ✅ **8 Clients**: Individual (CPF) and Corporate (CNPJ) with complete contact information
- ✅ **8 Legal Matters**: Active cases across different practice areas (Trabalhista, Família, Criminal, etc.)
- ✅ **18 Time Entries**: Billable hours with Brazilian rates (R$ 250-500/hour)
- ✅ **7 Invoices**: Complete lifecycle (Paid/Pending/Overdue) with proper numbering
- ✅ **6 Subscription Plans**: R$ 890 - R$ 8,500/month (Basic to Enterprise)
- ✅ **8 Case Types**: Billing configurations with minimum fees and success percentages
- ✅ **4 Client Subscriptions**: Active subscriptions with usage tracking
- ✅ **4 Discount Rules**: Automated pricing incentives for subscribers
- ✅ **7 Vendors**: Courts, suppliers, service providers with Brazilian compliance
- ✅ **9 Bills**: R$ 420 - R$ 16,500 expense management with approval workflows
- ✅ **Supporting Data**: Messages, documents, pipeline management, activity logs

**Database Access**
- **Environment**: Production Supabase instance
- **Multi-tenant**: Complete data isolation between law firms
- **Security**: Row Level Security enforced on all tables
- **Performance**: Indexed queries with optimized relationships

## Version History

### **🎉 PHASE 8 COMPLETE - Production Database Deployed (2025-06-17)**

**Database Migration & Seeding: 100% Complete**
- ✅ **Schema Deployment**: All 20+ tables successfully created with proper relationships
- ✅ **RLS Policies**: Multi-tenant security enforced across all tables
- ✅ **Comprehensive Seed Data**: Realistic Brazilian legal practice scenarios
- ✅ **Advanced Billing System**: Subscription plans, case billing, discount rules fully operational
- ✅ **Financial Management**: Complete AP/AR system with vendor and bill management
- ✅ **UUID Consistency**: All foreign key relationships properly established
- ✅ **Brazilian Compliance**: CNPJ/CPF validation, Portuguese content, local business practices

**Migration Scripts Applied:**
- ✅ `manual-migration-step1.sql` - Core legal practice tables
- ✅ `manual-migration-step2.sql` - Supporting business tables  
- ✅ `manual-migration-step3-advanced.sql` - Advanced billing and financial tables
- ✅ `seed-data-step1-core-FIXED.sql` - Core business data with proper relationships
- ✅ `seed-data-step2-billing.sql` - Subscription and billing configurations
- ✅ `seed-data-step3-timetracking.sql` - Time entries and invoice management
- ✅ `seed-data-step4-financial.sql` - Complete financial ecosystem with vendor management

**Technical Achievements:**
- **Multi-Modal Billing**: Hourly, fixed, percentage, and hybrid case billing fully configured
- **Subscription Management**: 6 service tiers with usage tracking and overage calculations
- **Discount Engine**: Automated cross-selling incentives for subscription clients
- **Financial Operations**: Complete accounts payable/receivable with Brazilian vendor compliance
- **Revenue Analytics**: MRR, CLV, and profitability tracking with real transaction data
- **Brazilian Legal Compliance**: Authentic case types, court references, and legal procedures

**Business Impact**: ⚡ CRITICAL - Complete Legal-as-a-Service platform with production-ready data
**User Experience**: Rich testing environment with comprehensive Brazilian legal scenarios
**Development Ready**: All tables populated with realistic data for immediate application development

### **Previous Major Milestones:**
- **v8.13.0-phase8-complete (2025-06-16)**: Application code 100% complete
- **v8.5.4-phase8.5.4 (2025-01-16)**: Case billing UI components and forms  
- **v7.0.0-phase7 (2025-01-15)**: Real-time chat & WhatsApp integration
- **v6.5.0-phase6.5 (2025-01-15)**: Client-matter relationship management
- **v1.0.0-phase1 (2025-01-15)**: Foundation setup with Next.js 14

- v2.0.0 (2025-01-15): Complete Next.js 14 App Router migration
  - Created full app directory structure
  - Set up authentication flow with Supabase
  - Configured Tailwind CSS with custom theme
  - Added middleware for route protection
  - Created all dashboard and portal pages
  - Set up Supabase client/server configuration
  - Added TypeScript path aliases
- v1.1.0 (2025-01-15): Project structure organized and cleaned up
  - Removed misplaced System-Small-Law-Firm directory
  - Added example services, types, and utilities
  - Created working tests and proper project structure
- v1.0.0 (2025-01-15): Initial project setup with TypeScript, ESLint, Prettier, and Jest

## Current Status
🎉 **Phase 8 COMPLETE (100%)**: Legal-as-a-Service Platform with comprehensive hybrid billing system
✅ **PRODUCTION READY**: All integration tasks completed and tested

### Phase 8 Complete Achievements (100% Complete):

**✅ BUSINESS LOGIC & ARCHITECTURE (100% Complete)**
- Subscription management system with Brazilian legal market focus
- Multi-modal case billing (hourly, fixed, percentage, hybrid)
- Advanced payment plans with automated installment scheduling
- Sophisticated discount engine with cross-selling automation
- Dual invoice system (subscription + case billing)
- Complete financial management (AP/AR) with Brazilian compliance
- Revenue analytics (MRR, CLV, profitability tracking)

**✅ TECHNICAL IMPLEMENTATION (100% Complete)**
- Complete database schema with 40+ tables supporting all revenue models
- Full service layer implementation with comprehensive business logic
- Production-ready UI components for all billing features
- Comprehensive testing suite with 300+ tests
- Brazilian legal compliance (CNPJ/CPF, PIX, BRL formatting)
- Mobile-responsive dashboards and management interfaces

**✅ INTEGRATION COMPLETE (100% Complete)**
- ✅ Stripe payment processing integration with Brazilian support
- ✅ Production database connection with real Supabase queries
- ✅ Payment webhook handling and automation system
- ✅ Row Level Security policies for multi-tenant isolation
- ✅ Email notification system with professional templates

### Phase 8 Complete Implementation Summary:
- ✅ **8.1**: Billing database schema with case types and minimum fees
- ✅ **8.2**: Subscription plan system with service inclusions
- ✅ **8.3**: Payment plan system with installment scheduling
- ✅ **8.4**: Discount engine with cross-selling incentives
- ✅ **8.5**: Complete case billing system with UI components
- ✅ **8.6**: Time tracking integration with automated billing calculation
- ✅ **8.7**: Dual invoice system with subscription, case, and payment plan billing
- ✅ **8.8**: Stripe integration with Brazilian payment methods (PIX, Cards, Boleto)
- ✅ **8.9**: Revenue analytics dashboard
- ✅ **8.10**: Financial Management Module (Accounts Payable/Receivable System)
  - ✅ **8.10.1**: Database schema extension
  - ✅ **8.10.2**: Accounts Payable system
  - ✅ **8.10.3**: Accounts Receivable enhancement
  - ✅ **8.10.4**: Export & Reporting Engine
- ✅ **8.11**: Production database connection with real Supabase queries
- ✅ **8.12**: Row Level Security policies for multi-tenant isolation
- ✅ **8.13**: Email notification system with webhook automation

### ✅ COMPLETED: Phase 8.10 - Financial Management Module

**ACCOUNTS PAYABLE & RECEIVABLE SYSTEM - DELIVERED**
- ✅ **Accounts Payable**: Complete vendor management, bill tracking, approval workflows
- ✅ **Accounts Receivable**: Enhanced payment collection, aging analysis, reminder automation
- ✅ **Financial Dashboard**: Real-time cash flow monitoring, alert system, KPI widgets
- ✅ **Export Capabilities**: Professional Excel/PDF generation with firm branding
- ✅ **Integration Strategy**: Successfully leveraged existing billing infrastructure (65% code reuse)

**Delivered Components:**
- ✅ **Database Schema**: 8 core financial tables with RLS policies and triggers
- ✅ **Vendor Management**: Complete CRUD with Brazilian compliance (CNPJ/CPF, PIX)
- ✅ **Bill Processing**: Approval workflows, recurring payments, category tracking
- ✅ **Collections Engine**: Automated reminders, dispute handling, aging reports
- ✅ **Financial Dashboard**: Real-time widgets, cash flow projections, alerts
- ✅ **Export Engine**: Excel/PDF generation with multi-sheet support and branding

**Production Features:**
- Professional Excel exports with Brazilian currency formatting
- Branded PDF reports with firm logos and Portuguese content
- Real-time financial dashboard with KPI monitoring
- Automated collection workflows with smart reminder logic
- Complete AP/AR lifecycle management
- Multi-tenant architecture with row-level security

**Business Impact**: ⚡ HIGH - Complete financial management capabilities delivered

### ✅ COMPLETED: Phase 8.7 - Dual Invoice System

**COMPREHENSIVE INVOICE MANAGEMENT - DELIVERED**
- ✅ **Subscription Invoices**: Automated generation with usage tracking, overage charges, and proration handling
- ✅ **Case Invoices**: Multi-modal billing (hourly/fixed/percentage/hybrid) with discount integration and minimum fee enforcement
- ✅ **Payment Plan Invoices**: Automated installment generation with late fees, grace periods, and flexible scheduling
- ✅ **Unified Dashboard**: Single view for all invoice types with advanced filtering, search, and analytics
- ✅ **Brazilian Compliance**: Complete CNPJ/CPF integration, PIX payments, and Portuguese UI/UX

**Delivered Components:**
- ✅ **Database Schema**: 9 core invoice tables with automated numbering, RLS policies, and comprehensive triggers
- ✅ **Subscription Service**: Usage tracking, overage calculations, proration logic, and batch generation
- ✅ **Case Billing Service**: Multi-modal calculations, time entry integration, expense handling, and discount application
- ✅ **Payment Plan Service**: Installment automation, late fee calculations, grace periods, and overdue processing
- ✅ **Unified Dashboard**: Advanced filtering, export capabilities, real-time analytics, and revenue insights
- ✅ **Invoice Management**: Complete CRUD operations, status workflows, and payment tracking

**Production Features:**
- Professional invoice numbering with type-specific prefixes (SUB-2025-000001, CASE-2025-000001, PLAN-2025-000001)
- Automated invoice generation with configurable scheduling and reminders
- Real-time usage tracking with overage calculations and proration handling
- Multi-modal case billing with intelligent minimum fee enforcement
- Payment plan automation with flexible scheduling and late fee management
- Unified client billing view with comprehensive export capabilities
- Brazilian legal market compliance with Portuguese UI and local payment methods

**Business Impact**: ⚡ HIGH - Complete invoice management system with automated workflows