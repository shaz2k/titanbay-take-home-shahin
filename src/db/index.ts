import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is required");
}

const client = postgres(url, { max: 10 });

/** Drizzle client. Pass `{ schema }` to `drizzle()` once you export tables from `schema.ts`. */
export const db = drizzle(client);
