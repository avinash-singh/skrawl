import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '@/src/services/supabase';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

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
  signInWithGoogle: () => Promise<string | null>;
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

  signInWithGoogle: async () => {
    if (!isSupabaseConfigured()) return 'Supabase not configured';
    try {
      const redirectTo = 'skrawlapp://auth/callback';
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });
      if (error) return error.message;
      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type === 'success' && result.url) {
          // Extract tokens from the URL fragment (#access_token=...&refresh_token=...)
          const fragment = result.url.split('#')[1] || '';
          const params = new URLSearchParams(fragment);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          if (accessToken) {
            const { data: sessionData } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });
            if (sessionData.user) {
              set({ isSignedIn: true, user: { id: sessionData.user.id, email: sessionData.user.email || '' }, status: 'idle' });
              return null;
            }
          }
        }
      }
      return 'Google sign-in was cancelled';
    } catch (e: any) {
      return e.message || 'Google sign-in failed';
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ isSignedIn: false, user: null, status: 'idle' });
  },
}));
