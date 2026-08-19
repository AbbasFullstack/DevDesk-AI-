import JSZip from 'jszip';
import { buildProjectManifest, type ProjectFile } from './ingestion';

export const MAX_ZIP_UPLOAD_BYTES = 5_000_000;
export const MAX_ZIP_ENTRIES = 1_000;
export const MAX_ZIP_FILE_BYTES = 100_000;

export type ZipImport = { files: ProjectFile[]; skippedCount: number };

export async function importZipProject(archive: Buffer): Promise<ZipImport> {
  if (!archive.length || archive.length > MAX_ZIP_UPLOAD_BYTES) throw new Error('ZIP upload must be between 1 byte and 5 MB.');
  let zip: JSZip;
  try { zip = await JSZip.loadAsync(archive, { createFolders: false, checkCRC32: true }); } catch { throw new Error('The uploaded file is not a valid ZIP archive.'); }
  const entries = Object.values(zip.files).filter((entry) => !entry.dir).slice(0, MAX_ZIP_ENTRIES);
  const rawFiles: Array<{ path: string; content: string; byteSize: number }> = [];
  for (const entry of entries) {
    const originalName = (entry as typeof entry & { unsafeOriginalName?: string }).unsafeOriginalName ?? entry.name;
    if (originalName.startsWith('/') || originalName.split(/[\\/]+/).some((segment) => segment === '..')) continue;
    let buffer: Buffer;
    try { buffer = await entry.async('nodebuffer'); } catch { continue; }
    if (buffer.length > MAX_ZIP_FILE_BYTES) continue;
    const content = buffer.toString('utf8');
    if (Buffer.from(content, 'utf8').length !== buffer.length) continue;
    rawFiles.push({ path: originalName, content, byteSize: buffer.length });
  }
  const files = buildProjectManifest(rawFiles);
  if (!files.length) throw new Error('No supported text source files were found in this ZIP archive.');
  return { files, skippedCount: Math.max(0, entries.length - files.length) };
}
