# Titanbay take-home — API backend (TypeScript)

**Fastify** + **PostgreSQL** + **Drizzle ORM** + **Zod**. Domain tables are defined in `src/db/schema.ts`; only `GET /health` is exposed so far.

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
- `src/routes/` — add REST modules and register them from `app.ts`.

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

4. Run the server:

   ```bash
   npm run dev
   ```

   Health check: `GET http://localhost:3000/health`

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
- `npm run db:push` — apply schema to DB (after you define tables)
- `npm run db:generate` / `db:migrate` — SQL migrations
- `npm run db:studio` — Drizzle Studio
