# Parking Admin API

Sistema de administración de estacionamientos — backend REST construido con **NestJS 11**, **TypeScript** y **PostgreSQL** via TypeORM.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | NestJS 11 |
| Lenguaje | TypeScript 5 |
| Base de datos | PostgreSQL |
| ORM | TypeORM 0.3 |
| Autenticación | JWT (access + refresh) + Passport |
| Validación | class-validator / class-transformer |
| Documentación | Swagger / OpenAPI |
| Logging | Winston (nest-winston) |
| Testing | Jest + Supertest |

---

## Requisitos previos

- Node.js ≥ 20
- PostgreSQL ≥ 14

---

## Instalación

```bash
cd backend
npm install
```

---

## Variables de entorno

Crear `backend/.env` con las siguientes variables:

```env
DATABASE_URL=postgres://user:pass@localhost:5432/parking

JWT_SECRET=
JWT_EXPIRES_IN=15m

JWT_REFRESH_SECRET=
JWT_REFRESH_EXPIRES_IN=7d

NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
DATABASE_SSL_REJECT_UNAUTHORIZED=false   # requerido con Supabase o certificados self-signed
```

> Las migraciones corren automáticamente al iniciar en todos los entornos (`migrationsRun: true`). En desarrollo, `synchronize: true` actúa como red de seguridad para cambios rápidos en entidades.

---

## Comandos

Todos los comandos se ejecutan desde `backend/`:

```bash
npm run start:dev       # Servidor con hot-reload
npm run start:prod      # Producción (requiere build previo)
npm run build           # Compilar TypeScript

npm run test            # Unit tests
npm run test:watch      # Tests en modo watch
npm run test:cov        # Reporte de cobertura
npm run test:e2e        # Tests end-to-end

npm run lint            # ESLint + auto-fix
npm run format          # Prettier

npm run seed            # Poblar base de datos con datos iniciales
npm run migration:run                                        # Ejecutar migraciones pendientes
npm run migration:revert                                     # Revertir última migración
npm run migration:generate -- src/database/migrations/Nombre # Generar desde cambios en entidades
```

Ejecutar un único archivo de test:

```bash
npx jest src/path/to/file.spec.ts
```

---

## API

- **Base URL:** `http://localhost:3000/api/v1`
- **Swagger UI:** `http://localhost:3000/api/docs`

---

## Arquitectura

El proyecto sigue una arquitectura **hexagonal/por capas**. Los módulos con más lógica de dominio exponen sus repositorios a través de interfaces (ports) en `ports/`, con implementaciones TypeORM en `infrastructure/orm/`.

```
src/
├── config/                     # Configuración: app, database, jwt, logger
├── shared/
│   ├── entities/               # BaseEntity (uuid PK, created_at, updated_at)
│   ├── decorators/             # @CurrentUser(), @Roles()
│   ├── guards/                 # RolesGuard
│   ├── filters/                # HttpExceptionFilter
│   └── dto/                    # PaginationDto, PaginatedResult
├── auth/                       # Login, refresh, logout, /me
├── users/                      # CRUD de usuarios, cambio de contraseña
├── vehicles/                   # CRUD de vehículos, búsqueda por patente
├── tariffs/                    # CRUD de tarifas (con soft delete)
├── spaces/                     # Espacios de estacionamiento (auto, moto, discapacidad)
├── parking/                    # Sesiones de estacionamiento (entrada/salida)
├── tickets/                    # Tickets de cobro, pago y cancelación
├── payments/                   # Registro de pagos
├── shifts/                     # Turnos de caja (apertura, cierre, cuadre)
├── monthly-passes/             # Abonos mensuales por vehículo
├── audit/                      # Log de auditoría (append-only)
├── dashboard/                  # Estadísticas agregadas
└── database/
    ├── data-source.ts          # DataSource para CLI de TypeORM
    └── migrations/             # Migraciones TypeORM
```

---

## Dominio

### Entidades principales

