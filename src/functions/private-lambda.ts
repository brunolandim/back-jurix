import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { success, created, noContent, notFound, error } from '../helpers/http-status';
import { authenticate } from '../helpers/auth';
import { parseBody } from '../helpers/parse-body';
import { matchRoute } from '../helpers/router';
import type { Route } from '../helpers/router';
import { validate } from '../validations/validate';
import {
  updateOrganizationSchema,
  createLawyerSchema,
  updateLawyerSchema,
  updateProfileSchema,
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
  createCheckoutSchema,
  presignedUrlSchema,
  uploadFileSchema,
} from '../validations/schemas';
import {
  OrganizationUseCase,
  LawyerUseCase,
  ColumnUseCase,
  LegalCaseUseCase,
  DocumentUseCase,
  NotificationUseCase,
  PlanEnforcerUseCase,
  SubscriptionUseCase,
  UploadUseCase,
} from '../use-cases/private';
import { ShareLinkUseCase } from '../use-cases/public';
import {
  OrganizationRepository,
  LawyerRepository,
  ColumnRepository,
  LegalCaseRepository,
  DocumentRepository,
  NotificationRepository,
  ShareLinkRepository,
  SubscriptionRepository,
} from '../db/repository';
import { getPrisma } from '../db/prisma';
import type { AuthContext } from '../types';
import { DEFAULT_PASSWORD } from '../config/constants';


const prisma = getPrisma();
const organizationRepo = new OrganizationRepository(prisma);
const lawyerRepo = new LawyerRepository(prisma);
const columnRepo = new ColumnRepository(prisma);
const caseRepo = new LegalCaseRepository(prisma);
const documentRepo = new DocumentRepository(prisma);
const notificationRepo = new NotificationRepository(prisma);
const shareLinkRepo = new ShareLinkRepository(prisma);
const subscriptionRepo = new SubscriptionRepository(prisma);

const planEnforcerUseCase = new PlanEnforcerUseCase(subscriptionRepo, lawyerRepo, caseRepo, shareLinkRepo);
const subscriptionUseCase = new SubscriptionUseCase(subscriptionRepo, organizationRepo, lawyerRepo, caseRepo, documentRepo, shareLinkRepo);
const organizationUseCase = new OrganizationUseCase(organizationRepo, columnRepo);
const lawyerUseCase = new LawyerUseCase(lawyerRepo, planEnforcerUseCase);
const columnUseCase = new ColumnUseCase(columnRepo, caseRepo);
const legalCaseUseCase = new LegalCaseUseCase(caseRepo, columnRepo, lawyerRepo, planEnforcerUseCase);
const documentUseCase = new DocumentUseCase(documentRepo, caseRepo, planEnforcerUseCase);
const notificationUseCase = new NotificationUseCase(notificationRepo, caseRepo);
const shareLinkUseCase = new ShareLinkUseCase(shareLinkRepo, documentRepo, caseRepo, planEnforcerUseCase);
const uploadUseCase = new UploadUseCase();

