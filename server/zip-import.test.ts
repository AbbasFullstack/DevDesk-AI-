import assert from 'node:assert/strict';
import test from 'node:test';
import JSZip from 'jszip';
import { importZipProject, MAX_ZIP_UPLOAD_BYTES } from './zip-import';

test('ZIP import keeps safe supported source files and ignores traversal and generated paths', async () => {
  const zip = new JSZip();
  zip.file('src/app.ts', 'export const ready = true;');
  zip.file('node_modules/pkg/index.js', 'ignored');
  zip.file('../outside.ts', 'ignored');
  zip.file('notes.txt', 'ignored');
  const imported = await importZipProject(await zip.generateAsync({ type: 'nodebuffer' }));
  assert.deepEqual(imported.files.map((file) => file.normalizedPath), ['src/app.ts']);
  assert.equal(imported.skippedCount, 3);
});

test('ZIP import rejects uploads above the bounded archive limit', async () => {
  await assert.rejects(() => importZipProject(Buffer.alloc(MAX_ZIP_UPLOAD_BYTES + 1)), /5 MB/);
});
