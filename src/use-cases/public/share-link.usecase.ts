import { NotFoundError, ValidationError, ForbiddenError } from '../../errors';
import type {
  IShareLinkRepository,
  IDocumentRepository,
  ICaseRepository,
} from '../../db/interfaces';
import type { ShareableLinkWithDocuments, AuthContext } from '../../types';
import type { PlanEnforcerUseCase } from '../private/plan-enforcer.usecase';

export class ShareLinkUseCase {
  constructor(
    private shareLinkRepo: IShareLinkRepository,
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

  async create(
    caseId: string,
    documentIds: string[],
    context: AuthContext
  ): Promise<ShareableLinkWithDocuments> {
    await this.verifyCaseOwnership(caseId, context.organizationId);

    const documents = await this.documentRepo.findByIds(documentIds);

    if (documents.length !== documentIds.length) {
      throw new ValidationError('One or more documents not found');
    }

    for (const doc of documents) {
      if (doc.caseId !== caseId) {
        throw new ValidationError('All documents must belong to the same case');
      }
    }

    const existingLinks = await this.shareLinkRepo.findByCase(caseId);
    const activeLink = existingLinks.find((link) => !link.isExpired);

    if (activeLink) {
      const linkDocuments = await this.shareLinkRepo.getDocuments(activeLink.id);
      const linkDocIds = new Set(linkDocuments.map((d) => d.id));
      const sameDocuments = documentIds.length === linkDocIds.size && documentIds.every((id) => linkDocIds.has(id));

      if (sameDocuments) {
        return { ...activeLink, documents: linkDocuments };
      }

      await this.shareLinkRepo.expire(activeLink.id);
    }

    await this.planEnforcer.enforce(context.organizationId, 'shareLinks');

    return this.shareLinkRepo.create({
      caseId,
      documentIds,
      createdBy: context.lawyerId,
    });
  }

  async getByToken(token: string): Promise<ShareableLinkWithDocuments> {
    const link = await this.shareLinkRepo.findByTokenWithDocuments(token);

    if (!link) {
      throw new NotFoundError('Link', token);
    }

    if (link.isExpired) {
      throw new ForbiddenError('This link has expired');
    }

    return link;
  }

  async uploadDocument(token: string, documentId: string, fileUrl: string): Promise<void> {
    const link = await this.shareLinkRepo.findByTokenWithDocuments(token);

    if (!link) {
      throw new NotFoundError('Link', token);
    }

    if (link.isExpired) {
      throw new ForbiddenError('This link has expired');
    }

    const isLinked = link.documents.some((doc) => doc.id === documentId);
    if (!isLinked) {
      throw new NotFoundError('Document', documentId);
    }

    const document = await this.documentRepo.findById(documentId);
    if (!document) {
      throw new NotFoundError('Document', documentId);
    }

    await this.documentRepo.upload(documentId, fileUrl);

    await this.shareLinkRepo.checkAndExpire(link.id);
  }
}
