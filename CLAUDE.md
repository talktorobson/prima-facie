# CLAUDE.md - Prima Facie Project

## Project Overview
Prima Facie is a Next.js 14 application for legal practice management (Sistema de Gestão para Escritórios de Advocacia) with TypeScript, Tailwind CSS, Supabase authentication, and a comprehensive dashboard.

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
- Multi-tenant architecture support
- Role-based access control (Admin, Staff, Client)
- Legal matter/case management
- Client relationship management
- Document storage and management
- Financial/billing tracking
- Calendar integration
- Task management
- Reporting and analytics
- Client and staff portals

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

## Version History
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