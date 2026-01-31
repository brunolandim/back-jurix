import type { LawyerRole } from '../enum';

export interface AuthContext {
  lawyerId: string;
  organizationId: string;
  role: LawyerRole;
}
