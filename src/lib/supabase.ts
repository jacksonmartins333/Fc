import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'grota_supabase_url';
const STORAGE_KEY_ANON = 'grota_supabase_anon_key';

let cachedClient: SupabaseClient | null = null;
let cachedUrl = '';
let cachedKey = '';

export function getSupabaseConfig(): { url: string; anonKey: string; isConfigured: boolean } {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  const storedUrl = localStorage.getItem(STORAGE_KEY_URL) || envUrl;
  const storedKey = localStorage.getItem(STORAGE_KEY_ANON) || envKey;

  return {
    url: storedUrl.trim(),
    anonKey: storedKey.trim(),
    isConfigured: Boolean(storedUrl.trim() && storedKey.trim())
  };
}

export function saveSupabaseConfig(url: string, anonKey: string) {
  if (url.trim() && anonKey.trim()) {
    localStorage.setItem(STORAGE_KEY_URL, url.trim());
    localStorage.setItem(STORAGE_KEY_ANON, anonKey.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_ANON);
  }
  cachedClient = null;
  cachedUrl = '';
  cachedKey = '';
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;

  if (cachedClient && cachedUrl === url && cachedKey === anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey);
    cachedUrl = url;
    cachedKey = anonKey;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

// SQL query template to create the database table on Supabase in 1 click
export const SUPABASE_SETUP_SQL = `
-- Crie a tabela da Pelada Grota F.C no Editor SQL do seu Supabase:
create table if not exists grota_pelada_data (
  id text primary key,
  data jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar Row Level Security e permitir leitura/escrita pública anônima para a pelada
alter table grota_pelada_data enable row level security;

create policy "Permitir leitura pública" on grota_pelada_data
  for select using (true);

create policy "Permitir escrita pública" on grota_pelada_data
  for insert with check (true);

create policy "Permitir atualização pública" on grota_pelada_data
  for update using (true);
`;

export async function saveToSupabase(payload: any): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase não configurado' };
  }

  try {
    const { error } = await client
      .from('grota_pelada_data')
      .upsert({
        id: 'main_pelada_state',
        data: payload,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Supabase write error:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('Supabase exception:', err);
    return { success: false, error: err?.message || 'Erro de conexão com Supabase' };
  }
}

export async function loadFromSupabase(): Promise<{ success: boolean; data?: any; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Supabase não configurado' };
  }

  try {
    const { data, error } = await client
      .from('grota_pelada_data')
      .select('data')
      .eq('id', 'main_pelada_state')
      .maybeSingle();

    if (error) {
      console.error('Supabase read error:', error);
      return { success: false, error: error.message };
    }

    if (data && data.data) {
      return { success: true, data: data.data };
    }

    return { success: true, data: null };
  } catch (err: any) {
    console.error('Supabase read exception:', err);
    return { success: false, error: err?.message || 'Erro ao carregar do Supabase' };
  }
}
