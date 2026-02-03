export interface Column {
  id: string;
  organizationId: string;
  title: string;
  isDefault: boolean;
  order: number;
  createdAt: Date;
}

export interface CreateColumnInput {
  organizationId: string;
  title: string;
  isDefault?: boolean;
  order: number;
}

export interface UpdateColumnInput {
  title?: string;
  order?: number;
}
