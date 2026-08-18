import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

let client: SupabaseClient | undefined;

export function getSupabaseAdmin() {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) return undefined;
  client ??= createClient(env.supabaseUrl, env.supabaseServiceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  return client;
}
