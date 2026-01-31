import type {
  Organization,
  CreateOrganizationInput,
  UpdateOrganizationInput,
} from '../../types';

export interface IOrganizationRepository {
  findById(id: string): Promise<Organization | null>;
  findByDocument(document: string): Promise<Organization | null>;
  create(input: CreateOrganizationInput): Promise<Organization>;
  update(id: string, input: UpdateOrganizationInput): Promise<Organization | null>;
}
