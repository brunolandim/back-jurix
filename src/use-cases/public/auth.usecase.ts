import crypto from 'node:crypto';
import { UnauthorizedError, NotFoundError } from '../../errors';
import { comparePassword } from '../../utils/password';
import { signToken } from '../../utils/jwt';
import type { ILawyerRepository } from '../../db/interfaces';
import type { LawyerPublic } from '../../types';
import { LawyerMapper } from '../../mappers/lawyer.mapper';
import { buildPasswordResetEmail, sendEmail } from '../../services/email-service';
import { getWorkerEnv } from '../../config/env-worker';

export interface LoginResult {
  token: string;
  lawyer: LawyerPublic;
}

export class AuthUseCase {
  constructor(private lawyerRepo: ILawyerRepository) {}

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
      lawyer: LawyerMapper.toPublic(lawyer),
    };
  }

  async getMe(lawyerId: string): Promise<LawyerPublic> {
    const lawyer = await this.lawyerRepo.findById(lawyerId);

    if (!lawyer) {
      throw new NotFoundError('Lawyer', lawyerId);
    }

    return LawyerMapper.toPublic(lawyer);
  }

  async forgotPassword(email: string): Promise<void> {
    const lawyer = await this.lawyerRepo.findByEmail(email);

    if (!lawyer) {
      return;
    }

    const env = getWorkerEnv();
    const code = String(Math.floor(100000 + crypto.randomInt(900000)));
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.lawyerRepo.setResetCode(lawyer.id, code, expires);

    const resetUrl = `${env.APP_URL}/auth/reset-password?code=${code}`;
    const htmlBody = buildPasswordResetEmail(resetUrl);

    try {
      await sendEmail({
        to: lawyer.email,
        subject: 'Redefinição de senha - Jurix',
        htmlBody,
      });
    } catch (err) {
      console.error('[auth] Failed to send password reset email:', err);
    }
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    const lawyer = await this.lawyerRepo.findByEmailAndCode(email, code);

    if (!lawyer) {
      throw new UnauthorizedError('Código inválido ou expirado');
    }

    await this.lawyerRepo.update(lawyer.id, { password: newPassword });
    await this.lawyerRepo.setResetCode(lawyer.id, null, null);
  }
}
