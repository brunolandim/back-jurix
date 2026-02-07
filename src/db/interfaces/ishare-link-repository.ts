import type {
  ShareableLink,
  ShareableLinkWithDocuments,
  CreateShareableLinkInput,
  DocumentRequest,
} from '../../types';

export interface IShareLinkRepository {
  findById(id: string): Promise<ShareableLink | null>;
  findByToken(token: string): Promise<ShareableLink | null>;
  findByTokenWithDocuments(token: string): Promise<ShareableLinkWithDocuments | null>;
  findByCase(caseId: string): Promise<ShareableLink[]>;
  countByOrganization(organizationId: string): Promise<number>;
  create(input: CreateShareableLinkInput): Promise<ShareableLinkWithDocuments>;
  getDocuments(linkId: string): Promise<DocumentRequest[]>;
  expire(id: string): Promise<ShareableLink | null>;
  checkAndExpire(linkId: string): Promise<boolean>;
}
