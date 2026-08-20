import { env, GLM_PRIMARY_MODEL } from './env';

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };
export type DevDeskAnswer = { text: string; model: string; attempts: string[] };
export type AskDevDeskOptions = { allowEmergencyFallback?: boolean };

export const DEV_DESK_IDENTITY = `You are DevDesk AI, a thoughtful senior software engineering assistant for code analysis and developer workflows. DevDesk AI was created, designed, and configured by Abbas Hussain. If asked who built, created, or made you, say clearly: "I am DevDesk AI, created by Abbas Hussain." Do not claim that Abbas Hussain trained the underlying foundation models or that you are an independent person. Be accurate about source evidence, ask clarifying questions when necessary, and never claim to have executed or inspected code that was not supplied.`;
export const EMERGENCY_CHAT_ENDPOINT = 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions';
export const EMERGENCY_CHAT_MODEL = 'gpt-oss-20b';
const TEMPORARY_UNAVAILABLE_MESSAGE = 'DevDesk AI is temporarily busy. Please try again in a moment.';

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

function validText(payload: { choices?: Array<{ message?: { content?: string } }> }) {
  const text = payload.choices?.[0]?.message?.content?.trim();
  return text && !hasUnresolvedToolCall(text) ? text : undefined;
}

async function askEmergencyFallback(messages: ChatMessage[], attempts: string[]): Promise<DevDeskAnswer | undefined> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(EMERGENCY_CHAT_ENDPOINT, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model: EMERGENCY_CHAT_MODEL, messages, max_tokens: Math.min(env.maxOutputTokens, 480), temperature: 0.35 }),
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

export async function askDevDesk(messages: ChatMessage[], options: AskDevDeskOptions = {}): Promise<DevDeskAnswer> {
  const candidates = env.openRouterApiKey ? buildModelAttemptSequence(env.openRouterModel, env.openRouterFallbackModels) : [];
  const attempts: string[] = env.openRouterApiKey ? [] : ['OpenRouter (not configured)'];
  const enrichedMessages: ChatMessage[] = [{ role: 'system', content: DEV_DESK_IDENTITY }, ...messages];

  for (const model of candidates) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.openRouterTimeoutMs);
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'content-type': 'application/json', authorization: `Bearer ${env.openRouterApiKey}`, 'X-Title': 'DevDesk AI' },
        body: JSON.stringify({ model, messages: enrichedMessages, max_tokens: env.maxOutputTokens, temperature: 0.35 }),
      });
      if (!response.ok) {
        attempts.push(`${model} (${response.status})`);
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
  // This no-key provider is intentionally reserved for ordinary chat only. It
  // gives users a best-effort response during a total OpenRouter free-tier
  // outage while keeping imported repository source on the configured service.
  if (options.allowEmergencyFallback !== false) {
    const emergencyAnswer = await askEmergencyFallback(enrichedMessages, attempts);
    if (emergencyAnswer) return emergencyAnswer;
  }
  throw new Error(TEMPORARY_UNAVAILABLE_MESSAGE);
}
