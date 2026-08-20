import assert from 'node:assert/strict';
import test from 'node:test';
import { createPreviewDocument, splitFencedCode } from './AiMessageContent';

test('AI response renderer preserves prose and extracts fenced code with its language', () => {
  assert.deepEqual(
    splitFencedCode('Build this:\n```html\n<button>Run</button>\n```\nCopy it safely.'),
    [
      { type: 'text', value: 'Build this:\n' },
      { type: 'code', language: 'html', value: '<button>Run</button>' },
      { type: 'text', value: '\nCopy it safely.' },
    ],
  );
});

test('AI response renderer preserves an unfenced answer as readable text', () => {
  assert.deepEqual(splitFencedCode('Explain the architecture first.'), [{ type: 'text', value: 'Explain the architecture first.' }]);
});

test('AI code preview creates an isolated runnable document only for supported languages', () => {
  assert.match(createPreviewDocument('<h1>Hello</h1>', 'html'), /<h1>Hello<\/h1>/);
  assert.match(createPreviewDocument('document.querySelector("#app").textContent = "Ready";', 'javascript'), /<script>/);
  assert.equal(createPreviewDocument('SELECT * FROM projects', 'sql'), '');
});
