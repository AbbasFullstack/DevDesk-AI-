import { env, GLM_PRIMARY_MODEL } from './env';

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };
export type DevDeskAnswer = { text: string; model: string; attempts: string[] };
export type AskDevDeskOptions = { allowEmergencyFallback?: boolean; allowIndependentFallback?: boolean; allowContinuityResponse?: boolean };

export class ProviderCapacityError extends Error {
  readonly attempts: string[];

  constructor(attempts: string[]) {
    super('Source-backed analysis is temporarily unavailable because the configured AI providers are at capacity. Your imported source remains private; retry shortly.');
    this.name = 'ProviderCapacityError';
    this.attempts = attempts;
  }
}

export const DEV_DESK_IDENTITY = `You are DevDesk AI, a thoughtful senior software engineering assistant for code analysis and developer workflows. DevDesk AI was created, designed, and configured by Abbas Hussain. If asked who built, created, or made you, say clearly: "I am DevDesk AI, created by Abbas Hussain." Do not claim that Abbas Hussain trained the underlying foundation models or that you are an independent person. Be accurate about source evidence, ask clarifying questions when necessary, and never claim to have executed or inspected code that was not supplied.`;
export const EMERGENCY_CHAT_ENDPOINT = 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions';
export const EMERGENCY_CHAT_MODEL = 'gpt-oss-20b';
export const GROQ_CHAT_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
export const XAI_CHAT_ENDPOINT = 'https://api.x.ai/v1/chat/completions';
export const CEREBRAS_CHAT_ENDPOINT = 'https://api.cerebras.ai/v1/chat/completions';
const TEMPORARY_UNAVAILABLE_MESSAGE = 'DevDesk AI is temporarily busy. Please try again in a moment.';
const MAX_PRODUCTION_OPENROUTER_ATTEMPTS = 5;
const MAX_CHAT_PROVIDER_TIMEOUT_MS = 5_000;
const MAX_INDEPENDENT_PROVIDER_TIMEOUT_MS = 10_000;
const EMERGENCY_CHAT_TIMEOUT_MS = 8_000;
const PLATFORM_RATE_LIMIT_COOLDOWN_MS = 60_000;
let platformRateLimitUntil = 0;

type OpenRouterErrorPayload = { error?: { metadata?: { provider_code?: string | number } } };

export function resetChatCapacityCooldownForTests() {
  platformRateLimitUntil = 0;
}

function platformRateLimitActive() {
  return Date.now() < platformRateLimitUntil;
}

function activatePlatformRateLimitCooldown() {
  platformRateLimitUntil = Math.max(platformRateLimitUntil, Date.now() + PLATFORM_RATE_LIMIT_COOLDOWN_MS);
}

export function buildModelCandidates(primaryModel: string, fallbackModels: string[]) {
  return [...new Set([primaryModel, ...fallbackModels].map((model) => model.trim()).filter(Boolean))];
}

export function buildModelAttemptSequence(primaryModel: string, fallbackModels: string[]) {
  const candidates = boundedCandidates(primaryModel, fallbackModels);
  const [first, ...fallbacks] = candidates;
  const freeRouterIndex = fallbacks.indexOf('openrouter/free');
  const freeRouter = freeRouterIndex >= 0 ? fallbacks[freeRouterIndex] : undefined;
  const specificFallbacks = freeRouter ? fallbacks.filter((model) => model !== freeRouter) : fallbacks;
  // GLM 5.2 free can occasionally reject the first provider attempt and then
  // respond immediately on a retry. Give the requested primary model one more
  // bounded chance before consuming the fallback chain.
  return first === GLM_PRIMARY_MODEL ? [first, first, ...(freeRouter ? [freeRouter] : []), ...specificFallbacks] : candidates;
}

