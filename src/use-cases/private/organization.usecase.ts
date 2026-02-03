import { NotFoundError } from '../../errors';
import { DEFAULT_COLUMNS } from '../../config/constants';
import type {
  IOrganizationRepository,
  IColumnRepository,
} from '../../db/interfaces';
import type {
  Organization,
  CreateOrganizationInput,
  UpdateOrganizationInput,
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

  async update(id: string, input: UpdateOrganizationInput): Promise<Organization> {
    const org = await this.orgRepo.update(id, input);

    if (!org) {
      throw new NotFoundError('Organization', id);
    }

    return org;
  }
}
