import { create } from 'zustand';
import { getQuote, getCelebration, getCreateNudge, getAllClearNudge } from '@/src/services/nudges';
import { isConfigured, generateNudge } from '@/src/services/ai-service';

interface NudgeState {
  message: string | null;
  show: (msg: string) => void;
  dismiss: () => void;
  onNoteCreated: (vibeValue: number, noteTitle?: string) => void;
  onNoteCompleted: (vibeValue: number, noteTitle?: string) => void;
  onNoteSaved: (vibeValue: number, noteTitle?: string) => void;
  onAllP0sClear: (vibeValue: number) => void;
  onNoteDeleted: (vibeValue: number, noteTitle?: string) => void;
}

let _timer: ReturnType<typeof setTimeout> | null = null;

function showMsg(set: any, msg: string, duration: number = 2800) {
  if (_timer) clearTimeout(_timer);
  set({ message: msg });
  _timer = setTimeout(() => set({ message: null }), duration);
}

async function aiOrFallback(action: string, noteTitle: string, vibeValue: number, fallback: string): Promise<string> {
  if (!isConfigured()) return fallback;
  const ai = await generateNudge(action as any, noteTitle, vibeValue);
  return ai || fallback;
}

export const useNudgeStore = create<NudgeState>((set) => ({
  message: null,

  show: (msg) => showMsg(set, msg),

  dismiss: () => {
    if (_timer) clearTimeout(_timer);
    set({ message: null });
  },

  onNoteCreated: async (vibeValue, noteTitle) => {
    const fallback = getCreateNudge(vibeValue);
    showMsg(set, fallback); // Show local immediately
    const ai = await aiOrFallback('create', noteTitle || '', vibeValue, fallback);
    if (ai !== fallback) showMsg(set, ai); // Replace with AI if different
  },

  onNoteCompleted: async (vibeValue, noteTitle) => {
    const fallback = getCelebration(vibeValue);
    showMsg(set, fallback);
    const ai = await aiOrFallback('complete', noteTitle || '', vibeValue, fallback);
    if (ai !== fallback) showMsg(set, ai);
  },

  onNoteSaved: async (vibeValue, noteTitle) => {
    const fallback = vibeValue > 50
      ? ['Saved. Progress locked in.', 'Updated. Moving forward.', 'Changes captured.'][Math.floor(Math.random() * 3)]
      : ['Saved! Your notes thank you.', 'Updated. Memory offloaded.', 'Locked in. Brain freed.'][Math.floor(Math.random() * 3)];
    showMsg(set, fallback, 2200);
    const ai = await aiOrFallback('save', noteTitle || '', vibeValue, fallback);
    if (ai !== fallback) showMsg(set, ai, 2200);
  },

  onAllP0sClear: async (vibeValue) => {
    const fallback = getAllClearNudge(vibeValue);
    setTimeout(async () => {
      showMsg(set, fallback, 3000);
      const ai = await aiOrFallback('all_clear', '', vibeValue, fallback);
      if (ai !== fallback) showMsg(set, ai, 3000);
    }, 3000);
  },

  onNoteDeleted: async (vibeValue, noteTitle) => {
    const fallback = vibeValue > 50
      ? 'Gone. Focus preserved.'
      : 'Poof! Like it never existed.';
    showMsg(set, fallback, 2500);
    const ai = await aiOrFallback('delete', noteTitle || '', vibeValue, fallback);
    if (ai !== fallback) showMsg(set, ai, 2500);
  },
}));
