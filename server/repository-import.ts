import { buildProjectManifest, normalizeProjectPath, type ProjectFile } from './ingestion';
import { githubApi } from './github';

export const MAX_REPOSITORY_TREE_ENTRIES = 5_000;
export const MAX_SOURCE_FILE_COUNT = 100;
export const MAX_SOURCE_FILE_BYTES = 100_000;

type GithubTreeEntry = { path: string; type: 'blob' | 'tree' | 'commit'; sha: string; size?: number };
type GithubTree = { truncated?: boolean; tree: GithubTreeEntry[] };
type GithubBlob = { encoding?: string; content?: string; size?: number };

export type RepositoryImport = { files: ProjectFile[]; treeTruncated: boolean; skippedCount: number };

export function parseRepositoryFullName(fullName: string) {
  const match = /^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/.exec(fullName.trim());
  if (!match || match[1] === '.' || match[1] === '..' || match[2] === '.' || match[2] === '..') throw new Error('Repository name must use the owner/repository format.');
  return { owner: match[1], repository: match[2] };
}

export function selectSafeTreeEntries(entries: GithubTreeEntry[]) {
  const selected: GithubTreeEntry[] = [];
  for (const entry of entries.slice(0, MAX_REPOSITORY_TREE_ENTRIES)) {
    if (entry.type !== 'blob' || !entry.path || !entry.sha || (entry.size ?? 0) > MAX_SOURCE_FILE_BYTES) continue;
    try {
      if (!normalizeProjectPath(entry.path)) continue;
      selected.push(entry);
      if (selected.length === MAX_SOURCE_FILE_COUNT) break;
    } catch {
      continue;
    }
  }
  return selected;
}

function decodeGithubBlob(blob: GithubBlob) {
  if (blob.encoding !== 'base64' || !blob.content) return undefined;
  const content = Buffer.from(blob.content.replace(/\s/g, ''), 'base64').toString('utf8');
  return Buffer.byteLength(content, 'utf8') <= MAX_SOURCE_FILE_BYTES ? content : undefined;
}

export async function importGithubRepository(token: string, fullName: string, branch: string): Promise<RepositoryImport> {
  const { owner, repository } = parseRepositoryFullName(fullName);
  const ownerPath = encodeURIComponent(owner);
  const repositoryPath = encodeURIComponent(repository);
  const branchPath = encodeURIComponent(branch);
  const tree = await githubApi<GithubTree>(token, `/repos/${ownerPath}/${repositoryPath}/git/trees/${branchPath}?recursive=1`);
  const candidates = selectSafeTreeEntries(tree.tree);
  const rawFiles: Array<{ path: string; content: string; byteSize: number }> = [];

  for (const entry of candidates) {
    const blob = await githubApi<GithubBlob>(token, `/repos/${ownerPath}/${repositoryPath}/git/blobs/${entry.sha}`);
    const content = decodeGithubBlob(blob);
    if (content === undefined) continue;
    rawFiles.push({ path: entry.path, content, byteSize: Buffer.byteLength(content, 'utf8') });
  }

  const files = buildProjectManifest(rawFiles);
  if (!files.length) throw new Error('No supported text source files were found in this repository.');
  return { files, treeTruncated: Boolean(tree.truncated) || candidates.length < tree.tree.filter((entry) => entry.type === 'blob').length, skippedCount: Math.max(0, candidates.length - files.length) };
}
