import type { Context } from './note';

export interface FocusSession {
  id: string;
  noteId: string;
  durationPlanned: number; // seconds
  durationActual: number | null;
  context: Context;
  startedAt: string;
  completedAt: string | null;
}
