export interface Column {
  id: string;
  organizationId: string;
  title: string;
  key: string | null;
  isDefault: boolean;
  order: number;
  createdAt: Date;
}

export interface CreateColumnInput {
  organizationId: string;
  title: string;
  key?: string;
  isDefault?: boolean;
  order: number;
}

export interface UpdateColumnInput {
  title?: string;
  key?: string;
  order?: number;
}
