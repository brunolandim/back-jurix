import type {
  Lawyer,
  CreateLawyerInput,
  UpdateLawyerInput,
} from '../../types';

export interface ILawyerRepository {
  findById(id: string): Promise<Lawyer | null>;
  findByEmail(email: string): Promise<Lawyer | null>;
  findByOab(oab: string): Promise<Lawyer | null>;
  findByOrganization(organizationId: string): Promise<Lawyer[]>;
  countByOrganization(organizationId: string): Promise<number>;
  create(input: CreateLawyerInput): Promise<Lawyer>;
  update(id: string, input: UpdateLawyerInput): Promise<Lawyer | null>;
  delete(id: string): Promise<boolean>;
  findByEmailAndCode(email: string, code: string): Promise<Lawyer | null>;
  setResetCode(id: string, code: string | null, expires: Date | null): Promise<void>;
}
