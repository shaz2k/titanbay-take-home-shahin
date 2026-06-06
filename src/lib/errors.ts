export type ErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "BAD_REQUEST"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;
  readonly details?: unknown;

  // Constructor
  constructor(
    statusCode: number,
    code: ErrorCode,
    message: string,
    details?: unknown
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function notFound(resource: string, id: string): AppError {
  return new AppError(404, "NOT_FOUND", `${resource} not found`, { id });
}

export function conflict(message: string, details?: unknown): AppError {
  return new AppError(409, "CONFLICT", message, details);
}

export function badRequest(message: string, details?: unknown): AppError {
  return new AppError(400, "BAD_REQUEST", message, details);
}

/**
 * Vitest/Vite can load duplicate class copies so `instanceof AppError` fails.
 * Use this before branching on thrown errors in the global error handler.
 */
export function isAppError(err: unknown): err is AppError {
  if (err instanceof AppError) return true;
  if (typeof err !== "object" || err === null) return false;
  const o = err as Record<string, unknown>;
  return (
    o.name === "AppError" &&
    typeof o.statusCode === "number" &&
    typeof o.code === "string"
  );
}
