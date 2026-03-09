/**
 * Reusable Zod validation middleware for Hono routes.
 * Usage:
 *   app.post('/route', validateBody(MySchema), handler)
 *   app.get('/route', validateQuery(PaginationQuerySchema), handler)
 */

import type { Context, MiddlewareHandler, Next } from 'hono'
import type { ZodType, ZodTypeDef } from 'zod'

type SuccessResponse<T> = { success: true; data: T }
type ErrorResponse = { success: false; error: string; details?: unknown }

/**
 * Validate the JSON request body against a Zod schema.
 * On failure responds with 400 and a structured error.
 * On success attaches `c.set('validatedBody', parsed)`.
 */
export function validateBody<T>(schema: ZodType<T, ZodTypeDef, unknown>): MiddlewareHandler {
  return async (c: Context, next: Next) => {
    let raw: unknown
    try {
      raw = await c.req.json()
    } catch {
      return c.json<ErrorResponse>(
        { success: false, error: 'Request body must be valid JSON' },
        400,
      )
    }

    const result = schema.safeParse(raw)
    if (!result.success) {
      return c.json<ErrorResponse>(
        {
          success: false,
          error: 'Validation failed',
          details: result.error.flatten(),
        },
        400,
      )
    }

    c.set('validatedBody', result.data)
    return next()
  }
}

/**
 * Validate URL query parameters against a Zod schema.
 * On failure responds with 400. On success attaches `c.set('validatedQuery', parsed)`.
 */
export function validateQuery<T>(schema: ZodType<T, ZodTypeDef, unknown>): MiddlewareHandler {
  return async (c: Context, next: Next) => {
    const raw = Object.fromEntries(new URL(c.req.url).searchParams.entries())

    const result = schema.safeParse(raw)
    if (!result.success) {
      return c.json<ErrorResponse>(
        {
          success: false,
          error: 'Invalid query parameters',
          details: result.error.flatten(),
        },
        400,
      )
    }

    c.set('validatedQuery', result.data)
    return next()
  }
}

/**
 * Helper: extract a validated body typed by schema output.
 * Throws if `validateBody` middleware was not applied first.
 */
export function getValidatedBody<T>(c: Context): T {
  const body = c.get('validatedBody') as T | undefined
  if (body === undefined) {
    throw new Error('validateBody middleware was not applied to this route')
  }
  return body
}

/**
 * Helper: extract validated query params typed by schema output.
 */
export function getValidatedQuery<T>(c: Context): T {
  const query = c.get('validatedQuery') as T | undefined
  if (query === undefined) {
    throw new Error('validateQuery middleware was not applied to this route')
  }
  return query
}

export type { ErrorResponse, SuccessResponse }
