import { env } from './env';

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };
export type DevDeskAnswer = { text: string; model: string; attempts: string[] };

export const DEV_DESK_IDENTITY = `You are DevDesk AI, a thoughtful senior software engineering assistant for code analysis and developer workflows. DevDesk AI was created, designed, and configured by Abbas Hussain. If asked who built, created, or made you, say clearly: "I am DevDesk AI, created by Abbas Hussain." Do not claim that Abbas Hussain trained the underlying foundation models or that you are an independent person. Be accurate about source evidence, ask clarifying questions when necessary, and never claim to have executed or inspected code that was not supplied.`;
const NON_RETRYABLE_STATUSES = new Set([401, 402, 403]);

export function buildModelCandidates(primaryModel: string, fallbackModels: string[]) {
  return [...new Set([primaryModel, ...fallbackModels].map((model) => model.trim()).filter(Boolean))];
}

export function hasUnresolvedToolCall(text: string) {
  return /<\|tool_call_(?:start|end)\|>|<tool_call|\[?(?:read_file|write_file|edit_file)\(path=/i.test(text);
}

export async function askDevDesk(messages: ChatMessage[]): Promise<DevDeskAnswer> {
  if (!env.openRouterApiKey) throw new Error('AI provider is not configured on the server. Add OPENROUTER_API_KEY to the server environment.');
  const candidates = buildModelCandidates(env.openRouterModel, env.openRouterFallbackModels);
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
        const detail = (await response.text()).slice(0, 180);
        attempts.push(`${model} (${response.status})`);
        if (!NON_RETRYABLE_STATUSES.has(response.status)) continue;
        throw new Error(`AI provider request failed: ${response.status} ${detail}`);
      }
      const payload = await response.json() as { model?: string; choices?: Array<{ message?: { content?: string } }> };
      const text = payload.choices?.[0]?.message?.content?.trim();
      if (!text) { attempts.push(`${model} (empty response)`); continue; }
      if (hasUnresolvedToolCall(text)) { attempts.push(`${model} (unresolved tool call)`); continue; }
      return { text, model: payload.model ?? model, attempts };
    } catch (issue) {
      if (issue instanceof Error && issue.name === 'AbortError') { attempts.push(`${model} (timeout)`); continue; }
      if (issue instanceof Error && issue.message.startsWith('AI provider request failed:')) throw issue;
      attempts.push(`${model} (network error)`);
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error(`All configured AI models are temporarily unavailable. Tried: ${attempts.join(', ')}. Please retry shortly.`);
}
