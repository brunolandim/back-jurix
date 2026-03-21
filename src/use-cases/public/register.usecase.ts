import { ConflictError } from '../../errors';
import { signToken } from '../../utils/jwt';
import { DEFAULT_COLUMNS } from '../../config/constants';
import { LawyerMapper } from '../../mappers/lawyer.mapper';
import type { IOrganizationRepository } from '../../db/interfaces/iorganization-repository';
import type { IColumnRepository } from '../../db/interfaces/icolumn-repository';
import type { ILawyerRepository } from '../../db/interfaces';
import type { LoginResult } from './auth.usecase';

export interface RegisterInput {
  companyName: string;
  document: string;
  companyEmail?: string;
  companyPhone?: string;
  name: string;
  email: string;
  password: string;
  oab: string;
  phone?: string;
}

export class RegisterUseCase {
  constructor(
    private orgRepo: IOrganizationRepository,
    private columnRepo: IColumnRepository,
    private lawyerRepo: ILawyerRepository,
  ) {}

  async execute(input: RegisterInput): Promise<LoginResult> {
    const existingOrg = await this.orgRepo.findByDocument(input.document);
    if (existingOrg) {
      throw new ConflictError('Document already registered', 'document', 'errors.documentAlreadyExists');
    }

    const existingEmail = await this.lawyerRepo.findByEmail(input.email);
    if (existingEmail) {
      throw new ConflictError('Email already registered', 'email', 'errors.emailAlreadyExists');
    }

    const existingOab = await this.lawyerRepo.findByOab(input.oab);
    if (existingOab) {
      throw new ConflictError('OAB already registered', 'oab', 'errors.oabAlreadyExists');
    }

    const org = await this.orgRepo.create({
      name: input.companyName,
      document: input.document,
      email: input.companyEmail,
      phone: input.companyPhone,
    });

    await this.columnRepo.createMany(
      DEFAULT_COLUMNS.map((col) => ({ ...col, organizationId: org.id })),
    );

    const lawyer = await this.lawyerRepo.create({
      organizationId: org.id,
      name: input.name,
      email: input.email,
      password: input.password,
      oab: input.oab,
      phone: input.phone,
      role: 'owner',
    });

    const token = signToken({
      sub: lawyer.id,
      organizationId: lawyer.organizationId,
      role: lawyer.role,
    });

    return {
      token,
      lawyer: LawyerMapper.toPublic(lawyer),
    };
  }
}
