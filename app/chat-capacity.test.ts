import assert from 'node:assert/strict';
import test from 'node:test';
import { CHAT_CAPACITY_COOLDOWN_SECONDS, cooldownUntilFromResponse, remainingCooldownSeconds } from './chat-capacity';

test('capacity cooldown accepts only bounded numeric retry instructions', () => {
  assert.equal(cooldownUntilFromResponse(20, 1_000), 21_000);
  assert.equal(cooldownUntilFromResponse(999, 1_000), (CHAT_CAPACITY_COOLDOWN_SECONDS * 1_000) + 1_000);
  assert.equal(cooldownUntilFromResponse('60', 1_000), 0);
});

test('capacity cooldown reports whole remaining seconds without negatives', () => {
  assert.equal(remainingCooldownSeconds(61_001, 1_000), 61);
  assert.equal(remainingCooldownSeconds(1_000, 1_000), 0);
  assert.equal(remainingCooldownSeconds(999, 1_000), 0);
});
