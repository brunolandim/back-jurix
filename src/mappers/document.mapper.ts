import { resolveFileUrl } from '../utils/s3';
import type { DocumentRequest } from '../types';

export class DocumentMapper {
  static async build(doc: DocumentRequest): Promise<DocumentRequest> {
    return {
      id: doc.id,
      caseId: doc.caseId,
      name: doc.name,
      description: doc.description,
      status: doc.status,
      fileUrl: await resolveFileUrl(doc.fileUrl),
      requestedAt: doc.requestedAt,
      uploadedAt: doc.uploadedAt,
      receivedAt: doc.receivedAt,
      rejectedAt: doc.rejectedAt,
      rejectionReason: doc.rejectionReason,
      rejectionNote: doc.rejectionNote,
    };
  }
}
