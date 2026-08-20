'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, FolderGit2, GitBranch, History, KeyRound, LogIn, LogOut, Menu, Plus, Settings2, UserPlus, X } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export type GitHubRepo = { id: number; name: string; fullName: string; private: boolean; defaultBranch: string; url: string; description: string | null };
type GitHubState = 'checking' | 'connected' | 'disconnected';
type AuthControlsProps = { onRepositorySelected?: (repo: GitHubRepo) => void; onOpenHistory?: () => void; onOpenProjects?: () => void; onNewChat?: () => void; onAuthUserChange?: (userId?: string) => void };

export function AuthControls({ onRepositorySelected, onOpenHistory, onOpenProjects, onNewChat, onAuthUserChange }: AuthControlsProps) {
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [sessionEmail, setSessionEmail] = useState<string>(); const [sessionUserId, setSessionUserId] = useState<string>();
  const [repos, setRepos] = useState<GitHubRepo[]>([]); const [githubLogin, setGithubLogin] = useState(''); const [githubState, setGithubState] = useState<GitHubState>('disconnected');
  const [reposOpen, setReposOpen] = useState(false); const [menuOpen, setMenuOpen] = useState(false); const [settingsOpen, setSettingsOpen] = useState(false);
  const [newPassword, setNewPassword] = useState(''); const [confirmPassword, setConfirmPassword] = useState(''); const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [open, setOpen] = useState(false); const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!configured) return;
    const supabase = createSupabaseBrowserClient();
    void supabase.auth.getUser().then(({ data }) => { setSessionEmail(data.user?.email ?? undefined); setSessionUserId(data.user?.id); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => { setSessionEmail(nextSession?.user?.email ?? undefined); setSessionUserId(nextSession?.user?.id); });
    return () => listener.subscription.unsubscribe();
  }, [configured]);

  useEffect(() => { onAuthUserChange?.(sessionUserId); }, [onAuthUserChange, sessionUserId]);

  async function requestRepos(openPanel: boolean) {
    const response = await fetch('/api/github/repos'); const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? 'Could not load repositories.');
    setRepos(payload.repositories ?? []); setGithubState(payload.connected ? 'connected' : 'disconnected'); setGithubLogin(payload.login ?? '');
    if (openPanel) setReposOpen(true);
  }

  useEffect(() => {
    if (!sessionEmail) { setGithubState('disconnected'); setGithubLogin(''); setRepos([]); return; }
    let active = true; setGithubState('checking'); void requestRepos(false).catch(() => { if (active) setGithubState('disconnected'); });
    return () => { active = false; };
  }, [sessionEmail]);

  async function signIn(mode: 'in' | 'up') {
    if (!configured) return setError('Add the public Supabase URL and publishable key to the web environment.');
    setLoading(true); setError(''); setNotice('');
    const supabase = createSupabaseBrowserClient(); const result = mode === 'in' ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password });
    if (result.error) setError(result.error.message); else if (mode === 'up' && !result.data.session) setNotice('Account created. Check your email to confirm your account, then sign in.'); else { setSessionEmail(result.data.user?.email ?? undefined); setSessionUserId(result.data.user?.id); setOpen(false); }
    setLoading(false);
  }

  async function logout(openSignIn = false) { const supabase = createSupabaseBrowserClient(); await supabase.auth.signOut(); setSessionEmail(undefined); setSessionUserId(undefined); setRepos([]); setGithubLogin(''); setReposOpen(false); setMenuOpen(false); setSettingsOpen(false); setOpen(openSignIn); }
  async function changePassword() { if (newPassword.length < 8) return setError('Password must contain at least 8 characters.'); if (newPassword !== confirmPassword) return setError('Passwords do not match.'); setLoading(true); setError(''); setNotice(''); const { error: updateError } = await createSupabaseBrowserClient().auth.updateUser({ password: newPassword }); if (updateError) setError(updateError.message); else { setNotice('Password changed successfully.'); setNewPassword(''); setConfirmPassword(''); } setLoading(false); }
  function connectGithub() { window.location.href = '/api/github/start'; }
  async function loadRepos() { setLoading(true); setError(''); try { await requestRepos(true); } catch (issue) { setError(issue instanceof Error ? issue.message : 'Could not load repositories.'); setGithubState('disconnected'); } finally { setLoading(false); } }
  function selectRepo(repo: GitHubRepo) { onRepositorySelected?.(repo); setReposOpen(false); }
  function openHistory() { setMenuOpen(false); onOpenHistory?.(); }
  function openProjects() { setMenuOpen(false); onOpenProjects?.(); }
  function newConversation() { setMenuOpen(false); onNewChat?.(); }
  function openSettings() { setMenuOpen(false); setError(''); setNotice(''); setSettingsOpen(true); }

  if (!sessionEmail) return <div className="auth-control"><button className="auth-trigger" onClick={() => setOpen(true)}><LogIn size={14} /> Sign in</button>{open && <div className="auth-popover"><b>Welcome to DevDesk</b><small>Sign in to save projects and connect GitHub.</small><input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" /><input placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" /><div className="auth-actions"><button onClick={() => signIn('in')} disabled={loading}><LogIn size={13} /> Sign in</button><button onClick={() => signIn('up')} disabled={loading}><UserPlus size={13} /> Sign up</button></div>{error && <p className="auth-error">{error}</p>}{notice && <p className="auth-notice">{notice}</p>}</div>}</div>;

  return <div className="auth-control signed-in"><span className="signed-email">{sessionEmail}</span>{githubState === 'connected' ? <button className="auth-trigger github-connected" onClick={() => setReposOpen((isOpen) => !isOpen)}><CheckCircle2 size={14} /> Connected</button> : <button className="auth-trigger" onClick={connectGithub} disabled={githubState === 'checking'}><GitBranch size={14} /> {githubState === 'checking' ? 'Checking…' : 'Connect GitHub'}</button>}<button className="auth-trigger repos-button" onClick={loadRepos} disabled={loading}>{loading ? 'Loading…' : 'Repos'}</button><button className="account-menu-trigger" onClick={() => setMenuOpen((isOpen) => !isOpen)} aria-label="Open account menu" aria-expanded={menuOpen}><Menu size={19} /></button>{reposOpen && <div className="repo-popover"><b className="repo-popover-title"><CheckCircle2 size={13} /> GitHub connected{githubLogin ? ` · ${githubLogin}` : ''}</b><small className="repo-picker-help">Choose one repository to load its real details into this workspace.</small>{repos.length ? repos.map((repo) => <button className="repo-choice" onClick={() => selectRepo(repo)} key={repo.id}><GitBranch size={13} /><span><b>{repo.fullName}</b><small>{repo.private ? 'Private' : 'Public'} · {repo.defaultBranch}</small></span></button>) : <p className="repo-empty">No repositories are available for this connection.</p>}</div>}{menuOpen && <div className="account-menu"><div className="account-menu-identity"><span>{sessionEmail.slice(0, 1).toUpperCase()}</span><div><b>Signed in</b><small>{sessionEmail}</small></div></div><button className="account-primary-action" onClick={newConversation}><Plus size={15} /><span>New chat</span></button><button onClick={openHistory}><History size={15} /><span>Chat history</span></button><button onClick={openProjects}><FolderGit2 size={15} /><span>Projects</span></button><button onClick={openSettings}><Settings2 size={15} /><span>Account settings</span></button><div className="account-menu-divider" /><button onClick={() => void logout(true)}><LogIn size={15} /><span>Switch account</span></button><button className="logout-menu-action" onClick={() => void logout()}><LogOut size={15} /><span>Log out</span></button></div>}{settingsOpen && <div className="account-settings-backdrop" onClick={() => setSettingsOpen(false)}><section className="account-settings-sheet" onClick={(event) => event.stopPropagation()}><button className="close-account-settings" onClick={() => setSettingsOpen(false)} aria-label="Close account settings"><X size={18} /></button><span className="eyebrow">ACCOUNT SETTINGS</span><h2>Your DevDesk account</h2><p className="account-email">{sessionEmail}</p><div className="account-settings-section"><b><KeyRound size={15} /> Change password</b><small>Use at least 8 characters. Your new password is sent directly to Supabase over the authenticated session.</small><input placeholder="New password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} type="password" /><input placeholder="Confirm new password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type="password" /><button className="save-password-button" onClick={() => void changePassword()} disabled={loading}>{loading ? 'Saving…' : 'Save new password'}</button></div><div className="account-settings-actions"><button onClick={() => void logout(true)}><LogIn size={15} /> Switch account</button><button className="logout-menu-action" onClick={() => void logout()}><LogOut size={15} /> Log out</button></div>{error && <p className="auth-error">{error}</p>}{notice && <p className="auth-notice">{notice}</p>}</section></div>}{error && !settingsOpen && <p className="auth-error">{error}</p>}</div>;
}
