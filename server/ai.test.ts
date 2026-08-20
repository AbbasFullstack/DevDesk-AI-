import assert from 'node:assert/strict';
import test from 'node:test';
import { buildModelCandidates, DEV_DESK_IDENTITY, hasUnresolvedToolCall } from './ai';

test('model fallback candidates retain priority and remove duplicates', () => {
  assert.deepEqual(
    buildModelCandidates('z-ai/glm-5.2:free', ['google/gemma-4-31b-it:free', 'z-ai/glm-5.2:free', 'openrouter/free']),
    ['z-ai/glm-5.2:free', 'google/gemma-4-31b-it:free', 'openrouter/free'],
  );
});

test('DevDesk identity credits Abbas Hussain without claiming foundation-model training', () => {
  assert.match(DEV_DESK_IDENTITY, /DevDesk AI, created by Abbas Hussain/i);
  assert.match(DEV_DESK_IDENTITY, /Do not claim that Abbas Hussain trained the underlying foundation models/i);
});

test('unresolved model tool calls are rejected so routing can continue to another text model', () => {
  assert.equal(hasUnresolvedToolCall('<|tool_call_start|>[read_file(path="src/index.ts")]<|tool_call_end|>'), true);
  assert.equal(hasUnresolvedToolCall('Understanding\n\nThe function is defined in `src/index.ts`.'), false);
});
