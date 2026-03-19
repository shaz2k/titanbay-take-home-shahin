import type { FastifyRequest } from "fastify";
import { ZodError, type ZodSchema } from "zod";
import { AppError } from "./errors.js";

export function parseBody<T>(req: FastifyRequest, schema: ZodSchema<T>): T {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    throw zodToAppError(result.error);
  }
  return result.data;
}

export function parseParams<T>(req: FastifyRequest, schema: ZodSchema<T>): T {
  const result = schema.safeParse(req.params);
  if (!result.success) {
    throw zodToAppError(result.error);
  }
  return result.data;
}

export function parseQuery<T>(req: FastifyRequest, schema: ZodSchema<T>): T {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    throw zodToAppError(result.error);
  }
  return result.data;
}

function zodToAppError(err: ZodError): AppError {
  return new AppError(400, "VALIDATION_ERROR", "Invalid request", err.flatten());
}
