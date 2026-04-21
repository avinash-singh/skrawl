import { create } from 'zustand';
import type { ThemeMode } from '@/src/theme/colors';
import type { Context, NoteType } from '@/src/models';

export type SortBy = 'priority' | 'date';
export type SwipeAction = 'done' | 'pin' | 'delete' | 'archive';

interface UIState {
  theme: ThemeMode;
  context: Context;
  sortBy: SortBy;
  defaultMode: NoteType;
  swipeLeftAction: SwipeAction;
  swipeRightAction: SwipeAction;
  currentFolder: string | null; // null = All Notes
  showDone: boolean;

  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setContext: (ctx: Context) => void;
  setSortBy: (sort: SortBy) => void;
  setDefaultMode: (mode: NoteType) => void;
  setSwipeLeft: (action: SwipeAction) => void;
  setSwipeRight: (action: SwipeAction) => void;
  setCurrentFolder: (folder: string | null) => void;
  setShowDone: (show: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'dark',
  context: 'personal',
  sortBy: 'priority',
  defaultMode: 'task',
  swipeLeftAction: 'done',
  swipeRightAction: 'pin',
  currentFolder: null,
  showDone: false,

  setTheme: (theme) => set({ theme }),
  toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
  setContext: (context) => set({ context, currentFolder: null }),
  setSortBy: (sortBy) => set({ sortBy }),
  setDefaultMode: (defaultMode) => set({ defaultMode }),
  setSwipeLeft: (swipeLeftAction) => set({ swipeLeftAction }),
  setSwipeRight: (swipeRightAction) => set({ swipeRightAction }),
  setCurrentFolder: (currentFolder) => set({ currentFolder }),
  setShowDone: (showDone) => set({ showDone }),
}));
