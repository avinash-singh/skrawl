import type { Context } from './note';

export interface Folder {
  id: string;
  name: string;
  context: Context;
  parentId: string | null;
  icon: string;
  color: string | null;
  sort: number;
  createdAt: string;
  updatedAt: string;
  isDirty: boolean;
}
