import { NotFoundError, ForbiddenError } from '../../errors';
import { LawyerRole } from '../../enum';
import { DEFAULT_COLUMNS } from '../../config/constants';
import type {
  IOrganizationRepository,
  IColumnRepository,
} from '../../db/interfaces';
import type {
  Organization,
  CreateOrganizationInput,
  UpdateOrganizationInput,
  AuthContext,
} from '../../types';

export class OrganizationUseCase {
  constructor(
    private orgRepo: IOrganizationRepository,
    private columnRepo: IColumnRepository
  ) {}

  async getById(id: string): Promise<Organization> {
    const org = await this.orgRepo.findById(id);

    if (!org) {
      throw new NotFoundError('Organization', id);
    }

    return org;
  }

  async create(input: CreateOrganizationInput): Promise<Organization> {
    const org = await this.orgRepo.create(input);

    await this.columnRepo.createMany(
      DEFAULT_COLUMNS.map((col) => ({
        organizationId: org.id,
        title: col.title,
        isDefault: col.isDefault,
        order: col.order,
      }))
    );

    return org;
  }

  async update(id: string, input: UpdateOrganizationInput, context: AuthContext): Promise<Organization> {
    if (!([LawyerRole.OWNER, LawyerRole.ADMIN] as LawyerRole[]).includes(context.role)) {
      throw new ForbiddenError('Only owner or admin can edit the organization', 'errors.ownerAdminOnlyOrganization');
    }

    const org = await this.orgRepo.update(id, input);

    if (!org) {
      throw new NotFoundError('Organization', id);
    }

    return org;
  }
}
