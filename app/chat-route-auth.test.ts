import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('chat route requires an authenticated session before consuming AI-provider capacity', () => {
  const routeSource = readFileSync(new URL('./api/chat/route.ts', import.meta.url), 'utf8');
  const sessionGuard = routeSource.indexOf('await supabase.auth.getUser()');
  const providerCall = routeSource.indexOf('await askDevDesk(');

  assert.ok(sessionGuard >= 0, 'the chat route must retrieve the current session user');
  assert.ok(providerCall >= 0, 'the chat route must call the server-side AI adapter');
  assert.ok(sessionGuard < providerCall, 'authentication must occur before any AI-provider request');
  assert.match(routeSource, /if \(!user\) return NextResponse\.json\(\{ error: 'Authentication required\.' \}, \{ status: 401 \}\)/);
});