| Entidad | Tabla | Descripción |
|---------|-------|-------------|
| `User` | `users` | Operadores del sistema (soft delete) |
| `Vehicle` | `vehicles` | Vehículos registrados por patente |
| `Tariff` | `tariffs` | Tarifas horarias (soft delete) |
| `ParkingSpace` | `parking_spaces` | Espacios físicos del estacionamiento |
| `ParkingSession` | `parking_sessions` | Sesión de estacionamiento (entrada → salida) |
| `Ticket` | `tickets` | Ticket de cobro 1:1 con sesión |
| `Payment` | `payments` | Pagos asociados a un ticket |
| `Shift` | `shifts` | Turno de caja del cajero |
| `MonthlyPass` | `monthly_passes` | Abono mensual por vehículo |
| `AuditLog` | `audit_logs` | Registro de auditoría (no extiende BaseEntity) |

### Relaciones clave

```
ParkingSession → Vehicle, Tariff, User (entrada + salida)
Ticket (1:1)   → ParkingSession
Payment (N:1)  → Ticket, Shift, User
Shift          → User (cajero)
MonthlyPass    → Vehicle
AuditLog       → User
```

---

## Autenticación y Roles

### Roles disponibles

| Rol | Descripción |
|-----|-------------|
| `ADMIN` | Acceso total |
| `CASHIER` | Operaciones de caja (entradas, cobros, turnos) |
| `SUPERVISOR` | Supervisión y reportes |

### Flujo JWT

1. `POST /api/v1/auth/login` → devuelve `accessToken` (15 min) + `refreshToken` (7 días)
2. `POST /api/v1/auth/refresh` → renueva el access token usando el refresh token
3. `POST /api/v1/auth/logout` → invalida el refresh token almacenado

El refresh token se almacena **hasheado con bcrypt** en la columna `users.refresh_token`.

### Guards

| Guard | Uso |
|-------|-----|
| `JwtAuthGuard` | Valida el access token |
| `JwtRefreshGuard` | Valida el refresh token en `/auth/refresh` |
| `RolesGuard` + `@Roles()` | Control de acceso por rol |

---

## Flujo de operación

```
1. Cajero abre turno (POST /shifts/open)
2. Vehículo ingresa (POST /parking/entry)
   └─ Se verifica espacio disponible con pessimistic lock
   └─ Se detecta si tiene abono mensual activo
3. Al salir, se genera ticket (automático en exit)
4. Cajero cobra el ticket (POST /tickets/:id/pay)
   └─ Se aplica descuento si corresponde
   └─ Se registra el pago y se cierra la sesión
5. Cajero cierra turno con cuadre de caja (POST /shifts/close)
```

---

## Espacios de estacionamiento

| Tipo | Descripción |
|------|-------------|
| `CAR` | Automóvil |
| `MOTORCYCLE` | Motocicleta |
| `DISABLED` | Discapacitados |

Estados: `AVAILABLE` | `OCCUPIED` | `MAINTENANCE`

---

## Dashboard

`GET /api/v1/dashboard/stats?period=day|week|month`

Retorna:
- Sesiones activas en tiempo real
- Total de sesiones, monto cotizado y monto cobrado
- Ticket promedio y tasa de cobro
- Serie temporal agrupada por día / semana / mes

---

## Convenciones

- Todas las entidades extienden `BaseEntity` (uuid PK, `created_at`, `updated_at`), excepto `AuditLog`
- Soft delete con `@DeleteDateColumn` en `users`, `tariffs`, `monthly_passes` y `spaces`
- Nombres de columnas en **snake_case** (DB) / **camelCase** (TypeScript)
- Errores retornan códigos string (`INVALID_CREDENTIALS`, `VEHICLE_ALREADY_PARKED`, etc.) — no mensajes en texto libre
- `AppModule` solo importa `ConfigModule`, `TypeOrmModule` y módulos de features — sin lógica de negocio

---

## Convenciones de respuesta HTTP

| Situación | Código |
|-----------|--------|
| Recurso no encontrado | `404 NOT_FOUND` |
| Validación de negocio fallida | `400 BAD_REQUEST` |
| Sin autenticación | `401 UNAUTHORIZED` |
| Sin permisos de rol | `403 FORBIDDEN` |
