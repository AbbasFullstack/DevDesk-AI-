'use client';

import { useEffect, useState } from 'react';
import { AuthControls, type GitHubRepo } from './components/AuthControls';
import { CheckCircle2, ChevronDown, Code2, FileArchive, FileCode2, GitBranch, History, ImagePlus, LayoutDashboard, LoaderCircle, Mic, Paperclip, Plus, Search, Send, Settings2, ShieldCheck, Sparkles, UploadCloud, WandSparkles, X } from 'lucide-react';

const nav = [{ label: 'Workspace', icon: LayoutDashboard }, { label: 'Projects', icon: FileCode2 }, { label: 'Analyses', icon: Sparkles }, { label: 'Connectors', icon: GitBranch }];
type Conversation = { id: string; prompt: string; response: string; updatedAt: number; repository?: string };
type ImportedProject = { id: string; name: string; branch: string | null; status: string; source: { fileCount: number; treeTruncated: boolean; skippedCount: number }; files: Array<{ path: string; language: string; byteSize: number }> };
type SourceAnalysis = { id: string; text: string; sourcePaths: string[]; createdAt: number };
const historyKey = 'devdesk-local-conversations-v1';
const selectedRepoKey = 'devdesk-selected-repository-v1';
const importedProjectKey = 'devdesk-imported-project-v1';

