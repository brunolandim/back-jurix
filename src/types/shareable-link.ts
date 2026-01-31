import type { DocumentRequest } from './document-request';

export interface ShareableLink {
  id: string;
  token: string;
  caseId: string;
  isExpired: boolean;
  createdBy: string;
  createdAt: Date;
}

export interface ShareableLinkWithDocuments extends ShareableLink {
  documents: DocumentRequest[];
}

export interface CreateShareableLinkInput {
  caseId: string;
  documentIds: string[];
  createdBy: string;
}
