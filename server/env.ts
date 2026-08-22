import 'dotenv/config';

export const GLM_PRIMARY_MODEL = 'z-ai/glm-5.2:free';

// Verified against OpenRouter's public model catalog on 2026-08-20. Keep this
// list explicit rather than routing arbitrary catalog models in production.
// The content-safety-only Nemotron entry is deliberately excluded from chat.
export const CURATED_FREE_OPENROUTER_FALLBACK_MODELS = [
  // OpenRouter's current free catalog still contains the long-context and
  // specialist models below. Keep lower-latency general/code models first:
  // production tries only five OpenRouter candidates before the bounded
  // emergency path, while `openrouter/free` remains immediately after GLM.
  'nvidia/nemotron-3.5-lightning:free',
  'poolside/laguna-s-2.1:free',
  'cohere/north-mini-code:free',
  'openai/gpt-oss-20b:free',
  'dots-studio/dots-3-note-preview:free',
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
  'nvidia/nemotron-3-nano-30b-a3b:free',
  'nvidia/nemotron-nano-12b-v2-vl:free',
  'nvidia/nemotron-nano-9b-v2:free',
  'poolside/laguna-xs-2.1:free',
  'liquid/lfm-2.5-2.6b:free',
  'openrouter/free',
] as const;

export const env = {
  apiPort: Number(process.env.API_PORT ?? 3001),
  appUrl: process.env.APP_URL ?? 'http://localhost:3000',
  supabaseUrl: process.env.SUPABASE_URL ?? '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  openRouterApiKey: process.env.OPENROUTER_API_KEY ?? '',
  // GLM 5.2 is intentionally first for every DevDesk conversation.
  openRouterModel: GLM_PRIMARY_MODEL,
  openRouterFallbackModels: [...CURATED_FREE_OPENROUTER_FALLBACK_MODELS] as string[],
  openRouterTimeoutMs: Number(process.env.OPENROUTER_TIMEOUT_MS ?? 8_000),
  // Optional independent general-chat fallback. This key must remain server-side
  // and is deliberately not used for imported repository source analysis.
  groqApiKey: process.env.GROQ_API_KEY ?? '',
  groqModel: process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
  groqTimeoutMs: Number(process.env.GROQ_TIMEOUT_MS ?? 8_000),
  // Optional xAI Grok fallback. xAI and Groq are different providers with
  // separate credentials and endpoints; this remains server-side only.
  xaiApiKey: process.env.XAI_API_KEY ?? '',
  xaiModel: process.env.XAI_MODEL ?? 'grok-4.6',
  xaiTimeoutMs: Number(process.env.XAI_TIMEOUT_MS ?? 10_000),
  // Optional Cerebras fallback for ordinary chat, separate from xAI and Groq.
  cerebrasApiKey: process.env.CEREBRAS_API_KEY ?? '',
  cerebrasModel: process.env.CEREBRAS_MODEL ?? 'gpt-oss-120b',
  cerebrasTimeoutMs: Number(process.env.CEREBRAS_TIMEOUT_MS ?? 10_000),
  maxInputCharacters: Number(process.env.MAX_INPUT_CHARACTERS ?? 12000),
  maxOutputTokens: Number(process.env.MAX_OUTPUT_TOKENS ?? 1400),
};

export function assertServerConfig() {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) throw new Error('Supabase server credentials are not configured.');
}
