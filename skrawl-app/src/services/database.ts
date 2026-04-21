import * as SQLite from 'expo-sqlite';
import type { Note, ChecklistItem, Folder } from '@/src/models';

let db: SQLite.SQLiteDatabase;

export async function initDatabase(): Promise<void> {
  db = await SQLite.openDatabaseAsync('skrawl.db');

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS notes (
      id            TEXT PRIMARY KEY,
      title         TEXT NOT NULL DEFAULT '',
      body          TEXT NOT NULL DEFAULT '',
      context       TEXT NOT NULL CHECK (context IN ('personal','business')),
      folder_id     TEXT,
      color         TEXT DEFAULT 'default',
      type          TEXT NOT NULL CHECK (type IN ('note','list','task')) DEFAULT 'task',
      priority      INTEGER CHECK (priority BETWEEN 0 AND 3),
      manual_order  INTEGER DEFAULT 0,
      recurrence    TEXT,
      images        TEXT DEFAULT '[]',
      is_pinned     INTEGER DEFAULT 0,
      is_done       INTEGER DEFAULT 0,
      created_at    TEXT DEFAULT (datetime('now')),
      updated_at    TEXT DEFAULT (datetime('now')),
      deleted_at    TEXT,
      synced_at     TEXT,
      is_dirty      INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS checklist_items (
      id       TEXT PRIMARY KEY,
      note_id  TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
      text     TEXT NOT NULL,
      is_done  INTEGER DEFAULT 0,
      sort     INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS folders (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      context    TEXT NOT NULL,
      parent_id  TEXT,
      icon       TEXT DEFAULT 'folder',
      color      TEXT,
      sort       INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      is_dirty   INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id                TEXT PRIMARY KEY,
      note_id           TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
      remind_at         TEXT NOT NULL,
      calendar_event_id TEXT,
      status            TEXT DEFAULT 'pending',
      ai_suggested      INTEGER DEFAULT 0,
      auto_set          INTEGER DEFAULT 0,
      created_at        TEXT DEFAULT (datetime('now')),
      is_dirty          INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS goals (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      context    TEXT NOT NULL,
      target     REAL NOT NULL,
      current    REAL DEFAULT 0,
      unit       TEXT,
      color      TEXT,
      period     TEXT,
      frequency  TEXT,
      icon       TEXT,
      category   TEXT,
      reminder   TEXT,
      streak     INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      is_dirty   INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS meal_entries (
      id                TEXT PRIMARY KEY,
      goal_id           TEXT,
      description       TEXT NOT NULL,
      image_url         TEXT,
      calories_detected REAL,
      calories_override REAL,
      meal_type         TEXT,
      ai_confidence     REAL,
      source            TEXT,
      created_at        TEXT DEFAULT (datetime('now')),
      is_dirty          INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS exercise_entries (
      id              TEXT PRIMARY KEY,
      goal_id         TEXT,
      type            TEXT NOT NULL,
      duration_min    INTEGER,
      calories_burned REAL,
      source          TEXT,
      created_at      TEXT DEFAULT (datetime('now')),
      is_dirty        INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS focus_sessions (
      id               TEXT PRIMARY KEY,
      note_id          TEXT,
      duration_planned INTEGER NOT NULL,
      duration_actual  INTEGER,
      context          TEXT,
      started_at       TEXT DEFAULT (datetime('now')),
      completed_at     TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_notes_ctx ON notes(context, deleted_at);
    CREATE INDEX IF NOT EXISTS idx_notes_folder ON notes(folder_id);
    CREATE INDEX IF NOT EXISTS idx_notes_priority ON notes(priority);
    CREATE INDEX IF NOT EXISTS idx_checklist_note ON checklist_items(note_id);
  `);

  // Create FTS5 table (separate try — might already exist)
  try {
    await db.execAsync(`
      CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(title, body, content=notes, content_rowid=rowid);
    `);
  } catch {
    // FTS table may already exist
  }
}

export function getDb(): SQLite.SQLiteDatabase {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
}

// ===== Notes =====

export async function getAllNotes(context: string): Promise<Note[]> {
  const rows = await getDb().getAllAsync<any>(
    'SELECT * FROM notes WHERE context = ? AND deleted_at IS NULL ORDER BY is_pinned DESC, manual_order ASC, updated_at DESC',
    [context]
  );
  const notes: Note[] = [];
  for (const row of rows) {
    const items = await getDb().getAllAsync<any>(
      'SELECT * FROM checklist_items WHERE note_id = ? ORDER BY sort',
      [row.id]
    );
    notes.push(rowToNote(row, items));
  }
  return notes;
}

export async function insertNote(note: Note): Promise<void> {
  await getDb().runAsync(
    `INSERT INTO notes (id, title, body, context, folder_id, color, type, priority, manual_order, recurrence, images, is_pinned, is_done, created_at, updated_at, is_dirty)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [note.id, note.title, note.body, note.context, note.folderId, note.color, note.type, note.priority, note.manualOrder, note.recurrence, JSON.stringify(note.images), note.isPinned ? 1 : 0, note.isDone ? 1 : 0, note.createdAt, note.updatedAt]
  );
  for (const item of note.items) {
    await getDb().runAsync(
      'INSERT INTO checklist_items (id, note_id, text, is_done, sort) VALUES (?, ?, ?, ?, ?)',
      [item.id, note.id, item.text, item.isDone ? 1 : 0, item.sort]
    );
  }
}

export async function updateNote(note: Note): Promise<void> {
  const now = new Date().toISOString();
  await getDb().runAsync(
    `UPDATE notes SET title=?, body=?, folder_id=?, color=?, type=?, priority=?, manual_order=?, recurrence=?, images=?, is_pinned=?, is_done=?, updated_at=?, is_dirty=1
     WHERE id=?`,
    [note.title, note.body, note.folderId, note.color, note.type, note.priority, note.manualOrder, note.recurrence, JSON.stringify(note.images), note.isPinned ? 1 : 0, note.isDone ? 1 : 0, now, note.id]
  );
  // Replace checklist items
  await getDb().runAsync('DELETE FROM checklist_items WHERE note_id = ?', [note.id]);
  for (const item of note.items) {
    await getDb().runAsync(
      'INSERT INTO checklist_items (id, note_id, text, is_done, sort) VALUES (?, ?, ?, ?, ?)',
      [item.id, note.id, item.text, item.isDone ? 1 : 0, item.sort]
    );
  }
}

export async function softDeleteNote(id: string): Promise<void> {
  const now = new Date().toISOString();
  await getDb().runAsync('UPDATE notes SET deleted_at=?, is_dirty=1 WHERE id=?', [now, id]);
}

export async function restoreNote(id: string): Promise<void> {
  await getDb().runAsync('UPDATE notes SET deleted_at=NULL, is_dirty=1 WHERE id=?', [id]);
}

// ===== Folders =====

export async function getAllFolders(context: string): Promise<Folder[]> {
  const rows = await getDb().getAllAsync<any>(
    'SELECT * FROM folders WHERE context = ? ORDER BY sort',
    [context]
  );
  return rows.map(rowToFolder);
}

export async function insertFolder(folder: Folder): Promise<void> {
  await getDb().runAsync(
    'INSERT INTO folders (id, name, context, parent_id, icon, color, sort) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [folder.id, folder.name, folder.context, folder.parentId, folder.icon, folder.color, folder.sort]
  );
}

// ===== Search =====

export async function searchNotes(query: string, context?: string): Promise<Note[]> {
  const q = query.trim();
  if (!q) return [];
  // Simple LIKE search (FTS5 as future optimization)
  const rows = await getDb().getAllAsync<any>(
    `SELECT * FROM notes WHERE deleted_at IS NULL AND (title LIKE ? OR body LIKE ?)${context ? ' AND context = ?' : ''} ORDER BY updated_at DESC LIMIT 50`,
    context ? [`%${q}%`, `%${q}%`, context] : [`%${q}%`, `%${q}%`]
  );
  const notes: Note[] = [];
  for (const row of rows) {
    const items = await getDb().getAllAsync<any>(
      'SELECT * FROM checklist_items WHERE note_id = ? ORDER BY sort',
      [row.id]
    );
    notes.push(rowToNote(row, items));
  }
  return notes;
}

// ===== Helpers =====

function rowToNote(row: any, itemRows: any[]): Note {
  return {
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
    items: itemRows.map((i: any) => ({
      id: i.id,
      text: i.text,
      isDone: !!i.is_done,
      sort: i.sort,
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    syncedAt: row.synced_at,
    isDirty: !!row.is_dirty,
  };
}

function rowToFolder(row: any): Folder {
  return {
    id: row.id,
    name: row.name,
    context: row.context,
    parentId: row.parent_id,
    icon: row.icon,
    color: row.color,
    sort: row.sort,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isDirty: !!row.is_dirty,
  };
}
