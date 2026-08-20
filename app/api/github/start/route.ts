import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { githubAuthorizeUrl } from '@/server/github';
import { env } from '@/server/env';

export async function GET(request: Request) {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    return NextResponse.json({ error: 'GitHub OAuth is not configured.' }, { status: 503 });
  }
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in before connecting GitHub.' }, { status: 401 });
  const state = crypto.randomBytes(24).toString('base64url');
  const response = NextResponse.redirect(githubAuthorizeUrl(state));
  response.cookies.set('devdesk_github_oauth_state', state, { httpOnly: true, secure: env.appUrl.startsWith('https://'), sameSite: 'lax', maxAge: 600, path: '/' });
  return response;
}
