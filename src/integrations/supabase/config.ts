export interface SupabaseEnvConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
}

export function getSupabaseEnvConfig(): SupabaseEnvConfig {
  const url = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
  const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

  const isValidUrl = url.startsWith('https://') || url.startsWith('http://');
  const isConfigured = Boolean(url && anonKey && isValidUrl);

  return {
    url,
    anonKey,
    isConfigured,
  };
}
