import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/server/supabase';
import { encryptToken, exchangeGithubCode, githubApi } from '@/server/github';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const response = NextResponse.redirect(new URL('/?github=connected', url.origin));
  const cookieState = request.headers.get('cookie')?.match(/(?:^|; )devdesk_github_oauth_state=([^;]+)/)?.[1];
  response.cookies.delete('devdesk_github_oauth_state');
  if (!user || !code || !state || !cookieState || state !== decodeURIComponent(cookieState)) return NextResponse.redirect(new URL('/?github=error', url.origin));
  try {
    const token = await exchangeGithubCode(code);
    const profile = await githubApi<{ id: number; login: string; avatar_url: string }>(token, '/user');
    const admin = getSupabaseAdmin();
    if (!admin) throw new Error('Supabase server credentials are not configured.');
    const { error } = await admin.from('github_connections').upsert({ user_id: user.id, github_user_id: String(profile.id), github_login: profile.login, avatar_url: profile.avatar_url, encrypted_access_token: encryptToken(token), updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) throw error;
    return response;
  } catch {
    return NextResponse.redirect(new URL('/?github=error', url.origin));
  }
}
