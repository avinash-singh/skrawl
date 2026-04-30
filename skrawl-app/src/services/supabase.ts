/**
 * Supabase client — cloud sync and auth for Skrawl.
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ntfysfuhhsejtlopbvqt.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_GlU4xLzcLVnIXIX8d2i8Ig_R8bCZSg4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function isSupabaseConfigured(): boolean {
  return true;
}

export function getSupabase() {
  return supabase;
}
