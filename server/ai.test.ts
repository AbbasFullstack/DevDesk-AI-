import assert from 'node:assert/strict';
import test from 'node:test';
import { askDevDesk, buildModelAttemptSequence, buildModelCandidates, CEREBRAS_CHAT_ENDPOINT, DEV_DESK_IDENTITY, EMERGENCY_CHAT_ENDPOINT, GROQ_CHAT_ENDPOINT, VERCEL_AI_GATEWAY_CHAT_ENDPOINT, XAI_CHAT_ENDPOINT, hasUnresolvedToolCall, ProviderCapacityError, resetChatCapacityCooldownForTests } from './ai';
import { CURATED_FREE_OPENROUTER_FALLBACK_MODELS, env, GLM_PRIMARY_MODEL } from './env';

async function withMockedOpenRouter(responses: Array<Response | Error>, run: (models: string[]) => Promise<void>) {
  const originalFetch = globalThis.fetch;
  const originalEnv = { key: env.openRouterApiKey, model: env.openRouterModel, fallbacks: env.openRouterFallbackModels, timeout: env.openRouterTimeoutMs, groqKey: env.groqApiKey, groqModel: env.groqModel, groqTimeout: env.groqTimeoutMs, xaiKey: env.xaiApiKey, xaiModel: env.xaiModel, xaiTimeout: env.xaiTimeoutMs, cerebrasKey: env.cerebrasApiKey, cerebrasModel: env.cerebrasModel, cerebrasTimeout: env.cerebrasTimeoutMs };
  const models: string[] = [];
  env.openRouterApiKey = 'test-key';
  env.openRouterModel = 'z-ai/glm-5.2:free';
  env.openRouterFallbackModels = ['first-fallback:free', 'second-fallback:free', 'third-fallback:free'];
  env.openRouterTimeoutMs = 100;
  env.groqApiKey = '';
  env.xaiApiKey = '';
  env.cerebrasApiKey = '';
  resetChatCapacityCooldownForTests();
  globalThis.fetch = (async (_input, init) => {
    const request = JSON.parse(String(init?.body)) as { model: string };
    models.push(request.model);
    const response = responses.shift();
    if (!response) throw new Error('Unexpected model request.');
    if (response instanceof Error) throw response;
    return response;
  }) as typeof fetch;
  try {
    await run(models);
  } finally {
    globalThis.fetch = originalFetch;
    env.openRouterApiKey = originalEnv.key;
    env.openRouterModel = originalEnv.model;
    env.openRouterFallbackModels = originalEnv.fallbacks;
    env.openRouterTimeoutMs = originalEnv.timeout;
    env.groqApiKey = originalEnv.groqKey;
    env.groqModel = originalEnv.groqModel;
    env.groqTimeoutMs = originalEnv.groqTimeout;
    env.xaiApiKey = originalEnv.xaiKey;
    env.xaiModel = originalEnv.xaiModel;
    env.xaiTimeoutMs = originalEnv.xaiTimeout;
    env.cerebrasApiKey = originalEnv.cerebrasKey;
    env.cerebrasModel = originalEnv.cerebrasModel;
    env.cerebrasTimeoutMs = originalEnv.cerebrasTimeout;
    resetChatCapacityCooldownForTests();
  }
}

test('model fallback candidates retain priority and remove duplicates', () => {
  assert.deepEqual(
    buildModelCandidates('z-ai/glm-5.2:free', ['google/gemma-4-31b-it:free', 'z-ai/glm-5.2:free', 'openrouter/free']),
    ['z-ai/glm-5.2:free', 'google/gemma-4-31b-it:free', 'openrouter/free'],
  );
});

test('GLM 5.2 receives one bounded retry before other fallback models', () => {
  assert.deepEqual(
    buildModelAttemptSequence('z-ai/glm-5.2:free', ['first-fallback:free', 'second-fallback:free']),
    ['z-ai/glm-5.2:free', 'z-ai/glm-5.2:free', 'first-fallback:free', 'second-fallback:free'],
  );
});

test('OpenRouter free routing is prioritized immediately after the required GLM retry', () => {
  assert.deepEqual(
    buildModelAttemptSequence('z-ai/glm-5.2:free', ['first-fallback:free', 'openrouter/free', 'second-fallback:free']),
    ['z-ai/glm-5.2:free', 'z-ai/glm-5.2:free', 'openrouter/free', 'first-fallback:free', 'second-fallback:free'],
  );
});

