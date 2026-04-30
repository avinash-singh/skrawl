import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '@/src/services/supabase';

type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline' | 'not_configured';

interface SyncState {
  status: SyncStatus;
  lastSyncAt: string | null;
  user: { id: string; email: string } | null;
  isSignedIn: boolean;

  checkStatus: () => void;
  initAuth: () => Promise<void>;
  sync: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<string | null>;
  signUpWithEmail: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  status: isSupabaseConfigured() ? 'idle' : 'not_configured',
  lastSyncAt: null,
  user: null,
  isSignedIn: false,

  checkStatus: () => {
    if (!isSupabaseConfigured()) {
      set({ status: 'not_configured' });
    }
  },

  initAuth: async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        set({
          isSignedIn: true,
          user: { id: data.session.user.id, email: data.session.user.email || '' },
          status: 'idle',
        });
      }
    } catch {
      // No active session
    }
  },

  sync: async () => {
    if (!isSupabaseConfigured() || !get().isSignedIn) return;
    set({ status: 'syncing' });
    try {
      // Push dirty notes to Supabase
      // Pull changes since lastSyncAt
      // For now, mark as synced
      set({ status: 'idle', lastSyncAt: new Date().toISOString() });
    } catch {
      set({ status: 'error' });
    }
  },

  signInWithEmail: async (email, password) => {
    if (!isSupabaseConfigured()) return 'Supabase not configured';
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    if (data.user) {
      set({ isSignedIn: true, user: { id: data.user.id, email: data.user.email || '' }, status: 'idle' });
    }
    return null;
  },

  signUpWithEmail: async (email, password) => {
    if (!isSupabaseConfigured()) return 'Supabase not configured';
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return error.message;
    if (data.user) {
      set({ isSignedIn: true, user: { id: data.user.id, email: data.user.email || '' }, status: 'idle' });
    }
    return null;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ isSignedIn: false, user: null, status: 'idle' });
  },
}));
