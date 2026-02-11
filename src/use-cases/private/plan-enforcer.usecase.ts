import type {
  ISubscriptionRepository,
  ILawyerRepository,
  ICaseRepository,
  IShareLinkRepository,
} from '../../db/interfaces';
import { PLANS } from '../../config/constants';
import { PlanLimitError, SubscriptionRequiredError, ReadOnlyModeError } from '../../errors';
import type { Subscription } from '../../types';

type ResourceType = 'lawyers' | 'activeCases' | 'shareLinks';

export class PlanEnforcerUseCase {
  constructor(
    private subscriptionRepo: ISubscriptionRepository,
    private lawyerRepo: ILawyerRepository,
    private caseRepo: ICaseRepository,
    private shareLinkRepo: IShareLinkRepository
  ) {}

  async enforce(organizationId: string, resource: ResourceType): Promise<void> {
    const subscription = await this.subscriptionRepo.findByOrganizationId(organizationId);

    this.enforceActiveSubscription(subscription);

    const plan = PLANS[subscription!.plan];
    if (!plan) return;

    const limit = plan.limits[resource];
    if (limit === null) return;

    const current = await this.getCount(organizationId, resource);

    if (current >= limit) {
      throw new PlanLimitError(resource, limit);
    }
  }

  private enforceActiveSubscription(subscription: Subscription | null): void {
    if (!subscription) {
      throw new SubscriptionRequiredError();
    }

    const { status } = subscription;

    if (status === 'trialing' || status === 'active') {
      return;
    }

    if (status === 'past_due') {
      throw new ReadOnlyModeError();
    }

    throw new SubscriptionRequiredError();
  }

  private async getCount(organizationId: string, resource: ResourceType): Promise<number> {
    switch (resource) {
      case 'lawyers':
        return this.lawyerRepo.countByOrganization(organizationId);
      case 'activeCases':
        return this.caseRepo.countByOrganization(organizationId);
      case 'shareLinks':
        return this.shareLinkRepo.countByOrganization(organizationId);
    }
  }
}
