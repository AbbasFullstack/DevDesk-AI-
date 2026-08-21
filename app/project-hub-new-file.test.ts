import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('review-gated project commits expose explicit safe new-file staging without a SHA', () => {
  const source = readFileSync(new URL('./components/ProjectHub.tsx', import.meta.url), 'utf8');

  assert.match(source, /Create new file/);
  assert.match(source, /New safe source file path/);
  assert.match(source, /createNewFile/);
  assert.match(source, /\.\.\.\(fileSha \? \{ sha: fileSha \} : \{\}\)/);
  assert.match(source, /!fileSha && !createNewFile/);
});
