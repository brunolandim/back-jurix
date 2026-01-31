import type { APIGatewayProxyEvent } from 'aws-lambda';

export function parseBody<T = unknown>(event: APIGatewayProxyEvent): T | null {
  if (!event.body) {
    return null;
  }

  try {
    const body = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64').toString('utf-8')
      : event.body;

    return JSON.parse(body) as T;
  } catch {
    return null;
  }
}
