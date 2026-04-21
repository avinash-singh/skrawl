import type { NoteColor, PriorityLevel } from '@/src/theme/colors';

export type NoteType = 'note' | 'list' | 'task';
export type Context = 'personal' | 'business';

export interface ChecklistItem {
  id: string;
  text: string;
  isDone: boolean;
  sort: number;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  context: Context;
  folderId: string | null;
  color: NoteColor;
  type: NoteType;
  priority: PriorityLevel | null;
  manualOrder: number;
  recurrence: string | null;
  images: string[];
  isPinned: boolean;
  isDone: boolean;
  items: ChecklistItem[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  syncedAt: string | null;
  isDirty: boolean;
}

export function createNote(partial: Partial<Note> & { context: Context }): Note {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    title: '',
    body: '',
    folderId: null,
    color: 'default',
    type: 'task',
    priority: null,
    manualOrder: 0,
    recurrence: null,
    images: [],
    isPinned: false,
    isDone: false,
    items: [],
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    syncedAt: null,
    isDirty: true,
    ...partial,
  };
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
