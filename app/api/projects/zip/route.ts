import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/server/supabase';
import { importZipProject } from '@/server/zip-import';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return NextResponse.json({ error: 'Supabase authentication is not configured.' }, { status: 503 });
  const form = await request.formData().catch(() => undefined);
  const file = form?.get('archive'); const name = typeof form?.get('name') === 'string' ? String(form?.get('name')).trim() : '';
  if (!(file instanceof File) || !name || name.length > 120) return NextResponse.json({ error: 'Provide a project name and ZIP archive.' }, { status: 400 });
  const supabase = await createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const admin = getSupabaseAdmin(); if (!admin) return NextResponse.json({ error: 'Server database credentials are not configured.' }, { status: 503 });
  try {
    const imported = await importZipProject(Buffer.from(await file.arrayBuffer()));
    const { data: project, error: projectError } = await admin.from('projects').insert({ owner_id: user.id, name, source_type: 'zip', status: 'ingesting' }).select('id,name,branch,status').single();
    if (projectError || !project) throw new Error(projectError?.message ?? 'Could not create ZIP project.');
    const storedFiles = imported.files.map((source) => ({ project_id: project.id, path: source.normalizedPath, language: source.language, byte_size: source.byteSize, content_hash: createHash('sha256').update(source.content ?? '').digest('hex'), excerpt: source.excerpt }));
    const fileResult = await admin.from('project_files').insert(storedFiles); if (fileResult.error) throw new Error(fileResult.error.message);
    const { data: ready, error: readyError } = await admin.from('projects').update({ status: 'ready', updated_at: new Date().toISOString() }).eq('id', project.id).eq('owner_id', user.id).select('id,name,branch,status').single();
    if (readyError || !ready) throw new Error(readyError?.message ?? 'Could not finalize ZIP project.');
    return NextResponse.json({ project: ready, source: { fileCount: storedFiles.length, skippedCount: imported.skippedCount }, files: storedFiles.map(({ path, language, byte_size }) => ({ path, language, byteSize: byte_size })) }, { status: 201 });
  } catch (issue) { return NextResponse.json({ error: issue instanceof Error ? issue.message : 'ZIP import failed.' }, { status: 400 }); }
}
