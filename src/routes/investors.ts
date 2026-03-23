import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db, schema } from "../db/index.js";
import { conflict } from "../lib/errors.js";
import { investorToJson } from "../lib/mappers.js";
import { parseBody } from "../lib/validate.js";

const investorType = z.enum(["Individual", "Institution", "Family Office"]);

const createInvestorBody = z.object({
  name: z.string().min(1).max(255),
  investor_type: investorType,
  email: z.string().email().max(255),
});

function isUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code: string }).code === "23505"
  );
}

export async function investorRoutes(app: FastifyInstance): Promise<void> {
  app.get("/investors", async (_req, reply) => {
    const rows = await db
      .select()
      .from(schema.investors)
      .orderBy(schema.investors.createdAt);
    return reply.send(rows.map(investorToJson));
  });

  app.post("/investors", async (req, reply) => {
    const body = parseBody(req, createInvestorBody);
    try {
      const [row] = await db
        .insert(schema.investors)
        .values({
          name: body.name,
          investorType: body.investor_type,
          email: body.email,
        })
        .returning();
      return reply.status(201).send(investorToJson(row));
    } catch (e: unknown) {
      if (isUniqueViolation(e)) {
        throw conflict("An investor with this email already exists", {
          field: "email",
        });
      }
      throw e;
    }
  });
}
