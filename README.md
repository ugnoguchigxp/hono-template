# Hono Template - Clean Architecture Monorepo

A production-ready monorepo template featuring Hono, Zod, Domain-Driven Design, and Clean Architecture principles.

## 🏗️ Architecture

This project follows a strict layered architecture with clear separation of concerns:

```
┌─────────────────┐
│   HTTP Layer    │  (Hono - thin adapter)
├─────────────────┤
│  Application    │  (Use cases, Ports)
├─────────────────┤
│    Domain       │  (Entities, VOs, Policies)
├─────────────────┤
│ Infrastructure  │  (DB, External APIs)
└─────────────────┘
```

## 📁 Repository Structure

```
repo/
├── apps/
│   └── api/                    # HTTP entry point (Hono app)
├── packages/
│   ├── foundation/
│   │   ├── app-core/          # DI, Config, Logger, Errors
│   │   ├── auth-suite/        # Authentication & Authorization
│   │   ├── db/                # Database abstraction (Drizzle)
│   │   └── contracts/         # Shared Zod schemas
│   ├── adapters/
│   │   ├── http-hono/         # Hono HTTP adapter
│   │   └── db-drizzle/        # Drizzle ORM adapter
│   └── domains/               # Business domains (future)
└── docs/                      # Documentation
```

## 🚀 Quick Start

### Prerequisites

- Bun 1.0+ (recommended) or Node.js 20+
- pnpm 8+
- PostgreSQL (for production)

### Installation

```bash
# Clone and install dependencies
git clone <repository-url>
cd hono-template
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
pnpm db:migrate

# Start development server (Bun)
pnpm dev

# Or with Node.js
pnpm --filter @apps/api dev:node
```

### Environment Variables

```bash
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/db
LOG_LEVEL=info
REDIS_URL=redis://localhost:6379  # Optional
```

## 🧪 Testing

The project includes comprehensive tests at all architectural layers:

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run tests for a specific package
pnpm --filter @foundation/auth-suite test
```

### Test Structure

- **Unit Tests**: Domain entities, value objects, and business logic
- **Integration Tests**: Use cases and repository implementations  
- **API Tests**: HTTP endpoints and request/response handling
- **E2E Tests**: Complete user flows (planned)

### Test Files

- `*.test.ts`: Unit and integration tests
- `*.spec.ts`: Specification-style tests
- `vitest.config.ts`: Test configuration

### Mock Strategy

- Repository interfaces are mocked for unit testing
- Use case tests use mock dependencies
- API tests use mock services for isolation

## 📦 Available Scripts

### Root Level
- `pnpm build` - Build all packages
- `pnpm test` - Run all tests
- `pnpm lint` - Type checking
- `pnpm db:generate` - Generate Drizzle migrations
- `pnpm db:migrate` - Run database migrations
- `pnpm db:studio` - Open Drizzle Studio

### Package Specific
- `pnpm --filter @apps/api dev` - Start API server
- `pnpm --filter @foundation/app-core test` - Test app-core package

## 🏛️ Core Principles

### 1. Framework Agnostic Domains
- Domain logic has zero framework dependencies
- Can be used with Hono, Fastify, Express, etc.

### 2. Type Safety First
- TypeScript strict mode enabled
- `any` type prohibited
- Zod for runtime validation and type inference

### 3. Testability
- In-memory fakes for unit tests
- Clear dependency injection
- Ports & Adapters pattern

### 4. Single Source of Truth
- Zod schemas define all contracts
- Types inferred from schemas
- No duplicate type definitions

## 🔧 Development Guide

### Adding a New Domain

1. Create domain package:
```bash
mkdir -p packages/domains/your-domain/src/{domain,application,infrastructure}
```

2. Follow the standard structure:
```
packages/domains/your-domain/
├── src/
│   ├── domain/           # Entities, VOs, Policies
│   ├── application/      # Use cases, Ports
│   ├── infrastructure/   # Port implementations
│   └── contracts.ts      # Zod schemas
└── tests/
    ├── fakes/           # In-memory implementations
    └── usecases/        # Use case tests
```

### Adding a New API Endpoint

1. Define Zod schema in `@foundation/contracts`
2. Create use case in relevant domain
3. Add handler in `@adapters/http-hono`
4. Register route in `apps/api`

### Database Changes

1. Update Drizzle schema in `@foundation/db/src/schema`
2. Generate migration: `pnpm db:generate`
3. Apply migration: `pnpm db:migrate`

## 📊 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Get current user

### Health
- `GET /health` - Health check

## 🔐 Security Features

- Password hashing with Argon2
- JWT-like session tokens
- Request context tracking
- Audit logging
- Input validation with Zod

## 📈 Monitoring & Observability

- Structured logging with Pino
- Request tracing with trace IDs
- Health check endpoints
- Error tracking with context

## 🧩 Technology Stack

**Backend:**
- Hono (HTTP framework)
- Drizzle ORM (Type-safe database)
- Zod (Validation & types)
- PostgreSQL (Database)
- Vitest (Testing)

**Infrastructure:**
- pnpm (Package manager)
- TypeScript (Language)
- Path aliases (Clean imports)

## 🤝 Contributing

1. Follow the existing code patterns
2. Add tests for new features
3. Update documentation
4. Ensure type safety (no `any` types)
5. Run tests before submitting

## 📄 License

MIT License - see LICENSE file for details.
