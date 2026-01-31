import type {
  Column,
  CreateColumnInput,
  UpdateColumnInput,
} from '../../types';

export interface IColumnRepository {
  findById(id: string): Promise<Column | null>;
  findByOrganization(organizationId: string): Promise<Column[]>;
  create(input: CreateColumnInput): Promise<Column>;
  createMany(inputs: CreateColumnInput[]): Promise<Column[]>;
  update(id: string, input: UpdateColumnInput): Promise<Column | null>;
  delete(id: string): Promise<boolean>;
  getMaxOrder(organizationId: string): Promise<number>;
  hasCases(columnId: string): Promise<boolean>;
}
