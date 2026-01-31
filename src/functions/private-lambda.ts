import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { success, created, noContent, notFound, error } from '../helpers/http-status';
import { authenticate } from '../helpers/auth';
import { parseBody } from '../helpers/parse-body';
import { validate } from '../validations/validate';
import {
  updateOrganizationSchema,
  createLawyerSchema,
  updateLawyerSchema,
  createColumnSchema,
  updateColumnSchema,
  createCaseSchema,
  updateCaseSchema,
  moveCaseSchema,
  assignCaseSchema,
  createDocumentSchema,
  updateDocumentSchema,
  rejectDocumentSchema,
  createNotificationSchema,
  createShareLinkSchema,
} from '../validations/schemas';
import {
  OrganizationUseCase,
  LawyerUseCase,
  ColumnUseCase,
  CaseUseCase,
  DocumentUseCase,
  NotificationUseCase,
} from '../use-cases/private';
import { ShareLinkUseCase } from '../use-cases/public';
import type { AuthContext } from '../types';

interface RouteParams {
  event: APIGatewayProxyEvent;
  context: AuthContext;
  id?: string;
  subId?: string;
}

type RouteHandler = (params: RouteParams) => Promise<APIGatewayProxyResult>;

const organizationUseCase = new OrganizationUseCase();
const lawyerUseCase = new LawyerUseCase();
const columnUseCase = new ColumnUseCase();
const caseUseCase = new CaseUseCase();
const documentUseCase = new DocumentUseCase();
const notificationUseCase = new NotificationUseCase();
const shareLinkUseCase = new ShareLinkUseCase();

