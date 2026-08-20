import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/server/supabase';
import { decryptToken, githubRequest } from '@/server/github';
import { parseRepositoryFullName, MAX_SOURCE_FILE_BYTES, prepareApprovedCommit } from '@/server/repository-import';

const inputSchema = z.object({ fullName: z.string().trim().min(3).max(240), branch: z.string().trim().min(1).max(200), path: z.string().trim().min(1).max(500), content: z.string().max(MAX_SOURCE_FILE_BYTES), sha: z.string().trim().min(20).max(100).optional(), message: z.string().trim().min(5).max(180) });
type CommitPayload = { commit?: { sha?: string; html_url?: string }; content?: { path?: string; sha?: string } };

export async function POST(request: Request) {
  const input = inputSchema.safeParse(await request.json().catch(() => undefined));
  if (!input.success) return NextResponse.json({ error: 'Review one valid source file and supply a commit message before writing to GitHub.' }, { status: 400 });
  let repository: { owner: string; repository: string }; let file: ReturnType<typeof prepareApprovedCommit>;
  try { repository = parseRepositoryFullName(input.data.fullName); file = prepareApprovedCommit(input.data.path, input.data.content); } catch (issue) { return NextResponse.json({ error: issue instanceof Error ? issue.message : 'Invalid file target.' }, { status: 400 }); }
  const supabase = await createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const admin = getSupabaseAdmin(); if (!admin) return NextResponse.json({ error: 'Server database credentials are not configured.' }, { status: 503 });
  const { data: connection } = await admin.from('github_connections').select('encrypted_access_token').eq('user_id', user.id).maybeSingle(); if (!connection) return NextResponse.json({ error: 'Connect GitHub before committing code.' }, { status: 409 });
  const response = await githubRequest<CommitPayload>(decryptToken(connection.encrypted_access_token), `/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.repository)}/contents/${file.normalizedPath.split('/').map(encodeURIComponent).join('/')}`, { method: 'PUT', body: { message: input.data.message, content: Buffer.from(input.data.content, 'utf8').toString('base64'), branch: input.data.branch, ...(input.data.sha ? { sha: input.data.sha } : {}) } });
  if (response.status !== 200 && response.status !== 201) return NextResponse.json({ error: 'GitHub rejected the approved commit. The file may have changed; reload it before trying again.' }, { status: response.status === 409 ? 409 : 502 });
  return NextResponse.json({ status: 'committed', path: file.normalizedPath, commitSha: response.payload?.commit?.sha, commitUrl: response.payload?.commit?.html_url, contentSha: response.payload?.content?.sha });
}
