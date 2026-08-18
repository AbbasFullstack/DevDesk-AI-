import path from 'node:path';

const ignoredSegments = new Set(['node_modules', '.git', '.next', 'dist', 'build', 'coverage', 'target']);
const allowedExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.scss', '.html', '.md', '.sql', '.yml', '.yaml', '.env.example']);

export type IncomingFile = { path: string; content?: string; byteSize?: number };
export type ProjectFile = IncomingFile & { normalizedPath: string; language: string; excerpt: string };

export function normalizeProjectPath(value: string) {
  const normalized = path.posix.normalize(value.replaceAll('\\', '/')).replace(/^\.\//, '');
  if (!normalized || normalized.startsWith('../') || normalized.includes('/../') || normalized.startsWith('/')) throw new Error('Unsafe project path rejected.');
  const segments = normalized.split('/');
  if (segments.some((segment) => ignoredSegments.has(segment))) return undefined;
  return normalized;
}

function languageFor(filePath: string) {
  const extension = path.posix.extname(filePath).toLowerCase();
  return extension.replace('.', '') || 'text';
}

export function buildProjectManifest(files: IncomingFile[]) {
  const output: ProjectFile[] = [];
  let totalBytes = 0;
  for (const file of files) {
    const normalizedPath = normalizeProjectPath(file.path);
    if (!normalizedPath) continue;
    const extension = path.posix.extname(normalizedPath).toLowerCase();
    if (!allowedExtensions.has(extension) && !normalizedPath.endsWith('.env.example')) continue;
    const content = typeof file.content === 'string' ? file.content : '';
    const byteSize = Math.max(0, file.byteSize ?? Buffer.byteLength(content, 'utf8'));
    totalBytes += byteSize;
    if (totalBytes > 8_000_000) throw new Error('Project source exceeds the 8 MB analysis limit.');
    output.push({ normalizedPath, path: file.path, content, byteSize, language: languageFor(normalizedPath), excerpt: content.slice(0, 14_000) });
  }
  return output;
}
