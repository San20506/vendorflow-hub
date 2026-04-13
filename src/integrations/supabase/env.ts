function readEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function getSupabaseUrl(): string {
  const url = readEnv(import.meta.env.VITE_SUPABASE_URL);

  if (!url) {
    throw new Error('Missing VITE_SUPABASE_URL');
  }

  return url;
}

export function getSupabaseAnonKey(): string {
  const key = readEnv(
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY
  );

  if (!key) {
    throw new Error('Missing Supabase anon key');
  }

  return key;
}
