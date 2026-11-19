# Database — Smart Water Usage and Consumer Billing System

Week 1 & Week 2 scope. PostgreSQL 14+ recommended. Schema is version-controlled
via **Flyway** and applied automatically on backend startup from
`backend/src/main/resources/db/migration/`. The SQL files in `migrations/`
here are copies kept for quick reference / manual review.

## Setup

```bash
# 1. Create the database
createdb smart_water_db

# 2. Configure credentials (or use the defaults below) via environment
#    variables before starting the backend:
export DB_URL=jdbc:postgresql://localhost:5432/smart_water_db
export DB_USERNAME=postgres
export DB_PASSWORD=postgres

# 3. Start the Spring Boot app — Flyway will run V1__init_schema.sql and
#    V2__seed_data.sql automatically.
```

## Entity Relationship Overview

```
users (1) ──< resident_assignments >── (1) households (N) ──< households  >── (1) apartments
  |                                            |
  | (1..1, optional FK admin_id)               | (1..1)
  ▼                                            ▼
apartments                            water_meter_configs

households (1) ──< water_usage_logs
```

### Tables (Week 1 & 2)

| Table                  | Purpose                                                            |
|-------------------------|---------------------------------------------------------------------|
| `users`                | Registered accounts (ADMIN / RESIDENT), BCrypt-hashed passwords     |
| `apartments`           | Apartment communities onboarded to the platform                     |
| `households`           | Individual units within an apartment (unique per apartment+unit)    |
| `resident_assignments` | Links residents (users) to households, with PRIMARY/MEMBER relation |
| `water_meter_configs`  | One-to-one meter configuration per household                       |
| `water_usage_logs`     | Daily/periodic meter readings and computed consumption per household|

### Tables (schema foundation only — no API in Week 1/2)

| Table            | Purpose                                                                 |
|-------------------|--------------------------------------------------------------------------|
| `tariff_plans`   | Reserved for the Week 3-4 billing engine (rate slabs per apartment)      |
| `billing_cycles` | Reserved for the Week 3-4 billing engine (monthly/period billing runs)   |

These two tables exist in the schema now (per the project's overall data
model) but have **no entities, repositories, services, or controllers** in
this Week 1/2 build — they are intentionally out of scope until Week 3/4.

## Key Constraints

- `households`: unique `(apartment_id, unit_number)`
- `resident_assignments`: unique `(household_id, user_id)` — prevents duplicate active assignment rows
- `water_meter_configs`: one-to-one via unique `household_id`, unique `meter_number`
- `water_usage_logs`: unique `(household_id, reading_date)` — one reading per household per day
- Consumption (`consumption_kl`) is computed server-side as
  `current_reading - previous_reading` (previous log entry, or the meter's
  `initial_reading` if this is the first entry for that household), and is
  rejected if negative.

## Seed Data

`V2__seed_data.sql` creates a demo `admin` / `ravikumar` user pair
(password: `Password@123`), one apartment, one household, and one configured
meter, for local smoke-testing.
