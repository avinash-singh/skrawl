import { create } from 'zustand';
import type { Note, Context } from '@/src/models';
import { createNote } from '@/src/models';
import * as db from '@/src/services/database';

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
}));
