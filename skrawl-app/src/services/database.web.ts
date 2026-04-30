/**
 * Web fallback for database — uses in-memory arrays.
 * SQLite is native-only; this lets the app render on web for previewing.
 */
import type { Note, Folder } from '@/src/models';

let notes: any[] = [];
let folders: any[] = [];
let checklistItems: any[] = [];

export async function initDatabase(): Promise<void> {
  // No-op on web
}

export function getDb(): any {
  return {
    getAllAsync: async (sql: string, params?: any[]) => {
      if (sql.includes('FROM notes')) {
        const ctx = params?.[0];
        return notes.filter((n: any) => n.context === ctx && !n.deleted_at);
      }
      if (sql.includes('FROM checklist_items')) {
        const noteId = params?.[0];
        return checklistItems.filter((i: any) => i.note_id === noteId).sort((a: any, b: any) => a.sort - b.sort);
      }
      if (sql.includes('FROM folders')) {
        const ctx = params?.[0];
        return folders.filter((f: any) => f.context === ctx).sort((a: any, b: any) => a.sort - b.sort);
      }
      return [];
    },
    getFirstAsync: async (sql: string) => {
      if (sql.includes('COUNT')) return { c: notes.length };
      return null;
    },
    runAsync: async (sql: string, params?: any[]) => {
      if (sql.startsWith('INSERT INTO notes')) {
        const [id, title, body, context, folder_id, color, type, priority, is_pinned] = params || [];
        notes.push({ id, title, body, context, folder_id, color, type, priority, manual_order: 0, recurrence: null, images: '[]', is_pinned: is_pinned || 0, is_done: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), deleted_at: null, synced_at: null, is_dirty: 1 });
      }
      if (sql.startsWith('INSERT INTO folders')) {
        const [id, name, context, icon, color, sort] = params || [];
        folders.push({ id, name, context, parent_id: null, icon, color, sort, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), is_dirty: 1 });
      }
      if (sql.startsWith('INSERT INTO checklist_items')) {
        const [id, note_id, text, is_done, sort] = params || [];
        checklistItems.push({ id, note_id, text, is_done, sort });
      }
      if (sql.includes('UPDATE notes SET deleted_at')) {
        const id = params?.[1];
        const n = notes.find((x: any) => x.id === id);
        if (n) n.deleted_at = new Date().toISOString();
      }
      if (sql.includes('UPDATE notes SET') && !sql.includes('deleted_at')) {
        // General update — find by last param (id)
        const id = params?.[params.length - 1];
        const n = notes.find((x: any) => x.id === id);
        if (n && params) {
          n.title = params[0];
          n.body = params[1];
          n.updated_at = new Date().toISOString();
        }
      }
      if (sql.includes('DELETE FROM checklist_items')) {
        const noteId = params?.[0];
        checklistItems = checklistItems.filter((i: any) => i.note_id !== noteId);
      }
    },
    execAsync: async () => {},
  };
}

export async function getAllNotes(context: string): Promise<Note[]> {
  const ctx = notes.filter((n: any) => n.context === context && !n.deleted_at);
  const result: Note[] = [];
  for (const row of ctx) {
    const items = checklistItems.filter((i: any) => i.note_id === row.id).sort((a: any, b: any) => a.sort - b.sort);
    result.push({
      id: row.id,
      title: row.title,
      body: row.body,
      context: row.context,
      folderId: row.folder_id,
      color: row.color || 'default',
      type: row.type,
      priority: row.priority,
      manualOrder: row.manual_order || 0,
      recurrence: row.recurrence,
      images: JSON.parse(row.images || '[]'),
      isPinned: !!row.is_pinned,
      isDone: !!row.is_done,
      items: items.map((i: any) => ({ id: i.id, text: i.text, isDone: !!i.is_done, sort: i.sort })),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
      syncedAt: row.synced_at,
      isDirty: !!row.is_dirty,
    });
  }
  return result.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
}

export async function insertNote(note: Note): Promise<void> {
  notes.push({
    id: note.id, title: note.title, body: note.body, context: note.context,
    folder_id: note.folderId, color: note.color, type: note.type, priority: note.priority,
    manual_order: note.manualOrder, recurrence: note.recurrence, images: JSON.stringify(note.images),
    is_pinned: note.isPinned ? 1 : 0, is_done: note.isDone ? 1 : 0,
    created_at: note.createdAt, updated_at: note.updatedAt, deleted_at: null, synced_at: null, is_dirty: 1,
  });
  for (const item of note.items) {
    checklistItems.push({ id: item.id, note_id: note.id, text: item.text, is_done: item.isDone ? 1 : 0, sort: item.sort });
  }
}

export async function updateNote(note: Note): Promise<void> {
  const idx = notes.findIndex((n: any) => n.id === note.id);
  if (idx >= 0) {
    notes[idx] = {
      ...notes[idx],
      title: note.title, body: note.body, folder_id: note.folderId, color: note.color,
      type: note.type, priority: note.priority, manual_order: note.manualOrder,
      recurrence: note.recurrence, images: JSON.stringify(note.images),
      is_pinned: note.isPinned ? 1 : 0, is_done: note.isDone ? 1 : 0,
      updated_at: new Date().toISOString(), is_dirty: 1,
    };
  }
  checklistItems = checklistItems.filter((i: any) => i.note_id !== note.id);
  for (const item of note.items) {
    checklistItems.push({ id: item.id, note_id: note.id, text: item.text, is_done: item.isDone ? 1 : 0, sort: item.sort });
  }
}

export async function softDeleteNote(id: string): Promise<void> {
  const n = notes.find((x: any) => x.id === id);
  if (n) n.deleted_at = new Date().toISOString();
}

export async function restoreNote(id: string): Promise<void> {
  const n = notes.find((x: any) => x.id === id);
  if (n) n.deleted_at = null;
}

export async function getAllFolders(context: string): Promise<Folder[]> {
  return folders
    .filter((f: any) => f.context === context)
    .sort((a: any, b: any) => a.sort - b.sort)
    .map((f: any) => ({
      id: f.id, name: f.name, context: f.context, parentId: f.parent_id,
      icon: f.icon, color: f.color, sort: f.sort,
      createdAt: f.created_at, updatedAt: f.updated_at, isDirty: !!f.is_dirty,
    }));
}

export async function insertFolder(folder: Folder): Promise<void> {
  folders.push({
    id: folder.id, name: folder.name, context: folder.context, parent_id: folder.parentId,
    icon: folder.icon, color: folder.color, sort: folder.sort,
    created_at: folder.createdAt, updated_at: folder.updatedAt, is_dirty: 1,
  });
}

export async function updateFolder(folder: Folder): Promise<void> {
  const idx = folders.findIndex((f: any) => f.id === folder.id);
  if (idx >= 0) {
    folders[idx] = { ...folders[idx], name: folder.name, color: folder.color, icon: folder.icon, parent_id: folder.parentId, sort: folder.sort, updated_at: new Date().toISOString() };
  }
}

export async function deleteFolder(id: string): Promise<void> {
  notes.forEach((n: any) => { if (n.folder_id === id) n.folder_id = null; });
  folders = folders.filter((f: any) => f.id !== id);
}

export async function updateManualOrder(updates: { id: string; manualOrder: number }[]): Promise<void> {
  for (const { id, manualOrder } of updates) {
    const n = notes.find((x: any) => x.id === id);
    if (n) n.manual_order = manualOrder;
  }
}

export async function searchNotes(query: string, context?: string): Promise<Note[]> {
  return getAllNotes(context || 'personal');
}
