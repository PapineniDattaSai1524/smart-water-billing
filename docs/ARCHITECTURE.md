# Architecture Overview — Week 1 & Week 2

## High-Level Diagram

```
┌──────────────────────┐        HTTPS / REST (JSON)        ┌───────────────────────────┐
│   React 19 + Vite     │ ───────────────────────────────▶ │   Spring Boot 3 (Java 17)   │
│   TypeScript + Tailwind│ ◀─────────────────────────────── │   REST API (port 8080)      │
│   Axios + React Query │        JWT Bearer tokens          │                             │
└──────────────────────┘                                    │  Controller → Service →     │
                                                              │  Repository → Entity (JPA)  │
                                                              └──────────────┬─────────────┘
                                                                             │
                                                                     Flyway migrations
                                                                             │
                                                                     ┌───────▼────────┐
                                                                     │  PostgreSQL     │
                                                                     └────────────────┘
```

## Backend Layering

```
controller/   → REST endpoints, request/response mapping, Swagger annotations, @PreAuthorize
service/      → Business logic, transactional boundaries, validation rules requiring DB lookups
repository/   → Spring Data JPA interfaces
entity/       → JPA-mapped domain model
dto/          → Request/response payloads, decoupled from entities
mapper/       → Entity ↔ DTO conversion
security/     → JWT filter, JWT service, Spring Security UserDetails adapter
config/       → SecurityConfig, SwaggerConfig, JPA auditing
exception/    → Custom exceptions + centralized @RestControllerAdvice
validation/   → Custom Bean Validation constraints (cross-field date checks, file checks)
util/         → CSV parsing, security context helpers
```

This is a classic layered (N-tier) architecture: controllers never touch
repositories directly, and services never build HTTP-specific objects —
keeping business logic testable in isolation (see the Mockito unit tests).

## Authentication Flow

1. `POST /auth/register` — creates a `User` with a BCrypt-hashed password.
2. `POST /auth/login` — Spring Security's `AuthenticationManager` validates
   credentials via `CustomUserDetailsService`; on success, `JwtService`
   issues a short-lived **access token** and a longer-lived **refresh
   token**.
3. Every subsequent request carries `Authorization: Bearer <accessToken>`.
   `JwtAuthenticationFilter` validates the token and populates Spring
   Security's context so `@PreAuthorize("hasRole('ADMIN')")` checks work.
4. When the access token expires, the frontend's Axios interceptor
   automatically calls `POST /auth/refresh` with the refresh token and
   retries the original request — transparent to the user.

## Data Model Relationships

```
User (ADMIN|RESIDENT) ──administers──▶ Apartment ──has many──▶ Household
User ──assigned via ResidentAssignment (PRIMARY|MEMBER)──▶ Household
Household ──configures──▶ WaterMeterConfig (1:1)
Household ──has many──▶ WaterUsageLog (one per reading_date)
```

## Water Usage & Consumption Logic

Consumption is never accepted from the client — it's derived server-side in
`WaterUsageLogService`:

```
consumption_kl = current_meter_reading_kl - previous_reading_kl
```

`previous_reading_kl` is the household's most recent prior `WaterUsageLog`
entry (or the meter's `initial_reading` for the very first entry). This
applies identically to manual entry and CSV bulk upload, ensuring
consistent, auditable consumption figures regardless of entry method.

## Frontend Architecture

```
api/            → Axios instance with JWT attach + auto-refresh interceptor
services/       → One typed function-set per REST resource (thin HTTP wrappers)
hooks/          → React Query hooks (useQuery/useMutation) wrapping services,
                  handling caching + invalidation
contexts/       → AuthContext (current user, login/logout, token bootstrap)
components/     → Reusable UI split by domain (apartment/, household/, ...)
                  plus common/ (ProtectedRoute, spinners, error banners)
layouts/        → AuthLayout (centered card) and MainLayout (navbar + sidebar)
pages/          → Route-level screens, one per domain
utils/          → Zod schemas, shared types, API error formatting
```

Routing (`react-router-dom`) uses nested `<ProtectedRoute>` elements: one
guarding "must be logged in", nested inside another guarding
"must be ADMIN" for the Resident Assignment and Meter Configuration screens.

## Security Notes (Week 1/2 scope)

- Passwords are BCrypt-hashed (never stored/returned in plaintext).
- Stateless JWT auth — no server-side session storage.
- Method-level authorization via `@PreAuthorize` in addition to URL-pattern
  rules in `SecurityConfig`.
- Bean Validation (`jakarta.validation`) on every request DTO, plus two
  custom cross-cutting constraints: `@ValidDateRange` (move-in/move-out) and
  `@FileNotEmpty` (CSV upload).
- Centralized `GlobalExceptionHandler` ensures no stack traces or internal
  details leak to API consumers.