test('DevDesk preserves GLM 5.2 first with 15-plus curated free fallback models', () => {
  const candidates = buildModelCandidates(GLM_PRIMARY_MODEL, [...CURATED_FREE_OPENROUTER_FALLBACK_MODELS]);
  assert.equal(env.openRouterModel, GLM_PRIMARY_MODEL);
  assert.equal(candidates[0], 'z-ai/glm-5.2:free');
  assert.equal(candidates.length, 17);
  assert.equal(candidates.includes('nvidia/nemotron-3.5-content-safety:free'), false);
  assert.equal(candidates.at(-1), 'openrouter/free');
});

test('DevDesk identity credits Abbas Hussain without claiming foundation-model training', () => {
  assert.match(DEV_DESK_IDENTITY, /DevDesk AI, created by Abbas Hussain/i);
  assert.match(DEV_DESK_IDENTITY, /Do not claim that Abbas Hussain trained the underlying foundation models/i);
});

test('unresolved model tool calls are rejected so routing can continue to another text model', () => {
  assert.equal(hasUnresolvedToolCall('<|tool_call_start|>[read_file(path="src/index.ts")]<|tool_call_end|>'), true);
  assert.equal(hasUnresolvedToolCall('Understanding\n\nThe function is defined in `src/index.ts`.'), false);
});

test('chat routing continues after provider, malformed-response, and unresolved-tool-call failures', async () => {
  await withMockedOpenRouter([
    new Response('provider unavailable', { status: 503 }),
    new Response('provider unavailable', { status: 503 }),
    new Response('not json', { status: 200 }),
    new Response(JSON.stringify({ choices: [{ message: { content: '<|tool_call_start|>read_file(path="src/a.ts")<|tool_call_end|>' } }] }), { status: 200 }),
    new Response(JSON.stringify({ model: 'third-fallback:free', choices: [{ message: { content: 'A verified fallback response.' } }] }), { status: 200 }),
  ], async (models) => {
    const answer = await askDevDesk([{ role: 'user', content: 'Test the fallback path.' }]);
    assert.equal(answer.text, 'A verified fallback response.');
    assert.equal(answer.model, 'third-fallback:free');
    assert.deepEqual(models, ['z-ai/glm-5.2:free', 'z-ai/glm-5.2:free', 'first-fallback:free', 'second-fallback:free', 'third-fallback:free']);
    assert.deepEqual(answer.attempts, ['z-ai/glm-5.2:free (503)', 'z-ai/glm-5.2:free (503)', 'first-fallback:free (invalid response)', 'second-fallback:free (unresolved tool call)']);
  });
});

test('chat routing returns GLM 5.2 output when its first attempt fails but its retry succeeds', async () => {
  await withMockedOpenRouter([
    new Response('provider warming up', { status: 503 }),
    new Response(JSON.stringify({ model: 'z-ai/glm-5.2:free', choices: [{ message: { content: 'Recovered through GLM retry.' } }] }), { status: 200 }),
  ], async (models) => {
    const answer = await askDevDesk([{ role: 'user', content: 'Retry the preferred model.' }]);
    assert.equal(answer.text, 'Recovered through GLM retry.');
    assert.equal(answer.model, 'z-ai/glm-5.2:free');
    assert.deepEqual(models, ['z-ai/glm-5.2:free', 'z-ai/glm-5.2:free']);
    assert.deepEqual(answer.attempts, ['z-ai/glm-5.2:free (503)']);
  });
});

test('chat routing keeps trying verified fallbacks after a model-specific 403 response', async () => {
  await withMockedOpenRouter([
    new Response('model unavailable', { status: 403 }),
    new Response('model unavailable', { status: 403 }),
    new Response(JSON.stringify({ model: 'first-fallback:free', choices: [{ message: { content: 'Recovered through fallback.' } }] }), { status: 200 }),
  ], async (models) => {
    const answer = await askDevDesk([{ role: 'user', content: 'Recover from an unavailable model.' }]);
    assert.equal(answer.text, 'Recovered through fallback.');
    assert.deepEqual(models, ['z-ai/glm-5.2:free', 'z-ai/glm-5.2:free', 'first-fallback:free']);
  });
});

