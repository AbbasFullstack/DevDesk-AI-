import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { freeImageUrl, parseImageGenerationInput } from '@/server/image';

export const maxDuration = 60;

export async function POST(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return NextResponse.json({ error: 'Supabase auth is not configured.' }, { status: 503 });
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in to generate an image.' }, { status: 401 });
  try {
    const input = parseImageGenerationInput(await request.json());
    const upstream = await fetch(freeImageUrl(input, Date.now()), { cache: 'no-store', signal: AbortSignal.timeout(55_000) });
    const mediaType = upstream.headers.get('content-type')?.split(';')[0] ?? '';
    if (!upstream.ok || !/^image\/(png|jpeg|webp)$/.test(mediaType)) return NextResponse.json({ error: 'The free image service is busy. Please retry in a moment.' }, { status: 502 });
    const bytes = Buffer.from(await upstream.arrayBuffer());
    if (!bytes.length || bytes.length > 5_000_000) return NextResponse.json({ error: 'The free image service returned an unsafe image size. Please retry.' }, { status: 502 });
    return NextResponse.json({ imageDataUrl: `data:${mediaType};base64,${bytes.toString('base64')}`, mediaType, provider: 'free' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Image generation could not start.';
    const status = /prompt|aspect ratio|characters/.test(message) ? 400 : 502;
    return NextResponse.json({ error: status === 400 ? message : 'The free image service could not complete this request. Please retry.' }, { status });
  }
}
