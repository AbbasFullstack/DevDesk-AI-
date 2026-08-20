import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { env } from '@/server/env';
import { imageGenerationPayload, parseImageGenerationInput } from '@/server/image';

export const maxDuration = 60;

export async function POST(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return NextResponse.json({ error: 'Supabase auth is not configured.' }, { status: 503 });
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in to generate an image.' }, { status: 401 });
  if (!env.openRouterApiKey) return NextResponse.json({ error: 'Image generation is not configured on the server.' }, { status: 503 });

  try {
    const input = parseImageGenerationInput(await request.json());
    const payload = imageGenerationPayload(input, env.openRouterImageModel);
    const upstream = await fetch('https://openrouter.ai/api/v1/images', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': env.appUrl,
        'X-Title': 'DevDesk AI',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(55_000),
    });
    const result = await upstream.json().catch(() => null) as { data?: Array<{ b64_json?: string; media_type?: string }>; error?: { message?: string } } | null;
    const image = result?.data?.[0];
    if (!upstream.ok || !image?.b64_json) return NextResponse.json({ error: 'The image provider could not complete this request. Please retry with a simpler prompt.' }, { status: 502 });
    if (image.b64_json.length > 7_000_000) return NextResponse.json({ error: 'The generated image was too large to display safely. Please retry.' }, { status: 502 });
    const mediaType = image.media_type && /^image\/(png|jpeg|webp)$/.test(image.media_type) ? image.media_type : 'image/png';
    return NextResponse.json({ imageDataUrl: `data:${mediaType};base64,${image.b64_json}`, mediaType, model: payload.model });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Image generation could not start.';
    const status = /prompt|aspect ratio|characters/.test(message) ? 400 : 502;
    return NextResponse.json({ error: status === 400 ? message : 'Image generation could not complete. Please retry.' }, { status });
  }
}
