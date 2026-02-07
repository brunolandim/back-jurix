import type {
  LegalCase,
  CreateLegalCaseInput,
  UpdateLegalCaseInput,
} from '../../types';

export interface ICaseRepository {
  findById(id: string): Promise<LegalCase | null>;
  findByColumn(columnId: string): Promise<LegalCase[]>;
  findByOrganization(organizationId: string): Promise<LegalCase[]>;
  findByAssignee(lawyerId: string): Promise<LegalCase[]>;
  countByOrganization(organizationId: string): Promise<number>;
  create(input: CreateLegalCaseInput): Promise<LegalCase>;
  update(id: string, input: UpdateLegalCaseInput): Promise<LegalCase | null>;
  delete(id: string): Promise<boolean>;
  getMaxOrder(columnId: string): Promise<number>;
}
