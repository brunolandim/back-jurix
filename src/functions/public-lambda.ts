import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { success, noContent, notFound, error } from '../helpers/http-status';
import { parseBody } from '../helpers/parse-body';
import { verifyStripeWebhook } from '../helpers/stripe-webhook';
import { validate } from '../validations/validate';
import { loginSchema, uploadDocumentSchema } from '../validations/schemas';
import { AuthUseCase, ShareLinkUseCase, WebhookUseCase } from '../use-cases/public';
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

const organizationRepo = new OrganizationRepository(prisma);
const subscriptionRepo = new SubscriptionRepository(prisma);

const authUseCase = new AuthUseCase(lawyerRepo);
const shareLinkUseCase = new ShareLinkUseCase(shareLinkRepo, documentRepo, caseRepo);
const webhookUseCase = new WebhookUseCase(subscriptionRepo, organizationRepo);

const routes: Record<string, Record<string, RouteHandler>> = {
  get: {
    'share-links': async ({ id }) => {
      if (!id) return notFound('Token is required');
      const link = await shareLinkUseCase.getByToken(id);
      return success(link);
    },
    plans: async () => {
      const plans = Object.values(PLANS).map(({ name, type, price, limits }) => ({
        name,
        type,
        price,
        limits,
      }));
      return success(plans);
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
    'webhooks/stripe': async ({ event }) => {
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

    let routeKey = subAction ? `${resource}/${subAction}` : resource;
    if (!routes[method]?.[routeKey] && id && !subAction) {
      routeKey = `${resource}/${id}`;
    }

    const routeHandler = routes[method]?.[routeKey];

    if (!routeHandler) {
      return notFound('Route not found');
    }

    return await routeHandler({ event, id: routes[method]?.[`${resource}/${id}`] ? undefined : id, subAction });
  } catch (err) {
    return error(err);
  }
};
