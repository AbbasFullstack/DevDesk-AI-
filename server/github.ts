import crypto from 'node:crypto';
import { env } from './env';

function encryptionKey() {
  const raw = process.env.TOKEN_ENCRYPTION_KEY ?? '';
  if (!/^[0-9a-fA-F]{64}$/.test(raw)) throw new Error('TOKEN_ENCRYPTION_KEY must be a 32-byte hex value.');
  return Buffer.from(raw, 'hex');
}

export function encryptToken(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`;
}

export function decryptToken(value: string) {
  const [ivValue, tagValue, encryptedValue] = value.split('.');
  if (!ivValue || !tagValue || !encryptedValue) throw new Error('Invalid encrypted token.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivValue, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(encryptedValue, 'base64url')), decipher.final()]).toString('utf8');
}

export async function exchangeGithubCode(code: string) {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) throw new Error('GitHub OAuth credentials are not configured on the server.');
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST', headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({ client_id: process.env.GITHUB_CLIENT_ID, client_secret: process.env.GITHUB_CLIENT_SECRET, code }),
  });
  const payload = await response.json() as { access_token?: string; error?: string; error_description?: string };
  if (!response.ok || !payload.access_token) throw new Error(payload.error_description ?? payload.error ?? 'GitHub token exchange failed.');
  return payload.access_token;
}

export async function githubApi<T>(token: string, path: string): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, { headers: { accept: 'application/vnd.github+json', authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28' }, cache: 'no-store' });
  if (!response.ok) throw new Error(`GitHub API request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

export function githubAuthorizeUrl(state: string) {
  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', process.env.GITHUB_CLIENT_ID ?? '');
  url.searchParams.set('redirect_uri', `${env.appUrl}/api/github/callback`);
  url.searchParams.set('scope', 'read:user repo');
  url.searchParams.set('state', state);
  return url.toString();
}
