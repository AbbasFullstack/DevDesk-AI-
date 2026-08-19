import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/server/supabase';

const inputSchema = z.object({ name: z.string().trim().min(2).max(120) });

export async function POST(request: Request) {
  const input = inputSchema.safeParse(await request.json().catch(() => undefined));
  if (!input.success) return NextResponse.json({ error: 'Project name must contain 2 to 120 characters.' }, { status: 400 });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return NextResponse.json({ error: 'Supabase authentication is not configured.' }, { status: 503 });
  const supabase = await createSupabaseServerClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const admin = getSupabaseAdmin(); if (!admin) return NextResponse.json({ error: 'Server database credentials are not configured.' }, { status: 503 });
  const { data, error } = await admin.from('projects').insert({ owner_id: user.id, name: input.data.name, source_type: 'files', status: 'draft' }).select('id,name,source_type,branch,status,created_at').single();
  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Could not create project.' }, { status: 500 });
  return NextResponse.json({ project: data }, { status: 201 });
}
