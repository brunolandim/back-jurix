import type { LawyerRole } from '../enum';

export interface Lawyer {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  passwordHash: string;
  phone: string | null;
  photo: string | null;
  oab: string;
  specialty: string | null;
  role: LawyerRole;
  active: boolean;
  avatarColor: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LawyerPublic {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  phone: string | null;
  photo: string | null;
  oab: string;
  specialty: string | null;
  role: LawyerRole;
  active: boolean;
  avatarColor: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLawyerInput {
  organizationId: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  oab: string;
  specialty?: string;
  role?: LawyerRole;
}

export interface UpdateLawyerInput {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  photo?: string | null;
  specialty?: string;
  role?: LawyerRole;
  active?: boolean;
  avatarColor?: string | null;
}

export function toPublicLawyer(lawyer: Lawyer): LawyerPublic {
  const { passwordHash, ...publicData } = lawyer;
  return publicData;
}