test('GLM 5.2 skips its duplicate retry after a rate-limit response so an independent fallback can answer sooner', async () => {
  await withMockedOpenRouter([
    new Response(JSON.stringify({ error: { metadata: { provider_code: '429' } } }), { status: 429 }),
    new Response(JSON.stringify({ model: 'first-fallback:free', choices: [{ message: { content: 'Recovered without repeating a rate-limited primary.' } }] }), { status: 200 }),
  ], async (models) => {
    const answer = await askDevDesk([{ role: 'user', content: 'Recover after a GLM rate limit.' }]);
    assert.equal(answer.text, 'Recovered without repeating a rate-limited primary.');
    assert.deepEqual(models, ['z-ai/glm-5.2:free', 'first-fallback:free']);
    assert.deepEqual(answer.attempts, ['z-ai/glm-5.2:free (429 provider rate limit)']);
  });
});

test('a platform 429 activates a cooldown instead of multiplying one free-tier request across every model', async () => {
  await withMockedOpenRouter([
    new Response(JSON.stringify({ error: { metadata: { error_type: 'rate_limit_exceeded' } } }), { status: 429 }),
  ], async (models) => {
    const first = await askDevDesk([{ role: 'user', content: 'Handle a platform rate limit.' }]);
    const second = await askDevDesk([{ role: 'user', content: 'Do not consume another free-tier request.' }]);
    assert.equal(first.model, 'continuity/provider-capacity');
    assert.equal(second.model, 'continuity/provider-capacity');
    assert.deepEqual(models, ['z-ai/glm-5.2:free', 'gpt-oss-20b']);
    assert.deepEqual(second.attempts, ['OpenRouter platform rate-limit cooldown']);
  });
});

test('ordinary chat uses configured independent Groq fallback after the GLM-first OpenRouter chain is exhausted', async () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = { key: env.openRouterApiKey, model: env.openRouterModel, fallbacks: env.openRouterFallbackModels, timeout: env.openRouterTimeoutMs, groqKey: env.groqApiKey, groqModel: env.groqModel, groqTimeout: env.groqTimeoutMs };
  const requestedUrls: string[] = [];
  env.openRouterApiKey = 'openrouter-test-key';
  env.openRouterModel = 'z-ai/glm-5.2:free';
  env.openRouterFallbackModels = ['first-fallback:free', 'second-fallback:free', 'third-fallback:free'];
  env.openRouterTimeoutMs = 100;
  env.groqApiKey = 'groq-test-key';
  env.groqModel = 'groq-test-model';
  env.groqTimeoutMs = 100;
  globalThis.fetch = (async (input, init) => {
    const url = String(input); requestedUrls.push(url);
    if (url === GROQ_CHAT_ENDPOINT) {
      assert.equal(new Headers(init?.headers).get('authorization'), 'Bearer groq-test-key');
      return new Response(JSON.stringify({ model: 'groq-test-model', choices: [{ message: { content: 'Recovered through Groq.' } }] }), { status: 200 });
    }
    return new Response('provider unavailable', { status: 503 });
  }) as typeof fetch;
  try {
    const answer = await askDevDesk([{ role: 'user', content: 'Recover through independent provider.' }]);
    assert.equal(answer.text, 'Recovered through Groq.');
    assert.equal(answer.model, 'groq/groq-test-model');
    assert.equal(requestedUrls.filter((url) => url.includes('openrouter.ai')).length, 5);
    assert.equal(requestedUrls.at(-1), GROQ_CHAT_ENDPOINT);
  } finally {
    globalThis.fetch = originalFetch;
    env.openRouterApiKey = originalEnv.key;
    env.openRouterModel = originalEnv.model;
    env.openRouterFallbackModels = originalEnv.fallbacks;
    env.openRouterTimeoutMs = originalEnv.timeout;
    env.groqApiKey = originalEnv.groqKey;
    env.groqModel = originalEnv.groqModel;
    env.groqTimeoutMs = originalEnv.groqTimeout;
  }
});

