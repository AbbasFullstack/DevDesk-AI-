import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { browserImageFallbackUrl, freeImageAttempts, parseImageGenerationInput } from '@/server/image';

export const maxDuration = 60;

export async function POST(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return NextResponse.json({ error: 'Supabase auth is not configured.' }, { status: 503 });
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in to generate an image.' }, { status: 401 });
  try {
    const input = parseImageGenerationInput(await request.json());
    const attemptedModels: string[] = [];
    for (const attempt of freeImageAttempts(input, Date.now())) {
      attemptedModels.push(attempt.model);
      try {
        const upstream = await fetch(attempt.url, { cache: 'no-store', signal: AbortSignal.timeout(24_000) });
        const mediaType = upstream.headers.get('content-type')?.split(';')[0] ?? '';
        if (!upstream.ok || !/^image\/(png|jpeg|webp)$/.test(mediaType)) continue;
        const bytes = Buffer.from(await upstream.arrayBuffer());
        if (!bytes.length || bytes.length > 5_000_000) continue;
        return NextResponse.json({ imageDataUrl: `data:${mediaType};base64,${bytes.toString('base64')}`, mediaType, provider: `pollinations/${attempt.model}`, fallbackUsed: attemptedModels.length > 1 });
      } catch {
        // A busy/free provider can fail transiently. Try the next verified model.
      }
    }
    return NextResponse.json({
      imageUrl: browserImageFallbackUrl(input, Date.now()),
      provider: 'pollinations/browser-delivery',
      fallbackUsed: true,
      browserFallback: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Image generation could not start.';
    const status = /prompt|aspect ratio|characters/.test(message) ? 400 : 502;
    return NextResponse.json({ error: status === 400 ? message : 'The free image service could not complete this request. Please retry.' }, { status });
  }
}
