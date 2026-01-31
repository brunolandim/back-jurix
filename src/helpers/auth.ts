import type { APIGatewayProxyEvent } from 'aws-lambda';
import { verifyToken } from '../utils/jwt';
import { UnauthorizedError } from '../errors';
import type { AuthContext } from '../types';
import type { LawyerRole } from '../enum';

export function authenticate(event: APIGatewayProxyEvent): AuthContext {
  const authHeader = event.headers.Authorization || event.headers.authorization;

  if (!authHeader) {
    throw new UnauthorizedError('Missing authorization header');
  }

  const [type, token] = authHeader.split(' ');

  if (type !== 'Bearer' || !token) {
    throw new UnauthorizedError('Invalid authorization header format');
  }

  try {
    const payload = verifyToken(token);

    return {
      lawyerId: payload.sub,
      organizationId: payload.organizationId,
      role: payload.role as LawyerRole,
    };
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
}
