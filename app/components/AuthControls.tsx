'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, GitBranch, LogIn, LogOut, UserPlus } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type Repo = { id: number; name: string; fullName: string; private: boolean; defaultBranch: string; url: string; description: string | null };
type GitHubState = 'checking' | 'connected' | 'disconnected';

export function AuthControls() {
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sessionEmail, setSessionEmail] = useState<string>();
  const [repos, setRepos] = useState<Repo[]>([]);
  const [githubLogin, setGithubLogin] = useState('');
  const [githubState, setGithubState] = useState<GitHubState>('disconnected');
  const [reposOpen, setReposOpen] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!configured) return;
    const supabase = createSupabaseBrowserClient();
    void supabase.auth.getUser().then(({ data }) => setSessionEmail(data.user?.email ?? undefined));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSessionEmail(nextSession?.user?.email ?? undefined));
    return () => listener.subscription.unsubscribe();
  }, [configured]);

  useEffect(() => {
    if (!sessionEmail) {
      setGithubState('disconnected');
      setGithubLogin('');
      setRepos([]);
      return;
    }
    let active = true;
    async function checkConnection() {
      setGithubState('checking');
      try {
        const response = await fetch('/api/github/repos');
        const payload = await response.json();
        if (!active) return;
        if (response.ok && payload.connected) {
          setGithubState('connected');
          setGithubLogin(payload.login ?? 'GitHub');
          setRepos(payload.repositories ?? []);
        } else {
          setGithubState('disconnected');
        }
      } catch {
        if (active) setGithubState('disconnected');
      }
    }
    void checkConnection();
    return () => { active = false; };
  }, [sessionEmail]);

  async function signIn(mode: 'in' | 'up') {
    if (!configured) return setError('Add the public Supabase URL and publishable key to the web environment.');
    setLoading(true); setError(''); setNotice('');
    const supabase = createSupabaseBrowserClient();
    const result = mode === 'in' ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password });
    if (result.error) setError(result.error.message);
    else if (mode === 'up' && !result.data.session) setNotice('Account created. Check your email to confirm your account, then sign in.');
    else { setSessionEmail(result.data.user?.email ?? undefined); setOpen(false); }
    setLoading(false);
  }

  async function logout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setSessionEmail(undefined); setRepos([]); setGithubLogin(''); setReposOpen(false);
  }

  function connectGithub() { window.location.href = '/api/github/start'; }

  async function loadRepos() {
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/github/repos');
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? 'Could not load repositories.');
        setGithubState('disconnected');
      } else {
        setRepos(payload.repositories ?? []);
        setGithubState(payload.connected ? 'connected' : 'disconnected');
        setGithubLogin(payload.login ?? githubLogin);
        setReposOpen(true);
      }
    } catch {
      setError('Could not load repositories. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!sessionEmail) return <div className="auth-control"><button className="auth-trigger" onClick={() => setOpen(true)}><LogIn size={14} /> Sign in</button>{open && <div className="auth-popover"><b>Welcome to DevDesk</b><small>Sign in to save projects and connect GitHub.</small><input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" /><input placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" /><div className="auth-actions"><button onClick={() => signIn('in')} disabled={loading}><LogIn size={13} /> Sign in</button><button onClick={() => signIn('up')} disabled={loading}><UserPlus size={13} /> Sign up</button></div>{error && <p className="auth-error">{error}</p>}{notice && <p className="auth-notice">{notice}</p>}</div>}</div>;

  return <div className="auth-control signed-in"><span className="signed-email">{sessionEmail}</span>{githubState === 'connected' ? <button className="auth-trigger github-connected" onClick={() => setReposOpen((isOpen) => !isOpen)} title={githubLogin ? `Connected as ${githubLogin}` : 'GitHub connected'}><CheckCircle2 size={14} /> Connected</button> : <button className="auth-trigger" onClick={connectGithub} disabled={githubState === 'checking'}><GitBranch size={14} /> {githubState === 'checking' ? 'Checking…' : 'Connect GitHub'}</button>}<button className="auth-trigger repos-button" onClick={loadRepos} disabled={loading}>{loading ? 'Loading…' : 'Repos'}</button><button className="auth-icon" onClick={logout} aria-label="Sign out"><LogOut size={14} /></button>{reposOpen && <div className="repo-popover"><b className="repo-popover-title"><CheckCircle2 size={13} /> GitHub connected{githubLogin ? ` · ${githubLogin}` : ''}</b>{repos.length ? repos.map((repo) => <a href={repo.url} target="_blank" rel="noreferrer" key={repo.id}><GitBranch size={13} /><span><b>{repo.fullName}</b><small>{repo.private ? 'Private' : 'Public'} · {repo.defaultBranch}</small></span></a>) : <p className="repo-empty">No repositories available for this connection.</p>}</div>}{error && <p className="auth-error">{error}</p>}</div>;
}
