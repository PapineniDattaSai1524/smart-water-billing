# API Reference — Week 1 & Week 2

Base URL (local): `http://localhost:8080/api/v1`
Interactive Swagger UI: `http://localhost:8080/swagger-ui.html`
OpenAPI JSON: `http://localhost:8080/api-docs`

All responses are wrapped in a common envelope:

```json
{
  "success": true,
  "message": "Request processed successfully",
  "data": { },
  "timestamp": "2026-07-26T10:00:00Z"
}
```

Errors use the same shape via `ApiError`:

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed for one or more fields",
  "path": "/api/v1/apartments",
  "timestamp": "2026-07-26T10:00:00Z",
  "details": ["name: Apartment name is required"]
}
```

Authenticated endpoints require `Authorization: Bearer <accessToken>`.

---

## Authentication — `/auth`

| Method | Path             | Auth | Description                                  |
|--------|------------------|------|-----------------------------------------------|
| POST   | `/auth/register` | Public | Register a new ADMIN or RESIDENT user        |
| POST   | `/auth/login`    | Public | Log in, receive access + refresh JWT tokens  |
| POST   | `/auth/refresh`  | Public | Exchange a refresh token for a new token pair|

## Profile — `/profile`

| Method | Path              | Auth | Description                     |
|--------|-------------------|------|----------------------------------|
| GET    | `/profile`        | Any authenticated user | Get my profile     |
| PUT    | `/profile`        | Any authenticated user | Update my profile  |
| PUT    | `/profile/password` | Any authenticated user | Change my password |

## Apartments — `/apartments`

| Method | Path              | Auth        | Description                    |
|--------|-------------------|-------------|----------------------------------|
| POST   | `/apartments`     | ADMIN       | Create an apartment              |
| GET    | `/apartments`     | Any         | List all apartments              |
| GET    | `/apartments/{id}`| Any         | Get apartment by id               |
| PUT    | `/apartments/{id}`| ADMIN       | Update an apartment               |
| DELETE | `/apartments/{id}`| ADMIN       | Delete an apartment (cascades)    |

## Households — `/households`

| Method | Path                                | Auth  | Description                        |
|--------|--------------------------------------|-------|-------------------------------------|
| POST   | `/households`                       | ADMIN | Create a household                  |
| GET    | `/households`                       | Any   | List all households                 |
| GET    | `/households/{id}`                  | Any   | Get household by id                 |
| GET    | `/households/apartment/{apartmentId}`| Any  | List households in an apartment     |
| PUT    | `/households/{id}`                  | ADMIN | Update a household                  |
| DELETE | `/households/{id}`                  | ADMIN | Delete a household                  |

## Resident Assignments — `/resident-assignments`

| Method | Path                                        | Auth  | Description                          |
|--------|----------------------------------------------|-------|----------------------------------------|
| POST   | `/resident-assignments`                     | ADMIN | Assign a resident to a household       |
| GET    | `/resident-assignments/household/{householdId}` | Any | List assignments for a household     |
| GET    | `/resident-assignments/user/{userId}`       | Any   | List household assignments for a user  |
| PUT    | `/resident-assignments/{id}`                | ADMIN | Update an assignment                   |
| PATCH  | `/resident-assignments/{id}/deactivate`     | ADMIN | Deactivate an assignment (resident moved out) |
| DELETE | `/resident-assignments/{id}`                | ADMIN | Permanently delete an assignment       |

## Water Meter Configuration — `/meter-configs`

| Method | Path                                | Auth  | Description                       |
|--------|--------------------------------------|-------|-------------------------------------|
| POST   | `/meter-configs`                    | ADMIN | Configure a meter for a household   |
| GET    | `/meter-configs`                    | Any   | List all configured meters          |
| GET    | `/meter-configs/household/{householdId}` | Any | Get the meter config for a household |
| PUT    | `/meter-configs/{id}`               | ADMIN | Update a meter configuration        |
| DELETE | `/meter-configs/{id}`               | ADMIN | Remove a meter configuration        |

## Water Usage Logging — `/usage`

| Method | Path                                     | Auth  | Description                                    |
|--------|--------------------------------------------|-------|--------------------------------------------------|
| POST   | `/usage`                                  | Any   | Log a manual meter reading for a household        |
| POST   | `/usage/upload-csv`                       | Any   | Bulk-upload readings via CSV (`multipart/form-data`, field `file`) |
| GET    | `/usage/household/{householdId}`          | Any   | List usage logs for a household, newest first     |
| GET    | `/usage/household/{householdId}/range?from=&to=` | Any | List usage logs within a date range        |
| DELETE | `/usage/{id}`                             | ADMIN | Delete a usage log entry                          |

### CSV Upload Format

```
household_id,reading_date,meter_reading_kl,remarks
1,2026-07-01,12.5,Monthly reading
1,2026-08-01,18.0,
2,2026-08-01,9.2,New meter install
```

- `reading_date` must be `yyyy-MM-dd` and not in the future.
- `meter_reading_kl` must be numeric and `>=` the household's previous reading.
- Duplicate `(household_id, reading_date)` pairs — either already in the
  database or repeated within the same file — are reported as duplicates,
  not treated as fatal errors; the rest of the file still processes.
- The response reports `totalRows`, `successCount`, `duplicateCount`,
  `errorCount`, and a list of human-readable per-row `errors`.

---

## Consumption Calculation

For both manual entry and CSV upload, `consumption_kl` is computed
server-side, never trusted from the client:

```
consumption = current_meter_reading - previous_reading
```

Where `previous_reading` is the household's most recent prior usage log
entry, or the water meter's `initial_reading` if this is the first entry.
A negative result (reading appears to have gone backwards) is rejected with
a 400 error, and an out-of-order `reading_date` (not after the last logged
date) is also rejected.

## Role-Based Access Summary

| Role     | Can do                                                                 |
|----------|--------------------------------------------------------------------------|
| ADMIN    | Everything: manage apartments, households, resident assignments, meters, delete usage logs |
| RESIDENT | Register/login, manage own profile, view apartments/households, log/view own usage, upload CSV |
