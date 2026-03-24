# Titanbay take-home — API backend (TypeScript)

**Fastify** + **PostgreSQL** + **Drizzle ORM** + **Zod**. REST handlers live under `src/routes/`; JSON uses **snake_case** field names to match the API contract.

## Stack

| Layer            | Choice                                                         |
| ---------------- | -------------------------------------------------------------- |
| HTTP             | [Fastify](https://fastify.dev/)                                |
| Database         | [PostgreSQL](https://www.postgresql.org/)                      |
| ORM / migrations | [Drizzle ORM](https://orm.drizzle.team/) + `drizzle-kit`       |
| Validation       | [Zod](https://zod.dev/) (helpers in `src/lib/validate.ts`)     |
| Driver           | [postgres](https://github.com/porsager/postgres) (postgres.js) |

## Data model (PostgreSQL)

| Table | Drizzle export | Notes |
| ----- | -------------- | ----- |
| `funds` | `funds` | `status` enum: `Fundraising`, `Investing`, `Closed` |
| `investors` | `investors` | `investor_type` enum: `Individual`, `Institution`, `Family Office`; unique `email` |
| `investments` | `investments` | FK `investor_id` → `investors.id`, `fund_id` → `funds.id` (restrict on delete) |

USD amounts use `numeric(20,2)`. `investment_date` is a PostgreSQL `date` (ISO string in app code). `created_at` on funds and investors is `timestamptz`.

Apply to your database: `npm run db:push` or generate migrations with `npm run db:generate` then `npm run db:migrate`.

## What’s included

- `src/db/schema.ts` — funds, investors, investments + enums.
- `src/db/index.ts` — `DATABASE_URL` and Drizzle client with schema.
- `src/lib/errors.ts`, `src/lib/validate.ts`, `src/plugins/error-handler.ts` — validation and JSON errors.
- `src/routes/` — `funds.ts`, `investors.ts`, `investments.ts`; registered from `app.ts`.

## HTTP API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/funds` | List funds |
| POST | `/funds` | Create fund (`name`, `vintage_year`, `target_size_usd`, `status`) |
| PUT | `/funds` | Update fund (body includes `id` plus fields above) |
| GET | `/funds/:id` | Get fund by UUID |
| GET | `/investors` | List investors |
| POST | `/investors` | Create investor (`name`, `investor_type`, `email`) |
| GET | `/funds/:id/investments` | List investments for a fund (`id` = fund UUID) |
| POST | `/funds/:id/investments` | Create investment (`investor_id`, `amount_usd`, `investment_date` as `YYYY-MM-DD`) |

Success bodies match the spec (arrays or single objects at the root, no `{ "data": ... }` wrapper). `404` uses `NOT_FOUND` when a fund or investor is missing; duplicate investor email returns `409 CONFLICT`.

## Setup

1. Copy environment file and adjust if needed:

   ```bash
   cp .env.example .env
   ```

2. Start PostgreSQL (Docker example):

   ```bash
   docker compose up -d
   ```

3. Install dependencies. After you add tables to `schema.ts`, sync the database:

   ```bash
   npm install
   npm run db:push
   ```

   For SQL migration files instead of push:

   ```bash
   npm run db:generate
   npm run db:migrate
   ```

4. (Optional) Load **test data** (clears `investments`, `investors`, and `funds`, then inserts sample rows with fixed UUIDs):

   ```bash
   npm run db:seed
   ```

5. Run the server:

   ```bash
   npm run dev
   ```

   Health check: `GET http://localhost:3000/health`

### Try the API after seeding

Replace host/port if needed (`PORT` in `.env`).

```bash
# List funds
curl -s http://localhost:3000/funds | jq

# One fund (id from seed)
curl -s http://localhost:3000/funds/550e8400-e29b-41d4-a716-446655440000 | jq

# List investors
curl -s http://localhost:3000/investors | jq

# Investments for fund I
curl -s http://localhost:3000/funds/550e8400-e29b-41d4-a716-446655440000/investments | jq

# Create another investment
curl -s -X POST http://localhost:3000/funds/550e8400-e29b-41d4-a716-446655440000/investments \
  -H "Content-Type: application/json" \
  -d '{"investor_id":"770e8400-e29b-41d4-a716-446655440002","amount_usd":1000000,"investment_date":"2024-06-01"}' | jq
```

`db:seed` is **destructive** for those three tables; run it only when you want a clean, known dataset.

For a **step-by-step testing guide** (every endpoint, error cases, optional Studio/build), see **[TESTING.md](./TESTING.md)**.

## Errors (JSON)

Operational and validation errors use a consistent shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": { }
  }
}
```

## Scripts

- `npm run dev` — watch mode with `tsx`
- `npm run build` / `npm start` — compile and run `dist/`
- `npm test` — unit tests (Vitest, no database)
- `npm run test:integration` — API + Postgres tests (needs **PostgreSQL running** and `.env` with `DATABASE_URL`; skipped with a warning if the DB is unreachable)
- `npm run test:watch` — Vitest watch (unit only)
- `npm run db:push` — apply schema to DB (after you define tables)
- `npm run db:seed` — reset and insert sample funds / investors / investments (see Setup)
- `npm run db:generate` / `db:migrate` — SQL migrations
- `npm run db:studio` — Drizzle Studio
