# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Parking lot administration system — backend only (no frontend yet). NestJS 11 + TypeScript + PostgreSQL via TypeORM.

## Commands

All commands run from `backend/`:

```bash
npm run start:dev     # Dev server with watch
npm run build         # Compile TypeScript
npm run lint          # ESLint + auto-fix
npm run test          # Unit tests (Jest)
npm run test:e2e      # E2E tests
npm run test:cov      # Coverage report
```

Run a single test file:
```bash
npx jest src/path/to/file.spec.ts
```

### Migrations

Migrations run automatically on startup in **all environments** (`migrationsRun: true`).
`synchronize: true` is active only in `development` as a fallback for rapid entity changes — migrations are still the source of truth.

**Workflow for schema changes:**
```bash
# 1. Modify the ORM entity
# 2. Generate a migration (DB must be running)
npm run migration:generate -- src/database/migrations/DescribeWhatChanged

# 3. Review the generated file in src/database/migrations/
# 4. Run it
npm run migration:run

# Revert last migration if needed
npm run migration:revert
```

The `data-source.ts` file is used exclusively by the TypeORM CLI — not by the NestJS app.

## Environment Variables

Required in `backend/.env`:

```
DATABASE_URL=postgres://user:pass@localhost:5432/parking
JWT_SECRET=
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=
JWT_REFRESH_EXPIRES_IN=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
PORT=3000
```

`synchronize: true` in `development` acts as fallback only — migrations are the primary schema mechanism.
`DATABASE_SSL_REJECT_UNAUTHORIZED=false` required in `.env` when connecting to Supabase or self-signed certs.

## Architecture

The code follows a hexagonal/layered structure. ORM entities live under `infrastructure/orm/` within each domain module. There are no repository interfaces or domain models yet — services inject TypeORM `Repository<OrmEntity>` directly.

```
src/
  config/            # app.config, database.config, jwt.config (registerAs)
  shared/
    entities/        # BaseEntity (uuid PK, createdAt, updatedAt)
    decorators/      # @CurrentUser(), @Roles()
    guards/          # RolesGuard
  auth/              # JWT access + refresh token flow
  users/infrastructure/orm/
  vehicles/infrastructure/orm/
  tariffs/infrastructure/orm/
  parking/infrastructure/orm/    # parking_sessions
  tickets/infrastructure/orm/
  payments/infrastructure/orm/
  shifts/infrastructure/orm/
  monthly-passes/infrastructure/orm/
  audit/infrastructure/orm/      # audit_logs (does NOT extend BaseEntity)
```

## Domain Model

Key relationships:
- `ParkingSession` → Vehicle, Tariff, User (entry + exit operators)
- `Ticket` (1:1) → ParkingSession — calculated billing (subtotal, discount, total)
- `Payment` (many) → Ticket, Shift, User
- `Shift` → cashier User — tracks opening/closing balances and cash difference
- `MonthlyPass` → Vehicle — date-range subscription with holder contact info
- `AuditLog` → User — append-only, does not extend BaseEntity, uses `jsonb` metadata

## Roles & Auth

Roles: `ADMIN`, `CASHIER`, `SUPERVISOR`.

Auth flow:
- Login returns `accessToken` (15m) + `refreshToken` (7d)
- Refresh token is **bcrypt-hashed** before storing in `users.refresh_token`
- Logout nullifies the stored refresh token
- Guards: `JwtAuthGuard` (access token), `JwtRefreshGuard` (refresh token), `RolesGuard` + `@Roles()` decorator

## API

- Global prefix: `api/v1`
- Swagger UI: `http://localhost:3000/api/docs`
- Global `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`
- CORS allows `FRONTEND_URL` with credentials

## Conventions

- All entities extend `BaseEntity` (uuid PK, `created_at`, `updated_at`) except `AuditLogOrmEntity`
- Soft deletes via `@DeleteDateColumn` on `users` and `tariffs`
- Column names use snake_case in DB, camelCase in TypeScript
- Error responses use string codes (`INVALID_CREDENTIALS`, `USER_INACTIVE`, `ACCESS_DENIED`) — not messages
- `AppModule` only imports `ConfigModule`, `TypeOrmModule` (async), and feature modules — no business logic
