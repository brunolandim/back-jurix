import type {
  DocumentRequest,
  CreateDocumentRequestInput,
  UpdateDocumentRequestInput,
  LawyerUploadDocumentInput,
} from '../../types';
import type { RejectionReason } from '../../enum';

export interface IDocumentRepository {
  findById(id: string): Promise<DocumentRequest | null>;
  findByCase(caseId: string): Promise<DocumentRequest[]>;
  findByIds(ids: string[]): Promise<DocumentRequest[]>;
  countByOrganization(organizationId: string): Promise<number>;
  create(input: CreateDocumentRequestInput): Promise<DocumentRequest>;
  update(id: string, input: UpdateDocumentRequestInput): Promise<DocumentRequest | null>;
  upload(id: string, fileUrl: string): Promise<DocumentRequest | null>;
  lawyerUpload(input: LawyerUploadDocumentInput): Promise<DocumentRequest>;
  approve(id: string): Promise<DocumentRequest | null>;
  reject(id: string, reason: RejectionReason, note?: string): Promise<DocumentRequest | null>;
  delete(id: string): Promise<boolean>;
}
