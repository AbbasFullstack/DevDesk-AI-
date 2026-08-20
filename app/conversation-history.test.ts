import assert from 'node:assert/strict';
import test from 'node:test';
import { upsertConversation } from './conversation-history';

test('conversation history retains independent chats and updates only the active entry', () => {
  const first = { id: 'first', messages: ['first prompt'], updatedAt: 100 };
  const second = { id: 'second', messages: ['second prompt'], updatedAt: 200 };
  const third = { id: 'third', messages: ['third prompt'], updatedAt: 300 };
  const saved = upsertConversation(upsertConversation([first], second), third);
  assert.deepEqual(saved.map((conversation) => conversation.id), ['third', 'second', 'first']);
  const updatedSecond = upsertConversation(saved, { ...second, messages: ['second prompt', 'second reply'], updatedAt: 400 });
  assert.deepEqual(updatedSecond.map((conversation) => conversation.id), ['second', 'third', 'first']);
  assert.deepEqual(updatedSecond[0].messages, ['second prompt', 'second reply']);
});

test('conversation history uses a generous bounded limit without discarding a new user chat early', () => {
  const existing = Array.from({ length: 30 }, (_, index) => ({ id: String(index), messages: [index], updatedAt: index }));
  const saved = upsertConversation(existing, { id: 'new', messages: [99], updatedAt: 99 }, 30);
  assert.equal(saved.length, 30);
  assert.equal(saved[0].id, 'new');
});

test('conversation history retains a custom title when new turns update the same chat', () => {
  const named = { id: 'architecture', messages: ['Explain a service boundary'], updatedAt: 100, title: 'Backend architecture notes' };
  const saved = upsertConversation([named], { id: 'architecture', messages: ['Explain a service boundary', 'Use explicit interfaces.'], updatedAt: 200, title: named.title });
  assert.equal(saved[0].title, 'Backend architecture notes');
  assert.deepEqual(saved[0].messages, ['Explain a service boundary', 'Use explicit interfaces.']);
});
