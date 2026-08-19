import 'dotenv/config';

export const env = {
  apiPort: Number(process.env.API_PORT ?? 3001),
  appUrl: process.env.APP_URL ?? 'http://localhost:3000',
  supabaseUrl: process.env.SUPABASE_URL ?? '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  openRouterApiKey: process.env.OPENROUTER_API_KEY ?? '',
  openRouterModel: process.env.OPENROUTER_MODEL ?? 'openai/gpt-4o-mini',
  openRouterFallbackModels: (process.env.OPENROUTER_FALLBACK_MODELS ?? 'z-ai/glm-4.5-air:free,google/gemma-4-31b-it:free,openrouter/free').split(',').map((model) => model.trim()).filter(Boolean),
  openRouterTimeoutMs: Number(process.env.OPENROUTER_TIMEOUT_MS ?? 14_000),
  maxInputCharacters: Number(process.env.MAX_INPUT_CHARACTERS ?? 12000),
  maxOutputTokens: Number(process.env.MAX_OUTPUT_TOKENS ?? 1400),
};

export function assertServerConfig() {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) throw new Error('Supabase server credentials are not configured.');
}
