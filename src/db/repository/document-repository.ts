import type { PrismaClient } from '../prisma';
import type { IDocumentRepository } from '../interfaces/idocument-repository';
import type {
  DocumentRequest,
  CreateDocumentRequestInput,
  UpdateDocumentRequestInput,
} from '../../types';
import type { RejectionReason } from '../../enum';

export class DocumentRepository implements IDocumentRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<DocumentRequest | null> {
    return this.prisma.documentRequest.findUnique({ where: { id } });
  }

  async findByCase(caseId: string): Promise<DocumentRequest[]> {
    return this.prisma.documentRequest.findMany({
      where: { caseId },
      orderBy: { requestedAt: 'desc' },
    });
  }

  async countByOrganization(organizationId: string): Promise<number> {
    return this.prisma.documentRequest.count({
      where: {
        case: { organizationId },
      },
    });
  }

  async findByIds(ids: string[]): Promise<DocumentRequest[]> {
    if (ids.length === 0) return [];

    return this.prisma.documentRequest.findMany({
      where: { id: { in: ids } },
    });
  }

  async create(input: CreateDocumentRequestInput): Promise<DocumentRequest> {
    return this.prisma.documentRequest.create({
      data: {
        caseId: input.caseId,
        name: input.name,
        description: input.description ?? null,
      },
    });
  }

  async update(id: string, input: UpdateDocumentRequestInput): Promise<DocumentRequest | null> {
    const updateData: Record<string, unknown> = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;

    if (Object.keys(updateData).length === 0) {
      return this.findById(id);
    }

    return this.prisma.documentRequest.update({
      where: { id },
      data: updateData,
    });
  }

  async upload(id: string, fileUrl: string): Promise<DocumentRequest | null> {
    return this.prisma.documentRequest.update({
      where: { id },
      data: {
        fileUrl,
        status: 'pending_approval',
        uploadedAt: new Date(),
        rejectedAt: null,
        rejectionReason: null,
        rejectionNote: null,
      },
    });
  }

  async approve(id: string): Promise<DocumentRequest | null> {
    return this.prisma.documentRequest.update({
      where: { id },
      data: {
        status: 'received',
        receivedAt: new Date(),
      },
    });
  }

  async reject(id: string, reason: RejectionReason, note?: string): Promise<DocumentRequest | null> {
    return this.prisma.documentRequest.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectedAt: new Date(),
        rejectionReason: reason,
        rejectionNote: note ?? null,
      },
    });
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.documentRequest.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
}
