import {
  ShareLinkRepository,
  DocumentRepository,
  CaseRepository,
  ColumnRepository,
} from '../../db/repository';
import { NotFoundError, ValidationError, ForbiddenError } from '../../errors';
import type { ShareableLinkWithDocuments, AuthContext } from '../../types';

export class ShareLinkUseCase {
  private shareLinkRepo: ShareLinkRepository;
  private documentRepo: DocumentRepository;
  private caseRepo: CaseRepository;
  private columnRepo: ColumnRepository;

  constructor() {
    this.shareLinkRepo = new ShareLinkRepository();
    this.documentRepo = new DocumentRepository();
    this.caseRepo = new CaseRepository();
    this.columnRepo = new ColumnRepository();
  }

  private async verifyCaseOwnership(caseId: string, organizationId: string): Promise<void> {
    const legalCase = await this.caseRepo.findById(caseId);
    if (!legalCase) {
      throw new NotFoundError('Case', caseId);
    }

    const column = await this.columnRepo.findById(legalCase.columnId);
    if (!column || column.organizationId !== organizationId) {
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
