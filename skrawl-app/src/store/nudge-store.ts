import { create } from 'zustand';
import { getQuote, getCelebration, getCreateNudge, getAllClearNudge } from '@/src/services/nudges';

interface NudgeState {
  message: string | null;
  show: (msg: string) => void;
  dismiss: () => void;
  onNoteCreated: (vibeValue: number) => void;
  onNoteCompleted: (vibeValue: number) => void;
  onNoteSaved: (vibeValue: number) => void;
  onAllP0sClear: (vibeValue: number) => void;
  onNoteDeleted: (vibeValue: number) => void;
}

let _timer: ReturnType<typeof setTimeout> | null = null;

export const useNudgeStore = create<NudgeState>((set) => ({
  message: null,

  show: (msg) => {
    if (_timer) clearTimeout(_timer);
    set({ message: msg });
    _timer = setTimeout(() => set({ message: null }), 2800);
  },

  dismiss: () => {
    if (_timer) clearTimeout(_timer);
    set({ message: null });
  },

  onNoteCreated: (vibeValue) => {
    const msg = getCreateNudge(vibeValue);
    if (_timer) clearTimeout(_timer);
    set({ message: msg });
    _timer = setTimeout(() => set({ message: null }), 2800);
  },

  onNoteCompleted: (vibeValue) => {
    const msg = getCelebration(vibeValue);
    if (_timer) clearTimeout(_timer);
    set({ message: msg });
    _timer = setTimeout(() => set({ message: null }), 2800);
  },

  onNoteSaved: (vibeValue) => {
    const msgs = vibeValue > 50
      ? ['Saved. Progress locked in.', 'Updated. Moving forward.', 'Changes captured.', 'Noted and saved.']
      : ['Saved! Your notes thank you.', 'Updated. Memory offloaded.', 'Locked in. Brain freed.', 'Changes? What changes? Already saved.'];
    const msg = msgs[Math.floor(Math.random() * msgs.length)];
    if (_timer) clearTimeout(_timer);
    set({ message: msg });
    _timer = setTimeout(() => set({ message: null }), 2200);
  },

  onAllP0sClear: (vibeValue) => {
    const msg = getAllClearNudge(vibeValue);
    if (_timer) clearTimeout(_timer);
    // Slight delay so it doesn't overlap with the completion nudge
    setTimeout(() => {
      set({ message: msg });
      _timer = setTimeout(() => set({ message: null }), 3000);
    }, 3000);
  },

  onNoteDeleted: (vibeValue) => {
    const msgs = vibeValue > 50
      ? ['Gone. Focus preserved.', 'Cleared. Less noise, more signal.']
      : ['Poof! Like it never existed.', 'Deleted. It had a good run.'];
    const msg = msgs[Math.floor(Math.random() * msgs.length)];
    if (_timer) clearTimeout(_timer);
    set({ message: msg });
    _timer = setTimeout(() => set({ message: null }), 2500);
  },
}));
