export const DEFAULT_OPENROUTER_IMAGE_MODEL = 'google/gemini-2.5-flash-image';

export type ImageGenerationInput = {
  prompt: string;
  aspectRatio: '1:1' | '4:3' | '3:4' | '16:9' | '9:16';
};

export function parseImageGenerationInput(value: unknown): ImageGenerationInput {
  if (!value || typeof value !== 'object') throw new Error('Provide an image prompt.');
  const body = value as Record<string, unknown>;
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  if (prompt.length < 3) throw new Error('Describe the image in at least 3 characters.');
  if (prompt.length > 1_000) throw new Error('Keep the image prompt under 1,000 characters.');
  const aspectRatio = typeof body.aspectRatio === 'string' ? body.aspectRatio : '1:1';
  if (!['1:1', '4:3', '3:4', '16:9', '9:16'].includes(aspectRatio)) throw new Error('Choose a supported image aspect ratio.');
  return { prompt, aspectRatio: aspectRatio as ImageGenerationInput['aspectRatio'] };
}

export function imageGenerationPayload(input: ImageGenerationInput, model = process.env.OPENROUTER_IMAGE_MODEL || DEFAULT_OPENROUTER_IMAGE_MODEL) {
  return {
    model,
    prompt: input.prompt,
    aspect_ratio: input.aspectRatio,
    n: 1,
  };
}
