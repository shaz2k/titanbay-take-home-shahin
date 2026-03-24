import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "../db/index.js";
import { badRequest, notFound } from "../lib/errors.js";
import { investmentToJson } from "../lib/mappers.js";
import { parseBody, parseParams } from "../lib/validate.js";

/** Same param name as `GET /funds/:id` so find-my-way matches `/funds/:id` correctly. */
const fundIdParam = z.object({ id: z.string().uuid() });

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "investment_date must be YYYY-MM-DD");

const createInvestmentBody = z.object({
  investor_id: z.string().uuid(),
  amount_usd: z.number().nonnegative().finite(),
  investment_date: dateOnly,
});

function isForeignKeyViolation(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code: string }).code === "23503"
  );
}

export async function investmentRoutes(app: FastifyInstance): Promise<void> {
  app.get("/funds/:id/investments", async (req, reply) => {
    const { id: fundId } = parseParams(req, fundIdParam);

    const [fund] = await db
      .select({ id: schema.funds.id })
      .from(schema.funds)
      .where(eq(schema.funds.id, fundId))
      .limit(1);
    if (!fund) throw notFound("Fund", fundId);

    const rows = await db
      .select()
      .from(schema.investments)
      .where(eq(schema.investments.fundId, fundId))
      .orderBy(schema.investments.investmentDate);
    return reply.send(rows.map(investmentToJson));
  });

  app.post("/funds/:id/investments", async (req, reply) => {
    const { id: fundId } = parseParams(req, fundIdParam);
    const body = parseBody(req, createInvestmentBody);

    const [fund] = await db
      .select({ id: schema.funds.id })
      .from(schema.funds)
      .where(eq(schema.funds.id, fundId))
      .limit(1);
    if (!fund) throw notFound("Fund", fundId);

    const [investor] = await db
      .select({ id: schema.investors.id })
      .from(schema.investors)
      .where(eq(schema.investors.id, body.investor_id))
      .limit(1);
    if (!investor) throw notFound("Investor", body.investor_id);

    try {
      const [row] = await db
        .insert(schema.investments)
        .values({
          fundId,
          investorId: body.investor_id,
          amountUsd: body.amount_usd.toFixed(2),
          investmentDate: body.investment_date,
        })
        .returning();
      return reply.status(201).send(investmentToJson(row));
    } catch (e: unknown) {
      if (isForeignKeyViolation(e)) {
        throw badRequest("Invalid investor or fund reference");
      }
      throw e;
    }
  });
}
