import { create } from 'zustand';

interface UndoAction {
  id: string;
  label: string;
  undo: () => Promise<void>;
  timestamp: number;
}

interface UndoState {
  current: UndoAction | null;
  push: (label: string, undoFn: () => Promise<void>) => void;
  dismiss: () => void;
  execute: () => Promise<void>;
}

export const useUndoStore = create<UndoState>((set, get) => ({
  current: null,

  push: (label, undoFn) => {
    const action: UndoAction = {
      id: Date.now().toString(),
      label,
      undo: undoFn,
      timestamp: Date.now(),
    };
    set({ current: action });
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      if (get().current?.id === action.id) {
        set({ current: null });
      }
    }, 5000);
  },

  dismiss: () => set({ current: null }),

  execute: async () => {
    const action = get().current;
    if (action) {
      await action.undo();
      set({ current: null });
    }
  },
}));
