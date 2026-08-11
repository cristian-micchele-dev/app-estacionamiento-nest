# Parking Admin — Backend

Sistema de administración de estacionamientos. API REST con NestJS 11, TypeScript y PostgreSQL.

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | NestJS 11 + TypeScript |
| ORM | TypeORM |
| Base de datos | PostgreSQL 16 |
| Auth | JWT (access 15m + refresh 7d, bcrypt) |
| Logging | Winston |
| Docs | Swagger / OpenAPI |
| Tests | Jest (unit) |

## Arquitectura

El proyecto sigue una arquitectura **hexagonal/ports & adapters** aplicada de forma consistente en todos los módulos de dominio. Los módulos transversales (`audit`, `dashboard`) usan acceso directo al repositorio ya que no contienen lógica de dominio reutilizable.

```
src/
├── config/                    # registerAs: app, database, jwt
├── shared/
│   ├── entities/              # BaseEntity (uuid PK, timestamps)
│   ├── decorators/            # @CurrentUser(), @Roles()
│   ├── guards/                # RolesGuard
│   ├── filters/               # HttpExceptionFilter (string error codes)
│   └── dto/                   # PaginationDto, PaginatedResult
│
├── auth/                      # JWT access + refresh token flow
├── users/
│   ├── ports/                 # IUserRepository (Symbol token)
│   └── infrastructure/orm/    # UserOrmRepository (adapter)
├── vehicles/
│   ├── ports/                 # IVehicleRepository
│   └── infrastructure/orm/    # VehicleOrmRepository
├── tariffs/
│   ├── ports/                 # ITariffRepository
│   └── infrastructure/orm/    # TariffOrmRepository
├── spaces/
│   ├── ports/                 # ISpaceRepository
│   └── infrastructure/orm/    # SpaceOrmRepository
├── parking/
│   ├── ports/                 # ISessionRepository
│   └── infrastructure/orm/    # SessionOrmRepository
├── tickets/
│   ├── ports/                 # ITicketRepository
│   └── infrastructure/orm/    # TicketOrmRepository
├── payments/
│   ├── ports/                 # IPaymentRepository
│   └── infrastructure/orm/    # PaymentOrmRepository
├── shifts/
│   ├── ports/                 # IShiftRepository
│   └── infrastructure/orm/    # ShiftOrmRepository
├── monthly-passes/
│   ├── ports/                 # IMonthlyPassRepository
│   └── infrastructure/orm/    # MonthlyPassOrmRepository
│
├── audit/                     # Append-only audit log (infrastructure)
└── dashboard/                 # Read model / reporting (raw SQL)
```

### Patrón port/adapter

Cada módulo de dominio define un **puerto** (interfaz + Symbol token) y un **adaptador** ORM:

```
// puerto
export const TARIFF_REPOSITORY = Symbol('ITariffRepository');
export interface ITariffRepository { ... }

// adaptador
@Injectable()
export class TariffOrmRepository implements ITariffRepository { ... }

// módulo — binding
{ provide: TARIFF_REPOSITORY, useClass: TariffOrmRepository }

// servicio — inyección
constructor(@Inject(TARIFF_REPOSITORY) private readonly repo: ITariffRepository) {}
```

### Dominio

```
ParkingSession → Vehicle, Tariff, User (entry + exit operators), Space
Ticket (1:1)   → ParkingSession — facturación calculada
Payment (many) → Ticket, Shift, User
Shift          → User (cajero) — balance apertura/cierre
MonthlyPass    → Vehicle — suscripción por rango de fechas
AuditLog       → User — append-only, no extiende BaseEntity
```

### Roles

`ADMIN` · `SUPERVISOR` · `CASHIER`

### Auth flow

1. Login devuelve `accessToken` (15m) + `refreshToken` (7d)
2. Refresh token se hashea con bcrypt antes de almacenar
3. Access token vive **en memoria** del cliente (no localStorage)
4. `/auth/refresh` rota ambos tokens
5. Logout nulifica el refresh token almacenado

## Levantar con Docker

```bash
# En la raíz del proyecto (donde está docker-compose.yml)
docker compose up -d

# La API queda disponible en http://localhost:3000
# Swagger: http://localhost:3000/api/docs
```

## Desarrollo local

### 1. Variables de entorno

```bash
cp backend/.env.example backend/.env
# Completar JWT_SECRET, JWT_REFRESH_SECRET y DATABASE_URL
```

### 2. Instalar dependencias

```bash
cd backend && npm install
```

### 3. Levantar PostgreSQL (o usar Docker)

```bash
docker compose up db -d
```

### 4. Iniciar el servidor

```bash
npm run start:dev
```

## Comandos

```bash
npm run start:dev     # Servidor con watch
npm run build         # Compilar TypeScript
npm run lint          # ESLint + auto-fix
npm run test          # Unit tests (Jest)
npm run test:cov      # Coverage

# Migraciones (DB debe estar corriendo)
npm run migration:run                                          # Ejecutar pendientes
npm run migration:revert                                       # Revertir última
npm run migration:generate -- src/database/migrations/Nombre  # Generar desde entidades
```

## API

- Base URL: `http://localhost:3000/api/v1`
- Swagger: `http://localhost:3000/api/docs`
- Autenticación: Bearer token en header `Authorization`

## Variables de entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | Conexión PostgreSQL | `postgres://user:pass@localhost:5432/parking` |
| `JWT_SECRET` | Secreto access token | string aleatorio largo |
| `JWT_EXPIRES_IN` | Expiración access token | `15m` |
| `JWT_REFRESH_SECRET` | Secreto refresh token | string aleatorio distinto |
| `JWT_REFRESH_EXPIRES_IN` | Expiración refresh token | `7d` |
| `NODE_ENV` | Entorno | `development` / `production` |
| `FRONTEND_URL` | CORS origin | `http://localhost:5173` |
| `PORT` | Puerto del servidor | `3000` |
| `DATABASE_SSL_REJECT_UNAUTHORIZED` | SSL cert validation | `false` con Supabase/self-signed |