export default function Home() {
  const [active, setActive] = useState('Workspace');
  const [prompt, setPrompt] = useState('');
  const [thinking, setThinking] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [message, setMessage] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [chatError, setChatError] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo>();
  const [importedProject, setImportedProject] = useState<ImportedProject>();
  const [analysis, setAnalysis] = useState<SourceAnalysis>();

  useEffect(() => {
    try {
      const savedHistory = window.localStorage.getItem(historyKey);
      const savedRepository = window.localStorage.getItem(selectedRepoKey);
      const savedImport = window.localStorage.getItem(importedProjectKey);
      if (savedHistory) setConversations(JSON.parse(savedHistory) as Conversation[]);
      if (savedRepository) setSelectedRepo(JSON.parse(savedRepository) as GitHubRepo);
      if (savedImport) setImportedProject(JSON.parse(savedImport) as ImportedProject);
    } catch { setConversations([]); }
  }, []);

  function chooseRepo(repo: GitHubRepo) {
    setSelectedRepo(repo);
    window.localStorage.setItem(selectedRepoKey, JSON.stringify(repo));
    setImportedProject(undefined);
    window.localStorage.removeItem(importedProjectKey);
    setAnalysis(undefined);
    setMessage(''); setAiResponse(''); setChatError(''); setActiveConversationId(undefined); setHistoryOpen(false);
  }

  function saveConversation(nextPrompt: string, nextResponse: string) {
    const id = activeConversationId ?? crypto.randomUUID();
    const entry = { id, prompt: nextPrompt, response: nextResponse, updatedAt: Date.now(), repository: selectedRepo?.fullName };
    setActiveConversationId(id);
    setConversations((previous) => {
      const next = [entry, ...previous.filter((conversation) => conversation.id !== id)].slice(0, 8);
      window.localStorage.setItem(historyKey, JSON.stringify(next));
      return next;
    });
  }

  async function importSelectedRepository() {
    if (!selectedRepo || importing) return;
    setImporting(true); setChatError(''); setAnalysis(undefined);
    try {
      const response = await fetch('/api/github/import', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ fullName: selectedRepo.fullName, branch: selectedRepo.defaultBranch }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Repository import failed.');
      const nextImport: ImportedProject = { ...payload.project, source: payload.source, files: payload.files };
      setImportedProject(nextImport);
      window.localStorage.setItem(importedProjectKey, JSON.stringify(nextImport));
    } catch (issue) {
      setChatError(issue instanceof Error ? issue.message : 'Repository import failed.');
    } finally { setImporting(false); }
  }

  async function requestSourceAnalysis(question: string) {
    if (!importedProject) throw new Error('Import the repository source files before starting code analysis.');
    const response = await fetch('/api/analysis/preview', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ projectId: importedProject.id, question }) });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? 'The source analysis could not run.');
    const nextAnalysis = { id: payload.analysisId as string, text: payload.text as string, sourcePaths: payload.source.paths as string[], createdAt: Date.now() };
    setAnalysis(nextAnalysis);
    return payload.text as string;
  }

  async function runInitialAnalysis() {
    const question = 'Provide a production-readiness review of the imported repository. Identify architecture, security, maintainability, and test risks. Cite exact imported file paths as evidence.';
    setThinking(true); setChatError(''); setMessage('Run a production-readiness review of this imported repository.'); setAiResponse('');
    try { const text = await requestSourceAnalysis(question); setAiResponse(text); saveConversation(question, text); } catch (issue) { setChatError(issue instanceof Error ? issue.message : 'The source analysis could not run.'); } finally { setThinking(false); }
  }

  async function sendPrompt() {
    if (!prompt.trim() || thinking) return;
    const nextMessage = prompt.trim();
    setThinking(true); setChatError(''); setMessage(nextMessage); setAiResponse(''); setPrompt('');
    try {
      let text: string;
      if (importedProject) text = await requestSourceAnalysis(nextMessage);
      else {
        const response = await fetch('/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: nextMessage }] }) });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? 'The AI could not respond.');
        text = payload.text as string;
      }
      setAiResponse(text); saveConversation(nextMessage, text);
    } catch (issue) { setChatError(issue instanceof Error ? issue.message : 'The AI could not respond.'); } finally { setThinking(false); }
  }

  function startNewChat() { setMessage(''); setAiResponse(''); setChatError(''); setPrompt(''); setActiveConversationId(undefined); setHistoryOpen(false); window.setTimeout(() => document.getElementById('chat-composer')?.focus(), 0); }
  function openConversation(conversation: Conversation) { setActiveConversationId(conversation.id); setMessage(conversation.prompt); setAiResponse(conversation.response); setChatError(''); setHistoryOpen(false); }

  const workspaceTitle = selectedRepo ? selectedRepo.name : 'No project selected';
  const sourceReady = Boolean(importedProject && selectedRepo && importedProject.name === selectedRepo.fullName);

  return <main className="app-shell"><aside className="sidebar"><div className="brand"><div className="brand-mark"><Sparkles size={16} /></div><div><strong>DevDesk</strong><span>AI code intelligence</span></div></div><button className="new-project" onClick={() => setShowUpload(true)}><Plus size={16} /> Add project</button><nav className="side-nav">{nav.map(({ label, icon: Icon }) => <button key={label} className={active === label ? 'active' : ''} onClick={() => setActive(label)}><Icon size={16} /> {label}</button>)}</nav><div className="sidebar-bottom"><div className="secure-note"><ShieldCheck size={15} /><span>Private by design<br /><small>Server-side AI boundary</small></span></div><button className="profile"><span className="avatar">A</span><span><b>Abbas Hussain</b><small>Developer</small></span><Settings2 size={15} /></button></div></aside>
    <section className="workspace"><header className="topbar"><div className="mobile-brand"><Sparkles size={16} /> DEV DESK</div><div className="project-switcher"><span className={selectedRepo ? 'project-dot' : 'project-dot muted-dot'} /> {selectedRepo ? `${selectedRepo.name} / ${selectedRepo.defaultBranch}` : 'Choose a real project'} <ChevronDown size={14} /></div><div className="top-actions"><button aria-label="Search"><Search size={17} /></button><button aria-label="Settings"><Settings2 size={17} /></button><span className="online"><i /> AI online</span><AuthControls onRepositorySelected={chooseRepo} onOpenHistory={() => setHistoryOpen(true)} onOpenProjects={() => setShowUpload(true)} onNewChat={startNewChat} /></div></header>
      <div className="workspace-grid"><section className="chat-column"><div className="eyebrow">DEV DESK · {sourceReady ? 'SOURCE-BACKED ANALYSIS' : selectedRepo ? 'REPOSITORY IMPORT' : 'REAL WORKSPACE'}</div><h1>{sourceReady ? `Analyze ${selectedRepo?.name}.` : selectedRepo ? `Import ${selectedRepo.name}.` : 'Start with a real project.'}</h1><p className="lede">{sourceReady ? `${importedProject?.source.fileCount} safe source files are imported server-side. Every project answer is now grounded only in those excerpts.` : selectedRepo ? 'Import the selected repository to create a safe source manifest. DevDesk ignores dependency folders, unsafe paths, unsupported files, and oversized blobs.' : 'Choose a connected GitHub repository. No project code, score, file list, or analysis is shown until a real import succeeds.'}</p>
        <div className={selectedRepo ? 'real-project-card selected-project-card' : 'real-project-card'}>{selectedRepo ? <><span className="strip-icon"><GitBranch size={15} /></span><span><b>{selectedRepo.fullName}</b><small>{selectedRepo.private ? 'Private repository' : 'Public repository'} · {selectedRepo.defaultBranch}{sourceReady ? ` · ${importedProject?.source.fileCount} files imported` : ''}</small></span><a href={selectedRepo.url} target="_blank" rel="noreferrer">Open GitHub</a></> : <><span className="strip-icon"><Code2 size={15} /></span><span><b>No project loaded</b><small>Use Connected in the header to choose one of your real repositories.</small></span></>}</div>
        {selectedRepo && !sourceReady && <button className="import-source-button" onClick={importSelectedRepository} disabled={importing}>{importing ? <><LoaderCircle size={16} className="spin" /> Importing safe source files…</> : <><GitBranch size={16} /> Import real source files</>} </button>}
        {sourceReady && !analysis && <button className="import-source-button analyze-source-button" onClick={runInitialAnalysis} disabled={thinking}>{thinking ? <><LoaderCircle size={16} className="spin" /> Analyzing imported source…</> : <><Sparkles size={16} /> Run real code analysis</>}</button>}
        <div className="chat-thread">{!message && !thinking && !aiResponse ? <div className="empty-chat"><span className="empty-chat-icon">{sourceReady ? <CheckCircle2 size={18} /> : <Sparkles size={18} />}</span><div><b>{sourceReady ? 'Real source context is ready' : selectedRepo ? 'Ready to import this real repository' : 'Your workspace is empty'}</b><p>{sourceReady ? 'Run a first code analysis or ask your own question. DevDesk will cite imported file paths and cannot inspect files outside the source manifest.' : selectedRepo ? 'Tap Import real source files. This uses your encrypted GitHub connection server-side and stores only a safe limited manifest.' : 'Tap Connected in the top bar, then choose a real repository from your GitHub account.'}</p></div></div> : <><div className="message user-message"><span className="message-avatar user-avatar">A</span><div><small>YOU · JUST NOW</small><p>{message}</p></div></div>{(aiResponse || thinking || chatError) && <div className="message ai-message"><span className="message-avatar ai-avatar"><Sparkles size={14} /></span><div><small>{sourceReady ? 'DEV DESK · IMPORTED SOURCE ANALYSIS' : 'DEV DESK · AI RESPONSE'}</small>{aiResponse && <p>{aiResponse}</p>}{chatError && <p className="chat-error">{chatError}</p>}{analysis && <div className="analysis-evidence"><b>Source evidence</b><span>{analysis.sourcePaths.slice(0, 4).join(' · ')}{analysis.sourcePaths.length > 4 ? ` +${analysis.sourcePaths.length - 4} more files` : ''}</span></div>}</div></div>}</>}{thinking && <div className="thinking"><span><i /><i /><i /></span> DevDesk is analyzing the imported source…</div>}</div>
        <div className="composer-wrap"><div className="composer-tools"><button onClick={() => setShowUpload(true)}><Paperclip size={15} /> Add project</button><button disabled><Mic size={15} /> Voice soon</button><button className="send-button" onClick={sendPrompt} disabled={thinking} aria-label="Send message"><Send size={16} /></button></div><textarea id="chat-composer" value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void sendPrompt(); } }} placeholder={sourceReady ? `Ask about imported ${selectedRepo?.name} source…` : 'Ask DevDesk a development question…'} rows={2} /><div className="composer-footer"><span><WandSparkles size={13} /> {sourceReady ? 'Replies use imported source excerpts only' : 'Source context is used only after real import'}</span><small>Enter to send · Shift + Enter for a new line</small></div></div></section>
        <aside className="inspector"><div className="inspector-head"><div><span className="eyebrow">PROJECT STATUS</span><h2>{workspaceTitle}</h2></div></div><div className="truth-card"><span className={sourceReady ? 'truth-icon active-truth-icon' : 'truth-icon'}>{sourceReady ? <CheckCircle2 size={18} /> : <GitBranch size={18} />}</span><div><b>{sourceReady ? 'Real source imported' : 'No fabricated project data'}</b><p>{sourceReady ? `${importedProject?.source.fileCount} safe supported files were imported from the selected branch. ${importedProject?.source.treeTruncated ? 'The repository tree was bounded for safety.' : 'The source manifest is ready for analysis.'}` : 'Project details, findings, file lists, and previews appear only after their real workflow completes.'}</p></div></div><div className="inspector-section"><div className="section-title"><span>Analysis</span><small>{analysis ? 'Complete' : sourceReady ? 'Ready to run' : 'Not started'}</small></div><div className="empty-inspector-row"><Sparkles size={15} /><span>{analysis ? 'A real imported-source analysis is visible in the chat with file-path evidence.' : sourceReady ? 'Run code analysis to generate source-backed findings.' : 'Import a repository before starting code analysis.'}</span></div></div><div className="inspector-section"><div className="section-title"><span>Imported files</span><small>{sourceReady ? `${importedProject?.source.fileCount} safe files` : 'Not imported'}</small></div>{sourceReady ? importedProject?.files.slice(0, 5).map((file) => <div className="file-row" key={file.path}><FileCode2 size={15} /><span>{file.path}</span><small>{file.language}</small></div>) : <div className="empty-inspector-row"><FileArchive size={15} /><span>Files will be listed only after a real source import completes.</span></div>}</div><div className="preview-card"><div className="section-title"><span>Code preview</span><small>Coming after source selection</small></div><div className="preview-paused"><Code2 size={14} /> {sourceReady ? 'Choose an imported source file next' : 'No source file selected'}</div></div></aside></div></section>
    {historyOpen && <div className="history-drawer-backdrop" onClick={() => setHistoryOpen(false)}><section className="history-drawer" onClick={(event) => event.stopPropagation()}><div className="history-drawer-head"><div><span className="eyebrow">CHAT HISTORY</span><h2>Your recent chats</h2><small>Saved privately on this device</small></div><button onClick={() => setHistoryOpen(false)} aria-label="Close chat history"><X size={18} /></button></div><button className="drawer-new-chat" onClick={startNewChat}><Plus size={15} /> New chat</button><div className="drawer-history-list">{conversations.length ? conversations.map((conversation) => <button className={conversation.id === activeConversationId ? 'history-item active-history-item' : 'history-item'} key={conversation.id} onClick={() => openConversation(conversation)}><b>{conversation.prompt}</b><small>{conversation.repository ?? 'General chat'} · {new Date(conversation.updatedAt).toLocaleString()}</small></button>) : <p className="history-empty">No saved chats yet. Use New chat to begin.</p>}</div></section></div>}{showUpload && <div className="modal-backdrop" onClick={() => setShowUpload(false)}><div className="upload-modal" onClick={(event) => event.stopPropagation()}><button className="close-modal" onClick={() => setShowUpload(false)}><X size={17} /></button><span className="eyebrow">REAL PROJECT WORKSPACE</span><h2>Add your codebase.</h2><p>Choose one of your real GitHub repositories from the green Connected button. After selection, use the Import real source files action. It reads the repository server-side through your encrypted OAuth token and ignores unsafe or unsupported source entries.</p><div className="upload-grid"><button onClick={() => setShowUpload(false)}><GitBranch size={21} /><b>Choose GitHub repo</b><small>Close this panel, then tap Connected in the header</small></button><button disabled><UploadCloud size={21} /><b>Upload project</b><small>GitHub import is available first</small></button><button disabled><ImagePlus size={21} /><b>Attach files</b><small>GitHub import is available first</small></button></div></div></div>}</main>;
}
