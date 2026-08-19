'use client';

import { useEffect, useState } from 'react';
import { GitBranch, LogIn, LogOut, UserPlus } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type Repo = { id: number; name: string; fullName: string; private: boolean; defaultBranch: string; url: string; description: string | null };

export function AuthControls() {
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sessionEmail, setSessionEmail] = useState<string>();
  const [repos, setRepos] = useState<Repo[]>([]);
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

  async function signIn(mode: 'in' | 'up') {
    if (!configured) return setError('Add the public Supabase URL and publishable key to the web environment.');
    setLoading(true); setError(''); setNotice('');
    const supabase = createSupabaseBrowserClient();
    const result = mode === 'in' ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password });
    if (result.error) setError(result.error.message);
    else if (mode === 'up' && !result.data.session) setNotice('Account created. Check your email to confirm your account, then sign in.');
    else setSessionEmail(result.data.user?.email ?? undefined);
    setLoading(false);
  }

  async function logout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut(); setSessionEmail(undefined); setRepos([]);
  }

  async function connectGithub() { window.location.href = '/api/github/start'; }

  async function loadRepos() {
    setLoading(true); setError('');
    const response = await fetch('/api/github/repos');
    const payload = await response.json();
    if (!response.ok) setError(payload.error ?? 'Could not load repositories.'); else setRepos(payload.repositories ?? []);
    setLoading(false);
  }

  if (!sessionEmail) return <div className="auth-control"><button className="auth-trigger" onClick={() => setOpen(true)}><LogIn size={14} /> Sign in</button>{open && <div className="auth-popover"><b>Welcome to DevDesk</b><small>Sign in to save projects and connect GitHub.</small><input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" /><input placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" /><div className="auth-actions"><button onClick={() => signIn('in')} disabled={loading}><LogIn size={13} /> Sign in</button><button onClick={() => signIn('up')} disabled={loading}><UserPlus size={13} /> Sign up</button></div>{error && <p className="auth-error">{error}</p>}{notice && <p className="auth-notice">{notice}</p>}</div>}</div>;

  return <div className="auth-control signed-in"><span className="signed-email">{sessionEmail}</span><button className="auth-trigger" onClick={connectGithub}><GitBranch size={14} /> Connect GitHub</button><button className="auth-trigger" onClick={loadRepos} disabled={loading}>Repos</button><button className="auth-icon" onClick={logout} aria-label="Sign out"><LogOut size={14} /></button>{repos.length > 0 && <div className="repo-popover">{repos.map((repo) => <a href={repo.url} target="_blank" rel="noreferrer" key={repo.id}><GitBranch size={13} /><span><b>{repo.fullName}</b><small>{repo.private ? 'Private' : 'Public'} · {repo.defaultBranch}</small></span></a>)}</div>}{error && <p className="auth-error">{error}</p>}</div>;
}
