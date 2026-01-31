import type { APIGatewayProxyResult } from 'aws-lambda';
import { AppError } from '../errors';

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