const routes: Route<AuthContext>[] = [
  // Organizations
  { method: 'get', pattern: 'organizations', handler: async ({ context }) => {
    const org = await organizationUseCase.getById(context.organizationId);
    return success(org);
  }},
  { method: 'put', pattern: 'organizations', handler: async ({ event, context }) => {
    const body = parseBody(event);
    const input = validate(updateOrganizationSchema, body);
    const org = await organizationUseCase.update(context.organizationId, input);
    return success(org);
  }},

  // Lawyers
  { method: 'get', pattern: 'lawyers', handler: async ({ context }) => {
    const lawyers = await lawyerUseCase.list(context.organizationId);
    return success(lawyers);
  }},
  { method: 'get', pattern: 'lawyers/:id', handler: async ({ context, params }) => {
    const lawyer = await lawyerUseCase.getById(params.id, context.organizationId);
    return success(lawyer);
  }},
  { method: 'post', pattern: 'lawyers', handler: async ({ event, context }) => {
    const body = parseBody(event);
    const input = validate(createLawyerSchema, body);
    const lawyer = await lawyerUseCase.create({
      ...input,
      password: input.password || DEFAULT_PASSWORD,
      organizationId: context.organizationId,
    }, context);
    return created(lawyer);
  }},
  { method: 'put', pattern: 'lawyers/:id', handler: async ({ event, context, params }) => {
    const body = parseBody(event);
    const input = validate(updateLawyerSchema, body);
    const lawyer = await lawyerUseCase.update(params.id, input, context);
    return success(lawyer);
  }},
  { method: 'delete', pattern: 'lawyers/:id', handler: async ({ context, params }) => {
    await lawyerUseCase.delete(params.id, context);
    return noContent();
  }},

  // Columns
  { method: 'get', pattern: 'columns', handler: async ({ context }) => {
    const columns = await columnUseCase.listWithCases(context.organizationId);
    return success(columns);
  }},
  { method: 'post', pattern: 'columns', handler: async ({ event, context }) => {
    const body = parseBody(event);
    const input = validate(createColumnSchema, body);
    const column = await columnUseCase.create(context.organizationId, input);
    return created(column);
  }},
  { method: 'put', pattern: 'columns/:id', handler: async ({ event, context, params }) => {
    const body = parseBody(event);
    const input = validate(updateColumnSchema, body);
    const column = await columnUseCase.update(params.id, context.organizationId, input);
    return success(column);
  }},
  { method: 'delete', pattern: 'columns/:id', handler: async ({ context, params }) => {
    await columnUseCase.delete(params.id, context.organizationId);
    return noContent();
  }},

  // Cases
  { method: 'get', pattern: 'cases', handler: async ({ context }) => {
    const cases = await legalCaseUseCase.list(context.organizationId);
    return success(cases);
  }},
  { method: 'get', pattern: 'cases/:id', handler: async ({ params }) => {
    const legalCase = await legalCaseUseCase.getById(params.id);
    return success(legalCase);
  }},
  { method: 'post', pattern: 'cases', handler: async ({ event, context }) => {
    const body = parseBody(event);
    const input = validate(createCaseSchema, body);
    const legalCase = await legalCaseUseCase.create(input, context);
    return created(legalCase);
  }},
  { method: 'put', pattern: 'cases/:id', handler: async ({ event, context, params }) => {
    const body = parseBody(event);
    const input = validate(updateCaseSchema, body);
    const legalCase = await legalCaseUseCase.update(params.id, input, context);
    return success(legalCase);
  }},
  { method: 'delete', pattern: 'cases/:id', handler: async ({ context, params }) => {
    await legalCaseUseCase.delete(params.id, context);
    return noContent();
  }},
  { method: 'patch', pattern: 'cases/:id/move', handler: async ({ event, context, params }) => {
    const body = parseBody(event);
    const input = validate(moveCaseSchema, body);
    const legalCase = await legalCaseUseCase.move(params.id, input, context);
    return success(legalCase);
  }},
  { method: 'patch', pattern: 'cases/:id/assign', handler: async ({ event, context, params }) => {
    const body = parseBody(event);
    const input = validate(assignCaseSchema, body);
    const legalCase = await legalCaseUseCase.assign(params.id, input.assignedTo, context);
    return success(legalCase);
  }},

  // Documents
  { method: 'get', pattern: 'documents', handler: async ({ event, context }) => {
    const caseId = event.queryStringParameters?.caseId;
    if (!caseId) return notFound('Case ID is required');
    const documents = await documentUseCase.listByCase(caseId, context);
    return success(documents);
  }},
  { method: 'post', pattern: 'documents', handler: async ({ event, context }) => {
    const body = parseBody(event) as { caseId?: string; name?: string; description?: string };
    if (!body?.caseId) return notFound('Case ID is required');
    const input = validate(createDocumentSchema, body);
    const document = await documentUseCase.create(body.caseId, input, context);
    return created(document);
  }},
  { method: 'put', pattern: 'documents/:id', handler: async ({ event, context, params }) => {
    const caseId = event.queryStringParameters?.caseId;
    if (!caseId) return notFound('Case ID is required');
    const body = parseBody(event);
    const input = validate(updateDocumentSchema, body);
    const document = await documentUseCase.update(params.id, caseId, input, context);
    return success(document);
  }},
  { method: 'delete', pattern: 'documents/:id', handler: async ({ context, params }) => {
    await documentUseCase.delete(params.id, context);
    return noContent();
  }},
  { method: 'patch', pattern: 'documents/:id/approve', handler: async ({ event, context, params }) => {
    const caseId = event.queryStringParameters?.caseId;
    if (!caseId) return notFound('Case ID is required');
    const document = await documentUseCase.approve(params.id, caseId, context);
    return success(document);
  }},
  { method: 'patch', pattern: 'documents/:id/reject', handler: async ({ event, context, params }) => {
    const caseId = event.queryStringParameters?.caseId;
    if (!caseId) return notFound('Case ID is required');
    const body = parseBody(event);
    const input = validate(rejectDocumentSchema, body);
    const document = await documentUseCase.reject(params.id, caseId, input.rejectionReason, input.rejectionNote, context);
    return success(document);
  }},

  // Notifications
  { method: 'get', pattern: 'notifications', handler: async ({ context }) => {
    const notifications = await notificationUseCase.listByLawyer(context);
    return success(notifications);
  }},
  { method: 'post', pattern: 'notifications', handler: async ({ event, context }) => {
    const body = parseBody(event) as { caseId?: string } & Record<string, unknown>;
    if (!body?.caseId) return notFound('Case ID is required');
    const input = validate(createNotificationSchema, body);
    const notification = await notificationUseCase.create(body.caseId, input, context);
    return created(notification);
  }},
  { method: 'delete', pattern: 'notifications/:id', handler: async ({ context, params }) => {
    await notificationUseCase.delete(params.id, context);
    return noContent();
  }},
  { method: 'patch', pattern: 'notifications/:id/read', handler: async ({ context, params }) => {
    const notification = await notificationUseCase.markAsRead(params.id, context);
    return success(notification);
  }},
  { method: 'patch', pattern: 'notifications/read-all', handler: async ({ context }) => {
    const count = await notificationUseCase.markAllAsRead(context);
    return success({ count });
  }},

  // Share Links
  { method: 'post', pattern: 'share-links', handler: async ({ event, context }) => {
    const body = parseBody(event);
    const input = validate(createShareLinkSchema, body);
    const link = await shareLinkUseCase.create(input.caseId, input.documentIds, context);
    return created(link);
  }},

  // Subscriptions
  { method: 'get', pattern: 'subscriptions', handler: async ({ context }) => {
    const info = await subscriptionUseCase.getInfo(context);
    return success(info);
  }},
  { method: 'post', pattern: 'subscriptions/checkout', handler: async ({ event, context }) => {
    const body = parseBody(event);
    const input = validate(createCheckoutSchema, body);
    const result = await subscriptionUseCase.createCheckout(input.plan, context);
    return success(result);
  }},
  { method: 'post', pattern: 'subscriptions/portal', handler: async ({ context }) => {
    const result = await subscriptionUseCase.createPortal(context);
    return success(result);
  }},
  { method: 'delete', pattern: 'subscriptions', handler: async ({ context }) => {
    await subscriptionUseCase.cancel(context);
    return noContent();
  }},
  { method: 'patch', pattern: 'subscriptions/reactivate', handler: async ({ context }) => {
    await subscriptionUseCase.reactivate(context);
    return noContent();
  }},

  // Me
  { method: 'get', pattern: 'me', handler: async ({ context }) => {
    const lawyer = await lawyerUseCase.getById(context.lawyerId, context.organizationId);
    return success(lawyer);
  }},
  { method: 'put', pattern: 'me', handler: async ({ event, context }) => {
    const body = parseBody(event);
    const input = validate(updateProfileSchema, body);
    const lawyer = await lawyerUseCase.update(context.lawyerId, input, context);
    return success(lawyer);
  }},

  // Uploads
  { method: 'post', pattern: 'uploads/presigned-url', handler: async ({ event, context }) => {
    const body = parseBody(event);
    const input = validate(presignedUrlSchema, body);
    const result = await uploadUseCase.generatePresignedUrl(input.folder, input.contentType, input.fileName, context);
    return success(result);
  }},
  { method: 'post', pattern: 'uploads', handler: async ({ event, context }) => {
    const body = parseBody(event);
    const input = validate(uploadFileSchema, body);
    const result = await uploadUseCase.uploadFile(input.folder, input.contentType, input.fileName, input.data, context);
    return created(result);
  }},
];

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
    const path = event.path;

    const matched = matchRoute(routes, method, path);

    if (!matched) {
      return notFound('Route not found');
    }

    return await matched.handler({ event, context: authContext, params: matched.params });
  } catch (err) {
    return error(err);
  }
};
