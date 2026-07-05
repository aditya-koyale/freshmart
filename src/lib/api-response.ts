import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/**
 * A typed application error that route handlers can throw and a single
 * catch block can translate into the correct HTTP status. Keeps services
 * free of Next.js Response concerns (clean architecture: services know
 * nothing about HTTP).
 */
export class AppError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 400, code = 'BAD_REQUEST') {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function fail(message: string, status = 400, code = 'BAD_REQUEST') {
  return NextResponse.json({ success: false, message, code }, { status });
}

/**
 * Central error handler for API route handlers. Usage:
 *
 *   try { ... } catch (error) { return handleApiError(error); }
 */
export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors: error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  if (error instanceof AppError) {
    return fail(error.message, error.status, error.code);
  }

  console.error(error);
  return fail('Something went wrong. Please try again.', 500, 'INTERNAL_ERROR');
}
