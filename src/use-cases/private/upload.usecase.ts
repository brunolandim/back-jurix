import { randomUUID } from 'crypto';
import { generatePresignedUploadUrl, uploadToS3, extractS3Key } from '../../utils/s3';
import type { AuthContext } from '../../types';
import type { IShareLinkRepository, IDocumentRepository, ICaseRepository } from '../../db/interfaces';
import { NotFoundError, ForbiddenError } from '../../errors';

export class UploadUseCase {
  constructor(
    private shareLinkRepo?: IShareLinkRepository,
    private documentRepo?: IDocumentRepository,
    private caseRepo?: ICaseRepository
  ) {}

  async generatePresignedUrl(
    folder: string,
    contentType: string,
    fileName: string,
    context: AuthContext
  ): Promise<{ uploadUrl: string; fileUrl: string; fileKey: string }> {
    const key = `${context.organizationId}/${folder}/${randomUUID()}-${fileName}`;
    return generatePresignedUploadUrl(key, contentType);
  }

  async generatePublicPresignedUrl(
    token: string,
    documentId: string,
    contentType: string,
    fileName: string
  ): Promise<{ uploadUrl: string; fileUrl: string; fileKey: string; documentId: string }> {
    if (!this.shareLinkRepo || !this.documentRepo || !this.caseRepo) {
      throw new Error('Repositories not initialized');
    }

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

    const legalCase = await this.caseRepo.findById(link.caseId);
    if (!legalCase) {
      throw new NotFoundError('Case', link.caseId);
    }

    const key = `${legalCase.organizationId}/documents/${randomUUID()}-${fileName}`;
    const result = await generatePresignedUploadUrl(key, contentType);
    
    return { ...result, documentId };
  }

  async confirmPublicUpload(token: string, documentId: string, fileUrl: string): Promise<void> {
    if (!this.shareLinkRepo || !this.documentRepo) {
      throw new Error('Repositories not initialized');
    }

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

    await this.documentRepo.upload(documentId, fileUrl);
    await this.shareLinkRepo.checkAndExpire(link.id);
  }

  async uploadFile(
    folder: string,
    contentType: string,
    fileName: string,
    data: string,
    context: AuthContext
  ): Promise<{ fileUrl: string; fileKey: string }> {
    const key = `${context.organizationId}/${folder}/${randomUUID()}-${fileName}`;
    const buffer = Buffer.from(data, 'base64');
    const fileKey = await uploadToS3(key, contentType, buffer);
    return { fileUrl: fileKey, fileKey };
  }
}