test('ordinary chat tries configured xAI Grok before Groq after the GLM-first OpenRouter chain is exhausted', async () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = { key: env.openRouterApiKey, model: env.openRouterModel, fallbacks: env.openRouterFallbackModels, timeout: env.openRouterTimeoutMs, groqKey: env.groqApiKey, groqModel: env.groqModel, groqTimeout: env.groqTimeoutMs, xaiKey: env.xaiApiKey, xaiModel: env.xaiModel, xaiTimeout: env.xaiTimeoutMs };
  const requestedUrls: string[] = [];
  env.openRouterApiKey = 'openrouter-test-key';
  env.openRouterModel = 'z-ai/glm-5.2:free';
  env.openRouterFallbackModels = ['first-fallback:free', 'second-fallback:free', 'third-fallback:free'];
  env.openRouterTimeoutMs = 100;
  env.xaiApiKey = 'xai-test-key';
  env.xaiModel = 'grok-test-model';
  env.xaiTimeoutMs = 100;
  env.groqApiKey = 'groq-test-key';
  globalThis.fetch = (async (input, init) => {
    const url = String(input); requestedUrls.push(url);
    if (url === XAI_CHAT_ENDPOINT) {
      assert.equal(new Headers(init?.headers).get('authorization'), 'Bearer xai-test-key');
      return new Response(JSON.stringify({ model: 'grok-test-model', choices: [{ message: { content: 'Recovered through xAI Grok.' } }] }), { status: 200 });
    }
    return new Response('provider unavailable', { status: 503 });
  }) as typeof fetch;
  try {
    const answer = await askDevDesk([{ role: 'user', content: 'Recover through xAI Grok.' }]);
    assert.equal(answer.text, 'Recovered through xAI Grok.');
    assert.equal(answer.model, 'xai/grok-test-model');
    assert.equal(requestedUrls.filter((url) => url.includes('openrouter.ai')).length, 5);
    assert.equal(requestedUrls.at(-1), XAI_CHAT_ENDPOINT);
    assert.equal(requestedUrls.includes(GROQ_CHAT_ENDPOINT), false);
  } finally {
    globalThis.fetch = originalFetch;
    env.openRouterApiKey = originalEnv.key;
    env.openRouterModel = originalEnv.model;
    env.openRouterFallbackModels = originalEnv.fallbacks;
    env.openRouterTimeoutMs = originalEnv.timeout;
    env.groqApiKey = originalEnv.groqKey;
    env.groqModel = originalEnv.groqModel;
    env.groqTimeoutMs = originalEnv.groqTimeout;
    env.xaiApiKey = originalEnv.xaiKey;
    env.xaiModel = originalEnv.xaiModel;
    env.xaiTimeoutMs = originalEnv.xaiTimeout;
  }
});

test('ordinary chat tries configured Cerebras after xAI failure and before Groq', async () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = { key: env.openRouterApiKey, model: env.openRouterModel, fallbacks: env.openRouterFallbackModels, timeout: env.openRouterTimeoutMs, groqKey: env.groqApiKey, groqModel: env.groqModel, groqTimeout: env.groqTimeoutMs, xaiKey: env.xaiApiKey, xaiModel: env.xaiModel, xaiTimeout: env.xaiTimeoutMs, cerebrasKey: env.cerebrasApiKey, cerebrasModel: env.cerebrasModel, cerebrasTimeout: env.cerebrasTimeoutMs };
  const requestedUrls: string[] = [];
  const cerebrasRequests: Array<{ model: string; reasoning_effort?: string }> = [];
  env.openRouterApiKey = 'openrouter-test-key';
  env.openRouterModel = 'z-ai/glm-5.2:free';
  env.openRouterFallbackModels = ['first-fallback:free', 'second-fallback:free', 'third-fallback:free'];
  env.openRouterTimeoutMs = 100;
  env.xaiApiKey = 'xai-test-key';
  env.xaiModel = 'grok-test-model';
  env.xaiTimeoutMs = 100;
  env.cerebrasApiKey = 'cerebras-test-key';
  env.cerebrasModel = 'cerebras-test-model';
  env.cerebrasTimeoutMs = 100;
  env.groqApiKey = 'groq-test-key';
  globalThis.fetch = (async (input, init) => {
    const url = String(input); requestedUrls.push(url);
    if (url === XAI_CHAT_ENDPOINT) return new Response('xAI unavailable', { status: 503 });
    if (url === CEREBRAS_CHAT_ENDPOINT) {
      assert.equal(new Headers(init?.headers).get('authorization'), 'Bearer cerebras-test-key');
      cerebrasRequests.push(JSON.parse(String(init?.body)) as { model: string; reasoning_effort?: string });
      return new Response(JSON.stringify({ model: 'cerebras-test-model', choices: [{ message: { content: 'Recovered through Cerebras.' } }] }), { status: 200 });
    }
    return new Response('provider unavailable', { status: 503 });
  }) as typeof fetch;
  try {
    const answer = await askDevDesk([{ role: 'user', content: 'Recover through Cerebras.' }]);
    assert.equal(answer.text, 'Recovered through Cerebras.');
    assert.equal(answer.model, 'cerebras/cerebras-test-model');
    assert.equal(requestedUrls.filter((url) => url.includes('openrouter.ai')).length, 5);
    assert.equal(requestedUrls.at(-1), CEREBRAS_CHAT_ENDPOINT);
    assert.equal(requestedUrls.includes(GROQ_CHAT_ENDPOINT), false);
    assert.equal(cerebrasRequests.length, 1);
    assert.equal(cerebrasRequests[0]?.model, 'cerebras-test-model');
    assert.equal(cerebrasRequests[0]?.reasoning_effort, 'low');
  } finally {
    globalThis.fetch = originalFetch;
    env.openRouterApiKey = originalEnv.key;
    env.openRouterModel = originalEnv.model;
    env.openRouterFallbackModels = originalEnv.fallbacks;
    env.openRouterTimeoutMs = originalEnv.timeout;
    env.groqApiKey = originalEnv.groqKey;
    env.groqModel = originalEnv.groqModel;
    env.groqTimeoutMs = originalEnv.groqTimeout;
    env.xaiApiKey = originalEnv.xaiKey;
    env.xaiModel = originalEnv.xaiModel;
    env.xaiTimeoutMs = originalEnv.xaiTimeout;
    env.cerebrasApiKey = originalEnv.cerebrasKey;
    env.cerebrasModel = originalEnv.cerebrasModel;
    env.cerebrasTimeoutMs = originalEnv.cerebrasTimeout;
  }
});