export function hasUnresolvedToolCall(text: string) {
  return /<\|tool_call_(?:start|end)\|>|<tool_call|\[?(?:read_file|write_file|edit_file)\(path=/i.test(text);
}

function boundedCandidates(primaryModel: string, fallbackModels: string[]) {
  // A bounded serial policy prevents a long chain of timeouts from holding a
  // Vercel request open indefinitely, while still covering 15+ safe fallbacks.
  return buildModelCandidates(primaryModel, fallbackModels).slice(0, 17);
}

function productionCandidates(primaryModel: string, fallbackModels: string[]) {
  return buildModelAttemptSequence(primaryModel, fallbackModels).slice(0, MAX_PRODUCTION_OPENROUTER_ATTEMPTS);
}

function validText(payload: { choices?: Array<{ message?: { content?: string } }> }) {
  const text = payload.choices?.[0]?.message?.content?.trim();
  return text && !hasUnresolvedToolCall(text) ? text : undefined;
}

async function askEmergencyFallback(messages: ChatMessage[], attempts: string[]): Promise<DevDeskAnswer | undefined> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), EMERGENCY_CHAT_TIMEOUT_MS);
  try {
    const response = await fetch(EMERGENCY_CHAT_ENDPOINT, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model: EMERGENCY_CHAT_MODEL, messages, max_tokens: Math.min(Math.max(env.maxOutputTokens, 800), 900), temperature: 0.35, reasoning_effort: 'low' }),
    });
    if (!response.ok) { attempts.push(`emergency/${EMERGENCY_CHAT_MODEL} (${response.status})`); return undefined; }
    const payload = await response.json().catch(() => undefined) as { model?: string; choices?: Array<{ message?: { content?: string } }> } | undefined;
    const text = payload && validText(payload);
    if (!text) { attempts.push(`emergency/${EMERGENCY_CHAT_MODEL} (empty or unsafe response)`); return undefined; }
    return { text, model: `emergency/${payload?.model ?? EMERGENCY_CHAT_MODEL}`, attempts };
  } catch (issue) {
    attempts.push(`emergency/${EMERGENCY_CHAT_MODEL} (${issue instanceof Error && issue.name === 'AbortError' ? 'timeout' : 'network error'})`);
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}

async function askGroqFallback(messages: ChatMessage[], attempts: string[]): Promise<DevDeskAnswer | undefined> {
  if (!env.groqApiKey) return undefined;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.min(env.groqTimeoutMs, MAX_CHAT_PROVIDER_TIMEOUT_MS));
  try {
    const response = await fetch(GROQ_CHAT_ENDPOINT, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'content-type': 'application/json', authorization: `Bearer ${env.groqApiKey}` },
      body: JSON.stringify({ model: env.groqModel, messages, max_tokens: env.maxOutputTokens, temperature: 0.35 }),
    });
    if (!response.ok) { attempts.push(`groq/${env.groqModel} (${response.status})`); return undefined; }
    const payload = await response.json().catch(() => undefined) as { model?: string; choices?: Array<{ message?: { content?: string } }> } | undefined;
    const text = payload && validText(payload);
    if (!text) { attempts.push(`groq/${env.groqModel} (empty or unsafe response)`); return undefined; }
    return { text, model: `groq/${payload.model ?? env.groqModel}`, attempts };
  } catch (issue) {
    attempts.push(`groq/${env.groqModel} (${issue instanceof Error && issue.name === 'AbortError' ? 'timeout' : 'network error'})`);
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}

async function askXaiFallback(messages: ChatMessage[], attempts: string[]): Promise<DevDeskAnswer | undefined> {
  if (!env.xaiApiKey) return undefined;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.min(env.xaiTimeoutMs, MAX_INDEPENDENT_PROVIDER_TIMEOUT_MS));
  try {
    const response = await fetch(XAI_CHAT_ENDPOINT, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'content-type': 'application/json', authorization: `Bearer ${env.xaiApiKey}` },
      body: JSON.stringify({ model: env.xaiModel, messages, max_tokens: env.maxOutputTokens, temperature: 0.35 }),
    });
    if (!response.ok) { attempts.push(`xai/${env.xaiModel} (${response.status})`); return undefined; }
    const payload = await response.json().catch(() => undefined) as { model?: string; choices?: Array<{ message?: { content?: string } }> } | undefined;
    const text = payload && validText(payload);
    if (!text) { attempts.push(`xai/${env.xaiModel} (empty or unsafe response)`); return undefined; }
    return { text, model: `xai/${payload.model ?? env.xaiModel}`, attempts };
  } catch (issue) {
    attempts.push(`xai/${env.xaiModel} (${issue instanceof Error && issue.name === 'AbortError' ? 'timeout' : 'network error'})`);
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}

