import { LawyerRepository } from '../../db/repository';
import { UnauthorizedError, NotFoundError } from '../../errors';
import { comparePassword } from '../../utils/password';
import { signToken } from '../../utils/jwt';
import type { LawyerPublic } from '../../types';
import { toPublicLawyer } from '../../types';

export interface LoginResult {
  token: string;
  lawyer: LawyerPublic;
}

export class AuthUseCase {
  private lawyerRepo: LawyerRepository;

  constructor() {
    this.lawyerRepo = new LawyerRepository();
  }

  async login(email: string, password: string): Promise<LoginResult> {
    const lawyer = await this.lawyerRepo.findByEmail(email);

    if (!lawyer) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!lawyer.active) {
      throw new UnauthorizedError('Account is inactive');
    }

    const isValidPassword = await comparePassword(password, lawyer.passwordHash);

    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = signToken({
      sub: lawyer.id,
      organizationId: lawyer.organizationId,
      role: lawyer.role,
    });

    return {
      token,
      lawyer: toPublicLawyer(lawyer),
    };
  }

  async getMe(lawyerId: string): Promise<LawyerPublic> {
    const lawyer = await this.lawyerRepo.findById(lawyerId);

    if (!lawyer) {
      throw new NotFoundError('Lawyer', lawyerId);
    }

    return toPublicLawyer(lawyer);
  }
}
