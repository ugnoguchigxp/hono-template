# Hono Template - Clean Architecture Monorepo

[日本語版 (Japanese Version)](./README.jp.md)

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

### 🧠 Architecture Philosophy

This project is built on the **"Replaceability & Testability"** principle. By decoupling business logic from external frameworks and tools, we ensure that the core of your application remains stable and easy to test.

```mermaid
graph TD
    subgraph "External World"
        HTTP["HTTP (Hono)"]
        CLI["CLI"]
        CRON["Cron Jobs"]
    end

    subgraph "Adapters Layer"
        HTTP_A["HTTP Adapter"]
        DB_A["Drizzle ORM Adapter"]
    end

    subgraph "Application Layer"
        UC["Use Cases"]
        Ports["Ports (Interfaces)"]
    end

    subgraph "Domain Layer"
        Entities["Entities"]
        VO["Value Objects"]
        Policies["Domain Policies"]
    end

    HTTP --> HTTP_A
    HTTP_A --> UC
    UC --> Ports
    Ports --> DB_A
    UC --> Entities
    VO --> Entities
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

- Bun 1.0+ (required for API runtime)
- Node.js 20+ (tooling only: typecheck/lint/test)
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

# Start infrastructure (Postgres only)
docker compose up -d

# Start infrastructure with Redis (optional)
docker compose --profile redis up -d

# Start development server (Bun)
pnpm dev

# Node.js is supported for tooling only (typecheck/lint/test)
```

### Environment Variables

```bash
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/db
LOG_LEVEL=info
REDIS_URL=redis://localhost:6379  # Optional (only if Redis profile is enabled)
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

---

## 🧠 Business Logic Implementation Guide

Developing in this architecture follows an **"Inside-Out"** approach. Always start from the Domain and work your way out to the Adapters.

### 1. Define the Domain (The "What")
Start in `packages/domains/[domain-name]/src/domain`. Define your **Entities** and **Value Objects**. These should have zero dependencies on frameworks like Hono or Drizzle.

```typescript
// Example: packages/domains/billing/src/domain/Subscription.ts
export class Subscription {
  constructor(private readonly data: { id: string; status: 'active' | 'expired' }) {}
  
  isValid(): boolean {
    return this.data.status === 'active';
  }
}
```

### 2. Define the Contract (The "How it looks")
Define the data shapes using **Zod** in `packages/domains/[domain-name]/contracts.ts`. This serves as the single source of truth for both your Domain and your API.

### 3. Application Layer & Ports (The "Bridge")
In `packages/domains/[domain-name]/src/application`, define:
- **Ports**: Interfaces for operations (e.g., `ISubscriptionRepository`).
- **Use Cases**: Orchestrate the domain logic.

### 4. Infrastructure Layer (The "How it works")
Implement the Ports in `packages/adapters/db-drizzle` (for database) or within the domain's infrastructure folder for specialized services.

### 5. HTTP Adapter (The "Entry")
Create a controller/handler in `packages/adapters/http-hono` that:
1. Validates input using the Zod contract.
2. Invokes the Use Case.
3. Maps Domain results/errors to HTTP responses.

### 6. Dependency Injection (The "Glue")
Register everything in `apps/api/src/di/index.ts` (or its domain equivalents) so all components are automatically wired and available via the container.

---

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

- Password hashing with Argon2 (Argon2id for high security)
- Session management with **hashed tokens** stored in the database
- Fixed session TTL via `SESSION_TTL` (no sliding expiration by default)
- Request context tracking with unique Request IDs
- Audit logging for critical auth events (login, logout, registration, failed login)
- Input validation with Zod
- Constant-time comparison for sensitive data where applicable

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
