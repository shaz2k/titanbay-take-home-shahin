import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { isAppError } from "../lib/errors.js";

function isZodError(err: unknown): err is ZodError {
  if (err instanceof ZodError) return true;
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { name?: string }).name === "ZodError" &&
    "issues" in err &&
    Array.isArray((err as { issues: unknown }).issues)
  );
}

/**
 * Must run on the **root** Fastify instance (not inside `app.register()`), otherwise
 * Fastify encapsulation limits the handler to that empty plugin scope and route errors
 * fall through to the default serializer (`statusCode` / `code` at top level).
 */
export function registerRootErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((err, req, reply) => {
    if (isZodError(err)) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request",
          details: err.flatten(),
        },
      });
    }

    if (isAppError(err)) {
      return reply.status(err.statusCode).send({
        error: {
          code: err.code,
          message: err.message,
          ...(err.details !== undefined ? { details: err.details } : {}),
        },
      });
    }

    req.log.error(err);

    const message =
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err instanceof Error
          ? err.message
          : "Internal server error";

    return reply.status(500).send({
      error: {
        code: "INTERNAL_ERROR" as const,
        message,
      },
    });
  });
}
