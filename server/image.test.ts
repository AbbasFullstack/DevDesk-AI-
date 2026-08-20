import assert from 'node:assert/strict';
import test from 'node:test';
import { browserImageFallbackUrl, freeImageAttempts, freeImageUrl, parseImageGenerationInput, safeImageSeed } from './image';

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

test('free image generation builds an encoded server-side provider URL with bounded dimensions', () => {
  const url = freeImageUrl({ prompt: 'Neon developer workspace & graphs', aspectRatio: '9:16' }, 42);
  assert.match(url, /^https:\/\/image\.pollinations\.ai\/prompt\/Neon%20developer%20workspace%20%26%20graphs\?/);
  assert.match(url, /width=504/);
  assert.match(url, /height=896/);
  assert.match(url, /seed=42/);
  assert.match(url, /nologo=true/);
  assert.match(url, /model=sana/);
});

test('free image generation tries the currently advertised Sana model before the verified Flux fallback', () => {
  const attempts = freeImageAttempts({ prompt: 'A reliable developer image generator', aspectRatio: '1:1' }, 42);
  assert.deepEqual(attempts.map((attempt) => attempt.model), ['sana', 'flux']);
  assert.match(attempts[1]?.url ?? '', /seed=43/);
  assert.match(attempts[1]?.url ?? '', /model=flux/);
});

test('the final browser delivery fallback remains server-generated, encoded, and model-agnostic', () => {
  const url = browserImageFallbackUrl({ prompt: 'Carbon glass & glow', aspectRatio: '16:9' }, 99);
  assert.match(url, /^https:\/\/image\.pollinations\.ai\/prompt\/Carbon%20glass%20%26%20glow\?/);
  assert.match(url, /width=896/);
  assert.match(url, /height=504/);
  assert.match(url, /seed=99/);
  assert.doesNotMatch(url, /model=/);
});

test('image seeds are normalized to a positive provider-safe integer range', () => {
  assert.equal(safeImageSeed(42), 42);
  assert.equal(safeImageSeed(0), 1);
  assert.ok(safeImageSeed(Date.now()) > 0);
  assert.ok(safeImageSeed(Date.now()) < 2_147_483_647);
  assert.equal(safeImageSeed(-42), 42);
});
