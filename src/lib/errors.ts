/**
 * @file Application error types and helpers.
 *
 * This module defines the canonical error model used throughout the
 * application: a machine-readable {@link ErrorCode} union, a base
 * {@link AppError} class that augments the native `Error` with an HTTP
 * status code and structured details, a set of factory helpers for the
 * most common error shapes ({@link notFound}, {@link conflict},
 * {@link badRequest}), and a robust {@link isAppError} type guard for
 * use in global error handlers.
 *
 * Throw {@link AppError} (or one of the factories) from route handlers
 * and services so that the global error handler can translate them into
 * consistent HTTP responses.
 */

/**
 * Application-specific error codes.
 *
 * These are machine-readable identifiers used to categorize errors
 * thrown across the application. Add new codes here when introducing
 * new error categories, and keep them in sync with any client-side
 * error handling logic.
 *
 * Members:
 * - `VALIDATION_ERROR`: Input failed schema or business-rule validation.
 * - `NOT_FOUND`: A referenced resource does not exist.
 * - `CONFLICT`: The request conflicts with the current state of a resource.
 * - `BAD_REQUEST`: The request is malformed or otherwise invalid.
 * - `INTERNAL_ERROR`: An unexpected server-side error occurred.
 *
 * @public
 */
export type ErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "BAD_REQUEST"
  | "INTERNAL_ERROR";

/**
 * Base application error class.
 *
 * Extends the native `Error` to include an HTTP status code,
 * a machine-readable error code, and optional structured details.
 * Use this (or one of the helper factories below) to throw consistent
 * errors across the app that can be handled uniformly by the global
 * error handler.
 *
 * Instances of this class have `name` set to `"AppError"`, which is
 * relied upon by {@link isAppError} for structural detection across
 * module boundaries.
 *
 * @public
 * @see {@link notFound}
 * @see {@link conflict}
 * @see {@link badRequest}
 * @see {@link isAppError}
 *
 * @example
 * ```ts
 * throw new AppError(400, "BAD_REQUEST", "Missing field", { field: "email" });
 * ```
 */
export class AppError extends Error {
  /** HTTP status code associated with this error (e.g. 400, 404, 500). */
  readonly statusCode: number;
  /** Machine-readable {@link ErrorCode} identifying the error category. */
  readonly code: ErrorCode;
  /** Optional structured payload carrying additional context about the error. */
  readonly details?: unknown;
  /**
   * Always set to the literal string `"AppError"`.
   *
   * Used by {@link isAppError} as part of the structural fallback check
   * when `instanceof` cannot be relied upon (e.g. when multiple copies
   * of this module are loaded by a bundler/test runner).
   */
  declare readonly name: string;

  /**
   * Create a new AppError.
   *
   * @param statusCode - HTTP status code to associate with the error (e.g. 400, 404, 500).
   * @param code - Application-specific {@link ErrorCode} identifying the error type.
   * @param message - Human-readable error message. Forwarded to the native `Error` constructor.
   * @param details - Optional structured payload with additional context (validation issues, IDs, etc.).
   * @returns A new {@link AppError} instance with `name` set to `"AppError"`.
   */
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

/**
 * Create a 404 Not Found {@link AppError} for a missing resource.
 *
 * Use this when a lookup by identifier fails to find the requested entity.
 * The resource name and id are included in the error details for easier
 * debugging and structured logging.
 *
 * @param resource - The name of the resource that was not found (e.g. "User", "Order").
 * @param id - The identifier of the resource that was looked up.
 * @returns An {@link AppError} with status `404` and code `NOT_FOUND`.
 *
 * @public
 * @example
 * ```ts
 * throw notFound("User", userId);
 * ```
 */
export function notFound(resource: string, id: string): AppError {
  return new AppError(404, "NOT_FOUND", `${resource} not found`, { id });
}

/**
 * Create a 409 Conflict {@link AppError}.
 *
 * Use this when a request cannot be completed due to a conflict with
 * the current state of the resource (e.g. duplicate entries, version mismatches).
 *
 * @param message - Human-readable description of the conflict.
 * @param details - Optional structured context about the conflict.
 * @returns An {@link AppError} with status `409` and code `CONFLICT`.
 *
 * @public
 * @example
 * ```ts
 * throw conflict("Email already in use", { email });
 * ```
 */
export function conflict(message: string, details?: unknown): AppError {
  return new AppError(409, "CONFLICT", message, details);
}

/**
 * Create a 400 Bad Request {@link AppError}.
 *
 * Use this for malformed requests or invalid input that the client
 * should correct before retrying.
 *
 * @param message - Human-readable description of why the request is invalid.
 * @param details - Optional structured context (e.g. field-level validation errors).
 * @returns An {@link AppError} with status `400` and code `BAD_REQUEST`.
 *
 * @public
 * @example
 * ```ts
 * throw badRequest("Invalid payload", { issues });
 * ```
 */
export function badRequest(message: string, details?: unknown): AppError {
  return new AppError(400, "BAD_REQUEST", message, details);
}

/**
 * Type guard that checks whether a value is an {@link AppError}.
 *
 * Vitest/Vite can load duplicate class copies so `instanceof AppError` fails.
 * Use this before branching on thrown errors in the global error handler
 * to reliably detect AppError instances across module boundaries.
 *
 * The guard first attempts a native `instanceof` check, then falls back to
 * a structural check on `name`, `statusCode`, and `code` so it works even
 * when multiple copies of the class are loaded at runtime.
 *
 * @param err - The unknown value to test (typically a caught error).
 * @returns `true` if `err` looks like an {@link AppError}, narrowing the type accordingly.
 *
 * @public
 * @example
 * ```ts
 * try {
 *   // ...
 * } catch (err) {
 *   if (isAppError(err)) {
 *     res.status(err.statusCode).json({ code: err.code, message: err.message });
 *   }
 * }
 * ```
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
