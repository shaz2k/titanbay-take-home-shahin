import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "../db/index.js";
import { notFound } from "../lib/errors.js";
import { fundToJson } from "../lib/mappers.js";
import { parseBody, parseParams } from "../lib/validate.js";

const fundStatus = z.enum(["Fundraising", "Investing", "Closed"]);

// Validation schema for creating a new fund
const createFundBody = z.object({
  name: z.string().min(1).max(255),
  vintage_year: z.number().int().min(1800).max(2200),
  target_size_usd: z.number().nonnegative().finite(),
  status: fundStatus,
});

// Validation schema for updating an existing fund
const updateFundBody = createFundBody.extend({
  id: z.string().uuid(),
});

// Validation schema for the fund ID parameter
const idParam = z.object({ id: z.string().uuid() });

function fundInsertValues(body: z.infer<typeof createFundBody>) {
  return {
    name: body.name,
    vintageYear: body.vintage_year,
    targetSizeUsd: body.target_size_usd.toFixed(2),
    status: body.status,
  };
}

export async function fundRoutes(app: FastifyInstance): Promise<void> {
  app.get("/funds", async (_req, reply) => {
    const rows = await db
      .select()
      .from(schema.funds)
      .orderBy(schema.funds.createdAt);
    return reply.send(rows.map(fundToJson));
  });

  app.post("/funds", async (req, reply) => {
    const body = parseBody(req, createFundBody);
    const [row] = await db
      .insert(schema.funds)
      .values(fundInsertValues(body))
      .returning();
    return reply.status(201).send(fundToJson(row));
  });

  app.put("/funds", async (req, reply) => {
    const body = parseBody(req, updateFundBody);
    const [existing] = await db
      .select()
      .from(schema.funds)
      .where(eq(schema.funds.id, body.id))
      .limit(1);
    if (!existing) throw notFound("Fund", body.id);

    const [row] = await db
      .update(schema.funds)
      .set(fundInsertValues(body))
      .where(eq(schema.funds.id, body.id))
      .returning();
    return reply.send(fundToJson(row!));
  });

  app.get("/funds/:id", async (req, reply) => {
    const { id } = parseParams(req, idParam);
    const [row] = await db
      .select()
      .from(schema.funds)
      .where(eq(schema.funds.id, id))
      .limit(1);
    if (!row) throw notFound("Fund", id);
    return reply.send(fundToJson(row));
  });
}
