import 'dotenv/config';

export const env = {
  apiPort: Number(process.env.API_PORT ?? 3001),
  supabaseUrl: process.env.SUPABASE_URL ?? '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  openRouterApiKey: process.env.OPENROUTER_API_KEY ?? '',
  openRouterModel: process.env.OPENROUTER_MODEL ?? 'openai/gpt-4o-mini',
  maxInputCharacters: Number(process.env.MAX_INPUT_CHARACTERS ?? 12000),
  maxOutputTokens: Number(process.env.MAX_OUTPUT_TOKENS ?? 1400),
};

export function assertServerConfig() {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) throw new Error('Supabase server credentials are not configured.');
}
