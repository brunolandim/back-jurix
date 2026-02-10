import { NotFoundError, ValidationError } from '../../errors';
import type {
  IDocumentRepository,
  ICaseRepository,
} from '../../db/interfaces';
import type {
  DocumentRequest,
  CreateDocumentRequestInput,
  UpdateDocumentRequestInput,
  AuthContext,
} from '../../types';
import type { RejectionReason } from '../../enum';
import type { PlanEnforcerUseCase } from './plan-enforcer.usecase';

export class DocumentUseCase {
  constructor(
    private documentRepo: IDocumentRepository,
    private caseRepo: ICaseRepository,
    private planEnforcer: PlanEnforcerUseCase
  ) {}

  private async verifyCaseOwnership(caseId: string, organizationId: string): Promise<void> {
    const legalCase = await this.caseRepo.findById(caseId);
    if (!legalCase || legalCase.organizationId !== organizationId) {
      throw new NotFoundError('Case', caseId);
    }
  }

  async listByCase(caseId: string, context: AuthContext): Promise<DocumentRequest[]> {
    await this.verifyCaseOwnership(caseId, context.organizationId);
    return this.documentRepo.findByCase(caseId);
  }

  async create(
    caseId: string,
    input: Omit<CreateDocumentRequestInput, 'caseId'>,
    context: AuthContext
  ): Promise<DocumentRequest> {
    await this.planEnforcer.enforce(context.organizationId, 'documents');
    await this.verifyCaseOwnership(caseId, context.organizationId);

    return this.documentRepo.create({
      caseId,
      name: input.name,
      description: input.description,
    });
  }

  async update(
    id: string,
    caseId: string,
    input: UpdateDocumentRequestInput,
    context: AuthContext
  ): Promise<DocumentRequest> {
    await this.verifyCaseOwnership(caseId, context.organizationId);

    const document = await this.documentRepo.findById(id);
    if (!document || document.caseId !== caseId) {
      throw new NotFoundError('Document', id);
    }

    const updated = await this.documentRepo.update(id, input);
    return updated!;
  }

  async approve(id: string, caseId: string, context: AuthContext): Promise<DocumentRequest> {
    await this.verifyCaseOwnership(caseId, context.organizationId);

    const document = await this.documentRepo.findById(id);
    if (!document || document.caseId !== caseId) {
      throw new NotFoundError('Document', id);
    }

    if (document.status !== 'pending_approval') {
      throw new ValidationError('Document is not pending approval');
    }

    const updated = await this.documentRepo.approve(id);
    return updated!;
  }

  async reject(
    id: string,
    caseId: string,
    reason: RejectionReason,
    note: string | undefined,
    context: AuthContext
  ): Promise<DocumentRequest> {
    await this.verifyCaseOwnership(caseId, context.organizationId);

    const document = await this.documentRepo.findById(id);
    if (!document || document.caseId !== caseId) {
      throw new NotFoundError('Document', id);
    }

    if (document.status !== 'pending_approval') {
      throw new ValidationError('Document is not pending approval');
    }

    const updated = await this.documentRepo.reject(id, reason, note);
    return updated!;
  }

  async delete(id: string, context: AuthContext): Promise<void> {
    const document = await this.documentRepo.findById(id);
    if (!document) {
      throw new NotFoundError('Document', id);
    }

    await this.verifyCaseOwnership(document.caseId, context.organizationId);
    await this.documentRepo.delete(id);
  }
}
