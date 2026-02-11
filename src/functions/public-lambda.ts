import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { success, noContent, notFound, error } from '../helpers/http-status';
import { parseBody } from '../helpers/parse-body';
import { verifyStripeWebhook } from '../helpers/stripe-webhook';
import { matchRoute } from '../helpers/router';
import type { Route } from '../helpers/router';
import { validate } from '../validations/validate';
import { loginSchema, uploadDocumentSchema, publicPresignedUrlSchema } from '../validations/schemas';
import { AuthUseCase, ShareLinkUseCase, WebhookUseCase } from '../use-cases/public';
import { PlanEnforcerUseCase, UploadUseCase } from '../use-cases/private';
import {
  LawyerRepository,
  LegalCaseRepository,
  DocumentRepository,
  ShareLinkRepository,
  SubscriptionRepository,
  OrganizationRepository,
} from '../db/repository';
import { getPrisma } from '../db/prisma';
import { PLANS } from '../config/constants';

const prisma = getPrisma();
const lawyerRepo = new LawyerRepository(prisma);
const caseRepo = new LegalCaseRepository(prisma);
const documentRepo = new DocumentRepository(prisma);
const shareLinkRepo = new ShareLinkRepository(prisma);

const organizationRepo = new OrganizationRepository(prisma);
const subscriptionRepo = new SubscriptionRepository(prisma);

const planEnforcerUseCase = new PlanEnforcerUseCase(subscriptionRepo, lawyerRepo, caseRepo, documentRepo, shareLinkRepo);
const authUseCase = new AuthUseCase(lawyerRepo);
const shareLinkUseCase = new ShareLinkUseCase(shareLinkRepo, documentRepo, caseRepo, planEnforcerUseCase);
const webhookUseCase = new WebhookUseCase(subscriptionRepo, organizationRepo);
const uploadUseCase = new UploadUseCase(shareLinkRepo, documentRepo, caseRepo);

const routes: Route[] = [
  // Auth
  { method: 'post', pattern: 'auth', handler: async ({ event }) => {
    const body = parseBody(event);
    const input = validate(loginSchema, body);
    const result = await authUseCase.login(input.email, input.password);
    return success(result);
  }},
  { method: 'post', pattern: 'auth/login', handler: async ({ event }) => {
    const body = parseBody(event);
    const input = validate(loginSchema, body);
    const result = await authUseCase.login(input.email, input.password);
    return success(result);
  }},

  // Share Links
  { method: 'get', pattern: 'share-links/:token', handler: async ({ params }) => {
    const link = await shareLinkUseCase.getByToken(params.token);
    return success(link);
  }},
  { method: 'post', pattern: 'share-links/:token/upload-url', handler: async ({ event, params }) => {
    const body = parseBody(event);
    const input = validate(publicPresignedUrlSchema, body);
    const result = await uploadUseCase.generatePublicPresignedUrl(
      params.token,
      input.documentId,
      input.contentType,
      input.fileName
    );
    return success(result);
  }},
  { method: 'post', pattern: 'share-links/:token/upload', handler: async ({ event, params }) => {
    const body = parseBody(event) as { documentId?: string; fileUrl?: string };
    if (!body?.documentId) {
      return notFound('Document ID is required');
    }
    const input = validate(uploadDocumentSchema, body);
    await uploadUseCase.confirmPublicUpload(params.token, body.documentId, input.fileUrl);
    return noContent();
  }},

  // Plans
  { method: 'get', pattern: 'plans', handler: async () => {
    const plans = Object.values(PLANS).map(({ name, type, price, limits }) => ({
      name,
      type,
      price,
      limits,
    }));
    return success(plans);
  }},

  // Webhooks
  { method: 'post', pattern: 'webhooks/stripe', handler: async ({ event }) => {
    const signature = event.headers['Stripe-Signature'] || event.headers['stripe-signature'];
    if (!signature || !event.body) {
      return { statusCode: 400, headers: {}, body: JSON.stringify({ error: 'Missing signature or body' }) };
    }

    const stripeEvent = verifyStripeWebhook(event.body, signature);
    const subscription = stripeEvent.data.object as import('stripe').default.Subscription;

    switch (stripeEvent.type) {
      case 'customer.subscription.created':
        await webhookUseCase.handleSubscriptionCreated(subscription);
        break;
      case 'customer.subscription.updated':
        await webhookUseCase.handleSubscriptionUpdated(subscription);
        break;
      case 'customer.subscription.deleted':
        await webhookUseCase.handleSubscriptionDeleted(subscription);
        break;
      case 'customer.subscription.trial_will_end':
        await webhookUseCase.handleTrialWillEnd(subscription);
        break;
      default:
        console.log('Unhandled Stripe event:', stripeEvent.type);
    }

    return success({ received: true });
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

    const method = event.httpMethod.toLowerCase();
    const matched = matchRoute(routes, method, event.path);

    if (!matched) {
      return notFound('Route not found');
    }

    return await matched.handler({ event, context: {}, params: matched.params });
  } catch (err) {
    return error(err);
  }
};
