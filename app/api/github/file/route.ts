import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/server/supabase';
import { decryptToken, githubRequest } from '@/server/github';
import { normalizeProjectPath } from '@/server/ingestion';
import { parseRepositoryFullName, MAX_SOURCE_FILE_BYTES } from '@/server/repository-import';

const inputSchema = z.object({ fullName: z.string().trim().min(3).max(240), branch: z.string().trim().min(1).max(200), path: z.string().trim().min(1).max(500) });
type ContentPayload = { content?: string; encoding?: string; sha?: string };

export async function POST(request: Request) {
  const input = inputSchema.safeParse(await request.json().catch(() => undefined));
  if (!input.success) return NextResponse.json({ error: 'Repository, branch, and file path are required.' }, { status: 400 });
  let repository: { owner: string; repository: string }; let safePath: string | undefined;
  try { repository = parseRepositoryFullName(input.data.fullName); safePath = normalizeProjectPath(input.data.path); if (!safePath) throw new Error('Unsafe project path rejected.'); } catch (issue) { return NextResponse.json({ error: issue instanceof Error ? issue.message : 'Invalid file target.' }, { status: 400 }); }
  const supabase = await createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const admin = getSupabaseAdmin(); if (!admin) return NextResponse.json({ error: 'Server database credentials are not configured.' }, { status: 503 });
  const { data: connection } = await admin.from('github_connections').select('encrypted_access_token').eq('user_id', user.id).maybeSingle(); if (!connection) return NextResponse.json({ error: 'Connect GitHub before opening a repository file.' }, { status: 409 });
  const response = await githubRequest<ContentPayload>(decryptToken(connection.encrypted_access_token), `/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.repository)}/contents/${safePath.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(input.data.branch)}`);
  if (response.status !== 200 || !response.payload?.content || response.payload.encoding !== 'base64' || !response.payload.sha) return NextResponse.json({ error: 'Could not load this repository file.' }, { status: 404 });
  const content = Buffer.from(response.payload.content.replace(/\s/g, ''), 'base64').toString('utf8'); if (Buffer.byteLength(content, 'utf8') > MAX_SOURCE_FILE_BYTES) return NextResponse.json({ error: 'This file exceeds the safe editor limit.' }, { status: 413 });
  return NextResponse.json({ path: safePath, content, sha: response.payload.sha });
}
