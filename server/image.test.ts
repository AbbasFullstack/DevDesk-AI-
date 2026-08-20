import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_OPENROUTER_IMAGE_MODEL, imageGenerationPayload, parseImageGenerationInput } from './image';

test('image generation accepts bounded prompts and supported aspect ratios', () => {
  assert.deepEqual(parseImageGenerationInput({ prompt: 'A carbon-glass calculator landing page', aspectRatio: '9:16' }), {
    prompt: 'A carbon-glass calculator landing page',
    aspectRatio: '9:16',
  });
});

test('image generation rejects invalid prompts and unsupported dimensions', () => {
  assert.throws(() => parseImageGenerationInput({ prompt: 'x' }), /at least 3 characters/);
  assert.throws(() => parseImageGenerationInput({ prompt: 'A valid prompt', aspectRatio: '100:1' }), /supported image aspect ratio/);
});

test('image generation keeps the configured server-side image model out of browser input', () => {
  assert.deepEqual(imageGenerationPayload({ prompt: 'Neon developer workspace', aspectRatio: '1:1' }, DEFAULT_OPENROUTER_IMAGE_MODEL), {
    model: DEFAULT_OPENROUTER_IMAGE_MODEL,
    prompt: 'Neon developer workspace',
    aspect_ratio: '1:1',
    n: 1,
  });
});
