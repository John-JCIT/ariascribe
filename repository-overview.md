# Zero To Shipped - Repository Overview

## Project Description

**Zero To Shipped** is a modern full-stack web application built with Next.js 15 and TypeScript. Based on the project name "money-printer" and the sophisticated tech stack, this appears to be a SaaS starter template or boilerplate designed to help developers quickly ship production-ready applications.

## Key Features

- **Authentication System**: Complete auth setup with Better Auth including email/password, GitHub OAuth, email verification, password reset, and admin impersonation
- **Database**: PostgreSQL with Prisma ORM and comprehensive user management
- **Payment Integration**: Polar.sh integration for subscription management and checkout
- **Content Management**: Content collections for blog posts and documentation
- **Email System**: React Email templates with multiple providers (Resend, Plunk)
- **File Uploads**: UploadThing integration for image handling
- **Admin Panel**: Role-based access control with admin functionality
- **Modern UI**: Tailwind CSS with Radix UI components and dark/light theme support

## Tech Stack

### Core Framework
- **Next.js 15** with App Router and Turbo mode
- **TypeScript** for type safety
- **React 19** with Server Components

### Database & ORM
- **PostgreSQL** database
- **Prisma** ORM with custom output directory
- Database migrations and seeding support

### Authentication
- **Better Auth** with multiple providers:
  - Email/Password authentication
  - GitHub OAuth integration
  - Email verification system
  - Password reset functionality
  - Admin impersonation capabilities
  - Username support

### UI & Styling
- **Tailwind CSS** with custom configuration
- **Radix UI** components for accessibility
- **Framer Motion** for animations
- **Lucide React** for icons
- **Geist** font family
- **Next Themes** for dark/light mode

### State Management & API
- **tRPC** for type-safe API calls
- **TanStack React Query** for data fetching
- **Zod** for schema validation
- **React Hook Form** for form handling

### Payments & Subscriptions
- **Polar.sh** integration with:
  - Customer management
  - Subscription handling
  - Checkout flows
  - Webhook processing

### Email & Communication
- **React Email** for template creation
- **Resend** and **Plunk** as email providers
- **Nodemailer** support

### Development Tools
- **Bun** as package manager and runtime
- **ESLint** and **Prettier** for code quality
- **Leva** for development debugging
- **Localtunnel** for local development

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (app)/             # Main application routes
│   ├── (landing)/         # Landing page routes
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   ├── auth/             # Authentication components
│   ├── forms/            # Form components
│   └── core/             # Core utility components
├── server/               # Server-side code
│   ├── auth/             # Authentication configuration
│   ├── api/              # tRPC routers
│   └── db.ts             # Database connection
├── lib/                  # Utility functions
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
├── schemas/              # Zod validation schemas
├── email/                # Email templates
└── styles/               # Global styles
```

## Key Configuration

### Environment Setup
The project uses a sophisticated environment variable system with client/server separation and validation.

### Database Schema
- **User model** with comprehensive fields including:
  - Basic profile information
  - Image handling (direct URLs, UploadThing keys, and DB relations)
  - Preferences and timezone support
  - Role-based access control
  - Username system
- **Authentication tables** (Sessions, Accounts, Verification)
- **File upload management** with UploadThing integration

### Middleware
- Route protection based on authentication status
- Admin route protection
- Automatic redirects for authenticated/unauthenticated users

## Development Workflow

### Scripts Available
- `dev`: Development server with Turbo mode
- `build`: Production build with database migrations
- `db:migrate`: Run database migrations
- `db:studio`: Open Prisma Studio
- `db:seed`: Seed the database
- `email`: Email template development
- `check`: Lint and type checking

### Code Quality
- ESLint configuration with TypeScript support
- Prettier for code formatting
- Comprehensive TypeScript configuration
- Git hooks and pre-commit checks

## Deployment Ready

The project is configured for multiple deployment platforms:
- **Vercel** (primary)
- **Railway**
- **Render**
- **Coolify**

With automatic URL derivation and environment-specific configurations.

## Notable Patterns

1. **Component Architecture**: Well-organized component library with consistent patterns
2. **Form Handling**: Standardized form components with React Hook Form integration
3. **Error Handling**: Comprehensive error boundaries and fallback components
4. **Theme System**: Complete dark/light mode support with system preference detection
5. **Responsive Design**: Mobile-first approach with custom media query hooks
6. **Type Safety**: End-to-end type safety from database to frontend

## Getting Started

This appears to be a production-ready SaaS starter template that provides:
- Complete authentication flow
- Payment processing
- Content management
- Email system
- Admin capabilities
- Modern development experience

The project follows best practices for scalable web applications and includes comprehensive tooling for development, testing, and deployment.