export interface Organization {
  id: string;
  name: string;
  document: string;
  email: string | null;
  phone: string | null;
  logo: string | null;
  stripeCustomerId: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrganizationInput {
  name: string;
  document: string;
  email?: string;
  phone?: string;
}

export interface UpdateOrganizationInput {
  name?: string;
  email?: string;
  phone?: string;
  logo?: string;
  active?: boolean;
}
