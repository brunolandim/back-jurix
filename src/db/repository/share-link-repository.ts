import { getPrisma } from '../prisma';
import type { IShareLinkRepository } from '../interfaces/ishare-link-repository';
import type {
  ShareableLink,
  ShareableLinkWithDocuments,
  CreateShareableLinkInput,
  DocumentRequest,
} from '../../types';
import { generateToken } from '../../utils/token';

export class ShareLinkRepository implements IShareLinkRepository {
  async findById(id: string): Promise<ShareableLink | null> {
    return getPrisma().shareableLink.findUnique({ where: { id } });
  }

  async findByToken(token: string): Promise<ShareableLink | null> {
    return getPrisma().shareableLink.findUnique({ where: { token } });
  }

  async findByTokenWithDocuments(token: string): Promise<ShareableLinkWithDocuments | null> {
    const link = await this.findByToken(token);
    if (!link) return null;

    const documents = await this.getDocuments(link.id);

    return {
      ...link,
      documents,
    };
  }

  async findByCase(caseId: string): Promise<ShareableLink[]> {
    return getPrisma().shareableLink.findMany({
      where: { caseId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(input: CreateShareableLinkInput): Promise<ShareableLinkWithDocuments> {
    const token = generateToken();

    const link = await getPrisma().$transaction(async (tx) => {
      const createdLink = await tx.shareableLink.create({
        data: {
          token,
          caseId: input.caseId,
          createdBy: input.createdBy,
        },
      });

      if (input.documentIds.length > 0) {
        await tx.linkDocument.createMany({
          data: input.documentIds.map((documentId) => ({
            linkId: createdLink.id,
            documentId,
          })),
        });
      }

      return createdLink;
    });

    const documents = await this.getDocuments(link.id);

    return {
      ...link,
      documents,
    };
  }

  async getDocuments(linkId: string): Promise<DocumentRequest[]> {
    const linkDocuments = await getPrisma().linkDocument.findMany({
      where: { linkId },
      include: { document: true },
    });

    return linkDocuments.map((ld) => ld.document);
  }

  async expire(id: string): Promise<ShareableLink | null> {
    return getPrisma().shareableLink.update({
      where: { id },
      data: { isExpired: true },
    });
  }

  async checkAndExpire(linkId: string): Promise<boolean> {
    const documents = await this.getDocuments(linkId);

    const allReceived = documents.every((doc) => doc.status === 'received');

    if (allReceived) {
      await this.expire(linkId);
      return true;
    }

    return false;
  }
}
