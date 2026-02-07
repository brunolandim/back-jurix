import type {
  ISubscriptionRepository,
  ILawyerRepository,
  ICaseRepository,
  IDocumentRepository,
  IShareLinkRepository,
} from '../../db/interfaces';
import { PLANS } from '../../config/constants';
import { PlanLimitError } from '../../errors';
import { enforceActiveSubscription } from './plan-limit';

type ResourceType = 'lawyers' | 'activeCases' | 'documents' | 'shareLinks';

export class PlanEnforcerUseCase {
  constructor(
    private subscriptionRepo: ISubscriptionRepository,
    private lawyerRepo: ILawyerRepository,
    private caseRepo: ICaseRepository,
    private documentRepo: IDocumentRepository,
    private shareLinkRepo: IShareLinkRepository
  ) {}

  async enforce(organizationId: string, resource: ResourceType): Promise<void> {
    const subscription = await this.subscriptionRepo.findByOrganizationId(organizationId);

    enforceActiveSubscription(subscription);

    const plan = PLANS[subscription!.plan];
    if (!plan) return;

    const limit = plan.limits[resource];
    if (limit === null) return;

    const current = await this.getCount(organizationId, resource);

    if (current >= limit) {
      throw new PlanLimitError(resource, limit);
    }
  }

  private async getCount(organizationId: string, resource: ResourceType): Promise<number> {
    switch (resource) {
      case 'lawyers':
        return this.lawyerRepo.countByOrganization(organizationId);
      case 'activeCases':
        return this.caseRepo.countByOrganization(organizationId);
      case 'documents':
        return this.documentRepo.countByOrganization(organizationId);
      case 'shareLinks':
        return this.shareLinkRepo.countByOrganization(organizationId);
    }
  }
}
