import type { DocumentStatus, RejectionReason } from '../enum';

export interface DocumentRequest {
  id: string;
  caseId: string;
  name: string;
  description: string | null;
  status: DocumentStatus;
  fileUrl: string | null;
  requestedAt: Date;
  uploadedAt: Date | null;
  receivedAt: Date | null;
  rejectedAt: Date | null;
  rejectionReason: RejectionReason | null;
  rejectionNote: string | null;
}

export interface CreateDocumentRequestInput {
  caseId: string;
  name: string;
  description?: string;
}

export interface UpdateDocumentRequestInput {
  name?: string;
  description?: string;
}

export interface ApproveDocumentInput {
  documentId: string;
}

export interface RejectDocumentInput {
  documentId: string;
  rejectionReason: RejectionReason;
  rejectionNote?: string;
}

export interface UploadDocumentInput {
  documentId: string;
  fileUrl: string;
}
