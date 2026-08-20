import { NextResponse } from 'next/server';
import { z } from 'zod';
import { askDevDesk } from '@/server/ai';
import { buildSourceAnalysisMessages } from '@/server/analysis-prompt';
import { env } from '@/server/env';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/server/supabase';

const inputSchema = z.object({ projectId: z.string().uuid(), question: z.string().trim().min(3).max(4_000) });

export async function POST(request: Request) {
  const input = inputSchema.safeParse(await request.json().catch(() => undefined));
  if (!input.success) return NextResponse.json({ error: 'A real imported project and question are required.' }, { status: 400 });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return NextResponse.json({ error: 'Supabase authentication is not configured.' }, { status: 503 });
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Server database credentials are not configured.' }, { status: 503 });
  const { data: project, error: projectError } = await admin.from('projects').select('id,name,branch').eq('id', input.data.projectId).eq('owner_id', user.id).maybeSingle();
  if (projectError || !project) return NextResponse.json({ error: 'Imported project not found.' }, { status: 404 });
  const { data: files, error: filesError } = await admin.from('project_files').select('path,excerpt').eq('project_id', project.id).order('path').limit(120);
  if (filesError) return NextResponse.json({ error: 'Could not load imported source files.' }, { status: 500 });
  if (!files?.length) return NextResponse.json({ error: 'Import source files before starting code analysis.' }, { status: 409 });
  const runStart = await admin.from('analysis_runs').insert({ project_id: project.id, status: 'running', stage: 'source-review', model: env.openRouterModel, started_at: new Date().toISOString() }).select('id').single();
  if (runStart.error || !runStart.data) return NextResponse.json({ error: 'Could not start a source analysis run.' }, { status: 500 });
  const context = files.map((file) => `FILE: ${file.path}\n${file.excerpt ?? ''}`).join('\n\n').slice(0, env.maxInputCharacters);
  try {
    const answer = await askDevDesk(buildSourceAnalysisMessages({ projectName: project.name, branch: project.branch, question: input.data.question, context }));
    await admin.from('analysis_runs').update({ status: 'complete', stage: 'complete', model: answer.model, completed_at: new Date().toISOString() }).eq('id', runStart.data.id);
    return NextResponse.json({ status: 'complete', analysisId: runStart.data.id, project: { id: project.id, name: project.name, branch: project.branch }, source: { fileCount: files.length, paths: files.map((file) => file.path) }, text: answer.text, model: answer.model, fallbackUsed: answer.attempts.length > 0 });
  } catch (issue) {
    const message = issue instanceof Error ? issue.message : 'The analysis request failed.';
    await admin.from('analysis_runs').update({ status: 'failed', error_message: message, completed_at: new Date().toISOString() }).eq('id', runStart.data.id);
    console.error('[devdesk-analysis]', { message, projectId: project.id, model: env.openRouterModel, keyConfigured: Boolean(env.openRouterApiKey) });
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
