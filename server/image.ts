export const FREE_IMAGE_PROVIDER_LABEL = 'Pollinations free image endpoint';

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

export function freeImageUrl(input: ImageGenerationInput, seed: number) {
  const dimensions: Record<ImageGenerationInput['aspectRatio'], [string, string]> = {
    '1:1': ['768', '768'],
    '4:3': ['768', '576'],
    '3:4': ['576', '768'],
    '16:9': ['896', '504'],
    '9:16': ['504', '896'],
  };
  const [width, height] = dimensions[input.aspectRatio];
  const query = new URLSearchParams({ width, height, seed: String(seed), nologo: 'true', model: 'flux' });
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(input.prompt)}?${query.toString()}`;
}
