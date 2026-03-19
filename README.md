# Titanbay take-home — API backend (TypeScript)

Initial **starter** repo: **Fastify** + **PostgreSQL** + **Drizzle ORM** + **Zod**, with **no application tables** and **no REST resources** beyond `GET /health`.

## Stack

| Layer            | Choice                                                         |
| ---------------- | -------------------------------------------------------------- |
| HTTP             | [Fastify](https://fastify.dev/)                                |
| Database         | [PostgreSQL](https://www.postgresql.org/)                      |
| ORM / migrations | [Drizzle ORM](https://orm.drizzle.team/) + `drizzle-kit`       |
| Validation       | [Zod](https://zod.dev/) (helpers in `src/lib/validate.ts`)     |
| Driver           | [postgres](https://github.com/porsager/postgres) (postgres.js) |

## What’s included

- `src/db/schema.ts` — empty; add `pgTable` definitions when you model the domain. (If you previously ran an older schema against the same database, old tables may still exist in Postgres until you drop them manually.)
- `src/db/index.ts` — DB connection via `DATABASE_URL`. When you have tables, pass `{ schema }` into `drizzle()` (see comment in file).
- `src/lib/errors.ts`, `src/lib/validate.ts`, `src/plugins/error-handler.ts` — patterns for validation and JSON errors.
- `src/routes/` — empty (placeholder); register new route modules from `app.ts`.

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