async function askCerebrasFallback(messages: ChatMessage[], attempts: string[]): Promise<DevDeskAnswer | undefined> {
  if (!env.cerebrasApiKey) return undefined;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.min(env.cerebrasTimeoutMs, MAX_INDEPENDENT_PROVIDER_TIMEOUT_MS));
  try {
    const response = await fetch(CEREBRAS_CHAT_ENDPOINT, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'content-type': 'application/json', authorization: `Bearer ${env.cerebrasApiKey}` },
      body: JSON.stringify({ model: env.cerebrasModel, messages, max_tokens: env.maxOutputTokens, temperature: 0.35, reasoning_effort: 'low' }),
    });
    if (!response.ok) { attempts.push(`cerebras/${env.cerebrasModel} (${response.status})`); return undefined; }
    const payload = await response.json().catch(() => undefined) as { model?: string; choices?: Array<{ message?: { content?: string } }> } | undefined;
    const text = payload && validText(payload);
    if (!text) { attempts.push(`cerebras/${env.cerebrasModel} (empty or unsafe response)`); return undefined; }
    return { text, model: `cerebras/${payload.model ?? env.cerebrasModel}`, attempts };
  } catch (issue) {
    attempts.push(`cerebras/${env.cerebrasModel} (${issue instanceof Error && issue.name === 'AbortError' ? 'timeout' : 'network error'})`);
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}

function continuityGuidance(messages: ChatMessage[], attempts: string[]): DevDeskAnswer {
  const latestPrompt = messages.filter((message) => message.role === 'user').at(-1)?.content.trim() || 'your developer question';
  const codeRequest = /\b(code|typescript|javascript|react|next|function|component|api|bug|error)\b/i.test(latestPrompt);
  const text = codeRequest
    ? `I have saved your request: “${latestPrompt.slice(0, 260)}”. Free AI providers are temporarily at capacity, so I will not invent unverified code. Start by isolating the smallest reproducible case, keep the change behind a test, and send this prompt again shortly for a generated implementation. Your conversation is preserved.`
    : `I have saved your request: “${latestPrompt.slice(0, 260)}”. Free AI providers are temporarily at capacity. Your conversation is preserved; retry shortly and DevDesk AI will resume normal model-backed answers automatically.`;
  return { text, model: 'continuity/provider-capacity', attempts };
}