test('chat returns the bounded no-key emergency response only after the GLM-first OpenRouter chain is exhausted', async () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = { key: env.openRouterApiKey, model: env.openRouterModel, fallbacks: env.openRouterFallbackModels, timeout: env.openRouterTimeoutMs };
  const requestedUrls: string[] = [];
  const emergencyHeaders: Headers[] = [];
  env.openRouterApiKey = 'test-key';
  env.openRouterModel = 'z-ai/glm-5.2:free';
  env.openRouterFallbackModels = ['first-fallback:free', 'second-fallback:free', 'third-fallback:free'];
  env.openRouterTimeoutMs = 100;
  globalThis.fetch = (async (input, init) => {
    const url = String(input);
    requestedUrls.push(url);
    if (url === EMERGENCY_CHAT_ENDPOINT) {
      emergencyHeaders.push(new Headers(init?.headers));
      return new Response(JSON.stringify({ model: 'gpt-oss-20b', choices: [{ message: { content: 'Emergency chat recovery.' } }] }), { status: 200 });
    }
    return new Response('provider unavailable', { status: 503 });
  }) as typeof fetch;
  try {
    const answer = await askDevDesk([{ role: 'user', content: 'Recover from a full provider outage.' }]);
    assert.equal(answer.text, 'Emergency chat recovery.');
    assert.equal(answer.model, 'emergency/gpt-oss-20b');
    assert.equal(requestedUrls.filter((url) => url.includes('openrouter.ai')).length, 5);
    assert.equal(requestedUrls.at(-1), EMERGENCY_CHAT_ENDPOINT);
    assert.equal(emergencyHeaders[0]?.has('authorization'), false);
  } finally {
    globalThis.fetch = originalFetch;
    env.openRouterApiKey = originalEnv.key;
    env.openRouterModel = originalEnv.model;
    env.openRouterFallbackModels = originalEnv.fallbacks;
    env.openRouterTimeoutMs = originalEnv.timeout;
  }
});

