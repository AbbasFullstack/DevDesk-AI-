import assert from 'node:assert/strict';
import test from 'node:test';

test('chat history metadata feature flag is enabled for the deployed configuration', () => {
  assert.equal(process.env.DEV_DESK_CHAT_HISTORY_METADATA_ENABLED, 'true');
});
