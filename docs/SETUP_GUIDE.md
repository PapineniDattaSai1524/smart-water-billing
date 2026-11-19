# Setup Guide — Smart Water Usage and Consumer Billing System

Week 1 & Week 2 build. Follow these steps to run the full stack locally.

## Prerequisites

- Java 17 (JDK)
- Maven 3.9+ (or use the included wrapper if you add one)
- Node.js 20+ and npm 10+
- PostgreSQL 14+
- (Optional) Postman or the built-in Swagger UI for API testing

## 1. Database Setup

```bash
createdb smart_water_db
```

No manual schema work is needed — Flyway migrations under
`backend/src/main/resources/db/migration/` run automatically on backend
startup and create all tables + seed demo data.

## 2. Backend Setup

```bash
cd backend

# Configure DB credentials (defaults shown; override as needed)
export DB_URL=jdbc:postgresql://localhost:5432/smart_water_db
export DB_USERNAME=postgres
export DB_PASSWORD=postgres

# Optionally override the JWT secret used to sign tokens (recommended for
# anything beyond local development)
export JWT_SECRET=$(openssl rand -hex 32)

mvn clean install
mvn spring-boot:run
```

The API will be available at `http://localhost:8080`.
Swagger UI: `http://localhost:8080/swagger-ui.html`

### Running Tests

```bash
cd backend
mvn test
```

Tests run against an in-memory H2 database (`application-test.properties`)
and do not require PostgreSQL to be running.

### Demo Credentials (from V2 seed data)

| Username    | Password       | Role     |
|-------------|----------------|----------|
| `admin`     | `Password@123` | ADMIN    |
| `ravikumar` | `Password@123` | RESIDENT |

## 3. Frontend Setup

```bash
cd frontend
cp .env.example .env
# Edit .env if your backend runs somewhere other than localhost:8080

npm install
npm run dev
```

The app will be available at `http://localhost:5173`. Vite is configured to
proxy `/api` requests to `http://localhost:8080` in development.

### Production Build

```bash
npm run build
npm run preview
```

## 4. Typical First Run

1. Start PostgreSQL and create the database.
2. Start the backend (`mvn spring-boot:run`) — Flyway seeds a demo admin/resident.
3. Start the frontend (`npm run dev`).
4. Visit `http://localhost:5173/register` to create your own account, or log
   in with the seeded `admin` / `Password@123` credentials.
5. As ADMIN: create an Apartment → create a Household under it → configure
   its Water Meter → assign a Resident → log Water Usage (manually or via
   CSV upload).

## Troubleshooting

- **Flyway checksum errors**: if you edit an already-applied migration file,
  either `mvn flyway:repair` or drop and recreate the database in local dev.
- **401 on every request from the frontend**: check that `VITE_API_BASE_URL`
  in `.env` matches your backend's actual host/port, and that the backend is
  running.
- **CORS errors**: the backend's `app.cors.allowed-origins` property
  (default `http://localhost:5173`) must match the frontend's origin.
