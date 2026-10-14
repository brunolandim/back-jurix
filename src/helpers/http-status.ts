import type { APIGatewayProxyResult } from 'aws-lambda';
import { Prisma } from '@prisma/client';
import { AppError, ConflictError } from '../errors';

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

export function success<T>(data: T, statusCode = 200): APIGatewayProxyResult {
  return {
    statusCode,
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(data),
  };
}

export function created<T>(data: T): APIGatewayProxyResult {
  return success(data, 201);
}

export function noContent(): APIGatewayProxyResult {
  return {
    statusCode: 204,
    headers: DEFAULT_HEADERS,
    body: '',
  };
}

export function notFound(message = 'Route not found'): APIGatewayProxyResult {
  return {
    statusCode: 404,
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({
      error: {
        code: 'NOT_FOUND',
        message,
      },
    }),
  };
}

export function badRequest(message: string): APIGatewayProxyResult {
  return {
    statusCode: 400,
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({
      error: {
        code: 'BAD_REQUEST',
        message,
      },
    }),
  };
}

export function error(err: unknown): APIGatewayProxyResult {
  // Unique constraint violation (e.g. a case number that already exists)
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    const target = err.meta?.target;
    const field = Array.isArray(target) ? target.join(',') : typeof target === 'string' ? target : undefined;
    const messageKey = field?.includes('number') ? 'errors.caseNumberInUse' : 'errors.alreadyExists';
    return error(new ConflictError('Resource already exists', field, messageKey));
  }

  if (err instanceof AppError) {
    return {
      statusCode: err.statusCode,
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(err.toJSON()),
    };
  }

  console.error('Unhandled error:', err);

  return {
    statusCode: 500,
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }),
  };
}
