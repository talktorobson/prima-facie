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
│   │   ├── calendar/      # Calendar and scheduling
│   │   ├── tasks/         # Task management
│   │   ├── documents/     # Document management
│   │   ├── reports/       # Reports and analytics
│   │   └── settings/      # System settings
│   └── portal/            # Portal access
│       ├── client/        # Client portal
│       └── staff/         # Staff portal
├── components/            # Reusable components
│   ├── ui/               # UI components
│   ├── layout/           # Layout components
│   └── features/         # Feature-specific components
├── lib/                  # Libraries and utilities
│   ├── supabase/         # Supabase client configuration
│   ├── utils/            # Utility functions
│   └── hooks/            # Custom React hooks
├── styles/               # Global styles
├── public/               # Static assets
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
  
- **Revenue Analytics**
  - Monthly Recurring Revenue (MRR) tracking
  - Customer Lifetime Value (CLV) analysis
  - Case profitability and cross-selling performance
  - Financial forecasting and cash flow management

### Advanced Integrations
- Stripe payment processing (subscriptions + one-time payments)
- Supabase real-time features and authentication
- WhatsApp Business API for client communication
- Brazilian banking and tax compliance features

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

## Version History
- **v1.0.0-phase1 (2025-01-15): ✅ PHASE 1 COMPLETE - Foundation Setup**
  - Next.js 14 with App Router and TypeScript
  - Supabase integration for authentication  
  - Tailwind CSS with custom theme
  - Complete project structure with all routes
  - Comprehensive unit test suite (19 tests passing)
  - 100% coverage for utility functions
  - Jest configuration with React Testing Library
  - Authentication flow and middleware setup
  - Portuguese UI/UX implementation
  - **STATUS**: Ready for Phase 2 - Database Schema Development

- **v6.5.0-phase6.5 (2025-01-15): ✅ PHASE 6.5 COMPLETE - Client-Matter Relationship Management**
  - Enhanced matter creation with intelligent client selection
  - Real-time client details display in matter forms
  - Comprehensive client detail page with matter integration
  - Client statistics dashboard with accurate metrics
  - Seamless navigation between clients and matters
  - Manual client input fallback system
  - Cross-component data consistency validation
  - **TESTING**: Live pair testing protocol established and executed
  - **STATUS**: Production-ready with comprehensive E2E validation

- **v7.0.0-phase7 (2025-01-15): ✅ PHASE 7 COMPLETE - Real-time Chat & WhatsApp Integration**
  - Real-time messaging system with Supabase Realtime integration
  - Topic-based conversation organization with admin management interface
  - Cross-user synchronization using 3-second polling mechanism
  - Message status indicators (sent/delivered/read) with visual feedback
  - Comprehensive notification system with unread count tracking
  - WhatsApp Business API integration foundation with UI indicators
  - Mobile-responsive chat interface with dynamic layout switching
  - Enhanced test-frontend.html with comprehensive Phase 7 testing framework
  - Multi-user session management for live testing scenarios
  - **TESTING**: Advanced multi-user testing capabilities with guided workflows
  - **STATUS**: Production-ready chat system with mock/live mode flexibility

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
🎯 **Phase 7 Complete**: Real-time Chat & WhatsApp Integration with comprehensive testing
🚧 **Next**: Phase 8 - Hybrid Legal Billing & Subscription System (Legal-as-a-Service Platform)

### Recent Achievements (Phase 7):
- ✅ Real-time messaging system with Supabase integration
- ✅ Topic-based conversation organization with admin management
- ✅ Cross-user synchronization with 3-second polling mechanism
- ✅ Message status indicators (sent/delivered/read) with visual feedback
- ✅ WhatsApp Business API integration foundation with UI indicators
- ✅ Comprehensive notification system with unread count tracking
- ✅ Mobile-responsive chat interface with dynamic layout switching
- ✅ Enhanced test-frontend.html with Phase 7 testing capabilities
- ✅ Multi-user session management for live testing scenarios
- ✅ Production-ready chat system with mock/live mode flexibility

### Upcoming Phase 8: Legal-as-a-Service (LaaS) Platform
**Revolutionary Hybrid Billing System:**
- 🔄 **Subscription Plans**: Recurring legal consulting services (Labor Law, Corporate, etc.)
- 💰 **Multi-Modal Case Billing**: Hourly/Percentage/Fixed + Success Fees
- 📅 **Payment Plans**: Split case payments into N installments
- 🎯 **Cross-Selling Discounts**: Subscribers get X% off litigation services
- 📊 **Revenue Analytics**: MRR tracking + Case profitability + Client lifetime value

**Business Model Innovation:**
- Triple revenue streams: Subscriptions + Case billing + Success fees
- Client retention through recurring services
- Cross-selling automation with discount incentives
- Flexible payment terms reducing engagement barriers
- Performance-aligned success fee system