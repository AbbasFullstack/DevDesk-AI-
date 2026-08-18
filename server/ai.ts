import { env } from './env';

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export async function askDevDesk(messages: ChatMessage[]) {
  if (!env.openRouterApiKey) {
    throw new Error('AI provider is not configured on the server. Add OPENROUTER_API_KEY to the server environment.');
  }
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${env.openRouterApiKey}`, 'X-Title': 'DevDesk AI' },
    body: JSON.stringify({ model: env.openRouterModel, messages, max_tokens: env.maxOutputTokens }),
  });
  if (!response.ok) {
    const detail = await response.text();
    if (response.status === 429) throw new Error('The AI provider is rate-limited. Please retry shortly.');
    throw new Error(`AI provider request failed: ${response.status} ${detail.slice(0, 240)}`);
  }
  const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const text = payload.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('The AI provider returned an empty response.');
  return text;
}
