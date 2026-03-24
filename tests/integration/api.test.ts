import dotenv from "dotenv";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../../src/app.js";

dotenv.config({ path: ".env" });

/** Short probe so we skip integration tests when Postgres is down (no pool from `src/db`). */
async function canConnectToPostgres(url: string | undefined): Promise<boolean> {
  if (!url) return false;
  try {
    const postgres = (await import("postgres")).default;
    const sql = postgres(url, { max: 1, connect_timeout: 3 });
    try {
      await sql`select 1`;
      return true;
    } finally {
      await sql.end({ timeout: 2 }).catch(() => {});
    }
  } catch {
    return false;
  }
}

const dbReady = await canConnectToPostgres(process.env.DATABASE_URL);

if (!dbReady) {
  console.warn(
    "\n[integration] Skipped: PostgreSQL not reachable (DATABASE_URL in .env). " +
      "Start the DB (e.g. `docker compose up -d`) then run `npm run test:integration` again.\n"
  );
}

describe.skipIf(!dbReady)("HTTP API (integration)", () => {
  let app: FastifyInstance;
  let closeDb: () => Promise<void>;
  let db: typeof import("../../src/db/index.js").db;
  let schema: typeof import("../../src/db/index.js").schema;

  beforeAll(async () => {
    const mod = await import("../../src/db/index.js");
    db = mod.db;
    schema = mod.schema;
    closeDb = mod.closeDb;
    app = await buildApp({ logger: false });
  });

  beforeEach(async () => {
    await db.delete(schema.investments);
    await db.delete(schema.investors);
    await db.delete(schema.funds);
  });

  afterAll(async () => {
    await app.close();
    await closeDb();
  });

  it("GET /health", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ status: "ok" });
  });

  it("POST /funds then GET /funds and GET /funds/:id", async () => {
    const create = await app.inject({
      method: "POST",
      url: "/funds",
      headers: { "content-type": "application/json" },
      payload: {
        name: "Test Fund",
        vintage_year: 2025,
        target_size_usd: 1000000,
        status: "Fundraising",
      },
    });
    expect(create.statusCode).toBe(201);
    const created = JSON.parse(create.body) as { id: string };
    expect(created.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
    expect(created).toMatchObject({
      name: "Test Fund",
      vintage_year: 2025,
      target_size_usd: 1000000,
      status: "Fundraising",
    });
    expect(created).toHaveProperty("created_at");

    const list = await app.inject({ method: "GET", url: "/funds" });
    expect(list.statusCode).toBe(200);
    const funds = JSON.parse(list.body) as unknown[];
    expect(funds).toHaveLength(1);

    const one = await app.inject({
      method: "GET",
      url: `/funds/${created.id}`,
    });
    expect(one.statusCode).toBe(200);
    expect(JSON.parse(one.body).id).toBe(created.id);
  });

  it("GET /funds/:id returns 404 for unknown id", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/funds/00000000-0000-0000-0000-000000000000",
    });
    expect(res.statusCode).toBe(404);
    const body = JSON.parse(res.body) as { error: { code: string } };
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("PUT /funds updates by id in body", async () => {
    const post = await app.inject({
      method: "POST",
      url: "/funds",
      headers: { "content-type": "application/json" },
      payload: {
        name: "Before",
        vintage_year: 2024,
        target_size_usd: 1,
        status: "Fundraising",
      },
    });
    const { id } = JSON.parse(post.body) as { id: string };

    const put = await app.inject({
      method: "PUT",
      url: "/funds",
      headers: { "content-type": "application/json" },
      payload: {
        id,
        name: "After",
        vintage_year: 2024,
        target_size_usd: 2,
        status: "Investing",
      },
    });
    expect(put.statusCode).toBe(200);
    const updated = JSON.parse(put.body) as { name: string; status: string };
    expect(updated.name).toBe("After");
    expect(updated.status).toBe("Investing");
  });

  it("POST /investors and 409 on duplicate email", async () => {
    const first = await app.inject({
      method: "POST",
      url: "/investors",
      headers: { "content-type": "application/json" },
      payload: {
        name: "A",
        investor_type: "Individual",
        email: "dup@example.com",
      },
    });
    expect(first.statusCode).toBe(201);

    const second = await app.inject({
      method: "POST",
      url: "/investors",
      headers: { "content-type": "application/json" },
      payload: {
        name: "B",
        investor_type: "Institution",
        email: "dup@example.com",
      },
    });
    expect(second.statusCode).toBe(409);
    expect(JSON.parse(second.body).error.code).toBe("CONFLICT");
  });

  it("POST /funds/:id/investments and GET list", async () => {
    const fundRes = await app.inject({
      method: "POST",
      url: "/funds",
      headers: { "content-type": "application/json" },
      payload: {
        name: "F",
        vintage_year: 2024,
        target_size_usd: 100,
        status: "Investing",
      },
    });
    const fundId = (JSON.parse(fundRes.body) as { id: string }).id;

    const invRes = await app.inject({
      method: "POST",
      url: "/investors",
      headers: { "content-type": "application/json" },
      payload: {
        name: "LP",
        investor_type: "Family Office",
        email: "lp@example.com",
      },
    });
    const investorId = (JSON.parse(invRes.body) as { id: string }).id;

    const postInv = await app.inject({
      method: "POST",
      url: `/funds/${fundId}/investments`,
      headers: { "content-type": "application/json" },
      payload: {
        investor_id: investorId,
        amount_usd: 12345.67,
        investment_date: "2024-05-01",
      },
    });
    expect(postInv.statusCode).toBe(201);
    const inv = JSON.parse(postInv.body) as {
      fund_id: string;
      investor_id: string;
      amount_usd: number;
      investment_date: string;
    };
    expect(inv.fund_id).toBe(fundId);
    expect(inv.investor_id).toBe(investorId);
    expect(inv.amount_usd).toBeCloseTo(12345.67, 2);
    expect(inv.investment_date).toBe("2024-05-01");

    const list = await app.inject({
      method: "GET",
      url: `/funds/${fundId}/investments`,
    });
    expect(list.statusCode).toBe(200);
    expect(JSON.parse(list.body)).toHaveLength(1);
  });

  it("GET /funds/:id/investments 404 when fund missing", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/funds/00000000-0000-0000-0000-000000000000/investments",
    });
    expect(res.statusCode).toBe(404);
  });

  it("POST invalid JSON body returns validation error", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/funds",
      headers: { "content-type": "application/json" },
      payload: {
        name: "",
        vintage_year: 2024,
        target_size_usd: 1,
        status: "Fundraising",
      },
    });
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error.code).toBe("VALIDATION_ERROR");
  });
});
