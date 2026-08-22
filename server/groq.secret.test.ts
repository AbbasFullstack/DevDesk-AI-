import assert from 'node:assert/strict';
import test from 'node:test';

test('configured Groq key authorizes a lightweight server-side models request', async () => {
  const key = process.env.GROQ_API_KEY;
  assert.ok(key, 'GROQ_API_KEY must be available only in the server environment');

  const response = await fetch('https://api.groq.com/openai/v1/models', {
    headers: { Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(10_000),
  });

  assert.equal(response.ok, true, `Groq models endpoint should authorize the configured server key (HTTP ${response.status})`);
});
