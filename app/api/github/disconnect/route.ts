import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/server/supabase';

export async function POST() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return NextResponse.json({ error: 'Supabase auth is not configured.' }, { status: 503 });
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Supabase server credentials are not configured.' }, { status: 503 });

  const { error } = await admin.from('github_connections').delete().eq('user_id', user.id);
  if (error) return NextResponse.json({ error: 'Could not disconnect GitHub. Please try again.' }, { status: 500 });
  return NextResponse.json({ disconnected: true });
}