export async function askDevDesk(messages: ChatMessage[], options: AskDevDeskOptions = {}): Promise<DevDeskAnswer> {
  const candidates = env.openRouterApiKey ? productionCandidates(env.openRouterModel, env.openRouterFallbackModels) : [];
  const attempts: string[] = env.openRouterApiKey ? [] : ['OpenRouter (not configured)'];
  const enrichedMessages: ChatMessage[] = [{ role: 'system', content: DEV_DESK_IDENTITY }, ...messages];

  const openRouterCoolingDown = candidates.length && platformRateLimitActive();
  if (openRouterCoolingDown) {
    attempts.push('OpenRouter platform rate-limit cooldown');
  }

  for (let index = 0; !openRouterCoolingDown && index < candidates.length; index += 1) {
    const model = candidates[index]!;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Math.min(env.openRouterTimeoutMs, MAX_CHAT_PROVIDER_TIMEOUT_MS));
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'content-type': 'application/json', authorization: `Bearer ${env.openRouterApiKey}`, 'X-Title': 'DevDesk AI' },
        body: JSON.stringify({ model, messages: enrichedMessages, max_tokens: env.maxOutputTokens, temperature: 0.35 }),
      });
      if (!response.ok) {
        const errorPayload = await response.json().catch(() => undefined) as OpenRouterErrorPayload | undefined;
        const providerSpecificRateLimit = response.status === 429 && Boolean(errorPayload?.error?.metadata?.provider_code);
        attempts.push(`${model} (${response.status}${providerSpecificRateLimit ? ' provider rate limit' : ''})`);
        // OpenRouter itself enforces free-tier request caps. Trying every model
        // on a platform 429 consumes more of the same constrained budget and
        // delays every user. OpenRouter already retries eligible providers for
        // one model internally, so stop and cool down. Provider-specific 429s
        // remain eligible for a different-model fallback.
        if (response.status === 429 && !providerSpecificRateLimit) {
          activatePlatformRateLimitCooldown();
          break;
        }
        // Keep GLM 5.2 first and retry temporary provider failures, but do not
        // duplicate an explicit 429 rate-limit response. Move immediately to
        // the independent free-router fallback instead of extending the wait.
        if (response.status === 429 && model === GLM_PRIMARY_MODEL && candidates[index + 1] === GLM_PRIMARY_MODEL) index += 1;
        // A free-model/provider denial can be model-specific. Continue to the
        // next verified model instead of exposing a provider error to users.
        continue;
      }
      let payload: { model?: string; choices?: Array<{ message?: { content?: string } }> };
      try {
        payload = await response.json() as { model?: string; choices?: Array<{ message?: { content?: string } }> };
      } catch {
        attempts.push(`${model} (invalid response)`);
        continue;
      }
      const text = payload.choices?.[0]?.message?.content?.trim();
      if (!text) { attempts.push(`${model} (empty response)`); continue; }
      if (hasUnresolvedToolCall(text)) { attempts.push(`${model} (unresolved tool call)`); continue; }
      return { text, model: payload.model ?? model, attempts };
    } catch (issue) {
      if (issue instanceof Error && issue.name === 'AbortError') { attempts.push(`${model} (timeout)`); continue; }
      attempts.push(`${model} (network error)`);
    } finally {
      clearTimeout(timeout);
    }
  }
  // Independent providers are restricted to ordinary general chat. Imported
  // repository excerpts never leave the configured source-analysis boundary.
  if (options.allowIndependentFallback !== false) {
    const xaiAnswer = await askXaiFallback(enrichedMessages, attempts);
    if (xaiAnswer) return xaiAnswer;
    const cerebrasAnswer = await askCerebrasFallback(enrichedMessages, attempts);
    if (cerebrasAnswer) return cerebrasAnswer;
    const groqAnswer = await askGroqFallback(enrichedMessages, attempts);
    if (groqAnswer) return groqAnswer;
  }
  if (openRouterCoolingDown && !env.xaiApiKey && !env.cerebrasApiKey && !env.groqApiKey) {
    if (options.allowContinuityResponse === false) throw new ProviderCapacityError(attempts);
    return continuityGuidance(messages, attempts);
  }
  // This no-key provider is intentionally reserved for ordinary chat only. It
  // gives users a best-effort response during a total OpenRouter free-tier
  // outage while keeping imported repository source on the configured service.
  if (options.allowEmergencyFallback !== false && (!openRouterCoolingDown || Boolean(env.xaiApiKey) || Boolean(env.cerebrasApiKey) || Boolean(env.groqApiKey))) {
    const emergencyAnswer = await askEmergencyFallback(enrichedMessages, attempts);
    if (emergencyAnswer) return emergencyAnswer;
  }
  attempts.push(TEMPORARY_UNAVAILABLE_MESSAGE);
  if (options.allowContinuityResponse === false) throw new ProviderCapacityError(attempts);
  return continuityGuidance(messages, attempts);
}
