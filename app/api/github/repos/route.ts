import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/server/supabase';
import { decryptToken, githubApi } from '@/server/github';

export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return NextResponse.json({ error: 'Supabase auth is not configured.' }, { status: 503 });
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: 'Supabase server credentials are not configured.' }, { status: 503 });
  const { data: connection, error } = await admin.from('github_connections').select('encrypted_access_token, github_login').eq('user_id', user.id).maybeSingle();
  if (error) return NextResponse.json({ error: 'Could not load GitHub connection.' }, { status: 500 });
  if (!connection) return NextResponse.json({ connected: false, repositories: [] });
  try {
    const token = decryptToken(connection.encrypted_access_token);
    const repos = await githubApi<Array<{ id: number; full_name: string; name: string; private: boolean; default_branch: string; html_url: string; description: string | null; updated_at: string }>>(token, '/user/repos?sort=updated&per_page=50');
    return NextResponse.json({ connected: true, login: connection.github_login, repositories: repos.map((repo) => ({ id: repo.id, name: repo.name, fullName: repo.full_name, private: repo.private, defaultBranch: repo.default_branch, url: repo.html_url, description: repo.description, updatedAt: repo.updated_at })) });
  } catch {
    return NextResponse.json({ error: 'GitHub authorization expired or was revoked. Reconnect GitHub.' }, { status: 401 });
  }
}