test('ordinary chat can recover through the Vercel AI Gateway OIDC fallback after all existing providers fail', async () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = { key: env.openRouterApiKey, model: env.openRouterModel, fallbacks: env.openRouterFallbackModels, timeout: env.openRouterTimeoutMs, groqKey: env.groqApiKey, xaiKey: env.xaiApiKey, cerebrasKey: env.cerebrasApiKey, gatewayKey: env.aiGatewayApiKey, oidcToken: env.vercelOidcToken, gatewayModel: env.aiGatewayModel, gatewayTimeout: env.aiGatewayTimeoutMs };
  const requestedUrls: string[] = [];
  env.openRouterApiKey = 'openrouter-test-key';
  env.openRouterModel = 'z-ai/glm-5.2:free';
  env.openRouterFallbackModels = ['first-fallback:free', 'second-fallback:free', 'third-fallback:free'];
  env.openRouterTimeoutMs = 100;
  env.groqApiKey = '';
  env.xaiApiKey = '';
  env.cerebrasApiKey = '';
  env.aiGatewayApiKey = '';
  env.vercelOidcToken = '';
  env.aiGatewayModel = 'openai/gpt-oss-20b';
  env.aiGatewayTimeoutMs = 100;
  globalThis.fetch = (async (input, init) => {
    const url = String(input); requestedUrls.push(url);
    if (url === VERCEL_AI_GATEWAY_CHAT_ENDPOINT) {
      assert.equal(new Headers(init?.headers).get('authorization'), 'Bearer runtime-vercel-oidc-test-token');
      const request = JSON.parse(String(init?.body)) as { model: string; reasoning_effort?: string };
      assert.equal(request.model, 'openai/gpt-oss-20b');
      assert.equal(request.reasoning_effort, 'low');
      return new Response(JSON.stringify({ model: 'openai/gpt-oss-20b', choices: [{ message: { content: 'Recovered through Vercel AI Gateway.' } }] }), { status: 200 });
    }
    return new Response('provider unavailable', { status: 503 });
  }) as typeof fetch;
  try {
    const answer = await askDevDesk([{ role: 'user', content: 'Recover through Vercel AI Gateway.' }], { vercelOidcToken: 'runtime-vercel-oidc-test-token' });
    assert.equal(answer.text, 'Recovered through Vercel AI Gateway.');
    assert.equal(answer.model, 'vercel-ai-gateway/openai/gpt-oss-20b');
    assert.equal(requestedUrls.filter((url) => url.includes('openrouter.ai')).length, 5);
    assert.deepEqual(requestedUrls.slice(-2), [EMERGENCY_CHAT_ENDPOINT, VERCEL_AI_GATEWAY_CHAT_ENDPOINT]);
  } finally {
    globalThis.fetch = originalFetch;
    env.openRouterApiKey = originalEnv.key;
    env.openRouterModel = originalEnv.model;
    env.openRouterFallbackModels = originalEnv.fallbacks;
    env.openRouterTimeoutMs = originalEnv.timeout;
    env.groqApiKey = originalEnv.groqKey;
    env.xaiApiKey = originalEnv.xaiKey;
    env.cerebrasApiKey = originalEnv.cerebrasKey;
    env.aiGatewayApiKey = originalEnv.gatewayKey;
    env.vercelOidcToken = originalEnv.oidcToken;
    env.aiGatewayModel = originalEnv.gatewayModel;
    env.aiGatewayTimeoutMs = originalEnv.gatewayTimeout;
  }
});

test('chat routing returns transparent continuity guidance instead of a retryable busy failure after every external provider fails', async () => {
  await withMockedOpenRouter([
    new Response('unavailable', { status: 503 }),
    new Response('unavailable', { status: 503 }),
    new Response('unavailable', { status: 503 }),
    new Response('unavailable', { status: 503 }),
    new Response('unavailable', { status: 503 }),
  ], async () => {
    const answer = await askDevDesk([{ role: 'user', content: 'Write a TypeScript function while providers are unavailable.' }]);
    assert.equal(answer.model, 'continuity/provider-capacity');
    assert.match(answer.text, /will not invent unverified code/i);
  });
});

test('source-backed callers can reject capacity continuity without exposing the imported prompt as an analysis result', async () => {
  await withMockedOpenRouter([
    new Response('unavailable', { status: 503 }),
    new Response('unavailable', { status: 503 }),
    new Response('unavailable', { status: 503 }),
    new Response('unavailable', { status: 503 }),
    new Response('unavailable', { status: 503 }),
  ], async () => {
    const importedMarker = 'PRIVATE_REPOSITORY_SOURCE_MARKER';
    await assert.rejects(
      askDevDesk(
        [{ role: 'user', content: `Analyze this imported context: ${importedMarker}` }],
        { allowEmergencyFallback: false, allowIndependentFallback: false, allowContinuityResponse: false },
      ),
      (issue: unknown) => {
        assert.ok(issue instanceof ProviderCapacityError);
        assert.doesNotMatch(issue.message, new RegExp(importedMarker));
        return true;
      },
    );
  });
});
