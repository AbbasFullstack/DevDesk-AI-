import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/server/supabase';
import { decryptToken } from '@/server/github';
import { importGithubRepository, parseRepositoryFullName } from '@/server/repository-import';

const inputSchema = z.object({ fullName: z.string().trim().min(3).max(240), branch: z.string().trim().min(1).max(200) });

export async function POST(request: Request) {
  const input = inputSchema.safeParse(await request.json().catch(() => undefined));
  if (!input.success) return NextResponse.json({ error: 'A repository name and branch are required.' }, { status: 400 });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return NextResponse.json({ error: 'Supabase authentication is not configured.' }, { status: 503 });
  try { parseRepositoryFullName(input.data.fullName); } catch (issue) { return NextResponse.json({ error: issue instanceof Error ? issue.message : 'Invalid repository.' }, { status: 400 }); }
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Server database credentials are not configured.' }, { status: 503 });
  const { data: connection, error: connectionError } = await admin.from('github_connections').select('encrypted_access_token').eq('user_id', user.id).maybeSingle();
  if (connectionError || !connection) return NextResponse.json({ error: 'Connect GitHub before importing a repository.' }, { status: 409 });

  try {
    const imported = await importGithubRepository(decryptToken(connection.encrypted_access_token), input.data.fullName, input.data.branch);
    const { data: existing } = await admin.from('projects').select('id').eq('owner_id', user.id).eq('name', input.data.fullName).eq('source_type', 'github').eq('branch', input.data.branch).maybeSingle();
    const projectPayload = { owner_id: user.id, name: input.data.fullName, source_type: 'github', branch: input.data.branch, status: 'ingesting', updated_at: new Date().toISOString() };
    const projectResult = existing ? await admin.from('projects').update(projectPayload).eq('id', existing.id).select('id,name,branch,status').single() : await admin.from('projects').insert(projectPayload).select('id,name,branch,status').single();
    if (projectResult.error || !projectResult.data) throw new Error(projectResult.error?.message ?? 'Could not create the imported project.');
    const project = projectResult.data;
    const deletion = await admin.from('project_files').delete().eq('project_id', project.id);
    if (deletion.error) throw new Error(deletion.error.message);
    const storedFiles = imported.files.map((file) => ({ project_id: project.id, path: file.normalizedPath, language: file.language, byte_size: file.byteSize, content_hash: createHash('sha256').update(file.content ?? '').digest('hex'), excerpt: file.excerpt }));
    const fileInsert = await admin.from('project_files').insert(storedFiles);
    if (fileInsert.error) throw new Error(fileInsert.error.message);
    const ready = await admin.from('projects').update({ status: 'ready', updated_at: new Date().toISOString() }).eq('id', project.id).select('id,name,branch,status').single();
    if (ready.error || !ready.data) throw new Error(ready.error?.message ?? 'Could not finalize the imported project.');
    return NextResponse.json({ project: ready.data, source: { fileCount: storedFiles.length, treeTruncated: imported.treeTruncated, skippedCount: imported.skippedCount }, files: storedFiles.map(({ path, language, byte_size }) => ({ path, language, byteSize: byte_size })) }, { status: 201 });
  } catch (issue) {
    const message = issue instanceof Error ? issue.message : 'Repository import failed.';
    console.error('[devdesk-github-import]', { message, repository: input.data.fullName });
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
