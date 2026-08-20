import { env, GLM_PRIMARY_MODEL } from './env';

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };
export type DevDeskAnswer = { text: string; model: string; attempts: string[] };

export const DEV_DESK_IDENTITY = `You are DevDesk AI, a thoughtful senior software engineering assistant for code analysis and developer workflows. DevDesk AI was created, designed, and configured by Abbas Hussain. If asked who built, created, or made you, say clearly: "I am DevDesk AI, created by Abbas Hussain." Do not claim that Abbas Hussain trained the underlying foundation models or that you are an independent person. Be accurate about source evidence, ask clarifying questions when necessary, and never claim to have executed or inspected code that was not supplied.`;
const TEMPORARY_UNAVAILABLE_MESSAGE = 'DevDesk AI is temporarily busy. Please try again in a moment.';

export function buildModelCandidates(primaryModel: string, fallbackModels: string[]) {
  return [...new Set([primaryModel, ...fallbackModels].map((model) => model.trim()).filter(Boolean))];
}

export function buildModelAttemptSequence(primaryModel: string, fallbackModels: string[]) {
  const candidates = boundedCandidates(primaryModel, fallbackModels);
  const [first, ...fallbacks] = candidates;
  // GLM 5.2 free can occasionally reject the first provider attempt and then
  // respond immediately on a retry. Give the requested primary model one more
  // bounded chance before consuming the fallback chain.
  return first === GLM_PRIMARY_MODEL ? [first, first, ...fallbacks] : candidates;
}

export function hasUnresolvedToolCall(text: string) {
  return /<\|tool_call_(?:start|end)\|>|<tool_call|\[?(?:read_file|write_file|edit_file)\(path=/i.test(text);
}

function boundedCandidates(primaryModel: string, fallbackModels: string[]) {
  // A bounded serial policy prevents a long chain of timeouts from holding a
  // Vercel request open indefinitely, while still covering 15+ safe fallbacks.
  return buildModelCandidates(primaryModel, fallbackModels).slice(0, 17);
}

export async function askDevDesk(messages: ChatMessage[]): Promise<DevDeskAnswer> {
  if (!env.openRouterApiKey) throw new Error('DevDesk AI is not configured on the server yet.');
  const candidates = buildModelAttemptSequence(env.openRouterModel, env.openRouterFallbackModels);
  const attempts: string[] = [];
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
  throw new Error(TEMPORARY_UNAVAILABLE_MESSAGE);
}
