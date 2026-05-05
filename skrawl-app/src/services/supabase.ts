/**
 * Supabase client — cloud sync and auth for Skrawl.
 * Auth sessions are persisted via AsyncStorage.
 */
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const SUPABASE_URL = 'https://ntfysfuhhsejtlopbvqt.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_GlU4xLzcLVnIXIX8d2i8Ig_R8bCZSg4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export function isSupabaseConfigured(): boolean {
  return true;
}

export function getSupabase() {
  return supabase;
}
