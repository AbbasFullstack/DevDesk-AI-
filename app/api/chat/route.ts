import { NextResponse } from 'next/server';
import { z } from 'zod';
import { askDevDesk } from '@/server/ai';
import { env } from '@/server/env';

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
  try {
    const answer = await askDevDesk([
      { role: 'system', content: 'You are DevDesk AI, a precise senior engineer. Explain project issues with evidence, ask clarifying questions when context is missing, and never claim to have executed code you did not execute.' },
      ...input.data.messages,
    ]);
    return NextResponse.json({ text: answer.text, model: answer.model, fallbackUsed: answer.attempts.length > 0, attemptCount: answer.attempts.length + 1 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'DevDesk AI is temporarily busy. Please try again in a moment.';
    console.error('[devdesk-chat] provider request failed', { message, model: env.openRouterModel, keyConfigured: Boolean(env.openRouterApiKey) });
    return NextResponse.json({ error: message, retryable: true }, { status: 503 });
  }
}
