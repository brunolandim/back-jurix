import type { Priority } from '../enum';
import type { LawyerPublic } from './lawyer';

export interface LegalCase {
  id: string;
  organizationId: string;
  columnId: string;
  number: string;
  title: string;
  description: string | null;
  client: string;
  clientPhone: string | null;
  priority: Priority;
  order: number;
  active: boolean;
  assignedTo: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LegalCaseWithAssignee extends LegalCase {
  assignee?: LawyerPublic | null;
}

export interface CreateLegalCaseInput {
  organizationId: string;
  columnId: string;
  number: string;
  title: string;
  description?: string;
  client: string;
  clientPhone?: string;
  priority?: Priority;
  order: number;
  assignedTo?: string;
  createdBy: string;
}

export interface UpdateLegalCaseInput {
  columnId?: string;
  number?: string;
  title?: string;
  description?: string;
  client?: string;
  clientPhone?: string;
  priority?: Priority;
  order?: number;
  active?: boolean;
  assignedTo?: string | null;
}

export interface MoveCaseInput {
  columnId: string;
  order: number;
}
