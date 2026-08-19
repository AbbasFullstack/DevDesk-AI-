import { NextResponse } from 'next/server';
import { z } from 'zod';
import { askDevDesk } from '@/server/ai';
import { env } from '@/server/env';

const inputSchema = z.object({
  projectName: z.string().trim().min(1).max(120),
  question: z.string().trim().min(3).max(4_000),
  files: z.array(z.object({ path: z.string().max(500), excerpt: z.string().max(14_000) })).max(120).default([]),
});

export async function POST(request: Request) {
  const input = inputSchema.safeParse(await request.json().catch(() => undefined));
  if (!input.success) return NextResponse.json({ error: 'A valid project name and question are required.' }, { status: 400 });
  const context = input.data.files.map((file) => `FILE ${file.path}\n${file.excerpt}`).join('\n\n').slice(0, env.maxInputCharacters);
  try {
    const text = await askDevDesk([
      { role: 'system', content: 'You analyze software projects. Return concise sections: Understanding, Questions, Findings, and Recommended fix.' },
      { role: 'user', content: `Project: ${input.data.projectName}\nQuestion: ${input.data.question}\n\nProject context:\n${context}` },
    ]);
    return NextResponse.json({ status: 'complete', projectName: input.data.projectName, text });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'The analysis request failed.' }, { status: 502 });
  }
}
