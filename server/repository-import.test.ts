import assert from 'node:assert/strict';
import test from 'node:test';
import { MAX_SOURCE_FILE_BYTES, parseRepositoryFullName, prepareApprovedCommit, selectSafeTreeEntries } from './repository-import';

test('repository names require a strict owner/repository shape', () => {
  assert.deepEqual(parseRepositoryFullName('Muneeza2071/DevDeskAI'), { owner: 'Muneeza2071', repository: 'DevDeskAI' });
  assert.throws(() => parseRepositoryFullName('../private'));
  assert.throws(() => parseRepositoryFullName('owner/repo/extra'));
});

test('tree selection excludes unsafe, ignored, non-blob, and oversized entries before download', () => {
  const entries = selectSafeTreeEntries([
    { path: 'src/app.ts', type: 'blob', sha: 'one', size: 90 },
    { path: 'node_modules/pkg/index.js', type: 'blob', sha: 'two', size: 90 },
    { path: '../secrets.ts', type: 'blob', sha: 'three', size: 90 },
    { path: 'assets/bundle.bin', type: 'blob', sha: 'four', size: MAX_SOURCE_FILE_BYTES + 1 },
    { path: 'src', type: 'tree', sha: 'five' },
  ]);
  assert.deepEqual(entries.map((entry) => entry.path), ['src/app.ts']);
});

test('approved GitHub commits accept safe source and reject ignored or unsafe targets', () => {
  assert.equal(prepareApprovedCommit('src/auth.ts', 'export const auth = true;').normalizedPath, 'src/auth.ts');
  assert.throws(() => prepareApprovedCommit('../outside.ts', 'unsafe'), /Unsafe project path/);
  assert.throws(() => prepareApprovedCommit('node_modules/pkg/index.js', 'ignored'), /Only safe supported source files/);
});
