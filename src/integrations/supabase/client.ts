import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseEnvConfig } from './config';

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getSupabaseEnvConfig();
  if (!isConfigured) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return cachedClient;
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseEnvConfig().isConfigured;
}
