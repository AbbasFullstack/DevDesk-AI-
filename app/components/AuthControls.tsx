'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, GitBranch, LogIn, LogOut, UserPlus } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export type GitHubRepo = { id: number; name: string; fullName: string; private: boolean; defaultBranch: string; url: string; description: string | null };
type GitHubState = 'checking' | 'connected' | 'disconnected';

export function AuthControls({ onRepositorySelected }: { onRepositorySelected?: (repo: GitHubRepo) => void }) {
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [sessionEmail, setSessionEmail] = useState<string>();
  const [repos, setRepos] = useState<GitHubRepo[]>([]); const [githubLogin, setGithubLogin] = useState(''); const [githubState, setGithubState] = useState<GitHubState>('disconnected');
  const [reposOpen, setReposOpen] = useState(false); const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [open, setOpen] = useState(false); const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!configured) return;
    const supabase = createSupabaseBrowserClient();
    void supabase.auth.getUser().then(({ data }) => setSessionEmail(data.user?.email ?? undefined));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSessionEmail(nextSession?.user?.email ?? undefined));
    return () => listener.subscription.unsubscribe();
  }, [configured]);

  async function requestRepos(openPanel: boolean) {
    const response = await fetch('/api/github/repos');
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? 'Could not load repositories.');
    setRepos(payload.repositories ?? []); setGithubState(payload.connected ? 'connected' : 'disconnected'); setGithubLogin(payload.login ?? '');
    if (openPanel) setReposOpen(true);
  }

  useEffect(() => {
    if (!sessionEmail) { setGithubState('disconnected'); setGithubLogin(''); setRepos([]); return; }
    let active = true; setGithubState('checking');
    void requestRepos(false).catch(() => { if (active) setGithubState('disconnected'); });
    return () => { active = false; };
  }, [sessionEmail]);

  async function signIn(mode: 'in' | 'up') {
    if (!configured) return setError('Add the public Supabase URL and publishable key to the web environment.');
    setLoading(true); setError(''); setNotice('');
    const supabase = createSupabaseBrowserClient();
    const result = mode === 'in' ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password });
    if (result.error) setError(result.error.message); else if (mode === 'up' && !result.data.session) setNotice('Account created. Check your email to confirm your account, then sign in.'); else { setSessionEmail(result.data.user?.email ?? undefined); setOpen(false); }
    setLoading(false);
  }

  async function logout() { const supabase = createSupabaseBrowserClient(); await supabase.auth.signOut(); setSessionEmail(undefined); setRepos([]); setGithubLogin(''); setReposOpen(false); }
  function connectGithub() { window.location.href = '/api/github/start'; }
  async function loadRepos() { setLoading(true); setError(''); try { await requestRepos(true); } catch (issue) { setError(issue instanceof Error ? issue.message : 'Could not load repositories.'); setGithubState('disconnected'); } finally { setLoading(false); } }
  function selectRepo(repo: GitHubRepo) { onRepositorySelected?.(repo); setReposOpen(false); }

  if (!sessionEmail) return <div className="auth-control"><button className="auth-trigger" onClick={() => setOpen(true)}><LogIn size={14} /> Sign in</button>{open && <div className="auth-popover"><b>Welcome to DevDesk</b><small>Sign in to save projects and connect GitHub.</small><input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" /><input placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" /><div className="auth-actions"><button onClick={() => signIn('in')} disabled={loading}><LogIn size={13} /> Sign in</button><button onClick={() => signIn('up')} disabled={loading}><UserPlus size={13} /> Sign up</button></div>{error && <p className="auth-error">{error}</p>}{notice && <p className="auth-notice">{notice}</p>}</div>}</div>;

  return <div className="auth-control signed-in"><span className="signed-email">{sessionEmail}</span>{githubState === 'connected' ? <button className="auth-trigger github-connected" onClick={() => setReposOpen((isOpen) => !isOpen)}><CheckCircle2 size={14} /> Connected</button> : <button className="auth-trigger" onClick={connectGithub} disabled={githubState === 'checking'}><GitBranch size={14} /> {githubState === 'checking' ? 'Checking…' : 'Connect GitHub'}</button>}<button className="auth-trigger repos-button" onClick={loadRepos} disabled={loading}>{loading ? 'Loading…' : 'Repos'}</button><button className="auth-icon" onClick={logout} aria-label="Sign out"><LogOut size={14} /></button>{reposOpen && <div className="repo-popover"><b className="repo-popover-title"><CheckCircle2 size={13} /> GitHub connected{githubLogin ? ` · ${githubLogin}` : ''}</b><small className="repo-picker-help">Choose one repository to load its real details into this workspace.</small>{repos.length ? repos.map((repo) => <button className="repo-choice" onClick={() => selectRepo(repo)} key={repo.id}><GitBranch size={13} /><span><b>{repo.fullName}</b><small>{repo.private ? 'Private' : 'Public'} · {repo.defaultBranch}</small></span></button>) : <p className="repo-empty">No repositories are available for this connection.</p>}</div>}{error && <p className="auth-error">{error}</p>}</div>;
}
