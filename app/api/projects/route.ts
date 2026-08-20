import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/server/supabase';

const inputSchema = z.object({ name: z.string().trim().min(2).max(120) });
const deleteSchema = z.object({ projectId: z.string().uuid() });

async function requireProjectOwner() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return { error: NextResponse.json({ error: 'Supabase authentication is not configured.' }, { status: 503 }) };
  const supabase = await createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }) };
  const admin = getSupabaseAdmin(); if (!admin) return { error: NextResponse.json({ error: 'Server database credentials are not configured.' }, { status: 503 }) };
  return { user, admin };
}

export async function GET() {
  const context = await requireProjectOwner(); if ('error' in context) return context.error;
  const { data, error } = await context.admin.from('projects').select('id,name,source_type,branch,status,created_at,updated_at').eq('owner_id', context.user.id).order('updated_at', { ascending: false }).limit(50);
  if (error) return NextResponse.json({ error: 'Could not load projects.' }, { status: 500 });
  return NextResponse.json({ projects: data ?? [] });
}

export async function POST(request: Request) {
  const input = inputSchema.safeParse(await request.json().catch(() => undefined));
  if (!input.success) return NextResponse.json({ error: 'Project name must contain 2 to 120 characters.' }, { status: 400 });
  const context = await requireProjectOwner(); if ('error' in context) return context.error;
  const { data, error } = await context.admin.from('projects').insert({ owner_id: context.user.id, name: input.data.name, source_type: 'files', status: 'draft' }).select('id,name,source_type,branch,status,created_at').single();
  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Could not create project.' }, { status: 500 });
  return NextResponse.json({ project: data }, { status: 201 });
}

export async function DELETE(request: Request) {
  const input = deleteSchema.safeParse(await request.json().catch(() => undefined));
  if (!input.success) return NextResponse.json({ error: 'A valid project is required.' }, { status: 400 });
  const context = await requireProjectOwner(); if ('error' in context) return context.error;
  // The owner constraint is deliberate: an authenticated user can never delete another account's project.
  const { data, error } = await context.admin.from('projects').delete().eq('id', input.data.projectId).eq('owner_id', context.user.id).select('id').maybeSingle();
  if (error) return NextResponse.json({ error: 'Could not remove project.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Project not found or access denied.' }, { status: 404 });
  return NextResponse.json({ removedProjectId: data.id });
}
