import { create } from 'zustand';
import type { Note, Context } from '@/src/models';
import { createNote } from '@/src/models';
import * as db from '@/src/services/database';
import { suggestReminderForPriority, suggestPriorityFromDueDate } from '@/src/services/nl-parser';

interface NoteState {
  notes: Note[];
  isLoading: boolean;

  loadNotes: (context: Context) => Promise<void>;
  addNote: (partial: Partial<Note> & { context: Context }) => Promise<Note>;
  updateNote: (note: Note) => Promise<void>;
  toggleDone: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  restoreNote: (id: string) => Promise<void>;
  getNoteById: (id: string) => Note | undefined;
  reorderNotes: (orderedIds: string[]) => Promise<void>;
}

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: [],
  isLoading: false,

  loadNotes: async (context) => {
    set({ isLoading: true });
    const notes = await db.getAllNotes(context);
    set({ notes, isLoading: false });
  },

  addNote: async (partial) => {
    const note = createNote(partial);
    await db.insertNote(note);
    set((s) => ({ notes: [note, ...s.notes] }));

    // Auto-set reminder for every note — timing based on priority
    try {
      const reminderDate = suggestReminderForPriority(note.priority);
      const d = db.getDb();
      const remId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      await d.runAsync(
        'INSERT INTO reminders (id, note_id, remind_at, status, ai_suggested, auto_set) VALUES (?, ?, ?, ?, ?, ?)',
        [remId, note.id, reminderDate.toISOString(), 'pending', 1, 1]
      );
    } catch { /* reminder table might not exist yet */ }

    return note;
  },

  updateNote: async (note) => {
    await db.updateNote(note);
    set((s) => ({
      notes: s.notes.map((n) => (n.id === note.id ? { ...note, updatedAt: new Date().toISOString() } : n)),
    }));
  },

  toggleDone: async (id) => {
    const note = get().notes.find((n) => n.id === id);
    if (!note) return;
    const updated = { ...note, isDone: !note.isDone, updatedAt: new Date().toISOString() };
    await db.updateNote(updated);
    set((s) => ({ notes: s.notes.map((n) => (n.id === id ? updated : n)) }));

    // Auto-recreate recurring task when marked done
    if (!note.isDone && note.recurrence) {
      const nextNote = createNote({
        title: note.title,
        body: note.body,
        context: note.context,
        type: note.type,
        priority: note.priority,
        folderId: note.folderId,
        color: note.color,
        recurrence: note.recurrence,
      });
      await db.insertNote(nextNote);
      set((s) => ({ notes: [nextNote, ...s.notes] }));
    }
  },

  togglePin: async (id) => {
    const note = get().notes.find((n) => n.id === id);
    if (!note) return;
    const updated = { ...note, isPinned: !note.isPinned, updatedAt: new Date().toISOString() };
    await db.updateNote(updated);
    set((s) => ({ notes: s.notes.map((n) => (n.id === id ? updated : n)) }));
  },

  deleteNote: async (id) => {
    await db.softDeleteNote(id);
    set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));
  },

  restoreNote: async (id) => {
    await db.restoreNote(id);
    // Reload will pick it up
  },

  getNoteById: (id) => get().notes.find((n) => n.id === id),

  reorderNotes: async (orderedIds) => {
    const updates = orderedIds.map((id, index) => ({ id, manualOrder: index }));
    await db.updateManualOrder(updates);
    set((s) => ({
      notes: s.notes.map((n) => {
        const idx = orderedIds.indexOf(n.id);
        return idx >= 0 ? { ...n, manualOrder: idx } : n;
      }),
    }));
  },
}));
