import { create } from 'zustand';
import type { FocusSession, Context } from '@/src/models';
import * as db from '@/src/services/database';

interface FocusState {
  activeSession: FocusSession | null;
  sessions: FocusSession[];
  isRunning: boolean;
  remainingSeconds: number;

  startSession: (noteId: string, durationMin: number, context: Context) => Promise<void>;
  tick: () => void;
  completeSession: () => Promise<void>;
  cancelSession: () => void;
  loadSessions: () => Promise<void>;
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export const useFocusStore = create<FocusState>((set, get) => ({
  activeSession: null,
  sessions: [],
  isRunning: false,
  remainingSeconds: 0,

  startSession: async (noteId, durationMin, context) => {
    const session: FocusSession = {
      id: genId(),
      noteId,
      durationPlanned: durationMin * 60,
      durationActual: null,
      context,
      startedAt: new Date().toISOString(),
      completedAt: null,
    };
    const d = db.getDb();
    await d.runAsync(
      'INSERT INTO focus_sessions (id, note_id, duration_planned, context) VALUES (?, ?, ?, ?)',
      [session.id, session.noteId, session.durationPlanned, session.context]
    );
    set({
      activeSession: session,
      isRunning: true,
      remainingSeconds: durationMin * 60,
    });
  },

  tick: () => {
    const { remainingSeconds, isRunning } = get();
    if (!isRunning || remainingSeconds <= 0) return;
    set({ remainingSeconds: remainingSeconds - 1 });
    if (remainingSeconds - 1 <= 0) {
      get().completeSession();
    }
  },

  completeSession: async () => {
    const { activeSession } = get();
    if (!activeSession) return;
    const now = new Date().toISOString();
    const durationActual = Math.round(
      (new Date(now).getTime() - new Date(activeSession.startedAt).getTime()) / 1000
    );
    const d = db.getDb();
    await d.runAsync(
      'UPDATE focus_sessions SET duration_actual = ?, completed_at = ? WHERE id = ?',
      [durationActual, now, activeSession.id]
    );
    set({
      activeSession: null,
      isRunning: false,
      remainingSeconds: 0,
      sessions: [
        ...get().sessions,
        { ...activeSession, durationActual, completedAt: now },
      ],
    });
  },

  cancelSession: () => {
    set({ activeSession: null, isRunning: false, remainingSeconds: 0 });
  },

  loadSessions: async () => {
    try {
      const d = db.getDb();
      const rows = await d.getAllAsync<any>('SELECT * FROM focus_sessions ORDER BY started_at DESC LIMIT 50');
      set({
        sessions: rows.map((r: any) => ({
          id: r.id,
          noteId: r.note_id,
          durationPlanned: r.duration_planned,
          durationActual: r.duration_actual,
          context: r.context,
          startedAt: r.started_at,
          completedAt: r.completed_at,
        })),
      });
    } catch {
      // table might be empty
    }
  },
}));
