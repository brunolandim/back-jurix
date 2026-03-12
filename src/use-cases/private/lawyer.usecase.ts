import { NotFoundError, ConflictError, ForbiddenError } from '../../errors';
import { LawyerRole } from '../../enum';
import type { ILawyerRepository } from '../../db/interfaces';
import type {
  LawyerPublic,
  CreateLawyerInput,
  UpdateLawyerInput,
  AuthContext,
} from '../../types';
import type { PlanEnforcerUseCase } from './plan-enforcer.usecase';
import { extractS3Key } from '../../utils/s3';
import { LawyerMapper } from '../../mappers/lawyer.mapper';

export class LawyerUseCase {
  constructor(
    private lawyerRepo: ILawyerRepository,
    private planEnforcer: PlanEnforcerUseCase
  ) {}

  async list(organizationId: string): Promise<LawyerPublic[]> {
    const lawyers = await this.lawyerRepo.findByOrganization(organizationId);
    return lawyers.map((l) => LawyerMapper.toPublic(l));
  }

  async getById(id: string, organizationId: string): Promise<LawyerPublic> {
    const lawyer = await this.lawyerRepo.findById(id);

    if (!lawyer || lawyer.organizationId !== organizationId) {
      throw new NotFoundError('Lawyer', id);
    }

    return LawyerMapper.toPublic(lawyer);
  }

  async create(input: CreateLawyerInput, context: AuthContext): Promise<LawyerPublic> {
    await this.planEnforcer.enforce(context.organizationId, 'lawyers');

    if (!([LawyerRole.OWNER, LawyerRole.ADMIN] as LawyerRole[]).includes(context.role)) {
      throw new ForbiddenError('Only owner or admin can create lawyers', 'errors.ownerAdminOnlyCreate');
    }

    const existingEmail = await this.lawyerRepo.findByEmail(input.email);
    if (existingEmail) {
      throw new ConflictError('Email already in use', 'email', 'errors.emailInUse');
    }

    const existingOab = await this.lawyerRepo.findByOab(input.oab);
    if (existingOab) {
      throw new ConflictError('OAB number already registered', 'oab', 'errors.oabInUse');
    }

    const lawyer = await this.lawyerRepo.create(input);
    return LawyerMapper.toPublic(lawyer);
  }

  async update(
    id: string,
    input: UpdateLawyerInput,
    context: AuthContext
  ): Promise<LawyerPublic> {
    const lawyer = await this.lawyerRepo.findById(id);

    if (!lawyer || lawyer.organizationId !== context.organizationId) {
      throw new NotFoundError('Lawyer', id);
    }

    if (input.active !== undefined && !([LawyerRole.OWNER, LawyerRole.ADMIN] as LawyerRole[]).includes(context.role)) {
      throw new ForbiddenError('Only owner or admin can change active status', 'errors.ownerAdminOnlyStatus');
    }

    if (input.role && input.role !== lawyer.role && context.role !== LawyerRole.OWNER) {
      throw new ForbiddenError('Only owner can change roles', 'errors.ownerOnlyRoles');
    }

    if (lawyer.role === LawyerRole.OWNER && input.role && input.role !== LawyerRole.OWNER) {
      throw new ForbiddenError('Cannot change owner role', 'errors.cannotChangeOwnerRole');
    }

    if (input.email && input.email !== lawyer.email) {
      const existing = await this.lawyerRepo.findByEmail(input.email);
      if (existing) {
        throw new ConflictError('Email already in use', 'email', 'errors.emailInUse');
      }
    }

    if (input.photo) {
      input = { ...input, photo: extractS3Key(input.photo) };
    }

    const updated = await this.lawyerRepo.update(id, input);
    return LawyerMapper.toPublic(updated!);
  }

  async delete(id: string, context: AuthContext): Promise<void> {
    const lawyer = await this.lawyerRepo.findById(id);

    if (!lawyer || lawyer.organizationId !== context.organizationId) {
      throw new NotFoundError('Lawyer', id);
    }

    if (lawyer.role === LawyerRole.OWNER) {
      throw new ForbiddenError('Cannot delete organization owner', 'errors.cannotDeleteOwner');
    }

    if (lawyer.id === context.lawyerId) {
      throw new ForbiddenError('Cannot delete yourself', 'errors.cannotDeleteSelf');
    }

    await this.lawyerRepo.delete(id);
  }
}