const routes: Record<string, Record<string, RouteHandler>> = {
  get: {
    organizations: async ({ context }) => {
      const org = await organizationUseCase.getById(context.organizationId);
      return success(org);
    },
    lawyers: async ({ context, id }) => {
      if (id) {
        const lawyer = await lawyerUseCase.getById(id, context.organizationId);
        return success(lawyer);
      }
      const lawyers = await lawyerUseCase.list(context.organizationId);
      return success(lawyers);
    },
    columns: async ({ context }) => {
      const columns = await columnUseCase.listWithCases(context.organizationId);
      return success(columns);
    },
    cases: async ({ context, id }) => {
      if (id) {
        const legalCase = await caseUseCase.getById(id, context.organizationId);
        return success(legalCase);
      }
      const cases = await caseUseCase.list(context.organizationId);
      return success(cases);
    },
    documents: async ({ event, context }) => {
      const caseId = event.queryStringParameters?.caseId;
      if (!caseId) {
        return notFound('Case ID is required');
      }
      const documents = await documentUseCase.listByCase(caseId, context);
      return success(documents);
    },
    notifications: async ({ context }) => {
      const notifications = await notificationUseCase.listByLawyer(context);
      return success(notifications);
    },
    me: async ({ context }) => {
      const lawyer = await lawyerUseCase.getById(context.lawyerId, context.organizationId);
      return success(lawyer);
    },
  },
  post: {
    lawyers: async ({ event, context }) => {
      const body = parseBody(event);
      const input = validate(createLawyerSchema, body);
      const lawyer = await lawyerUseCase.create({
        ...input,
        organizationId: context.organizationId,
      });
      return created(lawyer);
    },
    columns: async ({ event, context }) => {
      const body = parseBody(event);
      const input = validate(createColumnSchema, body);
      const column = await columnUseCase.create(context.organizationId, input);
      return created(column);
    },
    cases: async ({ event, context }) => {
      const body = parseBody(event);
      const input = validate(createCaseSchema, body);
      const legalCase = await caseUseCase.create(input, context);
      return created(legalCase);
    },
    documents: async ({ event, context }) => {
      const body = parseBody(event) as { caseId?: string; name?: string; description?: string };
      if (!body?.caseId) {
        return notFound('Case ID is required');
      }
      const input = validate(createDocumentSchema, body);
      const document = await documentUseCase.create(body.caseId, input, context);
      return created(document);
    },
    notifications: async ({ event, context }) => {
      const body = parseBody(event) as { caseId?: string } & Record<string, unknown>;
      if (!body?.caseId) {
        return notFound('Case ID is required');
      }
      const input = validate(createNotificationSchema, body);
      const notification = await notificationUseCase.create(body.caseId, input, context);
      return created(notification);
    },
    'share-links': async ({ event, context }) => {
      const body = parseBody(event);
      const input = validate(createShareLinkSchema, body);
      const link = await shareLinkUseCase.create(input.caseId, input.documentIds, context);
      return created(link);
    },
  },
  put: {
    organizations: async ({ event, context }) => {
      const body = parseBody(event);
      const input = validate(updateOrganizationSchema, body);
      const org = await organizationUseCase.update(context.organizationId, input);
      return success(org);
    },
    lawyers: async ({ event, context, id }) => {
      if (!id) return notFound('Lawyer ID is required');
      const body = parseBody(event);
      const input = validate(updateLawyerSchema, body);
      const lawyer = await lawyerUseCase.update(id, input, context);
      return success(lawyer);
    },
    columns: async ({ event, context, id }) => {
      if (!id) return notFound('Column ID is required');
      const body = parseBody(event);
      const input = validate(updateColumnSchema, body);
      const column = await columnUseCase.update(id, context.organizationId, input);
      return success(column);
    },
    cases: async ({ event, context, id }) => {
      if (!id) return notFound('Case ID is required');
      const body = parseBody(event);
      const input = validate(updateCaseSchema, body);
      const legalCase = await caseUseCase.update(id, input, context);
      return success(legalCase);
    },
    documents: async ({ event, context, id }) => {
      if (!id) return notFound('Document ID is required');
      const caseId = event.queryStringParameters?.caseId;
      if (!caseId) return notFound('Case ID is required');
      const body = parseBody(event);
      const input = validate(updateDocumentSchema, body);
      const document = await documentUseCase.update(id, caseId, input, context);
      return success(document);
    },
  },
  patch: {
    'cases/move': async ({ event, context, id }) => {
      if (!id) return notFound('Case ID is required');
      const body = parseBody(event);
      const input = validate(moveCaseSchema, body);
      const legalCase = await caseUseCase.move(id, input, context);
      return success(legalCase);
    },
    'cases/assign': async ({ event, context, id }) => {
      if (!id) return notFound('Case ID is required');
      const body = parseBody(event);
      const input = validate(assignCaseSchema, body);
      const legalCase = await caseUseCase.assign(id, input.assignedTo, context);
      return success(legalCase);
    },
    'documents/approve': async ({ event, context, id }) => {
      if (!id) return notFound('Document ID is required');
      const caseId = event.queryStringParameters?.caseId;
      if (!caseId) return notFound('Case ID is required');
      const document = await documentUseCase.approve(id, caseId, context);
      return success(document);
    },
    'documents/reject': async ({ event, context, id }) => {
      if (!id) return notFound('Document ID is required');
      const caseId = event.queryStringParameters?.caseId;
      if (!caseId) return notFound('Case ID is required');
      const body = parseBody(event);
      const input = validate(rejectDocumentSchema, body);
      const document = await documentUseCase.reject(
        id,
        caseId,
        input.rejectionReason,
        input.rejectionNote,
        context
      );
      return success(document);
    },
    'notifications/read': async ({ context, id }) => {
      if (!id) return notFound('Notification ID is required');
      const notification = await notificationUseCase.markAsRead(id, context);
      return success(notification);
    },
    'notifications/read-all': async ({ context }) => {
      const count = await notificationUseCase.markAllAsRead(context);
      return success({ count });
    },
  },
  delete: {
    lawyers: async ({ context, id }) => {
      if (!id) return notFound('Lawyer ID is required');
      await lawyerUseCase.delete(id, context);
      return noContent();
    },
    columns: async ({ context, id }) => {
      if (!id) return notFound('Column ID is required');
      await columnUseCase.delete(id, context.organizationId);
      return noContent();
    },
    cases: async ({ context, id }) => {
      if (!id) return notFound('Case ID is required');
      await caseUseCase.delete(id, context);
      return noContent();
    },
    documents: async ({ event, context, id }) => {
      if (!id) return notFound('Document ID is required');
      const caseId = event.queryStringParameters?.caseId;
      if (!caseId) return notFound('Case ID is required');
      await documentUseCase.delete(id, caseId, context);
      return noContent();
    },
    notifications: async ({ context, id }) => {
      if (!id) return notFound('Notification ID is required');
      await notificationUseCase.delete(id, context);
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

    const authContext = authenticate(event);
    const method = event.httpMethod.toLowerCase();
    const { resource, id, subAction } = parseRoute(event.path);

    const routeKey = subAction ? `${resource}/${subAction}` : resource;
    const routeHandler = routes[method]?.[routeKey];

    if (!routeHandler) {
      return notFound('Route not found');
    }

    return await routeHandler({ event, context: authContext, id, subId: subAction });
  } catch (err) {
    return error(err);
  }
};
