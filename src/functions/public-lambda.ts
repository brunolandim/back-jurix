import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { success, noContent, notFound, error } from '../helpers/http-status';
import { parseBody } from '../helpers/parse-body';
import { validate } from '../validations/validate';
import { loginSchema, uploadDocumentSchema } from '../validations/schemas';
import { AuthUseCase, ShareLinkUseCase } from '../use-cases/public';
import {
  LawyerRepository,
  LegalCaseRepository,
  DocumentRepository,
  ShareLinkRepository,
} from '../db/repository';
import { getPrisma } from '../db/prisma';

interface RouteParams {
  event: APIGatewayProxyEvent;
  id?: string;
  subAction?: string;
}

type RouteHandler = (params: RouteParams) => Promise<APIGatewayProxyResult>;

const prisma = getPrisma();
const lawyerRepo = new LawyerRepository(prisma);
const caseRepo = new LegalCaseRepository(prisma);
const documentRepo = new DocumentRepository(prisma);
const shareLinkRepo = new ShareLinkRepository(prisma);

const authUseCase = new AuthUseCase(lawyerRepo);
const shareLinkUseCase = new ShareLinkUseCase(shareLinkRepo, documentRepo, caseRepo);

const routes: Record<string, Record<string, RouteHandler>> = {
  get: {
    'share-links': async ({ id }) => {
      if (!id) return notFound('Token is required');
      const link = await shareLinkUseCase.getByToken(id);
      return success(link);
    },
  },
  post: {
    auth: async ({ event }) => {
      const body = parseBody(event);
      const input = validate(loginSchema, body);
      const result = await authUseCase.login(input.email, input.password);
      return success(result);
    },
    'auth/login': async ({ event }) => {
      const body = parseBody(event);
      const input = validate(loginSchema, body);
      const result = await authUseCase.login(input.email, input.password);
      return success(result);
    },
    'share-links/upload': async ({ event, id }) => {
      if (!id) return notFound('Token is required');
      const body = parseBody(event) as { documentId?: string; fileUrl?: string };
      if (!body?.documentId) {
        return notFound('Document ID is required');
      }
      const input = validate(uploadDocumentSchema, body);
      await shareLinkUseCase.uploadDocument(id, body.documentId, input.fileUrl);
      return noContent();
    },
  },
};

function parseRoute(path: string): { resource: string; id?: string; subAction?: string } {
  const parts = path.split('/').filter(Boolean);
  const [resource, id, subAction] = parts;
  return { resource, id, subAction };
}

export const handler = async (
  event: APIGatewayProxyEvent,
  _context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    if (event.httpMethod === 'OPTIONS') {
      return success({});
    }

    const method = event.httpMethod.toLowerCase();
    const { resource, id, subAction } = parseRoute(event.path);

    let routeKey = resource;
    if (subAction) {
      routeKey = `${resource}/${subAction}`;
    }

    const routeHandler = routes[method]?.[routeKey];

    if (!routeHandler) {
      return notFound('Route not found');
    }

    return await routeHandler({ event, id, subAction });
  } catch (err) {
    return error(err);
  }
};
