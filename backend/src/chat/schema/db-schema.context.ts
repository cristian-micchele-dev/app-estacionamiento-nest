export const DB_SCHEMA_CONTEXT = `
Tables and columns (PostgreSQL, snake_case):

-- Base columns present in ALL tables except audit_logs:
--   id UUID PRIMARY KEY
--   created_at TIMESTAMPTZ
--   updated_at TIMESTAMPTZ

TABLE users
  id            UUID PK
  name          VARCHAR(100)
  email         VARCHAR(150) UNIQUE
  role          ENUM('ADMIN','CASHIER','SUPERVISOR')
  is_active     BOOLEAN
  deleted_at    TIMESTAMPTZ nullable  -- soft delete

TABLE vehicles
  id            UUID PK
  plate         VARCHAR(20) UNIQUE
  type          ENUM('CAR','MOTORCYCLE','TRUCK','VAN','BUS')
  brand         VARCHAR(100) nullable
  color         VARCHAR(50)  nullable
  observations  TEXT nullable
  deleted_at    TIMESTAMPTZ nullable  -- soft delete

TABLE tariffs
  id                   UUID PK
  name                 VARCHAR(100)
  price_per_hour       DECIMAL(10,2)
  price_per_half_hour  DECIMAL(10,2)
  tolerance_minutes    INT
  daily_max            DECIMAL(10,2) nullable
  overnight_rate       DECIMAL(10,2) nullable
  overnight_start_hour INT  (default 22)
  overnight_end_hour   INT  (default 8)
  is_active            BOOLEAN
  effective_from       TIMESTAMPTZ
  effective_to         TIMESTAMPTZ nullable
  deleted_at           TIMESTAMPTZ nullable  -- soft delete

TABLE parking_spaces
  id          UUID PK
  code        VARCHAR(10) UNIQUE
  type        ENUM('CAR','MOTORCYCLE','DISABLED')
  status      ENUM('AVAILABLE','OCCUPIED','MAINTENANCE')
  deleted_at  TIMESTAMPTZ nullable

TABLE parking_sessions
  id              UUID PK
  ticket_number   VARCHAR(20) UNIQUE
  vehicle_id      UUID FK -> vehicles.id
  tariff_id       UUID FK -> tariffs.id
  entry_by_id     UUID FK -> users.id   (operator who registered entry)
  exit_by_id      UUID FK -> users.id   nullable (operator who registered exit)
  monthly_pass_id UUID FK -> monthly_passes.id nullable
  space_id        UUID FK -> parking_spaces.id nullable
  entry_time      TIMESTAMPTZ
  exit_time       TIMESTAMPTZ nullable
  status          ENUM('ACTIVE','COMPLETED','CANCELLED')
  notes           TEXT nullable

TABLE tickets
  id               UUID PK
  session_id       UUID FK -> parking_sessions.id (1:1)
  duration_minutes INT
  subtotal         DECIMAL(10,2)
  discount_amount  DECIMAL(10,2)
  total_amount     DECIMAL(10,2)
  status           ENUM('PENDING','PAID','CANCELLED')

TABLE payments
  id               UUID PK
  ticket_id        UUID FK -> tickets.id
  shift_id         UUID FK -> shifts.id nullable
  processed_by_id  UUID FK -> users.id
  amount           DECIMAL(10,2)
  method           ENUM('CASH','CARD','TRANSFER','MONTHLY_PASS')
  received_amount  DECIMAL(10,2) nullable
  change_amount    DECIMAL(10,2) nullable
  paid_at          TIMESTAMPTZ

TABLE shifts
  id                      UUID PK
  cashier_id              UUID FK -> users.id
  opened_at               TIMESTAMPTZ
  closed_at               TIMESTAMPTZ nullable
  opening_balance         DECIMAL(10,2)
  closing_balance_counted DECIMAL(10,2) nullable
  closing_balance_system  DECIMAL(10,2) nullable
  difference              DECIMAL(10,2) nullable  (positive = surplus, negative = deficit)
  status                  ENUM('OPEN','CLOSED')
  notes                   TEXT nullable

TABLE monthly_passes
  id            UUID PK
  vehicle_id    UUID FK -> vehicles.id
  holder_name   VARCHAR(150)
  holder_phone  VARCHAR(30) nullable
  holder_email  VARCHAR(150) nullable
  valid_from    DATE
  valid_to      DATE
  price_paid    DECIMAL(10,2)
  is_active     BOOLEAN
  notes         TEXT nullable
  deleted_at    TIMESTAMPTZ nullable

TABLE audit_logs
  id          UUID PK
  user_id     UUID FK -> users.id nullable
  action      VARCHAR  (e.g. 'CREATE_SESSION', 'CLOSE_SHIFT')
  entity      VARCHAR  (table name affected)
  entity_id   VARCHAR nullable
  metadata    JSONB nullable
  created_at  TIMESTAMPTZ
`;
