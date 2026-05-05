import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemeMode } from '@/src/theme/colors';
import type { Context, NoteType } from '@/src/models';

export type SortBy = 'priority' | 'date';
export type SwipeAction = 'done' | 'pin' | 'delete' | 'archive' | 'priority';
export type ReminderIntensity = 'gentle' | 'balanced' | 'aggressive';

interface UIState {
  theme: ThemeMode;
  context: Context;
  sortBy: SortBy;
  defaultMode: NoteType;
  swipeLeftAction: SwipeAction;
  swipeRightAction: SwipeAction;
  currentFolder: string | null;
  showDone: boolean;
  reminderIntensity: ReminderIntensity;
  vibeValue: number;

  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setContext: (ctx: Context) => void;
  setSortBy: (sort: SortBy) => void;
  setDefaultMode: (mode: NoteType) => void;
  setSwipeLeft: (action: SwipeAction) => void;
  setSwipeRight: (action: SwipeAction) => void;
  setCurrentFolder: (folder: string | null) => void;
  setShowDone: (show: boolean) => void;
  setReminderIntensity: (intensity: ReminderIntensity) => void;
  setVibeValue: (value: number) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'dark',
      context: 'personal',
      sortBy: 'priority',
      defaultMode: 'task',
      swipeLeftAction: 'done',
      swipeRightAction: 'priority',
      currentFolder: null,
      showDone: false,
      reminderIntensity: 'balanced',
      vibeValue: 50,

      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setContext: (context) => set({ context, currentFolder: null }),
      setSortBy: (sortBy) => set({ sortBy }),
      setDefaultMode: (defaultMode) => set({ defaultMode }),
      setSwipeLeft: (swipeLeftAction) => set({ swipeLeftAction }),
      setSwipeRight: (swipeRightAction) => set({ swipeRightAction }),
      setCurrentFolder: (currentFolder) => set({ currentFolder }),
      setShowDone: (showDone) => set({ showDone }),
      setReminderIntensity: (reminderIntensity) => set({ reminderIntensity }),
      setVibeValue: (vibeValue) => set({ vibeValue }),
    }),
    {
      name: 'skrawl-ui-settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        theme: state.theme,
        sortBy: state.sortBy,
        defaultMode: state.defaultMode,
        swipeLeftAction: state.swipeLeftAction,
        swipeRightAction: state.swipeRightAction,
        reminderIntensity: state.reminderIntensity,
        vibeValue: state.vibeValue,
        showDone: state.showDone,
      }),
    }
  )
);
