import { NextResponse } from 'next/server';
import { z } from 'zod';
import { askDevDesk } from '@/server/ai';
import { env } from '@/server/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { CHAT_CAPACITY_COOLDOWN_SECONDS } from '@/app/chat-capacity';

export const maxDuration = 60;

const inputSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().trim().min(1).max(env.maxInputCharacters),
  })).min(1).max(30),
});

export async function POST(request: Request) {
  const input = inputSchema.safeParse(await request.json().catch(() => undefined));
  if (!input.success) return NextResponse.json({ error: 'Messages are invalid or exceed the allowed size.' }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  try {
    const answer = await askDevDesk([
      { role: 'system', content: 'You are DevDesk AI, a precise senior engineer. Explain project issues with evidence, ask clarifying questions when context is missing, and never claim to have executed code you did not execute.' },
      ...input.data.messages,
    ]);
    const retryAfterSeconds = answer.model === 'continuity/provider-capacity' ? CHAT_CAPACITY_COOLDOWN_SECONDS : undefined;
    if (answer.model === 'continuity/provider-capacity') {
      // Logs exclude the user prompt, request body, and every credential value.
      // Provider/status names are sufficient for safely diagnosing a live outage.
      console.warn('[devdesk-chat] all model-backed fallbacks unavailable', {
        attemptCount: answer.attempts.length,
        attempts: answer.attempts,
      });
    }
    return NextResponse.json({ text: answer.text, model: answer.model, fallbackUsed: answer.attempts.length > 0, attemptCount: answer.attempts.length + 1, retryAfterSeconds });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'DevDesk AI is temporarily busy. Please try again in a moment.';
    console.error('[devdesk-chat] provider request failed', { message, model: env.openRouterModel, keyConfigured: Boolean(env.openRouterApiKey) });
    return NextResponse.json({ error: message, retryable: true }, { status: 503 });
  }
}
